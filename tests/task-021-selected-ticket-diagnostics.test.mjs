import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  TASK_014_BUILDER_VERSION,
  TASK_014_CARD_CATALOG_VERSION,
  TASK_014_CONFIGURATION_VERSION,
  TASK_014_DOMAIN_CONTENT_VERSION,
  TASK_014_TICKET_CONTENT_VERSION,
  buildTicketsV3,
  createTask014Catalogs,
} from '../src/builder/task-014.mjs';
import { createMatch, projectPrivatePlayer, submitIntent } from '../src/engine/index.mjs';
import {
  buildSelectedActionPresentation,
  projectedDropIntent,
} from '../viewer/js/play/action-presentation.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(ROOT, relative), 'utf8'));
const raw = {
  cards: readJson('content/gameplay-v1/card-catalog-v3.json'),
  decks: readJson('content/gameplay-v1/decks-v3.json'),
  domain: readJson('content/gameplay-v1/domain-snapshot-v2.json'),
  parts: readJson('content/gameplay-v1/task-014-parts.json'),
  coverage: readJson('content/gameplay-v1/playable-coverage-v3.json'),
};
const catalogs = createTask014Catalogs(raw);
const PLAYER_ID = 'player.task_021';
const TEAM_ID = 'team.task_021';
const DIAGNOSTIC_CARD_ID = 'card.bench.test.boot.device_inventory';
const FINGERPRINT_IDS = Object.freeze([
  'fingerprint.boot.incorrect_order',
  'fingerprint.network.failed_cable',
  'fingerprint.power.unseated_psu',
]);

function counts(cardDefinitionIds) {
  const result = {};
  for (const id of cardDefinitionIds) result[id] = (result[id] ?? 0) + 1;
  return result;
}

function buildThreeTicketFixture() {
  const starter = catalogs.decks.decks.find((deck) => deck.id === 'deck.core.multisystem_response_v3');
  const diagnosticIds = catalogs.cards.cards
    .filter((card) => card.play_contract.contract_type === 'DIAGNOSTIC')
    .map((card) => card.id)
    .sort();
  const available = counts(starter.card_definition_ids);
  const result = buildTicketsV3({
    catalogs,
    configuration: {
      id: 'builder_config.task_021_three_ticket_reproduction',
      entity_type: 'ticket_builder_configuration',
      configuration_version: TASK_014_CONFIGURATION_VERSION,
      scenario_or_mode_context: 'TRAINING',
      requested_ticket_count: 3,
      seed: 'task-021-selected-ticket-reproduction',
      generator_version: TASK_014_BUILDER_VERSION,
      content_version: TASK_014_TICKET_CONTENT_VERSION,
      domain_content_version: TASK_014_DOMAIN_CONTENT_VERSION,
      card_catalog_version: TASK_014_CARD_CATALOG_VERSION,
      allowed_domain_ids: [],
      excluded_domain_ids: [],
      allowed_tags: [],
      excluded_tags: [],
      guaranteed_categories: [],
      required_teaching_beats: [],
      authored_difficulty_bounds: { minimum: 1, maximum: 4 },
      fault_count_bounds: { minimum: 1, maximum: 3 },
      required_actionable_fault_count_bounds: { minimum: 1, maximum: 2 },
      causal_depth_bounds: { minimum: 0, maximum: 1 },
      inbound_branching_bounds: { minimum: 0, maximum: 2 },
      outbound_branching_bounds: { minimum: 0, maximum: 2 },
      progressive_difficulty_profile: {
        profile_id: 'progressive.task_021_reproduction',
        profile_version: 'task-021',
        explicit_ceiling: 4,
        bands: [{ start_generated_index: 0, end_generated_index: 2, target: 2, minimum: 1, maximum: 4 }],
      },
      generation_index_start: 0,
      allow_duplicate_causal_fingerprints: false,
      active_causal_fingerprints: [],
      allowed_fingerprint_ids: [...FINGERPRINT_IDS],
      legal_card_definition_ids: [...new Set([...diagnosticIds, ...Object.keys(available)])].sort(),
      diagnostic_card_definition_ids: diagnosticIds,
      available_card_definition_counts: available,
      fallback_configuration_id: null,
    },
  });
  const attempt = result.attempts.find((entry) => entry.attempt_id === result.selected_attempt_id);
  assert.equal(result.status, 'SUCCESS');
  assert.equal(attempt.ticket_snapshots.length, 3);
  return { starter, attempt };
}

