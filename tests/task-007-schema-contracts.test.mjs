import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

import {
  assertAllSchemaRefsResolve,
  loadSchemaRegistry,
  validateJsonSchema,
} from './helpers/json-schema-validator.mjs';
import {
  validateActionExchange,
  validateActionResult,
  validateAuthoredTicket,
  validateMatchState,
  validatePlayerSafeEvent,
  validatePlayerState,
  validatePrivatePlayerView,
  validatePublicMatchView,
  validateTicketLifecycle,
  validateTurnState,
} from './helpers/task-007-semantics.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registry = loadSchemaRegistry(repositoryRoot);
const schemaByFileBase = new Map(
  registry.schemas.map(({ filePath, schema }) => [path.basename(filePath, '.schema.json'), schema]),
);

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8'));
}

function fixtureSchema(relativePath) {
  const name = path.basename(relativePath);
  let prefix = name.slice(0, name.indexOf('.'));
  if (prefix === 'fault_edge') prefix = 'fault_causal_edge';
  const schema = schemaByFileBase.get(prefix);
  assert.ok(schema, `No schema naming convention for ${relativePath}`);
  return schema;
}

function examplePaths() {
  return ['examples/domain', 'examples/runtime'].flatMap((relativeDirectory) =>
    fs.readdirSync(path.join(repositoryRoot, relativeDirectory))
      .filter((name) => name.endsWith('.json'))
      .sort()
      .map((name) => `${relativeDirectory}/${name}`));
}

function assertFixtureValid(relativePath) {
  const errors = validateJsonSchema(readJson(relativePath), fixtureSchema(relativePath), registry);
  assert.deepEqual(errors, [], `${relativePath}\n${errors.join('\n')}`);
}

function assertInvalid(instance, schemaName, messagePattern) {
  const errors = validateJsonSchema(instance, schemaByFileBase.get(schemaName), registry);
  assert.ok(errors.length > 0, `Expected invalid ${schemaName} instance`);
  assert.match(errors.join('\n'), messagePattern);
}

test('all domain/runtime schemas parse, retain unique IDs, and resolve every local $ref', () => {
  assert.equal(registry.schemas.length, 26);
  assert.equal(registry.byId.size, 26);
  assertAllSchemaRefsResolve(registry);

  const expectedIds = {
    repair_ticket: 'https://example.local/schemas/repair_ticket.schema.json',
    ticket_builder_configuration: 'https://example.local/schemas/ticket_builder_configuration.schema.json',
    ticket_builder_result: 'https://example.local/schemas/ticket_builder_result.schema.json',
    action_request: 'https://example.local/runtime/action_request.schema.json',
    action_result: 'https://example.local/runtime/action_result.schema.json',
    game_event: 'https://example.local/runtime/game_event.schema.json',
    knowledge_state: 'https://example.local/runtime/knowledge_state.schema.json',
    match_state: 'https://example.local/runtime/match_state.schema.json',
    player_state: 'https://example.local/runtime/player_state.schema.json',
    private_player_view: 'https://example.local/runtime/private_player_view.schema.json',
    public_match_view: 'https://example.local/runtime/public_match_view.schema.json',
    ticket_state: 'https://example.local/runtime/ticket_state.schema.json',
    turn_state: 'https://example.local/runtime/turn_state.schema.json',
  };
  for (const [name, id] of Object.entries(expectedIds)) assert.equal(schemaByFileBase.get(name).$id, id);
});

test('every domain/runtime example validates against the schema declared by its filename', () => {
  const fixtures = examplePaths();
  assert.equal(fixtures.length, 41);
  for (const relativePath of fixtures) assertFixtureValid(relativePath);
});

test('every synchronized fixture with a cross-field contract passes semantic validation', () => {
  const validators = new Map([
    ['repair_ticket', validateAuthoredTicket],
    ['action_result', validateActionResult],
    ['game_event', validatePlayerSafeEvent],
    ['match_state', validateMatchState],
    ['player_state', validatePlayerState],
    ['private_player_view', validatePrivatePlayerView],
    ['public_match_view', validatePublicMatchView],
    ['ticket_state', validateTicketLifecycle],
    ['turn_state', validateTurnState],
  ]);
  for (const relativePath of examplePaths()) {
    const prefix = path.basename(relativePath).split('.')[0];
    const validator = validators.get(prefix);
    if (validator) assert.deepEqual(validator(readJson(relativePath)), [], relativePath);
  }

  const requests = examplePaths()
    .filter((relativePath) => path.basename(relativePath).startsWith('action_request.'))
    .map(readJson);
  const results = examplePaths()
    .filter((relativePath) => path.basename(relativePath).startsWith('action_result.'))
    .map(readJson);
  for (const result of results) {
    const request = requests.find((candidate) => candidate.request_id === result.request_id);
    if (request) assert.deepEqual(validateActionExchange(request, result), [], result.request_id);
  }
});

