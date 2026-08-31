import { sha256Hex } from '../../generated/play/src/shared/sha256.mjs';

const STABLE_ID = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/u;
const DIGEST = /^[a-f0-9]{64}$/u;
const RELATION_TYPE = /^[A-Z][A-Z0-9_]+$/u;
const PLANES = Object.freeze([
  'power',
  'management',
  'host_firmware_post',
  'memory',
  'storage',
  'network',
  'os_handoff',
  'runtime_service',
]);
const ACTION_KINDS = Object.freeze(['TEST', 'COMMAND', 'REPAIR', 'VERIFICATION']);
const NODE_KINDS = new Set([
  'COMPONENT_INSTANCE',
  'SERVICEABLE_UNIT',
  'CONTROL_SURFACE',
  'OBSERVATION_POINT',
  'LOGICAL_GROUP',
  'BUS_OR_LINK',
  'PUBLIC_ABSTRACTION',
]);
const APPLICABILITY = new Set([
  'REQUIRED',
  'OPTIONAL',
  'CONDITIONAL',
  'OPTIONAL_CONDITIONAL',
  'PARALLEL',
  'NOT_APPLICABLE',
]);
const LIFECYCLE_RELATIONS = new Set([
  'PRECEDES',
  'REQUIRES',
  'ENABLES',
  'PARALLEL_WITH',
  'OPTIONAL_AFTER',
  'HANDOFF_TO',
]);
const RELATION_FAMILIES = new Set([
  'STRUCTURE',
  'POWER',
  'COOLING',
  'DATA',
  'CONTROL',
  'LIFECYCLE',
  'OBSERVATION',
  'LOGICAL',
  'SERVICE',
]);
const LINE_PATTERNS = new Set([
  'SOLID',
  'DOUBLE',
  'DOTTED',
  'DASHED',
  'DASH_DOT',
  'LONG_DASH',
  'SHORT_DASH',
  'DOUBLE_DASH',
]);
const FLOW_KINDS = new Set(['POWER', 'DATA', 'CONTROL', 'OBSERVATION', 'LIFECYCLE', 'COOLING']);
const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
const MAX_STRING_LENGTH = 32_768;
const MAX_DEPTH = 48;
const MAX_COLLECTION_LENGTH = 2_048;

function invalid() {
  throw new Error('System Model projection content is incompatible.');
}

function assertSafeJsonGraph(value, seen = new WeakSet(), depth = 0) {
  if (depth > MAX_DEPTH) invalid();
  if (value === null || typeof value === 'boolean') return;
  if (typeof value === 'string') {
    if (value.length > MAX_STRING_LENGTH || value.includes('\u0000') || /\bfingerprint\./iu.test(value)) invalid();
    return;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) invalid();
    return;
  }
  if (!value || typeof value !== 'object' || seen.has(value)) invalid();
  seen.add(value);
  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype || value.length > MAX_COLLECTION_LENGTH) invalid();
    const expectedKeys = new Set(['length', ...Array.from({ length: value.length }, (_, index) => String(index))]);
    const ownKeys = Reflect.ownKeys(value);
    if (ownKeys.some((key) => typeof key !== 'string' || !expectedKeys.has(key))
        || ownKeys.length !== expectedKeys.size) invalid();
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (!descriptor || !Object.hasOwn(descriptor, 'value')) invalid();
      assertSafeJsonGraph(descriptor.value, seen, depth + 1);
    }
    return;
  }
  if (Object.getPrototypeOf(value) !== Object.prototype) invalid();
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.length > 128 || ownKeys.some((key) => typeof key !== 'string' || DANGEROUS_KEYS.has(key))) invalid();
  for (const key of ownKeys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !Object.hasOwn(descriptor, 'value') || !descriptor.enumerable) invalid();
    assertSafeJsonGraph(descriptor.value, seen, depth + 1);
  }
}

function exactObject(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid();
  const actual = Object.keys(value);
  if (actual.length !== keys.length || keys.some((key) => !Object.hasOwn(value, key))) invalid();
  return value;
}

