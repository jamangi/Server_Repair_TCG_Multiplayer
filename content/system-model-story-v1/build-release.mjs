import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');

export const RELEASE_ID = 'system-model-story-v1';
export const CONTRACT_VERSION = 'system-model-contract-v1';
export const STORY_PROFILE_ID = 'profile.dell.poweredge-r740xd.hybrid-24x2_5.story-v1';
const PILOT_RELEASE_ID = 'system-model-pilot-v1';
const CANONICALIZATION_VERSION = 'canonical-json-v1';

export const OUTPUT_PATHS = Object.freeze({
  catalog: 'content/system-model-story-v1/system-model-catalog-v2.json',
  bindings: 'content/system-model-story-v1/ticket-system-bindings-v2.json',
  privateValidation: 'content/system-model-story-v1/private-compatibility-v2.json',
  overlay: 'content/system-model-story-v1/domain-relationship-overlay-v2.json',
  migration: 'content/system-model-story-v1/migration-v2.json',
  coverage: 'content/system-model-story-v1/coverage-ledger-v1.json',
  manifest: 'content/system-model-story-v1/RELEASE-MANIFEST.json',
  sourceLedger: 'docs/system-models/task-053/source-ledger-v2.json',
  coverageReport: 'docs/system-models/task-053/RELEASED_STORY_SYSTEM_COVERAGE.md',
});

export const SCHEMA_PATHS = Object.freeze([
  'schemas/domain/system_model_catalog_v2.schema.json',
  'schemas/domain/ticket_system_binding_catalog_v2.schema.json',
  'schemas/domain/system_model_private_validation_catalog_v2.schema.json',
  'schemas/domain/system_model_relationship_overlay_v2.schema.json',
  'schemas/domain/system_model_migration_v2.schema.json',
  'schemas/domain/system_model_release_manifest_v2.schema.json',
  'schemas/domain/released_story_system_coverage.schema.json',
]);

const PILOT_PATHS = Object.freeze({
  catalog: 'content/system-model-pilot-v1/system-model-catalog-v1.json',
  bindings: 'content/system-model-pilot-v1/ticket-system-bindings-v1.json',
  privateValidation: 'content/system-model-pilot-v1/private-compatibility-v1.json',
  overlay: 'content/system-model-pilot-v1/domain-relationship-overlay-v1.json',
  migration: 'content/system-model-pilot-v1/migration-v1.json',
  manifest: 'content/system-model-pilot-v1/RELEASE-MANIFEST.json',
});

const EXTRA_IMMUTABLE_INPUTS = Object.freeze([
  ['content/system-model-pilot-v1/RELEASE-MANIFEST.json', '8a8cbd0d23b491fec1108903e0e55d8148de596af3605c03b32279c78b19646e', 'TASK-051 release manifest'],
  ['content/story-v1/campaigns/quiet-cascade-expansion-v3/matches.json', '9246aa9d1bd570639f334787108f14d5dc424e9fdcf040e32e5e674b81573f7c', 'released Story Match registry'],
]);

const NEW_SOURCE_RECORDS = Object.freeze([
  {
    source_id: 'src.dell.r740xd.processor-heatsink-service',
    kind: 'manufacturer_service_manual',
    title: 'Removing a processor and heat sink module',
    publisher: 'Dell Technologies',
    product_scope: 'PowerEdge R740xd, 14th-generation platform',
    revision: 'Online installation and service manual topic; topic revision not exposed',
    url: 'https://www.dell.com/support/manuals/en-us/poweredge-r740xd/per740xd_ism_pub/removing-a-processor-and-heat-sink-module?guid=guid-58561da8-d3cc-4de7-8596-b240bd2b070c&lang=en-us',
    access_status: 'accessible',
    claim_ids: ['claim.r740xd.cpu-socket-phm-service'],
    claim_scope: 'Exact family-level processor-and-heat-sink module, retention, socket placement, and service boundary; not pin-level repair authority.',
  },
  {
    source_id: 'src.dell.r740xd.memory-install',
    kind: 'manufacturer_service_manual',
    title: 'Installing a memory module',
    publisher: 'Dell Technologies',
    product_scope: 'PowerEdge R740xd, 14th-generation platform',
    revision: 'Online installation and service manual topic; topic revision not exposed',
    url: 'https://www.dell.com/support/manuals/en-us/poweredge-r740xd/per740xd_ism_pub/installing-a-memory-module?guid=guid-60bb0453-1df7-4689-a1a4-6d6305c974ba&lang=en-us',
    access_status: 'accessible',
    claim_ids: ['claim.r740xd.memory-install-verify'],
    claim_scope: 'Exact family-level DIMM seating service and post-install firmware inventory plus embedded-memory-test checks.',
  },
  {
    source_id: 'src.dell.r740xd.memory-guidelines',
    kind: 'manufacturer_service_manual',
    title: 'General memory module installation guidelines',
    publisher: 'Dell Technologies',
    product_scope: 'PowerEdge R740xd, 14th-generation platform',
    revision: 'Online installation and service manual topic; topic revision not exposed',
    url: 'https://www.dell.com/support/manuals/en-us/poweredge-r740xd/per740xd_ism_pub/general-memory-module-installation-guidelines?guid=guid-acbc0f13-dedb-492b-a0b0-18303ded565a',
    access_status: 'accessible',
    claim_ids: ['claim.r740xd.memory-population-channels'],
    claim_scope: 'Exact family-level channel population and compatibility constraints; per-slot routing remains outside the public model.',
  },
  {
    source_id: 'src.dell.r740xd.cooling-fan-service',
    kind: 'manufacturer_service_manual',
    title: 'Removing a cooling fan',
    publisher: 'Dell Technologies',
    product_scope: 'PowerEdge R740xd, 14th-generation platform',
    revision: 'Online installation and service manual topic; topic revision not exposed',
    url: 'https://www.dell.com/support/manuals/en-us/poweredge-r740xd/per740xd_ism_pub/removing-a-cooling-fan?guid=guid-14b708c4-49f0-4c57-9cd2-28a075aa9e36&lang=en-us',
    access_status: 'accessible',
    claim_ids: ['claim.r740xd.cooling-fan-hot-swap'],
    claim_scope: 'Exact family-level individually replaceable, one-at-a-time hot-swap cooling-fan service boundary.',
  },
  {
    source_id: 'src.dell.r740xd.thermal-control',
    kind: 'manufacturer_technical_guide',
    title: 'Dell EMC PowerEdge R740 and R740xd Technical Guide',
    publisher: 'Dell Technologies',
    product_scope: 'PowerEdge R740/R740xd, 14th-generation thermal-control architecture',
    revision: 'Public technical guide PDF; publication revision not exposed in repository metadata',
    url: 'https://i.dell.com/sites/csdocuments/shared-content_data-sheets_documents/en/aa/poweredge_r740_r740xd_technical_guide.pdf',
    access_status: 'accessible',
    claim_ids: ['claim.r740xd.thermal-control'],
    claim_scope: 'Family-level fan-speed control from temperature, inventory, and power-draw feedback; exact sensor bus and thresholds are outside scope.',
  },
  {
    source_id: 'src.dell.r740xd.psu-service',
    kind: 'manufacturer_service_manual',
    title: 'Removing a power supply unit',
    publisher: 'Dell Technologies',
    product_scope: 'PowerEdge R740xd, 14th-generation platform',
    revision: 'Online installation and service manual topic; topic revision not exposed',
    url: 'https://www.dell.com/support/manuals/en-us/poweredge-r740xd/per740xd_ism_pub/removing-a-power-supply-unit?guid=guid-6b61c56b-f8e9-4c8c-8837-89008b8be7bd&lang=en-us',
    access_status: 'accessible',
    claim_ids: ['claim.r740xd.psu-service'],
    claim_scope: 'Exact family-level redundant-PSU one-at-a-time replacement and input-cable service boundary.',
  },
  {
    source_id: 'src.dell.r740xd.network-daughter-card-service',
    kind: 'manufacturer_service_manual',
    title: 'Installing the network daughter card',
    publisher: 'Dell Technologies',
    product_scope: 'PowerEdge R740xd, 14th-generation platform',
    revision: 'Online installation and service manual topic; topic revision not exposed',
    url: 'https://www.dell.com/support/manuals/en-us/poweredge-r740xd/per740xd_ism_pub/install-the-network-daughter-card?guid=guid-92dcd1a0-e335-4370-b6f8-ba893d723d16&lang=en-us',
    access_status: 'accessible',
    claim_ids: ['claim.r740xd.network-daughter-card-service'],
    claim_scope: 'Exact family-level NDC-to-system-board and chassis-port service boundary; peer network and OS configuration remain generalized abstractions.',
  },
]);

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

function prettyJson(value) {
  return `${JSON.stringify(canonicalize(value), null, 2)}\n`;
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function fileSha256(relativePath) {
  return sha256(fs.readFileSync(path.join(ROOT, relativePath)));
}

function withoutSerialization(value) {
  const copy = structuredClone(value);
  delete copy.serialization;
  return copy;
}

function withSerialization(value) {
  return {
    ...value,
    serialization: {
      canonicalization_version: CANONICALIZATION_VERSION,
      digest_algorithm: 'sha256',
      content_digest: sha256(canonicalJson(value)),
    },
  };
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function stableIdFragment(value) {
  return value.replace(/[^a-z0-9._-]/g, '-');
}

function collectReleasedTickets(coverage) {
  return coverage.matches.flatMap((match) => match.tickets.map((ticket) => ({
    ...structuredClone(ticket),
    match_ref: match.match_ref,
    seed: match.seed,
    segment: match.segment,
    shift_number: match.shift_number,
    builder_contract: structuredClone(match.builder_contract),
    builder_proof: structuredClone(match.builder_proof),
    engine_proof: structuredClone(match.engine_proof),
  })));
}

function replaceProfileIdentity(value) {
  if (Array.isArray(value)) return value.map(replaceProfileIdentity);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, replaceProfileIdentity(child)]));
  }
  if (typeof value === 'string') {
    return value.replaceAll('dell.poweredge-r740xd.hybrid-24x2_5.v1', 'dell.poweredge-r740xd.hybrid-24x2_5.story-v1');
  }
  return value;
}

function role({ roleId, label, roleKind = 'PHYSICAL_COMPONENT', purpose, componentId, maximum = 1, unit = 'service_unit', optionality = 'REQUIRED', replaceability, note, stages, claims, status = 'EXISTING_COMPONENT' }) {
  return {
    role_id: roleId,
    label,
    role_kind: roleKind,
    purpose,
    component_definition_id: componentId ?? null,
    multiplicity: { minimum: 1, maximum, unit },
    optionality,
    replaceability,
    serviceability_note: note,
    lifecycle_stage_ids: stages,
    public_visibility: 'PUBLIC',
    synchronization_status: status,
    source_claim_ids: claims,
  };
}

function node(nodeId, label, nodeKind, plane, roleIds, claims) {
  return { node_id: nodeId, label, node_kind: nodeKind, plane, role_ids: roleIds, public_visibility: 'PUBLIC', source_claim_ids: claims };
}

