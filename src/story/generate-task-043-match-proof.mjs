import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  TASK_014_RULESET_VERSION,
  TASK_042_BUILDER_VERSION,
  TASK_042_CARD_CATALOG_VERSION,
  TASK_042_CONFIGURATION_VERSION,
  TASK_042_DECK_CATALOG_VERSION,
  TASK_042_DOMAIN_CONTENT_VERSION,
  TASK_042_RESPONSE_DECK_ID,
  TASK_042_TICKET_CONTENT_VERSION,
  buildTicketsV4,
  validateTask014OutcomeCoverage,
} from '../builder/task-014.mjs';
import { validateTicketSolvability } from '../builder/ticket-solvability.mjs';
import {
  STORY_CHECKPOINT_VERSION,
  STORY_MATCH_CONTEXT_VERSION,
} from './constants.mjs';
import { storyDigest } from './checkpoint.mjs';
import { normalizeStoryMatchResult } from './match-boundary.mjs';
import { stableJson, verifyCampaignArtifacts, writeCampaignArtifacts } from '../simulation/artifacts.mjs';
import { executeCampaign } from '../simulation/campaign.mjs';
import {
  AUTOMATED_HARNESS_VERSION,
  loadTask042Catalogs,
  runAutomatedMatch,
} from '../simulation/simulator.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const TASK_043_OUTPUT_ROOT = path.join(ROOT, 'automated_games/task-043-quiet-cascade-expansion-v3');
export const TASK_043_MATCH_REGISTRY_VERSION = 'story-match-configuration-v1';
export const TASK_043_PROOF_VERSION = 'task-043-match-proof-v1';
export const TASK_043_CAMPAIGN_ID = 'task-043-quiet-cascade-expansion-v3';
export const TASK_043_STORY_PACK_ID = 'story.campaign.quiet_cascade.v1';
export const TASK_043_STORY_CONTENT_VERSION = 'quiet-cascade-expansion-v3';

export const TASK_043_OUTPUTS = Object.freeze({
  registry: path.join(TASK_043_OUTPUT_ROOT, 'match-registry.json'),
  settings: path.join(TASK_043_OUTPUT_ROOT, 'settings.json'),
  matches: path.join(TASK_043_OUTPUT_ROOT, 'matches.json'),
  summary: path.join(TASK_043_OUTPUT_ROOT, 'summary.json'),
  summaryMarkdown: path.join(TASK_043_OUTPUT_ROOT, 'summary.md'),
  builderProof: path.join(TASK_043_OUTPUT_ROOT, 'builder-proof.json'),
  checkpointProof: path.join(TASK_043_OUTPUT_ROOT, 'checkpoint-proof.json'),
});

const MATCH_SPECS = Object.freeze([
  Object.freeze({
    caseId: 'exp-001',
    shiftNumber: 7,
    shortName: 'socket_contacts',
    fingerprintId: 'fingerprint.compute.damaged_cpu_socket_contacts',
    seed: 'story.quiet_cascade.expansion.s07.v1',
    difficulty: 4,
    repairCardId: 'card.response.repair.compute.restore_socket_contacts',
    verifyCardId: 'card.response.verify.compute.socket_path',
    publicSetup: 'Known-good processors work in other pairings, but configurations that depend on one CPU socket do not boot.',
    prerequisitePractice: ['test.memory.known_good_substitution', 'test.memory.single_dimm_isolation'],
    repeatedPractice: ['LOCALIZE_BEFORE_REPLACE', 'ISOLATION_REQUIRES_CITED_EVIDENCE'],
  }),
  Object.freeze({
    caseId: 'exp-002',
    shiftNumber: 8,
    shortName: 'power_distribution',
    fingerprintId: 'fingerprint.power.failed_distribution_board',
    seed: 'story.quiet_cascade.expansion.s08.v1',
    difficulty: 4,
    repairCardId: 'card.response.repair.power.replace_distribution_board',
    verifyCardId: 'card.response.verify.power.distribution_path',
    publicSetup: 'The server reports a voltage error and shuts down immediately even after component reduction and supply/bay comparison.',
    prerequisitePractice: ['test.power.known_good_psu', 'test.general.minimum_configuration'],
    repeatedPractice: ['DISTINGUISH_SOURCE_FROM_DISTRIBUTION', 'REPAIR_DOES_NOT_PROVE_DIAGNOSIS'],
  }),
  Object.freeze({
    caseId: 'exp-003',
    shiftNumber: 9,
    shortName: 'predictive_drive',
    fingerprintId: 'fingerprint.storage.predictive_drive_failure',
    seed: 'story.quiet_cascade.expansion.s09.v1',
    difficulty: 3,
    repairCardId: 'card.response.repair.storage.replace_predictive_drive',
    verifyCardId: 'card.response.verify.storage.predictive_replacement',
    publicSetup: 'A drive reports predictive health warnings and a mixed amber/green bay indication while the array remains available.',
    prerequisitePractice: ['test.storage.drive_health', 'test.storage.raid_status'],
    repeatedPractice: ['PROTECT_DATA_BEFORE_REPAIR', 'VERIFY_REBUILD_COMPLETION'],
  }),
  Object.freeze({
    caseId: 'exp-004',
    shiftNumber: 10,
    shortName: 'stale_alert',
    fingerprintId: 'fingerprint.management.stale_alert',
    seed: 'story.quiet_cascade.expansion.s10.v1',
    difficulty: 3,
    repairCardId: 'card.response.repair.management.clear_stale_alert_state',
    verifyCardId: 'card.response.verify.management.alert_does_not_recur',
    publicSetup: 'Healthy drive and backplane evidence conflicts with a persistent degraded management alert.',
    prerequisitePractice: ['test.system.bmc_logs', 'test.storage.raid_status'],
    repeatedPractice: ['OBSERVE_BEFORE_MUTATION', 'FAILED_VERIFY_REOPENS_DIAGNOSIS'],
  }),
  Object.freeze({
    caseId: 'exp-005',
    shiftNumber: 11,
    shortName: 'firmware_regression',
    fingerprintId: 'fingerprint.firmware.incompatible_version_set',
    seed: 'story.quiet_cascade.expansion.s11.v1',
    difficulty: 5,
    repairCardId: 'card.response.repair.firmware.restore_compatible_versions',
    verifyCardId: 'card.response.verify.firmware.compatible_persistent',
    publicSetup: 'Network link flaps began after a management firmware change even though swapped hardware and cabling remain healthy.',
    prerequisitePractice: ['test.network.cable_substitution', 'test.network.link_counter_soak'],
    repeatedPractice: ['COMPARE_VERSION_A_B', 'ELIMINATE_HARDWARE_WITH_EVIDENCE'],
  }),
  Object.freeze({
    caseId: 'exp-006',
    shiftNumber: 12,
    shortName: 'bmc_recovery',
    fingerprintId: 'fingerprint.management.corrupt_bmc_firmware',
    seed: 'story.quiet_cascade.expansion.s12.v1',
    difficulty: 6,
    repairCardId: 'card.response.repair.management.recover_bmc_firmware',
    verifyCardId: 'card.response.verify.management.bmc_functional',
    publicSetup: 'A failed controller firmware update leaves the management controller unavailable while the board requires a bounded recovery decision.',
    prerequisitePractice: ['test.management.bmc_recovery_state', 'test.firmware.version_compatibility'],
    repeatedPractice: ['USE_ONLY_APPROVED_PLATFORM_RECOVERY', 'VERIFY_SEPARATELY_FROM_FLASH'],
  }),
]);

