import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { createStoryState, reduceStory, validateStoryPack } from '../src/story/index.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const CANDIDATE_ROOT = path.join(ROOT, 'content/story-v1/candidates/quiet-cascade-expansion-v3');
const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

function loadBundle() {
  const manifest = readJson(path.join(CANDIDATE_ROOT, 'manifest.json'));
  return {
    manifest,
    registry: readJson(path.join(CANDIDATE_ROOT, manifest.registry)),
    texts: { en: readJson(path.join(CANDIDATE_ROOT, manifest.text_catalogs.en)) },
    scripts: manifest.scripts.map((scriptPath) => readJson(path.join(CANDIDATE_ROOT, scriptPath))),
  };
}

const bundle = loadBundle();
const blueprint = readJson(path.join(ROOT, 'docs/story/revisions/quiet-cascade-expansion-v3/blueprint.json'));
const graphReport = readJson(path.join(ROOT, 'docs/story/revisions/quiet-cascade-expansion-v3/GRAPH_REPORT.json'));
const matches = readJson(path.join(CANDIDATE_ROOT, 'matches.json'));
const graph = readJson(path.join(CANDIDATE_ROOT, 'graph.json'));
const metadata = readJson(path.join(CANDIDATE_ROOT, 'authored-metadata.json'));
const builderProof = readJson(path.join(ROOT, 'automated_games/task-043-quiet-cascade-expansion-v3/builder-proof.json'));
const statements = bundle.scripts.flatMap((script) => script.statements);
const character = {
  sora: 'story.character.sora_chen',
  malik: 'story.character.malik_okoye',
  hana: 'story.character.hana_park',
  jonah: 'story.character.jonah_reed',
};

function resultFor(routeIndex, match, completion, { minimal = false } = {}) {
  const completed = completion === 'COMPLETED';
  const credited = completed && !minimal;
  const shift = match.shift_id.split('.').at(-1);
  return {
    schema_version: 'story-match-result-v1',
    result_id: `result.qc02.route${routeIndex}.shift${shift}`,
    match_id: `match.qc02.route${routeIndex}.shift${shift}`,
    match_ref: match.match_ref,
    completion,
    valid: true,
    reason_codes: [completed ? 'QUEUE_EMPTY' : 'GIVE_UP'],
    story_service_points_gained: credited ? 2 : 0,
    tickets_closed: credited ? 1 : 0,
    tickets_given_up: !minimal && !completed ? 1 : 0,
    documented_outcome: credited,
    verified_outcome: credited,
    contributions: {
      tests_run: credited ? 2 : 0,
      isolations_accepted: credited ? 1 : 0,
      repairs_performed: credited ? 1 : 0,
      verify_passes: credited ? 1 : 0,
      documentation_actions: credited ? 1 : 0,
    },
  };
}

function traverseRoute(choiceBits, outcomeBits, { minimalResults = false } = {}) {
  const choices = {
    'choice.qc02.initial_evidence_frame': choiceBits & 1 ? 'controlled_comparison_first' : 'location_context_first',
    'choice.qc02.change_evidence_frame': choiceBits & 2 ? 'change_history_first' : 'current_state_first',
  };
  let state = createStoryState(bundle);
  let transition = reduceStory(state, { type: 'BEGIN' }, bundle);
  state = transition.state;
  const effects = [...transition.effects];
  const visibleViolations = [];
  const choiceSurfaces = [];
  let intents = 1;
  while (state.status !== 'COMPLETE' && intents < 1000) {
    if (state.current_statement?.type === 'say') {
      const dialogue = state.display.screens.dialogue;
      if (!state.display.characters.some((entry) => entry.character_id === dialogue.speaker_key)) {
        visibleViolations.push(dialogue.statement_id);
      }
    }
    if (state.status === 'AWAITING_MATCH') {
      const index = matches.matches.findIndex((match) => match.match_ref === state.pending_match.match_ref);
      const completion = outcomeBits & (1 << index) ? 'ABANDONED' : 'COMPLETED';
      transition = reduceStory(state, {
        type: 'ACCEPT_MATCH_RESULT',
        result: resultFor(`${choiceBits}.${outcomeBits}`, matches.matches[index], completion, { minimal: minimalResults }),
      }, bundle);
    } else if (state.current_statement?.type === 'choice') {
      const choiceId = state.display.screens.choices.choice_id;
      choiceSurfaces.push({
        choice_id: choiceId,
        option_ids: state.display.screens.choices.options.map((option) => option.option_id),
      });
      transition = reduceStory(state, { type: 'CHOOSE', option_id: choices[choiceId] }, bundle);
    } else {
      transition = reduceStory(state, { type: 'ADVANCE' }, bundle);
    }
    state = transition.state;
    effects.push(...transition.effects);
    intents += 1;
  }
  assert.equal(state.status, 'COMPLETE', `route ${choiceBits}.${outcomeBits}`);
  return {
    state,
    effects,
    intents,
    choices,
    choiceSurfaces,
    visibleViolations,
    digest: transition.digest,
  };
}