function arrayOf(value, minimum, maximum, validateItem) {
  if (!Array.isArray(value) || value.length < minimum || value.length > maximum) invalid();
  value.forEach(validateItem);
  return value;
}

function stringValue(value, { minimum = 1, maximum = MAX_STRING_LENGTH } = {}) {
  if (typeof value !== 'string' || value.length < minimum || value.length > maximum) invalid();
  return value;
}

function stableId(value) {
  if (typeof value !== 'string' || value.length > 256 || !STABLE_ID.test(value)) invalid();
  return value;
}

function digest(value) {
  if (typeof value !== 'string' || !DIGEST.test(value)) invalid();
  return value;
}

function finiteNumber(value, { minimum = -Infinity, exclusiveMinimum = false, maximum = 100_000 } = {}) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value > maximum
      || (exclusiveMinimum ? value <= minimum : value < minimum)) invalid();
  return value;
}

function integer(value, minimum = 0, maximum = 100_000) {
  if (!Number.isInteger(value) || value < minimum || value > maximum) invalid();
  return value;
}

function enumValue(value, allowed) {
  if (!allowed.has(value)) invalid();
  return value;
}

function unique(values, select = (value) => value) {
  const keys = values.map(select);
  if (new Set(keys).size !== keys.length) invalid();
  return values;
}

function idArray(value, minimum = 0, maximum = 512) {
  return unique(arrayOf(value, minimum, maximum, stableId));
}

function stringArray(value, minimum = 0, maximum = 512) {
  return unique(arrayOf(value, minimum, maximum, (item) => stringValue(item)));
}

function serialization(value) {
  exactObject(value, ['canonicalization_version', 'digest_algorithm', 'content_digest']);
  if (value.canonicalization_version !== 'canonical-json-v1' || value.digest_algorithm !== 'sha256') invalid();
  digest(value.content_digest);
}

function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, normalize(value[key])]));
  }
  return value;
}

function canonicalJson(value) {
  return JSON.stringify(normalize(value));
}

function derivedDigest(value) {
  return sha256Hex(canonicalJson(value));
}

function withoutSerialization(value) {
  const copy = { ...value };
  delete copy.serialization;
  return copy;
}

function validateClaims(value) {
  idArray(value, 1, 256);
}

function validateProfileIdentity(profile) {
  exactObject(profile, [
    'profile_id',
    'profile_revision',
    'profile_content_digest',
    'display_name',
    'model_scope',
    'generation_or_era',
    'exactness_class',
    'option_statements',
    'plane_statements',
    'abstraction_statements',
  ]);
  stableId(profile.profile_id);
  integer(profile.profile_revision, 1);
  digest(profile.profile_content_digest);
  stringValue(profile.display_name);
  stringValue(profile.model_scope);
  stringValue(profile.generation_or_era);
  enumValue(profile.exactness_class, new Set(['EXACT', 'GENERALIZED', 'MIXED']));
  unique(arrayOf(profile.option_statements, 1, 128, (statement) => {
    exactObject(statement, ['constraint_id', 'statement', 'source_claim_ids']);
    stableId(statement.constraint_id);
    stringValue(statement.statement);
    validateClaims(statement.source_claim_ids);
  }), (statement) => statement.constraint_id);
  const planeStatements = unique(arrayOf(profile.plane_statements, 8, 8, (statement) => {
    exactObject(statement, ['plane', 'status', 'summary', 'source_claim_ids']);
    enumValue(statement.plane, new Set(PLANES));
    enumValue(statement.status, new Set(['PRESENT', 'NOT_APPLICABLE', 'OUT_OF_SCOPE_WITH_REASON']));
    stringValue(statement.summary);
    validateClaims(statement.source_claim_ids);
  }), (statement) => statement.plane);
  if (planeStatements.some((statement, index) => statement.plane !== PLANES[index])) invalid();
  unique(arrayOf(profile.abstraction_statements, 1, 128, (statement) => {
    exactObject(statement, ['abstraction_id', 'label', 'represented_node_ids', 'source_claim_ids']);
    stableId(statement.abstraction_id);
    stringValue(statement.label);
    idArray(statement.represented_node_ids, 0, 256);
    validateClaims(statement.source_claim_ids);
  }), (statement) => statement.abstraction_id);
}

