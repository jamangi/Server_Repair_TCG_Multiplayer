import { sha256 } from './canonical.mjs';
import { buildTickets } from './ticket-builder.mjs';

export const DIAGNOSIS_V2_RULESET_VERSION = 'first-version-v2';
export const DIAGNOSIS_V2_CARD_CATALOG_VERSION = 'core-card-catalog-diagnosis-v2';
export const DIAGNOSIS_V2_TICKET_CONTENT_VERSION = 'core-ticket-templates-diagnosis-v2';
export const DIAGNOSIS_V2_BUILDER_VERSION = 'ticket-builder-v2';
export const DIAGNOSIS_V2_CONFIGURATION_VERSION = 'ticket-builder-v2';
export const DIAGNOSIS_V2_RESPONSE_DECK_ID = 'deck.core.storage_response_v2';
export const DIAGNOSIS_V2_MAX_COPIES = 6;

const clone = (value) => structuredClone(value);
const sorted = (values) => [...values].sort((left, right) => left.localeCompare(right));

function entityMap(domainCatalog) {
  return new Map((domainCatalog?.entities ?? []).map((entity) => [entity.id, entity]));
}

function graph(domainCatalog) {
  const adjacency = new Map();
  const connect = (from, to, role) => {
    if (!adjacency.has(from)) adjacency.set(from, []);
    adjacency.get(from).push({ entity_id: to, relationship_role: role });
  };
  for (const entity of domainCatalog?.entities ?? []) {
    for (const relationship of entity.relationships ?? []) {
      connect(entity.id, relationship.entity_id, relationship.role);
      connect(relationship.entity_id, entity.id, `reverse:${relationship.role}`);
    }
  }
  for (const edges of adjacency.values()) {
    edges.sort((left, right) => `${left.entity_id}\0${left.relationship_role}`
      .localeCompare(`${right.entity_id}\0${right.relationship_role}`));
  }
  return adjacency;
}

function shortestPublicPath(adjacency, seeds, destination, maximumEdges = 3) {
  const queue = sorted(new Set(seeds)).map((seed) => ({ entity_ids: [seed], relationship_roles: [] }));
  const visitedDepth = new Map(queue.map((entry) => [entry.entity_ids[0], 0]));
  while (queue.length > 0) {
    const path = queue.shift();
    const current = path.entity_ids.at(-1);
    if (current === destination) return path;
    if (path.relationship_roles.length >= maximumEdges) continue;
    for (const edge of adjacency.get(current) ?? []) {
      const depth = path.relationship_roles.length + 1;
      if ((visitedDepth.get(edge.entity_id) ?? Infinity) < depth) continue;
      visitedDepth.set(edge.entity_id, depth);
      queue.push({
        entity_ids: [...path.entity_ids, edge.entity_id],
        relationship_roles: [...path.relationship_roles, edge.relationship_role],
      });
    }
  }
  return null;
}

export function derivePublicCandidates(ticket, domainCatalog) {
  const byId = entityMap(domainCatalog);
  const truthIds = sorted(new Set((ticket.server_only_truth?.fault_instances ?? [])
    .map((fault) => fault.fault_id)));
  const publicContext = new Set([
    ...(ticket.initial_symptom_ids ?? []),
    ...(ticket.public_context_entity_ids ?? []),
  ]);
  const plausible = new Set();
  for (const contextId of publicContext) {
    const context = byId.get(contextId);
    for (const relationship of context?.relationships ?? []) {
      if (relationship.role === 'associated_fault') plausible.add(relationship.entity_id);
    }
  }
  const publiclyPlausible = new Set(plausible);
  for (const truthId of truthIds) plausible.add(truthId);
  const distractors = sorted([...plausible].filter((id) => !truthIds.includes(id)));
  const candidates = sorted([
    ...truthIds,
    ...distractors.slice(0, Math.max(0, 5 - truthIds.length)),
  ]);
  const errors = [];
  if (candidates.length < 2 || candidates.length > 5) {
    errors.push({
      code: 'CANDIDATE_COUNT_OUT_OF_RANGE',
      detail: `Derived ${candidates.length} candidates; diagnosis-v2 requires 2 through 5.`,
    });
  }
  for (const truthId of truthIds) {
    if (!candidates.includes(truthId)) {
      errors.push({ code: 'HIDDEN_FAULT_OMITTED', detail: `Derived candidates omit hidden Fault ${truthId}.` });
    }
    const publicPath = publiclyPlausible.has(truthId);
    if (!publicPath) {
      errors.push({
        code: 'HIDDEN_FAULT_NOT_PUBLICLY_PLAUSIBLE',
        detail: `Hidden Fault ${truthId} has no authored public-context relationship.`,
      });
    }
  }
  return { candidates, errors };
}

