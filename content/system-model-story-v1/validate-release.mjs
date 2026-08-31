import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  canonicalJson,
  expectedFiles,
  OUTPUT_PATHS,
  RELEASE_ID,
  STORY_PROFILE_ID,
  verifyImmutableInputs,
} from './build-release.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PILOT_ROOT = 'content/system-model-pilot-v1';

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

function digest(source) {
  return crypto.createHash('sha256').update(source).digest('hex');
}

function serializationDigest(value) {
  const clone = structuredClone(value);
  delete clone.serialization;
  return digest(canonicalJson(clone));
}

function sorted(values) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function unique(values) {
  return [...new Set(values)];
}

function collectReleasedTickets(coverage) {
  return coverage.matches.flatMap((match) => match.tickets.map((ticket) => ({
    ...ticket,
    match_ref: match.match_ref,
  })));
}

function compareJson(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function findPrivateKeys(value, pointer = '$', findings = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => findPrivateKeys(item, `${pointer}[${index}]`, findings));
    return findings;
  }
  if (!value || typeof value !== 'object') return findings;
  for (const [key, child] of Object.entries(value)) {
    const childPointer = `${pointer}.${key}`;
    if (/^(hidden|hidden_true_fault_ids|oracle|oracle_witness|evidence_outcome_id|repair_outcome_id|verification_outcome_id|target_fault_instance_key|synthetic_hidden_fault_ids)$/i.test(key)) {
      findings.push(childPointer);
    }
    findPrivateKeys(child, childPointer, findings);
  }
  return findings;
}

function graphHasCycle(nodes, edges) {
  const adjacency = new Map(nodes.map((node) => [node, []]));
  for (const [from, to] of edges) {
    if (!adjacency.has(from)) adjacency.set(from, []);
    adjacency.get(from).push(to);
  }
  const visiting = new Set();
  const visited = new Set();
  function visit(node) {
    if (visiting.has(node)) return true;
    if (visited.has(node)) return false;
    visiting.add(node);
    for (const next of adjacency.get(node) ?? []) if (visit(next)) return true;
    visiting.delete(node);
    visited.add(node);
    return false;
  }
  return [...adjacency.keys()].some(visit);
}

