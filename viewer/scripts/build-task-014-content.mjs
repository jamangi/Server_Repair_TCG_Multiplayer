import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(scriptPath), '..', '..');
const viewerContentRoot = path.join(repositoryRoot, 'viewer', 'content');
const gameplayRoot = path.join(repositoryRoot, 'content', 'gameplay-v1');
const coverageRoot = path.join(repositoryRoot, 'docs', 'coverage');
const stableCompare = (left, right) => (left < right ? -1 : left > right ? 1 : 0);
const sorted = (values) => [...values].sort(stableCompare);

const readJson = async (filename) => JSON.parse(await readFile(filename, 'utf8'));
const writeJson = async (filename, value) => writeFile(filename, `${JSON.stringify(value, null, 2)}\n`, 'utf8');

function addRelationship(relationships, role, entityId) {
  if (typeof entityId !== 'string') return;
  const key = `${role}\u0000${entityId}`;
  if (!relationships.has(key)) relationships.set(key, { role, entity_id: entityId });
}

function normalizedEntity(entity) {
  const next = structuredClone(entity);
  const relationships = new Map();
  for (const relationship of entity.relationships ?? []) {
    addRelationship(relationships, relationship.role, relationship.entity_id);
  }
  const mappings = [
    ['associated_fault_ids', 'associated_fault'],
    ['symptom_ids', 'associated_symptom'],
    ['affected_component_ids', 'affected_component'],
    ['effective_test_ids', 'effective_test'],
    ['repair_procedure_ids', 'eligible_repair'],
    ['validation_procedure_ids', 'eligible_validation'],
    ['target_fault_ids', entity.entity_type === 'validation_procedure' ? 'validates_fault' : 'target_fault'],
    ['validates_fault_ids', 'validates_fault'],
    ['target_component_ids', 'target_component'],
    ['required_component_ids', 'component_requirement'],
    ['required_protocol_ids', 'protocol_requirement'],
    ['required_tool_ids', 'tool_requirement'],
    ['related_test_ids', 'related_test'],
  ];
  for (const [field, role] of mappings) {
    for (const id of entity[field] ?? []) addRelationship(relationships, role, id);
  }
  for (const rule of entity.evidence_rules ?? []) addRelationship(relationships, 'evidence_target', rule.fault_id);
  if (entity.cause_fault_id) addRelationship(relationships, 'cause_fault', entity.cause_fault_id);
  if (entity.effect_fault_id) addRelationship(relationships, 'effect_fault', entity.effect_fault_id);
  next.relationships = [...relationships.values()]
    .sort((left, right) => stableCompare(`${left.role}\u0000${left.entity_id}`, `${right.role}\u0000${right.entity_id}`));
  return next;
}

function sourceMeta(tags) {
  return {
    expansion_id: 'expansion.task_014',
    version: '1.0.0',
    status: 'published',
    search_tags: sorted(new Set(tags.filter(Boolean))),
  };
}

function componentTargets(entity, entityById) {
  if (entity.entity_type === 'test') return sorted(new Set(entity.target_component_ids ?? []));
  const relatedTests = (entity.related_test_ids ?? []).map((id) => entityById.get(id)).filter(Boolean);
  return sorted(new Set(relatedTests.flatMap((test) => test.target_component_ids ?? [])));
}

