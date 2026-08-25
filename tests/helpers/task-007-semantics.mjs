const PLAYER_SAFE_VISIBILITIES = new Set(['PRIVATE_PLAYER', 'TEAM', 'PUBLIC_MATCH']);

const FORBIDDEN_PLAYER_SAFE_KEYS = new Set([
  'server_only_truth',
  'causal_truth',
  'fault_states',
  'actual_present',
  'causal_edge_ids',
  'authored_evidence_outcomes',
  'unexecuted_outcomes',
  'random_seed',
  'deck_order',
  'opponent_hand_card_instance_ids',
  'internal_scoring_modifiers',
]);

const sameSet = (left, right) =>
  left.size === right.size && [...left].every((value) => right.has(value));

function forbiddenKeys(value, at = 'payload', found = []) {
  if (Array.isArray(value)) {
    value.forEach((child, index) => forbiddenKeys(child, `${at}[${index}]`, found));
    return found;
  }
  if (!value || typeof value !== 'object') return found;
  for (const [name, child] of Object.entries(value)) {
    if (FORBIDDEN_PLAYER_SAFE_KEYS.has(name)) found.push(`${at}.${name}`);
    forbiddenKeys(child, `${at}.${name}`, found);
  }
  return found;
}

export function validatePlayerSafeEvent(event) {
  const errors = [];
  if (PLAYER_SAFE_VISIBILITIES.has(event.visibility)) {
    for (const key of forbiddenKeys(event.payload)) errors.push(`${event.event_id}: forbidden player-safe key ${key}`);
  }
  if (event.visibility === 'PRIVATE_PLAYER' && event.visible_to_player_ids.length === 0) {
    errors.push(`${event.event_id}: private event has no Player recipient`);
  }
  if (event.visibility === 'TEAM' && event.visible_to_team_ids.length === 0) {
    errors.push(`${event.event_id}: team event has no team recipient`);
  }
  if (['SERVER_ONLY', 'PUBLIC_MATCH'].includes(event.visibility)
    && (event.visible_to_player_ids.length > 0 || event.visible_to_team_ids.length > 0)) {
    errors.push(`${event.event_id}: audience-free visibility has explicit recipients`);
  }
  return errors;
}

export function validateAuthoredTicket(ticket) {
  const errors = [];
  const candidates = new Set(ticket.public_candidate_fault_ids);
  const outcomes = new Map();
  for (const outcome of ticket.authored_evidence_outcomes) {
    if (outcomes.has(outcome.outcome_id)) errors.push(`duplicate authored outcome ${outcome.outcome_id}`);
    outcomes.set(outcome.outcome_id, outcome);
    for (const effect of outcome.candidate_effects) {
      if (!candidates.has(effect.candidate_fault_id)) {
        errors.push(`${outcome.outcome_id}: candidate effect references undeclared ${effect.candidate_fault_id}`);
      }
    }
  }

  const truthFaults = new Set(ticket.server_only_truth.fault_instances.map((instance) => instance.fault_id));
  const isolationIds = new Set();
  for (const requirement of ticket.isolation_requirements) {
    if (isolationIds.has(requirement.requirement_id)) errors.push(`duplicate Isolation requirement ${requirement.requirement_id}`);
    isolationIds.add(requirement.requirement_id);
    if (!candidates.has(requirement.candidate_fault_id)) {
      errors.push(`${requirement.requirement_id}: Isolation candidate is not public`);
    }
    const routeOutcomeIds = (requirement.routes ?? []).flatMap((route) => [
      ...(route.eligible_outcome_ids ?? []),
      ...(route.supporting_outcome_ids ?? []),
    ]);
    for (const outcomeId of [...(requirement.eligible_outcome_ids ?? []), ...routeOutcomeIds]) {
      const outcome = outcomes.get(outcomeId);
      if (!outcome) {
        errors.push(`${requirement.requirement_id}: unknown authored outcome ${outcomeId}`);
      } else if (!outcome.candidate_effects.some((effect) =>
        effect.candidate_fault_id === requirement.candidate_fault_id)) {
        errors.push(`${requirement.requirement_id}: outcome ${outcomeId} does not address its candidate`);
      }
    }
    for (const route of requirement.routes ?? []) {
      if (route.candidate_fault_id !== requirement.candidate_fault_id
          || route.target_fault_instance_key !== requirement.target_fault_instance_key) {
        errors.push(`${route.route_id}: route target differs from its Isolation requirement`);
      }
      for (const candidateId of route.required_eliminated_candidate_fault_ids ?? []) {
        if (!candidates.has(candidateId)) errors.push(`${route.route_id}: eliminates undeclared candidate ${candidateId}`);
      }
      for (const outcomeId of route.eligible_verification_outcome_ids ?? []) {
        const outcome = ticket.authored_verification_outcomes.find((entry) => entry.outcome_id === outcomeId);
        if (!outcome) errors.push(`${route.route_id}: unknown authored Verify outcome ${outcomeId}`);
        else if (!outcome.candidate_effects.some((effect) => effect.candidate_fault_id === requirement.candidate_fault_id)) {
          errors.push(`${route.route_id}: Verify outcome ${outcomeId} does not address its candidate`);
        }
      }
    }
  }

  for (const requirement of ticket.repair_requirements) {
    if (!truthFaults.has(requirement.fault_id)) errors.push(`Repair requirement targets non-truth Fault ${requirement.fault_id}`);
  }
  return errors;
}

