import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  TASK_014_BUILDER_VERSION,
  TASK_014_CARD_CATALOG_VERSION,
  TASK_014_CONFIGURATION_VERSION,
  TASK_014_DOMAIN_CONTENT_VERSION,
  TASK_014_TICKET_CONTENT_VERSION,
  analyzeDeckCoverage,
  buildTicketsV3,
  createTask014Catalogs,
  validateTask014OutcomeCoverage,
} from '../src/builder/task-014.mjs';
import { analyzeTicketCausalGraph, validateTicketSolvability } from '../src/builder/ticket-solvability.mjs';
import { createMatch, projectPrivatePlayer } from '../src/engine/index.mjs';
import {
  EXPANDED_CARD_CATALOG_VERSION,
  createClientDataContext,
  createDefaultState,
  createExportBundle,
  migrateLocalState,
} from '../viewer/js/play/data/client-data.mjs';
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
const catalogs = createTask014Catalogs(raw);
const schemas = loadSchemaRegistry(ROOT);
const schemaByTitle = new Map(schemas.schemas.map(({ schema }) => [schema.title, schema]));
const clientSchemaFiles = fs.readdirSync(path.join(ROOT, 'schemas/client'))
  .filter((name) => name.endsWith('.json'))
  .sort()
  .map((name) => ({
    filePath: path.join(ROOT, 'schemas/client', name),
    schema: readJson(`schemas/client/${name}`),
  }));
const storySchemaFiles = fs.readdirSync(path.join(ROOT, 'schemas/story'))
  .filter((name) => name.endsWith('.json'))
  .sort()
  .map((name) => ({
    filePath: path.join(ROOT, 'schemas/story', name),
    schema: readJson(`schemas/story/${name}`),
  }));
const clientSchemas = {
  schemas: [...clientSchemaFiles, ...storySchemaFiles],
  byId: new Map([...clientSchemaFiles, ...storySchemaFiles].map(({ schema }) => [schema.$id, schema])),
};
const clientSchemaByTitle = new Map(clientSchemaFiles.map(({ schema }) => [schema.title, schema]));
const starter = catalogs.decks.decks.find((deck) => deck.id === 'deck.core.multisystem_response_v3');
const benchIds = catalogs.cards.cards
  .filter((card) => card.play_contract.contract_type === 'DIAGNOSTIC')
  .map((card) => card.id)
  .sort();

function counts(cardDefinitionIds) {
  const result = {};
  for (const id of cardDefinitionIds) result[id] = (result[id] ?? 0) + 1;
  return result;
}

function bounds(minimum, maximum) {
  return { minimum, maximum };
}

function configuration({
  requested = 1,
  seed = 'task-014-test',
  deck = starter.card_definition_ids,
  diagnostics = benchIds,
  allowedFingerprintIds = [],
} = {}) {
  const available = counts(deck);
  return {
    id: 'builder_config.task_014_test',
    entity_type: 'ticket_builder_configuration',
    configuration_version: TASK_014_CONFIGURATION_VERSION,
    scenario_or_mode_context: 'TRAINING',
    requested_ticket_count: requested,
    seed,
    generator_version: TASK_014_BUILDER_VERSION,
    content_version: TASK_014_TICKET_CONTENT_VERSION,
    domain_content_version: TASK_014_DOMAIN_CONTENT_VERSION,
    card_catalog_version: TASK_014_CARD_CATALOG_VERSION,
    allowed_domain_ids: [], excluded_domain_ids: [], allowed_tags: [], excluded_tags: [],
    guaranteed_categories: [], required_teaching_beats: [],
    authored_difficulty_bounds: bounds(1, 4),
    fault_count_bounds: bounds(1, 3),
    required_actionable_fault_count_bounds: bounds(1, 2),
    causal_depth_bounds: bounds(0, 1),
    inbound_branching_bounds: bounds(0, 2),
    outbound_branching_bounds: bounds(0, 2),
    progressive_difficulty_profile: {
      profile_id: 'progressive.task_014_test',
      profile_version: 'task-014',
      explicit_ceiling: 4,
      bands: [{ start_generated_index: 0, end_generated_index: requested - 1, target: 2, minimum: 1, maximum: 4 }],
    },
    generation_index_start: 0,
    allow_duplicate_causal_fingerprints: true,
    active_causal_fingerprints: [],
    allowed_fingerprint_ids: allowedFingerprintIds,
    legal_card_definition_ids: [...new Set([...diagnostics, ...Object.keys(available)])].sort(),
    diagnostic_card_definition_ids: [...diagnostics],
    available_card_definition_counts: available,
    fallback_configuration_id: null,
  };
}

