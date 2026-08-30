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
} from '../src/builder/diagnosis-v2.mjs';
import { validateTicketSolvability } from '../src/builder/ticket-solvability.mjs';
import {
  createMatch,
  getLegalIntents,
  projectPrivatePlayer,
  projectPublicMatch,
  submitIntent,
} from '../src/engine/index.mjs';
import {
  createClientDataContext,
  createDefaultState,
  recordTutorialCompletion,
  validateTutorialProgress,
} from '../viewer/js/play/data/client-data.mjs';
import {
  buildIsolationGuidanceModel,
  renderIsolationGuidance,
} from '../viewer/js/play/pages/game-page.mjs';
import {
  TUTORIAL_RECOVERY_ATTEMPT_LIMIT,
  TutorialController,
  validateTutorialReferences,
} from '../viewer/js/play/tutorial-controller.mjs';
import { loadSchemaRegistry, validateJsonSchema } from './helpers/json-schema-validator.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(ROOT, relative), 'utf8'));
const source = {
  cards: readJson('content/gameplay-v1/card-catalog.json'),
  decks: readJson('content/gameplay-v1/decks.json'),
  domain: readJson('content/gameplay-v1/domain-snapshot.json'),
  ticketContent: readJson('content/gameplay-v1/ticket-templates.json'),
};
const tutorials = readJson('content/gameplay-v1/tutorials-v1.json');
const catalogs = createDiagnosisV2Catalogs(source);
const PLAYER = 'player.tutorial';
const TEAM = 'team.tutorial';

function configuration(definition) {
  return {
    id: `builder_config.${definition.id}`,
    entity_type: 'ticket_builder_configuration',
    configuration_version: DIAGNOSIS_V2_CONFIGURATION_VERSION,
    scenario_or_mode_context: 'TRAINING',
    requested_ticket_count: 1,
    seed: definition.seed,
    generator_version: DIAGNOSIS_V2_BUILDER_VERSION,
    content_version: DIAGNOSIS_V2_TICKET_CONTENT_VERSION,
    domain_content_version: catalogs.domain.domain_content_version,
    card_catalog_version: DIAGNOSIS_V2_CARD_CATALOG_VERSION,
    allowed_domain_ids: [], excluded_domain_ids: [], allowed_tags: [], excluded_tags: [],
    guaranteed_categories: [], required_teaching_beats: [definition.required_teaching_beat],
    authored_difficulty_bounds: { minimum: 1, maximum: 4 },
    fault_count_bounds: { minimum: 1, maximum: 3 },
    required_actionable_fault_count_bounds: { minimum: 1, maximum: 2 },
    causal_depth_bounds: { minimum: 0, maximum: 1 },
    inbound_branching_bounds: { minimum: 0, maximum: 2 },
    outbound_branching_bounds: { minimum: 0, maximum: 2 },
    progressive_difficulty_profile: {
      profile_id: `progressive.${definition.id}`,
      profile_version: tutorials.tutorial_catalog_version,
      explicit_ceiling: 4,
      bands: [{ start_generated_index: 0, end_generated_index: 0, target: 2, minimum: 1, maximum: 4 }],
    },
    generation_index_start: 0,
    allow_duplicate_causal_fingerprints: false,
    active_causal_fingerprints: [],
    legal_card_definition_ids: catalogs.cards.cards.map((card) => card.id).sort(),
    fallback_configuration_id: null,
  };
}

function builtTicket(definition) {
  const result = buildTicketsV2({ configuration: configuration(definition), catalogs });
  assert.equal(result.status, 'SUCCESS', JSON.stringify(result.attempts));
  const attempt = result.attempts.find((entry) => entry.attempt_id === result.selected_attempt_id);
  assert.equal(attempt.ticket_snapshots.length, 1);
  const selectedTemplate = catalogs.ticketContent.templates.find((entry) =>
    entry.template_id === attempt.selected_template_ids[0]);
  assert.equal(selectedTemplate.ticket.id, definition.expected_ticket_definition_id);
  return { result, ticket: attempt.ticket_snapshots[0] };
}

