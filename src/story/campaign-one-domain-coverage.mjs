import { buildTicketsV3 } from '../builder/task-014.mjs';
import { deriveDiagnosticRelevance } from '../builder/diagnosis-v2.mjs';
import { validateTicketSolvability } from '../builder/ticket-solvability.mjs';
import { createQuietCascadeCampaignSettings } from './quiet-cascade-report.mjs';

export const CAMPAIGN_ONE_COVERAGE_VERSION = 'campaign-one-domain-coverage-v1';

const EXPECTED = Object.freeze({
  story_pack_version: 'story-pack-v1',
  story_pack_id: 'story.campaign.quiet_cascade.v1',
  story_content_version: 'quiet-cascade-characterization-v2',
  match_configuration_version: 'story-match-configuration-v1',
  ruleset_version: 'first-version-v2',
  generator_version: 'ticket-builder-v3',
  configuration_version: 'ticket-builder-v3',
  ticket_content_version: 'core-ticket-parts-v3',
  domain_content_version: 'core-domain-snapshot-technical-copy-v3',
  card_catalog_version: 'core-card-catalog-technical-copy-v4',
  deck_catalog_version: 'core-response-decks-v4',
  part_catalog_version: 'ticket-parts-v1',
  coverage_version: 'playable-coverage-v4',
  inventory: Object.freeze({
    knowledge_records: 257,
    action_bearing_records: 107,
    tests: 37,
    commands: 13,
    repairs: 35,
    validations: 22,
    promoted_diagnostics: 50,
    selected_repairs: 12,
    selected_validations: 9,
    playable_card_definitions: 71,
    supported_fingerprints: 12,
    records_by_entity_type: Object.freeze({
      command: 13,
      component: 25,
      fault: 42,
      fault_causal_edge: 17,
      protocol: 20,
      repair_procedure: 35,
      symptom: 33,
      test: 37,
      tool: 13,
      validation_procedure: 22,
    }),
  }),
  matches: 6,
  generated_tickets: 12,
  authored_isolation_routes: 16,
  campaign_unique: Object.freeze({
    symptoms: 9,
    public_candidate_faults: 28,
    truth_faults: 18,
    actionable_faults: 12,
    terminal_faults: 6,
    declared_diagnostic_plan_sources: 20,
    candidate_changing_diagnostics: 30,
    target_legal_diagnostics: 43,
    isolation_route_sources: 18,
    minimal_witness_diagnostics: 14,
    repairs: 12,
    verifications: 9,
  }),
  campaign_practice: Object.freeze({
    symptoms: 12,
    public_candidate_faults: 44,
    truth_fault_instances: 19,
    minimal_witness_diagnostics: 15,
    repairs: 12,
    verifications: 15,
  }),
  diagnostic_partition: Object.freeze({
    minimal_witness: 14,
    candidate_changing_but_non_minimal: 16,
    target_legal_candidate_neutral: 13,
    not_target_legal: 7,
  }),
});

const NARRATIVE_MENTION_LEDGER = Object.freeze({
  'story.match.qc01.shift01.wrong_device': Object.freeze([
    { text_id: 'text.qc01.match.shift01.setup', role: 'MATCH_SETUP_SYMPTOM', entity_ids: ['symptom.boot.wrong_device'] },
    { text_id: 'text.qc01.ch01.shift01.02', role: 'LIFECYCLE_TRAINING', concept_ids: ['HYPOTHESIZE', 'TEST', 'EVIDENCE'] },
    { text_id: 'text.qc01.v2.context.lifecycle.01', role: 'LIFECYCLE_TRAINING', concept_ids: ['TICKET', 'HYPOTHESIZE', 'TEST', 'EVIDENCE'] },
    { text_id: 'text.qc01.v2.context.lifecycle.02', role: 'LIFECYCLE_TRAINING', concept_ids: ['ISOLATE', 'REPAIR', 'VERIFY', 'DOCUMENT'] },
  ]),
  'story.match.qc01.shift02.power_lot': Object.freeze([
    { text_id: 'text.qc01.match.shift02.setup', role: 'MATCH_SETUP_SYMPTOM', entity_ids: ['symptom.power.redundancy_warning'] },
    { text_id: 'text.qc01.ch01.shift02.02', role: 'LIFECYCLE_TRAINING', concept_ids: ['EVIDENCE', 'ISOLATE', 'REPAIR', 'VERIFY'] },
    { text_id: 'text.qc01.ch01.shift02.success.02', role: 'OUTCOME_INTERPRETATION', concept_ids: ['SYMPTOM_IS_NOT_DIAGNOSIS'] },
  ]),
  'story.match.qc01.shift03.memory_compare': Object.freeze([
    { text_id: 'text.qc01.match.shift03.setup', role: 'MATCH_SETUP_SYMPTOM', entity_ids: ['symptom.system.intermittent_crash', 'symptom.boot.memory_warning'] },
    { text_id: 'text.qc01.ch02.shift03.02', role: 'LIFECYCLE_TRAINING', concept_ids: ['EVIDENCE', 'REPAIR', 'VERIFY'] },
  ]),
  'story.match.qc01.shift04.passes_cold': Object.freeze([
    { text_id: 'text.qc01.match.shift04.setup', role: 'MATCH_SETUP_SYMPTOM', entity_ids: ['symptom.thermal.high_cpu_temp'] },
    { text_id: 'text.qc01.ch02.shift04.02', role: 'LIFECYCLE_TRAINING', concept_ids: ['HYPOTHESIZE', 'EVIDENCE', 'REPAIR'] },
  ]),
  'story.match.qc01.shift05.no_offer': Object.freeze([
    { text_id: 'text.qc01.match.shift05.setup', role: 'MATCH_SETUP_SYMPTOM', entity_ids: ['symptom.network.no_connectivity'] },
    { text_id: 'text.qc01.ch03.shift05.02', role: 'LIFECYCLE_TRAINING', concept_ids: ['EVIDENCE', 'ISOLATE'] },
  ]),
  'story.match.qc01.shift06.quiet_cascade': Object.freeze([
    { text_id: 'text.qc01.match.shift06.setup', role: 'MATCH_SETUP_SYMPTOM', entity_ids: ['symptom.boot.no_boot_device', 'symptom.storage.io_errors', 'symptom.storage.raid_degraded'] },
    { text_id: 'text.qc01.ch04.shift06.02', role: 'LIFECYCLE_TRAINING', concept_ids: ['ISOLATE', 'DOCUMENT'] },
  ]),
});

const ABSENT_DOMAIN_OPPORTUNITIES = Object.freeze([
  {
    dependency_rank: 1,
    opportunity_id: 'opportunity.absent.virtual_network_path',
    label: 'Virtual network adapter and link path',
    likely_entity_types: ['component'],
    source_path: 'docs/case_studies/v0.1/candidate_materials/domain-objects.md',
    source_heading: 'Virtual network adapter and link path',
    dependency_reason: 'A virtualization episode needs a targetable virtual adapter or switch path before diagnostics can distinguish it from a physical NIC or cable.',
  },
  {
    dependency_rank: 2,
    opportunity_id: 'opportunity.absent.psu_self_start',
    label: 'Standalone PSU self-start procedure',
    likely_entity_types: ['test', 'protocol'],
    source_path: 'docs/case_studies/v0.1/candidate_materials/domain-objects.md',
    source_heading: 'Standalone PSU self-start test',
    dependency_reason: 'The safety/interface contract must exist before an authored outcome or Isolation route can use this procedure.',
  },
  {
    dependency_rank: 3,
    opportunity_id: 'opportunity.absent.dedicated_psu_tester',
    label: 'Dedicated PSU tester',
    likely_entity_types: ['tool'],
    source_path: 'docs/case_studies/v0.1/candidate_materials/domain-objects.md',
    source_heading: 'Dedicated PSU tester',
    dependency_reason: 'This Tool is useful only after a compatible Test defines safe interpretation and supported targets.',
  },
  {
    dependency_rank: 4,
    opportunity_id: 'opportunity.absent.packet_capture',
    label: 'Packet capture and DHCP packet inspection',
    likely_entity_types: ['command', 'test', 'tool'],
    source_path: 'docs/case_studies/v0.1/candidate_materials/domain-objects.md',
    source_heading: 'Packet capture and DHCP packet inspection',
    dependency_reason: 'The current DHCP transaction trace uses the client exchange; packet capture remains a distinct acquisition/tooling path and needs all three contracts reconciled before play.',
  },
]);

