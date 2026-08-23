import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  assertSeatSafePolicyInput,
  choosePolicyIntent,
  hasLegalProgressIntent,
} from '../src/simulation/policies.mjs';
import {
  renderSummaryMarkdown,
  summarizeCampaign,
  turnDistribution,
} from '../src/simulation/report.mjs';
import {
  deterministicMismatchFields,
  executeCampaign,
} from '../src/simulation/campaign.mjs';
import {
  verifyCampaignArtifacts,
  writeCampaignArtifacts,
} from '../src/simulation/artifacts.mjs';

test('seat-safe policies prefer evidence-supported progress and never need authoritative truth', () => {
  const view = {
    player_id: 'player_a',
    knowledge_states: [{
      evidence: [{
        evidence_event_id: 'event_1',
        candidate_fault_id: 'fault.storage.cable.loose',
        disposition: 'CONFIRM',
      }],
    }],
    public_events: [],
  };
  const legalIntents = [
    { action_type: 'PASS_TURN', payload: {} },
    {
      action_type: 'COMMIT_ISOLATION',
      payload: {
        ticket_instance_id: 'ticket_1',
        candidate_fault_id: 'fault.storage.raid.controller_failed',
        cited_evidence_event_ids: ['event_1'],
      },
    },
    {
      action_type: 'COMMIT_ISOLATION',
      payload: {
        ticket_instance_id: 'ticket_1',
        candidate_fault_id: 'fault.storage.cable.loose',
        cited_evidence_event_ids: ['event_1'],
      },
    },
  ];
  const selected = choosePolicyIntent({ policyId: 'methodical-seat-safe-v1', view, legalIntents });
  assert.equal(selected.payload.candidate_fault_id, 'fault.storage.cable.loose');
  assert.equal(hasLegalProgressIntent(legalIntents), true);
  assert.doesNotThrow(() => assertSeatSafePolicyInput(view));

  assert.throws(
    () => assertSeatSafePolicyInput({ server_only_truth: { actual_present: true } }),
    /forbidden authoritative fields/,
  );
});

test('Pass remains legal but is not counted as a progress move', () => {
  const legalIntents = [{ action_type: 'PASS_TURN', payload: {} }];
  assert.equal(hasLegalProgressIntent(legalIntents), false);
  assert.deepEqual(
    choosePolicyIntent({
      policyId: 'pass-only-fixture-v1',
      view: { player_id: 'player_a' },
      legalIntents,
    }),
    legalIntents[0],
  );
});

test('campaign summaries recompute required outcome, turn, score, progress, and determinism totals', () => {
  const settings = {
    campaign_id: 'fixture-campaign',
    harness_version: 'fixture-harness-v1',
    version_pins: { ruleset_version: 'first-version-v1' },
    setting_groups: [
      { setting_group_id: 'finite' },
      { setting_group_id: 'exceptions' },
    ],
  };
  const base = {
    started: true,
    classification: 'SUCCEEDED',
    terminal_reason_codes: ['QUEUE_EMPTY'],
    no_legal_progress_move: false,
    player_service_points: [{ player_id: 'player_a', starting: 0, final: 2, net: 2 }],
    team_service_points: [],
    determinism: { identical: true, mismatch_fields: [] },
  };
  const matches = [
    { ...base, match_id: 'm1', setting_group_id: 'finite', seed: '1', turns: 2 },
    { ...base, match_id: 'm2', setting_group_id: 'finite', seed: '2', turns: 4 },
    {
      ...base,
      match_id: 'm3',
      setting_group_id: 'exceptions',
      seed: '3',
      turns: 3,
      classification: 'PROVEN_STALEMATE',
      terminal_reason_codes: ['STALEMATE'],
      no_legal_progress_move: true,
    },
    {
      ...base,
      match_id: 'm4',
      setting_group_id: 'exceptions',
      seed: '4',
      turns: 0,
      started: false,
      classification: 'BUILDER_UNSATISFIABLE',
      terminal_reason_codes: ['BUILDER_UNSATISFIABLE'],
      player_service_points: [],
    },
  ];
  const summary = summarizeCampaign(settings, matches);
  assert.deepEqual(summary.overall, {
    requested: 4,
    started: 3,
    succeeded: 2,
    failed: 2,
    invalidated: 0,
    proven_stalemate: 1,
    simulation_cap: 0,
    policy_stall: 0,
    builder_unsatisfiable: 1,
    no_legal_progress_move: 1,
  });
  assert.deepEqual(turnDistribution([1, 2, 4, 9]), {
    count: 4,
    minimum: 1,
    median: 3,
    p95: 9,
    maximum: 9,
    mean: 4,
  });
  assert.equal(summary.determinism.mismatches, 0);
  assert.equal(summary.progress_move_audit.any_no_legal_progress_move, true);
  assert.deepEqual(summary.by_setting_group[0].results_by_seed, [{
    classification: 'SUCCEEDED',
    terminal_reason_codes: ['QUEUE_EMPTY'],
    seeds: ['1', '2'],
  }]);
  assert.deepEqual(summary.service_points.player_profiles[0], {
    setting_group_id: 'exceptions',
    player_id: 'player_a',
    starting: 0,
    final: 2,
    net: 2,
    seeds: ['3'],
  });
  const markdown = renderSummaryMarkdown(summary);
  assert.match(markdown, /Results by setting and seed/);
  assert.match(markdown, /\| finite \| SUCCEEDED \| QUEUE_EMPTY \| 1, 2 \|/);
  assert.match(markdown, /\| finite \| Player \| player_a \| 0 \| 2 \| 2 \| 1, 2 \|/);
  assert.match(markdown, /Mismatches: \*\*0\*\*/);
});