function createTutorialMatch(definition, ticket) {
  return createMatch({
    matchId: `match.${definition.id}`,
    players: [{
      player_id: PLAYER,
      display_name: 'Tutorial technician',
      controller_type: 'human',
      team_id: TEAM,
      seat_number: 1,
    }],
    decksByPlayer: { [PLAYER]: catalogs.decks.decks[0].card_definition_ids },
    ticketSnapshots: [ticket],
    catalogs: catalogs.engineCatalogs,
    configuration: {
      collaboration_mode: 'cooperative',
      execution_mode: 'offline',
      starting_ticket_count: 1,
      queue_minimum: 0,
      termination_score: -1,
      starting_search_tokens: 3,
      ticket_search_tokens: 1,
      max_search_tokens: 5,
      starting_refresh_tokens: 1,
      max_refresh_tokens: 1,
      turn_cap: null,
      closure_cap: null,
      play_context: 'TRAINING',
    },
    rulesetVersion: catalogs.rulesetVersion,
    seed: definition.seed,
    now: '2026-08-26T12:00:00.000Z',
    ticketSource: {
      source_type: 'generated',
      content_version: catalogs.ticketContent.ticket_content_version,
      generator_version: DIAGNOSIS_V2_BUILDER_VERSION,
      configuration_id: `builder_config.${definition.id}`,
      seed: definition.seed,
      builder_result_id: `builder_result.${definition.id}`,
    },
  });
}

function primaryCardId(sourceDefinitionId) {
  return catalogs.cards.cards.find((card) =>
    card.primary_domain_reference?.entity_id === sourceDefinitionId)?.id ?? null;
}

function latestConfirmedCandidate(state) {
  for (let index = state.events.length - 1; index >= 0; index -= 1) {
    const effect = state.events[index].payload?.candidate_effects?.find((entry) => entry.disposition === 'CONFIRM');
    if (effect) return effect.candidate_fault_id;
  }
  return null;
}

function sourceCardMatches(state, intent, sourceDefinitionId, cardDefinitionId = null) {
  const selected = intent.payload.selected_card_definition_id;
  const held = intent.payload.card_instance_id
    ? state.card_instances[intent.payload.card_instance_id]?.card_definition_id
    : null;
  return (selected ?? held) === (cardDefinitionId ?? primaryCardId(sourceDefinitionId));
}

function clientProjection(state) {
  const view = projectPrivatePlayer(state, PLAYER, catalogs.engineCatalogs);
  const held = new Map([...view.hand, ...(view.diagnostic_bench ?? [])]
    .map((card) => [card.card_instance_id, card.card_definition_id]));
  const legalIntents = view.legal_intents.map((intent, index) => ({
    intent_id: `intent.${view.revision}.${String(index + 1).padStart(4, '0')}`,
    action_type: intent.action_type,
    ticket_instance_id: intent.payload.ticket_instance_id ?? null,
    card_instance_id: intent.payload.card_instance_id ?? null,
    card_definition_id: held.get(intent.payload.card_instance_id)
      ?? intent.payload.selected_card_definition_id ?? null,
    candidate_fault_id: intent.payload.candidate_fault_id
      ?? intent.payload.candidate_fault_ids?.[0] ?? null,
    cited_evidence_event_ids: [...(intent.payload.cited_evidence_event_ids ?? [])],
    source_action_event_id: intent.payload.source_action_event_id ?? null,
    selected_card_definition_id: intent.payload.selected_card_definition_id ?? null,
  }));
  delete view.legal_intents;
  return { view, legal_intents: legalIntents };
}

function intendedAction(state, checkpoint) {
  const intents = getLegalIntents({ state, playerId: PLAYER, catalogs: catalogs.engineCatalogs });
  return intents.find((intent) => {
    if (intent.action_type !== checkpoint.action_type) return false;
    if (checkpoint.source_definition_id && checkpoint.action_type === 'RUN_TEST') {
      return intent.payload.execution_definition_id === checkpoint.source_definition_id;
    }
    if (checkpoint.source_definition_id && !sourceCardMatches(
      state, intent, checkpoint.source_definition_id, checkpoint.card_definition_id,
    )) return false;
    if (checkpoint.candidate_source === 'LATEST_CONFIRM') {
      return intent.payload.candidate_fault_id === latestConfirmedCandidate(state);
    }
    return true;
  }) ?? null;
}

