import test from 'node:test';
import assert from 'node:assert/strict';

import {
  assertPlayerSafe,
  assertValidState,
  canonicalJson,
  createMatch,
  findPlayerSafeLeaks,
  getLegalIntents,
  projectPrivatePlayer,
  projectPublicMatch,
  replayDigest,
  stopForProvenStalemate,
  stopSimulationAtCap,
  submitIntent,
} from '../src/engine/index.mjs';

function reference(entityId, entityType, role = 'execution') {
  return { entity_id: entityId, entity_type: entityType, role, inherit_illustration: true };
}

function diagnostic(id, displayName, sourceId, cost, targetKind = 'ACTIVE_TICKET') {
  return {
    id,
    presentation: { display_name: displayName },
    cost,
    primary_domain_reference: reference(sourceId, 'test'),
    additional_domain_references: [],
    play_contract: {
      contract_type: 'DIAGNOSTIC',
      action_type: 'RUN_TEST',
      source_definition_id: sourceId,
      source_entity_type: 'test',
      target_spec: {
        target_kind: targetKind,
        allowed_component_definition_ids: targetKind === 'TICKET_COMPONENT' ? ['component.fixture'] : [],
      },
      prerequisites: [],
      resolution: [{ resolution_type: 'AUTHORED_EVIDENCE', source_definition_id: sourceId }],
      disposition: 'discard',
    },
  };
}

function repair(id, displayName, procedureId, faultId) {
  return {
    id,
    presentation: { display_name: displayName },
    cost: 1,
    primary_domain_reference: reference(procedureId, 'repair_procedure'),
    additional_domain_references: [],
    play_contract: {
      contract_type: 'REPAIR',
      action_type: 'PERFORM_REPAIR',
      repair_procedure_id: procedureId,
      target_spec: { target_kind: 'ACCEPTED_ISOLATED_FAULT', allowed_fault_definition_ids: [faultId] },
      prerequisites: [{ prerequisite_type: 'ACCEPTED_ISOLATION' }],
      resolution: [{ resolution_type: 'AUTHORED_REPAIR', repair_procedure_id: procedureId }],
      disposition: 'discard',
    },
  };
}

function verify(id, displayName, procedureId) {
  return {
    id,
    presentation: { display_name: displayName },
    cost: 1,
    primary_domain_reference: reference(procedureId, 'validation_procedure'),
    additional_domain_references: [],
    play_contract: {
      contract_type: 'VERIFY',
      action_type: 'PERFORM_VERIFY',
      validation_procedure_id: procedureId,
      target_spec: { target_kind: 'ACTIVE_TICKET_VERIFICATION_REQUIREMENT' },
      prerequisites: [{ prerequisite_type: 'REPAIR_HISTORY_PRESENT' }],
      resolution: [{ resolution_type: 'AUTHORED_VERIFY', validation_procedure_id: procedureId }],
      disposition: 'discard',
    },
  };
}

const cards = [
  diagnostic('card.fixture.visual', 'Visual Inspection', 'test.fixture.visual', 0),
  diagnostic('card.fixture.same_name', 'Visual Inspection', 'test.fixture.secondary', 0),
  diagnostic('card.fixture.component', 'Component Probe', 'test.fixture.component', 1, 'TICKET_COMPONENT'),
  diagnostic('card.fixture.spare_a', 'Spare Diagnostic A', 'test.fixture.spare_a', 1),
  diagnostic('card.fixture.spare_b', 'Spare Diagnostic B', 'test.fixture.spare_b', 1),
  repair('card.fixture.repair_a', 'Repair A', 'repair.fixture.a', 'fault.fixture.a'),
  repair('card.fixture.repair_b', 'Repair B', 'repair.fixture.b', 'fault.fixture.b'),
  repair('card.fixture.repair_spare', 'Spare Repair', 'repair.fixture.spare', 'fault.fixture.spare'),
  verify('card.fixture.verify', 'Service Verification', 'verify.fixture.service'),
  verify('card.fixture.verify_spare', 'Spare Verification', 'verify.fixture.spare'),
];

const deck = cards.flatMap((card) => [card.id, card.id, card.id]);
const catalogs = {
  cards: {
    card_catalog_version: 'fixture-card-catalog-v1',
    domain_content_version: 'fixture-domain-v1',
    ruleset_version: 'first-version-v1',
    cards,
  },
  decks: {
    ruleset_version: 'first-version-v1',
    card_catalog_version: 'fixture-card-catalog-v1',
    decks: [{ id: 'deck.fixture', display_name: 'Fixture Deck', card_definition_ids: deck }],
  },
  content_version: 'fixture-domain-v1',
};

