import { canonicalJson, sha256 } from './canonical.mjs';

const stableCompare = (left, right) => (left < right ? -1 : left > right ? 1 : 0);
const sorted = (values) => [...values].sort(stableCompare);
const sameSet = (left, right) =>
  left.size === right.size && [...left].every((value) => right.has(value));

function domainEntities(catalog) {
  const entities = catalog?.entities ?? catalog?.domain_entities ?? catalog?.records;
  if (!Array.isArray(entities)) throw new TypeError('Domain catalog must expose an entities array.');
  return entities;
}

function cards(catalog) {
  if (!Array.isArray(catalog?.cards)) throw new TypeError('Card catalog must expose a cards array.');
  return catalog.cards;
}

function executableDefinitionId(card) {
  const contract = card.play_contract ?? {};
  if (contract.contract_type === 'DIAGNOSTIC') return contract.source_definition_id ?? null;
  if (contract.contract_type === 'REPAIR') return contract.repair_procedure_id ?? null;
  if (contract.contract_type === 'VERIFY') return contract.validation_procedure_id ?? null;
  return null;
}

function error(code, detail) {
  return { code, detail };
}

function relatedIds(entity, role) {
  return (entity?.relationships ?? [])
    .filter((relationship) => relationship.role === role)
    .map((relationship) => relationship.entity_id);
}

function evidenceTargetIds(source, domainById) {
  const targetIds = new Set(relatedIds(source, 'evidence_target'));
  for (const testId of relatedIds(source, 'related_test')) {
    for (const targetId of relatedIds(domainById.get(testId), 'evidence_target')) targetIds.add(targetId);
  }
  return targetIds;
}

