import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  DIAGNOSIS_V2_BUILDER_VERSION,
  DIAGNOSIS_V2_CARD_CATALOG_VERSION,
  DIAGNOSIS_V2_CONFIGURATION_VERSION,
  DIAGNOSIS_V2_TICKET_CONTENT_VERSION,
  buildTicketsV2,
  createDiagnosisV2Catalogs,
  deriveDiagnosticRelevance,
  validateDiagnosisV2Ticket,
} from '../src/builder/diagnosis-v2.mjs';
import {
  canonicalJson,
  createMatch,
  getLegalIntents,
  projectPrivatePlayer,
  projectPublicMatch,
  replayDigest,
  submitIntent,
} from '../src/engine/index.mjs';
import { loadSchemaRegistry, validateJsonSchema } from './helpers/json-schema-validator.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const schemaRegistry = loadSchemaRegistry(ROOT);
const schemaByTitle = new Map(schemaRegistry.schemas.map(({ schema }) => [schema.title, schema]));
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(ROOT, relative), 'utf8'));
const base = {
  cards: readJson('content/gameplay-v1/card-catalog.json'),
  decks: readJson('content/gameplay-v1/decks.json'),
  domain: readJson('content/gameplay-v1/domain-snapshot.json'),
  ticketContent: readJson('content/gameplay-v1/ticket-templates.json'),
};
const catalogs = createDiagnosisV2Catalogs(base);
const PLAYER_ONE = 'player.diagnosis.one';
const PLAYER_TWO = 'player.diagnosis.two';
const TEAM = 'team.diagnosis';
let requestSequence = 0;

function ticket(id) {
  return structuredClone(catalogs.ticketContent.templates.find((entry) => entry.ticket.id === id).ticket);
}

function configuration(requestedTicketCount = 1) {
  return {
    id: 'builder_config.task_013',
    entity_type: 'ticket_builder_configuration',
    configuration_version: DIAGNOSIS_V2_CONFIGURATION_VERSION,
    scenario_or_mode_context: 'TRAINING',
    requested_ticket_count: requestedTicketCount,
    seed: 'task-013-builder',
    generator_version: DIAGNOSIS_V2_BUILDER_VERSION,
    content_version: DIAGNOSIS_V2_TICKET_CONTENT_VERSION,
    domain_content_version: base.domain.domain_content_version,
    card_catalog_version: DIAGNOSIS_V2_CARD_CATALOG_VERSION,
    allowed_domain_ids: [], excluded_domain_ids: [], allowed_tags: [], excluded_tags: [],
    guaranteed_categories: [], required_teaching_beats: [],
    authored_difficulty_bounds: { minimum: 1, maximum: 4 },
    fault_count_bounds: { minimum: 1, maximum: 3 },
    required_actionable_fault_count_bounds: { minimum: 1, maximum: 2 },
    causal_depth_bounds: { minimum: 0, maximum: 1 },
    inbound_branching_bounds: { minimum: 0, maximum: 2 },
    outbound_branching_bounds: { minimum: 0, maximum: 2 },
    progressive_difficulty_profile: {
      profile_id: 'progressive.task_013', profile_version: 'diagnosis-v2', explicit_ceiling: 4,
      bands: [{ start_generated_index: 0, end_generated_index: requestedTicketCount - 1, target: 2, minimum: 1, maximum: 4 }],
    },
    generation_index_start: 0,
    allow_duplicate_causal_fingerprints: true,
    active_causal_fingerprints: [],
    legal_card_definition_ids: catalogs.cards.cards.map((card) => card.id).sort(),
    fallback_configuration_id: null,
  };
}

function players(count) {
  return Array.from({ length: count }, (_, index) => ({
    player_id: index === 0 ? PLAYER_ONE : PLAYER_TWO,
    display_name: `Technician ${index + 1}`,
    controller_type: 'human',
    team_id: TEAM,
    seat_number: index + 1,
  }));
}

