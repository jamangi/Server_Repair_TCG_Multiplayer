import { canonicalJson, sha256 } from '../builder/canonical.mjs';

const PLANE_ORDER = Object.freeze([
  'power',
  'management',
  'host_firmware_post',
  'memory',
  'storage',
  'network',
  'os_handoff',
  'runtime_service',
]);

const RELATION_FAMILY = Object.freeze({
  CONTAINS: 'STRUCTURE',
  MOUNTS: 'STRUCTURE',
  REALIZES_ROLE: 'STRUCTURE',
  SERVICE_UNIT_FOR: 'STRUCTURE',
  OPTION_MEMBER_OF: 'STRUCTURE',
  DELIVERS_STANDBY_POWER_TO: 'POWER',
  DELIVERS_SWITCHED_POWER_TO: 'POWER',
  RETURNS_POWER_GOOD_TO: 'POWER',
  COOLS: 'COOLING',
  EXHAUSTS_THROUGH: 'COOLING',
  DATA_LINK_TO: 'DATA',
  CONTROL_LINK_TO: 'CONTROL',
  MANAGES: 'CONTROL',
  BOOT_SOURCE_FOR: 'CONTROL',
  HANDOFF_TO: 'LIFECYCLE',
  ENABLES: 'LIFECYCLE',
  OBSERVES: 'OBSERVATION',
  REPORTS_INVENTORY_FOR: 'OBSERVATION',
  EMITS_STATUS_AT: 'OBSERVATION',
  MEASURES_PATH: 'OBSERVATION',
  MEMBER_OF: 'LOGICAL',
  REDUNDANCY_PEER_OF: 'LOGICAL',
  BACKED_BY: 'LOGICAL',
  EXPOSES_AS: 'LOGICAL',
  ACCESSED_THROUGH: 'SERVICE',
  REQUIRES_DEENERGIZATION_BEFORE: 'SERVICE',
  REQUIRES_PROTOCOL: 'SERVICE',
});

const LINE_PATTERN = Object.freeze({
  STRUCTURE: 'SOLID',
  POWER: 'DOUBLE',
  COOLING: 'DOTTED',
  DATA: 'DASHED',
  CONTROL: 'DASH_DOT',
  LIFECYCLE: 'LONG_DASH',
  OBSERVATION: 'DOTTED',
  LOGICAL: 'SHORT_DASH',
  SERVICE: 'DOUBLE_DASH',
});

const ATTACHMENT_VERB = Object.freeze({
  OBSERVES_COMPONENT_PATH: 'observes',
  QUERIES_CONTROL_SURFACE: 'queries',
  INTERVENES_ON_SERVICE_UNIT: 'intervenes on',
  VERIFIES_STATE: 'checks',
});

const FORBIDDEN_PUBLIC_KEYS = Object.freeze([
  'authored_evidence_outcomes',
  'authored_result_reference',
  'compatibility_proofs',
  'evidence_disposition',
  'hidden_fault_ids',
  'hidden_true_fault_ids',
  'isolation_eligibility',
  'legal_intent',
  'repair_outcome_id',
  'server_only_truth',
  'solution_id',
  'synthetic_hidden_fault_ids',
  'validation_result',
  'verification_outcome_id',
]);

function withSerialization(value) {
  return {
    ...value,
    serialization: {
      canonicalization_version: 'canonical-json-v1',
      digest_algorithm: 'sha256',
      content_digest: sha256(canonicalJson(value)),
    },
  };
}

function unique(values) {
  return [...new Set(values)];
}

function byOrderKey(left, right) {
  return left.order_key - right.order_key || left.stage_id.localeCompare(right.stage_id);
}

function tokenMap(tokens) {
  return new Map(tokens.map(({ token, value }) => [token, value]));
}

function renderTemplate(template, tokens) {
  const values = tokenMap(tokens);
  return template.replace(/\{([A-Z][A-Z0-9_]*)\}/g, (_, token) => {
    if (!values.has(token)) throw new Error(`Missing public template token ${token}.`);
    return values.get(token);
  });
}