export function validateTicketLifecycle(ticket) {
  const errors = [];
  const isolations = new Map(ticket.isolation_history.map((entry) => [entry.isolation_event_id, entry]));
  const repairs = new Map(ticket.repair_history.map((entry) => [entry.repair_event_id, entry]));
  const verifies = new Map(ticket.verification_history.map((entry) => [entry.verify_event_id, entry]));

  const currentIsolation = ticket.current_accepted_isolation_event_id === null
    ? null
    : isolations.get(ticket.current_accepted_isolation_event_id);
  if (ticket.current_accepted_isolation_event_id !== null && (!currentIsolation || !currentIsolation.accepted)) {
    errors.push('current accepted Isolation does not reference an accepted history record');
  }

  if (['DIAGNOSIS', 'RETURNED_TO_DIAGNOSIS'].includes(ticket.status)
    && ticket.current_accepted_isolation_event_id !== null) {
    errors.push(`${ticket.status} must clear the current Repair gateway`);
  }
  if (['REPAIR_READY', 'AWAITING_VERIFY', 'READY_TO_CLOSE', 'CLOSED'].includes(ticket.status)
    && !currentIsolation) {
    errors.push(`${ticket.status} requires a current accepted Isolation`);
  }
  if (ticket.status === 'AWAITING_VERIFY' && ticket.repair_history.length === 0) {
    errors.push('AWAITING_VERIFY requires Repair history');
  }
  if (ticket.status === 'RETURNED_TO_DIAGNOSIS' && ticket.return_to_diagnosis_history.length === 0) {
    errors.push('RETURNED_TO_DIAGNOSIS requires preserved return history');
  }

  for (const repair of ticket.repair_history) {
    const isolation = isolations.get(repair.isolation_event_id);
    if (!isolation?.accepted) errors.push(`${repair.repair_event_id}: Repair is not gated by accepted Isolation`);
    if (isolation && Date.parse(repair.repaired_at) < Date.parse(isolation.committed_at)) {
      errors.push(`${repair.repair_event_id}: Repair precedes its Isolation`);
    }
  }
  for (const returned of ticket.return_to_diagnosis_history) {
    const failed = verifies.get(returned.failed_verify_event_id);
    if (!failed || !['FAIL', 'INCONCLUSIVE'].includes(failed.result)) {
      errors.push(`${returned.return_event_id}: return does not reference failed/inconclusive Verify`);
    }
    for (const invalidatedId of returned.invalidated_pass_event_ids) {
      if (verifies.get(invalidatedId)?.result !== 'PASS') {
        errors.push(`${returned.return_event_id}: invalidated pass ${invalidatedId} is not a pass`);
      }
    }
  }

  const currentPasses = new Set(ticket.current_verify_pass_event_ids);
  for (const passId of currentPasses) {
    const pass = verifies.get(passId);
    if (!pass || pass.result !== 'PASS' || !pass.is_current || pass.machine_revision !== ticket.machine_revision) {
      errors.push(`${passId}: current pass is missing, stale, failed, or from another machine revision`);
    }
  }
  if (['READY_TO_CLOSE', 'CLOSED'].includes(ticket.status) && currentPasses.size === 0) {
    errors.push(`${ticket.status} requires current Verify passes`);
  }

  if (ticket.status === 'CLOSED') {
    if (!ticket.archived || !ticket.closure) errors.push('CLOSED requires archived immutable closure');
    if (ticket.closure) {
      if (ticket.closure.action_cost !== 0) errors.push('closure must cost zero Actions');
      if (ticket.closure.accepted_isolation_event_id !== ticket.current_accepted_isolation_event_id) {
        errors.push('closure does not reference the current accepted Isolation');
      }
      for (const repairId of ticket.closure.repair_event_ids) {
        if (!repairs.has(repairId)) errors.push(`closure references unknown Repair ${repairId}`);
      }
      if (!sameSet(new Set(ticket.closure.repair_event_ids), new Set(repairs.keys()))) {
        errors.push('closure does not preserve the complete accepted-path Repair history');
      }
      const currentCitations = new Set(currentIsolation?.cited_evidence_event_ids ?? []);
      for (const evidenceId of ticket.closure.decisive_evidence_event_ids) {
        if (!currentCitations.has(evidenceId)) {
          errors.push(`closure decisive Evidence ${evidenceId} is unrelated to the current accepted Isolation`);
        }
      }
      for (const failedId of ticket.closure.failed_verify_event_ids) {
        if (!['FAIL', 'INCONCLUSIVE'].includes(verifies.get(failedId)?.result)) {
          errors.push(`closure references non-failed Verify ${failedId}`);
        }
      }
      if (!sameSet(new Set(ticket.closure.current_passing_verify_event_ids), currentPasses)) {
        errors.push('closure does not contain exactly the current passing Verifies');
      }
      const preservedFailures = new Set(ticket.verification_history
        .filter((entry) => ['FAIL', 'INCONCLUSIVE'].includes(entry.result))
        .map((entry) => entry.verify_event_id));
      if (!sameSet(new Set(ticket.closure.failed_verify_event_ids), preservedFailures)) {
        errors.push('closure does not preserve every failed/inconclusive Verify');
      }
      if (ticket.closure.score_event_ids.includes(ticket.closure.closure_event_id)) {
        errors.push('closure event cannot also be a Service Point event');
      }
    }
  } else if (ticket.archived || ticket.closure !== null) {
    errors.push('non-closed Ticket cannot be archived or carry a closure record');
  }
  return errors;
}

