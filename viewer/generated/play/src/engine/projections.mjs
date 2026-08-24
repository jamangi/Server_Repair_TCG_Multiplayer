import { cardActionType, cardContractType, cardMap, cardName, cardSourceDefinitionId } from './catalogs.mjs';
import { canonicalJson } from './determinism.mjs';
import { eventVisibleToPlayer } from './events.mjs';
import { assertPlayerSafe } from './invariants.mjs';

function playerById(state, playerId) {
  return state.players.find((player) => player.player_id === playerId) ?? null;
}

function publicCitationIds(state, ids) {
  const allowed = new Set(state.events
    .filter((event) => event.visibility === 'PUBLIC_MATCH')
    .map((event) => event.event_id));
  return ids.filter((id) => allowed.has(id));
}

function publicTicket(state, ticket) {
  return {
    ticket_instance_id: ticket.ticket_instance_id,
    ticket_definition_id: ticket.ticket_definition_id,
    status: ticket.status,
    machine_revision: ticket.machine_revision,
    visible_symptom_ids: [...ticket.visible_symptom_ids],
    public_candidate_fault_ids: [...ticket.public_candidate_fault_ids],
    accepted_isolations: ticket.isolation_history
      .filter((record) => record.accepted)
      .map((record) => ({
        isolation_event_id: record.isolation_event_id,
        candidate_fault_id: record.candidate_fault_id,
        public_fault_instance_id: record.public_fault_instance_id,
        contributor_player_id: record.player_id,
        classification: record.classification,
        cited_public_evidence_event_ids: publicCitationIds(state, record.cited_evidence_event_ids),
      })),
    repair_summaries: ticket.repair_history.map((record) => ({
      repair_event_id: record.repair_event_id,
      player_id: record.player_id,
      repair_procedure_id: record.repair_procedure_id,
      public_summary: record.public_summary,
      machine_revision: record.machine_revision,
    })),
    verify_summaries: ticket.verification_history.map((record) => ({
      verify_event_id: record.verify_event_id,
      player_id: record.player_id,
      validation_procedure_id: record.validation_procedure_id,
      requirement_id: record.requirement_id,
      result: record.result,
      is_current: record.is_current,
    })),
    worklog: ticket.worklog_entries.map((entry) => ({
      placeholder_event_id: entry.placeholder_event_id,
      sequence: entry.sequence,
      actor_player_id: entry.actor_player_id,
      source_name: entry.source_name,
      public_target_surface: entry.public_target_surface,
      action_cost: entry.action_cost,
      action_time: entry.action_time,
      public_result_summary: entry.public_result_summary,
      publication_event_id: entry.publication_event_id,
      publication_time: entry.publication_time,
      publisher_player_id: entry.publisher_player_id,
      locked: entry.locked,
    })),
    ready_to_close: ticket.status === 'READY_TO_CLOSE',
  };
}

function publicClosedTicket(state, ticket) {
  const closed = publicTicket(state, ticket);
  const closure = ticket.closure;
  return {
    ...closed,
    closure: {
      closure_event_id: closure.closure_event_id,
      closer_player_id: closure.closer_player_id,
      attributed_team_id: closure.attributed_team_id,
      action_cost: closure.action_cost,
      accepted_isolation_event_ids: [...closure.accepted_isolation_event_ids],
      decisive_public_evidence_event_ids: publicCitationIds(state, closure.decisive_evidence_event_ids),
      repair_event_ids: [...closure.repair_event_ids],
      failed_verify_event_ids: [...closure.failed_verify_event_ids],
      current_passing_verify_event_ids: [...closure.current_passing_verify_event_ids],
      worklog_locked_event_id: closure.worklog_locked_event_id,
      score_event_ids: [...closure.score_event_ids],
      ticket_archived_event_id: closure.ticket_archived_event_id,
      utility_grant_event_ids: [...closure.utility_grant_event_ids],
      queue_reconciled_event_id: closure.queue_reconciled_event_id,
      terminal_evaluated_event_id: closure.terminal_evaluated_event_id,
      turn_ended_event_id: closure.turn_ended_event_id,
      closed_at: closure.closed_at,
    },
  };
}