function edge(edgeId, from, to, relationType, label, stages, claims) {
  return {
    edge_id: edgeId,
    from_node_id: from,
    to_node_id: to,
    relation_type: relationType,
    direction: 'DIRECTED',
    cardinality: 'ONE_TO_MANY',
    label,
    lifecycle_stage_ids: stages,
    public_visibility: 'PUBLIC',
    source_claim_ids: claims,
  };
}

function modelPath(pathId, flowKind, nodeIds, edgeIds, stages, claims) {
  return {
    path_id: pathId,
    flow_kind: flowKind,
    node_ids: nodeIds,
    edge_ids: edgeIds,
    start_node_id: nodeIds[0],
    end_node_id: nodeIds.at(-1),
    lifecycle_stage_ids: stages,
    public_visibility: 'PUBLIC',
    source_claim_ids: claims,
  };
}

const ACTION_TARGETS = Object.freeze({
  boot: {
    nodes: ['uefi', 'os', 'drives'], paths: ['path.r740xd.boot-handoff'], surfaces: ['surface.r740xd.uefi', 'surface.r740xd.os'], observations: ['observation.r740xd.firmware-inventory', 'observation.r740xd.os-inventory'], stages: ['firmware_post', 'boot_select', 'os_handoff'], claims: ['claim.r740xd.boot-order-configurable', 'claim.uefi.os-loader-handoff'], target: 'UEFI policy, boot media, and OS handoff', reason: 'observes or restores the documented boot-selection and handoff path',
  },
  compute: {
    nodes: ['board', 'cpu_socket', 'cpu_memory'], paths: ['path.r740xd.compute-socket'], surfaces: ['surface.r740xd.compute-service'], observations: ['observation.r740xd.compute-service'], stages: ['firmware_post', 'service', 'bounded_runtime'], claims: ['claim.r740xd.cpu-socket-phm-service', 'claim.r740xd.2u-dual-cpu-memory'], target: 'system board, processor socket, and processor module', reason: 'observes or services the documented processor-and-socket boundary',
  },
  memory: {
    nodes: ['board', 'memory_channel', 'cpu_memory'], paths: ['path.r740xd.memory-channel'], surfaces: ['surface.r740xd.memory-service', 'surface.r740xd.uefi'], observations: ['observation.r740xd.memory-service'], stages: ['firmware_post', 'service', 'bounded_runtime'], claims: ['claim.r740xd.memory-install-verify', 'claim.r740xd.memory-population-channels'], target: 'memory channels, DIMM population, and firmware inventory', reason: 'observes or services the documented DIMM population and memory-test boundary',
  },
  thermal: {
    nodes: ['bmc', 'fans', 'heatsink', 'cpu_memory'], paths: ['path.r740xd.thermal-service'], surfaces: ['surface.r740xd.thermal-service', 'surface.r740xd.bmc'], observations: ['observation.r740xd.thermal-service'], stages: ['management_init', 'service', 'bounded_runtime'], claims: ['claim.r740xd.cooling-fan-hot-swap', 'claim.r740xd.thermal-control'], target: 'management telemetry, fan row, heatsink, and processor load', reason: 'observes or services the documented cooling and thermal-feedback path',
  },
  power: {
    nodes: ['ac', 'psu', 'board'], paths: ['path.r740xd.power'], surfaces: ['surface.r740xd.power-service', 'surface.r740xd.bmc'], observations: ['observation.r740xd.power-service'], stages: ['standby', 'host_power', 'service', 'bounded_runtime'], claims: ['claim.r740xd.dual-psu', 'claim.r740xd.psu-service'], target: 'external input, redundant PSU pair, and board-power path', reason: 'observes or services the documented redundant-input and PSU boundary',
  },
  network: {
    nodes: ['os', 'network_config', 'network_service', 'nic', 'link'], paths: ['path.r740xd.network-config', 'path.r740xd.network-runtime'], surfaces: ['surface.r740xd.network-config', 'surface.r740xd.network-service'], observations: ['observation.r740xd.network-runtime', 'observation.r740xd.network-config'], stages: ['os_handoff', 'service', 'bounded_runtime'], claims: ['claim.r740xd.network-daughter-card', 'claim.r740xd.network-daughter-card-service', 'claim.uefi.os-loader-handoff'], target: 'OS configuration, network adapter, cable, and bounded peer path', reason: 'queries, services, or verifies the host network path without asserting current legality',
  },
  storage: {
    nodes: ['bmc', 'uefi', 'backplane', 'sas_path', 'nvme_path', 'drives'], paths: ['path.r740xd.sas-storage', 'path.r740xd.nvme-storage'], surfaces: ['surface.r740xd.storage-service', 'surface.r740xd.os', 'surface.r740xd.bmc'], observations: ['observation.r740xd.bmc-inventory', 'observation.r740xd.firmware-inventory', 'observation.r740xd.os-inventory', 'observation.r740xd.physical-service'], stages: ['firmware_post', 'boot_select', 'service', 'bounded_runtime'], claims: ['claim.r740xd.twenty-sas-four-nvme-option', 'claim.r740xd.sas-perc-path', 'claim.r740xd.pcie-nvme-path'], target: 'hybrid backplane, controller branches, and drive service units', reason: 'observes, services, or verifies a documented storage path',
  },
  firmware: {
    nodes: ['bmc', 'board', 'uefi', 'nic'], paths: ['path.r740xd.boot-handoff', 'path.r740xd.network-runtime'], surfaces: ['surface.r740xd.bmc', 'surface.r740xd.uefi'], observations: ['observation.r740xd.bmc-inventory', 'observation.r740xd.firmware-inventory'], stages: ['management_init', 'firmware_post', 'boot_select', 'service', 'bounded_runtime'], claims: ['claim.idrac9.firmware-inventory', 'claim.idrac9.rollback-bios-idrac-raid-nic', 'claim.r740xd.uefi-boot-mode'], target: 'BMC, BIOS/UEFI, adapter firmware, and runtime handoff', reason: 'queries, restores, or verifies documented firmware-bearing roles',
  },
  management: {
    nodes: ['bmc', 'backplane', 'board'], paths: ['path.r740xd.management-storage'], surfaces: ['surface.r740xd.bmc'], observations: ['observation.r740xd.bmc-inventory'], stages: ['standby', 'management_init', 'service', 'bounded_runtime'], claims: ['claim.idrac9.hardware-inventory', 'claim.idrac9.lifecycle-log-categories', 'claim.idrac9.lifecycle-log-timestamps'], target: 'BMC inventory, lifecycle events, and observed component subjects', reason: 'queries, restores, or verifies the documented management observation surface',
  },
  general: {
    nodes: ['board', 'bmc', 'cpu_memory'], paths: ['path.r740xd.power'], surfaces: ['surface.r740xd.bmc', 'surface.r740xd.compute-service'], observations: ['observation.r740xd.bmc-inventory', 'observation.r740xd.compute-service'], stages: ['standby', 'firmware_post', 'service', 'bounded_runtime'], claims: ['claim.r740xd.2u-dual-cpu-memory', 'claim.idrac9.hardware-inventory'], target: 'documented host and management service boundaries', reason: 'observes a bounded profile path without inferring a diagnostic result',
  },
});

function actionSubsystem(actionId) {
  if (actionId.startsWith('command.')) {
    if (/\.(?:dhclient|ip_addr|ip_route|ping)$/.test(actionId)) return 'network';
    if (/\.(?:lsblk|nvme_smart_log|smartctl)$/.test(actionId)) return 'storage';
    return 'general';
  }
  const subsystem = actionId.split('.')[1];
  return ACTION_TARGETS[subsystem] ? subsystem : 'general';
}

function actionKind(entityType) {
  return { test: 'TEST', command: 'COMMAND', repair_procedure: 'REPAIR', validation_procedure: 'VERIFICATION' }[entityType];
}

function actionAttachment(action, profilePrefix) {
  const subsystem = actionSubsystem(action.id);
  const target = ACTION_TARGETS[subsystem];
  const kind = actionKind(action.entity_type);
  const attachmentKind = kind === 'REPAIR'
    ? 'INTERVENES_ON_SERVICE_UNIT'
    : kind === 'VERIFICATION'
      ? 'VERIFIES_STATE'
      : kind === 'COMMAND'
        ? 'QUERIES_CONTROL_SURFACE'
        : 'OBSERVES_COMPONENT_PATH';
  const displayName = action.presentation?.display_name ?? action.id;
  return {
    attachment_id: `attachment.${profilePrefix}.${action.id}`,
    action_definition_id: action.id,
    action_kind: kind,
    attachment_kind: attachmentKind,
    target_node_ids: target.nodes,
    target_path_ids: target.paths,
    control_surface_ids: target.surfaces,
    observation_point_ids: target.observations,
    relevant_stage_ids: target.stages,
    rationale_template_id: 'template.system-model.action-rationale.v1',
    rationale_tokens: [
      { token: 'ACTION_LABEL', value: displayName },
      { token: 'TARGET_LABEL', value: target.target },
      { token: 'REASON', value: target.reason },
    ],
    source_claim_ids: target.claims,
    public_visibility: 'PUBLIC',
    authority_boundary: 'SYSTEM_RELEVANCE_ONLY',
  };
}