function match(ticketSnapshots, { playerCount = 1, playContext = 'SOLO', collaborationMode = 'cooperative' } = {}) {
  requestSequence = 0;
  const roster = players(playerCount);
  const responseDeck = catalogs.decks.decks[0].card_definition_ids;
  return createMatch({
    matchId: `match.task_013.${ticketSnapshots.length}.${playerCount}.${playContext.toLowerCase()}`,
    players: roster,
    decksByPlayer: Object.fromEntries(roster.map((player) => [player.player_id, responseDeck])),
    ticketSnapshots,
    catalogs: catalogs.engineCatalogs,
    configuration: {
      collaboration_mode: collaborationMode,
      execution_mode: 'offline',
      starting_ticket_count: ticketSnapshots.length,
      queue_minimum: 0,
      termination_score: -1,
      starting_search_tokens: 3,
      ticket_search_tokens: 1,
      max_search_tokens: 5,
      starting_refresh_tokens: 1,
      max_refresh_tokens: 1,
      turn_cap: null,
      closure_cap: null,
      play_context: playContext,
    },
    rulesetVersion: 'first-version-v2',
    seed: 'task-013-engine',
    now: '2026-08-24T12:00:00.000Z',
  });
}

function intents(state, playerId = state.turn.active_player_id) {
  return getLegalIntents({ state, playerId, catalogs: catalogs.engineCatalogs });
}

function findIntent(state, actionType, predicate = () => true, playerId = state.turn.active_player_id) {
  return intents(state, playerId).find((intent) => intent.action_type === actionType && predicate(intent));
}

function submit(state, intent, playerId = state.turn.active_player_id) {
  assert.ok(intent, 'Expected a legal intent');
  requestSequence += 1;
  return submitIntent({
    state,
    request: {
      request_id: `${state.match_id}.request.${String(requestSequence).padStart(4, '0')}`,
      match_id: state.match_id,
      player_id: playerId,
      expected_revision: state.revision,
      action_type: intent.action_type,
      payload: structuredClone(intent.payload),
      client_nonce: `nonce.${requestSequence}`,
    },
    authenticatedPlayerId: playerId,
    catalogs: catalogs.engineCatalogs,
    now: new Date(Date.parse('2026-08-24T12:00:00.000Z') + requestSequence * 1000).toISOString(),
  });
}

function runDiagnostic(state, sourceDefinitionId, playerId = state.turn.active_player_id) {
  return submit(state, findIntent(state, 'RUN_TEST', (intent) =>
    intent.payload.execution_definition_id === sourceDefinitionId, playerId), playerId);
}

function lastEvent(exchange, eventType) {
  return [...exchange.events].reverse().find((event) => event.event_type === eventType);
}

function playResponse(state, actionType, cardDefinitionId) {
  let intent = findIntent(state, actionType, (entry) => entry.payload.card_instance_id
    && state.card_instances[entry.payload.card_instance_id]?.card_definition_id === cardDefinitionId);
  if (!intent) {
    const search = findIntent(state, 'SEARCH', (entry) => entry.payload.selected_card_definition_id === cardDefinitionId);
    assert.ok(search, `Expected ${cardDefinitionId} in hand or Search`);
    state = submit(state, search).state;
    intent = findIntent(state, actionType, (entry) => entry.payload.card_instance_id
      && state.card_instances[entry.payload.card_instance_id]?.card_definition_id === cardDefinitionId);
  }
  assert.ok(intent, `Expected ${actionType} for ${cardDefinitionId}`);
  return submit(state, intent);
}