export function projectPublicMatch(state) {
  const view = {
    projection_version: 'engine-projection-v1',
    match_id: state.match_id,
    revision: state.revision,
    ruleset_version: state.ruleset_version,
    card_catalog_version: state.card_catalog_version,
    status: state.status,
    collaboration_mode: state.collaboration_mode,
    players: state.players.map((player) => ({
      player_id: player.player_id,
      display_name: player.display_name,
      controller_type: player.controller_type,
      team_id: player.team_id,
      seat_number: player.seat_number,
      active: player.active,
      service_points: player.service_points,
      team_service_points: player.team_id === null ? null : state.team_scores[player.team_id],
      hand_count: player.hand_card_instance_ids.length,
      deck_count: player.deck_card_instance_ids.length,
      discard_card_definition_ids: player.discard_card_instance_ids
        .map((id) => state.card_instances[id].card_definition_id),
      in_play_card_definition_ids: player.in_play_card_instance_ids
        .map((id) => state.card_instances[id].card_definition_id),
      search_tokens: player.search_tokens,
      max_search_tokens: player.max_search_tokens,
      refresh_tokens: player.refresh_tokens,
      max_refresh_tokens: player.max_refresh_tokens,
      tickets_closed: player.tickets_closed,
      connection_status: player.connection_status,
    })),
    repair_queue: state.active_ticket_ids.map((id) => publicTicket(state, state.tickets[id])),
    closed_tickets: state.archived_ticket_ids.map((id) => publicClosedTicket(state, state.archived_tickets[id])),
    turn: state.turn === null ? null : {
      round_number: state.turn.round_number,
      turn_number: state.turn.turn_number,
      active_player_id: state.turn.active_player_id,
      phase: state.turn.phase,
      actions_remaining: state.turn.actions_remaining,
      closure_window_open: state.turn.closure_window.is_open,
      closure_eligible_ticket_instance_ids: [...state.turn.closure_window.eligible_ticket_instance_ids],
      zero_action_card_names_played: [...state.turn.zero_action_card_names_played],
    },
    closure_statistics: state.closure_statistics.map((record) => ({ ...record })),
    service_point_events: state.service_point_events.map((record) => ({ ...record })),
    result: state.result === null ? null : {
      winner_player_ids: [...state.result.winner_player_ids],
      winning_team_ids: [...state.result.winning_team_ids],
      valid: state.result.valid,
      reason_codes: [...state.result.reason_codes],
      final_player_scores: { ...state.result.final_player_scores },
      final_team_scores: { ...state.result.final_team_scores },
      public_statistics: state.result.statistics.map((record) => ({
        ...record,
        ticket_instance_id: record.ticket_instance_id ?? null,
      })),
      completed_at: state.result.completed_at,
    },
    public_events: state.events
      .filter((event) => event.visibility === 'PUBLIC_MATCH')
      .map((event) => structuredClone(event)),
    last_event_sequence: state.event_sequence,
  };
  return assertPlayerSafe(view);
}

function safeClosureBundle(state, ticket, player) {
  const eventById = new Map(state.events.map((event) => [event.event_id, event]));
  const decisive = [];
  for (const isolationId of ticket.accepted_path_isolation_event_ids) {
    const isolation = ticket.isolation_history.find((record) => record.isolation_event_id === isolationId);
    if (!isolation) return null;
    for (const evidenceId of isolation.cited_evidence_event_ids) {
      const event = eventById.get(evidenceId);
      // The opaque citation identity is Ticket-owned progress after accepted
      // Isolation. Its concealed result remains absent from this Player's
      // authorized_events unless separately shared or documented.
      if (!event || event.ticket_instance_id !== ticket.ticket_instance_id) return null;
      decisive.push(evidenceId);
    }
  }
  return {
    ticket_instance_id: ticket.ticket_instance_id,
    accepted_isolation_event_ids: [...ticket.accepted_path_isolation_event_ids],
    decisive_evidence_event_ids: [...new Set(decisive)],
    repair_event_ids: [...ticket.accepted_path_repair_event_ids],
    failed_verify_event_ids: ticket.verification_history
      .filter((record) => ['FAIL', 'INCONCLUSIVE'].includes(record.result))
      .map((record) => record.verify_event_id),
    current_passing_verify_event_ids: [...ticket.current_verify_pass_event_ids],
  };
}