function ticketSnapshot(id = 'ticket.fixture.iterative') {
  return {
    id,
    initial_symptom_ids: ['symptom.fixture.service_down'],
    public_candidate_fault_ids: ['fault.fixture.a', 'fault.fixture.b', 'fault.fixture.decoy'],
    server_only_truth: {
      initial_machine_state_key: 'machine.fixture.a_active',
      fault_instances: [
        {
          fault_instance_key: 'fault_instance.fixture.a',
          fault_id: 'fault.fixture.a',
          role: 'ACTIONABLE',
          actionable: true,
          deepest: true,
          required_to_repair: true,
        },
        {
          fault_instance_key: 'fault_instance.fixture.b',
          fault_id: 'fault.fixture.b',
          role: 'ACTIONABLE',
          actionable: true,
          deepest: true,
          required_to_repair: true,
        },
      ],
      causal_edge_ids: ['edge.fixture.a_to_b'],
      causal_edges: [{
        causal_edge_id: 'edge.fixture.a_to_b',
        cause_fault_instance_key: 'fault_instance.fixture.a',
        effect_fault_instance_key: 'fault_instance.fixture.b',
      }],
    },
    authored_evidence_outcomes: [
      {
        outcome_id: 'outcome.fixture.visual_a',
        source_definition_id: 'test.fixture.visual',
        target_ref: 'fault_instance.fixture.a',
        eligible_machine_state_key: 'machine.fixture.a_active',
        candidate_effects: [{ candidate_fault_id: 'fault.fixture.a', disposition: 'CONFIRM' }],
        observation_id: 'observation.fixture.a',
        public_summary: 'The first actionable Fault is visibly confirmed.',
      },
      {
        outcome_id: 'outcome.fixture.secondary_a',
        source_definition_id: 'test.fixture.secondary',
        target_ref: 'fault_instance.fixture.a',
        eligible_machine_state_key: 'machine.fixture.a_active',
        candidate_effects: [{ candidate_fault_id: 'fault.fixture.a', disposition: 'SUPPORT' }],
        observation_id: 'observation.fixture.secondary',
        public_summary: 'A second inspection supports the first Fault.',
      },
      {
        outcome_id: 'outcome.fixture.component_b',
        source_definition_id: 'test.fixture.component',
        target_ref: 'fault_instance.fixture.b',
        eligible_machine_state_key: 'machine.fixture.b_exposed',
        candidate_effects: [{ candidate_fault_id: 'fault.fixture.b', disposition: 'SUPPORT' }],
        observation_id: 'observation.fixture.b',
        public_summary: 'The concealed component probe supports the second Fault.',
      },
    ],
    isolation_requirements: [
      {
        requirement_id: 'isolation.fixture.a',
        target_fault_instance_key: 'fault_instance.fixture.a',
        candidate_fault_id: 'fault.fixture.a',
        classification: 'ACTIONABLE_AND_DEEPEST',
        minimum_citations: 1,
        eligible_outcome_ids: ['outcome.fixture.visual_a'],
        eligible_verification_outcome_ids: [],
      },
      {
        requirement_id: 'isolation.fixture.b',
        target_fault_instance_key: 'fault_instance.fixture.b',
        candidate_fault_id: 'fault.fixture.b',
        classification: 'ACTIONABLE_AND_DEEPEST',
        minimum_citations: 1,
        eligible_outcome_ids: [],
        eligible_verification_outcome_ids: ['outcome.fixture.verify_fail'],
      },
    ],
    repair_requirements: [
      {
        requirement_id: 'repair_requirement.fixture.a',
        target_fault_instance_key: 'fault_instance.fixture.a',
        fault_id: 'fault.fixture.a',
        eligible_repair_procedure_ids: ['repair.fixture.a'],
        eligible_repair_outcome_ids: ['repair_outcome.fixture.a'],
      },
      {
        requirement_id: 'repair_requirement.fixture.b',
        target_fault_instance_key: 'fault_instance.fixture.b',
        fault_id: 'fault.fixture.b',
        eligible_repair_procedure_ids: ['repair.fixture.b'],
        eligible_repair_outcome_ids: ['repair_outcome.fixture.b'],
      },
    ],
    authored_repair_outcomes: [
      {
        outcome_id: 'repair_outcome.fixture.a',
        repair_procedure_id: 'repair.fixture.a',
        target_fault_instance_key: 'fault_instance.fixture.a',
        eligible_machine_state_key: 'machine.fixture.a_active',
        resulting_machine_state_key: 'machine.fixture.a_repaired',
        resolved_fault_instance_keys: ['fault_instance.fixture.a'],
        necessary_for_closure: true,
        public_summary: 'The first isolated Fault is repaired.',
      },
      {
        outcome_id: 'repair_outcome.fixture.b',
        repair_procedure_id: 'repair.fixture.b',
        target_fault_instance_key: 'fault_instance.fixture.b',
        eligible_machine_state_key: 'machine.fixture.b_exposed',
        resulting_machine_state_key: 'machine.fixture.operational',
        resolved_fault_instance_keys: ['fault_instance.fixture.b'],
        necessary_for_closure: true,
        public_summary: 'The second isolated Fault is repaired.',
      },
    ],
    verification_requirements: [{
      requirement_id: 'verification.fixture.service',
      validation_procedure_id: 'verify.fixture.service',
      success_condition: 'Service is healthy after the latest Repair.',
      must_pass_after_latest_repair: true,
    }],
    authored_verification_outcomes: [
      {
        outcome_id: 'outcome.fixture.verify_fail',
        validation_procedure_id: 'verify.fixture.service',
        requirement_id: 'verification.fixture.service',
        eligible_machine_state_key: 'machine.fixture.a_repaired',
        result: 'FAIL',
        resulting_machine_state_key: 'machine.fixture.b_exposed',
        revealed_candidate_fault_ids: ['fault.fixture.b'],
        candidate_effects: [{ candidate_fault_id: 'fault.fixture.b', disposition: 'CONFIRM' }],
        public_summary: 'Verify fails and exposes a second actionable Fault.',
      },
      {
        outcome_id: 'outcome.fixture.verify_pass',
        validation_procedure_id: 'verify.fixture.service',
        requirement_id: 'verification.fixture.service',
        eligible_machine_state_key: 'machine.fixture.operational',
        result: 'PASS',
        resulting_machine_state_key: 'machine.fixture.operational',
        revealed_candidate_fault_ids: [],
        candidate_effects: [],
        public_summary: 'Verify passes after both Repairs.',
      },
    ],
    closure_requirements: {
      include_accepted_isolation: true,
      include_cited_decisive_evidence: true,
      include_every_repair_in_accepted_path: true,
      include_every_failed_verify_in_accepted_path: true,
      include_all_current_passing_verifies: true,
      required_fault_instance_keys: ['fault_instance.fixture.a', 'fault_instance.fixture.b'],
      required_isolation_requirement_ids: ['isolation.fixture.a', 'isolation.fixture.b'],
      required_repair_outcome_ids: ['repair_outcome.fixture.a', 'repair_outcome.fixture.b'],
      required_verification_requirement_ids: ['verification.fixture.service'],
    },
    generation_provenance: null,
  };
}