function diagnosticIntents(projection, cardInstanceId) {
  return projection.legal_intents.filter((intent) => intent.action_type === 'RUN_TEST'
    && intent.payload.card_instance_id === cardInstanceId);
}

test('three-Ticket fixture preserves other-Ticket diagnostic intents after the displayed-Ticket result', () => {
  const { starter, attempt } = buildThreeTicketFixture();
  const state = createMatch({
    matchId: 'match.task_021.reproduction',
    players: [{
      player_id: PLAYER_ID,
      display_name: 'Continuity Technician',
      controller_type: 'human',
      team_id: TEAM_ID,
      seat_number: 1,
    }],
    decksByPlayer: { [PLAYER_ID]: starter.card_definition_ids },
    ticketSnapshots: attempt.ticket_snapshots,
    catalogs: catalogs.engineCatalogs,
    configuration: {
      collaboration_mode: 'cooperative',
      execution_mode: 'offline',
      starting_ticket_count: 3,
      queue_minimum: 0,
      termination_score: -1,
      starting_search_tokens: 3,
      ticket_search_tokens: 1,
      max_search_tokens: 5,
      starting_refresh_tokens: 1,
      max_refresh_tokens: 1,
      turn_cap: null,
      closure_cap: null,
      play_context: 'SOLO',
    },
    rulesetVersion: 'first-version-v2',
    seed: 'task-021-selected-ticket-reproduction',
    now: '2026-08-26T12:00:00.000Z',
  });
  const ticketIdByName = new Map(Object.values(state.tickets).map((ticket) => [
    ticket.definition_snapshot.presentation.display_name,
    ticket.ticket_instance_id,
  ]));
  const displayedTicketId = ticketIdByName.get('Booting the Wrong Device');
  const otherTicketIds = [
    ticketIdByName.get('Network Path Down'),
    ticketIdByName.get('Redundancy Path Unavailable'),
  ];
  assert.ok(displayedTicketId);
  assert.ok(otherTicketIds.every(Boolean));

  const diagnosticCardInstanceId = state.players[0].diagnostic_bench_card_instance_ids.find(
    (instanceId) => state.card_instances[instanceId].card_definition_id === DIAGNOSTIC_CARD_ID,
  );
  const before = projectPrivatePlayer(state, PLAYER_ID, catalogs.engineCatalogs);
  const beforeIntents = diagnosticIntents(before, diagnosticCardInstanceId);
  assert.deepEqual(
    beforeIntents.map((intent) => intent.payload.ticket_instance_id).sort(),
    [displayedTicketId, ...otherTicketIds].sort(),
  );
  const displayedIntent = beforeIntents.find((intent) =>
    intent.payload.ticket_instance_id === displayedTicketId);
  assert.ok(displayedIntent);
  const actionsBefore = state.turn.actions_remaining;

  const exchange = submitIntent({
    state,
    request: {
      request_id: 'match.task_021.reproduction.request.001',
      match_id: state.match_id,
      player_id: PLAYER_ID,
      expected_revision: state.revision,
      action_type: displayedIntent.action_type,
      payload: structuredClone(displayedIntent.payload),
      client_nonce: 'task-021-reproduction-001',
    },
    authenticatedPlayerId: PLAYER_ID,
    catalogs: catalogs.engineCatalogs,
    now: '2026-08-26T12:00:01.000Z',
  });
  assert.equal(exchange.result.accepted, true);
  assert.equal(exchange.result.actions_spent, 1);
  assert.equal(exchange.state.turn.actions_remaining, actionsBefore - 1);
  const evidence = exchange.events.find((event) => event.event_type === 'EVIDENCE_CREATED');
  assert.equal(evidence.ticket_instance_id, displayedTicketId);
  assert.equal(evidence.payload.source_definition_id, 'test.boot.device_inventory');
  assert.equal(evidence.payload.machine_revision, 0);

  const after = projectPrivatePlayer(exchange.state, PLAYER_ID, catalogs.engineCatalogs);
  const afterIntents = diagnosticIntents(after, diagnosticCardInstanceId);
  assert.deepEqual(
    afterIntents.map((intent) => intent.payload.ticket_instance_id).sort(),
    otherTicketIds.sort(),
  );
  assert.equal(afterIntents.some((intent) => intent.payload.ticket_instance_id === displayedTicketId), false);
  assert.ok(after.authorized_events.some((event) => event.event_id === evidence.event_id));
});