test('candidate pack is runtime-valid, deterministic, and remains non-live', () => {
  assert.deepEqual(validateStoryPack(bundle), []);
  assert.equal(bundle.manifest.pack_id, 'story.campaign.quiet_cascade.v1');
  assert.equal(bundle.manifest.content_version, 'quiet-cascade-expansion-v3');
  assert.equal(bundle.manifest.entry_label, 'story.qc02.entry');
  assert.equal(bundle.scripts.length, 6);
  assert.equal(matches.status, 'CANDIDATE_NON_LIVE');
  assert.equal(matches.live_loader_eligible, false);
  assert.equal(metadata.status, 'CANDIDATE_NON_LIVE');
});

test('script labels, choices, Match boundaries, checkpoints, and ending exactly realize the locked blueprint', () => {
  const labels = statements.filter((entry) => entry.type === 'label').map((entry) => entry.label_id).sort();
  const lockedLabels = graphReport.graph.nodes.flatMap((node) => node.entry_labels).sort();
  assert.ok(lockedLabels.every((labelId) => labels.includes(labelId)));
  assert.deepEqual(labels.filter((labelId) => !lockedLabels.includes(labelId)), [
    'story.qc02.shift08.initial_frame_ack.controlled_comparison_first',
    'story.qc02.shift08.initial_frame_ack.location_context_first',
    'story.qc02.shift11.change_frame_ack.change_history_first',
    'story.qc02.shift11.change_frame_ack.current_state_first',
  ]);
  assert.deepEqual(graph.nodes, graphReport.graph.nodes);
  assert.deepEqual(graph.edges, graphReport.graph.edges);
  assert.equal(new Set(labels).size, labels.length);

  const authoredMatches = statements.filter((entry) => entry.type === 'start_match');
  assert.equal(authoredMatches.length, 6);
  for (const episode of blueprint.episodes) {
    const boundary = authoredMatches.find((entry) => entry.match_ref === episode.match_ref);
    assert.deepEqual(boundary, {
      type: 'start_match',
      match_ref: episode.match_ref,
      return_label: episode.labels.return,
      pre_match_checkpoint_id: episode.checkpoints.pre_match,
      post_match_checkpoint_id: episode.checkpoints.post_match,
    });
  }

  const checkpoints = statements.flatMap((entry) => {
    if (entry.type === 'scene' && entry.checkpoint_id) return [entry.checkpoint_id];
    if (entry.type === 'checkpoint') return [entry.checkpoint_id];
    if (entry.type === 'start_match') return [entry.pre_match_checkpoint_id, entry.post_match_checkpoint_id];
    if (entry.type === 'end') return [entry.checkpoint_id];
    return [];
  });
  assert.equal(checkpoints.length, 20);
  assert.equal(new Set(checkpoints).size, 20);
  assert.ok(checkpoints.includes('checkpoint.qc02.entry'));
  assert.ok(checkpoints.includes('checkpoint.qc02.ending.current_content'));
  assert.deepEqual(statements.filter((entry) => entry.type === 'call' || entry.type === 'return'), []);
  assert.deepEqual(statements.filter((entry) => entry.type === 'end'), [{
    type: 'end', ending_id: 'ending.qc02.current_content', checkpoint_id: 'checkpoint.qc02.ending.current_content',
  }]);
});