const setupTime = '2026-08-23T12:00:00.000Z';
let requestSequence = 0;
let timeSequence = 0;

function now() {
  timeSequence += 1;
  return new Date(Date.parse(setupTime) + timeSequence * 1000).toISOString();
}

function newMatch({ mode = 'competitive', tickets = [ticketSnapshot()], queueMinimum = 0 } = {}) {
  return createMatch({
    matchId: `match.fixture.${mode}`,
    players: [
      { player_id: 'player_a', display_name: 'Player A', controller_type: 'human', team_id: 'team.fixture' },
      { player_id: 'player_b', display_name: 'Player B', controller_type: 'computer', team_id: 'team.fixture' },
    ],
    decksByPlayer: { player_a: 'deck.fixture', player_b: 'deck.fixture' },
    ticketSnapshots: tickets,
    catalogs,
    configuration: {
      collaboration_mode: mode,
      starting_ticket_count: 1,
      queue_minimum: queueMinimum,
      termination_score: -1,
      execution_mode: 'offline',
    },
    seed: 'fixture-seed-009',
    now: setupTime,
    ticketSource: {
      source_type: 'fixed',
      content_version: 'fixture-domain-v1',
      ticket_definition_ids: tickets.map((ticket) => ticket.id),
      snapshot_digest: 'fixture-snapshot-digest',
    },
  });
}

function requestFor(state, playerId, actionType, payload, id = null) {
  requestSequence += 1;
  return {
    request_id: id ?? `request.fixture.${requestSequence}`,
    match_id: state.match_id,
    player_id: playerId,
    expected_revision: state.revision,
    action_type: actionType,
    payload,
    client_nonce: `nonce.fixture.${requestSequence}`,
  };
}

function send(state, playerId, actionType, payload, id = null) {
  const request = requestFor(state, playerId, actionType, payload, id);
  const exchange = submitIntent({ state, request, authenticatedPlayerId: playerId, catalogs, now: now() });
  return { ...exchange, request };
}

function putCardInHand(state, playerId, cardDefinitionId) {
  const player = state.players.find((entry) => entry.player_id === playerId);
  const held = player.hand_card_instance_ids.find(
    (instanceId) => state.card_instances[instanceId].card_definition_id === cardDefinitionId,
  );
  if (held) return held;
  const sourceField = ['deck_card_instance_ids', 'discard_card_instance_ids']
    .find((field) => player[field].some(
      (instanceId) => state.card_instances[instanceId].card_definition_id === cardDefinitionId,
    ));
  assert.ok(sourceField, `${cardDefinitionId} remains in a movable zone`);
  const sourceIndex = player[sourceField].findIndex(
    (instanceId) => state.card_instances[instanceId].card_definition_id === cardDefinitionId,
  );
  const selected = player[sourceField][sourceIndex];
  const displaced = player.hand_card_instance_ids[0];
  player[sourceField][sourceIndex] = displaced;
  player.hand_card_instance_ids[0] = selected;
  state.card_instances[selected].zone = 'hand';
  state.card_instances[displaced].zone = sourceField === 'deck_card_instance_ids' ? 'deck' : 'discard';
  assertValidState(state);
  return selected;
}

function legalCardIntent(state, playerId, actionType, cardDefinitionId) {
  putCardInHand(state, playerId, cardDefinitionId);
  const intent = getLegalIntents({ state, playerId, catalogs }).find((option) =>
    option.action_type === actionType
      && state.card_instances[option.payload.card_instance_id]?.card_definition_id === cardDefinitionId);
  assert.ok(intent, `${cardDefinitionId} has a projected ${actionType} intent`);
  return intent;
}

function advanceTo(state, playerId) {
  let next = state;
  while (next.status === 'ACTIVE' && next.turn.active_player_id !== playerId) {
    const passed = send(next, next.turn.active_player_id, 'PASS_TURN', {});
    assert.equal(passed.result.accepted, true);
    next = passed.state;
  }
  return next;
}

function playProjectedCard(state, playerId, actionType, cardDefinitionId) {
  const intent = legalCardIntent(state, playerId, actionType, cardDefinitionId);
  const exchange = send(state, playerId, intent.action_type, intent.payload);
  assert.equal(exchange.result.accepted, true);
  return exchange;
}

