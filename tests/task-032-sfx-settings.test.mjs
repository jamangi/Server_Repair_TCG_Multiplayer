import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { createDiagnosisV2Catalogs } from '../src/builder/diagnosis-v2.mjs';
import {
  EXPORT_VERSION,
  LOCAL_STATE_VERSION,
  SETTINGS_VERSION,
  SUPPORTED_PRIOR_EXPORT_VERSIONS,
  createClientDataContext,
  createDefaultState,
  createExportBundle,
  createImportPreview,
  migrateExportBundle,
  migrateLocalState,
  validateSettings,
} from '../viewer/js/play/data/client-data.mjs';
import { createStorageService } from '../viewer/js/play/storage-service.mjs';

const repositoryRoot = path.resolve(import.meta.dirname, '..');
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8'));
const diagnosisCatalogs = createDiagnosisV2Catalogs({
  cards: readJson('content/gameplay-v1/card-catalog.json'),
  decks: readJson('content/gameplay-v1/decks.json'),
  domain: readJson('content/gameplay-v1/domain-snapshot.json'),
  ticketContent: readJson('content/gameplay-v1/ticket-templates.json'),
});
const context = createClientDataContext({
  cardCatalog: diagnosisCatalogs.cards,
  deckCatalog: diagnosisCatalogs.decks,
});

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, String(value)); }
}

test('sound volume defaults to 40 and strict validation accepts only integer 0 through 100', () => {
  const settings = createDefaultState(context).records.settings;
  assert.equal(settings.schema_version, SETTINGS_VERSION);
  assert.equal(settings.sfx_volume_percent, 40);
  for (const value of [0, 40, 100]) {
    assert.deepEqual(validateSettings({ ...settings, sfx_volume_percent: value }, context), []);
  }
  for (const value of [-1, 101, 40.5, '40', null]) {
    assert.match(
      validateSettings({ ...settings, sfx_volume_percent: value }, context).map((error) => error.code).join(' '),
      /INVALID_SFX_VOLUME/,
    );
  }
});

test('supported v2/v3 local records migrate to v4 with the bounded default and preserve other records', () => {
  const current = createDefaultState(context);
  for (const version of ['solo-local-state-v2', 'solo-local-state-v3']) {
    const prior = structuredClone(current);
    prior.storage_version = version;
    prior.records.settings.schema_version = 'solo-settings-v2';
    delete prior.records.settings.sfx_volume_percent;
    if (version === 'solo-local-state-v2') delete prior.records.story;
    const migrated = migrateLocalState(prior, context);
    assert.equal(migrated.storage_version, LOCAL_STATE_VERSION);
    assert.equal(migrated.records.settings.schema_version, SETTINGS_VERSION);
    assert.equal(migrated.records.settings.sfx_volume_percent, 40);
    assert.deepEqual(migrated.records.profile, current.records.profile);
    assert.deepEqual(migrated.records.decks, current.records.decks);
    assert.deepEqual(migrated.records.statistics, current.records.statistics);
  }
});

test('v2/v3 backups migrate to v4 and volume round-trips through export, preview, import, and reset', () => {
  assert.deepEqual([...SUPPORTED_PRIOR_EXPORT_VERSIONS], ['solo-export-v2', 'solo-export-v3']);
  const current = createDefaultState(context);
  current.records.settings.sfx_volume_percent = 73;
  const bundle = createExportBundle(current, context, '2026-08-28T12:00:00.000Z');
  assert.equal(bundle.schema_version, EXPORT_VERSION);
  assert.equal(createImportPreview(bundle, context).settings.sfx_volume_percent, 73);

  for (const version of SUPPORTED_PRIOR_EXPORT_VERSIONS) {
    const prior = structuredClone(bundle);
    prior.schema_version = version;
    prior.records.settings.schema_version = 'solo-settings-v2';
    delete prior.records.settings.sfx_volume_percent;
    if (version === 'solo-export-v2') delete prior.records.story;
    const migrated = migrateExportBundle(prior, context);
    assert.equal(migrated.schema_version, EXPORT_VERSION);
    assert.equal(migrated.records.settings.sfx_volume_percent, 40);
  }

  const backing = new MemoryStorage();
  const service = createStorageService({ storage: backing, context, now: () => '2026-08-28T12:00:00.000Z' });
  service.load();
  const saved = service.load().state.records.settings;
  saved.sfx_volume_percent = 73;
  service.saveSettings(saved);
  assert.equal(service.load().state.records.settings.sfx_volume_percent, 73);
  let storyValidationCalls = 0;
  service.setStoryImportValidator(() => { storyValidationCalls += 1; });
  const prepared = service.prepareImport(service.exportBackup().json);
  assert.equal(prepared.preview.settings.sfx_volume_percent, 73);
  assert.equal(storyValidationCalls, 0, 'the strict all-null Story record is a portable not-started state');
  const invalid = JSON.parse(service.exportBackup().json);
  invalid.records.settings.sfx_volume_percent = 101;
  assert.throws(() => service.prepareImport(JSON.stringify(invalid)), (error) => error.code === 'INVALID_IMPORT');
  assert.equal(service.load().state.records.settings.sfx_volume_percent, 73, 'rejected import leaves storage unchanged');
  assert.equal(service.replaceFromImport(prepared, { confirmed: true }).state.records.settings.sfx_volume_percent, 73);
  assert.equal(service.reset({ confirmed: true }).state.records.settings.sfx_volume_percent, 40);
});
