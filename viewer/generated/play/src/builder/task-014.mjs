import { sha256 } from './canonical.mjs';
import { analyzeTicketCausalGraph, validateTicketSolvability } from './ticket-solvability.mjs';

export const TASK_014_RULESET_VERSION = 'first-version-v2';
export const TASK_014_BUILDER_VERSION = 'ticket-builder-v3';
export const TASK_014_CONFIGURATION_VERSION = 'ticket-builder-v3';
export const TASK_014_TICKET_CONTENT_VERSION = 'core-ticket-parts-v3';
export const TASK_014_DOMAIN_CONTENT_VERSION = 'core-domain-snapshot-technical-copy-v3';
export const TASK_014_CARD_CATALOG_VERSION = 'core-card-catalog-technical-copy-v4';
export const TASK_014_DECK_CATALOG_VERSION = 'core-response-decks-v4';
export const TASK_014_PART_CATALOG_VERSION = 'ticket-parts-v1';
export const TASK_014_STARTER_DECK_ID = 'deck.core.multisystem_response_v3';
export const TASK_042_BUILDER_VERSION = 'ticket-builder-v4';
export const TASK_042_CONFIGURATION_VERSION = 'ticket-builder-v4';
export const TASK_042_TICKET_CONTENT_VERSION = 'core-ticket-parts-v4';
export const TASK_042_DOMAIN_CONTENT_VERSION = 'core-domain-snapshot-story-expansion-v4';
export const TASK_042_CARD_CATALOG_VERSION = 'core-card-catalog-story-expansion-v5';
export const TASK_042_DECK_CATALOG_VERSION = 'core-response-decks-v5';
export const TASK_042_PART_CATALOG_VERSION = 'ticket-parts-v2';
export const TASK_042_RESPONSE_DECK_ID = 'deck.story.expansion_response_v1';

const clone = (value) => structuredClone(value);
const stableCompare = (left, right) => (left < right ? -1 : left > right ? 1 : 0);
const sorted = (values) => [...values].sort(stableCompare);
const token = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '');

function diagnostic(code, constraint, detail, {
  rootIds = [], requestedCount = null, eligibleCount = null, generatedIndex = null,
} = {}) {
  return {
    code,
    constraint,
    detail,
    template_ids: sorted(new Set(rootIds)),
    requested_count: requestedCount,
    eligible_count: eligibleCount,
    generated_index: generatedIndex,
  };
}

function byId(records, label) {
  if (!Array.isArray(records)) throw new TypeError(`${label} must be an array.`);
  const map = new Map(records.map((entry) => [entry.id ?? entry.part_id, entry]));
  if (map.size !== records.length) throw new Error(`${label} IDs must be unique.`);
  return map;
}

function relationships(entity, role) {
  return (entity?.relationships ?? [])
    .filter((entry) => entry.role === role)
    .map((entry) => entry.entity_id);
}

function evidenceTargetIds(source, domainById) {
  const ids = new Set(relationships(source, 'evidence_target'));
  for (const relatedTestId of relationships(source, 'related_test')) {
    for (const id of relationships(domainById.get(relatedTestId), 'evidence_target')) ids.add(id);
  }
  return ids;
}

function possibleOutcomes(source, candidateFaultId, domainById) {
  const direct = (source?.evidence_rules ?? []).find((rule) => rule.fault_id === candidateFaultId)?.possible_outcomes ?? [];
  if (direct.length > 0) return direct;
  for (const relatedTestId of relationships(source, 'related_test')) {
    const values = (domainById.get(relatedTestId)?.evidence_rules ?? [])
      .find((rule) => rule.fault_id === candidateFaultId)?.possible_outcomes ?? [];
    if (values.length > 0) return values;
  }
  return [];
}

function actionableInstance(blueprint) {
  const matches = blueprint.fault_instances.filter((entry) => entry.actionable && entry.required_to_repair);
  if (matches.length !== 1) throw new Error(`${blueprint.part_id} must expose exactly one required actionable Fault.`);
  return matches[0];
}

function compatibleParts(records, blueprintId, predicate = () => true) {
  return records.filter((entry) => (entry.compatible_fault_blueprint_part_ids ?? []).includes(blueprintId) && predicate(entry));
}

function choosePart(records, blueprintId, seed, namespace, predicate) {
  const eligible = compatibleParts(records, blueprintId, predicate).sort((left, right) => stableCompare(left.part_id, right.part_id));
  if (eligible.length === 0) throw new Error(`${blueprintId} has no compatible ${namespace} part.`);
  return eligible
    .map((entry) => ({ entry, rank: sha256({ seed, namespace, part_id: entry.part_id }) }))
    .sort((left, right) => stableCompare(left.rank, right.rank))[0].entry;
}