// Frozen after an independent Builder discovery so later content drift fails closed.
export const TASK_043_EXPECTED_TICKET_PINS = Object.freeze({
  'story.match.qc02.shift07.socket_contacts': Object.freeze({ ticket_id: 'ticket.generated.4f237a22c35d46166044b2c7', digest: 'dc4e0581e510fd94120fcca53ee8b25f5a8d3b456253627c7faf5603c5d8e481' }),
  'story.match.qc02.shift08.power_distribution': Object.freeze({ ticket_id: 'ticket.generated.3fd6eb04534f79b5b3f87f98', digest: 'd34f08d79c2cc2d47d16d23ec753f1e78758d0b358664d4e592ea23f25b63d73' }),
  'story.match.qc02.shift09.predictive_drive': Object.freeze({ ticket_id: 'ticket.generated.36ba2ae8958431194a7e1fef', digest: 'c71d7e7f87b7e1177f7f8b79344293dee489778c9acfc9ba213d9cb7410aa671' }),
  'story.match.qc02.shift10.stale_alert': Object.freeze({ ticket_id: 'ticket.generated.b68505324c44f11977fcda07', digest: 'c889bd1e907f1537e8080822e7d9ded3821e0507fe8bc20f49490ae81f01f0e8' }),
  'story.match.qc02.shift11.firmware_regression': Object.freeze({ ticket_id: 'ticket.generated.b34238282822e93980b5f1ad', digest: 'face80b0d5c6f6c7f1ef3bb0495c0c6e4105360fa07887fb50cc2dea440cbc50' }),
  'story.match.qc02.shift12.bmc_recovery': Object.freeze({ ticket_id: 'ticket.generated.f32b85cbf2054fdf0114f42a', digest: '761016e56ceb47a585727555f64bac47b103933cddbafc27a5c385f402851b01' }),
});

const compare = (left, right) => left.localeCompare(right);
const sorted = (values) => [...values].sort(compare);
const bounds = (minimum, maximum) => ({ minimum, maximum });

function invariant(condition, code, detail) {
  if (!condition) {
    const error = new Error(`${code}: ${detail}`);
    error.code = code;
    throw error;
  }
}

function countIds(ids) {
  const counts = {};
  for (const id of ids) counts[id] = (counts[id] ?? 0) + 1;
  return counts;
}

function matchRef(spec) {
  return `story.match.qc02.shift${String(spec.shiftNumber).padStart(2, '0')}.${spec.shortName}`;
}

function shiftId(spec) {
  return `story.shift.qc02.${String(spec.shiftNumber).padStart(2, '0')}`;
}

function storyPrefix(spec) {
  return `story.qc02.shift${String(spec.shiftNumber).padStart(2, '0')}`;
}

function checkpointPrefix(spec) {
  return `checkpoint.qc02.shift${String(spec.shiftNumber).padStart(2, '0')}`;
}

