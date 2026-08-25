import fs from 'node:fs/promises';

import {
  buildTickets,
  TICKET_BUILDER_CONFIGURATION_VERSION,
  TICKET_BUILDER_VERSION,
} from '../builder/ticket-builder.mjs';
import {
  DIAGNOSIS_V2_BUILDER_VERSION,
  DIAGNOSIS_V2_CARD_CATALOG_VERSION,
  DIAGNOSIS_V2_CONFIGURATION_VERSION,
  DIAGNOSIS_V2_RESPONSE_DECK_ID,
  DIAGNOSIS_V2_RULESET_VERSION,
  DIAGNOSIS_V2_TICKET_CONTENT_VERSION,
  buildTicketsV2,
  createDiagnosisV2Catalogs,
} from '../builder/diagnosis-v2.mjs';
import {
  TASK_014_BUILDER_VERSION,
  TASK_014_CARD_CATALOG_VERSION,
  TASK_014_CONFIGURATION_VERSION,
  TASK_014_DOMAIN_CONTENT_VERSION,
  TASK_014_RULESET_VERSION,
  TASK_014_STARTER_DECK_ID,
  TASK_014_TICKET_CONTENT_VERSION,
  buildTicketsV3,
  createTask014Catalogs,
} from '../builder/task-014.mjs';
import * as engine from '../engine/index.mjs';
import {
  choosePolicyIntent,
  hasLegalProgressIntent,
} from './policies.mjs';

export const AUTOMATED_HARNESS_VERSION = 'automated-harness-v1';
export const FOUNDATION_CAMPAIGN_ID = 'task-009-foundation-v1';
export const DIAGNOSIS_V2_CAMPAIGN_ID = 'task-013-diagnosis-v2';
export const TASK_014_CAMPAIGN_ID = 'task-014-playable-coverage-v3';

const CONTENT_DIRECTORY = new URL('../../content/gameplay-v1/', import.meta.url);
const VIRTUAL_EPOCH_MILLISECONDS = Date.UTC(2042, 0, 1, 0, 0, 0);
const NON_PROGRESS_ACTION_TYPES = new Set(['PASS_TURN', 'REVISE_HYPOTHESIS']);

function clone(value) {
  return structuredClone(value);
}

function actionType(intent) {
  return intent.action_type ?? intent.request?.action_type ?? '';
}

function normalizedSeed(seed) {
  return String(seed);
}

function safeIdPart(value) {
  return String(value).replace(/[^a-zA-Z0-9._-]/g, '-');
}

function zeroes() {
  return {
    tests: 0,
    isolations: 0,
    repairs: 0,
    verifies: 0,
    documentation: 0,
    assists: 0,
    closures: 0,
    rejected_isolations: 0,
    failed_verifies: 0,
    redundant_or_superseded_actions: 0,
  };
}

function compactOutcome(state) {
  const result = state?.result;
  return {
    match_status: state?.status ?? 'NOT_STARTED',
    valid: result?.valid ?? null,
    reason_codes: [...(result?.reason_codes ?? [])],
    winner_player_ids: [...(result?.winner_player_ids ?? [])],
    winning_team_ids: [...(result?.winning_team_ids ?? [])],
  };
}

function ticketSnapshotDigest(ticketSnapshots) {
  return engine.digest(ticketSnapshots);
}

function replayDigestOrPreflight(state, input, detail) {
  return state
    ? engine.replayDigest(state)
    : engine.digest({
      campaign_id: input.campaign_id,
      setting_group_id: input.setting_group.setting_group_id,
      seed: input.seed,
      preflight: detail,
    });
}

function policyByPlayer(group) {
  return new Map(group.seats.map((seat) => [seat.player_id, seat.policy_id]));
}

function deckByPlayer(group) {
  return Object.fromEntries(group.seats.map((seat) => [seat.player_id, seat.deck_id]));
}

function playerSetup(group) {
  return group.seats.map((seat, index) => ({
    player_id: seat.player_id,
    display_name: seat.display_name ?? `Computer ${index + 1}`,
    controller_type: 'computer',
    seat_number: index + 1,
    team_id: group.collaboration_mode === 'cooperative' ? 'team.cooperative' : null,
    starting_service_points: seat.starting_service_points ?? 0,
  }));
}

function substantiveLegalIntents(legalIntents) {
  return legalIntents.filter((intent) => !NON_PROGRESS_ACTION_TYPES.has(actionType(intent)));
}

function futureDeterministicProgressCanExist(state, legalIntents) {
  if (hasLegalProgressIntent(substantiveLegalIntents(legalIntents))) return true;
  if (state.turn?.closure_window?.is_open) return true;
  if (state.players.some((player) => player.deck_card_instance_ids.length > 0)) return true;
  if (state.players.some((player) => player.refresh_tokens > 0
    && player.discard_card_instance_ids.length > 0)) return true;
  return false;
}

function canProveSingleSeatStalemate(state, legalIntents) {
  if (state.status !== 'ACTIVE' || state.players.filter((player) => player.active).length !== 1) return false;
  if (state.active_ticket_ids.length === 0 || state.turn?.closure_window?.is_open) return false;
  if (state.ticket_snapshot_queue.length > 0) return false;
  return !futureDeterministicProgressCanExist(state, legalIntents);
}

