import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(scriptPath), '..', '..');
const gameplayRoot = path.join(repositoryRoot, 'content', 'gameplay-v1');
const domainSourceRoot = path.join(repositoryRoot, 'content', 'domain-v0.2');
const stableCompare = (left, right) => (left < right ? -1 : left > right ? 1 : 0);
const sorted = (values) => [...values].sort(stableCompare);
const readJson = async (filename) => JSON.parse(await readFile(filename, 'utf8'));
const writeJson = async (filename, value) => writeFile(filename, `${JSON.stringify(value, null, 2)}\n`, 'utf8');

const VERSION = Object.freeze({
  parts: 'ticket-parts-v2',
  builder: 'ticket-builder-v4',
  ticket: 'core-ticket-parts-v4',
  domain: 'core-domain-snapshot-story-expansion-v4',
  cards: 'core-card-catalog-story-expansion-v5',
  decks: 'core-response-decks-v5',
  coverage: 'playable-coverage-v5',
  review: 'technical-copy-review-v2',
});

const OLD_HASHES = Object.freeze({
  'domain-snapshot-v2.json': '2e55fc92b725d869b67b3ea73c701c55db49f9b9a2f49bcff981cebaca687a2f',
  'card-catalog-v3.json': 'e2810a99ce02b1d57ef5613e3d9d09647f5fea8dd8b3b4074baacea09bc055ef',
  'decks-v3.json': '8d9fc3ef8aa5d3932dd4fbb9349b915f4087b2c357caede6f559a2c2c24467f4',
  'playable-coverage-v3.json': '87ed2e481221485aaef3221dcf2d0a1a4979971631db5284fa3e73745d20b065',
  'task-014-parts.json': '06614e06602164e54dc36737aea89d573cd0d1b76ce863a0352a2f45e1be6c56',
});

const RESPONSE_DECK_ID = 'deck.story.expansion_response_v1';
const clone = (value) => structuredClone(value);
const digestBytes = (value) => createHash('sha256').update(value).digest('hex');
const learnerCopy = (record) => ({
  short_description: record.presentation?.short_description ?? '',
  education_text: record.education_text ?? null,
  purpose: record.purpose ?? null,
  capabilities: record.capabilities ?? null,
  steps_summary: record.steps_summary ?? null,
  success_conditions: record.success_conditions ?? null,
});
const learnerDigest = (record) => digestBytes(JSON.stringify(learnerCopy(record)));