function domainIdForCard(card) {
  return card.play_contract?.source_definition_id
    ?? card.play_contract?.repair_procedure_id
    ?? card.play_contract?.validation_procedure_id
    ?? card.primary_domain_reference?.entity_id
    ?? null;
}

function responseDeck(catalogs) {
  const deck = catalogs.decks.decks.find((entry) => entry.id === TASK_042_RESPONSE_DECK_ID);
  invariant(deck, 'DECK_MISSING', `Missing ${TASK_042_RESPONSE_DECK_ID}.`);
  invariant(deck.card_definition_ids.length === 30, 'DECK_SIZE', `${deck.id} must contain exactly 30 Cards.`);
  return deck;
}

function benchCardIds(catalogs) {
  const ids = catalogs.cards.cards
    .filter((card) => card.play_contract?.contract_type === 'DIAGNOSTIC')
    .map((card) => card.id)
    .sort(compare);
  invariant(ids.length === 50, 'BENCH_SIZE', `Expected 50 diagnostic Bench Cards; received ${ids.length}.`);
  return ids;
}

function createBuilderConfiguration({ spec, catalogs, benchIds, deck }) {
  const available = countIds(deck.card_definition_ids);
  return {
    id: `builder.story.quiet_cascade.expansion.s${String(spec.shiftNumber).padStart(2, '0')}`,
    entity_type: 'ticket_builder_configuration',
    configuration_version: TASK_042_CONFIGURATION_VERSION,
    scenario_or_mode_context: 'CAMPAIGN',
    requested_ticket_count: 1,
    seed: spec.seed,
    generator_version: TASK_042_BUILDER_VERSION,
    content_version: TASK_042_TICKET_CONTENT_VERSION,
    domain_content_version: TASK_042_DOMAIN_CONTENT_VERSION,
    card_catalog_version: TASK_042_CARD_CATALOG_VERSION,
    allowed_domain_ids: [],
    excluded_domain_ids: [],
    allowed_tags: [],
    excluded_tags: [],
    guaranteed_categories: [],
    required_teaching_beats: [],
    authored_difficulty_bounds: bounds(1, 6),
    fault_count_bounds: bounds(1, 3),
    required_actionable_fault_count_bounds: bounds(1, 2),
    causal_depth_bounds: bounds(0, 1),
    inbound_branching_bounds: bounds(0, 2),
    outbound_branching_bounds: bounds(0, 2),
    progressive_difficulty_profile: {
      profile_id: 'progressive.story.quiet_cascade.expansion',
      profile_version: 'quiet-cascade-expansion-v3',
      explicit_ceiling: 6,
      bands: [{
        start_generated_index: 0,
        end_generated_index: 0,
        target: spec.difficulty,
        minimum: 1,
        maximum: 6,
      }],
    },
    generation_index_start: 0,
    allow_duplicate_causal_fingerprints: false,
    active_causal_fingerprints: [],
    allowed_fingerprint_ids: [spec.fingerprintId],
    legal_card_definition_ids: sorted(new Set([...benchIds, ...Object.keys(available)])),
    diagnostic_card_definition_ids: [...benchIds],
    available_card_definition_counts: available,
    fallback_configuration_id: null,
  };
}

function selectedBuild(result, spec) {
  invariant(result.status === 'SUCCESS', 'BUILDER_FAILURE', `${matchRef(spec)} failed: ${JSON.stringify(result.attempts?.[0]?.diagnostics ?? [])}`);
  const attempt = result.attempts.find((entry) => entry.attempt_id === result.selected_attempt_id);
  invariant(attempt?.ticket_snapshots?.length === 1, 'BUILDER_COUNT', `${matchRef(spec)} did not build exactly one Ticket.`);
  return { result, attempt, ticket: attempt.ticket_snapshots[0], digest: attempt.ticket_snapshot_digests[0] };
}

function sourceDefinitionIdsFromRoute(ticket) {
  const outcomes = new Map(ticket.authored_evidence_outcomes.map((outcome) => [outcome.outcome_id, outcome]));
  return new Set(ticket.isolation_requirements.flatMap((requirement) =>
    requirement.routes.flatMap((route) => route.eligible_outcome_ids.map((id) => outcomes.get(id)?.source_definition_id).filter(Boolean))));
}