test('selection presentation scopes Bench diagnostics and preserves response-Card alternate targets', () => {
  const diagnostic = {
    card_instance_id: 'card.instance.diagnostic',
    card_definition_id: DIAGNOSTIC_CARD_ID,
  };
  const diagnosticDefinition = catalogs.cards.cards.find((card) => card.id === DIAGNOSTIC_CARD_ID);
  const bench = [diagnostic];
  const ticketA = { ticket_instance_id: 'ticket.a', machine_revision: 0 };
  const intent = (ticketId, suffix = ticketId) => ({
    intent_id: `intent.${suffix}`,
    action_type: 'RUN_TEST',
    ticket_instance_id: ticketId,
    card_instance_id: diagnostic.card_instance_id,
    card_definition_id: diagnostic.card_definition_id,
  });
  const allTicketIntents = [intent('ticket.a'), intent('ticket.b'), intent('ticket.c')];

  const before = buildSelectedActionPresentation({
    selectedCard: diagnostic,
    diagnosticBench: bench,
    legalIntents: allTicketIntents,
    selectedTicket: ticketA,
    cardDefinition: diagnosticDefinition,
  });
  assert.equal(before.selectionKind, 'BENCH_DIAGNOSTIC');
  assert.deepEqual(before.actionIntents.map((entry) => entry.ticket_instance_id), ['ticket.a']);
  assert.deepEqual(before.alternateTicketIds, []);

  const authorizedEvents = [{
    event_id: 'event.evidence.a',
    event_type: 'EVIDENCE_CREATED',
    sequence: 7,
    ticket_instance_id: 'ticket.a',
    payload: {
      source_definition_id: 'test.boot.device_inventory',
      machine_revision: 0,
    },
  }];
  const after = buildSelectedActionPresentation({
    selectedCard: diagnostic,
    diagnosticBench: bench,
    legalIntents: allTicketIntents.slice(1),
    selectedTicket: ticketA,
    cardDefinition: diagnosticDefinition,
    authorizedEvents,
  });
  assert.equal(after.statusCode, 'COMPLETED_CURRENT_REVISION');
  assert.deepEqual(after.actionIntents, []);
  assert.deepEqual(after.alternateTicketIds, []);
  assert.match(after.statusMessage, /Completed for this machine revision/);
  assert.match(after.statusMessage, /No Action was spent/);

  const ticketB = { ticket_instance_id: 'ticket.b', machine_revision: 0 };
  const onTicketB = buildSelectedActionPresentation({
    selectedCard: diagnostic,
    diagnosticBench: bench,
    legalIntents: allTicketIntents.slice(1),
    selectedTicket: ticketB,
    cardDefinition: diagnosticDefinition,
    authorizedEvents,
  });
  assert.deepEqual(onTicketB.actionIntents.map((entry) => entry.ticket_instance_id), ['ticket.b']);

  const responseCard = { card_instance_id: 'card.instance.response', card_definition_id: 'card.response' };
  const responseIntents = ['ticket.b', 'ticket.c'].map((ticketId) => ({
    intent_id: `intent.response.${ticketId}`,
    action_type: 'PERFORM_REPAIR',
    ticket_instance_id: ticketId,
    card_instance_id: responseCard.card_instance_id,
    card_definition_id: responseCard.card_definition_id,
  }));
  const response = buildSelectedActionPresentation({
    selectedCard: responseCard,
    diagnosticBench: bench,
    legalIntents: responseIntents,
    selectedTicket: ticketA,
    cardDefinition: { play_contract: { target_spec: { target_kind: 'ACTIVE_TICKET' } } },
  });
  assert.equal(response.selectionKind, 'RESPONSE_CARD');
  assert.deepEqual(response.actionIntents, responseIntents);
  assert.deepEqual(response.alternateTicketIds, ['ticket.b', 'ticket.c']);

  assert.equal(projectedDropIntent({
    legalIntents: allTicketIntents,
    diagnosticBench: bench,
    cardInstanceId: diagnostic.card_instance_id,
    ticketInstanceId: 'ticket.b',
    selectedTicketId: 'ticket.a',
  }), null);
  assert.equal(projectedDropIntent({
    legalIntents: responseIntents,
    diagnosticBench: bench,
    cardInstanceId: responseCard.card_instance_id,
    ticketInstanceId: 'ticket.b',
    selectedTicketId: 'ticket.a',
  })?.intent_id, 'intent.response.ticket.b');
});

