import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  buildExpansionBlueprintReport,
  enumerateExpansionRoutes,
  renderBeatSheets,
  renderRouteEndingMatrix,
  sha256,
} from '../src/story/quiet-cascade-expansion-blueprint.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const REVISION_ROOT = path.join(ROOT, 'docs/story/revisions/quiet-cascade-expansion-v3');
const readText = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const readJson = (relative) => JSON.parse(readText(relative));

function inputs() {
  const blueprint = readJson('docs/story/revisions/quiet-cascade-expansion-v3/blueprint.json');
  const loaded = Object.fromEntries(Object.entries(blueprint.inputs).map(([key, relative]) => [key, {
    raw: readText(relative),
    value: readJson(relative),
  }]));
  return {
    blueprint,
    baseGraph: loaded.base_story_graph.value,
    baseRegistry: loaded.base_story_registry.value,
    caseRegistry: loaded.case_registry.value,
    domainProof: loaded.domain_proof.value,
    matchRegistry: loaded.match_registry.value,
    builderProof: loaded.builder_proof.value,
    planningAudit: loaded.planning_audit.value,
    inputHashes: {
      blueprint: sha256(readText('docs/story/revisions/quiet-cascade-expansion-v3/blueprint.json')),
      ...Object.fromEntries(Object.entries(loaded).map(([key, entry]) => [key, sha256(entry.raw)])),
    },
  };
}

const source = inputs();
const report = buildExpansionBlueprintReport(source);

test('candidate blueprint binds exactly six sourced QC02 episodes to six real one-Ticket Matches', () => {
  assert.equal(report.status, 'NON_LIVE_CANDIDATE_NO_FINAL_DIALOGUE');
  assert.equal(source.blueprint.campaign_id, 'story.campaign.quiet_cascade.v1');
  assert.equal(source.blueprint.entry_label, 'story.qc02.entry');
  assert.deepEqual(report.episodes.map((episode) => episode.episode_id), [
    'story.shift.qc02.07',
    'story.shift.qc02.08',
    'story.shift.qc02.09',
    'story.shift.qc02.10',
    'story.shift.qc02.11',
    'story.shift.qc02.12',
  ]);
  assert.equal(new Set(report.episodes.map((episode) => episode.case_id)).size, 6);
  assert.equal(new Set(report.episodes.map((episode) => episode.learning_objective_key)).size, 6);
  assert.equal(new Set(report.episodes.map((episode) => episode.fingerprint_id)).size, 6);
  assert.equal(new Set(report.episodes.map((episode) => episode.match_ref)).size, 6);
  assert.ok(report.episodes.every((episode) => episode.gameplay_contract.requested_ticket_count === 1));
  assert.ok(report.episodes.every((episode) => episode.gameplay_contract.hidden_ticket_composition.ticket_definition_id.startsWith('ticket.generated.')));
  assert.ok(report.episodes.every((episode) => /^[a-f0-9]{64}$/.test(episode.gameplay_contract.hidden_ticket_composition.ticket_snapshot_digest)));
  assert.ok(report.episodes.every((episode) => episode.gameplay_contract.candidate_structure.hidden_truth_leaks === 0));
});

test('each exact gameplay contract carries complete diagnostic partitions, response paths, pins, and deck pressure', () => {
  for (const episode of report.episodes) {
    const contract = episode.gameplay_contract;
    assert.deepEqual(contract.builder_configuration.allowed_fingerprint_ids, [episode.fingerprint_id]);
    assert.equal(contract.builder_configuration.requested_ticket_count, 1);
    assert.equal(contract.builder_configuration.seed, contract.seed);
    assert.ok(contract.diagnostics.legal_ids.length >= contract.diagnostics.relevant_ids.length);
    assert.deepEqual(
      [...new Set([...contract.diagnostics.required_ids, ...contract.diagnostics.optional_ids])].sort(),
      contract.diagnostics.relevant_ids,
    );
    assert.ok(contract.diagnostics.required_ids.length >= 1);
    assert.ok(contract.response_path.repair_procedure_ids.length >= 1);
    assert.ok(contract.response_path.validation_procedure_ids.length >= 1);
    assert.equal(contract.deck_pressure.feasible, true);
    assert.ok(contract.deck_pressure.repair.headroom_copies >= 1);
    assert.ok(contract.deck_pressure.verify.headroom_copies >= 1);
    assert.deepEqual(contract.command_roles.catalog_exposure_ids.length, 13);
    assert.deepEqual(contract.command_roles.minimal_witness_required_ids, []);
  }
});

