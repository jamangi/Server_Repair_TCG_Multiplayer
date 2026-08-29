import { createHash } from 'node:crypto';

const STABLE_ID = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
const REQUIRED_BEAT_KINDS = Object.freeze([
  'PUBLIC_SETUP',
  'LEARNING',
  'REPEATED_PRACTICE',
  'CHECKPOINT',
  'MATCH',
  'OUTCOME_BRANCH',
  'SERVICE_POINT',
  'INTERRUPTION',
  'FOLLOW_ON',
]);

export const EXPANSION_BLUEPRINT_VERSION = 'quiet-cascade-expansion-blueprint-v1';
export const EXPANSION_GRAPH_REPORT_VERSION = 'quiet-cascade-expansion-graph-report-v1';

export function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function invariant(condition, code, message) {
  if (!condition) throw new Error(`[${code}] ${message}`);
}

function unique(values) {
  return new Set(values).size === values.length;
}

function assertStableId(value, context) {
  invariant(typeof value === 'string' && STABLE_ID.test(value), 'STABLE_ID', `${context}: ${value}`);
}

function deepEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function sortedObject(value) {
  return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)));
}

function registryMatches(matchRegistry) {
  const rows = matchRegistry?.matches ?? matchRegistry?.match_registry ?? matchRegistry?.entries;
  invariant(Array.isArray(rows), 'MATCH_REGISTRY_SHAPE', 'Match registry must expose a matches array.');
  return rows;
}

function proofMatches(builderProof) {
  const rows = builderProof?.matches ?? builderProof?.batches ?? builderProof?.proofs ?? builderProof?.tickets;
  invariant(Array.isArray(rows), 'BUILDER_PROOF_SHAPE', 'Builder proof must expose matches, batches, proofs, or tickets.');
  return rows;
}

function planningAssignments(planningAudit) {
  const rows = planningAudit?.episode_assignments;
  invariant(Array.isArray(rows), 'PLANNING_ASSIGNMENTS', 'Planning audit must expose episode_assignments[].');
  return rows;
}

function planningAssetEpisodes(planningAudit) {
  const rows = planningAudit?.asset_plan?.episodes;
  invariant(Array.isArray(rows), 'PLANNING_ASSET_PLAN', 'Planning audit must expose asset_plan.episodes[].');
  return rows;
}

function extractDiagnosticPartition(proof) {
  const partition = proof.legal_relevant_required_optional_diagnostics
    ?? proof.diagnostic_partition
    ?? proof.diagnostics
    ?? proof.diagnostic_classification
    ?? proof.oracle?.diagnostic_partition;
  invariant(partition && typeof partition === 'object', 'DIAGNOSTIC_PARTITION', `${proof.match_ref}: missing diagnostic partition.`);
  const legal = partition.legal?.source_definition_ids ?? partition.legal_ids ?? partition.legal_diagnostic_ids ?? partition.target_legal_ids;
  const relevant = partition.relevant?.source_definition_ids ?? partition.relevant_ids ?? partition.relevant_diagnostic_ids ?? partition.target_relevant_ids;
  const required = partition.required?.source_definition_ids ?? partition.required_ids ?? partition.required_diagnostic_ids ?? partition.minimal_witness_ids;
  const optional = partition.optional_relevant?.source_definition_ids ?? partition.optional_ids ?? partition.optional_diagnostic_ids ?? partition.relevant_optional_ids;
  for (const [name, rows] of Object.entries({ legal, relevant, required, optional })) {
    invariant(Array.isArray(rows), 'DIAGNOSTIC_PARTITION', `${proof.match_ref}: missing ${name} diagnostic IDs.`);
    invariant(unique(rows), 'DIAGNOSTIC_PARTITION_DUPLICATE', `${proof.match_ref}: duplicate ${name} diagnostic ID.`);
  }
  invariant(required.every((id) => relevant.includes(id)), 'REQUIRED_NOT_RELEVANT', `${proof.match_ref}: required diagnostics must be relevant.`);
  invariant(relevant.every((id) => legal.includes(id)), 'RELEVANT_NOT_LEGAL', `${proof.match_ref}: relevant diagnostics must be legal.`);
  invariant(optional.every((id) => relevant.includes(id) && !required.includes(id)), 'OPTIONAL_PARTITION', `${proof.match_ref}: optional diagnostics must be relevant and non-required.`);
  invariant(deepEqual([...new Set([...required, ...optional])].sort(), [...relevant].sort()), 'RELEVANT_PARTITION', `${proof.match_ref}: required and optional diagnostics must partition relevant diagnostics.`);
  return {
    legal_ids: [...legal].sort(),
    relevant_ids: [...relevant].sort(),
    required_ids: [...required].sort(),
    optional_ids: [...optional].sort(),
  };
}

function extractWitness(proof) {
  const witness = proof.response_path?.oracle_witness ?? proof.solvability_witness ?? proof.oracle_witness ?? proof.witness;
  invariant(Array.isArray(witness) && witness.length >= 4, 'ORACLE_WITNESS', `${proof.match_ref}: missing solvability witness.`);
  const actions = witness.map((step) => step.action);
  invariant(actions.includes('RUN_DIAGNOSTIC'), 'ORACLE_WITNESS', `${proof.match_ref}: witness lacks a diagnostic.`);
  invariant(actions.includes('COMMIT_ISOLATION'), 'ORACLE_WITNESS', `${proof.match_ref}: witness lacks Isolation.`);
  invariant(actions.includes('PERFORM_REPAIR'), 'ORACLE_WITNESS', `${proof.match_ref}: witness lacks Repair.`);
  invariant(actions.includes('PERFORM_VERIFY'), 'ORACLE_WITNESS', `${proof.match_ref}: witness lacks Verify.`);
  return witness;
}