function runIterativePath(initialState, actorPlayerId) {
  let state = advanceTo(initialState, actorPlayerId);
  const ticketId = state.active_ticket_ids[0];

  let exchange = playProjectedCard(state, actorPlayerId, 'RUN_TEST', 'card.fixture.visual');
  state = exchange.state;
  const visualEvidenceId = exchange.result.private_events
    .find((event) => event.event_type === 'EVIDENCE_CREATED').event_id;

  exchange = send(state, actorPlayerId, 'COMMIT_ISOLATION', {
    ticket_instance_id: ticketId,
    candidate_fault_id: 'fault.fixture.a',
    cited_evidence_event_ids: [visualEvidenceId],
  });
  assert.equal(exchange.result.accepted, true);
  assert.equal(exchange.result.resolution_code, 'RESOLVED');
  state = exchange.state;

  exchange = playProjectedCard(state, actorPlayerId, 'PERFORM_REPAIR', 'card.fixture.repair_a');
  state = exchange.state;
  assert.equal(state.tickets[ticketId].status, 'AWAITING_VERIFY');

  state = advanceTo(state, actorPlayerId);
  exchange = playProjectedCard(state, actorPlayerId, 'PERFORM_VERIFY', 'card.fixture.verify');
  state = exchange.state;
  const failedVerifyEvidenceId = exchange.result.private_events
    .find((event) => event.event_type === 'VERIFY_EVIDENCE_CREATED').event_id;
  assert.equal(state.tickets[ticketId].status, 'RETURNED_TO_DIAGNOSIS');
  assert.equal(state.tickets[ticketId].repair_history.length, 1);
  assert.equal(state.tickets[ticketId].isolation_history.filter((record) => record.accepted).length, 1);

  exchange = playProjectedCard(state, actorPlayerId, 'RUN_TEST', 'card.fixture.component');
  state = exchange.state;
  const componentEvidence = exchange.result.private_events.find((event) => event.event_type === 'EVIDENCE_CREATED');
  assert.match(componentEvidence.payload.target_ref, /\.target\.\d{3}$/);
  assert.equal(componentEvidence.payload.target_ref.includes('fault_instance'), false);

  state = advanceTo(state, actorPlayerId);
  const isolation = getLegalIntents({ state, playerId: actorPlayerId, catalogs }).find((option) =>
    option.action_type === 'COMMIT_ISOLATION'
      && option.payload.candidate_fault_id === 'fault.fixture.b');
  assert.ok(isolation);
  assert.ok(isolation.payload.cited_evidence_event_ids.includes(failedVerifyEvidenceId));
  exchange = send(state, actorPlayerId, isolation.action_type, isolation.payload);
  state = exchange.state;
  assert.equal(exchange.result.resolution_code, 'RESOLVED');
  assert.deepEqual(
    state.tickets[ticketId].isolation_history.at(-1).cited_evidence_event_ids,
    [failedVerifyEvidenceId],
    'accepted Isolation retains only authored decisive citations',
  );

  exchange = playProjectedCard(state, actorPlayerId, 'PERFORM_REPAIR', 'card.fixture.repair_b');
  state = exchange.state;
  state = advanceTo(state, actorPlayerId);
  exchange = playProjectedCard(state, actorPlayerId, 'PERFORM_VERIFY', 'card.fixture.verify');
  state = exchange.state;
  assert.equal(state.tickets[ticketId].status, 'READY_TO_CLOSE');
  assert.equal(state.turn.closure_window.is_open, true);

  const closure = getLegalIntents({ state, playerId: actorPlayerId, catalogs })
    .find((option) => option.action_type === 'PUBLISH_CLOSURE');
  assert.ok(closure);
  exchange = send(state, actorPlayerId, closure.action_type, closure.payload);
  assert.equal(exchange.result.accepted, true);
  assert.equal(exchange.result.actions_spent, 0);
  return { state: exchange.state, exchange, ticketId, actorPlayerId };
}

test('setup pins catalogs/Ticket source and deterministically reconciles deck, opening hand, start draw, and queue', () => {
  const first = newMatch();
  const second = newMatch();
  assert.equal(canonicalJson(first), canonicalJson(second));
  assert.equal(first.card_catalog_version, 'fixture-card-catalog-v1');
  assert.equal(first.ticket_source.snapshot_digest, 'fixture-snapshot-digest');
  assert.equal(Object.keys(first.card_instances).length, 60);
  assert.equal(first.players.reduce((sum, player) => sum + player.hand_card_instance_ids.length, 0), 11);
  assert.equal(first.players.find((player) => player.player_id === first.turn.active_player_id).hand_card_instance_ids.length, 6);
  assert.equal(first.turn.actions_remaining, 2);
  assert.equal(first.turn.actions_spent, 0);
  assert.equal(first.events.filter((event) => event.event_type === 'CARD_DRAWN').length, 1);
  assertValidState(first);

  const queued = newMatch({
    tickets: [ticketSnapshot('ticket.fixture.first'), ticketSnapshot('ticket.fixture.second')],
    queueMinimum: 1,
  });
  assert.equal(queued.active_ticket_ids.length, 1);
  assert.equal(queued.ticket_snapshot_queue.length, 1);
  assert.equal(queued.tickets[queued.active_ticket_ids[0]].ticket_definition_id, 'ticket.fixture.first');
});