export function deriveDiagnosticRelevance({ ticket, domainCatalog, cardCatalog }) {
  const adjacency = graph(domainCatalog);
  const seeds = sorted(new Set([
    ...(ticket.initial_symptom_ids ?? []),
    ...(ticket.public_candidate_fault_ids ?? []),
    ...(ticket.public_context_entity_ids ?? []),
  ]));
  const result = new Map();
  for (const card of cardCatalog?.cards ?? []) {
    if (card.play_contract?.contract_type !== 'DIAGNOSTIC') continue;
    const sourceId = card.play_contract.source_definition_id;
    const path = shortestPublicPath(adjacency, seeds, sourceId);
    result.set(card.id, {
      relevant: path !== null,
      why_relevant_paths: path === null ? [] : [path],
    });
  }
  return result;
}

function diagnosticCards(cardCatalog) {
  return (cardCatalog?.cards ?? [])
    .filter((card) => card.play_contract?.contract_type === 'DIAGNOSTIC')
    .sort((left, right) => left.id.localeCompare(right.id));
}

function machineStateKeys(ticket) {
  return sorted(new Set([
    ticket.server_only_truth.initial_machine_state_key,
    ...(ticket.authored_repair_outcomes ?? []).flatMap((outcome) => [
      outcome.eligible_machine_state_key,
      outcome.resulting_machine_state_key,
    ]),
    ...(ticket.authored_verification_outcomes ?? []).flatMap((outcome) => [
      outcome.eligible_machine_state_key,
      outcome.resulting_machine_state_key,
    ]),
  ].filter(Boolean)));
}

function stableToken(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '');
}

function normalizeAuthoredOutcome(outcome, ticket) {
  const next = clone(outcome);
  next.outcome_classification = next.candidate_effects?.length ? 'CANDIDATE_EFFECT' : 'INCONCLUSIVE';
  const templateId = ticket.generation_provenance?.template_id ?? null;
  if ((ticket.id === 'ticket.storage.loose_cable' || templateId === 'ticket_template.storage.loose_cable')
      && next.outcome_id === 'evidence.storage.connector_unlatched') {
    next.candidate_effects = [
      { candidate_fault_id: 'fault.storage.cable.loose', disposition: 'CONFIRM' },
      { candidate_fault_id: 'fault.storage.raid.controller_failed', disposition: 'RULE_OUT' },
    ];
  }
  if ((ticket.id === 'ticket.storage.member_then_array' || templateId === 'ticket_template.storage.member_then_array')
      && next.outcome_id === 'evidence.raid.member_status') {
    next.candidate_effects = next.candidate_effects.map((effect) => ({
      ...effect,
      disposition: effect.candidate_fault_id === 'fault.storage.sas.drive_failed'
        ? 'SUPPORT'
        : effect.disposition,
    }));
  }
  return next;
}

function sourceRelationship(sourceId, domainCatalog, role) {
  return entityMap(domainCatalog).get(sourceId)?.relationships?.find((entry) => entry.role === role)?.entity_id ?? null;
}

