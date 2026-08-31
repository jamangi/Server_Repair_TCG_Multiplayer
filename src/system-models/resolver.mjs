import { canonicalJson, sha256 } from '../builder/canonical.mjs';
import {
  buildPublicSystemProjection,
  publicProjectionSafetyIssues,
  validateProjectionReferences,
} from './projections.mjs';

export const SYSTEM_MODEL_REASON_CODES = Object.freeze({
  RESOLVED: 'RESOLVED',
  INVALID_REQUEST: 'INVALID_REQUEST',
  NO_PUBLIC_BINDING: 'NO_PUBLIC_BINDING',
  AMBIGUOUS_PUBLIC_BINDING: 'AMBIGUOUS_PUBLIC_BINDING',
  RESOLVER_KEY_MISMATCH: 'RESOLVER_KEY_MISMATCH',
  TICKET_SNAPSHOT_MISMATCH: 'TICKET_SNAPSHOT_MISMATCH',
  PUBLIC_SURFACE_MISMATCH: 'PUBLIC_SURFACE_MISMATCH',
  PROFILE_NOT_FOUND: 'PROFILE_NOT_FOUND',
  AMBIGUOUS_PROFILE_PIN: 'AMBIGUOUS_PROFILE_PIN',
  PROFILE_PIN_MISMATCH: 'PROFILE_PIN_MISMATCH',
  PROFILE_NOT_PUBLISHED: 'PROFILE_NOT_PUBLISHED',
  MISSING_REQUIRED_DEVICE: 'MISSING_REQUIRED_DEVICE',
  INCOMPATIBLE_CONTROLLER_PATH: 'INCOMPATIBLE_CONTROLLER_PATH',
  PUBLIC_CANDIDATE_CLOSURE_FAILED: 'PUBLIC_CANDIDATE_CLOSURE_FAILED',
  UNSUPPORTED_VENDOR_OPTION: 'UNSUPPORTED_VENDOR_OPTION',
  INCOMPLETE_DOMAIN_RELATIONSHIPS: 'INCOMPLETE_DOMAIN_RELATIONSHIPS',
  MISSING_REQUIRED_CAPABILITY: 'MISSING_REQUIRED_CAPABILITY',
  PROFILE_DIGEST_MISMATCH: 'PROFILE_DIGEST_MISMATCH',
  PUBLIC_PROJECTION_REJECTED: 'PUBLIC_PROJECTION_REJECTED',
  PRIVATE_COMPATIBILITY_REJECTED: 'PRIVATE_COMPATIBILITY_REJECTED',
});

const GENERIC_FAILURE_MESSAGE = 'A detailed system model is not available for this Ticket. Ordinary troubleshooting remains unchanged.';

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

function digestWithoutSerialization(value) {
  const copy = structuredClone(value);
  delete copy.serialization;
  return sha256(canonicalJson(copy));
}

