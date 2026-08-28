import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  MAX_MATCH_HISTORY,
  StoryError,
  acceptStoryMatchResult,
  createDurableCheckpoint,
  createStoryState,
  normalizeStoryMatchResult,
  reduceStory,
  restoreStoryCheckpoint,
  storyDigest,
  validateStoryPack,
} from '../src/story/index.mjs';

const fixtureDirectory = fileURLToPath(new URL('../content/story-v1/fixtures/runtime-proof/', import.meta.url));
const readJson = (name) => JSON.parse(readFileSync(`${fixtureDirectory}/${name}`, 'utf8'));
const freshPack = () => ({
  manifest: readJson('manifest.json'),
  registry: readJson('registry.json'),
  texts: { en: readJson('text.en.json') },
  scripts: [readJson('chapter-a.json'), readJson('chapter-b.json')],
});
const clone = (value) => JSON.parse(JSON.stringify(value));

function engineSummary(overrides = {}) {
  return {
    summary_version: 'solo-result-summary-v2',
    result_id: 'result.fixture.001',
    match_id: 'match.fixture.001',
    valid: true,
    reason_codes: ['QUEUE_EMPTY'],
    service_points_gained: 3,
    tickets_closed: 1,
    tickets_given_up: 0,
    tests_run: 2,
    isolations_accepted: 1,
    repairs_performed: 1,
    verify_passes: 1,
    documentation_actions: 1,
    ...overrides,
  };
}

function driveToMatch(pack, optionId = 'inspect') {
  const initial = createStoryState(pack);
  let transition = reduceStory(initial, { type: 'BEGIN' }, pack);
  const effects = [...transition.effects];
  let steps = 0;
  while (transition.state.status === 'ACTIVE') {
    assert.ok(steps < 32, 'proof story must settle to its Match boundary');
    const intent = transition.state.current_statement.type === 'choice'
      ? { type: 'CHOOSE', option_id: optionId }
      : { type: 'ADVANCE' };
    transition = reduceStory(transition.state, intent, pack);
    effects.push(...transition.effects);
    steps += 1;
  }
  return { initial, transition, effects, steps };
}

function finishStory(pack, optionId = 'inspect', result = engineSummary()) {
  const atMatch = driveToMatch(pack, optionId).transition;
  let transition = reduceStory(atMatch.state, { type: 'ACCEPT_MATCH_RESULT', result }, pack);
  let steps = 0;
  while (transition.state.status === 'ACTIVE') {
    assert.ok(steps < 16, 'proof story must terminate after its Match return');
    transition = reduceStory(transition.state, { type: 'ADVANCE' }, pack);
    steps += 1;
  }
  return transition;
}

test('fixture validates and projects only the current authorized display state', () => {
  const pack = freshPack();
  assert.deepEqual(validateStoryPack(pack), []);

  const initial = createStoryState(pack);
  const initialSnapshot = clone(initial);
  let transition = reduceStory(initial, { type: 'BEGIN' }, pack);
  assert.deepEqual(initial, initialSnapshot, 'the reducer must not mutate its input');
  assert.equal(transition.state.current_statement.statement_id, 'statement.fixture.intro');
  assert.equal(transition.display.background.scene_id, 'fixture.scene.lab');
  assert.equal(transition.display.background.location_text, 'Training Lab');
  assert.equal(transition.display.characters[0].asset_id, 'asset.fixture.eva.neutral');
  assert.equal(transition.display.screens.transcript.length, 1);
  assert.ok(transition.effects.some((effect) => effect.type === 'PERSIST_CHECKPOINT'));

  transition = reduceStory(transition.state, { type: 'ADVANCE' }, pack);
  assert.equal(transition.display.screens.choices.choice_id, 'fixture.choice.opening');
  const publicChoice = JSON.stringify(transition.display);
  assert.doesNotMatch(publicChoice, /jump_label|writes|fixture\.cut\.skip/);

  transition = reduceStory(transition.state, { type: 'CHOOSE', option_id: 'inspect' }, pack);
  assert.equal(transition.display.screens.dialogue.text_id, 'fixture.cut.inspect');
  assert.equal(transition.display.background.asset_id, 'asset.fixture.background.lab', 'background persists');
  assert.equal(transition.display.characters.length, 1, 'stable tag replaces rather than appends');
  assert.equal(transition.display.characters[0].asset_id, 'asset.fixture.eva.active');
  assert.equal(transition.state.variables['fixture.reviewed'], true);
  assert.deepEqual(transition.state.branch_history.at(-1), {
    sequence: 3,
    choice_id: 'fixture.choice.opening',
    option_id: 'inspect',
  });
});

