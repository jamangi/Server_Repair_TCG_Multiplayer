import {
  cardActionType,
  cardCatalogVersion,
  cardContractType,
  cardCost,
  cardMap,
  cardName,
  cardSourceDefinitionId,
} from './catalogs.mjs';
import { canonicalJson, deepClone, deterministicShuffle, digest, randomInt } from './determinism.mjs';
import { appendEvent, appendWorklogPlaceholder, eventVisibleToPlayer } from './events.mjs';
import { assertPlayerSafe, assertValidState } from './invariants.mjs';
import {
  DIAGNOSIS_V2_MAX_COPIES,
  DIAGNOSIS_V2_RULESET_VERSION,
} from '../builder/diagnosis-v2.mjs';

const ACTION_TYPES = new Set([
  'PLAY_CARD',
  'RUN_TEST',
  'SET_ELIMINATION',
  'REVISE_HYPOTHESIS',
  'COMMIT_ISOLATION',
  'PERFORM_REPAIR',
  'PERFORM_VERIFY',
  'DOCUMENT_LIVE',
  'PUBLISH_CLOSURE',
  'SEARCH',
  'REFRESH',
  'PASS_TURN',
  'GIVE_UP_TICKET',
]);

const TOP_LEVEL_REQUEST_FIELDS = new Set([
  'request_id', 'match_id', 'player_id', 'expected_revision', 'action_type', 'payload', 'client_nonce',
]);

const PAYLOAD_FIELDS = new Map([
  ['PLAY_CARD', new Set(['ticket_instance_id', 'card_instance_id', 'execution_definition_id', 'target_ref', 'observed_machine_revision'])],
  ['RUN_TEST', new Set(['ticket_instance_id', 'card_instance_id', 'execution_definition_id', 'target_ref', 'observed_machine_revision'])],
  ['SET_ELIMINATION', new Set(['ticket_instance_id', 'candidate_fault_id', 'cited_evidence_event_ids', 'eliminated'])],
  ['REVISE_HYPOTHESIS', new Set(['ticket_instance_id', 'candidate_fault_ids'])],
  ['COMMIT_ISOLATION', new Set(['ticket_instance_id', 'candidate_fault_id', 'cited_evidence_event_ids'])],
  ['PERFORM_REPAIR', new Set(['ticket_instance_id', 'card_instance_id', 'repair_procedure_id', 'isolated_fault_instance_id'])],
  ['PERFORM_VERIFY', new Set(['ticket_instance_id', 'card_instance_id', 'validation_procedure_id'])],
  ['DOCUMENT_LIVE', new Set(['ticket_instance_id', 'source_action_event_id', 'source_result_event_id', 'worklog_placeholder_event_id'])],
  ['PUBLISH_CLOSURE', new Set([
    'ticket_instance_id', 'accepted_isolation_event_id', 'accepted_isolation_event_ids',
    'decisive_evidence_event_ids', 'repair_event_ids', 'failed_verify_event_ids',
    'current_passing_verify_event_ids',
  ])],
  ['SEARCH', new Set(['selected_card_definition_id'])],
  ['REFRESH', new Set()],
  ['PASS_TURN', new Set()],
  ['GIVE_UP_TICKET', new Set(['ticket_instance_id', 'confirmed'])],
]);

const isDiagnosisV2 = (stateOrVersion) => (typeof stateOrVersion === 'string'
  ? stateOrVersion
  : stateOrVersion?.ruleset_version) === DIAGNOSIS_V2_RULESET_VERSION;

class EngineRejection extends Error {
  constructor(code, message = code) {
    super(message);
    this.code = code;
  }
}

const reject = (code, message) => { throw new EngineRejection(code, message); };

function exactKeys(object, allowed) {
  if (!object || typeof object !== 'object' || Array.isArray(object)) return false;
  return Object.keys(object).every((key) => allowed.has(key));
}

function validateRequestShape(request) {
  if (!exactKeys(request, TOP_LEVEL_REQUEST_FIELDS)) return false;
  if (typeof request.request_id !== 'string' || request.request_id.length === 0
    || typeof request.client_nonce !== 'string' || request.client_nonce.length === 0
    || typeof request.match_id !== 'string' || request.match_id.length === 0
    || typeof request.player_id !== 'string' || request.player_id.length === 0
    || !Number.isSafeInteger(request.expected_revision)
    || !ACTION_TYPES.has(request.action_type)) return false;
  const allowed = PAYLOAD_FIELDS.get(request.action_type);
  return exactKeys(request.payload, allowed);
}

function defaultConfiguration(configuration = {}) {
  return {
    queue_minimum: 0,
    termination_score: -1,
    starting_search_tokens: 3,
    ticket_search_tokens: 1,
    max_search_tokens: 5,
    starting_refresh_tokens: 1,
    max_refresh_tokens: 1,
    execution_mode: 'offline',
    turn_cap: null,
    closure_cap: null,
    ...configuration,
  };
}

function normalizeDecks(decksByPlayer, catalogs) {
  const catalogDecks = new Map((catalogs?.decks?.decks ?? []).map((deck) => [deck.id, deck.card_definition_ids]));
  const result = {};
  for (const [playerId, deckOrId] of Object.entries(decksByPlayer)) {
    result[playerId] = Array.isArray(deckOrId) ? deckOrId : catalogDecks.get(deckOrId);
    if (!result[playerId]) throw new Error(`Unknown deck ${deckOrId} for ${playerId}`);
  }
  return result;
}

function validateDeck(cardIds, cards, playerId, rulesetVersion) {
  if (!Array.isArray(cardIds) || cardIds.length !== 30) throw new Error(`${playerId} deck must contain exactly 30 cards`);
  const copies = new Map();
  for (const id of cardIds) {
    if (!cards.has(id)) throw new Error(`${playerId} deck references unknown Card ${id}`);
    if (isDiagnosisV2(rulesetVersion) && cardContractType(cards.get(id)) === 'DIAGNOSTIC') {
      throw new Error(`${playerId} diagnosis-v2 response deck cannot contain diagnostic ${id}`);
    }
    copies.set(id, (copies.get(id) ?? 0) + 1);
  }
  const maximum = isDiagnosisV2(rulesetVersion) ? DIAGNOSIS_V2_MAX_COPIES : 3;
  for (const [id, count] of copies) if (count > maximum) throw new Error(`${playerId} deck has ${count} copies of ${id}`);
}

function instantiateTicket(snapshot, matchId, index) {
  const ticketInstanceId = `${matchId}.ticket.${String(index + 1).padStart(3, '0')}`;
  const truth = deepClone(snapshot.server_only_truth);
  const faultInstances = {};
  truth.fault_instances.forEach((fault, faultIndex) => {
    faultInstances[fault.fault_instance_key] = {
      ...fault,
      // This identity can become public after accepted Isolation, so it must
      // never encode the server-only authored instance key.
      fault_instance_id: `${ticketInstanceId}.fault.${String(faultIndex + 1).padStart(3, '0')}`,
      machine_status: 'ACTIVE',
    };
  });
  const authoredDiagnosticTargets = {};
  const authoredTargetRefs = [...new Set(snapshot.authored_evidence_outcomes
    .map((outcome) => outcome.target_ref))].sort();
  authoredTargetRefs.forEach((authoredTargetRef, targetIndex) => {
    const targetToken = `${ticketInstanceId}.target.${String(targetIndex + 1).padStart(3, '0')}`;
    authoredDiagnosticTargets[targetToken] = { authored_target_ref: authoredTargetRef };
  });
  return {
    ticket_instance_id: ticketInstanceId,
    ticket_definition_id: snapshot.id,
    definition_snapshot: deepClone(snapshot),
    generation_provenance: deepClone(snapshot.generation_provenance ?? null),
    status: 'DIAGNOSIS',
    diagnosis_revision: 0,
    machine_state_key: truth.initial_machine_state_key,
    machine_revision: 0,
    visible_symptom_ids: [...(snapshot.initial_symptom_ids ?? [])],
    public_candidate_fault_ids: [...snapshot.public_candidate_fault_ids],
    fault_instances: faultInstances,
    authored_diagnostic_targets: authoredDiagnosticTargets,
    test_history: [],
    elimination_history: [],
    isolation_history: [],
    current_repair_gate_isolation_event_id: null,
    accepted_path_isolation_event_ids: [],
    repair_history: [],
    accepted_path_repair_event_ids: [],
    verification_history: [],
    current_verify_pass_event_ids: [],
    return_to_diagnosis_history: [],
    documentation_publications: [],
    worklog_entries: [],
    closure: null,
    abandonment: null,
  };
}

function drawOne(state, player, now, reason) {
  if (player.deck_card_instance_ids.length === 0) {
    appendEvent(state, {
      eventType: 'DRAW_SKIPPED_EMPTY',
      actorPlayerId: player.player_id,
      visibility: 'PUBLIC_MATCH',
      payload: { reason },
      now,
    });
    return null;
  }
  const instanceId = player.deck_card_instance_ids.shift();
  player.hand_card_instance_ids.push(instanceId);
  state.card_instances[instanceId].zone = 'hand';
  appendEvent(state, {
    eventType: 'CARD_DRAWN',
    actorPlayerId: player.player_id,
    visibility: 'PRIVATE_PLAYER',
    visibleToPlayerIds: [player.player_id],
    payload: { card_instance_id: instanceId, reason },
    now,
  });
  return instanceId;
}

function startTurn(state, rosterIndex, now) {
  const player = state.players[rosterIndex];
  state.turn_counter += 1;
  state.turn = {
    round_number: state.round_number,
    turn_number: state.turn_counter,
    roster_index: rosterIndex,
    active_player_id: player.player_id,
    phase: 'START_DRAW',
    actions_spent: 0,
    actions_remaining: 2,
    zero_action_card_names_played: [],
    closure_window: {
      is_open: false,
      eligible_ticket_instance_ids: [],
      opened_by_verify_event_id: null,
    },
  };
  appendEvent(state, {
    eventType: 'TURN_STARTED',
    actorPlayerId: player.player_id,
    payload: { round_number: state.round_number, turn_number: state.turn_counter },
    now,
  });
  drawOne(state, player, now, 'START_OF_TURN');
  state.turn.phase = 'WORK';
}

