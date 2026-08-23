import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  TICKET_BUILDER_CONFIGURATION_VERSION,
  TICKET_BUILDER_VERSION,
  buildTickets,
  validateBuilderConfiguration,
} from '../src/builder/ticket-builder.mjs';
import {
  analyzeTicketCausalGraph,
  validateTicketSolvability,
} from '../src/builder/ticket-solvability.mjs';
import { canonicalJson, sha256 } from '../src/builder/canonical.mjs';
import {
  loadSchemaRegistry,
  validateJsonSchema,
} from './helpers/json-schema-validator.mjs';

const repositoryRoot = path.resolve(import.meta.dirname, '..');
const readJson = (relativePath) => JSON.parse(
  fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8'),
);

const ticketContent = readJson('content/gameplay-v1/ticket-templates.json');
const domainCatalog = readJson('content/gameplay-v1/domain-snapshot.json');
const cardCatalog = readJson('content/gameplay-v1/card-catalog.json');
const successConfiguration = readJson('examples/domain/ticket_builder_configuration.success.json');
const unsatisfiableConfiguration = readJson('examples/domain/ticket_builder_configuration.unsatisfiable.json');
const primaryWithFallbackConfiguration = readJson('examples/domain/ticket_builder_configuration.primary_with_fallback.json');
const fallbackConfiguration = readJson('examples/domain/ticket_builder_configuration.fallback.json');
const registry = loadSchemaRegistry(repositoryRoot);
const schemaByFilename = new Map(registry.schemas.map(({ filePath, schema }) => [path.basename(filePath), schema]));
const repairTicketSchema = schemaByFilename.get('repair_ticket.schema.json');
const configurationSchema = schemaByFilename.get('ticket_builder_configuration.schema.json');
const resultSchema = schemaByFilename.get('ticket_builder_result.schema.json');
const templateById = new Map(ticketContent.templates.map((template) => [template.template_id, template]));

function build(configuration, {
  content = ticketContent,
  domain = domainCatalog,
  cards = cardCatalog,
  configurationsById = {},
} = {}) {
  return buildTickets({
    configuration,
    configurationsById,
    ticketContent: content,
    domainCatalog: domain,
    cardCatalog: cards,
  });
}

function broadConfiguration(overrides = {}) {
  const configuration = structuredClone(successConfiguration);
  Object.assign(configuration, {
    id: 'builder_config.test_broad',
    requested_ticket_count: 1,
    seed: 'task-009-test-seed',
    allowed_domain_ids: [],
    excluded_domain_ids: [],
    allowed_tags: ['storage'],
    excluded_tags: [],
    guaranteed_categories: [],
    required_teaching_beats: [],
    authored_difficulty_bounds: { minimum: 1, maximum: 4 },
    fault_count_bounds: { minimum: 1, maximum: 2 },
    required_actionable_fault_count_bounds: { minimum: 1, maximum: 2 },
    causal_depth_bounds: { minimum: 0, maximum: 1 },
    inbound_branching_bounds: { minimum: 0, maximum: 1 },
    outbound_branching_bounds: { minimum: 0, maximum: 1 },
    progressive_difficulty_profile: {
      profile_id: 'profile.test_broad',
      profile_version: 'v1',
      explicit_ceiling: 4,
      bands: [{
        start_generated_index: 0,
        end_generated_index: 0,
        target: 2,
        minimum: 1,
        maximum: 4,
      }],
    },
    generation_index_start: 0,
    allow_duplicate_causal_fingerprints: false,
    active_causal_fingerprints: [],
    fallback_configuration_id: null,
  }, overrides);
  return configuration;
}

function selectedTemplateIds(result) {
  return result.attempts.find((attempt) => attempt.attempt_id === result.selected_attempt_id)
    ?.selected_template_ids ?? [];
}

function diagnosticConstraints(result) {
  return new Set(result.attempts.flatMap((attempt) =>
    attempt.diagnostics.map((diagnostic) => diagnostic.constraint)));
}