function publicCandidates(context, blueprint, candidatePart, domainById) {
  if (candidatePart.selection_rule !== 'PUBLIC_ASSOCIATED_FAULTS') {
    throw new Error(`Unsupported candidate selection rule ${candidatePart.selection_rule}.`);
  }
  const plausible = new Set();
  for (const symptomId of context.symptom_ids) {
    for (const candidateId of relationships(domainById.get(symptomId), 'associated_fault')) plausible.add(candidateId);
  }
  const truthIds = sorted(new Set(blueprint.fault_instances.map((entry) => entry.fault_id)));
  for (const truthId of truthIds) {
    if (!plausible.has(truthId)) throw new Error(`${context.part_id} does not make hidden ${truthId} publicly plausible.`);
  }
  const distractors = sorted([...plausible].filter((id) => !truthIds.includes(id)));
  const selected = sorted(new Set([
    ...truthIds,
    ...distractors.slice(0, Math.max(0, candidatePart.maximum_candidates - truthIds.length)),
  ]));
  if (selected.length < candidatePart.minimum_candidates || selected.length > candidatePart.maximum_candidates) {
    throw new Error(`${context.part_id} derives ${selected.length} candidates outside the authored bounds.`);
  }
  return selected;
}

function executableDefinitionId(card) {
  const contract = card?.play_contract;
  if (contract?.contract_type === 'DIAGNOSTIC') return contract.source_definition_id;
  if (contract?.contract_type === 'REPAIR') return contract.repair_procedure_id;
  if (contract?.contract_type === 'VERIFY') return contract.validation_procedure_id;
  return null;
}

function definitionCardId(cards, contractType, definitionId) {
  const matches = cards.filter((card) => card.play_contract?.contract_type === contractType
    && executableDefinitionId(card) === definitionId);
  if (matches.length !== 1) throw new Error(`${definitionId} resolves to ${matches.length} ${contractType} Cards.`);
  return matches[0].id;
}

function affectedComponents(faultId, domainById) {
  return new Set(relationships(domainById.get(faultId), 'affected_component'));
}

function diagnosticTargetInstance(card, blueprint, domainById) {
  const targetSpec = card.play_contract.target_spec;
  if (targetSpec.target_kind === 'ACTIVE_TICKET') return actionableInstance(blueprint);
  const allowed = new Set(targetSpec.allowed_component_definition_ids ?? []);
  return blueprint.fault_instances.find((instance) =>
    [...affectedComponents(instance.fault_id, domainById)].some((componentId) => allowed.has(componentId))) ?? null;
}

function diagnosticOutcomeId(root, stateKey, sourceId) {
  return `evidence.${token(root.fingerprint_id)}.${token(stateKey)}.${token(sourceId)}`;
}

function diagnosticOutcomes({ root, blueprint, plan, candidates, diagnosticCards, domainById, parts }) {
  const truthIds = new Set(blueprint.fault_instances.map((entry) => entry.fault_id));
  const repairedState = `${blueprint.initial_machine_state_key}.repaired`;
  const explicitBySource = new Map();
  for (const finding of plan.findings) {
    if (!explicitBySource.has(finding.source_definition_id)) explicitBySource.set(finding.source_definition_id, []);
    explicitBySource.get(finding.source_definition_id).push(finding);
  }
  const families = new Map(parts.diagnostic_outcome_families.map((entry) => [entry.classification, entry]));
  const outcomes = [];
  for (const card of diagnosticCards) {
    const target = diagnosticTargetInstance(card, blueprint, domainById);
    if (!target) continue;
    const sourceId = card.play_contract.source_definition_id;
    const source = domainById.get(sourceId);
    const supportedTargets = evidenceTargetIds(source, domainById);
    const explicit = explicitBySource.get(sourceId) ?? [];
    const candidateEffects = [];
    for (const finding of explicit) {
      if (!candidates.includes(finding.candidate_fault_id) || !supportedTargets.has(finding.candidate_fault_id)) {
        throw new Error(`${plan.part_id} maps ${sourceId} to unsupported ${finding.candidate_fault_id}.`);
      }
      if (!possibleOutcomes(source, finding.candidate_fault_id, domainById).includes(finding.disposition)) {
        throw new Error(`${plan.part_id} uses unauthorized ${finding.disposition} for ${sourceId} and ${finding.candidate_fault_id}.`);
      }
      candidateEffects.push({ candidate_fault_id: finding.candidate_fault_id, disposition: finding.disposition });
    }
    for (const candidateId of candidates.filter((id) => !truthIds.has(id) && supportedTargets.has(id))) {
      if (candidateEffects.some((entry) => entry.candidate_fault_id === candidateId)) continue;
      const allowed = possibleOutcomes(source, candidateId, domainById);
      const disposition = allowed.includes('RULE_OUT') ? 'RULE_OUT' : allowed.includes('CONTRADICT') ? 'CONTRADICT' : null;
      if (disposition) candidateEffects.push({ candidate_fault_id: candidateId, disposition });
    }
    candidateEffects.sort((left, right) => stableCompare(left.candidate_fault_id, right.candidate_fault_id));
    const classification = candidateEffects.length > 0
      ? 'CANDIDATE_EFFECT'
      : [...truthIds].some((id) => supportedTargets.has(id)) ? 'INCONCLUSIVE' : 'IRRELEVANT';
    const explicitSummary = explicit.map((entry) => entry.public_summary).join(' ');
    outcomes.push({
      outcome_id: diagnosticOutcomeId(root, blueprint.initial_machine_state_key, sourceId),
      source_definition_id: sourceId,
      target_ref: target.fault_instance_key,
      eligible_machine_state_key: blueprint.initial_machine_state_key,
      candidate_effects: candidateEffects,
      outcome_classification: classification,
      observation_id: null,
      public_summary: explicitSummary || (classification === 'CANDIDATE_EFFECT'
        ? 'The result contradicts one or more publicly plausible alternatives without disclosing hidden truth.'
        : families.get(classification).public_summary),
    });
    const repairedClassification = [...candidates].some((id) => supportedTargets.has(id)) ? 'CLEAN' : 'IRRELEVANT';
    outcomes.push({
      outcome_id: diagnosticOutcomeId(root, repairedState, sourceId),
      source_definition_id: sourceId,
      target_ref: target.fault_instance_key,
      eligible_machine_state_key: repairedState,
      candidate_effects: [],
      outcome_classification: repairedClassification,
      observation_id: null,
      public_summary: families.get(repairedClassification).public_summary,
    });
  }
  return outcomes.sort((left, right) => stableCompare(left.outcome_id, right.outcome_id));
}