test('actor, revision, and unexpected mutation fields reject before payment with byte-identical state', () => {
  const state = newMatch();
  const actor = state.turn.active_player_id;
  const other = actor === 'player_a' ? 'player_b' : 'player_a';
  const before = canonicalJson(state);

  const actorRequest = requestFor(state, other, 'PASS_TURN', {});
  const actorResult = submitIntent({
    state,
    request: actorRequest,
    authenticatedPlayerId: actor,
    catalogs,
    now: now(),
  });
  assert.equal(actorResult.result.error_code, 'ACTOR_MISMATCH');

  const staleRequest = requestFor(state, actor, 'PASS_TURN', {});
  staleRequest.expected_revision -= 1;
  const staleResult = submitIntent({ state, request: staleRequest, authenticatedPlayerId: actor, catalogs, now: now() });
  assert.equal(staleResult.result.error_code, 'STALE_REVISION');

  const mutationRequest = requestFor(state, actor, 'RUN_TEST', {
    ticket_instance_id: state.active_ticket_ids[0],
    card_instance_id: state.players.find((player) => player.player_id === actor).hand_card_instance_ids[0],
    execution_definition_id: 'test.fixture.visual',
    target_ref: state.active_ticket_ids[0],
    observed_machine_revision: 0,
    owner_player_id: actor,
  });
  const mutationResult = submitIntent({
    state,
    request: mutationRequest,
    authenticatedPlayerId: actor,
    catalogs,
    now: now(),
  });
  assert.equal(mutationResult.result.error_code, 'ILLEGAL_REQUEST');

  for (const exchange of [actorResult, staleResult, mutationResult]) {
    assert.strictEqual(exchange.state, state);
    assert.equal(canonicalJson(exchange.state), before);
    assert.equal(exchange.result.payment_applied, false);
    assert.equal(exchange.result.actions_spent, 0);
    assert.deepEqual(exchange.events, []);
  }
});

test('accepted requests are idempotent and conflicting reuse of a request ID fails closed', () => {
  const state = newMatch();
  const actor = state.turn.active_player_id;
  const request = requestFor(state, actor, 'PASS_TURN', {}, 'request.fixture.idempotent');
  const first = submitIntent({ state, request, authenticatedPlayerId: actor, catalogs, now: now() });
  assert.equal(first.result.accepted, true);
  const duplicate = submitIntent({ state: first.state, request, authenticatedPlayerId: actor, catalogs, now: now() });
  assert.strictEqual(duplicate.state, first.state);
  assert.deepEqual(duplicate.result, first.result);
  assert.deepEqual(duplicate.events, first.events);

  const conflict = structuredClone(request);
  conflict.action_type = 'REFRESH';
  const rejected = submitIntent({ state: first.state, request: conflict, authenticatedPlayerId: actor, catalogs, now: now() });
  assert.equal(rejected.result.error_code, 'IDEMPOTENCY_CONFLICT');
  assert.strictEqual(rejected.state, first.state);
});

test('diagnostics create concealed Evidence, enforce zero-Action same-name limit, and unsupported Isolation is generic and paid', () => {
  let state = newMatch();
  const actor = state.turn.active_player_id;
  const ticketId = state.active_ticket_ids[0];
  let exchange = playProjectedCard(state, actor, 'RUN_TEST', 'card.fixture.visual');
  state = exchange.state;
  const evidence = exchange.result.private_events.find((event) => event.event_type === 'EVIDENCE_CREATED');
  assert.equal(evidence.payload.public_summary, 'The first actionable Fault is visibly confirmed.');
  assert.equal(state.turn.actions_remaining, 2);
  assert.equal(exchange.result.public_events[0].event_type, 'WORKLOG_PLACEHOLDER_CREATED');
  assert.equal(projectPublicMatch(state).public_events.some((event) => event.event_id === evidence.event_id), false);

  putCardInHand(state, actor, 'card.fixture.same_name');
  const sameNameRequest = requestFor(state, actor, 'RUN_TEST', {
    ticket_instance_id: ticketId,
    card_instance_id: state.players.find((player) => player.player_id === actor).hand_card_instance_ids.find(
      (id) => state.card_instances[id].card_definition_id === 'card.fixture.same_name',
    ),
    execution_definition_id: 'test.fixture.secondary',
    target_ref: ticketId,
    observed_machine_revision: 0,
  });
  const sameName = submitIntent({ state, request: sameNameRequest, authenticatedPlayerId: actor, catalogs, now: now() });
  assert.equal(sameName.result.error_code, 'ZERO_ACTION_NAME_LIMIT');
  assert.strictEqual(sameName.state, state);

  exchange = send(state, actor, 'COMMIT_ISOLATION', {
    ticket_instance_id: ticketId,
    candidate_fault_id: 'fault.fixture.b',
    cited_evidence_event_ids: [evidence.event_id],
  });
  assert.equal(exchange.result.accepted, true);
  assert.equal(exchange.result.resolution_code, 'ISOLATION_NOT_SUPPORTED');
  assert.equal(exchange.result.actions_spent, 1);
  const unsupported = exchange.result.public_events.find((event) => event.event_type === 'ISOLATION_NOT_SUPPORTED');
  assert.deepEqual(unsupported.payload, { response_code: 'ISOLATION_NOT_SUPPORTED' });
  assert.equal(canonicalJson(unsupported).includes('eligible'), false);
  assert.equal(exchange.state.tickets[ticketId].status, 'DIAGNOSIS');
});