function validateDescriptions(descriptions) {
  exactObject(descriptions, ['concise', 'extended']);
  stringValue(descriptions.concise);
  stringValue(descriptions.extended);
}

function validateLifecycle(lifecycle) {
  exactObject(lifecycle, ['heading', 'entries', 'relations', 'applicability_summary', 'not_applicable_note']);
  stringValue(lifecycle.heading);
  const entries = unique(arrayOf(lifecycle.entries, 1, 128, (entry) => {
    exactObject(entry, [
      'clause_id',
      'section_id',
      'section_heading',
      'stage_id',
      'order_key',
      'applicability',
      'condition',
      'text',
      'source_claim_ids',
    ]);
    stableId(entry.clause_id);
    stableId(entry.section_id);
    stringValue(entry.section_heading);
    stableId(entry.stage_id);
    integer(entry.order_key);
    enumValue(entry.applicability, APPLICABILITY);
    if (entry.condition !== null) stringValue(entry.condition, { minimum: 0 });
    stringValue(entry.text);
    validateClaims(entry.source_claim_ids);
  }), (entry) => entry.stage_id);
  unique(entries, (entry) => entry.order_key);
  const stageIds = new Set(entries.map((entry) => entry.stage_id));
  unique(arrayOf(lifecycle.relations, 1, 512, (relation) => {
    exactObject(relation, ['relation_id', 'from_stage_id', 'to_stage_id', 'relation_type', 'source_claim_ids']);
    stableId(relation.relation_id);
    stableId(relation.from_stage_id);
    stableId(relation.to_stage_id);
    enumValue(relation.relation_type, LIFECYCLE_RELATIONS);
    validateClaims(relation.source_claim_ids);
    if (!stageIds.has(relation.from_stage_id) || !stageIds.has(relation.to_stage_id)) invalid();
  }), (relation) => relation.relation_id);
  exactObject(lifecycle.applicability_summary, [
    'required',
    'optional',
    'conditional',
    'optional_conditional',
    'parallel',
    'not_applicable',
  ]);
  const summaryKeys = {
    REQUIRED: 'required',
    OPTIONAL: 'optional',
    CONDITIONAL: 'conditional',
    OPTIONAL_CONDITIONAL: 'optional_conditional',
    PARALLEL: 'parallel',
    NOT_APPLICABLE: 'not_applicable',
  };
  for (const key of Object.values(summaryKeys)) integer(lifecycle.applicability_summary[key]);
  for (const [applicability, key] of Object.entries(summaryKeys)) {
    if (lifecycle.applicability_summary[key] !== entries.filter((entry) => entry.applicability === applicability).length) invalid();
  }
  stringValue(lifecycle.not_applicable_note);
  return stageIds;
}