test('cross-file nested calls return in order and Match launch is typed', () => {
  const pack = freshPack();
  const { transition, effects } = driveToMatch(pack, 'inspect');
  assert.equal(transition.state.status, 'AWAITING_MATCH');
  assert.equal(transition.state.location.script_id, 'script.fixture.chapter-b');
  assert.equal(transition.state.call_stack.length, 0);
  assert.deepEqual(
    transition.display.screens.transcript.slice(-3).map((entry) => entry.statement_id),
    ['statement.fixture.library.outer', 'statement.fixture.library.inner', 'statement.fixture.library.return'],
  );
  assert.deepEqual(transition.state.pending_match, {
    schema_version: 'story-match-context-v1',
    match_ref: 'match.fixture.diagnosis',
    return_label: 'fixture.after-match',
    pre_match_checkpoint_id: 'checkpoint.fixture.pre-match',
    post_match_checkpoint_id: 'checkpoint.fixture.post-match',
  });
  const launch = effects.find((effect) => effect.type === 'START_MATCH');
  assert.deepEqual(launch.context, {
    schema_version: 'story-match-context-v1',
    match_ref: 'match.fixture.diagnosis',
    checkpoint_id: 'checkpoint.fixture.pre-match',
  });

  const preMatch = effects
    .filter((effect) => effect.type === 'PERSIST_CHECKPOINT')
    .find((effect) => effect.checkpoint.checkpoint_id === 'checkpoint.fixture.pre-match').checkpoint;
  const interrupted = restoreStoryCheckpoint(preMatch, pack);
  assert.equal(interrupted.status, 'AWAITING_MATCH');
  assert.equal(interrupted.display.screens.transcript.length, 0, 'active engine or render state is not restored');
  const returned = reduceStory(interrupted, { type: 'ACCEPT_MATCH_RESULT', result: engineSummary() }, pack);
  const postMatch = returned.effects.find((effect) => effect.type === 'PERSIST_CHECKPOINT').checkpoint;
  assert.equal(postMatch.checkpoint_id, 'checkpoint.fixture.post-match');
  const postReload = restoreStoryCheckpoint(postMatch, pack);
  assert.equal(postReload.status, 'READY');
  assert.equal(postReload.match_results.length, 1);
  assert.equal(reduceStory(postReload, { type: 'BEGIN' }, pack).display.screens.dialogue.text_id, 'fixture.match.complete');
});

test('declared library entries complete as detached calls without underflow', () => {
  const pack = freshPack();
  let transition = reduceStory(
    createStoryState(pack, { entryLabel: 'fixture.library.outer' }),
    { type: 'BEGIN' },
    pack,
  );
  assert.equal(transition.state.current_statement.statement_id, 'statement.fixture.library.outer');
  transition = reduceStory(transition.state, { type: 'ADVANCE' }, pack);
  assert.equal(transition.state.current_statement.statement_id, 'statement.fixture.library.inner');
  transition = reduceStory(transition.state, { type: 'ADVANCE' }, pack);
  assert.equal(transition.state.current_statement.statement_id, 'statement.fixture.library.return');
  transition = reduceStory(transition.state, { type: 'ADVANCE' }, pack);
  assert.equal(transition.state.status, 'COMPLETE');
  assert.equal(transition.state.call_stack.length, 0);
  assert.equal(Object.hasOwn(transition.state, 'ending_id'), false);
});

test('checkpoint restore rejects re-digested results for unregistered Matches without mutation', () => {
  const pack = freshPack();
  const atMatch = driveToMatch(pack).transition.state;
  const returned = reduceStory(atMatch, { type: 'ACCEPT_MATCH_RESULT', result: engineSummary() }, pack);
  const checkpoint = returned.effects.find((effect) =>
    effect.type === 'PERSIST_CHECKPOINT'
      && effect.checkpoint.checkpoint_id === 'checkpoint.fixture.post-match').checkpoint;
  const tampered = clone(checkpoint);
  tampered.match_results[0].match_ref = 'match.fixture.unregistered';
  tampered.returned_match.match_ref = 'match.fixture.unregistered';
  const { digest: ignoredDigest, ...body } = tampered;
  tampered.digest = storyDigest(body);
  const before = clone(tampered);

  assert.throws(
    () => restoreStoryCheckpoint(tampered, pack),
    (error) => error instanceof StoryError && error.code === 'CHECKPOINT_MATCH_RESULTS',
  );
  assert.deepEqual(tampered, before);
});