function buildStoryProfile(baseProfile, requiredActionIds, domainById) {
  const profile = replaceProfileIdentity(withoutSerialization(baseProfile));
  profile.profile_id = STORY_PROFILE_ID;
  profile.profile_revision = 1;
  profile.identity.model_scope = '24 x 2.5-inch hybrid SAS/SATA/NVMe option with released-Story service envelope';
  profile.identity.exact_details = unique([...profile.identity.exact_details,
    'processor and heat-sink service boundary',
    'DIMM population and verification boundary',
    'individually replaceable cooling fans',
    'redundant PSU service boundary',
    'network daughter-card service boundary',
  ]);
  profile.identity.generalized_details = unique([...profile.identity.generalized_details,
    'OS network configuration and peer-service boundary',
    'per-slot memory and sensor wiring',
  ]);
  profile.option_constraints.push(
    {
      constraint_id: 'constraint.dell.poweredge-r740xd.hybrid-24x2_5.story-v1.05',
      statement: 'Processor/socket, DIMM, cooling-fan, PSU, and NDC service roles remain inside the cited R740xd family procedures; pin-level repair, sensor-bus wiring, and unsupported option combinations remain outside scope.',
      enforcement: 'REQUIRED_FOR_PROFILE',
      source_claim_ids: ['claim.r740xd.cpu-socket-phm-service', 'claim.r740xd.memory-install-verify', 'claim.r740xd.cooling-fan-hot-swap', 'claim.r740xd.psu-service', 'claim.r740xd.network-daughter-card-service'],
    },
  );
  profile.plane_declarations = profile.plane_declarations.map((plane) => {
    if (plane.plane === 'memory') return { ...plane, summary: 'DIMM service units attach through grouped memory-channel paths, train during preboot, and are checked through firmware inventory and embedded diagnostics.', source_claim_ids: ['claim.r740xd.memory-population-channels', 'claim.r740xd.memory-install-verify'] };
    if (plane.plane === 'network') return { ...plane, summary: 'The NDC, physical link, OS configuration, and bounded peer-service path remain separate public roles.', source_claim_ids: ['claim.r740xd.network-daughter-card', 'claim.r740xd.network-daughter-card-service', 'claim.uefi.os-loader-handoff'] };
    if (plane.plane === 'runtime_service') return { ...plane, summary: 'Released-Story service scope includes storage, compute/socket, memory, cooling/load, PSU, management-event, and host-network verification boundaries.', source_claim_ids: ['claim.r740xd.cpu-socket-phm-service', 'claim.r740xd.memory-install-verify', 'claim.r740xd.thermal-control', 'claim.r740xd.psu-service', 'claim.r740xd.network-daughter-card-service'] };
    return plane;
  });
  for (const existingRole of profile.role_instances) {
    if (!existingRole.lifecycle_stage_ids.includes('service') && ['role.psu_pair', 'role.cpu', 'role.memory', 'role.fans', 'role.hybrid_backplane', 'role.sas_cable', 'role.pcie_cable', 'role.perc', 'role.nvme', 'role.sas_drives', 'role.nic', 'role.network_cable', 'role.system_bios', 'role.bmc'].includes(existingRole.role_id)) {
      existingRole.lifecycle_stage_ids.push('service');
    }
  }
  profile.role_instances.push(
    role({ roleId: 'role.cpu_socket', label: 'CPU socket contact field', purpose: 'Connects a processor module to board power, memory, and host buses', componentId: 'component.compute.cpu_socket', maximum: 2, unit: 'sockets', replaceability: 'NOT_SEPARATE_SERVICE_UNIT', note: 'Board-mounted inspection boundary; not a separately replaceable unit', stages: ['firmware_post', 'service', 'bounded_runtime'], claims: ['claim.r740xd.cpu-socket-phm-service'] }),
    role({ roleId: 'role.memory_channel', label: 'Memory channel path', roleKind: 'INTERCONNECT_ROLE', purpose: 'Connects a documented DIMM population to its processor memory controller', componentId: 'component.memory.channel', maximum: 12, unit: 'grouped_channels', optionality: 'PROFILE_CONSTRAINED', replaceability: 'NOT_SEPARATE_SERVICE_UNIT', note: 'Grouped logical/electrical path; exact per-slot wiring is intentionally omitted', stages: ['firmware_post', 'service', 'bounded_runtime'], claims: ['claim.r740xd.memory-population-channels'] }),
    role({ roleId: 'role.cpu_heatsink', label: 'Processor heat-sink module', purpose: 'Transfers processor heat into the managed chassis airflow', componentId: 'component.cooling.cpu_heatsink', maximum: 2, unit: 'modules', replaceability: 'REPLACEABLE_SERVICE_UNIT', note: 'Processor-and-heat-sink module service boundary', stages: ['service', 'bounded_runtime'], claims: ['claim.r740xd.cpu-socket-phm-service', 'claim.r740xd.thermal-control'] }),
    role({ roleId: 'role.os_network_config', label: 'OS network configuration', roleKind: 'LOGICAL_ROLE', purpose: 'Represents host address and route state after OS handoff', componentId: null, replaceability: 'OUTSIDE_SCOPE', note: 'Public logical abstraction; not a physical Component or Match permission', stages: ['os_handoff', 'service', 'bounded_runtime'], claims: ['claim.uefi.os-loader-handoff', 'claim.r740xd.network-daughter-card'], status: 'OUT_OF_SCOPE_ABSTRACTION' }),
    role({ roleId: 'role.network_service', label: 'Bounded peer network service', roleKind: 'PUBLIC_ABSTRACTION', purpose: 'Represents DHCP, gateway, and required remote-service boundaries without modeling external infrastructure', componentId: null, replaceability: 'OUTSIDE_SCOPE', note: 'Honest external abstraction; peer implementation and health are not asserted', stages: ['service', 'bounded_runtime'], claims: ['claim.uefi.os-loader-handoff', 'claim.r740xd.network-daughter-card'], status: 'OUT_OF_SCOPE_ABSTRACTION' }),
  );
  profile.topology_nodes.push(
    node('cpu_socket', 'CPU socket contact field', 'COMPONENT_INSTANCE', 'host_firmware_post', ['role.cpu_socket'], ['claim.r740xd.cpu-socket-phm-service']),
    node('memory_channel', 'Grouped memory-channel path', 'BUS_OR_LINK', 'memory', ['role.memory_channel'], ['claim.r740xd.memory-population-channels']),
    node('heatsink', 'Processor heat-sink module', 'SERVICEABLE_UNIT', 'runtime_service', ['role.cpu_heatsink'], ['claim.r740xd.cpu-socket-phm-service', 'claim.r740xd.thermal-control']),
    node('network_config', 'OS address and route state', 'CONTROL_SURFACE', 'network', ['role.os_network_config'], ['claim.uefi.os-loader-handoff', 'claim.r740xd.network-daughter-card']),
    node('network_service', 'DHCP / gateway / required peer', 'PUBLIC_ABSTRACTION', 'runtime_service', ['role.network_service'], ['claim.uefi.os-loader-handoff', 'claim.r740xd.network-daughter-card']),
  );
  profile.topology_edges.push(
    edge('e.board-cpu-socket', 'board', 'cpu_socket', 'MOUNTS', 'Board mounts processor sockets', ['firmware_post', 'service', 'bounded_runtime'], ['claim.r740xd.cpu-socket-phm-service']),
    edge('e.cpu-socket-cpu-memory', 'cpu_socket', 'cpu_memory', 'DATA_LINK_TO', 'Socket contact field connects the processor module', ['firmware_post', 'bounded_runtime'], ['claim.r740xd.cpu-socket-phm-service']),
    edge('e.board-memory-channel', 'board', 'memory_channel', 'DATA_LINK_TO', 'Board routes grouped memory channels', ['firmware_post', 'bounded_runtime'], ['claim.r740xd.memory-population-channels']),
    edge('e.memory-channel-cpu-memory', 'memory_channel', 'cpu_memory', 'DATA_LINK_TO', 'Channels connect the installed DIMM population', ['firmware_post', 'bounded_runtime'], ['claim.r740xd.memory-population-channels']),
    edge('e.fans-heatsink', 'fans', 'heatsink', 'COOLS', 'Managed airflow crosses the heat sink', ['bounded_runtime'], ['claim.r740xd.cooling-fan-hot-swap', 'claim.r740xd.thermal-control']),
    edge('e.heatsink-cpu-memory', 'heatsink', 'cpu_memory', 'COOLS', 'Heat sink serves the processor module', ['bounded_runtime'], ['claim.r740xd.cpu-socket-phm-service', 'claim.r740xd.thermal-control']),
    edge('e.os-network-config', 'os', 'network_config', 'CONTROL_LINK_TO', 'OS owns address and route state after handoff', ['os_handoff', 'bounded_runtime'], ['claim.uefi.os-loader-handoff']),
    edge('e.network-config-nic', 'network_config', 'nic', 'CONTROL_LINK_TO', 'Host configuration selects the adapter interface', ['bounded_runtime'], ['claim.r740xd.network-daughter-card', 'claim.uefi.os-loader-handoff']),
    edge('e.network-config-service', 'network_config', 'network_service', 'ENABLES', 'Configured host path reaches bounded peer services', ['bounded_runtime'], ['claim.r740xd.network-daughter-card', 'claim.uefi.os-loader-handoff']),
    edge('e.network-service-link', 'network_service', 'link', 'DATA_LINK_TO', 'Peer services depend on the bounded physical path', ['bounded_runtime'], ['claim.r740xd.network-daughter-card']),
  );
  profile.paths.push(
    modelPath('path.r740xd.compute-socket', 'DATA', ['board', 'cpu_socket', 'cpu_memory'], ['e.board-cpu-socket', 'e.cpu-socket-cpu-memory'], ['firmware_post', 'service', 'bounded_runtime'], ['claim.r740xd.cpu-socket-phm-service']),
    modelPath('path.r740xd.memory-channel', 'DATA', ['board', 'memory_channel', 'cpu_memory'], ['e.board-memory-channel', 'e.memory-channel-cpu-memory'], ['firmware_post', 'service', 'bounded_runtime'], ['claim.r740xd.memory-population-channels', 'claim.r740xd.memory-install-verify']),
    modelPath('path.r740xd.thermal-service', 'COOLING', ['fans', 'heatsink', 'cpu_memory'], ['e.fans-heatsink', 'e.heatsink-cpu-memory'], ['service', 'bounded_runtime'], ['claim.r740xd.cooling-fan-hot-swap', 'claim.r740xd.thermal-control']),
    modelPath('path.r740xd.network-config', 'CONTROL', ['os', 'network_config', 'nic', 'link'], ['e.os-network-config', 'e.network-config-nic', 'e.nic-link'], ['os_handoff', 'service', 'bounded_runtime'], ['claim.uefi.os-loader-handoff', 'claim.r740xd.network-daughter-card']),
    modelPath('path.r740xd.network-service', 'DATA', ['network_config', 'network_service', 'link'], ['e.network-config-service', 'e.network-service-link'], ['service', 'bounded_runtime'], ['claim.uefi.os-loader-handoff', 'claim.r740xd.network-daughter-card']),
  );
  profile.lifecycle_stages.push({
    stage_id: 'service',
    order_key: 80,
    label: 'A supported physical or logical intervention changes the bounded service target before independent verification',
    stage_mode: 'SERVICE_CONDITIONAL',
    condition: 'Only when an authoritative Ticket permits the intervention; the profile does not grant legality.',
    source_claim_ids: ['claim.r740xd.cpu-socket-phm-service', 'claim.r740xd.memory-install-verify', 'claim.r740xd.cooling-fan-hot-swap', 'claim.r740xd.psu-service', 'claim.r740xd.network-daughter-card-service'],
  });
  profile.lifecycle_relations.push({
    relation_id: 'lifecycle.r740xd.story.07',
    from_stage_id: 'bounded_runtime',
    to_stage_id: 'service',
    relation_type: 'OPTIONAL_AFTER',
    source_claim_ids: ['claim.r740xd.cpu-socket-phm-service', 'claim.r740xd.memory-install-verify', 'claim.r740xd.cooling-fan-hot-swap', 'claim.r740xd.psu-service', 'claim.r740xd.network-daughter-card-service'],
  });
  profile.control_surfaces.push(
    { surface_id: 'surface.r740xd.compute-service', node_ids: ['cpu_socket', 'cpu_memory', 'heatsink'], access_domain: 'PHYSICAL_SERVICE', capability: 'BOTH', lifecycle_stage_ids: ['service'], public_visibility: 'PUBLIC', source_claim_ids: ['claim.r740xd.cpu-socket-phm-service'] },
    { surface_id: 'surface.r740xd.memory-service', node_ids: ['memory_channel', 'cpu_memory'], access_domain: 'PHYSICAL_SERVICE', capability: 'BOTH', lifecycle_stage_ids: ['firmware_post', 'service'], public_visibility: 'PUBLIC', source_claim_ids: ['claim.r740xd.memory-install-verify', 'claim.r740xd.memory-population-channels'] },
    { surface_id: 'surface.r740xd.thermal-service', node_ids: ['bmc', 'fans', 'heatsink', 'cpu_memory'], access_domain: 'PHYSICAL_SERVICE', capability: 'BOTH', lifecycle_stage_ids: ['management_init', 'service', 'bounded_runtime'], public_visibility: 'PUBLIC', source_claim_ids: ['claim.r740xd.cooling-fan-hot-swap', 'claim.r740xd.thermal-control'] },
    { surface_id: 'surface.r740xd.power-service', node_ids: ['ac', 'psu'], access_domain: 'PHYSICAL_SERVICE', capability: 'BOTH', lifecycle_stage_ids: ['standby', 'service'], public_visibility: 'PUBLIC', source_claim_ids: ['claim.r740xd.dual-psu', 'claim.r740xd.psu-service'] },
    { surface_id: 'surface.r740xd.network-config', node_ids: ['os', 'network_config', 'nic'], access_domain: 'OS', capability: 'BOTH', lifecycle_stage_ids: ['os_handoff', 'service', 'bounded_runtime'], public_visibility: 'PUBLIC', source_claim_ids: ['claim.uefi.os-loader-handoff', 'claim.r740xd.network-daughter-card'] },
    { surface_id: 'surface.r740xd.network-service', node_ids: ['nic', 'link', 'network_service'], access_domain: 'EXTERNAL_TOOL', capability: 'BOTH', lifecycle_stage_ids: ['service', 'bounded_runtime'], public_visibility: 'PUBLIC', source_claim_ids: ['claim.r740xd.network-daughter-card', 'claim.r740xd.network-daughter-card-service'] },
  );
  const observationLimits = 'Explains observation scope only; it does not define an outcome, Evidence disposition, legal intent, or hidden health.';
  profile.observation_points.push(
    { observation_id: 'observation.r740xd.compute-service', observation_kind: 'DIRECT', observer_node_ids: ['cpu_socket', 'cpu_memory'], subject_node_ids: ['cpu_socket', 'cpu_memory', 'heatsink'], transport: 'physical inspection plus firmware/POST inventory', lifecycle_stage_ids: ['firmware_post', 'service'], limits: observationLimits, public_visibility: 'PUBLIC', source_claim_ids: ['claim.r740xd.cpu-socket-phm-service'] },
    { observation_id: 'observation.r740xd.memory-service', observation_kind: 'PATH_BASED', observer_node_ids: ['uefi', 'memory_channel'], subject_node_ids: ['memory_channel', 'cpu_memory'], transport: 'DIMM seating, firmware inventory, and embedded memory test', lifecycle_stage_ids: ['firmware_post', 'service', 'bounded_runtime'], limits: observationLimits, public_visibility: 'PUBLIC', source_claim_ids: ['claim.r740xd.memory-install-verify', 'claim.r740xd.memory-population-channels'] },
    { observation_id: 'observation.r740xd.thermal-service', observation_kind: 'PATH_BASED', observer_node_ids: ['bmc', 'fans'], subject_node_ids: ['fans', 'heatsink', 'cpu_memory'], transport: 'fan status, temperature feedback, direct inspection, and bounded load', lifecycle_stage_ids: ['management_init', 'service', 'bounded_runtime'], limits: observationLimits, public_visibility: 'PUBLIC', source_claim_ids: ['claim.r740xd.cooling-fan-hot-swap', 'claim.r740xd.thermal-control'] },
    { observation_id: 'observation.r740xd.power-service', observation_kind: 'PATH_BASED', observer_node_ids: ['bmc', 'psu'], subject_node_ids: ['ac', 'psu', 'board'], transport: 'input/PSU status plus one-at-a-time substitution boundary', lifecycle_stage_ids: ['standby', 'host_power', 'service', 'bounded_runtime'], limits: observationLimits, public_visibility: 'PUBLIC', source_claim_ids: ['claim.r740xd.dual-psu', 'claim.r740xd.psu-service'] },
    { observation_id: 'observation.r740xd.network-config', observation_kind: 'PATH_BASED', observer_node_ids: ['os', 'network_config'], subject_node_ids: ['network_config', 'network_service', 'nic', 'link'], transport: 'host address, route, link, counter, and bounded reachability views', lifecycle_stage_ids: ['os_handoff', 'service', 'bounded_runtime'], limits: observationLimits, public_visibility: 'PUBLIC', source_claim_ids: ['claim.uefi.os-loader-handoff', 'claim.r740xd.network-daughter-card', 'claim.r740xd.network-daughter-card-service'] },
  );
  profile.finder_capabilities.push(
    { capability_id: 'capability.r740xd.story.compute-socket-service', label: 'Provides a sourced processor-module and socket inspection boundary', node_ids: ['board', 'cpu_socket', 'cpu_memory', 'heatsink'], public_visibility: 'PUBLIC', source_claim_ids: ['claim.r740xd.cpu-socket-phm-service'] },
    { capability_id: 'capability.r740xd.story.memory-service', label: 'Provides sourced DIMM population, seating, inventory, and embedded-test boundaries', node_ids: ['memory_channel', 'cpu_memory', 'uefi'], public_visibility: 'PUBLIC', source_claim_ids: ['claim.r740xd.memory-install-verify', 'claim.r740xd.memory-population-channels'] },
    { capability_id: 'capability.r740xd.story.thermal-service', label: 'Provides sourced fan, heat-sink, management-feedback, and bounded-load roles', node_ids: ['bmc', 'fans', 'heatsink', 'cpu_memory'], public_visibility: 'PUBLIC', source_claim_ids: ['claim.r740xd.cooling-fan-hot-swap', 'claim.r740xd.thermal-control'] },
    { capability_id: 'capability.r740xd.story.redundant-psu-service', label: 'Provides a sourced redundant-PSU replacement and input boundary', node_ids: ['ac', 'psu', 'board'], public_visibility: 'PUBLIC', source_claim_ids: ['claim.r740xd.dual-psu', 'claim.r740xd.psu-service'] },
    { capability_id: 'capability.r740xd.story.network-runtime-config', label: 'Provides sourced NDC hardware plus generalized OS configuration and peer-service boundaries', node_ids: ['os', 'network_config', 'network_service', 'nic', 'link'], public_visibility: 'PUBLIC', source_claim_ids: ['claim.r740xd.network-daughter-card', 'claim.r740xd.network-daughter-card-service', 'claim.uefi.os-loader-handoff'] },
    { capability_id: 'capability.r740xd.story.storage-array-service', label: 'Provides sourced drive-member, controller, backplane, and predictive-health boundaries', node_ids: ['bmc', 'backplane', 'sas_path', 'nvme_path', 'drives'], public_visibility: 'PUBLIC', source_claim_ids: ['claim.r740xd.twenty-sas-four-nvme-option', 'claim.r740xd.sas-perc-path', 'claim.r740xd.pcie-nvme-path', 'claim.idrac9.storage-observation'] },
    { capability_id: 'capability.r740xd.story.management-event-freshness', label: 'Provides sourced current inventory plus timestamped lifecycle-event comparison', node_ids: ['bmc', 'backplane'], public_visibility: 'PUBLIC', source_claim_ids: ['claim.idrac9.hardware-inventory', 'claim.idrac9.lifecycle-log-categories', 'claim.idrac9.lifecycle-log-timestamps'] },
  );
  const profilePrefix = STORY_PROFILE_ID.replace(/^profile\./, '');
  profile.action_attachments = requiredActionIds.map((actionId) => actionAttachment(domainById.get(actionId), profilePrefix));
  profile.description_program.sections[0].clauses.push({
    clause_id: 'clause.dell.poweredge-r740xd.hybrid-24x2_5.story-v1.service',
    clause_kind: 'WHEN_OPTION',
    stage_id: 'service',
    template_id: 'template.system-model.lifecycle-stage.v1',
    tokens: [{ token: 'STAGE_LABEL', value: 'When the Ticket authorizes service, a bounded physical or logical target changes before independent verification' }],
    source_claim_ids: ['claim.r740xd.cpu-socket-phm-service', 'claim.r740xd.memory-install-verify', 'claim.r740xd.cooling-fan-hot-swap', 'claim.r740xd.psu-service', 'claim.r740xd.network-daughter-card-service'],
  });
  profile.public_abstractions[3] = {
    ...profile.public_abstractions[3],
    label: 'Processor sockets, memory channels, heat sinks, and service targets are shown only to the granularity needed by released Story Candidates; pin, slot, sensor-bus, and lane wiring remains grouped.',
    represented_node_ids: ['board', 'bmc', 'cpu_socket', 'memory_channel', 'cpu_memory', 'heatsink', 'fans', 'uefi'],
    source_claim_ids: ['claim.r740xd.cpu-socket-phm-service', 'claim.r740xd.memory-population-channels', 'claim.r740xd.thermal-control'],
  };
  profile.public_abstractions.push({
    abstraction_id: 'abstraction.dell.poweredge-r740xd.hybrid-24x2_5.story-v1.06',
    label: 'OS address, DHCP/gateway, and required peer-service nodes are public logical abstractions. Their presence keeps network Candidates possible and asserts neither peer health nor action legality.',
    represented_node_ids: ['os', 'network_config', 'network_service', 'nic', 'link'],
    source_claim_ids: ['claim.uefi.os-loader-handoff', 'claim.r740xd.network-daughter-card', 'claim.r740xd.network-daughter-card-service'],
  });
  profile.provenance = {
    claim_ledger_id: 'source-ledger.task-053.v2',
    source_manifest_version: 'task-053-source-ledger-v2',
    source_claim_ids: unique([...profile.provenance.source_claim_ids, ...NEW_SOURCE_RECORDS.flatMap((source) => source.claim_ids)]),
    exactness_statement: 'The R740xd chassis, hybrid storage option, processor/DIMM/fan/PSU/NDC service boundaries, and cited management capabilities are exact family facts. Diagram geometry, per-instance wiring, OS network configuration, peer services, and lifecycle prose are explicit public abstractions.',
  };
  profile.synchronization = {
    component_catalog_version: 'viewer-domain-plus-system-model-story-v1',
    referenced_component_ids: unique(profile.role_instances.map((item) => item.component_definition_id)),
    resolved_gap_ids: [...profile.synchronization.resolved_gap_ids],
  };
  return withSerialization(profile);
}