function startingScores(group) {
  const players = group.seats.map((seat) => ({
    player_id: seat.player_id,
    starting: seat.starting_service_points ?? 0,
  }));
  const teams = group.collaboration_mode === 'cooperative'
    ? [{
      team_id: 'team.cooperative',
      starting: players.reduce((sum, player) => sum + player.starting, 0),
    }]
    : [];
  return { players, teams };
}

function scoreRows(group, state) {
  const initial = startingScores(group);
  const playerById = new Map((state?.players ?? []).map((player) => [player.player_id, player]));
  const playerRows = initial.players.map((record) => {
    const final = playerById.get(record.player_id)?.service_points ?? record.starting;
    return { player_id: record.player_id, starting: record.starting, final, net: final - record.starting };
  });
  const teamRows = initial.teams.map((record) => {
    const final = state?.team_scores?.[record.team_id] ?? record.starting;
    return { team_id: record.team_id, starting: record.starting, final, net: final - record.starting };
  });
  return { players: playerRows, teams: teamRows };
}

function contributionRows(group, state) {
  const rows = new Map(group.seats.map((seat) => [seat.player_id, {
    player_id: seat.player_id,
    team_id: group.collaboration_mode === 'cooperative' ? 'team.cooperative' : null,
    ...zeroes(),
  }]));
  const fieldByMetric = {
    TEST: 'tests',
    ISOLATION: 'isolations',
    REPAIR: 'repairs',
    VERIFY: 'verifies',
    DOCUMENTATION: 'documentation',
    ASSIST: 'assists',
    CLOSURE: 'closures',
    REJECTED_ISOLATION: 'rejected_isolations',
    FAILED_VERIFY: 'failed_verifies',
    REDUNDANT: 'redundant_or_superseded_actions',
    SUPERSEDED: 'redundant_or_superseded_actions',
  };
  const populatedFields = new Set();
  for (const statistic of state?.result?.statistics ?? []) {
    const field = fieldByMetric[statistic.metric];
    const row = rows.get(statistic.player_id);
    if (field && row) {
      row[field] += statistic.value;
      populatedFields.add(`${statistic.player_id}:${field}`);
    }
  }
  for (const closure of state?.closure_statistics ?? []) {
    const row = rows.get(closure.closer_player_id);
    if (row && !populatedFields.has(`${closure.closer_player_id}:closures`)) row.closures += 1;
  }
  for (const event of state?.events ?? []) {
    const row = rows.get(event.actor_player_id);
    if (!row) continue;
    if (event.event_type === 'VERIFY_RESOLVED'
      && ['FAIL', 'INCONCLUSIVE'].includes(event.payload?.result)
      && !populatedFields.has(`${event.actor_player_id}:failed_verifies`)) row.failed_verifies += 1;
    if (['ACTION_REDUNDANT', 'ACTION_SUPERSEDED'].includes(event.event_type)
      && !populatedFields.has(`${event.actor_player_id}:redundant_or_superseded_actions`)) {
      row.redundant_or_superseded_actions += 1;
    }
  }
  return [...rows.values()];
}

function classificationFor(state, stopReason) {
  if (stopReason === 'POLICY_STALL') return 'POLICY_STALL';
  if (stopReason === 'PROVEN_STALEMATE') return 'PROVEN_STALEMATE';
  if (state.status === 'INVALIDATED') return 'INVALIDATED';
  if (state.result?.reason_codes?.includes('STALEMATE')) return 'PROVEN_STALEMATE';
  if (state.result?.reason_codes?.includes('SIMULATION_CAP')) return 'SIMULATION_CAP';
  if (state.status === 'COMPLETED') return 'SUCCEEDED';
  return 'SIMULATION_CAP';
}

function terminalReasons(state, stopReason) {
  const reasons = [...(state.result?.reason_codes ?? [])];
  if (['POLICY_STALL', 'SIMULATION_CAP'].includes(stopReason) && !reasons.includes(stopReason)) {
    reasons.push(stopReason);
  }
  return reasons;
}

function createMatchRow({
  input,
  state,
  snapshots,
  virtualSeconds,
  rejectedIntents,
  rejectedIntentCodes,
  stopReason,
  noLegalProgressMove,
  builderDiagnosticCodes = [],
}) {
  const group = input.setting_group;
  const scores = scoreRows(group, state);
  const classification = classificationFor(state, stopReason);
  const events = state.events ?? [];
  return {
    match_id: state.match_id,
    setting_group_id: group.setting_group_id,
    seed: normalizedSeed(input.seed),
    started: true,
    classification,
    terminal_reason_codes: terminalReasons(state, stopReason),
    outcome: compactOutcome(state),
    ticket_snapshot_digest: ticketSnapshotDigest(snapshots),
    replay_digest: replayDigestOrPreflight(state, input, null),
    scores: {
      players: Object.fromEntries(scores.players.map((record) => [record.player_id, record.final])),
      teams: Object.fromEntries(scores.teams.map((record) => [record.team_id, record.final])),
    },
    rounds: Math.max(0, ...events
      .filter((event) => event.event_type === 'TURN_STARTED')
      .map((event) => event.payload.round_number ?? 0)),
    turns: events.filter((event) => event.event_type === 'TURN_STARTED').length,
    tickets_closed: state.archived_ticket_ids.length,
    tickets_quarantined: events.filter((event) => event.event_type === 'TICKET_QUARANTINED').length,
    elapsed_virtual_time_seconds: virtualSeconds,
    player_service_points: scores.players,
    team_service_points: scores.teams,
    contribution_counts: contributionRows(group, state),
    rejected_intents: rejectedIntents,
    rejected_intent_codes: [...new Set(rejectedIntentCodes)].sort(),
    disconnects: events.filter((event) => event.event_type === 'PLAYER_DISCONNECTED').length,
    concessions: events.filter((event) => event.event_type === 'PLAYER_CONCEDED').length,
    stall_classification: classification === 'PROVEN_STALEMATE'
      ? 'PROVEN_STALEMATE'
      : classification === 'POLICY_STALL'
        ? 'POLICY_STALL'
        : classification === 'SIMULATION_CAP'
          ? 'SIMULATION_CAP'
          : 'NONE',
    no_legal_progress_move: noLegalProgressMove,
    builder_diagnostic_codes: [...builderDiagnosticCodes].sort(),
  };
}