const SCENARIOS = [
  {
    fingerprint_id: 'fingerprint.compute.damaged_cpu_socket_contacts',
    slug: 'compute.damaged_cpu_socket_contacts',
    subsystem: 'compute',
    state: 'machine.compute.damaged_socket_contacts.active',
    truth: 'fault.compute.cpu_socket.contacts_damaged',
    symptoms: ['symptom.boot.no_post'],
    display_name: 'Processor Population Will Not Complete Startup',
    short_description: 'The server starts with a reduced processor population but does not complete startup with the expected processors installed.',
    findings: [
      ['test.compute.socket_magnified_inspection', 'fault.compute.cpu_socket.contacts_damaged', 'CONFIRM', 'Magnified inspection localizes visibly displaced contacts at the failing socket.'],
      ['test.general.minimum_configuration', 'fault.board.system.failed', 'CONTRADICT', 'Known-good processor combinations boot away from the affected socket, contradicting a general board failure.'],
      ['test.general.minimum_configuration', 'fault.cpu.not_seated', 'CONTRADICT', 'The processors operate in alternate supported combinations, contradicting a processor seating explanation.'],
      ['test.memory.single_dimm_isolation', 'fault.memory.dimm.failed', 'CONTRADICT', 'The failure remains location-bound rather than following the reduced memory set.'],
      ['test.memory.single_dimm_isolation', 'fault.memory.dimm.not_seated', 'CONTRADICT', 'The reduced memory comparison does not carry the startup failure away from the socket.'],
    ],
    route: ['DEFINITIVE_DIAGNOSTIC', ['test.compute.socket_magnified_inspection']],
    repair: 'repair.compute.restore_socket_contacts',
    verify: 'verify.compute.socket_path',
    success: 'Repeated cold starts complete with every expected processor and memory channel present and no new socket-path event.',
    teaching_id: 'teaching.compute.socket_location.v1',
    difficulty: 4,
    objective: 'Identify a socket-location fault without condemning known-good processors or memory.',
  },
  {
    fingerprint_id: 'fingerprint.power.failed_distribution_board',
    slug: 'power.failed_distribution_board',
    subsystem: 'power',
    state: 'machine.power.failed_distribution_board.active',
    truth: 'fault.power.distribution_board.failed',
    symptoms: ['symptom.power.voltage_out_of_range', 'symptom.power.no_power'],
    display_name: 'Voltage Alert and Immediate Power Loss',
    short_description: 'The server reports an out-of-range voltage and shuts down immediately despite supported supply substitutions.',
    findings: [
      ['test.power.distribution_path_isolation', 'fault.power.distribution_board.failed', 'CONFIRM', 'Known-good supplies reproduce the same failure in every supported bay, confirming the shared distribution path.'],
      ['test.power.known_good_psu', 'fault.power.psu.failed', 'RULE_OUT', 'Both known-good supplies behave identically across bays, ruling out an individual supply failure.'],
      ['test.general.visual_inspection', 'fault.power.input.cable_loose', 'CONTRADICT', 'The documented input path remains correctly connected during the reduced-configuration comparison.'],
      ['test.general.visual_inspection', 'fault.power.psu.not_seated', 'CONTRADICT', 'Supported supplies are fully seated in each tested bay.'],
    ],
    route: ['DEFINITIVE_DIAGNOSTIC', ['test.power.distribution_path_isolation']],
    repair: 'repair.power.replace_distribution_board',
    verify: 'verify.power.distribution_path',
    success: 'Cold starts, bay telemetry, and a safe redundancy transition complete without a new voltage or power-good event.',
    teaching_id: 'teaching.power.distribution_path.v1',
    difficulty: 4,
    objective: 'Use cross-bay known-good comparisons to isolate a shared distribution fault.',
  },
  {
    fingerprint_id: 'fingerprint.storage.predictive_drive_failure',
    slug: 'storage.predictive_drive_failure',
    subsystem: 'storage',
    state: 'machine.storage.predictive_drive_failure.active',
    truth: 'fault.storage.drive.predictive_failure',
    symptoms: ['symptom.storage.predictive_failure_warning', 'symptom.storage.drive_fault_led'],
    display_name: 'Online Drive Predicts Failure',
    short_description: 'An online array member reports predictive failure and an alternating drive-bay warning indication.',
    findings: [
      ['test.storage.predictive_health', 'fault.storage.drive.predictive_failure', 'CONFIRM', 'Controller and device health evidence confirms a predictive threshold on the identified online member.'],
      ['test.storage.drive_health', 'fault.storage.sas.drive_failed', 'CONTRADICT', 'The member remains online and responsive rather than presenting as a fully failed drive.'],
    ],
    route: ['DEFINITIVE_DIAGNOSTIC', ['test.storage.predictive_health']],
    repair: 'repair.storage.replace_predictive_drive',
    verify: 'verify.storage.predictive_replacement',
    success: 'The documented replacement member is present, rebuild completes, the array is healthy, and no predictive warning returns.',
    teaching_id: 'teaching.storage.predictive_media.v1',
    difficulty: 3,
    objective: 'Treat predictive failure as actionable while protecting data and proving completed recovery.',
  },
  {
    fingerprint_id: 'fingerprint.management.stale_alert',
    slug: 'management.stale_alert',
    subsystem: 'management',
    state: 'machine.management.stale_alert.active',
    truth: 'fault.management.alert.stale',
    symptoms: ['symptom.management.alert_persists'],
    display_name: 'Healthy Hardware Retains a Degraded Alert',
    short_description: 'Current drive and enclosure checks are healthy while management continues to display an earlier degraded-backplane alert.',
    findings: [
      ['test.management.event_log_freshness', 'fault.management.alert.stale', 'CONFIRM', 'Preserved timestamps and healthy current telemetry show that the displayed alert describes historical state.'],
      ['test.storage.device_inventory', 'fault.storage.backplane.path_failed', 'CONTRADICT', 'Fresh inventory shows the expected drives and bays healthy, contradicting a live backplane-path failure.'],
    ],
    route: ['DEFINITIVE_DIAGNOSTIC', ['test.management.event_log_freshness']],
    repair: 'repair.management.clear_stale_alert_state',
    verify: 'verify.management.alert_does_not_recur',
    success: 'After evidence-preserving state refresh, current hardware stays healthy and the target alert does not recur during the defined window.',
    teaching_id: 'teaching.management.stale_state.v1',
    difficulty: 3,
    objective: 'Separate read-only evidence preservation from the state-changing Repair that clears a stale alert.',
  },
  {
    fingerprint_id: 'fingerprint.firmware.incompatible_version_set',
    slug: 'firmware.incompatible_version_set',
    subsystem: 'firmware',
    state: 'machine.firmware.incompatible_version_set.active',
    truth: 'fault.firmware.version_set.incompatible',
    symptoms: ['symptom.network.link_flapping', 'symptom.network.no_link'],
    display_name: 'Network Link Flaps After Firmware Change',
    short_description: 'Management reports repeated link transitions after a firmware update even though substituted hardware and cabling remain stable.',
    findings: [
      ['test.firmware.version_compatibility', 'fault.firmware.version_set.incompatible', 'SUPPORT', 'The failure begins with the new version set and an approved rollback removes it.'],
      ['test.network.link_counter_soak', 'fault.firmware.version_set.incompatible', 'SUPPORT', 'A defined soak is clean after rollback and the later upgrade reproduces the link regression.'],
      ['test.general.visual_inspection', 'fault.network.cable.disconnected', 'CONTRADICT', 'The link path remains connected throughout the controlled comparison.'],
      ['test.network.cable_substitution', 'fault.network.cable.failed', 'RULE_OUT', 'Known-good cabling does not carry the failure away from the affected firmware state.'],
      ['test.network.cable_substitution', 'fault.network.nic.failed', 'RULE_OUT', 'Hardware substitutions do not carry the failure, ruling out an individual interface fault.'],
    ],
    route: ['CORROBORATED_SUPPORT', ['test.firmware.version_compatibility', 'test.network.link_counter_soak'], 2],
    repair: 'repair.firmware.restore_compatible_versions',
    verify: 'verify.firmware.compatible_persistent',
    success: 'The approved version set persists after restart and the defined link/counter soak completes without the regression.',
    teaching_id: 'teaching.firmware.version_regression.v1',
    difficulty: 5,
    objective: 'Use repeated version A/B behavior and hardware elimination to diagnose a firmware regression.',
  },
  {
    fingerprint_id: 'fingerprint.management.corrupt_bmc_firmware',
    slug: 'management.corrupt_bmc_firmware',
    subsystem: 'management',
    state: 'machine.management.corrupt_bmc_firmware.active',
    truth: 'fault.management.bmc_firmware.corrupt',
    symptoms: ['symptom.management.bmc_not_responding', 'symptom.firmware.update_failed'],
    display_name: 'Management Controller Fails After Interrupted Update',
    short_description: 'The embedded management controller stops responding after an interrupted firmware update while the board still exposes an approved recovery state.',
    findings: [
      ['test.management.bmc_recovery_state', 'fault.management.bmc_firmware.corrupt', 'CONFIRM', 'Approved recovery-state checks confirm controller firmware corruption without prescribing a board-specific raw procedure.'],
      ['test.firmware.version_compatibility', 'fault.firmware.version_set.incompatible', 'RULE_OUT', 'Platform and image compatibility checks rule out an ordinary incompatible-version set.'],
    ],
    route: ['DEFINITIVE_DIAGNOSTIC', ['test.management.bmc_recovery_state']],
    repair: 'repair.management.recover_bmc_firmware',
    verify: 'verify.management.bmc_functional',
    success: 'The approved recovery completes and the controller reaches the reported reset and normal-start acceptance boundary.',
    teaching_id: 'teaching.management.bmc_recovery.v1',
    difficulty: 6,
    objective: 'Bound dangerous controller recovery to approved platform methods and verify recovery separately from the flash action.',
  },
];

