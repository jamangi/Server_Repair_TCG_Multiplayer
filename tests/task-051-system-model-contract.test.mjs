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
import {
  createStoryBuilderConfiguration,
  validateStoryMatchRegistry,
} from '../viewer/js/play/story-match-registry.mjs';
import {
  loadSchemaRegistry,
  validateJsonSchema,
} from './helpers/json-schema-validator.mjs';
import { validateReleaseBundle } from '../content/system-model-pilot-v1/validate-release.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
const registry = loadSchemaRegistry(ROOT);
const schemaByName = new Map(registry.schemas.map(({ filePath, schema }) => [path.basename(filePath, '.schema.json'), schema]));

const RELEASE_FILES = Object.freeze({
  system_model_catalog: 'content/system-model-pilot-v1/system-model-catalog-v1.json',
  ticket_system_binding_catalog: 'content/system-model-pilot-v1/ticket-system-bindings-v1.json',
  system_model_private_validation_catalog: 'content/system-model-pilot-v1/private-compatibility-v1.json',
  system_model_relationship_overlay: 'content/system-model-pilot-v1/domain-relationship-overlay-v1.json',
  system_model_migration: 'content/system-model-pilot-v1/migration-v1.json',
  system_model_release_manifest: 'content/system-model-pilot-v1/RELEASE-MANIFEST.json',
});

const PILOT_TICKET_IDS = new Set([
  'ticket.generated.3ec80b1b0e7221ac725aedf9',
  'ticket.generated.5352abd871c2e9076be92a0b',
  'ticket.generated.3fd6eb04534f79b5b3f87f98',
  'ticket.generated.b34238282822e93980b5f1ad',
  'ticket.generated.f32b85cbf2054fdf0114f42a',
]);

function loadReleaseBundle() {
  return {
    catalog: readJson(RELEASE_FILES.system_model_catalog),
    bindings: readJson(RELEASE_FILES.ticket_system_binding_catalog),
    privateValidation: readJson(RELEASE_FILES.system_model_private_validation_catalog),
    overlay: readJson(RELEASE_FILES.system_model_relationship_overlay),
    migration: readJson(RELEASE_FILES.system_model_migration),
    manifest: readJson(RELEASE_FILES.system_model_release_manifest),
    components: readJson('viewer/content/system-model-pilot-v1-components.json'),
  };
}

function schemaForExample(relativePath) {
  const prefix = path.basename(relativePath).split('.')[0];
  const schema = schemaByName.get(prefix);
  assert.ok(schema, `No System Model schema for ${relativePath}`);
  return schema;
}

function listJson(relativeDirectory) {
  return fs.readdirSync(path.join(ROOT, relativeDirectory))
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => `${relativeDirectory}/${name}`);
}

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

test('all six production artifacts and six committed valid fixtures satisfy strict schemas', () => {
  for (const [schemaName, relativePath] of Object.entries(RELEASE_FILES)) {
    const errors = validateJsonSchema(readJson(relativePath), schemaByName.get(schemaName), registry);
    assert.deepEqual(errors, [], `${relativePath}\n${errors.join('\n')}`);
  }
  const validFixtures = listJson('examples/system-models/valid');
  assert.equal(validFixtures.length, 6);
  for (const relativePath of validFixtures) {
    const errors = validateJsonSchema(readJson(relativePath), schemaForExample(relativePath), registry);
    assert.deepEqual(errors, [], `${relativePath}\n${errors.join('\n')}`);
  }
});

test('invalid examples reject hidden public fields, forbidden relations, and incomplete migration pins', () => {
  const invalid = listJson('examples/system-models/invalid');
  assert.equal(invalid.length, 6);
  const schemaInvalid = invalid.filter((relativePath) => !relativePath.includes('dangling-component')
    && !relativePath.includes('lifecycle-cycle')
    && !relativePath.includes('dangling-binding'));
  assert.equal(schemaInvalid.length, 3);
  for (const relativePath of schemaInvalid) {
    const errors = validateJsonSchema(readJson(relativePath), schemaForExample(relativePath), registry);
    assert.ok(errors.length > 0, `${relativePath} should be schema-invalid`);
  }
});