test('diagnosis-v2 catalogs derive bounded plausible candidates, complete outcomes, typed routes, and Builder failures', () => {
  const response = catalogs.decks.decks[0];
  assert.equal(response.card_definition_ids.length, 30);
  const counts = Object.groupBy(response.card_definition_ids, (id) => id);
  assert.ok(Object.values(counts).every((copies) => copies.length <= 6));
  const cardById = new Map(catalogs.cards.cards.map((card) => [card.id, card]));
  assert.ok(response.card_definition_ids.every((id) => cardById.get(id).play_contract.contract_type !== 'DIAGNOSTIC'));

  const routeKinds = new Set();
  const diagnosticSources = new Set(catalogs.cards.cards
    .filter((card) => card.play_contract.contract_type === 'DIAGNOSTIC')
    .map((card) => card.play_contract.source_definition_id));
  for (const template of catalogs.ticketContent.templates) {
    const snapshot = template.ticket;
    assert.deepEqual(validateDiagnosisV2Ticket(snapshot, {
      domainCatalog: catalogs.domain,
      cardCatalog: catalogs.cards,
    }), { valid: true, errors: [] });
    assert.ok(snapshot.public_candidate_fault_ids.length >= 2 && snapshot.public_candidate_fault_ids.length <= 5);
    const truth = new Set(snapshot.server_only_truth.fault_instances.map((fault) => fault.fault_id));
    assert.ok([...truth].every((id) => snapshot.public_candidate_fault_ids.includes(id)));
    for (const candidateId of snapshot.public_candidate_fault_ids.filter((id) => !truth.has(id))) {
      assert.ok(snapshot.authored_evidence_outcomes.some((outcome) => outcome.candidate_effects.some((effect) =>
        effect.candidate_fault_id === candidateId && ['CONTRADICT', 'RULE_OUT'].includes(effect.disposition))));
    }
    const machineStates = new Set(snapshot.authored_evidence_outcomes.map((outcome) => outcome.eligible_machine_state_key));
    for (const stateKey of machineStates) for (const sourceId of diagnosticSources) {
      assert.equal(snapshot.authored_evidence_outcomes.filter((outcome) =>
        outcome.eligible_machine_state_key === stateKey && outcome.source_definition_id === sourceId).length, 1);
    }
    snapshot.isolation_requirements.flatMap((requirement) => requirement.routes)
      .forEach((route) => routeKinds.add(route.route_kind));
  }
  assert.deepEqual([...routeKinds].sort(), [
    'CORROBORATED_SUPPORT',
    'DEFINITIVE_DIAGNOSTIC',
    'DIRECT_OBSERVATION',
    'EVIDENCE_BACKED_ELIMINATION',
    'RECOVERY_DERIVED',
  ]);

  const generatedConfiguration = configuration();
  generatedConfiguration.allowed_tags = ['cabling'];
  const generated = buildTicketsV2({ configuration: generatedConfiguration, catalogs });
  assert.equal(generated.status, 'SUCCESS');
  const generatedAttempt = generated.attempts.find((attempt) => attempt.attempt_id === generated.selected_attempt_id);
  const generatedCable = generatedAttempt.ticket_snapshots[0];
  assert.equal(generatedCable.generation_provenance.template_id, 'ticket_template.storage.loose_cable');
  assert.ok(generatedCable.authored_evidence_outcomes.find((outcome) =>
    outcome.outcome_id === 'evidence.storage.connector_unlatched').candidate_effects.some((effect) =>
    effect.candidate_fault_id === 'fault.storage.cable.loose' && effect.disposition === 'CONFIRM'));

  const badCatalogs = structuredClone(catalogs);
  for (const entity of badCatalogs.domain.entities) entity.relationships = (entity.relationships ?? [])
    .filter((relationship) => relationship.role !== 'associated_fault');
  const failure = buildTicketsV2({ configuration: configuration(), catalogs: badCatalogs });
  assert.equal(failure.status, 'FAILURE');
  assert.ok(failure.attempts.flatMap((attempt) => attempt.diagnostics)
    .some((diagnostic) => diagnostic.code === 'HIDDEN_FAULT_NOT_PUBLICLY_PLAUSIBLE'));
});

test('the persistent Bench is complete, public-graph-derived, view-neutral, and never produces a silent diagnostic', () => {
  let state = match([ticket('ticket.storage.loose_cable')]);
  const before = canonicalJson(state);
  const beforeReplay = replayDigest(state);
  const beforeIntents = intents(state);
  const view = projectPrivatePlayer(state, PLAYER_ONE, catalogs.engineCatalogs);
  assert.deepEqual(validateJsonSchema(
    view,
    schemaByTitle.get('Private Player Match View'),
    schemaRegistry,
  ), []);
  assert.deepEqual(validateJsonSchema(
    view.public_match,
    schemaByTitle.get('Public Match View'),
    schemaRegistry,
  ), []);
  assert.equal(view.diagnostic_bench.length, 6);
  assert.equal(state.players[0].hand_card_instance_ids.length, 6);
  assert.ok(view.diagnostic_bench.every((entry) => entry.ticket_relevance.length === 1));
  assert.doesNotMatch(JSON.stringify(view.diagnostic_bench), /server_only_truth|fault_instances|actual_present/);
  assert.match(view.diagnostic_relevance_notice, /graph may be incomplete/i);
  const relevance = deriveDiagnosticRelevance({
    ticket: {
      initial_symptom_ids: view.public_match.repair_queue[0].visible_symptom_ids,
      public_candidate_fault_ids: view.public_match.repair_queue[0].public_candidate_fault_ids,
      public_context_entity_ids: ticket('ticket.storage.loose_cable').public_context_entity_ids,
    },
    domainCatalog: catalogs.domain,
    cardCatalog: catalogs.cards,
  });
  assert.equal(relevance.size, 6);

  const presentation = { bench_view: 'RELEVANT', search: '', type: 'ALL', page: 1 };
  presentation.bench_view = 'GLOBAL';
  presentation.search = 'smart';
  assert.equal(canonicalJson(state), before);
  assert.equal(replayDigest(state), beforeReplay);
  assert.deepEqual(intents(state), beforeIntents);

  const exchange = runDiagnostic(state, 'command.linux.smartctl');
  assert.equal(exchange.result.accepted, true);
  assert.equal(exchange.result.actions_spent, 1);
  assert.match(exchange.result.target_summary, /ticket/i);
  assert.ok(exchange.result.result_summary.length > 0);
  const evidence = lastEvent(exchange, 'EVIDENCE_CREATED');
  assert.ok(evidence);
  assert.deepEqual(evidence.payload.candidate_effects, []);
  assert.ok(['CLEAN', 'IRRELEVANT', 'INCONCLUSIVE'].includes(evidence.payload.outcome_classification));
  state = exchange.state;
  assert.equal(state.players[0].diagnostic_bench_card_instance_ids.length, 6);
  assert.equal(state.players[0].discard_card_instance_ids.length, 0);
  assert.ok(projectPrivatePlayer(state, PLAYER_ONE, catalogs.engineCatalogs).authorized_events
    .some((event) => event.event_id === evidence.event_id));
});