function selectedAttempt(result) {
  return result.attempts.find((attempt) => attempt.attempt_id === result.selected_attempt_id);
}

function cardFor(contractType, domainId) {
  return catalogs.cards.cards.find((card) => card.play_contract.contract_type === contractType
    && (card.play_contract.repair_procedure_id
      ?? card.play_contract.validation_procedure_id
      ?? card.play_contract.source_definition_id) === domainId).id;
}

test('coverage audit distinguishes knowledge, action-bearing, selected, and deferred records', () => {
  assert.equal(raw.domain.entities.length, 257);
  assert.equal(raw.coverage.inventory.knowledge_records, 257);
  assert.equal(raw.coverage.inventory.action_bearing_records, 107);
  assert.equal(raw.coverage.inventory.tests, 37);
  assert.equal(raw.coverage.inventory.commands, 13);
  assert.equal(raw.coverage.inventory.promoted_diagnostics, 50);
  assert.equal(raw.coverage.inventory.selected_repairs, 12);
  assert.equal(raw.coverage.inventory.selected_validations, 9);
  assert.equal(raw.coverage.inventory.playable_card_definitions, 71);
  assert.equal(raw.coverage.inventory.supported_fingerprints, 12);
  assert.equal(raw.coverage.selected_action_definition_ids.length + raw.coverage.deferred_action_definition_ids.length, 107);
  const subsystemCounts = Object.groupBy(raw.coverage.fingerprints, (entry) => entry.subsystem);
  assert.deepEqual(Object.fromEntries(Object.entries(subsystemCounts).map(([key, values]) => [key, values.length])), {
    boot: 2, memory: 2, network: 2, power: 2, storage: 2, thermal: 2,
  });
  assert.match(fs.readFileSync(path.join(ROOT, 'docs/coverage/TASK-014-PLAYABLE-COVERAGE.md'), 'utf8'), /Knowledge records: \*\*257\*\*/);
});

test('new part, coverage, Card, Builder, and assembled Ticket artifacts validate against schemas', () => {
  assert.deepEqual(validateJsonSchema(raw.parts, schemaByTitle.get('Versioned authored Ticket part catalog'), schemas), []);
  assert.deepEqual(validateJsonSchema(raw.coverage, schemaByTitle.get('Playable coverage audit'), schemas), []);
  for (const card of raw.cards.cards) {
    assert.deepEqual(validateJsonSchema(card, schemaByTitle.get('Card Definition'), schemas), [], card.id);
  }
  const config = configuration({ requested: 10 });
  assert.deepEqual(validateJsonSchema(config, schemaByTitle.get('Ticket Builder Configuration'), schemas), []);
  const result = buildTicketsV3({ configuration: config, catalogs });
  assert.equal(result.status, 'SUCCESS');
  assert.deepEqual(validateJsonSchema(result, schemaByTitle.get('Ticket Builder Result'), schemas), []);
  for (const ticket of selectedAttempt(result).ticket_snapshots) {
    assert.deepEqual(validateJsonSchema(ticket, schemaByTitle.get('Repair Ticket Definition'), schemas), [], ticket.id);
    assert.ok(ticket.generation_provenance.part_ids.length >= 10);
    assert.match(ticket.generation_provenance.causal_fingerprint, /^[a-f0-9]{64}$/);
  }
});

