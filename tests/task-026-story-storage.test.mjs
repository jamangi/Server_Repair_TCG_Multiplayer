import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { createDiagnosisV2Catalogs } from '../src/builder/diagnosis-v2.mjs';
import {
  createStoryState,
  normalizeStoryMatchResult,
  reduceStory,
  storyDigest,
} from '../src/story/index.mjs';
import {
  EXPORT_VERSION,
  LOCAL_STATE_VERSION,
  createClientDataContext,
  createDefaultState,
  createExportBundle,
  migrateLocalState,
  parseImportBundle,
  stableStringify,
  validateStoryProgress,
} from '../viewer/js/play/data/client-data.mjs';
import { createStorageService } from '../viewer/js/play/storage-service.mjs';

const repositoryRoot = path.resolve(import.meta.dirname, '..');
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8'));
const baseCards = readJson('content/gameplay-v1/card-catalog.json');
const baseDecks = readJson('content/gameplay-v1/decks.json');
const catalogs = createDiagnosisV2Catalogs({
  cards: baseCards,
  decks: baseDecks,
  domain: readJson('content/gameplay-v1/domain-snapshot.json'),
  ticketContent: readJson('content/gameplay-v1/ticket-templates.json'),
});
const context = createClientDataContext({ cardCatalog: catalogs.cards, deckCatalog: catalogs.decks });
const fixtureRoot = 'content/story-v1/fixtures/runtime-proof';
const fixtureManifest = readJson(`${fixtureRoot}/manifest.json`);
const fixturePack = {
  manifest: fixtureManifest,
  registry: readJson(`${fixtureRoot}/${fixtureManifest.registry}`),
  texts: { en: readJson(`${fixtureRoot}/${fixtureManifest.text_catalogs.en}`) },
  scripts: fixtureManifest.scripts.map((filename) => readJson(`${fixtureRoot}/${filename}`)),
};

class FakeStorage {
  constructor() {
    this.values = new Map();
    this.throwOnSet = null;
  }

  getItem(key) {
    return this.values.get(key) ?? null;
  }

  setItem(key, value) {
    if (this.throwOnSet) throw this.throwOnSet;
    this.values.set(key, String(value));
  }
}

function checkpointAtStart() {
  const outcome = reduceStory(createStoryState(fixturePack), { type: 'BEGIN' }, fixturePack);
  return outcome.effects.find((effect) => effect.type === 'PERSIST_CHECKPOINT').checkpoint;
}

function driveToMatch() {
  let outcome = reduceStory(createStoryState(fixturePack), { type: 'BEGIN' }, fixturePack);
  const effects = [...outcome.effects];
  for (let step = 0; outcome.state.status === 'ACTIVE'; step += 1) {
    assert.ok(step < 32);
    outcome = reduceStory(outcome.state, outcome.state.current_statement.type === 'choice'
      ? { type: 'CHOOSE', option_id: 'inspect' }
      : { type: 'ADVANCE' }, fixturePack);
    effects.push(...outcome.effects);
  }
  return {
    state: outcome.state,
    checkpoint: effects.find((effect) =>
      effect.type === 'PERSIST_CHECKPOINT'
      && effect.checkpoint.checkpoint_id === 'checkpoint.fixture.pre-match').checkpoint,
  };
}

function engineSummary() {
  return {
    result_id: 'result.fixture.storage.001',
    match_id: 'match.fixture.storage.001',
    valid: true,
    reason_codes: ['QUEUE_EMPTY'],
    service_points_gained: 3,
    tickets_closed: 1,
    tickets_given_up: 0,
    tests_run: 2,
    isolations_accepted: 1,
    repairs_performed: 1,
    verify_passes: 1,
    documentation_actions: 1,
  };
}

function progressFromCheckpoint(checkpoint) {
  return {
    schema_version: 'story-progress-record-v1',
    pack_id: checkpoint.pack_id,
    content_version: checkpoint.content_version,
    checkpoint,
    pending_result: null,
    completed_ending_id: null,
  };
}

