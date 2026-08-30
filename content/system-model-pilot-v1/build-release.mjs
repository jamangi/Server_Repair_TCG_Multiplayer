import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const RELEASE_ID = 'system-model-pilot-v1';
const CONTRACT_VERSION = 'system-model-contract-v1';
const CANONICALIZATION_VERSION = 'canonical-json-v1';
const DIGEST_ALGORITHM = 'sha256';

const OUTPUT_PATHS = Object.freeze({
  catalog: 'content/system-model-pilot-v1/system-model-catalog-v1.json',
  bindings: 'content/system-model-pilot-v1/ticket-system-bindings-v1.json',
  privateValidation: 'content/system-model-pilot-v1/private-compatibility-v1.json',
  overlay: 'content/system-model-pilot-v1/domain-relationship-overlay-v1.json',
  migration: 'content/system-model-pilot-v1/migration-v1.json',
  manifest: 'content/system-model-pilot-v1/RELEASE-MANIFEST.json',
  components: 'viewer/content/system-model-pilot-v1-components.json',
});

const SCHEMA_PATHS = Object.freeze([
  'schemas/domain/system_model_catalog.schema.json',
  'schemas/domain/ticket_system_binding_catalog.schema.json',
  'schemas/domain/system_model_private_validation_catalog.schema.json',
  'schemas/domain/system_model_relationship_overlay.schema.json',
  'schemas/domain/system_model_migration.schema.json',
  'schemas/domain/system_model_release_manifest.schema.json',
]);

const IMMUTABLE_INPUTS = Object.freeze([
  ['docs/system-models/task-050/atlas-data.json', '32dd04e2d8fd23e7a6bf35b2fe5a63decd6fbeb6fa29c1c98f7f817af946add8', 'TASK-050 research atlas'],
  ['docs/system-models/task-050/source-ledger.json', 'd4bda20ff9970fa6eb03c810b453cf789df23dc42000b4b9ddb575c75cc33da2', 'TASK-050 claim ledger'],
  ['docs/system-models/task-050/component-relationship-audit.json', '2871f6c4a6431d8407580db370011c8b027b6a3d307c3109370a6fde604a3fd8', 'TASK-050 gap audit'],
  ['docs/story/coverage/released-story-domain-coverage-v3.json', 'cd66630f1db0362d24e3e9bb9c222fc60bfe7ec8b3facd9149bb07e43ef98013', 'released Ticket coverage'],
  ['content/gameplay-v1/domain-snapshot-v3.json', 'd25f0e9f0371a0a45d106efcff19c80f5fb0ed175eabfeda7cac7c8106028fca', 'immutable gameplay domain snapshot'],
  ['content/gameplay-v1/card-catalog-v4.json', '6cf15e17f492b675aeb8da02df3c2114f0f3ca1ad89613a9a3f33470a855a8fd', 'immutable gameplay Card catalog'],
  ['content/gameplay-v1/decks-v4.json', '6eccefaf0ae1a4c8e7485ce27fcfc69f0990f5864188af31c06ab3b17269070c', 'immutable gameplay decks'],
  ['content/gameplay-v1/playable-coverage-v4.json', 'c1b907a6aea180bb5b618f4b95904bf4024eb3ba1e8413ebbab4963a029942dc', 'immutable playable coverage'],
  ['content/story-v1/campaigns/quiet-cascade/manifest.json', 'bc1b810d40e20f062444446d69c4ee180f07eefe61ff38667678f9f92dd95d02', 'campaign-one release'],
  ['content/story-v1/campaigns/quiet-cascade-characterization-v2/manifest.json', 'c90325f9cc3a93dddc335a4dedf61df91b7e4e9627ded660810ce2f67bf5a924', 'characterization release'],
  ['content/story-v1/campaigns/quiet-cascade-expansion-v3/manifest.json', 'b30104fa8c8fc50338bab017be53cb0ee46c83abb7c17c449b4d92f95cb07132', 'current Story release'],
]);