function expansionParts(base) {
  const parts = clone(base);
  Object.assign(parts, {
    part_catalog_version: VERSION.parts,
    generator_version: VERSION.builder,
    configuration_version: VERSION.builder,
    ticket_content_version: VERSION.ticket,
    domain_content_version: VERSION.domain,
    card_catalog_version: VERSION.cards,
    deck_catalog_version: VERSION.decks,
  });
  for (const scenario of SCENARIOS) {
    const blueprintId = `truth.${scenario.slug}.v1`;
    const compatible = [blueprintId];
    parts.fingerprint_roots.push({
      fingerprint_id: scenario.fingerprint_id,
      subsystem: scenario.subsystem,
      fault_blueprint_part_id: blueprintId,
      teaching_part_id: scenario.teaching_id,
      response_deck_id: RESPONSE_DECK_ID,
      selection_weight: 1,
    });
    parts.public_context_parts.push({
      part_id: `context.${scenario.slug}.v1`,
      compatible_fault_blueprint_part_ids: compatible,
      symptom_ids: scenario.symptoms,
      display_name: scenario.display_name,
      short_description: scenario.short_description,
    });
    parts.fault_blueprint_parts.push({
      part_id: blueprintId,
      initial_machine_state_key: scenario.state,
      fault_instances: [{
        fault_instance_key: `fault_instance.${scenario.slug}.root`,
        fault_id: scenario.truth,
        role: 'ACTIONABLE',
        actionable: true,
        deepest: true,
        required_to_repair: true,
      }],
      causal_edges: [],
    });
    parts.diagnostic_plan_parts.push({
      part_id: `diagnostics.${scenario.slug}.v1`,
      compatible_fault_blueprint_part_ids: compatible,
      findings: scenario.findings.map(([source_definition_id, candidate_fault_id, disposition, public_summary]) => ({
        source_definition_id, candidate_fault_id, disposition, public_summary,
      })),
    });
    const [route_kind, source_definition_ids, minimum_distinct_outcomes] = scenario.route;
    parts.isolation_plan_parts.push({
      part_id: `isolation.${scenario.slug}.v1`,
      compatible_fault_blueprint_part_ids: compatible,
      target_fault_id: scenario.truth,
      routes: [{
        route_kind,
        source_definition_ids,
        ...(minimum_distinct_outcomes ? { minimum_distinct_outcomes } : {}),
      }],
    });
    parts.repair_plan_parts.push({
      part_id: `repair_plan.${scenario.slug}.v1`,
      compatible_fault_blueprint_part_ids: compatible,
      target_fault_id: scenario.truth,
      repair_procedure_id: scenario.repair,
      public_summary: `The accepted Repair changes ${scenario.state} to its authored repaired state; it does not prove closure.`,
    });
    parts.verification_plan_parts.push({
      part_id: `verify_plan.${scenario.slug}.v1`,
      compatible_fault_blueprint_part_ids: compatible,
      requirements: [{ validation_procedure_id: scenario.verify, success_condition: scenario.success }],
    });
    parts.teaching_parts.push({
      part_id: scenario.teaching_id,
      subsystem: scenario.subsystem,
      difficulty: scenario.difficulty,
      objectives: [scenario.objective],
    });
  }
  return parts;
}

function mergePatch(target, patch) {
  const output = clone(target);
  for (const [key, value] of Object.entries(patch ?? {})) {
    if (value && typeof value === 'object' && !Array.isArray(value)
        && output[key] && typeof output[key] === 'object' && !Array.isArray(output[key])) {
      output[key] = mergePatch(output[key], value);
    } else {
      output[key] = clone(value);
    }
  }
  return output;
}

function addRelationship(relationships, role, entityId) {
  if (typeof entityId !== 'string') return;
  relationships.set(`${role}\u0000${entityId}`, { role, entity_id: entityId });
}

