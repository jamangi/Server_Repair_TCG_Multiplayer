import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { buildTicketsV3 } from '../src/builder/task-014.mjs';
import { validateStoryPack } from '../src/story/index.mjs';
import {
  analyzeQuietCascadeGraph,
  createQuietCascadeCampaignSettings,
  proveQuietCascadeBatches,
} from '../src/story/quiet-cascade-report.mjs';
import { loadTask014Catalogs } from '../src/simulation/simulator.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const CAMPAIGN_ROOT = path.join(ROOT, 'content/story-v1/campaigns/quiet-cascade');
const AUTOMATED_ROOT = path.join(ROOT, 'automated_games/task-027-quiet-cascade-v1');
const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const fromRoot = (relative) => readJson(path.join(ROOT, relative));

function loadBundle() {
  const manifest = readJson(path.join(CAMPAIGN_ROOT, 'manifest.json'));
  return {
    manifest,
    registry: readJson(path.join(CAMPAIGN_ROOT, manifest.registry)),
    texts: { en: readJson(path.join(CAMPAIGN_ROOT, manifest.text_catalogs.en)) },
    scripts: manifest.scripts.map((filename) => readJson(path.join(CAMPAIGN_ROOT, filename))),
  };
}

const bundle = loadBundle();
const matchRegistry = readJson(path.join(CAMPAIGN_ROOT, 'matches.json'));
const graph = readJson(path.join(CAMPAIGN_ROOT, 'graph.json'));

test('Quiet Cascade is a valid, fully reachable four-chapter Story pack', () => {
  assert.deepEqual(validateStoryPack(bundle), []);
  assert.equal(bundle.scripts.length, 4);
  const report = analyzeQuietCascadeGraph(bundle);
  assert.equal(report.counts.matches, 6);
  assert.equal(report.counts.choices, 4);
  assert.equal(report.unreachable_labels.length, 0);
  assert.deepEqual(report.cycles, []);
  assert.deepEqual(report.unique_ending_ids, [
    'ending.qc01.bounded_account',
    'ending.qc01.defensible_release',
    'ending.qc01.gate_hold',
  ]);
  assert.equal(report.counts.calls, 0);
  assert.equal(report.counts.returns, 0);
  assert.equal(report.dead_ends.length, report.counts.terminal_statements);
});

test('canonical node inventory resolves every entry, continuation, asset, character, and Match reference', () => {
  assert.equal(graph.campaign_graph_version, 'story-campaign-graph-v1');
  assert.ok(graph.node_inventory.length >= 18);
  const labels = new Set(bundle.scripts.flatMap((script) => script.statements
    .filter((statement) => statement.type === 'label').map((statement) => statement.label_id)));
  const assets = new Set(bundle.registry.assets.map((asset) => asset.asset_id));
  const characters = new Set(bundle.registry.characters.map((character) => character.character_id));
  const matches = new Set(matchRegistry.matches.map((match) => match.match_ref));
  const nodeIds = new Set();
  const inventoriedLabels = new Set();
  for (const node of graph.node_inventory) {
    assert.match(node.node_id, /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/);
    assert.equal(nodeIds.has(node.node_id), false, node.node_id);
    nodeIds.add(node.node_id);
    node.entry_labels.forEach((label) => {
      assert.ok(labels.has(label), `${node.node_id}: ${label}`);
      assert.equal(inventoriedLabels.has(label), false, `Label appears in multiple nodes: ${label}`);
      inventoriedLabels.add(label);
    });
    node.next_labels.forEach((label) => assert.ok(labels.has(label), `${node.node_id}: ${label}`));
    node.present_character_ids.forEach((id) => assert.ok(characters.has(id), `${node.node_id}: ${id}`));
    node.art.background_asset_ids.forEach((id) => assert.ok(assets.has(id), `${node.node_id}: ${id}`));
    node.art.transient_asset_ids.forEach((id) => assert.ok(assets.has(id), `${node.node_id}: ${id}`));
    if (node.match_boundary) assert.ok(matches.has(node.match_boundary.match_ref), node.node_id);
  }
  assert.ok(nodeIds.has(graph.entry_node_id));
  assert.deepEqual([...inventoriedLabels].sort(), [...labels].sort());
  const report = analyzeQuietCascadeGraph(bundle);
  assert.deepEqual(graph.checkpoint_inventory.map((entry) => entry.checkpoint_id).sort(),
    [...report.checkpoint_ids].sort());
  assert.ok(graph.checkpoint_inventory.every((entry) => nodeIds.has(entry.owner_node_id)));
});