function validateTopology(topology, stageIds) {
  exactObject(topology, ['title', 'scope_statement', 'canvas', 'legend', 'nodes', 'edges', 'paths', 'text_equivalent']);
  stringValue(topology.title);
  stringValue(topology.scope_statement);
  exactObject(topology.canvas, ['width', 'height', 'plane_order']);
  finiteNumber(topology.canvas.width, { minimum: 0, exclusiveMinimum: true });
  finiteNumber(topology.canvas.height, { minimum: 0, exclusiveMinimum: true });
  const planeOrder = stringArray(topology.canvas.plane_order, 8, 8);
  if (planeOrder.some((plane, index) => plane !== PLANES[index])) invalid();
  const legend = unique(arrayOf(topology.legend, 1, RELATION_FAMILIES.size, (entry) => {
    exactObject(entry, ['relation_family', 'line_pattern']);
    enumValue(entry.relation_family, RELATION_FAMILIES);
    enumValue(entry.line_pattern, LINE_PATTERNS);
  }), (entry) => entry.relation_family);
  const legendByFamily = new Map(legend.map((entry) => [entry.relation_family, entry.line_pattern]));
  const nodes = unique(arrayOf(topology.nodes, 1, 256, (node) => {
    exactObject(node, ['label', 'node_id', 'node_kind', 'plane', 'public_visibility', 'role_ids', 'source_claim_ids', 'layout']);
    stringValue(node.label);
    stableId(node.node_id);
    enumValue(node.node_kind, NODE_KINDS);
    enumValue(node.plane, new Set(PLANES));
    if (node.public_visibility !== 'PUBLIC') invalid();
    idArray(node.role_ids, 0, 128);
    validateClaims(node.source_claim_ids);
    exactObject(node.layout, ['x', 'y', 'width', 'height', 'reading_order']);
    finiteNumber(node.layout.x, { minimum: 0 });
    finiteNumber(node.layout.y, { minimum: 0 });
    finiteNumber(node.layout.width, { minimum: 0, exclusiveMinimum: true });
    finiteNumber(node.layout.height, { minimum: 0, exclusiveMinimum: true });
    integer(node.layout.reading_order, 1);
    if (node.layout.x + node.layout.width > topology.canvas.width
        || node.layout.y + node.layout.height > topology.canvas.height) invalid();
  }), (node) => node.node_id);
  const readingOrder = nodes.map((node) => node.layout.reading_order).sort((left, right) => left - right);
  if (readingOrder.some((order, index) => order !== index + 1)) invalid();
  const nodeIds = new Set(nodes.map((node) => node.node_id));
  const edges = unique(arrayOf(topology.edges, 1, 1_024, (edge) => {
    exactObject(edge, [
      'cardinality',
      'direction',
      'edge_id',
      'from_node_id',
      'label',
      'lifecycle_stage_ids',
      'public_visibility',
      'relation_type',
      'source_claim_ids',
      'to_node_id',
      'relation_family',
      'line_pattern',
    ]);
    enumValue(edge.cardinality, new Set(['ONE_TO_ONE', 'ONE_TO_MANY', 'MANY_TO_ONE', 'MANY_TO_MANY']));
    enumValue(edge.direction, new Set(['DIRECTED', 'UNDIRECTED']));
    stableId(edge.edge_id);
    stableId(edge.from_node_id);
    stringValue(edge.label);
    idArray(edge.lifecycle_stage_ids, 0, 128);
    if (edge.public_visibility !== 'PUBLIC' || !RELATION_TYPE.test(edge.relation_type)) invalid();
    validateClaims(edge.source_claim_ids);
    stableId(edge.to_node_id);
    enumValue(edge.relation_family, RELATION_FAMILIES);
    enumValue(edge.line_pattern, LINE_PATTERNS);
    if (!nodeIds.has(edge.from_node_id) || !nodeIds.has(edge.to_node_id)
        || !edge.lifecycle_stage_ids.every((id) => stageIds.has(id))
        || legendByFamily.get(edge.relation_family) !== edge.line_pattern) invalid();
  }), (edge) => edge.edge_id);
  const edgeIds = new Set(edges.map((edge) => edge.edge_id));
  const paths = unique(arrayOf(topology.paths, 1, 256, (modelPath) => {
    exactObject(modelPath, [
      'edge_ids',
      'end_node_id',
      'flow_kind',
      'lifecycle_stage_ids',
      'node_ids',
      'path_id',
      'public_visibility',
      'source_claim_ids',
      'start_node_id',
      'ordered_labels',
    ]);
    idArray(modelPath.edge_ids, 1, 512);
    stableId(modelPath.end_node_id);
    enumValue(modelPath.flow_kind, FLOW_KINDS);
    idArray(modelPath.lifecycle_stage_ids, 0, 128);
    idArray(modelPath.node_ids, 1, 256);
    stableId(modelPath.path_id);
    if (modelPath.public_visibility !== 'PUBLIC') invalid();
    validateClaims(modelPath.source_claim_ids);
    stableId(modelPath.start_node_id);
    stringArray(modelPath.ordered_labels, 1, 256);
    if (!modelPath.node_ids.every((id) => nodeIds.has(id))
        || !modelPath.edge_ids.every((id) => edgeIds.has(id))
        || !modelPath.lifecycle_stage_ids.every((id) => stageIds.has(id))
        || modelPath.node_ids[0] !== modelPath.start_node_id
        || modelPath.node_ids.at(-1) !== modelPath.end_node_id) invalid();
  }), (modelPath) => modelPath.path_id);
  const pathIds = new Set(paths.map((modelPath) => modelPath.path_id));
  exactObject(topology.text_equivalent, [
    'full_text',
    'ordered_node_sentences',
    'ordered_edge_sentences',
    'ordered_path_sentences',
    'abstraction_sentences',
  ]);
  stringValue(topology.text_equivalent.full_text);
  stringArray(topology.text_equivalent.ordered_node_sentences, nodes.length, nodes.length);
  stringArray(topology.text_equivalent.ordered_edge_sentences, edges.length, edges.length);
  stringArray(topology.text_equivalent.ordered_path_sentences, paths.length, paths.length);
  stringArray(topology.text_equivalent.abstraction_sentences, 0, 128);
  return { nodeIds, edgeIds, pathIds, planeOrder };
}