function normalizedEntity(entity) {
  const next = clone(entity);
  const relationships = new Map();
  for (const relationship of next.relationships ?? []) addRelationship(relationships, relationship.role, relationship.entity_id);
  const mappings = [
    ['associated_fault_ids', 'associated_fault'],
    ['symptom_ids', 'associated_symptom'],
    ['affected_component_ids', 'affected_component'],
    ['effective_test_ids', 'effective_test'],
    ['repair_procedure_ids', 'eligible_repair'],
    ['validation_procedure_ids', 'eligible_validation'],
    ['target_fault_ids', next.entity_type === 'validation_procedure' ? 'validates_fault' : 'target_fault'],
    ['validates_fault_ids', 'validates_fault'],
    ['target_component_ids', 'target_component'],
    ['required_component_ids', 'component_requirement'],
    ['required_protocol_ids', 'protocol_requirement'],
    ['required_tool_ids', 'tool_requirement'],
    ['related_test_ids', 'related_test'],
  ];
  for (const [field, role] of mappings) for (const id of next[field] ?? []) addRelationship(relationships, role, id);
  for (const rule of next.evidence_rules ?? []) addRelationship(relationships, 'evidence_target', rule.fault_id);
  if (next.cause_fault_id) addRelationship(relationships, 'cause_fault', next.cause_fault_id);
  if (next.effect_fault_id) addRelationship(relationships, 'effect_fault', next.effect_fault_id);
  next.relationships = [...relationships.values()]
    .sort((left, right) => stableCompare(`${left.role}\u0000${left.entity_id}`, `${right.role}\u0000${right.entity_id}`));
  return next;
}

function applySourcePacks(baseDomain, sourceCatalog) {
  const byId = new Map(baseDomain.entities.map((entity) => [entity.id, clone(entity)]));
  const actionCaseSources = new Map();
  for (const pack of sourceCatalog.packs) {
    for (const override of pack.entity_overrides) {
      const current = byId.get(override.entity_id);
      if (!current) throw new Error(`${pack.pack_id} references missing domain entity ${override.entity_id}.`);
      let next = mergePatch(current, override.patch);
      for (const [field, values] of [
        ['associated_fault_ids', override.append_associated_fault_ids],
        ['symptom_ids', override.append_symptom_ids],
        ['affected_component_ids', override.append_affected_component_ids],
      ]) {
        if (values?.length) next[field] = sorted(new Set([...(next[field] ?? []), ...values]));
      }
      if (override.reuse_illustration_from) {
        const source = byId.get(override.reuse_illustration_from);
        const illustration = source?.presentation?.illustration;
        if (!illustration) throw new Error(`${override.entity_id} cannot reuse missing illustration from ${override.reuse_illustration_from}.`);
        next.presentation = {
          ...next.presentation,
          illustration: {
            ...clone(illustration),
            alt_text: `Technical bench scene intentionally shared with ${source.presentation.display_name} for ${next.presentation.display_name}; no outcome is shown.`,
            caption: `Shared diagnostic artwork intentionally reused for ${next.presentation.display_name}.`,
          },
        };
      }
      next.source = {
        expansion_id: pack.pack_id,
        version: '0.2.0',
        status: 'published',
        search_tags: sorted(new Set([
          ...(next.source?.search_tags ?? []),
          'story expansion',
          pack.case_id,
          pack.source_id,
        ])),
      };
      byId.set(next.id, next);
      if (['command', 'test', 'repair_procedure', 'validation_procedure'].includes(next.entity_type)) {
        if (!actionCaseSources.has(next.id)) actionCaseSources.set(next.id, new Set());
        actionCaseSources.get(next.id).add(pack.source_id);
      }
    }
  }
  const domain = {
    ...clone(baseDomain),
    domain_content_version: VERSION.domain,
    source_pack_ids: sorted(new Set([
      ...baseDomain.source_pack_ids,
      ...sourceCatalog.packs.map((pack) => pack.pack_id),
    ])),
    entities: [...byId.values()].map(normalizedEntity).sort((left, right) => stableCompare(left.id, right.id)),
  };
  return { domain, actionCaseSources };
}

function sourceMeta(tags) {
  return {
    expansion_id: 'expansion.task_042',
    version: '1.0.0',
    status: 'published',
    search_tags: sorted(new Set(tags)),
  };
}

function responseRules(kind) {
  return kind === 'repair'
    ? 'Use after the team accepts an Isolation that this procedure can repair. Discard after use; Verify is still required.'
    : 'Use after a Repair to check a listed Ticket requirement. Discard after use.';
}

function repairCard(procedure, entityById) {
  const token = procedure.id.replace(/^repair\./, '');
  const faultIds = sorted(new Set(procedure.target_fault_ids ?? []));
  return {
    id: `card.response.repair.${token}`,
    entity_type: 'card',
    presentation: {
      display_name: procedure.presentation.display_name,
      short_description: procedure.presentation.short_description,
    },
    source: sourceMeta(['response', 'repair', procedure.id.split('.')[1]]),
    card_type: 'repair_procedure',
    archetypes: sorted(new Set(['response', procedure.id.split('.')[1]])),
    cost: procedure.action_cost,
    tags: sorted(new Set(['repair', procedure.id.split('.')[1]])),
    rules_text: responseRules('repair'),
    primary_domain_reference: { entity_id: procedure.id, entity_type: 'repair_procedure', role: 'execution', inherit_illustration: true },
    additional_domain_references: faultIds.map((id) => ({ entity_id: id, entity_type: entityById.get(id)?.entity_type ?? 'fault', role: 'subject' })),
    play_contract: {
      contract_type: 'REPAIR',
      action_type: 'PERFORM_REPAIR',
      repair_procedure_id: procedure.id,
      target_spec: { target_kind: 'ACCEPTED_ISOLATED_FAULT', allowed_fault_definition_ids: faultIds },
      prerequisites: [{ prerequisite_type: 'ACCEPTED_ISOLATION' }],
      resolution: [{ resolution_type: 'AUTHORED_REPAIR', repair_procedure_id: procedure.id }],
      disposition: 'discard',
    },
    ...(procedure.education_text ? { educational_text: procedure.education_text } : {}),
    rarity: 'common',
  };
}