function exactMatchContract(episode, match, proof) {
  const ticketIds = match.expected_ticket_definition_ids ?? match.expected_ticket_ids;
  const ticketDigests = match.expected_ticket_snapshot_digests ?? match.expected_ticket_digests;
  const configuration = match.builder_configuration;
  invariant(configuration && typeof configuration === 'object', 'BUILDER_CONFIGURATION', `${episode.match_ref}: complete builder_configuration is required.`);
  invariant(match.shift_id === episode.episode_id, 'MATCH_SHIFT_ID', `${episode.match_ref}: shift ID diverges from blueprint.`);
  invariant(match.source_case_id === episode.case_id, 'MATCH_SOURCE_CASE', `${episode.match_ref}: source case diverges from blueprint.`);
  invariant(match.entry_label === episode.labels.entry, 'MATCH_ENTRY_LABEL', `${episode.match_ref}: entry label diverges from blueprint.`);
  invariant(match.launch_label === episode.labels.match, 'MATCH_LAUNCH_LABEL', `${episode.match_ref}: launch label diverges from blueprint.`);
  invariant(match.return_label === episode.labels.return, 'MATCH_RETURN_LABEL', `${episode.match_ref}: return label diverges from blueprint.`);
  invariant(match.completed_label === episode.labels.success, 'MATCH_COMPLETED_LABEL', `${episode.match_ref}: completed label diverges from blueprint.`);
  invariant(match.abandoned_label === episode.labels.abandon, 'MATCH_ABANDONED_LABEL', `${episode.match_ref}: abandoned label diverges from blueprint.`);
  invariant(match.pre_match_checkpoint_id === episode.checkpoints.pre_match, 'MATCH_PRE_CHECKPOINT', `${episode.match_ref}: pre-Match checkpoint diverges from blueprint.`);
  invariant(match.post_match_checkpoint_id === episode.checkpoints.post_match, 'MATCH_POST_CHECKPOINT', `${episode.match_ref}: post-Match checkpoint diverges from blueprint.`);
  invariant(deepEqual(match.learning_objectives, [episode.learning_objective]), 'MATCH_OBJECTIVE', `${episode.match_ref}: learning objective diverges from blueprint.`);
  invariant(match.interruption_behavior === 'RESTORE_PRE_MATCH_CHECKPOINT_AND_RELAUNCH_FRESH_MATCH', 'MATCH_INTERRUPTION', `${episode.match_ref}: interruption policy diverges.`);
  invariant(match.service_point_consequences?.completed?.expected_story_service_points_gained === episode.story_service_points.completed_valid_result, 'MATCH_SERVICE_POINTS', `${episode.match_ref}: completed Story Service Point consequence diverges.`);
  invariant(match.service_point_consequences?.abandoned?.story_service_points_gained === episode.story_service_points.abandoned_valid_result, 'MATCH_SERVICE_POINTS', `${episode.match_ref}: abandoned Story Service Point consequence diverges.`);
  invariant(match.requested_ticket_count === 1, 'TICKET_COUNT', `${episode.match_ref}: exactly one Ticket is required.`);
  invariant(Array.isArray(match.allowed_fingerprint_ids) && deepEqual(match.allowed_fingerprint_ids, [episode.fingerprint_id]), 'FINGERPRINT_PIN', `${episode.match_ref}: fingerprint pin diverges from blueprint.`);
  invariant(Array.isArray(ticketIds) && ticketIds.length === 1, 'TICKET_PIN', `${episode.match_ref}: exactly one Ticket ID pin is required.`);
  invariant(Array.isArray(ticketDigests) && ticketDigests.length === 1 && /^[a-f0-9]{64}$/.test(ticketDigests[0]), 'TICKET_DIGEST_PIN', `${episode.match_ref}: exactly one Ticket digest pin is required.`);
  invariant(match.seed === configuration.seed, 'SEED_CONFIGURATION', `${episode.match_ref}: registry seed must equal Builder configuration seed.`);
  invariant(configuration.requested_ticket_count === 1, 'BUILDER_TICKET_COUNT', `${episode.match_ref}: Builder configuration must request one Ticket.`);
  invariant(deepEqual(configuration.allowed_fingerprint_ids, [episode.fingerprint_id]), 'BUILDER_FINGERPRINT_PIN', `${episode.match_ref}: Builder allowed fingerprint must be the episode singleton.`);
  invariant(proof.ticket_id === undefined || proof.ticket_id === ticketIds[0], 'PROOF_TICKET_ID', `${episode.match_ref}: proof Ticket ID differs from registry.`);
  invariant(proof.ticket_snapshot_digest === undefined || proof.ticket_snapshot_digest === ticketDigests[0], 'PROOF_TICKET_DIGEST', `${episode.match_ref}: proof Ticket digest differs from registry.`);
  invariant(proof.case_id === episode.case_id && proof.fingerprint_id === episode.fingerprint_id && proof.seed === match.seed, 'PROOF_ASSIGNMENT', `${episode.match_ref}: Builder proof assignment diverges.`);
  const diagnostics = extractDiagnosticPartition(proof);
  const witness = extractWitness(proof);
  const requiredResponseCounts = match.required_response_card_counts
    ?? match.required_response_card_definition_counts
    ?? proof.required_response_card_counts;
  invariant(requiredResponseCounts && typeof requiredResponseCounts === 'object', 'RESPONSE_COUNTS', `${episode.match_ref}: missing exact response counts.`);
  const candidateFaultIds = proof.public_candidate_fault_ids ?? proof.candidate_fault_ids ?? proof.ticket?.candidate_fault_ids;
  const trueFaultIds = proof.hidden_true_fault_ids ?? proof.true_fault_ids ?? proof.actionable_fault_ids ?? proof.ticket?.true_fault_ids;
  invariant(Array.isArray(candidateFaultIds) && candidateFaultIds.length >= 2, 'CANDIDATE_STRUCTURE', `${episode.match_ref}: public Candidate structure is incomplete.`);
  invariant(Array.isArray(trueFaultIds) && trueFaultIds.length >= 1, 'HIDDEN_TICKET_TRUTH', `${episode.match_ref}: hidden true Fault composition is absent.`);
  invariant(trueFaultIds.every((id) => candidateFaultIds.includes(id)), 'HIDDEN_TICKET_TRUTH', `${episode.match_ref}: true Fault must be a public Candidate.`);
  const rawResponsePath = proof.response_path ?? {};
  const responsePath = {
    repair_procedure_ids: rawResponsePath.repair_procedure_ids
      ?? (rawResponsePath.repair?.repair_procedure_id ? [rawResponsePath.repair.repair_procedure_id] : proof.repair_procedure_ids ?? []),
    validation_procedure_ids: rawResponsePath.validation_procedure_ids
      ?? (rawResponsePath.verify?.validation_procedure_id ? [rawResponsePath.verify.validation_procedure_id] : proof.validation_procedure_ids ?? []),
    repair_card_definition_ids: rawResponsePath.repair_card_definition_ids
      ?? (rawResponsePath.repair?.card_definition_id ? [rawResponsePath.repair.card_definition_id] : []),
    verify_card_definition_ids: rawResponsePath.verify_card_definition_ids
      ?? (rawResponsePath.verify?.card_definition_id ? [rawResponsePath.verify.card_definition_id] : []),
    oracle_witness: witness,
  };
  invariant(responsePath.repair_procedure_ids.length >= 1, 'RESPONSE_PATH', `${episode.match_ref}: Repair path is absent.`);
  invariant(responsePath.validation_procedure_ids.length >= 1, 'RESPONSE_PATH', `${episode.match_ref}: Verify path is absent.`);
  const deckPressure = match.deck_pressure ?? proof.deck_pressure;
  invariant(deckPressure && typeof deckPressure === 'object', 'DECK_PRESSURE', `${episode.match_ref}: deck pressure/headroom is required.`);
  return {
    builder_configuration: configuration,
    seed: match.seed,
    requested_ticket_count: 1,
    expected_ticket_definition_ids: ticketIds,
    expected_ticket_snapshot_digests: ticketDigests,
    hidden_ticket_composition: {
      fingerprint_id: episode.fingerprint_id,
      true_fault_ids: trueFaultIds,
      ticket_definition_id: ticketIds[0],
      ticket_snapshot_digest: ticketDigests[0],
    },
    candidate_structure: {
      public_candidate_fault_ids: candidateFaultIds,
      hidden_truth_leaks: proof.public_projection_hidden_truth_leaks ?? proof.hidden_truth_leaks ?? 0,
    },
    diagnostics,
    response_path: responsePath,
    required_response_card_counts: sortedObject(requiredResponseCounts),
    deck_pressure: deckPressure,
    oracle_witness: witness,
    command_roles: proof.legal_relevant_required_optional_diagnostics?.commands
      ?? proof.commands
      ?? { catalog_exposure_ids: [], relevant_ids: [], minimal_witness_required_ids: [] },
    public_match_setup_summary: match.public_setup_summary,
    interruption_behavior: match.interruption_behavior,
    service_point_consequences: match.service_point_consequences,
  };
}