export function analyzeTicketCausalGraph(ticket) {
  const instances = ticket.server_only_truth.fault_instances;
  const instanceByKey = new Map(instances.map((instance) => [instance.fault_instance_key, instance]));
  const incoming = new Map(instances.map((instance) => [instance.fault_instance_key, []]));
  const outgoing = new Map(instances.map((instance) => [instance.fault_instance_key, []]));
  const errors = [];

  if (instanceByKey.size !== instances.length) {
    errors.push(error('CAUSAL_GRAPH_INVALID', 'Fault instance keys must be unique.'));
  }
  const edgeBindingIds = ticket.server_only_truth.causal_edges.map((edge) => edge.causal_edge_id);
  if (new Set(edgeBindingIds).size !== edgeBindingIds.length) {
    errors.push(error('CAUSAL_GRAPH_INVALID', 'Instance-bound causal edge IDs must be unique.'));
  }

  for (const edge of ticket.server_only_truth.causal_edges) {
    if (!instanceByKey.has(edge.cause_fault_instance_key)) {
      errors.push(error('CAUSAL_GRAPH_INVALID', `${edge.causal_edge_id} has an unknown cause instance.`));
      continue;
    }
    if (!instanceByKey.has(edge.effect_fault_instance_key)) {
      errors.push(error('CAUSAL_GRAPH_INVALID', `${edge.causal_edge_id} has an unknown effect instance.`));
      continue;
    }
    if (edge.cause_fault_instance_key === edge.effect_fault_instance_key) {
      errors.push(error('CAUSAL_GRAPH_INVALID', `${edge.causal_edge_id} is a self-loop.`));
      continue;
    }
    outgoing.get(edge.cause_fault_instance_key).push(edge.effect_fault_instance_key);
    incoming.get(edge.effect_fault_instance_key).push(edge.cause_fault_instance_key);
  }

  for (const neighbors of [...incoming.values(), ...outgoing.values()]) neighbors.sort();
  const indegree = new Map([...incoming].map(([key, neighbors]) => [key, neighbors.length]));
  const ready = sorted([...indegree].filter(([, degree]) => degree === 0).map(([key]) => key));
  const topological = [];
  while (ready.length > 0) {
    const key = ready.shift();
    topological.push(key);
    for (const next of outgoing.get(key)) {
      const degree = indegree.get(next) - 1;
      indegree.set(next, degree);
      if (degree === 0) {
        ready.push(next);
        ready.sort();
      }
    }
  }
  if (topological.length !== instances.length) {
    errors.push(error('CAUSAL_GRAPH_INVALID', 'The instance-bound causal graph contains a directed cycle.'));
  }

  const depth = new Map(instances.map((instance) => [instance.fault_instance_key, 0]));
  for (const key of topological) {
    for (const next of outgoing.get(key)) depth.set(next, Math.max(depth.get(next), depth.get(key) + 1));
  }

  const nodeFingerprintParts = instances
    .map((instance) => ({
      fault_id: instance.fault_id,
      role: instance.role,
      actionable: instance.actionable,
      deepest: instance.deepest,
      required_to_repair: instance.required_to_repair,
    }))
    .sort((left, right) => stableCompare(canonicalJson(left), canonicalJson(right)));
  const edgeFingerprintParts = ticket.server_only_truth.causal_edges
    .map((edge) => ({
      causal_edge_id: edge.causal_edge_id,
      cause_fault_id: instanceByKey.get(edge.cause_fault_instance_key)?.fault_id ?? null,
      effect_fault_id: instanceByKey.get(edge.effect_fault_instance_key)?.fault_id ?? null,
    }))
    .sort((left, right) => stableCompare(canonicalJson(left), canonicalJson(right)));
  const requiredActionableKeys = new Set(instances
    .filter((instance) => instance.actionable && instance.required_to_repair)
    .map((instance) => instance.fault_instance_key));
  const actionableIncoming = new Map([...requiredActionableKeys].map((key) => [key, []]));
  const actionableOutgoing = new Map([...requiredActionableKeys].map((key) => [key, []]));
  for (const edge of ticket.server_only_truth.causal_edges) {
    if (requiredActionableKeys.has(edge.cause_fault_instance_key)
      && requiredActionableKeys.has(edge.effect_fault_instance_key)) {
      actionableOutgoing.get(edge.cause_fault_instance_key).push(edge.effect_fault_instance_key);
      actionableIncoming.get(edge.effect_fault_instance_key).push(edge.cause_fault_instance_key);
    }
  }
  const actionableDepth = new Map([...requiredActionableKeys].map((key) => [key, 0]));
  for (const key of topological) {
    if (!requiredActionableKeys.has(key)) continue;
    for (const next of actionableOutgoing.get(key)) {
      actionableDepth.set(next, Math.max(actionableDepth.get(next), actionableDepth.get(key) + 1));
    }
  }
  const metrics = {
    fault_count: instances.length,
    required_actionable_fault_count: requiredActionableKeys.size,
    causal_depth: Math.max(0, ...actionableDepth.values()),
    inbound_branching: Math.max(0, ...[...actionableIncoming.values()].map((neighbors) => neighbors.length)),
    outbound_branching: Math.max(0, ...[...actionableOutgoing.values()].map((neighbors) => neighbors.length)),
  };

  for (const instance of instances) {
    const graphDeepest = (incoming.get(instance.fault_instance_key)?.length ?? 0) === 0;
    if (instance.deepest !== graphDeepest) {
      errors.push(error('CAUSAL_GRAPH_INVALID', `${instance.fault_instance_key} deepest does not match its instance-bound causal position.`));
    }
    if (instance.required_to_repair && !instance.actionable) {
      errors.push(error('CAUSAL_GRAPH_INVALID', `${instance.fault_instance_key} is required to repair but is not actionable.`));
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    metrics,
    causalFingerprint: sha256({ nodes: nodeFingerprintParts, edges: edgeFingerprintParts }),
    instanceByKey,
    incoming,
    outgoing,
  };
}

function supportsDomainDefinition(cardById, legalCardIds, domainId) {
  return legalCardIds.some((cardId) => executableDefinitionId(cardById.get(cardId) ?? {}) === domainId);
}

function diagnosticCardSupports(cardById, legalCardIds, sourceId, targetFaultId, domainById) {
  const targetComponents = new Set(relatedIds(domainById.get(targetFaultId), 'affected_component'));
  return legalCardIds.some((cardId) => {
    const card = cardById.get(cardId);
    if (!card || card.play_contract?.contract_type !== 'DIAGNOSTIC'
      || executableDefinitionId(card) !== sourceId) return false;
    const targetSpec = card.play_contract.target_spec ?? {};
    const allowedComponents = targetSpec.allowed_component_definition_ids;
    if (targetSpec.target_kind !== 'TICKET_COMPONENT' || !Array.isArray(allowedComponents)
      || allowedComponents.length === 0) return true;
    return allowedComponents.some((componentId) => targetComponents.has(componentId));
  });
}

function repairCardSupports(cardById, legalCardIds, procedureId, faultId) {
  return legalCardIds.some((cardId) => {
    const card = cardById.get(cardId);
    if (!card || card.play_contract?.contract_type !== 'REPAIR'
      || executableDefinitionId(card) !== procedureId) return false;
    const allowed = card.play_contract?.target_spec?.allowed_fault_definition_ids;
    return !Array.isArray(allowed) || allowed.includes(faultId);
  });
}

function stateKey(state) {
  return canonicalJson({
    machine: state.machine,
    currentIsolations: sorted(state.currentIsolations),
    isolationHistory: sorted(state.isolationHistory),
    repairs: sorted(state.repairs),
    passes: sorted(state.passes),
    verificationHistory: sorted(state.verificationHistory),
  });
}

function validateTicketReferences(ticket, domainById, graph) {
  const errors = [];
  const expect = (id, types, context) => {
    const entity = domainById.get(id);
    if (!entity) errors.push(error('REFERENCE_NOT_FOUND', `${context} references missing ${id}.`));
    else if (!types.includes(entity.entity_type)) {
      errors.push(error('REFERENCE_NOT_FOUND', `${context} expected ${types.join('/')} but ${id} is ${entity.entity_type}.`));
    }
    return entity;
  };
  for (const id of ticket.initial_symptom_ids) expect(id, ['symptom'], ticket.id);
  for (const id of ticket.public_candidate_fault_ids) expect(id, ['fault'], ticket.id);
  for (const instance of ticket.server_only_truth.fault_instances) expect(instance.fault_id, ['fault'], instance.fault_instance_key);

  const boundEdgeIds = new Set();
  for (const binding of ticket.server_only_truth.causal_edges) {
    boundEdgeIds.add(binding.causal_edge_id);
    const edge = expect(binding.causal_edge_id, ['fault_causal_edge'], ticket.id);
    const cause = graph.instanceByKey.get(binding.cause_fault_instance_key);
    const effect = graph.instanceByKey.get(binding.effect_fault_instance_key);
    const causeFaultIds = edge ? new Set([
      ...(edge.cause_fault_id ? [edge.cause_fault_id] : []),
      ...relatedIds(edge, 'cause_fault'),
    ]) : new Set();
    const effectFaultIds = edge ? new Set([
      ...(edge.effect_fault_id ? [edge.effect_fault_id] : []),
      ...relatedIds(edge, 'effect_fault'),
    ]) : new Set();
    if (edge && cause && !causeFaultIds.has(cause.fault_id)) {
      errors.push(error('CAUSAL_GRAPH_INVALID', `${binding.causal_edge_id} cause does not match ${cause.fault_instance_key}.`));
    }
    if (edge && effect && !effectFaultIds.has(effect.fault_id)) {
      errors.push(error('CAUSAL_GRAPH_INVALID', `${binding.causal_edge_id} effect does not match ${effect.fault_instance_key}.`));
    }
  }
  if (!sameSet(boundEdgeIds, new Set(ticket.server_only_truth.causal_edge_ids))) {
    errors.push(error('CAUSAL_GRAPH_INVALID', 'causal_edge_ids does not equal the unique instance-bound causal-edge ID set.'));
  }

  const publicCandidates = new Set(ticket.public_candidate_fault_ids);
  for (const outcome of ticket.authored_evidence_outcomes) {
    const source = expect(outcome.source_definition_id, ['test', 'command'], outcome.outcome_id);
    const target = graph.instanceByKey.get(outcome.target_ref);
    if (!target) {
      errors.push(error('REFERENCE_NOT_FOUND', `${outcome.outcome_id} targets unknown Fault instance ${outcome.target_ref}.`));
    }
    for (const effect of outcome.candidate_effects) {
      if (!publicCandidates.has(effect.candidate_fault_id)) {
        errors.push(error('INVALID_AUTHORED_INPUT', `${outcome.outcome_id} affects undeclared candidate ${effect.candidate_fault_id}.`));
      }
      if (source && !evidenceTargetIds(source, domainById).has(effect.candidate_fault_id)) {
        errors.push(error('INVALID_AUTHORED_INPUT', `${outcome.outcome_id} maps ${source.id} to unsupported Evidence target ${effect.candidate_fault_id}.`));
      }
    }
  }

  const repairOutcomes = new Map(ticket.authored_repair_outcomes.map((outcome) => [outcome.outcome_id, outcome]));
  if (repairOutcomes.size !== ticket.authored_repair_outcomes.length) {
    errors.push(error('INVALID_AUTHORED_INPUT', 'Authored Repair outcome IDs must be unique.'));
  }
  for (const outcome of ticket.authored_repair_outcomes) {
    const procedure = expect(outcome.repair_procedure_id, ['repair_procedure'], outcome.outcome_id);
    const target = graph.instanceByKey.get(outcome.target_fault_instance_key);
    if (!target) errors.push(error('REFERENCE_NOT_FOUND', `${outcome.outcome_id} targets an unknown Fault instance.`));
    if (procedure && target && !new Set([
      ...(procedure.target_fault_ids ?? []),
      ...relatedIds(procedure, 'target_fault'),
    ]).has(target.fault_id)) {
      errors.push(error('INVALID_AUTHORED_INPUT', `${outcome.outcome_id} procedure does not target ${target.fault_id}.`));
    }
    for (const key of outcome.resolved_fault_instance_keys) {
      if (!graph.instanceByKey.has(key)) errors.push(error('REFERENCE_NOT_FOUND', `${outcome.outcome_id} resolves unknown instance ${key}.`));
    }
  }

  const evidenceOutcomes = new Map(ticket.authored_evidence_outcomes.map((outcome) => [outcome.outcome_id, outcome]));
  const verificationOutcomes = new Map(ticket.authored_verification_outcomes.map((outcome) => [outcome.outcome_id, outcome]));
  if (evidenceOutcomes.size !== ticket.authored_evidence_outcomes.length) {
    errors.push(error('INVALID_AUTHORED_INPUT', 'Authored Evidence outcome IDs must be unique.'));
  }
  if (verificationOutcomes.size !== ticket.authored_verification_outcomes.length) {
    errors.push(error('INVALID_AUTHORED_INPUT', 'Authored Verify outcome IDs must be unique.'));
  }
  const isolationById = new Map();
  const isolationTargets = new Set();
  for (const requirement of ticket.isolation_requirements) {
    if (isolationById.has(requirement.requirement_id)) {
      errors.push(error('INVALID_AUTHORED_INPUT', `Duplicate Isolation requirement ${requirement.requirement_id}.`));
    }
    isolationById.set(requirement.requirement_id, requirement);
    if (isolationTargets.has(requirement.target_fault_instance_key)) {
      errors.push(error('INVALID_AUTHORED_INPUT', `Fault instance ${requirement.target_fault_instance_key} has multiple Isolation requirements.`));
    }
    isolationTargets.add(requirement.target_fault_instance_key);
    const target = graph.instanceByKey.get(requirement.target_fault_instance_key);
    if (!target || target.fault_id !== requirement.candidate_fault_id || !target.actionable) {
      errors.push(error('INVALID_AUTHORED_INPUT', `${requirement.requirement_id} is not bound to its actionable truth instance.`));
    }
    if (!publicCandidates.has(requirement.candidate_fault_id)) {
      errors.push(error('INVALID_AUTHORED_INPUT', `${requirement.requirement_id} candidate is not public.`));
    }
    const eligible = requirement.eligible_outcome_ids.map((id) => evidenceOutcomes.get(id)).filter(Boolean);
    if (eligible.length !== requirement.eligible_outcome_ids.length) {
      errors.push(error('REFERENCE_NOT_FOUND', `${requirement.requirement_id} references an unknown Evidence outcome.`));
    }
    const eligibleVerify = requirement.eligible_verification_outcome_ids
      .map((id) => verificationOutcomes.get(id)).filter(Boolean);
    if (eligibleVerify.length !== requirement.eligible_verification_outcome_ids.length) {
      errors.push(error('REFERENCE_NOT_FOUND', `${requirement.requirement_id} references an unknown Verify outcome.`));
    }
    if (eligibleVerify.some((outcome) => !['FAIL', 'INCONCLUSIVE'].includes(outcome.result))) {
      errors.push(error('INVALID_AUTHORED_INPUT', `${requirement.requirement_id} may cite only failed or inconclusive Verify outcomes.`));
    }
    const decisiveEvidence = eligible.filter((outcome) => outcome.candidate_effects.some((effect) =>
      effect.candidate_fault_id === requirement.candidate_fault_id
        && ['SUPPORT', 'CONFIRM'].includes(effect.disposition)));
    const decisiveVerify = eligibleVerify.filter((outcome) => outcome.candidate_effects.some((effect) =>
      effect.candidate_fault_id === requirement.candidate_fault_id
        && ['SUPPORT', 'CONFIRM'].includes(effect.disposition)));
    if (decisiveEvidence.length + decisiveVerify.length < requirement.minimum_citations) {
      errors.push(error('INVALID_AUTHORED_INPUT', `${requirement.requirement_id} cannot meet its minimum decisive citations.`));
    }
  }

  for (const requirement of ticket.repair_requirements) {
    const target = graph.instanceByKey.get(requirement.target_fault_instance_key);
    if (!target || target.fault_id !== requirement.fault_id) {
      errors.push(error('INVALID_AUTHORED_INPUT', `${requirement.requirement_id} does not match its Fault instance.`));
    }
    for (const procedureId of requirement.eligible_repair_procedure_ids) expect(procedureId, ['repair_procedure'], requirement.requirement_id);
    for (const outcomeId of requirement.eligible_repair_outcome_ids) {
      const outcome = repairOutcomes.get(outcomeId);
      if (!outcome || outcome.target_fault_instance_key !== requirement.target_fault_instance_key
        || !requirement.eligible_repair_procedure_ids.includes(outcome.repair_procedure_id)) {
        errors.push(error('INVALID_AUTHORED_INPUT', `${requirement.requirement_id} has an incompatible Repair outcome ${outcomeId}.`));
      }
    }
  }

  const verificationRequirements = new Map();
  for (const requirement of ticket.verification_requirements) {
    if (verificationRequirements.has(requirement.requirement_id)) {
      errors.push(error('INVALID_AUTHORED_INPUT', `Duplicate Verify requirement ${requirement.requirement_id}.`));
    }
    verificationRequirements.set(requirement.requirement_id, requirement);
    expect(requirement.validation_procedure_id, ['validation_procedure'], requirement.requirement_id);
  }
  const verifyKeys = new Set();
  for (const outcome of ticket.authored_verification_outcomes) {
    const requirement = verificationRequirements.get(outcome.requirement_id);
    const validation = expect(outcome.validation_procedure_id, ['validation_procedure'], outcome.outcome_id);
    if (!requirement || requirement.validation_procedure_id !== outcome.validation_procedure_id) {
      errors.push(error('INVALID_AUTHORED_INPUT', `${outcome.outcome_id} does not match its Verify requirement.`));
    }
    const key = `${outcome.validation_procedure_id}\u0000${outcome.requirement_id}\u0000${outcome.eligible_machine_state_key}`;
    if (verifyKeys.has(key)) errors.push(error('INVALID_AUTHORED_INPUT', `${outcome.outcome_id} overlaps another authored Verify outcome.`));
    verifyKeys.add(key);
    for (const id of outcome.revealed_candidate_fault_ids) expect(id, ['fault'], outcome.outcome_id);
    for (const effect of outcome.candidate_effects) {
      if (!publicCandidates.has(effect.candidate_fault_id) && !outcome.revealed_candidate_fault_ids.includes(effect.candidate_fault_id)) {
        errors.push(error('INVALID_AUTHORED_INPUT', `${outcome.outcome_id} affects an unrevealed candidate.`));
      }
      const validationTargets = new Set([
        ...(validation?.validates_fault_ids ?? []),
        ...relatedIds(validation, 'validates_fault'),
      ]);
      if (validation && !validationTargets.has(effect.candidate_fault_id)) {
        errors.push(error('INVALID_AUTHORED_INPUT', `${outcome.outcome_id} maps ${validation.id} to unsupported Fault ${effect.candidate_fault_id}.`));
      }
    }
  }

  const requiredActionables = new Set(ticket.server_only_truth.fault_instances
    .filter((instance) => instance.actionable && instance.required_to_repair)
    .map((instance) => instance.fault_instance_key));
  const closure = ticket.closure_requirements;
  if (!sameSet(requiredActionables, new Set(closure.required_fault_instance_keys))) {
    errors.push(error('INVALID_AUTHORED_INPUT', 'Closure required Fault instances do not equal every required actionable instance.'));
  }
  const closureIsolationIds = new Set(closure.required_isolation_requirement_ids);
  const expectedIsolationIds = new Set(ticket.isolation_requirements
    .filter((requirement) => requiredActionables.has(requirement.target_fault_instance_key))
    .map((requirement) => requirement.requirement_id));
  if (!sameSet(expectedIsolationIds, closureIsolationIds)) {
    errors.push(error('INVALID_AUTHORED_INPUT', 'Closure Isolation list does not equal the accepted Isolation required for every actionable instance.'));
  }
  for (const key of requiredActionables) {
    if (![...isolationById.values()].some((requirement) =>
      requirement.target_fault_instance_key === key && closureIsolationIds.has(requirement.requirement_id))) {
      errors.push(error('INVALID_AUTHORED_INPUT', `Closure lacks the required Isolation for ${key}.`));
    }
  }
  const necessaryRepairs = new Set(ticket.authored_repair_outcomes
    .filter((outcome) => outcome.necessary_for_closure)
    .map((outcome) => outcome.outcome_id));
  if (!sameSet(necessaryRepairs, new Set(closure.required_repair_outcome_ids))) {
    errors.push(error('INVALID_AUTHORED_INPUT', 'Closure Repair list does not equal every authored necessary Repair transition.'));
  }
  for (const key of requiredActionables) {
    if (![...necessaryRepairs].some((outcomeId) =>
      repairOutcomes.get(outcomeId)?.target_fault_instance_key === key)) {
      errors.push(error('INVALID_AUTHORED_INPUT', `Closure lacks a necessary Repair for ${key}.`));
    }
    if (![...necessaryRepairs].some((outcomeId) =>
      repairOutcomes.get(outcomeId)?.resolved_fault_instance_keys.includes(key))) {
      errors.push(error('INVALID_AUTHORED_INPUT', `Closure Repair path never resolves ${key}.`));
    }
  }
  for (const outcomeId of necessaryRepairs) {
    if (!ticket.repair_requirements.some((requirement) =>
      requirement.eligible_repair_outcome_ids.includes(outcomeId))) {
      errors.push(error('INVALID_AUTHORED_INPUT', `Necessary Repair ${outcomeId} is not reachable from a Repair requirement.`));
    }
  }
  if (!sameSet(new Set(verificationRequirements.keys()), new Set(closure.required_verification_requirement_ids))) {
    errors.push(error('INVALID_AUTHORED_INPUT', 'Closure Verify requirements do not equal the authored requirement set.'));
  }
  return errors;
}

function findWitness(ticket, cardById, legalCardIds, graph, domainById) {
  const errors = [];
  const evidenceById = new Map(ticket.authored_evidence_outcomes.map((outcome) => [outcome.outcome_id, outcome]));
  const verificationById = new Map(ticket.authored_verification_outcomes.map((outcome) => [outcome.outcome_id, outcome]));
  const isolationByTarget = new Map(ticket.isolation_requirements.map((requirement) => [requirement.target_fault_instance_key, requirement]));
  const requiredRepairs = new Set(ticket.closure_requirements.required_repair_outcome_ids);
  const requiredPasses = new Set(ticket.closure_requirements.required_verification_requirement_ids);
  const requiredIsolations = new Set(ticket.closure_requirements.required_fault_instance_keys);

  for (const outcome of ticket.authored_evidence_outcomes) {
    const targetFaultId = graph.instanceByKey.get(outcome.target_ref)?.fault_id;
    if (!diagnosticCardSupports(
      cardById,
      legalCardIds,
      outcome.source_definition_id,
      targetFaultId,
      domainById,
    )) {
      errors.push(error('CARD_POOL_UNREACHABLE', `No legal Card executes Evidence source ${outcome.source_definition_id}.`));
    }
  }
  for (const outcome of ticket.authored_repair_outcomes.filter((entry) => entry.necessary_for_closure)) {
    const faultId = graph.instanceByKey.get(outcome.target_fault_instance_key)?.fault_id;
    if (!repairCardSupports(cardById, legalCardIds, outcome.repair_procedure_id, faultId)) {
      errors.push(error('CARD_POOL_UNREACHABLE', `No legal Repair Card reaches ${outcome.repair_procedure_id} for ${faultId}.`));
    }
  }
  for (const requirement of ticket.verification_requirements) {
    if (!supportsDomainDefinition(cardById, legalCardIds, requirement.validation_procedure_id)) {
      errors.push(error('CARD_POOL_UNREACHABLE', `No legal Verify Card executes ${requirement.validation_procedure_id}.`));
    }
  }
  if (errors.length > 0) return { witness: null, errors };

  const initial = {
    machine: ticket.server_only_truth.initial_machine_state_key,
    currentIsolations: new Set(),
    isolationHistory: new Set(),
    repairs: new Set(),
    passes: new Set(),
    verificationHistory: new Set(),
    witness: [],
  };
  const queue = [initial];
  const seen = new Set([stateKey(initial)]);
  while (queue.length > 0) {
    const current = queue.shift();
    if ([...requiredIsolations].every((id) => current.isolationHistory.has(id))
      && [...requiredRepairs].every((id) => current.repairs.has(id))
      && [...requiredPasses].every((id) => current.passes.has(id))) {
      return { witness: current.witness, errors: [] };
    }
    const nextStates = [];

    for (const [targetKey, requirement] of isolationByTarget) {
      if (current.currentIsolations.has(targetKey)) continue;
      const usableEvidence = requirement.eligible_outcome_ids
        .map((id) => evidenceById.get(id))
        .filter((outcome) => outcome?.eligible_machine_state_key === current.machine)
        .filter((outcome) => diagnosticCardSupports(
          cardById,
          legalCardIds,
          outcome.source_definition_id,
          graph.instanceByKey.get(outcome.target_ref)?.fault_id,
          domainById,
        ))
        .filter((outcome) => outcome.candidate_effects.some((effect) =>
          effect.candidate_fault_id === requirement.candidate_fault_id
            && ['SUPPORT', 'CONFIRM'].includes(effect.disposition)));
      const usableVerification = requirement.eligible_verification_outcome_ids
        .filter((outcomeId) => current.verificationHistory.has(outcomeId))
        .map((outcomeId) => verificationById.get(outcomeId))
        .filter((outcome) => outcome && ['FAIL', 'INCONCLUSIVE'].includes(outcome.result))
        .filter((outcome) => outcome.candidate_effects.some((effect) =>
          effect.candidate_fault_id === requirement.candidate_fault_id
            && ['SUPPORT', 'CONFIRM'].includes(effect.disposition)));
      const usable = [
        ...usableEvidence.map((outcome) => ({ kind: 'DIAGNOSTIC', outcome })),
        ...usableVerification.map((outcome) => ({ kind: 'VERIFY', outcome })),
      ];
      if (usable.length >= requirement.minimum_citations) {
        const citations = usable.slice(0, requirement.minimum_citations);
        nextStates.push({
          ...current,
          currentIsolations: new Set([...current.currentIsolations, targetKey]),
          isolationHistory: new Set([...current.isolationHistory, targetKey]),
          witness: [
            ...current.witness,
            ...citations.filter((citation) => citation.kind === 'DIAGNOSTIC').map((citation) => ({
              action: 'RUN_DIAGNOSTIC',
              evidence_outcome_id: citation.outcome.outcome_id,
              source_definition_id: citation.outcome.source_definition_id,
            })),
            {
              action: 'COMMIT_ISOLATION',
              target_fault_instance_key: targetKey,
              cited_outcome_ids: citations.map((citation) => citation.outcome.outcome_id),
            },
          ],
        });
      }
    }

    for (const outcome of ticket.authored_repair_outcomes) {
      if (outcome.eligible_machine_state_key !== current.machine || current.repairs.has(outcome.outcome_id)) continue;
      const target = graph.instanceByKey.get(outcome.target_fault_instance_key);
      const gated = current.currentIsolations.has(outcome.target_fault_instance_key);
      if (!gated || !repairCardSupports(cardById, legalCardIds, outcome.repair_procedure_id, target.fault_id)) continue;
      nextStates.push({
        ...current,
        machine: outcome.resulting_machine_state_key,
        repairs: new Set([...current.repairs, outcome.outcome_id]),
        passes: new Set(),
        witness: [...current.witness, {
          action: 'PERFORM_REPAIR',
          repair_outcome_id: outcome.outcome_id,
          target_fault_instance_key: outcome.target_fault_instance_key,
        }],
      });
    }

    for (const outcome of ticket.authored_verification_outcomes) {
      if (outcome.eligible_machine_state_key !== current.machine
        || !supportsDomainDefinition(cardById, legalCardIds, outcome.validation_procedure_id)) continue;
      const passed = outcome.result === 'PASS';
      nextStates.push({
        ...current,
        machine: outcome.resulting_machine_state_key,
        currentIsolations: passed ? new Set(current.currentIsolations) : new Set(),
        passes: passed ? new Set([...current.passes, outcome.requirement_id]) : new Set(),
        verificationHistory: new Set([...current.verificationHistory, outcome.outcome_id]),
        witness: [...current.witness, {
          action: 'PERFORM_VERIFY',
          verification_outcome_id: outcome.outcome_id,
          result: outcome.result,
        }],
      });
    }

    for (const next of nextStates) {
      const key = stateKey(next);
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push(next);
    }
    if (seen.size > 20_000) {
      return {
        witness: null,
        errors: [error('INVALID_AUTHORED_INPUT', 'The authored Ticket state graph exceeds the deterministic solvability bound.')],
      };
    }
  }
  return { witness: null, errors: [error('CARD_POOL_UNREACHABLE', 'No complete legal authored path reaches closure.')] };
}

export function validateTicketSolvability(ticket, {
  domainCatalog,
  cardCatalog,
  legalCardDefinitionIds,
}) {
  const domainById = new Map(domainEntities(domainCatalog).map((entity) => [entity.id, entity]));
  const cardById = new Map(cards(cardCatalog).map((card) => [card.id, card]));
  const legalCardIds = [...legalCardDefinitionIds].sort();
  const errors = [];
  for (const cardId of legalCardIds) {
    if (!cardById.has(cardId)) errors.push(error('REFERENCE_NOT_FOUND', `Legal card pool references missing ${cardId}.`));
  }
  const graph = analyzeTicketCausalGraph(ticket);
  errors.push(...graph.errors);
  if (graph.valid) errors.push(...validateTicketReferences(ticket, domainById, graph));
  let witness = null;
  if (errors.length === 0) {
    const result = findWitness(ticket, cardById, legalCardIds, graph, domainById);
    errors.push(...result.errors);
    witness = result.witness;
  }
  return {
    valid: errors.length === 0,
    errors,
    witness,
    metrics: graph.metrics,
    causalFingerprint: graph.causalFingerprint,
  };
}