const ROLE_ENTITY_TYPES = Object.freeze({
  GLOBAL_CATALOG: null,
  PLAYABLE_ACTION: new Set(['test', 'command', 'repair_procedure', 'validation_procedure']),
  STORY_PUBLIC_SYMPTOM: new Set(['symptom']),
  STORY_PUBLIC_CANDIDATE: new Set(['fault']),
  STORY_TRUE_ACTIONABLE_FAULT: new Set(['fault']),
  STORY_TRUE_TERMINAL_FAULT: new Set(['fault']),
  PUBLIC_GRAPH_RELEVANT_DIAGNOSTIC: new Set(['test', 'command']),
  TARGET_LEGAL_DIAGNOSTIC: new Set(['test', 'command']),
  CANDIDATE_CHANGING_DIAGNOSTIC: new Set(['test', 'command']),
  DECLARED_DIAGNOSTIC_PLAN_SOURCE: new Set(['test', 'command']),
  ISOLATION_ROUTE_SOURCE: new Set(['test', 'command']),
  MINIMAL_WITNESS_DIAGNOSTIC: new Set(['test', 'command']),
  CLOSURE_REQUIRED_REPAIR: new Set(['repair_procedure']),
  CLOSURE_REQUIRED_VERIFY: new Set(['validation_procedure']),
  PUBLIC_CANDIDATE_COMPONENT: new Set(['component']),
  TRUE_AFFECTED_COMPONENT: new Set(['component']),
  TECHNICAL_DEPENDENCY_COMPONENT: new Set(['component']),
  TECHNICAL_DEPENDENCY_TOOL: new Set(['tool']),
  TECHNICAL_DEPENDENCY_COMMAND: new Set(['command']),
  TECHNICAL_DEPENDENCY_PROTOCOL: new Set(['protocol']),
  NARRATIVE_MENTION: null,
});

const clone = (value) => structuredClone(value);
const stableCompare = (left, right) => (left < right ? -1 : left > right ? 1 : 0);
const sorted = (values) => [...new Set(values)].sort(stableCompare);
const sum = (values) => values.reduce((total, value) => total + value, 0);

function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort(stableCompare).map((key) => [key, normalize(value[key])]));
  }
  return value;
}

export const stableCoverageJson = (value) => `${JSON.stringify(normalize(value), null, 2)}\n`;

function auditError(code, detail) {
  const error = new Error(`${code}: ${detail}`);
  error.code = code;
  return error;
}

function assertAudit(condition, code, detail) {
  if (!condition) throw auditError(code, detail);
}

function exact(actual, expected, label) {
  assertAudit(actual === expected, 'PIN_MISMATCH', `${label} expected ${expected}; received ${actual}.`);
}

function sameIds(left, right) {
  return JSON.stringify(sorted(left)) === JSON.stringify(sorted(right));
}

function countBy(values) {
  const counts = {};
  for (const value of values) counts[value] = (counts[value] ?? 0) + 1;
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => stableCompare(left, right)));
}

function repeated(counts) {
  return Object.entries(counts)
    .filter(([, count]) => count > 1)
    .map(([id, count]) => ({ id, count }))
    .sort((left, right) => right.count - left.count || stableCompare(left.id, right.id));
}

function entityDependencies(entity) {
  return {
    component_ids: sorted([...(entity.target_component_ids ?? []), ...(entity.required_component_ids ?? [])]),
    tool_ids: sorted([...(entity.tool_requirement_ids ?? []), ...(entity.required_tool_ids ?? [])]),
    command_ids: sorted(entity.command_requirement_ids ?? []),
    protocol_ids: sorted(entity.required_protocol_ids ?? []),
  };
}

function unionDependencies(ids, entityById) {
  const dependencies = { component_ids: [], tool_ids: [], command_ids: [], protocol_ids: [] };
  for (const id of ids) {
    const entity = entityById.get(id);
    assertAudit(entity, 'REFERENCE_NOT_FOUND', `Technical dependency source ${id} is absent from the canonical domain.`);
    const current = entityDependencies(entity);
    for (const key of Object.keys(dependencies)) dependencies[key].push(...current[key]);
  }
  return Object.fromEntries(Object.entries(dependencies).map(([key, values]) => [key, sorted(values)]));
}

function validatePins({ manifest, matches, coverage, catalogs }) {
  exact(manifest.pack_version, EXPECTED.story_pack_version, 'Story pack version');
  exact(manifest.pack_id, EXPECTED.story_pack_id, 'Story pack ID');
  exact(manifest.content_version, EXPECTED.story_content_version, 'Story content version');
  exact(matches.match_configuration_version, EXPECTED.match_configuration_version, 'Match configuration version');
  exact(matches.campaign_id, EXPECTED.story_pack_id, 'Match campaign ID');
  const profile = matches.builder_profile;
  for (const [key, expected] of Object.entries({
    ruleset_version: EXPECTED.ruleset_version,
    generator_version: EXPECTED.generator_version,
    configuration_version: EXPECTED.configuration_version,
    ticket_content_version: EXPECTED.ticket_content_version,
    domain_content_version: EXPECTED.domain_content_version,
    card_catalog_version: EXPECTED.card_catalog_version,
    deck_catalog_version: EXPECTED.deck_catalog_version,
    part_catalog_version: EXPECTED.part_catalog_version,
  })) exact(profile[key], expected, `Builder profile ${key}`);
  exact(coverage.coverage_version, EXPECTED.coverage_version, 'Coverage version');
  exact(coverage.ticket_content_version, EXPECTED.ticket_content_version, 'Coverage Ticket content version');
  exact(coverage.domain_content_version, EXPECTED.domain_content_version, 'Coverage domain version');
  exact(coverage.card_catalog_version, EXPECTED.card_catalog_version, 'Coverage Card version');
  exact(catalogs.domain.domain_content_version, EXPECTED.domain_content_version, 'Domain snapshot version');
  exact(catalogs.cards.card_catalog_version, EXPECTED.card_catalog_version, 'Card catalog version');
  exact(catalogs.decks.deck_catalog_version, EXPECTED.deck_catalog_version, 'Deck catalog version');
  exact(catalogs.parts.part_catalog_version, EXPECTED.part_catalog_version, 'Part catalog version');
}

function validateInventory(coverage, canonicalEntities) {
  for (const [key, expected] of Object.entries(EXPECTED.inventory)) {
    if (key === 'records_by_entity_type') continue;
    exact(coverage.inventory[key], expected, `Coverage inventory ${key}`);
  }
  const actualByType = countBy(canonicalEntities.map((entity) => entity.entity_type));
  exact(canonicalEntities.length, EXPECTED.inventory.knowledge_records, 'Canonical domain record total');
  for (const [type, expected] of Object.entries(EXPECTED.inventory.records_by_entity_type)) {
    exact(actualByType[type] ?? 0, expected, `Canonical ${type} count`);
    exact(coverage.inventory.records_by_entity_type[type], expected, `Coverage ${type} count`);
  }
  return actualByType;
}

function validateCanonicalSnapshot(canonicalEntities, snapshotEntities) {
  const canonical = new Map();
  for (const entity of canonicalEntities) {
    assertAudit(!canonical.has(entity.id), 'DUPLICATE_ID', `Canonical packs repeat ${entity.id}.`);
    canonical.set(entity.id, entity);
  }
  const snapshot = new Map();
  for (const entity of snapshotEntities) {
    assertAudit(!snapshot.has(entity.id), 'DUPLICATE_ID', `Domain snapshot repeats ${entity.id}.`);
    snapshot.set(entity.id, entity);
  }
  assertAudit(sameIds(canonical.keys(), snapshot.keys()), 'SNAPSHOT_DRIFT', 'Canonical packs and pinned domain snapshot do not contain the same stable IDs.');
  for (const [id, entity] of canonical) {
    exact(snapshot.get(id)?.entity_type, entity.entity_type, `Entity type for ${id}`);
  }
  return canonical;
}