function validateStoryAssets(episode, baseRegistry) {
  const assetIds = new Set(baseRegistry.assets.map((asset) => asset.asset_id));
  const characters = new Map(baseRegistry.characters.map((character) => [character.character_id, new Set(character.poses.map((pose) => pose.pose_id))]));
  for (const assetId of episode.art.background_asset_ids) {
    invariant(assetIds.has(assetId), 'UNKNOWN_BACKGROUND', `${episode.episode_id}: ${assetId}`);
  }
  invariant(episode.art.transient_asset_ids.length === 0, 'TRANSIENT_ASSET', `${episode.episode_id}: this reuse-only blueprint must not require transient inserts.`);
  for (const characterPose of episode.art.character_pose_ids) {
    const separator = characterPose.lastIndexOf(':');
    const characterId = characterPose.slice(0, separator);
    const poseId = characterPose.slice(separator + 1);
    invariant(characters.get(characterId)?.has(poseId), 'UNKNOWN_CHARACTER_POSE', `${episode.episode_id}: ${characterPose}`);
  }
}

function validatePlanningBinding(episode, match, planningAudit) {
  const assignment = planningAssignments(planningAudit).find((row) => row.episode_id === episode.episode_id);
  const assetPlan = planningAssetEpisodes(planningAudit).find((row) => row.episode_id === episode.episode_id);
  invariant(assignment, 'PLANNING_ASSIGNMENT', `${episode.episode_id}: missing planning assignment.`);
  invariant(assetPlan, 'PLANNING_ASSET_PLAN', `${episode.episode_id}: missing asset plan.`);
  for (const [key, expected] of Object.entries({
    match_ref: episode.match_ref,
    case_id: episode.case_id,
    fingerprint_id: episode.fingerprint_id,
  })) {
    invariant(assignment[key] === expected, 'PLANNING_ASSIGNMENT', `${episode.episode_id}: ${key} diverges from planning audit.`);
  }
  invariant(assignment.requested_ticket_count === 1, 'PLANNING_ASSIGNMENT', `${episode.episode_id}: planning assignment must request one Ticket.`);
  invariant(assignment.seed === match.seed, 'PLANNING_ASSIGNMENT', `${episode.episode_id}: seed diverges from Match registry.`);
  invariant(match.requested_ticket_count === assignment.requested_ticket_count, 'PLANNING_ASSIGNMENT', `${episode.episode_id}: requested Ticket count diverges from Match registry.`);
  invariant(deepEqual(assetPlan.background_asset_ids, episode.art.background_asset_ids), 'PLANNING_ASSET_PLAN', `${episode.episode_id}: background plan diverges.`);
  invariant(deepEqual(assetPlan.character_pose_ids, episode.art.character_pose_ids), 'PLANNING_ASSET_PLAN', `${episode.episode_id}: character pose plan diverges.`);
  invariant(deepEqual(assetPlan.transient_asset_ids, episode.art.transient_asset_ids), 'PLANNING_ASSET_PLAN', `${episode.episode_id}: transient plan diverges.`);
  invariant(Array.isArray(assetPlan.new_master_asset_ids) && assetPlan.new_master_asset_ids.length === 0, 'NEW_MASTER_ASSET', `${episode.episode_id}: blueprint requires no new master art.`);
}

