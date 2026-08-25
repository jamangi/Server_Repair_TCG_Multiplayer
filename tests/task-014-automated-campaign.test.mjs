import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';

import { verifyCampaignArtifacts } from '../src/simulation/artifacts.mjs';
import { executeCampaign } from '../src/simulation/campaign.mjs';
import {
  createTask014CampaignSettings,
  loadTask014Catalogs,
  runAutomatedMatch,
} from '../src/simulation/simulator.mjs';

const DIRECTORY = path.resolve('automated_games/task-014-playable-coverage-v3');

test('every TASK-014 fingerprint completes with seat-safe deterministic play across two deck orderings', async () => {
  const catalogs = await loadTask014Catalogs();
  const settings = createTask014CampaignSettings(catalogs);
  assert.equal(settings.setting_groups.length, 13);
  const fingerprintGroups = settings.setting_groups.filter((group) =>
    group.ticket_source.builder_configuration.allowed_fingerprint_ids.length === 1);
  assert.equal(fingerprintGroups.length, 12);
  assert.equal(new Set(fingerprintGroups.map((group) =>
    group.ticket_source.builder_configuration.allowed_fingerprint_ids[0])).size, 12);
  assert.equal(new Set(settings.setting_groups.flatMap((group) => group.seats.map((seat) => seat.deck_id))).size, 2);
  const campaign = await executeCampaign(settings, (input) => runAutomatedMatch(input, catalogs));
  assert.deepEqual(campaign.summary.overall, {
    requested: 13,
    started: 13,
    succeeded: 13,
    failed: 0,
    invalidated: 0,
    proven_stalemate: 0,
    simulation_cap: 0,
    policy_stall: 0,
    builder_unsatisfiable: 0,
    no_legal_progress_move: 0,
  });
  assert.equal(campaign.summary.determinism.mismatches, 0);
  assert.ok(campaign.matches.every((row) => row.terminal_reason_codes.includes('QUEUE_EMPTY')));
  assert.equal(campaign.matches.filter((row) => row.tickets_closed === 1).length, 12);
  assert.equal(campaign.matches.find((row) => row.setting_group_id === 'task-014-multi-ticket-resource-path').tickets_closed, 2);
  assert.ok(campaign.matches.every((row) => row.rejected_intents === 0));
  assert.deepEqual(await verifyCampaignArtifacts(DIRECTORY, settings, campaign), []);
});