export function createMatch({
  matchId,
  players,
  decksByPlayer,
  ticketSnapshots,
  catalogs,
  configuration = {},
  seed,
  now,
  ticketSource = null,
  rulesetVersion = 'first-version-v1',
}) {
  if (!['first-version-v1', DIAGNOSIS_V2_RULESET_VERSION].includes(rulesetVersion)) {
    throw new Error(`Unsupported ruleset version ${rulesetVersion}`);
  }
  const cards = cardMap(catalogs);
  const catalogVersion = cardCatalogVersion(catalogs);
  if (!catalogVersion) throw new Error('A pinned card_catalog_version is required');
  const decks = normalizeDecks(decksByPlayer, catalogs);
  const config = defaultConfiguration(configuration);
  const state = {
    match_id: matchId,
    revision: 0,
    ruleset_version: rulesetVersion,
    card_catalog_version: catalogVersion,
    content_version: catalogs?.cards?.domain_content_version ?? catalogs?.content_version ?? 'unversioned',
    ticket_source: deepClone(ticketSource ?? {
      source_type: 'fixed',
      content_version: catalogs?.content_version ?? 'unversioned',
      ticket_definition_ids: ticketSnapshots.map((ticket) => ticket.id),
    }),
    status: 'ACTIVE',
    collaboration_mode: config.collaboration_mode ?? 'competitive',
    configuration: config,
    players: [],
    team_scores: {},
    card_instances: {},
    tickets: {},
    active_ticket_ids: [],
    archived_ticket_ids: [],
    archived_tickets: {},
    ticket_snapshot_queue: [],
    ticket_sequence: 0,
    contribution_ledger: [],
    service_point_events: [],
    closure_statistics: [],
    give_up_statistics: [],
    events: [],
    event_sequence: 0,
    action_records: [],
    processed_requests: {},
    random_state: { seed: String(seed), counters: {} },
    round_number: 1,
    turn_counter: 0,
    turn: null,
    result: null,
    created_at: now,
    updated_at: now,
  };

  const normalizedPlayers = players.map((setup, index) => ({
    player_id: setup.player_id,
    display_name: setup.display_name ?? setup.player_id,
    controller_type: setup.controller_type ?? 'human',
    team_id: state.collaboration_mode === 'cooperative' ? (setup.team_id ?? 'team.cooperative') : null,
    seat_number: setup.seat_number ?? index + 1,
    active: true,
    connection_status: 'CONNECTED',
    service_points: setup.starting_service_points ?? 0,
    deck_snapshot_card_definition_ids: [...decks[setup.player_id]],
    deck_card_instance_ids: [],
    hand_card_instance_ids: [],
    discard_card_instance_ids: [],
    in_play_card_instance_ids: [],
    diagnostic_bench_card_instance_ids: [],
    search_tokens: config.starting_search_tokens,
    max_search_tokens: config.max_search_tokens,
    refresh_tokens: config.starting_refresh_tokens,
    max_refresh_tokens: config.max_refresh_tokens,
    hypotheses: {},
    tickets_closed: 0,
  }));

  for (const player of normalizedPlayers) {
    validateDeck(player.deck_snapshot_card_definition_ids, cards, player.player_id, rulesetVersion);
    const instanceIds = player.deck_snapshot_card_definition_ids.map((cardDefinitionId, index) => {
      const instanceId = `${matchId}.card.${player.player_id}.${String(index + 1).padStart(3, '0')}`;
      state.card_instances[instanceId] = {
        card_instance_id: instanceId,
        card_definition_id: cardDefinitionId,
        owner_player_id: player.player_id,
        controller_player_id: player.player_id,
        zone: 'deck',
        in_play_placement: null,
        effect_state: null,
      };
      return instanceId;
    });
    const shuffled = deterministicShuffle(instanceIds, seed, `setup.deck.${player.player_id}`);
    player.deck_card_instance_ids = shuffled.values;
    if (isDiagnosisV2(rulesetVersion)) {
      const diagnosticIds = [...cards.values()]
        .filter((card) => cardContractType(card) === 'DIAGNOSTIC')
        .map((card) => card.id)
        .sort();
      player.diagnostic_bench_card_instance_ids = diagnosticIds.map((cardDefinitionId, index) => {
        const instanceId = `${matchId}.bench.${player.player_id}.${String(index + 1).padStart(3, '0')}`;
        state.card_instances[instanceId] = {
          card_instance_id: instanceId,
          card_definition_id: cardDefinitionId,
          owner_player_id: player.player_id,
          controller_player_id: player.player_id,
          zone: 'diagnostic_bench',
          in_play_placement: null,
          effect_state: null,
        };
        return instanceId;
      });
    }
    for (let draw = 0; draw < 5; draw += 1) {
      const instanceId = player.deck_card_instance_ids.shift();
      player.hand_card_instance_ids.push(instanceId);
      state.card_instances[instanceId].zone = 'hand';
    }
    state.players.push(player);
    if (player.team_id !== null) {
      state.team_scores[player.team_id] = (state.team_scores[player.team_id] ?? 0) + player.service_points;
    }
  }

  const startingTicketCount = config.starting_ticket_count ?? ticketSnapshots.length;
  if (!Number.isSafeInteger(startingTicketCount) || startingTicketCount < 1
    || startingTicketCount > ticketSnapshots.length) {
    throw new Error('starting_ticket_count requires that many complete Ticket snapshots');
  }
  ticketSnapshots.slice(0, startingTicketCount).forEach((snapshot, index) => {
    const ticket = instantiateTicket(snapshot, matchId, index);
    state.tickets[ticket.ticket_instance_id] = ticket;
    state.active_ticket_ids.push(ticket.ticket_instance_id);
  });
  state.ticket_sequence = startingTicketCount;
  state.ticket_snapshot_queue = ticketSnapshots.slice(startingTicketCount).map(deepClone);

  const eligible = state.players.filter((player) => player.active);
  if (state.collaboration_mode === 'competitive' && eligible.length < 2) throw new Error('Competitive match requires two Players');
  if (eligible.length === 0) throw new Error('Match requires at least one Player');
  const selected = randomInt(seed, 'setup.starting-seat', 0, eligible.length).value;
  const startingPlayer = eligible[selected];
  appendEvent(state, {
    eventType: 'MATCH_STARTED',
    payload: {
      starting_player_id: startingPlayer.player_id,
      ruleset_version: state.ruleset_version,
      card_catalog_version: state.card_catalog_version,
    },
    now,
  });
  startTurn(state, state.players.findIndex((player) => player.player_id === startingPlayer.player_id), now);
  return assertValidState(state);
}

function playerById(state, playerId) {
  return state.players.find((player) => player.player_id === playerId) ?? null;
}

function activeTicket(state, ticketInstanceId) {
  if (!state.active_ticket_ids.includes(ticketInstanceId)) reject('ILLEGAL_TARGET', 'Ticket is not active');
  return state.tickets[ticketInstanceId];
}

function requireActiveTurn(state, playerId) {
  if (state.status !== 'ACTIVE' || !state.turn || state.turn.active_player_id !== playerId) {
    reject('NOT_ACTIVE_PLAYER');
  }
}

function requireCardInHand(state, player, instanceId, cards, expectedActionType) {
  if (!player.hand_card_instance_ids.includes(instanceId)) reject('ILLEGAL_CARD');
  const instance = state.card_instances[instanceId];
  if (!instance || instance.owner_player_id !== player.player_id || instance.zone !== 'hand') reject('ILLEGAL_CARD');
  const card = cards.get(instance.card_definition_id);
  if (!card || cardActionType(card) !== expectedActionType) reject('ILLEGAL_CARD');
  if (![0, 1, 2].includes(cardCost(card))) reject('CONTENT_INVALID');
  if (cardCost(card) > state.turn.actions_remaining) reject('INSUFFICIENT_ACTIONS');
  if (cardCost(card) === 0 && state.turn.zero_action_card_names_played.includes(cardName(card))) {
    reject('ZERO_ACTION_NAME_LIMIT');
  }
  return { instance, card };
}

function requireDiagnosticBenchCard(state, player, instanceId, cards) {
  if (!isDiagnosisV2(state) || !player.diagnostic_bench_card_instance_ids.includes(instanceId)) reject('ILLEGAL_CARD');
  const instance = state.card_instances[instanceId];
  if (!instance || instance.owner_player_id !== player.player_id || instance.zone !== 'diagnostic_bench') reject('ILLEGAL_CARD');
  const card = cards.get(instance.card_definition_id);
  if (!card || cardContractType(card) !== 'DIAGNOSTIC' || cardActionType(card) !== 'RUN_TEST') reject('ILLEGAL_CARD');
  if (![0, 1, 2].includes(cardCost(card))) reject('CONTENT_INVALID');
  if (cardCost(card) > state.turn.actions_remaining) reject('INSUFFICIENT_ACTIONS');
  if (cardCost(card) === 0 && state.turn.zero_action_card_names_played.includes(cardName(card))) {
    reject('ZERO_ACTION_NAME_LIMIT');
  }
  return { instance, card };
}

function spendActions(state, amount) {
  if (state.turn.actions_remaining < amount) reject('INSUFFICIENT_ACTIONS');
  state.turn.actions_remaining -= amount;
  state.turn.actions_spent += amount;
}

function moveCard(state, player, instanceId, fromField, toField, toZone) {
  const at = player[fromField].indexOf(instanceId);
  if (at < 0) reject('ILLEGAL_CARD');
  player[fromField].splice(at, 1);
  player[toField].push(instanceId);
  state.card_instances[instanceId].zone = toZone;
}

function addActionRecord(state, {
  actionId,
  request,
  actorPlayerId,
  ticketInstanceId = null,
  cardInstanceId = null,
  actionCost = 0,
  placeholderEventId = null,
  sourceResultEventId = null,
  now,
}) {
  const record = {
    action_id: actionId,
    request_id: request.request_id,
    actor_player_id: actorPlayerId,
    ticket_instance_id: ticketInstanceId,
    card_instance_id: cardInstanceId,
    action_type: request.action_type,
    action_cost: actionCost,
    placeholder_event_id: placeholderEventId,
    source_result_event_id: sourceResultEventId,
    documented: false,
    created_at: now,
  };
  state.action_records.push(record);
  return record;
}

function defaultEvidenceVisibility(state, player) {
  return state.collaboration_mode === 'cooperative'
    ? { visibility: 'TEAM', visibleToPlayerIds: [], visibleToTeamIds: [player.team_id] }
    : { visibility: 'PRIVATE_PLAYER', visibleToPlayerIds: [player.player_id], visibleToTeamIds: [] };
}

function eventById(state, eventId) {
  return state.events.find((event) => event.event_id === eventId) ?? null;
}

function evidenceAuthorizedForPlayer(state, event, player) {
  if (eventVisibleToPlayer(event, player)) return true;
  return state.events.some((candidate) => candidate.visibility === 'PUBLIC_MATCH'
    && candidate.event_type === 'WORKLOG_PUBLICATION'
    && candidate.payload.source_result_event_id === event.event_id);
}

function maybeAutoEndTurn(state, now) {
  if (!state.turn || state.turn.actions_remaining !== 0 || state.turn.closure_window.is_open) return;
  endTurn(state, 'NO_ACTIONS', now);
}

function nextActiveRosterIndex(state, currentIndex) {
  for (let offset = 1; offset <= state.players.length; offset += 1) {
    const candidate = (currentIndex + offset) % state.players.length;
    if (state.players[candidate].active) return candidate;
  }
  return null;
}

function endTurn(state, reason, now) {
  const ended = state.turn;
  if (!ended) return;
  appendEvent(state, {
    eventType: 'TURN_ENDED',
    actorPlayerId: ended.active_player_id,
    payload: { reason },
    now,
  });
  state.turn = null;
  if (state.status !== 'ACTIVE') return;
  const next = nextActiveRosterIndex(state, ended.roster_index);
  if (next === null) return;
  if (next <= ended.roster_index) state.round_number += 1;
  startTurn(state, next, now);
}

function resultStatistics(state) {
  const byPlayer = new Map(state.players.map((player) => {
    const metrics = {
      TEST: 0,
      ISOLATION: 0,
      REPAIR: 0,
      VERIFY: 0,
      DOCUMENTATION: 0,
      REJECTED_ISOLATION: 0,
    };
    if (isDiagnosisV2(state)) {
      metrics.ELIMINATION = 0;
      metrics.GIVE_UP = 0;
    }
    return [player.player_id, metrics];
  }));
  for (const record of state.action_records) {
    const bucket = byPlayer.get(record.actor_player_id);
    if (!bucket) continue;
    if (['RUN_TEST', 'PLAY_CARD'].includes(record.action_type)) bucket.TEST += 1;
    if (record.action_type === 'COMMIT_ISOLATION') bucket.ISOLATION += 1;
    if (record.action_type === 'PERFORM_REPAIR') bucket.REPAIR += 1;
    if (record.action_type === 'PERFORM_VERIFY') bucket.VERIFY += 1;
    if (record.action_type === 'DOCUMENT_LIVE') bucket.DOCUMENTATION += 1;
    if (record.action_type === 'SET_ELIMINATION') bucket.ELIMINATION += 1;
    if (record.action_type === 'GIVE_UP_TICKET') bucket.GIVE_UP += 1;
  }
  for (const event of state.events.filter((entry) => entry.event_type === 'ISOLATION_NOT_SUPPORTED')) {
    byPlayer.get(event.actor_player_id).REJECTED_ISOLATION += 1;
  }
  const statistics = [];
  for (const [playerId, metrics] of byPlayer) {
    for (const [metric, value] of Object.entries(metrics)) {
      statistics.push({ metric, value, player_id: playerId, team_id: playerById(state, playerId).team_id });
    }
  }
  return statistics;
}