function helperAction(state, checkpoint) {
  const intents = getLegalIntents({ state, playerId: PLAYER, catalogs: catalogs.engineCatalogs });
  const cardId = checkpoint.card_definition_id
    ?? (checkpoint.source_definition_id ? primaryCardId(checkpoint.source_definition_id) : null);
  if (cardId && checkpoint.support_action_types.includes('SEARCH')) {
    const search = intents.find((intent) => intent.action_type === 'SEARCH'
      && intent.payload.selected_card_definition_id === cardId);
    if (search) return search;
  }
  if (checkpoint.support_action_types.includes('REFRESH')) {
    const refresh = intents.find((intent) => intent.action_type === 'REFRESH');
    if (refresh) return refresh;
  }
  if (checkpoint.support_action_types.includes('PASS_TURN')) {
    return intents.find((intent) => intent.action_type === 'PASS_TURN') ?? null;
  }
  return null;
}

function submit(state, intent, sequence) {
  assert.ok(intent, 'Expected a real legal tutorial intent');
  return submitIntent({
    state,
    request: {
      request_id: `${state.match_id}.request.${String(sequence).padStart(4, '0')}`,
      match_id: state.match_id,
      player_id: PLAYER,
      expected_revision: state.revision,
      action_type: intent.action_type,
      payload: structuredClone(intent.payload),
      client_nonce: `tutorial.${sequence}`,
    },
    authenticatedPlayerId: PLAYER,
    catalogs: catalogs.engineCatalogs,
    now: new Date(Date.parse('2026-08-26T12:00:00.000Z') + sequence * 1000).toISOString(),
  });
}

function replayTutorial(definition) {
  const { ticket } = builtTicket(definition);
  let state = createTutorialMatch(definition, ticket);
  let sequence = 0;
  const observed = new Set();
  const trace = [];
  const catalog = { ...catalogs, cardById: new Map(catalogs.cards.cards.map((card) => [card.id, card])) };
  const controller = new TutorialController(definition, { catalog });
  for (const checkpoint of definition.checkpoints) {
    assert.equal(controller.current.id, checkpoint.id);
    if (checkpoint.checkpoint_kind === 'EXPLAIN') {
      assert.equal(controller.continueExplanation(clientProjection(state)), true);
      continue;
    }
    let recoveryCount = 0;
    while (true) {
      const projection = clientProjection(state);
      const guide = controller.guidance(projection);
      trace.push({
        checkpoint_id: checkpoint.id,
        guidance_mode: guide.mode,
        actions_remaining: projection.view.public_match.turn?.actions_remaining ?? null,
        documentable_action_count: projection.view.documentable_actions.length,
        legal_document_live_count: projection.legal_intents
          .filter((intent) => intent.action_type === 'DOCUMENT_LIVE').length,
        legal_helper_action_type: guide.mode === 'RECOVERY' ? guide.intent.action_type : null,
        ticket_status: projection.view.public_match.repair_queue[0]?.status ?? 'ARCHIVED',
        closure_bundle_count: Object.keys(projection.view.closure_bundles).length,
      });
      assert.notEqual(guide.mode, 'BLOCKED', `${checkpoint.id} failed its pinned semantic reachability guard`);
      const intent = guide.mode === 'EXPECTED'
        ? intendedAction(state, checkpoint)
        : helperAction(state, checkpoint);
      assert.ok(intent, `${checkpoint.id} did not expose ${guide.mode.toLowerCase()} authority`);
      assert.equal(intent.action_type, guide.intent.action_type);
      assert.equal(controller.submit(guide.intent, projection), true);
      sequence += 1;
      const before = state.events.length;
      const transition = submit(state, intent, sequence);
      assert.equal(transition.result.accepted, true);
      state = transition.state;
      const events = state.events.slice(before);
      controller.handleResolution(guide.intent, events, transition.result, clientProjection(state));
      if (guide.mode === 'RECOVERY') {
        recoveryCount += 1;
        assert.ok(recoveryCount <= TUTORIAL_RECOVERY_ATTEMPT_LIMIT);
        continue;
      }
      const eventTypes = new Set(events.map((event) => event.event_type));
      checkpoint.expected_event_types.forEach((type) => {
        assert.ok(eventTypes.has(type), `${checkpoint.id} did not produce ${type}`);
        observed.add(type);
      });
      break;
    }
  }
  assert.equal(state.status, 'COMPLETED');
  assert.equal(controller.completed, true);
  if (process.env.TASK_047_TRACE === '1') {
    console.log(`TASK-047 trace ${definition.id}: ${JSON.stringify(trace)}`);
  }
  return { state, observed, trace };
}

