import assert from 'node:assert/strict';
import fs from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { validateStoryPack } from '../src/story/index.mjs';
import {
  summarizeQuietCascadeRoutes,
  traverseQuietCascadeRoutes,
} from '../src/story/quiet-cascade-report.mjs';
import {
  STORY_PROGRESS_BACKUP_VERSION,
  STORY_PROGRESS_STORAGE_KEY,
  createStoryClient,
} from '../viewer/js/play/story-client.mjs';
import {
  QUIET_CASCADE_CHARACTERIZATION_CONTENT_VERSION,
  QUIET_CASCADE_V1_CONTENT_VERSION,
} from '../viewer/js/play/story-content-migration.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const OLD_ROOT = path.join(ROOT, 'content/story-v1/campaigns/quiet-cascade');
const NEW_ROOT = path.join(ROOT, 'content/story-v1/campaigns/quiet-cascade-characterization-v2');
const repositoryRoot = new URL('../', import.meta.url);
const oldRootUrl = new URL('content/story-v1/campaigns/quiet-cascade/', repositoryRoot);
const newRootUrl = new URL('content/story-v1/campaigns/quiet-cascade-characterization-v2/', repositoryRoot);
const runtimeUrl = new URL('src/story/index.mjs', repositoryRoot);
const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

function loadBundle(root) {
  const manifest = readJson(path.join(root, 'manifest.json'));
  return {
    manifest,
    registry: readJson(path.join(root, manifest.registry)),
    texts: { en: readJson(path.join(root, manifest.text_catalogs.en)) },
    scripts: manifest.scripts.map((relative) => readJson(path.join(root, relative))),
  };
}

async function fileFetch(input) {
  try {
    const url = input instanceof URL ? input : new URL(input);
    const value = JSON.parse(await readFile(fileURLToPath(url), 'utf8'));
    return { ok: true, status: 200, async json() { return structuredClone(value); } };
  } catch {
    return { ok: false, status: 404, async json() { throw new Error('not found'); } };
  }
}

function memoryStorage(initial = null) {
  const values = new Map();
  if (initial !== null) values.set(STORY_PROGRESS_STORAGE_KEY, JSON.stringify(initial));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    record() { return JSON.parse(values.get(STORY_PROGRESS_STORAGE_KEY)); },
  };
}

async function makeClient({ storage, rootUrl, launch = { current: null } }) {
  return createStoryClient({
    storageImpl: storage,
    fetchImpl: fileFetch,
    rootUrl,
    runtimeUrl,
    onStartMatch(value) { launch.current = value; },
  });
}

async function advanceToMatch(client, launch) {
  for (let step = 0; step < 120 && !launch.current; step += 1) {
    const scene = client.sceneModel();
    if (scene.choices.length) await client.choose(scene.choices[0].optionId);
    else if (scene.controls.advance) await client.advance();
    else break;
  }
  assert.ok(launch.current, 'expected authored Match boundary');
}

function completedResult(context, sequence) {
  return {
    schema_version: 'story-match-result-v1',
    result_id: `result.local.story.migration${sequence}`,
    match_id: `local.story.migration${sequence}`,
    match_ref: context.match_ref,
    completion: 'COMPLETED',
    valid: true,
    reason_codes: ['QUEUE_EXHAUSTED'],
    story_service_points_gained: 4,
    tickets_closed: 1,
    tickets_given_up: 0,
    documented_outcome: true,
    verified_outcome: true,
    contributions: {
      tests_run: 2,
      isolations_accepted: 1,
      repairs_performed: 1,
      verify_passes: 1,
      documentation_actions: 1,
    },
  };
}

const oldBundle = loadBundle(OLD_ROOT);
const newBundle = loadBundle(NEW_ROOT);
const matchRegistry = readJson(path.join(NEW_ROOT, 'matches.json'));
const comparison = readJson(path.join(
  ROOT,
  'docs/story/revisions/quiet-cascade-characterization-v2/FINAL_DIALOGUE_COMPARISON.json',
));

