import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { validateStoryPack } from '../src/story/index.mjs';
import {
  summarizeQuietCascadeRoutes,
  traverseQuietCascadeRoutes,
} from '../src/story/quiet-cascade-report.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const CAMPAIGN_ROOT = path.join(ROOT, 'content/story-v1/campaigns/quiet-cascade');
const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

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
const statements = bundle.scripts.flatMap((script) => script.statements);

test('production script pack remains schema-valid with unique dialogue IDs and registered speakers', () => {
  assert.deepEqual(validateStoryPack(bundle), []);
  const characters = new Set(bundle.registry.characters.map((character) => character.character_id));
  const statementIds = statements
    .filter((statement) => statement.type === 'say' || statement.type === 'narrate')
    .map((statement) => statement.statement_id);
  assert.equal(new Set(statementIds).size, statementIds.length);
  for (const statement of statements.filter((entry) => entry.type === 'say')) {
    assert.ok(characters.has(statement.speaker_key), statement.statement_id);
  }
  for (const statement of statements.filter((entry) => entry.type === 'scene')) {
    assert.notEqual(statement.checkpoint_id, null, statement.scene_id);
  }
});

test('finite production inventory uses six backgrounds, three inserts, and at most two poses for each established character', () => {
  const backgrounds = bundle.registry.assets.filter((asset) => asset.layer === 'BACKGROUND');
  const transients = bundle.registry.assets.filter((asset) => asset.layer === 'TRANSIENT');
  assert.equal(backgrounds.length, 6);
  assert.equal(transients.length, 3);
  assert.ok(bundle.registry.characters.every((character) => character.poses.length <= 2));
  assert.equal(bundle.registry.characters.length, 7);
  assert.ok(transients.every((asset) => typeof asset.alt_text_id === 'string'
    && bundle.texts.en.entries[asset.alt_text_id]));
});

test('all four remembered choices have distinct routes, typed writes, reconvergence, and later predicates', () => {
  const choices = statements.filter((statement) => statement.type === 'choice');
  const predicates = statements.filter((statement) => statement.type === 'if'
    && statement.condition.op === 'CHOICE_IS').map((statement) => statement.condition);
  assert.equal(choices.length, 4);
  for (const choice of choices) {
    assert.equal(choice.options.length, 2);
    assert.equal(new Set(choice.options.map((option) => option.jump_label)).size, 2);
    assert.ok(choice.options.every((option) => option.writes.length === 1));
    assert.ok(predicates.some((condition) => condition.choice_id === choice.choice_id), choice.choice_id);
  }
});

test('48 deterministic routes cover every choice option, both Match outcomes, and all ending bands', () => {
  const routes = traverseQuietCascadeRoutes(bundle, matchRegistry);
  const report = summarizeQuietCascadeRoutes(routes);
  assert.equal(routes.length, 48);
  assert.equal(report.route_count, 48);
  assert.equal(report.deterministic_digest_count, 48);
  assert.deepEqual(report.edge_coverage.endings, {
    'ending.qc01.bounded_account': 16,
    'ending.qc01.defensible_release': 16,
    'ending.qc01.gate_hold': 16,
  });
  for (const options of Object.values(report.edge_coverage.choices)) {
    assert.deepEqual(Object.values(options).sort((a, b) => a - b), [24, 24]);
  }
  for (const outcomes of Object.values(report.edge_coverage.match_completion)) {
    assert.ok(outcomes.COMPLETED > 0);
    assert.ok(outcomes.ABANDONED > 0);
  }
  assert.ok(routes.every((route) => route.start_match_effect_count === 6));
  assert.ok(routes.every((route) => route.checkpoint_effect_count >= 16));
  assert.ok(routes.every((route) => route.match_results.length === 6));
  assert.ok(routes.every((route) => route.branch_history.length === 4));
  assert.ok(routes.every((route) => route.speaker_visibility_violations.length === 0));
  assert.ok(routes.filter((route) => route.requested_band === 'release')
    .every((route) => route.story_service_points === 24));
  assert.ok(routes.filter((route) => route.requested_band === 'bounded')
    .every((route) => route.story_service_points === 14));
  assert.ok(routes.filter((route) => route.requested_band === 'hold')
    .every((route) => route.story_service_points === 0));
});

test('committed route matrix and ending-band transcripts are generated from current scripts', () => {
  const committed = readJson(path.join(ROOT, 'automated_games/task-027-quiet-cascade-v1/route-matrix.json'));
  const recomputed = summarizeQuietCascadeRoutes(traverseQuietCascadeRoutes(bundle, matchRegistry));
  assert.deepEqual(committed, recomputed);
  const transcript = fs.readFileSync(path.join(ROOT, 'docs/story/reports/QUIET_CASCADE_ROUTE_TRANSCRIPTS.md'), 'utf8');
  assert.match(transcript, /ending\.qc01\.defensible_release/);
  assert.match(transcript, /ending\.qc01\.bounded_account/);
  assert.match(transcript, /ending\.qc01\.gate_hold/);
});

test('source text is localized by stable ID, bounded for dialogue UI, and does not leak hidden entity IDs', () => {
  const entries = bundle.texts.en.entries;
  assert.ok(Object.keys(entries).every((id) => /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(id)));
  assert.ok(Object.values(entries).every((text) => text.length > 0 && text.length <= 420));
  const productionCopy = Object.entries(entries)
    .filter(([id]) => id.includes('.ch'))
    .map(([, text]) => text).join('\n');
  assert.doesNotMatch(productionCopy, /fault\.[a-z0-9._-]+/i);
  assert.doesNotMatch(productionCopy, /card\.(?:bench|response)\.[a-z0-9._-]+/i);
  assert.doesNotMatch(productionCopy, /fingerprint\.[a-z0-9._-]+/i);
});