function reachCheckpoint(definition, checkpointId) {
  const { ticket } = builtTicket(definition);
  let state = createTutorialMatch(definition, ticket);
  let sequence = 0;
  for (const checkpoint of definition.checkpoints) {
    if (checkpoint.id === checkpointId) return { state, sequence, checkpoint };
    if (checkpoint.checkpoint_kind === 'EXPLAIN') continue;
    let intent = intendedAction(state, checkpoint);
    for (let guard = 0; !intent && guard < TUTORIAL_RECOVERY_ATTEMPT_LIMIT; guard += 1) {
      sequence += 1;
      const helper = helperAction(state, checkpoint);
      assert.ok(helper, `${checkpoint.id} has no legal recovery before ${checkpointId}`);
      const transition = submit(state, helper, sequence);
      assert.equal(transition.result.accepted, true);
      state = transition.state;
      intent = intendedAction(state, checkpoint);
    }
    sequence += 1;
    const transition = submit(state, intent, sequence);
    assert.equal(transition.result.accepted, true);
    state = transition.state;
  }
  assert.fail(`Checkpoint ${checkpointId} was not reached.`);
}

test('tutorial catalogs and local progress are versioned, schema-valid, and reference real content', () => {
  const baseRegistry = loadSchemaRegistry(ROOT);
  const tutorialSchema = readJson('schemas/client/tutorial_catalog.schema.json');
  const progressSchema = readJson('schemas/client/tutorial_progress.schema.json');
  const registry = {
    schemas: [...baseRegistry.schemas, { schema: tutorialSchema }, { schema: progressSchema }],
    byId: new Map([...baseRegistry.byId, [tutorialSchema.$id, tutorialSchema], [progressSchema.$id, progressSchema]]),
  };
  assert.deepEqual(validateJsonSchema(tutorials, tutorialSchema, registry), []);
  const catalog = {
    ...catalogs,
    cardById: new Map(catalogs.cards.cards.map((card) => [card.id, card])),
  };
  assert.deepEqual(validateTutorialReferences(tutorials, catalog), []);

  const expandedCards = readJson('content/gameplay-v1/card-catalog-v3.json');
  const expandedDecks = readJson('content/gameplay-v1/decks-v3.json');
  const clientContext = createClientDataContext({ cardCatalog: expandedCards, deckCatalog: expandedDecks });
  const progress = createDefaultState(clientContext).records.tutorials;
  assert.deepEqual(validateTutorialProgress(progress, clientContext), []);
  const completed = recordTutorialCompletion(progress, 'tutorial.fundamentals', clientContext);
  assert.deepEqual(validateJsonSchema(completed, progressSchema, registry), []);
  assert.deepEqual(completed.completed_tutorial_ids, ['tutorial.fundamentals']);
});

test('each pinned tutorial Builder output is independently solvable and replays through the real engine', () => {
  for (const definition of tutorials.tutorials) {
    const { ticket } = builtTicket(definition);
    const solvability = validateTicketSolvability(ticket, {
      domainCatalog: catalogs.domain,
      cardCatalog: catalogs.cards,
      legalCardDefinitionIds: configuration(definition).legal_card_definition_ids,
    });
    assert.equal(solvability.valid, true, JSON.stringify(solvability.errors));
    const { state, observed } = replayTutorial(definition);
    assert.equal(state.archived_ticket_ids.length, 1);
    if (definition.id === 'tutorial.verify_recovery') {
      assert.ok(observed.has('TICKET_RETURNED_TO_DIAGNOSIS'));
      assert.equal(state.tickets[state.archived_ticket_ids[0]]?.verification_history?.some((entry) => entry.result === 'FAIL')
        ?? state.archived_tickets[state.archived_ticket_ids[0]].verification_history.some((entry) => entry.result === 'FAIL'), true);
    }
  }
});