test('successor content is valid, complete, localized, and preserves immutable source history', () => {
  assert.deepEqual(validateStoryPack(newBundle), []);
  assert.equal(oldBundle.manifest.content_version, QUIET_CASCADE_V1_CONTENT_VERSION);
  assert.equal(newBundle.manifest.content_version, QUIET_CASCADE_CHARACTERIZATION_CONTENT_VERSION);
  for (const filename of ['graph.json', 'matches.json', 'registry.json']) {
    assert.deepEqual(fs.readFileSync(path.join(NEW_ROOT, filename)), fs.readFileSync(path.join(OLD_ROOT, filename)));
  }
  const statements = newBundle.scripts.flatMap((script) => script.statements);
  assert.equal(statements.length, 335);
  assert.equal(statements.filter((entry) => entry.type === 'say').length, 100);
  assert.equal(statements.filter((entry) => entry.type === 'narrate').length, 6);
  const copy = Object.values(newBundle.texts.en.entries);
  assert.ok(copy.every((value) => value.length > 0 && value.length <= 420));
  assert.doesNotMatch(copy.join('\n'), /fault\.[a-z0-9._-]+|card\.(?:bench|response)\.[a-z0-9._-]+|fingerprint\.[a-z0-9._-]+/i);
});

test('all TASK-034 payload rows integrate once with reviewed voice and restrained texture', () => {
  assert.deepEqual(comparison.semantic_payload_amendments, []);
  assert.deepEqual(comparison.totals, {
    comparisons: 124,
    original_surfaces: 113,
    additions: 11,
    context_revisions: 85,
    voice_revisions: 51,
    final_changes_from_v1: 94,
    routes: 48,
  });
  assert.equal(new Set(comparison.rows.map((row) => row.candidate_id)).size, 124);
  const texture = comparison.rows.filter((row) => row.personal_texture);
  assert.equal(texture.length, 7);
  assert.equal(comparison.texture_policy.marked_dialogue_moments, 7);
  assert.equal(comparison.texture_policy.final_dialogue_moments, 100);
  assert.equal(new Set(texture.map((row) => row.speaker_or_source)).size, 7);
  assert.ok(comparison.rows.every((row) => row.final.length <= 420));
  assert.ok(fs.statSync(path.join(
    ROOT,
    'docs/story/revisions/quiet-cascade-characterization-v2/FINAL_ROUTE_TRANSCRIPTS.md',
  )).size > 500_000);
});

test('all topology, choice, Match, route, checkpoint, and ending contracts remain stable', () => {
  const oldStructural = oldBundle.scripts.flatMap((script) => script.statements)
    .filter((statement) => !['say', 'narrate'].includes(statement.type));
  const newStructural = newBundle.scripts.flatMap((script) => script.statements)
    .filter((statement) => !['say', 'narrate'].includes(statement.type));
  assert.deepEqual(newStructural, oldStructural);
  const report = summarizeQuietCascadeRoutes(traverseQuietCascadeRoutes(newBundle, matchRegistry));
  assert.equal(report.route_count, 48);
  assert.equal(report.deterministic_digest_count, 48);
  assert.equal(matchRegistry.matches.length, 6);
  assert.deepEqual(Object.keys(report.edge_coverage.endings).sort(), [
    'ending.qc01.bounded_account',
    'ending.qc01.defensible_release',
    'ending.qc01.gate_hold',
  ]);
  assert.equal(newStructural.filter((entry) => entry.type === 'choice').length, 4);
  assert.ok(traverseQuietCascadeRoutes(newBundle, matchRegistry)
    .every((route) => route.start_match_effect_count === 6 && route.speaker_visibility_violations.length === 0));
});