function validateDistractors(ticket) {
  const truthIds = new Set(ticket.server_only_truth.fault_instances.map((entry) => entry.fault_id));
  for (const candidateId of ticket.public_candidate_fault_ids.filter((id) => !truthIds.has(id))) {
    if (!ticket.authored_evidence_outcomes.some((outcome) => outcome.candidate_effects.some((effect) =>
      effect.candidate_fault_id === candidateId && ['CONTRADICT', 'RULE_OUT'].includes(effect.disposition)))) {
      throw new Error(`Candidate ${candidateId} is not differentiable by an authored diagnostic result.`);
    }
  }
}

function assembleTicket({ root, configuration, attemptId, ordinal, catalogs }) {
  const { parts, domain, cards } = catalogs;
  const domainById = byId(domain.entities, 'Domain entities');
  const blueprintById = byId(parts.fault_blueprint_parts, 'Fault blueprint parts');
  const blueprint = clone(blueprintById.get(root.fault_blueprint_part_id));
  if (!blueprint) throw new Error(`${root.fingerprint_id} references a missing Fault blueprint.`);
  const namespace = `${root.fingerprint_id}.${configuration.generation_index_start + ordinal}`;
  const context = choosePart(parts.public_context_parts, blueprint.part_id, configuration.seed, `${namespace}.context`);
  const candidatePart = parts.candidate_pool_parts
    .map((entry) => ({ entry, rank: sha256({ seed: configuration.seed, namespace, part_id: entry.part_id }) }))
    .sort((left, right) => stableCompare(left.rank, right.rank))[0]?.entry;
  const diagnosticPlan = choosePart(parts.diagnostic_plan_parts, blueprint.part_id, configuration.seed, `${namespace}.diagnostics`);
  const isolationPlan = choosePart(parts.isolation_plan_parts, blueprint.part_id, configuration.seed, `${namespace}.isolation`);
  const repairPlan = choosePart(parts.repair_plan_parts, blueprint.part_id, configuration.seed, `${namespace}.repair`);
  const verifyPlan = choosePart(parts.verification_plan_parts, blueprint.part_id, configuration.seed, `${namespace}.verify`);
  const teaching = root.teaching_part_id
    ? parts.teaching_parts.find((entry) => entry.part_id === root.teaching_part_id)
    : parts.teaching_parts.find((entry) => entry.subsystem === root.subsystem);
  const closure = parts.closure_parts[0];
  if (!candidatePart || !teaching || !closure) throw new Error(`${root.fingerprint_id} lacks a required shared authored part.`);

  const candidates = publicCandidates(context, blueprint, candidatePart, domainById);
  const diagnosticCardIds = new Set(configuration.diagnostic_card_definition_ids);
  const availableDiagnostics = cards.cards.filter((card) => diagnosticCardIds.has(card.id)
    && card.play_contract?.contract_type === 'DIAGNOSTIC');
  const evidence = diagnosticOutcomes({
    root, blueprint, plan: diagnosticPlan, candidates, diagnosticCards: availableDiagnostics, domainById, parts,
  });
  const evidenceBySource = new Map(evidence
    .filter((entry) => entry.eligible_machine_state_key === blueprint.initial_machine_state_key)
    .map((entry) => [entry.source_definition_id, entry]));
  const target = actionableInstance(blueprint);
  if (isolationPlan.target_fault_id !== target.fault_id || repairPlan.target_fault_id !== target.fault_id) {
    throw new Error(`${root.fingerprint_id} has ambiguous or incompatible Isolation/Repair targets.`);
  }
  const isolationRequirementId = `isolation.${token(root.fingerprint_id)}`;
  const routes = isolationPlan.routes.map((route, index) => {
    const routeOutcomes = route.source_definition_ids.map((sourceId) => evidenceBySource.get(sourceId));
    if (routeOutcomes.some((entry) => !entry)) throw new Error(`${isolationPlan.part_id} requires an unavailable diagnostic.`);
    return {
      route_id: `route.${token(root.fingerprint_id)}.${String(index + 1).padStart(2, '0')}`,
      route_kind: route.route_kind,
      target_fault_instance_key: target.fault_instance_key,
      candidate_fault_id: target.fault_id,
      classification: 'ACTIONABLE_AND_DEEPEST',
      eligible_outcome_ids: routeOutcomes.map((entry) => entry.outcome_id),
      ...(route.minimum_distinct_outcomes ? { minimum_distinct_outcomes: route.minimum_distinct_outcomes } : {}),
    };
  });
  const repairedState = `${blueprint.initial_machine_state_key}.repaired`;
  const repairOutcomeId = `repair_outcome.${token(root.fingerprint_id)}`;
  const repairRequirementId = `repair_requirement.${token(root.fingerprint_id)}`;
  const verificationRequirements = verifyPlan.requirements.map((entry, index) => ({
    requirement_id: `verify_requirement.${token(root.fingerprint_id)}.${String(index + 1).padStart(2, '0')}`,
    validation_procedure_id: entry.validation_procedure_id,
    success_condition: entry.success_condition,
    must_pass_after_latest_repair: true,
  }));
  const verificationOutcomes = verificationRequirements.map((entry, index) => ({
    outcome_id: `verify_outcome.${token(root.fingerprint_id)}.${String(index + 1).padStart(2, '0')}.pass`,
    validation_procedure_id: entry.validation_procedure_id,
    requirement_id: entry.requirement_id,
    eligible_machine_state_key: repairedState,
    result: 'PASS',
    resulting_machine_state_key: repairedState,
    revealed_candidate_fault_ids: [],
    candidate_effects: [],
    public_summary: `${entry.success_condition} The required post-Repair check passes.`,
  }));
  const partIds = sorted(new Set([
    root.fault_blueprint_part_id,
    context.part_id,
    candidatePart.part_id,
    diagnosticPlan.part_id,
    isolationPlan.part_id,
    repairPlan.part_id,
    verifyPlan.part_id,
    teaching.part_id,
    closure.part_id,
    ...parts.diagnostic_outcome_families.map((entry) => entry.part_id),
  ]));
  const identity = sha256({
    seed: configuration.seed,
    configuration_id: configuration.id,
    attempt_id: attemptId,
    generation_index: configuration.generation_index_start + ordinal,
    fingerprint_id: root.fingerprint_id,
    part_ids: partIds,
  });
  const ticket = {
    id: `ticket.generated.${identity.slice(0, 24)}`,
    entity_type: 'repair_ticket',
    ruleset_version: TASK_014_RULESET_VERSION,
    ticket_contract_version: 'repair-ticket-v2',
    presentation: { display_name: context.display_name, short_description: context.short_description },
    source: { expansion_id: 'expansion.task_014', version: '1.0.0', status: 'published', search_tags: ['generated', root.subsystem, 'coverage'] },
    difficulty: teaching.difficulty,
    initial_symptom_ids: [...context.symptom_ids],
    public_context_entity_ids: [...context.symptom_ids],
    public_candidate_fault_ids: candidates,
    server_only_truth: {
      initial_machine_state_key: blueprint.initial_machine_state_key,
      fault_instances: clone(blueprint.fault_instances),
      causal_edge_ids: sorted(new Set(blueprint.causal_edges.map((entry) => entry.causal_edge_id))),
      causal_edges: clone(blueprint.causal_edges),
    },
    authored_evidence_outcomes: evidence,
    isolation_requirements: [{
      requirement_id: isolationRequirementId,
      target_fault_instance_key: target.fault_instance_key,
      candidate_fault_id: target.fault_id,
      classification: 'ACTIONABLE_AND_DEEPEST',
      routes,
    }],
    repair_requirements: [{
      requirement_id: repairRequirementId,
      target_fault_instance_key: target.fault_instance_key,
      fault_id: target.fault_id,
      eligible_repair_procedure_ids: [repairPlan.repair_procedure_id],
      eligible_repair_outcome_ids: [repairOutcomeId],
    }],
    authored_repair_outcomes: [{
      outcome_id: repairOutcomeId,
      repair_procedure_id: repairPlan.repair_procedure_id,
      target_fault_instance_key: target.fault_instance_key,
      eligible_machine_state_key: blueprint.initial_machine_state_key,
      resulting_machine_state_key: repairedState,
      resolved_fault_instance_keys: blueprint.fault_instances.map((entry) => entry.fault_instance_key),
      necessary_for_closure: true,
      public_summary: repairPlan.public_summary,
    }],
    verification_requirements: verificationRequirements,
    authored_verification_outcomes: verificationOutcomes,
    closure_requirements: {
      include_accepted_isolation: closure.include_accepted_isolation,
      include_cited_decisive_evidence: closure.include_cited_decisive_evidence,
      include_every_repair_in_accepted_path: closure.include_every_repair_in_accepted_path,
      include_every_failed_verify_in_accepted_path: closure.include_every_failed_verify_in_accepted_path,
      include_all_current_passing_verifies: closure.include_all_current_passing_verifies,
      required_fault_instance_keys: [target.fault_instance_key],
      required_isolation_requirement_ids: [isolationRequirementId],
      required_repair_outcome_ids: [repairOutcomeId],
      required_verification_requirement_ids: verificationRequirements.map((entry) => entry.requirement_id),
    },
    generation_provenance: {
      generator_version: parts.generator_version,
      content_version: parts.ticket_content_version,
      domain_content_version: parts.domain_content_version,
      card_catalog_version: parts.card_catalog_version,
      configuration_version: parts.configuration_version,
      configuration_id: configuration.id,
      attempt_id: attemptId,
      seed: configuration.seed,
      generation_index: configuration.generation_index_start + ordinal,
      template_id: parts.part_catalog_version === TASK_014_PART_CATALOG_VERSION
        ? 'assembly.task_014.parts_v1'
        : 'assembly.task_042.parts_v2',
      fallback_attempt_id: null,
      part_ids: partIds,
      fingerprint_id: root.fingerprint_id,
      causal_fingerprint: null,
    },
    educational_objectives: [...teaching.objectives],
  };
  ticket.generation_provenance.causal_fingerprint = analyzeTicketCausalGraph(ticket).causalFingerprint;
  validateDistractors(ticket);
  return ticket;
}

