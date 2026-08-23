import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';

import { verifyCampaignArtifacts } from '../src/simulation/artifacts.mjs';
import { executeCampaign } from '../src/simulation/campaign.mjs';
import {
  FOUNDATION_CAMPAIGN_ID,
  createFoundationCampaignSettings,
  loadFoundationCatalogs,
  runAutomatedMatch,
} from '../src/simulation/simulator.mjs';

const CAMPAIGN_DIRECTORY = path.resolve('automated_games/task-009-foundation-v1');

async function fixture() {
  const catalogs = await loadFoundationCatalogs();
  const settings = createFoundationCampaignSettings(catalogs.cards.cards.map((card) => card.id));
  return { catalogs, settings };
}

test('foundation campaign matrix covers modes, sources, queue forms, seats, policies, seeds, and exceptions', async () => {
  const { settings } = await fixture();
  assert.equal(settings.campaign_id, FOUNDATION_CAMPAIGN_ID);
  assert.equal(settings.version_pins.ruleset_version, 'first-version-v1');
  assert.equal(settings.setting_groups.length, 11);
  assert.ok(settings.setting_groups.every((group) => group.seeds.length >= 2));
  assert.ok(settings.setting_groups.every((group) => group.caps.turns > 0 && group.caps.closures > 0));

  assert.deepEqual(
    [...new Set(settings.setting_groups.map((group) => group.collaboration_mode))].sort(),
    ['competitive', 'cooperative'],
  );
  assert.deepEqual(
    [...new Set(settings.setting_groups.map((group) => group.ticket_source.source_type))].sort(),
    ['fixed', 'generated'],
  );
  assert.ok(settings.setting_groups.some((group) => group.match_configuration.queue_minimum === 0));
  assert.ok(settings.setting_groups.some((group) => group.match_configuration.queue_minimum > 0));

  const cooperativeSeatCounts = new Set(settings.setting_groups
    .filter((group) => group.collaboration_mode === 'cooperative')
    .map((group) => group.seats.length));
  assert.ok(cooperativeSeatCounts.has(1));
  assert.ok(cooperativeSeatCounts.has(2));
  assert.ok(cooperativeSeatCounts.has(4));
  const competitiveSeatCounts = new Set(settings.setting_groups
    .filter((group) => group.collaboration_mode === 'competitive')
    .map((group) => group.seats.length));
  assert.ok(competitiveSeatCounts.has(2));
  assert.ok(competitiveSeatCounts.has(3));

  const policies = new Set(settings.setting_groups.flatMap((group) =>
    group.seats.map((seat) => seat.policy_id)));
  assert.deepEqual([...policies].sort(), [...settings.version_pins.policy_versions].sort());
  assert.ok(settings.setting_groups.some((group) => new Set(group.seats.map((seat) => seat.policy_id)).size > 1));

  const fixtures = new Set(settings.setting_groups.map((group) => group.fixture_kind));
  for (const required of [
    'BUILDER_UNSATISFIABLE',
    'PROVEN_STALEMATE',
    'ADMIN_INVALIDATION',
    'SIMULATION_CAP',
    'POLICY_STALL',
  ]) assert.ok(fixtures.has(required));
  assert.doesNotMatch(JSON.stringify(settings), /EX1-/);
});

test('a computer match repeats exactly through private projection and legal intents', async () => {
  const { catalogs, settings } = await fixture();
  const group = settings.setting_groups.find((entry) =>
    entry.setting_group_id === 'coop-fixed-finite-solo-methodical');
  const input = {
    campaign_id: settings.campaign_id,
    version_pins: settings.version_pins,
    setting_group: group,
    seed: group.seeds[0],
  };
  const first = await runAutomatedMatch(structuredClone(input), catalogs);
  const second = await runAutomatedMatch(structuredClone(input), catalogs);
  assert.deepEqual(second, first);
  assert.equal(first.classification, 'SUCCEEDED');
  assert.deepEqual(first.terminal_reason_codes, ['QUEUE_EMPTY']);
  assert.equal(first.tickets_closed, 1);
  assert.equal(first.team_service_points[0].net, 2);
  assert.equal(first.outcome.winning_team_ids[0], 'team.cooperative');
  assert.doesNotMatch(
    JSON.stringify(first),
    /server_only_truth|authored_evidence_outcomes|authored_repair_outcomes|authored_verification_outcomes|random_state|deck_order/,
  );
});