export function validateTurnState(turn) {
  const errors = [];
  if (turn.actions_started !== 2) errors.push('turn must start with two Actions');
  if (turn.actions_spent + turn.actions_remaining !== turn.actions_started) {
    errors.push('turn Action arithmetic does not reconcile');
  }
  if (turn.closure_window.is_open) {
    if (turn.phase !== 'CLOSURE_RESOLUTION') errors.push('open closure window requires CLOSURE_RESOLUTION');
    if (turn.closure_window.eligible_ticket_instance_ids.length === 0) errors.push('open closure window has no eligible Ticket');
    if (turn.turn_ended_reason !== null) errors.push('open closure window cannot already be ended');
  } else if (turn.closure_window.eligible_ticket_instance_ids.length > 0
    || turn.closure_window.opened_by_verify_event_id !== null) {
    errors.push('closed closure window retained eligibility or Verify linkage');
  }
  if (turn.phase === 'END' && turn.closure_window.is_open) errors.push('ended turn retained an open closure window');
  return errors;
}

export function validatePlayerState(player) {
  const errors = [];
  const copies = new Map();
  for (const cardId of player.deck_snapshot_card_definition_ids) {
    copies.set(cardId, (copies.get(cardId) ?? 0) + 1);
  }
  for (const [cardId, count] of copies) {
    if (count > 3) errors.push(`${player.player_id}: ${cardId} has ${count} copies`);
  }

  const zoneNames = [
    'deck_card_instance_ids',
    'hand_card_instance_ids',
    'discard_card_instance_ids',
    'in_play_card_instance_ids',
  ];
  const seen = new Map();
  for (const zoneName of zoneNames) {
    for (const instanceId of player[zoneName]) {
      if (seen.has(instanceId)) errors.push(`${player.player_id}: ${instanceId} appears in ${seen.get(instanceId)} and ${zoneName}`);
      seen.set(instanceId, zoneName);
    }
  }
  if (seen.size !== 30) errors.push(`${player.player_id}: card zones contain ${seen.size} cards instead of 30`);
  const resources = player.utility_resources;
  if (resources.search_tokens > resources.max_search_tokens) errors.push(`${player.player_id}: Search Tokens exceed cap`);
  if (resources.refresh_tokens > resources.max_refresh_tokens) errors.push(`${player.player_id}: Refresh Tokens exceed cap`);
  if (player.closure_statistics.tickets_closed !== player.closure_statistics.closure_event_ids.length) {
    errors.push(`${player.player_id}: tickets_closed does not match closure event count`);
  }
  return errors;
}