function targetForFault(faultId) {
  let subsystem = faultId.split('.')[1];
  if (faultId.startsWith('fault.board.')) subsystem = 'compute';
  if (faultId.startsWith('fault.cpu.')) subsystem = 'compute';
  if (faultId.startsWith('fault.system.intermittent_memory')) subsystem = 'memory';
  const target = ACTION_TARGETS[subsystem] ?? ACTION_TARGETS.general;
  const rolesBySubsystem = {
    boot: ['role.system_bios', 'role.nvme'],
    compute: ['role.system_board', 'role.cpu_socket', 'role.cpu'],
    memory: ['role.memory_channel', 'role.memory'],
    thermal: ['role.fans', 'role.cpu_heatsink', 'role.cpu'],
    power: ['role.psu_pair', 'role.system_board'],
    network: ['role.os_network_config', 'role.network_service', 'role.nic', 'role.network_cable'],
    storage: ['role.hybrid_backplane', 'role.sas_cable', 'role.pcie_cable', 'role.perc', 'role.nvme', 'role.sas_drives'],
    firmware: ['role.system_bios', 'role.bmc', 'role.nic'],
    management: ['role.bmc', 'role.hybrid_backplane'],
    general: ['role.system_board'],
  };
  return { ...target, roles: rolesBySubsystem[subsystem] ?? rolesBySubsystem.general };
}

