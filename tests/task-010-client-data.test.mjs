import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { validateJsonSchema } from './helpers/json-schema-validator.mjs';
import {
  CARD_CATALOG_VERSION,
  ClientDataError,
  EXPORT_VERSION,
  LOCAL_STATE_VERSION,
  MAX_IMPORT_BYTES,
  RESULT_SUMMARY_VERSION,
  RULESET_VERSION,
  STARTER_LOCAL_DECK_ID,
  SUPPORTED_PRIOR_STORAGE_VERSIONS,
  applyMatchResult,
  assertValidLocalState,
  createClientDataContext,
  createDeckDraft,
  createDefaultState,
  createExportBundle,
  createImportPreview,
  deleteDeck,
  deriveLevel,
  migrateLocalState,
  migrateExportBundle,
  parseImportBundle,
  recordMatchStart,
  saveDeck,
  setActiveDeck,
  stableStringify,
  validateDeckDraft,
  validateExportBundle,
  validateLocalState,
  validateResultSummary,
} from '../viewer/js/play/data/client-data.mjs';
import { createStorageService } from '../viewer/js/play/storage-service.mjs';
import { createDiagnosisV2Catalogs } from '../src/builder/diagnosis-v2.mjs';

const repositoryRoot = path.resolve(import.meta.dirname, '..');
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8'));
const baseCardCatalog = readJson('content/gameplay-v1/card-catalog.json');
const baseDeckCatalog = readJson('content/gameplay-v1/decks.json');
const diagnosisCatalogs = createDiagnosisV2Catalogs({
  cards: baseCardCatalog,
  decks: baseDeckCatalog,
  domain: readJson('content/gameplay-v1/domain-snapshot.json'),
  ticketContent: readJson('content/gameplay-v1/ticket-templates.json'),
});
const cardCatalog = diagnosisCatalogs.cards;
const deckCatalog = diagnosisCatalogs.decks;
const context = createClientDataContext({ cardCatalog, deckCatalog });

const schemaFiles = fs.readdirSync(path.join(repositoryRoot, 'schemas/client'))
  .filter((name) => name.endsWith('.json'))
  .sort()
  .map((name) => ({
    filePath: path.join(repositoryRoot, 'schemas/client', name),
    schema: readJson(`schemas/client/${name}`),
  }));
const storySchemaFiles = fs.readdirSync(path.join(repositoryRoot, 'schemas/story'))
  .filter((name) => name.endsWith('.json'))
  .sort()
  .map((name) => ({
    filePath: path.join(repositoryRoot, 'schemas/story', name),
    schema: readJson(`schemas/story/${name}`),
  }));
const allSchemaFiles = [...schemaFiles, ...storySchemaFiles];
const registry = {
  schemas: allSchemaFiles,
  byId: new Map(allSchemaFiles.map(({ schema }) => [schema.$id, schema])),
};
const schemaByTitle = new Map(allSchemaFiles.map(({ schema }) => [schema.title, schema]));

class FakeStorage {
  constructor() {
    this.values = new Map();
    this.throwOnGet = null;
    this.throwOnSet = null;
  }

  getItem(key) {
    if (this.throwOnGet) throw this.throwOnGet;
    return this.values.get(key) ?? null;
  }

  setItem(key, value) {
    if (this.throwOnSet) throw this.throwOnSet;
    this.values.set(key, String(value));
  }
}

function resultSummary(overrides = {}) {
  return {
    summary_version: RESULT_SUMMARY_VERSION,
    result_id: 'result.solo-001',
    match_id: 'match.solo-001',
    reason_codes: ['QUEUE_EMPTY'],
    valid: true,
    matches_completed: 1,
    solo_wins: 1,
    solo_losses: 0,
    solo_stalemates: 0,
    invalid_or_capped_results: 0,
    tickets_closed: 3,
    starting_service_points: 0,
    final_service_points: 5,
    service_points_gained: 5,
    tests_run: 7,
    isolations_accepted: 3,
    isolations_rejected: 1,
    repairs_performed: 3,
    verify_attempts: 4,
    verify_passes: 3,
    verify_failures: 1,
    verify_inconclusive: 0,
    documentation_actions: 2,
    assists: 1,
    failed_verifies: 1,
    redundant_or_superseded_actions: 2,
    turns_elapsed: 8,
    elapsed_seconds: 225,
    search_uses: 1,
    refresh_uses: 1,
    eliminations_recorded: 2,
    tickets_given_up: 0,
    ...overrides,
  };
}

