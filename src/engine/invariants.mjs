const FORBIDDEN_PLAYER_SAFE_KEYS = new Set([
  'server_only_truth',
  'definition_snapshot',
  'truth',
  'machine_state_key',
  'fault_instances',
  'fault_states',
  'actual_present',
  'causal_edges',
  'causal_edge_ids',
  'authored_evidence_outcomes',
  'authored_repair_outcomes',
  'authored_verification_outcomes',
  'isolation_requirements',
  'repair_requirements',
  'verification_requirements',
  'closure_requirements',
  'eligible_machine_state_key',
  'resulting_machine_state_key',
  'resolved_fault_instance_keys',
  'eligible_outcome_ids',
  'eligible_verification_outcome_ids',
  'unexecuted_outcomes',
  'random_state',
  'random_counters',
  'match_seed',
  'deck_order',
  'target_fault_instance_key',
  'fault_instance_key',
  'authored_diagnostic_targets',
  'authored_target_ref',
  'pending_contributions',
  'processed_requests',
  'ticket_snapshot_queue',
  'generation_provenance',
]);

export function findPlayerSafeLeaks(value, at = '$', leaks = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => findPlayerSafeLeaks(entry, `${at}[${index}]`, leaks));
    return leaks;
  }
  if (!value || typeof value !== 'object') return leaks;
  for (const [key, child] of Object.entries(value)) {
    const next = `${at}.${key}`;
    if (FORBIDDEN_PLAYER_SAFE_KEYS.has(key)) leaks.push(next);
    findPlayerSafeLeaks(child, next, leaks);
  }
  return leaks;
}

export function assertPlayerSafe(value) {
  const leaks = findPlayerSafeLeaks(value);
  if (leaks.length > 0) throw new Error(`Player-safe projection leaked ${leaks.join(', ')}`);
  return value;
}

export function validateState(state) {
  const errors = [];
  const playerIds = new Set();
  const allZoneInstances = new Map();
  for (const player of state.players) {
    if (playerIds.has(player.player_id)) errors.push(`duplicate Player ${player.player_id}`);
    playerIds.add(player.player_id);
    const zones = [
      ['deck_card_instance_ids', 'deck'],
      ['hand_card_instance_ids', 'hand'],
      ['discard_card_instance_ids', 'discard'],
      ['in_play_card_instance_ids', 'in_play'],
    ];
    const definitions = [];
    for (const [field, zone] of zones) {
      for (const instanceId of player[field]) {
        if (allZoneInstances.has(instanceId)) {
          errors.push(`${instanceId} appears in two zones`);
          continue;
        }
        allZoneInstances.set(instanceId, `${player.player_id}.${zone}`);
        const instance = state.card_instances[instanceId];
        if (!instance) errors.push(`${instanceId} is absent from Card Instance registry`);
        else {
          definitions.push(instance.card_definition_id);
          if (instance.owner_player_id !== player.player_id) errors.push(`${instanceId} has wrong owner`);
          if (instance.zone !== zone) errors.push(`${instanceId} registry zone is ${instance.zone}, expected ${zone}`);
        }
      }
    }
    if (definitions.length !== player.deck_snapshot_card_definition_ids.length) {
      errors.push(`${player.player_id} Card Instance count does not match deck snapshot`);
    }
    const expected = new Map();
    const actual = new Map();
    for (const id of player.deck_snapshot_card_definition_ids) expected.set(id, (expected.get(id) ?? 0) + 1);
    for (const id of definitions) actual.set(id, (actual.get(id) ?? 0) + 1);
    for (const [id, count] of expected) {
      if (actual.get(id) !== count) errors.push(`${player.player_id} does not reconcile ${id}`);
    }
    if (player.search_tokens > player.max_search_tokens) errors.push(`${player.player_id} Search exceeds cap`);
    if (player.refresh_tokens > player.max_refresh_tokens) errors.push(`${player.player_id} Refresh exceeds cap`);
  }
  for (const instanceId of Object.keys(state.card_instances)) {
    if (!allZoneInstances.has(instanceId)) errors.push(`${instanceId} is absent from all zones`);
  }

  const eventIds = new Set();
  let previousSequence = 0;
  for (const event of state.events) {
    if (eventIds.has(event.event_id)) errors.push(`duplicate event ${event.event_id}`);
    eventIds.add(event.event_id);
    if (event.sequence <= previousSequence) errors.push(`event sequence is not increasing at ${event.event_id}`);
    previousSequence = event.sequence;
  }
  if (previousSequence !== state.event_sequence) errors.push('event cursor differs from complete event ledger');

  const scoreIds = new Set();
  const slots = new Set();
  for (const contribution of state.contribution_ledger) {
    if (slots.has(contribution.slot_key)) errors.push(`duplicate contribution slot ${contribution.slot_key}`);
    slots.add(contribution.slot_key);
  }
  for (const score of state.service_point_events) {
    if (scoreIds.has(score.score_event_id)) errors.push(`duplicate score record ${score.score_event_id}`);
    scoreIds.add(score.score_event_id);
    if (score.delta !== 1) errors.push(`${score.score_event_id} is not one point`);
  }

  const activeIds = new Set(state.active_ticket_ids);
  for (const id of state.archived_ticket_ids) {
    if (activeIds.has(id)) errors.push(`${id} is active and archived`);
    if (!state.archived_tickets[id]?.closure) errors.push(`${id} has no immutable archived closure`);
  }
  for (const id of state.active_ticket_ids) {
    const ticket = state.tickets[id];
    if (!ticket || ticket.status === 'CLOSED') errors.push(`${id} is not a valid active Ticket`);
  }
  if (state.turn && state.turn.actions_spent + state.turn.actions_remaining !== 2) {
    errors.push('turn Action arithmetic does not reconcile');
  }
  return errors;
}

export function assertValidState(state) {
  const errors = validateState(state);
  if (errors.length > 0) throw new Error(`Invalid authoritative state:\n${errors.join('\n')}`);
  return state;
}