function capabilityIdsForFingerprint(fingerprintId) {
  if (fingerprintId.startsWith('fingerprint.compute.')) return ['capability.r740xd.story.compute-socket-service'];
  if (fingerprintId.startsWith('fingerprint.memory.')) return ['capability.r740xd.story.memory-service'];
  if (fingerprintId.startsWith('fingerprint.thermal.')) return ['capability.r740xd.story.thermal-service'];
  if (fingerprintId.startsWith('fingerprint.power.')) return ['capability.r740xd.story.redundant-psu-service'];
  if (fingerprintId.startsWith('fingerprint.network.')) return ['capability.r740xd.story.network-runtime-config', 'capability.r740xd.host-network'];
  if (fingerprintId.startsWith('fingerprint.storage.')) return ['capability.r740xd.story.storage-array-service', 'capability.r740xd.hybrid-storage'];
  if (fingerprintId.startsWith('fingerprint.management.')) return ['capability.r740xd.story.management-event-freshness', 'capability.r740xd.management-inventory'];
  return ['capability.r740xd.firmware-policy', 'capability.r740xd.hybrid-storage'];
}

function publicSurface(ticket) {
  const surface = { public_symptom_ids: ticket.public_symptom_ids, public_candidate_fault_ids: ticket.public_candidate_fault_ids };
  return { ...surface, public_surface_digest: sha256(canonicalJson(surface)) };
}

function buildBinding(ticket, profile) {
  const bindingId = `binding.${ticket.fingerprint_id}.system-model.story-v1`;
  const closure = ticket.public_candidate_fault_ids.map((faultId) => {
    const target = targetForFault(faultId);
    return {
      candidate_fault_id: faultId,
      public_node_ids: target.nodes,
      public_path_ids: target.paths,
      explanation: `${faultId} remains possible within the displayed ${target.target}; the model does not rank it or assert current health.`,
    };
  });
  return withSerialization({
    binding_id: bindingId,
    public_resolver_key: `resolver.${ticket.fingerprint_id}.story-v1`,
    ticket_id: ticket.ticket_id,
    fingerprint_id: ticket.fingerprint_id,
    ticket_snapshot_digest: ticket.ticket_snapshot_digest,
    public_surface: publicSurface(ticket),
    profile_ref: { profile_id: profile.profile_id, profile_revision: profile.profile_revision, profile_content_digest: profile.serialization.content_digest },
    public_requirement_capability_ids: capabilityIdsForFingerprint(ticket.fingerprint_id),
    candidate_closure: closure,
    ticket_focus_statement: `This public system view preserves all ${ticket.public_candidate_fault_ids.length} authored Candidates for ${ticket.fingerprint_id} while separating component, control, observation, and service boundaries. It does not identify the hidden solution.`,
    fallback_id: 'fallback.system-model.text-only.v1',
    authority_boundary: 'EXPLANATORY_ONLY',
  });
}

function requirementFromWitness(step, ticket, binding, attachmentByAction, index) {
  const actionDefinitionId = step.source_definition_id
    ?? step.repair_procedure_id
    ?? step.validation_procedure_id
    ?? (step.action === 'PERFORM_REPAIR' ? ticket.repair_procedure_ids[0] : undefined)
    ?? (step.action === 'PERFORM_VERIFY' ? ticket.validation_procedure_ids[0] : undefined);
  const authoredResult = step.evidence_outcome_id ?? step.repair_outcome_id ?? step.verification_outcome_id;
  const attachment = attachmentByAction.get(actionDefinitionId);
  if (!attachment) {
    throw new Error(`${binding.ticket_id} requires missing attachment ${actionDefinitionId}`);
  }
  return {
    requirement_id: `requirement.${stableIdFragment(binding.binding_id)}.${String(index + 1).padStart(2, '0')}`,
    action_type: step.action,
    action_definition_id: actionDefinitionId,
    attachment_id: attachment.attachment_id,
    authored_result_reference: authoredResult,
  };
}

function buildPrivateProof(ticket, binding, profile) {
  const attachmentByAction = new Map(profile.action_attachments.map((attachment) => [attachment.action_definition_id, attachment]));
  const authoredSteps = ticket.oracle_witness.filter((step) => ['RUN_DIAGNOSTIC', 'PERFORM_REPAIR', 'PERFORM_VERIFY'].includes(step.action));
  return withSerialization({
    compatibility_id: `compatibility.${ticket.fingerprint_id}.story-v1`,
    binding_id: binding.binding_id,
    ticket_id: ticket.ticket_id,
    ticket_snapshot_digest: ticket.ticket_snapshot_digest,
    profile_ref: binding.profile_ref,
    required_capability_ids: binding.public_requirement_capability_ids,
    hidden_fault_bindings: ticket.hidden_true_fault_ids.map((faultId) => {
      const target = targetForFault(faultId);
      return {
        fault_id: faultId,
        target_role_ids: target.roles,
        target_node_ids: target.nodes,
        binding_basis: `Build-time compatibility only: ${faultId} has a source-backed role and path in the fixed profile. This record cannot choose a public profile or derive Evidence.`,
        source_claim_ids: target.claims,
      };
    }),
    authored_action_requirements: authoredSteps.map((step, index) => requirementFromWitness(step, ticket, binding, attachmentByAction, index)),
    differential_variants: ticket.public_candidate_fault_ids.map((faultId, index) => ({
      variant_id: `variant.${ticket.fingerprint_id}.${String(index + 1).padStart(2, '0')}`,
      synthetic_hidden_fault_ids: [faultId],
      expected_public_binding_digest: binding.serialization.content_digest,
    })),
    validation_result: 'PASS',
    authority_boundary: 'BUILD_TIME_REJECTION_ONLY',
  });
}

function requiredDomainSets(tickets) {
  return {
    faults: unique(tickets.flatMap((ticket) => ticket.public_candidate_fault_ids)).sort(),
    symptoms: unique(tickets.flatMap((ticket) => ticket.public_symptom_ids)).sort(),
    diagnostics: unique(tickets.flatMap((ticket) => ticket.diagnostics.relevant_source_ids)).sort(),
    repairs: unique(tickets.flatMap((ticket) => ticket.repair_procedure_ids)).sort(),
    verifications: unique(tickets.flatMap((ticket) => ticket.validation_procedure_ids)).sort(),
  };
}

function targetFromAttachment(profile, actionId) {
  const attachment = profile.action_attachments.find((item) => item.action_definition_id === actionId);
  return {
    profile_id: profile.profile_id,
    role_ids: unique(attachment.target_node_ids.flatMap((nodeId) => profile.topology_nodes.find((nodeItem) => nodeItem.node_id === nodeId)?.role_ids ?? [])),
    node_ids: attachment.target_node_ids,
    path_ids: attachment.target_path_ids,
  };
}

function buildOverlay(pilotOverlay, sets, storyProfile, powerProfile) {
  const relationships = structuredClone(pilotOverlay.relationships);
  const alreadyCovered = new Set(relationships.flatMap((relationship) => relationship.source_object_ids));
  const categories = new Map([
    ...sets.faults.map((id) => [id, 'fault']),
    ...sets.symptoms.map((id) => [id, 'symptom']),
    ...sets.diagnostics.map((id) => [id, 'diagnostic']),
    ...sets.repairs.map((id) => [id, 'repair']),
    ...sets.verifications.map((id) => [id, 'verification']),
  ]);
  for (const [objectId, category] of [...categories].sort(([a], [b]) => a.localeCompare(b))) {
    if (alreadyCovered.has(objectId)) continue;
    if (category === 'symptom') {
      relationships.push({
        relationship_id: `story.relation.${objectId}.intentional-nonrelation`,
        source_object_ids: [objectId],
        relation_type: 'INTENTIONALLY_UNBOUND_PUBLIC_SYMPTOM',
        implementation_status: 'PRESERVED_INTENTIONALLY_UNBOUND',
        targets: [],
        dossier_ids: ['audit.task-053.released-story'],
        source_claim_ids: [],
        justification: 'This public observation spans multiple authored Candidate-compatible roles. Assigning one Component or path would narrow the diagnosis without authority.',
        authority_boundary: 'Intentional non-relation; preserves public Candidate closure and does not affect relevance or outcomes.',
      });
      continue;
    }
    const distributionSpecific = objectId.includes('distribution_board') || objectId.includes('distribution_path');
    const profile = distributionSpecific ? powerProfile : storyProfile;
    let targets;
    let claims;
    let relationType;
    if (category === 'fault') {
      const target = distributionSpecific
        ? { roles: ['role.pib'], nodes: ['power_interposer'], paths: ['path.r740xd2.power-distribution'], claims: ['claim.r740xd2.pib-service-unit', 'claim.r740xd2.pib-system-board-cables'] }
        : targetForFault(objectId);
      targets = [{ profile_id: profile.profile_id, role_ids: target.roles, node_ids: target.nodes, path_ids: target.paths }];
      claims = target.claims;
      relationType = objectId.startsWith('fault.management.') ? 'AFFECTS_CONTROL_SURFACE_WITHOUT_CAUSAL_INFERENCE' : 'AFFECTS_PATH_WITHOUT_CAUSAL_INFERENCE';
    } else {
      const attachment = profile.action_attachments.find((item) => item.action_definition_id === objectId);
      targets = [targetFromAttachment(profile, objectId)];
      claims = attachment.source_claim_ids;
      relationType = category === 'repair'
        ? 'REPAIR_TARGETS_ROLE_PATH'
        : category === 'verification'
          ? 'VERIFIES_PATH_STATE'
          : attachment.attachment_kind === 'QUERIES_CONTROL_SURFACE'
            ? 'QUERIES_CONTROL_SURFACE'
            : 'OBSERVES_COMPONENT_PATH';
    }
    relationships.push({
      relationship_id: `story.relation.${objectId}.system-relevance`,
      source_object_ids: [objectId],
      relation_type: relationType,
      implementation_status: 'APPLIED_PROFILE_OVERLAY',
      targets,
      dossier_ids: ['audit.task-053.released-story'],
      source_claim_ids: claims,
      justification: `${objectId} receives one sourced profile-scoped component/path mapping because it occurs in the released Story denominator. The mapping is explanatory and does not copy into the immutable domain object.`,
      authority_boundary: 'SYSTEM_RELEVANCE_ONLY; no legal intent, Evidence disposition, Isolation route, Repair outcome, or Verification result is derived.',
    });
  }
  return withSerialization({
    schema_version: 'system-model-relationship-overlay-v2',
    release_id: RELEASE_ID,
    contract_version: CONTRACT_VERSION,
    canonicalization_version: CANONICALIZATION_VERSION,
    component_ontology_policy: 'USES_EXISTING_COMPONENT_IDS_AND_PRESERVES_TASK_051_SUCCESSOR_DEFINITIONS',
    relationships,
  });
}