function qualifyClause(clause, stage, optionalStageIds) {
  if (clause.clause_kind === 'NOT_APPLICABLE') return 'NOT_APPLICABLE';
  const optional = optionalStageIds.has(stage.stage_id);
  const conditional = ['WHEN_OPTION', 'UNLESS_OPTION'].includes(clause.clause_kind)
    || ['CONDITIONAL', 'SERVICE_CONDITIONAL'].includes(stage.stage_mode);
  if (optional && conditional) return 'OPTIONAL_CONDITIONAL';
  if (optional) return 'OPTIONAL';
  if (conditional) return 'CONDITIONAL';
  if (clause.clause_kind === 'PARALLEL' || stage.stage_mode === 'PARALLEL') return 'PARALLEL';
  return 'REQUIRED';
}

function prefixLifecycleText(applicability, text, condition) {
  const normalized = text.replace(/\.$/u, '');
  if (applicability === 'PARALLEL') return `In parallel: ${normalized}.`;
  if (applicability === 'OPTIONAL') return `Optional: ${normalized}.`;
  if (applicability === 'CONDITIONAL') return `When applicable${condition ? ` (${condition})` : ''}: ${normalized}.`;
  if (applicability === 'OPTIONAL_CONDITIONAL') return `Optional when applicable${condition ? ` (${condition})` : ''}: ${normalized}.`;
  if (applicability === 'NOT_APPLICABLE') return `Not applicable: ${normalized}.`;
  return `Required: ${normalized}.`;
}

function buildLifecycle(profile, templatesById) {
  const stageById = new Map(profile.lifecycle_stages.map((stage) => [stage.stage_id, stage]));
  const optionalStageIds = new Set(profile.lifecycle_relations
    .filter((relation) => ['OPTIONAL_AFTER'].includes(relation.relation_type))
    .map((relation) => relation.to_stage_id));
  const entries = profile.description_program.sections.flatMap((section) => section.clauses.map((clause) => {
    const stage = stageById.get(clause.stage_id);
    const template = templatesById.get(clause.template_id);
    if (!stage || !template) throw new Error(`Unrenderable lifecycle clause ${clause.clause_id}.`);
    const applicability = qualifyClause(clause, stage, optionalStageIds);
    const rendered = renderTemplate(template.template, clause.tokens);
    return {
      clause_id: clause.clause_id,
      section_id: section.section_id,
      section_heading: section.heading,
      stage_id: stage.stage_id,
      order_key: stage.order_key,
      applicability,
      condition: stage.condition,
      text: prefixLifecycleText(applicability, rendered, stage.condition),
      source_claim_ids: [...clause.source_claim_ids],
    };
  })).sort(byOrderKey);
  const applicabilityKinds = ['REQUIRED', 'OPTIONAL', 'CONDITIONAL', 'OPTIONAL_CONDITIONAL', 'PARALLEL', 'NOT_APPLICABLE'];
  return {
    heading: profile.description_program.sections.map((section) => section.heading).join(' / '),
    entries,
    relations: profile.lifecycle_relations.map((relation) => ({ ...relation })),
    applicability_summary: Object.fromEntries(applicabilityKinds.map((applicability) => [
      applicability.toLowerCase(),
      entries.filter((entry) => entry.applicability === applicability).length,
    ])),
    not_applicable_note: entries.some((entry) => entry.applicability === 'NOT_APPLICABLE')
      ? 'Every not-applicable stage is stated explicitly.'
      : 'No lifecycle stage is declared not applicable for this profile.',
  };
}

function buildLayout(profile) {
  const counts = new Map();
  return new Map(profile.topology_nodes.map((node) => {
    const planeIndex = Math.max(0, PLANE_ORDER.indexOf(node.plane));
    const row = counts.get(node.plane) ?? 0;
    counts.set(node.plane, row + 1);
    return [node.node_id, {
      x: 42 + planeIndex * 190,
      y: 52 + row * 104,
      width: 152,
      height: 66,
      reading_order: profile.topology_nodes.findIndex((candidate) => candidate.node_id === node.node_id) + 1,
    }];
  }));
}

