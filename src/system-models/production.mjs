import { canonicalJson, sha256 } from '../builder/canonical.mjs';
import { publicProjectionSafetyIssues } from './projections.mjs';

export const SYSTEM_MODEL_PROJECTION_VERSION = 'system-model-player-projection-v1';
export const SYSTEM_MODEL_PROJECTION_CATALOG_VERSION = 'system-model-public-projection-catalog-v1';
export const SYSTEM_MODEL_CONTENT_VERSION = 'released-story-system-projections-v1';
export const SYSTEM_MODEL_UNAVAILABLE_MESSAGE = 'A detailed system model is not available for this Ticket. Ordinary troubleshooting remains unchanged.';
export const SYSTEM_MODEL_PROFILE_INTRO = 'This System view explains serviceable structure, component roles, and lifecycle relationships without identifying current health or the correct diagnosis.';

const ACTION_KINDS = Object.freeze(['TEST', 'COMMAND', 'REPAIR', 'VERIFICATION']);
const FORBIDDEN_STAGED_KEYS = Object.freeze([
  'active_candidate_fault_ids',
  'authored_action_requirements',
  'candidate_closure',
  'compatibility_proofs',
  'differential_variants',
  'fingerprint_id',
  'hidden_fault_bindings',
  'private_compatibility',
  'public_resolver_key',
  'reason_code',
  'resolver_key',
  'server_only_truth',
  'ticket_focus_statement',
  'validation_result',
  'validation_trace',
]);

function stableCompare(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

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

function uniqueSorted(values) {
  return [...new Set(values)].sort(stableCompare);
}

function collectSourceClaimIds(value, result = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectSourceClaimIds(item, result));
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (key === 'source_claim_ids' && Array.isArray(child)) result.push(...child);
      collectSourceClaimIds(child, result);
    }
  }
  return uniqueSorted(result);
}

function stagedSafetyIssues(value, path = [], issues = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => stagedSafetyIssues(item, [...path, index], issues));
    return issues;
  }
  if (typeof value === 'string') {
    if (/\bfingerprint\./iu.test(value)) issues.push(`${path.join('.')} contains a private fingerprint identifier`);
    return issues;
  }
  if (!value || typeof value !== 'object') return issues;
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_STAGED_KEYS.includes(key)) issues.push(`${[...path, key].join('.')} is not browser-deliverable`);
    stagedSafetyIssues(child, [...path, key], issues);
  }
  return issues;
}

function learningReferences(sourceLedger, claimIds) {
  const required = new Set(claimIds);
  const claimed = new Set();
  const references = (sourceLedger?.sources ?? []).flatMap((source) => {
    const relevantClaimIds = uniqueSorted((source.claim_ids ?? []).filter((claimId) => required.has(claimId)));
    if (relevantClaimIds.length === 0) return [];
    for (const claimId of relevantClaimIds) claimed.add(claimId);
    if (typeof source.url !== 'string' || !/^https:\/\//u.test(source.url)) {
      throw new Error(`Source ${source.source_id} has no public HTTPS learning reference.`);
    }
    return [{
      source_id: source.source_id,
      title: source.title,
      publisher: source.publisher,
      product_scope: source.product_scope,
      revision: source.revision,
      url: source.url,
      claim_scope: source.claim_scope,
      relevant_claim_ids: relevantClaimIds,
    }];
  }).sort((left, right) => stableCompare(left.source_id, right.source_id));
  const missing = [...required].filter((claimId) => !claimed.has(claimId)).sort(stableCompare);
  if (missing.length > 0) throw new Error(`Public source ledger does not resolve claims: ${missing.join(', ')}.`);
  return references;
}

function lifecycleDescriptions(projection) {
  const stageText = projection.lifecycle.entries.map((entry) => entry.text);
  const optionText = projection.scope.option_statements.map((entry) => entry.statement);
  const planeText = projection.scope.plane_statements.map((entry) =>
    `${entry.plane.replaceAll('_', ' ')}: ${entry.summary}`);
  return {
    concise: stageText.join(' '),
    extended: [
      projection.diagram.scope_statement,
      ...optionText,
      ...planeText,
      ...stageText,
      projection.lifecycle.not_applicable_note,
    ].join(' '),
  };
}