test('representative invalid authored content and action payloads fail for the intended reason', () => {
  const ticket = readJson('examples/domain/repair_ticket.memory_no_post.json');
  delete ticket.public_candidate_fault_ids;
  assertInvalid(ticket, 'repair_ticket', /missing required property public_candidate_fault_ids/);

  const isolation = readJson('examples/runtime/action_request.commit_isolation.json');
  isolation.payload.cited_evidence_event_ids = [];
  assertInvalid(isolation, 'action_request', /matches 0 oneOf branches/);

  const repair = readJson('examples/runtime/action_request.perform_repair.json');
  delete repair.payload.isolated_fault_instance_id;
  assertInvalid(repair, 'action_request', /matches 0 oneOf branches/);

  const card = readJson('examples/domain/card.memory_diagnostic.json');
  card.cost = 3;
  assertInvalid(card, 'card', /greater than maximum 2/);

  const authoredTest = readJson('examples/domain/test.memory_diagnostic.json');
  authoredTest.evidence_rules[0].possible_outcomes[0] = 'supports';
  assertInvalid(authoredTest, 'test', /is not in enum/);
});

test('authored Ticket cross-references reject undeclared candidate effects and outcome links', () => {
  const ticket = readJson('examples/domain/repair_ticket.memory_no_post.json');
  assert.deepEqual(validateAuthoredTicket(ticket), []);

  const dynamicallyRevealedTruth = structuredClone(ticket);
  dynamicallyRevealedTruth.server_only_truth.fault_instances.push({
    fault_instance_key: 'fault_instance.hidden_later',
    fault_id: 'fault.fixture.hidden_later',
    role: 'ROOT',
    actionable: false,
    deepest: true,
    required_to_repair: false,
  });
  assert.equal(
    dynamicallyRevealedTruth.public_candidate_fault_ids.includes('fault.fixture.hidden_later'),
    false,
  );
  assert.deepEqual(validateAuthoredTicket(dynamicallyRevealedTruth), []);

  const unknownCandidate = structuredClone(ticket);
  unknownCandidate.authored_evidence_outcomes[0].candidate_effects[0].candidate_fault_id = 'fault.fixture.not_a_candidate';
  assert.match(validateAuthoredTicket(unknownCandidate).join('\n'), /candidate effect references undeclared/);

  const unknownOutcome = structuredClone(ticket);
  unknownOutcome.isolation_requirements[0].eligible_outcome_ids[0] = 'outcome.fixture.missing';
  assert.match(validateAuthoredTicket(unknownOutcome).join('\n'), /unknown authored outcome/);

  const mismatchedOutcome = structuredClone(ticket);
  mismatchedOutcome.isolation_requirements[0].candidate_fault_id = 'fault.fixture.not_a_candidate';
  assert.match(validateAuthoredTicket(mismatchedOutcome).join('\n'), /Isolation candidate is not public/);

  const repairOutsideTruth = structuredClone(ticket);
  repairOutsideTruth.repair_requirements[0].fault_id = 'fault.fixture.not_in_causal_truth';
  assert.match(validateAuthoredTicket(repairOutsideTruth).join('\n'), /Repair requirement targets non-truth Fault/);
});