test('assembled Tickets are relationship-bound, differentiable, outcome-complete, and exactly solvable', () => {
  const result = buildTicketsV3({ configuration: configuration({ requested: 10, seed: 'coverage-proof' }), catalogs });
  const tickets = selectedAttempt(result).ticket_snapshots;
  const domainById = new Map(catalogs.domain.entities.map((entity) => [entity.id, entity]));
  const classifications = new Set();
  for (const ticket of tickets) {
    const truthIds = new Set(ticket.server_only_truth.fault_instances.map((entry) => entry.fault_id));
    for (const symptomId of ticket.initial_symptom_ids) {
      const associated = new Set(domainById.get(symptomId).associated_fault_ids);
      assert.ok([...truthIds].every((id) => associated.has(id)));
    }
    for (const candidateId of ticket.public_candidate_fault_ids.filter((id) => !truthIds.has(id))) {
      assert.ok(ticket.authored_evidence_outcomes.some((outcome) => outcome.candidate_effects.some((effect) =>
        effect.candidate_fault_id === candidateId && ['CONTRADICT', 'RULE_OUT'].includes(effect.disposition))));
    }
    ticket.authored_evidence_outcomes.forEach((outcome) => classifications.add(outcome.outcome_classification));
    assert.deepEqual(validateTask014OutcomeCoverage(ticket, {
      domainCatalog: catalogs.domain,
      cardCatalog: catalogs.cards,
      diagnosticCardDefinitionIds: benchIds,
    }), { valid: true, errors: [] });
    const graph = analyzeTicketCausalGraph(ticket);
    assert.equal(graph.valid, true);
    const solvability = validateTicketSolvability(ticket, {
      domainCatalog: catalogs.domain,
      cardCatalog: catalogs.cards,
      legalCardDefinitionIds: configuration().legal_card_definition_ids,
    });
    assert.equal(solvability.valid, true, JSON.stringify(solvability.errors));
    assert.ok(solvability.witness.length >= 4);
  }
  assert.ok(classifications.has('CLEAN'));
  assert.ok(classifications.has('IRRELEVANT'));
  assert.ok(classifications.has('INCONCLUSIVE'));
  assert.ok(classifications.has('CANDIDATE_EFFECT'));
});

test('fixed seeds reproduce assembled snapshots and different seeds vary unique-first ordering', () => {
  const first = buildTicketsV3({ configuration: configuration({ requested: 10, seed: 'same-seed' }), catalogs });
  const repeat = buildTicketsV3({ configuration: configuration({ requested: 10, seed: 'same-seed' }), catalogs });
  const different = buildTicketsV3({ configuration: configuration({ requested: 10, seed: 'different-seed' }), catalogs });
  assert.deepEqual(first, repeat);
  const selected = selectedAttempt(first).selected_template_ids;
  assert.equal(new Set(selected).size, 10);
  assert.notDeepEqual(selected, selectedAttempt(different).selected_template_ids);
});

test('balanced repetition and exact response quantities are enforced independently of deck legality', () => {
  const roots = ['fingerprint.boot.incorrect_order', 'fingerprint.network.incorrect_static_ip'];
  const required = [
    cardFor('REPAIR', 'repair.boot.correct_order'),
    cardFor('VERIFY', 'verify.boot.normal_boot'),
    cardFor('REPAIR', 'repair.network.correct_static_ip'),
    cardFor('VERIFY', 'verify.network.connectivity'),
  ];
  const extras = catalogs.cards.cards.filter((card) => card.play_contract.contract_type !== 'DIAGNOSTIC'
    && !required.includes(card.id)).slice(0, 2).map((card) => card.id);
  const deck = [...required, ...extras].flatMap((id) => Array(5).fill(id));
  const config = configuration({ requested: 10, seed: 'balanced-repeat', deck, allowedFingerprintIds: roots });
  const result = buildTicketsV3({ configuration: config, catalogs });
  assert.equal(result.status, 'SUCCESS');
  const selected = selectedAttempt(result).selected_template_ids;
  assert.equal(new Set(selected.slice(0, 2)).size, 2);
  assert.deepEqual(Object.fromEntries(Object.entries(Object.groupBy(selected, (id) => id)).map(([id, values]) => [id, values.length])), {
    'fingerprint.boot.incorrect_order': 5,
    'fingerprint.network.incorrect_static_ip': 5,
  });

  const exhausted = configuration({ requested: 6, allowedFingerprintIds: ['fingerprint.boot.incorrect_order'] });
  const failure = buildTicketsV3({ configuration: exhausted, catalogs });
  assert.equal(failure.status, 'FAILURE');
  assert.ok(failure.attempts[0].diagnostics.some((entry) => entry.code === 'CARD_POOL_UNREACHABLE'));
});