export function validateReleasedStorySystemModel({ checkGenerated = true } = {}) {
  const issues = [];
  const check = (condition, code, detail) => {
    if (!condition) issues.push({ code, detail });
  };
  const checkUnique = (values, code) => {
    check(values.length === new Set(values).size, code, `${values.length} rows contain ${new Set(values).size} unique IDs`);
  };

  const catalog = readJson(OUTPUT_PATHS.catalog);
  const bindings = readJson(OUTPUT_PATHS.bindings);
  const privateValidation = readJson(OUTPUT_PATHS.privateValidation);
  const overlay = readJson(OUTPUT_PATHS.overlay);
  const migration = readJson(OUTPUT_PATHS.migration);
  const coverageLedger = readJson(OUTPUT_PATHS.coverage);
  const sourceLedger = readJson(OUTPUT_PATHS.sourceLedger);
  const manifest = readJson(OUTPUT_PATHS.manifest);
  const releasedCoverage = readJson('docs/story/coverage/released-story-domain-coverage-v3.json');
  const releasedTickets = collectReleasedTickets(releasedCoverage);
  const releasedById = new Map(releasedTickets.map((ticket) => [ticket.ticket_id, ticket]));

  check(releasedTickets.length === 18, 'DENOMINATOR_TICKET_COUNT', `expected 18; received ${releasedTickets.length}`);
  check(new Set(releasedTickets.map((ticket) => ticket.fingerprint_id)).size === 18, 'DENOMINATOR_FINGERPRINT_COUNT', 'released Story must expose 18 unique fingerprints');
  check(new Set(releasedTickets.map((ticket) => ticket.match_ref)).size === 12, 'DENOMINATOR_MATCH_COUNT', 'released Story must expose 12 Matches');
  check(catalog.release_id === RELEASE_ID && bindings.release_id === RELEASE_ID && privateValidation.release_id === RELEASE_ID, 'RELEASE_ID', 'successor catalogs must share the released Story release ID');
  check(catalog.profiles.length === 3, 'PROFILE_COUNT', `expected 3; received ${catalog.profiles.length}`);
  check(bindings.bindings.length === 18, 'BINDING_COUNT', `expected 18; received ${bindings.bindings.length}`);
  check(privateValidation.compatibility_proofs.length === 18, 'PROOF_COUNT', `expected 18; received ${privateValidation.compatibility_proofs.length}`);
  checkUnique(catalog.profiles.map((profile) => profile.profile_id), 'DUPLICATE_PROFILE_ID');
  checkUnique(bindings.bindings.map((binding) => binding.binding_id), 'DUPLICATE_BINDING_ID');
  checkUnique(bindings.bindings.map((binding) => binding.ticket_id), 'DUPLICATE_TICKET_BINDING');
  checkUnique(privateValidation.compatibility_proofs.map((proof) => proof.compatibility_id), 'DUPLICATE_COMPATIBILITY_ID');
  checkUnique(overlay.relationships.map((relationship) => relationship.relationship_id), 'DUPLICATE_RELATIONSHIP_ID');

  for (const value of [catalog, bindings, privateValidation, overlay, migration, coverageLedger]) {
    check(value.serialization?.content_digest === serializationDigest(value), 'CATALOG_DIGEST', `${value.schema_version ?? value.coverage_version} serialization digest drift`);
  }
  for (const profile of catalog.profiles) {
    check(profile.serialization?.content_digest === serializationDigest(profile), 'PROFILE_DIGEST', profile.profile_id);
  }
  for (const binding of bindings.bindings) {
    check(binding.serialization?.content_digest === serializationDigest(binding), 'BINDING_DIGEST', binding.binding_id);
  }
  for (const proof of privateValidation.compatibility_proofs) {
    check(proof.serialization?.content_digest === serializationDigest(proof), 'PROOF_DIGEST', proof.compatibility_id);
  }

  const pilotCatalog = readJson(`${PILOT_ROOT}/system-model-catalog-v1.json`);
  const pilotBindings = readJson(`${PILOT_ROOT}/ticket-system-bindings-v1.json`);
  const pilotProofs = readJson(`${PILOT_ROOT}/private-compatibility-v1.json`);
  const pilotOverlay = readJson(`${PILOT_ROOT}/domain-relationship-overlay-v1.json`);
  const profileById = new Map(catalog.profiles.map((profile) => [profile.profile_id, profile]));
  const bindingById = new Map(bindings.bindings.map((binding) => [binding.binding_id, binding]));
  const proofById = new Map(privateValidation.compatibility_proofs.map((proof) => [proof.compatibility_id, proof]));
  const relationshipById = new Map(overlay.relationships.map((relationship) => [relationship.relationship_id, relationship]));
  for (const profile of pilotCatalog.profiles) {
    check(compareJson(profileById.get(profile.profile_id), profile), 'PILOT_PROFILE_DRIFT', profile.profile_id);
  }
  for (const binding of pilotBindings.bindings) {
    check(compareJson(bindingById.get(binding.binding_id), binding), 'PILOT_BINDING_DRIFT', binding.binding_id);
  }
  for (const proof of pilotProofs.compatibility_proofs) {
    check(compareJson(proofById.get(proof.compatibility_id), proof), 'PILOT_PROOF_DRIFT', proof.compatibility_id);
  }
  for (const relationship of pilotOverlay.relationships) {
    check(compareJson(relationshipById.get(relationship.relationship_id), relationship), 'PILOT_RELATIONSHIP_DRIFT', relationship.relationship_id);
  }
  check(pilotBindings.bindings.length === 5, 'PILOT_BINDING_DENOMINATOR', 'pilot must contribute exactly five unchanged bindings');
  check(bindings.bindings.filter((binding) => !pilotBindings.bindings.some((pilot) => pilot.binding_id === binding.binding_id)).length === 13, 'NEW_BINDING_COUNT', 'successor must add exactly 13 bindings');

  const allClaims = new Set(sourceLedger.sources.flatMap((source) => source.claim_ids));
  check(sourceLedger.sources.length === 25, 'SOURCE_COUNT', `expected 25; received ${sourceLedger.sources.length}`);
  check(allClaims.size === 50, 'CLAIM_COUNT', `expected 50; received ${allClaims.size}`);
  checkUnique(sourceLedger.sources.map((source) => source.source_id), 'DUPLICATE_SOURCE_ID');
  checkUnique([...allClaims], 'DUPLICATE_CLAIM_ID');

  for (const profile of catalog.profiles) {
    const roles = new Set(profile.role_instances.map((role) => role.role_id));
    const nodes = new Map(profile.topology_nodes.map((node) => [node.node_id, node]));
    const paths = new Map(profile.paths.map((pathItem) => [pathItem.path_id, pathItem]));
    const surfaces = new Set(profile.control_surfaces.map((surface) => surface.surface_id));
    const observations = new Set(profile.observation_points.map((point) => point.observation_id));
    const capabilities = new Set(profile.finder_capabilities.map((capability) => capability.capability_id));
    const stages = new Set(profile.lifecycle_stages.map((stage) => stage.stage_id));
    checkUnique([...roles], 'DUPLICATE_ROLE_ID');
    checkUnique([...nodes.keys()], 'DUPLICATE_NODE_ID');
    checkUnique([...paths.keys()], 'DUPLICATE_PATH_ID');
    for (const role of profile.role_instances) {
      for (const claimId of role.source_claim_ids ?? []) check(allClaims.has(claimId), 'UNKNOWN_SOURCE_CLAIM', `${profile.profile_id}:${role.role_id}:${claimId}`);
      for (const stageId of role.lifecycle_stage_ids ?? []) check(stages.has(stageId), 'UNKNOWN_LIFECYCLE_STAGE', `${role.role_id}:${stageId}`);
    }
    for (const node of nodes.values()) {
      for (const roleId of node.role_ids) check(roles.has(roleId), 'UNKNOWN_NODE_ROLE', `${node.node_id}:${roleId}`);
      for (const claimId of node.source_claim_ids ?? []) check(allClaims.has(claimId), 'UNKNOWN_SOURCE_CLAIM', `${node.node_id}:${claimId}`);
    }
    for (const edge of profile.topology_edges) {
      check(nodes.has(edge.from_node_id) && nodes.has(edge.to_node_id), 'UNKNOWN_EDGE_NODE', `${edge.edge_id}:${edge.from_node_id}->${edge.to_node_id}`);
      for (const claimId of edge.source_claim_ids ?? []) check(allClaims.has(claimId), 'UNKNOWN_SOURCE_CLAIM', `${edge.edge_id}:${claimId}`);
    }
    check(!graphHasCycle([...nodes.keys()], profile.topology_edges.map((edge) => [edge.from_node_id, edge.to_node_id])), 'TOPOLOGY_CYCLE', profile.profile_id);
    for (const pathItem of paths.values()) {
      for (const nodeId of pathItem.node_ids) check(nodes.has(nodeId), 'UNKNOWN_PATH_NODE', `${pathItem.path_id}:${nodeId}`);
      for (let index = 1; index < pathItem.node_ids.length; index += 1) {
        const from = pathItem.node_ids[index - 1];
        const to = pathItem.node_ids[index];
        check(profile.topology_edges.some((edge) => edge.from_node_id === from && edge.to_node_id === to), 'DISCONTINUOUS_PATH', `${pathItem.path_id}:${from}->${to}`);
      }
    }
    for (const relation of profile.lifecycle_relations) {
      check(stages.has(relation.from_stage_id) && stages.has(relation.to_stage_id), 'UNKNOWN_LIFECYCLE_RELATION_STAGE', relation.relation_id);
    }
    check(!graphHasCycle([...stages], profile.lifecycle_relations.map((relation) => [relation.from_stage_id, relation.to_stage_id])), 'LIFECYCLE_CYCLE', profile.profile_id);
    for (const attachment of profile.action_attachments) {
      for (const nodeId of attachment.target_node_ids) check(nodes.has(nodeId), 'UNKNOWN_ATTACHMENT_NODE', `${attachment.attachment_id}:${nodeId}`);
      for (const pathId of attachment.target_path_ids) check(paths.has(pathId), 'UNKNOWN_ATTACHMENT_PATH', `${attachment.attachment_id}:${pathId}`);
      for (const surfaceId of attachment.control_surface_ids) check(surfaces.has(surfaceId), 'UNKNOWN_ATTACHMENT_SURFACE', `${attachment.attachment_id}:${surfaceId}`);
      for (const pointId of attachment.observation_point_ids) check(observations.has(pointId), 'UNKNOWN_ATTACHMENT_OBSERVATION', `${attachment.attachment_id}:${pointId}`);
      for (const capabilityId of attachment.required_capability_ids ?? []) check(capabilities.has(capabilityId), 'UNKNOWN_ATTACHMENT_CAPABILITY', `${attachment.attachment_id}:${capabilityId}`);
      for (const claimId of attachment.source_claim_ids) check(allClaims.has(claimId), 'UNKNOWN_SOURCE_CLAIM', `${attachment.attachment_id}:${claimId}`);
    }
  }

  const storyProfile = profileById.get(STORY_PROFILE_ID);
  check(Boolean(storyProfile), 'MISSING_STORY_PROFILE', STORY_PROFILE_ID);
  const bindingByTicket = new Map(bindings.bindings.map((binding) => [binding.ticket_id, binding]));
  const proofByTicket = new Map(privateValidation.compatibility_proofs.map((proof) => [proof.ticket_id, proof]));
  for (const ticket of releasedTickets) {
    const binding = bindingByTicket.get(ticket.ticket_id);
    const proof = proofByTicket.get(ticket.ticket_id);
    check(Boolean(binding), 'MISSING_BINDING', ticket.ticket_id);
    check(Boolean(proof), 'MISSING_PROOF', ticket.ticket_id);
    if (!binding || !proof) continue;
    check(binding.fingerprint_id === ticket.fingerprint_id, 'FINGERPRINT_DRIFT', ticket.ticket_id);
    check(binding.ticket_snapshot_digest === ticket.ticket_snapshot_digest, 'TICKET_DIGEST_DRIFT', ticket.ticket_id);
    check(compareJson(sorted(binding.public_surface.public_symptom_ids), sorted(ticket.public_symptom_ids)), 'SYMPTOM_CLOSURE', ticket.ticket_id);
    check(compareJson(sorted(binding.public_surface.public_candidate_fault_ids), sorted(ticket.public_candidate_fault_ids)), 'PUBLIC_SURFACE_CANDIDATE_CLOSURE', ticket.ticket_id);
    check(compareJson(sorted(binding.candidate_closure.map((row) => row.candidate_fault_id)), sorted(ticket.public_candidate_fault_ids)), 'BINDING_CANDIDATE_CLOSURE', ticket.ticket_id);
    const profile = profileById.get(binding.profile_ref.profile_id);
    check(Boolean(profile), 'UNKNOWN_BOUND_PROFILE', `${ticket.ticket_id}:${binding.profile_ref.profile_id}`);
    if (profile) {
      check(binding.profile_ref.profile_revision === profile.profile_revision && binding.profile_ref.profile_content_digest === profile.serialization.content_digest, 'PROFILE_PIN_DRIFT', ticket.ticket_id);
      const nodes = new Set(profile.topology_nodes.map((node) => node.node_id));
      const paths = new Set(profile.paths.map((pathItem) => pathItem.path_id));
      const capabilities = new Set(profile.finder_capabilities.map((capability) => capability.capability_id));
      for (const capabilityId of binding.public_requirement_capability_ids) check(capabilities.has(capabilityId), 'UNKNOWN_BINDING_CAPABILITY', `${ticket.ticket_id}:${capabilityId}`);
      for (const candidate of binding.candidate_closure) {
        for (const nodeId of candidate.public_node_ids) check(nodes.has(nodeId), 'UNKNOWN_CANDIDATE_NODE', `${ticket.ticket_id}:${nodeId}`);
        for (const pathId of candidate.public_path_ids) check(paths.has(pathId), 'UNKNOWN_CANDIDATE_PATH', `${ticket.ticket_id}:${pathId}`);
      }
      const attachments = new Map(profile.action_attachments.map((attachment) => [attachment.attachment_id, attachment]));
      for (const requirement of proof.authored_action_requirements) {
        const attachment = attachments.get(requirement.attachment_id);
        check(Boolean(attachment), 'UNKNOWN_PROOF_ATTACHMENT', `${ticket.ticket_id}:${requirement.attachment_id}`);
        check(attachment?.action_definition_id === requirement.action_definition_id, 'PROOF_ACTION_ATTACHMENT_MISMATCH', `${ticket.ticket_id}:${requirement.action_definition_id}`);
      }
      const roles = new Set(profile.role_instances.map((role) => role.role_id));
      for (const hiddenBinding of proof.hidden_fault_bindings) {
        for (const roleId of hiddenBinding.target_role_ids) check(roles.has(roleId), 'UNKNOWN_PRIVATE_ROLE', `${ticket.ticket_id}:${roleId}`);
        for (const nodeId of hiddenBinding.target_node_ids) check(nodes.has(nodeId), 'UNKNOWN_PRIVATE_NODE', `${ticket.ticket_id}:${nodeId}`);
        for (const claimId of hiddenBinding.source_claim_ids) check(allClaims.has(claimId), 'UNKNOWN_PRIVATE_CLAIM', `${ticket.ticket_id}:${claimId}`);
      }
    }
    check(proof.binding_id === binding.binding_id, 'PROOF_BINDING_MISMATCH', ticket.ticket_id);
    check(proof.ticket_snapshot_digest === ticket.ticket_snapshot_digest, 'PROOF_TICKET_DIGEST_DRIFT', ticket.ticket_id);
    check(proof.differential_variants.length === ticket.public_candidate_fault_ids.length, 'DIFFERENTIAL_VARIANT_COUNT', ticket.ticket_id);
    check(proof.differential_variants.every((variant) => variant.expected_public_binding_digest === binding.serialization.content_digest), 'DIFFERENTIAL_BINDING_DRIFT', ticket.ticket_id);
    check(compareJson(sorted(proof.differential_variants.flatMap((variant) => variant.synthetic_hidden_fault_ids)), sorted(ticket.public_candidate_fault_ids)), 'DIFFERENTIAL_CANDIDATE_CLOSURE', ticket.ticket_id);
  }

  const domainSets = {
    faults: unique(releasedTickets.flatMap((ticket) => ticket.public_candidate_fault_ids)),
    symptoms: unique(releasedTickets.flatMap((ticket) => ticket.public_symptom_ids)),
    diagnostics: unique(releasedTickets.flatMap((ticket) => ticket.diagnostics.relevant_source_ids)),
    repairs: unique(releasedTickets.flatMap((ticket) => ticket.repair_procedure_ids)),
    verifications: unique(releasedTickets.flatMap((ticket) => ticket.validation_procedure_ids)),
  };
  const relationshipSources = new Set(overlay.relationships.flatMap((relationship) => relationship.source_object_ids));
  for (const [category, ids] of Object.entries(domainSets)) {
    for (const id of ids) check(relationshipSources.has(id), 'MISSING_DOMAIN_RELATIONSHIP', `${category}:${id}`);
  }
  const allAttachments = new Set(catalog.profiles.flatMap((profile) => profile.action_attachments.map((attachment) => attachment.action_definition_id)));
  for (const id of [...domainSets.diagnostics, ...domainSets.repairs, ...domainSets.verifications]) {
    check(allAttachments.has(id), 'MISSING_ACTION_ATTACHMENT', id);
  }
  for (const relationship of overlay.relationships) {
    for (const target of relationship.targets) {
      const profile = profileById.get(target.profile_id);
      check(Boolean(profile), 'UNKNOWN_RELATIONSHIP_PROFILE', `${relationship.relationship_id}:${target.profile_id}`);
      if (!profile) continue;
      const roles = new Set(profile.role_instances.map((role) => role.role_id));
      const nodes = new Set(profile.topology_nodes.map((node) => node.node_id));
      const paths = new Set(profile.paths.map((pathItem) => pathItem.path_id));
      for (const roleId of target.role_ids) check(roles.has(roleId), 'UNKNOWN_RELATIONSHIP_ROLE', `${relationship.relationship_id}:${roleId}`);
      for (const nodeId of target.node_ids) check(nodes.has(nodeId), 'UNKNOWN_RELATIONSHIP_NODE', `${relationship.relationship_id}:${nodeId}`);
      for (const pathId of target.path_ids) check(paths.has(pathId), 'UNKNOWN_RELATIONSHIP_PATH', `${relationship.relationship_id}:${pathId}`);
    }
    for (const claimId of relationship.source_claim_ids) check(allClaims.has(claimId), 'UNKNOWN_RELATIONSHIP_CLAIM', `${relationship.relationship_id}:${claimId}`);
  }

  check(migration.added_component_ids.length === 0, 'ADDED_COMPONENTS', JSON.stringify(migration.added_component_ids));
  const pilotMigration = readJson(`${PILOT_ROOT}/migration-v1.json`);
  check(compareJson(sorted(migration.preserved_component_ids), sorted(pilotMigration.added_component_ids)), 'SUCCESSOR_COMPONENT_PRESERVATION', 'TASK-051 pilot successor Component IDs changed');
  check(migration.ticket_bindings.length === 18, 'MIGRATION_BINDING_COUNT', `${migration.ticket_bindings.length}`);
  for (const issue of verifyImmutableInputs()) issues.push({ code: 'IMMUTABLE_INPUT_DRIFT', detail: issue });

  check(coverageLedger.blocking_gaps.length === 0, 'BLOCKING_GAPS', JSON.stringify(coverageLedger.blocking_gaps));
  check(coverageLedger.coverage.ticket_instances.covered === 18 && coverageLedger.coverage.ticket_instances.total === 18, 'COVERAGE_BINDINGS', JSON.stringify(coverageLedger.coverage.ticket_instances));
  check(coverageLedger.coverage.hidden_authored_paths.covered === 18 && coverageLedger.coverage.hidden_authored_paths.total === 18, 'COVERAGE_PROOFS', JSON.stringify(coverageLedger.coverage.hidden_authored_paths));
  check(coverageLedger.declared_denominator.public_candidate_occurrences === 64 && coverageLedger.coverage.public_candidate_sets.percent === 100, 'COVERAGE_CANDIDATES', JSON.stringify(coverageLedger.coverage.public_candidate_sets));
  check(coverageLedger.declared_denominator.action_ticket_occurrences === 348 && coverageLedger.coverage.actions_with_justified_paths.covered === 76 && coverageLedger.coverage.actions_with_justified_paths.total === 76, 'COVERAGE_ACTIONS', JSON.stringify(coverageLedger.coverage.actions_with_justified_paths));
  check(coverageLedger.domain_matrix.public_candidate_fault_ids.length === 36 && coverageLedger.domain_matrix.intentionally_unbound_public_symptom_ids.length === 19 && coverageLedger.domain_matrix.relevant_diagnostic_ids.length === 43 && coverageLedger.domain_matrix.repair_ids.length === 18 && coverageLedger.domain_matrix.verification_ids.length === 15, 'DOMAIN_MATRIX', JSON.stringify(coverageLedger.domain_matrix));

  const publicLeakFindings = [...findPrivateKeys(catalog), ...findPrivateKeys(bindings)];
  check(publicLeakFindings.length === 0, 'PUBLIC_PRIVATE_LEAK', publicLeakFindings.join(', '));

  check(manifest.generated_files.length === 8 && manifest.schema_files.length === 7, 'MANIFEST_FILE_COUNTS', `generated=${manifest.generated_files.length}; schemas=${manifest.schema_files.length}`);
  for (const file of [...manifest.generated_files, ...manifest.schema_files]) {
    const absolutePath = path.join(ROOT, file.path);
    check(fs.existsSync(absolutePath), 'MANIFEST_MISSING_FILE', file.path);
    if (fs.existsSync(absolutePath)) check(digest(fs.readFileSync(absolutePath)) === file.sha256, 'MANIFEST_DIGEST_DRIFT', file.path);
  }
  for (const input of manifest.immutable_inputs) {
    const absolutePath = path.join(ROOT, input.path);
    check(fs.existsSync(absolutePath) && digest(fs.readFileSync(absolutePath)) === input.sha256, 'MANIFEST_INPUT_DRIFT', input.path);
  }

  if (checkGenerated) {
    for (const [relativePath, expected] of expectedFiles()) {
      const absolutePath = path.join(ROOT, relativePath);
      check(fs.existsSync(absolutePath), 'MISSING_GENERATED_FILE', relativePath);
      if (fs.existsSync(absolutePath)) check(fs.readFileSync(absolutePath, 'utf8') === expected, 'STALE_GENERATED_FILE', relativePath);
    }
  }

  return {
    ok: issues.length === 0,
    issues,
    totals: {
      matches: 12,
      ticket_instances: releasedTickets.length,
      unique_fingerprints: new Set(releasedTickets.map((ticket) => ticket.fingerprint_id)).size,
      profiles: catalog.profiles.length,
      preserved_pilot_bindings: pilotBindings.bindings.length,
      new_bindings: bindings.bindings.length - pilotBindings.bindings.length,
      bindings: bindings.bindings.length,
      private_proofs: privateValidation.compatibility_proofs.length,
      relationships: overlay.relationships.length,
      unique_candidates: domainSets.faults.length,
      candidate_occurrences: releasedTickets.reduce((sum, ticket) => sum + ticket.public_candidate_fault_ids.length, 0),
      unique_actions: unique([...domainSets.diagnostics, ...domainSets.repairs, ...domainSets.verifications]).length,
      source_records: sourceLedger.sources.length,
      source_claims: allClaims.size,
      added_components: migration.added_component_ids.length,
    },
  };
}

const isEntryPoint = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntryPoint) {
  const result = validateReleasedStorySystemModel();
  if (!result.ok) {
    for (const issue of result.issues) console.error(`${issue.code}: ${issue.detail}`);
    console.error(`Released Story System Model validation failed with ${result.issues.length} issue(s).`);
    process.exitCode = 1;
  } else {
    console.log(`Released Story System Model validation passed: ${result.totals.ticket_instances}/18 Tickets, ${result.totals.bindings}/18 bindings, ${result.totals.private_proofs}/18 proofs, ${result.totals.relationships} relationships, ${result.totals.added_components} added Components.`);
  }
}