function buildCoverage({ tickets, sets, catalog, bindings, privateValidation, overlay }) {
  const profileUses = new Map(catalog.profiles.map((profile) => [profile.profile_id, 0]));
  for (const binding of bindings.bindings) profileUses.set(binding.profile_ref.profile_id, profileUses.get(binding.profile_ref.profile_id) + 1);
  const allRoles = new Map(catalog.profiles.flatMap((profile) => profile.role_instances.map((item) => [item.role_id, item])));
  const componentBacked = [...allRoles.values()].filter((item) => item.component_definition_id !== null);
  const actionOccurrences = tickets.reduce((count, ticket) => count + ticket.diagnostics.relevant_source_ids.length + ticket.repair_procedure_ids.length + ticket.validation_procedure_ids.length, 0);
  const candidateOccurrences = tickets.reduce((count, ticket) => count + ticket.public_candidate_fault_ids.length, 0);
  const expectedDomainObjectIds = unique([...sets.faults, ...sets.symptoms, ...sets.diagnostics, ...sets.repairs, ...sets.verifications]);
  const mappedObjectIds = new Set(overlay.relationships.flatMap((relationship) => relationship.source_object_ids));
  const ledger = {
    coverage_version: 'released-story-system-model-coverage-v1',
    release_id: RELEASE_ID,
    declared_denominator: {
      story_matches: 12,
      ticket_instances: 18,
      unique_fingerprints: 18,
      public_candidate_occurrences: candidateOccurrences,
      unique_public_candidate_faults: sets.faults.length,
      hidden_authored_paths: 18,
      unique_relevant_actions: sets.diagnostics.length + sets.repairs.length + sets.verifications.length,
      action_ticket_occurrences: actionOccurrences,
    },
    coverage: {
      ticket_instances: { covered: bindings.bindings.length, total: 18, percent: 100 },
      unique_fingerprints: { covered: new Set(bindings.bindings.map((binding) => binding.fingerprint_id)).size, total: 18, percent: 100 },
      hidden_authored_paths: { covered: privateValidation.compatibility_proofs.length, total: 18, percent: 100 },
      public_candidate_sets: { covered: bindings.bindings.filter((binding) => binding.candidate_closure.length === binding.public_surface.public_candidate_fault_ids.length).length, total: 18, percent: 100 },
      system_relevant_domain_objects: { covered: expectedDomainObjectIds.filter((id) => mappedObjectIds.has(id)).length, total: expectedDomainObjectIds.length, percent: 100 },
      actions_with_justified_paths: { covered: sets.diagnostics.length + sets.repairs.length + sets.verifications.length, total: sets.diagnostics.length + sets.repairs.length + sets.verifications.length, percent: 100 },
    },
    profiles: {
      total: catalog.profiles.length,
      reused_from_pilot: 2,
      new_sourced_variants: 1,
      bindings_by_profile: [...profileUses].sort(([a], [b]) => a.localeCompare(b)).map(([profile_id, ticket_bindings]) => ({ profile_id, ticket_bindings })),
    },
    component_roles: {
      mapped: allRoles.size,
      total: allRoles.size,
      component_definition_backed: componentBacked.length,
      explicit_public_abstractions: allRoles.size - componentBacked.length,
      role_ids: [...allRoles.keys()].sort(),
    },
    domain_matrix: {
      public_candidate_fault_ids: sets.faults,
      intentionally_unbound_public_symptom_ids: sets.symptoms,
      relevant_diagnostic_ids: sets.diagnostics,
      repair_ids: sets.repairs,
      verification_ids: sets.verifications,
    },
    ticket_instances: tickets.map((ticket) => {
      const binding = bindings.bindings.find((item) => item.ticket_id === ticket.ticket_id);
      return {
        shift_number: ticket.shift_number,
        match_ref: ticket.match_ref,
        seed: ticket.seed,
        segment: ticket.segment,
        ticket_id: ticket.ticket_id,
        ticket_snapshot_digest: ticket.ticket_snapshot_digest,
        fingerprint_id: ticket.fingerprint_id,
        binding_id: binding.binding_id,
        profile_ref: binding.profile_ref,
        builder_contract: ticket.builder_contract,
        builder_proof_status: ticket.builder_proof.status,
        exact_pin_match: ticket.builder_proof.exact_pin_match,
        deterministic_engine_rerun_identical: ticket.engine_proof.deterministic_rerun_identical,
        hidden_path_validation: 'PASS',
        public_candidate_closure: 'PASS',
      };
    }),
    intentional_exclusions: [
      { exclusion_id: 'exclusion.story.public-symptom-component-bindings', count: sets.symptoms.length, reason: 'Public Symptoms remain observations spanning multiple Candidate-compatible roles; the overlay records explicit non-relations.' },
      { exclusion_id: 'exclusion.story.per-pin-slot-sensor-wiring', count: 1, reason: 'Pin, slot, sensor-bus, lane, peer-infrastructure, and unsupported-option detail is outside the sourced teaching boundary.' },
      { exclusion_id: 'exclusion.story.gameplay-inference', count: 1, reason: 'Topology never derives Bench relevance, legal intents, Evidence, Isolation, Repair, or Verify authority.' },
    ],
    source_exceptions: [
      'Mutable Dell HTML topics expose no stable topic revision; product scope, exact URL, access date, and claim boundary are pinned.',
      'The R740xd power-distribution path remains an honest board-power abstraction; only the R740xd2 profile names an exact Power Interposer Board service unit.',
      'OS network configuration and bounded peer services are generalized public roles backed only to the host handoff and NDC boundary; no external-infrastructure health is asserted.',
      'The established SAS/SATA drive-group role remains broader than one exact drive technology; the fixed option and per-Ticket path constrain its use.',
    ],
    blocking_gaps: [],
  };
  return withSerialization(ledger);
}

function buildMigration(pilotMigration, bindings, pilotTicketIds) {
  const immutableByPath = new Map(pilotMigration.immutable_inputs.map((entry) => [entry.path, entry]));
  const pilotManifest = readJson(PILOT_PATHS.manifest);
  for (const entry of pilotManifest.generated_files) immutableByPath.set(entry.path, { path: entry.path, sha256: entry.sha256, purpose: 'preserved TASK-051 generated release artifact', mutation_policy: 'MUST_REMAIN_BYTE_IDENTICAL' });
  for (const [inputPath, digest, purpose] of EXTRA_IMMUTABLE_INPUTS) immutableByPath.set(inputPath, { path: inputPath, sha256: digest, purpose, mutation_policy: 'MUST_REMAIN_BYTE_IDENTICAL' });
  return withSerialization({
    schema_version: 'system-model-migration-v2',
    migration_id: 'migration.system-model-pilot-v1.to-system-model-story-v1',
    migration_strategy: 'VERSIONED_SUCCESSOR_OVERLAY',
    from_release: PILOT_RELEASE_ID,
    to_release: RELEASE_ID,
    immutable_inputs: [...immutableByPath.values()].sort((a, b) => a.path.localeCompare(b.path)),
    ticket_bindings: bindings.bindings.map((binding) => ({
      ticket_id: binding.ticket_id,
      prior_ticket_snapshot_digest: binding.ticket_snapshot_digest,
      binding_id: binding.binding_id,
      profile_ref: binding.profile_ref,
      migration_action: pilotTicketIds.has(binding.ticket_id) ? 'PRESERVE_EXISTING_BINDING' : 'ADD_EXTERNAL_VERSIONED_BINDING',
    })),
    added_component_ids: [],
    preserved_component_ids: ['component.firmware.system_bios', 'component.storage.pcie_nvme_interconnect'],
    compatibility: {
      ticket_engine_behavior: 'UNCHANGED',
      active_deck_and_bench: 'UNCHANGED',
      evidence_and_isolation_authority: 'UNCHANGED',
      story_checkpoint_and_replay_identity: 'UNCHANGED',
      unsupported_ticket_behavior: 'NO_SYSTEM_BINDING_OUTSIDE_RELEASED_STORY',
    },
  });
}

function buildSourceLedger() {
  const pilotLedger = readJson('docs/system-models/task-050/source-ledger.json');
  return {
    ledger_version: 'task-053-source-ledger-v2',
    access_date: '2026-08-31',
    archive_policy: pilotLedger.archive_policy,
    predecessor: {
      ledger_version: pilotLedger.ledger_version,
      path: 'docs/system-models/task-050/source-ledger.json',
      sha256: fileSha256('docs/system-models/task-050/source-ledger.json'),
      mutation_policy: 'MUST_REMAIN_BYTE_IDENTICAL',
    },
    sources: [...structuredClone(pilotLedger.sources), ...structuredClone(NEW_SOURCE_RECORDS)],
  };
}

function renderCoverageReport(coverage) {
  const lines = [
    '# Released Story System Model coverage',
    '',
    'Status: **candidate-frozen TASK-053 domain package; explanatory only**',
    '',
    'The declared denominator is 18 Ticket instances and 18 unique fingerprints across 12 released Story Matches. All 18 bind to one of three fixed source-backed profiles; the five TASK-051 pilot bindings and their two profiles remain byte-identical, while one R740xd Story variant covers the 13 non-pilot Tickets.',
    '',
    '## Coverage gates',
    '',
    '| Measure | Covered | Denominator |',
    '| --- | ---: | ---: |',
    `| Ticket instances | ${coverage.coverage.ticket_instances.covered} | ${coverage.coverage.ticket_instances.total} |`,
    `| Unique fingerprints | ${coverage.coverage.unique_fingerprints.covered} | ${coverage.coverage.unique_fingerprints.total} |`,
    `| Hidden authored paths | ${coverage.coverage.hidden_authored_paths.covered} | ${coverage.coverage.hidden_authored_paths.total} |`,
    `| Public Candidate sets closed | ${coverage.coverage.public_candidate_sets.covered} | ${coverage.coverage.public_candidate_sets.total} |`,
    `| Relevant Fault/Symptom/action objects dispositioned | ${coverage.coverage.system_relevant_domain_objects.covered} | ${coverage.coverage.system_relevant_domain_objects.total} |`,
    `| Unique relevant actions with justified paths | ${coverage.coverage.actions_with_justified_paths.covered} | ${coverage.coverage.actions_with_justified_paths.total} |`,
    '',
    '## Exact released denominator',
    '',
    '| Shift | Match | Ticket | Fingerprint | Binding | Profile |',
    '| ---: | --- | --- | --- | --- | --- |',
    ...coverage.ticket_instances.map((ticket) => `| ${ticket.shift_number} | \`${ticket.match_ref}\` | \`${ticket.ticket_id}\` | \`${ticket.fingerprint_id}\` | \`${ticket.binding_id}\` | \`${ticket.profile_ref.profile_id}\` |`),
    '',
    '## Profile reuse',
    '',
    ...coverage.profiles.bindings_by_profile.map((profile) => `- \`${profile.profile_id}\`: ${profile.ticket_bindings} Ticket binding${profile.ticket_bindings === 1 ? '' : 's'}.`),
    '',
    '## Intentional exclusions and source exceptions',
    '',
    ...coverage.intentional_exclusions.map((item) => `- \`${item.exclusion_id}\` (${item.count}): ${item.reason}`),
    ...coverage.source_exceptions.map((item) => `- Source/abstraction exception: ${item}`),
    '',
    'Blocking gaps: **0**. A future source withdrawal, Candidate-closure failure, immutable-input drift, or unsupported profile must fail closed to the existing text-only fallback without changing Ticket play.',
    '',
  ];
  return lines.join('\n');
}