test('Builder schemas, versions, examples, and stable non-EX1 template IDs are synchronized', () => {
  assert.equal(TICKET_BUILDER_VERSION, 'ticket-builder-v1');
  assert.equal(TICKET_BUILDER_CONFIGURATION_VERSION, 'ticket-builder-v1');
  assert.equal(ticketContent.ticket_content_version, 'core-ticket-templates-v1');
  assert.equal(domainCatalog.domain_content_version, 'core-domain-snapshot-v1');
  assert.equal(cardCatalog.card_catalog_version, 'core-card-catalog-v1');
  assert.equal(configurationSchema.$id, 'https://example.local/schemas/ticket_builder_configuration.schema.json');
  assert.equal(resultSchema.$id, 'https://example.local/schemas/ticket_builder_result.schema.json');
  assert.equal(repairTicketSchema.$id, 'https://example.local/schemas/repair_ticket.schema.json');

  assert.deepEqual([...templateById.keys()].sort(), [
    'ticket_template.storage.loose_cable',
    'ticket_template.storage.member_then_array',
    'ticket_template.storage.single_sas_member',
  ]);
  assert.doesNotMatch(JSON.stringify(ticketContent), /EX1/i);

  for (const name of [
    'fallback',
    'primary_with_fallback',
    'success',
    'unsatisfiable',
  ]) {
    const fixture = readJson(`examples/domain/ticket_builder_configuration.${name}.json`);
    assert.deepEqual(validateJsonSchema(fixture, configurationSchema, registry), [], name);
    assert.deepEqual(validateBuilderConfiguration(fixture), [], name);
  }
  for (const name of ['fallback', 'success', 'unsatisfiable']) {
    const fixture = readJson(`examples/domain/ticket_builder_result.${name}.json`);
    assert.deepEqual(validateJsonSchema(fixture, resultSchema, registry), [], name);
  }
});

test('every fixed Ticket and every generated snapshot passes the same causal/card solvability oracle', () => {
  for (const template of ticketContent.templates) {
    assert.deepEqual(validateJsonSchema(template.ticket, repairTicketSchema, registry), [], template.template_id);
    const analysis = validateTicketSolvability(template.ticket, {
      domainCatalog,
      cardCatalog,
      legalCardDefinitionIds: template.required_card_definition_ids,
    });
    assert.equal(analysis.valid, true, `${template.template_id}\n${JSON.stringify(analysis.errors)}`);
    assert.ok(analysis.witness.length >= 4);
  }

  const result = build(successConfiguration);
  assert.equal(result.status, 'SUCCESS');
  for (const snapshot of result.attempts[0].ticket_snapshots) {
    const analysis = validateTicketSolvability(snapshot, {
      domainCatalog,
      cardCatalog,
      legalCardDefinitionIds: successConfiguration.legal_card_definition_ids,
    });
    assert.equal(analysis.valid, true, JSON.stringify(analysis.errors));
    assert.deepEqual(validateJsonSchema(snapshot, repairTicketSchema, registry), []);
  }
});

test('the advanced Ticket is two distinct actionable stages and failed Verify is the sole second-Isolation Evidence', () => {
  const template = templateById.get('ticket_template.storage.member_then_array');
  const graph = analyzeTicketCausalGraph(template.ticket);
  assert.equal(graph.valid, true);
  assert.deepEqual(graph.metrics, {
    fault_count: 2,
    required_actionable_fault_count: 2,
    causal_depth: 1,
    inbound_branching: 1,
    outbound_branching: 1,
  });
  assert.deepEqual(
    template.ticket.server_only_truth.fault_instances.map((instance) => instance.fault_id),
    ['fault.storage.sas.drive_failed', 'fault.storage.raid.degraded'],
  );
  assert.ok(template.ticket.server_only_truth.fault_instances.every((instance) =>
    instance.actionable && instance.required_to_repair));

  const arrayIsolation = template.ticket.isolation_requirements.find((requirement) =>
    requirement.target_fault_instance_key === 'fault_instance.raid.array_degraded');
  assert.deepEqual(arrayIsolation.eligible_outcome_ids, []);
  assert.deepEqual(arrayIsolation.eligible_verification_outcome_ids, [
    'verification_outcome.raid.member_replacement_fail',
  ]);

  const analysis = validateTicketSolvability(template.ticket, {
    domainCatalog,
    cardCatalog,
    legalCardDefinitionIds: template.required_card_definition_ids,
  });
  assert.equal(analysis.valid, true);
  assert.deepEqual(analysis.witness.map((step) =>
    step.verification_outcome_id ?? step.target_fault_instance_key ?? step.repair_outcome_id), [
    undefined,
    undefined,
    'fault_instance.raid.member_failed',
    'fault_instance.raid.member_failed',
    'verification_outcome.raid.member_replacement_fail',
    'fault_instance.raid.array_degraded',
    'fault_instance.raid.array_degraded',
    'verification_outcome.raid.array_rebuild_pass',
  ]);
  assert.equal(template.ticket.closure_requirements.required_isolation_requirement_ids.length, 2);
  assert.equal(template.ticket.closure_requirements.required_repair_outcome_ids.length, 2);

  const single = templateById.get('ticket_template.storage.single_sas_member');
  const singleGraph = analyzeTicketCausalGraph(single.ticket);
  assert.equal(singleGraph.metrics.fault_count, 2);
  assert.equal(singleGraph.metrics.required_actionable_fault_count, 1);
  assert.equal(singleGraph.metrics.causal_depth, 0,
    'non-actionable downstream effects do not inflate actionable-DAG constraints');
  assert.equal(singleGraph.metrics.inbound_branching, 0);
  assert.equal(singleGraph.metrics.outbound_branching, 0);
});