function buildDiagram(profile, binding) {
  const layout = buildLayout(profile);
  const nodeById = new Map(profile.topology_nodes.map((node) => [node.node_id, node]));
  const nodes = profile.topology_nodes.map((node) => ({
    ...node,
    layout: layout.get(node.node_id),
  }));
  const edges = profile.topology_edges.map((edge) => {
    const relationFamily = RELATION_FAMILY[edge.relation_type] ?? 'STRUCTURE';
    return {
      ...edge,
      relation_family: relationFamily,
      line_pattern: LINE_PATTERN[relationFamily],
    };
  });
  const paths = profile.paths.map((modelPath) => ({
    ...modelPath,
    ordered_labels: modelPath.node_ids.map((nodeId) => nodeById.get(nodeId)?.label ?? nodeId),
  }));
  const orderedNodeSentences = nodes.map((node, index) =>
    `${index + 1}. ${node.label} is a ${node.node_kind.toLowerCase().replaceAll('_', ' ')} in the ${node.plane.replaceAll('_', ' ')} plane.`);
  const orderedEdgeSentences = edges.map((edge) =>
    `${nodeById.get(edge.from_node_id).label} ${edge.label} (${edge.relation_type.toLowerCase().replaceAll('_', ' ')}) ${nodeById.get(edge.to_node_id).label}.`);
  const orderedPathSentences = paths.map((modelPath) =>
    `${modelPath.flow_kind.toLowerCase()} path ${modelPath.path_id}: ${modelPath.ordered_labels.join(' → ')}.`);
  const abstractionSentences = profile.public_abstractions.map((abstraction) => abstraction.label);
  const scopeStatement = `${profile.identity.manufacturer} ${profile.identity.family}; ${profile.identity.model_scope}. Geometry is explanatory, and no current health or cause is shown.`;
  const summary = [
    scopeStatement,
    ...orderedNodeSentences,
    ...orderedEdgeSentences,
    ...orderedPathSentences,
    ...abstractionSentences,
  ].join(' ');
  return {
    title: `Public-safe system context for ${binding.ticket_focus_statement}`,
    scope_statement: scopeStatement,
    canvas: {
      width: 42 + PLANE_ORDER.length * 190,
      height: 52 + Math.max(...[...layout.values()].map((item) => item.y)) + 100,
      plane_order: [...PLANE_ORDER],
    },
    legend: Object.entries(LINE_PATTERN).map(([relation_family, line_pattern]) => ({ relation_family, line_pattern })),
    nodes,
    edges,
    paths,
    text_equivalent: {
      full_text: summary,
      ordered_node_sentences: orderedNodeSentences,
      ordered_edge_sentences: orderedEdgeSentences,
      ordered_path_sentences: orderedPathSentences,
      abstraction_sentences: abstractionSentences,
    },
  };
}

function multiplicityText(multiplicity) {
  const maximum = multiplicity.maximum === null ? 'unbounded' : multiplicity.maximum;
  return `${multiplicity.minimum}–${maximum} ${multiplicity.unit.replaceAll('_', ' ')}`;
}

function buildInventory(profile) {
  return profile.role_instances.map((role) => ({
    role_id: role.role_id,
    label: role.label,
    purpose: role.purpose,
    component_definition_id: role.component_definition_id,
    multiplicity: multiplicityText(role.multiplicity),
    optionality: role.optionality,
    replaceability: role.replaceability,
    serviceability_note: role.serviceability_note,
    planes: unique(profile.topology_nodes
      .filter((node) => node.role_ids.includes(role.role_id))
      .map((node) => node.plane)),
    source_claim_ids: [...role.source_claim_ids],
  }));
}

function actionLabel(attachment) {
  return tokenMap(attachment.rationale_tokens).get('ACTION_LABEL') ?? attachment.action_definition_id;
}