test('v1 scene, pre-Match, pending-result, post-Match, and ending records migrate at the same durable boundary', async () => {
  const oldStorage = memoryStorage();
  const launch = { current: null };
  const oldClient = await makeClient({ storage: oldStorage, rootUrl: oldRootUrl, launch });
  await oldClient.openPrimary();
  const sceneRecord = structuredClone(oldStorage.record());

  await advanceToMatch(oldClient, launch);
  const preMatchRecord = structuredClone(oldStorage.record());
  await oldClient.stageMatchResult(completedResult(launch.current.context, 1), launch.current.context);
  const pendingRecord = structuredClone(oldStorage.record());
  launch.current = null;
  await oldClient.continueFromMatch();
  const postMatchRecord = structuredClone(oldStorage.record());

  let resultSequence = 2;
  for (let step = 0; step < 800 && oldClient.homeModel().status !== 'COMPLETE'; step += 1) {
    if (launch.current) {
      await oldClient.stageMatchResult(completedResult(launch.current.context, resultSequence), launch.current.context);
      resultSequence += 1;
      launch.current = null;
      await oldClient.continueFromMatch();
      continue;
    }
    const scene = oldClient.sceneModel();
    if (scene.choices.length) await oldClient.choose(scene.choices[0].optionId);
    else if (scene.controls.advance) await oldClient.advance();
    else break;
  }
  assert.equal(oldClient.homeModel().status, 'COMPLETE');
  const endingRecord = structuredClone(oldStorage.record());

  for (const [record, status] of [
    [sceneRecord, 'READY'],
    [preMatchRecord, 'INTERRUPTED_MATCH'],
    [pendingRecord, 'RESULT_READY'],
    [postMatchRecord, 'READY'],
    [endingRecord, 'COMPLETE'],
  ]) {
    const storage = memoryStorage(record);
    const client = await makeClient({ storage, rootUrl: newRootUrl });
    assert.equal(client.error, null);
    assert.equal(client.homeModel().status, status);
    const migrated = storage.record();
    assert.equal(migrated.content_version, QUIET_CASCADE_CHARACTERIZATION_CONTENT_VERSION);
    assert.equal(migrated.checkpoint?.checkpoint_id ?? null, record.checkpoint?.checkpoint_id ?? null);
    assert.notEqual(migrated.checkpoint?.digest ?? null, record.checkpoint?.digest ?? null);
  }

  const routeStorage = memoryStorage(preMatchRecord);
  const routeLaunch = { current: null };
  const routeClient = await makeClient({ storage: routeStorage, rootUrl: newRootUrl, launch: routeLaunch });
  assert.deepEqual(await routeClient.openPrimary(), { route: '#/play/game' });
  assert.equal(routeLaunch.current.context.checkpoint_id, preMatchRecord.checkpoint.checkpoint_id);
  routeClient.reloadProgress({ notify: false });
  assert.equal(routeClient.homeModel().status, 'INTERRUPTED_MATCH');

  const importStorage = memoryStorage();
  const importClient = await makeClient({ storage: importStorage, rootUrl: newRootUrl });
  const prepared = importClient.prepareImport({
    backup_version: STORY_PROGRESS_BACKUP_VERSION,
    exported_at: '2026-08-28T12:00:00.000Z',
    progress: postMatchRecord,
  });
  assert.equal(prepared.value.content_version, QUIET_CASCADE_CHARACTERIZATION_CONTENT_VERSION);
  importClient.replaceFromImport(prepared, { confirmed: true });
  assert.equal(JSON.parse(importClient.exportProgress().json).progress.content_version,
    QUIET_CASCADE_CHARACTERIZATION_CONTENT_VERSION);
});

test('migration fails closed for a tampered digest and an unknown content version', async () => {
  const sourceStorage = memoryStorage();
  const sourceClient = await makeClient({ storage: sourceStorage, rootUrl: oldRootUrl });
  await sourceClient.openPrimary();
  const tampered = sourceStorage.record();
  tampered.checkpoint.story_service_points += 1;
  const tamperedClient = await makeClient({ storage: memoryStorage(tampered), rootUrl: newRootUrl });
  assert.match(tamperedClient.error, /digest|points/i);
  assert.equal(tamperedClient.homeModel().status, 'RECOVERY_REQUIRED');

  const unknown = sourceStorage.record();
  unknown.content_version = 'quiet-cascade-future-v99';
  unknown.checkpoint.content_version = unknown.content_version;
  const unknownClient = await makeClient({ storage: memoryStorage(unknown), rootUrl: newRootUrl });
  assert.match(unknownClient.error, /unsupported version or content pack/i);
});