test('canonical ordering and seeded selection make complete Builder results snapshot-identical', () => {
  const first = build(successConfiguration);
  const second = build(structuredClone(successConfiguration));
  const reversedContent = structuredClone(ticketContent);
  reversedContent.templates.reverse();
  const reversed = build(successConfiguration, { content: reversedContent });
  assert.deepEqual(second, first);
  assert.deepEqual(reversed, first);
  assert.equal(canonicalJson(reversed), canonicalJson(first));
  assert.deepEqual(first, readJson('examples/domain/ticket_builder_result.success.json'));
  assert.deepEqual(first.attempts[0].ticket_snapshot_digests,
    first.attempts[0].ticket_snapshots.map((snapshot) => sha256(snapshot)));
  assert.notEqual(first.attempts[0].ticket_snapshots[0], ticketContent.templates[0].ticket);
});

test('all hard template and queue-shape constraints are applied without relaxation', () => {
  const loose = templateById.get('ticket_template.storage.loose_cable');
  const cases = [
    {
      name: 'allowed domain footprint',
      configuration: broadConfiguration({
        allowed_domain_ids: loose.domain_reference_ids,
        allowed_tags: ['cabling'],
      }),
      status: 'SUCCESS',
      selected: ['ticket_template.storage.loose_cable'],
    },
    {
      name: 'excluded domain ID wins',
      configuration: broadConfiguration({
        allowed_tags: ['cabling'],
        excluded_domain_ids: ['fault.storage.cable.loose'],
      }),
      status: 'FAILURE',
      constraint: 'ALLOWED_EXCLUDED',
    },
    {
      name: 'authored difficulty',
      configuration: broadConfiguration({ authored_difficulty_bounds: { minimum: 4, maximum: 4 } }),
      status: 'SUCCESS',
      selected: ['ticket_template.storage.member_then_array'],
    },
    {
      name: 'Fault count',
      configuration: broadConfiguration({ fault_count_bounds: { minimum: 1, maximum: 1 } }),
      status: 'SUCCESS',
      selected: ['ticket_template.storage.loose_cable'],
    },
    {
      name: 'actionable count',
      configuration: broadConfiguration({
        required_actionable_fault_count_bounds: { minimum: 2, maximum: 2 },
      }),
      status: 'SUCCESS',
      selected: ['ticket_template.storage.member_then_array'],
    },
    {
      name: 'causal depth',
      configuration: broadConfiguration({ causal_depth_bounds: { minimum: 1, maximum: 1 } }),
      status: 'SUCCESS',
      selected: ['ticket_template.storage.member_then_array'],
    },
    {
      name: 'inbound branching',
      configuration: broadConfiguration({ inbound_branching_bounds: { minimum: 1, maximum: 1 } }),
      status: 'SUCCESS',
      selected: ['ticket_template.storage.member_then_array'],
    },
    {
      name: 'outbound branching',
      configuration: broadConfiguration({ outbound_branching_bounds: { minimum: 1, maximum: 1 } }),
      status: 'SUCCESS',
      selected: ['ticket_template.storage.member_then_array'],
    },
    {
      name: 'Progressive Difficulty band',
      configuration: broadConfiguration({
        progressive_difficulty_profile: {
          profile_id: 'profile.test_exact_two',
          profile_version: 'v1',
          explicit_ceiling: 2,
          bands: [{
            start_generated_index: 0,
            end_generated_index: 0,
            target: 2,
            minimum: 2,
            maximum: 2,
          }],
        },
      }),
      status: 'SUCCESS',
      selected: ['ticket_template.storage.single_sas_member'],
    },
    {
      name: 'legal Card pool',
      configuration: broadConfiguration({
        allowed_tags: ['cabling'],
        legal_card_definition_ids: successConfiguration.legal_card_definition_ids
          .filter((id) => id !== 'card.core.reseat_storage_cable'),
      }),
      status: 'FAILURE',
      constraint: 'CARD_POOL',
    },
    {
      name: 'teaching beat guarantee',
      configuration: broadConfiguration({ required_teaching_beats: ['failed_verify_reopens_diagnosis'] }),
      status: 'SUCCESS',
      selected: ['ticket_template.storage.member_then_array'],
    },
  ];

  for (const fixture of cases) {
    const result = build(fixture.configuration);
    assert.equal(result.status, fixture.status, fixture.name);
    if (fixture.selected) assert.deepEqual(selectedTemplateIds(result), fixture.selected, fixture.name);
    if (fixture.constraint) assert.ok(diagnosticConstraints(result).has(fixture.constraint), fixture.name);
  }
  assert.deepEqual(selectedTemplateIds(build(successConfiguration)), [
    'ticket_template.storage.loose_cable',
    'ticket_template.storage.single_sas_member',
  ]);
});

