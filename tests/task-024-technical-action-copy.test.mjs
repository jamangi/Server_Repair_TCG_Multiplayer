import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { createTask014Catalogs } from '../src/builder/task-014.mjs';
import {
  EXPANDED_CARD_CATALOG_VERSION,
  PRIOR_EXPANDED_CARD_CATALOG_VERSION,
  createClientDataContext,
  createDefaultState,
  migrateLocalState,
} from '../viewer/js/play/data/client-data.mjs';
import {
  resolveCardTechnicalCopy,
  technicalNoteLabel,
} from '../viewer/js/play/technical-action-copy.mjs';
import { validateTask024TechnicalCopy } from '../viewer/scripts/technical-copy-quality.mjs';
import { loadSchemaRegistry, validateJsonSchema } from './helpers/json-schema-validator.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(ROOT, relative), 'utf8'));
const raw = {
  cards: readJson('content/gameplay-v1/card-catalog-v3.json'),
  decks: readJson('content/gameplay-v1/decks-v3.json'),
  domain: readJson('content/gameplay-v1/domain-snapshot-v2.json'),
  parts: readJson('content/gameplay-v1/task-014-parts.json'),
  coverage: readJson('content/gameplay-v1/playable-coverage-v3.json'),
};
const glossary = readJson('content/gameplay-v1/technical-action-glossary-v1.json');
const ledger = readJson('content/gameplay-v1/technical-copy-review-v1.json');
const catalogs = createTask014Catalogs(raw);
const domainById = new Map(raw.domain.entities.map((record) => [record.id, record]));
const selectedIds = raw.coverage.selected_action_definition_ids;

function cardForDomain(domainId) {
  return raw.cards.cards.find((card) => card.primary_domain_reference.entity_id === domainId);
}

test('all 71 published actions pass family, provenance, acronym, and copy-drift validation', () => {
  assert.deepEqual(validateTask024TechnicalCopy({
    entities: raw.domain.entities,
    cards: raw.cards.cards,
    selectedIds,
    glossary,
    ledger,
  }), []);
  assert.deepEqual(
    Object.fromEntries(['test', 'command', 'repair_procedure', 'validation_procedure'].map((type) => [
      type,
      selectedIds.filter((id) => domainById.get(id)?.entity_type === type).length,
    ])),
    { test: 37, command: 13, repair_procedure: 12, validation_procedure: 9 },
  );
});

test('Memory Diagnostic teaches the observed signal and expands DIMM and ECC', () => {
  const record = domainById.get('test.memory.diagnostic');
  const card = cardForDomain(record.id);
  const copy = resolveCardTechnicalCopy(card, domainById);
  assert.match(copy.description, /exercises/i);
  assert.match(copy.description, /observing/i);
  assert.match(copy.description, /dual in-line memory modules \(DIMMs\)/i);
  assert.match(copy.description, /error-correcting code \(ECC\)/i);
  assert.equal(card.presentation.short_description, record.presentation.short_description);
  assert.doesNotMatch(card.presentation.short_description, /gathers troubleshooting evidence/i);
  assert.equal(copy.game.result, 'Adds one diagnostic finding to the work record');
});

test('Power Distribution Path Isolation preserves its method and labels its warning as safety guidance', () => {
  const record = domainById.get('test.power.distribution_path_isolation');
  const copy = resolveCardTechnicalCopy(cardForDomain(record.id), domainById);
  assert.match(copy.description, /known-good power supply units/i);
  assert.match(copy.note, /Do not live-probe undocumented connectors/i);
  assert.equal(technicalNoteLabel(record), 'Safety note');
});

test('shared presentation resolves named Library routes and omits absent optional notes', () => {
  for (const id of [
    'test.memory.diagnostic',
    'command.linux.dmesg',
    'repair.memory.replace_dimm',
    'verify.memory.full_test',
  ]) {
    const record = domainById.get(id);
    const copy = resolveCardTechnicalCopy(cardForDomain(id), domainById);
    assert.equal(copy.description, record.presentation.short_description);
    assert.ok(copy.references.every((reference) => reference.name && reference.href.startsWith('#/library/')));
    assert.ok(copy.references.every((reference) => !/^\w+\.[a-z0-9_.-]+$/.test(reference.name)));
  }
  const fixture = structuredClone(domainById.get('test.memory.diagnostic'));
  delete fixture.education_text;
  const fixtureMap = new Map(domainById);
  fixtureMap.set(fixture.id, fixture);
  const copy = resolveCardTechnicalCopy(cardForDomain(fixture.id), fixtureMap);
  assert.equal(copy.note, '');
  assert.equal(copy.noteLabel, null);
});

test('publication fails closed for a missing or placeholder required description', () => {
  for (const replacement of ['', 'Memory Diagnostic gathers troubleshooting evidence.']) {
    const entities = structuredClone(raw.domain.entities);
    entities.find((record) => record.id === 'test.memory.diagnostic').presentation.short_description = replacement;
    const errors = validateTask024TechnicalCopy({
      entities,
      cards: raw.cards.cards,
      selectedIds,
      glossary,
      ledger,
    });
    assert.ok(errors.some((message) => /test\.memory\.diagnostic/.test(message)));
  }
});

test('glossary and review ledger validate against their versioned schemas', () => {
  const registry = loadSchemaRegistry(ROOT);
  const byTitle = new Map(registry.schemas.map(({ schema }) => [schema.title, schema]));
  assert.deepEqual(validateJsonSchema(glossary, byTitle.get('Technical action glossary'), registry), []);
  assert.deepEqual(validateJsonSchema(ledger, byTitle.get('Technical copy review ledger'), registry), []);
});

test('technical-copy catalog migration preserves stable saved deck identities and card IDs', () => {
  const clientContext = createClientDataContext({ cardCatalog: catalogs.cards, deckCatalog: catalogs.decks });
  const prior = createDefaultState(clientContext);
  prior.records.decks.card_catalog_version = PRIOR_EXPANDED_CARD_CATALOG_VERSION;
  const before = structuredClone(prior.records.decks.decks);
  const migrated = migrateLocalState(prior, clientContext);
  assert.equal(migrated.records.decks.card_catalog_version, EXPANDED_CARD_CATALOG_VERSION);
  assert.deepEqual(migrated.records.decks.decks, before);
});