test('representative invalid lifecycle and stale-payment states fail for the intended reason', () => {
  const closed = readJson('examples/runtime/ticket_state.return_verify_close.json');

  const repairReady = structuredClone(closed);
  repairReady.status = 'REPAIR_READY';
  repairReady.current_accepted_isolation_event_id = null;
  repairReady.closure = null;
  repairReady.archived = false;
  assertInvalid(repairReady, 'ticket_state', /current_accepted_isolation_event_id.*expected type string/);

  const returned = structuredClone(closed);
  returned.status = 'RETURNED_TO_DIAGNOSIS';
  returned.current_accepted_isolation_event_id = null;
  returned.return_to_diagnosis_history = [];
  returned.closure = null;
  returned.archived = false;
  assertInvalid(returned, 'ticket_state', /return_to_diagnosis_history.*fewer than 1 items/);

  const stale = readJson('examples/runtime/action_result.stale_revision.json');
  assert.equal(stale.match_revision_after, stale.match_revision_before);
  assert.equal(stale.payment_applied, false);
  assert.equal(stale.public_events.length + stale.team_events.length + stale.private_events.length, 0);
  stale.actions_spent = 1;
  assertInvalid(stale, 'action_result', /actions_spent.*expected const 0/);

  const repairGate = readJson('examples/runtime/action_result.repair_gate_rejected.json');
  assert.equal(repairGate.error_code, 'REPAIR_GATE_NOT_SATISFIED');
  assert.equal(repairGate.rejected_at, 'BEFORE_PAYMENT');
  assert.equal(repairGate.actions_spent, 0);
  assert.equal(repairGate.public_events.length + repairGate.team_events.length + repairGate.private_events.length, 0);

  const closure = structuredClone(closed);
  closure.closure.action_cost = 1;
  assertInvalid(closure, 'ticket_state', /action_cost.*expected const 0/);
});

test('all four visibility categories enforce their audience selectors', () => {
  const fixtures = {
    SERVER_ONLY: readJson('examples/runtime/game_event.server_truth.json'),
    PRIVATE_PLAYER: readJson('examples/runtime/game_event.private_evidence.json'),
    TEAM: readJson('examples/runtime/game_event.team_evidence.json'),
    PUBLIC_MATCH: readJson('examples/runtime/game_event.worklog_placeholder.json'),
  };
  assert.deepEqual(Object.keys(fixtures), ['SERVER_ONLY', 'PRIVATE_PLAYER', 'TEAM', 'PUBLIC_MATCH']);

  const privateLeak = structuredClone(fixtures.PRIVATE_PLAYER);
  privateLeak.visible_to_player_ids = [];
  assertInvalid(privateLeak, 'game_event', /visible_to_player_ids.*fewer than 1 items/);

  const teamLeak = structuredClone(fixtures.TEAM);
  teamLeak.visible_to_team_ids = [];
  assertInvalid(teamLeak, 'game_event', /visible_to_team_ids.*fewer than 1 items/);

  const publicLeak = structuredClone(fixtures.PUBLIC_MATCH);
  publicLeak.visible_to_player_ids = ['player_a'];
  assertInvalid(publicLeak, 'game_event', /visible_to_player_ids.*more than 0 items/);

  const serverLeak = structuredClone(fixtures.SERVER_ONLY);
  serverLeak.visible_to_team_ids = ['team_alpha'];
  assertInvalid(serverLeak, 'game_event', /visible_to_team_ids.*more than 0 items/);

  const leakyResult = readJson('examples/runtime/action_result.isolation_accepted.json');
  leakyResult.public_events = [fixtures.PRIVATE_PLAYER];
  assertInvalid(leakyResult, 'action_result', /visibility.*expected const "PUBLIC_MATCH"/);

  const leakyPublicView = readJson('examples/runtime/public_match_view.after_closure.json');
  leakyPublicView.public_events = [fixtures.SERVER_ONLY];
  assertInvalid(leakyPublicView, 'public_match_view', /visibility.*expected const "PUBLIC_MATCH"/);

  const leakyPrivateView = readJson('examples/runtime/private_player_view.after_test.json');
  leakyPrivateView.authorized_events = [fixtures.SERVER_ONLY];
  assertInvalid(leakyPrivateView, 'private_player_view', /visibility.*is not in enum/);
});