test('graph has one Match boundary per episode, unique durable boundaries, full reachability, and one ending', () => {
  assert.deepEqual(report.totals, {
    episodes: 6,
    matches: 6,
    tickets: 6,
    remembered_choices: 2,
    nodes: 26,
    edges: 33,
    checkpoints: 20,
    pre_match_checkpoints: 6,
    post_match_checkpoints: 6,
    endings: 1,
    routes: 256,
    new_master_assets: 0,
    transient_assets: 0,
  });
  assert.equal(new Set(report.graph.nodes.map((node) => node.node_id)).size, report.graph.nodes.length);
  assert.equal(new Set(report.graph.checkpoints.map((row) => row.checkpoint_id)).size, report.graph.checkpoints.length);
  assert.equal(report.graph.nodes.filter((node) => node.kind === 'MATCH').length, 6);
  assert.equal(report.graph.nodes.filter((node) => node.kind === 'ENDING')[0].ending_id, 'ending.qc02.current_content');
  for (const episode of report.episodes) {
    const shift = String(episode.shift_number).padStart(2, '0');
    const returnEdges = report.graph.edges.filter((edge) => edge.from.endsWith(`shift${shift}.return`));
    assert.deepEqual(returnEdges.map((edge) => edge.condition.completion).sort(), ['ABANDONED', 'COMPLETED']);
    assert.equal(new Set(returnEdges.map((edge) => edge.to)).size, 1, `${episode.episode_id} outcomes must reconverge`);
  }
});

test('bounded exhaustive route matrix covers two remembered choices, six binary outcomes, and no score gate', () => {
  const routes = enumerateExpansionRoutes(source.blueprint);
  assert.equal(routes.length, 256);
  assert.equal(new Set(routes.map((route) => route.digest)).size, 256);
  assert.deepEqual(report.route_summary.service_point_gain_distribution, {
    0: 4,
    2: 24,
    4: 60,
    6: 80,
    8: 60,
    10: 24,
    12: 4,
  });
  assert.deepEqual(report.route_summary.ending_coverage, { 'ending.qc02.current_content': 256 });
  for (const coverage of Object.values(report.route_summary.choice_coverage)) assert.deepEqual(Object.values(coverage), [128, 128]);
  for (const coverage of Object.values(report.route_summary.match_outcome_coverage)) assert.deepEqual(coverage, { COMPLETED: 128, ABANDONED: 128 });
  assert.ok(routes.every((route) => route.accepted_match_count === 6));
  assert.ok(routes.every((route) => route.canonical_story_service_points.startsWith('INHERITED_PLUS_')));
  assert.ok(routes.every((route) => route.ending_id === 'ending.qc02.current_content'));
});