test('all versioned client examples satisfy their strict JSON Schemas', () => {
  assert.equal(schemaFiles.length, 10);
  const examples = [
    ['examples/client/local_profile.default.json', 'Solo Pages Local Profile v2'],
    ['examples/client/deck_collection.default.json', 'Solo Pages Response Deck Collection v2'],
    ['examples/client/local_settings.default.json', 'Solo Pages Local Settings v3'],
    ['examples/client/aggregate_statistics.empty.json', 'Solo Pages Aggregate Statistics v2'],
    ['examples/story/progress.empty.json', 'Solo Story progress record v1'],
  ];
  for (const [file, title] of examples) {
    const errors = validateJsonSchema(readJson(file), schemaByTitle.get(title), registry);
    assert.deepEqual(errors, [], `${file}\n${errors.join('\n')}`);
  }
  const exportSchema = schemaByTitle.get('Solo Pages Export Bundle v4');
  assert.equal(exportSchema.$id, 'https://example.local/client/export_bundle.schema.json');
  const legacy = readJson('examples/client/export_bundle.default.json');
  assert.equal(legacy.schema_version, 'solo-export-v2');
  const migrated = migrateExportBundle(legacy, context);
  assert.equal(migrated.schema_version, EXPORT_VERSION);
  assert.deepEqual(validateJsonSchema(migrated, exportSchema, registry), []);
});

test('first run copies the exact diagnosis-v2 response deck and pins content versions', () => {
  const state = createDefaultState(context);
  assert.equal(state.storage_version, LOCAL_STATE_VERSION);
  assert.equal(state.records.decks.ruleset_version, RULESET_VERSION);
  assert.equal(state.records.decks.card_catalog_version, CARD_CATALOG_VERSION);
  assert.equal(state.records.decks.active_deck_id, STARTER_LOCAL_DECK_ID);
  const localDeck = state.records.decks.decks[0];
  const canonical = deckCatalog.decks.find((deck) => deck.id === 'deck.core.storage_response_v2');
  assert.deepEqual(localDeck.card_definition_ids, canonical.card_definition_ids);
  assert.equal(localDeck.source_deck_id, canonical.id);
  assert.equal(localDeck.deck_id, STARTER_LOCAL_DECK_ID);
  assert.equal(state.records.profile.icon_id, 'cosmetic.profile.systems');
  assert.deepEqual(validateLocalState(state, context), []);
});

test('strict local validation rejects unknown fields, IDs, unsafe names, invalid versions, and illegal decks', () => {
  const source = createDefaultState(context);

  const unknownField = structuredClone(source);
  unknownField.records.profile.email = 'not-allowed@example.invalid';
  assert.match(validateLocalState(unknownField, context).map((entry) => entry.code).join(' '), /UNKNOWN_FIELD/);

  const badName = structuredClone(source);
  badName.records.profile.display_name = ' unsafe\n';
  assert.match(validateLocalState(badName, context).map((entry) => entry.code).join(' '), /INVALID_NAME/);

  const unknownIcon = structuredClone(source);
  unknownIcon.records.profile.icon_id = 'cosmetic.profile.unknown';
  assert.match(validateLocalState(unknownIcon, context).map((entry) => entry.code).join(' '), /UNKNOWN_ID/);

  const future = structuredClone(source);
  future.records.settings.schema_version = 'solo-settings-v999';
  assert.match(validateLocalState(future, context).map((entry) => entry.code).join(' '), /UNSUPPORTED_VERSION/);

  const unknownCard = structuredClone(source);
  unknownCard.records.decks.decks[0].card_definition_ids[0] = 'card.core.not_published';
  assert.match(validateLocalState(unknownCard, context).map((entry) => entry.code).join(' '), /UNKNOWN_ID/);

  const seventhCopy = structuredClone(source.records.decks.decks[0]);
  seventhCopy.card_definition_ids[3] = seventhCopy.card_definition_ids[0];
  assert.match(validateDeckDraft(seventhCopy, context, { requireLegal: true }).map((entry) => entry.code).join(' '), /DECK_COPY_LIMIT/);
});