function completeDiagnosticOutcomes(ticket, domainCatalog, cardCatalog) {
  const cards = diagnosticCards(cardCatalog);
  const sources = sorted(new Set(cards.map((card) => card.play_contract.source_definition_id)));
  const relevance = deriveDiagnosticRelevance({ ticket, domainCatalog, cardCatalog });
  const relevantSources = new Set(cards
    .filter((card) => relevance.get(card.id)?.relevant)
    .map((card) => card.play_contract.source_definition_id));
  const outcomes = (ticket.authored_evidence_outcomes ?? [])
    .map((outcome) => normalizeAuthoredOutcome(outcome, ticket));
  const targetRef = ticket.server_only_truth.fault_instances[0]?.fault_instance_key ?? ticket.id;
  for (const stateKey of machineStateKeys(ticket)) {
    for (const sourceId of sources) {
      if (outcomes.some((outcome) => outcome.source_definition_id === sourceId
        && outcome.eligible_machine_state_key === stateKey)) continue;
      const relatedTestId = sourceRelationship(sourceId, domainCatalog, 'related_test');
      const related = relatedTestId ? outcomes.find((outcome) => outcome.source_definition_id === relatedTestId
        && outcome.eligible_machine_state_key === stateKey) : null;
      if (related) {
        outcomes.push({
          ...clone(related),
          outcome_id: `${related.outcome_id}.command.${stableToken(sourceId)}`,
          source_definition_id: sourceId,
          candidate_effects: related.candidate_effects.map((effect) => ({
            ...effect,
            disposition: effect.disposition === 'CONFIRM' ? 'SUPPORT' : effect.disposition,
          })),
          outcome_classification: 'CANDIDATE_EFFECT',
          public_summary: `The command corroborates the related diagnostic result: ${related.public_summary}`,
        });
        continue;
      }
      const relevant = relevantSources.has(sourceId);
      outcomes.push({
        outcome_id: `evidence.v2.${stableToken(ticket.id)}.${stableToken(stateKey)}.${stableToken(sourceId)}`,
        source_definition_id: sourceId,
        target_ref: targetRef,
        eligible_machine_state_key: stateKey,
        candidate_effects: [],
        outcome_classification: relevant ? 'CLEAN' : 'IRRELEVANT',
        observation_id: null,
        public_summary: relevant
          ? 'The diagnostic completed cleanly and produced no candidate-changing finding in this machine state.'
          : 'The diagnostic completed but produced no finding relevant to this Ticket.',
      });
    }
  }
  return outcomes.sort((left, right) => left.outcome_id.localeCompare(right.outcome_id));
}

function ensureDifferentiableDistractors(ticket) {
  const truthIds = new Set(ticket.server_only_truth.fault_instances.map((fault) => fault.fault_id));
  const distractors = ticket.public_candidate_fault_ids.filter((candidateId) => !truthIds.has(candidateId));
  for (const candidateId of distractors) {
    const alreadyDifferentiated = ticket.authored_evidence_outcomes.some((outcome) => outcome.candidate_effects.some(
      (effect) => effect.candidate_fault_id === candidateId && ['CONTRADICT', 'RULE_OUT'].includes(effect.disposition),
    ));
    if (alreadyDifferentiated) continue;
    const decisive = ticket.authored_evidence_outcomes.find((outcome) =>
      outcome.eligible_machine_state_key === ticket.server_only_truth.initial_machine_state_key
      && outcome.candidate_effects.some((effect) => truthIds.has(effect.candidate_fault_id)));
    if (!decisive) continue;
    decisive.candidate_effects.push({ candidate_fault_id: candidateId, disposition: 'RULE_OUT' });
    decisive.candidate_effects.sort((left, right) => left.candidate_fault_id.localeCompare(right.candidate_fault_id));
    decisive.outcome_classification = 'CANDIDATE_EFFECT';
  }
}

function outcomeId(ticket, sourceId, stateKey) {
  return ticket.authored_evidence_outcomes.find((outcome) => outcome.source_definition_id === sourceId
    && outcome.eligible_machine_state_key === stateKey)?.outcome_id ?? null;
}

function isolationRoutes(ticket, legacyRequirement) {
  const stateKey = ticket.server_only_truth.initial_machine_state_key;
  const visual = outcomeId(ticket, 'test.general.visual_inspection', stateKey);
  const inventory = outcomeId(ticket, 'test.storage.device_inventory', stateKey);
  const status = outcomeId(ticket, 'test.storage.raid_status', stateKey);
  const health = outcomeId(ticket, 'test.storage.drive_health', stateKey);
  const smartctl = outcomeId(ticket, 'command.linux.smartctl', stateKey);
  const common = {
    target_fault_instance_key: legacyRequirement.target_fault_instance_key,
    candidate_fault_id: legacyRequirement.candidate_fault_id,
    classification: legacyRequirement.classification,
  };
  if (legacyRequirement.requirement_id === 'isolation.storage.cable_loose') {
    return [
      {
        ...common,
        route_id: 'route.storage.cable_loose.direct_observation',
        route_kind: 'DIRECT_OBSERVATION',
        eligible_outcome_ids: [visual],
      },
      {
        ...common,
        route_id: 'route.storage.cable_loose.elimination',
        route_kind: 'EVIDENCE_BACKED_ELIMINATION',
        supporting_outcome_ids: [inventory],
        required_eliminated_candidate_fault_ids: ['fault.storage.raid.controller_failed'],
      },
    ];
  }
  if (legacyRequirement.requirement_id === 'isolation.raid.member_a_failed'
      || legacyRequirement.requirement_id === 'isolation.raid.member_failed') {
    return [
      {
        ...common,
        route_id: `${legacyRequirement.requirement_id}.definitive`,
        route_kind: 'DEFINITIVE_DIAGNOSTIC',
        eligible_outcome_ids: [health],
      },
      {
        ...common,
        route_id: `${legacyRequirement.requirement_id}.corroborated`,
        route_kind: 'CORROBORATED_SUPPORT',
        eligible_outcome_ids: [status, smartctl],
        minimum_distinct_outcomes: 2,
      },
    ];
  }
  return [{
    ...common,
    route_id: `${legacyRequirement.requirement_id}.recovery`,
    route_kind: 'RECOVERY_DERIVED',
    eligible_verification_outcome_ids: [...(legacyRequirement.eligible_verification_outcome_ids ?? [])],
  }];
}