function evaluateTermination(state, now, extraReasons = []) {
  const reasons = [...extraReasons];
  const activePlayers = state.players.filter((player) => player.active);
  if (state.configuration.execution_mode === 'live'
    && activePlayers.every((player) => player.controller_type === 'computer')) reasons.push('NO_HUMANS');
  if (state.collaboration_mode === 'competitive' && activePlayers.length === 1) reasons.push('FORFEIT');
  if (state.configuration.queue_minimum === 0 && state.active_ticket_ids.length === 0) reasons.push('QUEUE_EMPTY');
  if (state.active_ticket_ids.length === 0 && state.give_up_statistics.length > 0) reasons.push('GIVE_UP');
  if (state.configuration.termination_score !== -1) {
    if (state.collaboration_mode === 'cooperative') {
      if (Object.values(state.team_scores).some((score) => score >= state.configuration.termination_score)) {
        reasons.push('SCORE_THRESHOLD');
      }
    } else if (state.players.some((player) => player.service_points >= state.configuration.termination_score)) {
      reasons.push('SCORE_THRESHOLD');
    }
  }
  const uniqueReasons = [...new Set(reasons)];
  if (uniqueReasons.length === 0) return null;

  const invalid = uniqueReasons.includes('ADMIN_INVALIDATION');
  let winnerPlayerIds = [];
  let winningTeamIds = [];
  if (!invalid && !uniqueReasons.includes('NO_HUMANS') && !uniqueReasons.includes('SIMULATION_CAP')
      && !uniqueReasons.includes('GIVE_UP')) {
    if (state.collaboration_mode === 'cooperative') {
      if (uniqueReasons.some((reason) => ['QUEUE_EMPTY', 'SCORE_THRESHOLD'].includes(reason))) {
        const maximum = Math.max(...Object.values(state.team_scores));
        winningTeamIds = Object.entries(state.team_scores).filter(([, score]) => score === maximum).map(([id]) => id);
      }
    } else {
      const contenders = uniqueReasons.includes('FORFEIT') ? activePlayers : state.players;
      const maximum = Math.max(...contenders.map((player) => player.service_points));
      winnerPlayerIds = contenders.filter((player) => player.service_points === maximum).map((player) => player.player_id);
    }
  }
  return {
    valid: !invalid,
    reason_codes: uniqueReasons,
    winner_player_ids: winnerPlayerIds,
    winning_team_ids: winningTeamIds,
    final_player_scores: Object.fromEntries(state.players.map((player) => [player.player_id, player.service_points])),
    final_team_scores: { ...state.team_scores },
    statistics: resultStatistics(state),
    completed_at: now,
  };
}

function safeActionEvents(state, sequenceBefore, player) {
  const all = state.events.filter((event) => event.sequence > sequenceBefore);
  return {
    all,
    publicEvents: all.filter((event) => event.visibility === 'PUBLIC_MATCH').map(deepClone),
    privateEvents: all.filter((event) => event.visibility === 'PRIVATE_PLAYER'
      && event.visible_to_player_ids.includes(player.player_id)).map(deepClone),
    teamEvents: all.filter((event) => event.visibility === 'TEAM'
      && player.team_id !== null && event.visible_to_team_ids.includes(player.team_id)).map(deepClone),
  };
}

function rejectedResult(state, request, code, message = code) {
  return assertPlayerSafe({
    request_id: request?.request_id ?? 'invalid-request',
    accepted: false,
    match_revision_before: state.revision,
    match_revision_after: state.revision,
    payment_applied: false,
    actions_spent: 0,
    utility_resources_spent: { search_tokens: 0, refresh_tokens: 0 },
    public_events: [],
    private_events: [],
    team_events: [],
    error_code: code,
    error_message: message,
    rejected_at: 'BEFORE_PAYMENT',
    recovered_card_instance_id: null,
    opened_resolution_window: 'NONE',
    resolution_code: null,
    target_summary: null,
    result_summary: null,
  });
}

function resolveDiagnostic(context) {
  const { state, request, player, cards, now, actionId } = context;
  const payload = request.payload;
  const ticket = activeTicket(state, payload.ticket_instance_id);
  const { instance, card } = isDiagnosisV2(state)
    ? requireDiagnosticBenchCard(state, player, payload.card_instance_id, cards)
    : requireCardInHand(state, player, payload.card_instance_id, cards, request.action_type);
  if (cardContractType(card) !== 'DIAGNOSTIC') reject('ILLEGAL_CARD');
  const sourceDefinitionId = cardSourceDefinitionId(card);
  if (payload.execution_definition_id !== sourceDefinitionId) reject('ILLEGAL_CARD');
  if (payload.observed_machine_revision !== ticket.machine_revision) reject('STALE_MACHINE_REVISION');
  const targetKind = card.play_contract.target_spec.target_kind;
  let authoredTargetRef = null;
  if (targetKind === 'ACTIVE_TICKET') {
    if (payload.target_ref !== ticket.ticket_instance_id) reject('ILLEGAL_TARGET');
  } else if (targetKind === 'TICKET_COMPONENT') {
    const target = ticket.authored_diagnostic_targets[payload.target_ref];
    if (!target) reject('ILLEGAL_TARGET');
    authoredTargetRef = target.authored_target_ref;
  } else {
    reject('CONTENT_INVALID');
  }
  const outcomes = ticket.definition_snapshot.authored_evidence_outcomes
    .filter((outcome) => outcome.source_definition_id === sourceDefinitionId
      && outcome.eligible_machine_state_key === ticket.machine_state_key
      && (authoredTargetRef === null || outcome.target_ref === authoredTargetRef))
    .sort((left, right) => left.outcome_id.localeCompare(right.outcome_id));
  if (outcomes.length !== 1) reject(outcomes.length === 0 ? 'NO_AUTHORED_OUTCOME' : 'CONTENT_INVALID');
  const outcome = outcomes[0];
  if (ticket.test_history.some((record) => record.outcome_id === outcome.outcome_id
    && record.target_ref === payload.target_ref
    && record.machine_revision === ticket.machine_revision)) {
    reject('IDENTICAL_TEST_NO_NEW_OUTCOME');
  }
  const cost = cardCost(card);
  spendActions(state, cost);
  if (cost === 0) state.turn.zero_action_card_names_played.push(cardName(card));
  if (!isDiagnosisV2(state)) {
    moveCard(state, player, instance.card_instance_id, 'hand_card_instance_ids', 'discard_card_instance_ids', 'discard');
  }
  const placeholder = appendWorklogPlaceholder(state, {
    ticket,
    actorPlayerId: player.player_id,
    actionId,
    sourceName: cardName(card),
    publicTargetSurface: targetKind === 'ACTIVE_TICKET' ? ticket.ticket_instance_id : 'CONCEALED_TICKET_COMPONENT',
    actionCost: cost,
    sourceCardInstanceId: instance.card_instance_id,
    now,
  });
  const audience = defaultEvidenceVisibility(state, player);
  const evidence = appendEvent(state, {
    eventType: 'EVIDENCE_CREATED',
    actorPlayerId: player.player_id,
    ticketInstanceId: ticket.ticket_instance_id,
    actionId,
    ...audience,
    payload: {
      outcome_id: outcome.outcome_id,
      source_definition_id: sourceDefinitionId,
      candidate_effects: deepClone(outcome.candidate_effects),
      observation_id: outcome.observation_id ?? null,
      public_summary: outcome.public_summary,
      target_ref: payload.target_ref,
      machine_revision: ticket.machine_revision,
      ...(isDiagnosisV2(state) ? {
        diagnosis_revision: ticket.diagnosis_revision,
        outcome_classification: outcome.outcome_classification ?? 'CANDIDATE_EFFECT',
      } : {}),
    },
    now,
  });
  ticket.worklog_entries.at(-1).source_result_event_id = evidence.event_id;
  ticket.test_history.push({
    action_id: actionId,
    placeholder_event_id: placeholder.event_id,
    evidence_event_id: evidence.event_id,
    outcome_id: outcome.outcome_id,
    source_definition_id: sourceDefinitionId,
    target_ref: payload.target_ref,
    machine_revision: ticket.machine_revision,
    diagnosis_revision: ticket.diagnosis_revision,
  });
  addActionRecord(state, {
    actionId,
    request,
    actorPlayerId: player.player_id,
    ticketInstanceId: ticket.ticket_instance_id,
    cardInstanceId: instance.card_instance_id,
    actionCost: cost,
    placeholderEventId: placeholder.event_id,
    sourceResultEventId: evidence.event_id,
    now,
  });
  maybeAutoEndTurn(state, now);
  return {
    actionsSpent: cost,
    resolutionCode: 'RESOLVED',
    targetSummary: `Diagnostic target ${payload.target_ref} on ${ticket.ticket_instance_id}.`,
    resultSummary: outcome.public_summary,
  };
}

function reviseHypothesis(context) {
  const { state, request, player, now, actionId } = context;
  const { ticket_instance_id: ticketId, candidate_fault_ids: candidateIds } = request.payload;
  const ticket = activeTicket(state, ticketId);
  if (!Array.isArray(candidateIds) || candidateIds.length > 2 || new Set(candidateIds).size !== candidateIds.length
    || candidateIds.some((id) => !ticket.public_candidate_fault_ids.includes(id))) reject('ILLEGAL_TARGET');
  if (canonicalJson(player.hypotheses[ticketId] ?? []) === canonicalJson(candidateIds)) reject('NO_CHANGE');
  player.hypotheses[ticketId] = [...candidateIds];
  const audience = defaultEvidenceVisibility(state, player);
  appendEvent(state, {
    eventType: 'HYPOTHESIS_REVISED',
    actorPlayerId: player.player_id,
    ticketInstanceId: ticketId,
    actionId,
    ...audience,
    payload: { candidate_fault_ids: [...candidateIds] },
    now,
  });
  addActionRecord(state, {
    actionId,
    request,
    actorPlayerId: player.player_id,
    ticketInstanceId: ticketId,
    now,
  });
  return { actionsSpent: 0, resolutionCode: 'RESOLVED' };
}

function candidateDisposition(event, candidateFaultId) {
  return event?.payload?.candidate_effects?.find(
    (effect) => effect.candidate_fault_id === candidateFaultId,
  )?.disposition ?? null;
}

function evidenceIsCurrent(ticket, event) {
  if (!event || event.payload?.machine_revision !== ticket.machine_revision) return false;
  if (!isDiagnosisV2(ticket.definition_snapshot.ruleset_version ?? 'first-version-v1')) return true;
  return event.payload?.diagnosis_revision === ticket.diagnosis_revision;
}

function latestElimination(ticket, candidateFaultId, player) {
  return [...ticket.elimination_history].reverse().find((record) =>
    record.candidate_fault_id === candidateFaultId
      && record.diagnosis_revision === ticket.diagnosis_revision
      && (record.visibility === 'TEAM'
        ? player.team_id !== null && record.visible_to_team_ids.includes(player.team_id)
        : record.visible_to_player_ids.includes(player.player_id))) ?? null;
}