test('deck drafts remain detached until a legal save and active deletion chooses the next ID deterministically', () => {
  const source = createDefaultState(context).records.decks;
  const draft = createDeckDraft(source, context, {
    idFactory: () => 'test-draft',
    displayName: 'Storage Copy',
  });
  assert.equal(draft.deck_id, 'deck.local.test-draft');
  assert.equal(draft.card_definition_ids.length, 0);
  assert.equal(source.decks.length, 1, 'creating/cancelling a draft must not mutate saved decks');
  assert.throws(() => saveDeck(source, draft, context), (error) => error.code === 'INVALID_DECK');

  draft.card_definition_ids = [...source.decks[0].card_definition_ids];
  const saved = saveDeck(source, draft, context);
  assert.equal(saved.decks.length, 2);
  assert.equal(source.decks.length, 1, 'save is pure');
  const activeDraft = setActiveDeck(saved, draft.deck_id, context);
  assert.equal(activeDraft.active_deck_id, draft.deck_id);
  const remaining = deleteDeck(activeDraft, draft.deck_id, context);
  assert.equal(remaining.active_deck_id, STARTER_LOCAL_DECK_ID);
  const empty = deleteDeck(remaining, STARTER_LOCAL_DECK_ID, context);
  assert.equal(empty.active_deck_id, null);
  assert.equal(empty.decks.length, 0);
});

test('v1 storage coexists while v2/v3 migrate explicitly to v4 with bounded settings defaults', () => {
  assert.deepEqual([...SUPPORTED_PRIOR_STORAGE_VERSIONS], ['solo-local-state-v1', 'solo-local-state-v2', 'solo-local-state-v3']);
  const current = createDefaultState(context);
  assert.deepEqual(migrateLocalState(current, context), current);
  const prior = structuredClone(current);
  prior.storage_version = 'solo-local-state-v2';
  delete prior.records.story;
  prior.records.settings.schema_version = 'solo-settings-v2';
  delete prior.records.settings.sfx_volume_percent;
  const migrated = migrateLocalState(prior, context);
  assert.equal(migrated.storage_version, LOCAL_STATE_VERSION);
  assert.equal(migrated.records.settings.schema_version, 'solo-settings-v3');
  assert.equal(migrated.records.settings.sfx_volume_percent, 40);
  assert.equal(migrated.records.story.schema_version, 'story-progress-record-v1');
  const priorV3 = structuredClone(current);
  priorV3.storage_version = 'solo-local-state-v3';
  priorV3.records.settings.schema_version = 'solo-settings-v2';
  delete priorV3.records.settings.sfx_volume_percent;
  assert.equal(migrateLocalState(priorV3, context).records.settings.sfx_volume_percent, 40);
  const future = structuredClone(current);
  future.storage_version = 'solo-local-state-v999';
  assert.throws(() => migrateLocalState(future, context), (error) => error.code === 'UNSUPPORTED_VERSION');
  const v1 = structuredClone(current);
  v1.storage_version = 'solo-local-state-v1';
  assert.throws(() => migrateLocalState(v1, context), (error) => error.code === 'LEGACY_PROFILE_COEXISTS');
});