test('the complete release passes deterministic cross-reference, provenance, lifecycle, and non-leak validation', () => {
  const result = validateReleaseBundle(loadReleaseBundle());
  assert.equal(result.status, 'ACCEPTED', result.issues.join('\n'));
  assert.deepEqual(result.issues, []);
  assert.deepEqual(result.totals, {
    profiles: 2,
    bindings: 5,
    private_proofs: 5,
    relationship_findings: 16,
    components_added: 2,
  });
});

test('semantic invalid fixtures fail complete-or-none for dangling Component, lifecycle cycle, and private binding', () => {
  const cases = [
    ['catalog', 'examples/system-models/invalid/system_model_catalog.dangling-component.json', /missing Component component\.missing\.fixture/],
    ['catalog', 'examples/system-models/invalid/system_model_catalog.lifecycle-cycle.json', /prohibited lifecycle cycle/],
    ['privateValidation', 'examples/system-models/invalid/system_model_private_validation_catalog.dangling-binding.json', /references missing binding/],
  ];
  for (const [key, fixture, pattern] of cases) {
    const bundle = loadReleaseBundle();
    bundle[key] = readJson(fixture);
    const result = validateReleaseBundle(bundle);
    assert.equal(result.status, 'REJECTED_COMPLETE_OR_NONE');
    assert.equal(result.release, null);
    assert.match(result.issues.join('\n'), pattern);
  }
});

test('two justified Components close the exact missing-role gap without renaming existing IDs', () => {
  const bundle = loadReleaseBundle();
  assert.deepEqual(bundle.components.entities.map((entity) => entity.id), [
    'component.firmware.system_bios',
    'component.storage.pcie_nvme_interconnect',
  ]);
  assert.deepEqual(bundle.migration.added_component_ids, [
    'component.firmware.system_bios',
    'component.storage.pcie_nvme_interconnect',
  ]);
  assert.deepEqual(bundle.migration.preserved_component_ids, ['component.power.distribution_board']);
  const powerProfile = bundle.catalog.profiles.find((profile) => profile.profile_id.includes('r740xd2'));
  const interposerRole = powerProfile.role_instances.find((role) => role.role_id === 'role.pib');
  assert.equal(interposerRole.component_definition_id, 'component.power.distribution_board');
  assert.match(interposerRole.serviceability_note, /de-energization/i);
});

test('public bindings cover exactly five released snapshots while private variants cannot alter their bytes', () => {
  const bundle = loadReleaseBundle();
  assert.deepEqual(new Set(bundle.bindings.bindings.map((binding) => binding.ticket_id)), PILOT_TICKET_IDS);
  const publicById = new Map(bundle.bindings.bindings.map((binding) => [binding.binding_id, binding]));
  for (const proof of bundle.privateValidation.compatibility_proofs) {
    const binding = publicById.get(proof.binding_id);
    assert.ok(binding);
    assert.equal(proof.differential_variants.length, binding.public_surface.public_candidate_fault_ids.length);
    for (const variant of proof.differential_variants) {
      assert.equal(variant.expected_public_binding_digest, binding.serialization.content_digest);
      const privateMutation = structuredClone(proof);
      privateMutation.hidden_fault_bindings = [{
        ...privateMutation.hidden_fault_bindings[0],
        fault_id: variant.synthetic_hidden_fault_ids[0],
      }];
      assert.equal(JSON.stringify(publicById.get(proof.binding_id)), JSON.stringify(binding));
    }
  }
});

test('all 51 profile action attachments are sourced, typed, and authority-bounded', () => {
  const catalog = loadReleaseBundle().catalog;
  const attachments = catalog.profiles.flatMap((profile) => profile.action_attachments);
  assert.equal(attachments.length, 51);
  assert.equal(new Set(attachments.map((attachment) => attachment.attachment_id)).size, 51);
  for (const attachment of attachments) {
    assert.ok(attachment.source_claim_ids.length > 0, attachment.attachment_id);
    assert.ok(attachment.target_node_ids.length > 0, attachment.attachment_id);
    assert.ok(attachment.relevant_stage_ids.length > 0, attachment.attachment_id);
    assert.equal(attachment.authority_boundary, 'SYSTEM_RELEVANCE_ONLY');
    assert.equal(Object.hasOwn(attachment, 'legal_intent'), false);
    assert.equal(Object.hasOwn(attachment, 'outcome'), false);
    assert.equal(Object.hasOwn(attachment, 'evidence_disposition'), false);
  }
});