function enrichWitness(ticket, witness) {
  const repairById = new Map(ticket.authored_repair_outcomes.map((outcome) => [outcome.outcome_id, outcome]));
  const verifyById = new Map(ticket.authored_verification_outcomes.map((outcome) => [outcome.outcome_id, outcome]));
  return witness.map((step) => {
    if (step.action === 'PERFORM_REPAIR') {
      const outcome = repairById.get(step.repair_outcome_id);
      return { ...step, repair_procedure_id: outcome?.repair_procedure_id ?? null };
    }
    if (step.action === 'PERFORM_VERIFY') {
      const outcome = verifyById.get(step.verification_outcome_id);
      return { ...step, validation_procedure_id: outcome?.validation_procedure_id ?? null };
    }
    return clone(step);
  });
}

function publicCandidateComponents(ticket, entityById) {
  return sorted(ticket.public_candidate_fault_ids.flatMap((id) => entityById.get(id)?.affected_component_ids ?? []));
}

function trueComponents(ticket, entityById) {
  return sorted(ticket.server_only_truth.fault_instances.flatMap((instance) =>
    entityById.get(instance.fault_id)?.affected_component_ids ?? []));
}

function nameFor(id, entityById) {
  return entityById.get(id)?.presentation?.display_name ?? id;
}

export function validateCampaignOneCoverageLedger(ledger) {
  const rows = new Map(ledger.entity_coverage.map((row) => [row.id, row]));
  assertAudit(rows.size === ledger.entity_coverage.length, 'DUPLICATE_ID', 'Entity coverage rows must be unique.');
  for (const row of rows.values()) {
    for (const use of row.coverage_roles) {
      const allowed = ROLE_ENTITY_TYPES[use.role];
      assertAudit(allowed !== undefined || use.role === 'GLOBAL_CATALOG', 'IMPOSSIBLE_ROLE', `Unknown coverage role ${use.role}.`);
      if (allowed) assertAudit(allowed.has(row.entity_type), 'IMPOSSIBLE_ROLE', `${row.id} (${row.entity_type}) cannot carry ${use.role}.`);
    }
  }
  const totals = ledger.deterministic_totals;
  exact(totals.matches, EXPECTED.matches, 'Campaign Match total');
  exact(totals.generated_tickets, EXPECTED.generated_tickets, 'Campaign Ticket total');
  exact(totals.authored_isolation_routes, EXPECTED.authored_isolation_routes, 'Authored Isolation route total');
  for (const [key, expected] of Object.entries(EXPECTED.campaign_unique)) exact(totals.unique[key], expected, `Campaign unique ${key}`);
  for (const [key, expected] of Object.entries(EXPECTED.campaign_practice)) exact(totals.practice[key], expected, `Campaign practice ${key}`);
  exact(totals.diagnostic_partition.denominator, EXPECTED.inventory.promoted_diagnostics, 'Diagnostic partition denominator');
  for (const [key, expected] of Object.entries(EXPECTED.diagnostic_partition)) {
    exact(totals.diagnostic_partition.counts[key], expected, `Diagnostic partition ${key}`);
    exact(totals.diagnostic_partition.classes[key].length, expected, `Diagnostic partition ${key} ID count`);
  }
  const partitionIds = Object.values(totals.diagnostic_partition.classes).flat();
  assertAudit(partitionIds.length === EXPECTED.inventory.promoted_diagnostics
    && new Set(partitionIds).size === EXPECTED.inventory.promoted_diagnostics,
  'DIAGNOSTIC_PARTITION_DRIFT', 'Diagnostic partition must be disjoint and exhaust all 50 playable diagnostics.');
  for (const id of partitionIds) {
    const row = rows.get(id);
    assertAudit(row && ['test', 'command'].includes(row.entity_type), 'DIAGNOSTIC_PARTITION_DRIFT', `${id} is not a canonical diagnostic.`);
  }
  exact(totals.diagnostic_partition.declared_diagnostic_plan_source_count, 20, 'Declared diagnostic-plan source count');
  return [];
}

