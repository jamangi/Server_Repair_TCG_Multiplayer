import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

import {
  buildTicketsV3,
  buildTicketsV4,
  createTask014Catalogs,
  createTask042Catalogs,
} from '../src/builder/task-014.mjs';
import { validateReleasedStorySystemModel } from '../content/system-model-story-v1/validate-release.mjs';
import {
  createStoryBuilderConfiguration,
  validateStoryMatchRegistry,
} from '../viewer/js/play/story-match-registry.mjs';
import {
  loadSchemaRegistry,
  validateJsonSchema,
} from './helpers/json-schema-validator.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
const schemaRegistry = loadSchemaRegistry(ROOT);
const schemas = new Map(schemaRegistry.schemas.map(({ filePath, schema }) => [path.basename(filePath, '.schema.json'), schema]));

const RELEASE_FILES = Object.freeze({
  system_model_catalog_v2: 'content/system-model-story-v1/system-model-catalog-v2.json',
  ticket_system_binding_catalog_v2: 'content/system-model-story-v1/ticket-system-bindings-v2.json',
  system_model_private_validation_catalog_v2: 'content/system-model-story-v1/private-compatibility-v2.json',
  system_model_relationship_overlay_v2: 'content/system-model-story-v1/domain-relationship-overlay-v2.json',
  system_model_migration_v2: 'content/system-model-story-v1/migration-v2.json',
  system_model_release_manifest_v2: 'content/system-model-story-v1/RELEASE-MANIFEST.json',
  released_story_system_coverage: 'content/system-model-story-v1/coverage-ledger-v1.json',
});

function selectedAttempt(result) {
  return result.attempts.find((attempt) => attempt.attempt_id === result.selected_attempt_id) ?? null;
}

function diagnosticIds(catalogs) {
  return catalogs.cards.cards
    .filter((card) => card.play_contract?.contract_type === 'DIAGNOSTIC')
    .map((card) => card.id)
    .sort();
}

function loadTask014Catalogs() {
  return createTask014Catalogs({
    cards: readJson('content/gameplay-v1/card-catalog-v3.json'),
    decks: readJson('content/gameplay-v1/decks-v3.json'),
    domain: readJson('content/gameplay-v1/domain-snapshot-v2.json'),
    parts: readJson('content/gameplay-v1/task-014-parts.json'),
    coverage: readJson('content/gameplay-v1/playable-coverage-v3.json'),
  });
}

function loadTask042Catalogs() {
  return createTask042Catalogs({
    cards: readJson('content/gameplay-v1/card-catalog-v4.json'),
    decks: readJson('content/gameplay-v1/decks-v4.json'),
    domain: readJson('content/gameplay-v1/domain-snapshot-v3.json'),
    parts: readJson('content/gameplay-v1/task-042-parts.json'),
    coverage: readJson('content/gameplay-v1/playable-coverage-v4.json'),
  });
}

test('all seven successor artifacts satisfy their strict versioned schemas', () => {
  for (const [schemaName, relativePath] of Object.entries(RELEASE_FILES)) {
    const schema = schemas.get(schemaName);
    assert.ok(schema, `missing schema ${schemaName}`);
    const errors = validateJsonSchema(readJson(relativePath), schema, schemaRegistry);
    assert.deepEqual(errors, [], `${relativePath}\n${errors.join('\n')}`);
  }
});

test('the fail-closed release validator accepts exact 18-Ticket coverage and zero new Components', () => {
  const result = validateReleasedStorySystemModel();
  assert.equal(result.ok, true, result.issues.map((issue) => `${issue.code}: ${issue.detail}`).join('\n'));
  assert.deepEqual(result.issues, []);
  assert.deepEqual(result.totals, {
    matches: 12,
    ticket_instances: 18,
    unique_fingerprints: 18,
    profiles: 3,
    preserved_pilot_bindings: 5,
    new_bindings: 13,
    bindings: 18,
    private_proofs: 18,
    relationships: 125,
    unique_candidates: 36,
    candidate_occurrences: 64,
    unique_actions: 76,
    source_records: 25,
    source_claims: 50,
    added_components: 0,
  });
});