test('player-safe event payloads and private/team recipients reject semantic leaks', () => {
  const publicEvent = readJson('examples/runtime/game_event.worklog_placeholder.json');
  assert.deepEqual(validatePlayerSafeEvent(publicEvent), []);

  const directSecret = structuredClone(publicEvent);
  directSecret.payload.actual_present = true;
  assertInvalid(directSecret, 'game_event', /matches prohibited schema/);

  const nestedSecret = structuredClone(publicEvent);
  nestedSecret.payload.detail = { server_only_truth: { fault_id: 'fault.memory.dimm.failed' } };
  assert.match(validatePlayerSafeEvent(nestedSecret).join('\n'), /forbidden player-safe key/);

  const privateView = readJson('examples/runtime/private_player_view.after_test.json');
  assert.deepEqual(validatePrivatePlayerView(privateView), []);

  const wrongPrivateRecipient = structuredClone(privateView);
  wrongPrivateRecipient.authorized_events[0].visible_to_player_ids = ['player_b'];
  assert.match(validatePrivatePlayerView(wrongPrivateRecipient).join('\n'), /not addressed to view Player/);

  const wrongKnowledgeOwner = structuredClone(privateView);
  wrongKnowledgeOwner.knowledge_states[0].owner_player_id = 'player_b';
  assert.match(validatePrivatePlayerView(wrongKnowledgeOwner).join('\n'), /belongs to another Player/);

  const wrongTeamRecipient = structuredClone(privateView);
  wrongTeamRecipient.team_id = 'team_alpha';
  wrongTeamRecipient.public_match.players[0].team_id = 'team_alpha';
  const teamEvent = readJson('examples/runtime/game_event.team_evidence.json');
  teamEvent.visible_to_team_ids = ['team_beta'];
  wrongTeamRecipient.authorized_events = [teamEvent];
  assert.match(validatePrivatePlayerView(wrongTeamRecipient).join('\n'), /not addressed to view team/);
});

test('public and private projections contain only authorized knowledge', () => {
  const privateView = readJson('examples/runtime/private_player_view.after_test.json');
  const serializedPublic = JSON.stringify(privateView.public_match);
  for (const secretName of [
    'server_only_truth',
    'fault_states',
    'actual_present',
    'authored_evidence_outcomes',
    'PRIVATE_PLAYER',
    'TEAM',
    'SERVER_ONLY',
  ]) {
    assert.equal(serializedPublic.includes(secretName), false, `public view leaked ${secretName}`);
  }

  assert.ok(privateView.authorized_events.every((event) => event.visibility !== 'SERVER_ONLY'));
  assert.ok(privateView.authorized_events.every((event) =>
    event.visibility !== 'PRIVATE_PLAYER' || event.visible_to_player_ids.includes(privateView.player_id)));
  assert.equal(privateView.reconnect.snapshot_installed, true);
  assert.equal(privateView.reconnect.snapshot_revision, privateView.revision);
});

test('Verify failure returns to Diagnosis without erasing the earlier path or later passes', () => {
  const ticket = readJson('examples/runtime/ticket_state.return_verify_close.json');
  assert.deepEqual(validateTicketLifecycle(ticket), []);
  const failed = ticket.verification_history.find((entry) => entry.result === 'FAIL');
  const returned = ticket.return_to_diagnosis_history.find(
    (entry) => entry.failed_verify_event_id === failed.verify_event_id,
  );
  assert.ok(returned, 'failed Verify has a preserved return event');
  assert.equal(failed.is_current, false);
  assert.ok(ticket.isolation_history.some((entry) => entry.accepted && entry.committed_at_revision < returned.returned_at_revision));
  assert.ok(ticket.repair_history.some((entry) => entry.machine_revision < ticket.machine_revision));
  assert.ok(ticket.isolation_history.some((entry) => entry.accepted && entry.committed_at_revision > returned.returned_at_revision));

  const currentPasses = ticket.verification_history.filter((entry) => entry.result === 'PASS' && entry.is_current);
  assert.equal(currentPasses.length, 2);
  assert.ok(currentPasses.every((entry) => entry.machine_revision === ticket.machine_revision));
  assert.deepEqual(
    new Set(ticket.current_verify_pass_event_ids),
    new Set(currentPasses.map((entry) => entry.verify_event_id)),
  );

  for (const repair of ticket.repair_history) {
    assert.ok(ticket.isolation_history.some((isolation) =>
      isolation.accepted && isolation.isolation_event_id === repair.isolation_event_id));
  }
});