function privateBase(state, playerId) {
  const player = playerById(state, playerId);
  if (!player) throw new Error(`Unknown Player ${playerId}`);
  const authorizedEvents = state.events
    .filter((event) => eventVisibleToPlayer(event, player))
    .map((event) => structuredClone(event));
  const documentableActions = state.action_records
    .filter((record) => record.card_instance_id !== null
      && record.source_result_event_id !== null
      && state.active_ticket_ids.includes(record.ticket_instance_id)
      && !record.documented
      && eventVisibleToPlayer(state.events.find((event) => event.event_id === record.source_result_event_id), player)
      && state.card_instances[record.card_instance_id]?.zone === 'discard')
    .map((record) => ({
      ticket_instance_id: record.ticket_instance_id,
      source_action_event_id: record.placeholder_event_id,
      source_result_event_id: record.source_result_event_id,
      worklog_placeholder_event_id: record.placeholder_event_id,
      source_card_instance_id: record.card_instance_id,
      source_card_owner_player_id: state.card_instances[record.card_instance_id].owner_player_id,
    }));
  const closureBundles = {};
  for (const ticketId of state.active_ticket_ids) {
    const ticket = state.tickets[ticketId];
    if (ticket.status === 'READY_TO_CLOSE') {
      const bundle = safeClosureBundle(state, ticket, player);
      if (bundle) closureBundles[ticketId] = bundle;
    }
  }
  return {
    projection_version: 'engine-projection-v1',
    player_id: player.player_id,
    team_id: player.team_id,
    match_id: state.match_id,
    revision: state.revision,
    public_match: projectPublicMatch(state),
    hand: player.hand_card_instance_ids.map((id) => ({
      card_instance_id: id,
      card_definition_id: state.card_instances[id].card_definition_id,
    })),
    deck_count: player.deck_card_instance_ids.length,
    discard_card_instance_ids: [...player.discard_card_instance_ids],
    search_card_definition_ids: [...new Set(player.deck_card_instance_ids
      .map((id) => state.card_instances[id].card_definition_id))].sort(),
    utility_resources: {
      search_tokens: player.search_tokens,
      max_search_tokens: player.max_search_tokens,
      refresh_tokens: player.refresh_tokens,
      max_refresh_tokens: player.max_refresh_tokens,
    },
    authorized_events: authorizedEvents,
    hypotheses: structuredClone(player.hypotheses),
    documentable_actions: documentableActions,
    closure_bundles: closureBundles,
    reconnect: {
      snapshot_installed: true,
      snapshot_revision: state.revision,
      snapshot_event_sequence: state.event_sequence,
      unseen_semantic_event_ids: [],
    },
  };
}