const PILOT_TICKET_IDS = Object.freeze([
  'ticket.generated.3ec80b1b0e7221ac725aedf9',
  'ticket.generated.5352abd871c2e9076be92a0b',
  'ticket.generated.3fd6eb04534f79b5b3f87f98',
  'ticket.generated.b34238282822e93980b5f1ad',
  'ticket.generated.f32b85cbf2054fdf0114f42a',
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

function unique(values) {
  return [...new Set(values.filter(Boolean))];
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
      digest_algorithm: DIGEST_ALGORITHM,
      content_digest: sha256(canonicalJson(value)),
    },
  };
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

const ROLE_DETAILS = Object.freeze({
  'role.psu_pair': ['PHYSICAL_COMPONENT', 2, 2, 'service_units', 'REQUIRED', 'HOT_SWAP_SERVICE_UNIT'],
  'role.system_board': ['PHYSICAL_COMPONENT', 1, 1, 'service_unit', 'REQUIRED', 'BOARD_SERVICE_UNIT'],
  'role.bmc': ['LOGICAL_ROLE', 1, 1, 'logical_role', 'REQUIRED', 'NOT_SEPARATE_SERVICE_UNIT'],
  'role.cpu': ['PHYSICAL_COMPONENT', 1, 2, 'sockets', 'REQUIRED', 'SOCKETED_SERVICE_UNIT'],
  'role.memory': ['PHYSICAL_COMPONENT', 1, 24, 'slots', 'OPTIONAL', 'INDIVIDUAL_SERVICE_UNIT'],
  'role.fans': ['PHYSICAL_COMPONENT', 1, null, 'grouped_units', 'REQUIRED', 'INDIVIDUAL_SERVICE_UNIT'],
  'role.hybrid_backplane': ['PHYSICAL_COMPONENT', 1, 1, 'service_unit', 'PROFILE_CONSTRAINED', 'REPLACEABLE_SERVICE_UNIT'],
  'role.sas_cable': ['INTERCONNECT_ROLE', 1, 1, 'bundled_path', 'PROFILE_CONSTRAINED', 'CABLE_SERVICE_PATH'],
  'role.pcie_cable': ['INTERCONNECT_ROLE', 1, 1, 'bundled_path', 'PROFILE_CONSTRAINED', 'CABLE_SERVICE_PATH'],
  'role.perc': ['PHYSICAL_COMPONENT', 1, 1, 'adapter_path', 'PROFILE_CONSTRAINED', 'ADAPTER_SERVICE_UNIT'],
  'role.nvme': ['PHYSICAL_COMPONENT', 4, 4, 'bays', 'PROFILE_CONSTRAINED', 'INDIVIDUAL_SERVICE_UNIT'],
  'role.sas_drives': ['PHYSICAL_COMPONENT', 20, 20, 'bays', 'PROFILE_CONSTRAINED', 'INDIVIDUAL_SERVICE_UNIT'],
  'role.nic': ['PHYSICAL_COMPONENT', 1, 1, 'adapter', 'REQUIRED', 'ADAPTER_SERVICE_UNIT'],
  'role.network_cable': ['PHYSICAL_COMPONENT', 1, 1, 'active_link', 'REQUIRED', 'EXTERNAL_REPLACEABLE_UNIT'],
  'role.system_bios': ['LOGICAL_ROLE', 1, 1, 'firmware_role', 'REQUIRED', 'NOT_SEPARATE_SERVICE_UNIT'],
  'role.input': ['PHYSICAL_COMPONENT', 2, 2, 'input_leads', 'REQUIRED', 'EXTERNAL_REPLACEABLE_UNIT'],
  'role.pib': ['PHYSICAL_COMPONENT', 1, 1, 'service_unit', 'REQUIRED', 'DEENERGIZED_SERVICE_UNIT'],
  'role.host_loads': ['PUBLIC_ABSTRACTION', 1, 1, 'grouped_load', 'OUT_OF_SCOPE_ABSTRACTION', 'OUTSIDE_SCOPE'],
});

const ROLE_LIFECYCLE = Object.freeze({
  'role.psu_pair': ['standby', 'host_power', 'bounded_runtime'],
  'role.system_board': ['standby', 'management_init', 'host_power', 'firmware_post', 'boot_select', 'os_handoff', 'bounded_runtime'],
  'role.bmc': ['standby', 'management_init', 'bounded_runtime'],
  'role.cpu': ['firmware_post', 'bounded_runtime'],
  'role.memory': ['firmware_post', 'bounded_runtime'],
  'role.fans': ['management_init', 'bounded_runtime'],
  'role.hybrid_backplane': ['host_power', 'firmware_post', 'bounded_runtime'],
  'role.sas_cable': ['firmware_post', 'boot_select', 'bounded_runtime'],
  'role.pcie_cable': ['firmware_post', 'boot_select', 'bounded_runtime'],
  'role.perc': ['firmware_post', 'boot_select', 'bounded_runtime'],
  'role.nvme': ['firmware_post', 'boot_select', 'bounded_runtime'],
  'role.sas_drives': ['firmware_post', 'boot_select', 'bounded_runtime'],
  'role.nic': ['firmware_post', 'bounded_runtime'],
  'role.network_cable': ['bounded_runtime'],
  'role.system_bios': ['firmware_post', 'boot_select', 'os_handoff'],
});

const POWER_ROLE_LIFECYCLE = Object.freeze({
  'role.input': ['input', 'service', 'verify'],
  'role.psu_pair': ['input', 'standby', 'status', 'host_power', 'service', 'verify'],
  'role.pib': ['standby', 'host_power', 'service', 'verify'],
  'role.system_board': ['standby', 'host_power', 'verify'],
  'role.bmc': ['standby', 'status', 'host_power', 'verify'],
  'role.host_loads': ['host_power', 'verify'],
});

const NODE_ROLES = Object.freeze({
  'profile.dell.poweredge-r740xd.hybrid-24x2_5.v1': {
    psu: ['role.psu_pair'], board: ['role.system_board'], bmc: ['role.bmc'], cpu_memory: ['role.cpu', 'role.memory'],
    uefi: ['role.system_bios'], backplane: ['role.hybrid_backplane'], sas_path: ['role.sas_cable', 'role.perc'],
    nvme_path: ['role.pcie_cable'], drives: ['role.nvme', 'role.sas_drives'], nic: ['role.nic'],
    link: ['role.network_cable'], fans: ['role.fans'], ac: [], os: [],
  },
  'profile.dell.poweredge-r740xd2.power-interposer.v1': {
    ac: ['role.input'], psu: ['role.psu_pair'], power_interposer: ['role.pib'], board: ['role.system_board'],
    bmc: ['role.bmc'], host: ['role.host_loads'], service: [],
  },
});

const EDGE_RELATIONS = Object.freeze({
  'e.ac-psu': 'DELIVERS_STANDBY_POWER_TO',
  'e.psu-board': 'DELIVERS_SWITCHED_POWER_TO',
  'e.board-bmc': 'CONTROL_LINK_TO',
  'e.board-uefi': 'CONTAINS',
  'e.uefi-cpu': 'ENABLES',
  'e.uefi-os': 'HANDOFF_TO',
  'e.board-backplane': 'DELIVERS_SWITCHED_POWER_TO',
  'e.board-sas': 'DATA_LINK_TO',
  'e.sas-backplane': 'DATA_LINK_TO',
  'e.board-nvme': 'DATA_LINK_TO',
  'e.nvme-backplane': 'DATA_LINK_TO',
  'e.backplane-drives': 'MOUNTS',
  'e.board-nic': 'DATA_LINK_TO',
  'e.nic-link': 'DATA_LINK_TO',
  'e.bmc-inventory': 'REPORTS_INVENTORY_FOR',
  'e.bmc-fans': 'OBSERVES',
  'e.os-storage': 'DATA_LINK_TO',
  'e.os-network': 'DATA_LINK_TO',
  'e.fans-host': 'COOLS',
  'e.psu-pib': 'DELIVERS_STANDBY_POWER_TO',
  'e.pib-board': 'DELIVERS_SWITCHED_POWER_TO',
  'e.board-host': 'DELIVERS_SWITCHED_POWER_TO',
  'e.bmc-psu': 'OBSERVES',
  'e.service-psu': 'REQUIRES_DEENERGIZATION_BEFORE',
  'e.service-pib': 'REQUIRES_DEENERGIZATION_BEFORE',
});

const EDGE_STAGES = Object.freeze({
  'e.ac-psu': ['standby', 'host_power', 'input'],
  'e.psu-board': ['standby', 'host_power', 'bounded_runtime'],
  'e.board-bmc': ['standby', 'management_init', 'bounded_runtime'],
  'e.board-uefi': ['firmware_post', 'boot_select'],
  'e.uefi-cpu': ['firmware_post'],
  'e.uefi-os': ['os_handoff'],
  'e.board-backplane': ['host_power', 'bounded_runtime'],
  'e.board-sas': ['firmware_post', 'bounded_runtime'],
  'e.sas-backplane': ['firmware_post', 'bounded_runtime'],
  'e.board-nvme': ['firmware_post', 'bounded_runtime'],
  'e.nvme-backplane': ['firmware_post', 'bounded_runtime'],
  'e.backplane-drives': ['firmware_post', 'bounded_runtime'],
  'e.board-nic': ['firmware_post', 'bounded_runtime'],
  'e.nic-link': ['bounded_runtime'],
  'e.bmc-inventory': ['management_init', 'bounded_runtime'],
  'e.bmc-fans': ['management_init', 'bounded_runtime'],
  'e.os-storage': ['bounded_runtime'],
  'e.os-network': ['bounded_runtime'],
  'e.fans-host': ['bounded_runtime'],
  'e.psu-pib': ['standby', 'host_power', 'verify'],
  'e.pib-board': ['standby', 'host_power', 'verify'],
  'e.board-host': ['host_power', 'verify'],
  'e.bmc-psu': ['status', 'host_power', 'verify'],
  'e.service-psu': ['service'],
  'e.service-pib': ['service'],
});

const PROFILE_PATHS = Object.freeze({
  'profile.dell.poweredge-r740xd.hybrid-24x2_5.v1': [
    ['path.r740xd.power', 'POWER', ['ac', 'psu', 'board', 'backplane'], ['e.ac-psu', 'e.psu-board', 'e.board-backplane']],
    ['path.r740xd.management-storage', 'OBSERVATION', ['bmc', 'backplane'], ['e.bmc-inventory']],
    ['path.r740xd.sas-storage', 'DATA', ['board', 'sas_path', 'backplane', 'drives'], ['e.board-sas', 'e.sas-backplane', 'e.backplane-drives']],
    ['path.r740xd.nvme-storage', 'DATA', ['board', 'nvme_path', 'backplane', 'drives'], ['e.board-nvme', 'e.nvme-backplane', 'e.backplane-drives']],
    ['path.r740xd.boot-handoff', 'LIFECYCLE', ['uefi', 'os'], ['e.uefi-os']],
    ['path.r740xd.network-runtime', 'DATA', ['os', 'nic', 'link'], ['e.os-network', 'e.nic-link']],
    ['path.r740xd.cooling-observation', 'COOLING', ['bmc', 'fans', 'cpu_memory'], ['e.bmc-fans', 'e.fans-host']],
  ],
  'profile.dell.poweredge-r740xd2.power-interposer.v1': [
    ['path.r740xd2.power-distribution', 'POWER', ['ac', 'psu', 'power_interposer', 'board', 'host'], ['e.ac-psu', 'e.psu-pib', 'e.pib-board', 'e.board-host']],
    ['path.r740xd2.power-status', 'OBSERVATION', ['bmc', 'psu'], ['e.bmc-psu']],
    ['path.r740xd2.psu-service', 'LIFECYCLE', ['service', 'psu'], ['e.service-psu']],
    ['path.r740xd2.pib-service', 'LIFECYCLE', ['service', 'power_interposer'], ['e.service-pib']],
  ],
});

const PROFILE_LIFECYCLE_RELATIONS = Object.freeze({
  'profile.dell.poweredge-r740xd.hybrid-24x2_5.v1': [
    ['lifecycle.r740xd.01', 'standby', 'management_init', 'PRECEDES'],
    ['lifecycle.r740xd.02', 'management_init', 'host_power', 'PARALLEL_WITH'],
    ['lifecycle.r740xd.03', 'host_power', 'firmware_post', 'ENABLES'],
    ['lifecycle.r740xd.04', 'firmware_post', 'boot_select', 'PRECEDES'],
    ['lifecycle.r740xd.05', 'boot_select', 'os_handoff', 'PRECEDES'],
    ['lifecycle.r740xd.06', 'os_handoff', 'bounded_runtime', 'HANDOFF_TO'],
  ],
  'profile.dell.poweredge-r740xd2.power-interposer.v1': [
    ['lifecycle.r740xd2.01', 'input', 'standby', 'PRECEDES'],
    ['lifecycle.r740xd2.02', 'standby', 'host_power', 'ENABLES'],
    ['lifecycle.r740xd2.03', 'status', 'host_power', 'PARALLEL_WITH'],
    ['lifecycle.r740xd2.04', 'host_power', 'service', 'OPTIONAL_AFTER'],
    ['lifecycle.r740xd2.05', 'service', 'verify', 'HANDOFF_TO'],
  ],
});

const PROFILE_SURFACES = Object.freeze({
  'profile.dell.poweredge-r740xd.hybrid-24x2_5.v1': [
    ['surface.r740xd.bmc', ['bmc'], 'MANAGEMENT', 'QUERY', ['management_init', 'bounded_runtime'], ['claim.idrac9.out-of-band-management', 'claim.idrac9.hardware-inventory']],
    ['surface.r740xd.uefi', ['uefi'], 'HOST_FIRMWARE', 'BOTH', ['firmware_post', 'boot_select'], ['claim.r740xd.uefi-boot-mode', 'claim.r740xd.boot-order-configurable']],
    ['surface.r740xd.os', ['os'], 'OS', 'QUERY', ['bounded_runtime'], ['claim.uefi.os-loader-handoff']],
    ['surface.r740xd.storage-service', ['backplane', 'sas_path', 'nvme_path', 'drives'], 'PHYSICAL_SERVICE', 'CHANGE', ['bounded_runtime'], ['claim.r740xd.backplane-serviceable', 'claim.r740xd.sas-perc-path', 'claim.r740xd.pcie-nvme-path']],
  ],
  'profile.dell.poweredge-r740xd2.power-interposer.v1': [
    ['surface.r740xd2.management-status', ['bmc'], 'MANAGEMENT', 'QUERY', ['status', 'host_power', 'verify'], ['claim.r740xd2.psu-mismatch-reporting']],
    ['surface.r740xd2.pib-service', ['service', 'psu', 'power_interposer'], 'PHYSICAL_SERVICE', 'CHANGE', ['service'], ['claim.r740xd2.pib-deenergize', 'claim.r740xd2.pib-remove-psus', 'claim.r740xd2.pib-disconnect-cables']],
  ],
});

const PROFILE_OBSERVATIONS = Object.freeze({
  'profile.dell.poweredge-r740xd.hybrid-24x2_5.v1': [
    ['observation.r740xd.bmc-inventory', 'INDIRECT', ['bmc'], ['backplane', 'drives', 'nic'], 'management inventory and lifecycle events', ['management_init', 'bounded_runtime'], ['claim.idrac9.hardware-inventory', 'claim.idrac9.storage-observation']],
    ['observation.r740xd.firmware-inventory', 'PATH_BASED', ['uefi'], ['board', 'drives', 'nic'], 'firmware discovery and policy', ['firmware_post', 'boot_select'], ['claim.r740xd.uefi-boot-mode', 'claim.r740xd.boot-order-configurable']],
    ['observation.r740xd.os-inventory', 'PATH_BASED', ['os'], ['drives', 'nic'], 'host driver and runtime inventory', ['bounded_runtime'], ['claim.uefi.os-loader-handoff']],
    ['observation.r740xd.physical-service', 'DIRECT', ['backplane', 'sas_path', 'nvme_path', 'drives'], ['backplane', 'sas_path', 'nvme_path', 'drives'], 'accessible service boundaries', ['bounded_runtime'], ['claim.r740xd.backplane-serviceable', 'claim.r740xd.sas-perc-path', 'claim.r740xd.pcie-nvme-path']],
    ['observation.r740xd.network-runtime', 'PATH_BASED', ['os', 'nic'], ['nic', 'link'], 'host link and runtime counters', ['bounded_runtime'], ['claim.r740xd.network-daughter-card', 'claim.uefi.os-loader-handoff']],
  ],
  'profile.dell.poweredge-r740xd2.power-interposer.v1': [
    ['observation.r740xd2.power-status', 'INDIRECT', ['bmc'], ['psu'], 'supported PSU status and mismatch reporting', ['status', 'host_power', 'verify'], ['claim.r740xd2.psu-mismatch-reporting']],
    ['observation.r740xd2.power-path', 'PATH_BASED', ['service', 'bmc'], ['ac', 'psu', 'power_interposer', 'board', 'host'], 'successive power-path service boundaries', ['service', 'verify'], ['claim.r740xd2.pib-system-board-cables', 'claim.r740xd2.pib-deenergize']],
  ],
});

const PROFILE_CAPABILITIES = Object.freeze({
  'profile.dell.poweredge-r740xd.hybrid-24x2_5.v1': [
    ['capability.r740xd.hybrid-storage', 'Supports the fixed 20 SAS/SATA plus 4 NVMe hybrid option', ['backplane', 'sas_path', 'nvme_path', 'drives'], ['claim.r740xd.twenty-sas-four-nvme-option']],
    ['capability.r740xd.management-inventory', 'Exposes documented out-of-band inventory and lifecycle observations', ['bmc'], ['claim.idrac9.hardware-inventory', 'claim.idrac9.lifecycle-log-categories']],
    ['capability.r740xd.firmware-policy', 'Exposes host firmware and configurable boot policy', ['uefi'], ['claim.r740xd.uefi-boot-mode', 'claim.r740xd.boot-order-configurable']],
    ['capability.r740xd.host-network', 'Includes a host network-adapter and physical-link boundary', ['nic', 'link'], ['claim.r740xd.network-daughter-card']],
    ['capability.r740xd.documented-service', 'Provides documented storage service boundaries', ['backplane', 'sas_path', 'nvme_path', 'drives'], ['claim.r740xd.backplane-serviceable', 'claim.r740xd.sas-perc-path', 'claim.r740xd.pcie-nvme-path']],
  ],
  'profile.dell.poweredge-r740xd2.power-interposer.v1': [
    ['capability.r740xd2.redundant-power', 'Supports two supplies in a documented 1+1 arrangement', ['ac', 'psu'], ['claim.r740xd2.dual-psu', 'claim.r740xd2.one-plus-one-redundancy']],
    ['capability.r740xd2.pib-service', 'Provides a documented de-energized Power Interposer Board service boundary', ['service', 'power_interposer'], ['claim.r740xd2.pib-service-unit', 'claim.r740xd2.pib-deenergize']],
    ['capability.r740xd2.power-path-observation', 'Exposes bounded upstream, shared-distribution, and downstream path segments', ['ac', 'psu', 'power_interposer', 'board', 'host'], ['claim.r740xd2.pib-system-board-cables', 'claim.r740xd2.psu-mismatch-reporting']],
  ],
});

const PROFILE_IDENTITIES = Object.freeze({
  'profile.dell.poweredge-r740xd.hybrid-24x2_5.v1': {
    manufacturer: 'Dell Technologies', family: 'PowerEdge R740xd', model_scope: '24 x 2.5-inch hybrid SAS/SATA/NVMe option', generation_or_era: '14th generation',
    exact_details: ['chassis family', '20 SAS/SATA plus 4 NVMe hybrid option', 'documented service boundaries', 'iDRAC9 management capabilities'],
    generalized_details: ['diagram geometry', 'cable bundling', 'lifecycle prose', 'UEFI-to-OS handoff abstraction'],
  },
  'profile.dell.poweredge-r740xd2.power-interposer.v1': {
    manufacturer: 'Dell Technologies', family: 'PowerEdge R740xd2', model_scope: 'dual-PSU Power Interposer Board service path', generation_or_era: '14th generation',
    exact_details: ['two-PSU multiplicity', '1+1 redundancy', 'Power Interposer Board service boundary', 'PSU-cage placement', 'board-cable connection'],
    generalized_details: ['internal rail topology', 'non-power subsystem wiring', 'grouped host load'],
  },
});

const PROFILE_CONSTRAINT_CLAIMS = Object.freeze({
  'profile.dell.poweredge-r740xd.hybrid-24x2_5.v1': [
    ['claim.r740xd.hybrid-backplane', 'claim.r740xd.twenty-sas-four-nvme-option'],
    ['claim.r740xd.sas-perc-path', 'claim.r740xd.pcie-nvme-path'],
    ['claim.r740xd.network-daughter-card'],
    ['claim.r740xd.dual-psu'],
  ],
  'profile.dell.poweredge-r740xd2.power-interposer.v1': [
    ['claim.r740xd2.dual-psu', 'claim.r740xd2.one-plus-one-redundancy'],
    ['claim.r740xd2.pib-service-unit'],
    ['claim.r740xd2.pib-service-unit', 'claim.r740xd.hybrid-backplane'],
  ],
});

function componentPack() {
  return {
    pack_id: 'system_model_pilot_v1_components',
    name: 'System Model Pilot V1 Components',
    version: '1.0.0',
    entities: [
      {
        id: 'component.firmware.system_bios', entity_type: 'component',
        presentation: { display_name: 'System BIOS / UEFI Firmware', short_description: 'The host-firmware role that initializes platform hardware, exposes setup policy, and hands control to a selected boot path.' },
        source: { expansion_id: 'expansion.system_model_pilot_v1', version: '1.0.0', status: 'published', search_tags: ['bios', 'firmware', 'uefi', 'boot policy'] },
        component_type: 'firmware_role', subsystem: 'firmware', interfaces: [], compatibility_tags: ['firmware-bearing-role'],
        hot_swappable: false, replaceable: false, inspectable: true,
        education_text: 'This is a logical firmware-bearing role on the system-board service boundary, not a claim that BIOS is a separately replaceable board.',
      },
      {
        id: 'component.storage.pcie_nvme_interconnect', entity_type: 'component',
        presentation: { display_name: 'PCIe / NVMe Interconnect', short_description: 'A documented cable-and-connector service path carrying the direct NVMe branch between a hybrid backplane and PCIe endpoints.' },
        source: { expansion_id: 'expansion.system_model_pilot_v1', version: '1.0.0', status: 'published', search_tags: ['cable', 'interconnect', 'nvme', 'pcie', 'storage'] },
        component_type: 'data_interconnect', subsystem: 'storage', interfaces: [], compatibility_tags: ['pcie-nvme-path'],
        hot_swappable: false, replaceable: true, inspectable: true,
        education_text: 'The definition stays at a bundled service-path level because the approved sources do not prove one universal lane, riser, controller, or connector layout.',
      },
    ],
  };
}

function lifecycleStageMode(stage) {
  if (stage.relation.includes('PARALLEL')) return 'PARALLEL';
  if (stage.relation.includes('OPTIONAL')) return 'CONDITIONAL';
  if (stage.relation.includes('DEENERGIZATION')) return 'SERVICE_CONDITIONAL';
  return 'REQUIRED';
}

function profilePaths(profile) {
  const edgeById = new Map(profile.edges.map((edge) => [edge.edge_id, edge]));
  return PROFILE_PATHS[profile.profile_id].map(([pathId, flowKind, nodeIds, edgeIds]) => ({
    path_id: pathId,
    flow_kind: flowKind,
    node_ids: nodeIds,
    edge_ids: edgeIds,
    start_node_id: nodeIds[0],
    end_node_id: nodeIds.at(-1),
    lifecycle_stage_ids: unique(edgeIds.flatMap((edgeId) => EDGE_STAGES[edgeId]).filter((stageId) => profile.lifecycle.some((stage) => stage.stage_id === stageId))),
    public_visibility: 'PUBLIC',
    source_claim_ids: unique(edgeIds.flatMap((edgeId) => edgeById.get(edgeId).claim_ids)),
  }));
}

function actionKind(actionId) {
  if (actionId.startsWith('command.')) return 'COMMAND';
  if (actionId.startsWith('test.')) return 'TEST';
  if (actionId.startsWith('repair.')) return 'REPAIR';
  return 'VERIFICATION';
}

function attachmentKind(kind) {
  return {
    COMMAND: 'QUERIES_CONTROL_SURFACE', TEST: 'OBSERVES_COMPONENT_PATH', REPAIR: 'INTERVENES_ON_SERVICE_UNIT', VERIFICATION: 'VERIFIES_STATE',
  }[kind];
}

function ruleForAction(atlas, actionId) {
  return atlas.action_mapping_rules.find((rule) => rule.match === actionId || (rule.match_prefix && actionId.startsWith(rule.match_prefix)));
}

function actionAttachments(profile, tickets, atlas, recordById) {
  const assignedTickets = atlas.dossiers.filter((dossier) => dossier.profile_id === profile.profile_id).map((dossier) => tickets.get(dossier.ticket_id));
  const actionIds = unique(assignedTickets.flatMap((ticket) => [
    ...ticket.diagnostics.relevant_source_ids,
    ...ticket.repair_procedure_ids,
    ...ticket.validation_procedure_ids,
  ])).sort();
  const nodeById = new Map(profile.nodes.map((node) => [node.node_id, node]));
  const paths = profilePaths(profile);
  const surfaces = PROFILE_SURFACES[profile.profile_id];
  const observations = PROFILE_OBSERVATIONS[profile.profile_id];
  const lifecycleByRole = profile.profile_id.endsWith('power-interposer.v1') ? POWER_ROLE_LIFECYCLE : ROLE_LIFECYCLE;
  return actionIds.map((actionId) => {
    const kind = actionKind(actionId);
    const rule = ruleForAction(atlas, actionId);
    const nodeIds = rule.target_nodes.filter((nodeId) => nodeById.has(nodeId));
    const relevantPaths = paths.filter((candidate) => candidate.node_ids.filter((nodeId) => nodeIds.includes(nodeId)).length >= 2).map((candidate) => candidate.path_id);
    const surfaceIds = surfaces.filter(([, candidateNodeIds]) => candidateNodeIds.some((nodeId) => nodeIds.includes(nodeId))).map(([surfaceId]) => surfaceId);
    const observationIds = observations.filter(([, , observerIds, subjectIds]) => [...observerIds, ...subjectIds].some((nodeId) => nodeIds.includes(nodeId))).map(([observationId]) => observationId);
    const claims = unique(nodeIds.flatMap((nodeId) => nodeById.get(nodeId).claim_ids));
    const displayName = recordById.get(actionId)?.presentation?.display_name ?? actionId;
    const targetLabel = nodeIds.map((nodeId) => nodeById.get(nodeId).label).join(' -> ');
    return {
      attachment_id: `attachment.${profile.profile_id.slice('profile.'.length)}.${actionId}`,
      action_definition_id: actionId,
      action_kind: kind,
      attachment_kind: attachmentKind(kind),
      target_node_ids: nodeIds,
      target_path_ids: relevantPaths,
      control_surface_ids: surfaceIds,
      observation_point_ids: observationIds,
      relevant_stage_ids: unique(nodeIds.flatMap((nodeId) => NODE_ROLES[profile.profile_id][nodeId]
        .flatMap((roleId) => lifecycleByRole[roleId] ?? []))),
      rationale_template_id: 'template.system-model.action-rationale.v1',
      rationale_tokens: [
        { token: 'ACTION_LABEL', value: displayName },
        { token: 'TARGET_LABEL', value: targetLabel },
        { token: 'REASON', value: rule.relation },
      ],
      source_claim_ids: claims,
      public_visibility: 'PUBLIC',
      authority_boundary: 'SYSTEM_RELEVANCE_ONLY',
    };
  });
}

function buildProfile(profile, tickets, atlas, recordById) {
  const isPowerProfile = profile.profile_id.endsWith('power-interposer.v1');
  const componentItems = structuredClone(profile.components);
  if (!isPowerProfile) {
    const nvmeRole = componentItems.find((item) => item.role_id === 'role.pcie_cable');
    nvmeRole.domain_component_id = 'component.storage.pcie_nvme_interconnect';
    nvmeRole.gap_status = 'resolved_task_051';
    componentItems.push({
      role_id: 'role.system_bios', label: 'System BIOS / UEFI firmware role', role: 'Initializes host hardware, exposes boot policy, and hands off to the OS loader',
      multiplicity: '1 logical role', replaceability: 'Serviced through the system-board or supported firmware procedure', optionality: 'Required',
      domain_component_id: 'component.firmware.system_bios', gap_status: 'resolved_task_051',
      claim_ids: ['claim.r740xd.uefi-boot-mode', 'claim.r740xd.boot-order-configurable', 'claim.uefi.os-loader-handoff'],
    });
  }
  const lifecycleMap = isPowerProfile ? POWER_ROLE_LIFECYCLE : ROLE_LIFECYCLE;
  const roles = componentItems.map((item) => {
    const [roleKind, min, max, unit, optionality, replaceability] = ROLE_DETAILS[item.role_id];
    return {
      role_id: item.role_id,
      label: item.label,
      role_kind: roleKind,
      purpose: item.role,
      component_definition_id: item.domain_component_id ?? null,
      multiplicity: { minimum: min, maximum: max, unit },
      optionality,
      replaceability,
      serviceability_note: item.replaceability,
      lifecycle_stage_ids: lifecycleMap[item.role_id],
      public_visibility: 'PUBLIC',
      synchronization_status: item.gap_status === 'resolved_task_051' ? 'RESOLVED_TASK_051'
        : item.gap_status === 'optional_outside_scope' ? 'OUT_OF_SCOPE_ABSTRACTION' : 'EXISTING_COMPONENT',
      source_claim_ids: item.claim_ids,
    };
  });
  const nodes = profile.nodes.map((node) => ({
    node_id: node.node_id,
    label: node.label,
    node_kind: node.kind,
    plane: node.plane,
    role_ids: NODE_ROLES[profile.profile_id][node.node_id],
    public_visibility: 'PUBLIC',
    source_claim_ids: node.claim_ids,
  }));
  const edges = profile.edges.map((edge) => ({
    edge_id: edge.edge_id,
    from_node_id: edge.from,
    to_node_id: edge.to,
    relation_type: EDGE_RELATIONS[edge.edge_id],
    direction: 'DIRECTED',
    cardinality: ['e.ac-psu', 'e.backplane-drives'].includes(edge.edge_id) ? 'ONE_TO_MANY' : 'ONE_TO_ONE',
    label: edge.label,
    lifecycle_stage_ids: unique(EDGE_STAGES[edge.edge_id].filter((stageId) => profile.lifecycle.some((stage) => stage.stage_id === stageId))),
    public_visibility: 'PUBLIC',
    source_claim_ids: edge.claim_ids,
  }));
  const lifecycleStages = profile.lifecycle.map((stage) => ({
    stage_id: stage.stage_id,
    order_key: stage.order,
    label: stage.label,
    stage_mode: lifecycleStageMode(stage),
    condition: stage.relation.includes('OPTIONAL') || stage.relation.includes('DEENERGIZATION') ? 'Only during an authorized service path.' : null,
    source_claim_ids: stage.claim_ids,
  }));
  const lifecycleRelations = PROFILE_LIFECYCLE_RELATIONS[profile.profile_id].map(([relationId, from, to, relationType]) => ({
    relation_id: relationId,
    from_stage_id: from,
    to_stage_id: to,
    relation_type: relationType,
    source_claim_ids: unique([
      ...profile.lifecycle.find((stage) => stage.stage_id === from).claim_ids,
      ...profile.lifecycle.find((stage) => stage.stage_id === to).claim_ids,
    ]),
  }));
  const paths = profilePaths(profile);
  const publicAbstractions = profile.known_abstractions.map((statement, index) => ({
    abstraction_id: `abstraction.${profile.profile_id.slice('profile.'.length)}.${String(index + 1).padStart(2, '0')}`,
    label: statement,
    represented_node_ids: index === 0 ? nodes.map((node) => node.node_id) : nodes.slice(Math.min(index, nodes.length - 1), Math.min(index + 3, nodes.length)).map((node) => node.node_id),
    source_claim_ids: [profile.claim_ids[index % profile.claim_ids.length]],
  }));
  const identity = PROFILE_IDENTITIES[profile.profile_id];
  const built = {
    profile_id: profile.profile_id,
    profile_revision: 1,
    lifecycle_status: 'PUBLISHED',
    identity: { ...identity, exactness_class: 'MIXED' },
    option_constraints: profile.supported_option_constraints.map((statement, index) => ({
      constraint_id: `constraint.${profile.profile_id.slice('profile.'.length)}.${String(index + 1).padStart(2, '0')}`,
      statement,
      enforcement: 'REQUIRED_FOR_PROFILE',
      source_claim_ids: PROFILE_CONSTRAINT_CLAIMS[profile.profile_id][index],
    })),
    plane_declarations: profile.planes.map((plane) => ({ ...plane, source_claim_ids: [profile.claim_ids[0]] })),
    role_instances: roles,
    topology_nodes: nodes,
    topology_edges: edges,
    paths,
    lifecycle_stages: lifecycleStages,
    lifecycle_relations: lifecycleRelations,
    control_surfaces: PROFILE_SURFACES[profile.profile_id].map(([surfaceId, nodeIds, accessDomain, capability, stageIds, claimIds]) => ({
      surface_id: surfaceId, node_ids: nodeIds, access_domain: accessDomain, capability, lifecycle_stage_ids: stageIds, public_visibility: 'PUBLIC', source_claim_ids: claimIds,
    })),
    observation_points: PROFILE_OBSERVATIONS[profile.profile_id].map(([observationId, kind, observerNodeIds, subjectNodeIds, transport, stageIds, claimIds]) => ({
      observation_id: observationId, observation_kind: kind, observer_node_ids: observerNodeIds, subject_node_ids: subjectNodeIds, transport, lifecycle_stage_ids: stageIds,
      limits: 'Explains observation scope only; it does not define an outcome, Evidence disposition, or legal intent.', public_visibility: 'PUBLIC', source_claim_ids: claimIds,
    })),
    finder_capabilities: PROFILE_CAPABILITIES[profile.profile_id].map(([capabilityId, label, nodeIds, claimIds]) => ({
      capability_id: capabilityId, label, node_ids: nodeIds, public_visibility: 'PUBLIC', source_claim_ids: claimIds,
    })),
    action_attachments: actionAttachments(profile, tickets, atlas, recordById),
    description_program: {
      template_catalog_version: 'system-model-template-catalog-v1',
      sections: [{
        section_id: `description.${profile.profile_id.slice('profile.'.length)}.lifecycle`,
        heading: 'How this system starts and runs',
        clauses: lifecycleStages.map((stage) => ({
          clause_id: `clause.${profile.profile_id.slice('profile.'.length)}.${stage.stage_id}`,
          clause_kind: stage.stage_mode === 'PARALLEL' ? 'PARALLEL' : stage.stage_mode === 'REQUIRED' ? 'ALWAYS' : 'WHEN_OPTION',
          stage_id: stage.stage_id,
          template_id: 'template.system-model.lifecycle-stage.v1',
          tokens: [{ token: 'STAGE_LABEL', value: stage.label }],
          source_claim_ids: stage.source_claim_ids,
        })),
      }],
    },
    public_abstractions: publicAbstractions,
    provenance: {
      claim_ledger_id: 'source-ledger.task-050.v1',
      source_manifest_version: 'task-050-source-ledger-v1',
      source_claim_ids: profile.claim_ids,
      exactness_statement: profile.exactness,
    },
    synchronization: {
      component_catalog_version: 'viewer-domain-plus-system-model-pilot-v1',
      referenced_component_ids: unique(roles.map((role) => role.component_definition_id)),
      resolved_gap_ids: isPowerProfile ? [] : ['gap.component.storage.pcie_nvme_interconnect', 'gap.component.firmware.system_bios'],
    },
  };
  return withSerialization(built);
}

const PUBLIC_CLOSURES = Object.freeze({
  'ticket.generated.3ec80b1b0e7221ac725aedf9': {
    'fault.boot.device.not_detected': [['uefi', 'drives'], ['path.r740xd.nvme-storage'], 'Discovery spans firmware inventory, the NVMe path, and installed devices.'],
    'fault.boot.order.incorrect': [['uefi', 'os'], ['path.r740xd.boot-handoff'], 'A configurable boot-policy surface precedes the loader handoff.'],
    'fault.storage.cable.loose': [['nvme_path', 'backplane'], ['path.r740xd.nvme-storage'], 'The hybrid option contains a reconnectable interconnect and backplane boundary.'],
    'fault.storage.nvme.device_failed': [['drives'], ['path.r740xd.nvme-storage'], 'The fixed option contains replaceable NVMe service units.'],
    'fault.storage.raid.controller_failed': [['sas_path', 'backplane'], ['path.r740xd.sas-storage'], 'A separate controller-attached SAS branch remains visibly possible.'],
  },
  'ticket.generated.5352abd871c2e9076be92a0b': {
    'fault.storage.backplane.path_failed': [['backplane'], ['path.r740xd.sas-storage', 'path.r740xd.nvme-storage'], 'The replaceable hybrid backplane is a distinct service boundary.'],
    'fault.storage.cable.failed': [['sas_path', 'nvme_path'], ['path.r740xd.sas-storage', 'path.r740xd.nvme-storage'], 'Separate documented SAS and PCIe/NVMe interconnect branches remain visible.'],
    'fault.storage.cable.loose': [['sas_path', 'nvme_path', 'backplane'], ['path.r740xd.sas-storage', 'path.r740xd.nvme-storage'], 'Both reconnectable branch boundaries remain possible until authorized Evidence narrows them.'],
    'fault.storage.nvme.device_failed': [['drives', 'nvme_path'], ['path.r740xd.nvme-storage'], 'Replaceable NVMe devices remain present.'],
    'fault.storage.sas.drive_failed': [['drives', 'sas_path'], ['path.r740xd.sas-storage'], 'Controller-attached SAS/SATA bays remain present.'],
  },
  'ticket.generated.3fd6eb04534f79b5b3f87f98': {
    'fault.board.system.failed': [['board', 'host'], ['path.r740xd2.power-distribution'], 'The downstream board and host load are distinct visible boundaries.'],
    'fault.power.distribution_board.failed': [['power_interposer'], ['path.r740xd2.power-distribution'], 'The documented Power Interposer Board realizes the broader distribution-board role.'],
    'fault.power.input.cable_loose': [['ac', 'psu'], ['path.r740xd2.power-distribution'], 'Two external input boundaries precede the PSU pair.'],
    'fault.power.psu.failed': [['psu'], ['path.r740xd2.power-distribution'], 'Two serviceable supplies remain visible as a redundant pair.'],
    'fault.power.psu.not_seated': [['psu', 'power_interposer'], ['path.r740xd2.power-distribution'], 'The removable PSU-to-cage/interposer service boundary remains visible.'],
  },
  'ticket.generated.b34238282822e93980b5f1ad': {
    'fault.firmware.version_set.incompatible': [['bmc', 'uefi', 'nic', 'os'], ['path.r740xd.boot-handoff', 'path.r740xd.network-runtime'], 'Management inventory, firmware policy, host adapter, and runtime boundaries are all present.'],
    'fault.network.cable.disconnected': [['link'], ['path.r740xd.network-runtime'], 'The external port, cable, and peer boundary remains distinct.'],
    'fault.network.cable.failed': [['link'], ['path.r740xd.network-runtime'], 'The physical-link boundary supports a failed-cable possibility without displaying link state.'],
    'fault.network.nic.failed': [['nic'], ['path.r740xd.network-runtime'], 'The host network adapter remains a distinct service role.'],
  },
  'ticket.generated.f32b85cbf2054fdf0114f42a': {
    'fault.firmware.version_set.incompatible': [['bmc', 'uefi', 'os'], ['path.r740xd.boot-handoff'], 'Management inventory, host firmware, and runtime handoff boundaries remain present.'],
    'fault.management.bmc_firmware.corrupt': [['bmc', 'board'], ['path.r740xd.management-storage'], 'The recoverable management-firmware role remains distinct from the board service boundary.'],
  },
});

const PUBLIC_REQUIREMENTS = Object.freeze({
  'ticket.generated.3ec80b1b0e7221ac725aedf9': ['capability.r740xd.hybrid-storage', 'capability.r740xd.management-inventory', 'capability.r740xd.firmware-policy', 'capability.r740xd.documented-service'],
  'ticket.generated.5352abd871c2e9076be92a0b': ['capability.r740xd.hybrid-storage', 'capability.r740xd.management-inventory', 'capability.r740xd.documented-service'],
  'ticket.generated.3fd6eb04534f79b5b3f87f98': ['capability.r740xd2.redundant-power', 'capability.r740xd2.pib-service', 'capability.r740xd2.power-path-observation'],
  'ticket.generated.b34238282822e93980b5f1ad': ['capability.r740xd.management-inventory', 'capability.r740xd.firmware-policy', 'capability.r740xd.host-network'],
  'ticket.generated.f32b85cbf2054fdf0114f42a': ['capability.r740xd.management-inventory', 'capability.r740xd.firmware-policy'],
});

function buildPublicBindings(atlas, tickets, profileById) {
  return atlas.dossiers.map((dossier) => {
    const ticket = tickets.get(dossier.ticket_id);
    const profile = profileById.get(dossier.profile_id);
    const publicSurface = {
      public_symptom_ids: ticket.public_symptom_ids,
      public_candidate_fault_ids: ticket.public_candidate_fault_ids,
    };
    const binding = {
      binding_id: `binding.${ticket.fingerprint_id}.system-model.v1`,
      public_resolver_key: `resolver.${ticket.fingerprint_id}.v1`,
      ticket_id: ticket.ticket_id,
      fingerprint_id: ticket.fingerprint_id,
      ticket_snapshot_digest: ticket.ticket_snapshot_digest,
      public_surface: { ...publicSurface, public_surface_digest: sha256(canonicalJson(publicSurface)) },
      profile_ref: {
        profile_id: profile.profile_id,
        profile_revision: profile.profile_revision,
        profile_content_digest: profile.serialization.content_digest,
      },
      public_requirement_capability_ids: PUBLIC_REQUIREMENTS[ticket.ticket_id],
      candidate_closure: ticket.public_candidate_fault_ids.map((candidateFaultId) => {
        const [nodeIds, pathIds, explanation] = PUBLIC_CLOSURES[ticket.ticket_id][candidateFaultId];
        return { candidate_fault_id: candidateFaultId, public_node_ids: nodeIds, public_path_ids: pathIds, explanation };
      }),
      ticket_focus_statement: dossier.public_focus_sentence,
      fallback_id: 'fallback.system-model.text-only.v1',
      authority_boundary: 'EXPLANATORY_ONLY',
    };
    return withSerialization(binding);
  });
}

const PRIVATE_FAULT_BINDINGS = Object.freeze({
  'ticket.generated.3ec80b1b0e7221ac725aedf9': {
    'fault.storage.nvme.device_failed': [['role.nvme'], ['drives', 'nvme_path']],
    'fault.boot.device.not_detected': [['role.system_bios', 'role.nvme'], ['uefi', 'nvme_path', 'drives']],
  },
  'ticket.generated.5352abd871c2e9076be92a0b': {
    'fault.storage.cable.loose': [['role.sas_cable', 'role.pcie_cable'], ['sas_path', 'nvme_path', 'backplane']],
  },
  'ticket.generated.3fd6eb04534f79b5b3f87f98': {
    'fault.power.distribution_board.failed': [['role.pib'], ['power_interposer']],
  },
  'ticket.generated.b34238282822e93980b5f1ad': {
    'fault.firmware.version_set.incompatible': [['role.bmc', 'role.system_bios', 'role.nic'], ['bmc', 'uefi', 'nic', 'os']],
  },
  'ticket.generated.f32b85cbf2054fdf0114f42a': {
    'fault.management.bmc_firmware.corrupt': [['role.bmc', 'role.system_board'], ['bmc', 'board']],
  },
});

function attachmentId(profileId, actionId) {
  return `attachment.${profileId.slice('profile.'.length)}.${actionId}`;
}

function buildPrivateValidation(atlas, tickets, bindings, profileById) {
  const bindingByTicket = new Map(bindings.map((binding) => [binding.ticket_id, binding]));
  return atlas.dossiers.map((dossier) => {
    const ticket = tickets.get(dossier.ticket_id);
    const profile = profileById.get(dossier.profile_id);
    const binding = bindingByTicket.get(ticket.ticket_id);
    const faultBindings = Object.entries(PRIVATE_FAULT_BINDINGS[ticket.ticket_id]).map(([faultId, [roleIds, nodeIds]]) => ({
      fault_id: faultId,
      target_role_ids: roleIds,
      target_node_ids: nodeIds,
      binding_basis: 'Compatibility proof only; the authored Ticket remains the source of truth.',
      source_claim_ids: unique(nodeIds.flatMap((nodeId) => profile.topology_nodes.find((node) => node.node_id === nodeId).source_claim_ids)),
    }));
    let verifyIndex = 0;
    const actionRequirements = ticket.oracle_witness
      .filter((step) => ['RUN_DIAGNOSTIC', 'PERFORM_REPAIR', 'PERFORM_VERIFY'].includes(step.action))
      .map((step, index) => {
        const fallbackVerificationId = step.action === 'PERFORM_VERIFY' ? ticket.validation_procedure_ids[verifyIndex++] : undefined;
        const actionId = step.source_definition_id ?? step.repair_procedure_id ?? step.validation_procedure_id
          ?? (step.action === 'PERFORM_REPAIR' ? ticket.repair_procedure_ids[0] : fallbackVerificationId);
        return {
          requirement_id: `private-requirement.${ticket.fingerprint_id}.${String(index + 1).padStart(2, '0')}`,
          action_type: step.action,
          action_definition_id: actionId,
          attachment_id: attachmentId(profile.profile_id, actionId),
          authored_result_reference: step.evidence_outcome_id ?? step.repair_outcome_id ?? step.verification_outcome_id,
        };
      });
    const privateProof = {
      compatibility_id: `compatibility.${ticket.fingerprint_id}.v1`,
      binding_id: binding.binding_id,
      ticket_id: ticket.ticket_id,
      ticket_snapshot_digest: ticket.ticket_snapshot_digest,
      profile_ref: binding.profile_ref,
      required_capability_ids: PUBLIC_REQUIREMENTS[ticket.ticket_id],
      hidden_fault_bindings: faultBindings,
      authored_action_requirements: actionRequirements,
      differential_variants: ticket.public_candidate_fault_ids.map((faultId, index) => ({
        variant_id: `nonleak.${ticket.fingerprint_id}.${String(index + 1).padStart(2, '0')}`,
        synthetic_hidden_fault_ids: [faultId],
        expected_public_binding_digest: binding.serialization.content_digest,
      })),
      validation_result: 'PASS',
      authority_boundary: 'BUILD_TIME_REJECTION_ONLY',
    };
    return withSerialization(privateProof);
  });
}

const OVERLAY_TARGETS = Object.freeze({
  'gap.relation.repair.replace_nvme.target': ['REPAIR_TARGETS_ROLE_PATH', [['profile.dell.poweredge-r740xd.hybrid-24x2_5.v1', ['role.nvme'], ['drives'], ['path.r740xd.nvme-storage']]], ['claim.r740xd.backplane-serviceable', 'claim.r740xd.twenty-sas-four-nvme-option']],
  'gap.relation.repair.reseat_storage_cable.target': ['REPAIR_TARGETS_ROLE_PATH', [['profile.dell.poweredge-r740xd.hybrid-24x2_5.v1', ['role.sas_cable', 'role.pcie_cable'], ['sas_path', 'nvme_path', 'backplane'], ['path.r740xd.sas-storage', 'path.r740xd.nvme-storage']]], ['claim.r740xd.sas-perc-path', 'claim.r740xd.pcie-nvme-path', 'claim.r740xd.backplane-serviceable']],
  'gap.relation.verify.storage_detected.path': ['VERIFIES_PATH_STATE', [['profile.dell.poweredge-r740xd.hybrid-24x2_5.v1', ['role.hybrid_backplane', 'role.nvme', 'role.sas_drives'], ['bmc', 'os', 'backplane', 'sas_path', 'nvme_path', 'drives'], ['path.r740xd.sas-storage', 'path.r740xd.nvme-storage']]], ['claim.idrac9.storage-observation', 'claim.uefi.os-loader-handoff']],
  'gap.relation.verify.normal_boot.handoff': ['VERIFIES_PATH_STATE', [['profile.dell.poweredge-r740xd.hybrid-24x2_5.v1', ['role.system_bios'], ['uefi', 'os'], ['path.r740xd.boot-handoff']]], ['claim.uefi.os-loader-handoff', 'claim.r740xd.boot-order-configurable']],
  'gap.relation.test.bmc_logs.surface_subject': ['QUERIES_CONTROL_SURFACE', [['profile.dell.poweredge-r740xd.hybrid-24x2_5.v1', ['role.bmc'], ['bmc', 'backplane', 'drives'], ['path.r740xd.management-storage']], ['profile.dell.poweredge-r740xd2.power-interposer.v1', ['role.bmc'], ['bmc', 'board'], ['path.r740xd2.power-status']]], ['claim.idrac9.lifecycle-log-categories', 'claim.idrac9.storage-observation', 'claim.r740xd2.psu-mismatch-reporting']],
  'gap.relation.test.storage_inventory.layers': ['OBSERVES_COMPONENT_PATH', [['profile.dell.poweredge-r740xd.hybrid-24x2_5.v1', ['role.bmc', 'role.hybrid_backplane', 'role.nvme', 'role.perc'], ['bmc', 'os', 'backplane', 'sas_path', 'nvme_path', 'drives'], ['path.r740xd.management-storage', 'path.r740xd.sas-storage', 'path.r740xd.nvme-storage']]], ['claim.idrac9.hardware-inventory', 'claim.idrac9.storage-observation']],
  'gap.relation.test.visual_inspection.binding': ['OBSERVES_COMPONENT_PATH', [['profile.dell.poweredge-r740xd.hybrid-24x2_5.v1', ['role.system_board', 'role.hybrid_backplane', 'role.sas_cable', 'role.pcie_cable'], ['board', 'backplane', 'sas_path', 'nvme_path'], ['path.r740xd.sas-storage', 'path.r740xd.nvme-storage']], ['profile.dell.poweredge-r740xd2.power-interposer.v1', ['role.psu_pair', 'role.pib', 'role.system_board'], ['psu', 'power_interposer', 'board'], ['path.r740xd2.power-distribution']]], ['claim.r740xd.backplane-serviceable', 'claim.r740xd2.pib-service-unit']],
  'gap.relation.fault.boot_device_not_detected.path': ['AFFECTS_PATH_WITHOUT_CAUSAL_INFERENCE', [['profile.dell.poweredge-r740xd.hybrid-24x2_5.v1', ['role.system_bios', 'role.nvme', 'role.pcie_cable'], ['uefi', 'nvme_path', 'drives'], ['path.r740xd.nvme-storage', 'path.r740xd.boot-handoff']]], ['claim.r740xd.uefi-boot-mode', 'claim.r740xd.pcie-nvme-path']],
  'gap.relation.fault.boot_order.control_surface': ['AFFECTS_CONTROL_SURFACE_WITHOUT_CAUSAL_INFERENCE', [['profile.dell.poweredge-r740xd.hybrid-24x2_5.v1', ['role.system_bios'], ['uefi'], ['path.r740xd.boot-handoff']]], ['claim.r740xd.boot-order-configurable', 'claim.uefi.bootorder-nvram']],
  'gap.relation.test.firmware_compatibility.surface': ['QUERIES_CONTROL_SURFACE', [['profile.dell.poweredge-r740xd.hybrid-24x2_5.v1', ['role.bmc', 'role.system_bios', 'role.nic'], ['bmc', 'uefi', 'nic'], ['path.r740xd.network-runtime', 'path.r740xd.boot-handoff']]], ['claim.idrac9.hardware-inventory', 'claim.r740xd.uefi-boot-mode', 'claim.r740xd.network-daughter-card']],
  'gap.relation.repair.restore_firmware.targets': ['REPAIR_TARGETS_ROLE_PATH', [['profile.dell.poweredge-r740xd.hybrid-24x2_5.v1', ['role.bmc', 'role.system_bios', 'role.nic'], ['bmc', 'uefi', 'nic'], ['path.r740xd.network-runtime', 'path.r740xd.boot-handoff']]], ['claim.idrac9.hardware-inventory', 'claim.r740xd.uefi-boot-mode']],
  'gap.relation.verify.firmware_persistence.path': ['VERIFIES_DEPENDENCY_STATE', [['profile.dell.poweredge-r740xd.hybrid-24x2_5.v1', ['role.bmc', 'role.system_bios', 'role.nic'], ['bmc', 'uefi', 'nic', 'os', 'link'], ['path.r740xd.network-runtime', 'path.r740xd.boot-handoff']]], ['claim.idrac9.hardware-inventory', 'claim.uefi.os-loader-handoff', 'claim.r740xd.network-daughter-card']],
  'gap.relation.test.bmc_recovery.surface': ['QUERIES_CONTROL_SURFACE', [['profile.dell.poweredge-r740xd.hybrid-24x2_5.v1', ['role.bmc', 'role.system_board'], ['bmc', 'board'], ['path.r740xd.management-storage']]], ['claim.idrac9.pre-os-interface', 'claim.idrac9.out-of-band-management']],
  'gap.relation.repair.bmc_recovery.surface': ['REPAIR_TARGETS_WITH_DEPENDENCY', [['profile.dell.poweredge-r740xd.hybrid-24x2_5.v1', ['role.bmc', 'role.system_board'], ['bmc', 'board'], ['path.r740xd.management-storage']]], ['claim.idrac9.pre-os-interface', 'claim.idrac9.uefi-cooperation']],
  'gap.relation.power_path.structure': ['SYSTEM_DEPENDENCY_PATH', [['profile.dell.poweredge-r740xd2.power-interposer.v1', ['role.input', 'role.psu_pair', 'role.pib', 'role.system_board'], ['ac', 'psu', 'power_interposer', 'board', 'host'], ['path.r740xd2.power-distribution', 'path.r740xd2.pib-service']]], ['claim.r740xd2.one-plus-one-redundancy', 'claim.r740xd2.pib-system-board-cables', 'claim.r740xd2.pib-deenergize']],
  'gap.relation.symptom.component': ['INTENTIONALLY_UNBOUND_PUBLIC_SYMPTOM', [], []],
});

function buildOverlay(audit) {
  return audit.relationship_findings.map((finding) => {
    const [relationType, targets, claimIds] = OVERLAY_TARGETS[finding.finding_id];
    return {
      relationship_id: finding.finding_id,
      source_object_ids: finding.domain_object_ids,
      relation_type: relationType,
      implementation_status: relationType === 'INTENTIONALLY_UNBOUND_PUBLIC_SYMPTOM' ? 'PRESERVED_INTENTIONALLY_UNBOUND' : 'APPLIED_PROFILE_OVERLAY',
      targets: targets.map(([profileId, roleIds, nodeIds, pathIds]) => ({ profile_id: profileId, role_ids: roleIds, node_ids: nodeIds, path_ids: pathIds })),
      dossier_ids: finding.dossier_ids,
      source_claim_ids: claimIds,
      justification: finding.need,
      authority_boundary: finding.gameplay_authority,
    };
  });
}

function buildMigration(bindings) {
  return {
    schema_version: 'system-model-migration-v1',
    migration_id: 'migration.system-model-pilot-v1',
    migration_strategy: 'VERSIONED_SUCCESSOR_OVERLAY',
    from_release: 'released-story-domain-coverage-v3',
    to_release: RELEASE_ID,
    immutable_inputs: IMMUTABLE_INPUTS.map(([relativePath, digest, purpose]) => ({ path: relativePath, sha256: digest, purpose, mutation_policy: 'MUST_REMAIN_BYTE_IDENTICAL' })),
    ticket_bindings: bindings.map((binding) => ({
      ticket_id: binding.ticket_id,
      prior_ticket_snapshot_digest: binding.ticket_snapshot_digest,
      binding_id: binding.binding_id,
      profile_ref: binding.profile_ref,
      migration_action: 'ADD_EXTERNAL_VERSIONED_BINDING',
    })),
    added_component_ids: ['component.firmware.system_bios', 'component.storage.pcie_nvme_interconnect'],
    preserved_component_ids: ['component.power.distribution_board'],
    compatibility: {
      ticket_engine_behavior: 'UNCHANGED',
      active_deck_and_bench: 'UNCHANGED',
      evidence_and_isolation_authority: 'UNCHANGED',
      story_checkpoint_and_replay_identity: 'UNCHANGED',
      unsupported_ticket_behavior: 'NO_SYSTEM_BINDING',
    },
  };
}

function artifactEnvelope(schemaVersion, key, values) {
  return {
    schema_version: schemaVersion,
    release_id: RELEASE_ID,
    contract_version: CONTRACT_VERSION,
    canonicalization_version: CANONICALIZATION_VERSION,
    [key]: values,
  };
}

export function buildArtifacts() {
  const atlas = readJson('docs/system-models/task-050/atlas-data.json');
  const sourceLedger = readJson('docs/system-models/task-050/source-ledger.json');
  const audit = readJson('docs/system-models/task-050/component-relationship-audit.json');
  const coverage = readJson('docs/story/coverage/released-story-domain-coverage-v3.json');
  const tickets = collectTicketRecords(coverage);
  if (tickets.size !== PILOT_TICKET_IDS.length) throw new Error(`Expected ${PILOT_TICKET_IDS.length} pilot Tickets, found ${tickets.size}`);
  const recordById = new Map(loadViewerRecords().map((record) => [record.id, record]));
  const profiles = atlas.profiles.map((profile) => buildProfile(profile, tickets, atlas, recordById));
  const profileById = new Map(profiles.map((profile) => [profile.profile_id, profile]));
  const bindings = buildPublicBindings(atlas, tickets, profileById);
  const privateValidation = buildPrivateValidation(atlas, tickets, bindings, profileById);
  const overlay = buildOverlay(audit);
  const catalog = withSerialization({
    ...artifactEnvelope('system-model-catalog-v1', 'profiles', profiles),
    source_manifest: {
      source_ledger_id: 'source-ledger.task-050.v1',
      source_ledger_path: 'docs/system-models/task-050/source-ledger.json',
      source_ledger_sha256: IMMUTABLE_INPUTS.find(([relativePath]) => relativePath.endsWith('source-ledger.json'))[1],
      source_count: sourceLedger.sources.length,
      claim_count: sourceLedger.sources.reduce((sum, source) => sum + source.claim_ids.length, 0),
    },
    component_catalog: {
      catalog_version: 'viewer-domain-plus-system-model-pilot-v1',
      base_policy: 'PRESERVE_EXISTING_IDS',
      successor_pack_path: OUTPUT_PATHS.components,
      added_component_ids: ['component.firmware.system_bios', 'component.storage.pcie_nvme_interconnect'],
    },
    templates: [
      { template_id: 'template.system-model.lifecycle-stage.v1', purpose: 'LIFECYCLE_CLAUSE', token_names: ['STAGE_LABEL'], template: '{STAGE_LABEL}.' },
      { template_id: 'template.system-model.action-rationale.v1', purpose: 'ACTION_RATIONALE', token_names: ['ACTION_LABEL', 'REASON', 'TARGET_LABEL'], template: '{ACTION_LABEL} {REASON} on {TARGET_LABEL}.' },
    ],
    fallback: {
      fallback_id: 'fallback.system-model.text-only.v1',
      public_message: 'A detailed system model is not available for this Ticket. Ordinary troubleshooting remains unchanged.',
      prohibited_detail: 'Never name a missing private component, rejected profile, compatibility failure, or likely cause.',
    },
  });
  const bindingCatalog = withSerialization(artifactEnvelope('ticket-system-binding-catalog-v1', 'bindings', bindings));
  const privateCatalog = withSerialization({
    ...artifactEnvelope('system-model-private-validation-catalog-v1', 'compatibility_proofs', privateValidation),
    storage_boundary: 'SERVER_OR_BUILD_ONLY',
  });
  const overlayCatalog = withSerialization({
    ...artifactEnvelope('system-model-relationship-overlay-v1', 'relationships', overlay),
    component_ontology_policy: 'USES_EXISTING_COMPONENT_IDS_AND_TWO_JUSTIFIED_SUCCESSOR_DEFINITIONS',
  });
  const migration = withSerialization(buildMigration(bindings));
  return {
    [OUTPUT_PATHS.catalog]: catalog,
    [OUTPUT_PATHS.bindings]: bindingCatalog,
    [OUTPUT_PATHS.privateValidation]: privateCatalog,
    [OUTPUT_PATHS.overlay]: overlayCatalog,
    [OUTPUT_PATHS.migration]: migration,
    [OUTPUT_PATHS.components]: componentPack(),
  };
}

function buildManifest(artifacts) {
  const generatedFiles = Object.entries(artifacts).map(([relativePath, value]) => ({
    path: relativePath,
    sha256: sha256(prettyJson(value)),
    bytes: Buffer.byteLength(prettyJson(value)),
  })).sort((left, right) => left.path.localeCompare(right.path));
  return {
    schema_version: 'system-model-release-manifest-v1',
    release_id: RELEASE_ID,
    contract_version: CONTRACT_VERSION,
    generator: {
      path: 'content/system-model-pilot-v1/build-release.mjs',
      sha256: fileSha256('content/system-model-pilot-v1/build-release.mjs'),
    },
    schema_files: SCHEMA_PATHS.map((relativePath) => ({ path: relativePath, sha256: fs.existsSync(path.join(ROOT, relativePath)) ? fileSha256(relativePath) : '0'.repeat(64) })),
    generated_files: generatedFiles,
    immutable_inputs: IMMUTABLE_INPUTS.map(([relativePath, digest]) => ({ path: relativePath, sha256: digest })),
    totals: {
      profiles: artifacts[OUTPUT_PATHS.catalog].profiles.length,
      ticket_bindings: artifacts[OUTPUT_PATHS.bindings].bindings.length,
      private_compatibility_proofs: artifacts[OUTPUT_PATHS.privateValidation].compatibility_proofs.length,
      relationship_findings: artifacts[OUTPUT_PATHS.overlay].relationships.length,
      added_components: artifacts[OUTPUT_PATHS.components].entities.length,
    },
  };
}

function buildExamples(artifacts, manifest) {
  const valid = {
    'examples/system-models/valid/system_model_catalog.pilot.json': artifacts[OUTPUT_PATHS.catalog],
    'examples/system-models/valid/ticket_system_binding_catalog.pilot.json': artifacts[OUTPUT_PATHS.bindings],
    'examples/system-models/valid/system_model_private_validation_catalog.pilot.json': artifacts[OUTPUT_PATHS.privateValidation],
    'examples/system-models/valid/system_model_relationship_overlay.pilot.json': artifacts[OUTPUT_PATHS.overlay],
    'examples/system-models/valid/system_model_migration.pilot.json': artifacts[OUTPUT_PATHS.migration],
    'examples/system-models/valid/system_model_release_manifest.pilot.json': manifest,
  };
  const dangling = structuredClone(artifacts[OUTPUT_PATHS.catalog]);
  dangling.profiles[0].role_instances[0].component_definition_id = 'component.missing.fixture';
  const cycle = structuredClone(artifacts[OUTPUT_PATHS.catalog]);
  cycle.profiles[0].lifecycle_relations.push({
    relation_id: 'lifecycle.invalid.cycle', from_stage_id: 'bounded_runtime', to_stage_id: 'standby', relation_type: 'PRECEDES', source_claim_ids: ['claim.idrac9.out-of-band-management'],
  });
  const publicLeak = structuredClone(artifacts[OUTPUT_PATHS.bindings]);
  publicLeak.bindings[0].hidden_fault_ids = ['fault.storage.nvme.device_failed'];
  const badRelation = structuredClone(artifacts[OUTPUT_PATHS.overlay]);
  badRelation.relationships[0].relation_type = 'PROVES_CANDIDATE';
  const privateDangling = structuredClone(artifacts[OUTPUT_PATHS.privateValidation]);
  privateDangling.compatibility_proofs[0].binding_id = 'binding.missing.fixture';
  const incompleteMigration = structuredClone(artifacts[OUTPUT_PATHS.migration]);
  delete incompleteMigration.ticket_bindings[0].prior_ticket_snapshot_digest;
  return {
    ...valid,
    'examples/system-models/invalid/system_model_catalog.dangling-component.json': dangling,
    'examples/system-models/invalid/system_model_catalog.lifecycle-cycle.json': cycle,
    'examples/system-models/invalid/ticket_system_binding_catalog.hidden-leak.json': publicLeak,
    'examples/system-models/invalid/system_model_relationship_overlay.forbidden-relation.json': badRelation,
    'examples/system-models/invalid/system_model_private_validation_catalog.dangling-binding.json': privateDangling,
    'examples/system-models/invalid/system_model_migration.incomplete-ticket-pin.json': incompleteMigration,
  };
}

export function expectedFiles() {
  const artifacts = buildArtifacts();
  const manifest = buildManifest(artifacts);
  const examples = buildExamples(artifacts, manifest);
  return new Map(Object.entries({ ...artifacts, [OUTPUT_PATHS.manifest]: manifest, ...examples }).map(([relativePath, value]) => [relativePath, prettyJson(value)]));
}

export function verifyImmutableInputs() {
  const failures = [];
  for (const [relativePath, expected] of IMMUTABLE_INPUTS) {
    const actual = fileSha256(relativePath);
    if (actual !== expected) failures.push(`${relativePath}: expected ${expected}, found ${actual}`);
  }
  return failures;
}

function writeOrCheck({ check }) {
  const immutableFailures = verifyImmutableInputs();
  if (immutableFailures.length > 0) throw new Error(`Immutable input drift:\n${immutableFailures.join('\n')}`);
  const files = expectedFiles();
  const stale = [];
  for (const [relativePath, source] of files) {
    const absolutePath = path.join(ROOT, relativePath);
    if (check) {
      if (!fs.existsSync(absolutePath) || fs.readFileSync(absolutePath, 'utf8') !== source) stale.push(relativePath);
      continue;
    }
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, source);
  }
  if (stale.length > 0) throw new Error(`TASK-051 generated files are stale:\n${stale.join('\n')}`);
  return { files: files.size, mode: check ? 'check' : 'write' };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = writeOrCheck({ check: process.argv.includes('--check') });
    console.log(`TASK-051 ${result.mode} passed for ${result.files} deterministic files.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