export function validateActionResult(result) {
  const errors = [];
  const events = [...result.public_events, ...result.team_events, ...result.private_events];
  for (const event of events) errors.push(...validatePlayerSafeEvent(event));
  if (result.accepted && result.actions_spent > 0) {
    const placeholders = result.public_events.filter((event) => event.event_type === 'WORKLOG_PLACEHOLDER_CREATED');
    if (placeholders.length !== 1 || result.public_events[0] !== placeholders[0]) {
      errors.push('accepted paid action does not begin with exactly one public Worklog placeholder');
    } else if (result.public_events.slice(1).some((event) => event.sequence <= placeholders[0].sequence)) {
      errors.push('accepted paid action resolved before its public Worklog placeholder');
    }
  }
  if (!result.accepted) {
    if (result.match_revision_after !== result.match_revision_before) errors.push('rejected request changed Match revision');
    if (result.payment_applied || result.actions_spent !== 0
      || result.utility_resources_spent.search_tokens !== 0
      || result.utility_resources_spent.refresh_tokens !== 0
      || events.length !== 0) {
      errors.push('rejected request mutated state or paid a cost');
    }
  }
  if (result.error_code === 'STALE_REVISION' && result.match_revision_after !== result.match_revision_before) {
    errors.push('stale rejection changed Match revision');
  }
  return errors;
}