test('duplicate causal fingerprints and active queue fingerprints are explicit hard constraints', () => {
  const repeated = broadConfiguration({
    id: 'builder_config.test_repeated',
    requested_ticket_count: 2,
    allowed_tags: ['cabling'],
    progressive_difficulty_profile: {
      profile_id: 'profile.test_repeated',
      profile_version: 'v1',
      explicit_ceiling: 1,
      bands: [{
        start_generated_index: 0,
        end_generated_index: 1,
        target: 1,
        minimum: 1,
        maximum: 1,
      }],
    },
  });
  const rejected = build(repeated);
  assert.equal(rejected.status, 'FAILURE');
  assert.ok(diagnosticConstraints(rejected).has('DUPLICATE_FINGERPRINT'));

  repeated.allow_duplicate_causal_fingerprints = true;
  const permitted = build(repeated);
  assert.equal(permitted.status, 'SUCCESS');
  assert.deepEqual(selectedTemplateIds(permitted), [
    'ticket_template.storage.loose_cable',
    'ticket_template.storage.loose_cable',
  ]);

  const looseAnalysis = validateTicketSolvability(
    templateById.get('ticket_template.storage.loose_cable').ticket,
    {
      domainCatalog,
      cardCatalog,
      legalCardDefinitionIds: templateById.get('ticket_template.storage.loose_cable').required_card_definition_ids,
    },
  );
  const activeConflict = broadConfiguration({
    allowed_tags: ['cabling'],
    active_causal_fingerprints: [looseAnalysis.causalFingerprint],
  });
  const activeRejected = build(activeConflict);
  assert.equal(activeRejected.status, 'FAILURE');
  assert.ok(diagnosticConstraints(activeRejected).has('DUPLICATE_FINGERPRINT'));
});