function rationaleGroups(rationaleGraphs) {
  const groups = Object.fromEntries(ACTION_KINDS.map((kind) => [kind, []]));
  for (const graph of rationaleGraphs) {
    if (!groups[graph.action_kind]) throw new Error(`Unsupported public rationale kind ${graph.action_kind}.`);
    groups[graph.action_kind].push(structuredClone(graph));
  }
  for (const kind of ACTION_KINDS) {
    groups[kind].sort((left, right) =>
      stableCompare(left.action_definition_id, right.action_definition_id)
        || stableCompare(left.attachment_id, right.attachment_id));
  }
  return groups;
}

function profileProjectionBase({ resolution, sourceLedger }) {
  if (!resolution || resolution.status !== 'RESOLVED' || !resolution.public_projection) {
    throw new Error('A resolved public System Model projection is required.');
  }
  const projection = resolution.public_projection;
  const publicIssues = publicProjectionSafetyIssues(projection);
  if (publicIssues.length > 0) throw new Error(`Unsafe resolver projection: ${publicIssues.join('; ')}`);
  const topology = structuredClone(projection.diagram);
  topology.title = `${projection.scope.display_name} system topology`;
  const base = {
    schema_version: 'system-model-profile-projection-v1',
    projection_version: SYSTEM_MODEL_PROJECTION_VERSION,
    profile: {
      profile_id: projection.model_ref.profile_id,
      profile_revision: projection.model_ref.profile_revision,
      profile_content_digest: projection.model_ref.profile_content_digest,
      display_name: projection.scope.display_name,
      model_scope: projection.scope.model_scope,
      generation_or_era: projection.scope.generation_or_era,
      exactness_class: projection.scope.exactness_class,
      option_statements: structuredClone(projection.scope.option_statements),
      plane_statements: structuredClone(projection.scope.plane_statements),
      abstraction_statements: structuredClone(projection.scope.abstraction_statements),
    },
    intro: SYSTEM_MODEL_PROFILE_INTRO,
    descriptions: lifecycleDescriptions(projection),
    lifecycle: structuredClone(projection.lifecycle),
    topology,
    components: structuredClone(projection.component_inventory),
    rationales: rationaleGroups(projection.rationale_graphs),
    learning_references: learningReferences(sourceLedger, collectSourceClaimIds(projection)),
    authority_boundary: structuredClone(projection.authority_boundary),
  };
  const identityDigest = sha256(canonicalJson(base));
  return withSerialization({
    ...base,
    cache_key: `cache.system-model.profile.${identityDigest.slice(0, 32)}`,
  });
}

function projectionPayload({ contentVersion, ticketBinding, profileProjection }) {
  return {
    schema_version: SYSTEM_MODEL_PROJECTION_VERSION,
    projection_version: SYSTEM_MODEL_PROJECTION_VERSION,
    content_version: contentVersion,
    ticket_ref: {
      ticket_id: ticketBinding.ticket_id,
      ticket_snapshot_digest: ticketBinding.ticket_snapshot_digest,
    },
    profile: structuredClone(profileProjection.profile),
    intro: profileProjection.intro,
    descriptions: structuredClone(profileProjection.descriptions),
    lifecycle: structuredClone(profileProjection.lifecycle),
    topology: structuredClone(profileProjection.topology),
    components: structuredClone(profileProjection.components),
    rationales: structuredClone(profileProjection.rationales),
    learning_references: structuredClone(profileProjection.learning_references),
    authority_boundary: structuredClone(profileProjection.authority_boundary),
  };
}