test('campaign orchestration reruns identical inputs and retains exceptions only', async () => {
  const settings = {
    campaign_id: 'orchestration-fixture',
    harness_version: 'fixture-v1',
    version_pins: { ruleset_version: 'first-version-v1' },
    setting_groups: [
      { setting_group_id: 'ok', seeds: ['a'] },
      { setting_group_id: 'cap', seeds: ['b'] },
    ],
  };
  const runCounts = new Map();
  const result = await executeCampaign(settings, async ({ setting_group: group, seed }) => {
    const key = `${group.setting_group_id}:${seed}`;
    runCounts.set(key, (runCounts.get(key) ?? 0) + 1);
    const classification = group.setting_group_id === 'ok' ? 'SUCCEEDED' : 'SIMULATION_CAP';
    return {
      match_id: `match-${key}`,
      setting_group_id: group.setting_group_id,
      seed,
      started: true,
      classification,
      terminal_reason_codes: classification === 'SUCCEEDED' ? ['QUEUE_EMPTY'] : ['SIMULATION_CAP'],
      turns: classification === 'SUCCEEDED' ? 3 : 2,
      ticket_snapshot_digest: 'ticket-digest',
      replay_digest: `replay-${key}`,
      outcome: { reason: classification },
      scores: { player_a: classification === 'SUCCEEDED' ? 2 : 0 },
      no_legal_progress_move: false,
      player_service_points: [{ player_id: 'player_a', starting: 0, final: 0, net: 0 }],
      team_service_points: [],
    };
  });
  assert.deepEqual([...runCounts.values()], [2, 2]);
  assert.equal(result.matches.length, 2);
  assert.equal(result.summary.determinism.mismatches, 0);
  assert.deepEqual([...result.exceptions.keys()], ['match-cap:b.json']);
  assert.deepEqual(
    deterministicMismatchFields(
      { ticket_snapshot_digest: 'a', replay_digest: 'a', outcome: {}, scores: {}, turns: 1 },
      { ticket_snapshot_digest: 'a', replay_digest: 'b', outcome: {}, scores: {}, turns: 1 },
    ),
    ['replay_digest'],
  );
});

test('campaign artifact verification detects any report drift', async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'server-repair-campaign-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const settings = {
    campaign_id: 'artifact-fixture',
    harness_version: 'fixture-v1',
    version_pins: { ruleset_version: 'first-version-v1' },
    setting_groups: [{ setting_group_id: 'one', seeds: ['seed'] }],
  };
  const campaign = await executeCampaign(settings, async ({ seed }) => ({
    match_id: 'artifact-match',
    setting_group_id: 'one',
    seed,
    started: true,
    classification: 'SUCCEEDED',
    terminal_reason_codes: ['QUEUE_EMPTY'],
    turns: 1,
    ticket_snapshot_digest: 'tickets',
    replay_digest: 'replay',
    outcome: { winner_player_ids: ['player_a'] },
    scores: { player_a: 2 },
    no_legal_progress_move: false,
    player_service_points: [{ player_id: 'player_a', starting: 0, final: 2, net: 2 }],
    team_service_points: [],
  }));
  await writeCampaignArtifacts(directory, settings, campaign);
  assert.deepEqual(await verifyCampaignArtifacts(directory, settings, campaign), []);
  await fs.writeFile(path.join(directory, 'summary.md'), 'drift\n', 'utf8');
  assert.deepEqual(
    await verifyCampaignArtifacts(directory, settings, campaign),
    ['summary.md: differs from deterministic recomputation'],
  );
});
