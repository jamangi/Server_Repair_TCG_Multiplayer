import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  EXPANSION_PLANNING_OUTPUTS,
  assertBlueprintAssignments,
  buildExpansionPlanningAudit,
  generateExpansionPlanningAudit,
  loadExpansionPlanningInputs,
  renderExpansionPlanningAudit,
  stableExpansionPlanningJson,
} from '../src/story/generate-expansion-planning-audit.mjs';

const EXPECTED_ASSIGNMENTS = [
  ['story.shift.qc02.07', 'story.match.qc02.shift07.socket_contacts', 'story.quiet_cascade.expansion.s07.v1', 'exp-001', 'fingerprint.compute.damaged_cpu_socket_contacts'],
  ['story.shift.qc02.08', 'story.match.qc02.shift08.power_distribution', 'story.quiet_cascade.expansion.s08.v1', 'exp-002', 'fingerprint.power.failed_distribution_board'],
  ['story.shift.qc02.09', 'story.match.qc02.shift09.predictive_drive', 'story.quiet_cascade.expansion.s09.v1', 'exp-003', 'fingerprint.storage.predictive_drive_failure'],
  ['story.shift.qc02.10', 'story.match.qc02.shift10.stale_alert', 'story.quiet_cascade.expansion.s10.v1', 'exp-004', 'fingerprint.management.stale_alert'],
  ['story.shift.qc02.11', 'story.match.qc02.shift11.firmware_regression', 'story.quiet_cascade.expansion.s11.v1', 'exp-005', 'fingerprint.firmware.incompatible_version_set'],
  ['story.shift.qc02.12', 'story.match.qc02.shift12.bmc_recovery', 'story.quiet_cascade.expansion.s12.v1', 'exp-006', 'fingerprint.management.corrupt_bmc_firmware'],
];

let audit;

test.before(async () => {
  audit = await buildExpansionPlanningAudit(await loadExpansionPlanningInputs());
});

test('pins six ordered QC02 episode, Match, seed, case, and fingerprint assignments', () => {
  assert.deepEqual(audit.episode_assignments.map((entry) => [
    entry.episode_id,
    entry.match_ref,
    entry.seed,
    entry.case_id,
    entry.fingerprint_id,
  ]), EXPECTED_ASSIGNMENTS);
  assert.ok(audit.episode_assignments.every((entry) => entry.requested_ticket_count === 1));
  assert.equal(new Set(audit.episode_assignments.map((entry) => entry.source_ticket_id)).size, 6);
  assert.ok(audit.episode_assignments.every((entry) => /^[a-f0-9]{64}$/.test(entry.source_ticket_snapshot_digest)));
});

test('proves the exact 30-Card response Deck can fund all six fingerprints together', () => {
  const deck = audit.deck_feasibility;
  assert.equal(deck.deck_id, 'deck.story.expansion_response_v1');
  assert.equal(deck.exact_card_count, 30);
  assert.equal(deck.distinct_card_definition_count, 12);
  assert.equal(deck.maximum_copies_observed, 3);
  assert.equal(deck.maximum_copies_allowed, 3);
  assert.equal(deck.builder_coverage.individually_compatible_count, 6);
  assert.equal(deck.builder_coverage.jointly_fundable_distinct_count, 6);
  assert.deepEqual(deck.builder_coverage.compatible_fingerprint_ids.sort(), EXPECTED_ASSIGNMENTS.map((entry) => entry[4]).sort());
  assert.equal(deck.diagnostic_bench_contract.definition_count, 50);
  assert.equal(deck.diagnostic_bench_contract.deck_slots_consumed, 0);
  for (const episode of deck.episodes) {
    assert.equal(episode.deck_feasible, true);
    assert.ok(episode.diagnostic_bench_definition_ids.length >= 1);
    assert.equal(episode.diagnostic_bench_definition_ids.length, episode.diagnostic_bench_card_ids.length);
    assert.deepEqual([episode.repair.copies_required, episode.repair.copies_available, episode.repair.surplus_copies], [1, 3, 2]);
    assert.deepEqual([episode.verify.copies_required, episode.verify.copies_available, episode.verify.surplus_copies], [1, 2, 1]);
  }
});