function setElimination(context) {
  const { state, request, player, now, actionId } = context;
  if (!isDiagnosisV2(state)) reject('UNSUPPORTED_ACTION_TYPE');
  const payload = request.payload;
  const ticket = activeTicket(state, payload.ticket_instance_id);
  if (!['DIAGNOSIS', 'RETURNED_TO_DIAGNOSIS'].includes(ticket.status)) reject('ILLEGAL_TIMING');
  if (!ticket.public_candidate_fault_ids.includes(payload.candidate_fault_id)
      || typeof payload.eliminated !== 'boolean'
      || !Array.isArray(payload.cited_evidence_event_ids)
      || new Set(payload.cited_evidence_event_ids).size !== payload.cited_evidence_event_ids.length) {
    reject('ILLEGAL_TARGET');
  }
  const previous = latestElimination(ticket, payload.candidate_fault_id, player);
  if (previous?.eliminated === payload.eliminated) reject('NO_CHANGE');
  const cited = payload.cited_evidence_event_ids.map((id) => eventById(state, id));
  if (payload.eliminated) {
    if (cited.length === 0 || cited.some((event) => !event
      || !evidenceAuthorizedForPlayer(state, event, player)
      || !['EVIDENCE_CREATED', 'VERIFY_EVIDENCE_CREATED'].includes(event.event_type)
      || event.ticket_instance_id !== ticket.ticket_instance_id
      || !evidenceIsCurrent(ticket, event)
      || candidateDisposition(event, payload.candidate_fault_id) !== 'RULE_OUT')) {
      reject('ELIMINATION_NOT_SUPPORTED');
    }
  } else if (cited.length !== 0) {
    reject('ILLEGAL_TARGET');
  }
  const audience = defaultEvidenceVisibility(state, player);
  const event = appendEvent(state, {
    eventType: 'CANDIDATE_ELIMINATION_SET',
    actorPlayerId: player.player_id,
    ticketInstanceId: ticket.ticket_instance_id,
    actionId,
    ...audience,
    payload: {
      candidate_fault_id: payload.candidate_fault_id,
      eliminated: payload.eliminated,
      cited_evidence_event_ids: [...payload.cited_evidence_event_ids],
      diagnosis_revision: ticket.diagnosis_revision,
      supersedes_elimination_event_id: previous?.elimination_event_id ?? null,
    },
    now,
  });
  ticket.elimination_history.push({
    elimination_event_id: event.event_id,
    player_id: player.player_id,
    candidate_fault_id: payload.candidate_fault_id,
    eliminated: payload.eliminated,
    cited_evidence_event_ids: [...payload.cited_evidence_event_ids],
    diagnosis_revision: ticket.diagnosis_revision,
    visibility: audience.visibility,
    visible_to_player_ids: [...audience.visibleToPlayerIds],
    visible_to_team_ids: [...audience.visibleToTeamIds],
    supersedes_elimination_event_id: previous?.elimination_event_id ?? null,
    recorded_at: now,
  });
  addActionRecord(state, {
    actionId,
    request,
    actorPlayerId: player.player_id,
    ticketInstanceId: ticket.ticket_instance_id,
    sourceResultEventId: event.event_id,
    now,
  });
  return {
    actionsSpent: 0,
    resolutionCode: 'RESOLVED',
    targetSummary: `${payload.candidate_fault_id} on ${ticket.ticket_instance_id}.`,
    resultSummary: payload.eliminated ? 'Candidate marked ruled out for the current diagnosis stage.' : 'Candidate elimination reversed.',
  };
}

function matchingIsolationRequirement(state, ticket, candidateFaultId, citedEvents, player) {
  const matching = [];
  for (const requirement of ticket.definition_snapshot.isolation_requirements) {
    if (requirement.candidate_fault_id !== candidateFaultId) continue;
    const fault = ticket.fault_instances[requirement.target_fault_instance_key];
    if (!fault?.actionable || fault.machine_status !== 'ACTIVE') continue;
    if (!Array.isArray(requirement.routes)) {
      const eligibleIds = new Set([
        ...(requirement.eligible_outcome_ids ?? []),
        ...(requirement.eligible_verification_outcome_ids ?? []),
      ]);
      const qualifyingCount = citedEvents.filter((event) => eligibleIds.has(event.payload.outcome_id)).length;
      if (qualifyingCount >= requirement.minimum_citations) {
        matching.push({ ...requirement, matched_route: null, decisive_events: citedEvents.filter((event) => eligibleIds.has(event.payload.outcome_id)) });
      }
      continue;
    }
    const citedIds = new Set(citedEvents.map((event) => event.event_id));
    const routes = [...requirement.routes].sort((left, right) => left.route_id.localeCompare(right.route_id));
    for (const route of routes) {
      let decisive = [];
      if (['DIRECT_OBSERVATION', 'DEFINITIVE_DIAGNOSTIC', 'RECOVERY_DERIVED'].includes(route.route_kind)) {
        const eligible = new Set([
          ...(route.eligible_outcome_ids ?? []),
          ...(route.eligible_verification_outcome_ids ?? []),
        ]);
        decisive = citedEvents.filter((event) => eligible.has(event.payload.outcome_id)
          && evidenceIsCurrent(ticket, event)
          && candidateDisposition(event, candidateFaultId) === 'CONFIRM');
        if (decisive.length < 1) continue;
      } else if (route.route_kind === 'CORROBORATED_SUPPORT') {
        const eligible = new Set(route.eligible_outcome_ids ?? []);
        decisive = citedEvents.filter((event) => eligible.has(event.payload.outcome_id)
          && evidenceIsCurrent(ticket, event)
          && candidateDisposition(event, candidateFaultId) === 'SUPPORT');
        if (new Set(decisive.map((event) => event.payload.outcome_id)).size < route.minimum_distinct_outcomes) continue;
      } else if (route.route_kind === 'EVIDENCE_BACKED_ELIMINATION') {
        const supporting = new Set(route.supporting_outcome_ids ?? []);
        decisive = citedEvents.filter((event) => supporting.has(event.payload.outcome_id)
          && evidenceIsCurrent(ticket, event)
          && ['SUPPORT', 'CONFIRM'].includes(candidateDisposition(event, candidateFaultId)));
        if (decisive.length < 1) continue;
        const eliminationRecords = route.required_eliminated_candidate_fault_ids.map((id) => latestElimination(ticket, id, player));
        if (eliminationRecords.some((record) => !record?.eliminated
          || record.cited_evidence_event_ids.some((id) => !citedIds.has(id)))) continue;
        decisive.push(...eliminationRecords.flatMap((record) => record.cited_evidence_event_ids.map((id) => eventById(state, id))));
      } else continue;
      matching.push({
        ...requirement,
        matched_route: route,
        decisive_events: [...new Map(decisive.filter(Boolean).map((event) => [event.event_id, event])).values()],
      });
      break;
    }
  }
  if (matching.length > 1) reject('CONTENT_INVALID');
  return matching[0] ?? null;
}

function commitIsolation(context) {
  const { state, request, player, now, actionId } = context;
  const payload = request.payload;
  const ticket = activeTicket(state, payload.ticket_instance_id);
  if (!['DIAGNOSIS', 'RETURNED_TO_DIAGNOSIS'].includes(ticket.status)) reject('ILLEGAL_TIMING');
  if (!ticket.public_candidate_fault_ids.includes(payload.candidate_fault_id)
    || !Array.isArray(payload.cited_evidence_event_ids)
    || payload.cited_evidence_event_ids.length === 0
    || new Set(payload.cited_evidence_event_ids).size !== payload.cited_evidence_event_ids.length) {
    reject('ILLEGAL_TARGET');
  }
  const citedEvents = payload.cited_evidence_event_ids.map((id) => eventById(state, id));
  if (citedEvents.some((event) => !event || !evidenceAuthorizedForPlayer(state, event, player)
    || !['EVIDENCE_CREATED', 'VERIFY_EVIDENCE_CREATED'].includes(event.event_type)
    || event.ticket_instance_id !== ticket.ticket_instance_id)) reject('ILLEGAL_TARGET');
  spendActions(state, 1);
  const placeholder = appendWorklogPlaceholder(state, {
    ticket,
    actorPlayerId: player.player_id,
    actionId,
    sourceName: 'Commit Isolation',
    publicTargetSurface: ticket.ticket_instance_id,
    actionCost: 1,
    now,
  });
  const requirement = matchingIsolationRequirement(state, ticket, payload.candidate_fault_id, citedEvents, player);
  const fault = requirement ? ticket.fault_instances[requirement.target_fault_instance_key] : null;
  const accepted = Boolean(requirement && fault?.actionable && fault.machine_status === 'ACTIVE');

  if (!accepted) {
    const resultEvent = appendEvent(state, {
      eventType: 'ISOLATION_NOT_SUPPORTED',
      actorPlayerId: player.player_id,
      ticketInstanceId: ticket.ticket_instance_id,
      actionId,
      payload: { response_code: 'ISOLATION_NOT_SUPPORTED' },
      now,
    });
    ticket.worklog_entries.at(-1).source_result_event_id = resultEvent.event_id;
    ticket.isolation_history.push({
      isolation_event_id: resultEvent.event_id,
      player_id: player.player_id,
      candidate_fault_id: payload.candidate_fault_id,
      cited_evidence_event_ids: [...payload.cited_evidence_event_ids],
      accepted: false,
      classification: null,
      public_fault_instance_id: null,
      target_fault_instance_key: null,
      committed_at: now,
    });
    addActionRecord(state, {
      actionId,
      request,
      actorPlayerId: player.player_id,
      ticketInstanceId: ticket.ticket_instance_id,
      actionCost: 1,
      placeholderEventId: placeholder.event_id,
      sourceResultEventId: resultEvent.event_id,
      now,
    });
    maybeAutoEndTurn(state, now);
    return {
      actionsSpent: 1,
      resolutionCode: 'ISOLATION_NOT_SUPPORTED',
      targetSummary: `${payload.candidate_fault_id} on ${ticket.ticket_instance_id}.`,
      resultSummary: 'Isolation was not supported; no prerequisite detail was disclosed.',
    };
  }

  const decisiveIds = new Set([
    ...(requirement.eligible_outcome_ids ?? []),
    ...(requirement.eligible_verification_outcome_ids ?? []),
  ]);
  const decisiveEvents = requirement.decisive_events
    ?? citedEvents.filter((event) => decisiveIds.has(event.payload.outcome_id));
  const publicCitations = decisiveEvents
    .filter((event) => event.visibility === 'PUBLIC_MATCH')
    .map((event) => event.event_id);
  const resultEvent = appendEvent(state, {
    eventType: 'ISOLATION_ACCEPTED',
    actorPlayerId: player.player_id,
    ticketInstanceId: ticket.ticket_instance_id,
    actionId,
    payload: {
      candidate_fault_id: payload.candidate_fault_id,
      public_fault_instance_id: fault.fault_instance_id,
      classification: requirement.classification,
      cited_public_evidence_event_ids: publicCitations,
      cited_evidence_count: decisiveEvents.length,
      ...(isDiagnosisV2(state) ? {
        isolation_route_id: requirement.matched_route?.route_id ?? null,
        contributing_player_ids: [...new Set(decisiveEvents.map((event) => event.actor_player_id).filter(Boolean))].sort(),
      } : {}),
    },
    now,
  });
  ticket.worklog_entries.at(-1).source_result_event_id = resultEvent.event_id;
  const record = {
    isolation_event_id: resultEvent.event_id,
    isolation_requirement_id: requirement.requirement_id,
    isolation_route_id: requirement.matched_route?.route_id ?? null,
    player_id: player.player_id,
    candidate_fault_id: payload.candidate_fault_id,
    cited_evidence_event_ids: decisiveEvents.map((event) => event.event_id),
    accepted: true,
    classification: requirement.classification,
    public_fault_instance_id: fault.fault_instance_id,
    target_fault_instance_key: requirement.target_fault_instance_key,
    committed_at: now,
  };
  ticket.isolation_history.push(record);
  ticket.current_repair_gate_isolation_event_id = record.isolation_event_id;
  ticket.accepted_path_isolation_event_ids.push(record.isolation_event_id);
  ticket.status = 'REPAIR_READY';
  const slotKey = `${ticket.ticket_instance_id}.${requirement.target_fault_instance_key}.ISOLATION`;
  if (!state.contribution_ledger.some((entry) => entry.slot_key === slotKey)) {
    state.contribution_ledger.push({
      contribution_id: `${ticket.ticket_instance_id}.contribution.${state.contribution_ledger.length + 1}`,
      ticket_instance_id: ticket.ticket_instance_id,
      source_event_id: resultEvent.event_id,
      contributor_player_id: player.player_id,
      fault_instance_key: requirement.target_fault_instance_key,
      contribution_class: 'ISOLATION',
      slot_key: slotKey,
      point_value: 1,
      settlement_status: 'PENDING',
      score_event_id: null,
    });
  }
  addActionRecord(state, {
    actionId,
    request,
    actorPlayerId: player.player_id,
    ticketInstanceId: ticket.ticket_instance_id,
    actionCost: 1,
    placeholderEventId: placeholder.event_id,
    sourceResultEventId: resultEvent.event_id,
    now,
  });
  maybeAutoEndTurn(state, now);
  return {
    actionsSpent: 1,
    resolutionCode: 'RESOLVED',
    targetSummary: `${payload.candidate_fault_id} on ${ticket.ticket_instance_id}.`,
    resultSummary: `Isolation accepted through ${requirement.matched_route?.route_kind ?? 'legacy evidence threshold'}.`,
  };
}