function deriveLegalIntents(view, catalogs, state) {
  const publicState = view.public_match;
  const turn = publicState.turn;
  if (!turn || turn.active_player_id !== view.player_id || publicState.status !== 'ACTIVE') return [];
  const cards = cardMap(catalogs);
  const intents = [];
  const actions = turn.actions_remaining;

  for (const ticket of publicState.repair_queue) {
    for (const candidateId of ticket.public_candidate_fault_ids) {
      const existing = view.hypotheses[ticket.ticket_instance_id] ?? [];
      if (existing.length !== 1 || existing[0] !== candidateId) {
        intents.push({
          action_type: 'REVISE_HYPOTHESIS',
          payload: { ticket_instance_id: ticket.ticket_instance_id, candidate_fault_ids: [candidateId] },
        });
      }
      const directCitationIds = view.authorized_events
        .filter((event) => ['EVIDENCE_CREATED', 'VERIFY_EVIDENCE_CREATED'].includes(event.event_type)
          && event.ticket_instance_id === ticket.ticket_instance_id)
        .map((event) => event.event_id);
      const publishedCitationIds = view.authorized_events
        .filter((event) => event.visibility === 'PUBLIC_MATCH'
          && event.event_type === 'WORKLOG_PUBLICATION'
          && event.ticket_instance_id === ticket.ticket_instance_id)
        .map((event) => event.payload.source_result_event_id)
        .filter((id) => {
          const event = state.events.find((candidate) => candidate.event_id === id);
          return event && ['EVIDENCE_CREATED', 'VERIFY_EVIDENCE_CREATED'].includes(event.event_type)
            && event.ticket_instance_id === ticket.ticket_instance_id;
        });
      const citationIds = [...new Set([...directCitationIds, ...publishedCitationIds])].sort();
      if (actions >= 1
        && ['DIAGNOSIS', 'RETURNED_TO_DIAGNOSIS'].includes(ticket.status)
        && citationIds.length > 0) {
        intents.push({
          action_type: 'COMMIT_ISOLATION',
          payload: {
            ticket_instance_id: ticket.ticket_instance_id,
            candidate_fault_id: candidateId,
            cited_evidence_event_ids: citationIds,
          },
        });
      }
    }
    if (view.closure_bundles[ticket.ticket_instance_id]) {
      intents.push({ action_type: 'PUBLISH_CLOSURE', payload: view.closure_bundles[ticket.ticket_instance_id] });
    }
  }

  for (const held of view.hand) {
    const card = cards.get(held.card_definition_id);
    if (!card || card.cost > actions) continue;
    const name = cardName(card);
    if (card.cost === 0 && publicState.turn.zero_action_card_names_played?.includes(name)) continue;
    for (const ticket of publicState.repair_queue) {
      const authoritativeTicket = state.tickets[ticket.ticket_instance_id];
      if (cardContractType(card) === 'DIAGNOSTIC') {
        const sourceDefinitionId = cardSourceDefinitionId(card);
        const outcomes = authoritativeTicket.definition_snapshot.authored_evidence_outcomes.filter(
          (outcome) => outcome.source_definition_id === sourceDefinitionId
            && outcome.eligible_machine_state_key === authoritativeTicket.machine_state_key,
        );
        const targetKind = card.play_contract.target_spec.target_kind;
        let targetOptions = [];
        if (targetKind === 'ACTIVE_TICKET') {
          if (outcomes.length === 1) {
            targetOptions = [{ outcome: outcomes[0], target_ref: ticket.ticket_instance_id }];
          }
        } else if (targetKind === 'TICKET_COMPONENT') {
          for (const [targetToken, target] of Object.entries(authoritativeTicket.authored_diagnostic_targets)) {
            const matching = outcomes.filter((outcome) => outcome.target_ref === target.authored_target_ref);
            if (matching.length === 1) targetOptions.push({ outcome: matching[0], target_ref: targetToken });
          }
        }
        for (const option of targetOptions) {
          if (authoritativeTicket.test_history.some((record) =>
            record.outcome_id === option.outcome.outcome_id
            && record.target_ref === option.target_ref
            && record.machine_revision === authoritativeTicket.machine_revision)) continue;
          intents.push({
            action_type: cardActionType(card),
            payload: {
              ticket_instance_id: ticket.ticket_instance_id,
              card_instance_id: held.card_instance_id,
              execution_definition_id: sourceDefinitionId,
              target_ref: option.target_ref,
              observed_machine_revision: ticket.machine_revision,
            },
          });
        }
      } else if (cardContractType(card) === 'REPAIR' && ['REPAIR_READY', 'AWAITING_VERIFY'].includes(ticket.status)) {
        const isolation = ticket.accepted_isolations.at(-1);
        const gate = authoritativeTicket.isolation_history.find((record) =>
          record.isolation_event_id === authoritativeTicket.current_repair_gate_isolation_event_id);
        const procedureId = cardSourceDefinitionId(card);
        const allowed = isolation && gate
          && card.play_contract.target_spec.allowed_fault_definition_ids.includes(gate.candidate_fault_id)
          && authoritativeTicket.definition_snapshot.repair_requirements.some((requirement) =>
            requirement.target_fault_instance_key === gate.target_fault_instance_key
              && requirement.eligible_repair_procedure_ids.includes(procedureId))
          && authoritativeTicket.definition_snapshot.authored_repair_outcomes.filter((outcome) =>
            outcome.repair_procedure_id === procedureId
              && outcome.eligible_machine_state_key === authoritativeTicket.machine_state_key).length === 1;
        if (allowed) intents.push({
          action_type: cardActionType(card),
          payload: {
            ticket_instance_id: ticket.ticket_instance_id,
            card_instance_id: held.card_instance_id,
            repair_procedure_id: procedureId,
            isolated_fault_instance_id: isolation.public_fault_instance_id,
          },
        });
      } else if (cardContractType(card) === 'VERIFY' && ticket.status === 'AWAITING_VERIFY') {
        const procedureId = cardSourceDefinitionId(card);
        const outcomes = authoritativeTicket.definition_snapshot.authored_verification_outcomes.filter(
          (outcome) => outcome.validation_procedure_id === procedureId
            && outcome.eligible_machine_state_key === authoritativeTicket.machine_state_key,
        );
        if (outcomes.length !== 1) continue;
        intents.push({
          action_type: cardActionType(card),
          payload: {
            ticket_instance_id: ticket.ticket_instance_id,
            card_instance_id: held.card_instance_id,
            validation_procedure_id: procedureId,
          },
        });
      }
    }
  }

  if (actions >= 1) {
    for (const documentable of view.documentable_actions) {
      intents.push({
        action_type: 'DOCUMENT_LIVE',
        payload: {
          ticket_instance_id: documentable.ticket_instance_id,
          source_action_event_id: documentable.source_action_event_id,
          source_result_event_id: documentable.source_result_event_id,
          worklog_placeholder_event_id: documentable.worklog_placeholder_event_id,
        },
      });
    }
    if (view.utility_resources.search_tokens > 0) {
      for (const cardDefinitionId of view.search_card_definition_ids) {
        intents.push({
          action_type: 'SEARCH',
          payload: { selected_card_definition_id: cardDefinitionId },
        });
      }
    }
    if (view.utility_resources.refresh_tokens > 0) {
      intents.push({ action_type: 'REFRESH', payload: {} });
    }
  }
  intents.push({ action_type: 'PASS_TURN', payload: {} });
  return intents.sort((left, right) => canonicalJson(left).localeCompare(canonicalJson(right)));
}

export function projectPrivatePlayer(state, playerId, catalogs) {
  const base = privateBase(state, playerId);
  const view = { ...base, legal_intents: deriveLegalIntents(base, catalogs, state) };
  return assertPlayerSafe(view);
}

export function getLegalIntents({ state, playerId, catalogs }) {
  return structuredClone(projectPrivatePlayer(state, playerId, catalogs).legal_intents);
}