export function migrateTicketSnapshotToDiagnosisV2(snapshot, { domainCatalog, cardCatalog }) {
  const ticket = clone(snapshot);
  ticket.ruleset_version = DIAGNOSIS_V2_RULESET_VERSION;
  ticket.ticket_contract_version = 'repair-ticket-v2';
  ticket.public_context_entity_ids = sorted(new Set(ticket.initial_symptom_ids ?? []));
  const derived = derivePublicCandidates(ticket, domainCatalog);
  if (derived.errors.length > 0) {
    const error = new Error(derived.errors.map((entry) => `${entry.code}: ${entry.detail}`).join('\n'));
    error.diagnostics = derived.errors;
    throw error;
  }
  ticket.public_candidate_fault_ids = derived.candidates;
  ticket.authored_evidence_outcomes = completeDiagnosticOutcomes(ticket, domainCatalog, cardCatalog);
  ensureDifferentiableDistractors(ticket);
  ticket.isolation_requirements = ticket.isolation_requirements.map((requirement) => ({
    requirement_id: requirement.requirement_id,
    target_fault_instance_key: requirement.target_fault_instance_key,
    candidate_fault_id: requirement.candidate_fault_id,
    classification: requirement.classification,
    routes: isolationRoutes(ticket, requirement),
  }));
  if (ticket.generation_provenance) {
    ticket.generation_provenance.generator_version = DIAGNOSIS_V2_BUILDER_VERSION;
    ticket.generation_provenance.configuration_version = DIAGNOSIS_V2_CONFIGURATION_VERSION;
    ticket.generation_provenance.content_version = DIAGNOSIS_V2_TICKET_CONTENT_VERSION;
    ticket.generation_provenance.card_catalog_version = DIAGNOSIS_V2_CARD_CATALOG_VERSION;
  }
  return ticket;
}

export function validateDiagnosisV2Ticket(ticket, { domainCatalog, cardCatalog }) {
  const errors = [];
  const derived = derivePublicCandidates(ticket, domainCatalog);
  errors.push(...derived.errors);
  if (JSON.stringify(ticket.public_candidate_fault_ids) !== JSON.stringify(derived.candidates)) {
    errors.push({ code: 'CANDIDATE_DERIVATION_MISMATCH', detail: 'Persisted public candidates do not equal deterministic derivation.' });
  }
  const truthIds = new Set(ticket.server_only_truth.fault_instances.map((fault) => fault.fault_id));
  for (const candidateId of ticket.public_candidate_fault_ids.filter((id) => !truthIds.has(id))) {
    const differentiable = ticket.authored_evidence_outcomes.some((outcome) => outcome.candidate_effects.some(
      (effect) => effect.candidate_fault_id === candidateId && ['CONTRADICT', 'RULE_OUT'].includes(effect.disposition),
    ));
    if (!differentiable) errors.push({
      code: 'DISTRACTOR_NOT_DIFFERENTIABLE',
      detail: `Distractor ${candidateId} has no authored CONTRADICT or RULE_OUT result.`,
    });
  }
  const sourceIds = sorted(new Set(diagnosticCards(cardCatalog)
    .map((card) => card.play_contract.source_definition_id)));
  for (const stateKey of machineStateKeys(ticket)) {
    for (const sourceId of sourceIds) {
      const count = ticket.authored_evidence_outcomes.filter((outcome) => outcome.source_definition_id === sourceId
        && outcome.eligible_machine_state_key === stateKey).length;
      if (count !== 1) errors.push({
        code: 'DIAGNOSTIC_OUTCOME_COVERAGE',
        detail: `${sourceId} has ${count} outcomes in ${stateKey}; exactly one is required.`,
      });
    }
  }
  const routeIds = new Set();
  for (const requirement of ticket.isolation_requirements) {
    if (!Array.isArray(requirement.routes) || requirement.routes.length === 0) {
      errors.push({ code: 'ISOLATION_ROUTE_MISSING', detail: `${requirement.requirement_id} has no typed route.` });
      continue;
    }
    for (const route of requirement.routes) {
      if (routeIds.has(route.route_id)) errors.push({ code: 'DUPLICATE_ROUTE_ID', detail: `Duplicate route ${route.route_id}.` });
      routeIds.add(route.route_id);
      if (route.candidate_fault_id !== requirement.candidate_fault_id
          || route.target_fault_instance_key !== requirement.target_fault_instance_key) {
        errors.push({ code: 'ROUTE_TARGET_MISMATCH', detail: `${route.route_id} does not match its requirement target.` });
      }
    }
  }
  return { valid: errors.length === 0, errors };
}