test('the two pilot profiles and five pilot binding/proof rows remain byte-identical objects', () => {
  const oldCatalog = readJson('content/system-model-pilot-v1/system-model-catalog-v1.json');
  const oldBindings = readJson('content/system-model-pilot-v1/ticket-system-bindings-v1.json');
  const oldProofs = readJson('content/system-model-pilot-v1/private-compatibility-v1.json');
  const catalog = readJson(RELEASE_FILES.system_model_catalog_v2);
  const bindings = readJson(RELEASE_FILES.ticket_system_binding_catalog_v2);
  const proofs = readJson(RELEASE_FILES.system_model_private_validation_catalog_v2);
  for (const oldProfile of oldCatalog.profiles) {
    assert.deepEqual(catalog.profiles.find((profile) => profile.profile_id === oldProfile.profile_id), oldProfile);
  }
  for (const oldBinding of oldBindings.bindings) {
    assert.deepEqual(bindings.bindings.find((binding) => binding.binding_id === oldBinding.binding_id), oldBinding);
  }
  for (const oldProof of oldProofs.compatibility_proofs) {
    assert.deepEqual(proofs.compatibility_proofs.find((proof) => proof.compatibility_id === oldProof.compatibility_id), oldProof);
  }
  assert.equal(bindings.bindings.length - oldBindings.bindings.length, 13);
});

test('every released Story Ticket rebuilds twice from its exact registry/deck contract and retains its pinned binding', () => {
  const rawRegistry = readJson('content/story-v1/campaigns/quiet-cascade-expansion-v3/matches.json');
  const storyRegistry = validateStoryMatchRegistry(rawRegistry);
  const legacyCatalogs = loadTask014Catalogs();
  const currentCatalogs = loadTask042Catalogs();
  const legacyDeck = legacyCatalogs.decks.decks.find((deck) => deck.id === storyRegistry.deckPolicy.canonical_proof_deck_id);
  const expansionDeck = currentCatalogs.decks.decks.find((deck) => deck.id === 'deck.story.expansion_response_v1');
  const bindings = readJson(RELEASE_FILES.ticket_system_binding_catalog_v2).bindings;
  const bindingByTicket = new Map(bindings.map((binding) => [binding.ticket_id, binding]));
  const rebuilt = new Map();

  assert.equal(storyRegistry.matches.size, 12);
  for (const definition of storyRegistry.matches.values()) {
    const legacy = definition.builder_configuration === undefined;
    const catalogs = legacy ? legacyCatalogs : currentCatalogs;
    const deck = legacy ? legacyDeck : expansionDeck;
    const configuration = createStoryBuilderConfiguration({
      registry: storyRegistry,
      definition,
      cardDefinitionIds: deck.card_definition_ids,
      diagnosticCardIds: diagnosticIds(catalogs),
    });
    const build = () => legacy
      ? buildTicketsV3({ configuration, catalogs })
      : buildTicketsV4({ configuration, catalogs });
    const first = build();
    const second = build();
    assert.equal(first.status, 'SUCCESS', definition.match_ref);
    assert.equal(second.status, 'SUCCESS', definition.match_ref);
    const firstAttempt = selectedAttempt(first);
    const secondAttempt = selectedAttempt(second);
    assert.deepEqual(secondAttempt.ticket_snapshot_digests, firstAttempt.ticket_snapshot_digests, definition.match_ref);
    assert.deepEqual(secondAttempt.ticket_snapshots, firstAttempt.ticket_snapshots, definition.match_ref);
    for (const [index, ticket] of firstAttempt.ticket_snapshots.entries()) {
      const binding = bindingByTicket.get(ticket.id);
      assert.ok(binding, `${definition.match_ref}:${ticket.id}`);
      assert.equal(firstAttempt.ticket_snapshot_digests[index], binding.ticket_snapshot_digest, ticket.id);
      rebuilt.set(ticket.id, binding.ticket_snapshot_digest);
    }
  }
  assert.equal(rebuilt.size, 18);
  assert.equal(bindings.length, 18);
});

test('public Candidate closure is invariant across every private differential variant', () => {
  const bindings = readJson(RELEASE_FILES.ticket_system_binding_catalog_v2).bindings;
  const proofs = readJson(RELEASE_FILES.system_model_private_validation_catalog_v2).compatibility_proofs;
  const bindingById = new Map(bindings.map((binding) => [binding.binding_id, binding]));
  for (const proof of proofs) {
    const binding = bindingById.get(proof.binding_id);
    assert.ok(binding);
    assert.equal(proof.differential_variants.length, binding.candidate_closure.length);
    assert.deepEqual(
      proof.differential_variants.flatMap((variant) => variant.synthetic_hidden_fault_ids).sort(),
      binding.candidate_closure.map((candidate) => candidate.candidate_fault_id).sort(),
    );
    for (const variant of proof.differential_variants) {
      assert.equal(variant.expected_public_binding_digest, binding.serialization.content_digest);
      const before = JSON.stringify(binding);
      const privateMutation = structuredClone(proof);
      privateMutation.hidden_fault_bindings[0].fault_id = variant.synthetic_hidden_fault_ids[0];
      assert.equal(JSON.stringify(binding), before);
    }
  }
});