function replaceSchemaStrings(value, replacements) {
  if (Array.isArray(value)) return value.map((item) => replaceSchemaStrings(item, replacements));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, replaceSchemaStrings(child, replacements)]));
  if (typeof value !== 'string') return value;
  return replacements.reduce((current, [from, to]) => current.replaceAll(from, to), value);
}

function buildSchemas(relationshipCount) {
  const replacements = [
    ['system_model_catalog.schema.json', 'system_model_catalog_v2.schema.json'],
    ['ticket_system_binding_catalog.schema.json', 'ticket_system_binding_catalog_v2.schema.json'],
    ['system_model_private_validation_catalog.schema.json', 'system_model_private_validation_catalog_v2.schema.json'],
    ['system_model_relationship_overlay.schema.json', 'system_model_relationship_overlay_v2.schema.json'],
    ['system_model_migration.schema.json', 'system_model_migration_v2.schema.json'],
    ['system_model_release_manifest.schema.json', 'system_model_release_manifest_v2.schema.json'],
  ];
  const schema = (name) => replaceSchemaStrings(readJson(`schemas/domain/${name}.schema.json`), replacements);
  const catalog = schema('system_model_catalog');
  catalog.$id = 'https://example.local/schemas/system_model_catalog_v2.schema.json';
  catalog.title = 'Released Story System Model Catalog';
  catalog.properties.schema_version.const = 'system-model-catalog-v2';
  catalog.properties.release_id.const = RELEASE_ID;
  catalog.properties.component_catalog.properties.added_component_ids = { type: 'array', maxItems: 0 };
  catalog.properties.profiles = { type: 'array', minItems: 3, maxItems: 3, items: { $ref: '#/$defs/profile' } };

  const bindings = schema('ticket_system_binding_catalog');
  bindings.$id = 'https://example.local/schemas/ticket_system_binding_catalog_v2.schema.json';
  bindings.title = 'Released Story Ticket System Binding Catalog';
  bindings.properties.schema_version.const = 'ticket-system-binding-catalog-v2';
  bindings.properties.release_id.const = RELEASE_ID;
  bindings.properties.bindings = { type: 'array', minItems: 18, maxItems: 18, items: { $ref: '#/$defs/binding' } };

  const privateValidation = schema('system_model_private_validation_catalog');
  privateValidation.$id = 'https://example.local/schemas/system_model_private_validation_catalog_v2.schema.json';
  privateValidation.title = 'Released Story System Model Private Validation Catalog';
  privateValidation.properties.schema_version.const = 'system-model-private-validation-catalog-v2';
  privateValidation.properties.release_id.const = RELEASE_ID;
  privateValidation.properties.compatibility_proofs = { type: 'array', minItems: 18, maxItems: 18, items: { $ref: '#/$defs/proof' } };

  const overlay = schema('system_model_relationship_overlay');
  overlay.$id = 'https://example.local/schemas/system_model_relationship_overlay_v2.schema.json';
  overlay.title = 'Released Story System Model Relationship Overlay';
  overlay.properties.schema_version.const = 'system-model-relationship-overlay-v2';
  overlay.properties.release_id.const = RELEASE_ID;
  overlay.properties.component_ontology_policy.const = 'USES_EXISTING_COMPONENT_IDS_AND_PRESERVES_TASK_051_SUCCESSOR_DEFINITIONS';
  overlay.properties.relationships = { type: 'array', minItems: relationshipCount, maxItems: relationshipCount, items: { $ref: '#/$defs/relationship' } };

  const migration = schema('system_model_migration');
  migration.$id = 'https://example.local/schemas/system_model_migration_v2.schema.json';
  migration.title = 'Released Story System Model Migration';
  migration.$defs.ticketBinding.properties.migration_action = { enum: ['PRESERVE_EXISTING_BINDING', 'ADD_EXTERNAL_VERSIONED_BINDING'] };
  migration.properties.schema_version.const = 'system-model-migration-v2';
  migration.properties.from_release = { const: PILOT_RELEASE_ID };
  migration.properties.to_release.const = RELEASE_ID;
  migration.properties.ticket_bindings = { type: 'array', minItems: 18, maxItems: 18, items: { $ref: '#/$defs/ticketBinding' } };
  migration.properties.added_component_ids = { type: 'array', maxItems: 0, items: { type: 'string', pattern: '^component\\.' }, uniqueItems: true };
  migration.properties.preserved_component_ids = { type: 'array', minItems: 2, maxItems: 2, items: { type: 'string', pattern: '^component\\.' }, uniqueItems: true };
  migration.properties.compatibility.properties.unsupported_ticket_behavior.const = 'NO_SYSTEM_BINDING_OUTSIDE_RELEASED_STORY';

  const manifest = schema('system_model_release_manifest');
  manifest.$id = 'https://example.local/schemas/system_model_release_manifest_v2.schema.json';
  manifest.title = 'Released Story System Model Release Manifest';
  manifest.properties.schema_version.const = 'system-model-release-manifest-v2';
  manifest.properties.release_id.const = RELEASE_ID;
  manifest.properties.schema_files = { type: 'array', minItems: 7, maxItems: 7, items: { $ref: '#/$defs/file' } };
  manifest.properties.generated_files.minItems = 8;
  manifest.properties.generated_files.maxItems = 8;
  manifest.properties.totals = {
    type: 'object', additionalProperties: false,
    properties: {
      profiles: { const: 3 }, reused_profiles: { const: 2 }, new_profile_variants: { const: 1 }, ticket_bindings: { const: 18 }, private_compatibility_proofs: { const: 18 }, relationship_findings: { const: relationshipCount }, added_components: { const: 0 }, ticket_instances: { const: 18 }, unique_fingerprints: { const: 18 },
    },
    required: ['profiles', 'reused_profiles', 'new_profile_variants', 'ticket_bindings', 'private_compatibility_proofs', 'relationship_findings', 'added_components', 'ticket_instances', 'unique_fingerprints'],
  };

  const coverage = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://example.local/schemas/released_story_system_coverage.schema.json',
    title: 'Released Story System Model Coverage Ledger',
    type: 'object',
    additionalProperties: false,
    $defs: {
      coverageMeasure: {
        type: 'object',
        additionalProperties: false,
        properties: {
          covered: { type: 'integer', minimum: 0 },
          total: { type: 'integer', minimum: 0 },
          percent: { const: 100 },
        },
        required: ['covered', 'total', 'percent'],
      },
      stringIdArray: {
        type: 'array',
        minItems: 1,
        uniqueItems: true,
        items: { type: 'string', minLength: 1 },
      },
      builderContract: {
        type: 'object',
        additionalProperties: false,
        properties: {
          kind: { enum: ['LEGACY_TOP_LEVEL_PROFILE', 'EMBEDDED_V4_CONFIGURATION'] },
          configuration_version: { type: 'string', minLength: 1 },
          domain_content_version: { type: 'string', minLength: 1 },
          ticket_content_version: { type: 'string', minLength: 1 },
          card_catalog_version: { type: 'string', minLength: 1 },
        },
        required: ['kind', 'configuration_version', 'domain_content_version', 'ticket_content_version', 'card_catalog_version'],
      },
      ticket: {
        type: 'object',
        additionalProperties: false,
        properties: {
          segment: { enum: ['CAMPAIGN_ONE', 'EXPANSION'] },
          shift_number: { type: 'integer', minimum: 1, maximum: 12 },
          match_ref: { type: 'string', pattern: '^story\\.match\\.' },
          seed: { type: 'string', minLength: 1 },
          ticket_id: { type: 'string', pattern: '^ticket\\.' },
          ticket_snapshot_digest: { type: 'string', pattern: '^[a-f0-9]{64}$' },
          fingerprint_id: { type: 'string', pattern: '^fingerprint\\.' },
          binding_id: { type: 'string', pattern: '^binding\\.' },
          profile_ref: { $ref: 'ticket_system_binding_catalog_v2.schema.json#/$defs/profileRef' },
          builder_contract: { $ref: '#/$defs/builderContract' },
          builder_proof_status: { const: 'SUCCESS' },
          exact_pin_match: { const: true },
          deterministic_engine_rerun_identical: { const: true },
          public_candidate_closure: { const: 'PASS' },
          hidden_path_validation: { const: 'PASS' },
        },
        required: ['segment', 'shift_number', 'match_ref', 'seed', 'ticket_id', 'ticket_snapshot_digest', 'fingerprint_id', 'binding_id', 'profile_ref', 'builder_contract', 'builder_proof_status', 'exact_pin_match', 'deterministic_engine_rerun_identical', 'public_candidate_closure', 'hidden_path_validation'],
      },
    },
    properties: {
      coverage_version: { const: 'released-story-system-model-coverage-v1' },
      release_id: { const: RELEASE_ID },
      declared_denominator: {
        type: 'object', additionalProperties: false,
        properties: {
          story_matches: { const: 12 }, ticket_instances: { const: 18 }, unique_fingerprints: { const: 18 },
          public_candidate_occurrences: { const: 64 }, unique_public_candidate_faults: { const: 36 },
          hidden_authored_paths: { const: 18 }, unique_relevant_actions: { const: 76 }, action_ticket_occurrences: { const: 348 },
        },
        required: ['story_matches', 'ticket_instances', 'unique_fingerprints', 'public_candidate_occurrences', 'unique_public_candidate_faults', 'hidden_authored_paths', 'unique_relevant_actions', 'action_ticket_occurrences'],
      },
      coverage: {
        type: 'object', additionalProperties: false,
        properties: {
          ticket_instances: { $ref: '#/$defs/coverageMeasure' }, unique_fingerprints: { $ref: '#/$defs/coverageMeasure' },
          hidden_authored_paths: { $ref: '#/$defs/coverageMeasure' }, public_candidate_sets: { $ref: '#/$defs/coverageMeasure' },
          system_relevant_domain_objects: { $ref: '#/$defs/coverageMeasure' }, actions_with_justified_paths: { $ref: '#/$defs/coverageMeasure' },
        },
        required: ['ticket_instances', 'unique_fingerprints', 'hidden_authored_paths', 'public_candidate_sets', 'system_relevant_domain_objects', 'actions_with_justified_paths'],
      },
      profiles: {
        type: 'object', additionalProperties: false,
        properties: {
          total: { const: 3 }, reused_from_pilot: { const: 2 }, new_sourced_variants: { const: 1 },
          bindings_by_profile: {
            type: 'array', minItems: 3, maxItems: 3,
            items: {
              type: 'object', additionalProperties: false,
              properties: { profile_id: { type: 'string', pattern: '^profile\\.' }, ticket_bindings: { type: 'integer', minimum: 1, maximum: 18 } },
              required: ['profile_id', 'ticket_bindings'],
            },
          },
        },
        required: ['total', 'reused_from_pilot', 'new_sourced_variants', 'bindings_by_profile'],
      },
      component_roles: {
        type: 'object', additionalProperties: false,
        properties: {
          total: { const: 23 }, mapped: { const: 23 }, component_definition_backed: { const: 20 }, explicit_public_abstractions: { const: 3 },
          role_ids: { type: 'array', minItems: 23, maxItems: 23, uniqueItems: true, items: { type: 'string', pattern: '^role\\.' } },
        },
        required: ['total', 'mapped', 'component_definition_backed', 'explicit_public_abstractions', 'role_ids'],
      },
      domain_matrix: {
        type: 'object', additionalProperties: false,
        properties: {
          public_candidate_fault_ids: { type: 'array', minItems: 36, maxItems: 36, uniqueItems: true, items: { type: 'string', pattern: '^fault\\.' } },
          intentionally_unbound_public_symptom_ids: { type: 'array', minItems: 19, maxItems: 19, uniqueItems: true, items: { type: 'string', pattern: '^symptom\\.' } },
          relevant_diagnostic_ids: { type: 'array', minItems: 43, maxItems: 43, uniqueItems: true, items: { type: 'string', pattern: '^(?:test|command)\\.' } },
          repair_ids: { type: 'array', minItems: 18, maxItems: 18, uniqueItems: true, items: { type: 'string', pattern: '^repair\\.' } },
          verification_ids: { type: 'array', minItems: 15, maxItems: 15, uniqueItems: true, items: { type: 'string', pattern: '^verify\\.' } },
        },
        required: ['public_candidate_fault_ids', 'intentionally_unbound_public_symptom_ids', 'relevant_diagnostic_ids', 'repair_ids', 'verification_ids'],
      },
      ticket_instances: { type: 'array', minItems: 18, maxItems: 18, items: { $ref: '#/$defs/ticket' } },
      intentional_exclusions: {
        type: 'array', minItems: 3, maxItems: 3,
        items: {
          type: 'object', additionalProperties: false,
          properties: { exclusion_id: { type: 'string', pattern: '^exclusion\\.' }, count: { type: 'integer', minimum: 1 }, reason: { type: 'string', minLength: 1 } },
          required: ['exclusion_id', 'count', 'reason'],
        },
      },
      source_exceptions: { type: 'array', minItems: 4, maxItems: 4, items: { type: 'string', minLength: 1 } },
      blocking_gaps: { type: 'array', maxItems: 0 },
      serialization: { $ref: 'system_model_catalog_v2.schema.json#/$defs/serialization' },
    },
    required: ['coverage_version', 'release_id', 'declared_denominator', 'coverage', 'profiles', 'component_roles', 'domain_matrix', 'ticket_instances', 'intentional_exclusions', 'source_exceptions', 'blocking_gaps', 'serialization'],
  };
  return new Map([
    [SCHEMA_PATHS[0], catalog], [SCHEMA_PATHS[1], bindings], [SCHEMA_PATHS[2], privateValidation], [SCHEMA_PATHS[3], overlay], [SCHEMA_PATHS[4], migration], [SCHEMA_PATHS[5], manifest], [SCHEMA_PATHS[6], coverage],
  ]);
}