function diagnosticCard(entity, parts, entityById) {
  const targets = componentTargets(entity, entityById);
  const category = entity.category ?? entity.id.split('.')[1] ?? 'general';
  const cost = entity.entity_type === 'test' ? entity.action_cost : parts.command_action_costs[entity.id];
  if (!Number.isInteger(cost) || cost < 0 || cost > 3) throw new Error(`${entity.id} lacks an authored Action cost.`);
  const relatedIds = sorted(new Set([
    ...(entity.required_tool_ids ?? []),
    ...(entity.related_test_ids ?? []),
    ...targets,
  ]));
  return {
    id: `card.bench.${entity.id}`,
    entity_type: 'card',
    presentation: {
      display_name: entity.presentation?.display_name ?? entity.id,
      short_description: entity.presentation?.short_description ?? entity.purpose ?? 'Run this diagnostic against an eligible active Ticket.',
    },
    source: sourceMeta(['global_bench', entity.entity_type, category]),
    card_type: entity.entity_type,
    archetypes: sorted(new Set(['global_bench', category])),
    cost,
    tags: sorted(new Set(['diagnostic', entity.entity_type, category])),
    rules_text: `Run ${entity.id} on one compatible active Ticket and resolve its single authored current-state Evidence outcome.`,
    primary_domain_reference: {
      entity_id: entity.id,
      entity_type: entity.entity_type,
      role: 'execution',
      inherit_illustration: true,
    },
    additional_domain_references: relatedIds.map((id) => ({
      entity_id: id,
      entity_type: entityById.get(id)?.entity_type ?? 'component',
      role: targets.includes(id) ? 'subject' : 'reference',
    })),
    play_contract: {
      contract_type: 'DIAGNOSTIC',
      action_type: 'RUN_TEST',
      source_definition_id: entity.id,
      source_entity_type: entity.entity_type,
      target_spec: {
        target_kind: targets.length > 0 ? 'TICKET_COMPONENT' : 'ACTIVE_TICKET',
        allowed_component_definition_ids: targets,
      },
      prerequisites: [],
      resolution: [{ resolution_type: 'AUTHORED_EVIDENCE', source_definition_id: entity.id }],
      disposition: 'remain_in_diagnostic_bench',
      placement: 'diagnostic_bench',
    },
    educational_text: entity.education_text ?? entity.educational_text ?? entity.purpose ?? 'Treat the result as Evidence, not as an automatic diagnosis.',
    rarity: 'common',
  };
}

function repairCard(procedure, faultIds, entityById) {
  const token = procedure.id.replace(/^repair\./, '');
  return {
    id: `card.response.repair.${token}`,
    entity_type: 'card',
    presentation: {
      display_name: procedure.presentation?.display_name ?? procedure.id,
      short_description: procedure.presentation?.short_description ?? `Perform ${procedure.id} after accepted Isolation.`,
    },
    source: sourceMeta(['response', 'repair', procedure.id.split('.')[1]]),
    card_type: 'repair_procedure',
    archetypes: sorted(new Set(['response', procedure.id.split('.')[1]])),
    cost: procedure.action_cost,
    tags: sorted(new Set(['repair', procedure.id.split('.')[1]])),
    rules_text: `After accepted Isolation, apply ${procedure.id} to its compatible actionable Fault.`,
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
    educational_text: procedure.education_text ?? procedure.educational_text ?? 'Repair changes machine state; Verify still determines recovery.',
    rarity: 'common',
  };
}

function verifyCard(validation, entityById) {
  const token = validation.id.replace(/^verify\./, '');
  const faults = sorted(new Set(validation.validates_fault_ids ?? []));
  return {
    id: `card.response.verify.${token}`,
    entity_type: 'card',
    presentation: {
      display_name: validation.presentation?.display_name ?? validation.id,
      short_description: validation.presentation?.short_description ?? `Evaluate ${validation.id} after the latest Repair.`,
    },
    source: sourceMeta(['response', 'verify', validation.id.split('.')[1]]),
    card_type: 'verification',
    archetypes: sorted(new Set(['response', validation.id.split('.')[1]])),
    cost: validation.action_cost,
    tags: sorted(new Set(['verify', validation.id.split('.')[1]])),
    rules_text: `Evaluate ${validation.id} for a named active Ticket requirement after its latest Repair.`,
    primary_domain_reference: { entity_id: validation.id, entity_type: 'validation_procedure', role: 'execution', inherit_illustration: true },
    additional_domain_references: faults.map((id) => ({ entity_id: id, entity_type: entityById.get(id)?.entity_type ?? 'fault', role: 'subject' })),
    play_contract: {
      contract_type: 'VERIFY',
      action_type: 'PERFORM_VERIFY',
      validation_procedure_id: validation.id,
      target_spec: { target_kind: 'ACTIVE_TICKET_VERIFICATION_REQUIREMENT' },
      prerequisites: [{ prerequisite_type: 'REPAIR_HISTORY_PRESENT' }],
      resolution: [{ resolution_type: 'AUTHORED_VERIFY', validation_procedure_id: validation.id }],
      disposition: 'discard',
    },
    educational_text: validation.education_text ?? validation.educational_text ?? 'A current passing Verify is required before closure.',
    rarity: 'common',
  };
}