export function validateActionExchange(request, result) {
  const errors = [];
  if (request.request_id !== result.request_id) errors.push('request/result IDs differ');
  errors.push(...validateActionResult(result));
  const publicEvent = (type) => result.public_events.find((event) => event.event_type === type);

  if (request.action_type === 'PUBLISH_CLOSURE' && result.accepted) {
    if (result.actions_spent !== 0) errors.push('closure spent an Action');
    if (result.utility_resources_spent.search_tokens !== 0
      || result.utility_resources_spent.refresh_tokens !== 0) errors.push('closure spent utility resources');
    if (result.recovered_card_instance_id !== null) errors.push('closure recovered a card');
    const expected = [
      'CLOSURE_PUBLISHED',
      'WORKLOG_LOCKED',
      'SCORE_EVENTS_CREATED',
      'TICKET_ARCHIVED',
      'UTILITY_RESOURCES_GRANTED',
      'QUEUE_RECONCILED',
      'TERMINAL_EVALUATED',
      'TURN_ENDED',
    ];
    if (result.public_events.map((event) => event.event_type).join('|') !== expected.join('|')) {
      errors.push('closure transaction order is incomplete');
    }
    if (result.public_events.some((event) => event.revision !== result.match_revision_after)) {
      errors.push('closure transaction was not committed at one atomic revision');
    }
  }

  if (request.action_type === 'SEARCH' && result.accepted) {
    if (result.actions_spent !== 1
      || result.utility_resources_spent.search_tokens !== 1
      || result.utility_resources_spent.refresh_tokens !== 0) errors.push('Search must spend one Action and one Search Token');
    const event = publicEvent('SEARCH_COMPLETED');
    if (!event) {
      errors.push('Search has no zone-change event');
    } else {
      const p = event.payload;
      if (p.hand_count_after !== p.hand_count_before + 1
        || p.deck_count_after !== p.deck_count_before - 1
        || p.search_tokens_after !== p.search_tokens_before - 1
        || p.remaining_deck_shuffled !== true) errors.push('Search zone effects do not reconcile');
    }
    const privateSelection = result.private_events.find((event) => event.event_type === 'CARD_SEARCHED');
    if (!privateSelection
      || privateSelection.payload.selected_card_definition_id !== request.payload.selected_card_definition_id) {
      errors.push('Search private selection does not match the requested definition');
    }
  }

  if (request.action_type === 'REFRESH' && result.accepted) {
    if (result.actions_spent !== 1
      || result.utility_resources_spent.search_tokens !== 0
      || result.utility_resources_spent.refresh_tokens !== 1) errors.push('Refresh must spend one Action and one Refresh Token');
    const event = publicEvent('REFRESH_COMPLETED');
    if (!event) {
      errors.push('Refresh has no zone-change event');
    } else {
      const p = event.payload;
      if (p.deck_count_after !== p.deck_count_before + p.discard_count_before
        || p.discard_count_after !== 0
        || p.hand_count_after !== p.hand_count_before
        || p.in_play_count_after !== p.in_play_count_before
        || p.refresh_tokens_after !== p.refresh_tokens_before - 1
        || p.combined_and_shuffled !== true) errors.push('Refresh zone effects do not reconcile');
    }
  }
  return errors;
}

export function validatePrivatePlayerView(view) {
  const errors = [];
  errors.push(...validatePublicMatchView(view.public_match));
  const publicPlayer = view.public_match.players.find((player) => player.player_id === view.player_id);
  if (!publicPlayer) {
    errors.push('private view Player is absent from public snapshot');
  } else {
    if (publicPlayer.hand_count !== view.hand.length) errors.push('private hand IDs do not match public hand count');
    if (publicPlayer.deck_count !== view.deck_count) errors.push('private deck count does not match public deck count');
    if (publicPlayer.team_id !== view.team_id) errors.push('private team identity differs from public snapshot');
  }

  for (const event of view.authorized_events) {
    errors.push(...validatePlayerSafeEvent(event));
    if (event.visibility === 'SERVER_ONLY') errors.push(`${event.event_id}: SERVER_ONLY event entered private view`);
    if (event.visibility === 'PRIVATE_PLAYER' && !event.visible_to_player_ids.includes(view.player_id)) {
      errors.push(`${event.event_id}: private event is not addressed to view Player`);
    }
    if (event.visibility === 'TEAM' && (view.team_id === null || !event.visible_to_team_ids.includes(view.team_id))) {
      errors.push(`${event.event_id}: team event is not addressed to view team`);
    }
  }
  for (const knowledge of view.knowledge_states) {
    if (knowledge.audience === 'PRIVATE_PLAYER' && knowledge.owner_player_id !== view.player_id) {
      errors.push(`${knowledge.knowledge_state_id}: private Knowledge State belongs to another Player`);
    }
    if (knowledge.audience === 'TEAM' && knowledge.team_id !== view.team_id) {
      errors.push(`${knowledge.knowledge_state_id}: team Knowledge State belongs to another team`);
    }
  }
  return errors;
}