function graphForBlueprint(blueprint) {
  const nodes = [{
    node_id: 'story.node.qc02.entry',
    kind: 'ENTRY',
    entry_labels: [blueprint.entry_label],
  }];
  const edges = [{
    from: 'story.node.qc02.entry',
    to: 'story.node.qc02.shift07.entry',
    condition: { kind: 'UNCONDITIONAL' },
  }];
  const checkpoints = [{ checkpoint_id: blueprint.runtime_policy.entry_checkpoint_id, kind: 'ENTRY', owner_node_id: 'story.node.qc02.entry' }];

  blueprint.episodes.forEach((episode, index) => {
    const nn = String(episode.shift_number).padStart(2, '0');
    const entryNode = `story.node.qc02.shift${nn}.entry`;
    const matchNode = `story.node.qc02.shift${nn}.match`;
    const returnNode = `story.node.qc02.shift${nn}.return`;
    const followNode = `story.node.qc02.shift${nn}.follow_on`;
    const choice = blueprint.remembered_choices.find((row) => row.episode_id === episode.episode_id);
    nodes.push({ node_id: entryNode, kind: choice ? 'CHOICE_AND_SETUP' : 'SETUP', entry_labels: [episode.labels.entry, ...(choice?.options.map((option) => option.branch_label) ?? [])] });
    nodes.push({ node_id: matchNode, kind: 'MATCH', entry_labels: [episode.labels.match], match_ref: episode.match_ref, pre_match_checkpoint_id: episode.checkpoints.pre_match, post_match_checkpoint_id: episode.checkpoints.post_match });
    nodes.push({ node_id: returnNode, kind: 'MATCH_RETURN', entry_labels: [episode.labels.return, episode.labels.success, episode.labels.abandon], match_ref: episode.match_ref });
    const delayedChoice = blueprint.remembered_choices.find((row) => row.delayed_ack_episode_id === episode.episode_id);
    nodes.push({ node_id: followNode, kind: 'FOLLOW_ON', entry_labels: [episode.labels.follow_on, ...(delayedChoice ? [delayedChoice.delayed_ack_label] : [])] });
    checkpoints.push(
      { checkpoint_id: episode.checkpoints.entry, kind: 'SCENE', owner_node_id: entryNode },
      { checkpoint_id: episode.checkpoints.pre_match, kind: 'PRE_MATCH', owner_node_id: matchNode },
      { checkpoint_id: episode.checkpoints.post_match, kind: 'POST_MATCH', owner_node_id: returnNode },
    );
    if (choice) {
      for (const option of choice.options) {
        edges.push({ from: entryNode, to: matchNode, condition: { kind: 'CHOICE_IS', choice_id: choice.choice_id, option_id: option.option_id, branch_label: option.branch_label } });
      }
    } else {
      edges.push({ from: entryNode, to: matchNode, condition: { kind: 'UNCONDITIONAL' } });
    }
    edges.push({ from: matchNode, to: returnNode, condition: { kind: 'VALID_TERMINAL_MATCH_RESULT', match_ref: episode.match_ref } });
    edges.push({ from: returnNode, to: followNode, condition: { kind: 'MATCH_COMPLETION', match_ref: episode.match_ref, completion: 'COMPLETED', branch_label: episode.labels.success } });
    edges.push({ from: returnNode, to: followNode, condition: { kind: 'MATCH_COMPLETION', match_ref: episode.match_ref, completion: 'ABANDONED', branch_label: episode.labels.abandon } });
    const nextNode = index + 1 < blueprint.episodes.length
      ? `story.node.qc02.shift${String(blueprint.episodes[index + 1].shift_number).padStart(2, '0')}.entry`
      : 'story.node.qc02.ending.current_content';
    edges.push({ from: followNode, to: nextNode, condition: { kind: 'UNCONDITIONAL' } });
  });
  nodes.push({ node_id: 'story.node.qc02.ending.current_content', kind: 'ENDING', entry_labels: [blueprint.ending.entry_label], ending_id: blueprint.ending.ending_id });
  checkpoints.push({ checkpoint_id: blueprint.ending.checkpoint_id, kind: 'END', owner_node_id: 'story.node.qc02.ending.current_content' });
  return { entry_node_id: 'story.node.qc02.entry', nodes, edges, checkpoints };
}

function validateGraph(graph, blueprint) {
  const nodeIds = graph.nodes.map((node) => node.node_id);
  const checkpointIds = graph.checkpoints.map((row) => row.checkpoint_id);
  const labels = graph.nodes.flatMap((node) => node.entry_labels);
  invariant(unique(nodeIds), 'DUPLICATE_NODE', 'Graph node IDs must be unique.');
  invariant(unique(checkpointIds), 'DUPLICATE_CHECKPOINT', 'Checkpoint IDs must be unique.');
  invariant(unique(labels), 'DUPLICATE_LABEL', 'Graph labels must be globally unique.');
  [...nodeIds, ...checkpointIds, ...labels].forEach((id) => assertStableId(id, 'graph stable ID'));
  const nodes = new Set(nodeIds);
  graph.edges.forEach((edge) => invariant(nodes.has(edge.from) && nodes.has(edge.to), 'DANGLING_EDGE', `${edge.from} -> ${edge.to}`));
  const adjacency = Map.groupBy(graph.edges, (edge) => edge.from);
  const reachable = new Set();
  const active = new Set();
  function visit(nodeId) {
    invariant(!active.has(nodeId), 'GRAPH_CYCLE', `Cycle reaches ${nodeId}.`);
    if (reachable.has(nodeId)) return;
    reachable.add(nodeId);
    active.add(nodeId);
    for (const edge of adjacency.get(nodeId) ?? []) visit(edge.to);
    active.delete(nodeId);
  }
  visit(graph.entry_node_id);
  invariant(reachable.size === graph.nodes.length, 'UNREACHABLE_NODE', `${graph.nodes.length - reachable.size} graph nodes are unreachable.`);
  invariant(graph.nodes.filter((node) => node.kind === 'MATCH').length === 6, 'MATCH_NODE_COUNT', 'Graph must have exactly six Match nodes.');
  invariant(graph.nodes.filter((node) => node.kind === 'ENDING').length === 1, 'ENDING_COUNT', 'Graph must have exactly one ending.');
  invariant(graph.checkpoints.filter((row) => row.kind === 'PRE_MATCH').length === 6, 'PRE_MATCH_CHECKPOINT_COUNT', 'Exactly six pre-Match checkpoints are required.');
  invariant(graph.checkpoints.filter((row) => row.kind === 'POST_MATCH').length === 6, 'POST_MATCH_CHECKPOINT_COUNT', 'Exactly six post-Match checkpoints are required.');
  invariant(blueprint.ending.ending_id === 'ending.qc02.current_content', 'ENDING_ID', 'The candidate has one honest current-content ending.');
}