test('direct CONFIRM, definitive CONFIRM, non-actionable CONFIRM, and generic rejection use candidate-specific routes', () => {
  let state = match([ticket('ticket.storage.loose_cable')]);
  let exchange = runDiagnostic(state, 'test.general.visual_inspection');
  const visual = lastEvent(exchange, 'EVIDENCE_CREATED');
  state = exchange.state;
  exchange = submit(state, findIntent(state, 'COMMIT_ISOLATION', (intent) =>
    intent.payload.candidate_fault_id === 'fault.storage.cable.loose'
      && intent.payload.cited_evidence_event_ids.includes(visual.event_id)));
  assert.equal(exchange.result.accepted, true);
  assert.equal(lastEvent(exchange, 'ISOLATION_ACCEPTED').payload.isolation_route_id, 'route.storage.cable_loose.direct_observation');

  state = match([ticket('ticket.storage.single_sas_member')]);
  exchange = runDiagnostic(state, 'test.storage.drive_health');
  const health = lastEvent(exchange, 'EVIDENCE_CREATED');
  state = exchange.state;
  exchange = submit(state, findIntent(state, 'COMMIT_ISOLATION', (intent) =>
    intent.payload.candidate_fault_id === 'fault.storage.sas.drive_failed'
      && intent.payload.cited_evidence_event_ids.includes(health.event_id)));
  assert.match(lastEvent(exchange, 'ISOLATION_ACCEPTED').payload.isolation_route_id, /\.definitive$/);

  state = match([ticket('ticket.storage.single_sas_member')]);
  exchange = runDiagnostic(state, 'test.storage.raid_status');
  const status = lastEvent(exchange, 'EVIDENCE_CREATED');
  assert.equal(status.payload.candidate_effects.find((effect) =>
    effect.candidate_fault_id === 'fault.storage.raid.degraded').disposition, 'CONFIRM');
  state = exchange.state;
  exchange = submit(state, findIntent(state, 'COMMIT_ISOLATION', (intent) =>
    intent.payload.candidate_fault_id === 'fault.storage.raid.degraded'
      && intent.payload.cited_evidence_event_ids.includes(status.event_id)));
  assert.equal(exchange.result.resolution_code, 'ISOLATION_NOT_SUPPORTED');
  assert.equal(exchange.result.actions_spent, 1);
  assert.match(exchange.result.result_summary, /not supported/i);
  assert.doesNotMatch(exchange.result.result_summary, /actionable|requirement|hidden/i);
});