test('post-RAID-Status guidance explains the exact mixed Evidence state without forecasting Drive Health', () => {
  const definition = tutorials.tutorials.find((entry) => entry.id === 'tutorial.fundamentals');
  const checkpointId = 'tutorial.fundamentals.isolation_help';
  const { state, checkpoint } = reachCheckpoint(definition, checkpointId);
  const projection = clientProjection(state);
  const ticket = projection.view.public_match.repair_queue[0];
  const catalog = {
    ...catalogs,
    domainById: new Map(catalogs.domain.entities.map((record) => [record.id, record])),
  };
  const model = buildIsolationGuidanceModel(ticket, projection, catalog, {
    candidateRoleHints: definition.candidate_role_hints,
  });
  const rendered = `${checkpoint.body.join(' ')} ${renderIsolationGuidance(model)}`;
  const array = model.candidates.find((candidate) => candidate.candidate_id === 'fault.storage.raid.degraded');
  const drive = model.candidates.find((candidate) => candidate.candidate_id === 'fault.storage.sas.drive_failed');

  assert.equal(ticket.accepted_isolations.length, 0);
  assert.equal(model.accepted_isolation_count, 0);
  assert.equal(model.legal_commit_route_count, 2);
  assert.equal(projection.legal_intents.filter((intent) => intent.action_type === 'COMMIT_ISOLATION').length, 2);
  assert.deepEqual(
    projection.view.authorized_events.flatMap((event) => event.payload?.candidate_effects ?? [])
      .filter((effect) => [array.candidate_id, drive.candidate_id].includes(effect.candidate_fault_id))
      .map((effect) => [effect.candidate_fault_id, effect.disposition]),
    [
      ['fault.storage.sas.drive_failed', 'SUPPORT'],
      ['fault.storage.raid.degraded', 'CONFIRM'],
    ],
  );
  assert.equal(array.role, 'NON_ACTIONABLE');
  assert.equal(array.strongest_disposition, 'CONFIRM');
  assert.equal(array.legal_commit_route, true);
  assert.equal(drive.role, 'ACTIONABLE');
  assert.equal(drive.strongest_disposition, 'SUPPORT');
  assert.equal(drive.legal_commit_route, true);
  assert.match(rendered, /RAID Array Degraded/);
  assert.match(rendered, /confirmed/i);
  assert.match(rendered, /non-actionable condition/i);
  assert.match(rendered, /Failed SAS Drive/);
  assert.match(rendered, /actionable fault/i);
  assert.match(rendered, /supported, not confirmed/i);
  assert.match(rendered, /drive, cable or backplane path, power, controller, or configuration/i);
  assert.match(rendered, /No accepted repair-opening Isolation exists yet/i);
  assert.match(rendered, /only its returned authorized Evidence can close or redirect that gap/i);
  assert.doesNotMatch(rendered, /decisive failed-drive Evidence|will confirm|eligible outcome/i);
  assert.doesNotMatch(JSON.stringify(projection), /server_only_truth|actual_present|eligible_outcome_id|evidence\.raid\.single_member_health/);
  assert.equal(projection.legal_intents.some((intent) =>
    intent.action_type === 'RUN_TEST'
      && intent.card_definition_id === 'card.core.drive_health_test'), true);
});