test('learning, repeated practice, branches, points, checkpoints, interruptions, and follow-ons are explicit without final dialogue', () => {
  const requiredKinds = [
    'PUBLIC_SETUP', 'LEARNING', 'REPEATED_PRACTICE', 'CHECKPOINT', 'MATCH',
    'OUTCOME_BRANCH', 'SERVICE_POINT', 'INTERRUPTION', 'FOLLOW_ON',
  ];
  for (const episode of source.blueprint.episodes) {
    assert.ok(requiredKinds.every((kind) => episode.beats.some((beat) => beat.kind === kind)), episode.episode_id);
    assert.equal(episode.story_service_points.completed_valid_result, 2);
    assert.equal(episode.story_service_points.abandoned_valid_result, 0);
    assert.equal(episode.story_service_points.preserve_inherited_total, true);
    assert.equal(episode.story_service_points.gate_on_total, false);
  }
  const serialized = JSON.stringify(source.blueprint);
  assert.doesNotMatch(serialized, /"(?:say|narrate|text_id|final_dialogue)"\s*:/);
  assert.equal(report.authority_boundaries.dialogue_can_manufacture_gameplay_authority, false);
  assert.equal(report.authority_boundaries.active_match_resume, false);
  assert.equal(report.authority_boundaries.replay_mutates_canonical_progress, false);
});

test('N4 and N6 keep read-only Test evidence separate from state-changing Repair', () => {
  const stale = report.episodes.find((episode) => episode.case_id === 'exp-004').gameplay_contract;
  assert.deepEqual(stale.diagnostics.required_ids, ['test.management.event_log_freshness']);
  assert.deepEqual(stale.response_path.repair_procedure_ids, ['repair.management.clear_stale_alert_state']);
  const bmc = report.episodes.find((episode) => episode.case_id === 'exp-006').gameplay_contract;
  assert.deepEqual(bmc.diagnostics.required_ids, ['test.management.bmc_recovery_state']);
  assert.deepEqual(bmc.response_path.repair_procedure_ids, ['repair.management.recover_bmc_firmware']);
  assert.deepEqual(bmc.command_roles.minimal_witness_required_ids, []);
  assert.ok(bmc.response_path.oracle_witness.some((step) => step.action === 'RUN_DIAGNOSTIC' && step.source_definition_id === 'test.management.bmc_recovery_state'));
  assert.ok(!bmc.response_path.oracle_witness.some((step) => /tftp/i.test(step.source_definition_id ?? '')));
});

test('planning audit and current Story registry pin reuse-only scenes with no transient inserts or new masters', () => {
  const plans = new Map(source.planningAudit.asset_plan.episodes.map((row) => [row.episode_id, row]));
  for (const episode of report.episodes) {
    const plan = plans.get(episode.episode_id);
    assert.deepEqual(episode.art.background_asset_ids, plan.background_asset_ids);
    assert.deepEqual(episode.art.character_pose_ids, plan.character_pose_ids);
    assert.deepEqual(episode.art.transient_asset_ids, []);
    assert.deepEqual(plan.new_master_asset_ids, []);
  }
});

test('generated graph report, route matrix, and beat sheets are byte-current', () => {
  assert.deepEqual(readJson('docs/story/revisions/quiet-cascade-expansion-v3/GRAPH_REPORT.json'), report);
  assert.equal(fs.readFileSync(path.join(REVISION_ROOT, 'ROUTE_ENDING_MATRIX.md'), 'utf8'), renderRouteEndingMatrix(report));
  assert.equal(fs.readFileSync(path.join(REVISION_ROOT, 'BEAT_SHEETS.md'), 'utf8'), renderBeatSheets(report));
});

test('validator fails closed on assignment, objective, and art drift', () => {
  const badMatch = structuredClone(source);
  badMatch.matchRegistry.matches[0].seed = 'story.quiet_cascade.expansion.drift';
  assert.throws(() => buildExpansionBlueprintReport(badMatch), /SEED_CONFIGURATION|PLANNING_ASSIGNMENT/);

  const badObjective = structuredClone(source);
  badObjective.blueprint.episodes[1].learning_objective_key = badObjective.blueprint.episodes[0].learning_objective_key;
  assert.throws(() => buildExpansionBlueprintReport(badObjective), /DISTINCT_EPISODES/);

  const badArt = structuredClone(source);
  badArt.blueprint.episodes[0].art.background_asset_ids.reverse();
  assert.throws(() => buildExpansionBlueprintReport(badArt), /PLANNING_ASSET_PLAN/);
});
