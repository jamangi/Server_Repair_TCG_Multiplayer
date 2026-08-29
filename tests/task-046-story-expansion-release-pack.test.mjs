import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

import {
  compileStoryPack,
  createStoryState,
  reduceStory,
  restoreStoryCheckpoint,
  validateStoryPack,
} from '../src/story/index.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const BASE_ROOT = path.join(ROOT, 'content/story-v1/campaigns/quiet-cascade-characterization-v2');
const CANDIDATE_ROOT = path.join(ROOT, 'content/story-v1/candidates/quiet-cascade-expansion-v3');
const RELEASE_ROOT = path.join(ROOT, 'content/story-v1/campaigns/quiet-cascade-expansion-v3');
const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const sha256File = (filePath) => crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');

function loadBundle(root = RELEASE_ROOT) {
  const manifest = readJson(path.join(root, 'manifest.json'));
  return {
    manifest,
    registry: readJson(path.join(root, manifest.registry)),
    texts: { en: readJson(path.join(root, manifest.text_catalogs.en)) },
    scripts: manifest.scripts.map((relativePath) => readJson(path.join(root, relativePath))),
  };
}

const bundle = loadBundle();
const compiled = compileStoryPack(bundle);
const releaseMatches = readJson(path.join(RELEASE_ROOT, 'matches.json'));
const baseMatches = readJson(path.join(BASE_ROOT, 'matches.json'));
const candidateMatches = readJson(path.join(CANDIDATE_ROOT, 'matches.json'));
const reviewEpisodes = readJson(path.join(RELEASE_ROOT, 'review-episodes.json'));
const report = readJson(path.join(ROOT, 'docs/story/releases/quiet-cascade-expansion-v3/RELEASE_CONTENT_PACK.json'));
const baseMatchRefs = new Set(baseMatches.matches.map((entry) => entry.match_ref));

function resultFor(match, sequence, completed) {
  const storyPoints = completed ? match.requested_ticket_count * 2 : 0;
  return {
    schema_version: 'story-match-result-v1',
    result_id: `result.task046.${sequence}`,
    match_id: `match.task046.${sequence}`,
    match_ref: match.match_ref,
    completion: completed ? 'COMPLETED' : 'ABANDONED',
    valid: true,
    reason_codes: [completed ? 'QUEUE_EMPTY' : 'GIVE_UP'],
    story_service_points_gained: storyPoints,
    tickets_closed: completed ? match.requested_ticket_count : 0,
    tickets_given_up: completed ? 0 : match.requested_ticket_count,
    documented_outcome: completed,
    verified_outcome: completed,
    contributions: {
      tests_run: completed ? match.requested_ticket_count : 0,
      isolations_accepted: completed ? match.requested_ticket_count : 0,
      repairs_performed: completed ? match.requested_ticket_count : 0,
      verify_passes: completed ? match.requested_ticket_count : 0,
      documentation_actions: completed ? match.requested_ticket_count : 0,
    },
  };
}

function reachExpansion(band, clientFrame) {
  const completedCount = band === 'release' ? 6 : band === 'bounded' ? 4 : 0;
  let state = createStoryState(bundle);
  let transition = reduceStory(state, { type: 'BEGIN' }, bundle);
  state = transition.state;
  const allEffects = [...transition.effects];
  let accepted = 0;

  for (let intentCount = 0; intentCount < 500; intentCount += 1) {
    if (state.current_statement?.statement_id === 'story.qc02.s07.entry.01') {
      return { state, allEffects, accepted };
    }
    if (state.status === 'AWAITING_MATCH') {
      const match = releaseMatches.matches.find((entry) => entry.match_ref === state.pending_match.match_ref);
      assert.ok(match && baseMatchRefs.has(match.match_ref), 'Expansion must not launch before its entry dialogue.');
      transition = reduceStory(state, {
        type: 'ACCEPT_MATCH_RESULT',
        result: resultFor(match, `${band}.${clientFrame}.${accepted + 1}`, accepted < completedCount),
      }, bundle);
      accepted += 1;
    } else if (state.current_statement?.type === 'choice') {
      const choice = state.display.screens.choices;
      const optionId = choice.choice_id === 'choice.qc01.client_frame'
        ? clientFrame
        : choice.options[0].option_id;
      transition = reduceStory(state, { type: 'CHOOSE', option_id: optionId }, bundle);
    } else {
      transition = reduceStory(state, { type: 'ADVANCE' }, bundle);
    }
    state = transition.state;
    allEffects.push(...transition.effects);
  }
  throw new Error(`Route ${band}/${clientFrame} did not reach the expansion.`);
}