test('tutorial overlay only constrains real legal intents and does not inspect hidden truth', () => {
  const definition = tutorials.tutorials[0];
  const catalog = { ...catalogs, cardById: new Map(catalogs.cards.cards.map((card) => [card.id, card])) };
  const controller = new TutorialController(definition, { catalog });
  controller.continueExplanation();
  controller.continueExplanation();
  const state = createTutorialMatch(definition, builtTicket(definition).ticket);
  const projection = projectPrivatePlayer(state, PLAYER, catalogs.engineCatalogs);
  const legal = getLegalIntents({ state, playerId: PLAYER, catalogs: catalogs.engineCatalogs });
  const hypothesis = legal.find((intent) => intent.action_type === 'REVISE_HYPOTHESIS');
  const pass = legal.find((intent) => intent.action_type === 'PASS_TURN');
  assert.equal(controller.isIntentAllowed({ action_type: hypothesis.action_type }, projection), true);
  assert.equal(controller.isIntentAllowed({ action_type: pass.action_type }, projection), false);
  assert.doesNotMatch(JSON.stringify(definition), /server_only_truth|actual_present|eligible_outcome_id/);
});

test('failed-Verify Documentation checkpoint exposes a visible bounded Pass recovery from the exact zero-Action projection', () => {
  const definition = tutorials.tutorials.find((entry) => entry.id === 'tutorial.verify_recovery');
  const checkpointId = 'tutorial.verify_recovery.document_live';
  let { state, sequence, checkpoint } = reachCheckpoint(definition, checkpointId);
  const catalog = { ...catalogs, cardById: new Map(catalogs.cards.cards.map((card) => [card.id, card])) };
  const controller = new TutorialController(definition, { catalog });
  controller.index = definition.checkpoints.findIndex((entry) => entry.id === checkpointId);

  const before = clientProjection(state);
  const ticketId = before.view.public_match.repair_queue[0].ticket_instance_id;
  const sourceIdsBefore = before.view.documentable_actions
    .filter((record) => record.ticket_instance_id === ticketId)
    .map((record) => record.source_action_event_id);
  assert.equal(before.view.public_match.turn.actions_remaining, 0);
  assert.ok(sourceIdsBefore.length > 0);
  assert.equal(before.legal_intents.some((intent) => intent.action_type === 'DOCUMENT_LIVE'), false);
  assert.equal(before.legal_intents.some((intent) => intent.action_type === 'PUBLISH_CLOSURE'), true);
  const recovery = controller.guidance(before);
  assert.equal(recovery.mode, 'RECOVERY');
  assert.equal(recovery.intent.action_type, 'PASS_TURN');
  assert.match(recovery.explanation, /Document Live costs 1 Action/);
  assert.match(recovery.explanation, /Pass begins a fresh turn with 2 Actions/);
  assert.equal(controller.isIntentAllowed(recovery.intent, before), true);
  assert.equal(controller.isIntentAllowed(
    before.legal_intents.find((intent) => intent.action_type === 'PUBLISH_CLOSURE'),
    before,
  ), false);

  const rawPass = getLegalIntents({ state, playerId: PLAYER, catalogs: catalogs.engineCatalogs })
    .find((intent) => intent.action_type === 'PASS_TURN');
  assert.equal(controller.submit(recovery.intent, before), true);
  sequence += 1;
  let transition = submit(state, rawPass, sequence);
  assert.equal(transition.result.accepted, true);
  state = transition.state;
  let after = clientProjection(state);
  controller.handleResolution(recovery.intent, transition.events, transition.result, after);
  assert.equal(after.view.public_match.turn.actions_remaining, 2);
  assert.deepEqual(after.view.documentable_actions
    .filter((record) => record.ticket_instance_id === ticketId)
    .map((record) => record.source_action_event_id), sourceIdsBefore);
  assert.equal(controller.guidance(after).mode, 'EXPECTED');
  const documentMetadata = controller.guidance(after).intent;
  const rawDocument = getLegalIntents({ state, playerId: PLAYER, catalogs: catalogs.engineCatalogs })
    .find((intent) => intent.action_type === 'DOCUMENT_LIVE'
      && intent.payload.source_action_event_id === documentMetadata.source_action_event_id);
  assert.ok(rawDocument);
  assert.equal(controller.submit(documentMetadata, after), true);
  sequence += 1;
  transition = submit(state, rawDocument, sequence);
  assert.equal(transition.result.accepted, true);
  state = transition.state;
  after = clientProjection(state);
  controller.handleResolution(documentMetadata, transition.events, transition.result, after);
  assert.equal(controller.current.id, 'tutorial.verify_recovery.close');
  const sourceIdsAfter = after.view.documentable_actions
    .filter((record) => record.ticket_instance_id === ticketId)
    .map((record) => record.source_action_event_id);
  assert.equal(sourceIdsAfter.includes(documentMetadata.source_action_event_id), false);
  assert.deepEqual(sourceIdsAfter, sourceIdsBefore.filter((id) => id !== documentMetadata.source_action_event_id));
  assert.equal(transition.events.some((event) => event.event_type === 'WORKLOG_PUBLICATION'
    && event.payload.source_action_event_id === documentMetadata.source_action_event_id), true);
});

