const VISIBILITIES = new Set(['SERVER_ONLY', 'PRIVATE_PLAYER', 'TEAM', 'PUBLIC_MATCH']);

export function appendEvent(state, {
  eventType,
  actorPlayerId = null,
  ticketInstanceId = null,
  actionId = null,
  visibility = 'PUBLIC_MATCH',
  visibleToPlayerIds = [],
  visibleToTeamIds = [],
  payload = {},
  worklogProjection = null,
  actionTime = null,
  publicationTime = null,
  now,
}) {
  if (!VISIBILITIES.has(visibility)) throw new Error(`Unknown visibility ${visibility}`);
  if (visibility === 'PRIVATE_PLAYER' && visibleToPlayerIds.length === 0) {
    throw new Error('PRIVATE_PLAYER event requires a recipient');
  }
  if (visibility === 'TEAM' && visibleToTeamIds.length === 0) {
    throw new Error('TEAM event requires a recipient');
  }
  if (['SERVER_ONLY', 'PUBLIC_MATCH'].includes(visibility)
    && (visibleToPlayerIds.length > 0 || visibleToTeamIds.length > 0)) {
    throw new Error(`${visibility} event cannot have explicit recipients`);
  }
  state.event_sequence += 1;
  const event = {
    event_id: `${state.match_id}.event.${String(state.event_sequence).padStart(6, '0')}`,
    match_id: state.match_id,
    sequence: state.event_sequence,
    revision: state.revision,
    event_type: eventType,
    actor_player_id: actorPlayerId,
    ticket_instance_id: ticketInstanceId,
    action_id: actionId,
    visibility,
    visible_to_player_ids: [...visibleToPlayerIds],
    visible_to_team_ids: [...visibleToTeamIds],
    payload,
    worklog_projection: worklogProjection,
    action_time: actionTime,
    publication_time: publicationTime,
    created_at: now,
  };
  state.events.push(event);
  return event;
}

export function appendWorklogPlaceholder(state, {
  ticket,
  actorPlayerId,
  actionId,
  sourceName,
  publicTargetSurface,
  actionCost,
  sourceCardInstanceId = null,
  now,
}) {
  const event = appendEvent(state, {
    eventType: 'WORKLOG_PLACEHOLDER_CREATED',
    actorPlayerId,
    ticketInstanceId: ticket?.ticket_instance_id ?? null,
    actionId,
    payload: {
      source_name: sourceName,
      public_target_surface: publicTargetSurface,
      action_cost: actionCost,
    },
    now,
  });
  event.worklog_projection = {
    placeholder_event_id: event.event_id,
    source_action_event_id: event.event_id,
    source_result_event_id: null,
    public_summary: `${sourceName} targets ${publicTargetSurface}.`,
    action_time: now,
    publication_event_id: null,
    publication_time: null,
    publisher_player_id: null,
    locked: false,
  };
  event.action_time = now;
  if (ticket) {
    ticket.worklog_entries.push({
      placeholder_event_id: event.event_id,
      sequence: event.sequence,
      actor_player_id: actorPlayerId,
      action_id: actionId,
      source_card_instance_id: sourceCardInstanceId,
      source_name: sourceName,
      public_target_surface: publicTargetSurface,
      action_cost: actionCost,
      action_time: now,
      source_result_event_id: null,
      public_result_summary: null,
      publication_event_id: null,
      publication_time: null,
      publisher_player_id: null,
      locked: false,
    });
  }
  return event;
}

export function eventVisibleToPlayer(event, player) {
  if (!event || !player) return false;
  if (event.visibility === 'PUBLIC_MATCH') return true;
  if (event.visibility === 'PRIVATE_PLAYER') {
    return event.visible_to_player_ids.includes(player.player_id);
  }
  if (event.visibility === 'TEAM') {
    return player.team_id !== null && event.visible_to_team_ids.includes(player.team_id);
  }
  return false;
}