test('lifecycle semantic validation rejects incoherent states and erased closure history', () => {
  const closed = readJson('examples/runtime/ticket_state.return_verify_close.json');

  const awaitingWithoutRepair = structuredClone(closed);
  awaitingWithoutRepair.status = 'AWAITING_VERIFY';
  awaitingWithoutRepair.repair_history = [];
  awaitingWithoutRepair.closure = null;
  awaitingWithoutRepair.archived = false;
  assert.match(validateTicketLifecycle(awaitingWithoutRepair).join('\n'), /AWAITING_VERIFY requires Repair history/);
  assertInvalid(awaitingWithoutRepair, 'ticket_state', /repair_history.*fewer than 1 items/);

  const closedWithoutFailure = structuredClone(closed);
  closedWithoutFailure.closure.failed_verify_event_ids = [];
  assert.match(validateTicketLifecycle(closedWithoutFailure).join('\n'), /does not preserve every failed/);

  const closedWithUnknownRepair = structuredClone(closed);
  closedWithUnknownRepair.closure.repair_event_ids.push('evt_repair_missing');
  assert.match(validateTicketLifecycle(closedWithUnknownRepair).join('\n'), /unknown Repair/);

  const droppedRepair = structuredClone(closed);
  droppedRepair.closure.repair_event_ids.shift();
  assert.match(validateTicketLifecycle(droppedRepair).join('\n'), /complete accepted-path Repair history/);

  const unrelatedEvidence = structuredClone(closed);
  unrelatedEvidence.closure.decisive_evidence_event_ids.push('evt_evidence_unrelated');
  assert.match(validateTicketLifecycle(unrelatedEvidence).join('\n'), /decisive Evidence .* is unrelated/);

  const nonClosedWithClosure = structuredClone(closed);
  nonClosedWithClosure.status = 'REPAIR_READY';
  nonClosedWithClosure.archived = false;
  assert.match(validateTicketLifecycle(nonClosedWithClosure).join('\n'), /non-closed Ticket/);
  assertInvalid(nonClosedWithClosure, 'ticket_state', /closure.*expected const null/);

  const diagnosisWithRepairGate = structuredClone(closed);
  diagnosisWithRepairGate.status = 'DIAGNOSIS';
  diagnosisWithRepairGate.closure = null;
  diagnosisWithRepairGate.archived = false;
  assert.match(validateTicketLifecycle(diagnosisWithRepairGate).join('\n'), /DIAGNOSIS must clear/);
  assertInvalid(diagnosisWithRepairGate, 'ticket_state', /current_accepted_isolation_event_id.*expected const null/);
});

test('Worklog publication enriches a placeholder without changing action chronology', () => {
  const placeholder = readJson('examples/runtime/game_event.worklog_placeholder.json');
  const publication = readJson('examples/runtime/game_event.worklog_publication.json');
  assert.equal(publication.worklog_projection.placeholder_event_id, placeholder.event_id);
  assert.equal(publication.worklog_projection.source_action_event_id, placeholder.worklog_projection.source_action_event_id);
  assert.equal(publication.worklog_projection.action_time, placeholder.worklog_projection.action_time);
  assert.ok(publication.sequence > placeholder.sequence);
  assert.ok(Date.parse(publication.publication_time) > Date.parse(placeholder.action_time));
  assert.equal(placeholder.worklog_projection.publication_event_id, null);
  assert.equal(publication.worklog_projection.publication_event_id, publication.event_id);
});

test('zero-Action closure resolves before automatic end-turn and runs the full transaction in order', () => {
  const request = readJson('examples/runtime/action_request.publish_closure.json');
  const result = readJson('examples/runtime/action_result.publish_closure.json');
  const turn = readJson('examples/runtime/turn_state.closure_window.json');
  const ticket = readJson('examples/runtime/ticket_state.return_verify_close.json');

  assert.equal(request.action_type, 'PUBLISH_CLOSURE');
  assert.equal(result.actions_spent, 0);
  assert.equal(result.recovered_card_instance_id, null);
  assert.equal(ticket.closure.action_cost, 0);
  assert.equal(turn.actions_remaining, 0);
  assert.equal(turn.closure_window.is_open, true);
  assert.equal(turn.closure_window.precedes_automatic_end_turn, true);
  assert.equal(turn.phase, 'CLOSURE_RESOLUTION');

  assert.deepEqual(
    result.public_events.map((event) => event.event_type),
    [
      'CLOSURE_PUBLISHED',
      'WORKLOG_LOCKED',
      'SCORE_EVENTS_CREATED',
      'TICKET_ARCHIVED',
      'UTILITY_RESOURCES_GRANTED',
      'QUEUE_RECONCILED',
      'TERMINAL_EVALUATED',
      'TURN_ENDED',
    ],
  );
  assert.ok(result.public_events.every((event, index, events) => index === 0 || event.sequence > events[index - 1].sequence));
  assert.ok(result.public_events.every((event) => event.revision === result.match_revision_after));
  assert.equal(result.public_events.at(-1).payload.reason, 'CLOSURE_PUBLISHED');
  assert.deepEqual(validateActionExchange(request, result), []);
  assert.deepEqual(validateTurnState(turn), []);
});