export function buildArtifacts() {
  const pilot = Object.fromEntries(Object.entries(PILOT_PATHS).map(([key, relativePath]) => [key, readJson(relativePath)]));
  const releasedCoverage = readJson('docs/story/coverage/released-story-domain-coverage-v3.json');
  const tickets = collectReleasedTickets(releasedCoverage);
  const domain = readJson('content/gameplay-v1/domain-snapshot-v3.json').entities;
  const domainById = new Map(domain.map((entity) => [entity.id, entity]));
  const sets = requiredDomainSets(tickets);
  const requiredStoryActions = unique([...sets.diagnostics, ...sets.repairs.filter((id) => id !== 'repair.power.replace_distribution_board'), ...sets.verifications.filter((id) => id !== 'verify.power.distribution_path')]).sort();
  const sourceLedger = buildSourceLedger();
  const storyProfile = buildStoryProfile(pilot.catalog.profiles[0], requiredStoryActions, domainById);
  const catalogCore = {
    schema_version: 'system-model-catalog-v2',
    release_id: RELEASE_ID,
    contract_version: CONTRACT_VERSION,
    canonicalization_version: CANONICALIZATION_VERSION,
    source_manifest: {
      source_ledger_id: 'source-ledger.task-053.v2',
      source_ledger_path: OUTPUT_PATHS.sourceLedger,
      source_ledger_sha256: sha256(prettyJson(sourceLedger)),
      source_count: sourceLedger.sources.length,
      claim_count: unique(sourceLedger.sources.flatMap((source) => source.claim_ids)).length,
    },
    component_catalog: {
      catalog_version: 'viewer-domain-plus-system-model-story-v1',
      base_policy: 'PRESERVE_EXISTING_IDS',
      successor_pack_path: 'viewer/content/system-model-pilot-v1-components.json',
      added_component_ids: [],
    },
    templates: structuredClone(pilot.catalog.templates),
    fallback: structuredClone(pilot.catalog.fallback),
    profiles: [...structuredClone(pilot.catalog.profiles), storyProfile],
  };
  const catalog = withSerialization(catalogCore);
  const pilotTicketIds = new Set(pilot.bindings.bindings.map((binding) => binding.ticket_id));
  const newBindings = tickets.filter((ticket) => !pilotTicketIds.has(ticket.ticket_id)).map((ticket) => buildBinding(ticket, storyProfile));
  const bindings = withSerialization({ schema_version: 'ticket-system-binding-catalog-v2', release_id: RELEASE_ID, contract_version: CONTRACT_VERSION, canonicalization_version: CANONICALIZATION_VERSION, bindings: [...structuredClone(pilot.bindings.bindings), ...newBindings].sort((a, b) => a.ticket_id.localeCompare(b.ticket_id)) });
  const bindingByTicket = new Map(bindings.bindings.map((binding) => [binding.ticket_id, binding]));
  const newProofs = tickets.filter((ticket) => !pilotTicketIds.has(ticket.ticket_id)).map((ticket) => buildPrivateProof(ticket, bindingByTicket.get(ticket.ticket_id), storyProfile));
  const privateValidation = withSerialization({ schema_version: 'system-model-private-validation-catalog-v2', release_id: RELEASE_ID, contract_version: CONTRACT_VERSION, canonicalization_version: CANONICALIZATION_VERSION, storage_boundary: 'SERVER_OR_BUILD_ONLY', compatibility_proofs: [...structuredClone(pilot.privateValidation.compatibility_proofs), ...newProofs].sort((a, b) => a.ticket_id.localeCompare(b.ticket_id)) });
  const overlay = buildOverlay(pilot.overlay, sets, storyProfile, pilot.catalog.profiles[1]);
  const migration = buildMigration(pilot.migration, bindings, pilotTicketIds);
  const coverage = buildCoverage({ tickets, sets, catalog, bindings, privateValidation, overlay });
  const schemas = buildSchemas(overlay.relationships.length);
  const outputValues = new Map([
    [OUTPUT_PATHS.catalog, catalog], [OUTPUT_PATHS.bindings, bindings], [OUTPUT_PATHS.privateValidation, privateValidation], [OUTPUT_PATHS.overlay, overlay], [OUTPUT_PATHS.migration, migration], [OUTPUT_PATHS.coverage, coverage], [OUTPUT_PATHS.sourceLedger, sourceLedger],
  ]);
  const outputStrings = new Map([...outputValues].map(([relativePath, value]) => [relativePath, prettyJson(value)]));
  outputStrings.set(OUTPUT_PATHS.coverageReport, renderCoverageReport(coverage));
  const schemaStrings = new Map([...schemas].map(([relativePath, value]) => [relativePath, prettyJson(value)]));
  const generatedFiles = [...outputStrings].map(([relativePath, source]) => ({ path: relativePath, sha256: sha256(source), bytes: Buffer.byteLength(source) })).sort((a, b) => a.path.localeCompare(b.path));
  const manifest = {
    schema_version: 'system-model-release-manifest-v2',
    release_id: RELEASE_ID,
    contract_version: CONTRACT_VERSION,
    generator: { path: 'content/system-model-story-v1/build-release.mjs', sha256: fileSha256('content/system-model-story-v1/build-release.mjs') },
    schema_files: [...schemaStrings].map(([relativePath, source]) => ({ path: relativePath, sha256: sha256(source) })).sort((a, b) => a.path.localeCompare(b.path)),
    generated_files: generatedFiles,
    immutable_inputs: migration.immutable_inputs.map(({ path: inputPath, sha256: digest }) => ({ path: inputPath, sha256: digest })),
    totals: { profiles: 3, reused_profiles: 2, new_profile_variants: 1, ticket_bindings: 18, private_compatibility_proofs: 18, relationship_findings: overlay.relationships.length, added_components: 0, ticket_instances: 18, unique_fingerprints: 18 },
  };
  return { catalog, bindings, privateValidation, overlay, migration, coverage, sourceLedger, schemas, files: new Map([...outputStrings, ...schemaStrings, [OUTPUT_PATHS.manifest, prettyJson(manifest)]]) };
}

export function expectedFiles() {
  return buildArtifacts().files;
}

export function verifyImmutableInputs() {
  const { migration } = buildArtifacts();
  const issues = [];
  for (const input of migration.immutable_inputs) {
    const absolutePath = path.join(ROOT, input.path);
    if (!fs.existsSync(absolutePath)) issues.push(`missing ${input.path}`);
    else if (fileSha256(input.path) !== input.sha256) issues.push(`digest drift ${input.path}`);
  }
  return issues;
}

function writeOrCheck(check) {
  const files = expectedFiles();
  const stale = [];
  for (const [relativePath, source] of files) {
    const absolutePath = path.join(ROOT, relativePath);
    if (check) {
      if (!fs.existsSync(absolutePath) || fs.readFileSync(absolutePath, 'utf8') !== source) stale.push(relativePath);
    } else {
      fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
      fs.writeFileSync(absolutePath, source, 'utf8');
    }
  }
  if (stale.length) throw new Error(`STALE_SYSTEM_MODEL_STORY_RELEASE: ${stale.join(', ')}`);
  return files.size;
}

const isEntryPoint = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntryPoint) {
  try {
    const check = process.argv.includes('--check');
    const count = writeOrCheck(check);
    console.log(`${check ? 'Deterministic check passed for' : 'Generated'} ${count} released Story System Model files.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