test('checkpoint restore rejects re-digested pending Match tuples that were never authored', () => {
  const pack = freshPack();
  const preMatch = driveToMatch(pack).effects
    .filter((effect) => effect.type === 'PERSIST_CHECKPOINT')
    .find((effect) => effect.checkpoint.checkpoint_id === 'checkpoint.fixture.pre-match').checkpoint;
  const tampered = clone(preMatch);
  tampered.pending_match.return_label = 'fixture.entry';
  const { digest: ignoredDigest, ...body } = tampered;
  tampered.digest = storyDigest(body);
  const before = clone(tampered);

  assert.throws(
    () => restoreStoryCheckpoint(tampered, pack),
    (error) => error instanceof StoryError && error.code === 'CHECKPOINT_PENDING_MATCH',
  );
  assert.deepEqual(tampered, before);
});

test('durable checkpoints omit ephemeral runtime data and restart their authored segment', () => {
  const pack = freshPack();
  const begin = reduceStory(createStoryState(pack), { type: 'BEGIN' }, pack);
  const start = begin.effects.find((effect) => effect.type === 'PERSIST_CHECKPOINT').checkpoint;
  assert.equal(Object.hasOwn(start, 'location'), false);
  assert.equal(Object.hasOwn(start, 'display'), false);
  assert.equal(Object.hasOwn(start, 'call_stack'), false);
  assert.equal(start.digest, storyDigest(Object.fromEntries(Object.entries(start).filter(([key]) => key !== 'digest'))));

  let changed = reduceStory(begin.state, { type: 'ADVANCE' }, pack);
  changed = reduceStory(changed.state, { type: 'CHOOSE', option_id: 'inspect' }, pack);
  assert.equal(changed.state.variables['fixture.reviewed'], true);

  const restored = restoreStoryCheckpoint(start, pack);
  assert.equal(restored.status, 'READY');
  assert.equal(restored.variables['fixture.reviewed'], false);
  const replayed = reduceStory(restored, { type: 'BEGIN' }, pack);
  assert.equal(replayed.display.screens.dialogue.statement_id, 'statement.fixture.intro');

  const tampered = clone(start);
  tampered.variables['fixture.reviewed'] = true;
  assert.throws(() => restoreStoryCheckpoint(tampered, pack), (error) => error instanceof StoryError && error.code === 'CHECKPOINT_DIGEST');
  assert.throws(() => createDurableCheckpoint(begin.state, 'checkpoint.unknown', pack), (error) => error.code === 'UNKNOWN_CHECKPOINT');
});

test('Match normalization accepts only the typed boundary and result acceptance is immutable', () => {
  const pack = freshPack();
  const pending = driveToMatch(pack).transition.state;
  const normalized = normalizeStoryMatchResult(engineSummary(), { expectedMatchRef: 'match.fixture.diagnosis' });
  assert.deepEqual(normalized, {
    schema_version: 'story-match-result-v1',
    result_id: 'result.fixture.001',
    match_id: 'match.fixture.001',
    match_ref: 'match.fixture.diagnosis',
    completion: 'COMPLETED',
    valid: true,
    reason_codes: ['QUEUE_EMPTY'],
    story_service_points_gained: 3,
    tickets_closed: 1,
    tickets_given_up: 0,
    documented_outcome: true,
    verified_outcome: true,
    contributions: {
      tests_run: 2,
      isolations_accepted: 1,
      repairs_performed: 1,
      verify_passes: 1,
      documentation_actions: 1,
    },
  });
  const before = clone(pending);
  const accepted = acceptStoryMatchResult(pending, normalized);
  assert.deepEqual(pending, before);
  assert.equal(accepted.story_service_points, 3);
  assert.equal(accepted.match_results.length, 1);
  assert.equal(accepted.status, 'ACTIVE');
  assert.throws(() => acceptStoryMatchResult(accepted, normalized), (error) => error.code === 'NO_PENDING_MATCH');
  assert.throws(
    () => normalizeStoryMatchResult({ ...normalized, future_field: true }),
    (error) => error.code === 'INVALID_MATCH_RESULT',
  );
});

test('Match acceptance rejects a full bounded history without partial mutation', () => {
  const pending = driveToMatch(freshPack()).transition.state;
  const normalized = normalizeStoryMatchResult(engineSummary(), { expectedMatchRef: 'match.fixture.diagnosis' });
  pending.match_results = Array.from({ length: MAX_MATCH_HISTORY }, (_, index) => ({
    ...normalized,
    result_id: `result.fixture.limit.${index}`,
    match_id: `match.fixture.limit.${index}`,
  }));
  pending.story_service_points = normalized.story_service_points_gained * MAX_MATCH_HISTORY;
  const before = clone(pending);

  assert.throws(
    () => acceptStoryMatchResult(pending, {
      ...normalized,
      result_id: 'result.fixture.limit.next',
      match_id: 'match.fixture.limit.next',
    }),
    (error) => error instanceof StoryError && error.code === 'MATCH_HISTORY_LIMIT',
  );
  assert.deepEqual(pending, before);
});