function builderFailureRow(input, builderResult) {
  const group = input.setting_group;
  const matchId = `${input.campaign_id}.${group.setting_group_id}.seed-${safeIdPart(input.seed)}`;
  const codes = [...new Set(builderResult.attempts.flatMap((attempt) =>
    attempt.diagnostics.map((diagnostic) => diagnostic.code)))].sort();
  const scores = startingScores(group);
  const detail = { status: builderResult.status, diagnostic_codes: codes };
  return {
    match_id: matchId,
    setting_group_id: group.setting_group_id,
    seed: normalizedSeed(input.seed),
    started: false,
    classification: 'BUILDER_UNSATISFIABLE',
    terminal_reason_codes: ['BUILDER_UNSATISFIABLE'],
    outcome: {
      match_status: 'NOT_STARTED',
      valid: false,
      reason_codes: ['BUILDER_UNSATISFIABLE'],
      winner_player_ids: [],
      winning_team_ids: [],
    },
    ticket_snapshot_digest: engine.digest([]),
    replay_digest: replayDigestOrPreflight(null, input, detail),
    scores: {
      players: Object.fromEntries(scores.players.map((record) => [record.player_id, record.starting])),
      teams: Object.fromEntries(scores.teams.map((record) => [record.team_id, record.starting])),
    },
    rounds: 0,
    turns: 0,
    tickets_closed: 0,
    tickets_quarantined: 0,
    elapsed_virtual_time_seconds: 0,
    player_service_points: scores.players.map((record) => ({ ...record, final: record.starting, net: 0 })),
    team_service_points: scores.teams.map((record) => ({ ...record, final: record.starting, net: 0 })),
    contribution_counts: group.seats.map((seat) => ({
      player_id: seat.player_id,
      team_id: group.collaboration_mode === 'cooperative' ? 'team.cooperative' : null,
      ...zeroes(),
    })),
    rejected_intents: 0,
    rejected_intent_codes: [],
    disconnects: 0,
    concessions: 0,
    stall_classification: 'BUILDER_UNSATISFIABLE',
    no_legal_progress_move: false,
    builder_diagnostic_codes: codes,
  };
}

async function readJson(relativeName) {
  return JSON.parse(await fs.readFile(new URL(relativeName, CONTENT_DIRECTORY), 'utf8'));
}

export async function loadFoundationCatalogs() {
  const [cards, decks, domain, ticketContent] = await Promise.all([
    readJson('card-catalog.json'),
    readJson('decks.json'),
    readJson('domain-snapshot.json'),
    readJson('ticket-templates.json'),
  ]);
  return {
    cards,
    decks,
    domain,
    ticketContent,
    engineCatalogs: {
      cards,
      decks,
      content_version: domain.domain_content_version,
    },
  };
}

export async function loadDiagnosisV2Catalogs() {
  const foundation = await loadFoundationCatalogs();
  return createDiagnosisV2Catalogs({
    cards: foundation.cards,
    decks: foundation.decks,
    domain: foundation.domain,
    ticketContent: foundation.ticketContent,
  });
}

export async function loadTask014Catalogs() {
  const [cards, decks, domain, parts, coverage] = await Promise.all([
    readJson('card-catalog-v3.json'),
    readJson('decks-v3.json'),
    readJson('domain-snapshot-v2.json'),
    readJson('task-014-parts.json'),
    readJson('playable-coverage-v3.json'),
  ]);
  return createTask014Catalogs({ cards, decks, domain, parts, coverage });
}

function fixedSnapshots(group, ticketContent) {
  const byId = new Map(ticketContent.templates.map((template) => [template.ticket.id, template.ticket]));
  return group.ticket_source.ticket_definition_ids.map((id) => {
    const snapshot = byId.get(id);
    if (!snapshot) throw new Error(`${group.setting_group_id} references unknown fixed Ticket ${id}`);
    return clone(snapshot);
  });
}