test('release generator is byte-stable and every reported core digest matches disk', () => {
  const result = spawnSync(process.execPath, [
    path.join(ROOT, 'src/story/generate-quiet-cascade-expansion-release.mjs'),
    '--check',
  ], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /Verified Quiet Cascade expansion release \(10 scripts, 12 Matches, 12 replay boundaries\)/);
  for (const [relativePath, digest] of Object.entries(report.generated_core_file_sha256)) {
    assert.equal(sha256File(path.join(RELEASE_ROOT, relativePath)), digest, relativePath);
  }
});

test('combined pack validates with one QC01 entry, ten scripts, twelve Matches, and one current-content ending', () => {
  assert.deepEqual(validateStoryPack(bundle), []);
  assert.equal(bundle.manifest.pack_id, 'story.campaign.quiet_cascade.v1');
  assert.equal(bundle.manifest.content_version, 'quiet-cascade-expansion-v3');
  assert.equal(bundle.manifest.entry_label, 'story.qc01.entry');
  assert.equal(bundle.scripts.length, 10);
  assert.equal(bundle.registry.matches.length, 12);
  assert.equal(releaseMatches.matches.length, 12);
  assert.equal(bundle.registry.variables.length, 6);
  assert.equal(bundle.registry.assets.length, 23);
  assert.equal(bundle.registry.characters.length, 7);
  const ends = bundle.scripts.flatMap((script) => script.statements.filter((statement) => statement.type === 'end'));
  assert.deepEqual(ends, [{
    type: 'end',
    ending_id: 'ending.qc02.current_content',
    checkpoint_id: 'checkpoint.qc02.ending.current_content',
  }]);
});

test('source packs remain an exact additive merge except for the six reviewed QC01 transitions and release Match labels', () => {
  const baseManifest = readJson(path.join(BASE_ROOT, 'manifest.json'));
  const candidateManifest = readJson(path.join(CANDIDATE_ROOT, 'manifest.json'));
  const baseScripts = baseManifest.scripts.map((relativePath) => readJson(path.join(BASE_ROOT, relativePath)));
  const candidateScripts = candidateManifest.scripts.map((relativePath) => readJson(path.join(CANDIDATE_ROOT, relativePath)));

  assert.deepEqual(bundle.scripts.slice(0, 3), baseScripts.slice(0, 3));
  assert.deepEqual(bundle.scripts[3], {
    ...baseScripts[3],
    statements: baseScripts[3].statements.map((statement) => statement.type === 'end'
      ? { type: 'checkpoint', checkpoint_id: statement.checkpoint_id, resume_label: 'story.qc02.entry' }
      : statement),
  });
  assert.deepEqual(bundle.scripts.slice(4), candidateScripts);

  assert.deepEqual(releaseMatches.matches.slice(0, 6), baseMatches.matches);
  for (const [index, released] of releaseMatches.matches.slice(6).entries()) {
    const { chapter_id: chapterId, title_text_id: titleTextId, setup_text_id: setupTextId, ...candidateValue } = released;
    assert.deepEqual(candidateValue, candidateMatches.matches[index]);
    assert.equal(chapterId, `story.shift.qc02.${String(index + 7).padStart(2, '0')}`);
    assert.equal(bundle.texts.en.entries[titleTextId], report.coverage.expansion_learning_objectives[index].title);
    assert.equal(bundle.texts.en.entries[setupTextId], released.public_setup_summary);
    assert.equal(released.builder_configuration.configuration_version, 'ticket-builder-v4');
    assert.equal(released.deck_pressure.feasible, true);
  }

  const baseRegistry = readJson(path.join(BASE_ROOT, 'registry.json'));
  const candidateRegistry = readJson(path.join(CANDIDATE_ROOT, 'registry.json'));
  assert.deepEqual(bundle.registry.variables, [...baseRegistry.variables, ...candidateRegistry.variables]);
  assert.deepEqual(bundle.registry.assets, baseRegistry.assets);
  assert.deepEqual(bundle.registry.characters, baseRegistry.characters);
  assert.deepEqual(bundle.registry.matches, [...baseRegistry.matches, ...candidateRegistry.matches]);
});