test('generated and unsatisfiable groups preserve the complete-or-none Builder boundary', async () => {
  const { catalogs, settings } = await fixture();
  const generated = settings.setting_groups.find((entry) =>
    entry.setting_group_id === 'coop-generated-finite-pair-publication');
  const unsatisfiable = settings.setting_groups.find((entry) =>
    entry.setting_group_id === 'fixture-builder-unsatisfiable');
  const common = { campaign_id: settings.campaign_id, version_pins: settings.version_pins };
  const generatedRow = await runAutomatedMatch({
    ...common,
    setting_group: generated,
    seed: generated.seeds[0],
  }, catalogs);
  assert.equal(generatedRow.classification, 'SUCCEEDED');
  assert.equal(generatedRow.started, true);
  assert.equal(generatedRow.ticket_snapshot_digest.length, 64);

  const failureRow = await runAutomatedMatch({
    ...common,
    setting_group: unsatisfiable,
    seed: unsatisfiable.seeds[0],
  }, catalogs);
  assert.equal(failureRow.classification, 'BUILDER_UNSATISFIABLE');
  assert.equal(failureRow.started, false);
  assert.equal(failureRow.tickets_closed, 0);
  assert.ok(failureRow.builder_diagnostic_codes.includes('REQUESTED_COUNT_UNSATISFIABLE'));
});

test('scripted cooperative and competitive policies reproduce the two replay behavior classes', async () => {
  const { catalogs, settings } = await fixture();
  const common = { campaign_id: settings.campaign_id, version_pins: settings.version_pins };
  const cooperative = settings.setting_groups.find((entry) =>
    entry.setting_group_id === 'coop-fixed-failed-verify-scripted');
  const competitive = settings.setting_groups.find((entry) =>
    entry.setting_group_id === 'competitive-fixed-finite-pair-scripted');
  const cooperativeRow = await runAutomatedMatch({
    ...common,
    setting_group: cooperative,
    seed: cooperative.seeds[0],
  }, catalogs);
  const competitiveRow = await runAutomatedMatch({
    ...common,
    setting_group: competitive,
    seed: competitive.seeds[0],
  }, catalogs);

  assert.equal(cooperativeRow.classification, 'SUCCEEDED');
  assert.equal(cooperativeRow.team_service_points[0].net, 4);
  assert.equal(cooperativeRow.contribution_counts.reduce((sum, row) => sum + row.failed_verifies, 0), 1);
  assert.equal(cooperativeRow.contribution_counts.reduce((sum, row) => sum + row.repairs, 0), 2);

  assert.equal(competitiveRow.classification, 'SUCCEEDED');
  assert.equal(competitiveRow.contribution_counts.reduce((sum, row) => sum + row.failed_verifies, 0), 1);
  assert.ok(competitiveRow.contribution_counts.every((row) => row.documentation > 0));
  assert.ok(competitiveRow.player_service_points.every((row) => row.net > 0));
});

test('the committed campaign and every retained exception reproduce exactly', async () => {
  const { catalogs, settings } = await fixture();
  const campaign = await executeCampaign(settings, (input) => runAutomatedMatch(input, catalogs));
  assert.equal(campaign.matches.length, 22);
  assert.equal(campaign.exceptions.size, 10);
  assert.deepEqual(campaign.summary.overall, {
    requested: 22,
    started: 20,
    succeeded: 12,
    failed: 10,
    invalidated: 2,
    proven_stalemate: 2,
    simulation_cap: 2,
    policy_stall: 2,
    builder_unsatisfiable: 2,
    no_legal_progress_move: 6,
  });
  const byClassification = Object.groupBy(campaign.matches, (row) => row.classification);
  assert.ok(byClassification.SIMULATION_CAP.every((row) =>
    row.turns === 3
      && row.outcome.winner_player_ids.length === 0
      && row.outcome.winning_team_ids.length === 0));
  assert.ok(byClassification.PROVEN_STALEMATE.every((row) =>
    row.no_legal_progress_move
      && row.terminal_reason_codes.includes('STALEMATE')
      && row.outcome.winning_team_ids.length === 0));
  assert.ok(byClassification.INVALIDATED.every((row) =>
    row.outcome.valid === false && row.terminal_reason_codes.includes('ADMIN_INVALIDATION')));
  assert.ok(byClassification.POLICY_STALL.every((row) =>
    row.terminal_reason_codes.includes('POLICY_STALL')
      && row.outcome.winner_player_ids.length === 0));
  assert.ok(byClassification.BUILDER_UNSATISFIABLE.every((row) =>
    !row.started && row.tickets_closed === 0));
  assert.equal(campaign.summary.determinism.mismatches, 0);
  assert.deepEqual(await verifyCampaignArtifacts(CAMPAIGN_DIRECTORY, settings, campaign), []);
});