function generatedSnapshots(group, seed, catalogs) {
  const configuration = clone(group.ticket_source.builder_configuration);
  configuration.seed = normalizedSeed(seed);
  const result = configuration.generator_version === TASK_014_BUILDER_VERSION
    ? buildTicketsV3({ configuration, catalogs })
    : catalogs.rulesetVersion === DIAGNOSIS_V2_RULESET_VERSION
      ? buildTicketsV2({ configuration, catalogs })
    : buildTickets({
      configuration,
      ticketContent: catalogs.ticketContent,
      domainCatalog: catalogs.domain,
      cardCatalog: catalogs.cards,
    });
  const selected = result.attempts.find((attempt) => attempt.attempt_id === result.selected_attempt_id);
  return {
    result,
    snapshots: selected?.ticket_snapshots?.map(clone) ?? [],
  };
}

function resolveTickets(group, seed, catalogs) {
  if (group.ticket_source.source_type === 'fixed') {
    return { result: null, snapshots: fixedSnapshots(group, catalogs.ticketContent) };
  }
  if (group.ticket_source.source_type === 'generated') {
    return generatedSnapshots(group, seed, catalogs);
  }
  throw new Error(`Unsupported Ticket source ${group.ticket_source.source_type}`);
}

function publicTicketSource(group, seed, builderResult, snapshots) {
  if (group.ticket_source.source_type === 'fixed') {
    return {
      source_type: 'fixed',
      content_version: group.ticket_source.content_version,
      ticket_definition_ids: snapshots.map((ticket) => ticket.id),
    };
  }
  return {
    source_type: 'generated',
    content_version: group.ticket_source.builder_configuration.content_version,
    generator_version: group.ticket_source.builder_configuration.generator_version,
    configuration_id: group.ticket_source.builder_configuration.id,
    seed: normalizedSeed(seed),
    builder_result_id: builderResult.id,
  };
}

function withAuthenticatedRequest(intent, state, playerId, requestSequence) {
  return {
    request_id: `${state.match_id}.request.${String(requestSequence).padStart(6, '0')}`,
    match_id: state.match_id,
    player_id: playerId,
    expected_revision: state.revision,
    action_type: intent.action_type,
    payload: clone(intent.payload ?? {}),
    client_nonce: `${state.match_id}.nonce.${String(requestSequence).padStart(6, '0')}`,
  };
}

function intentKey(intent) {
  return engine.canonicalJson(intent);
}

function chooseFromSeatSafeBoundary({
  policyId,
  view,
  legalIntents,
  revisedTicketsThisTurn,
  blockedIntentKeys,
}) {
  const rememberedLegalIntents = legalIntents.filter((intent) =>
    !blockedIntentKeys.has(intentKey(intent))
      && (actionType(intent) !== 'REVISE_HYPOTHESIS'
        || !revisedTicketsThisTurn.has(intent.payload.ticket_instance_id)));
  return choosePolicyIntent({
    policyId,
    view,
    legalIntents: rememberedLegalIntents,
  });
}