test('all six preserved QC01 ending checkpoints compile, persist real history unchanged, and restore into QC02', () => {
  const expected = new Map([
    ['release/verified_outcomes_first', 'checkpoint.qc01.ending.release.outcomes'],
    ['release/bounded_uncertainty_first', 'checkpoint.qc01.ending.release.uncertainty'],
    ['bounded/verified_outcomes_first', 'checkpoint.qc01.ending.bounded.outcomes'],
    ['bounded/bounded_uncertainty_first', 'checkpoint.qc01.ending.bounded.uncertainty'],
    ['hold/verified_outcomes_first', 'checkpoint.qc01.ending.hold.outcomes'],
    ['hold/bounded_uncertainty_first', 'checkpoint.qc01.ending.hold.uncertainty'],
  ]);

  for (const [route, checkpointId] of expected) {
    const [band, clientFrame] = route.split('/');
    const traversal = reachExpansion(band, clientFrame);
    assert.equal(traversal.accepted, 6, route);
    assert.equal(traversal.state.match_results.length, 6, route);
    assert.ok(traversal.state.match_results.every((result) => baseMatchRefs.has(result.match_ref)), route);
    const transitionEffect = traversal.allEffects.find((effect) =>
      effect.type === 'PERSIST_CHECKPOINT' && effect.checkpoint.checkpoint_id === checkpointId);
    assert.ok(transitionEffect, route);
    assert.equal(transitionEffect.checkpoint.match_results.length, 6, route);
    assert.deepEqual(transitionEffect.checkpoint.match_results, traversal.state.match_results, route);
    assert.equal(transitionEffect.checkpoint.story_service_points, traversal.state.story_service_points, route);
    assert.equal(compiled.checkpoints.get(checkpointId).resume_label, 'story.qc02.entry', route);

    const restored = restoreStoryCheckpoint(transitionEffect.checkpoint, bundle);
    assert.deepEqual(restored.location, compiled.labels.get('story.qc02.entry'), route);
    assert.deepEqual(restored.match_results, transitionEffect.checkpoint.match_results, route);
    const resumed = reduceStory(restored, { type: 'BEGIN' }, bundle);
    assert.equal(resumed.state.current_statement.statement_id, 'story.qc02.s07.entry.01', route);
    assert.equal(resumed.state.match_results.length, 6, route);
    assert.ok(resumed.effects.some((effect) => effect.type === 'PERSIST_CHECKPOINT'
      && effect.checkpoint.checkpoint_id === 'checkpoint.qc02.entry'), route);
  }
});

test('all twelve completed episodes expose stable reviewed replay boundaries', () => {
  assert.equal(reviewEpisodes.schema_version, 'story-review-episodes-v1');
  assert.equal(reviewEpisodes.content_version, 'quiet-cascade-expansion-v3');
  assert.equal(reviewEpisodes.episodes.length, 12);
  assert.deepEqual(reviewEpisodes.episodes.map((entry) => entry.match_ref), releaseMatches.matches.map((entry) => entry.match_ref));
  for (const entry of reviewEpisodes.episodes) {
    assert.ok(compiled.checkpoints.has(entry.replay_entry_checkpoint_id), entry.match_ref);
  }
  assert.deepEqual(reviewEpisodes.episodes.slice(6).map((entry, index) => entry.replay_entry_checkpoint_id),
    Array.from({ length: 6 }, (_, index) => `checkpoint.qc02.shift${String(index + 7).padStart(2, '0')}.entry`));
});

test('release report pins bounded authored coverage without inflating global exposure', () => {
  assert.equal(report.counts.campaign_one_matches, 6);
  assert.equal(report.counts.expansion_matches, 6);
  assert.equal(report.counts.total_matches, 12);
  assert.equal(report.counts.campaign_one_requested_tickets, 12);
  assert.equal(report.counts.expansion_requested_tickets, 6);
  assert.equal(report.counts.total_requested_tickets, 18);
  assert.equal(report.counts.reviewed_replay_boundaries, 12);
  assert.equal(new Set(report.coverage.expansion_source_case_ids).size, 6);
  assert.equal(new Set(report.coverage.expansion_fingerprint_ids).size, 6);
  assert.equal(new Set(report.coverage.expansion_ticket_definition_ids).size, 6);
  assert.match(report.coverage.interpretation_limit, /authored Match exposure only/i);
  assert.equal(report.transition.migration_assumption.synthesize_match_results, false);
  assert.deepEqual(report.transition.migration_assumption.cleared_terminal_marker_derivation, {
    reason: 'QC01_IS_NO_LONGER_TERMINAL',
    ending_band_from_preserved_story_service_points: {
      release_minimum: 20,
      bounded_minimum: 12,
      hold_maximum: 11,
    },
    exact_variant_from_preserved_checkpoint_id: true,
    lossless: true,
  });
});