test('Worker safe summaries aggregate exactly once per result and completed Match ID', () => {
  const empty = createDefaultState(context).records.statistics;
  const started = recordMatchStart(empty, 'match.solo-001', context);
  assert.equal(started.applied, true);
  assert.equal(started.value.totals.matches_started, 1);
  assert.equal(recordMatchStart(started.value, 'match.solo-001', context).applied, false);

  assert.deepEqual(validateResultSummary(resultSummary()), []);
  const applied = applyMatchResult(started.value, resultSummary(), context);
  assert.equal(applied.applied, true);
  assert.deepEqual(applied.value.processed_match_results, [{
    match_id: 'match.solo-001',
    result_id: 'result.solo-001',
  }]);
  assert.equal(applied.value.totals.matches_completed, 1);
  assert.equal(applied.value.totals.solo_wins, 1);
  assert.equal(applied.value.totals.tickets_closed, 3);
  assert.equal(applied.value.totals.tests, 7);
  assert.equal(applied.value.totals.accepted_isolations, 3);
  assert.equal(applied.value.totals.rejected_isolations, 1);
  assert.equal(applied.value.totals.repairs, 3);
  assert.equal(applied.value.totals.verify_attempts, 4);
  assert.equal(applied.value.totals.verify_failures, 1);
  assert.equal(applied.value.totals.failed_verify, 1);
  assert.equal(applied.value.totals.documentation, 2);
  assert.equal(applied.value.totals.eliminations_recorded, 2);
  assert.equal(applied.value.totals.tickets_given_up, 0);
  assert.equal(applied.value.totals.authoritative_elapsed_seconds, 225);
  assert.equal(applyMatchResult(applied.value, resultSummary(), context).applied, false);
  assert.throws(
    () => applyMatchResult(applied.value, resultSummary({ result_id: 'result.solo-conflict' }), context),
    (error) => error.code === 'RESULT_ID_CONFLICT',
  );
});

test('Level derivation uses the approved clamp and ten-point formula', () => {
  assert.equal(deriveLevel(-101), 0);
  assert.equal(deriveLevel(-1), 0);
  assert.equal(deriveLevel(0), 0);
  assert.equal(deriveLevel(5), 0);
  assert.equal(deriveLevel(10), 1);
  assert.equal(deriveLevel(100), 10);
  assert.equal(deriveLevel(Number.NaN), 0);
});

test('export/import round trips strictly, previews replacement, and excludes active Match State', () => {
  const state = createDefaultState(context);
  const bundle = createExportBundle(state, context, '2026-08-23T12:00:00.000Z');
  assert.deepEqual(validateExportBundle(bundle, context), []);
  const text = `${stableStringify(bundle, 2)}\n`;
  const parsed = parseImportBundle(text, context);
  assert.deepEqual(parsed, bundle);
  const preview = createImportPreview(parsed, context);
  assert.equal(preview.replacement_allowed, true);
  assert.equal(preview.profile.display_name, 'Night Technician');
  assert.equal(preview.deck_count, 1);
  assert.equal(preview.active_deck.deck_id, STARTER_LOCAL_DECK_ID);
  assert.equal(preview.statistics.level, 0);
  assert.equal(Object.hasOwn(bundle, 'active_match'), false);
  assert.equal(JSON.stringify(bundle).includes('server_only_truth'), false);
});

test('imports reject oversize, corrupt, incompatible, prototype-polluting, unknown-field, and invalid-deck input', () => {
  const source = createExportBundle(createDefaultState(context), context, '2026-08-23T12:00:00.000Z');
  assert.throws(() => parseImportBundle('not json', context), (error) => error.code === 'CORRUPT_IMPORT');
  assert.throws(() => parseImportBundle(' '.repeat(MAX_IMPORT_BYTES + 1), context), (error) => error.code === 'OVERSIZED_IMPORT');

  const future = structuredClone(source);
  future.schema_version = 'solo-export-v999';
  assert.throws(() => parseImportBundle(JSON.stringify(future), context), (error) => error.code === 'UNSUPPORTED_VERSION');

  const unknown = structuredClone(source);
  unknown.records.profile.unexpected = true;
  assert.throws(() => parseImportBundle(JSON.stringify(unknown), context), (error) => error.code === 'INVALID_IMPORT');

  const invalidDeck = structuredClone(source);
  invalidDeck.records.decks.decks[0].card_definition_ids.pop();
  assert.throws(() => parseImportBundle(JSON.stringify(invalidDeck), context), (error) => error.code === 'INVALID_IMPORT');

  const pollutedText = JSON.stringify(source).replace('{', '{"__proto__":{"polluted":true},');
  assert.throws(() => parseImportBundle(pollutedText, context), (error) => error.code === 'UNSAFE_IMPORT');
  assert.equal({}.polluted, undefined);
});