export function enumerateExpansionRoutes(blueprint) {
  const [firstChoice, secondChoice] = blueprint.remembered_choices;
  const routes = [];
  for (const first of firstChoice.options) {
    for (const second of secondChoice.options) {
      for (let mask = 0; mask < 64; mask += 1) {
        const outcomes = {};
        let points = 0;
        for (let index = 0; index < blueprint.episodes.length; index += 1) {
          const completed = Boolean(mask & (1 << index));
          const episode = blueprint.episodes[index];
          outcomes[episode.match_ref] = completed ? 'COMPLETED' : 'ABANDONED';
          points += completed ? episode.story_service_points.completed_valid_result : episode.story_service_points.abandoned_valid_result;
        }
        const bits = blueprint.episodes.map((_, index) => (mask & (1 << index) ? 'c' : 'a')).join('');
        const payload = {
          route_id: `route.qc02.${first.option_id}.${bits}.${second.option_id}`,
          choices: {
            [firstChoice.choice_id]: first.option_id,
            [secondChoice.choice_id]: second.option_id,
          },
          match_outcomes: outcomes,
          accepted_match_count: 6,
          expansion_story_service_points_gained: points,
          canonical_story_service_points: `INHERITED_PLUS_${points}`,
          ending_id: blueprint.ending.ending_id,
          ending_checkpoint_id: blueprint.ending.checkpoint_id,
          active_match_resume_claimed: false,
          canonical_replay_mutations: 0,
        };
        routes.push({ ...payload, digest: sha256(stableJson(payload)) });
      }
    }
  }
  return routes.sort((a, b) => a.route_id.localeCompare(b.route_id));
}

function summarizeRoutes(blueprint, routes) {
  const choiceCoverage = {};
  for (const choice of blueprint.remembered_choices) {
    choiceCoverage[choice.choice_id] = Object.fromEntries(choice.options.map((option) => [option.option_id, 0]));
  }
  const matchCoverage = Object.fromEntries(blueprint.episodes.map((episode) => [episode.match_ref, { COMPLETED: 0, ABANDONED: 0 }]));
  const servicePointDistribution = {};
  const endingCoverage = { [blueprint.ending.ending_id]: 0 };
  for (const route of routes) {
    for (const [choiceId, optionId] of Object.entries(route.choices)) choiceCoverage[choiceId][optionId] += 1;
    for (const [matchRef, outcome] of Object.entries(route.match_outcomes)) matchCoverage[matchRef][outcome] += 1;
    servicePointDistribution[route.expansion_story_service_points_gained] = (servicePointDistribution[route.expansion_story_service_points_gained] ?? 0) + 1;
    endingCoverage[route.ending_id] += 1;
  }
  return {
    route_count: routes.length,
    deterministic_digest_count: new Set(routes.map((route) => route.digest)).size,
    choice_coverage: choiceCoverage,
    match_outcome_coverage: matchCoverage,
    service_point_gain_distribution: sortedObject(servicePointDistribution),
    ending_coverage: endingCoverage,
  };
}

