import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  canonicalJson,
  expectedFiles,
  verifyImmutableInputs,
} from './build-release.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');

const RELEASE_FILES = Object.freeze({
  catalog: 'content/system-model-pilot-v1/system-model-catalog-v1.json',
  bindings: 'content/system-model-pilot-v1/ticket-system-bindings-v1.json',
  privateValidation: 'content/system-model-pilot-v1/private-compatibility-v1.json',
  overlay: 'content/system-model-pilot-v1/domain-relationship-overlay-v1.json',
  migration: 'content/system-model-pilot-v1/migration-v1.json',
  manifest: 'content/system-model-pilot-v1/RELEASE-MANIFEST.json',
  components: 'viewer/content/system-model-pilot-v1-components.json',
});

const PILOT_TICKET_IDS = Object.freeze([
  'ticket.generated.3ec80b1b0e7221ac725aedf9',
  'ticket.generated.5352abd871c2e9076be92a0b',
  'ticket.generated.3fd6eb04534f79b5b3f87f98',
  'ticket.generated.b34238282822e93980b5f1ad',
  'ticket.generated.f32b85cbf2054fdf0114f42a',
]);

const REQUIRED_PLANES = Object.freeze([
  'power', 'management', 'host_firmware_post', 'memory', 'storage', 'network', 'os_handoff', 'runtime_service',
]);

const FORBIDDEN_PUBLIC_KEYS = Object.freeze([
  'server_only_truth', 'hidden_fault_ids', 'hidden_true_fault_ids', 'synthetic_hidden_fault_ids',
  'authored_evidence_outcomes', 'authored_result_reference', 'compatibility_proofs', 'validation_result',
]);

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function fileSha256(relativePath) {
  return sha256(fs.readFileSync(path.join(ROOT, relativePath)));
}

function collectTicketRecords(value, found = new Map()) {
  if (!value || typeof value !== 'object') return found;
  if (Array.isArray(value)) {
    for (const item of value) collectTicketRecords(item, found);
    return found;
  }
  if (PILOT_TICKET_IDS.includes(value.ticket_id) && Array.isArray(value.public_candidate_fault_ids)) {
    found.set(value.ticket_id, value);
  }
  for (const child of Object.values(value)) collectTicketRecords(child, found);
  return found;
}

function loadViewerRecords() {
  const records = [];
  const directory = path.join(ROOT, 'viewer/content');
  for (const name of fs.readdirSync(directory).filter((entry) => entry.endsWith('.json') && entry !== 'manifest.json').sort()) {
    const pack = readJson(`viewer/content/${name}`);
    if (Array.isArray(pack.entities)) records.push(...pack.entities);
  }
  return records;
}

function loadBundle() {
  return Object.fromEntries(Object.entries(RELEASE_FILES).map(([key, relativePath]) => [key, readJson(relativePath)]));
}

function duplicateIds(values) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates].sort();
}

function assertKnown(values, known, context, issues) {
  for (const value of values) {
    if (!known.has(value)) issues.push(`${context} references unknown ${value}`);
  }
}

function validateDigest(value, context, issues) {
  if (!value?.serialization) {
    issues.push(`${context} has no serialization record`);
    return;
  }
  const copy = structuredClone(value);
  const expected = copy.serialization.content_digest;
  delete copy.serialization;
  const actual = sha256(canonicalJson(copy));
  if (expected !== actual) issues.push(`${context} digest mismatch: expected ${expected}, found ${actual}`);
}

function findCycle(nodeIds, edges) {
  const adjacency = new Map(nodeIds.map((id) => [id, []]));
  for (const [from, to] of edges) {
    if (adjacency.has(from)) adjacency.get(from).push(to);
  }
  const visiting = new Set();
  const visited = new Set();
  function visit(id, route) {
    if (visiting.has(id)) return [...route, id];
    if (visited.has(id)) return null;
    visiting.add(id);
    for (const next of adjacency.get(id) ?? []) {
      const cycle = visit(next, [...route, id]);
      if (cycle) return cycle;
    }
    visiting.delete(id);
    visited.add(id);
    return null;
  }
  for (const id of nodeIds) {
    const cycle = visit(id, []);
    if (cycle) return cycle;
  }
  return null;
}