export async function runAutomatedMatch(input, suppliedCatalogs = null) {
  const catalogs = suppliedCatalogs ?? await loadFoundationCatalogs();
  const group = input.setting_group;
  const built = resolveTickets(group, input.seed, catalogs);
  if (built.result?.status === 'FAILURE') return builderFailureRow(input, built.result);
  const snapshots = built.snapshots;
  const matchId = `${input.campaign_id}.${group.setting_group_id}.seed-${safeIdPart(input.seed)}`;
  const clockStep = group.virtual_clock?.seconds_per_decision ?? 5;
  let virtualSeconds = 0;
  const now = () => new Date(VIRTUAL_EPOCH_MILLISECONDS + virtualSeconds * 1000).toISOString();
  let state = engine.createMatch({
    matchId,
    players: playerSetup(group),
    decksByPlayer: deckByPlayer(group),
    ticketSnapshots: snapshots,
    catalogs: catalogs.engineCatalogs,
    configuration: {
      ...clone(group.match_configuration),
      collaboration_mode: group.collaboration_mode,
      execution_mode: 'offline',
      turn_cap: group.caps.turns,
      closure_cap: group.caps.closures,
    },
    seed: normalizedSeed(input.seed),
    now: now(),
    ticketSource: publicTicketSource(group, input.seed, built.result, snapshots),
    rulesetVersion: input.version_pins.ruleset_version,
  });

  const policies = policyByPlayer(group);
  let requestSequence = 0;
  let rejectedIntents = 0;
  const rejectedIntentCodes = [];
  let consecutivePassesWithProgress = 0;
  let noLegalProgressMove = false;
  let stopReason = null;
  let rememberedTurn = state.turn?.turn_number ?? null;
  let revisedTicketsThisTurn = new Set();
  const blockedIntentKeys = new Set();
  const maximumDecisions = Math.max(100, group.caps.turns * 20);

  for (let decisions = 0; state.status === 'ACTIVE' && decisions < maximumDecisions; decisions += 1) {
    if (state.turn_counter >= group.caps.turns
      || state.archived_ticket_ids.length >= group.caps.closures) {
      virtualSeconds += clockStep;
      state = engine.stopSimulationAtCap({ state, now: now() });
      stopReason = 'SIMULATION_CAP';
      break;
    }
    if (state.turn && state.turn.turn_number !== rememberedTurn) {
      rememberedTurn = state.turn.turn_number;
      revisedTicketsThisTurn = new Set();
    }
    const activePlayerId = state.turn?.active_player_id;
    if (!activePlayerId) throw new Error(`${matchId} is active without an active Player turn`);
    const view = engine.projectPrivatePlayer(state, activePlayerId, catalogs.engineCatalogs);
    const legalIntents = engine.getLegalIntents({
      state,
      playerId: activePlayerId,
      catalogs: catalogs.engineCatalogs,
    });
    if (JSON.stringify(view.legal_intents) !== JSON.stringify(legalIntents)) {
      throw new Error(`${matchId} private projection and legal-intent boundary disagree`);
    }
    const hasProgress = hasLegalProgressIntent(substantiveLegalIntents(legalIntents));
    if (!hasProgress) noLegalProgressMove = true;

    if (canProveSingleSeatStalemate(state, legalIntents)) {
      if (typeof engine.stopForProvenStalemate !== 'function') {
        throw new Error('Engine must export stopForProvenStalemate before running the campaign');
      }
      virtualSeconds += clockStep;
      state = engine.stopForProvenStalemate({ state, now: now() });
      stopReason = 'PROVEN_STALEMATE';
      break;
    }

    const policyId = policies.get(activePlayerId);
    const selected = chooseFromSeatSafeBoundary({
      policyId,
      view,
      legalIntents,
      revisedTicketsThisTurn,
      blockedIntentKeys,
    });
    if (actionType(selected) === 'REVISE_HYPOTHESIS') {
      revisedTicketsThisTurn.add(selected.payload.ticket_instance_id);
    }
    requestSequence += 1;
    virtualSeconds += clockStep;
    const transition = engine.submitIntent({
      state,
      request: withAuthenticatedRequest(selected, state, activePlayerId, requestSequence),
      authenticatedPlayerId: activePlayerId,
      catalogs: catalogs.engineCatalogs,
      now: now(),
    });
    if (!transition.result.accepted) {
      rejectedIntents += 1;
      rejectedIntentCodes.push(`${actionType(selected)}:${transition.result.error_code}`);
      blockedIntentKeys.add(intentKey(selected));
    }
    if (transition.result.resolution_code === 'ISOLATION_NOT_SUPPORTED') {
      blockedIntentKeys.add(intentKey(selected));
    }
    state = transition.state;

    if (actionType(selected) === 'PASS_TURN' && hasProgress) consecutivePassesWithProgress += 1;
    else if (actionType(selected) !== 'REVISE_HYPOTHESIS') consecutivePassesWithProgress = 0;

    if (group.caps.policy_stall_consecutive_passes !== null
      && consecutivePassesWithProgress >= group.caps.policy_stall_consecutive_passes
      && state.status === 'ACTIVE') {
      virtualSeconds += clockStep;
      state = engine.stopSimulationAtCap({ state, now: now() });
      stopReason = 'POLICY_STALL';
      break;
    }
  }

  if (state.status === 'ACTIVE') {
    virtualSeconds += clockStep;
    state = engine.stopSimulationAtCap({ state, now: now() });
    stopReason = 'SIMULATION_CAP';
  }
  return createMatchRow({
    input,
    state,
    snapshots,
    virtualSeconds,
    rejectedIntents,
    rejectedIntentCodes,
    stopReason,
    noLegalProgressMove,
    builderDiagnosticCodes: [],
  });
}

function bounds(minimum, maximum) {
  return { minimum, maximum };
}

function builderConfiguration(id, requestedCount, legalCardDefinitionIds, {
  context = 'SIMULATION',
  allowedTags = [],
  allowDuplicates = false,
} = {}) {
  return {
    id,
    entity_type: 'ticket_builder_configuration',
    configuration_version: TICKET_BUILDER_CONFIGURATION_VERSION,
    scenario_or_mode_context: context,
    requested_ticket_count: requestedCount,
    seed: 'match-seed',
    generator_version: TICKET_BUILDER_VERSION,
    content_version: 'core-ticket-templates-v1',
    domain_content_version: 'core-domain-snapshot-v1',
    card_catalog_version: 'core-card-catalog-v1',
    allowed_domain_ids: [],
    excluded_domain_ids: [],
    allowed_tags: allowedTags,
    excluded_tags: [],
    guaranteed_categories: [],
    required_teaching_beats: [],
    authored_difficulty_bounds: bounds(1, 4),
    fault_count_bounds: bounds(1, 3),
    required_actionable_fault_count_bounds: bounds(1, 2),
    causal_depth_bounds: bounds(0, 1),
    inbound_branching_bounds: bounds(0, 2),
    outbound_branching_bounds: bounds(0, 2),
    progressive_difficulty_profile: {
      profile_id: 'progressive.simulation.foundation',
      profile_version: 'progressive-simulation-v1',
      explicit_ceiling: 4,
      bands: [{
        start_generated_index: 0,
        end_generated_index: Math.max(0, requestedCount - 1),
        target: 2,
        minimum: 1,
        maximum: 4,
      }],
    },
    generation_index_start: 0,
    allow_duplicate_causal_fingerprints: allowDuplicates,
    active_causal_fingerprints: [],
    legal_card_definition_ids: [...legalCardDefinitionIds],
    fallback_configuration_id: null,
  };
}

function seat(playerId, policyId, deckId = 'deck.core.storage_foundation') {
  return {
    player_id: playerId,
    controller_type: 'computer',
    policy_id: policyId,
    deck_id: deckId,
    starting_service_points: 0,
  };
}