function verifyCard(validation, entityById) {
  const token = validation.id.replace(/^verify\./, '');
  const faultIds = sorted(new Set(validation.validates_fault_ids ?? []));
  return {
    id: `card.response.verify.${token}`,
    entity_type: 'card',
    presentation: {
      display_name: validation.presentation.display_name,
      short_description: validation.presentation.short_description,
    },
    source: sourceMeta(['response', 'verify', validation.id.split('.')[1]]),
    card_type: 'verification',
    archetypes: sorted(new Set(['response', validation.id.split('.')[1]])),
    cost: validation.action_cost,
    tags: sorted(new Set(['verify', validation.id.split('.')[1]])),
    rules_text: responseRules('verify'),
    primary_domain_reference: { entity_id: validation.id, entity_type: 'validation_procedure', role: 'execution', inherit_illustration: true },
    additional_domain_references: faultIds.map((id) => ({ entity_id: id, entity_type: entityById.get(id)?.entity_type ?? 'fault', role: 'subject' })),
    play_contract: {
      contract_type: 'VERIFY',
      action_type: 'PERFORM_VERIFY',
      validation_procedure_id: validation.id,
      target_spec: { target_kind: 'ACTIVE_TICKET_VERIFICATION_REQUIREMENT' },
      prerequisites: [{ prerequisite_type: 'REPAIR_HISTORY_PRESENT' }],
      resolution: [{ resolution_type: 'AUTHORED_VERIFY', validation_procedure_id: validation.id }],
      disposition: 'discard',
    },
    ...(validation.education_text ? { educational_text: validation.education_text } : {}),
    rarity: 'common',
  };
}

function makeCardCatalog(baseCards, domain) {
  const entityById = new Map(domain.entities.map((entity) => [entity.id, entity]));
  const cards = baseCards.cards.map((card) => {
    const next = clone(card);
    const entity = entityById.get(next.primary_domain_reference?.entity_id);
    if (entity) {
      next.presentation.display_name = entity.presentation.display_name;
      next.presentation.short_description = entity.presentation.short_description;
      if (entity.education_text) next.educational_text = entity.education_text;
      else delete next.educational_text;
    }
    return next;
  });
  const existing = new Set(cards.map((card) => card.primary_domain_reference?.entity_id));
  for (const scenario of SCENARIOS) {
    if (existing.has(scenario.repair) || existing.has(scenario.verify)) throw new Error(`${scenario.fingerprint_id} response action was unexpectedly playable before TASK-042.`);
    cards.push(repairCard(entityById.get(scenario.repair), entityById));
    cards.push(verifyCard(entityById.get(scenario.verify), entityById));
  }
  cards.sort((left, right) => stableCompare(left.id, right.id));
  return {
    ...clone(baseCards),
    card_catalog_version: VERSION.cards,
    domain_content_version: VERSION.domain,
    cards,
  };
}

function responseCardId(kind, definitionId) {
  return `card.response.${kind}.${definitionId.replace(new RegExp(`^${kind === 'repair' ? 'repair' : 'verify'}\\.`), '')}`;
}

function makeDeckCatalog(baseDecks) {
  const card_definition_ids = [];
  for (const scenario of SCENARIOS) for (let count = 0; count < 3; count += 1) card_definition_ids.push(responseCardId('repair', scenario.repair));
  for (const scenario of SCENARIOS) for (let count = 0; count < 2; count += 1) card_definition_ids.push(responseCardId('verify', scenario.verify));
  if (card_definition_ids.length !== 30) throw new Error('TASK-042 response proof Deck must contain exactly 30 Cards.');
  return {
    ...clone(baseDecks),
    deck_catalog_version: VERSION.decks,
    card_catalog_version: VERSION.cards,
    decks: [
      ...clone(baseDecks.decks),
      {
        id: RESPONSE_DECK_ID,
        entity_type: 'deck',
        display_name: 'Story Expansion Response Kit',
        card_definition_ids,
      },
    ],
  };
}

function associatedCandidates(context, blueprint, entityById, maximum) {
  const plausible = new Set();
  for (const symptomId of context.symptom_ids) {
    for (const id of entityById.get(symptomId)?.associated_fault_ids ?? []) plausible.add(id);
  }
  const truth = blueprint.fault_instances.map((entry) => entry.fault_id);
  for (const id of truth) if (!plausible.has(id)) throw new Error(`${context.part_id} does not make ${id} publicly plausible.`);
  return sorted(new Set([
    ...truth,
    ...sorted([...plausible].filter((id) => !truth.includes(id))).slice(0, Math.max(0, maximum - truth.length)),
  ]));
}

function responseRequirements(root, parts) {
  const blueprintId = root.fault_blueprint_part_id;
  const repair = parts.repair_plan_parts.find((entry) => entry.compatible_fault_blueprint_part_ids.includes(blueprintId));
  const verify = parts.verification_plan_parts.find((entry) => entry.compatible_fault_blueprint_part_ids.includes(blueprintId));
  return [
    responseCardId('repair', repair.repair_procedure_id),
    ...verify.requirements.map((entry) => responseCardId('verify', entry.validation_procedure_id)),
  ];
}