test('Repair is exact-Isolation gated and Commit Isolation cannot regress a repaired Ticket', () => {
  let state = newMatch();
  const actor = state.turn.active_player_id;
  const ticketId = state.active_ticket_ids[0];
  putCardInHand(state, actor, 'card.fixture.repair_a');
  const repairInstance = state.players.find((player) => player.player_id === actor).hand_card_instance_ids.find(
    (id) => state.card_instances[id].card_definition_id === 'card.fixture.repair_a',
  );
  let exchange = send(state, actor, 'PERFORM_REPAIR', {
    ticket_instance_id: ticketId,
    card_instance_id: repairInstance,
    repair_procedure_id: 'repair.fixture.a',
    isolated_fault_instance_id: `${ticketId}.fault.001`,
  });
  assert.equal(exchange.result.error_code, 'REPAIR_GATE_NOT_SATISFIED');
  assert.strictEqual(exchange.state, state);

  exchange = playProjectedCard(state, actor, 'RUN_TEST', 'card.fixture.visual');
  state = exchange.state;
  const evidenceId = exchange.result.private_events.find((event) => event.event_type === 'EVIDENCE_CREATED').event_id;
  exchange = send(state, actor, 'COMMIT_ISOLATION', {
    ticket_instance_id: ticketId,
    candidate_fault_id: 'fault.fixture.a',
    cited_evidence_event_ids: [evidenceId],
  });
  state = exchange.state;
  const accepted = exchange.result.public_events.find((event) => event.event_type === 'ISOLATION_ACCEPTED');
  assert.match(accepted.payload.public_fault_instance_id, /\.fault\.001$/);
  assert.equal(accepted.payload.public_fault_instance_id.includes('fault_instance'), false);
  exchange = playProjectedCard(state, actor, 'PERFORM_REPAIR', 'card.fixture.repair_a');
  state = exchange.state;
  const before = canonicalJson(state);
  exchange = send(state, state.turn?.active_player_id ?? actor, 'COMMIT_ISOLATION', {
    ticket_instance_id: ticketId,
    candidate_fault_id: 'fault.fixture.b',
    cited_evidence_event_ids: [evidenceId],
  });
  assert.equal(exchange.result.error_code, 'ILLEGAL_TIMING');
  assert.equal(canonicalJson(exchange.state), before);
});

test('Document Live publishes structured Evidence, enables cross-seat citations, recovers once, and excludes archived actions', () => {
  let state = newMatch();
  const actor = state.turn.active_player_id;
  const other = actor === 'player_a' ? 'player_b' : 'player_a';
  let exchange = playProjectedCard(state, actor, 'RUN_TEST', 'card.fixture.visual');
  state = exchange.state;
  const sourceEvent = exchange.result.private_events.find((event) => event.event_type === 'EVIDENCE_CREATED');
  const sourceAction = state.action_records.at(-1);
  const ticketId = sourceAction.ticket_instance_id;
  const sourceCardId = sourceAction.card_instance_id;
  const originalEntryBefore = structuredClone(state.tickets[ticketId].worklog_entries
    .find((entry) => entry.placeholder_event_id === sourceAction.placeholder_event_id));
  const documentIntent = getLegalIntents({ state, playerId: actor, catalogs })
    .find((option) => option.action_type === 'DOCUMENT_LIVE');
  assert.ok(documentIntent);
  exchange = send(state, actor, documentIntent.action_type, documentIntent.payload);
  state = exchange.state;
  assert.equal(exchange.result.recovered_card_instance_id, sourceCardId);
  assert.ok(state.players.find((player) => player.player_id === actor).hand_card_instance_ids.includes(sourceCardId));
  const publication = exchange.result.public_events.find((event) => event.event_type === 'WORKLOG_PUBLICATION');
  assert.equal(publication.payload.source_result_event_id, sourceEvent.event_id);
  assert.deepEqual(publication.payload.published_result.candidate_effects, sourceEvent.payload.candidate_effects);
  const projectedWorklog = projectPublicMatch(state).repair_queue[0].worklog;
  const enrichedOriginal = projectedWorklog.find((entry) => entry.placeholder_event_id === sourceAction.placeholder_event_id);
  const documentationTrace = projectedWorklog.find((entry) => entry.source_name === 'Document Live');
  assert.equal(enrichedOriginal.public_result_summary,
    'The first actionable Fault is visibly confirmed.');
  assert.equal(enrichedOriginal.sequence, originalEntryBefore.sequence);
  assert.equal(enrichedOriginal.action_time, originalEntryBefore.action_time);
  assert.equal(enrichedOriginal.publication_time, publication.created_at);
  assert.equal(documentationTrace.public_result_summary,
    `Published ${originalEntryBefore.source_name} result from Worklog #${originalEntryBefore.sequence}.`);
  assert.notEqual(documentationTrace.placeholder_event_id, enrichedOriginal.placeholder_event_id);
  assert.equal(exchange.result.actions_spent, 1);

  const beforeRepeat = canonicalJson(state);
  const repeated = send(state, actor, 'DOCUMENT_LIVE', documentIntent.payload);
  assert.equal(repeated.result.error_code, 'ILLEGAL_DOCUMENT_SOURCE');
  assert.equal(canonicalJson(repeated.state), beforeRepeat);

  state = advanceTo(state, other);
  const otherIsolation = getLegalIntents({ state, playerId: other, catalogs }).find((option) =>
    option.action_type === 'COMMIT_ISOLATION'
      && option.payload.candidate_fault_id === 'fault.fixture.a');
  assert.ok(otherIsolation);
  assert.ok(otherIsolation.payload.cited_evidence_event_ids.includes(sourceEvent.event_id));
  exchange = send(state, other, otherIsolation.action_type, otherIsolation.payload);
  assert.equal(exchange.result.resolution_code, 'RESOLVED');

  // Once the Ticket is archived, no stale card action can appear as legal
  // Document progress even if its source Card still sits in discard.
  const completed = runIterativePath(newMatch(), newMatch().turn?.active_player_id ?? actor);
  for (const player of completed.state.players) {
    const view = projectPrivatePlayer(completed.state, player.player_id, catalogs);
    assert.equal(view.documentable_actions.length, 0);
    assert.equal(view.legal_intents.some((option) => option.action_type === 'DOCUMENT_LIVE'), false);
  }
});