function performRepair(context) {
  const { state, request, player, cards, now, actionId } = context;
  const payload = request.payload;
  const ticket = activeTicket(state, payload.ticket_instance_id);
  if (!['REPAIR_READY', 'AWAITING_VERIFY'].includes(ticket.status)
    || ticket.current_repair_gate_isolation_event_id === null) reject('REPAIR_GATE_NOT_SATISFIED');
  const gate = ticket.isolation_history.find(
    (record) => record.isolation_event_id === ticket.current_repair_gate_isolation_event_id,
  );
  if (!gate?.accepted || payload.isolated_fault_instance_id !== gate.public_fault_instance_id) {
    reject('REPAIR_GATE_NOT_SATISFIED');
  }
  const { instance, card } = requireCardInHand(state, player, payload.card_instance_id, cards, 'PERFORM_REPAIR');
  if (cardContractType(card) !== 'REPAIR') reject('ILLEGAL_CARD');
  const procedureId = cardSourceDefinitionId(card);
  if (payload.repair_procedure_id !== procedureId) reject('ILLEGAL_CARD');
  const allowedFaults = card.play_contract.target_spec.allowed_fault_definition_ids;
  if (!allowedFaults.includes(gate.candidate_fault_id)) reject('ILLEGAL_TARGET');
  const pathRequirement = ticket.definition_snapshot.repair_requirements.find(
    (requirement) => requirement.target_fault_instance_key === gate.target_fault_instance_key
      && requirement.eligible_repair_procedure_ids.includes(procedureId),
  );
  if (!pathRequirement) reject('ILLEGAL_TARGET');
  const outcomes = ticket.definition_snapshot.authored_repair_outcomes
    .filter((outcome) => outcome.repair_procedure_id === procedureId
      && outcome.eligible_machine_state_key === ticket.machine_state_key)
    .sort((left, right) => left.outcome_id.localeCompare(right.outcome_id));
  if (outcomes.length !== 1) reject(outcomes.length === 0 ? 'NO_AUTHORED_OUTCOME' : 'CONTENT_INVALID');
  const outcome = outcomes[0];
  const cost = cardCost(card);
  spendActions(state, cost);
  moveCard(state, player, instance.card_instance_id, 'hand_card_instance_ids', 'discard_card_instance_ids', 'discard');
  const placeholder = appendWorklogPlaceholder(state, {
    ticket,
    actorPlayerId: player.player_id,
    actionId,
    sourceName: cardName(card),
    publicTargetSurface: ticket.ticket_instance_id,
    actionCost: cost,
    sourceCardInstanceId: instance.card_instance_id,
    now,
  });
  const beforeState = ticket.machine_state_key;
  ticket.machine_state_key = outcome.resulting_machine_state_key;
  ticket.machine_revision += 1;
  if (isDiagnosisV2(state)) ticket.diagnosis_revision += 1;
  for (const key of outcome.resolved_fault_instance_keys) {
    if (ticket.fault_instances[key]) ticket.fault_instances[key].machine_status = 'RESOLVED';
  }
  for (const verify of ticket.verification_history) verify.is_current = false;
  ticket.current_verify_pass_event_ids = [];
  const repairEvent = appendEvent(state, {
    eventType: 'MACHINE_STATE_CHANGED',
    actorPlayerId: player.player_id,
    ticketInstanceId: ticket.ticket_instance_id,
    actionId,
    payload: {
      repair_procedure_id: procedureId,
      public_summary: outcome.public_summary,
      machine_revision: ticket.machine_revision,
    },
    now,
  });
  ticket.worklog_entries.at(-1).source_result_event_id = repairEvent.event_id;
  ticket.worklog_entries.at(-1).public_result_summary = outcome.public_summary;
  const record = {
    repair_event_id: repairEvent.event_id,
    repair_outcome_id: outcome.outcome_id,
    player_id: player.player_id,
    isolation_event_id: gate.isolation_event_id,
    card_instance_id: instance.card_instance_id,
    repair_procedure_id: procedureId,
    target_fault_instance_key: outcome.target_fault_instance_key,
    machine_state_before: beforeState,
    machine_state_after: ticket.machine_state_key,
    machine_revision: ticket.machine_revision,
    necessary_for_closure: outcome.necessary_for_closure,
    public_summary: outcome.public_summary,
    repaired_at: now,
  };
  ticket.repair_history.push(record);
  ticket.accepted_path_repair_event_ids.push(record.repair_event_id);
  ticket.status = 'AWAITING_VERIFY';
  const targetFault = ticket.fault_instances[outcome.target_fault_instance_key];
  if (outcome.necessary_for_closure && targetFault?.actionable) {
    const slotKey = `${ticket.ticket_instance_id}.${outcome.target_fault_instance_key}.REPAIR`;
    if (!state.contribution_ledger.some((entry) => entry.slot_key === slotKey)) {
      state.contribution_ledger.push({
        contribution_id: `${ticket.ticket_instance_id}.contribution.${state.contribution_ledger.length + 1}`,
        ticket_instance_id: ticket.ticket_instance_id,
        source_event_id: repairEvent.event_id,
        contributor_player_id: player.player_id,
        fault_instance_key: outcome.target_fault_instance_key,
        contribution_class: 'REPAIR',
        slot_key: slotKey,
        point_value: 1,
        settlement_status: 'PENDING',
        score_event_id: null,
      });
    }
  }
  addActionRecord(state, {
    actionId,
    request,
    actorPlayerId: player.player_id,
    ticketInstanceId: ticket.ticket_instance_id,
    cardInstanceId: instance.card_instance_id,
    actionCost: cost,
    placeholderEventId: placeholder.event_id,
    sourceResultEventId: repairEvent.event_id,
    now,
  });
  maybeAutoEndTurn(state, now);
  return {
    actionsSpent: cost,
    resolutionCode: 'RESOLVED',
    targetSummary: `${gate.candidate_fault_id} on ${ticket.ticket_instance_id}.`,
    resultSummary: outcome.public_summary,
  };
}

function performVerify(context) {
  const { state, request, player, cards, now, actionId } = context;
  const payload = request.payload;
  const ticket = activeTicket(state, payload.ticket_instance_id);
  if (ticket.status !== 'AWAITING_VERIFY' || ticket.repair_history.length === 0) reject('VERIFY_NOT_READY');
  const { instance, card } = requireCardInHand(state, player, payload.card_instance_id, cards, 'PERFORM_VERIFY');
  if (cardContractType(card) !== 'VERIFY') reject('ILLEGAL_CARD');
  const procedureId = cardSourceDefinitionId(card);
  if (payload.validation_procedure_id !== procedureId) reject('ILLEGAL_CARD');
  const outcomes = ticket.definition_snapshot.authored_verification_outcomes
    .filter((outcome) => outcome.validation_procedure_id === procedureId
      && outcome.eligible_machine_state_key === ticket.machine_state_key)
    .sort((left, right) => left.outcome_id.localeCompare(right.outcome_id));
  if (outcomes.length !== 1) reject(outcomes.length === 0 ? 'NO_AUTHORED_OUTCOME' : 'CONTENT_INVALID');
  const outcome = outcomes[0];
  const requirement = ticket.definition_snapshot.verification_requirements.find(
    (entry) => entry.requirement_id === outcome.requirement_id
      && entry.validation_procedure_id === procedureId,
  );
  if (!requirement) reject('CONTENT_INVALID');
  const cost = cardCost(card);
  spendActions(state, cost);
  moveCard(state, player, instance.card_instance_id, 'hand_card_instance_ids', 'discard_card_instance_ids', 'discard');
  const placeholder = appendWorklogPlaceholder(state, {
    ticket,
    actorPlayerId: player.player_id,
    actionId,
    sourceName: cardName(card),
    publicTargetSurface: ticket.ticket_instance_id,
    actionCost: cost,
    sourceCardInstanceId: instance.card_instance_id,
    now,
  });
  if (outcome.resulting_machine_state_key !== ticket.machine_state_key) {
    ticket.machine_state_key = outcome.resulting_machine_state_key;
    ticket.machine_revision += 1;
    for (const verify of ticket.verification_history) verify.is_current = false;
    ticket.current_verify_pass_event_ids = [];
  }
  if (isDiagnosisV2(state) && ['FAIL', 'INCONCLUSIVE'].includes(outcome.result)) {
    ticket.diagnosis_revision += 1;
  }
  const verifyEvent = appendEvent(state, {
    eventType: 'VERIFY_RESOLVED',
    actorPlayerId: player.player_id,
    ticketInstanceId: ticket.ticket_instance_id,
    actionId,
    payload: {
      validation_procedure_id: procedureId,
      requirement_id: outcome.requirement_id,
      result: outcome.result,
      public_summary: outcome.public_summary,
      machine_revision: ticket.machine_revision,
      ...(isDiagnosisV2(state) ? { diagnosis_revision: ticket.diagnosis_revision } : {}),
    },
    now,
  });
  ticket.worklog_entries.at(-1).source_result_event_id = verifyEvent.event_id;
  ticket.worklog_entries.at(-1).public_result_summary = outcome.public_summary;
  const audience = defaultEvidenceVisibility(state, player);
  const evidenceEvent = appendEvent(state, {
    eventType: 'VERIFY_EVIDENCE_CREATED',
    actorPlayerId: player.player_id,
    ticketInstanceId: ticket.ticket_instance_id,
    actionId,
    ...audience,
    payload: {
      outcome_id: outcome.outcome_id,
      source_definition_id: procedureId,
      candidate_effects: deepClone(outcome.candidate_effects ?? []),
      machine_revision: ticket.machine_revision,
      ...(isDiagnosisV2(state) ? { diagnosis_revision: ticket.diagnosis_revision } : {}),
    },
    now,
  });
  for (const previous of ticket.verification_history) {
    if (previous.requirement_id === outcome.requirement_id) previous.is_current = false;
  }
  const verifyRecord = {
    verify_event_id: verifyEvent.event_id,
    evidence_event_id: evidenceEvent.event_id,
    player_id: player.player_id,
    validation_procedure_id: procedureId,
    requirement_id: outcome.requirement_id,
    result: outcome.result,
    machine_revision: ticket.machine_revision,
    diagnosis_revision: ticket.diagnosis_revision,
    is_current: outcome.result === 'PASS',
    verified_at: now,
  };
  ticket.verification_history.push(verifyRecord);
  addActionRecord(state, {
    actionId,
    request,
    actorPlayerId: player.player_id,
    ticketInstanceId: ticket.ticket_instance_id,
    cardInstanceId: instance.card_instance_id,
    actionCost: cost,
    placeholderEventId: placeholder.event_id,
    sourceResultEventId: evidenceEvent.event_id,
    now,
  });

  if (['FAIL', 'INCONCLUSIVE'].includes(outcome.result)) {
    const invalidated = ticket.current_verify_pass_event_ids.filter((id) => id !== verifyEvent.event_id);
    for (const record of ticket.verification_history) record.is_current = false;
    ticket.current_verify_pass_event_ids = [];
    ticket.current_repair_gate_isolation_event_id = null;
    for (const faultId of outcome.revealed_candidate_fault_ids ?? []) {
      if (!ticket.public_candidate_fault_ids.includes(faultId)) ticket.public_candidate_fault_ids.push(faultId);
    }
    const returned = appendEvent(state, {
      eventType: 'TICKET_RETURNED_TO_DIAGNOSIS',
      actorPlayerId: player.player_id,
      ticketInstanceId: ticket.ticket_instance_id,
      actionId,
      payload: {
        failed_verify_event_id: verifyEvent.event_id,
        invalidated_pass_event_ids: invalidated,
        revealed_candidate_fault_ids: [...(outcome.revealed_candidate_fault_ids ?? [])],
      },
      now,
    });
    ticket.return_to_diagnosis_history.push({
      return_event_id: returned.event_id,
      failed_verify_event_id: verifyEvent.event_id,
      invalidated_pass_event_ids: invalidated,
      returned_at: now,
    });
    ticket.status = 'RETURNED_TO_DIAGNOSIS';
  } else {
    ticket.current_verify_pass_event_ids = ticket.verification_history
      .filter((record) => record.result === 'PASS' && record.is_current
        && record.machine_revision === ticket.machine_revision)
      .map((record) => record.verify_event_id);
    const currentRequirements = new Set(ticket.verification_history
      .filter((record) => record.result === 'PASS' && record.is_current
        && record.machine_revision === ticket.machine_revision)
      .map((record) => record.requirement_id));
    const complete = ticket.definition_snapshot.verification_requirements
      .every((entry) => currentRequirements.has(entry.requirement_id));
    if (complete) {
      ticket.status = 'READY_TO_CLOSE';
      state.turn.phase = 'CLOSURE_RESOLUTION';
      state.turn.closure_window = {
        is_open: true,
        eligible_ticket_instance_ids: [ticket.ticket_instance_id],
        opened_by_verify_event_id: verifyEvent.event_id,
      };
    }
  }
  maybeAutoEndTurn(state, now);
  return {
    actionsSpent: cost,
    resolutionCode: 'RESOLVED',
    targetSummary: `Verification ${procedureId} on ${ticket.ticket_instance_id}.`,
    resultSummary: outcome.public_summary,
    openedResolutionWindow: ticket.status === 'READY_TO_CLOSE' ? 'CLOSURE' : 'NONE',
  };
}