function arraysEqual(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function hasUniqueStrings(values) {
  return Array.isArray(values)
    && values.every((value) => typeof value === 'string' && value.length > 0)
    && new Set(values).size === values.length;
}

function traceStep(step, code, status = 'PASS') {
  return { step, code, status };
}

function unavailable({ request, catalog, reasonCode, trace }) {
  const fallback = catalog?.fallback ?? {
    fallback_id: 'fallback.system-model.text-only.v1',
    public_message: GENERIC_FAILURE_MESSAGE,
  };
  return withSerialization({
    result_version: 'system-model-resolver-result-v1',
    status: 'UNAVAILABLE',
    reason_code: reasonCode,
    ticket_id: typeof request?.ticket_id === 'string' ? request.ticket_id : null,
    selected_profile_id: null,
    validation_trace: [...trace, traceStep('resolution', reasonCode, 'FAIL')],
    public_projection: null,
    fallback: {
      fallback_id: fallback.fallback_id,
      public_message: fallback.public_message ?? GENERIC_FAILURE_MESSAGE,
    },
    gameplay_effect: 'NONE',
  });
}

function validateRequest(request) {
  if (!request || typeof request !== 'object') return false;
  if (![request.ticket_id, request.ticket_snapshot_digest, request.public_resolver_key, request.profile_id]
    .every((value) => typeof value === 'string' && value.length > 0)) return false;
  if (!Number.isInteger(request.profile_revision) || request.profile_revision < 1) return false;
  if (!request.public_surface || !hasUniqueStrings(request.public_surface.public_symptom_ids)
    || !hasUniqueStrings(request.public_surface.public_candidate_fault_ids)) return false;
  return request.active_public_candidate_fault_ids === undefined
    || hasUniqueStrings(request.active_public_candidate_fault_ids);
}

function referencedNodeIds(binding, profile) {
  const capabilityIds = new Set(binding.public_requirement_capability_ids);
  const capabilityNodes = profile.finder_capabilities
    .filter((capability) => capabilityIds.has(capability.capability_id))
    .flatMap((capability) => capability.node_ids);
  const closureNodes = binding.candidate_closure.flatMap((entry) => entry.public_node_ids);
  return [...new Set([...capabilityNodes, ...closureNodes])];
}

function missingRequiredDevice(profile, binding) {
  const nodeIds = new Set(profile.topology_nodes.map((node) => node.node_id));
  return referencedNodeIds(binding, profile).some((nodeId) => !nodeIds.has(nodeId));
}

function hasIncompatiblePath(profile) {
  const edgeById = new Map(profile.topology_edges.map((edge) => [edge.edge_id, edge]));
  return profile.paths.some((modelPath) => {
    if (modelPath.node_ids.length !== modelPath.edge_ids.length + 1) return true;
    if (modelPath.start_node_id !== modelPath.node_ids[0] || modelPath.end_node_id !== modelPath.node_ids.at(-1)) return true;
    return modelPath.edge_ids.some((edgeId, index) => {
      const edge = edgeById.get(edgeId);
      return !edge
        || edge.from_node_id !== modelPath.node_ids[index]
        || edge.to_node_id !== modelPath.node_ids[index + 1];
    });
  });
}

function candidateClosureComplete(binding) {
  const candidates = binding.public_surface.public_candidate_fault_ids;
  const closureCandidates = binding.candidate_closure.map((entry) => entry.candidate_fault_id);
  return arraysEqual(candidates, closureCandidates)
    && binding.candidate_closure.every((entry) => entry.public_node_ids.length > 0 || entry.public_path_ids.length > 0);
}

function hasUnsupportedVendorOption(profile, catalog) {
  const claimIds = new Set(catalog.profiles.flatMap((candidate) => candidate.provenance.source_claim_ids));
  return profile.option_constraints.some((constraint) =>
    constraint.enforcement !== 'REQUIRED_FOR_PROFILE'
      || constraint.source_claim_ids.length === 0
      || constraint.source_claim_ids.some((claimId) => !claimIds.has(claimId)));
}

function hasIncompleteRelationships(profile) {
  const roleIds = new Set(profile.role_instances.map((role) => role.role_id));
  const nodeIds = new Set(profile.topology_nodes.map((node) => node.node_id));
  const edgeIds = new Set(profile.topology_edges.map((edge) => edge.edge_id));
  const pathIds = new Set(profile.paths.map((modelPath) => modelPath.path_id));
  const stageIds = new Set(profile.lifecycle_stages.map((stage) => stage.stage_id));
  if (profile.topology_nodes.some((node) =>
    ['COMPONENT_INSTANCE', 'SERVICEABLE_UNIT'].includes(node.node_kind)
      && (node.role_ids.length === 0 || node.role_ids.some((roleId) => !roleIds.has(roleId))))) return true;
  if (profile.topology_edges.some((edge) => !nodeIds.has(edge.from_node_id) || !nodeIds.has(edge.to_node_id))) return true;
  if (profile.paths.some((modelPath) =>
    modelPath.node_ids.some((nodeId) => !nodeIds.has(nodeId))
      || modelPath.edge_ids.some((edgeId) => !edgeIds.has(edgeId)))) return true;
  return profile.action_attachments.some((attachment) =>
    attachment.target_node_ids.some((nodeId) => !nodeIds.has(nodeId))
      || attachment.target_path_ids.some((pathId) => !pathIds.has(pathId))
      || attachment.relevant_stage_ids.some((stageId) => !stageIds.has(stageId)));
}

function missingCapability(profile, binding) {
  const capabilityIds = new Set(profile.finder_capabilities.map((capability) => capability.capability_id));
  return binding.public_requirement_capability_ids.some((capabilityId) => !capabilityIds.has(capabilityId));
}

function validateActiveCandidates(request, binding) {
  const initial = binding.public_surface.public_candidate_fault_ids;
  const requested = request.active_public_candidate_fault_ids ?? initial;
  const requestedSet = new Set(requested);
  if (requested.length === 0 || requested.some((candidateId) => !initial.includes(candidateId))) return null;
  return initial.filter((candidateId) => requestedSet.has(candidateId));
}

export function createResolverRequest(binding, overrides = {}) {
  return {
    ticket_id: binding.ticket_id,
    ticket_snapshot_digest: binding.ticket_snapshot_digest,
    public_resolver_key: binding.public_resolver_key,
    profile_id: binding.profile_ref.profile_id,
    profile_revision: binding.profile_ref.profile_revision,
    public_surface: {
      public_symptom_ids: [...binding.public_surface.public_symptom_ids],
      public_candidate_fault_ids: [...binding.public_surface.public_candidate_fault_ids],
    },
    active_public_candidate_fault_ids: [...binding.public_surface.public_candidate_fault_ids],
    ...overrides,
  };
}

export function resolvePublicSystemModel({ request, catalog, bindingCatalog }) {
  const trace = [];
  if (!validateRequest(request)) return unavailable({
    request,
    catalog,
    reasonCode: SYSTEM_MODEL_REASON_CODES.INVALID_REQUEST,
    trace,
  });
  trace.push(traceStep('request', 'PUBLIC_INPUTS_ACCEPTED'));

  const bindings = bindingCatalog.bindings
    .filter((binding) => binding.ticket_id === request.ticket_id)
    .sort((left, right) => left.binding_id.localeCompare(right.binding_id));
  if (bindings.length === 0) return unavailable({ request, catalog, reasonCode: SYSTEM_MODEL_REASON_CODES.NO_PUBLIC_BINDING, trace });
  if (bindings.length > 1) return unavailable({ request, catalog, reasonCode: SYSTEM_MODEL_REASON_CODES.AMBIGUOUS_PUBLIC_BINDING, trace });
  const binding = bindings[0];
  trace.push(traceStep('binding_lookup', 'EXACTLY_ONE_BINDING'));

  if (binding.public_resolver_key !== request.public_resolver_key) return unavailable({ request, catalog, reasonCode: SYSTEM_MODEL_REASON_CODES.RESOLVER_KEY_MISMATCH, trace });
  if (binding.ticket_snapshot_digest !== request.ticket_snapshot_digest) return unavailable({ request, catalog, reasonCode: SYSTEM_MODEL_REASON_CODES.TICKET_SNAPSHOT_MISMATCH, trace });
  if (!arraysEqual(binding.public_surface.public_symptom_ids, request.public_surface.public_symptom_ids)
    || !arraysEqual(binding.public_surface.public_candidate_fault_ids, request.public_surface.public_candidate_fault_ids)) {
    return unavailable({ request, catalog, reasonCode: SYSTEM_MODEL_REASON_CODES.PUBLIC_SURFACE_MISMATCH, trace });
  }
  const activeCandidates = validateActiveCandidates(request, binding);
  if (activeCandidates === null) return unavailable({ request, catalog, reasonCode: SYSTEM_MODEL_REASON_CODES.PUBLIC_SURFACE_MISMATCH, trace });
  trace.push(traceStep('public_surface', 'PUBLIC_SURFACE_AND_ACTIVE_CANDIDATES_ACCEPTED'));

  const profiles = catalog.profiles
    .filter((profile) => profile.profile_id === request.profile_id)
    .sort((left, right) => left.profile_revision - right.profile_revision);
  if (profiles.length === 0) return unavailable({ request, catalog, reasonCode: SYSTEM_MODEL_REASON_CODES.PROFILE_NOT_FOUND, trace });
  const pinnedProfiles = profiles.filter((candidate) => candidate.profile_revision === request.profile_revision);
  if (pinnedProfiles.length > 1) return unavailable({ request, catalog, reasonCode: SYSTEM_MODEL_REASON_CODES.AMBIGUOUS_PROFILE_PIN, trace });
  const profile = pinnedProfiles[0];
  if (!profile || binding.profile_ref.profile_id !== request.profile_id
    || binding.profile_ref.profile_revision !== request.profile_revision) {
    return unavailable({ request, catalog, reasonCode: SYSTEM_MODEL_REASON_CODES.PROFILE_PIN_MISMATCH, trace });
  }
  if (profile.lifecycle_status !== 'PUBLISHED') return unavailable({ request, catalog, reasonCode: SYSTEM_MODEL_REASON_CODES.PROFILE_NOT_PUBLISHED, trace });
  trace.push(traceStep('profile_pin', 'PROFILE_ID_REVISION_ACCEPTED'));

  if (missingRequiredDevice(profile, binding)) return unavailable({ request, catalog, reasonCode: SYSTEM_MODEL_REASON_CODES.MISSING_REQUIRED_DEVICE, trace });
  if (hasIncompatiblePath(profile)) return unavailable({ request, catalog, reasonCode: SYSTEM_MODEL_REASON_CODES.INCOMPATIBLE_CONTROLLER_PATH, trace });
  if (!candidateClosureComplete(binding)) return unavailable({ request, catalog, reasonCode: SYSTEM_MODEL_REASON_CODES.PUBLIC_CANDIDATE_CLOSURE_FAILED, trace });
  if (hasUnsupportedVendorOption(profile, catalog)) return unavailable({ request, catalog, reasonCode: SYSTEM_MODEL_REASON_CODES.UNSUPPORTED_VENDOR_OPTION, trace });
  if (hasIncompleteRelationships(profile)) return unavailable({ request, catalog, reasonCode: SYSTEM_MODEL_REASON_CODES.INCOMPLETE_DOMAIN_RELATIONSHIPS, trace });
  if (missingCapability(profile, binding)) return unavailable({ request, catalog, reasonCode: SYSTEM_MODEL_REASON_CODES.MISSING_REQUIRED_CAPABILITY, trace });
  trace.push(traceStep('profile_consistency', 'PUBLIC_CAPABILITY_TOPOLOGY_AND_CLOSURE_ACCEPTED'));

  if (digestWithoutSerialization(profile) !== profile.serialization.content_digest
    || binding.profile_ref.profile_content_digest !== profile.serialization.content_digest) {
    return unavailable({ request, catalog, reasonCode: SYSTEM_MODEL_REASON_CODES.PROFILE_DIGEST_MISMATCH, trace });
  }
  trace.push(traceStep('serialization', 'PROFILE_DIGEST_ACCEPTED'));

  let publicProjection;
  try {
    publicProjection = buildPublicSystemProjection({
      profile,
      binding,
      activeCandidateFaultIds: activeCandidates,
      templates: catalog.templates,
    });
  } catch {
    return unavailable({ request, catalog, reasonCode: SYSTEM_MODEL_REASON_CODES.PUBLIC_PROJECTION_REJECTED, trace });
  }
  const projectionIssues = [
    ...validateProjectionReferences(publicProjection, profile),
    ...publicProjectionSafetyIssues(publicProjection),
  ];
  if (projectionIssues.length > 0) return unavailable({ request, catalog, reasonCode: SYSTEM_MODEL_REASON_CODES.PUBLIC_PROJECTION_REJECTED, trace });
  trace.push(traceStep('public_projection', 'ONE_SOURCE_PROJECTION_ACCEPTED'));

  return withSerialization({
    result_version: 'system-model-resolver-result-v1',
    status: 'RESOLVED',
    reason_code: SYSTEM_MODEL_REASON_CODES.RESOLVED,
    ticket_id: request.ticket_id,
    selected_profile_id: profile.profile_id,
    selected_profile_revision: profile.profile_revision,
    binding_id: binding.binding_id,
    public_binding_digest: binding.serialization.content_digest,
    validation_trace: trace,
    public_projection: publicProjection,
    fallback: null,
    gameplay_effect: 'NONE',
  });
}

export function validateAuthoringCompatibility({ resolution, compatibilityProof }) {
  const trace = [];
  if (!resolution || resolution.status !== 'RESOLVED' || !compatibilityProof) {
    return {
      status: 'REJECTED',
      reason_code: SYSTEM_MODEL_REASON_CODES.PRIVATE_COMPATIBILITY_REJECTED,
      validation_trace: [traceStep('authoring_gate', 'PUBLIC_RESOLUTION_REQUIRED', 'FAIL')],
      public_projection_digest: resolution?.public_projection?.serialization?.content_digest ?? null,
      gameplay_effect: 'NONE',
    };
  }
  const profileMatch = compatibilityProof.profile_ref.profile_id === resolution.selected_profile_id
    && compatibilityProof.profile_ref.profile_revision === resolution.selected_profile_revision;
  trace.push(traceStep('profile_match', profileMatch ? 'SELECTED_PROFILE_MATCHES' : 'SELECTED_PROFILE_MISMATCH', profileMatch ? 'PASS' : 'FAIL'));
  const accepted = profileMatch
    && compatibilityProof.binding_id === resolution.binding_id
    && compatibilityProof.validation_result === 'PASS'
    && compatibilityProof.differential_variants.length > 0
    && compatibilityProof.differential_variants.every((variant) =>
      variant.expected_public_binding_digest === resolution.public_binding_digest);
  return {
    status: accepted ? 'PASS' : 'REJECTED',
    reason_code: accepted ? 'AUTHORING_COMPATIBILITY_CONFIRMED' : SYSTEM_MODEL_REASON_CODES.PRIVATE_COMPATIBILITY_REJECTED,
    validation_trace: [
      ...trace,
      traceStep('compatibility', accepted ? 'AUTHORING_REQUIREMENTS_ACCEPTED' : 'AUTHORING_REQUIREMENTS_REJECTED', accepted ? 'PASS' : 'FAIL'),
    ],
    coverage: {
      authored_role_checks: compatibilityProof.hidden_fault_bindings.length,
      authored_action_checks: compatibilityProof.authored_action_requirements.length,
      differential_cases: compatibilityProof.differential_variants.length,
    },
    public_projection_digest: resolution.public_projection.serialization.content_digest,
    gameplay_effect: 'NONE',
  };
}