function buildRationaleGraph(attachment, profile, templatesById) {
  const nodeById = new Map(profile.topology_nodes.map((node) => [node.node_id, node]));
  const pathById = new Map(profile.paths.map((modelPath) => [modelPath.path_id, modelPath]));
  const template = templatesById.get(attachment.rationale_template_id);
  if (!template) throw new Error(`Unrenderable rationale ${attachment.attachment_id}.`);
  const graphNodes = [{
    graph_node_id: `graph.action.${attachment.attachment_id}`,
    kind: 'ACTION',
    label: actionLabel(attachment),
    semantic_ref: attachment.action_definition_id,
  }];
  for (const nodeId of attachment.target_node_ids) graphNodes.push({
    graph_node_id: `graph.target.${attachment.attachment_id}.${nodeId}`,
    kind: 'TOPOLOGY_NODE',
    label: nodeById.get(nodeId)?.label ?? nodeId,
    semantic_ref: nodeId,
  });
  for (const pathId of attachment.target_path_ids) graphNodes.push({
    graph_node_id: `graph.path.${attachment.attachment_id}.${pathId}`,
    kind: 'PATH',
    label: pathId,
    semantic_ref: pathId,
  });
  const graphEdges = attachment.target_node_ids.map((nodeId) => ({
    from_graph_node_id: `graph.action.${attachment.attachment_id}`,
    to_graph_node_id: `graph.target.${attachment.attachment_id}.${nodeId}`,
    relation: ATTACHMENT_VERB[attachment.attachment_kind],
  }));
  for (const pathId of attachment.target_path_ids) {
    const modelPath = pathById.get(pathId);
    const connectedTargets = attachment.target_node_ids.filter((nodeId) => modelPath?.node_ids.includes(nodeId));
    for (const nodeId of connectedTargets) graphEdges.push({
      from_graph_node_id: `graph.target.${attachment.attachment_id}.${nodeId}`,
      to_graph_node_id: `graph.path.${attachment.attachment_id}.${pathId}`,
      relation: 'participates in',
    });
  }
  return {
    attachment_id: attachment.attachment_id,
    action_definition_id: attachment.action_definition_id,
    action_kind: attachment.action_kind,
    relevance_label: 'Relevant to this system profile',
    legality_label: 'Legal now is evaluated separately by the authoritative Match engine.',
    sentence: renderTemplate(template.template, attachment.rationale_tokens),
    graph_nodes: graphNodes,
    graph_edges: graphEdges,
    target_node_ids: [...attachment.target_node_ids],
    target_path_ids: [...attachment.target_path_ids],
    relevant_stage_ids: [...attachment.relevant_stage_ids],
    source_claim_ids: [...attachment.source_claim_ids],
  };
}

function collectPublicSafetyIssues(value, path = [], issues = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectPublicSafetyIssues(item, [...path, index], issues));
    return issues;
  }
  if (!value || typeof value !== 'object') {
    if (typeof value === 'string' && /\b(?:evidence|repair_outcome|verify_outcome|fault_instance|solution)\.[a-z0-9._-]+/iu.test(value)) {
      issues.push(`${path.join('.')} exposes a private authoring identifier`);
    }
    return issues;
  }
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_PUBLIC_KEYS.includes(key)) issues.push(`${[...path, key].join('.')} is forbidden in a public projection`);
    collectPublicSafetyIssues(child, [...path, key], issues);
  }
  return issues;
}