test('six reviewed Matches cover all twelve current fingerprints exactly once', () => {
  assert.equal(matchRegistry.match_configuration_version, 'story-match-configuration-v1');
  assert.equal(matchRegistry.matches.length, 6);
  const fingerprints = matchRegistry.matches.flatMap((match) => match.allowed_fingerprint_ids);
  assert.equal(fingerprints.length, 12);
  assert.equal(new Set(fingerprints).size, 12);
  assert.equal(matchRegistry.matches.reduce((sum, match) => sum + match.requested_ticket_count, 0), 12);
  assert.ok(matchRegistry.matches.every((match) =>
    match.expected_ticket_definition_ids.length === match.requested_ticket_count
    && match.expected_ticket_snapshot_digests.length === match.requested_ticket_count));
  assert.equal(matchRegistry.builder_profile.allow_duplicate_causal_fingerprints, false);
});

test('canonical TASK-014 deck reconstructs every pinned batch and a missing response resource fails complete-or-none', async () => {
  const catalogs = await loadTask014Catalogs();
  const baseline = fromRoot('automated_games/task-014-playable-coverage-v3/settings.json');
  const settings = createQuietCascadeCampaignSettings(matchRegistry, baseline);
  const proof = proveQuietCascadeBatches(matchRegistry, settings, catalogs);
  assert.equal(proof.length, 6);
  assert.ok(proof.every((row) => row.status === 'SUCCESS' && row.exact_pin_match));

  const impossible = structuredClone(settings.setting_groups[0].ticket_source.builder_configuration);
  impossible.id = 'builder.story.quiet_cascade.missing_response_test';
  delete impossible.available_card_definition_counts['card.response.repair.boot.correct_order'];
  impossible.legal_card_definition_ids = impossible.legal_card_definition_ids
    .filter((id) => id !== 'card.response.repair.boot.correct_order');
  const failure = buildTicketsV3({ configuration: impossible, catalogs });
  assert.equal(failure.status, 'FAILURE');
  assert.ok(failure.attempts.every((attempt) => attempt.ticket_snapshots.length === 0));
});

test('committed automated campaign records six successes, identical reruns, and exact Builder pins', () => {
  const summary = readJson(path.join(AUTOMATED_ROOT, 'summary.json'));
  const matches = readJson(path.join(AUTOMATED_ROOT, 'matches.json'));
  const proof = readJson(path.join(AUTOMATED_ROOT, 'builder-proof.json'));
  assert.equal(summary.overall.requested, 6);
  assert.equal(summary.overall.succeeded, 6);
  assert.equal(summary.overall.failed, 0);
  assert.equal(summary.determinism.mismatches, 0);
  assert.equal(matches.length, 6);
  assert.ok(matches.every((row) => row.classification === 'SUCCEEDED'
    && row.determinism.identical
    && row.terminal_reason_codes.includes('QUEUE_EMPTY')));
  assert.deepEqual(matches.map((row) => row.tickets_closed), [1, 2, 2, 2, 2, 3]);
  assert.deepEqual(matches.map((row) => row.turns), [14, 93, 21, 29, 112, 217]);
  assert.equal(proof.all_batches_constructible_and_pinned, true);
  assert.equal(proof.batches.length, 6);
  assert.ok(proof.batches.every((row) => row.exact_pin_match));
});

test('generated graph report matches deterministic recomputation', () => {
  const committed = fromRoot('docs/story/reports/QUIET_CASCADE_GRAPH_REPORT.json');
  assert.deepEqual(committed, analyzeQuietCascadeGraph(bundle));
});