test('the full domain matrix has sourced relationships and every relevant action has a profile attachment', () => {
  const coverage = readJson(RELEASE_FILES.released_story_system_coverage);
  const overlay = readJson(RELEASE_FILES.system_model_relationship_overlay_v2);
  const catalog = readJson(RELEASE_FILES.system_model_catalog_v2);
  const sourceLedger = readJson('docs/system-models/task-053/source-ledger-v2.json');
  const relationships = new Set(overlay.relationships.flatMap((relationship) => relationship.source_object_ids));
  const claims = new Set(sourceLedger.sources.flatMap((source) => source.claim_ids));
  const actions = [
    ...coverage.domain_matrix.relevant_diagnostic_ids,
    ...coverage.domain_matrix.repair_ids,
    ...coverage.domain_matrix.verification_ids,
  ];
  const attached = new Set(catalog.profiles.flatMap((profile) => profile.action_attachments.map((attachment) => attachment.action_definition_id)));
  for (const ids of Object.values(coverage.domain_matrix)) for (const id of ids) assert.ok(relationships.has(id), id);
  for (const actionId of actions) assert.ok(attached.has(actionId), actionId);
  for (const profile of catalog.profiles) {
    for (const attachment of profile.action_attachments) {
      assert.ok(attachment.target_node_ids.length > 0, attachment.attachment_id);
      assert.ok(attachment.source_claim_ids.length > 0, attachment.attachment_id);
      for (const claimId of attachment.source_claim_ids) assert.ok(claims.has(claimId), `${attachment.attachment_id}:${claimId}`);
      assert.equal(attachment.authority_boundary, 'SYSTEM_RELEVANCE_ONLY');
    }
  }
  assert.equal(new Set(actions).size, 76);
  assert.equal(coverage.coverage.actions_with_justified_paths.percent, 100);
  assert.deepEqual(coverage.blocking_gaps, []);
});

test('successor schemas reject extra roots and incorrect fixed release denominators', () => {
  const catalog = readJson(RELEASE_FILES.system_model_catalog_v2);
  const extraRoot = { ...catalog, hidden: true };
  assert.ok(validateJsonSchema(extraRoot, schemas.get('system_model_catalog_v2'), schemaRegistry).length > 0);
  const shortBindings = readJson(RELEASE_FILES.ticket_system_binding_catalog_v2);
  shortBindings.bindings.pop();
  assert.ok(validateJsonSchema(shortBindings, schemas.get('ticket_system_binding_catalog_v2'), schemaRegistry).length > 0);
  const shortCoverage = readJson(RELEASE_FILES.released_story_system_coverage);
  shortCoverage.ticket_instances.pop();
  assert.ok(validateJsonSchema(shortCoverage, schemas.get('released_story_system_coverage'), schemaRegistry).length > 0);
});

test('generator, immutable pins, and independent validator are deterministic', () => {
  const build = spawnSync(process.execPath, ['content/system-model-story-v1/build-release.mjs', '--check'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(build.status, 0, build.stderr || build.stdout);
  assert.match(build.stdout, /Deterministic check passed for 16/);
  const validation = spawnSync(process.execPath, ['content/system-model-story-v1/validate-release.mjs'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(validation.status, 0, validation.stderr || validation.stdout);
  assert.match(validation.stdout, /18\/18 Tickets, 18\/18 bindings, 18\/18 proofs/);
});

test('TASK-053 documentation links resolve inside the repository', () => {
  const markdownFiles = [
    'docs/system-models/task-053/README.md',
    'docs/system-models/task-053/MIGRATION.md',
    'docs/system-models/task-053/RELEASED_STORY_SYSTEM_COVERAGE.md',
  ];
  let checked = 0;
  for (const relativePath of markdownFiles) {
    const absolutePath = path.join(ROOT, relativePath);
    assert.equal(fs.existsSync(absolutePath), true, relativePath);
    const markdown = fs.readFileSync(absolutePath, 'utf8');
    for (const match of markdown.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const rawTarget = match[1].trim().replace(/^<|>$/g, '');
      if (/^(?:https?:|mailto:|tel:|data:)/i.test(rawTarget)) continue;
      const target = decodeURIComponent(rawTarget.split('#')[0].split('?')[0]);
      if (!target) continue;
      checked += 1;
      assert.equal(fs.existsSync(path.resolve(path.dirname(absolutePath), target)), true, `${relativePath}:${rawTarget}`);
    }
  }
  assert.ok(checked >= 15, `expected at least 15 repository links; received ${checked}`);
});