test('replay digests are deterministic and branch-sensitive', () => {
  const pack = freshPack();
  const first = finishStory(pack, 'inspect');
  const second = finishStory(freshPack(), 'inspect');
  const alternate = finishStory(freshPack(), 'skip');
  assert.equal(first.state.status, 'COMPLETE');
  assert.equal(first.state.ending_id, 'ending.fixture.success');
  assert.equal(first.digest, second.digest);
  assert.notEqual(first.digest, alternate.digest);
  assert.equal(first.state.story_service_points, 3);
  assert.equal(first.state.match_results[0].completion, 'COMPLETED');
});

test('static validation reports broken references, text, choices, cycles, stack errors, and unreachable labels', () => {
  const mutations = [
    {
      code: 'DUPLICATE_LABEL',
      mutate(pack) { pack.scripts[1].statements[0].label_id = 'fixture.entry'; },
    },
    {
      code: 'MISSING_ASSET',
      mutate(pack) { pack.scripts[0].statements[1].background_asset_id = 'asset.missing'; },
    },
    {
      code: 'MISSING_LABEL',
      mutate(pack) { pack.scripts[0].statements[8].label_id = 'fixture.missing'; },
    },
    {
      code: 'UNTRANSLATED_TEXT',
      mutate(pack) { delete pack.texts.en.entries['fixture.intro']; },
    },
    {
      code: 'MALFORMED_CHOICE',
      mutate(pack) { pack.scripts[0].statements[4].options.pop(); },
    },
    {
      code: 'INVALID_CONDITION_OPERAND',
      mutate(pack) { pack.scripts[1].statements[6].condition.value = 3; },
    },
    {
      code: 'UNDECLARED_CYCLE',
      mutate(pack) { pack.scripts[0].statements[8].label_id = 'fixture.cut.inspect'; },
    },
    {
      code: 'RETURN_UNDERFLOW',
      mutate(pack) { pack.scripts[0].statements[1] = { type: 'return' }; },
    },
    {
      code: 'CALL_DEPTH',
      mutate(pack) { pack.scripts[1].statements[1].label_id = 'fixture.cross.file'; },
    },
    {
      code: 'UNREACHABLE_LABEL',
      mutate(pack) {
        pack.scripts[1].statements.push(
          { type: 'label', label_id: 'fixture.unreachable' },
          { type: 'end', ending_id: 'ending.fixture.unreachable', checkpoint_id: 'checkpoint.fixture.end.unreachable' },
        );
      },
    },
  ];
  for (const scenario of mutations) {
    const pack = freshPack();
    scenario.mutate(pack);
    const issues = validateStoryPack(pack);
    assert.ok(issues.some((issue) => issue.code === scenario.code), `${scenario.code}: ${JSON.stringify(issues)}`);
  }
});

test('static reachability follows actual call returns and rejects dead caller continuations', () => {
  const pack = freshPack();
  pack.scripts[1].statements[23] = {
    type: 'end',
    ending_id: 'ending.fixture.library-stop',
    checkpoint_id: 'checkpoint.fixture.library-stop',
  };
  const issues = validateStoryPack(pack);
  assert.ok(
    issues.some((issue) => issue.code === 'UNREACHABLE_LABEL' && issue.path === 'labels.fixture.launch'),
    JSON.stringify(issues),
  );
});

test('static validation treats every durable checkpoint as a detached restart root', () => {
  const pack = freshPack();
  pack.scripts[1].statements[20] = {
    type: 'checkpoint',
    checkpoint_id: 'checkpoint.fixture.library-restart',
    resume_label: 'fixture.library.inner',
  };
  const issues = validateStoryPack(pack);
  assert.ok(
    issues.some((issue) => issue.code === 'RETURN_UNDERFLOW'),
    JSON.stringify(issues),
  );
});

test('bounded seeded graph walks terminate across both immediate branches and Match outcomes', () => {
  let seed = 0x26c0ffee;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 0x1_0000_0000;
  };
  for (let walk = 0; walk < 32; walk += 1) {
    const option = random() < 0.5 ? 'inspect' : 'skip';
    const gained = Math.floor(random() * 4);
    const result = engineSummary({
      result_id: `result.fixture.${walk + 100}`,
      match_id: `match.fixture.${walk + 100}`,
      service_points_gained: gained,
    });
    const terminal = finishStory(freshPack(), option, result);
    assert.equal(terminal.state.status, 'COMPLETE');
    assert.equal(terminal.state.story_service_points, gained);
  }
});