function associatedCandidates(context, blueprint, entityById, maximum) {
  const plausible = new Set();
  for (const symptomId of context.symptom_ids) {
    for (const faultId of entityById.get(symptomId)?.associated_fault_ids ?? []) plausible.add(faultId);
  }
  const truth = blueprint.fault_instances.map((instance) => instance.fault_id);
  for (const id of truth) {
    if (!plausible.has(id)) throw new Error(`${context.part_id} does not publicly support hidden ${id}.`);
  }
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
    `card.response.repair.${repair.repair_procedure_id.replace(/^repair\./, '')}`,
    ...verify.requirements.map((entry) => `card.response.verify.${entry.validation_procedure_id.replace(/^verify\./, '')}`),
  ];
}

function markdownCoverage(coverage) {
  const rows = coverage.fingerprints.map((entry) => `| ${entry.fingerprint_id} | ${entry.subsystem} | ${entry.symptom_ids.join('<br>')} | ${entry.public_candidate_fault_ids.join('<br>')} | ${entry.actionable_fault_ids.join('<br>')} | ${entry.isolation_route_kinds.join(', ')} | ${entry.repair_procedure_ids.join('<br>')} | ${entry.validation_procedure_ids.join('<br>')} |`).join('\n');
  return `# TASK-014 playable coverage\n\nThis report is generated deterministically from the pinned Viewer manifest and \`task-014-parts.json\`. Knowledge records are not assumed to be Cards.\n\n## Inventory\n\n- Knowledge records: **${coverage.inventory.knowledge_records}**\n- Action-bearing records: **${coverage.inventory.action_bearing_records}** (${coverage.inventory.tests} Tests, ${coverage.inventory.commands} Commands, ${coverage.inventory.repairs} Repairs, ${coverage.inventory.validations} Validations)\n- Global Bench definitions: **${coverage.inventory.promoted_diagnostics}** (${coverage.inventory.tests} Tests and ${coverage.inventory.commands} Commands)\n- Selected response definitions: **${coverage.inventory.selected_repairs}** Repairs and **${coverage.inventory.selected_validations}** Validations\n- Supported causal fingerprints: **${coverage.inventory.supported_fingerprints}**\n- Deferred action-bearing records: **${coverage.deferred_action_definition_ids.length}** because they are outside the twelve complete scenario paths\n\n## Complete playable paths\n\n| Fingerprint | Subsystem | Public Symptom | Public candidates | Actionable truth | Isolation routes | Repair | Verify |\n|---|---|---|---|---|---|---|---|\n${rows}\n\n## Outcome completeness\n\nEvery globally promoted diagnostic has a complete executable Card contract. Ticket assembly emits exactly one outcome for each target-compatible diagnostic in both the initial and repaired machine states. Explicit relationship-bound findings are used where authored; all other eligible executions resolve through the versioned clean, unrelated, or inconclusive families. Assembly fails on a missing or duplicate source/state outcome.\n\nThe machine-readable matrix is \`content/gameplay-v1/playable-coverage-v3.json\`. It distinguishes the complete 257-record knowledge inventory, all 107 action-bearing records, selected playable definitions, deferred actions, source parts, required resources, machine states, and closure paths.\n`;
}