function group({
  id,
  description,
  mode,
  seats,
  ticketSource,
  seeds,
  queueMinimum = 0,
  terminationScore = -1,
  startingTicketCount = 1,
  startingSearchTokens = 3,
  maxSearchTokens = 5,
  startingRefreshTokens = 1,
  maxRefreshTokens = 1,
  turnCap = 80,
  closureCap = 12,
  stallPasses = 8,
  fixtureKind = 'ORDINARY',
}) {
  return {
    setting_group_id: id,
    description,
    fixture_kind: fixtureKind,
    collaboration_mode: mode,
    seats,
    legal_card_pool_ids: [...new Set(seats.map((entry) => entry.deck_id))].sort(),
    ticket_source: ticketSource,
    match_configuration: {
      starting_ticket_count: startingTicketCount,
      queue_minimum: queueMinimum,
      termination_score: terminationScore,
      starting_search_tokens: startingSearchTokens,
      ticket_search_tokens: 1,
      max_search_tokens: maxSearchTokens,
      starting_refresh_tokens: startingRefreshTokens,
      max_refresh_tokens: maxRefreshTokens,
    },
    caps: {
      turns: turnCap,
      closures: closureCap,
      policy_stall_consecutive_passes: stallPasses,
    },
    virtual_clock: { epoch: '2042-01-01T00:00:00.000Z', seconds_per_decision: 5 },
    seeds,
  };
}

export function createFoundationCampaignSettings(cardDefinitionIds) {
  const fixed = (ids) => ({
    source_type: 'fixed',
    content_version: 'core-ticket-templates-v1',
    ticket_definition_ids: ids,
  });
  const generated = (id, count, options = {}) => ({
    source_type: 'generated',
    builder_configuration: builderConfiguration(id, count, cardDefinitionIds, options),
  });
  const loose = 'ticket.storage.loose_cable';
  const single = 'ticket.storage.single_sas_member';
  const cascade = 'ticket.storage.member_then_array';
  return {
    campaign_id: FOUNDATION_CAMPAIGN_ID,
    harness_version: AUTOMATED_HARNESS_VERSION,
    version_pins: {
      ruleset_version: 'first-version-v1',
      card_catalog_version: 'core-card-catalog-v1',
      domain_content_version: 'core-domain-snapshot-v1',
      ticket_content_version: 'core-ticket-templates-v1',
      generator_version: TICKET_BUILDER_VERSION,
      harness_version: AUTOMATED_HARNESS_VERSION,
      policy_versions: [
        'methodical-seat-safe-v1',
        'publication-seat-safe-v1',
        'scripted-cooperative-v1',
        'scripted-competitive-v1',
        'pass-only-fixture-v1',
      ],
    },
    setting_groups: [
      group({
        id: 'coop-fixed-finite-solo-methodical',
        description: 'One cooperative computer clears one fixed finite Ticket.',
        mode: 'cooperative',
        seats: [seat('player_a', 'methodical-seat-safe-v1')],
        ticketSource: fixed([loose]),
        seeds: ['1001', '1002'],
      }),
      group({
        id: 'coop-generated-finite-pair-publication',
        description: 'Two cooperative computers clear one deterministically generated finite Ticket.',
        mode: 'cooperative',
        seats: [
          seat('player_a', 'publication-seat-safe-v1'),
          seat('player_b', 'methodical-seat-safe-v1'),
        ],
        ticketSource: generated('builder.coop.generated.finite', 1, { context: 'COOPERATIVE' }),
        seeds: ['2001', '2002'],
      }),
      group({
        id: 'coop-fixed-replenishing-four-mixed',
        description: 'Four cooperative computers exercise fixed supply replenishment and mixed policies.',
        mode: 'cooperative',
        seats: [
          seat('player_a', 'methodical-seat-safe-v1'),
          seat('player_b', 'publication-seat-safe-v1'),
          seat('player_c', 'scripted-cooperative-v1'),
          seat('player_d', 'methodical-seat-safe-v1'),
        ],
        ticketSource: fixed([loose, single]),
        seeds: ['3001', '3002'],
        queueMinimum: 1,
        terminationScore: 2,
      }),
      group({
        id: 'competitive-fixed-finite-pair-scripted',
        description: 'Two competitive computers exercise private Evidence and the failed-Verify return path.',
        mode: 'competitive',
        seats: [
          seat('player_a', 'scripted-competitive-v1'),
          seat('player_b', 'methodical-seat-safe-v1'),
        ],
        ticketSource: fixed([cascade]),
        seeds: ['4001', '4002'],
        turnCap: 120,
      }),
      group({
        id: 'coop-fixed-failed-verify-scripted',
        description: 'Two cooperative computers exercise the scripted failed-Verify return-to-Diagnosis path.',
        mode: 'cooperative',
        seats: [
          seat('player_a', 'scripted-cooperative-v1'),
          seat('player_b', 'publication-seat-safe-v1'),
        ],
        ticketSource: fixed([cascade]),
        seeds: ['4501', '4502'],
        turnCap: 120,
      }),
      group({
        id: 'competitive-generated-replenishing-three-mixed',
        description: 'Three competitive computers use generated supply, replenishment, and mixed policies.',
        mode: 'competitive',
        seats: [
          seat('player_a', 'methodical-seat-safe-v1'),
          seat('player_b', 'publication-seat-safe-v1'),
          seat('player_c', 'scripted-competitive-v1'),
        ],
        ticketSource: generated('builder.competitive.generated.replenishing', 2, { context: 'COMPETITIVE' }),
        seeds: ['5001', '5002'],
        queueMinimum: 1,
        terminationScore: 1,
      }),
      group({
        id: 'fixture-builder-unsatisfiable',
        description: 'An impossible required tag proves Builder failure returns no partial Ticket.',
        mode: 'cooperative',
        seats: [seat('player_a', 'methodical-seat-safe-v1')],
        ticketSource: generated('builder.fixture.unsatisfiable', 1, {
          context: 'SIMULATION',
          allowedTags: ['fixture.no_eligible_template'],
        }),
        seeds: ['6001', '6002'],
        fixtureKind: 'BUILDER_UNSATISFIABLE',
      }),
      group({
        id: 'fixture-proven-stalemate',
        description: 'A legal alternate deck omits the only matching Repair, so the fixed Ticket cannot reach closure.',
        mode: 'cooperative',
        seats: [seat('player_a', 'methodical-seat-safe-v1', 'deck.fixture.storage.no_cable_repair')],
        ticketSource: fixed([loose]),
        seeds: ['7001', '7002'],
        startingSearchTokens: 0,
        maxSearchTokens: 0,
        startingRefreshTokens: 0,
        maxRefreshTokens: 0,
        turnCap: 120,
        stallPasses: null,
        fixtureKind: 'PROVEN_STALEMATE',
      }),
      group({
        id: 'fixture-admin-invalidation',
        description: 'A replenishing queue exhausts its pinned fixed supply and invalidates after closure.',
        mode: 'cooperative',
        seats: [seat('player_a', 'methodical-seat-safe-v1')],
        ticketSource: fixed([loose]),
        seeds: ['8001', '8002'],
        queueMinimum: 1,
        fixtureKind: 'ADMIN_INVALIDATION',
      }),
      group({
        id: 'fixture-simulation-cap',
        description: 'A pass-only policy reaches an offline safety cap without a gameplay winner.',
        mode: 'cooperative',
        seats: [seat('player_a', 'pass-only-fixture-v1')],
        ticketSource: fixed([cascade]),
        seeds: ['9001', '9002'],
        turnCap: 3,
        stallPasses: null,
        fixtureKind: 'SIMULATION_CAP',
      }),
      group({
        id: 'fixture-policy-stall',
        description: 'Pass-only competitive computers expose a policy stall while legal progress exists.',
        mode: 'competitive',
        seats: [
          seat('player_a', 'pass-only-fixture-v1'),
          seat('player_b', 'pass-only-fixture-v1'),
        ],
        ticketSource: fixed([loose]),
        seeds: ['10001', '10002'],
        turnCap: 20,
        stallPasses: 2,
        fixtureKind: 'POLICY_STALL',
      }),
    ],
  };
}