test('a Documentation checkpoint with no projected source fails safely, and repeated recovery state is cycle-bounded', () => {
  const definition = tutorials.tutorials.find((entry) => entry.id === 'tutorial.verify_recovery');
  const checkpointId = 'tutorial.verify_recovery.document_live';
  const { state } = reachCheckpoint(definition, checkpointId);
  const catalog = { ...catalogs, cardById: new Map(catalogs.cards.cards.map((card) => [card.id, card])) };
  const controller = new TutorialController(definition, { catalog });
  controller.index = definition.checkpoints.findIndex((entry) => entry.id === checkpointId);
  const empty = clientProjection(state);
  empty.view.documentable_actions = [];
  empty.legal_intents = empty.legal_intents.filter((intent) => intent.action_type !== 'DOCUMENT_LIVE');
  const blocked = controller.presentation(empty);
  assert.equal(blocked.guidance_mode, 'BLOCKED');
  assert.match(blocked.body.at(-1), /No eligible documentable source remains/);
  assert.match(blocked.body.at(-1), /Passing cannot create a record/);
  assert.match(blocked.body.at(-1), /Restart.*exit safely/i);
  assert.equal(controller.isIntentAllowed(
    empty.legal_intents.find((intent) => intent.action_type === 'PASS_TURN'), empty,
  ), false);

  const cyclicDefinition = structuredClone(definition);
  const cyclicCheckpoint = cyclicDefinition.checkpoints.find((entry) => entry.id === checkpointId);
  cyclicCheckpoint.action_type = 'PERFORM_REPAIR';
  cyclicCheckpoint.source_definition_id = 'repair.storage.rebuild_array';
  const cyclic = new TutorialController(cyclicDefinition, { catalog });
  cyclic.index = cyclicDefinition.checkpoints.findIndex((entry) => entry.id === checkpointId);
  const projection = clientProjection(state);
  const pass = projection.legal_intents.find((intent) => intent.action_type === 'PASS_TURN');
  assert.equal(cyclic.guidance(projection).mode, 'RECOVERY');
  assert.equal(cyclic.submit(pass, projection), true);
  cyclic.handleResolution(pass, [], { accepted: true }, projection);
  assert.equal(cyclic.guidance(projection).mode, 'BLOCKED');
  assert.match(cyclic.presentation(projection).body.at(-1), /repeated without exposing/);
});

test('Give Up keeps truth out of pre-reveal projections and reveals only after the authoritative transition', () => {
  const definition = tutorials.tutorials[0];
  let state = createTutorialMatch(definition, builtTicket(definition).ticket);
  assert.doesNotMatch(JSON.stringify(projectPublicMatch(state)), /solution_reveal|server_only_truth/);
  assert.deepEqual(projectPrivatePlayer(state, PLAYER, catalogs.engineCatalogs).solution_reveals, []);
  const giveUp = getLegalIntents({ state, playerId: PLAYER, catalogs: catalogs.engineCatalogs })
    .find((intent) => intent.action_type === 'GIVE_UP_TICKET');
  const transition = submit(state, giveUp, 1);
  assert.equal(transition.result.accepted, true);
  state = transition.state;
  const reveal = projectPrivatePlayer(state, PLAYER, catalogs.engineCatalogs).solution_reveals[0];
  assert.ok(reveal.solution_reveal.faults.length > 0);
  assert.equal(state.status, 'COMPLETED');
  assert.ok(state.result.reason_codes.includes('GIVE_UP'));
  assert.equal(state.give_up_statistics.length, 1);
});
