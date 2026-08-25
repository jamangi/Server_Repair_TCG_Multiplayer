import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';

import { verifyCampaignArtifacts } from '../src/simulation/artifacts.mjs';
import { executeCampaign } from '../src/simulation/campaign.mjs';
import {
  createDiagnosisV2CampaignSettings,
  loadDiagnosisV2Catalogs,
  runAutomatedMatch,
} from '../src/simulation/simulator.mjs';

const DIRECTORY = path.resolve('automated_games/task-013-diagnosis-v2');

test('the diagnosis-v2 migration campaign is seat-safe, successful, and exactly reproducible', async () => {
  const catalogs = await loadDiagnosisV2Catalogs();
  const settings = createDiagnosisV2CampaignSettings(catalogs.cards.cards.map((card) => card.id));
  assert.equal(settings.version_pins.ruleset_version, 'first-version-v2');
  assert.equal(settings.version_pins.policy_versions[0], 'methodical-seat-safe-v2');
  assert.ok(settings.setting_groups.every((group) => group.match_configuration.play_context === 'TRAINING'));
  const campaign = await executeCampaign(settings, (input) => runAutomatedMatch(input, catalogs));
  assert.deepEqual(campaign.summary.overall, {
    requested: 4,
    started: 4,
    succeeded: 4,
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
  assert.ok(campaign.matches.every((row) => row.tickets_closed === 1));
  assert.ok(campaign.matches.every((row) => row.rejected_intents === 0));
  assert.deepEqual(await verifyCampaignArtifacts(DIRECTORY, settings, campaign), []);
});