test('Action arithmetic, stale revision, zero-Action closure, and closed windows fail negatively', () => {
  const request = readJson('examples/runtime/action_request.publish_closure.json');
  const closure = readJson('examples/runtime/action_result.publish_closure.json');
  const paidClosure = structuredClone(closure);
  paidClosure.actions_spent = 1;
  assert.match(validateActionExchange(request, paidClosure).join('\n'), /closure spent an Action/);

  const turn = readJson('examples/runtime/turn_state.closure_window.json');
  const badArithmetic = structuredClone(turn);
  badArithmetic.actions_remaining = 1;
  assert.match(validateTurnState(badArithmetic).join('\n'), /Action arithmetic does not reconcile/);

  const stale = readJson('examples/runtime/action_result.stale_revision.json');
  const staleMutation = structuredClone(stale);
  staleMutation.match_revision_after += 1;
  assert.match(validateActionResult(staleMutation).join('\n'), /stale rejection changed Match revision/);

  const closedWindow = structuredClone(turn);
  closedWindow.phase = 'END';
  closedWindow.closure_window.is_open = false;
  closedWindow.turn_ended_reason = 'CLOSURE_PUBLISHED';
  assert.match(validateTurnState(closedWindow).join('\n'), /closed closure window retained/);
  assertInvalid(closedWindow, 'turn_state', /eligible_ticket_instance_ids.*more than 0 items/);
});

test('closure attribution is statistical and frozen Isolation/Repair slots settle separately', () => {
  const match = readJson('examples/runtime/match_state.after_closure.json');
  assert.equal(match.closure_statistics.length, 1);
  assert.equal(match.service_point_events.length, 2);
  const closure = match.closure_statistics[0];
  assert.deepEqual(new Set(match.service_point_events.map((score) => score.contribution_class)), new Set(['ISOLATION', 'REPAIR']));
  assert.equal(new Set(match.contribution_ledger.map((record) => record.slot_key)).size, 2);
  for (const score of match.service_point_events) {
    assert.equal(score.settled_by_closure_event_id, closure.closure_event_id);
    assert.notEqual(score.source_contribution_id, closure.closure_event_id);
    assert.equal(score.delta, 1);
    const contribution = match.contribution_ledger.find((record) => record.contribution_id === score.source_contribution_id);
    assert.ok(contribution);
    assert.equal(score.contribution_class, contribution.contribution_class);
    assert.equal(score.contributor_player_id, contribution.contributor_player_id);
    assert.ok(match.players.some((player) => player.player_id === score.recipient_player_id));
  }
  const closer = match.players.find((player) => player.player_id === closure.closer_player_id);
  assert.ok(closer, 'statistically attributed closer remains a Match Player');
  assert.ok(closer.closure_statistics.closure_event_ids.includes(closure.closure_event_id));
  assert.equal(Object.hasOwn(closure, 'service_points'), false);
});

test('deck, empty draw, Search, Refresh, and reconnect fixtures preserve frozen first-version limits', () => {
  const player = readJson('examples/runtime/player_state.empty_draw.json');
  assert.deepEqual(validatePlayerState(player), []);
  assert.equal(player.player_id, 'player_b');
  assert.equal(player.deck_snapshot_card_definition_ids.length, 30);
  const copies = new Map();
  for (const cardId of player.deck_snapshot_card_definition_ids) {
    copies.set(cardId, (copies.get(cardId) ?? 0) + 1);
  }
  assert.ok([...copies.values()].every((count) => count <= 3));
  assert.equal(
    player.deck_card_instance_ids.length
      + player.hand_card_instance_ids.length
      + player.discard_card_instance_ids.length
      + player.in_play_card_instance_ids.length,
    30,
  );
  assert.equal(player.deck_card_instance_ids.length, 0);
  assert.ok(player.empty_draws_skipped > 0);
  assert.equal(player.active, true);
  assert.ok(player.utility_resources.search_tokens <= player.utility_resources.max_search_tokens);
  assert.ok(player.utility_resources.refresh_tokens <= player.utility_resources.max_refresh_tokens);

  assert.equal(readJson('examples/runtime/action_request.search.json').action_type, 'SEARCH');
  assert.equal(readJson('examples/runtime/action_request.refresh.json').action_type, 'REFRESH');
});