export function materializePlayerSystemProjection({ catalog, ticketBinding }) {
  const profileProjection = catalog.profile_projections.find((candidate) =>
    candidate.cache_key === ticketBinding.profile_cache_key);
  if (!profileProjection) throw new Error(`Missing staged profile projection ${ticketBinding.profile_cache_key}.`);
  const payload = projectionPayload({
    contentVersion: catalog.content_version,
    ticketBinding,
    profileProjection,
  });
  const projectionDigest = sha256(canonicalJson(payload));
  if (ticketBinding.projection_digest !== projectionDigest) {
    throw new Error(`Ticket projection digest mismatch for ${ticketBinding.ticket_id}.`);
  }
  return {
    ...payload,
    cache_key: ticketBinding.projection_cache_key,
    projection_digest: projectionDigest,
  };
}

export function buildProductionProjectionCatalog({
  catalog,
  bindingCatalog,
  privateCatalog,
  sourceLedger,
  resolveBinding,
  validateCompatibility,
  contentVersion = SYSTEM_MODEL_CONTENT_VERSION,
}) {
  if (typeof resolveBinding !== 'function' || typeof validateCompatibility !== 'function') {
    throw new TypeError('Production projection build requires public resolution and private build validation callbacks.');
  }
  if (catalog?.fallback?.public_message !== SYSTEM_MODEL_UNAVAILABLE_MESSAGE) {
    throw new Error('System Model source fallback does not equal the approved public message.');
  }
  const profileByIdentity = new Map();
  const ticketBindings = [];
  const sortedBindings = [...bindingCatalog.bindings].sort((left, right) => stableCompare(left.ticket_id, right.ticket_id));
  for (const binding of sortedBindings) {
    const resolution = resolveBinding(binding);
    if (resolution.status !== 'RESOLVED') throw new Error(`System Model resolution failed for ${binding.ticket_id}.`);
    const proof = privateCatalog.compatibility_proofs.find((candidate) => candidate.binding_id === binding.binding_id);
    const compatibility = validateCompatibility(resolution, proof);
    if (compatibility.status !== 'PASS') throw new Error(`Private compatibility rejected ${binding.ticket_id}.`);
    const profileProjection = profileProjectionBase({ resolution, sourceLedger });
    const profileIdentity = `${profileProjection.profile.profile_id}@${profileProjection.profile.profile_revision}`;
    const existing = profileByIdentity.get(profileIdentity);
    if (existing && canonicalJson(existing) !== canonicalJson(profileProjection)) {
      throw new Error(`Profile projection drift across bindings for ${profileIdentity}.`);
    }
    profileByIdentity.set(profileIdentity, profileProjection);
    const partialTicket = {
      ticket_id: binding.ticket_id,
      ticket_snapshot_digest: binding.ticket_snapshot_digest,
      profile_id: profileProjection.profile.profile_id,
      profile_revision: profileProjection.profile.profile_revision,
      profile_cache_key: profileProjection.cache_key,
    };
    const payload = projectionPayload({ contentVersion, ticketBinding: partialTicket, profileProjection });
    const projectionDigest = sha256(canonicalJson(payload));
    ticketBindings.push({
      ...partialTicket,
      projection_cache_key: `cache.system-model.ticket.${projectionDigest.slice(0, 32)}`,
      projection_digest: projectionDigest,
    });
  }
  const profileProjections = [...profileByIdentity.values()].sort((left, right) =>
    stableCompare(left.profile.profile_id, right.profile.profile_id)
      || left.profile.profile_revision - right.profile.profile_revision);
  const value = {
    schema_version: SYSTEM_MODEL_PROJECTION_CATALOG_VERSION,
    content_version: contentVersion,
    projection_version: SYSTEM_MODEL_PROJECTION_VERSION,
    source_release_id: catalog.release_id,
    source_catalog_digest: catalog.serialization.content_digest,
    source_binding_catalog_digest: bindingCatalog.serialization.content_digest,
    fallback: {
      public_message: SYSTEM_MODEL_UNAVAILABLE_MESSAGE,
    },
    profile_projections: profileProjections,
    ticket_bindings: ticketBindings,
  };
  const result = withSerialization(value);
  const issues = stagedSafetyIssues(result);
  if (issues.length > 0) throw new Error(`Unsafe staged projection catalog: ${issues.join('; ')}`);
  return result;
}

export function productionProjectionSafetyIssues(value) {
  return uniqueSorted(stagedSafetyIssues(value));
}