test('diagnostic presentation fails closed and recomputes component, Action, and revision availability', () => {
  const diagnostic = {
    card_instance_id: 'card.instance.diagnostic',
    card_definition_id: DIAGNOSTIC_CARD_ID,
  };
  const bench = [diagnostic];
  const selectedTicket = { ticket_instance_id: 'ticket.a', machine_revision: 1 };
  const activeDefinition = catalogs.cards.cards.find((card) => card.id === DIAGNOSTIC_CARD_ID);
  const duplicatedActiveIntents = [1, 2].map((index) => ({
    intent_id: `intent.active.${index}`,
    action_type: 'RUN_TEST',
    ticket_instance_id: 'ticket.a',
    card_instance_id: diagnostic.card_instance_id,
    card_definition_id: diagnostic.card_definition_id,
  }));
  const invalid = buildSelectedActionPresentation({
    selectedCard: diagnostic,
    diagnosticBench: bench,
    legalIntents: duplicatedActiveIntents,
    selectedTicket,
    cardDefinition: activeDefinition,
  });
  assert.equal(invalid.statusCode, 'INVALID_ACTIVE_TICKET_MULTIPLICITY');
  assert.deepEqual(invalid.actionIntents, []);

  const componentDefinition = {
    play_contract: {
      source_definition_id: 'test.component.fixture',
      target_spec: { target_kind: 'TICKET_COMPONENT' },
    },
  };
  const component = buildSelectedActionPresentation({
    selectedCard: diagnostic,
    diagnosticBench: bench,
    legalIntents: duplicatedActiveIntents,
    selectedTicket,
    cardDefinition: componentDefinition,
  });
  assert.equal(component.statusCode, 'RUNNABLE');
  assert.equal(component.actionIntents.length, 2);

  const staleResult = [{
    event_id: 'event.old',
    event_type: 'EVIDENCE_CREATED',
    sequence: 1,
    ticket_instance_id: 'ticket.a',
    payload: { source_definition_id: 'test.component.fixture', machine_revision: 0 },
  }];
  const unavailable = buildSelectedActionPresentation({
    selectedCard: diagnostic,
    diagnosticBench: bench,
    legalIntents: [],
    selectedTicket,
    cardDefinition: componentDefinition,
    authorizedEvents: staleResult,
  });
  assert.equal(unavailable.statusCode, 'UNAVAILABLE');
  assert.match(unavailable.statusMessage, /Not currently runnable on this Ticket/);
  assert.match(unavailable.statusMessage, /no Action spent/);

  const oneComponentResult = buildSelectedActionPresentation({
    selectedCard: diagnostic,
    diagnosticBench: bench,
    legalIntents: [],
    selectedTicket,
    cardDefinition: componentDefinition,
    authorizedEvents: [{
      event_id: 'event.component.current',
      event_type: 'EVIDENCE_CREATED',
      sequence: 2,
      ticket_instance_id: 'ticket.a',
      payload: {
        source_definition_id: 'test.component.fixture',
        machine_revision: 1,
        target_ref: 'ticket.a.target.001',
      },
    }],
  });
  assert.equal(oneComponentResult.statusCode, 'UNAVAILABLE');
  assert.match(oneComponentResult.statusMessage, /Not currently runnable on this Ticket/);
});