test('storage validates every read, requires destructive confirmation, and recovers corrupt data only explicitly', () => {
  const storage = new FakeStorage();
  const service = createStorageService({
    storage,
    context,
    now: () => '2026-08-23T12:00:00.000Z',
    idFactory: () => 'service-draft',
  });
  const initial = service.load();
  assert.equal(initial.persistence, 'LOCAL_STORAGE');
  assert.equal(initial.recovery_required, false);
  assert.equal(initial.state.records.decks.active_deck_id, STARTER_LOCAL_DECK_ID);
  assert.throws(() => service.reset(), (error) => error.code === 'CONFIRMATION_REQUIRED');
  assert.throws(() => service.deleteDeck(STARTER_LOCAL_DECK_ID), (error) => error.code === 'CONFIRMATION_REQUIRED');

  const key = service.key;
  storage.values.set(key, '{"storage_version":"solo-local-state-v999"}');
  const corrupt = service.load();
  assert.equal(corrupt.recovery_required, true);
  assert.equal(corrupt.diagnostic.code, 'UNSUPPORTED_VERSION');
  assert.throws(() => service.saveProfile(corrupt.state.records.profile), (error) => error.code === 'RECOVERY_REQUIRED');
  const reset = service.reset({ confirmed: true });
  assert.equal(reset.recovery_required, false);
  assert.doesNotThrow(() => assertValidLocalState(JSON.parse(storage.values.get(key)), context));
});

test('storage import replacement is atomic, revalidates at commit, and supplies the current backup first', () => {
  const storage = new FakeStorage();
  const service = createStorageService({ storage, context, now: () => '2026-08-23T12:00:00.000Z' });
  service.load();
  const originalRaw = storage.values.get(service.key);
  const exported = service.exportBackup();
  const edited = structuredClone(exported.bundle);
  edited.records.profile.display_name = 'Imported Technician';
  const prepared = service.prepareImport(JSON.stringify(edited));
  assert.match(prepared.current_backup.filename, /server-repair-solo-backup/);
  assert.equal(prepared.preview.profile.display_name, 'Imported Technician');
  assert.throws(() => service.replaceFromImport(prepared), (error) => error.code === 'CONFIRMATION_REQUIRED');
  assert.equal(storage.values.get(service.key), originalRaw);

  const tampered = structuredClone(prepared);
  tampered.bundle.records.profile.unknown = true;
  assert.throws(
    () => service.replaceFromImport(tampered, { confirmed: true }),
    (error) => error.code === 'INVALID_IMPORT',
  );
  assert.equal(storage.values.get(service.key), originalRaw);

  const replaced = service.replaceFromImport(prepared, { confirmed: true });
  assert.equal(replaced.state.records.profile.display_name, 'Imported Technician');
});

test('quota failures preserve the previous persistent snapshot and memory-only fallback remains usable', () => {
  const storage = new FakeStorage();
  const service = createStorageService({ storage, context });
  const initial = service.load();
  const rawBefore = storage.values.get(service.key);
  const profile = structuredClone(initial.state.records.profile);
  profile.display_name = 'Cannot Persist';
  const quota = new Error('full');
  quota.name = 'QuotaExceededError';
  storage.throwOnSet = quota;
  assert.throws(() => service.saveProfile(profile), (error) => error.code === 'STORAGE_QUOTA_EXCEEDED');
  assert.equal(storage.values.get(service.key), rawBefore);
  assert.equal(service.load().state.records.profile.display_name, 'Night Technician');

  const memory = createStorageService({ storage: null, context });
  assert.equal(memory.load().persistence, 'MEMORY');
  const memoryProfile = memory.load().state.records.profile;
  memoryProfile.display_name = 'Memory Technician';
  assert.equal(memory.saveProfile(memoryProfile).state.records.profile.display_name, 'Memory Technician');

  const blockedStorage = new FakeStorage();
  blockedStorage.throwOnGet = new Error('blocked');
  const blocked = createStorageService({ storage: blockedStorage, context });
  assert.equal(blocked.load().persistence, 'MEMORY');
  const blockedProfile = blocked.load().state.records.profile;
  blockedProfile.display_name = 'Blocked Storage Session';
  assert.equal(blocked.saveProfile(blockedProfile).state.records.profile.display_name, 'Blocked Storage Session');
});