function makeCoverage(baseCoverage, parts, domain, cardCatalog) {
  const entityById = new Map(domain.entities.map((entity) => [entity.id, entity]));
  const policy = parts.candidate_pool_parts[0];
  const fingerprints = parts.fingerprint_roots.map((root) => {
    const blueprint = parts.fault_blueprint_parts.find((entry) => entry.part_id === root.fault_blueprint_part_id);
    const compatible = (records) => records.find((entry) => entry.compatible_fault_blueprint_part_ids?.includes(blueprint.part_id));
    const context = compatible(parts.public_context_parts);
    const diagnostic = compatible(parts.diagnostic_plan_parts);
    const isolation = compatible(parts.isolation_plan_parts);
    const repair = compatible(parts.repair_plan_parts);
    const verify = compatible(parts.verification_plan_parts);
    const teaching = root.teaching_part_id
      ? parts.teaching_parts.find((entry) => entry.part_id === root.teaching_part_id)
      : parts.teaching_parts.find((entry) => entry.subsystem === root.subsystem);
    return {
      fingerprint_id: root.fingerprint_id,
      subsystem: root.subsystem,
      part_ids: [root.fault_blueprint_part_id, context.part_id, policy.part_id, diagnostic.part_id, isolation.part_id, repair.part_id, verify.part_id, teaching.part_id, parts.closure_parts[0].part_id],
      symptom_ids: context.symptom_ids,
      public_candidate_fault_ids: associatedCandidates(context, blueprint, entityById, policy.maximum_candidates),
      actionable_fault_ids: blueprint.fault_instances.filter((entry) => entry.actionable).map((entry) => entry.fault_id),
      causal_edge_ids: blueprint.causal_edges.map((entry) => entry.causal_edge_id),
      machine_state_keys: [blueprint.initial_machine_state_key, `${blueprint.initial_machine_state_key}.repaired`],
      diagnostic_source_ids: sorted(new Set(diagnostic.findings.map((entry) => entry.source_definition_id))),
      isolation_route_kinds: sorted(new Set(isolation.routes.map((entry) => entry.route_kind)),
      ),
      repair_procedure_ids: [repair.repair_procedure_id],
      validation_procedure_ids: verify.requirements.map((entry) => entry.validation_procedure_id),
      required_response_card_definition_ids: responseRequirements(root, parts),
      closure: 'accepted Isolation + cited decisive Evidence + necessary Repair + all current passing Verifies',
    };
  });
  const selectedIds = sorted(new Set(cardCatalog.cards.map((card) => card.primary_domain_reference.entity_id)));
  const allActionIds = domain.entities.filter((entry) => ['test', 'command', 'repair_procedure', 'validation_procedure'].includes(entry.entity_type)).map((entry) => entry.id);
  const selectedSet = new Set(selectedIds);
  const typeCounts = Object.fromEntries(sorted(new Set(domain.entities.map((entry) => entry.entity_type))).map((type) => [
    type,
    domain.entities.filter((entry) => entry.entity_type === type).length,
  ]));
  return {
    ...clone(baseCoverage),
    coverage_version: VERSION.coverage,
    part_catalog_version: VERSION.parts,
    ticket_content_version: VERSION.ticket,
    domain_content_version: VERSION.domain,
    card_catalog_version: VERSION.cards,
    inventory: {
      knowledge_records: domain.entities.length,
      action_bearing_records: allActionIds.length,
      tests: typeCounts.test,
      commands: typeCounts.command,
      repairs: typeCounts.repair_procedure,
      validations: typeCounts.validation_procedure,
      promoted_diagnostics: cardCatalog.cards.filter((card) => card.play_contract.contract_type === 'DIAGNOSTIC').length,
      selected_repairs: selectedIds.filter((id) => entityById.get(id)?.entity_type === 'repair_procedure').length,
      selected_validations: selectedIds.filter((id) => entityById.get(id)?.entity_type === 'validation_procedure').length,
      playable_card_definitions: cardCatalog.cards.length,
      supported_fingerprints: fingerprints.length,
      records_by_entity_type: typeCounts,
    },
    selected_action_definition_ids: selectedIds,
    deferred_action_definition_ids: sorted(allActionIds.filter((id) => !selectedSet.has(id))),
    diagnostic_definition_ids: cardCatalog.cards.filter((card) => card.play_contract.contract_type === 'DIAGNOSTIC').map((card) => card.id),
    outcome_families: clone(parts.diagnostic_outcome_families),
    fingerprints,
  };
}

function caseReviewSources(sourceCatalog) {
  const titles = {
    'exp-001': 'Dell PowerEdge R910 four-processor boot-failure case',
    'exp-002': 'Dell PowerEdge T420 voltage-error and PDB-replacement case',
    'exp-003': 'Dell PowerEdge R620 predictive-drive and completed-rebuild case',
    'exp-004': 'Dell PowerEdge stale backplane-alert case',
    'exp-005': 'Dell PowerEdge firmware-correlated NIC-flap case',
    'exp-006': 'GA-7PESH2 BMC recovery case',
  };
  return sourceCatalog.packs.map((pack) => ({
    id: pack.source_id,
    title: titles[pack.case_id],
    url: pack.source_url,
    authority: 'firsthand community troubleshooting report; gameplay interpretation reviewed separately',
  }));
}