test('Search and Refresh are deterministic, private-safe, token-bound, and zone exact', () => {
  const state = newMatch();
  const actor = state.turn.active_player_id;
  const player = state.players.find((entry) => entry.player_id === actor);
  const selectedDefinitionId = state.card_instances[player.deck_card_instance_ids[0]].card_definition_id;
  const request = requestFor(state, actor, 'SEARCH', { selected_card_definition_id: selectedDefinitionId }, 'request.fixture.search');
  const first = submitIntent({ state, request, authenticatedPlayerId: actor, catalogs, now: setupTime });
  const second = submitIntent({ state: structuredClone(state), request, authenticatedPlayerId: actor, catalogs, now: setupTime });
  assert.equal(canonicalJson(first.state), canonicalJson(second.state));
  assert.equal(first.result.actions_spent, 1);
  assert.equal(first.result.utility_resources_spent.search_tokens, 1);
  assert.equal(first.result.public_events.some((event) => canonicalJson(event).includes(selectedDefinitionId)), false);
  assert.equal(first.result.private_events.some((event) => event.event_type === 'CARD_SEARCHED'), true);
  assertValidState(first.state);

  let refreshState = newMatch();
  const refreshActor = refreshState.turn.active_player_id;
  assert.ok(getLegalIntents({ state: refreshState, playerId: refreshActor, catalogs })
    .some((option) => option.action_type === 'REFRESH'), 'Refresh is legal with an empty discard');
  const beforeDeckCount = refreshState.players.find((entry) => entry.player_id === refreshActor).deck_card_instance_ids.length;
  let exchange = send(refreshState, refreshActor, 'REFRESH', {});
  refreshState = exchange.state;
  assert.equal(exchange.result.actions_spent, 1);
  assert.equal(exchange.result.utility_resources_spent.refresh_tokens, 1);
  assert.equal(refreshState.players.find((entry) => entry.player_id === refreshActor).deck_card_instance_ids.length, beforeDeckCount);
  assertValidState(refreshState);
});

test('failed Verify preserves history, reopens Diagnosis, and complete authored path closes atomically with exact scoring', () => {
  const initial = newMatch();
  const actor = initial.turn.active_player_id;
  const { state, exchange, ticketId } = runIterativePath(initial, actor);
  assert.equal(state.status, 'COMPLETED');
  assert.deepEqual(state.result.reason_codes, ['QUEUE_EMPTY']);
  assert.deepEqual(state.result.winner_player_ids, [actor]);
  assert.equal(state.players.find((player) => player.player_id === actor).service_points, 4);
  assert.equal(state.service_point_events.length, 4);
  assert.equal(new Set(state.service_point_events.map((record) => record.score_event_id)).size, 4);
  assert.equal(new Set(state.contribution_ledger.map((record) => record.slot_key)).size, 4);
  assert.equal(state.archived_ticket_ids.includes(ticketId), true);
  const archived = state.archived_tickets[ticketId];
  assert.equal(archived.return_to_diagnosis_history.length, 1);
  assert.equal(archived.repair_history.length, 2);
  assert.equal(archived.verification_history.some((record) => record.result === 'FAIL'), true);
  assert.equal(archived.worklog_entries.every((entry) => entry.locked), true);
  assert.equal(exchange.result.public_events[0].event_type, 'CLOSURE_PUBLISHED');
  assert.deepEqual(
    exchange.result.public_events.slice(0, 2).map((event) => event.event_type),
    ['CLOSURE_PUBLISHED', 'WORKLOG_LOCKED'],
  );
  assert.equal(exchange.result.public_events.at(-1).event_type, 'TURN_ENDED');
  assertValidState(state);
  const publicView = projectPublicMatch(state);
  assert.equal(publicView.closed_tickets.length, 1);
  assert.equal(publicView.closed_tickets[0].closure.decisive_public_evidence_event_ids.length, 0);
  assert.equal(findPlayerSafeLeaks(publicView).length, 0);
  assert.equal(replayDigest(state).length, 64);
});

test('closure independently rejects an incomplete authored semantic path before settlement', () => {
  const initial = newMatch();
  const actor = initial.turn.active_player_id;
  // Reach the closure window using the same legal transitions, then corrupt
  // only the internal authored-path record to prove closure revalidates it.
  let state = advanceTo(initial, actor);
  let exchange = playProjectedCard(state, actor, 'RUN_TEST', 'card.fixture.visual');
  state = exchange.state;
  const evidence = exchange.result.private_events.find((event) => event.event_type === 'EVIDENCE_CREATED').event_id;
  state = send(state, actor, 'COMMIT_ISOLATION', {
    ticket_instance_id: state.active_ticket_ids[0],
    candidate_fault_id: 'fault.fixture.a',
    cited_evidence_event_ids: [evidence],
  }).state;
  state = playProjectedCard(state, actor, 'PERFORM_REPAIR', 'card.fixture.repair_a').state;
  state = advanceTo(state, actor);
  exchange = playProjectedCard(state, actor, 'PERFORM_VERIFY', 'card.fixture.verify');
  state = exchange.state;
  const verifyEvidence = exchange.result.private_events.find((event) => event.event_type === 'VERIFY_EVIDENCE_CREATED').event_id;
  state = advanceTo(state, actor);
  state = send(state, actor, 'COMMIT_ISOLATION', {
    ticket_instance_id: state.active_ticket_ids[0],
    candidate_fault_id: 'fault.fixture.b',
    cited_evidence_event_ids: [verifyEvidence],
  }).state;
  state = advanceTo(state, actor);
  state = playProjectedCard(state, actor, 'PERFORM_REPAIR', 'card.fixture.repair_b').state;
  state = advanceTo(state, actor);
  state = playProjectedCard(state, actor, 'PERFORM_VERIFY', 'card.fixture.verify').state;
  const closure = getLegalIntents({ state, playerId: actor, catalogs }).find((option) => option.action_type === 'PUBLISH_CLOSURE');
  const ticket = state.tickets[state.active_ticket_ids[0]];
  ticket.repair_history[0].repair_outcome_id = 'repair_outcome.fixture.unrelated';
  const before = canonicalJson(state);
  exchange = send(state, actor, closure.action_type, closure.payload);
  assert.equal(exchange.result.error_code, 'INVALID_CLOSURE_BUNDLE');
  assert.equal(canonicalJson(exchange.state), before);
  assert.equal(state.service_point_events.length, 0);
});