function diagnosticClassification({ ticket, witness, catalogs, benchIds }) {
  const cardsByDomainId = new Map(catalogs.cards.cards.map((card) => [domainIdForCard(card), card.id]));
  const initialOutcomes = ticket.authored_evidence_outcomes.filter((outcome) =>
    outcome.eligible_machine_state_key === ticket.server_only_truth.initial_machine_state_key);
  const routeSources = sourceDefinitionIdsFromRoute(ticket);
  const relevantSources = new Set(initialOutcomes
    .filter((outcome) => outcome.candidate_effects.length > 0 || routeSources.has(outcome.source_definition_id))
    .map((outcome) => outcome.source_definition_id));
  const requiredSources = new Set(witness
    .filter((step) => step.action === 'RUN_DIAGNOSTIC')
    .map((step) => step.source_definition_id));
  for (const id of requiredSources) relevantSources.add(id);
  const sourceForBench = new Map(benchIds.map((cardId) => {
    const card = catalogs.cards.cards.find((candidate) => candidate.id === cardId);
    return [cardId, domainIdForCard(card)];
  }));
  const relevantCards = benchIds.filter((id) => relevantSources.has(sourceForBench.get(id)));
  const requiredCards = benchIds.filter((id) => requiredSources.has(sourceForBench.get(id)));
  const optionalCards = relevantCards.filter((id) => !requiredCards.includes(id));
  const nonRelevantCards = benchIds.filter((id) => !relevantCards.includes(id));
  const entityById = new Map(catalogs.domain.entities.map((entity) => [entity.id, entity]));
  const commandIds = (ids) => sorted(new Set(ids.filter((id) => entityById.get(id)?.entity_type === 'command')));
  return {
    legal: { card_definition_ids: [...benchIds], source_definition_ids: sorted(new Set(sourceForBench.values())) },
    relevant: { card_definition_ids: relevantCards, source_definition_ids: sorted(relevantSources) },
    required: { card_definition_ids: requiredCards, source_definition_ids: sorted(requiredSources) },
    optional_relevant: { card_definition_ids: optionalCards, source_definition_ids: sorted(relevantSources).filter((id) => !requiredSources.has(id)) },
    legal_not_relevant: { card_definition_ids: nonRelevantCards, source_definition_ids: sorted(new Set(nonRelevantCards.map((id) => sourceForBench.get(id)))) },
    commands: {
      catalog_exposure_ids: commandIds([...sourceForBench.values()]),
      relevant_ids: commandIds([...relevantSources]),
      minimal_witness_required_ids: commandIds([...requiredSources]),
    },
    complete_initial_state_outcomes: initialOutcomes.length,
    card_id_for_source_definition: Object.fromEntries(sorted(relevantSources).map((id) => [id, cardsByDomainId.get(id)])),
  };
}

function responsePath({ spec, ticket, catalogs, witness }) {
  const cardById = new Map(catalogs.cards.cards.map((card) => [card.id, card]));
  const repairCard = cardById.get(spec.repairCardId);
  const verifyCard = cardById.get(spec.verifyCardId);
  invariant(repairCard?.play_contract?.contract_type === 'REPAIR', 'RESPONSE_PATH', `${spec.repairCardId} is not a Repair Card.`);
  invariant(verifyCard?.play_contract?.contract_type === 'VERIFY', 'RESPONSE_PATH', `${spec.verifyCardId} is not a Verify Card.`);
  const repairProcedureIds = sorted(new Set(ticket.repair_requirements.flatMap((entry) => entry.eligible_repair_procedure_ids)));
  const validationProcedureIds = sorted(new Set(ticket.verification_requirements.map((entry) => entry.validation_procedure_id)));
  invariant(repairProcedureIds.includes(domainIdForCard(repairCard)), 'RESPONSE_PATH', `${spec.repairCardId} does not satisfy the Ticket Repair requirement.`);
  invariant(validationProcedureIds.includes(domainIdForCard(verifyCard)), 'RESPONSE_PATH', `${spec.verifyCardId} does not satisfy the Ticket Verify requirement.`);
  return {
    repair: { card_definition_id: spec.repairCardId, repair_procedure_id: domainIdForCard(repairCard), required_copies: 1 },
    verify: { card_definition_id: spec.verifyCardId, validation_procedure_id: domainIdForCard(verifyCard), required_copies: 1 },
    document: { action_type: 'PUBLISH_CLOSURE', required_card_copies: 0, effect: 'LOCK_WORKLOG_AND_ARCHIVE_TICKET' },
    oracle_witness: structuredClone(witness),
  };
}

function deckPressure({ spec, deck }) {
  const available = countIds(deck.card_definition_ids);
  invariant(available[spec.repairCardId] === 3, 'DECK_PRESSURE', `${spec.repairCardId} must have three copies.`);
  invariant(available[spec.verifyCardId] === 2, 'DECK_PRESSURE', `${spec.verifyCardId} must have two copies.`);
  return {
    deck_id: deck.id,
    deck_size: deck.card_definition_ids.length,
    repair: { card_definition_id: spec.repairCardId, available_copies: 3, required_copies: 1, headroom_copies: 2 },
    verify: { card_definition_id: spec.verifyCardId, available_copies: 2, required_copies: 1, headroom_copies: 1 },
    exact_response_requirement_count: 2,
    feasible: true,
  };
}