function responseDeck(baseDeck, cardById) {
  const response = baseDeck.card_definition_ids.filter((id) =>
    cardById.get(id)?.play_contract?.contract_type !== 'DIAGNOSTIC');
  const counts = new Map(response.map((id) => [id, 0]));
  const result = [];
  while (result.length < 30) {
    let added = false;
    for (const id of response) {
      if (result.length === 30) break;
      const count = counts.get(id) ?? 0;
      if (count >= DIAGNOSIS_V2_MAX_COPIES) continue;
      result.push(id);
      counts.set(id, count + 1);
      added = true;
    }
    if (!added) throw new Error('Legacy deck cannot seed a legal diagnosis-v2 response deck.');
  }
  return result;
}

export function createDiagnosisV2Catalogs({ cards, decks, domain, ticketContent }) {
  const nextCards = clone(cards);
  nextCards.ruleset_version = DIAGNOSIS_V2_RULESET_VERSION;
  nextCards.card_catalog_version = DIAGNOSIS_V2_CARD_CATALOG_VERSION;
  nextCards.cards = nextCards.cards.map((card) => card.play_contract?.contract_type === 'DIAGNOSTIC'
    ? {
      ...card,
      play_contract: {
        ...card.play_contract,
        placement: 'diagnostic_bench',
        disposition: 'remain_in_diagnostic_bench',
      },
    }
    : card);
  const byId = new Map(nextCards.cards.map((card) => [card.id, card]));
  const baseDeck = decks.decks.find((deck) => deck.id === 'deck.core.storage_foundation');
  if (!baseDeck) throw new Error('Missing legacy starter deck for diagnosis-v2 migration.');
  const nextDecks = {
    ruleset_version: DIAGNOSIS_V2_RULESET_VERSION,
    card_catalog_version: DIAGNOSIS_V2_CARD_CATALOG_VERSION,
    decks: [{
      id: DIAGNOSIS_V2_RESPONSE_DECK_ID,
      entity_type: 'deck',
      display_name: 'Storage Response Deck v2',
      card_definition_ids: responseDeck(baseDeck, byId),
    }],
  };
  const nextTicketContent = clone(ticketContent);
  nextTicketContent.ticket_content_version = DIAGNOSIS_V2_TICKET_CONTENT_VERSION;
  nextTicketContent.ruleset_version = DIAGNOSIS_V2_RULESET_VERSION;
  nextTicketContent.templates = nextTicketContent.templates.map((template) => ({
    ...template,
    ticket: migrateTicketSnapshotToDiagnosisV2(template.ticket, { domainCatalog: domain, cardCatalog: nextCards }),
  }));
  return {
    cards: nextCards,
    decks: nextDecks,
    domain: clone(domain),
    ticketContent: nextTicketContent,
    base: { cards: clone(cards), decks: clone(decks), domain: clone(domain), ticketContent: clone(ticketContent) },
    engineCatalogs: {
      cards: nextCards,
      decks: nextDecks,
      domain: clone(domain),
      content_version: domain.domain_content_version,
    },
    rulesetVersion: DIAGNOSIS_V2_RULESET_VERSION,
  };
}

function legacyBuilderConfiguration(configuration, base) {
  return {
    ...clone(configuration),
    configuration_version: 'ticket-builder-v1',
    generator_version: 'ticket-builder-v1',
    content_version: base.ticketContent.ticket_content_version,
    domain_content_version: base.domain.domain_content_version,
    card_catalog_version: base.cards.card_catalog_version,
    legal_card_definition_ids: sorted(new Set(base.cards.cards.map((card) => card.id))),
  };
}