test('causal, reference, authored-outcome, closure, and target-specific Card failures are rejected', () => {
  const advanced = templateById.get('ticket_template.storage.member_then_array');
  const mutations = [];

  const cycle = structuredClone(advanced.ticket);
  cycle.server_only_truth.causal_edge_ids.push('edge.fixture.reverse');
  cycle.server_only_truth.causal_edges.push({
    causal_edge_id: 'edge.fixture.reverse',
    cause_fault_instance_key: 'fault_instance.raid.array_degraded',
    effect_fault_instance_key: 'fault_instance.raid.member_failed',
  });
  mutations.push([cycle, /cycle|directed cycle/i]);

  const mismatchedEdge = structuredClone(advanced.ticket);
  [mismatchedEdge.server_only_truth.causal_edges[0].cause_fault_instance_key,
    mismatchedEdge.server_only_truth.causal_edges[0].effect_fault_instance_key] = [
    mismatchedEdge.server_only_truth.causal_edges[0].effect_fault_instance_key,
    mismatchedEdge.server_only_truth.causal_edges[0].cause_fault_instance_key,
  ];
  mismatchedEdge.server_only_truth.fault_instances[0].deepest = false;
  mismatchedEdge.server_only_truth.fault_instances[1].deepest = true;
  mutations.push([mismatchedEdge, /cause does not match|effect does not match/i]);

  const missingReference = structuredClone(advanced.ticket);
  missingReference.initial_symptom_ids[0] = 'symptom.fixture.missing';
  mutations.push([missingReference, /references missing/i]);

  const unsupportedEvidence = structuredClone(templateById.get('ticket_template.storage.loose_cable').ticket);
  unsupportedEvidence.authored_evidence_outcomes[0].candidate_effects[0].candidate_fault_id =
    'fault.storage.raid.controller_failed';
  mutations.push([unsupportedEvidence, /unsupported Evidence target/i]);

  const missingClosureIsolation = structuredClone(advanced.ticket);
  missingClosureIsolation.closure_requirements.required_isolation_requirement_ids.pop();
  mutations.push([missingClosureIsolation, /Closure Isolation list|Closure lacks/i]);

  const passAsEvidence = structuredClone(advanced.ticket);
  passAsEvidence.isolation_requirements[1].eligible_verification_outcome_ids = [
    'verification_outcome.raid.array_rebuild_pass',
  ];
  mutations.push([passAsEvidence, /only failed or inconclusive/i]);

  for (const [ticket, pattern] of mutations) {
    const result = validateTicketSolvability(ticket, {
      domainCatalog,
      cardCatalog,
      legalCardDefinitionIds: successConfiguration.legal_card_definition_ids,
    });
    assert.equal(result.valid, false);
    assert.match(result.errors.map((entry) => entry.detail).join('\n'), pattern);
  }

  const wrongComponentCatalog = structuredClone(cardCatalog);
  const driveCard = wrongComponentCatalog.cards.find((card) => card.id === 'card.core.drive_health_test');
  driveCard.play_contract.target_spec.allowed_component_definition_ids = ['component.storage.raid_controller'];
  const componentResult = validateTicketSolvability(advanced.ticket, {
    domainCatalog,
    cardCatalog: wrongComponentCatalog,
    legalCardDefinitionIds: advanced.required_card_definition_ids,
  });
  assert.equal(componentResult.valid, false);
  assert.match(componentResult.errors.map((entry) => entry.detail).join('\n'), /No legal Card executes Evidence source test.storage.drive_health/);

  const noRebuild = validateTicketSolvability(advanced.ticket, {
    domainCatalog,
    cardCatalog,
    legalCardDefinitionIds: advanced.required_card_definition_ids
      .filter((id) => id !== 'card.core.rebuild_raid_array'),
  });
  assert.equal(noRebuild.valid, false);
  assert.match(noRebuild.errors.map((entry) => entry.detail).join('\n'), /No legal Repair Card/);
});

test('invalid authored input cannot leak a valid partial batch', () => {
  const content = structuredClone(ticketContent);
  content.templates[0].ticket.server_only_truth.causal_edges.push({
    causal_edge_id: 'edge.fixture.self_loop',
    cause_fault_instance_key: 'fault_instance.storage.cable_loose',
    effect_fault_instance_key: 'fault_instance.storage.cable_loose',
  });
  content.templates[0].ticket.server_only_truth.causal_edge_ids.push('edge.fixture.self_loop');
  const result = build(successConfiguration, { content });
  assert.equal(result.status, 'FAILURE');
  assert.equal(result.selected_attempt_id, null);
  assert.equal(result.attempts.length, 1);
  assert.ok(result.attempts[0].diagnostics.length > 0);
  assert.deepEqual(result.attempts[0].selected_template_ids, []);
  assert.deepEqual(result.attempts[0].ticket_snapshot_digests, []);
  assert.deepEqual(result.attempts[0].ticket_snapshots, []);
});