function createSettingGroup({ spec, configuration }) {
  return {
    setting_group_id: `story-qc02-shift-${String(spec.shiftNumber).padStart(2, '0')}`,
    description: `Real Builder and engine solvability proof for ${matchRef(spec)}.`,
    fixture_kind: 'ORDINARY',
    collaboration_mode: 'cooperative',
    seats: [{
      player_id: 'player_a',
      controller_type: 'computer',
      policy_id: 'coverage-seat-safe-v3',
      deck_id: TASK_042_RESPONSE_DECK_ID,
      starting_service_points: 0,
    }],
    legal_card_pool_ids: [TASK_042_RESPONSE_DECK_ID],
    ticket_source: { source_type: 'generated', builder_configuration: structuredClone(configuration) },
    match_configuration: {
      starting_ticket_count: 1,
      queue_minimum: 0,
      termination_score: -1,
      starting_search_tokens: 3,
      ticket_search_tokens: 1,
      max_search_tokens: 5,
      starting_refresh_tokens: 1,
      max_refresh_tokens: 1,
      actions_per_turn: 2,
      player_count: 1,
      player_time_limit_seconds: null,
      turn_time_limit_seconds: null,
    },
    caps: { turns: 220, closures: 1, policy_stall_consecutive_passes: null },
    virtual_clock: { epoch: '2042-01-01T00:00:00.000Z', seconds_per_decision: 5 },
    seeds: [spec.seed],
  };
}

function createCampaignSettings(rows) {
  return {
    campaign_id: TASK_043_CAMPAIGN_ID,
    harness_version: AUTOMATED_HARNESS_VERSION,
    version_pins: {
      ruleset_version: TASK_014_RULESET_VERSION,
      card_catalog_version: TASK_042_CARD_CATALOG_VERSION,
      deck_catalog_version: TASK_042_DECK_CATALOG_VERSION,
      domain_content_version: TASK_042_DOMAIN_CONTENT_VERSION,
      ticket_content_version: TASK_042_TICKET_CONTENT_VERSION,
      generator_version: TASK_042_BUILDER_VERSION,
      harness_version: AUTOMATED_HARNESS_VERSION,
      policy_versions: ['coverage-seat-safe-v3'],
    },
    setting_groups: rows.map((row) => createSettingGroup(row)),
  };
}

function engineContributions(match) {
  invariant(match.contribution_counts.length === 1, 'ENGINE_PROOF', `${match.match_id} must retain one attributable Player row.`);
  return match.contribution_counts[0];
}

function engineStoryResult({ match, spec }) {
  const contributions = engineContributions(match);
  const team = match.team_service_points.find((row) => row.team_id === 'team.cooperative');
  invariant(team && team.net >= 0, 'ENGINE_PROOF', `${match.match_id} lacks a non-negative cooperative score.`);
  return normalizeStoryMatchResult({
    result_id: `result.qc02.shift${String(spec.shiftNumber).padStart(2, '0')}.engine_proof`,
    match_id: match.match_id,
    valid: match.outcome.valid,
    reason_codes: match.terminal_reason_codes,
    service_points_gained: team.net,
    tickets_closed: match.tickets_closed,
    tickets_given_up: match.tickets_quarantined,
    tests_run: contributions.tests,
    isolations_accepted: contributions.isolations,
    repairs_performed: contributions.repairs,
    verify_passes: contributions.verifies,
    documentation_actions: Math.max(contributions.documentation, contributions.closures),
  }, { expectedMatchRef: matchRef(spec) });
}

function abandonedStoryResult(spec) {
  return normalizeStoryMatchResult({
    result_id: `result.qc02.shift${String(spec.shiftNumber).padStart(2, '0')}.abandoned_proof`,
    match_id: `match.qc02.shift${String(spec.shiftNumber).padStart(2, '0')}.abandoned_proof`,
    valid: true,
    reason_codes: ['GIVE_UP'],
    service_points_gained: 0,
    tickets_closed: 0,
    tickets_given_up: 1,
    tests_run: 0,
    isolations_accepted: 0,
    repairs_performed: 0,
    verify_passes: 0,
    documentation_actions: 0,
  }, { expectedMatchRef: matchRef(spec) });
}

function checkpoint(body) {
  return { ...body, digest: storyDigest(body) };
}

function checkpointRows(rows, matches) {
  const matchByGroup = new Map(matches.map((match) => [match.setting_group_id, match]));
  return rows.map(({ spec }) => {
    const match = matchByGroup.get(`story-qc02-shift-${String(spec.shiftNumber).padStart(2, '0')}`);
    invariant(match, 'ENGINE_PROOF', `${matchRef(spec)} has no engine result.`);
    const completed = engineStoryResult({ match, spec });
    const abandoned = abandonedStoryResult(spec);
    const pending = {
      schema_version: STORY_MATCH_CONTEXT_VERSION,
      match_ref: matchRef(spec),
      return_label: `${storyPrefix(spec)}.return`,
      pre_match_checkpoint_id: `${checkpointPrefix(spec)}.pre_match`,
      post_match_checkpoint_id: `${checkpointPrefix(spec)}.post_match`,
    };
    const base = {
      schema_version: STORY_CHECKPOINT_VERSION,
      pack_id: TASK_043_STORY_PACK_ID,
      content_version: TASK_043_STORY_CONTENT_VERSION,
      variables: {},
      choices: {},
      story_service_points: 0,
      branch_history: [],
    };
    const preBody = {
      ...base,
      checkpoint_id: pending.pre_match_checkpoint_id,
      match_results: [],
      pending_match: pending,
      returned_match: null,
    };
    const post = (result) => {
      const body = {
        ...base,
        checkpoint_id: pending.post_match_checkpoint_id,
        story_service_points: result.story_service_points_gained,
        match_results: [result],
        pending_match: null,
        returned_match: {
          schema_version: STORY_MATCH_CONTEXT_VERSION,
          match_ref: result.match_ref,
          result_id: result.result_id,
          match_id: result.match_id,
        },
      };
      return checkpoint(body);
    };
    return {
      match_ref: matchRef(spec),
      entry_label: `${storyPrefix(spec)}.entry`,
      launch_label: `${storyPrefix(spec)}.match`,
      return_label: pending.return_label,
      completed_label: `${storyPrefix(spec)}.success`,
      abandoned_label: `${storyPrefix(spec)}.abandon`,
      pre_match_checkpoint_id: pending.pre_match_checkpoint_id,
      post_match_checkpoint_id: pending.post_match_checkpoint_id,
      persistence_order: ['CREATE_PRE_MATCH_CHECKPOINT', 'EMIT_START_MATCH', 'ACCEPT_MATCH_RESULT', 'CREATE_POST_MATCH_CHECKPOINT', 'CONTINUE_AT_RETURN_LABEL'],
      interruption_behavior: 'RESTORE_PRE_MATCH_CHECKPOINT_AND_RELAUNCH_FRESH_MATCH',
      active_match_resumption_supported: false,
      isolated_schema_examples: {
        pre_match: checkpoint(preBody),
        post_completed: post(completed),
        post_abandoned: post(abandoned),
      },
    };
  });
}