test('each episode uses exactly its locked backgrounds, poses, and empty transient inventory', () => {
  for (const [index, episode] of blueprint.episodes.entries()) {
    const episodeStatements = bundle.scripts[index].statements;
    const backgrounds = [...new Set(episodeStatements.filter((entry) => entry.type === 'scene')
      .map((entry) => entry.background_asset_id))].sort();
    const poses = [...new Set(episodeStatements.filter((entry) => entry.type === 'show' && entry.layer === 'characters')
      .map((entry) => `${entry.character_id}:${entry.pose_id}`))].sort();
    const transients = [...new Set(episodeStatements.filter((entry) => entry.type === 'show' && entry.layer === 'transient')
      .map((entry) => entry.asset_id))].sort();
    assert.deepEqual(backgrounds, [...episode.art.background_asset_ids].sort(), episode.episode_id);
    assert.deepEqual(poses, [...episode.art.character_pose_ids].sort(), episode.episode_id);
    assert.deepEqual(transients, [...episode.art.transient_asset_ids].sort(), episode.episode_id);
  }
});

test('both remembered values are consumed by distinct delayed acknowledgments that reconverge', () => {
  const expected = [
    {
      variable: 'story.qc02.initial_evidence_frame',
      values: ['LOCATION_CONTEXT_FIRST', 'CONTROLLED_COMPARISON_FIRST'],
      reconverge: 'story.qc02.shift08.initial_frame_ack',
    },
    {
      variable: 'story.qc02.change_evidence_frame',
      values: ['CURRENT_STATE_FIRST', 'CHANGE_HISTORY_FIRST'],
      reconverge: 'story.qc02.shift11.change_frame_ack',
    },
  ];
  for (const contract of expected) {
    const conditionals = statements.filter((entry) => entry.type === 'if'
      && entry.condition.op === 'VARIABLE_EQUALS'
      && entry.condition.variable_id === contract.variable);
    assert.equal(conditionals.length, 1, contract.variable);
    assert.equal(conditionals[0].condition.value, contract.values[0]);
    const acknowledgmentDisplays = metadata.displays.filter((display) => display.phase === 'DELAYED_CHOICE_ACK'
      && display.route_selector.variable_id === contract.variable);
    assert.equal(acknowledgmentDisplays.length, 2);
    assert.deepEqual(acknowledgmentDisplays.map((display) => display.route_selector.value).sort(), [...contract.values].sort());
    assert.equal(new Set(acknowledgmentDisplays.map((display) => bundle.texts.en.entries[display.text_id])).size, 2);
    for (const branchLabel of [conditionals[0].then_label, conditionals[0].else_label]) {
      const script = bundle.scripts.find((candidate) => candidate.statements.some((entry) => entry.type === 'label' && entry.label_id === branchLabel));
      const branchIndex = script.statements.findIndex((entry) => entry.type === 'label' && entry.label_id === branchLabel);
      assert.equal(script.statements.slice(branchIndex).find((entry) => entry.type === 'jump').label_id, contract.reconverge);
    }
  }
});