test('v2 local state migrates to v4, preserving records while adding Story and the SFX default', () => {
  const prior = createDefaultState(context);
  prior.storage_version = 'solo-local-state-v2';
  prior.records.profile.display_name = 'Preserved Technician';
  prior.records.settings.schema_version = 'solo-settings-v2';
  prior.records.settings.motion_preference = 'REDUCED';
  delete prior.records.settings.sfx_volume_percent;
  delete prior.records.story;
  const preserved = structuredClone(prior.records);
  preserved.settings.schema_version = 'solo-settings-v3';
  preserved.settings.sfx_volume_percent = 40;

  const migrated = migrateLocalState(prior, context);
  assert.equal(migrated.storage_version, LOCAL_STATE_VERSION);
  assert.deepEqual(
    Object.fromEntries(Object.entries(migrated.records).filter(([key]) => key !== 'story')),
    preserved,
  );
  assert.deepEqual(migrated.records.story, {
    schema_version: 'story-progress-record-v1',
    pack_id: null,
    content_version: null,
    checkpoint: null,
    pending_result: null,
    completed_ending_id: null,
  });
  assert.deepEqual(migrateLocalState(migrated, context), migrated);
});

test('Story checkpoint saves, reloads, exports, previews, and imports in the atomic local record', () => {
  const storage = new FakeStorage();
  const service = createStorageService({ storage, context, now: () => '2026-08-27T12:00:00.000Z' });
  service.load();
  const progress = progressFromCheckpoint(checkpointAtStart());
  assert.deepEqual(validateStoryProgress(progress, context), []);

  const saved = service.saveStoryProgress(progress);
  assert.deepEqual(saved.state.records.story, progress);
  assert.deepEqual(service.load().state.records.story, progress);
  const backup = service.exportBackup();
  assert.equal(backup.bundle.schema_version, EXPORT_VERSION);
  assert.deepEqual(backup.bundle.records.story, progress);
  const prepared = service.prepareImport(backup.json);
  assert.equal(prepared.preview.story.checkpoint_id, 'checkpoint.fixture.start');
  assert.equal(prepared.preview.story.completed_match_count, 0);
  assert.deepEqual(service.replaceFromImport(prepared, { confirmed: true }).state.records.story, progress);
});

test('pre-Match checkpoint and normalized pending result survive reload without active engine state', () => {
  const { state, checkpoint } = driveToMatch();
  const result = normalizeStoryMatchResult(engineSummary(), { expectedMatchRef: state.pending_match.match_ref });
  const progress = {
    ...progressFromCheckpoint(checkpoint),
    pending_result: {
      result,
      checkpoint_id: state.pending_match.pre_match_checkpoint_id,
      return_label: state.pending_match.return_label,
    },
  };
  assert.deepEqual(validateStoryProgress(progress, context), []);
  assert.equal(Object.hasOwn(progress.checkpoint, 'active_match'), false);

  const storage = new FakeStorage();
  const service = createStorageService({ storage, context });
  service.load();
  service.saveStoryProgress(progress);
  const reloaded = createStorageService({ storage, context }).load().state.records.story;
  assert.deepEqual(reloaded, progress);
  assert.equal(reloaded.pending_result.result.match_ref, 'match.fixture.diagnosis');
});