function createRegistry(rows, campaignMatches) {
  const matchByGroup = new Map(campaignMatches.map((match) => [match.setting_group_id, match]));
  return {
    match_configuration_version: TASK_043_MATCH_REGISTRY_VERSION,
    campaign_id: TASK_043_STORY_PACK_ID,
    content_version: TASK_043_STORY_CONTENT_VERSION,
    status: 'CANDIDATE_NON_LIVE',
    live_loader_eligible: false,
    builder_profile: {
      generator_version: TASK_042_BUILDER_VERSION,
      configuration_version: TASK_042_CONFIGURATION_VERSION,
      ticket_content_version: TASK_042_TICKET_CONTENT_VERSION,
      domain_content_version: TASK_042_DOMAIN_CONTENT_VERSION,
      card_catalog_version: TASK_042_CARD_CATALOG_VERSION,
      requested_ticket_count_per_match: 1,
      diagnostic_bench_card_count: 50,
      minimal_required_command_ids: [],
    },
    match_profile: {
      collaboration_mode: 'cooperative',
      execution_mode: 'offline',
      player_count: 1,
      actions_per_turn: 2,
      starting_ticket_count: 1,
      ticket_queue_minimum: 0,
      starting_search_tokens: 3,
      max_search_tokens: 5,
      starting_refresh_tokens: 1,
      max_refresh_tokens: 1,
      turn_cap: 220,
      closure_cap: 1,
    },
    deck_policy: {
      exact_deck_id: TASK_042_RESPONSE_DECK_ID,
      exact_deck_size: 30,
      repair_copies_per_new_response: 3,
      verify_copies_per_new_response: 2,
      shuffle_source: 'MATCH_SEED',
      diagnostic_source: 'GLOBAL_BENCH',
      diagnostic_bench_card_count: 50,
    },
    normalized_result_contract: {
      schema_version: 'story-match-result-v1',
      completed_branch_value: 'COMPLETED',
      abandoned_branch_value: 'ABANDONED',
      invalid_results_are_not_accepted: true,
    },
    matches: rows.map(({ spec, configuration, built, deckPressure: pressure }) => {
      const engineMatch = matchByGroup.get(`story-qc02-shift-${String(spec.shiftNumber).padStart(2, '0')}`);
      const completed = engineStoryResult({ match: engineMatch, spec });
      return {
        match_ref: matchRef(spec),
        shift_id: shiftId(spec),
        source_case_id: spec.caseId,
        public_setup_summary: spec.publicSetup,
        learning_objectives: [...built.ticket.educational_objectives],
        prerequisite_practice_source_ids: [...spec.prerequisitePractice],
        repeated_practice_beats: [...spec.repeatedPractice],
        seed: spec.seed,
        requested_ticket_count: 1,
        allowed_fingerprint_ids: [spec.fingerprintId],
        expected_ticket_definition_ids: [built.ticket.id],
        expected_ticket_snapshot_digests: [built.digest],
        builder_configuration: structuredClone(configuration),
        required_response_card_counts: {
          [spec.repairCardId]: 1,
          [spec.verifyCardId]: 1,
        },
        deck_pressure: structuredClone(pressure),
        pre_match_checkpoint_id: `${checkpointPrefix(spec)}.pre_match`,
        post_match_checkpoint_id: `${checkpointPrefix(spec)}.post_match`,
        entry_label: `${storyPrefix(spec)}.entry`,
        launch_label: `${storyPrefix(spec)}.match`,
        return_label: `${storyPrefix(spec)}.return`,
        completed_label: `${storyPrefix(spec)}.success`,
        abandoned_label: `${storyPrefix(spec)}.abandon`,
        interruption_behavior: 'RESTORE_PRE_MATCH_CHECKPOINT_AND_RELAUNCH_FRESH_MATCH',
        service_point_consequences: {
          completed: { source: 'ACCEPTED_ENGINE_RESULT', expected_story_service_points_gained: completed.story_service_points_gained },
          abandoned: { source: 'NORMALIZED_ABANDONED_RESULT', story_service_points_gained: 0 },
        },
      };
    }),
  };
}