function collectForbiddenPublicKeys(value, pathParts = [], issues = []) {
  if (!value || typeof value !== 'object') return issues;
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectForbiddenPublicKeys(item, [...pathParts, index], issues));
    return issues;
  }
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_PUBLIC_KEYS.includes(key)) issues.push(`public payload contains forbidden key ${[...pathParts, key].join('.')}`);
    collectForbiddenPublicKeys(child, [...pathParts, key], issues);
  }
  return issues;
}

function validateProfile(profile, context, domainById, claimIds, templateIds, issues) {
  validateDigest(profile, context, issues);
  const roleIds = new Set(profile.role_instances.map((item) => item.role_id));
  const nodeIds = new Set(profile.topology_nodes.map((item) => item.node_id));
  const edgeIds = new Set(profile.topology_edges.map((item) => item.edge_id));
  const pathIds = new Set(profile.paths.map((item) => item.path_id));
  const stageIds = new Set(profile.lifecycle_stages.map((item) => item.stage_id));
  const surfaceIds = new Set(profile.control_surfaces.map((item) => item.surface_id));
  const observationIds = new Set(profile.observation_points.map((item) => item.observation_id));
  const capabilityIds = new Set(profile.finder_capabilities.map((item) => item.capability_id));
  const attachmentIds = new Set(profile.action_attachments.map((item) => item.attachment_id));

  const identityFamilies = [
    ['role', profile.role_instances.map((item) => item.role_id)],
    ['node', profile.topology_nodes.map((item) => item.node_id)],
    ['edge', profile.topology_edges.map((item) => item.edge_id)],
    ['path', profile.paths.map((item) => item.path_id)],
    ['stage', profile.lifecycle_stages.map((item) => item.stage_id)],
    ['surface', profile.control_surfaces.map((item) => item.surface_id)],
    ['observation', profile.observation_points.map((item) => item.observation_id)],
    ['capability', profile.finder_capabilities.map((item) => item.capability_id)],
    ['attachment', profile.action_attachments.map((item) => item.attachment_id)],
  ];
  for (const [family, ids] of identityFamilies) {
    for (const duplicate of duplicateIds(ids)) issues.push(`${context} duplicates ${family} ID ${duplicate}`);
  }

  if (canonicalJson(profile.plane_declarations.map((item) => item.plane).sort()) !== canonicalJson([...REQUIRED_PLANES].sort())) {
    issues.push(`${context} must declare every required plane exactly once`);
  }
  for (const role of profile.role_instances) {
    if (role.component_definition_id === null) {
      if (role.synchronization_status !== 'OUT_OF_SCOPE_ABSTRACTION') issues.push(`${context}/${role.role_id} omits a Component without an out-of-scope abstraction`);
    } else if (domainById.get(role.component_definition_id)?.entity_type !== 'component') {
      issues.push(`${context}/${role.role_id} references missing Component ${role.component_definition_id}`);
    }
    assertKnown(role.lifecycle_stage_ids, stageIds, `${context}/${role.role_id}.lifecycle_stage_ids`, issues);
    assertKnown(role.source_claim_ids, claimIds, `${context}/${role.role_id}.source_claim_ids`, issues);
  }
  for (const node of profile.topology_nodes) {
    assertKnown(node.role_ids, roleIds, `${context}/${node.node_id}.role_ids`, issues);
    assertKnown(node.source_claim_ids, claimIds, `${context}/${node.node_id}.source_claim_ids`, issues);
  }
  for (const edge of profile.topology_edges) {
    if (!nodeIds.has(edge.from_node_id) || !nodeIds.has(edge.to_node_id)) issues.push(`${context}/${edge.edge_id} has a dangling endpoint`);
    if (edge.from_node_id === edge.to_node_id) issues.push(`${context}/${edge.edge_id} is a self-loop`);
    assertKnown(edge.lifecycle_stage_ids, stageIds, `${context}/${edge.edge_id}.lifecycle_stage_ids`, issues);
    assertKnown(edge.source_claim_ids, claimIds, `${context}/${edge.edge_id}.source_claim_ids`, issues);
  }
  const topologyCycle = findCycle([...nodeIds], profile.topology_edges.map((edge) => [edge.from_node_id, edge.to_node_id]));
  if (topologyCycle) issues.push(`${context} contains prohibited topology cycle ${topologyCycle.join(' -> ')}`);
  const edgeById = new Map(profile.topology_edges.map((edge) => [edge.edge_id, edge]));
  for (const modelPath of profile.paths) {
    assertKnown(modelPath.node_ids, nodeIds, `${context}/${modelPath.path_id}.node_ids`, issues);
    assertKnown(modelPath.edge_ids, edgeIds, `${context}/${modelPath.path_id}.edge_ids`, issues);
    assertKnown(modelPath.lifecycle_stage_ids, stageIds, `${context}/${modelPath.path_id}.lifecycle_stage_ids`, issues);
    assertKnown(modelPath.source_claim_ids, claimIds, `${context}/${modelPath.path_id}.source_claim_ids`, issues);
    if (modelPath.start_node_id !== modelPath.node_ids[0] || modelPath.end_node_id !== modelPath.node_ids.at(-1)) issues.push(`${context}/${modelPath.path_id} start/end does not match path order`);
    modelPath.edge_ids.forEach((edgeId, index) => {
      const edge = edgeById.get(edgeId);
      if (edge && (edge.from_node_id !== modelPath.node_ids[index] || edge.to_node_id !== modelPath.node_ids[index + 1])) {
        issues.push(`${context}/${modelPath.path_id} is not directionally continuous at ${edgeId}`);
      }
    });
  }
  for (const relation of profile.lifecycle_relations) {
    if (!stageIds.has(relation.from_stage_id) || !stageIds.has(relation.to_stage_id)) issues.push(`${context}/${relation.relation_id} has a dangling lifecycle endpoint`);
    if (relation.from_stage_id === relation.to_stage_id) issues.push(`${context}/${relation.relation_id} is a lifecycle self-loop`);
    assertKnown(relation.source_claim_ids, claimIds, `${context}/${relation.relation_id}.source_claim_ids`, issues);
  }
  const lifecycleCycle = findCycle([...stageIds], profile.lifecycle_relations.map((relation) => [relation.from_stage_id, relation.to_stage_id]));
  if (lifecycleCycle) issues.push(`${context} contains prohibited lifecycle cycle ${lifecycleCycle.join(' -> ')}`);
  for (const surface of profile.control_surfaces) {
    assertKnown(surface.node_ids, nodeIds, `${context}/${surface.surface_id}.node_ids`, issues);
    assertKnown(surface.lifecycle_stage_ids, stageIds, `${context}/${surface.surface_id}.lifecycle_stage_ids`, issues);
    assertKnown(surface.source_claim_ids, claimIds, `${context}/${surface.surface_id}.source_claim_ids`, issues);
  }
  for (const observation of profile.observation_points) {
    assertKnown([...observation.observer_node_ids, ...observation.subject_node_ids], nodeIds, `${context}/${observation.observation_id}.node_ids`, issues);
    assertKnown(observation.lifecycle_stage_ids, stageIds, `${context}/${observation.observation_id}.lifecycle_stage_ids`, issues);
    assertKnown(observation.source_claim_ids, claimIds, `${context}/${observation.observation_id}.source_claim_ids`, issues);
  }
  for (const capability of profile.finder_capabilities) {
    assertKnown(capability.node_ids, nodeIds, `${context}/${capability.capability_id}.node_ids`, issues);
    assertKnown(capability.source_claim_ids, claimIds, `${context}/${capability.capability_id}.source_claim_ids`, issues);
  }
  for (const attachment of profile.action_attachments) {
    const action = domainById.get(attachment.action_definition_id);
    const expectedEntityType = { TEST: 'test', COMMAND: 'command', REPAIR: 'repair_procedure', VERIFICATION: 'validation_procedure' }[attachment.action_kind];
    if (action?.entity_type !== expectedEntityType) issues.push(`${context}/${attachment.attachment_id} does not resolve a ${expectedEntityType} action`);
    assertKnown(attachment.target_node_ids, nodeIds, `${context}/${attachment.attachment_id}.target_node_ids`, issues);
    assertKnown(attachment.target_path_ids, pathIds, `${context}/${attachment.attachment_id}.target_path_ids`, issues);
    assertKnown(attachment.control_surface_ids, surfaceIds, `${context}/${attachment.attachment_id}.control_surface_ids`, issues);
    assertKnown(attachment.observation_point_ids, observationIds, `${context}/${attachment.attachment_id}.observation_point_ids`, issues);
    assertKnown(attachment.relevant_stage_ids, stageIds, `${context}/${attachment.attachment_id}.relevant_stage_ids`, issues);
    assertKnown(attachment.source_claim_ids, claimIds, `${context}/${attachment.attachment_id}.source_claim_ids`, issues);
    if (!templateIds.has(attachment.rationale_template_id)) issues.push(`${context}/${attachment.attachment_id} references unknown template ${attachment.rationale_template_id}`);
    for (const forbidden of ['cost', 'legal_intent', 'outcome', 'evidence_disposition', 'isolation_eligibility']) {
      if (Object.hasOwn(attachment, forbidden)) issues.push(`${context}/${attachment.attachment_id} contains forbidden authority field ${forbidden}`);
    }
  }
  for (const section of profile.description_program.sections) {
    for (const clause of section.clauses) {
      if (!stageIds.has(clause.stage_id)) issues.push(`${context}/${clause.clause_id} references unknown stage ${clause.stage_id}`);
      if (!templateIds.has(clause.template_id)) issues.push(`${context}/${clause.clause_id} references unknown template ${clause.template_id}`);
      assertKnown(clause.source_claim_ids, claimIds, `${context}/${clause.clause_id}.source_claim_ids`, issues);
    }
  }
  for (const abstraction of profile.public_abstractions) {
    assertKnown(abstraction.represented_node_ids, nodeIds, `${context}/${abstraction.abstraction_id}.represented_node_ids`, issues);
    assertKnown(abstraction.source_claim_ids, claimIds, `${context}/${abstraction.abstraction_id}.source_claim_ids`, issues);
  }
  assertKnown(profile.provenance.source_claim_ids, claimIds, `${context}.provenance.source_claim_ids`, issues);
  assertKnown(profile.synchronization.referenced_component_ids, new Set([...domainById].filter(([, value]) => value.entity_type === 'component').map(([id]) => id)), `${context}.synchronization.referenced_component_ids`, issues);
  return { roleIds, nodeIds, pathIds, stageIds, capabilityIds, attachmentIds };
}