export function buildCampaignOneDomainCoverage({
  manifest,
  matchRegistry,
  textCatalog,
  baselineSettings,
  catalogs,
  coverage,
  canonicalEntities,
  caseStudyRegistry,
}) {
  validatePins({ manifest, matches: matchRegistry, coverage, catalogs });
  const domainCounts = validateInventory(coverage, canonicalEntities);
  const entityById = validateCanonicalSnapshot(canonicalEntities, catalogs.domain.entities);
  const cardById = new Map(catalogs.cards.cards.map((card) => [card.id, card]));
  const fingerprintById = new Map(coverage.fingerprints.map((entry) => [entry.fingerprint_id, entry]));
  exact(fingerprintById.size, EXPECTED.inventory.supported_fingerprints, 'Supported fingerprint total');
  exact(matchRegistry.matches.length, EXPECTED.matches, 'Authored Match total');

  const roleUses = new Map(canonicalEntities.map((entity) => [entity.id, []]));
  const addRole = (id, role, location = {}) => {
    const entity = entityById.get(id);
    assertAudit(entity, 'REFERENCE_NOT_FOUND', `${role} references missing stable ID ${id}.`);
    const allowed = ROLE_ENTITY_TYPES[role];
    assertAudit(allowed !== undefined || role === 'GLOBAL_CATALOG', 'IMPOSSIBLE_ROLE', `Unknown coverage role ${role}.`);
    if (allowed) assertAudit(allowed.has(entity.entity_type), 'IMPOSSIBLE_ROLE', `${id} (${entity.entity_type}) cannot carry ${role}.`);
    const use = { role, ...location };
    const signature = JSON.stringify(normalize(use));
    if (!roleUses.get(id).some((existing) => JSON.stringify(normalize(existing)) === signature)) roleUses.get(id).push(use);
  };
  canonicalEntities.forEach((entity) => addRole(entity.id, 'GLOBAL_CATALOG'));

  for (const id of coverage.selected_action_definition_ids) addRole(id, 'PLAYABLE_ACTION');
  const selectedTypes = countBy(coverage.selected_action_definition_ids.map((id) => entityById.get(id)?.entity_type));
  exact(selectedTypes.test + selectedTypes.command, EXPECTED.inventory.promoted_diagnostics, 'Playable diagnostic source total');
  exact(selectedTypes.repair_procedure, EXPECTED.inventory.selected_repairs, 'Playable Repair source total');
  exact(selectedTypes.validation_procedure, EXPECTED.inventory.selected_validations, 'Playable Verify source total');

  const diagnosticCards = catalogs.cards.cards.filter((card) => card.play_contract?.contract_type === 'DIAGNOSTIC');
  exact(diagnosticCards.length, EXPECTED.inventory.promoted_diagnostics, 'Global Bench Card total');
  const globalDiagnosticSourceIds = sorted(diagnosticCards.map((card) => card.play_contract.source_definition_id));
  assertAudit(globalDiagnosticSourceIds.every((id) => coverage.selected_action_definition_ids.includes(id)), 'PLAYABLE_DRIFT', 'Every Bench diagnostic must resolve to a selected playable source.');

  const textEntries = textCatalog.entries;
  const settings = createQuietCascadeCampaignSettings(matchRegistry, baselineSettings);
  const shifts = [];
  const occurrences = {
    symptoms: [], public_candidate_faults: [], truth_faults: [], actionable_faults: [], terminal_faults: [],
    declared_diagnostic_plan_sources: [], target_legal_diagnostics: [], candidate_changing_diagnostics: [],
    isolation_route_sources: [], minimal_witness_diagnostics: [], repairs: [], verifications: [],
  };
  const allRouteDependencyIds = { component_ids: [], tool_ids: [], command_ids: [], protocol_ids: [] };
  let routeCount = 0;

  for (const [matchIndex, definition] of matchRegistry.matches.entries()) {
    const group = settings.setting_groups[matchIndex];
    assertAudit(group, 'MATCH_CONFIGURATION_MISSING', `No generated settings group for ${definition.match_ref}.`);
    const result = buildTicketsV3({
      configuration: clone(group.ticket_source.builder_configuration),
      catalogs,
    });
    assertAudit(result.status === 'SUCCESS', 'BUILDER_FAILURE', `${definition.match_ref} did not reconstruct successfully.`);
    const attempt = result.attempts.find((entry) => entry.attempt_id === result.selected_attempt_id);
    assertAudit(attempt, 'BUILDER_FAILURE', `${definition.match_ref} has no selected Builder attempt.`);
    assertAudit(JSON.stringify(attempt.ticket_snapshots.map((ticket) => ticket.id)) === JSON.stringify(definition.expected_ticket_definition_ids),
      'TICKET_PIN_MISMATCH', `${definition.match_ref} generated different Ticket IDs.`);
    assertAudit(JSON.stringify(attempt.ticket_snapshot_digests) === JSON.stringify(definition.expected_ticket_snapshot_digests),
      'TICKET_PIN_MISMATCH', `${definition.match_ref} generated different Ticket digests.`);

    const narrativeMentions = clone(NARRATIVE_MENTION_LEDGER[definition.match_ref] ?? []);
    assertAudit(narrativeMentions.length > 0, 'NARRATIVE_LEDGER_MISSING', `${definition.match_ref} has no narrative mention ledger.`);
    for (const mention of narrativeMentions) {
      assertAudit(typeof textEntries[mention.text_id] === 'string', 'NARRATIVE_TEXT_MISSING', `${mention.text_id} is absent from the pinned text catalog.`);
      for (const id of mention.entity_ids ?? []) addRole(id, 'NARRATIVE_MENTION', { match_ref: definition.match_ref, text_id: mention.text_id, mention_role: mention.role });
    }

    const tickets = attempt.ticket_snapshots.map((ticket, ticketIndex) => {
      const fingerprint = fingerprintById.get(ticket.generation_provenance.fingerprint_id);
      assertAudit(fingerprint, 'REFERENCE_NOT_FOUND', `${ticket.id} references missing fingerprint ${ticket.generation_provenance.fingerprint_id}.`);
      assertAudit(definition.allowed_fingerprint_ids.includes(fingerprint.fingerprint_id), 'FINGERPRINT_NOT_ALLOWED', `${ticket.id} is outside ${definition.match_ref}'s allowlist.`);
      assertAudit(sameIds(ticket.initial_symptom_ids, fingerprint.symptom_ids), 'FINGERPRINT_DRIFT', `${ticket.id} Symptoms differ from ${fingerprint.fingerprint_id}.`);
      assertAudit(sameIds(ticket.public_candidate_fault_ids, fingerprint.public_candidate_fault_ids), 'FINGERPRINT_DRIFT', `${ticket.id} Candidates differ from ${fingerprint.fingerprint_id}.`);

      const location = { match_ref: definition.match_ref, ticket_id: ticket.id };
      ticket.initial_symptom_ids.forEach((id) => addRole(id, 'STORY_PUBLIC_SYMPTOM', location));
      ticket.public_candidate_fault_ids.forEach((id) => addRole(id, 'STORY_PUBLIC_CANDIDATE', location));
      for (const instance of ticket.server_only_truth.fault_instances) {
        addRole(instance.fault_id, instance.role === 'ACTIONABLE' ? 'STORY_TRUE_ACTIONABLE_FAULT' : 'STORY_TRUE_TERMINAL_FAULT', location);
      }

      const relevance = deriveDiagnosticRelevance({ ticket, domainCatalog: catalogs.domain, cardCatalog: catalogs.cards });
      const relevantDiagnosticSourceIds = sorted(diagnosticCards
        .filter((card) => relevance.get(card.id)?.relevant)
        .map((card) => card.play_contract.source_definition_id));
      relevantDiagnosticSourceIds.forEach((id) => addRole(id, 'PUBLIC_GRAPH_RELEVANT_DIAGNOSTIC', location));

      const targetLegalDiagnosticIds = sorted(ticket.authored_evidence_outcomes.map((outcome) => outcome.source_definition_id));
      assertAudit(targetLegalDiagnosticIds.every((id) => globalDiagnosticSourceIds.includes(id)), 'PLAYABLE_DRIFT', `${ticket.id} has an authored outcome for a non-Bench diagnostic.`);
      const candidateChangingDiagnosticIds = sorted(ticket.authored_evidence_outcomes
        .filter((outcome) => (outcome.candidate_effects ?? []).length > 0)
        .map((outcome) => outcome.source_definition_id));
      targetLegalDiagnosticIds.forEach((id) => addRole(id, 'TARGET_LEGAL_DIAGNOSTIC', location));
      candidateChangingDiagnosticIds.forEach((id) => addRole(id, 'CANDIDATE_CHANGING_DIAGNOSTIC', location));

      const declaredDiagnosticPlanSourceIds = sorted(fingerprint.diagnostic_source_ids);
      declaredDiagnosticPlanSourceIds.forEach((id) => addRole(id, 'DECLARED_DIAGNOSTIC_PLAN_SOURCE', location));
      const routes = ticket.isolation_requirements.flatMap((requirement) => requirement.routes.map((route) => {
        const sourceDefinitionIds = route.eligible_outcome_ids.map((outcomeId) => {
          const outcome = ticket.authored_evidence_outcomes.find((entry) => entry.outcome_id === outcomeId);
          assertAudit(outcome, 'REFERENCE_NOT_FOUND', `${route.route_id} references missing Evidence outcome ${outcomeId}.`);
          return outcome.source_definition_id;
        });
        sourceDefinitionIds.forEach((id) => addRole(id, 'ISOLATION_ROUTE_SOURCE', { ...location, route_id: route.route_id }));
        return {
          route_id: route.route_id,
          route_kind: route.route_kind,
          minimum_distinct_outcomes: route.minimum_distinct_outcomes ?? 1,
          source_definition_ids: sourceDefinitionIds,
          eligible_outcome_ids: [...route.eligible_outcome_ids],
        };
      }));
      routeCount += routes.length;
      const routeSourceIds = sorted(routes.flatMap((route) => route.source_definition_ids));

      const solvability = validateTicketSolvability(ticket, {
        domainCatalog: catalogs.domain,
        cardCatalog: catalogs.cards,
        legalCardDefinitionIds: group.ticket_source.builder_configuration.legal_card_definition_ids,
      });
      assertAudit(solvability.valid && Array.isArray(solvability.witness), 'SOLVABILITY_FAILURE', `${ticket.id} lacks a complete deterministic witness.`);
      const witness = enrichWitness(ticket, solvability.witness);
      const minimalDiagnosticIds = witness.filter((step) => step.action === 'RUN_DIAGNOSTIC').map((step) => step.source_definition_id);
      minimalDiagnosticIds.forEach((id) => addRole(id, 'MINIMAL_WITNESS_DIAGNOSTIC', location));
      const repairIds = sorted(ticket.repair_requirements.flatMap((requirement) => requirement.eligible_repair_procedure_ids));
      const verifyIds = sorted(ticket.verification_requirements.map((requirement) => requirement.validation_procedure_id));
      repairIds.forEach((id) => addRole(id, 'CLOSURE_REQUIRED_REPAIR', location));
      verifyIds.forEach((id) => addRole(id, 'CLOSURE_REQUIRED_VERIFY', location));

      const publicComponentIds = publicCandidateComponents(ticket, entityById);
      const truthComponentIds = trueComponents(ticket, entityById);
      publicComponentIds.forEach((id) => addRole(id, 'PUBLIC_CANDIDATE_COMPONENT', location));
      truthComponentIds.forEach((id) => addRole(id, 'TRUE_AFFECTED_COMPONENT', location));
      const minimalActionIds = [...minimalDiagnosticIds, ...repairIds, ...verifyIds];
      const minimalDependencies = unionDependencies(minimalActionIds, entityById);
      const allRouteDependencies = unionDependencies([...routeSourceIds, ...repairIds, ...verifyIds], entityById);
      for (const [key, ids] of Object.entries(allRouteDependencies)) allRouteDependencyIds[key].push(...ids);
      for (const id of allRouteDependencies.component_ids) addRole(id, 'TECHNICAL_DEPENDENCY_COMPONENT', location);
      for (const id of allRouteDependencies.tool_ids) addRole(id, 'TECHNICAL_DEPENDENCY_TOOL', location);
      for (const id of allRouteDependencies.command_ids) addRole(id, 'TECHNICAL_DEPENDENCY_COMMAND', location);
      for (const id of allRouteDependencies.protocol_ids) addRole(id, 'TECHNICAL_DEPENDENCY_PROTOCOL', location);

      occurrences.symptoms.push(...ticket.initial_symptom_ids);
      occurrences.public_candidate_faults.push(...ticket.public_candidate_fault_ids);
      occurrences.truth_faults.push(...ticket.server_only_truth.fault_instances.map((instance) => instance.fault_id));
      occurrences.actionable_faults.push(...ticket.server_only_truth.fault_instances.filter((instance) => instance.role === 'ACTIONABLE').map((instance) => instance.fault_id));
      occurrences.terminal_faults.push(...ticket.server_only_truth.fault_instances.filter((instance) => instance.role !== 'ACTIONABLE').map((instance) => instance.fault_id));
      occurrences.declared_diagnostic_plan_sources.push(...declaredDiagnosticPlanSourceIds);
      occurrences.target_legal_diagnostics.push(...targetLegalDiagnosticIds);
      occurrences.candidate_changing_diagnostics.push(...candidateChangingDiagnosticIds);
      occurrences.isolation_route_sources.push(...routeSourceIds);
      occurrences.minimal_witness_diagnostics.push(...minimalDiagnosticIds);
      occurrences.repairs.push(...repairIds);
      occurrences.verifications.push(...verifyIds);

      return {
        ticket_id: ticket.id,
        ticket_snapshot_digest: attempt.ticket_snapshot_digests[ticketIndex],
        fingerprint_id: fingerprint.fingerprint_id,
        display_name: ticket.presentation.display_name,
        educational_objectives: [...ticket.educational_objectives],
        public: {
          symptom_ids: [...ticket.initial_symptom_ids],
          candidate_fault_ids: [...ticket.public_candidate_fault_ids],
          public_context_entity_ids: [...ticket.public_context_entity_ids],
        },
        server_only_truth: clone(ticket.server_only_truth),
        diagnostics: {
          global_legal_source_ids: globalDiagnosticSourceIds,
          public_graph_relevant_source_ids: relevantDiagnosticSourceIds,
          target_legal_source_ids: targetLegalDiagnosticIds,
          candidate_changing_source_ids: candidateChangingDiagnosticIds,
          target_legal_candidate_neutral_source_ids: sorted(targetLegalDiagnosticIds.filter((id) => !candidateChangingDiagnosticIds.includes(id))),
          not_target_legal_source_ids: sorted(globalDiagnosticSourceIds.filter((id) => !targetLegalDiagnosticIds.includes(id))),
          declared_diagnostic_plan_source_ids: declaredDiagnosticPlanSourceIds,
          isolation_routes: routes,
          minimal_witness_source_ids: [...minimalDiagnosticIds],
          optional_candidate_changing_source_ids: sorted(candidateChangingDiagnosticIds.filter((id) => !routeSourceIds.includes(id))),
          alternate_route_source_ids_not_in_minimal_witness: sorted(routeSourceIds.filter((id) => !minimalDiagnosticIds.includes(id))),
          public_graph_relevant_but_not_candidate_changing_source_ids: sorted(relevantDiagnosticSourceIds.filter((id) => !candidateChangingDiagnosticIds.includes(id))),
        },
        closure: {
          repair_procedure_ids: repairIds,
          validation_procedure_ids: verifyIds,
          closure_requirements: clone(ticket.closure_requirements),
          explicit_document_live_required: false,
          closure_publication_required: true,
        },
        domain_support: {
          public_candidate_component_ids: publicComponentIds,
          true_affected_component_ids: truthComponentIds,
          minimal_witness_dependencies: minimalDependencies,
          all_authored_route_dependencies: allRouteDependencies,
        },
        minimal_authored_route: witness,
      };
    });

    shifts.push({
      shift_id: definition.shift_id,
      match_ref: definition.match_ref,
      proof_match_id: `task-027-quiet-cascade-v1.story-qc01-shift-${String(matchIndex + 1).padStart(2, '0')}.seed-${definition.seed}`,
      seed: definition.seed,
      requested_ticket_count: definition.requested_ticket_count,
      title_text_id: definition.title_text_id,
      setup_text_id: definition.setup_text_id,
      narrative_mentions: narrativeMentions,
      tickets,
    });
  }

  exact(routeCount, EXPECTED.authored_isolation_routes, 'Authored Isolation route total');
  const unique = {
    symptoms: sorted(occurrences.symptoms).length,
    public_candidate_faults: sorted(occurrences.public_candidate_faults).length,
    truth_faults: sorted(occurrences.truth_faults).length,
    actionable_faults: sorted(occurrences.actionable_faults).length,
    terminal_faults: sorted(occurrences.terminal_faults).length,
    declared_diagnostic_plan_sources: sorted(occurrences.declared_diagnostic_plan_sources).length,
    candidate_changing_diagnostics: sorted(occurrences.candidate_changing_diagnostics).length,
    target_legal_diagnostics: sorted(occurrences.target_legal_diagnostics).length,
    isolation_route_sources: sorted(occurrences.isolation_route_sources).length,
    minimal_witness_diagnostics: sorted(occurrences.minimal_witness_diagnostics).length,
    repairs: sorted(occurrences.repairs).length,
    verifications: sorted(occurrences.verifications).length,
  };
  const practice = {
    symptoms: occurrences.symptoms.length,
    public_candidate_faults: occurrences.public_candidate_faults.length,
    truth_fault_instances: occurrences.truth_faults.length,
    minimal_witness_diagnostics: occurrences.minimal_witness_diagnostics.length,
    repairs: occurrences.repairs.length,
    verifications: occurrences.verifications.length,
  };

  const campaignSymptomIds = sorted(occurrences.symptoms);
  const campaignCandidateIds = sorted(occurrences.public_candidate_faults);
  const campaignEdgeIds = sorted(coverage.fingerprints.flatMap((fingerprint) => fingerprint.causal_edge_ids));
  const declaredDiagnosticPlanSourceIds = sorted(occurrences.declared_diagnostic_plan_sources);
  const candidateChangingDiagnosticIds = sorted(occurrences.candidate_changing_diagnostics);
  const targetLegalDiagnosticIds = sorted(occurrences.target_legal_diagnostics);
  const minimalWitnessDiagnosticIds = sorted(occurrences.minimal_witness_diagnostics);
  const diagnosticPartition = {
    minimal_witness: minimalWitnessDiagnosticIds,
    candidate_changing_but_non_minimal: candidateChangingDiagnosticIds.filter((id) => !minimalWitnessDiagnosticIds.includes(id)),
    target_legal_candidate_neutral: targetLegalDiagnosticIds.filter((id) => !candidateChangingDiagnosticIds.includes(id)),
    not_target_legal: globalDiagnosticSourceIds.filter((id) => !targetLegalDiagnosticIds.includes(id)),
  };
  exact(diagnosticPartition.minimal_witness.length, 14, 'Minimal-witness diagnostic partition count');
  exact(diagnosticPartition.candidate_changing_but_non_minimal.length, 16, 'Candidate-changing non-minimal partition count');
  exact(diagnosticPartition.target_legal_candidate_neutral.length, 13, 'Target-legal candidate-neutral partition count');
  exact(diagnosticPartition.not_target_legal.length, 7, 'Not-target-legal partition count');
  const partitionIds = Object.values(diagnosticPartition).flat();
  assertAudit(partitionIds.length === globalDiagnosticSourceIds.length
    && new Set(partitionIds).size === globalDiagnosticSourceIds.length
    && sameIds(partitionIds, globalDiagnosticSourceIds), 'DIAGNOSTIC_PARTITION_DRIFT', 'The four diagnostic opportunity classes must be disjoint and exhaust the 50-card Global Bench.');
  const allRouteDependencies = Object.fromEntries(Object.entries(allRouteDependencyIds).map(([key, ids]) => [key, sorted(ids)]));
  const allByType = (type) => sorted(canonicalEntities.filter((entity) => entity.entity_type === type).map((entity) => entity.id));
  const deferredByType = Object.groupBy(coverage.deferred_action_definition_ids, (id) => entityById.get(id)?.entity_type ?? 'missing');
  const opportunityInventory = {
    ordering_basis: 'Dependency order only: existing executable contracts before incomplete domain paths before absent-domain research. No popularity or Q claim is made.',
    uncovered_but_already_playable: [
      {
        dependency_rank: 1,
        opportunity_id: 'opportunity.playable.candidate_changing_but_non_minimal',
        definition_ids: diagnosticPartition.candidate_changing_but_non_minimal,
        interpretation: 'Target-legal diagnostics with candidate-changing authored outcomes, but not exercised by an oracle-selected minimal route.',
      },
      {
        dependency_rank: 2,
        opportunity_id: 'opportunity.playable.target_legal_candidate_neutral',
        definition_ids: diagnosticPartition.target_legal_candidate_neutral,
        interpretation: 'Target-legal diagnostics that produce no candidate-changing outcome in any campaign-one Ticket.',
      },
      {
        dependency_rank: 3,
        opportunity_id: 'opportunity.playable.not_target_legal',
        definition_ids: diagnosticPartition.not_target_legal,
        interpretation: 'Playable Global Bench diagnostics with no authored Evidence outcome for any campaign-one Ticket target.',
      },
    ],
    present_but_not_playable_in_complete_ticket_path: [
      { dependency_rank: 1, opportunity_id: 'opportunity.present.symptoms', entity_ids: allByType('symptom').filter((id) => !campaignSymptomIds.includes(id)) },
      { dependency_rank: 2, opportunity_id: 'opportunity.present.faults', entity_ids: allByType('fault').filter((id) => !campaignCandidateIds.includes(id)) },
      { dependency_rank: 3, opportunity_id: 'opportunity.present.causal_edges', entity_ids: allByType('fault_causal_edge').filter((id) => !campaignEdgeIds.includes(id)) },
      { dependency_rank: 4, opportunity_id: 'opportunity.present.deferred_repairs', entity_ids: sorted(deferredByType.repair_procedure ?? []) },
      { dependency_rank: 5, opportunity_id: 'opportunity.present.deferred_validations', entity_ids: sorted(deferredByType.validation_procedure ?? []) },
      { dependency_rank: 6, opportunity_id: 'opportunity.present.components_not_in_authored_routes', entity_ids: allByType('component').filter((id) => !allRouteDependencies.component_ids.includes(id)) },
      { dependency_rank: 7, opportunity_id: 'opportunity.present.tools_not_in_authored_routes', entity_ids: allByType('tool').filter((id) => !allRouteDependencies.tool_ids.includes(id)) },
      { dependency_rank: 8, opportunity_id: 'opportunity.present.protocols_not_in_authored_routes', entity_ids: allByType('protocol').filter((id) => !allRouteDependencies.protocol_ids.includes(id)) },
    ],
    absent_from_current_domain: clone(ABSENT_DOMAIN_OPPORTUNITIES),
  };

  const pairIds = new Set(caseStudyRegistry.associations.map((entry) => entry.pair_id));
  exact(pairIds.size, caseStudyRegistry.association_count, 'Case-study association registry uniqueness');
  exact(caseStudyRegistry.association_count, 77, 'Case-study baseline association count');

  const entityCoverage = canonicalEntities.map((entity) => ({
    id: entity.id,
    entity_type: entity.entity_type,
    display_name: nameFor(entity.id, entityById),
    coverage_roles: roleUses.get(entity.id).sort((left, right) =>
      stableCompare(JSON.stringify(normalize(left)), JSON.stringify(normalize(right)))),
  })).sort((left, right) => stableCompare(left.id, right.id));

  const ledger = {
    audit_version: CAMPAIGN_ONE_COVERAGE_VERSION,
    pins: {
      story_pack_version: manifest.pack_version,
      story_pack_id: manifest.pack_id,
      story_content_version: manifest.content_version,
      match_configuration_version: matchRegistry.match_configuration_version,
      ruleset_version: matchRegistry.builder_profile.ruleset_version,
      generator_version: matchRegistry.builder_profile.generator_version,
      configuration_version: matchRegistry.builder_profile.configuration_version,
      ticket_content_version: matchRegistry.builder_profile.ticket_content_version,
      domain_content_version: matchRegistry.builder_profile.domain_content_version,
      card_catalog_version: matchRegistry.builder_profile.card_catalog_version,
      deck_catalog_version: matchRegistry.builder_profile.deck_catalog_version,
      part_catalog_version: matchRegistry.builder_profile.part_catalog_version,
      playable_coverage_version: coverage.coverage_version,
      case_study_version: caseStudyRegistry.version,
      case_study_baseline_commit: caseStudyRegistry.baseline_commit,
      canonical_source_pack_ids: [...catalogs.domain.source_pack_ids],
    },
    denominators: {
      complete_domain_inventory: { total: canonicalEntities.length, by_entity_type: domainCounts },
      action_bearing_inventory: {
        total: coverage.inventory.action_bearing_records,
        tests: coverage.inventory.tests,
        commands: coverage.inventory.commands,
        repairs: coverage.inventory.repairs,
        validations: coverage.inventory.validations,
      },
      playable_action_inventory: {
        total: coverage.inventory.playable_card_definitions,
        diagnostics: coverage.inventory.promoted_diagnostics,
        repairs: coverage.inventory.selected_repairs,
        validations: coverage.inventory.selected_validations,
      },
      supported_fingerprint_inventory: coverage.inventory.supported_fingerprints,
      campaign_one_match_inventory: matchRegistry.matches.length,
      generated_ticket_inventory: sum(matchRegistry.matches.map((match) => match.requested_ticket_count)),
      actual_required_solution_paths: sum(matchRegistry.matches.map((match) => match.requested_ticket_count)),
      authored_isolation_routes: routeCount,
    },
    coverage_role_definitions: {
      GLOBAL_CATALOG: 'Present in the complete pinned domain inventory.',
      PLAYABLE_ACTION: 'Published as one of the 71 executable action definitions.',
      PUBLIC_GRAPH_RELEVANT_DIAGNOSTIC: 'Advisory public-relationship path; not proof of usefulness or teaching.',
      TARGET_LEGAL_DIAGNOSTIC: 'Has at least one authored Evidence outcome for this exact generated Ticket target.',
      CANDIDATE_CHANGING_DIAGNOSTIC: 'Has an actual authored Evidence outcome with one or more Candidate effects for this exact generated Ticket.',
      DECLARED_DIAGNOSTIC_PLAN_SOURCE: 'Named by the supported fingerprint diagnostic plan; this 20-source declaration is not the outcome-derived 30-source candidate-changing set.',
      ISOLATION_ROUTE_SOURCE: 'Cited by at least one authored Isolation route.',
      MINIMAL_WITNESS_DIAGNOSTIC: 'Executed by the deterministic solvability oracle witness.',
      CLOSURE_REQUIRED_REPAIR: 'Required machine-state change for closure.',
      CLOSURE_REQUIRED_VERIFY: 'Required current passing post-Repair check.',
      TECHNICAL_DEPENDENCY_COMMAND: 'Referenced by a Test definition; not necessarily played as a Command action.',
      NARRATIVE_MENTION: 'Explicitly mapped to a pinned Story text ID; never inferred from global visibility.',
    },
    shifts,
    deterministic_totals: {
      matches: shifts.length,
      generated_tickets: sum(shifts.map((shift) => shift.tickets.length)),
      authored_isolation_routes: routeCount,
      unique,
      practice,
      diagnostic_partition: {
        denominator: globalDiagnosticSourceIds.length,
        classes: diagnosticPartition,
        counts: Object.fromEntries(Object.entries(diagnosticPartition).map(([key, ids]) => [key, ids.length])),
        declared_diagnostic_plan_source_count: declaredDiagnosticPlanSourceIds.length,
        declared_diagnostic_plan_source_ids: declaredDiagnosticPlanSourceIds,
      },
      repetition_concentrations: {
        symptoms: repeated(countBy(occurrences.symptoms)),
        public_candidate_faults: repeated(countBy(occurrences.public_candidate_faults)),
        truth_faults: repeated(countBy(occurrences.truth_faults)),
        minimal_witness_diagnostics: repeated(countBy(occurrences.minimal_witness_diagnostics)),
        repairs: repeated(countBy(occurrences.repairs)),
        verifications: repeated(countBy(occurrences.verifications)),
      },
      commands: {
        global_playable: globalDiagnosticSourceIds.filter((id) => entityById.get(id).entity_type === 'command').length,
        declared_diagnostic_plan_sources: declaredDiagnosticPlanSourceIds.filter((id) => entityById.get(id).entity_type === 'command').length,
        candidate_changing: candidateChangingDiagnosticIds.filter((id) => entityById.get(id).entity_type === 'command').length,
        target_legal: targetLegalDiagnosticIds.filter((id) => entityById.get(id).entity_type === 'command').length,
        authored_isolation_route_sources: sorted(occurrences.isolation_route_sources).filter((id) => entityById.get(id).entity_type === 'command').length,
        minimal_witness_actions: sorted(occurrences.minimal_witness_diagnostics).filter((id) => entityById.get(id).entity_type === 'command').length,
        required_by_any_current_isolation_route: sorted(occurrences.isolation_route_sources).filter((id) => entityById.get(id).entity_type === 'command'),
      },
    },
    uncovered: {
      playable_diagnostics_not_in_minimal_witness_ids: sorted(globalDiagnosticSourceIds.filter((id) => !minimalWitnessDiagnosticIds.includes(id))),
      candidate_changing_but_non_minimal_diagnostic_ids: diagnosticPartition.candidate_changing_but_non_minimal,
      target_legal_candidate_neutral_diagnostic_ids: diagnosticPartition.target_legal_candidate_neutral,
      not_target_legal_diagnostic_ids: diagnosticPartition.not_target_legal,
      symptom_ids: allByType('symptom').filter((id) => !campaignSymptomIds.includes(id)),
      public_candidate_fault_ids: allByType('fault').filter((id) => !campaignCandidateIds.includes(id)),
      causal_edge_ids: allByType('fault_causal_edge').filter((id) => !campaignEdgeIds.includes(id)),
      deferred_action_definition_ids: sorted(coverage.deferred_action_definition_ids),
    },
    opportunity_inventory: opportunityInventory,
    interpretation_limits: [
      'Global Bench legality is not teaching coverage.',
      'Public-graph relevance is advisory and may be broad or incomplete.',
      'A distractor Candidate is not a covered true Fault.',
      'An authored Candidate effect makes a diagnostic informative for that Ticket; it is not exercised or required unless the selected route runs it.',
      'The 20 sources declared by fingerprint diagnostic plans are a separate authoring index and do not define the 30-source outcome-derived Candidate-changing set.',
      'A technical Command dependency of a Test is not a separately executed Command action.',
      'The solvability witness ends at required passing Verify; explicit Document Live is optional, while closure publication writes the accepted causal bundle.',
      'Automated campaign action counts exercise policy robustness and are not minimal teaching routes.',
      'Absent-domain opportunities preserve pilot research language and do not select Q, approve cases, or authorize new entities.',
    ],
    entity_coverage: entityCoverage,
  };
  validateCampaignOneCoverageLedger(ledger);
  return ledger;
}