function proofRows(rows, campaignMatches) {
  const matchByGroup = new Map(campaignMatches.map((match) => [match.setting_group_id, match]));
  return rows.map(({ spec, configuration, built, solvability, diagnostics, response, deckPressure: pressure }) => {
    const engineMatch = matchByGroup.get(`story-qc02-shift-${String(spec.shiftNumber).padStart(2, '0')}`);
    invariant(engineMatch.classification === 'SUCCEEDED', 'ENGINE_PROOF', `${matchRef(spec)} classified ${engineMatch.classification}.`);
    invariant(engineMatch.determinism.identical, 'ENGINE_PROOF', `${matchRef(spec)} identical-input rerun diverged.`);
    invariant(engineMatch.tickets_closed === 1, 'ENGINE_PROOF', `${matchRef(spec)} did not close exactly one Ticket.`);
    const contributions = engineContributions(engineMatch);
    invariant(contributions.repairs >= 1, 'ENGINE_PROOF', `${matchRef(spec)} must perform its required Repair.`);
    invariant(contributions.verifies >= 1, 'ENGINE_PROOF', `${matchRef(spec)} must perform its required passing Verify.`);
    invariant(contributions.closures === 1, 'ENGINE_PROOF', `${matchRef(spec)} must publish exactly one closure and lock its worklog.`);
    return {
      match_ref: matchRef(spec),
      case_id: spec.caseId,
      fingerprint_id: spec.fingerprintId,
      seed: spec.seed,
      builder_configuration_id: configuration.id,
      ticket_id: built.ticket.id,
      ticket_snapshot_digest: built.digest,
      public_symptom_ids: [...built.ticket.initial_symptom_ids],
      public_candidate_fault_ids: [...built.ticket.public_candidate_fault_ids],
      hidden_true_fault_ids: built.ticket.server_only_truth.fault_instances.map((entry) => entry.fault_id),
      learning_objectives: [...built.ticket.educational_objectives],
      legal_relevant_required_optional_diagnostics: diagnostics,
      response_path: response,
      deck_pressure: pressure,
      builder: {
        status: built.result.status,
        result_id: built.result.id,
        selected_attempt_id: built.result.selected_attempt_id,
        deterministic_repeat_identical: true,
        outcome_coverage_valid: true,
        solvability_valid: solvability.valid,
      },
      engine: {
        match_id: engineMatch.match_id,
        classification: engineMatch.classification,
        terminal_reason_codes: [...engineMatch.terminal_reason_codes],
        deterministic_rerun_identical: engineMatch.determinism.identical,
        ticket_snapshot_digest: engineMatch.ticket_snapshot_digest,
        replay_digest: engineMatch.replay_digest,
        turns: engineMatch.turns,
        tickets_closed: engineMatch.tickets_closed,
        contribution_counts: structuredClone(contributions),
        normalized_completed_result: engineStoryResult({ match: engineMatch, spec }),
      },
    };
  });
}