test('Q > 0 consumes queued complete snapshots and explicitly invalidates exhausted required supply', () => {
  let state = newMatch({
    tickets: [ticketSnapshot('ticket.fixture.first'), ticketSnapshot('ticket.fixture.second')],
    queueMinimum: 1,
  });
  let actor = state.turn.active_player_id;
  let completed = runIterativePath(state, actor);
  state = completed.state;
  assert.equal(state.status, 'ACTIVE');
  assert.equal(state.active_ticket_ids.length, 1);
  assert.equal(state.ticket_snapshot_queue.length, 0);
  assert.equal(state.tickets[state.active_ticket_ids[0]].ticket_definition_id, 'ticket.fixture.second');
  const firstQueueEvent = state.events.filter((event) => event.event_type === 'QUEUE_RECONCILED').at(-1);
  assert.equal(firstQueueEvent.payload.supply_exhausted, false);

  actor = state.turn.active_player_id;
  completed = runIterativePath(state, actor);
  state = completed.state;
  assert.equal(state.status, 'INVALIDATED');
  assert.ok(state.result.reason_codes.includes('ADMIN_INVALIDATION'));
  const finalQueueEvent = state.events.filter((event) => event.event_type === 'QUEUE_RECONCILED').at(-1);
  assert.equal(finalQueueEvent.payload.supply_exhausted, true);
  assertValidState(state);
});

test('public/private projections are allowlisted, computer-safe, reconnectable, and hide opponent Evidence', () => {
  let state = newMatch();
  const actor = state.turn.active_player_id;
  const other = actor === 'player_a' ? 'player_b' : 'player_a';
  const exchange = playProjectedCard(state, actor, 'RUN_TEST', 'card.fixture.visual');
  state = exchange.state;
  const publicView = projectPublicMatch(state);
  const actorView = projectPrivatePlayer(state, actor, catalogs);
  const otherView = projectPrivatePlayer(state, other, catalogs);
  assert.deepEqual(findPlayerSafeLeaks(publicView), []);
  assert.deepEqual(findPlayerSafeLeaks(actorView), []);
  assert.deepEqual(findPlayerSafeLeaks(otherView), []);
  assert.ok(actorView.authorized_events.some((event) => event.event_type === 'EVIDENCE_CREATED'));
  assert.equal(otherView.authorized_events.some((event) => event.event_type === 'EVIDENCE_CREATED'), false);
  assert.equal(canonicalJson(publicView).includes('outcome.fixture.visual_a'), false);
  assert.equal(canonicalJson(otherView).includes('outcome.fixture.visual_a'), false);
  assert.equal(canonicalJson(actorView).includes('fault_instance.fixture'), false);
  assert.ok(actorView.legal_intents.every((intent) => Object.keys(intent).sort().join(',') === 'action_type,payload'));
  assert.throws(() => assertPlayerSafe(state), /Player-safe projection leaked/,
    'authoritative aggregate is deliberately server-only; only allowlisted projections cross the boundary');
});

test('authoritative cap and proven-stalemate stop transitions have Frozen result semantics', () => {
  const competitive = newMatch();
  competitive.players[0].service_points = 3;
  competitive.players[1].service_points = 3;
  const stalemate = stopForProvenStalemate({ state: competitive, now: now() });
  assert.equal(stalemate.status, 'COMPLETED');
  assert.equal(stalemate.turn, null);
  assert.deepEqual(stalemate.result.reason_codes, ['STALEMATE']);
  assert.deepEqual(new Set(stalemate.result.winner_player_ids), new Set(['player_a', 'player_b']));
  assert.equal(stalemate.events.some((event) => event.event_type === 'STALEMATE_PROVEN'), true);
  assertValidState(stalemate);

  const cooperative = newMatch({ mode: 'cooperative' });
  const cooperativeStalemate = stopForProvenStalemate({ state: cooperative, now: now() });
  assert.deepEqual(cooperativeStalemate.result.winning_team_ids, []);
  assert.deepEqual(cooperativeStalemate.result.winner_player_ids, []);

  const capped = stopSimulationAtCap({ state: newMatch(), now: now() });
  assert.equal(capped.status, 'ABORTED');
  assert.ok(capped.result.reason_codes.includes('SIMULATION_CAP'));
  assert.deepEqual(capped.result.winner_player_ids, []);
  assert.deepEqual(capped.result.winning_team_ids, []);
  assertValidState(capped);
});