export function validateReleaseBundle(bundle = loadBundle()) {
  const issues = [];
  const sourceLedger = readJson('docs/system-models/task-050/source-ledger.json');
  const claimIds = new Set(sourceLedger.sources.flatMap((source) => source.claim_ids));
  const audit = readJson('docs/system-models/task-050/component-relationship-audit.json');
  const releasedCoverage = readJson('docs/story/coverage/released-story-domain-coverage-v3.json');
  const tickets = collectTicketRecords(releasedCoverage);
  const viewerRecords = loadViewerRecords();
  const domainById = new Map(viewerRecords.map((record) => [record.id, record]));
  const templateIds = new Set(bundle.catalog.templates.map((template) => template.template_id));
  const profileById = new Map(bundle.catalog.profiles.map((profile) => [profile.profile_id, profile]));
  const profileRefs = new Map();

  for (const duplicate of duplicateIds(viewerRecords.map((record) => record.id))) issues.push(`viewer domain duplicates entity ID ${duplicate}`);
  for (const duplicate of duplicateIds(bundle.catalog.profiles.map((profile) => profile.profile_id))) issues.push(`catalog duplicates profile ID ${duplicate}`);
  validateDigest(bundle.catalog, 'catalog', issues);
  for (const profile of bundle.catalog.profiles) {
    profileRefs.set(profile.profile_id, validateProfile(profile, `profile ${profile.profile_id}`, domainById, claimIds, templateIds, issues));
  }
  collectForbiddenPublicKeys(bundle.catalog, ['catalog'], issues);

  validateDigest(bundle.bindings, 'binding catalog', issues);
  collectForbiddenPublicKeys(bundle.bindings, ['bindings'], issues);
  const bindingById = new Map(bundle.bindings.bindings.map((binding) => [binding.binding_id, binding]));
  for (const duplicate of duplicateIds(bundle.bindings.bindings.map((binding) => binding.binding_id))) issues.push(`binding catalog duplicates ${duplicate}`);
  if (canonicalJson(bundle.bindings.bindings.map((binding) => binding.ticket_id).sort()) !== canonicalJson([...PILOT_TICKET_IDS].sort())) issues.push('binding catalog is not the exact five-Ticket atlas denominator');
  for (const binding of bundle.bindings.bindings) {
    validateDigest(binding, `binding ${binding.binding_id}`, issues);
    const ticket = tickets.get(binding.ticket_id);
    const profile = profileById.get(binding.profile_ref.profile_id);
    const refs = profileRefs.get(binding.profile_ref.profile_id);
    if (!ticket) issues.push(`binding ${binding.binding_id} references a non-pilot Ticket`);
    if (!profile) issues.push(`binding ${binding.binding_id} references missing profile ${binding.profile_ref.profile_id}`);
    if (profile && binding.profile_ref.profile_content_digest !== profile.serialization.content_digest) issues.push(`binding ${binding.binding_id} pins the wrong profile digest`);
    if (ticket) {
      if (binding.ticket_snapshot_digest !== ticket.ticket_snapshot_digest) issues.push(`binding ${binding.binding_id} changes Ticket snapshot identity`);
      if (binding.fingerprint_id !== ticket.fingerprint_id) issues.push(`binding ${binding.binding_id} changes fingerprint identity`);
      if (canonicalJson(binding.public_surface.public_symptom_ids) !== canonicalJson(ticket.public_symptom_ids)) issues.push(`binding ${binding.binding_id} changes public Symptoms`);
      if (canonicalJson(binding.public_surface.public_candidate_fault_ids) !== canonicalJson(ticket.public_candidate_fault_ids)) issues.push(`binding ${binding.binding_id} changes public Candidates`);
      const publicSurface = { public_symptom_ids: binding.public_surface.public_symptom_ids, public_candidate_fault_ids: binding.public_surface.public_candidate_fault_ids };
      if (binding.public_surface.public_surface_digest !== sha256(canonicalJson(publicSurface))) issues.push(`binding ${binding.binding_id} has a stale public-surface digest`);
      if (canonicalJson(binding.candidate_closure.map((item) => item.candidate_fault_id)) !== canonicalJson(ticket.public_candidate_fault_ids)) issues.push(`binding ${binding.binding_id} candidate closure is incomplete or reordered`);
    }
    if (profile && refs) {
      assertKnown(binding.public_requirement_capability_ids, refs.capabilityIds, `binding ${binding.binding_id}.public requirements`, issues);
      for (const closure of binding.candidate_closure) {
        assertKnown(closure.public_node_ids, refs.nodeIds, `binding ${binding.binding_id}/${closure.candidate_fault_id}.nodes`, issues);
        assertKnown(closure.public_path_ids, refs.pathIds, `binding ${binding.binding_id}/${closure.candidate_fault_id}.paths`, issues);
      }
    }
  }

  validateDigest(bundle.privateValidation, 'private validation catalog', issues);
  const proofByBinding = new Map(bundle.privateValidation.compatibility_proofs.map((proof) => [proof.binding_id, proof]));
  if (proofByBinding.size !== bundle.privateValidation.compatibility_proofs.length) issues.push('private validation catalog has duplicate binding proofs');
  for (const proof of bundle.privateValidation.compatibility_proofs) {
    validateDigest(proof, `compatibility ${proof.compatibility_id}`, issues);
    const binding = bindingById.get(proof.binding_id);
    const ticket = tickets.get(proof.ticket_id);
    const refs = profileRefs.get(proof.profile_ref.profile_id);
    if (!binding) issues.push(`compatibility ${proof.compatibility_id} references missing binding ${proof.binding_id}`);
    if (!ticket) issues.push(`compatibility ${proof.compatibility_id} references missing Ticket ${proof.ticket_id}`);
    if (binding && proof.ticket_id !== binding.ticket_id) issues.push(`compatibility ${proof.compatibility_id} does not match its public binding Ticket`);
    if (binding && proof.ticket_snapshot_digest !== binding.ticket_snapshot_digest) issues.push(`compatibility ${proof.compatibility_id} changes Ticket digest`);
    if (refs) {
      assertKnown(proof.required_capability_ids, refs.capabilityIds, `compatibility ${proof.compatibility_id}.capabilities`, issues);
      for (const faultBinding of proof.hidden_fault_bindings) {
        assertKnown(faultBinding.target_role_ids, refs.roleIds, `compatibility ${proof.compatibility_id}/${faultBinding.fault_id}.roles`, issues);
        assertKnown(faultBinding.target_node_ids, refs.nodeIds, `compatibility ${proof.compatibility_id}/${faultBinding.fault_id}.nodes`, issues);
        assertKnown(faultBinding.source_claim_ids, claimIds, `compatibility ${proof.compatibility_id}/${faultBinding.fault_id}.claims`, issues);
      }
      for (const requirement of proof.authored_action_requirements) {
        if (!refs.attachmentIds.has(requirement.attachment_id)) issues.push(`compatibility ${proof.compatibility_id} references missing attachment ${requirement.attachment_id}`);
        if (!domainById.has(requirement.action_definition_id)) issues.push(`compatibility ${proof.compatibility_id} references missing action ${requirement.action_definition_id}`);
      }
    }
    if (binding) {
      const expectedVariants = new Set(binding.public_surface.public_candidate_fault_ids);
      const actualVariants = new Set(proof.differential_variants.flatMap((variant) => variant.synthetic_hidden_fault_ids));
      if (canonicalJson([...actualVariants].sort()) !== canonicalJson([...expectedVariants].sort())) issues.push(`compatibility ${proof.compatibility_id} does not cover every hidden differential variant`);
      for (const variant of proof.differential_variants) {
        if (variant.expected_public_binding_digest !== binding.serialization.content_digest) issues.push(`compatibility ${proof.compatibility_id}/${variant.variant_id} would alter its public binding`);
      }
    }
  }
  for (const binding of bundle.bindings.bindings) {
    if (!proofByBinding.has(binding.binding_id)) issues.push(`binding ${binding.binding_id} has no private compatibility proof`);
  }

  validateDigest(bundle.overlay, 'relationship overlay', issues);
  const expectedFindingIds = new Set(audit.relationship_findings.map((finding) => finding.finding_id));
  const actualFindingIds = new Set(bundle.overlay.relationships.map((relationship) => relationship.relationship_id));
  if (canonicalJson([...actualFindingIds].sort()) !== canonicalJson([...expectedFindingIds].sort())) issues.push('relationship overlay does not implement the exact TASK-050 audit denominator');
  for (const relationship of bundle.overlay.relationships) {
    assertKnown(relationship.source_object_ids, new Set(domainById.keys()), `relationship ${relationship.relationship_id}.source_object_ids`, issues);
    if (relationship.implementation_status === 'APPLIED_PROFILE_OVERLAY') {
      if (relationship.targets.length === 0) issues.push(`relationship ${relationship.relationship_id} has no profile target`);
      if (relationship.source_claim_ids.length === 0) issues.push(`relationship ${relationship.relationship_id} has no source claims`);
    } else if (relationship.targets.length !== 0 || relationship.source_claim_ids.length !== 0) {
      issues.push(`relationship ${relationship.relationship_id} intentionally-unbound record must not invent targets or claims`);
    }
    assertKnown(relationship.source_claim_ids, claimIds, `relationship ${relationship.relationship_id}.source_claim_ids`, issues);
    for (const target of relationship.targets) {
      const refs = profileRefs.get(target.profile_id);
      if (!refs) issues.push(`relationship ${relationship.relationship_id} references missing profile ${target.profile_id}`);
      else {
        assertKnown(target.role_ids, refs.roleIds, `relationship ${relationship.relationship_id}.role_ids`, issues);
        assertKnown(target.node_ids, refs.nodeIds, `relationship ${relationship.relationship_id}.node_ids`, issues);
        assertKnown(target.path_ids, refs.pathIds, `relationship ${relationship.relationship_id}.path_ids`, issues);
      }
    }
  }

  validateDigest(bundle.migration, 'migration', issues);
  issues.push(...verifyImmutableInputs().map((issue) => `immutable input drift: ${issue}`));
  for (const input of bundle.migration.immutable_inputs) {
    if (!fs.existsSync(path.join(ROOT, input.path))) issues.push(`migration references missing immutable input ${input.path}`);
    else if (fileSha256(input.path) !== input.sha256) issues.push(`migration immutable digest drift for ${input.path}`);
  }
  const migrationByTicket = new Map(bundle.migration.ticket_bindings.map((binding) => [binding.ticket_id, binding]));
  for (const binding of bundle.bindings.bindings) {
    const migration = migrationByTicket.get(binding.ticket_id);
    if (!migration) issues.push(`binding ${binding.binding_id} has no migration row`);
    else if (migration.prior_ticket_snapshot_digest !== binding.ticket_snapshot_digest) issues.push(`migration changes snapshot for ${binding.ticket_id}`);
  }

  const manifestFiles = new Map(bundle.manifest.generated_files.map((entry) => [entry.path, entry]));
  for (const [key, relativePath] of Object.entries(RELEASE_FILES)) {
    if (key === 'manifest') continue;
    const entry = manifestFiles.get(relativePath);
    if (!entry) issues.push(`release manifest omits ${relativePath}`);
    else if (fileSha256(relativePath) !== entry.sha256) issues.push(`release manifest digest drift for ${relativePath}`);
  }
  for (const entry of bundle.manifest.schema_files) {
    if (!fs.existsSync(path.join(ROOT, entry.path))) issues.push(`release manifest references missing schema ${entry.path}`);
    else if (fileSha256(entry.path) !== entry.sha256) issues.push(`release manifest schema digest drift for ${entry.path}`);
  }
  if (fileSha256(bundle.manifest.generator.path) !== bundle.manifest.generator.sha256) issues.push('release manifest generator digest drift');
  const expected = expectedFiles();
  for (const [relativePath, source] of expected) {
    const absolutePath = path.join(ROOT, relativePath);
    if (!fs.existsSync(absolutePath) || fs.readFileSync(absolutePath, 'utf8') !== source) issues.push(`deterministic release output is stale: ${relativePath}`);
  }

  const sortedIssues = [...new Set(issues)].sort();
  return {
    status: sortedIssues.length === 0 ? 'ACCEPTED' : 'REJECTED_COMPLETE_OR_NONE',
    release: sortedIssues.length === 0 ? bundle : null,
    issues: sortedIssues,
    totals: {
      profiles: bundle.catalog.profiles.length,
      bindings: bundle.bindings.bindings.length,
      private_proofs: bundle.privateValidation.compatibility_proofs.length,
      relationship_findings: bundle.overlay.relationships.length,
      components_added: bundle.components.entities.length,
    },
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = validateReleaseBundle();
  if (result.issues.length > 0) {
    console.error(result.issues.join('\n'));
    process.exitCode = 1;
  } else {
    console.log(`Validated ${result.totals.profiles} profiles, ${result.totals.bindings} bindings, ${result.totals.private_proofs} private proofs, ${result.totals.relationship_findings} relationship findings, and ${result.totals.components_added} added Components.`);
  }
}