export async function buildTask043MatchArtifacts() {
  const catalogs = await loadTask042Catalogs();
  const deck = responseDeck(catalogs);
  const benchIds = benchCardIds(catalogs);
  const rows = MATCH_SPECS.map((spec) => {
    const configuration = createBuilderConfiguration({ spec, catalogs, benchIds, deck });
    const built = selectedBuild(buildTicketsV4({ configuration, catalogs }), spec);
    const repeat = selectedBuild(buildTicketsV4({ configuration: structuredClone(configuration), catalogs }), spec);
    invariant(JSON.stringify(built.result) === JSON.stringify(repeat.result), 'BUILDER_DETERMINISM', `${matchRef(spec)} changed across identical builds.`);
    invariant(built.ticket.generation_provenance.fingerprint_id === spec.fingerprintId, 'FINGERPRINT_DRIFT', `${matchRef(spec)} selected the wrong fingerprint.`);
    const expected = TASK_043_EXPECTED_TICKET_PINS[matchRef(spec)];
    invariant(built.ticket.id === expected.ticket_id, 'TICKET_PIN_DRIFT', `${matchRef(spec)} expected ${expected.ticket_id}; received ${built.ticket.id}.`);
    invariant(built.digest === expected.digest, 'TICKET_PIN_DRIFT', `${matchRef(spec)} expected ${expected.digest}; received ${built.digest}.`);
    const outcomeCoverage = validateTask014OutcomeCoverage(built.ticket, {
      domainCatalog: catalogs.domain,
      cardCatalog: catalogs.cards,
      diagnosticCardDefinitionIds: benchIds,
    });
    invariant(outcomeCoverage.valid, 'OUTCOME_COVERAGE', `${matchRef(spec)}: ${JSON.stringify(outcomeCoverage.errors)}`);
    const solvability = validateTicketSolvability(built.ticket, {
      domainCatalog: catalogs.domain,
      cardCatalog: catalogs.cards,
      legalCardDefinitionIds: configuration.legal_card_definition_ids,
    });
    invariant(solvability.valid, 'SOLVABILITY', `${matchRef(spec)}: ${JSON.stringify(solvability.errors)}`);
    const diagnostics = diagnosticClassification({ ticket: built.ticket, witness: solvability.witness, catalogs, benchIds });
    invariant(diagnostics.legal.card_definition_ids.length === 50, 'BENCH_SIZE', `${matchRef(spec)} does not expose all 50 Bench diagnostics.`);
    invariant(diagnostics.commands.minimal_witness_required_ids.length === 0, 'COMMAND_REQUIREMENT', `${matchRef(spec)} unexpectedly requires a Command in the minimal witness.`);
    const response = responsePath({ spec, ticket: built.ticket, catalogs, witness: solvability.witness });
    const pressure = deckPressure({ spec, deck });
    return { spec, configuration, built, solvability, diagnostics, response, deckPressure: pressure };
  });

  const settings = createCampaignSettings(rows);
  const campaign = await executeCampaign(settings, (input) => runAutomatedMatch(input, catalogs));
  invariant(campaign.matches.length === 6, 'ENGINE_PROOF', `Expected six engine Matches; received ${campaign.matches.length}.`);
  invariant(campaign.summary.overall.succeeded === 6 && campaign.summary.overall.failed === 0, 'ENGINE_PROOF', 'All six engine Matches must succeed.');
  const registry = createRegistry(rows, campaign.matches);
  const builderProof = {
    proof_version: TASK_043_PROOF_VERSION,
    campaign_id: TASK_043_STORY_PACK_ID,
    content_version: TASK_043_STORY_CONTENT_VERSION,
    status: 'CANDIDATE_NON_LIVE',
    exact_match_count: 6,
    exact_ticket_count_per_match: 1,
    diagnostic_bench_card_count: 50,
    exact_response_deck_id: TASK_042_RESPONSE_DECK_ID,
    exact_response_deck_size: 30,
    all_builds_deterministic_and_pinned: true,
    all_outcomes_complete: true,
    all_oracle_routes_solvable: true,
    all_engine_matches_succeeded: true,
    all_engine_reruns_identical: true,
    all_minimal_witness_command_sets_empty: true,
    matches: proofRows(rows, campaign.matches),
  };
  const checkpointProof = {
    proof_version: 'task-043-checkpoint-boundary-proof-v1',
    campaign_id: TASK_043_STORY_PACK_ID,
    content_version: TASK_043_STORY_CONTENT_VERSION,
    runtime_contract: {
      checkpoint_schema_version: STORY_CHECKPOINT_VERSION,
      match_context_schema_version: STORY_MATCH_CONTEXT_VERSION,
      active_match_resumption_supported: false,
      restart_source: 'PRE_MATCH_CHECKPOINT',
      result_acceptance_precedes_post_match_checkpoint: true,
      return_label_runs_after_post_match_checkpoint: true,
    },
    matches: checkpointRows(rows, campaign.matches),
  };
  return { catalogs, rows, settings, campaign, registry, builderProof, checkpointProof };
}

async function readText(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function verifyCustomArtifacts(artifacts) {
  const expected = new Map([
    [TASK_043_OUTPUTS.registry, stableJson(artifacts.registry)],
    [TASK_043_OUTPUTS.builderProof, stableJson(artifacts.builderProof)],
    [TASK_043_OUTPUTS.checkpointProof, stableJson(artifacts.checkpointProof)],
  ]);
  const errors = [];
  for (const [filePath, contents] of expected) {
    const actual = await readText(filePath);
    if (actual === null) errors.push(`${path.basename(filePath)}: missing`);
    else if (actual !== contents) errors.push(`${path.basename(filePath)}: differs from deterministic recomputation`);
  }
  return errors;
}

export async function generateTask043MatchProof({ check = false } = {}) {
  const artifacts = await buildTask043MatchArtifacts();
  if (check) {
    const errors = [
      ...await verifyCampaignArtifacts(TASK_043_OUTPUT_ROOT, artifacts.settings, artifacts.campaign),
      ...await verifyCustomArtifacts(artifacts),
    ];
    invariant(errors.length === 0, 'ARTIFACT_DRIFT', errors.join('; '));
  } else {
    await fs.mkdir(TASK_043_OUTPUT_ROOT, { recursive: true });
    await writeCampaignArtifacts(TASK_043_OUTPUT_ROOT, artifacts.settings, artifacts.campaign);
    await Promise.all([
      fs.writeFile(TASK_043_OUTPUTS.registry, stableJson(artifacts.registry), 'utf8'),
      fs.writeFile(TASK_043_OUTPUTS.builderProof, stableJson(artifacts.builderProof), 'utf8'),
      fs.writeFile(TASK_043_OUTPUTS.checkpointProof, stableJson(artifacts.checkpointProof), 'utf8'),
    ]);
  }
  return {
    mode: check ? 'checked' : 'generated',
    matches: artifacts.campaign.matches.length,
    succeeded: artifacts.campaign.summary.overall.succeeded,
    pinned_tickets: artifacts.builderProof.matches.length,
    checkpoint_boundaries: artifacts.checkpointProof.matches.length,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await generateTask043MatchProof({ check: process.argv.includes('--check') });
    console.log(stableJson(result).trimEnd());
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