function diagnosisV2BuilderConfiguration(id, requestedCount, legalCardDefinitionIds) {
  return {
    ...builderConfiguration(id, requestedCount, legalCardDefinitionIds, {
      context: 'TRAINING',
      allowDuplicates: true,
    }),
    configuration_version: DIAGNOSIS_V2_CONFIGURATION_VERSION,
    generator_version: DIAGNOSIS_V2_BUILDER_VERSION,
    content_version: DIAGNOSIS_V2_TICKET_CONTENT_VERSION,
    card_catalog_version: DIAGNOSIS_V2_CARD_CATALOG_VERSION,
    progressive_difficulty_profile: {
      profile_id: 'progressive.simulation.diagnosis_v2',
      profile_version: 'diagnosis-v2',
      explicit_ceiling: 4,
      bands: [{
        start_generated_index: 0,
        end_generated_index: Math.max(0, requestedCount - 1),
        target: 2,
        minimum: 1,
        maximum: 4,
      }],
    },
  };
}

export function createDiagnosisV2CampaignSettings(cardDefinitionIds) {
  const fixed = (ids) => ({
    source_type: 'fixed',
    content_version: DIAGNOSIS_V2_TICKET_CONTENT_VERSION,
    ticket_definition_ids: ids,
  });
  const diagnosisSeat = (playerId) => seat(playerId, 'methodical-seat-safe-v2', DIAGNOSIS_V2_RESPONSE_DECK_ID);
  const withTraining = (entry) => ({
    ...entry,
    match_configuration: { ...entry.match_configuration, play_context: 'TRAINING' },
  });
  return {
    campaign_id: DIAGNOSIS_V2_CAMPAIGN_ID,
    harness_version: AUTOMATED_HARNESS_VERSION,
    version_pins: {
      ruleset_version: DIAGNOSIS_V2_RULESET_VERSION,
      card_catalog_version: DIAGNOSIS_V2_CARD_CATALOG_VERSION,
      domain_content_version: 'core-domain-snapshot-v1',
      ticket_content_version: DIAGNOSIS_V2_TICKET_CONTENT_VERSION,
      generator_version: DIAGNOSIS_V2_BUILDER_VERSION,
      harness_version: AUTOMATED_HARNESS_VERSION,
      policy_versions: ['methodical-seat-safe-v2'],
    },
    setting_groups: [
      withTraining(group({
        id: 'diagnosis-v2-fixed-direct-solo',
        description: 'One seat clears the direct-observation Ticket using the global Diagnostic Bench.',
        mode: 'cooperative',
        seats: [diagnosisSeat('player_a')],
        ticketSource: fixed(['ticket.storage.loose_cable']),
        seeds: ['13001', '13002'],
        turnCap: 120,
        stallPasses: null,
      })),
      withTraining(group({
        id: 'diagnosis-v2-generated-recovery-team',
        description: 'Two seats exercise generated diagnosis-v2 Tickets, attribution, and recovery routes.',
        mode: 'cooperative',
        seats: [diagnosisSeat('player_a'), diagnosisSeat('player_b')],
        ticketSource: {
          source_type: 'generated',
          builder_configuration: diagnosisV2BuilderConfiguration(
            'builder.diagnosis_v2.recovery_team',
            1,
            cardDefinitionIds,
          ),
        },
        seeds: ['13101', '13102'],
        turnCap: 180,
        stallPasses: null,
      })),
    ],
  };
}