test('deck copies, card-zone disjointness, utility caps, Search, and Refresh reject invalid economics', () => {
  const player = readJson('examples/runtime/player_state.empty_draw.json');

  const fourCopies = structuredClone(player);
  fourCopies.deck_snapshot_card_definition_ids[3] = 'card.fixture.01';
  assert.match(validatePlayerState(fourCopies).join('\n'), /has 4 copies/);

  const zoneOverlap = structuredClone(player);
  zoneOverlap.discard_card_instance_ids.push(zoneOverlap.hand_card_instance_ids[0]);
  assert.match(validatePlayerState(zoneOverlap).join('\n'), /appears in .* and/);

  const missingZoneCard = structuredClone(player);
  missingZoneCard.discard_card_instance_ids.pop();
  assert.match(validatePlayerState(missingZoneCard).join('\n'), /contain 29 cards instead of 30/);

  const overCap = structuredClone(player);
  overCap.utility_resources.search_tokens = overCap.utility_resources.max_search_tokens + 1;
  assert.match(validatePlayerState(overCap).join('\n'), /Search Tokens exceed cap/);

  const closureCountMismatch = structuredClone(player);
  closureCountMismatch.closure_statistics.tickets_closed = 2;
  assert.match(validatePlayerState(closureCountMismatch).join('\n'), /does not match closure event count/);

  const searchRequest = readJson('examples/runtime/action_request.search.json');
  const searchResult = readJson('examples/runtime/action_result.search.json');
  assert.deepEqual(validateActionExchange(searchRequest, searchResult), []);
  const freeSearch = structuredClone(searchResult);
  freeSearch.utility_resources_spent.search_tokens = 0;
  assert.match(validateActionExchange(searchRequest, freeSearch).join('\n'), /Search must spend one Action and one Search Token/);
  const badSearchZone = structuredClone(searchResult);
  badSearchZone.public_events[1].payload.hand_count_after = badSearchZone.public_events[1].payload.hand_count_before;
  assert.match(validateActionExchange(searchRequest, badSearchZone).join('\n'), /Search zone effects do not reconcile/);

  const searchWithoutPlaceholder = structuredClone(searchResult);
  searchWithoutPlaceholder.public_events.shift();
  assert.match(validateActionExchange(searchRequest, searchWithoutPlaceholder).join('\n'), /does not begin with exactly one public Worklog placeholder/);

  const searchWrongChronology = structuredClone(searchResult);
  searchWrongChronology.public_events.reverse();
  assert.match(validateActionExchange(searchRequest, searchWrongChronology).join('\n'), /does not begin with exactly one public Worklog placeholder/);

  const refreshRequest = readJson('examples/runtime/action_request.refresh.json');
  const refreshResult = readJson('examples/runtime/action_result.refresh.json');
  assert.deepEqual(validateActionExchange(refreshRequest, refreshResult), []);
  const freeRefresh = structuredClone(refreshResult);
  freeRefresh.actions_spent = 0;
  assert.match(validateActionExchange(refreshRequest, freeRefresh).join('\n'), /Refresh must spend one Action and one Refresh Token/);
  const badRefreshZone = structuredClone(refreshResult);
  badRefreshZone.public_events[1].payload.discard_count_after = 1;
  assert.match(validateActionExchange(refreshRequest, badRefreshZone).join('\n'), /Refresh zone effects do not reconcile/);

  const refreshWithoutPlaceholder = structuredClone(refreshResult);
  refreshWithoutPlaceholder.public_events.shift();
  assert.match(validateActionExchange(refreshRequest, refreshWithoutPlaceholder).join('\n'), /does not begin with exactly one public Worklog placeholder/);
});

test('JSON contracts contain no Equipment or Qualification gameplay fields', () => {
  const propertyNames = [];
  function visit(value) {
    if (Array.isArray(value)) return value.forEach(visit);
    if (!value || typeof value !== 'object') return;
    for (const [name, child] of Object.entries(value)) {
      propertyNames.push(name);
      visit(child);
    }
  }
  for (const { schema } of registry.schemas) visit(schema);
  for (const relativePath of examplePaths()) visit(readJson(relativePath));

  assert.ok(propertyNames.every((name) => !/equipment/i.test(name)));
  assert.ok(propertyNames.every((name) => !/qualification/i.test(name)));
});