export function validatePublicMatchView(view) {
  const errors = [];
  for (const event of view.public_events) {
    errors.push(...validatePlayerSafeEvent(event));
    if (event.visibility !== 'PUBLIC_MATCH') errors.push(`${event.event_id}: non-public event entered public view`);
  }
  for (const closure of view.closure_statistics) {
    const closer = view.players.find((player) => player.player_id === closure.closer_player_id);
    if (!closer) errors.push(`${closure.closure_event_id}: closer is absent from public Players`);
    else if (closer.tickets_closed < 1) errors.push(`${closure.closure_event_id}: closer statistic was not incremented`);
  }
  return errors;
}

export function validateMatchState(match) {
  const errors = [];
  for (const player of match.players) errors.push(...validatePlayerState(player));
  const players = new Map(match.players.map((player) => [player.player_id, player]));
  if (match.players.length > match.configuration.seat_limit) errors.push('Player count exceeds seat limit');
  if (match.configuration.collaboration_mode === 'competitive' && match.players.length < 2) {
    errors.push('competitive match requires at least two Players');
  }
  if (!match.players.some((player) => player.seat_number === match.starting_seat_number)) {
    errors.push('starting seat is not an eligible occupied seat');
  }
  const instances = new Map();
  for (const instance of match.card_instances) {
    if (instances.has(instance.card_instance_id)) errors.push(`duplicate card instance ${instance.card_instance_id}`);
    instances.set(instance.card_instance_id, instance);
  }
  const expectedZone = new Map([
    ['deck_card_instance_ids', 'deck'],
    ['hand_card_instance_ids', 'hand'],
    ['discard_card_instance_ids', 'discard'],
    ['in_play_card_instance_ids', 'in_play'],
  ]);
  const referencedInstances = new Set();
  for (const player of match.players) {
    const playerDefinitions = [];
    for (const [zoneField, zone] of expectedZone) {
      for (const instanceId of player[zoneField]) {
        const instance = instances.get(instanceId);
        referencedInstances.add(instanceId);
        if (!instance) errors.push(`${player.player_id}: zone references missing ${instanceId}`);
        else {
          playerDefinitions.push(instance.card_definition_id);
          if (instance.owner_player_id !== player.player_id) errors.push(`${instanceId}: owner does not match zone Player`);
          if (instance.zone !== zone) errors.push(`${instanceId}: registry zone ${instance.zone} differs from ${zone}`);
        }
      }
    }
    const snapshotCounts = new Map();
    const instanceCounts = new Map();
    for (const id of player.deck_snapshot_card_definition_ids) snapshotCounts.set(id, (snapshotCounts.get(id) ?? 0) + 1);
    for (const id of playerDefinitions) instanceCounts.set(id, (instanceCounts.get(id) ?? 0) + 1);
    if (!sameSet(new Set(snapshotCounts.keys()), new Set(instanceCounts.keys()))
      || [...snapshotCounts].some(([id, count]) => instanceCounts.get(id) !== count)) {
      errors.push(`${player.player_id}: card-instance definitions do not reconcile with Ready deck snapshot`);
    }
  }
  for (const instance of match.card_instances) {
    if (['deck', 'hand', 'discard', 'in_play'].includes(instance.zone)
      && !referencedInstances.has(instance.card_instance_id)) errors.push(`${instance.card_instance_id}: registry card is absent from Player zones`);
  }

  const eventIds = new Set();
  for (const event of match.events) {
    if (eventIds.has(event.event_id)) errors.push(`duplicate event ${event.event_id}`);
    eventIds.add(event.event_id);
    if (event.sequence > match.event_sequence) errors.push(`${event.event_id}: sequence exceeds Match cursor`);
  }
  const requireEvent = (eventId, context) => {
    if (eventId !== null && !eventIds.has(eventId)) errors.push(`${context}: missing event ${eventId}`);
  };
  const contributionSlots = new Set();
  for (const contribution of match.contribution_ledger) {
    requireEvent(contribution.source_event_id, contribution.contribution_id);
    if (contributionSlots.has(contribution.slot_key)) errors.push(`duplicate contribution slot ${contribution.slot_key}`);
    contributionSlots.add(contribution.slot_key);
    if (!['ISOLATION', 'REPAIR'].includes(contribution.contribution_class)) {
      errors.push(`${contribution.contribution_id}: invalid contribution class`);
    }
    if (contribution.point_value !== 1) errors.push(`${contribution.contribution_id}: first-version slot is not one point`);
  }
  for (const score of match.service_point_events) {
    requireEvent(score.score_event_id, 'score ledger');
    requireEvent(score.settled_by_closure_event_id, score.score_event_id);
    const contribution = match.contribution_ledger.find((entry) => entry.contribution_id === score.source_contribution_id);
    if (!contribution) errors.push(`${score.score_event_id}: missing source contribution ${score.source_contribution_id}`);
    else {
      if (score.contribution_class !== contribution.contribution_class) errors.push(`${score.score_event_id}: contribution class mismatch`);
      if (score.contributor_player_id !== contribution.contributor_player_id) errors.push(`${score.score_event_id}: contributor mismatch`);
    }
    if (score.delta !== 1) errors.push(`${score.score_event_id}: first-version award is not one point`);
  }
  for (const closure of match.closure_statistics) {
    requireEvent(closure.closure_event_id, 'closure statistics');
    const closer = players.get(closure.closer_player_id);
    if (!closer) errors.push(`${closure.closure_event_id}: closer is absent from Match Players`);
    else if (!closer.closure_statistics.closure_event_ids.includes(closure.closure_event_id)) {
      errors.push(`${closure.closure_event_id}: closer Player statistic is missing`);
    }
  }
  for (const player of match.players) {
    for (const contributionId of player.contribution_ids) {
      if (!match.contribution_ledger.some((entry) => entry.contribution_id === contributionId)) {
        errors.push(`${player.player_id}: missing contribution ledger record ${contributionId}`);
      }
    }
    for (const scoreEventId of player.score_event_ids) requireEvent(scoreEventId, `${player.player_id} score ledger`);
    for (const closureEventId of player.closure_statistics.closure_event_ids) {
      requireEvent(closureEventId, `${player.player_id} closure statistics`);
    }
  }
  requireEvent(match.last_queue_reconciliation_event_id, 'queue reconciliation');
  if (match.result) {
    requireEvent(match.result.evaluated_after_event_id, 'Match result');
    for (const player of match.players) {
      if (match.result.final_player_scores[player.player_id] !== player.service_points) {
        errors.push(`${player.player_id}: final result score differs from authoritative Player score`);
      }
    }
  }

  const active = new Set(match.active_tickets.map((ticket) => ticket.ticket_instance_id));
  for (const ticket of match.active_tickets) {
    errors.push(...validateTicketLifecycle(ticket));
    if (ticket.status === 'CLOSED') errors.push(`${ticket.ticket_instance_id}: closed Ticket remained active`);
  }
  for (const archivedId of match.archived_ticket_instance_ids) {
    if (active.has(archivedId)) errors.push(`${archivedId}: Ticket is both active and archived`);
  }
  if (match.status === 'COMPLETED' && match.turn_state !== null) errors.push('completed Match retained a turn');
  if (match.turn_state) {
    errors.push(...validateTurnState(match.turn_state));
    for (const ticketId of match.turn_state.closure_window.eligible_ticket_instance_ids) {
      if (match.archived_ticket_instance_ids.includes(ticketId)) errors.push(`${ticketId}: archived Ticket remained in closure window`);
    }
  }
  return errors;
}