function diagnosticCardIds(catalogs) {
  return catalogs.cards.cards.filter((card) => card.play_contract?.contract_type === 'DIAGNOSTIC').map((card) => card.id).sort(stableCompare);
}

function responseRequirementCounts(ticket, cardCatalog) {
  const cards = cardCatalog.cards;
  const result = new Map();
  const add = (contractType, definitionId) => {
    const id = definitionCardId(cards, contractType, definitionId);
    result.set(id, (result.get(id) ?? 0) + 1);
  };
  for (const outcome of ticket.authored_repair_outcomes.filter((entry) => entry.necessary_for_closure)) {
    add('REPAIR', outcome.repair_procedure_id);
  }
  for (const requirement of ticket.verification_requirements) add('VERIFY', requirement.validation_procedure_id);
  return result;
}

function resourceMap(configuration) {
  return new Map(Object.entries(configuration.available_card_definition_counts ?? {}));
}

function subtractResources(available, required) {
  const next = new Map(available);
  for (const [id, count] of required) {
    if ((next.get(id) ?? 0) < count) return null;
    next.set(id, next.get(id) - count);
  }
  return next;
}

function scheduleRoots(eligible, requestedCount, available, seed, attemptId) {
  const occurrences = new Map(eligible.map((entry) => [entry.root.fingerprint_id, 0]));
  const memo = new Set();
  const visit = (chosen, remaining) => {
    if (chosen.length === requestedCount) return chosen;
    const key = JSON.stringify({
      chosen: chosen.map((entry) => entry.root.fingerprint_id),
      remaining: [...remaining].sort(([left], [right]) => stableCompare(left, right)),
    });
    if (memo.has(key)) return null;
    memo.add(key);
    const unused = eligible.filter((entry) => occurrences.get(entry.root.fingerprint_id) === 0);
    let candidates = unused;
    if (candidates.length === 0) {
      const minimum = Math.min(...eligible.map((entry) => occurrences.get(entry.root.fingerprint_id)));
      candidates = eligible.filter((entry) => occurrences.get(entry.root.fingerprint_id) === minimum);
    }
    const position = chosen.length;
    const ordered = candidates.map((entry) => ({
      entry,
      rank: sha256({ seed, attemptId, position, fingerprint_id: entry.root.fingerprint_id }),
    })).sort((left, right) => stableCompare(left.rank, right.rank));
    for (const { entry } of ordered) {
      const nextRemaining = subtractResources(remaining, entry.responseCounts);
      if (!nextRemaining) continue;
      occurrences.set(entry.root.fingerprint_id, occurrences.get(entry.root.fingerprint_id) + 1);
      const result = visit([...chosen, entry], nextRemaining);
      occurrences.set(entry.root.fingerprint_id, occurrences.get(entry.root.fingerprint_id) - 1);
      if (result) return result;
    }
    return null;
  };
  return visit([], available);
}