function validateComponents(components, planeOrder) {
  const planes = new Set(planeOrder);
  const items = unique(arrayOf(components, 1, 256, (component) => {
    exactObject(component, [
      'role_id',
      'label',
      'purpose',
      'component_definition_id',
      'multiplicity',
      'optionality',
      'replaceability',
      'serviceability_note',
      'planes',
      'source_claim_ids',
    ]);
    stableId(component.role_id);
    stringValue(component.label);
    stringValue(component.purpose);
    if (component.component_definition_id !== null) stableId(component.component_definition_id);
    stringValue(component.multiplicity);
    stringValue(component.optionality);
    stringValue(component.replaceability);
    stringValue(component.serviceability_note);
    stringArray(component.planes, 1, 8);
    if (!component.planes.every((plane) => planes.has(plane))) invalid();
    validateClaims(component.source_claim_ids);
  }), (component) => component.role_id);
  return new Set(items.map((item) => item.role_id));
}

function validateRationales(rationales, { nodeIds, pathIds, stageIds }) {
  exactObject(rationales, ACTION_KINDS);
  const attachmentIds = new Set();
  let total = 0;
  for (const actionKind of ACTION_KINDS) {
    const graphs = arrayOf(rationales[actionKind], 0, 256, (graph) => {
      exactObject(graph, [
        'attachment_id',
        'action_definition_id',
        'action_kind',
        'relevance_label',
        'legality_label',
        'sentence',
        'graph_nodes',
        'graph_edges',
        'target_node_ids',
        'target_path_ids',
        'relevant_stage_ids',
        'source_claim_ids',
      ]);
      stableId(graph.attachment_id);
      stableId(graph.action_definition_id);
      if (graph.action_kind !== actionKind
          || graph.relevance_label !== 'Relevant to this system profile'
          || graph.legality_label !== 'Legal now is evaluated separately by the authoritative Match engine.') invalid();
      stringValue(graph.sentence);
      const graphNodes = unique(arrayOf(graph.graph_nodes, 1, 64, (node) => {
        exactObject(node, ['graph_node_id', 'kind', 'label', 'semantic_ref']);
        stableId(node.graph_node_id);
        enumValue(node.kind, new Set(['ACTION', 'TOPOLOGY_NODE', 'PATH']));
        stringValue(node.label);
        stableId(node.semantic_ref);
      }), (node) => node.graph_node_id);
      const graphNodeIds = new Set(graphNodes.map((node) => node.graph_node_id));
      arrayOf(graph.graph_edges, 1, 256, (edge) => {
        exactObject(edge, ['from_graph_node_id', 'to_graph_node_id', 'relation']);
        stableId(edge.from_graph_node_id);
        stableId(edge.to_graph_node_id);
        stringValue(edge.relation);
        if (!graphNodeIds.has(edge.from_graph_node_id) || !graphNodeIds.has(edge.to_graph_node_id)) invalid();
      });
      idArray(graph.target_node_ids, 0, 256);
      idArray(graph.target_path_ids, 0, 256);
      idArray(graph.relevant_stage_ids, 0, 128);
      validateClaims(graph.source_claim_ids);
      if (!graph.target_node_ids.every((id) => nodeIds.has(id))
          || !graph.target_path_ids.every((id) => pathIds.has(id))
          || !graph.relevant_stage_ids.every((id) => stageIds.has(id))) invalid();
      for (const node of graphNodes) {
        if ((node.kind === 'ACTION' && node.semantic_ref !== graph.action_definition_id)
            || (node.kind === 'TOPOLOGY_NODE' && !nodeIds.has(node.semantic_ref))
            || (node.kind === 'PATH' && !pathIds.has(node.semantic_ref))) invalid();
      }
    });
    for (const graph of graphs) {
      if (attachmentIds.has(graph.attachment_id)) invalid();
      attachmentIds.add(graph.attachment_id);
    }
    total += graphs.length;
  }
  if (total === 0) invalid();
}