test('authoritative Match fixture reconciles 60 card instances, event references, closure cleanup, and closer identity', () => {
  const match = readJson('examples/runtime/match_state.after_closure.json');
  assert.equal(match.card_instances.length, 60);
  assert.equal(match.events.length, 10);
  assert.deepEqual(validateMatchState(match), []);

  const missingCard = structuredClone(match);
  missingCard.card_instances.shift();
  assert.match(validateMatchState(missingCard).join('\n'), /zone references missing/);

  const missingEvent = structuredClone(match);
  missingEvent.events = missingEvent.events.filter((event) => event.event_id !== 'evt_close_001');
  assert.match(validateMatchState(missingEvent).join('\n'), /missing event evt_close_001/);

  const wrongDefinition = structuredClone(match);
  wrongDefinition.card_instances[0].card_definition_id = 'card.fixture.10';
  assert.match(validateMatchState(wrongDefinition).join('\n'), /do not reconcile with Ready deck snapshot/);

  const retainedTurn = structuredClone(match);
  retainedTurn.turn_state = readJson('examples/runtime/turn_state.closure_window.json');
  assert.match(validateMatchState(retainedTurn).join('\n'), /completed Match retained a turn|archived Ticket remained in closure window/);

  const closureRequest = readJson('examples/runtime/action_request.publish_closure.json');
  const closureResult = readJson('examples/runtime/action_result.publish_closure.json');
  const ticket = readJson('examples/runtime/ticket_state.return_verify_close.json');
  const publicView = readJson('examples/runtime/public_match_view.after_closure.json');
  assert.deepEqual(validatePublicMatchView(publicView), []);
  assert.equal(publicView.revision, match.revision);
  assert.equal(publicView.status, match.status);
  for (const publicPlayer of publicView.players) {
    const authoritative = match.players.find((player) => player.player_id === publicPlayer.player_id);
    assert.ok(authoritative);
    assert.equal(publicPlayer.hand_count, authoritative.hand_card_instance_ids.length);
    assert.equal(publicPlayer.deck_count, authoritative.deck_card_instance_ids.length);
    assert.equal(publicPlayer.service_points, authoritative.service_points);
    assert.equal(publicPlayer.search_tokens, authoritative.utility_resources.search_tokens);
    assert.equal(publicPlayer.refresh_tokens, authoritative.utility_resources.refresh_tokens);
    assert.equal(publicPlayer.tickets_closed, authoritative.closure_statistics.tickets_closed);
  }
  const closerIds = [
    closureRequest.player_id,
    closureResult.public_events[0].actor_player_id,
    closureResult.public_events[0].payload.statistically_attributed_player_id,
    ticket.closure.closer_player_id,
    match.closure_statistics[0].closer_player_id,
    publicView.closure_statistics[0].closer_player_id,
    readJson('examples/runtime/player_state.empty_draw.json').player_id,
  ];
  assert.deepEqual(new Set(closerIds), new Set(['player_b']));
});

test('date-time format requires an RFC 3339 date and time, not a parseable date-only string', () => {
  const event = readJson('examples/runtime/game_event.worklog_placeholder.json');
  event.created_at = '2026-08-22';
  assertInvalid(event, 'game_event', /is not an RFC 3339 date-time/);

  event.created_at = '2026-02-30T12:00:00Z';
  assertInvalid(event, 'game_event', /is not an RFC 3339 date-time/);

  event.created_at = '2026-08-22T24:00:00Z';
  assertInvalid(event, 'game_event', /is not an RFC 3339 date-time/);

  event.created_at = '2028-02-29T23:59:59-05:00';
  assert.deepEqual(validateJsonSchema(event, schemaByFileBase.get('game_event'), registry), []);
});

test('repository-relative links changed in schema notes resolve', () => {
  const notes = [
    'docs/schema-notes/DOMAIN_SCHEMAS.md',
    'docs/schema-notes/RUNTIME_SCHEMAS.md',
    'docs/schema-notes/SERVER_AUTHORITY.md',
  ];
  const markdownLink = /\[[^\]]*\]\(([^)]+)\)/g;
  for (const relativePath of notes) {
    const source = fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8');
    for (const [, rawTarget] of source.matchAll(markdownLink)) {
      if (/^(?:https?:|mailto:|#)/.test(rawTarget)) continue;
      const fileTarget = decodeURIComponent(rawTarget.split('#')[0]);
      const resolved = path.resolve(path.dirname(path.join(repositoryRoot, relativePath)), fileTarget);
      assert.ok(fs.existsSync(resolved), `${relativePath} -> ${rawTarget}`);
    }
  }
});