test('all 256 choice/outcome routes terminate at current content with complete edge coverage', () => {
  const routes = [];
  for (let choices = 0; choices < 4; choices += 1) {
    for (let outcomes = 0; outcomes < 64; outcomes += 1) routes.push(traverseRoute(choices, outcomes));
  }
  assert.equal(routes.length, 256);
  assert.equal(new Set(routes.map((route) => route.digest)).size, 256);
  assert.ok(routes.every((route) => route.state.ending_id === 'ending.qc02.current_content'));
  assert.ok(routes.every((route) => route.state.match_results.length === 6));
  assert.ok(routes.every((route) => route.state.branch_history.length === 2));
  assert.ok(routes.every((route) => route.effects.filter((effect) => effect.type === 'START_MATCH').length === 6));
  assert.ok(routes.every((route) => route.effects.filter((effect) => effect.type === 'PERSIST_CHECKPOINT').length === 20));
  assert.ok(routes.every((route) => route.visibleViolations.length === 0));
  assert.deepEqual([...new Set(routes.map((route) => route.state.story_service_points))].sort((a, b) => a - b), [0, 2, 4, 6, 8, 10, 12]);
  for (const choiceId of ['choice.qc02.initial_evidence_frame', 'choice.qc02.change_evidence_frame']) {
    assert.equal(new Set(routes.map((route) => route.choices[choiceId])).size, 2);
  }
  const expectedChoiceSurfaces = [
    {
      choice_id: 'choice.qc02.initial_evidence_frame',
      option_ids: ['location_context_first', 'controlled_comparison_first'],
    },
    {
      choice_id: 'choice.qc02.change_evidence_frame',
      option_ids: ['current_state_first', 'change_history_first'],
    },
  ];
  assert.ok(routes.every((route) => {
    assert.deepEqual(route.choiceSurfaces, expectedChoiceSurfaces);
    return true;
  }));
  const optionDisplays = metadata.displays.filter((display) => display.display_kind === 'CHOICE_OPTION');
  assert.equal(optionDisplays.length, 4);
  assert.ok(optionDisplays.every((display) => display.route_selector.kind === 'ALL_ROUTES'
    && typeof display.choice_id === 'string'
    && typeof display.option_id === 'string'));
  for (const match of matches.matches) {
    assert.ok(routes.some((route) => route.state.match_results.find((result) => result.match_ref === match.match_ref)?.completion === 'COMPLETED'));
    assert.ok(routes.some((route) => route.state.match_results.find((result) => result.match_ref === match.match_ref)?.completion === 'ABANDONED'));
  }
  const transcriptIds = (route) => new Set(route.state.display.screens.transcript.map((entry) => entry.statement_id));
  const acknowledgmentRoutes = [
    ['choice.qc02.initial_evidence_frame', 'location_context_first', 'story.qc02.s08.ack.initial.location.01', 'story.qc02.s08.ack.initial.comparison.01'],
    ['choice.qc02.initial_evidence_frame', 'controlled_comparison_first', 'story.qc02.s08.ack.initial.comparison.01', 'story.qc02.s08.ack.initial.location.01'],
    ['choice.qc02.change_evidence_frame', 'current_state_first', 'story.qc02.s11.ack.change.current.01', 'story.qc02.s11.ack.change.history.01'],
    ['choice.qc02.change_evidence_frame', 'change_history_first', 'story.qc02.s11.ack.change.history.01', 'story.qc02.s11.ack.change.current.01'],
  ];
  for (const [choiceId, optionId, expectedId, excludedId] of acknowledgmentRoutes) {
    const route = routes.find((candidate) => candidate.choices[choiceId] === optionId);
    const ids = transcriptIds(route);
    assert.ok(ids.has(expectedId), `${choiceId}:${optionId}`);
    assert.ok(!ids.has(excludedId), `${choiceId}:${optionId}`);
  }
  const branchRoutes = [
    ['choice.qc02.initial_evidence_frame', 'location_context_first', 'story.qc02.s07.frame.location.01', 'story.qc02.s07.frame.comparison.01'],
    ['choice.qc02.initial_evidence_frame', 'controlled_comparison_first', 'story.qc02.s07.frame.comparison.01', 'story.qc02.s07.frame.location.01'],
    ['choice.qc02.change_evidence_frame', 'current_state_first', 'story.qc02.s10.frame.current.01', 'story.qc02.s10.frame.history.01'],
    ['choice.qc02.change_evidence_frame', 'change_history_first', 'story.qc02.s10.frame.history.01', 'story.qc02.s10.frame.current.01'],
  ];
  for (const [choiceId, optionId, expectedId, excludedId] of branchRoutes) {
    const matchingRoutes = routes.filter((candidate) => candidate.choices[choiceId] === optionId);
    assert.equal(matchingRoutes.length, 128);
    assert.ok(matchingRoutes.every((route) => {
      const ids = transcriptIds(route);
      return ids.has(expectedId) && !ids.has(excludedId);
    }), `${choiceId}:${optionId}`);
  }
});