function validateConfiguration(configuration, catalogs) {
  const errors = [];
  const { parts } = catalogs;
  const versions = [
    ['configuration_version', parts.configuration_version],
    ['generator_version', parts.generator_version],
    ['content_version', parts.ticket_content_version],
    ['domain_content_version', parts.domain_content_version],
    ['card_catalog_version', parts.card_catalog_version],
  ];
  for (const [field, expected] of versions) {
    if (configuration?.[field] !== expected) errors.push(diagnostic('VERSION_MISMATCH', 'VERSION', `${field} must equal ${expected}.`));
  }
  if (!Number.isInteger(configuration?.requested_ticket_count)
      || configuration.requested_ticket_count < 1 || configuration.requested_ticket_count > 10) {
    errors.push(diagnostic('INVALID_CONFIGURATION', 'CONFIGURATION', 'requested_ticket_count must be an integer from 1 through 10.'));
  }
  if (typeof configuration?.seed !== 'string' || configuration.seed.length === 0) {
    errors.push(diagnostic('INVALID_CONFIGURATION', 'CONFIGURATION', 'seed must be a nonempty string.'));
  }
  if (!Array.isArray(configuration?.diagnostic_card_definition_ids)
      || new Set(configuration.diagnostic_card_definition_ids).size !== configuration.diagnostic_card_definition_ids.length) {
    errors.push(diagnostic('INVALID_CONFIGURATION', 'CARD_POOL', 'diagnostic_card_definition_ids must be a unique array.'));
  } else {
    const expected = diagnosticCardIds(catalogs);
    if (JSON.stringify(sorted(configuration.diagnostic_card_definition_ids)) !== JSON.stringify(expected)) {
      errors.push(diagnostic('CARD_POOL_UNREACHABLE', 'CARD_POOL', 'The exact Global Bench is incomplete for this content version.'));
    }
  }
  const available = configuration?.available_card_definition_counts;
  if (!available || typeof available !== 'object' || Array.isArray(available)
      || Object.values(available).some((count) => !Number.isInteger(count) || count < 1 || count > 6)
      || Object.values(available).reduce((sum, count) => sum + count, 0) !== 30) {
    errors.push(diagnostic('INVALID_CONFIGURATION', 'CARD_POOL', 'available_card_definition_counts must describe the exact legal 30-card response deck with one through six copies per definition.'));
  }
  const legal = sorted(new Set(configuration?.legal_card_definition_ids ?? []));
  const declared = sorted(new Set([
    ...(configuration?.diagnostic_card_definition_ids ?? []),
    ...Object.keys(available ?? {}),
  ]));
  if (JSON.stringify(legal) !== JSON.stringify(declared)) {
    errors.push(diagnostic('INVALID_CONFIGURATION', 'CARD_POOL', 'legal_card_definition_ids must exactly equal the declared Bench and response-deck resources.'));
  }
  return errors;
}