test('missing Bench, Repair, Verify, and incomplete declarations fail before Match creation', () => {
  const missingDiagnostic = configuration({ diagnostics: benchIds.slice(1) });
  assert.equal(buildTicketsV3({ configuration: missingDiagnostic, catalogs }).status, 'FAILURE');

  const assertMissingResponse = (missingId, fingerprintId) => {
    const deck = starter.card_definition_ids.filter((id) => id !== missingId);
    const replacement = catalogs.cards.cards.find((card) => card.play_contract.contract_type !== 'DIAGNOSTIC'
      && !deck.includes(card.id) && card.id !== missingId)?.id;
    while (deck.length < 30) deck.push(replacement);
    const config = configuration({ deck, allowedFingerprintIds: [fingerprintId] });
    const result = buildTicketsV3({ configuration: config, catalogs });
    assert.equal(result.status, 'FAILURE');
    assert.ok(result.attempts[0].diagnostics.some((entry) => ['CARD_POOL_UNREACHABLE', 'REQUESTED_COUNT_UNSATISFIABLE'].includes(entry.code)));
  };
  assertMissingResponse(cardFor('REPAIR', 'repair.boot.correct_order'), 'fingerprint.boot.incorrect_order');
  assertMissingResponse(cardFor('VERIFY', 'verify.boot.normal_boot'), 'fingerprint.boot.incorrect_order');

  const incomplete = configuration();
  incomplete.legal_card_definition_ids = incomplete.legal_card_definition_ids.slice(1);
  const result = buildTicketsV3({ configuration: incomplete, catalogs });
  assert.equal(result.status, 'FAILURE');
  assert.ok(result.attempts[0].diagnostics.some((entry) => entry.code === 'INVALID_CONFIGURATION'));
});

test('Global Bench count and deck preflight use playable definitions, not raw knowledge count', () => {
  const coverage = analyzeDeckCoverage({ cardDefinitionIds: starter.card_definition_ids, catalogs });
  assert.equal(coverage.eligible_unique_count, 12);
  assert.equal(coverage.supported_unique_count, 12);
  const result = buildTicketsV3({ configuration: configuration(), catalogs });
  const snapshot = selectedAttempt(result).ticket_snapshots;
  const state = createMatch({
    matchId: 'match.task_014.bench',
    players: [{ player_id: 'player.one', display_name: 'One', controller_type: 'human', team_id: 'team.one', seat_number: 1 }],
    decksByPlayer: { 'player.one': starter.card_definition_ids },
    ticketSnapshots: snapshot,
    catalogs: catalogs.engineCatalogs,
    configuration: { collaboration_mode: 'cooperative', execution_mode: 'offline' },
    seed: 'bench-proof',
    now: '2042-01-01T00:00:00.000Z',
    ticketSource: { source_type: 'generated', content_version: TASK_014_TICKET_CONTENT_VERSION, generator_version: TASK_014_BUILDER_VERSION, configuration_id: 'builder_config.task_014_test', seed: 'bench-proof', builder_result_id: result.id },
    rulesetVersion: 'first-version-v2',
  });
  const view = projectPrivatePlayer(state, 'player.one', catalogs.engineCatalogs);
  assert.equal(view.diagnostic_bench.length, 50);
  assert.doesNotMatch(JSON.stringify(view.diagnostic_bench), /server_only_truth|fault_instances|actual_present/);
  assert.ok(view.diagnostic_bench.every((entry) => entry.ticket_relevance.length === 1));
});

test('expanded local data exports validate and existing diagnosis-v2 profiles retain non-deck records', () => {
  const clientContext = createClientDataContext({ cardCatalog: catalogs.cards, deckCatalog: catalogs.decks });
  const current = createDefaultState(clientContext);
  assert.equal(current.records.decks.card_catalog_version, EXPANDED_CARD_CATALOG_VERSION);
  const exported = createExportBundle(current, clientContext, '2042-01-01T00:00:00.000Z');
  assert.deepEqual(validateJsonSchema(
    exported,
    clientSchemaByTitle.get('Solo Pages Export Bundle v3'),
    clientSchemas,
  ), []);

  const priorBundle = readJson('examples/client/export_bundle.default.json');
  priorBundle.records.profile.display_name = 'Returning Technician';
  priorBundle.records.statistics.totals.matches_started = 4;
  priorBundle.records.statistics.processed_match_start_ids = [
    'match.returning.001',
    'match.returning.002',
    'match.returning.003',
    'match.returning.004',
  ];
  const migrated = migrateLocalState({ storage_version: 'solo-local-state-v2', records: priorBundle.records }, clientContext);
  assert.equal(migrated.records.profile.display_name, 'Returning Technician');
  assert.equal(migrated.records.statistics.totals.matches_started, 4);
  assert.equal(migrated.records.decks.card_catalog_version, EXPANDED_CARD_CATALOG_VERSION);
  assert.deepEqual(migrated.records.decks.decks[0].card_definition_ids, starter.card_definition_ids);
});