function validateLearningReferences(references) {
  unique(arrayOf(references, 1, 128, (reference) => {
    exactObject(reference, [
      'source_id',
      'title',
      'publisher',
      'product_scope',
      'revision',
      'url',
      'claim_scope',
      'relevant_claim_ids',
    ]);
    stableId(reference.source_id);
    stringValue(reference.title);
    stringValue(reference.publisher);
    stringValue(reference.product_scope);
    stringValue(reference.revision);
    stringValue(reference.url, { maximum: 2_048 });
    let url;
    try {
      url = new URL(reference.url);
    } catch {
      invalid();
    }
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password
        || !reference.url.startsWith('https://')) invalid();
    stringValue(reference.claim_scope);
    idArray(reference.relevant_claim_ids, 1, 256);
  }), (reference) => reference.source_id);
}

function validateAuthorityBoundary(boundary) {
  exactObject(boundary, ['system_relevance', 'legal_now', 'gameplay_effect']);
  stringValue(boundary.system_relevance);
  stringValue(boundary.legal_now);
  if (boundary.gameplay_effect !== 'NONE') invalid();
}

function claimIdsIn(value, result = []) {
  if (Array.isArray(value)) value.forEach((item) => claimIdsIn(item, result));
  else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (key === 'source_claim_ids') result.push(...child);
      claimIdsIn(child, result);
    }
  }
  return result;
}

function validateProfileProjection(profile, { projectionVersion }) {
  exactObject(profile, [
    'schema_version',
    'projection_version',
    'profile',
    'intro',
    'descriptions',
    'lifecycle',
    'topology',
    'components',
    'rationales',
    'learning_references',
    'authority_boundary',
    'cache_key',
    'serialization',
  ]);
  if (profile.schema_version !== 'system-model-profile-projection-v1'
      || profile.projection_version !== projectionVersion) invalid();
  validateProfileIdentity(profile.profile);
  stringValue(profile.intro);
  validateDescriptions(profile.descriptions);
  const stageIds = validateLifecycle(profile.lifecycle);
  const topologyRefs = validateTopology(profile.topology, stageIds);
  const roleIds = validateComponents(profile.components, topologyRefs.planeOrder);
  if (!profile.topology.nodes.every((node) => node.role_ids.every((roleId) => roleIds.has(roleId)))) invalid();
  for (const abstraction of profile.profile.abstraction_statements) {
    if (!abstraction.represented_node_ids.every((nodeId) => topologyRefs.nodeIds.has(nodeId))) invalid();
  }
  if (profile.topology.text_equivalent.abstraction_sentences.length
      !== profile.profile.abstraction_statements.length) invalid();
  validateRationales(profile.rationales, { ...topologyRefs, stageIds });
  validateLearningReferences(profile.learning_references);
  const documentedClaims = new Set(profile.learning_references.flatMap((reference) => reference.relevant_claim_ids));
  if (!claimIdsIn(profile).every((claimId) => documentedClaims.has(claimId))) invalid();
  validateAuthorityBoundary(profile.authority_boundary);
  stableId(profile.cache_key);
  serialization(profile.serialization);
  const base = { ...profile };
  delete base.cache_key;
  delete base.serialization;
  const expectedCacheKey = `cache.system-model.profile.${derivedDigest(base).slice(0, 32)}`;
  if (profile.cache_key !== expectedCacheKey
      || profile.serialization.content_digest !== derivedDigest(withoutSerialization(profile))) invalid();
}