export function validateTask014OutcomeCoverage(ticket, { domainCatalog, cardCatalog, diagnosticCardDefinitionIds }) {
  const domainById = byId(domainCatalog.entities, 'Domain entities');
  const blueprint = { fault_instances: ticket.server_only_truth.fault_instances };
  const states = sorted(new Set([
    ticket.server_only_truth.initial_machine_state_key,
    ...ticket.authored_repair_outcomes.flatMap((entry) => [entry.eligible_machine_state_key, entry.resulting_machine_state_key]),
    ...ticket.authored_verification_outcomes.flatMap((entry) => [entry.eligible_machine_state_key, entry.resulting_machine_state_key]),
  ]));
  const cards = cardCatalog.cards.filter((card) => diagnosticCardDefinitionIds.includes(card.id));
  const errors = [];
  for (const card of cards) {
    if (!diagnosticTargetInstance(card, blueprint, domainById)) continue;
    for (const state of states) {
      const sourceId = card.play_contract.source_definition_id;
      const count = ticket.authored_evidence_outcomes.filter((entry) =>
        entry.source_definition_id === sourceId && entry.eligible_machine_state_key === state).length;
      if (count !== 1) errors.push({
        code: 'DIAGNOSTIC_OUTCOME_COVERAGE',
        detail: `${sourceId} has ${count} outcomes for ${state}; exactly one is required.`,
      });
    }
  }
  return { valid: errors.length === 0, errors };
}

export function createTask014Catalogs({ cards, decks, domain, parts, coverage }) {
  if (cards.card_catalog_version !== TASK_014_CARD_CATALOG_VERSION
      || decks.deck_catalog_version !== TASK_014_DECK_CATALOG_VERSION
      || domain.domain_content_version !== TASK_014_DOMAIN_CONTENT_VERSION
      || parts.part_catalog_version !== TASK_014_PART_CATALOG_VERSION
      || coverage.coverage_version !== 'playable-coverage-v4') {
    throw new Error('TASK-014 catalog versions are incompatible.');
  }
  return {
    cards: clone(cards),
    decks: clone(decks),
    domain: clone(domain),
    parts: clone(parts),
    coverage: clone(coverage),
    ticketContent: { ticket_content_version: TASK_014_TICKET_CONTENT_VERSION, part_catalog_version: TASK_014_PART_CATALOG_VERSION },
    engineCatalogs: { cards: clone(cards), decks: clone(decks), domain: clone(domain), content_version: domain.domain_content_version },
    rulesetVersion: TASK_014_RULESET_VERSION,
  };
}