export function buildPublicSystemProjection({ profile, binding, activeCandidateFaultIds, templates }) {
  const templatesById = new Map(templates.map((template) => [template.template_id, template]));
  const activeSet = new Set(activeCandidateFaultIds);
  const candidateClosure = binding.candidate_closure
    .filter((entry) => activeSet.has(entry.candidate_fault_id))
    .map((entry) => ({ ...entry }));
  const lifecycle = buildLifecycle(profile, templatesById);
  const diagram = buildDiagram(profile, binding);
  const componentInventory = buildInventory(profile);
  const rationaleGraphs = profile.action_attachments.map((attachment) =>
    buildRationaleGraph(attachment, profile, templatesById));
  const semanticCore = {
    model_ref: {
      profile_id: profile.profile_id,
      profile_revision: profile.profile_revision,
      profile_content_digest: profile.serialization.content_digest,
    },
    lifecycle,
    diagram,
    component_inventory: componentInventory,
    rationale_graphs: rationaleGraphs,
  };
  const value = {
    schema_version: 'system-model-public-projection-v1',
    projection_id: `projection.${binding.binding_id}.v1`,
    ticket_context: {
      ticket_id: binding.ticket_id,
      ticket_snapshot_digest: binding.ticket_snapshot_digest,
      fingerprint_id: binding.fingerprint_id,
      binding_id: binding.binding_id,
      resolver_key: binding.public_resolver_key,
      public_symptom_ids: [...binding.public_surface.public_symptom_ids],
      initial_candidate_fault_ids: [...binding.public_surface.public_candidate_fault_ids],
      active_candidate_fault_ids: [...activeCandidateFaultIds],
    },
    model_ref: semanticCore.model_ref,
    scope: {
      display_name: `${profile.identity.manufacturer} ${profile.identity.family}`,
      model_scope: profile.identity.model_scope,
      generation_or_era: profile.identity.generation_or_era,
      exactness_class: profile.identity.exactness_class,
      option_statements: profile.option_constraints.map((constraint) => ({
        constraint_id: constraint.constraint_id,
        statement: constraint.statement,
        source_claim_ids: [...constraint.source_claim_ids],
      })),
      plane_statements: profile.plane_declarations.map((plane) => ({ ...plane })),
      abstraction_statements: profile.public_abstractions.map((abstraction) => ({ ...abstraction })),
    },
    lifecycle,
    diagram,
    component_inventory: componentInventory,
    rationale_graphs: rationaleGraphs,
    candidate_closure: candidateClosure,
    source_claim_ids: [...profile.provenance.source_claim_ids],
    semantic_index: {
      role_ids: profile.role_instances.map((item) => item.role_id),
      node_ids: profile.topology_nodes.map((item) => item.node_id),
      edge_ids: profile.topology_edges.map((item) => item.edge_id),
      path_ids: profile.paths.map((item) => item.path_id),
      stage_ids: profile.lifecycle_stages.map((item) => item.stage_id),
      capability_ids: profile.finder_capabilities.map((item) => item.capability_id),
      attachment_ids: profile.action_attachments.map((item) => item.attachment_id),
    },
    semantic_model_digest: sha256(canonicalJson(semanticCore)),
    authority_boundary: {
      system_relevance: 'The rationale explains why an action can matter for this system profile.',
      legal_now: 'Only the authoritative Match engine decides whether an action is legal now.',
      gameplay_effect: 'NONE',
    },
  };
  const safetyIssues = collectPublicSafetyIssues(value).sort();
  if (safetyIssues.length > 0) throw new Error(`Public projection rejected: ${safetyIssues.join('; ')}`);
  return withSerialization(value);
}

export function validateProjectionReferences(projection, profile) {
  const issues = [];
  const known = {
    role: new Set(profile.role_instances.map((item) => item.role_id)),
    node: new Set(profile.topology_nodes.map((item) => item.node_id)),
    edge: new Set(profile.topology_edges.map((item) => item.edge_id)),
    path: new Set(profile.paths.map((item) => item.path_id)),
    stage: new Set(profile.lifecycle_stages.map((item) => item.stage_id)),
    attachment: new Set(profile.action_attachments.map((item) => item.attachment_id)),
  };
  const assertKnown = (values, set, context) => values.forEach((value) => {
    if (!set.has(value)) issues.push(`${context} references missing ${value}`);
  });
  assertKnown(projection.semantic_index.role_ids, known.role, 'semantic role index');
  assertKnown(projection.semantic_index.node_ids, known.node, 'semantic node index');
  assertKnown(projection.semantic_index.edge_ids, known.edge, 'semantic edge index');
  assertKnown(projection.semantic_index.path_ids, known.path, 'semantic path index');
  assertKnown(projection.semantic_index.stage_ids, known.stage, 'semantic stage index');
  assertKnown(projection.semantic_index.attachment_ids, known.attachment, 'semantic attachment index');
  assertKnown(projection.diagram.nodes.map((item) => item.node_id), known.node, 'diagram nodes');
  assertKnown(projection.diagram.edges.map((item) => item.edge_id), known.edge, 'diagram edges');
  assertKnown(projection.diagram.paths.map((item) => item.path_id), known.path, 'diagram paths');
  assertKnown(projection.lifecycle.entries.map((item) => item.stage_id), known.stage, 'lifecycle entries');
  for (const item of projection.component_inventory) assertKnown([item.role_id], known.role, `inventory ${item.role_id}`);
  for (const graph of projection.rationale_graphs) {
    assertKnown([graph.attachment_id], known.attachment, `rationale ${graph.attachment_id}`);
    assertKnown(graph.target_node_ids, known.node, `rationale ${graph.attachment_id} nodes`);
    assertKnown(graph.target_path_ids, known.path, `rationale ${graph.attachment_id} paths`);
    assertKnown(graph.relevant_stage_ids, known.stage, `rationale ${graph.attachment_id} stages`);
  }
  return [...new Set(issues)].sort();
}

export function publicProjectionSafetyIssues(projection) {
  return [...new Set(collectPublicSafetyIssues(projection))].sort();
}