export function createSystemModelProjectionPayload({ catalog, ticketBinding, profile }) {
  return {
    schema_version: catalog.projection_version,
    projection_version: catalog.projection_version,
    content_version: catalog.content_version,
    ticket_ref: {
      ticket_id: ticketBinding.ticket_id,
      ticket_snapshot_digest: ticketBinding.ticket_snapshot_digest,
    },
    profile: structuredClone(profile.profile),
    intro: profile.intro,
    descriptions: structuredClone(profile.descriptions),
    lifecycle: structuredClone(profile.lifecycle),
    topology: structuredClone(profile.topology),
    components: structuredClone(profile.components),
    rationales: structuredClone(profile.rationales),
    learning_references: structuredClone(profile.learning_references),
    authority_boundary: structuredClone(profile.authority_boundary),
  };
}

function validateTicketBindings(catalog, profilesByCacheKey) {
  const ticketIds = new Set();
  const projectionCacheKeys = new Set();
  arrayOf(catalog.ticket_bindings, 18, 18, (binding) => {
    exactObject(binding, [
      'ticket_id',
      'ticket_snapshot_digest',
      'profile_id',
      'profile_revision',
      'profile_cache_key',
      'projection_cache_key',
      'projection_digest',
    ]);
    stableId(binding.ticket_id);
    digest(binding.ticket_snapshot_digest);
    stableId(binding.profile_id);
    integer(binding.profile_revision, 1);
    stableId(binding.profile_cache_key);
    stableId(binding.projection_cache_key);
    digest(binding.projection_digest);
    const profile = profilesByCacheKey.get(binding.profile_cache_key);
    if (!profile || profile.profile.profile_id !== binding.profile_id
        || profile.profile.profile_revision !== binding.profile_revision
        || ticketIds.has(binding.ticket_id)
        || projectionCacheKeys.has(binding.projection_cache_key)) invalid();
    const expectedDigest = derivedDigest(createSystemModelProjectionPayload({ catalog, ticketBinding: binding, profile }));
    const expectedCacheKey = `cache.system-model.ticket.${expectedDigest.slice(0, 32)}`;
    if (binding.projection_digest !== expectedDigest || binding.projection_cache_key !== expectedCacheKey) invalid();
    ticketIds.add(binding.ticket_id);
    projectionCacheKeys.add(binding.projection_cache_key);
  });
}

export function validateSystemModelProjectionCatalog(catalog, {
  contentVersion,
  projectionVersion,
  releaseId,
  fallbackMessage,
} = {}) {
  assertSafeJsonGraph(catalog);
  exactObject(catalog, [
    'schema_version',
    'content_version',
    'projection_version',
    'source_release_id',
    'source_catalog_digest',
    'source_binding_catalog_digest',
    'fallback',
    'profile_projections',
    'ticket_bindings',
    'serialization',
  ]);
  if (catalog.schema_version !== 'system-model-public-projection-catalog-v1'
      || catalog.content_version !== contentVersion
      || catalog.projection_version !== projectionVersion
      || catalog.source_release_id !== releaseId) invalid();
  digest(catalog.source_catalog_digest);
  digest(catalog.source_binding_catalog_digest);
  exactObject(catalog.fallback, ['public_message']);
  if (catalog.fallback.public_message !== fallbackMessage) invalid();
  const profiles = unique(arrayOf(catalog.profile_projections, 3, 3, (profile) =>
    validateProfileProjection(profile, { projectionVersion })), (profile) => profile.cache_key);
  unique(profiles, (profile) => `${profile.profile.profile_id}@${profile.profile.profile_revision}`);
  const profilesByCacheKey = new Map(profiles.map((profile) => [profile.cache_key, profile]));
  validateTicketBindings(catalog, profilesByCacheKey);
  serialization(catalog.serialization);
  if (catalog.serialization.content_digest !== derivedDigest(withoutSerialization(catalog))) invalid();
  return catalog;
}