test('localized copy is bounded, complete, protagonist-neutral, and does not leak hidden stable IDs', () => {
  const textEntries = bundle.texts.en.entries;
  const referencedTextIds = new Set(statements.flatMap((entry) => {
    if (entry.type === 'say' || entry.type === 'narrate') return [entry.text_id];
    if (entry.type === 'choice') return [entry.prompt_text_id, ...entry.options.map((option) => option.text_id)];
    if (entry.type === 'scene') return [entry.location_text_id, entry.time_text_id];
    return [];
  }));
  assert.ok([...referencedTextIds].every((textId) => typeof textEntries[textId] === 'string'));
  assert.ok(Object.values(textEntries).every((value) => value.length > 0 && value.length <= 420 && !value.includes('\n')));
  const authoredCopy = metadata.displays.map((display) => textEntries[display.text_id]).join('\n');
  const spokenCopy = metadata.displays.filter((display) => display.display_kind === 'SAY')
    .map((display) => textEntries[display.text_id]).join('\n');
  assert.doesNotMatch(authoredCopy, /(?:fault|fingerprint|card\.(?:bench|response)|ticket\.generated)\.[a-z0-9._-]+/i);
  assert.doesNotMatch(authoredCopy, /you (?:feel|remember|grew up|live|believe|love|hate|want|fear)/i);
  assert.doesNotMatch(authoredCopy, /\bTFTP\b|\bUART\b/);
  assert.doesNotMatch(spokenCopy, /\b(?:checkpoint|story|runtime)\b|score[- ]gate/i);
});

test('public Candidate and pre-Match route copy stay within explicit episode contracts', () => {
  assert.equal(metadata.public_candidate_copy_contracts.length, 6);
  const proofByCase = new Map(builderProof.matches.map((match) => [match.case_id, match]));
  const preMatchEpisodePhases = new Set(['CONTEXT', 'CHOICE', 'CHOICE_BRANCH', 'MATCH_BRIDGE']);
  for (const contract of metadata.public_candidate_copy_contracts) {
    const source = proofByCase.get(contract.source_case_id);
    assert.ok(source, contract.source_case_id);
    assert.deepEqual(contract.allowed_public_candidate_fault_ids, source.public_candidate_fault_ids);
    assert.equal(contract.copy_bound, 'PRE_MATCH_COPY_MAY_NOT_ADD_OR_REMOVE_TICKET_CANDIDATES');
    assert.deepEqual(contract.pre_match_leakage_scope, ['SOURCE_CASE_FOLLOW_ON', 'CONTEXT', 'CHOICE', 'CHOICE_BRANCH', 'MATCH_BRIDGE']);
    assert.ok(contract.forbidden_pre_match_concepts.length > 0);

    const episodeDisplays = metadata.displays.filter((display) => display.episode_id === contract.episode_id);
    assert.ok(episodeDisplays.length > 0);
    for (const display of episodeDisplays) {
      const candidateSourceCaseId = display.technical_claim ? display.source_case_id : contract.source_case_id;
      assert.deepEqual(
        display.public_candidate_fault_ids,
        proofByCase.get(candidateSourceCaseId).public_candidate_fault_ids,
        display.text_id,
      );
    }

    const preMatchDisplays = metadata.displays.filter((display) => (
      display.episode_id === contract.episode_id && preMatchEpisodePhases.has(display.phase)
    ) || (
      display.phase === 'FOLLOW_ON' && display.source_case_id === contract.source_case_id
    ));
    assert.ok(preMatchDisplays.length > 0, contract.episode_id);
    const preMatchCopy = preMatchDisplays.map((display) => bundle.texts.en.entries[display.text_id]).join('\n').toLowerCase();
    for (const concept of contract.forbidden_pre_match_concepts) {
      assert.match(concept.concept_id, /^[A-Z0-9_]+$/);
      assert.ok(concept.forbidden_phrases.length > 0);
      for (const phrase of concept.forbidden_phrases) {
        assert.equal(preMatchCopy.includes(phrase.toLowerCase()), false, `${contract.episode_id}:${concept.concept_id}:${phrase}`);
      }
    }
  }

  const predictivePreMatchCopy = metadata.displays.filter((display) => display.episode_id === 'story.shift.qc02.09'
    && preMatchEpisodePhases.has(display.phase))
    .map((display) => bundle.texts.en.entries[display.text_id]).join('\n');
  assert.doesNotMatch(predictivePreMatchCopy, /controller[- ]path/i);
  for (const display of metadata.displays.filter((candidate) => candidate.technical_claim)) {
    assert.deepEqual(
      display.public_candidate_fault_ids,
      proofByCase.get(display.source_case_id).public_candidate_fault_ids,
      display.text_id,
    );
  }
});