test('forecasts distinct teaching coverage without inflating catalog exposure', () => {
  const categories = audit.coverage_delta_forecast.categories;
  assert.deepEqual(Object.fromEntries(Object.entries(categories).map(([key, value]) => [key, [
    value.baseline_unique,
    value.expansion_unique,
    value.newly_exercised_unique,
    value.combined_unique_forecast,
    value.denominator,
    value.combined_practice_occurrences_forecast,
  ]])), {
    symptoms: [9, 10, 10, 19, 33, 22],
    public_candidate_faults: [28, 18, 8, 36, 42, 64],
    truth_faults: [18, 6, 6, 24, 42, 25],
    minimal_witness_diagnostics: [14, 7, 7, 21, 50, 22],
    repairs: [12, 6, 6, 18, 18, 18],
    verifications: [9, 6, 6, 15, 15, 21],
    supported_fingerprints: [12, 6, 6, 18, 18, 18],
  });
  assert.deepEqual(audit.coverage_delta_forecast.combined_minimal_witness_playable_actions, {
    numerator: 54,
    denominator: 83,
    percent: 65.1,
    stable_ids: audit.coverage_delta_forecast.combined_minimal_witness_playable_actions.stable_ids,
  });
  assert.equal(audit.coverage_delta_forecast.combined_minimal_witness_playable_actions.stable_ids.length, 54);
  assert.equal(audit.coverage_delta_forecast.release_reaudit_required, true);
});

test('keeps Command exposure, usefulness, authored routes, and minimal requirement separate', () => {
  assert.deepEqual(audit.coverage_delta_forecast.commands, {
    catalog_exposure_count: 13,
    expansion_useful_candidate_changing_ids: [
      'command.linux.lsblk',
      'command.linux.lspci',
      'command.linux.smartctl',
    ],
    expansion_authored_isolation_route_source_ids: [],
    expansion_oracle_minimal_required_ids: [],
    campaign_one_oracle_minimal_required_count: 0,
    interpretation: 'Catalog exposure, useful Evidence, authored route participation, and oracle-minimal requirement remain separate counts.',
  });
});

test('uses only current backgrounds and canon poses, with complete responsive sources and fallbacks', () => {
  const plan = audit.asset_plan;
  assert.equal(plan.policy, 'REUSE_ONLY_NO_TRANSIENT_INSERTS');
  assert.deepEqual(plan.unique_production_asset_counts, {
    backgrounds: 4,
    characters: 8,
    transients: 0,
    total: 12,
  });
  assert.equal(plan.production_assets.length, 12);
  assert.equal(plan.fallbacks.length, 2);
  assert.equal(plan.considered_not_selected.length, 11);
  assert.deepEqual(plan.gaps, []);
  assert.deepEqual(plan.task_045_handoff.new_master_requests, []);
  assert.equal(plan.task_045_handoff.expected_generation_count, 0);
  assert.equal(plan.task_045_handoff.verification_only, true);
  assert.ok(plan.episodes.every((episode) => episode.transient_asset_ids.length === 0 && episode.new_master_asset_ids.length === 0));
  const sources = [...plan.production_assets, ...plan.fallbacks].flatMap((asset) => asset.sources);
  assert.equal(sources.length, 42);
  assert.ok(sources.every((source) => source.bytes > 0 && /^[a-f0-9]{64}$/.test(source.sha256)));
  assert.equal(plan.considered_not_selected.filter((entry) => entry.layer === 'TRANSIENT').length, 3);
});

test('fails closed when a later blueprint diverges from assignments or art pins', () => {
  const assetByEpisode = new Map(audit.asset_plan.episodes.map((entry) => [entry.episode_id, entry]));
  const matching = audit.episode_assignments.map((entry) => ({
    episode_id: entry.episode_id,
    match_ref: entry.match_ref,
    seed: entry.seed,
    case_id: entry.case_id,
    fingerprint_id: entry.fingerprint_id,
    requested_ticket_count: entry.requested_ticket_count,
    background_asset_ids: assetByEpisode.get(entry.episode_id).background_asset_ids,
    character_pose_ids: assetByEpisode.get(entry.episode_id).character_pose_ids,
  }));
  assert.equal(assertBlueprintAssignments(audit, matching), true);

  const matchDrift = structuredClone(matching);
  matchDrift[0].match_ref = 'story.match.qc02.shift07.drift';
  assert.throws(() => assertBlueprintAssignments(audit, matchDrift), /match_ref diverges/);

  const assetDrift = structuredClone(matching);
  assetDrift[5].background_asset_ids.pop();
  assert.throws(() => assertBlueprintAssignments(audit, assetDrift), /background assignments diverge/);
});

test('commits byte-stable machine and Markdown planning reports', async () => {
  assert.equal(await readFile(EXPANSION_PLANNING_OUTPUTS.json, 'utf8'), stableExpansionPlanningJson(audit));
  assert.equal(await readFile(EXPANSION_PLANNING_OUTPUTS.markdown, 'utf8'), renderExpansionPlanningAudit(audit));
  const checked = await generateExpansionPlanningAudit({ check: true });
  assert.equal(checked.episode_assignments.length, 6);
  assert.equal(checked.asset_plan.gaps.length, 0);
});