export function buildTicketsV2({ configuration, configurationsById = {}, catalogs }) {
  if (configuration.generator_version !== DIAGNOSIS_V2_BUILDER_VERSION
      || configuration.configuration_version !== DIAGNOSIS_V2_CONFIGURATION_VERSION
      || configuration.content_version !== DIAGNOSIS_V2_TICKET_CONTENT_VERSION
      || configuration.card_catalog_version !== DIAGNOSIS_V2_CARD_CATALOG_VERSION) {
    return {
      id: `builder_result.${sha256(configuration).slice(0, 24)}`,
      entity_type: 'ticket_builder_result',
      status: 'FAILURE',
      primary_attempt_id: 'attempt.diagnosis-v2.version-mismatch',
      selected_attempt_id: null,
      attempts: [{
        attempt_id: 'attempt.diagnosis-v2.version-mismatch',
        attempt_kind: 'PRIMARY',
        parent_attempt_id: null,
        configuration: clone(configuration),
        status: 'FAILURE',
        diagnostics: [{
          code: 'VERSION_MISMATCH',
          constraint: 'VERSION',
          detail: 'The Builder configuration is not pinned to the diagnosis-v2 contract.',
          template_ids: [], requested_count: null, eligible_count: null, generated_index: null,
        }],
        selected_template_ids: [], ticket_snapshot_digests: [], ticket_snapshots: [],
      }],
    };
  }
  const legacyConfigurations = Object.fromEntries(Object.entries(configurationsById)
    .map(([id, value]) => [id, legacyBuilderConfiguration(value, catalogs.base)]));
  const legacy = buildTickets({
    configuration: legacyBuilderConfiguration(configuration, catalogs.base),
    configurationsById: legacyConfigurations,
    ticketContent: catalogs.base.ticketContent,
    domainCatalog: catalogs.base.domain,
    cardCatalog: catalogs.base.cards,
  });
  const result = clone(legacy);
  for (const attempt of result.attempts) {
    attempt.configuration = attempt.configuration.id === configuration.id
      ? clone(configuration)
      : clone(configurationsById[attempt.configuration.id] ?? configuration);
    if (attempt.status !== 'SUCCESS') continue;
    try {
      attempt.ticket_snapshots = attempt.ticket_snapshots.map((snapshot) =>
        migrateTicketSnapshotToDiagnosisV2(snapshot, {
          domainCatalog: catalogs.domain,
          cardCatalog: catalogs.cards,
        }));
    } catch (error) {
      attempt.status = 'FAILURE';
      attempt.diagnostics = (error.diagnostics ?? [{
        code: 'INVALID_AUTHORED_INPUT',
        detail: error instanceof Error ? error.message : 'Diagnosis-v2 migration failed.',
      }]).map((entry) => ({
        code: entry.code ?? 'INVALID_AUTHORED_INPUT',
        constraint: 'AUTHORED_INPUT',
        detail: entry.detail,
        template_ids: [], requested_count: null, eligible_count: null, generated_index: null,
      }));
      attempt.selected_template_ids = [];
      attempt.ticket_snapshots = [];
      attempt.ticket_snapshot_digests = [];
      result.status = 'FAILURE';
      result.selected_attempt_id = null;
      continue;
    }
    const validationErrors = attempt.ticket_snapshots.flatMap((snapshot) =>
      validateDiagnosisV2Ticket(snapshot, { domainCatalog: catalogs.domain, cardCatalog: catalogs.cards }).errors);
    if (validationErrors.length > 0) {
      attempt.status = 'FAILURE';
      attempt.diagnostics = validationErrors.map((entry) => ({
        code: 'INVALID_AUTHORED_INPUT', constraint: 'AUTHORED_INPUT', detail: `${entry.code}: ${entry.detail}`,
        template_ids: [], requested_count: null, eligible_count: null, generated_index: null,
      }));
      attempt.selected_template_ids = [];
      attempt.ticket_snapshots = [];
      attempt.ticket_snapshot_digests = [];
      result.status = 'FAILURE';
      result.selected_attempt_id = null;
    } else {
      attempt.ticket_snapshot_digests = attempt.ticket_snapshots.map((snapshot) => sha256(snapshot));
    }
  }
  result.id = `builder_result.${sha256(result.attempts).slice(0, 24)}`;
  return result;
}