test('BMC source trace distinguishes volatile transfer from the state-changing firmware write', () => {
  const displaysByStatement = new Map(metadata.displays.map((display) => [display.statement_id, display]));
  const follow = displaysByStatement.get('story.qc02.s11.follow.01');
  const entryThree = displaysByStatement.get('story.qc02.s12.entry.03');
  const entryFour = displaysByStatement.get('story.qc02.s12.entry.04');
  assert.deepEqual(follow.source_event_numbers, [3, 4, 5, 7]);
  assert.deepEqual(entryThree.source_event_numbers, [2, 3, 4, 5, 7]);
  assert.deepEqual(entryFour.source_event_numbers, [4, 5, 7]);
  assert.ok([follow, entryThree, entryFour].every((display) => display.source_case_id === 'exp-006'));
  assert.match(follow.semantic_payload, /volatile image transfer.*state-changing firmware write/i);
  assert.match(entryFour.semantic_payload, /volatile transfer.*state-changing flash write/i);
  const copy = [follow, entryThree, entryFour].map((display) => bundle.texts.en.entries[display.text_id]).join('\n');
  assert.match(copy, /volatile memory (?:without|does not).*writ(?:e|ing) flash/i);
  assert.match(copy, /writing firmware is (?:the|a) (?:machine-)?state change/i);
  assert.doesNotMatch(copy, /transferring (?:or|and) writing firmware changes the machine/i);
});

test('bounded POST, link-flap, and BMC acceptance source corrections remain pinned', () => {
  const displaysByStatement = new Map(metadata.displays.map((display) => [display.statement_id, display]));
  const copyFor = (statementId) => bundle.texts.en.entries[displaysByStatement.get(statementId).text_id];
  assert.match(copyFor('story.qc02.s07.entry.01'), /stop during its startup self-check/i);
  assert.match(copyFor('story.qc02.s07.entry.02'), /completes it with two processors, but not with the full four/i);
  assert.match(copyFor('story.qc02.s11.entry.02'), /repeated transitions remain the symptom/i);
  assert.doesNotMatch(copyFor('story.qc02.s11.entry.02'), /interrupt service/i);
  const bmcAcceptance = displaysByStatement.get('story.qc02.s12.entry.05');
  assert.deepEqual(bmcAcceptance.source_event_numbers, [3, 5, 8]);
  assert.match(copyFor('story.qc02.s12.entry.05'), /defined acceptance boundary/i);
  assert.match(bmcAcceptance.semantic_payload, /without claiming the source proved persistence/i);
});