export async function buildTask014Content() {
  const manifest = await readJson(path.join(viewerContentRoot, 'manifest.json'));
  const packs = await Promise.all(manifest.files.map((relative) => readJson(path.resolve(viewerContentRoot, relative))));
  const rawEntities = packs.flatMap((pack) => pack.entities ?? []);
  const duplicateIds = rawEntities.map((entity) => entity.id).filter((id, index, ids) => ids.indexOf(id) !== index);
  if (duplicateIds.length > 0) throw new Error(`Pinned Viewer packs contain duplicate IDs: ${sorted(new Set(duplicateIds)).join(', ')}`);
  const entities = rawEntities.map(normalizedEntity).sort((left, right) => stableCompare(left.id, right.id));
  const entityById = new Map(entities.map((entity) => [entity.id, entity]));
  const parts = await readJson(path.join(gameplayRoot, 'task-014-parts.json'));

  const diagnostics = entities.filter((entity) => ['test', 'command'].includes(entity.entity_type));
  if (diagnostics.filter((entity) => entity.entity_type === 'test').length !== 37
      || diagnostics.filter((entity) => entity.entity_type === 'command').length !== 13) {
    throw new Error('Pinned manifest no longer contains the approved 37 Test / 13 Command inventory.');
  }
  const diagnosticCards = diagnostics.map((entity) => diagnosticCard(entity, parts, entityById));
  const selectedRepairs = sorted(new Set(parts.repair_plan_parts.map((entry) => entry.repair_procedure_id)));
  const selectedValidations = sorted(new Set(parts.verification_plan_parts.flatMap((entry) => entry.requirements.map((item) => item.validation_procedure_id))));
  const repairCards = selectedRepairs.map((id) => repairCard(
    entityById.get(id),
    sorted(new Set(parts.repair_plan_parts.filter((entry) => entry.repair_procedure_id === id).map((entry) => entry.target_fault_id))),
    entityById,
  ));
  const verifyCards = selectedValidations.map((id) => verifyCard(entityById.get(id), entityById));
  const cards = [...diagnosticCards, ...repairCards, ...verifyCards].sort((left, right) => stableCompare(left.id, right.id));

  const responseIds = parts.fingerprint_roots.flatMap((root) => responseRequirements(root, parts));
  const deckIds = [];
  const requiredCounts = new Map(responseIds.map((id) => [id, 0]));
  for (const id of responseIds) requiredCounts.set(id, requiredCounts.get(id) + 1);
  for (const [id, count] of [...requiredCounts].sort(([left], [right]) => stableCompare(left, right))) {
    for (let index = 0; index < count; index += 1) deckIds.push(id);
  }
  const refill = sorted(requiredCounts.keys());
  for (let index = 0; deckIds.length < 30; index += 1) {
    const id = refill[index % refill.length];
    if (deckIds.filter((candidate) => candidate === id).length < 6) deckIds.push(id);
  }

  const domain = {
    domain_content_version: parts.domain_content_version,
    source_manifest_format_version: manifest.format_version,
    source_pack_ids: packs.map((pack) => pack.pack_id).sort(stableCompare),
    entities,
  };
  const cardCatalog = {
    card_catalog_version: parts.card_catalog_version,
    domain_content_version: parts.domain_content_version,
    ruleset_version: parts.ruleset_version,
    global_bench_version: 'global-bench-v1',
    cards,
  };
  const deckCatalog = {
    deck_catalog_version: parts.deck_catalog_version,
    ruleset_version: parts.ruleset_version,
    card_catalog_version: parts.card_catalog_version,
    decks: [
      {
        id: 'deck.core.multisystem_response_v3',
        entity_type: 'deck',
        display_name: 'Multi-System Response Kit',
        card_definition_ids: deckIds,
      },
      {
        id: 'deck.fixture.multisystem_response_reordered_v3',
        entity_type: 'deck',
        display_name: 'Multi-System Response Kit — Reordered Fixture',
        card_definition_ids: [...deckIds].reverse(),
      }
    ],
  };

  const candidatePolicy = parts.candidate_pool_parts[0];
  const coverageFingerprints = parts.fingerprint_roots.map((root) => {
    const blueprint = parts.fault_blueprint_parts.find((entry) => entry.part_id === root.fault_blueprint_part_id);
    const context = parts.public_context_parts.find((entry) => entry.compatible_fault_blueprint_part_ids.includes(blueprint.part_id));
    const diagnostic = parts.diagnostic_plan_parts.find((entry) => entry.compatible_fault_blueprint_part_ids.includes(blueprint.part_id));
    const isolation = parts.isolation_plan_parts.find((entry) => entry.compatible_fault_blueprint_part_ids.includes(blueprint.part_id));
    const repair = parts.repair_plan_parts.find((entry) => entry.compatible_fault_blueprint_part_ids.includes(blueprint.part_id));
    const verify = parts.verification_plan_parts.find((entry) => entry.compatible_fault_blueprint_part_ids.includes(blueprint.part_id));
    const teaching = parts.teaching_parts.find((entry) => entry.subsystem === root.subsystem);
    const candidates = associatedCandidates(context, blueprint, entityById, candidatePolicy.maximum_candidates);
    return {
      fingerprint_id: root.fingerprint_id,
      subsystem: root.subsystem,
      part_ids: [root.fault_blueprint_part_id, context.part_id, candidatePolicy.part_id, diagnostic.part_id, isolation.part_id, repair.part_id, verify.part_id, teaching.part_id, parts.closure_parts[0].part_id],
      symptom_ids: context.symptom_ids,
      public_candidate_fault_ids: candidates,
      actionable_fault_ids: blueprint.fault_instances.filter((entry) => entry.actionable).map((entry) => entry.fault_id),
      causal_edge_ids: blueprint.causal_edges.map((entry) => entry.causal_edge_id),
      machine_state_keys: [blueprint.initial_machine_state_key, `${blueprint.initial_machine_state_key}.repaired`],
      diagnostic_source_ids: sorted(new Set(diagnostic.findings.map((entry) => entry.source_definition_id))),
      isolation_route_kinds: sorted(new Set(isolation.routes.map((entry) => entry.route_kind))),
      repair_procedure_ids: [repair.repair_procedure_id],
      validation_procedure_ids: verify.requirements.map((entry) => entry.validation_procedure_id),
      required_response_card_definition_ids: responseRequirements(root, parts),
      closure: 'accepted Isolation + cited decisive Evidence + necessary Repair + all current passing Verifies',
    };
  });
  const allActionIds = entities.filter((entry) => ['test', 'command', 'repair_procedure', 'validation_procedure'].includes(entry.entity_type)).map((entry) => entry.id);
  const selectedActionIds = new Set([...diagnostics.map((entry) => entry.id), ...selectedRepairs, ...selectedValidations]);
  const typeCounts = Object.fromEntries(entities.map((entry) => entry.entity_type).filter((value, index, values) => values.indexOf(value) === index)
    .sort(stableCompare).map((type) => [type, entities.filter((entry) => entry.entity_type === type).length]));
  const coverage = {
    coverage_version: 'playable-coverage-v3',
    part_catalog_version: parts.part_catalog_version,
    ticket_content_version: parts.ticket_content_version,
    domain_content_version: parts.domain_content_version,
    card_catalog_version: parts.card_catalog_version,
    source_manifest_files: [...manifest.files],
    inventory: {
      knowledge_records: entities.length,
      action_bearing_records: allActionIds.length,
      tests: typeCounts.test,
      commands: typeCounts.command,
      repairs: typeCounts.repair_procedure,
      validations: typeCounts.validation_procedure,
      promoted_diagnostics: diagnosticCards.length,
      selected_repairs: selectedRepairs.length,
      selected_validations: selectedValidations.length,
      playable_card_definitions: cards.length,
      supported_fingerprints: coverageFingerprints.length,
      records_by_entity_type: typeCounts,
    },
    selected_action_definition_ids: sorted(selectedActionIds),
    deferred_action_definition_ids: sorted(allActionIds.filter((id) => !selectedActionIds.has(id))),
    diagnostic_definition_ids: diagnosticCards.map((card) => card.id),
    outcome_families: parts.diagnostic_outcome_families,
    fingerprints: coverageFingerprints,
  };

  if (coverage.inventory.knowledge_records !== 257 || coverage.inventory.action_bearing_records !== 107
      || coverage.inventory.supported_fingerprints !== 12 || coverage.inventory.promoted_diagnostics !== 50) {
    throw new Error('Generated coverage does not match the approved TASK-014 inventory.');
  }
  await mkdir(coverageRoot, { recursive: true });
  await Promise.all([
    writeJson(path.join(gameplayRoot, 'domain-snapshot-v2.json'), domain),
    writeJson(path.join(gameplayRoot, 'card-catalog-v3.json'), cardCatalog),
    writeJson(path.join(gameplayRoot, 'decks-v3.json'), deckCatalog),
    writeJson(path.join(gameplayRoot, 'playable-coverage-v3.json'), coverage),
    writeFile(path.join(coverageRoot, 'TASK-014-PLAYABLE-COVERAGE.md'), markdownCoverage(coverage), 'utf8'),
  ]);
  return { domain, cardCatalog, deckCatalog, coverage };
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const result = await buildTask014Content();
  console.log(`Generated ${result.coverage.inventory.playable_card_definitions} Cards and ${result.coverage.inventory.supported_fingerprints} coverage paths from ${result.coverage.inventory.knowledge_records} records.`);
}