function documentLive(context) {
  const { state, request, player, now, actionId } = context;
  const payload = request.payload;
  const ticket = activeTicket(state, payload.ticket_instance_id);
  const source = state.action_records.find((record) => record.placeholder_event_id === payload.source_action_event_id
    && record.placeholder_event_id === payload.worklog_placeholder_event_id
    && record.source_result_event_id === payload.source_result_event_id
    && record.ticket_instance_id === ticket.ticket_instance_id);
  if (!source || source.documented || source.card_instance_id === null) reject('ILLEGAL_DOCUMENT_SOURCE');
  const resultEvent = eventById(state, source.source_result_event_id);
  if (!resultEvent || !eventVisibleToPlayer(resultEvent, player)) reject('ILLEGAL_DOCUMENT_SOURCE');
  const sourceInstance = state.card_instances[source.card_instance_id];
  const owner = sourceInstance ? playerById(state, sourceInstance.owner_player_id) : null;
  const persistentBenchSource = isDiagnosisV2(state)
    && sourceInstance?.zone === 'diagnostic_bench'
    && owner?.diagnostic_bench_card_instance_ids.includes(sourceInstance.card_instance_id);
  if (!sourceInstance || !owner || (!persistentBenchSource
    && (sourceInstance.zone !== 'discard'
      || !owner.discard_card_instance_ids.includes(sourceInstance.card_instance_id)))) {
    reject('ILLEGAL_DOCUMENT_SOURCE');
  }
  spendActions(state, 1);
  const ownPlaceholder = appendWorklogPlaceholder(state, {
    ticket,
    actorPlayerId: player.player_id,
    actionId,
    sourceName: 'Document Live',
    publicTargetSurface: payload.worklog_placeholder_event_id,
    actionCost: 1,
    now,
  });
  const originalEntry = ticket.worklog_entries.find(
    (entry) => entry.placeholder_event_id === payload.worklog_placeholder_event_id,
  );
  if (!originalEntry || originalEntry.publication_event_id !== null) reject('ILLEGAL_DOCUMENT_SOURCE');
  const publicSummary = resultEvent.payload.public_summary
    ?? `${originalEntry.source_name} produced documented structured Evidence.`;
  const publication = appendEvent(state, {
    eventType: 'WORKLOG_PUBLICATION',
    actorPlayerId: player.player_id,
    ticketInstanceId: ticket.ticket_instance_id,
    actionId,
    payload: {
      source_action_event_id: payload.source_action_event_id,
      source_result_event_id: payload.source_result_event_id,
      recovered_card_instance_id: persistentBenchSource ? null : sourceInstance.card_instance_id,
      published_result: {
        source_definition_id: resultEvent.payload.source_definition_id ?? null,
        candidate_effects: deepClone(resultEvent.payload.candidate_effects ?? []),
        observation_id: resultEvent.payload.observation_id ?? null,
        result: resultEvent.payload.result ?? null,
      },
    },
    now,
  });
  publication.worklog_projection = {
    placeholder_event_id: originalEntry.placeholder_event_id,
    source_action_event_id: payload.source_action_event_id,
    source_result_event_id: resultEvent.event_id,
    public_summary: publicSummary,
    action_time: originalEntry.action_time,
    publication_event_id: publication.event_id,
    publication_time: now,
    publisher_player_id: player.player_id,
    locked: false,
  };
  publication.action_time = originalEntry.action_time;
  publication.publication_time = now;
  originalEntry.source_result_event_id = resultEvent.event_id;
  originalEntry.public_result_summary = publicSummary;
  originalEntry.publication_event_id = publication.event_id;
  originalEntry.publication_time = now;
  originalEntry.publisher_player_id = player.player_id;
  ticket.worklog_entries.at(-1).source_result_event_id = publication.event_id;
  const publicationTrace = `Published ${originalEntry.source_name} result from Worklog #${originalEntry.sequence}.`;
  ticket.worklog_entries.at(-1).public_result_summary = publicationTrace;
  source.documented = true;
  if (!persistentBenchSource) {
    moveCard(
      state,
      owner,
      sourceInstance.card_instance_id,
      'discard_card_instance_ids',
      'hand_card_instance_ids',
      'hand',
    );
  }
  ticket.documentation_publications.push({
    publication_event_id: publication.event_id,
    source_action_event_id: payload.source_action_event_id,
    source_result_event_id: payload.source_result_event_id,
    publisher_player_id: player.player_id,
    recovered_card_instance_id: persistentBenchSource ? null : sourceInstance.card_instance_id,
    published_at: now,
  });
  addActionRecord(state, {
    actionId,
    request,
    actorPlayerId: player.player_id,
    ticketInstanceId: ticket.ticket_instance_id,
    actionCost: 1,
    placeholderEventId: ownPlaceholder.event_id,
    sourceResultEventId: publication.event_id,
    now,
  });
  maybeAutoEndTurn(state, now);
  return {
    actionsSpent: 1,
    resolutionCode: 'RESOLVED',
    recoveredCardInstanceId: persistentBenchSource ? null : sourceInstance.card_instance_id,
    targetSummary: `Worklog result ${payload.source_result_event_id} on ${ticket.ticket_instance_id}.`,
    resultSummary: persistentBenchSource
      ? `${publicationTrace} The persistent Diagnostic Bench item remained available.`
      : `${publicationTrace} The source response Card returned to hand.`,
  };
}

function searchDeck(context) {
  const { state, request, player, now, actionId } = context;
  if (state.turn.actions_remaining < 1) reject('INSUFFICIENT_ACTIONS');
  if (player.search_tokens < 1) reject('INSUFFICIENT_UTILITY_RESOURCE');
  const selectedId = player.deck_card_instance_ids.find(
    (id) => state.card_instances[id].card_definition_id === request.payload.selected_card_definition_id,
  );
  if (!selectedId) reject('ILLEGAL_TARGET');
  const countsBefore = {
    hand: player.hand_card_instance_ids.length,
    deck: player.deck_card_instance_ids.length,
    tokens: player.search_tokens,
  };
  spendActions(state, 1);
  player.search_tokens -= 1;
  moveCard(state, player, selectedId, 'deck_card_instance_ids', 'hand_card_instance_ids', 'hand');
  const stream = `search.${player.player_id}`;
  const counter = state.random_state.counters[stream] ?? 0;
  const shuffled = deterministicShuffle(player.deck_card_instance_ids, state.random_state.seed, stream, counter);
  player.deck_card_instance_ids = shuffled.values;
  state.random_state.counters[stream] = shuffled.counter;
  const placeholder = appendWorklogPlaceholder(state, {
    ticket: null,
    actorPlayerId: player.player_id,
    actionId,
    sourceName: 'Search',
    publicTargetSurface: `${player.player_id} draw deck`,
    actionCost: 1,
    now,
  });
  const publicEvent = appendEvent(state, {
    eventType: 'SEARCH_COMPLETED',
    actorPlayerId: player.player_id,
    actionId,
    payload: {
      hand_count_before: countsBefore.hand,
      hand_count_after: player.hand_card_instance_ids.length,
      deck_count_before: countsBefore.deck,
      deck_count_after: player.deck_card_instance_ids.length,
      search_tokens_before: countsBefore.tokens,
      search_tokens_after: player.search_tokens,
      remaining_deck_shuffled: true,
    },
    now,
  });
  appendEvent(state, {
    eventType: 'CARD_SEARCHED',
    actorPlayerId: player.player_id,
    actionId,
    visibility: 'PRIVATE_PLAYER',
    visibleToPlayerIds: [player.player_id],
    payload: {
      selected_card_definition_id: request.payload.selected_card_definition_id,
      selected_card_instance_id: selectedId,
    },
    now,
  });
  addActionRecord(state, {
    actionId,
    request,
    actorPlayerId: player.player_id,
    actionCost: 1,
    placeholderEventId: placeholder.event_id,
    sourceResultEventId: publicEvent.event_id,
    now,
  });
  maybeAutoEndTurn(state, now);
  return { actionsSpent: 1, searchTokensSpent: 1, resolutionCode: 'RESOLVED' };
}

function refreshDeck(context) {
  const { state, request, player, now, actionId } = context;
  if (state.turn.actions_remaining < 1) reject('INSUFFICIENT_ACTIONS');
  if (player.refresh_tokens < 1) reject('INSUFFICIENT_UTILITY_RESOURCE');
  const before = {
    deck: player.deck_card_instance_ids.length,
    discard: player.discard_card_instance_ids.length,
    hand: player.hand_card_instance_ids.length,
    inPlay: player.in_play_card_instance_ids.length,
    tokens: player.refresh_tokens,
  };
  spendActions(state, 1);
  player.refresh_tokens -= 1;
  const combined = [...player.deck_card_instance_ids, ...player.discard_card_instance_ids];
  const stream = `refresh.${player.player_id}`;
  const counter = state.random_state.counters[stream] ?? 0;
  const shuffled = deterministicShuffle(combined, state.random_state.seed, stream, counter);
  player.deck_card_instance_ids = shuffled.values;
  player.discard_card_instance_ids = [];
  state.random_state.counters[stream] = shuffled.counter;
  for (const id of player.deck_card_instance_ids) state.card_instances[id].zone = 'deck';
  const placeholder = appendWorklogPlaceholder(state, {
    ticket: null,
    actorPlayerId: player.player_id,
    actionId,
    sourceName: 'Refresh',
    publicTargetSurface: `${player.player_id} draw deck and discard`,
    actionCost: 1,
    now,
  });
  const completed = appendEvent(state, {
    eventType: 'REFRESH_COMPLETED',
    actorPlayerId: player.player_id,
    actionId,
    payload: {
      deck_count_before: before.deck,
      discard_count_before: before.discard,
      deck_count_after: player.deck_card_instance_ids.length,
      discard_count_after: 0,
      hand_count_before: before.hand,
      hand_count_after: player.hand_card_instance_ids.length,
      in_play_count_before: before.inPlay,
      in_play_count_after: player.in_play_card_instance_ids.length,
      refresh_tokens_before: before.tokens,
      refresh_tokens_after: player.refresh_tokens,
      combined_and_shuffled: true,
    },
    now,
  });
  addActionRecord(state, {
    actionId,
    request,
    actorPlayerId: player.player_id,
    actionCost: 1,
    placeholderEventId: placeholder.event_id,
    sourceResultEventId: completed.event_id,
    now,
  });
  maybeAutoEndTurn(state, now);
  return { actionsSpent: 1, refreshTokensSpent: 1, resolutionCode: 'RESOLVED' };
}