test('all 24 outcome displays use only allowlisted completion copy and remain true for minimal results', () => {
  assert.deepEqual(metadata.outcome_copy_policy.allowed_normalized_result_fields, ['completion']);
  assert.match(metadata.outcome_copy_policy.minimal_result_contract, /every normalized counter is zero/i);
  const principles = new Map(metadata.outcome_copy_policy.public_process_principles
    .map((principle) => [principle.principle_id, principle]));
  assert.equal(principles.size, 24);
  const outcomes = metadata.displays.filter((display) => display.phase === 'OUTCOME');
  assert.equal(outcomes.length, 24);
  assert.deepEqual(new Set(outcomes.map((display) => display.public_process_principle_id)), new Set(principles.keys()));
  const forbiddenPrivateDebrief = /comparisons? already performed|supported change|current Verify|required (?:state|nonrecurrence)|replacement entered|chronology now|configurations? were tested|recovery progress|corroborated Isolation|both observations|hardware eliminations|action was permitted|partially observed recovery|interrupted write/i;
  const technicalDomainVocabulary = /\b(?:processor|socket|server|component|power|voltage|supply|bay|drive|array|storage|predictive|alert|management|firmware|link|network|hardware|controller|bmc|flash|image|transport|recovery|write|version)\b/i;
  for (const display of outcomes) {
    const principle = principles.get(display.public_process_principle_id);
    assert.ok(principle, display.text_id);
    assert.equal(bundle.texts.en.entries[display.text_id], principle.allowed_copy);
    assert.deepEqual(display.normalized_result_fields, ['completion']);
    assert.deepEqual(display.normalized_result_expectations, { completion: display.route_selector.completion });
    assert.equal(display.route_selector.kind, 'MATCH_COMPLETION');
    assert.equal(display.private_match_details_claimed, false);
    const technicalSounding = technicalDomainVocabulary.test(`${principle.allowed_copy}\n${principle.semantic_summary}`);
    if (technicalSounding) {
      assert.equal(display.technical_claim, true, display.text_id);
      assert.match(display.source_case_id, /^exp-00[1-6]$/);
      assert.ok(display.source_event_numbers.length > 0);
    } else {
      assert.equal(display.technical_claim, false);
      assert.equal(display.source_case_id, null);
      assert.deepEqual(display.source_event_numbers, []);
    }
    assert.equal(
      display.semantic_payload,
      `Use normalized result field completion=${display.route_selector.completion} only; ${principle.semantic_summary} No private Match Evidence, diagnosis, action sequence, or technical outcome is asserted.`,
    );
    assert.doesNotMatch(`${principle.allowed_copy}\n${display.semantic_payload}`, forbiddenPrivateDebrief);
  }

  for (const [completion, outcomeBits] of [['COMPLETED', 0], ['ABANDONED', 63]]) {
    const route = traverseRoute(0, outcomeBits, { minimalResults: true });
    assert.equal(route.state.match_results.length, 6);
    assert.ok(route.state.match_results.every((result) => result.completion === completion
      && result.story_service_points_gained === 0
      && result.tickets_closed === 0
      && result.tickets_given_up === 0
      && result.documented_outcome === false
      && result.verified_outcome === false
      && Object.values(result.contributions).every((count) => count === 0)));
    const transcriptIds = new Set(route.state.display.screens.transcript.map((entry) => entry.statement_id));
    const selectedOutcomes = outcomes.filter((display) => display.route_selector.completion === completion);
    const otherOutcomes = outcomes.filter((display) => display.route_selector.completion !== completion);
    assert.equal(selectedOutcomes.length, 12);
    assert.ok(selectedOutcomes.every((display) => transcriptIds.has(display.statement_id)));
    assert.ok(otherOutcomes.every((display) => !transcriptIds.has(display.statement_id)));
  }
});