export function createTask042Catalogs({ cards, decks, domain, parts, coverage }) {
  if (cards.card_catalog_version !== TASK_042_CARD_CATALOG_VERSION
      || decks.deck_catalog_version !== TASK_042_DECK_CATALOG_VERSION
      || domain.domain_content_version !== TASK_042_DOMAIN_CONTENT_VERSION
      || parts.part_catalog_version !== TASK_042_PART_CATALOG_VERSION
      || coverage.coverage_version !== 'playable-coverage-v5') {
    throw new Error('TASK-042 catalog versions are incompatible.');
  }
  const deckById = new Map(decks.decks.map((deck) => [deck.id, deck]));
  const cardIds = new Set(cards.cards.map((card) => card.id));
  for (const root of parts.fingerprint_roots) {
    const deckId = root.response_deck_id ?? TASK_014_STARTER_DECK_ID;
    const deck = deckById.get(deckId);
    if (!deck) throw new Error(`${root.fingerprint_id} references missing response Deck ${deckId}.`);
    if (deck.card_definition_ids.some((id) => !cardIds.has(id))) {
      throw new Error(`${deckId} contains a missing Card definition.`);
    }
    if (root.teaching_part_id && !parts.teaching_parts.some((entry) => entry.part_id === root.teaching_part_id)) {
      throw new Error(`${root.fingerprint_id} references missing Teaching part ${root.teaching_part_id}.`);
    }
  }
  return {
    cards: clone(cards),
    decks: clone(decks),
    domain: clone(domain),
    parts: clone(parts),
    coverage: clone(coverage),
    ticketContent: { ticket_content_version: TASK_042_TICKET_CONTENT_VERSION, part_catalog_version: TASK_042_PART_CATALOG_VERSION },
    engineCatalogs: { cards: clone(cards), decks: clone(decks), domain: clone(domain), content_version: domain.domain_content_version },
    rulesetVersion: TASK_014_RULESET_VERSION,
  };
}

export function analyzeDeckCoverage({ cardDefinitionIds, catalogs }) {
  const counts = new Map();
  for (const id of cardDefinitionIds) counts.set(id, (counts.get(id) ?? 0) + 1);
  const fakeConfiguration = {
    id: 'builder_config.coverage_analysis',
    seed: 'coverage-analysis',
    generation_index_start: 0,
    diagnostic_card_definition_ids: diagnosticCardIds(catalogs),
  };
  const attemptId = 'builder_attempt.coverage_analysis';
  const entries = [];
  for (const root of catalogs.parts.fingerprint_roots) {
    try {
      const ticket = assembleTicket({ root, configuration: fakeConfiguration, attemptId, ordinal: 0, catalogs });
      const required = responseRequirementCounts(ticket, catalogs.cards);
      const missing = [...required].filter(([id, count]) => (counts.get(id) ?? 0) < count).map(([id]) => id);
      entries.push({ fingerprint_id: root.fingerprint_id, subsystem: root.subsystem, compatible: missing.length === 0, missing_card_definition_ids: missing, requiredCounts: required });
    } catch (error) {
      entries.push({ fingerprint_id: root.fingerprint_id, subsystem: root.subsystem, compatible: false, missing_card_definition_ids: [], error: error.message });
    }
  }
  const compatible = entries.filter((entry) => entry.compatible);
  let maximumDistinct = 0;
  const visit = (index, selected, remaining) => {
    if (selected + (compatible.length - index) <= maximumDistinct) return;
    if (index === compatible.length) {
      maximumDistinct = Math.max(maximumDistinct, selected);
      return;
    }
    const next = subtractResources(remaining, compatible[index].requiredCounts);
    if (next) visit(index + 1, selected + 1, next);
    visit(index + 1, selected, remaining);
  };
  visit(0, 0, counts);
  return {
    eligible_unique_count: maximumDistinct,
    individually_compatible_count: compatible.length,
    supported_unique_count: entries.length,
    subsystems: Object.fromEntries(sorted(new Set(entries.map((entry) => entry.subsystem))).map((subsystem) => [
      subsystem,
      entries.filter((entry) => entry.subsystem === subsystem && entry.compatible).length,
    ])),
    fingerprints: entries.map(({ requiredCounts: _, ...entry }) => entry),
  };
}