test('corroborated support combines team-visible Evidence and attributes every contributor', () => {
  let state = match([ticket('ticket.storage.member_then_array')], { playerCount: 2 });
  const firstPlayer = state.turn.active_player_id;
  const secondPlayer = state.players.find((player) => player.player_id !== firstPlayer).player_id;
  let exchange = runDiagnostic(state, 'test.storage.raid_status', firstPlayer);
  const status = lastEvent(exchange, 'EVIDENCE_CREATED');
  state = exchange.state;
  exchange = submit(state, findIntent(state, 'PASS_TURN', () => true, firstPlayer), firstPlayer);
  state = exchange.state;
  exchange = runDiagnostic(state, 'command.linux.smartctl', secondPlayer);
  const smartctl = lastEvent(exchange, 'EVIDENCE_CREATED');
  state = exchange.state;
  exchange = submit(state, findIntent(state, 'COMMIT_ISOLATION', (intent) =>
    intent.payload.candidate_fault_id === 'fault.storage.sas.drive_failed'
      && intent.payload.cited_evidence_event_ids.includes(status.event_id)
      && intent.payload.cited_evidence_event_ids.includes(smartctl.event_id), secondPlayer), secondPlayer);
  const accepted = lastEvent(exchange, 'ISOLATION_ACCEPTED');
  assert.match(accepted.payload.isolation_route_id, /corroborated$/);
  assert.deepEqual(accepted.payload.contributing_player_ids, [firstPlayer, secondPlayer].sort());
});

test('RULE_OUT elimination is free, cited, reversible, stage-bound, and can satisfy its authored route', () => {
  const migrated = ticket('ticket.storage.loose_cable');
  const visualOutcome = migrated.authored_evidence_outcomes.find((outcome) =>
    outcome.source_definition_id === 'test.general.visual_inspection'
      && outcome.eligible_machine_state_key === migrated.server_only_truth.initial_machine_state_key);
  visualOutcome.candidate_effects.find((effect) =>
    effect.candidate_fault_id === 'fault.storage.cable.loose').disposition = 'SUPPORT';
  let state = match([migrated]);
  let exchange = runDiagnostic(state, 'test.general.visual_inspection');
  const visual = lastEvent(exchange, 'EVIDENCE_CREATED');
  state = exchange.state;
  const eliminate = findIntent(state, 'SET_ELIMINATION', (intent) =>
    intent.payload.candidate_fault_id === 'fault.storage.raid.controller_failed'
      && intent.payload.eliminated === true
      && intent.payload.cited_evidence_event_ids.includes(visual.event_id));
  exchange = submit(state, eliminate);
  assert.equal(exchange.result.actions_spent, 0);
  const eliminationEvent = lastEvent(exchange, 'CANDIDATE_ELIMINATION_SET');
  state = exchange.state;

  const staleState = structuredClone(state);
  staleState.tickets[staleState.active_ticket_ids[0]].diagnosis_revision += 1;
  const stale = submit(staleState, {
    action_type: 'SET_ELIMINATION',
    payload: { ...eliminate.payload },
  });
  assert.equal(stale.result.accepted, false);
  assert.equal(stale.result.error_code, 'ELIMINATION_NOT_SUPPORTED');
  assert.equal(stale.result.actions_spent, 0);
  assert.equal(stale.result.target_summary, null);
  assert.equal(canonicalJson(stale.state), canonicalJson(staleState));

  const reverse = findIntent(state, 'SET_ELIMINATION', (intent) =>
    intent.payload.candidate_fault_id === 'fault.storage.raid.controller_failed' && intent.payload.eliminated === false);
  const reversed = submit(state, reverse);
  assert.equal(reversed.result.actions_spent, 0);
  assert.equal(lastEvent(reversed, 'CANDIDATE_ELIMINATION_SET').payload.supersedes_elimination_event_id, eliminationEvent.event_id);

  state = exchange.state;
  exchange = runDiagnostic(state, 'test.storage.device_inventory');
  const inventory = lastEvent(exchange, 'EVIDENCE_CREATED');
  state = exchange.state;
  exchange = submit(state, findIntent(state, 'COMMIT_ISOLATION', (intent) =>
    intent.payload.candidate_fault_id === 'fault.storage.cable.loose'
      && intent.payload.cited_evidence_event_ids.includes(visual.event_id)
      && intent.payload.cited_evidence_event_ids.includes(inventory.event_id)));
  assert.equal(lastEvent(exchange, 'ISOLATION_ACCEPTED').payload.isolation_route_id, 'route.storage.cable_loose.elimination');
});