export function buildExpansionBlueprintReport({ blueprint, baseGraph, baseRegistry, caseRegistry, domainProof, matchRegistry, builderProof, planningAudit, inputHashes = {} }) {
  invariant(blueprint.blueprint_version === EXPANSION_BLUEPRINT_VERSION, 'BLUEPRINT_VERSION', blueprint.blueprint_version);
  invariant(blueprint.status === 'NON_LIVE_CANDIDATE_NO_FINAL_DIALOGUE', 'NON_LIVE_STATUS', blueprint.status);
  invariant(blueprint.namespace === 'story.qc02', 'NAMESPACE', 'TASK-043 is locked to story.qc02.');
  invariant(blueprint.entry_label === 'story.qc02.entry', 'ENTRY_LABEL', blueprint.entry_label);
  invariant(blueprint.episodes.length === 6, 'EPISODE_COUNT', 'Exactly six episodes are required.');
  invariant(deepEqual(blueprint.episodes.map((episode) => episode.shift_number), [7, 8, 9, 10, 11, 12]), 'SHIFT_ORDER', 'Episodes must be Shifts 07 through 12 in order.');
  invariant(blueprint.remembered_choices.length === 2, 'CHOICE_COUNT', 'Exactly two finite reconvergent remembered choices are required.');
  const choiceStableIds = blueprint.remembered_choices.flatMap((choice) => [
    choice.choice_id,
    choice.variable_id,
    choice.reconverge_label,
    choice.delayed_ack_label,
    ...choice.options.flatMap((option) => [option.option_id, option.branch_label]),
  ]);
  choiceStableIds.forEach((id) => assertStableId(id, 'choice stable ID'));
  invariant(unique(blueprint.remembered_choices.map((choice) => choice.choice_id)), 'CHOICE_ID', 'Remembered choice IDs must be unique.');
  invariant(blueprint.remembered_choices.every((choice) => choice.branch_kind === 'RECONVERGENT_REMEMBERED' && choice.authority_effect === 'PRESENTATION_ORDER_ONLY'), 'CHOICE_AUTHORITY', 'Choices must reconverge and affect presentation only.');
  invariant(blueprint.composition_policy.cumulative_score_gate === false, 'SCORE_GATE', 'No cumulative score gate is allowed.');
  invariant(blueprint.composition_policy.campaign_one_service_points === 'PRESERVE_EXACTLY', 'INHERITED_POINTS', 'Campaign-one Story Service Points must be preserved exactly.');
  invariant(blueprint.runtime_policy.active_match_resume === false, 'ACTIVE_MATCH_RESUME', 'Active engine Match state cannot resume.');
  invariant(blueprint.runtime_policy.completed_episode_replay === 'STORY_009_A_ISOLATED_NON_CANONICAL_REVIEW', 'REPLAY_POLICY', 'Completed episode replay must follow STORY-009 A.');
  invariant(blueprint.campaign_id === 'story.campaign.quiet_cascade.v1', 'CAMPAIGN_ID', 'Expansion must preserve the existing campaign identity.');
  invariant(!JSON.stringify(blueprint).includes('story.match.qc01.shift0'), 'QC01_MATCH_NAMESPACE', 'Expansion Match refs must not use QC01.');

  const episodeIds = blueprint.episodes.map((episode) => episode.episode_id);
  const matchRefs = blueprint.episodes.map((episode) => episode.match_ref);
  const objectives = blueprint.episodes.map((episode) => episode.learning_objective_key);
  const fingerprints = blueprint.episodes.map((episode) => episode.fingerprint_id);
  const cases = blueprint.episodes.map((episode) => episode.case_id);
  for (const [name, values] of Object.entries({ episodeIds, matchRefs, objectives, fingerprints, cases })) {
    invariant(unique(values), 'DISTINCT_EPISODES', `${name} must be distinct.`);
  }
  [...episodeIds, ...matchRefs, ...objectives, ...fingerprints].forEach((id) => assertStableId(id, 'blueprint stable ID'));
  invariant(blueprint.episodes.every((episode) => episode.episode_id === `story.shift.qc02.${String(episode.shift_number).padStart(2, '0')}`), 'EPISODE_NAMESPACE', 'Episode IDs must use story.shift.qc02.07 through .12.');

  const baseAssets = new Set(baseRegistry.assets.map((asset) => asset.asset_id));
  invariant(baseGraph.campaign_id === 'story.campaign.quiet_cascade.v1', 'BASE_GRAPH', 'Unexpected campaign-one graph.');
  invariant(baseAssets.size > 0, 'BASE_REGISTRY', 'Base Story registry is empty.');
  invariant(domainProof.n4_test_repair_boundary?.test_id === 'test.management.event_log_freshness'
    && domainProof.n4_test_repair_boundary?.repair_id === 'repair.management.clear_stale_alert_state'
    && domainProof.n4_test_repair_boundary?.diagnostic_changes_machine_state === false,
  'N4_TEST_REPAIR_BOUNDARY', 'TASK-042 N4 preserve-before-clear boundary is not pinned.');
  invariant(domainProof.n6_test_repair_boundary?.test_id === 'test.management.bmc_recovery_state'
    && domainProof.n6_test_repair_boundary?.repair_id === 'repair.management.recover_bmc_firmware'
    && domainProof.n6_test_repair_boundary?.tftp_is_diagnostic_command === false,
  'N6_TEST_REPAIR_BOUNDARY', 'TASK-042 N6 recovery-state Test/Repair boundary is not pinned.');

  const matchRows = registryMatches(matchRegistry);
  const proofRows = proofMatches(builderProof);
  invariant(matchRows.length === 6, 'MATCH_REGISTRY_COUNT', 'TASK-043 Match registry must contain exactly six rows.');
  invariant(matchRegistry.campaign_id === blueprint.campaign_id, 'MATCH_CAMPAIGN_ID', 'Match registry must preserve the existing campaign identity.');
  invariant(proofRows.length === 6, 'BUILDER_PROOF_COUNT', 'TASK-043 builder proof must contain exactly six rows.');
  invariant(planningAssignments(planningAudit).length === 6, 'PLANNING_ASSIGNMENT_COUNT', 'Planning audit must contain exactly six episode assignments.');
  invariant(planningAssetEpisodes(planningAudit).length === 6, 'PLANNING_ASSET_COUNT', 'Planning audit must contain exactly six asset plans.');

  const joinedEpisodes = blueprint.episodes.map((episode) => {
    const sourceCase = caseRegistry.selected_cases.find((row) => row.case_id === episode.case_id);
    const domainTicket = domainProof.tickets.find((row) => row.case_id === episode.case_id);
    const match = matchRows.find((row) => row.match_ref === episode.match_ref);
    const proof = proofRows.find((row) => row.match_ref === episode.match_ref);
    invariant(sourceCase, 'SOURCE_CASE', `${episode.episode_id}: source case is not selected by TASK-041.`);
    invariant(domainTicket, 'DOMAIN_TICKET', `${episode.episode_id}: TASK-042 domain proof is absent.`);
    invariant(match, 'MATCH_REF', `${episode.episode_id}: Match registry row is absent.`);
    invariant(proof, 'MATCH_PROOF_REF', `${episode.episode_id}: Builder proof row is absent.`);
    invariant(sourceCase.source.url === episode.source_url, 'SOURCE_URL', `${episode.episode_id}: source URL diverges from TASK-041.`);
    invariant(sourceCase.learning_objective_key === episode.learning_objective_key, 'SOURCE_OBJECTIVE', `${episode.episode_id}: objective diverges from TASK-041.`);
    invariant(domainTicket.fingerprint_id === episode.fingerprint_id, 'DOMAIN_FINGERPRINT', `${episode.episode_id}: fingerprint diverges from TASK-042.`);
    invariant(domainTicket.learning_objective_key === episode.learning_objective_key, 'DOMAIN_OBJECTIVE', `${episode.episode_id}: objective diverges from TASK-042.`);
    validateStoryAssets(episode, baseRegistry);
    validatePlanningBinding(episode, match, planningAudit);
    const beatKinds = episode.beats.map((beat) => beat.kind);
    REQUIRED_BEAT_KINDS.forEach((kind) => invariant(beatKinds.includes(kind), 'BEAT_KIND', `${episode.episode_id}: missing ${kind} beat.`));
    invariant(unique(episode.beats.map((beat) => beat.beat_id)), 'BEAT_ID', `${episode.episode_id}: beat IDs must be unique.`);
    invariant(episode.story_service_points.completed_valid_result === 2 && episode.story_service_points.abandoned_valid_result === 0, 'SERVICE_POINTS', `${episode.episode_id}: one-Ticket result consequences must be 2/0.`);
    invariant(episode.story_service_points.preserve_inherited_total && !episode.story_service_points.gate_on_total, 'SERVICE_POINTS', `${episode.episode_id}: inherited points must be preserved without a gate.`);
    const earlyCopy = episode.public_setup.summary.toLowerCase();
    episode.public_setup.forbidden_early_reveal_ids.forEach((id) => invariant(!earlyCopy.includes(id.toLowerCase()), 'HIDDEN_TRUTH_LEAK', `${episode.episode_id}: public setup includes ${id}.`));
    return {
      ...episode,
      branch_inputs: {
        cutscene_choice_ids: blueprint.remembered_choices.filter((choice) => choice.episode_id === episode.episode_id).map((choice) => choice.choice_id),
        authoritative_match_result: {
          schema_version: matchRegistry.normalized_result_contract.schema_version,
          required_validity: true,
          accepted_completion_values: ['COMPLETED', 'ABANDONED'],
          completed_label: episode.labels.success,
          abandoned_label: episode.labels.abandon,
        },
        prohibited_inputs: ['HIDDEN_FAULT', 'UNSELECTED_EVIDENCE', 'CLIENT_COUNTER', 'DIALOGUE_ASSERTION'],
      },
      source_case: {
        source_id: domainTicket.source_id,
        title: sourceCase.source.title,
        publisher: sourceCase.source.publisher,
        url: sourceCase.source.url,
        accessed_on: sourceCase.source.access_date,
        lifecycle_document_present: !sourceCase.absent_lifecycle_categories.includes('Document'),
      },
      gameplay_contract: exactMatchContract(episode, match, proof),
    };
  });

  invariant(joinedEpisodes.every((episode) => episode.gameplay_contract.candidate_structure.hidden_truth_leaks === 0), 'HIDDEN_TRUTH_LEAK', 'Every generated Ticket must have zero public projection leaks.');
  invariant(unique(joinedEpisodes.flatMap((episode) => episode.beats.map((beat) => beat.beat_id))), 'BEAT_ID', 'Beat IDs must be globally unique.');
  const n4 = joinedEpisodes.find((episode) => episode.case_id === 'exp-004');
  invariant(n4.gameplay_contract.gameplay_boundary?.diagnostic_changes_machine_state !== true, 'N4_TEST_REPAIR_BOUNDARY', 'Shift 10 diagnostic may not clear alert state.');
  const n6 = joinedEpisodes.find((episode) => episode.case_id === 'exp-006');
  const n6WitnessSources = n6.gameplay_contract.oracle_witness.filter((step) => step.action === 'RUN_DIAGNOSTIC').map((step) => step.source_definition_id);
  invariant(n6WitnessSources.includes('test.management.bmc_recovery_state'), 'N6_TEST_REPAIR_BOUNDARY', 'Shift 12 must inspect recovery state as Test evidence.');
  invariant(!n6WitnessSources.some((id) => /tftp/i.test(id)), 'N6_TEST_REPAIR_BOUNDARY', 'TFTP/recovery transport may not be a diagnostic Command in Shift 12.');

  const graph = graphForBlueprint(blueprint);
  validateGraph(graph, blueprint);
  const routes = enumerateExpansionRoutes(blueprint);
  const routeSummary = summarizeRoutes(blueprint, routes);
  invariant(routes.length === 256 && routeSummary.deterministic_digest_count === 256, 'ROUTE_COUNT', 'Two binary choices and six binary outcomes must produce 256 unique deterministic routes.');
  invariant(Object.values(routeSummary.choice_coverage).every((row) => Object.values(row).every((count) => count === 128)), 'CHOICE_COVERAGE', 'Every choice option must occur in 128 routes.');
  invariant(Object.values(routeSummary.match_outcome_coverage).every((row) => row.COMPLETED === 128 && row.ABANDONED === 128), 'MATCH_OUTCOME_COVERAGE', 'Every Match outcome must occur in 128 routes.');
  invariant(routeSummary.ending_coverage[blueprint.ending.ending_id] === 256, 'ENDING_COVERAGE', 'All routes must reach the one current-content ending.');

  return {
    report_version: EXPANSION_GRAPH_REPORT_VERSION,
    blueprint_id: blueprint.blueprint_id,
    status: blueprint.status,
    input_sha256: sortedObject(inputHashes),
    baseline: {
      campaign_id: baseGraph.campaign_id,
      inherited_service_points: 'PRESERVE_EXACTLY',
      live_pack_mutated: false,
    },
    totals: {
      episodes: joinedEpisodes.length,
      matches: graph.nodes.filter((node) => node.kind === 'MATCH').length,
      tickets: joinedEpisodes.reduce((sum, episode) => sum + episode.gameplay_contract.requested_ticket_count, 0),
      remembered_choices: blueprint.remembered_choices.length,
      nodes: graph.nodes.length,
      edges: graph.edges.length,
      checkpoints: graph.checkpoints.length,
      pre_match_checkpoints: graph.checkpoints.filter((row) => row.kind === 'PRE_MATCH').length,
      post_match_checkpoints: graph.checkpoints.filter((row) => row.kind === 'POST_MATCH').length,
      endings: 1,
      routes: routes.length,
      new_master_assets: 0,
      transient_assets: 0,
    },
    authority_boundaries: {
      dialogue_can_manufacture_gameplay_authority: false,
      hidden_truth_leaks: 0,
      active_match_resume: false,
      replay_mutates_canonical_progress: false,
      cumulative_story_service_point_gate: false,
      prior_story_service_points: 'PRESERVE_EXACTLY',
      match_result_source: 'AUTHORITATIVE_NORMALIZED_TERMINAL_RESULT_ONLY',
    },
    remembered_choices: blueprint.remembered_choices,
    graph,
    episodes: joinedEpisodes,
    route_summary: routeSummary,
    routes,
  };
}