export function buildTicketsV3({ configuration, catalogs }) {
  const attemptId = `builder_attempt.${sha256({ configuration, part_catalog_version: catalogs.parts.part_catalog_version }).slice(0, 24)}`;
  const configurationErrors = validateConfiguration(configuration, catalogs);
  const failure = (diagnostics) => {
    const attempt = {
      attempt_id: attemptId,
      attempt_kind: 'PRIMARY',
      parent_attempt_id: null,
      configuration: clone(configuration),
      status: 'FAILURE',
      diagnostics,
      selected_template_ids: [],
      ticket_snapshot_digests: [],
      ticket_snapshots: [],
    };
    return {
      id: `builder_result.${sha256([attempt]).slice(0, 24)}`,
      entity_type: 'ticket_builder_result',
      status: 'FAILURE',
      primary_attempt_id: attemptId,
      selected_attempt_id: null,
      attempts: [attempt],
    };
  };
  if (configurationErrors.length > 0) return failure(configurationErrors);

  const legalIds = configuration.legal_card_definition_ids;
  const active = new Set(configuration.active_causal_fingerprints ?? []);
  const allowedFingerprintIds = new Set(configuration.allowed_fingerprint_ids ?? []);
  const authoredErrors = [];
  const eligible = [];
  for (const root of [...catalogs.parts.fingerprint_roots].sort((left, right) => stableCompare(left.fingerprint_id, right.fingerprint_id))) {
    if (allowedFingerprintIds.size > 0 && !allowedFingerprintIds.has(root.fingerprint_id)) continue;
    try {
      const preview = assembleTicket({ root, configuration, attemptId, ordinal: 0, catalogs });
      const analysis = analyzeTicketCausalGraph(preview);
      if (active.has(analysis.causalFingerprint)) continue;
      if ((configuration.allowed_tags?.length ?? 0) > 0 && !configuration.allowed_tags.includes(root.subsystem)) continue;
      if ((configuration.excluded_tags ?? []).includes(root.subsystem)) continue;
      const responseCounts = responseRequirementCounts(preview, catalogs.cards);
      if (!subtractResources(resourceMap(configuration), responseCounts)) continue;
      const solvability = validateTicketSolvability(preview, {
        domainCatalog: catalogs.domain,
        cardCatalog: catalogs.cards,
        legalCardDefinitionIds: legalIds,
      });
      const outcomeCoverage = validateTask014OutcomeCoverage(preview, {
        domainCatalog: catalogs.domain,
        cardCatalog: catalogs.cards,
        diagnosticCardDefinitionIds: configuration.diagnostic_card_definition_ids,
      });
      if (!analysis.valid || !solvability.valid || !outcomeCoverage.valid) {
        const details = [...analysis.errors, ...solvability.errors, ...outcomeCoverage.errors].map((entry) => entry.detail).join(' ');
        throw new Error(details);
      }
      eligible.push({ root, responseCounts, causalFingerprint: analysis.causalFingerprint });
    } catch (error) {
      authoredErrors.push(diagnostic('INVALID_AUTHORED_INPUT', 'AUTHORED_INPUT', error.message, { rootIds: [root.fingerprint_id] }));
    }
  }
  if (authoredErrors.length > 0) return failure(authoredErrors);
  const schedule = scheduleRoots(
    eligible,
    configuration.requested_ticket_count,
    resourceMap(configuration),
    configuration.seed,
    attemptId,
  );
  if (!schedule) {
    return failure([
      diagnostic('CARD_POOL_UNREACHABLE', 'CARD_POOL', 'The exact active response deck cannot supply every selected Repair and Verify path for the requested queue.', {
        requestedCount: configuration.requested_ticket_count,
        eligibleCount: eligible.length,
      }),
      diagnostic('REQUESTED_COUNT_UNSATISFIABLE', 'REQUESTED_COUNT', 'No complete all-or-none queue satisfies variety and resource constraints.', {
        requestedCount: configuration.requested_ticket_count,
        eligibleCount: eligible.length,
      }),
    ]);
  }
  const snapshots = schedule.map((entry, ordinal) => assembleTicket({
    root: entry.root, configuration, attemptId, ordinal, catalogs,
  }));
  const finalErrors = [];
  for (const ticket of snapshots) {
    const solvability = validateTicketSolvability(ticket, {
      domainCatalog: catalogs.domain,
      cardCatalog: catalogs.cards,
      legalCardDefinitionIds: legalIds,
    });
    const outcomeCoverage = validateTask014OutcomeCoverage(ticket, {
      domainCatalog: catalogs.domain,
      cardCatalog: catalogs.cards,
      diagnosticCardDefinitionIds: configuration.diagnostic_card_definition_ids,
    });
    finalErrors.push(...solvability.errors, ...outcomeCoverage.errors);
  }
  if (finalErrors.length > 0) return failure(finalErrors.map((entry) =>
    diagnostic('INVALID_AUTHORED_INPUT', 'AUTHORED_INPUT', entry.detail)));
  const attempt = {
    attempt_id: attemptId,
    attempt_kind: 'PRIMARY',
    parent_attempt_id: null,
    configuration: clone(configuration),
    status: 'SUCCESS',
    diagnostics: [],
    selected_template_ids: schedule.map((entry) => entry.root.fingerprint_id),
    ticket_snapshot_digests: snapshots.map((ticket) => sha256(ticket)),
    ticket_snapshots: snapshots,
  };
  return {
    id: `builder_result.${sha256([attempt]).slice(0, 24)}`,
    entity_type: 'ticket_builder_result',
    status: 'SUCCESS',
    primary_attempt_id: attemptId,
    selected_attempt_id: attemptId,
    attempts: [attempt],
  };
}

export function buildTicketsV4(input) {
  return buildTicketsV3(input);
}