test('Story validation rejects future, extra, mismatched, duplicate, and digest-corrupt records', () => {
  const valid = progressFromCheckpoint(checkpointAtStart());

  const future = structuredClone(valid);
  future.schema_version = 'story-progress-record-v999';
  assert.ok(validateStoryProgress(future, context).some((entry) => entry.code === 'UNSUPPORTED_VERSION'));

  const extra = structuredClone(valid);
  extra.checkpoint.program_counter = 42;
  assert.ok(validateStoryProgress(extra, context).some((entry) => entry.code === 'UNKNOWN_FIELD'));

  const contentMismatch = structuredClone(valid);
  contentMismatch.content_version = 'other-content-v1';
  assert.ok(validateStoryProgress(contentMismatch, context).some((entry) => entry.code === 'CONTENT_ID_MISMATCH'));

  const corrupt = structuredClone(valid);
  corrupt.checkpoint.variables['fixture.reviewed'] = true;
  assert.ok(validateStoryProgress(corrupt, context).some((entry) => entry.code === 'DIGEST_MISMATCH'));

  const inflated = structuredClone(valid);
  inflated.checkpoint.story_service_points = 99;
  const { digest: ignoredDigest, ...inflatedBody } = inflated.checkpoint;
  inflated.checkpoint.digest = storyDigest(inflatedBody);
  assert.ok(validateStoryProgress(inflated, context).some((entry) => entry.code === 'POINT_TOTAL_MISMATCH'));

  const pending = driveToMatch();
  const mismatch = progressFromCheckpoint(pending.checkpoint);
  mismatch.pending_result = {
    result: normalizeStoryMatchResult(engineSummary(), { expectedMatchRef: 'match.fixture.diagnosis' }),
    checkpoint_id: pending.checkpoint.pending_match.pre_match_checkpoint_id,
    return_label: 'fixture.wrong-return',
  };
  assert.ok(validateStoryProgress(mismatch, context).some((entry) => entry.code === 'RESULT_MISMATCH'));
});

test('v2 exports migrate to v4 with preserved records, an empty Story record, and the SFX default', () => {
  const current = createDefaultState(context);
  current.records.profile.display_name = 'Legacy Export Technician';
  const prior = createExportBundle(current, context, '2026-08-27T12:00:00.000Z');
  prior.schema_version = 'solo-export-v2';
  prior.records.settings.schema_version = 'solo-settings-v2';
  delete prior.records.settings.sfx_volume_percent;
  delete prior.records.story;
  const preserved = structuredClone(prior.records);
  preserved.settings.schema_version = 'solo-settings-v3';
  preserved.settings.sfx_volume_percent = 40;

  const migrated = parseImportBundle(JSON.stringify(prior), context);
  assert.equal(migrated.schema_version, EXPORT_VERSION);
  assert.deepEqual(
    Object.fromEntries(Object.entries(migrated.records).filter(([key]) => key !== 'story')),
    preserved,
  );
  assert.equal(migrated.records.story.pack_id, null);
});

test('invalid Story imports and quota failures preserve the previous complete snapshot', () => {
  const storage = new FakeStorage();
  const service = createStorageService({ storage, context, now: () => '2026-08-27T12:00:00.000Z' });
  service.load();
  service.saveStoryProgress(progressFromCheckpoint(checkpointAtStart()));
  const previous = storage.values.get(service.key);

  const invalidBundle = createExportBundle(service.load().state, context, '2026-08-27T12:00:00.000Z');
  invalidBundle.records.story.checkpoint.variables['fixture.reviewed'] = true;
  assert.throws(() => service.prepareImport(stableStringify(invalidBundle)), (error) => error.code === 'INVALID_IMPORT');
  assert.equal(storage.values.get(service.key), previous);

  const prepared = service.prepareImport(service.exportBackup().json);
  prepared.bundle.records.story.unexpected = true;
  assert.throws(
    () => service.replaceFromImport(prepared, { confirmed: true }),
    (error) => error.code === 'INVALID_IMPORT',
  );
  assert.equal(storage.values.get(service.key), previous);

  const quota = new Error('full');
  quota.name = 'QuotaExceededError';
  storage.throwOnSet = quota;
  assert.throws(
    () => service.saveStoryProgress({
      schema_version: 'story-progress-record-v1',
      pack_id: null,
      content_version: null,
      checkpoint: null,
      pending_result: null,
      completed_ending_id: null,
    }),
    (error) => error.code === 'STORAGE_QUOTA_EXCEEDED',
  );
  assert.equal(storage.values.get(service.key), previous);
});