function cell(value) {
  return String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', '<br>');
}

export function renderRouteEndingMatrix(report) {
  const lines = [
    '# Quiet Cascade expansion route and ending matrix',
    '',
    `Status: **${report.status.replaceAll('_', ' ')}**`,
    '',
    'This is an exhaustive topology proof, not final dialogue or a live Story pack. Two remembered presentation choices and six accepted binary Match outcomes yield 256 routes. Every route reaches the same honest current-content ending; no cumulative Story Service Point gate changes access.',
    '',
    '## Coverage summary',
    '',
    `- Routes: **${report.route_summary.route_count}** (${report.route_summary.deterministic_digest_count} unique digests).`,
    `- Ending: \`${Object.keys(report.route_summary.ending_coverage)[0]}\` on all ${report.route_summary.route_count} routes.`,
    '- Interruption: restore the durable pre-Match checkpoint and freshly launch the same configured Match; active engine state is never resumed.',
    '- Replay: completed episodes use STORY-009 A isolated review; canonical checkpoints, choices, results, points, ending, and Profile statistics do not change.',
    '',
    '### Choice coverage',
    '',
    '| Choice | Option | Routes |',
    '| --- | --- | ---: |',
  ];
  for (const [choiceId, options] of Object.entries(report.route_summary.choice_coverage)) {
    for (const [optionId, count] of Object.entries(options)) lines.push(`| \`${choiceId}\` | \`${optionId}\` | ${count} |`);
  }
  lines.push('', '### Match-outcome coverage', '', '| Match | Completed | Abandoned |', '| --- | ---: | ---: |');
  for (const [matchRef, outcomes] of Object.entries(report.route_summary.match_outcome_coverage)) lines.push(`| \`${matchRef}\` | ${outcomes.COMPLETED} | ${outcomes.ABANDONED} |`);
  lines.push('', '### Story Service Point gain distribution', '', '| Expansion gain | Routes | Canonical total |', '| ---: | ---: | --- |');
  for (const [points, count] of Object.entries(report.route_summary.service_point_gain_distribution)) lines.push(`| ${points} | ${count} | inherited campaign-one total + ${points} |`);
  lines.push('', '## Exhaustive routes', '', '| Route | Initial frame | Outcomes 07–12 | Change frame | Expansion points | Ending | Digest |', '| --- | --- | --- | --- | ---: | --- | --- |');
  const [firstChoice, secondChoice] = Object.keys(report.route_summary.choice_coverage);
  for (const route of report.routes) {
    const outcomes = report.episodes.map((episode) => route.match_outcomes[episode.match_ref] === 'COMPLETED' ? 'C' : 'A').join('');
    lines.push(`| \`${route.route_id}\` | \`${route.choices[firstChoice]}\` | \`${outcomes}\` | \`${route.choices[secondChoice]}\` | ${route.expansion_story_service_points_gained} | \`${route.ending_id}\` | \`${route.digest}\` |`);
  }
  return `${lines.join('\n')}\n`;
}