test('UNSAT returns structured diagnostics and explicit fallback remains a separate audited attempt', () => {
  const failure = build(unsatisfiableConfiguration);
  assert.equal(failure.status, 'FAILURE');
  assert.equal(failure.selected_attempt_id, null);
  assert.deepEqual(failure, readJson('examples/domain/ticket_builder_result.unsatisfiable.json'));
  assert.ok(failure.attempts[0].diagnostics.every((diagnostic) =>
    diagnostic.code && diagnostic.constraint && diagnostic.detail));
  assert.deepEqual(failure.attempts[0].ticket_snapshots, []);

  const fallback = build(primaryWithFallbackConfiguration, {
    configurationsById: [fallbackConfiguration],
  });
  assert.equal(fallback.status, 'SUCCESS');
  assert.equal(fallback.attempts.length, 2);
  assert.equal(fallback.attempts[0].attempt_kind, 'PRIMARY');
  assert.equal(fallback.attempts[0].status, 'FAILURE');
  assert.deepEqual(fallback.attempts[0].ticket_snapshots, []);
  assert.equal(fallback.attempts[1].attempt_kind, 'FALLBACK');
  assert.equal(fallback.attempts[1].parent_attempt_id, fallback.attempts[0].attempt_id);
  assert.equal(fallback.selected_attempt_id, fallback.attempts[1].attempt_id);
  assert.equal(
    fallback.attempts[1].ticket_snapshots[0].generation_provenance.fallback_attempt_id,
    fallback.attempts[1].attempt_id,
  );
  assert.deepEqual(fallback, readJson('examples/domain/ticket_builder_result.fallback.json'));

  const missingFallback = build(primaryWithFallbackConfiguration);
  assert.equal(missingFallback.status, 'FAILURE');
  assert.equal(missingFallback.attempts.length, 1);
  assert.ok(missingFallback.attempts[0].diagnostics.some((diagnostic) =>
    diagnostic.code === 'FALLBACK_CONFIGURATION_NOT_FOUND'));
});

test('configuration semantics reject invalid versions, bounds, profile gaps, duplicate queue state, and fallback cycles', () => {
  const cases = [];
  const wrongVersion = broadConfiguration();
  wrongVersion.generator_version = 'ticket-builder-v0';
  cases.push(wrongVersion);
  const reversedBounds = broadConfiguration();
  reversedBounds.fault_count_bounds = { minimum: 2, maximum: 1 };
  cases.push(reversedBounds);
  const gap = broadConfiguration({ requested_ticket_count: 2 });
  cases.push(gap);
  const duplicateQueue = broadConfiguration();
  duplicateQueue.active_causal_fingerprints = ['a'.repeat(64), 'a'.repeat(64)];
  cases.push(duplicateQueue);
  const selfFallback = broadConfiguration();
  selfFallback.fallback_configuration_id = selfFallback.id;
  cases.push(selfFallback);
  for (const configuration of cases) {
    assert.ok(validateBuilderConfiguration(configuration).length > 0);
  }
});

test('Builder result schema forbids diagnostics on success and partial snapshots on failure', () => {
  const success = readJson('examples/domain/ticket_builder_result.success.json');
  const successWithDiagnostic = structuredClone(success);
  successWithDiagnostic.attempts[0].diagnostics.push({
    code: 'INVALID_CONFIGURATION',
    constraint: 'CONFIGURATION',
    detail: 'fixture',
    template_ids: [],
    requested_count: null,
    eligible_count: null,
    generated_index: null,
  });
  assert.match(validateJsonSchema(successWithDiagnostic, resultSchema, registry).join('\n'), /more than 0 items/);

  const failure = readJson('examples/domain/ticket_builder_result.unsatisfiable.json');
  const partialFailure = structuredClone(failure);
  partialFailure.attempts[0].ticket_snapshots.push(success.attempts[0].ticket_snapshots[0]);
  assert.match(validateJsonSchema(partialFailure, resultSchema, registry).join('\n'), /more than 0 items/);
});