const sameSet = (left, right) => left.size === right.size && [...left].every((entry) => right.has(entry));

function exactIdList(actual, expected) {
  if (!Array.isArray(actual) || actual.length !== new Set(actual).size) return false;
  return sameSet(new Set(actual), new Set(expected));
}

function exactClosureBundle(ticket, payload) {
  if (payload.accepted_isolation_event_ids !== undefined
    && payload.accepted_isolation_event_id !== undefined) return false;
  const isolationIds = payload.accepted_isolation_event_ids
    ?? (payload.accepted_isolation_event_id ? [payload.accepted_isolation_event_id] : null);
  const decisive = ticket.accepted_path_isolation_event_ids.flatMap((id) => {
    const isolation = ticket.isolation_history.find((record) => record.isolation_event_id === id);
    return isolation?.cited_evidence_event_ids ?? [];
  });
  const failed = ticket.verification_history
    .filter((record) => ['FAIL', 'INCONCLUSIVE'].includes(record.result))
    .map((record) => record.verify_event_id);
  return exactIdList(isolationIds, ticket.accepted_path_isolation_event_ids)
    && exactIdList(payload.decisive_evidence_event_ids, decisive)
    && exactIdList(payload.repair_event_ids, ticket.accepted_path_repair_event_ids)
    && exactIdList(payload.failed_verify_event_ids, failed)
    && exactIdList(payload.current_passing_verify_event_ids, ticket.current_verify_pass_event_ids);
}

function authoredClosurePathComplete(ticket) {
  const required = ticket.definition_snapshot.closure_requirements;
  if (!required) return false;
  const isolations = ticket.accepted_path_isolation_event_ids.map((id) =>
    ticket.isolation_history.find((record) => record.accepted && record.isolation_event_id === id));
  const repairs = ticket.accepted_path_repair_event_ids.map((id) =>
    ticket.repair_history.find((record) => record.repair_event_id === id));
  const currentPasses = ticket.current_verify_pass_event_ids.map((id) =>
    ticket.verification_history.find((record) => record.verify_event_id === id
      && record.result === 'PASS'
      && record.is_current
      && record.machine_revision === ticket.machine_revision));
  if (isolations.some((record) => !record) || repairs.some((record) => !record)
    || currentPasses.some((record) => !record)) return false;
  if (!exactIdList(
    isolations.map((record) => record.target_fault_instance_key),
    required.required_fault_instance_keys,
  )) return false;
  if (!exactIdList(
    isolations.map((record) => record.isolation_requirement_id),
    required.required_isolation_requirement_ids,
  )) return false;
  if (!exactIdList(
    repairs.filter((record) => record.necessary_for_closure).map((record) => record.repair_outcome_id),
    required.required_repair_outcome_ids,
  )) return false;
  if (!exactIdList(
    currentPasses.map((record) => record.requirement_id),
    required.required_verification_requirement_ids,
  )) return false;
  return repairs.every((record) => isolations.some((isolation) =>
    isolation.isolation_event_id === record.isolation_event_id));
}

function reconcileQueue(state, now, actionId) {
  const created = [];
  while (state.configuration.queue_minimum > 0
    && state.active_ticket_ids.length < state.configuration.queue_minimum
    && state.ticket_snapshot_queue.length > 0) {
    const snapshot = state.ticket_snapshot_queue.shift();
    const ticket = instantiateTicket(snapshot, state.match_id, state.ticket_sequence);
    state.ticket_sequence += 1;
    state.tickets[ticket.ticket_instance_id] = ticket;
    state.active_ticket_ids.push(ticket.ticket_instance_id);
    created.push(ticket.ticket_instance_id);
  }
  const exhausted = state.configuration.queue_minimum > 0
    && state.active_ticket_ids.length < state.configuration.queue_minimum;
  const event = appendEvent(state, {
    eventType: 'QUEUE_RECONCILED',
    actionId,
    payload: {
      queue_minimum: state.configuration.queue_minimum,
      active_ticket_count: state.active_ticket_ids.length,
      created_ticket_instance_ids: created,
      supply_exhausted: exhausted,
    },
    now,
  });
  return { event, exhausted };
}

function publishClosure(context) {
  const { state, request, player, now, actionId } = context;
  const ticket = activeTicket(state, request.payload.ticket_instance_id);
  if (ticket.status !== 'READY_TO_CLOSE'
    || !authoredClosurePathComplete(ticket)
    || !exactClosureBundle(ticket, request.payload)) {
    reject('INVALID_CLOSURE_BUNDLE');
  }
  const closureEvent = appendEvent(state, {
    eventType: 'CLOSURE_PUBLISHED',
    actorPlayerId: player.player_id,
    ticketInstanceId: ticket.ticket_instance_id,
    actionId,
    payload: {
      action_cost: 0,
      statistically_attributed_player_id: player.player_id,
      card_recovered: false,
    },
    now,
  });
  for (const entry of ticket.worklog_entries) entry.locked = true;
  const lockEvent = appendEvent(state, {
    eventType: 'WORKLOG_LOCKED',
    actorPlayerId: player.player_id,
    ticketInstanceId: ticket.ticket_instance_id,
    actionId,
    payload: { locked: true },
    now,
  });

  const scoreEventIds = [];
  for (const contribution of state.contribution_ledger.filter(
    (entry) => entry.ticket_instance_id === ticket.ticket_instance_id
      && entry.settlement_status === 'PENDING',
  )) {
    const scoreEvent = appendEvent(state, {
      eventType: 'SERVICE_POINT_AWARDED',
      actorPlayerId: contribution.contributor_player_id,
      ticketInstanceId: ticket.ticket_instance_id,
      actionId,
      payload: {
        source_contribution_id: contribution.contribution_id,
        contributor_player_id: contribution.contributor_player_id,
        contribution_class: contribution.contribution_class,
        delta: 1,
      },
      now,
    });
    contribution.settlement_status = 'SETTLED';
    contribution.score_event_id = scoreEvent.event_id;
    scoreEventIds.push(scoreEvent.event_id);
    const contributor = playerById(state, contribution.contributor_player_id);
    const scoreRecord = {
      score_event_id: scoreEvent.event_id,
      ticket_instance_id: ticket.ticket_instance_id,
      source_contribution_id: contribution.contribution_id,
      contributor_player_id: contribution.contributor_player_id,
      contribution_class: contribution.contribution_class,
      recipient_player_id: state.collaboration_mode === 'competitive' ? contributor.player_id : null,
      recipient_team_id: state.collaboration_mode === 'cooperative' ? contributor.team_id : null,
      delta: 1,
      settled_by_closure_event_id: closureEvent.event_id,
    };
    state.service_point_events.push(scoreRecord);
    if (state.collaboration_mode === 'cooperative') state.team_scores[contributor.team_id] += 1;
    else contributor.service_points += 1;
  }

  ticket.status = 'CLOSED';
  const archiveEvent = appendEvent(state, {
    eventType: 'TICKET_ARCHIVED',
    ticketInstanceId: ticket.ticket_instance_id,
    actionId,
    payload: { removed_from_active_queue: true },
    now,
  });
  state.active_ticket_ids = state.active_ticket_ids.filter((id) => id !== ticket.ticket_instance_id);
  const resourceChanges = [];
  for (const activePlayer of state.players.filter((entry) => entry.active)) {
    const before = { search: activePlayer.search_tokens, refresh: activePlayer.refresh_tokens };
    activePlayer.search_tokens = Math.min(
      activePlayer.max_search_tokens,
      activePlayer.search_tokens + state.configuration.ticket_search_tokens,
    );
    activePlayer.refresh_tokens = Math.min(activePlayer.max_refresh_tokens, activePlayer.refresh_tokens + 1);
    resourceChanges.push({
      player_id: activePlayer.player_id,
      search_before: before.search,
      search_after: activePlayer.search_tokens,
      refresh_before: before.refresh,
      refresh_after: activePlayer.refresh_tokens,
    });
  }
  const grantsEvent = appendEvent(state, {
    eventType: 'UTILITY_RESOURCES_GRANTED',
    ticketInstanceId: ticket.ticket_instance_id,
    actionId,
    payload: { resource_changes: resourceChanges, caps_applied: true },
    now,
  });
  const queue = reconcileQueue(state, now, actionId);
  const terminalResult = evaluateTermination(state, now, queue.exhausted ? ['ADMIN_INVALIDATION'] : []);
  const terminalEvent = appendEvent(state, {
    eventType: 'TERMINAL_EVALUATED',
    ticketInstanceId: ticket.ticket_instance_id,
    actionId,
    payload: {
      terminal: terminalResult !== null,
      reason_codes: terminalResult?.reason_codes ?? [],
      evaluated_after_complete_transaction: true,
    },
    now,
  });
  state.closure_statistics.push({
    closure_event_id: closureEvent.event_id,
    ticket_instance_id: ticket.ticket_instance_id,
    closer_player_id: player.player_id,
    attributed_team_id: player.team_id,
    closed_at: now,
  });
  player.tickets_closed += 1;
  ticket.closure = {
    closure_event_id: closureEvent.event_id,
    closer_player_id: player.player_id,
    attributed_team_id: player.team_id,
    action_cost: 0,
    accepted_isolation_event_ids: [...ticket.accepted_path_isolation_event_ids],
    decisive_evidence_event_ids: [...new Set(ticket.accepted_path_isolation_event_ids.flatMap((id) =>
      ticket.isolation_history.find((record) => record.isolation_event_id === id).cited_evidence_event_ids))],
    repair_event_ids: [...ticket.accepted_path_repair_event_ids],
    failed_verify_event_ids: ticket.verification_history
      .filter((record) => ['FAIL', 'INCONCLUSIVE'].includes(record.result))
      .map((record) => record.verify_event_id),
    current_passing_verify_event_ids: [...ticket.current_verify_pass_event_ids],
    worklog_locked_event_id: lockEvent.event_id,
    score_event_ids: scoreEventIds,
    ticket_archived_event_id: archiveEvent.event_id,
    utility_grant_event_ids: [grantsEvent.event_id],
    queue_reconciled_event_id: queue.event.event_id,
    terminal_evaluated_event_id: terminalEvent.event_id,
    turn_ended_event_id: null,
    closed_at: now,
  };
  state.archived_ticket_ids.push(ticket.ticket_instance_id);
  state.archived_tickets[ticket.ticket_instance_id] = ticket;
  delete state.tickets[ticket.ticket_instance_id];
  if (terminalResult) {
    state.result = terminalResult;
    state.status = terminalResult.valid ? 'COMPLETED' : 'INVALIDATED';
  }
  const sequenceBeforeTurnEnd = state.event_sequence;
  endTurn(state, 'CLOSURE_PUBLISHED', now);
  ticket.closure.turn_ended_event_id = state.events.find(
    (event) => event.sequence > sequenceBeforeTurnEnd && event.event_type === 'TURN_ENDED',
  )?.event_id ?? null;
  addActionRecord(state, {
    actionId,
    request,
    actorPlayerId: player.player_id,
    ticketInstanceId: ticket.ticket_instance_id,
    now,
  });
  return { actionsSpent: 0, resolutionCode: 'RESOLVED' };
}