export function renderBeatSheets(report) {
  const lines = [
    '# Quiet Cascade expansion beat sheets',
    '',
    `Status: **${report.status.replaceAll('_', ' ')}**`,
    '',
    'These are non-live structural beat summaries. They deliberately contain no final dialogue. Gameplay facts below are joined from the pinned Match registry and Builder/oracle proof, not invented by Story copy.',
  ];
  for (const episode of report.episodes) {
    const game = episode.gameplay_contract;
    lines.push(
      '',
      `## Shift ${episode.shift_number}: ${episode.title}`,
      '',
      `- Episode / Match: \`${episode.episode_id}\` / \`${episode.match_ref}\``,
      `- Source: ${episode.source_case.title} (${episode.source_case.publisher}), [opened ${episode.source_case.accessed_on}](${episode.source_case.url})`,
      `- Objective: \`${episode.learning_objective_key}\` — ${episode.learning_objective}`,
      `- Ticket: \`${game.hidden_ticket_composition.ticket_definition_id}\` / \`${game.hidden_ticket_composition.ticket_snapshot_digest}\``,
      `- Fingerprint: \`${game.hidden_ticket_composition.fingerprint_id}\``,
      `- Public Candidates: ${game.candidate_structure.public_candidate_fault_ids.map((id) => `\`${id}\``).join(', ')}`,
      `- Hidden true Fault(s), author/proof only: ${game.hidden_ticket_composition.true_fault_ids.map((id) => `\`${id}\``).join(', ')}`,
      `- Legal diagnostics (${game.diagnostics.legal_ids.length}): ${game.diagnostics.legal_ids.map((id) => `\`${id}\``).join(', ')}`,
      `- Relevant diagnostics (${game.diagnostics.relevant_ids.length}): ${game.diagnostics.relevant_ids.map((id) => `\`${id}\``).join(', ')}`,
      `- Required diagnostics (${game.diagnostics.required_ids.length}): ${game.diagnostics.required_ids.map((id) => `\`${id}\``).join(', ')}`,
      `- Optional diagnostics (${game.diagnostics.optional_ids.length}): ${game.diagnostics.optional_ids.map((id) => `\`${id}\``).join(', ')}`,
      `- Repair: ${(game.response_path.repair_procedure_ids ?? []).map((id) => `\`${id}\``).join(', ')}`,
      `- Verify: ${(game.response_path.validation_procedure_ids ?? []).map((id) => `\`${id}\``).join(', ')}`,
      `- Response counts: ${Object.entries(game.required_response_card_counts).map(([id, count]) => `\`${id}\` × ${count}`).join('; ')}`,
      `- Deck pressure: \`${game.deck_pressure.deck_id}\`, ${game.deck_pressure.deck_size} Cards; Repair headroom ${game.deck_pressure.repair.headroom_copies}; Verify headroom ${game.deck_pressure.verify.headroom_copies}; feasible **${game.deck_pressure.feasible ? 'yes' : 'no'}**.`,
      `- Commands — catalog exposure (${game.command_roles.catalog_exposure_ids.length}): ${game.command_roles.catalog_exposure_ids.map((id) => `\`${id}\``).join(', ')}`,
      `- Commands — useful/relevant Evidence (${game.command_roles.relevant_ids.length}): ${game.command_roles.relevant_ids.length ? game.command_roles.relevant_ids.map((id) => `\`${id}\``).join(', ') : 'none'}`,
      `- Commands — required Isolation (${game.command_roles.minimal_witness_required_ids.length}): ${game.command_roles.minimal_witness_required_ids.length ? game.command_roles.minimal_witness_required_ids.map((id) => `\`${id}\``).join(', ') : 'none'}`,
      `- Seed / requested Tickets: \`${game.seed}\` / ${game.requested_ticket_count}`,
      `- Checkpoints: entry \`${episode.checkpoints.entry}\`; pre-Match \`${episode.checkpoints.pre_match}\`; post-Match \`${episode.checkpoints.post_match}\``,
      `- Result branches: \`${episode.labels.success}\` or \`${episode.labels.abandon}\`, reconverging at \`${episode.labels.follow_on}\``,
      `- Branch inputs: ${episode.branch_inputs.cutscene_choice_ids.length ? episode.branch_inputs.cutscene_choice_ids.map((id) => `\`${id}\``).join(', ') : 'no local cutscene choice'} plus only a valid normalized \`completion\` of \`COMPLETED\` or \`ABANDONED\`; hidden truth and dialogue assertions are excluded.`,
      '- Story Service Points: completed valid result +2; abandoned valid result +0; preserve inherited campaign-one total; no cumulative gate.',
      '- Interruption/replay: fresh launch from pre-Match after interruption; accepted completed episodes are isolated non-canonical review/practice under STORY-009 A.',
      `- Research Document stage: ${episode.source_case.lifecycle_document_present ? 'present in the qualifying source reduction' : 'absent in the qualifying source reduction; Story may not attribute a source-authored handoff that did not occur'}.`,
      '',
      '### Public setup',
      '',
      episode.public_setup.summary,
      '',
      `Match-safe projection: ${game.public_match_setup_summary}`,
      '',
      '### Intentional repeated practice',
      '',
      ...episode.prerequisite_practice.map((entry) => `- ${entry}`),
      '',
      '### Ordered beats',
      '',
      '| Kind | Beat ID | Structural intent |',
      '| --- | --- | --- |',
      ...episode.beats.map((beat) => `| ${beat.kind} | \`${beat.beat_id}\` | ${cell(beat.summary)} |`),
      '',
      '### Art reuse',
      '',
      `- Backgrounds: ${episode.art.background_asset_ids.map((id) => `\`${id}\``).join(', ')}`,
      `- Character poses: ${episode.art.character_pose_ids.map((id) => `\`${id}\``).join(', ')}`,
      '- Transient inserts/new masters: none.',
    );
  }
  return `${lines.join('\n').trimEnd()}\n`;
}