function acronymIds(record, glossary) {
  const text = [record.presentation?.display_name, ...Object.values(learnerCopy(record)).flatMap((value) => Array.isArray(value) ? value : value == null ? [] : [value])].join(' ');
  return glossary.terms.filter((term) => {
    const escaped = term.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^A-Za-z0-9])${escaped}([^A-Za-z0-9]|$)`).test(text)
      && text.toLocaleLowerCase().includes(term.expansion.toLocaleLowerCase());
  }).map((term) => term.id).sort(stableCompare);
}

function makeReview(baseReview, sourceCatalog, actionCaseSources, coverage, domain, glossary) {
  const entityById = new Map(domain.entities.map((entity) => [entity.id, entity]));
  const oldById = new Map(baseReview.records.map((record) => [record.domain_id, record]));
  const records = coverage.selected_action_definition_ids.map((id) => {
    const entity = entityById.get(id);
    const inherited = oldById.get(id);
    const sourceIds = sorted(new Set([
      ...(inherited?.source_ids ?? []),
      ...[...(actionCaseSources.get(id) ?? [])],
    ]));
    if (sourceIds.length === 0) throw new Error(`${id} has no technical-copy source.`);
    const caseIds = [...(actionCaseSources.get(id) ?? [])].map((sourceId) => sourceId.replace('source.case.', ''));
    return {
      domain_id: id,
      review_status: 'reviewed',
      source_ids: sourceIds,
      acronym_ids: sorted(new Set([...(inherited?.acronym_ids ?? []), ...acronymIds(entity, glossary)])),
      scoped_uncertainty: id === 'test.management.event_log_freshness'
        ? 'TASK-042 intentionally migrates this one playable Card from combined probe/clear wording to observation-only evidence preservation and current-state comparison; clearing or reset remains exclusively a Repair.'
        : inherited?.scoped_uncertainty
          ?? `This game copy is bounded by ${caseIds.join(' and ')}; platform-specific service procedures and acceptance criteria remain authoritative.`,
      technical_copy_sha256: learnerDigest(entity),
    };
  });
  return {
    review_version: VERSION.review,
    reviewed_on: '2026-08-28',
    review_scope: '83 published playable primary domain records, including twelve source-backed story-expansion response actions',
    sources: [...clone(baseReview.sources), ...caseReviewSources(sourceCatalog)].sort((left, right) => stableCompare(left.id, right.id)),
    records,
  };
}

function validateGenerated({ baseDecks, parts, domain, cardCatalog, deckCatalog, coverage, review, sourceCatalog }) {
  const errors = [];
  const domainById = new Map(domain.entities.map((entity) => [entity.id, entity]));
  const cardByPrimary = new Map(cardCatalog.cards.map((card) => [card.primary_domain_reference.entity_id, card]));
  if (parts.fingerprint_roots.length !== 18) errors.push(`Expected 18 fingerprint roots; found ${parts.fingerprint_roots.length}.`);
  if (cardCatalog.cards.length !== 83) errors.push(`Expected 83 playable Cards; found ${cardCatalog.cards.length}.`);
  if (coverage.selected_action_definition_ids.length !== 83) errors.push('Coverage does not select exactly 83 action definitions.');
  if (coverage.inventory.supported_fingerprints !== 18) errors.push('Coverage does not support exactly 18 fingerprints.');
  if (coverage.inventory.promoted_diagnostics !== 50
      || coverage.inventory.selected_repairs !== 18
      || coverage.inventory.selected_validations !== 15) {
    errors.push('Coverage inventory must contain 50 diagnostics, 18 Repairs, and 15 Verifies.');
  }
  if (JSON.stringify(deckCatalog.decks.slice(0, 2)) !== JSON.stringify(baseDecks.decks)) {
    errors.push('The two TASK-014 response Deck objects changed content or byte order.');
  }
  const proofDeck = deckCatalog.decks.find((deck) => deck.id === RESPONSE_DECK_ID);
  if (!proofDeck || proofDeck.card_definition_ids.length !== 30) errors.push('The expansion response Deck is missing or not exactly 30 Cards.');
  for (const scenario of SCENARIOS) {
    const repairId = responseCardId('repair', scenario.repair);
    const verifyId = responseCardId('verify', scenario.verify);
    if (proofDeck?.card_definition_ids.filter((id) => id === repairId).length !== 3) errors.push(`${repairId} must have exactly three proof-Deck copies.`);
    if (proofDeck?.card_definition_ids.filter((id) => id === verifyId).length !== 2) errors.push(`${verifyId} must have exactly two proof-Deck copies.`);
    const root = parts.fingerprint_roots.find((entry) => entry.fingerprint_id === scenario.fingerprint_id);
    if (root?.response_deck_id !== RESPONSE_DECK_ID || root?.teaching_part_id !== scenario.teaching_id) errors.push(`${scenario.fingerprint_id} lacks explicit teaching/deck routing.`);
    const repair = domainById.get(scenario.repair);
    const verify = domainById.get(scenario.verify);
    const diagnosticId = sourceCatalog.packs.flatMap((pack) => pack.entity_overrides)
      .find((entry) => entry.entity_id === scenario.repair)?.reuse_illustration_from;
    const diagnostic = domainById.get(diagnosticId);
    for (const action of [repair, verify]) {
      if (!action?.presentation?.illustration || action.presentation.illustration.asset_id !== diagnostic?.presentation?.illustration?.asset_id) {
        errors.push(`${action?.id ?? scenario.fingerprint_id} does not intentionally reuse its diagnostic illustration.`);
      }
      if (!action?.presentation?.illustration?.alt_text?.includes('intentionally shared')) errors.push(`${action?.id} lacks accessible art-reuse disclosure.`);
      if (!cardByPrimary.get(action?.id)?.primary_domain_reference?.inherit_illustration) errors.push(`${action?.id} Card does not inherit primary art.`);
    }
  }
  const staleTest = domainById.get('test.management.event_log_freshness');
  if (staleTest.test_type !== 'current-state comparison'
      || /refreshes controller state/i.test(staleTest.presentation.short_description)
      || !/without clearing or resetting/i.test(staleTest.education_text)) {
    errors.push('Event Log Freshness Test is not the required observation-only evidence-preservation action.');
  }
  const alert = domainById.get('symptom.management.alert_persists');
  const backplane = domainById.get('fault.storage.backplane.path_failed');
  if (!alert.associated_fault_ids.includes(backplane.id) || !backplane.symptom_ids.includes(alert.id)) errors.push('Stale alert and backplane fault are not reciprocal legacy relationships.');
  if (!alert.relationships.some((entry) => entry.role === 'associated_fault' && entry.entity_id === backplane.id)
      || !backplane.relationships.some((entry) => entry.role === 'associated_symptom' && entry.entity_id === alert.id)) {
    errors.push('Stale alert and backplane fault are not reciprocal normalized relationships.');
  }
  const reviewById = new Map(review.records.map((record) => [record.domain_id, record]));
  const sourceIds = new Set(review.sources.map((source) => source.id));
  if (review.records.length !== 83 || reviewById.size !== 83) errors.push('Technical-copy review must map exactly 83 unique actions.');
  for (const id of coverage.selected_action_definition_ids) {
    const entity = domainById.get(id);
    const card = cardByPrimary.get(id);
    const record = reviewById.get(id);
    if (!entity || !card || !record) errors.push(`${id} is incomplete across domain, Card, and review.`);
    else {
      if (record.technical_copy_sha256 !== learnerDigest(entity)) errors.push(`${id} review digest is stale.`);
      if (record.source_ids.some((sourceId) => !sourceIds.has(sourceId))) errors.push(`${id} references an unknown review source.`);
      if (card.presentation.short_description !== entity.presentation.short_description
          || (card.educational_text ?? null) !== (entity.education_text ?? null)) errors.push(`${id} Card technical copy drifted from domain.`);
    }
  }
  if (errors.length) throw new Error(`TASK-042 generation validation failed:\n- ${errors.join('\n- ')}`);
}

async function assertOldHashes() {
  for (const [filename, expected] of Object.entries(OLD_HASHES)) {
    const bytes = await readFile(path.join(gameplayRoot, filename));
    const actual = digestBytes(bytes);
    if (actual !== expected) throw new Error(`${filename} changed: expected ${expected}, found ${actual}.`);
  }
}

export async function buildTask042Content({ check = false } = {}) {
  await assertOldHashes();
  const [baseParts, baseDomain, baseCards, baseDecks, baseCoverage, baseReview, glossary, sourceCatalog] = await Promise.all([
    readJson(path.join(gameplayRoot, 'task-014-parts.json')),
    readJson(path.join(gameplayRoot, 'domain-snapshot-v2.json')),
    readJson(path.join(gameplayRoot, 'card-catalog-v3.json')),
    readJson(path.join(gameplayRoot, 'decks-v3.json')),
    readJson(path.join(gameplayRoot, 'playable-coverage-v3.json')),
    readJson(path.join(gameplayRoot, 'technical-copy-review-v1.json')),
    readJson(path.join(gameplayRoot, 'technical-action-glossary-v1.json')),
    readJson(path.join(domainSourceRoot, 'task-042-source-packs.json')),
  ]);
  const parts = expansionParts(baseParts);
  const { domain, actionCaseSources } = applySourcePacks(baseDomain, sourceCatalog);
  const cardCatalog = makeCardCatalog(baseCards, domain);
  const deckCatalog = makeDeckCatalog(baseDecks);
  const coverage = makeCoverage(baseCoverage, parts, domain, cardCatalog);
  const review = makeReview(baseReview, sourceCatalog, actionCaseSources, coverage, domain, glossary);
  validateGenerated({ baseDecks, parts, domain, cardCatalog, deckCatalog, coverage, review, sourceCatalog });
  const outputs = new Map([
    ['task-042-parts.json', parts],
    ['domain-snapshot-v3.json', domain],
    ['card-catalog-v4.json', cardCatalog],
    ['decks-v4.json', deckCatalog],
    ['playable-coverage-v4.json', coverage],
    ['technical-copy-review-v2.json', review],
  ]);
  await mkdir(gameplayRoot, { recursive: true });
  if (check) {
    const stale = [];
    for (const [filename, value] of outputs) {
      const expected = `${JSON.stringify(value, null, 2)}\n`;
      const actual = await readFile(path.join(gameplayRoot, filename), 'utf8').catch(() => null);
      if (actual !== expected) stale.push(filename);
    }
    if (stale.length) throw new Error(`TASK-042 generated outputs are stale or missing: ${stale.join(', ')}.`);
  } else {
    await Promise.all([...outputs].map(([filename, value]) => writeJson(path.join(gameplayRoot, filename), value)));
  }
  await assertOldHashes();
  return { parts, domain, cardCatalog, deckCatalog, coverage, review };
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const check = process.argv.includes('--check');
  const result = await buildTask042Content({ check });
  console.log(`${check ? 'Checked' : 'Generated'} ${result.cardCatalog.cards.length} Cards and ${result.coverage.fingerprints.length} fingerprints without changing TASK-014 artifacts.`);
}