test('metadata proves newcomer context, technical provenance, result bounds, and restrained voice ownership', () => {
  assert.equal(metadata.displays.length, 76);
  assert.equal(new Set(metadata.displays.map((display) => display.text_id)).size, metadata.displays.length);
  assert.ok(metadata.displays.filter((display) => display.technical_claim)
    .every((display) => /^exp-00[1-6]$/.test(display.source_case_id)
      && display.source_event_numbers.length > 0
      && ['CONTEXT', 'FOLLOW_ON'].includes(display.phase)));
  assert.ok(metadata.displays.filter((display) => display.phase === 'OUTCOME')
    .every((display) => display.technical_claim === false
      && display.authority_bound === 'NORMALIZED_MATCH_RESULT_ONLY'
      && display.route_selector.kind === 'MATCH_COMPLETION'));

  for (const episode of blueprint.episodes) {
    const beforeMatch = metadata.displays.filter((display) => display.episode_id === episode.episode_id
      && ['CONTEXT', 'CHOICE', 'CHOICE_BRANCH'].includes(display.phase));
    const rungs = new Set(beforeMatch.flatMap((display) => display.context_rungs));
    assert.ok(rungs.has('ENVIRONMENT'), episode.episode_id);
    assert.ok(rungs.has('PROCEDURE'), episode.episode_id);
    assert.ok(rungs.has('ACTION'), episode.episode_id);
    assert.ok(rungs.has('INSIGHT') || rungs.has('PAIN_POINT'), episode.episode_id);
    const firstIndex = (accepted) => beforeMatch.findIndex((display) => display.context_rungs.some((rung) => accepted.includes(rung)));
    const firstInsight = firstIndex(['INSIGHT']);
    assert.ok(firstInsight >= firstIndex(['ENVIRONMENT']), `${episode.episode_id}:environment-before-insight`);
    assert.ok(firstInsight >= firstIndex(['PROCEDURE', 'NORMAL']), `${episode.episode_id}:procedure-before-insight`);
    assert.ok(firstInsight >= firstIndex(['PAIN_POINT', 'FAILURE']), `${episode.episode_id}:pain-before-insight`);
  }

  const speaking = metadata.displays.filter((display) => display.display_kind === 'SAY');
  const counts = Object.fromEntries(Object.values(character).map((speaker) => [speaker, speaking.filter((display) => display.speaker_key === speaker).length]));
  assert.deepEqual(counts, {
    'story.character.sora_chen': 17,
    'story.character.malik_okoye': 13,
    'story.character.hana_park': 19,
    'story.character.jonah_reed': 15,
  });
  const texture = speaking.filter((display) => display.personal_texture);
  assert.equal(texture.length, 4);
  assert.ok(texture.length / speaking.length >= 0.05 && texture.length / speaking.length <= 0.1);
  assert.deepEqual(new Set(texture.map((display) => display.speaker_key)), new Set(Object.values(character)));
  assert.ok(texture.every((display) => typeof display.texture_source === 'string'
    && display.technical_claim === (display.phase === 'CONTEXT')));
  assert.ok(speaking.every((display) => display.voice_fingerprint !== null));
  const authoredCopy = bundle.texts.en.entries;
  const bySpeaker = (speaker) => speaking.filter((display) => display.speaker_key === speaker).map((display) => authoredCopy[display.text_id]).join(' ');
  assert.match(bySpeaker(character.sora), /Candidate|Evidence|comparison/);
  assert.match(bySpeaker(character.malik), /comparison|condition|path/);
  assert.match(bySpeaker(character.hana), /Gate|accepted|current Verify/);
  assert.match(bySpeaker(character.jonah), /record|chronology|cannot/);
});

test('candidate Match catalogue is the final TASK-043 registry and every public boundary stays pinned', () => {
  const source = readJson(path.join(ROOT, 'automated_games/task-043-quiet-cascade-expansion-v3/match-registry.json'));
  assert.deepEqual(matches, source);
  assert.equal(matches.matches.length, 6);
  for (const [index, episode] of blueprint.episodes.entries()) {
    const match = matches.matches[index];
    assert.equal(match.match_ref, episode.match_ref);
    assert.equal(match.seed, `story.quiet_cascade.expansion.s${String(episode.shift_number).padStart(2, '0')}.v1`);
    assert.equal(match.requested_ticket_count, 1);
    assert.equal(match.expected_ticket_definition_ids.length, 1);
    assert.equal(match.expected_ticket_snapshot_digests.length, 1);
  }
});