test('failed Verify Evidence activates the recovery-derived second-stage Isolation route', () => {
  let state = match([ticket('ticket.storage.member_then_array')]);
  let exchange = runDiagnostic(state, 'test.storage.drive_health');
  const health = lastEvent(exchange, 'EVIDENCE_CREATED');
  state = exchange.state;
  exchange = submit(state, findIntent(state, 'COMMIT_ISOLATION', (intent) =>
    intent.payload.candidate_fault_id === 'fault.storage.sas.drive_failed'
      && intent.payload.cited_evidence_event_ids.includes(health.event_id)));
  state = exchange.state;
  exchange = playResponse(state, 'PERFORM_REPAIR', 'card.core.replace_raid_member');
  state = exchange.state;
  exchange = playResponse(state, 'PERFORM_VERIFY', 'card.core.raid_health_verification');
  const verifyEvidence = lastEvent(exchange, 'VERIFY_EVIDENCE_CREATED');
  assert.equal(lastEvent(exchange, 'VERIFY_RESOLVED').payload.result, 'FAIL');
  state = exchange.state;
  exchange = submit(state, findIntent(state, 'COMMIT_ISOLATION', (intent) =>
    intent.payload.candidate_fault_id === 'fault.storage.raid.degraded'
      && intent.payload.cited_evidence_event_ids.includes(verifyEvidence.event_id)));
  assert.match(lastEvent(exchange, 'ISOLATION_ACCEPTED').payload.isolation_route_id, /recovery$/);
});

test('confirmed solo Give Up is atomic, private, queue-safe, non-winning, and exactly recorded', () => {
  let state = match([ticket('ticket.storage.loose_cable'), ticket('ticket.storage.loose_cable')]);
  let exchange = runDiagnostic(state, 'test.general.visual_inspection');
  const evidence = lastEvent(exchange, 'EVIDENCE_CREATED');
  state = exchange.state;
  exchange = submit(state, findIntent(state, 'COMMIT_ISOLATION', (intent) =>
    intent.payload.candidate_fault_id === 'fault.storage.cable.loose'
      && intent.payload.cited_evidence_event_ids.includes(evidence.event_id)));
  state = exchange.state;
  const firstTicketId = state.active_ticket_ids[0];
  const unconfirmed = submit(state, {
    action_type: 'GIVE_UP_TICKET',
    payload: { ticket_instance_id: firstTicketId, confirmed: false },
  });
  assert.equal(unconfirmed.result.accepted, false);
  assert.equal(unconfirmed.result.error_code, 'CONFIRMATION_REQUIRED');
  assert.equal(unconfirmed.result.actions_spent, 0);
  assert.equal(canonicalJson(unconfirmed.state), canonicalJson(state));

  exchange = submit(state, findIntent(state, 'GIVE_UP_TICKET', (intent) =>
    intent.payload.ticket_instance_id === firstTicketId));
  state = exchange.state;
  assert.equal(state.status, 'ACTIVE');
  assert.equal(state.give_up_statistics.length, 1);
  assert.ok(state.contribution_ledger.filter((entry) => entry.ticket_instance_id === firstTicketId)
    .every((entry) => entry.settlement_status === 'VOID_GIVE_UP'));
  assert.equal(findIntent(state, 'RUN_TEST', (intent) => intent.payload.ticket_instance_id === firstTicketId), undefined);
  assert.doesNotMatch(JSON.stringify(projectPublicMatch(state)), /solution_reveal|required_evidence|causal_path/);
  const privateView = projectPrivatePlayer(state, PLAYER_ONE, catalogs.engineCatalogs);
  assert.equal(privateView.solution_reveals.length, 1);
  assert.ok(privateView.solution_reveals[0].solution_reveal.faults.length > 0);

  const remainingTicketId = state.active_ticket_ids[0];
  exchange = submit(state, findIntent(state, 'GIVE_UP_TICKET', (intent) =>
    intent.payload.ticket_instance_id === remainingTicketId));
  state = exchange.state;
  assert.equal(state.status, 'COMPLETED');
  assert.ok(state.result.reason_codes.includes('GIVE_UP'));
  assert.deepEqual(state.result.winner_player_ids, []);
  assert.deepEqual(state.result.winning_team_ids, []);
  assert.equal(state.give_up_statistics.length, 2);

  const competitive = match([ticket('ticket.storage.loose_cable')], {
    playerCount: 2,
    playContext: 'MULTIPLAYER',
    collaborationMode: 'competitive',
  });
  assert.equal(findIntent(competitive, 'GIVE_UP_TICKET'), undefined);
  assert.deepEqual(projectPrivatePlayer(competitive, PLAYER_ONE, catalogs.engineCatalogs).solution_reveals, []);
});