const code = (value) => `\`${value}\``;
const list = (values) => values.length ? values.map(code).join(', ') : 'None';

function renderOpportunityGroup(entries) {
  return entries.map((entry) => {
    const ids = entry.definition_ids ?? entry.entity_ids ?? [];
    return `- ${entry.dependency_rank}. **${entry.opportunity_id}** — ${ids.length} item(s)${ids.length ? `: ${list(ids)}` : ''}${entry.interpretation ? ` ${entry.interpretation}` : ''}${entry.dependency_reason ? ` ${entry.dependency_reason}` : ''}`;
  }).join('\n');
}

export function renderCampaignOneDomainCoverageMarkdown(ledger) {
  const denominatorRows = [
    ['Complete domain inventory', ledger.denominators.complete_domain_inventory.total],
    ['Action-bearing inventory', ledger.denominators.action_bearing_inventory.total],
    ['Playable action inventory', ledger.denominators.playable_action_inventory.total],
    ['Global Bench diagnostics', ledger.denominators.playable_action_inventory.diagnostics],
    ['Supported fingerprints', ledger.denominators.supported_fingerprint_inventory],
    ['Campaign-one Matches', ledger.denominators.campaign_one_match_inventory],
    ['Generated Tickets / required paths', ledger.denominators.generated_ticket_inventory],
    ['Authored Isolation routes', ledger.denominators.authored_isolation_routes],
  ].map(([name, count]) => `| ${name} | ${count} |`).join('\n');

  const shiftSections = ledger.shifts.map((shift, index) => {
    const ticketSections = shift.tickets.map((ticket) => {
      const truth = ticket.server_only_truth.fault_instances.map((instance) =>
        `${code(instance.fault_id)} (${instance.role.toLowerCase()}${instance.required_to_repair ? ', required to repair' : ''})`).join('; ');
      const routes = ticket.diagnostics.isolation_routes.map((route) =>
        `  - ${code(route.route_id)} — ${route.route_kind}, minimum ${route.minimum_distinct_outcomes}: ${list(route.source_definition_ids)}`).join('\n');
      const witness = ticket.minimal_authored_route.map((step) => {
        if (step.action === 'RUN_DIAGNOSTIC') return code(step.source_definition_id);
        if (step.action === 'COMMIT_ISOLATION') return `Isolate ${code(step.target_fault_instance_key)}`;
        if (step.action === 'PERFORM_REPAIR') return code(step.repair_procedure_id);
        if (step.action === 'PERFORM_VERIFY') return code(step.validation_procedure_id);
        return step.action;
      }).join(' → ');
      const support = ticket.domain_support;
      return `### ${ticket.display_name}\n\n- Ticket / fingerprint: ${code(ticket.ticket_id)} / ${code(ticket.fingerprint_id)}\n- Snapshot digest: ${code(ticket.ticket_snapshot_digest)}\n- Public Symptom(s): ${list(ticket.public.symptom_ids)}\n- Public Candidate Faults: ${list(ticket.public.candidate_fault_ids)}\n- Server-only truth: ${truth}\n- Target-legal diagnostics: ${list(ticket.diagnostics.target_legal_source_ids)}\n- Candidate-changing authored diagnostics: ${list(ticket.diagnostics.candidate_changing_source_ids)}\n- Declared fingerprint-plan sources: ${list(ticket.diagnostics.declared_diagnostic_plan_source_ids)}\n- Authored Isolation routes:\n${routes}\n- Optional Candidate-changing sources outside Isolation: ${list(ticket.diagnostics.optional_candidate_changing_source_ids)}\n- Alternate-route sources outside the minimal witness: ${list(ticket.diagnostics.alternate_route_source_ids_not_in_minimal_witness)}\n- Required Repair(s): ${list(ticket.closure.repair_procedure_ids)}\n- Required Verify(s): ${list(ticket.closure.validation_procedure_ids)}\n- Public Candidate Components: ${list(support.public_candidate_component_ids)}\n- True affected Components: ${list(support.true_affected_component_ids)}\n- Minimal-route Tools: ${list(support.minimal_witness_dependencies.tool_ids)}\n- Minimal-route technical Command dependencies: ${list(support.minimal_witness_dependencies.command_ids)}\n- Minimal-route Protocols: ${list(support.minimal_witness_dependencies.protocol_ids)}\n- All authored-route Tools: ${list(support.all_authored_route_dependencies.tool_ids)}\n- All authored-route technical Command dependencies: ${list(support.all_authored_route_dependencies.command_ids)}\n- All authored-route Protocols: ${list(support.all_authored_route_dependencies.protocol_ids)}\n- Oracle minimal route: ${witness}\n- Training objective: ${ticket.educational_objectives.join(' ')}`;
    }).join('\n\n');
    const mentions = shift.narrative_mentions.map((mention) =>
      `- ${code(mention.text_id)} — ${mention.role}: ${list([...(mention.entity_ids ?? []), ...(mention.concept_ids ?? [])])}`).join('\n');
    return `## Shift ${index + 1}\n\n- Story Match: ${code(shift.match_ref)}\n- Automated proof Match: ${code(shift.proof_match_id)}\n- Seed: ${code(shift.seed)}\n- Tickets: ${shift.requested_ticket_count}\n\nNarrative/training ledger:\n\n${mentions}\n\n${ticketSections}`;
  }).join('\n\n');

  const totals = ledger.deterministic_totals;
  const repetitions = Object.entries(totals.repetition_concentrations).map(([family, entries]) =>
    `- ${family}: ${entries.length ? entries.map((entry) => `${code(entry.id)} × ${entry.count}`).join(', ') : 'no repeats'}`).join('\n');
  const uncovered = ledger.uncovered;
  const absent = ledger.opportunity_inventory.absent_from_current_domain.map((entry) =>
    `- ${entry.dependency_rank}. **${entry.label}** (${entry.likely_entity_types.join(' / ')}) — ${entry.dependency_reason} Source: ${code(entry.source_path)} § “${entry.source_heading}”.`).join('\n');
  const partition = totals.diagnostic_partition;
  const partitionRows = [
    ['Minimal-witness (actually exercised)', 'minimal_witness'],
    ['Candidate-changing but non-minimal', 'candidate_changing_but_non_minimal'],
    ['Target-legal and Candidate-neutral', 'target_legal_candidate_neutral'],
    ['Not target-legal for campaign one', 'not_target_legal'],
  ].map(([label, key]) => `| ${label} | ${partition.counts[key]} | ${list(partition.classes[key])} |`).join('\n');

  return `# Campaign One domain coverage\n\nThis report is generated from the pinned Quiet Cascade characterization-v2 Story pack, exact Builder snapshots, canonical domain packs, and the solvability oracle. It measures teaching roles without treating global visibility, public relevance, distractors, or technical dependencies as actual practice. The JSON companion is authoritative for complete IDs and role locations.\n\n## Version pins\n\n- Story: ${code(ledger.pins.story_pack_id)} / ${code(ledger.pins.story_content_version)}\n- Rules / Builder: ${code(ledger.pins.ruleset_version)} / ${code(ledger.pins.generator_version)}\n- Ticket / domain: ${code(ledger.pins.ticket_content_version)} / ${code(ledger.pins.domain_content_version)}\n- Cards / decks / parts: ${code(ledger.pins.card_catalog_version)} / ${code(ledger.pins.deck_catalog_version)} / ${code(ledger.pins.part_catalog_version)}\n- Playable coverage: ${code(ledger.pins.playable_coverage_version)}\n- Case-study baseline: ${code(ledger.pins.case_study_version)} at ${code(ledger.pins.case_study_baseline_commit)}\n\n## Denominators\n\n| Denominator | Count |\n| --- | ---: |\n${denominatorRows}\n\nThe complete domain contains ${Object.entries(ledger.denominators.complete_domain_inventory.by_entity_type).map(([type, count]) => `${count} ${type}`).join(', ')}. The 107 action-bearing records are 37 Tests, 13 Commands, 35 Repairs, and 22 Validations. Play promotes all 50 diagnostics but only 12 Repairs and 9 Validations.\n\n## Coverage-role boundary\n\n- **Global catalog** means present, not taught.\n- **Public-graph relevant** is an advisory relationship path, not proof that a diagnostic helps.\n- **Target-legal** means the generated Ticket contains an authored Evidence outcome for that diagnostic.\n- **Candidate-changing** is derived from actual authored outcomes with Candidate effects, not from the narrower fingerprint plan declaration.\n- **Declared fingerprint-plan source** is one of 20 authoring-index sources; it is reported separately from the 30 outcome-derived Candidate-changing diagnostics.\n- **Isolation route source** means at least one valid route cites it.\n- **Minimal witness** is the deterministic complete route returned by the solvability oracle.\n- **Closure-required** covers Repair and current post-Repair Verify. Explicit Document Live remains optional; publishing closure records the accepted bundle.\n\n${shiftSections}\n\n## Deterministic totals\n\n| Measure | Unique | Practice occurrences |\n| --- | ---: | ---: |\n| Symptoms | ${totals.unique.symptoms} | ${totals.practice.symptoms} |\n| Public Candidate Faults | ${totals.unique.public_candidate_faults} | ${totals.practice.public_candidate_faults} |\n| Truth Faults / instances | ${totals.unique.truth_faults} | ${totals.practice.truth_fault_instances} |\n| Minimal-witness diagnostics | ${totals.unique.minimal_witness_diagnostics} | ${totals.practice.minimal_witness_diagnostics} |\n| Required Repairs | ${totals.unique.repairs} | ${totals.practice.repairs} |\n| Required Verifications | ${totals.unique.verifications} | ${totals.practice.verifications} |\n\nThere are ${totals.unique.candidate_changing_diagnostics} unique diagnostics with actual Candidate-changing authored outcomes, ${totals.unique.declared_diagnostic_plan_sources} separately declared fingerprint-plan sources, and ${totals.unique.isolation_route_sources} unique Isolation-route sources. One current alternate route requires a Command action: ${list(totals.commands.required_by_any_current_isolation_route)}. The oracle-selected minimal paths require ${totals.commands.minimal_witness_actions} Command actions.\n\n## Disjoint Global Bench diagnostic partition\n\nEvery one of the ${partition.denominator} playable diagnostics appears exactly once below. “Minimal witness” is actual practice; the other classes are opportunities, not taught actions.\n\n| Class | Count | Stable IDs |\n| --- | ---: | --- |\n${partitionRows}\n\n## Repetition concentrations\n\n${repetitions}\n\n## Uncovered lists\n\n### Playable diagnostics not exercised by a minimal witness (${uncovered.playable_diagnostics_not_in_minimal_witness_ids.length})\n\n${list(uncovered.playable_diagnostics_not_in_minimal_witness_ids)}\n\n### Symptoms not used by campaign one (${uncovered.symptom_ids.length})\n\n${list(uncovered.symptom_ids)}\n\n### Faults absent from every campaign-one Candidate pool (${uncovered.public_candidate_fault_ids.length})\n\n${list(uncovered.public_candidate_fault_ids)}\n\n### Causal edges not used by a supported campaign-one fingerprint (${uncovered.causal_edge_ids.length})\n\n${list(uncovered.causal_edge_ids)}\n\n### Deferred action definitions (${uncovered.deferred_action_definition_ids.length})\n\n${list(uncovered.deferred_action_definition_ids)}\n\n## Dependency-ranked opportunity inventory\n\nThis inventory does not select Q, invent cases, or claim popularity.\n\n### Uncovered but already playable\n\n${renderOpportunityGroup(ledger.opportunity_inventory.uncovered_but_already_playable)}\n\n### Present but not playable in a complete Ticket path\n\n${renderOpportunityGroup(ledger.opportunity_inventory.present_but_not_playable_in_complete_ticket_path)}\n\n### Absent from the current domain\n\n${absent}\n\n## Interpretation limits\n\n${ledger.interpretation_limits.map((limit) => `- ${limit}`).join('\n')}\n`;
}