function task014BuilderConfiguration(id, fingerprintIds, catalogs) {
  const requestedCount = fingerprintIds.length;
  const starter = catalogs.decks.decks.find((deck) => deck.id === TASK_014_STARTER_DECK_ID);
  const diagnosticIds = catalogs.cards.cards
    .filter((card) => card.play_contract?.contract_type === 'DIAGNOSTIC')
    .map((card) => card.id)
    .sort();
  const counts = {};
  for (const cardId of starter.card_definition_ids) counts[cardId] = (counts[cardId] ?? 0) + 1;
  return {
    ...builderConfiguration(id, requestedCount, [...diagnosticIds, ...Object.keys(counts)].sort(), {
      context: 'SIMULATION',
      allowDuplicates: true,
    }),
    configuration_version: TASK_014_CONFIGURATION_VERSION,
    generator_version: TASK_014_BUILDER_VERSION,
    content_version: TASK_014_TICKET_CONTENT_VERSION,
    domain_content_version: TASK_014_DOMAIN_CONTENT_VERSION,
    card_catalog_version: TASK_014_CARD_CATALOG_VERSION,
    allowed_fingerprint_ids: [...fingerprintIds],
    diagnostic_card_definition_ids: diagnosticIds,
    available_card_definition_counts: counts,
    progressive_difficulty_profile: {
      profile_id: 'progressive.simulation.task_014',
      profile_version: 'task-014',
      explicit_ceiling: 4,
      bands: [{ start_generated_index: 0, end_generated_index: requestedCount - 1, target: 2, minimum: 1, maximum: 4 }],
    },
  };
}

export function createTask014CampaignSettings(catalogs) {
  const alternateDeckId = 'deck.fixture.multisystem_response_reordered_v3';
  const roots = [...catalogs.parts.fingerprint_roots].sort((left, right) => left.fingerprint_id.localeCompare(right.fingerprint_id));
  return {
    campaign_id: TASK_014_CAMPAIGN_ID,
    harness_version: AUTOMATED_HARNESS_VERSION,
    version_pins: {
      ruleset_version: TASK_014_RULESET_VERSION,
      card_catalog_version: TASK_014_CARD_CATALOG_VERSION,
      domain_content_version: TASK_014_DOMAIN_CONTENT_VERSION,
      ticket_content_version: TASK_014_TICKET_CONTENT_VERSION,
      generator_version: TASK_014_BUILDER_VERSION,
      harness_version: AUTOMATED_HARNESS_VERSION,
      policy_versions: ['coverage-seat-safe-v3'],
    },
    setting_groups: [...roots.map((root, index) => group({
      id: `task-014-${root.fingerprint_id.replace(/^fingerprint\./, '').replaceAll('.', '-')}`,
      description: `Seat-safe generated coverage for ${root.fingerprint_id}.`,
      mode: 'cooperative',
      seats: [seat('player_a', 'coverage-seat-safe-v3', index % 2 === 0 ? TASK_014_STARTER_DECK_ID : alternateDeckId)],
      ticketSource: {
        source_type: 'generated',
        builder_configuration: task014BuilderConfiguration(`builder.task_014.${root.fingerprint_id}`, [root.fingerprint_id], catalogs),
      },
      seeds: [String(14001 + index)],
      turnCap: 220,
      stallPasses: null,
    })), group({
      id: 'task-014-multi-ticket-resource-path',
      description: 'Two generated Tickets prove exact response-deck, draw, Search, and Refresh reachability across one queue.',
      mode: 'cooperative',
      seats: [seat('player_a', 'coverage-seat-safe-v3', TASK_014_STARTER_DECK_ID)],
      ticketSource: {
        source_type: 'generated',
        builder_configuration: task014BuilderConfiguration('builder.task_014.multi_ticket_resource_path', [
          'fingerprint.boot.incorrect_order',
          'fingerprint.network.incorrect_static_ip',
        ], catalogs),
      },
      seeds: ['14998'],
      startingTicketCount: 2,
      turnCap: 440,
      stallPasses: null,
    })],
  };
}