test('the exact five pilot Tickets still reconstruct through unchanged Builder catalogs and active Story decks', () => {
  const rawRegistry = readJson('content/story-v1/campaigns/quiet-cascade-expansion-v3/matches.json');
  const storyRegistry = validateStoryMatchRegistry(rawRegistry);
  const legacyCatalogs = loadTask014Catalogs();
  const currentCatalogs = loadTask042Catalogs();
  const legacyDeck = legacyCatalogs.decks.decks.find((deck) => deck.id === storyRegistry.deckPolicy.canonical_proof_deck_id);
  const expansionDeck = currentCatalogs.decks.decks.find((deck) => deck.id === 'deck.story.expansion_response_v1');
  const reconstructed = new Map();
  for (const definition of storyRegistry.matches.values()) {
    if (!definition.expected_ticket_definition_ids.some((id) => PILOT_TICKET_IDS.has(id))) continue;
    const legacy = definition.builder_configuration === undefined;
    const catalogs = legacy ? legacyCatalogs : currentCatalogs;
    const deck = legacy ? legacyDeck : expansionDeck;
    const configuration = createStoryBuilderConfiguration({
      registry: storyRegistry,
      definition,
      cardDefinitionIds: deck.card_definition_ids,
      diagnosticCardIds: diagnosticIds(catalogs),
    });
    const result = legacy
      ? buildTicketsV3({ configuration, catalogs })
      : buildTicketsV4({ configuration, catalogs });
    assert.equal(result.status, 'SUCCESS', definition.match_ref);
    const attempt = selectedAttempt(result);
    for (const [index, ticketId] of attempt.ticket_snapshots.map((ticket) => ticket.id).entries()) {
      if (PILOT_TICKET_IDS.has(ticketId)) reconstructed.set(ticketId, attempt.ticket_snapshot_digests[index]);
    }
  }
  const bindings = loadReleaseBundle().bindings.bindings;
  assert.equal(reconstructed.size, 5);
  for (const binding of bindings) assert.equal(reconstructed.get(binding.ticket_id), binding.ticket_snapshot_digest, binding.ticket_id);
});

test('the committed release, invalid fixtures, and hashes are byte-stable under regeneration', () => {
  const result = spawnSync(process.execPath, ['content/system-model-pilot-v1/build-release.mjs', '--check'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /check passed for 19 deterministic files/);
  const validation = spawnSync(process.execPath, ['content/system-model-pilot-v1/validate-release.mjs'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  assert.equal(validation.status, 0, validation.stderr || validation.stdout);
  assert.match(validation.stdout, /Validated 2 profiles, 5 bindings/);
});

test('TASK-051 release documentation has no missing repository-relative links', () => {
  const markdownFiles = [
    'docs/system-models/README.md',
    'docs/system-models/task-051/README.md',
    'docs/system-models/task-051/MIGRATION.md',
  ];
  let checked = 0;
  for (const relativePath of markdownFiles) {
    const absolutePath = path.join(ROOT, relativePath);
    const markdown = fs.readFileSync(absolutePath, 'utf8');
    for (const match of markdown.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const rawTarget = match[1].trim().replace(/^<|>$/g, '');
      if (/^(?:https?:|mailto:|tel:|data:)/i.test(rawTarget)) continue;
      const target = decodeURIComponent(rawTarget.split('#')[0].split('?')[0]);
      if (!target) continue;
      checked += 1;
      assert.equal(
        fs.existsSync(path.resolve(path.dirname(absolutePath), target)),
        true,
        `${relativePath} has missing link ${rawTarget}`,
      );
    }
  }
  assert.equal(checked, 34);
});