function solutionReveal(ticket) {
  const snapshot = ticket.definition_snapshot;
  const faultsByKey = new Map(snapshot.server_only_truth.fault_instances
    .map((fault) => [fault.fault_instance_key, fault]));
  const outcomeById = new Map([
    ...snapshot.authored_evidence_outcomes,
    ...snapshot.authored_verification_outcomes,
  ].map((outcome) => [outcome.outcome_id, outcome]));
  return {
    faults: snapshot.server_only_truth.fault_instances.map((fault) => ({
      fault_id: fault.fault_id,
      role: fault.role,
      actionable: fault.actionable,
      deepest: fault.deepest,
    })),
    causal_links: snapshot.server_only_truth.causal_edges.map((edge) => ({
      cause_fault_id: faultsByKey.get(edge.cause_fault_instance_key)?.fault_id ?? null,
      effect_fault_id: faultsByKey.get(edge.effect_fault_instance_key)?.fault_id ?? null,
    })),
    evidence_solution: snapshot.isolation_requirements.flatMap((requirement) =>
      (requirement.routes ?? []).map((route) => ({
        candidate_fault_id: requirement.candidate_fault_id,
        route_kind: route.route_kind,
        evidence: [
          ...(route.eligible_outcome_ids ?? []),
          ...(route.eligible_verification_outcome_ids ?? []),
          ...(route.supporting_outcome_ids ?? []),
        ].map((id) => ({
          source_definition_id: outcomeById.get(id)?.source_definition_id
            ?? outcomeById.get(id)?.validation_procedure_id
            ?? null,
          summary: outcomeById.get(id)?.public_summary ?? id,
        })),
        eliminated_candidate_fault_ids: [...(route.required_eliminated_candidate_fault_ids ?? [])],
      }))),
    repair_solution: snapshot.authored_repair_outcomes
      .filter((outcome) => outcome.necessary_for_closure)
      .map((outcome) => ({ repair_procedure_id: outcome.repair_procedure_id, summary: outcome.public_summary })),
    verification_solution: snapshot.authored_verification_outcomes
      .filter((outcome) => outcome.result === 'PASS')
      .map((outcome) => ({ validation_procedure_id: outcome.validation_procedure_id, summary: outcome.public_summary })),
  };
}

function giveUpTicket(context) {
  const { state, request, player, now, actionId } = context;
  if (!isDiagnosisV2(state)) reject('UNSUPPORTED_ACTION_TYPE');
  if (!['SOLO', 'TRAINING'].includes(state.configuration.play_context)) reject('GIVE_UP_NOT_ALLOWED');
  if (request.payload.confirmed !== true) reject('CONFIRMATION_REQUIRED');
  const ticket = activeTicket(state, request.payload.ticket_instance_id);
  const reveal = solutionReveal(ticket);
  const publicEvent = appendEvent(state, {
    eventType: 'TICKET_GIVEN_UP',
    actorPlayerId: player.player_id,
    ticketInstanceId: ticket.ticket_instance_id,
    actionId,
    payload: {
      removed_from_active_queue: true,
      pending_contributions_voided: state.contribution_ledger.filter((entry) =>
        entry.ticket_instance_id === ticket.ticket_instance_id && entry.settlement_status === 'PENDING').length,
    },
    now,
  });
  for (const contribution of state.contribution_ledger.filter((entry) =>
    entry.ticket_instance_id === ticket.ticket_instance_id && entry.settlement_status === 'PENDING')) {
    contribution.settlement_status = 'VOID_GIVE_UP';
  }
  const revealEvent = appendEvent(state, {
    eventType: 'TICKET_SOLUTION_REVEALED',
    actorPlayerId: player.player_id,
    ticketInstanceId: ticket.ticket_instance_id,
    actionId,
    visibility: 'PRIVATE_PLAYER',
    visibleToPlayerIds: [player.player_id],
    payload: { solution_reveal: reveal },
    now,
  });
  for (const entry of ticket.worklog_entries) entry.locked = true;
  ticket.status = 'ABANDONED';
  ticket.abandonment = {
    give_up_event_id: publicEvent.event_id,
    reveal_event_id: revealEvent.event_id,
    player_id: player.player_id,
    solution_reveal: reveal,
    abandoned_at: now,
  };
  state.active_ticket_ids = state.active_ticket_ids.filter((id) => id !== ticket.ticket_instance_id);
  state.archived_ticket_ids.push(ticket.ticket_instance_id);
  state.archived_tickets[ticket.ticket_instance_id] = ticket;
  delete state.tickets[ticket.ticket_instance_id];
  state.give_up_statistics.push({
    give_up_event_id: publicEvent.event_id,
    ticket_instance_id: ticket.ticket_instance_id,
    player_id: player.player_id,
    abandoned_at: now,
  });
  const queue = reconcileQueue(state, now, actionId);
  const terminalResult = evaluateTermination(state, now, queue.exhausted ? ['ADMIN_INVALIDATION'] : []);
  appendEvent(state, {
    eventType: 'TERMINAL_EVALUATED',
    ticketInstanceId: ticket.ticket_instance_id,
    actionId,
    payload: {
      terminal: terminalResult !== null,
      reason_codes: terminalResult?.reason_codes ?? [],
      evaluated_after_complete_transaction: true,
    },
    now,
  });
  if (terminalResult) {
    state.result = terminalResult;
    state.status = terminalResult.valid ? 'COMPLETED' : 'INVALIDATED';
  }
  addActionRecord(state, {
    actionId,
    request,
    actorPlayerId: player.player_id,
    ticketInstanceId: ticket.ticket_instance_id,
    sourceResultEventId: revealEvent.event_id,
    now,
  });
  endTurn(state, 'TICKET_GIVEN_UP', now);
  return {
    actionsSpent: 0,
    resolutionCode: 'RESOLVED',
    targetSummary: `Give up ${ticket.ticket_instance_id}.`,
    resultSummary: 'Ticket abandoned and its complete solution revealed. Pending contributions were voided.',
  };
}

function passTurn(context) {
  const { state, request, player, now, actionId } = context;
  addActionRecord(state, {
    actionId,
    request,
    actorPlayerId: player.player_id,
    now,
  });
  endTurn(state, 'VOLUNTARY', now);
  return { actionsSpent: 0, resolutionCode: 'RESOLVED' };
}

function dispatch(context) {
  switch (context.request.action_type) {
    case 'RUN_TEST': return resolveDiagnostic(context);
    case 'SET_ELIMINATION': return setElimination(context);
    case 'REVISE_HYPOTHESIS': return reviseHypothesis(context);
    case 'COMMIT_ISOLATION': return commitIsolation(context);
    case 'PERFORM_REPAIR': return performRepair(context);
    case 'PERFORM_VERIFY': return performVerify(context);
    case 'DOCUMENT_LIVE': return documentLive(context);
    case 'PUBLISH_CLOSURE': return publishClosure(context);
    case 'SEARCH': return searchDeck(context);
    case 'REFRESH': return refreshDeck(context);
    case 'PASS_TURN': return passTurn(context);
    case 'GIVE_UP_TICKET': return giveUpTicket(context);
    default: reject('UNSUPPORTED_ACTION_TYPE');
  }
}

export function submitIntent({ state, request, authenticatedPlayerId, catalogs, now }) {
  const unchanged = state;
  const fail = (code, message) => ({
    state: unchanged,
    result: rejectedResult(unchanged, request, code, message),
    events: [],
  });
  if (!validateRequestShape(request)) return fail('ILLEGAL_REQUEST', 'Request shape is not allowed.');
  if (request.match_id !== state.match_id) return fail('MATCH_MISMATCH');
  if (request.player_id !== authenticatedPlayerId) return fail('ACTOR_MISMATCH');
  const fingerprint = digest(request);
  const prior = state.processed_requests[request.request_id];
  if (prior) {
    if (prior.fingerprint !== fingerprint) return fail('IDEMPOTENCY_CONFLICT');
    return {
      state,
      result: deepClone(prior.result),
      events: prior.event_ids.map((id) => deepClone(eventById(state, id))).filter(Boolean),
    };
  }
  if (request.expected_revision !== state.revision) return fail('STALE_REVISION');
  const authoritativePlayer = playerById(state, authenticatedPlayerId);
  if (!authoritativePlayer || !authoritativePlayer.active || authoritativePlayer.connection_status !== 'CONNECTED') {
    return fail('NOT_ACTIVE_PLAYER');
  }
  try {
    requireActiveTurn(state, authenticatedPlayerId);
  } catch (error) {
    if (error instanceof EngineRejection) return fail(error.code, error.message);
    throw error;
  }

  const next = deepClone(state);
  next.revision += 1;
  next.updated_at = now;
  const sequenceBefore = next.event_sequence;
  const player = playerById(next, authenticatedPlayerId);
  const cards = cardMap(catalogs);
  const actionId = `${next.match_id}.action.${String(next.revision).padStart(6, '0')}.${player.player_id}`;
  let outcome;
  try {
    outcome = dispatch({ next, state: next, request, player, cards, now, actionId });
  } catch (error) {
    if (error instanceof EngineRejection) return fail(error.code, error.message);
    throw error;
  }
  const projected = safeActionEvents(next, sequenceBefore, player);
  const result = assertPlayerSafe({
    request_id: request.request_id,
    accepted: true,
    match_revision_before: state.revision,
    match_revision_after: next.revision,
    payment_applied: true,
    actions_spent: outcome.actionsSpent ?? 0,
    utility_resources_spent: {
      search_tokens: outcome.searchTokensSpent ?? 0,
      refresh_tokens: outcome.refreshTokensSpent ?? 0,
    },
    public_events: projected.publicEvents,
    private_events: projected.privateEvents,
    team_events: projected.teamEvents,
    error_code: null,
    error_message: null,
    rejected_at: null,
    recovered_card_instance_id: outcome.recoveredCardInstanceId ?? null,
    opened_resolution_window: outcome.openedResolutionWindow ?? 'NONE',
    resolution_code: outcome.resolutionCode ?? 'RESOLVED',
    target_summary: outcome.targetSummary ?? `${request.action_type} accepted.`,
    result_summary: outcome.resultSummary ?? `${request.action_type} resolved and its authoritative result was recorded.`,
  });
  next.processed_requests[request.request_id] = {
    fingerprint,
    result: deepClone(result),
    event_ids: projected.all.map((event) => event.event_id),
  };
  assertValidState(next);
  return { state: next, result, events: projected.all.map(deepClone) };
}

export function stopSimulationAtCap({ state, now }) {
  if (state.status !== 'ACTIVE') return state;
  const next = deepClone(state);
  next.revision += 1;
  appendEvent(next, {
    eventType: 'SIMULATION_CAP_REACHED',
    payload: { no_gameplay_winner: true },
    now,
  });
  next.result = evaluateTermination(next, now, ['SIMULATION_CAP']);
  next.status = 'ABORTED';
  next.turn = null;
  next.updated_at = now;
  return assertValidState(next);
}

/**
 * Authoritative proof boundary for Frozen Rules section 15. This transition
 * records a proof already made by its server caller; it deliberately does not
 * inspect hidden truth or try to decide whether a stalemate exists.
 */
export function stopForProvenStalemate({ state, now }) {
  if (state.status !== 'ACTIVE') throw new Error('Only an active Match can end in proven stalemate');
  const next = deepClone(state);
  next.revision += 1;
  next.updated_at = now;
  appendEvent(next, {
    eventType: 'STALEMATE_PROVEN',
    payload: { reason_code: 'STALEMATE', proof_classification: 'PROVEN_STALEMATE' },
    now,
  });
  if (next.turn) {
    appendEvent(next, {
      eventType: 'TURN_ENDED',
      actorPlayerId: next.turn.active_player_id,
      payload: { reason: 'STALEMATE' },
      now,
    });
  }
  next.result = evaluateTermination(next, now, ['STALEMATE']);
  next.status = 'COMPLETED';
  next.turn = null;
  appendEvent(next, {
    eventType: 'TERMINAL_EVALUATED',
    payload: {
      terminal: true,
      reason_codes: [...next.result.reason_codes],
      evaluated_after_complete_transaction: true,
    },
    now,
  });
  return assertValidState(next);
}
