import {
  createMatch,
  projectPrivatePlayer,
  submitIntent,
} from '../../generated/play/src/engine/index.mjs';
import {
  buildTicketsV3,
  createTask014Catalogs,
  TASK_014_BUILDER_VERSION,
  TASK_014_CARD_CATALOG_VERSION,
  TASK_014_CONFIGURATION_VERSION,
  TASK_014_DOMAIN_CONTENT_VERSION,
  TASK_014_TICKET_CONTENT_VERSION,
} from '../../generated/play/src/builder/task-014.mjs';
import {
  DIAGNOSIS_V2_BUILDER_VERSION,
  DIAGNOSIS_V2_CARD_CATALOG_VERSION,
  DIAGNOSIS_V2_CONFIGURATION_VERSION,
  DIAGNOSIS_V2_TICKET_CONTENT_VERSION,
  buildTicketsV2,
  createDiagnosisV2Catalogs,
} from '../../generated/play/src/builder/diagnosis-v2.mjs';
import {
  STORY_MATCH_RESULT_VERSION,
  createStoryBuilderConfiguration,
  loadStoryMatchRegistry,
  preflightStoryDeck,
  resolveStoryMatch,
} from './story-match-registry.mjs';

const PLAYER_ID = 'player.solo';
const TEAM_ID = 'team.cooperative';
const CONTENT_ROOT = new URL('../../generated/play/content/gameplay-v1/', import.meta.url);
const SAFE_ID = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;

let catalogs = null;
let state = null;
let startedAtMilliseconds = null;
let requestSequence = 0;
let intentLookup = new Map();
let matchMetadata = null;
let storyContext = null;
let storyReviewContext = null;

const clone = (value) => structuredClone(value);

async function loadJson(name) {
  const response = await fetch(new URL(name, CONTENT_ROOT), { cache: 'no-cache' });
  if (!response.ok) throw new Error(`Required play content ${name} returned ${response.status}.`);
  return response.json();
}

async function loadCatalogs() {
  if (catalogs) return catalogs;
  const [cards, decks, domain, parts, coverage] = await Promise.all([
    loadJson('card-catalog-v3.json'),
    loadJson('decks-v3.json'),
    loadJson('domain-snapshot-v2.json'),
    loadJson('task-014-parts.json'),
    loadJson('playable-coverage-v3.json'),
  ]);
  catalogs = createTask014Catalogs({ cards, decks, domain, parts, coverage });
  return catalogs;
}

async function loadTutorialCatalogs() {
  const [cards, decks, domain, ticketContent, tutorialContent] = await Promise.all([
    loadJson('card-catalog.json'),
    loadJson('decks.json'),
    loadJson('domain-snapshot.json'),
    loadJson('ticket-templates.json'),
    loadJson('tutorials-v1.json'),
  ]);
  const loaded = createDiagnosisV2Catalogs({ cards, decks, domain, ticketContent });
  if (tutorialContent.tutorial_catalog_version !== 'tutorial-checkpoints-v1'
      || tutorialContent.ruleset_version !== loaded.rulesetVersion
      || tutorialContent.builder_version !== DIAGNOSIS_V2_BUILDER_VERSION
      || tutorialContent.configuration_version !== DIAGNOSIS_V2_CONFIGURATION_VERSION
      || tutorialContent.ticket_content_version !== DIAGNOSIS_V2_TICKET_CONTENT_VERSION
      || tutorialContent.card_catalog_version !== DIAGNOSIS_V2_CARD_CATALOG_VERSION) {
    throw new Error('Tutorial content versions are incompatible with the local authority.');
  }
  return { loaded, tutorialContent };
}

function bounds(minimum, maximum) {
  return { minimum, maximum };
}

function compactCounts(cardDefinitionIds) {
  const counts = {};
  for (const id of cardDefinitionIds) counts[id] = (counts[id] ?? 0) + 1;
  return counts;
}

function exactKeys(value, expected) {
  const keys = Object.keys(value).sort();
  return keys.length === expected.length
    && keys.every((key, index) => key === [...expected].sort()[index]);
}

function assertStoryContext(candidate, definition) {
  const expected = [
    'schema_version', 'context_token', 'match_ref', 'checkpoint_id', 'return_label',
  ];
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)
      || !exactKeys(candidate, expected)
      || candidate.schema_version !== 'story-match-context-v1'
      || typeof candidate.context_token !== 'string'
      || candidate.context_token.length < 16
      || candidate.context_token.length > 160
      || !SAFE_ID.test(candidate.context_token)
      || candidate.match_ref !== definition.match_ref
      || candidate.checkpoint_id !== definition.pre_match_checkpoint_id
      || candidate.return_label !== definition.return_label) {
    throw new Error('Story Match context is stale, mismatched, or malformed.');
  }
  return clone(candidate);
}

function assertStoryReviewContext(candidate, definition) {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)
      || !exactKeys(candidate, ['schema_version', 'match_ref'])
      || candidate.schema_version !== 'story-review-session-v1'
      || candidate.match_ref !== definition.match_ref) {
    throw new Error('Story practice context is mismatched or malformed.');
  }
  return clone(candidate);
}

function assertStoryPreflightPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)
      || !exactKeys(payload, ['match_ref', 'card_definition_ids'])
      || typeof payload.match_ref !== 'string'
      || !SAFE_ID.test(payload.match_ref)
      || !Array.isArray(payload.card_definition_ids)
      || payload.card_definition_ids.length !== 30
      || payload.card_definition_ids.some((id) => typeof id !== 'string' || !SAFE_ID.test(id))) {
    throw new Error('Story Match preflight request is invalid.');
  }
}

function builderConfiguration(ticketCount, seed, responseCardDefinitionIds, loadedCatalogs) {
  const diagnosticIds = loadedCatalogs.cards.cards
    .filter((card) => card.play_contract?.contract_type === 'DIAGNOSTIC')
    .map((card) => card.id)
    .sort();
  const availableCounts = compactCounts(responseCardDefinitionIds);
  return {
    id: `builder_config.solo_pages.${ticketCount}`,
    entity_type: 'ticket_builder_configuration',
    configuration_version: TASK_014_CONFIGURATION_VERSION,
    scenario_or_mode_context: 'TRAINING',
    requested_ticket_count: ticketCount,
    seed,
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
    authored_difficulty_bounds: bounds(1, 4),
    fault_count_bounds: bounds(1, 3),
    required_actionable_fault_count_bounds: bounds(1, 2),
    causal_depth_bounds: bounds(0, 1),
    inbound_branching_bounds: bounds(0, 2),
    outbound_branching_bounds: bounds(0, 2),
    progressive_difficulty_profile: {
      profile_id: 'progressive.solo_pages.foundation',
      profile_version: 'solo-pages-v2',
      explicit_ceiling: 4,
      bands: [{
        start_generated_index: 0,
        end_generated_index: ticketCount - 1,
        target: 2,
        minimum: 1,
        maximum: 4,
      }],
    },
    generation_index_start: 0,
    allow_duplicate_causal_fingerprints: true,
    active_causal_fingerprints: [],
    legal_card_definition_ids: [...new Set([...diagnosticIds, ...responseCardDefinitionIds])].sort(),
    diagnostic_card_definition_ids: diagnosticIds,
    available_card_definition_counts: availableCounts,
    fallback_configuration_id: null,
  };
}

function tutorialBuilderConfiguration(definition, responseCardDefinitionIds, loadedCatalogs) {
  return {
    id: `builder_config.${definition.id}`,
    entity_type: 'ticket_builder_configuration',
    configuration_version: DIAGNOSIS_V2_CONFIGURATION_VERSION,
    scenario_or_mode_context: 'TRAINING',
    requested_ticket_count: 1,
    seed: definition.seed,
    generator_version: DIAGNOSIS_V2_BUILDER_VERSION,
    content_version: DIAGNOSIS_V2_TICKET_CONTENT_VERSION,
    domain_content_version: loadedCatalogs.domain.domain_content_version,
    card_catalog_version: DIAGNOSIS_V2_CARD_CATALOG_VERSION,
    allowed_domain_ids: [], excluded_domain_ids: [], allowed_tags: [], excluded_tags: [],
    guaranteed_categories: [], required_teaching_beats: [definition.required_teaching_beat],
    authored_difficulty_bounds: bounds(1, 4),
    fault_count_bounds: bounds(1, 3),
    required_actionable_fault_count_bounds: bounds(1, 2),
    causal_depth_bounds: bounds(0, 1),
    inbound_branching_bounds: bounds(0, 2),
    outbound_branching_bounds: bounds(0, 2),
    progressive_difficulty_profile: {
      profile_id: `progressive.${definition.id}`,
      profile_version: 'tutorial-checkpoints-v1',
      explicit_ceiling: 4,
      bands: [{ start_generated_index: 0, end_generated_index: 0, target: 2, minimum: 1, maximum: 4 }],
    },
    generation_index_start: 0,
    allow_duplicate_causal_fingerprints: false,
    active_causal_fingerprints: [],
    legal_card_definition_ids: loadedCatalogs.cards.cards.map((card) => card.id).sort(),
    available_card_definition_counts: compactCounts(responseCardDefinitionIds),
    fallback_configuration_id: null,
  };
}

function assertStartPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Start payload is invalid.');
  const allowed = new Set(['match_id', 'seed', 'ticket_count', 'display_name', 'deck_id', 'card_definition_ids', 'tutorial_id', 'story_context', 'story_review']);
  if (Object.keys(payload).some((key) => !allowed.has(key))) throw new Error('Start payload contains an unknown field.');
  if (typeof payload.match_id !== 'string' || payload.match_id.length > 120 || !SAFE_ID.test(payload.match_id)) throw new Error('Match ID is invalid.');
  if (typeof payload.seed !== 'string' || payload.seed.length < 1 || payload.seed.length > 160) throw new Error('Seed is invalid.');
  if (!Number.isSafeInteger(payload.ticket_count) || payload.ticket_count < 1 || payload.ticket_count > 10) throw new Error('Ticket count must be 1–10.');
  if (typeof payload.display_name !== 'string' || payload.display_name.length < 1 || payload.display_name.length > 40) throw new Error('Display name is invalid.');
  if (typeof payload.deck_id !== 'string' || !SAFE_ID.test(payload.deck_id)) throw new Error('Deck ID is invalid.');
  if (!Array.isArray(payload.card_definition_ids) || payload.card_definition_ids.length !== 30
    || payload.card_definition_ids.some((id) => typeof id !== 'string' || !SAFE_ID.test(id))) {
    throw new Error('Deck snapshot must contain exactly 30 valid Card identifiers.');
  }
  if (payload.tutorial_id !== undefined && (typeof payload.tutorial_id !== 'string' || !SAFE_ID.test(payload.tutorial_id))) {
    throw new Error('Tutorial ID is invalid.');
  }
  if ([payload.tutorial_id, payload.story_context, payload.story_review]
    .filter((value) => value !== undefined).length > 1) {
    throw new Error('A Match cannot combine Tutorial, canonical Story, and Story practice contexts.');
  }
}

function selectedAttempt(result) {
  return result.attempts.find((attempt) => attempt.attempt_id === result.selected_attempt_id) ?? null;
}

function diagnosticCardIds(loadedCatalogs) {
  return loadedCatalogs.cards.cards
    .filter((card) => card.play_contract?.contract_type === 'DIAGNOSTIC')
    .map((card) => card.id)
    .sort();
}

function storyBuild({ registry, definition, cardDefinitionIds, loadedCatalogs, configurationId }) {
  const configuration = createStoryBuilderConfiguration({
    registry,
    definition,
    cardDefinitionIds,
    diagnosticCardIds: diagnosticCardIds(loadedCatalogs),
    configurationId,
  });
  const builderResult = buildTicketsV3({ configuration, catalogs: loadedCatalogs });
  return { configuration, builderResult, attempt: selectedAttempt(builderResult) };
}

function assertReviewedStoryBatch(definition, attempt, builderResult) {
  if (!attempt || builderResult.status !== 'SUCCESS'
      || attempt.ticket_snapshots.length !== definition.requested_ticket_count) {
    throw new Error('The reviewed Story Ticket batch is unavailable in this content version.');
  }
  const definitionIds = attempt.ticket_snapshots.map((snapshot) => snapshot.id);
  if (JSON.stringify(definitionIds) !== JSON.stringify(definition.expected_ticket_definition_ids)
      || JSON.stringify(attempt.ticket_snapshot_digests) !== JSON.stringify(definition.expected_ticket_snapshot_digests)) {
    throw new Error('Story Ticket generation did not match the reviewed registry pins.');
  }
}

async function prepareStoryMatch(matchRef, cardDefinitionIds, { includeSnapshots = false } = {}) {
  const [registry, loadedCatalogs] = await Promise.all([loadStoryMatchRegistry(), loadCatalogs()]);
  const definition = resolveStoryMatch(registry, matchRef);
  const requirementCheck = preflightStoryDeck(definition, cardDefinitionIds);
  if (!requirementCheck.ok) {
    return {
      result: Object.freeze({
        ok: false,
        code: requirementCheck.code,
        match_ref: definition.match_ref,
        ticket_count: definition.requested_ticket_count,
        missing: requirementCheck.missing,
      }),
      registry,
      definition,
      loadedCatalogs,
    };
  }

  const canonicalDeck = loadedCatalogs.decks.decks.find(
    (deck) => deck.id === registry.deckPolicy.canonical_proof_deck_id,
  );
  if (!canonicalDeck) throw new Error('The Story canonical proof deck is missing from the pinned catalog.');
  const canonical = storyBuild({
    registry,
    definition,
    cardDefinitionIds: canonicalDeck.card_definition_ids,
    loadedCatalogs,
  });
  assertReviewedStoryBatch(definition, canonical.attempt, canonical.builderResult);

  const activeProof = storyBuild({
    registry,
    definition,
    cardDefinitionIds,
    loadedCatalogs,
    configurationId: `builder.story.preflight.${definition.shift_id.split('.').at(-1)}`,
  });
  if (!activeProof.attempt || activeProof.builderResult.status !== 'SUCCESS'
      || activeProof.attempt.ticket_snapshots.length !== definition.requested_ticket_count) {
    const diagnostics = activeProof.builderResult.attempts
      .flatMap((attempt) => attempt.diagnostics.map((diagnostic) => diagnostic.code));
    return {
      result: Object.freeze({
        ok: false,
        code: 'DECK_SOLVABILITY_UNPROVEN',
        match_ref: definition.match_ref,
        ticket_count: definition.requested_ticket_count,
        missing: Object.freeze([]),
        reason_codes: Object.freeze([...new Set(diagnostics)].sort()),
      }),
      registry,
      definition,
      loadedCatalogs,
    };
  }

  return {
    result: Object.freeze({
      ok: true,
      code: 'READY',
      match_ref: definition.match_ref,
      ticket_count: definition.requested_ticket_count,
      missing: Object.freeze([]),
    }),
    registry,
    definition,
    loadedCatalogs,
    ...(includeSnapshots ? {
      configuration: canonical.configuration,
      builderResult: canonical.builderResult,
      attempt: canonical.attempt,
    } : {}),
  };
}

async function preflightStoryMatch(payload) {
  assertStoryPreflightPayload(payload);
  const prepared = await prepareStoryMatch(payload.match_ref, payload.card_definition_ids);
  postMessage({ type: 'STORY_MATCH_PREFLIGHT', result: prepared.result });
}

function safeTicketPresentations(authoritativeState) {
  const tickets = [...Object.values(authoritativeState.tickets), ...Object.values(authoritativeState.archived_tickets)];
  return Object.fromEntries(tickets.map((ticket) => [ticket.ticket_instance_id, {
    display_name: ticket.definition_snapshot.presentation?.display_name || ticket.ticket_definition_id,
    short_description: ticket.definition_snapshot.presentation?.short_description || '',
    machine_state_summary: ticket.repair_history.at(-1)?.public_summary || 'No authorized machine-state change recorded.',
  }]));
}

function safeIntentMetadata(intent, index, view) {
  const payload = intent.payload;
  const held = payload.card_instance_id
    ? [...view.hand, ...(view.diagnostic_bench ?? [])]
      .find((card) => card.card_instance_id === payload.card_instance_id)
    : null;
  return {
    intent_id: `intent.${view.revision}.${String(index + 1).padStart(4, '0')}`,
    action_type: intent.action_type,
    ticket_instance_id: payload.ticket_instance_id ?? null,
    card_instance_id: payload.card_instance_id ?? null,
    card_definition_id: held?.card_definition_id ?? payload.selected_card_definition_id ?? null,
    candidate_fault_id: payload.candidate_fault_id ?? payload.candidate_fault_ids?.[0] ?? null,
    cited_evidence_event_ids: [...(payload.cited_evidence_event_ids ?? [])],
    source_action_event_id: payload.source_action_event_id ?? null,
    selected_card_definition_id: payload.selected_card_definition_id ?? null,
  };
}

function project() {
  const view = projectPrivatePlayer(state, PLAYER_ID, catalogs.engineCatalogs);
  intentLookup = new Map();
  const legalIntents = view.legal_intents.map((intent, index) => {
    const metadata = safeIntentMetadata(intent, index, view);
    intentLookup.set(metadata.intent_id, clone(intent));
    return metadata;
  });
  delete view.legal_intents;
  return {
    view,
    legal_intents: legalIntents,
    ticket_presentations: safeTicketPresentations(state),
    duplicate_ticket_disclosure: matchMetadata.has_repeated_fingerprint,
    ticket_count: matchMetadata.ticket_count,
  };
}

function allTickets() {
  return [...Object.values(state.tickets), ...Object.values(state.archived_tickets)]
    .filter((ticket, index, values) => values.findIndex((candidate) => candidate.ticket_instance_id === ticket.ticket_instance_id) === index);
}

function terminalSummary() {
  const result = state.result;
  if (!result) return null;
  const tickets = allTickets();
  const events = state.events;
  const actionRecords = state.action_records;
  const acceptedReferences = new Set();
  for (const ticket of tickets) {
    if (!ticket.closure) continue;
    [
      ...ticket.closure.accepted_isolation_event_ids,
      ...ticket.closure.decisive_evidence_event_ids,
      ...ticket.closure.repair_event_ids,
      ...ticket.closure.failed_verify_event_ids,
      ...ticket.closure.current_passing_verify_event_ids,
    ].forEach((id) => acceptedReferences.add(id));
    for (const verification of ticket.verification_history) {
      if (acceptedReferences.has(verification.verify_event_id)) {
        acceptedReferences.add(verification.evidence_event_id);
      }
    }
  }
  const eventById = new Map(events.map((event) => [event.event_id, event]));
  const redundant = actionRecords.filter((record) => {
    if (!['RUN_TEST', 'PLAY_CARD', 'COMMIT_ISOLATION', 'PERFORM_REPAIR', 'PERFORM_VERIFY'].includes(record.action_type)) return false;
    if (!record.source_result_event_id) return false;
    const event = eventById.get(record.source_result_event_id);
    if (event?.event_type === 'ISOLATION_NOT_SUPPORTED') return false;
    return !acceptedReferences.has(record.source_result_event_id);
  }).length;
  const verificationRecords = tickets.flatMap((ticket) => ticket.verification_history);
  const rejectedIsolations = events.filter((event) => event.event_type === 'ISOLATION_NOT_SUPPORTED').length;
  const finalScore = result.final_team_scores[TEAM_ID] ?? result.final_player_scores[PLAYER_ID] ?? 0;
  const elapsedSeconds = Math.max(0, Math.round((Date.parse(result.completed_at) - startedAtMilliseconds) / 1000));
  const reasonCodes = [...result.reason_codes];
  const won = result.valid && result.winning_team_ids.includes(TEAM_ID);
  const stalemate = reasonCodes.includes('STALEMATE');
  const invalidOrCapped = !result.valid || reasonCodes.some((code) => ['SIMULATION_CAP', 'ADMIN_INVALIDATION'].includes(code));

  return {
    summary_version: 'solo-result-summary-v2',
    result_id: `result.${state.match_id}`,
    match_id: state.match_id,
    valid: result.valid,
    reason_codes: reasonCodes,
    matches_completed: 1,
    solo_wins: won ? 1 : 0,
    solo_losses: !won && !stalemate && !invalidOrCapped ? 1 : 0,
    solo_stalemates: stalemate ? 1 : 0,
    invalid_or_capped_results: invalidOrCapped ? 1 : 0,
    tickets_closed: state.closure_statistics.length,
    starting_service_points: 0,
    final_service_points: finalScore,
    service_points_gained: finalScore,
    tests_run: actionRecords.filter((record) => ['RUN_TEST', 'PLAY_CARD'].includes(record.action_type)).length,
    isolations_accepted: actionRecords.filter((record) => record.action_type === 'COMMIT_ISOLATION').length - rejectedIsolations,
    isolations_rejected: rejectedIsolations,
    repairs_performed: actionRecords.filter((record) => record.action_type === 'PERFORM_REPAIR').length,
    verify_attempts: verificationRecords.length,
    verify_passes: verificationRecords.filter((record) => record.result === 'PASS').length,
    verify_failures: verificationRecords.filter((record) => record.result === 'FAIL').length,
    verify_inconclusive: verificationRecords.filter((record) => record.result === 'INCONCLUSIVE').length,
    documentation_actions: actionRecords.filter((record) => record.action_type === 'DOCUMENT_LIVE').length,
    assists: 0,
    failed_verifies: verificationRecords.filter((record) => record.result === 'FAIL').length,
    redundant_or_superseded_actions: redundant,
    turns_elapsed: events.filter((event) => event.event_type === 'TURN_ENDED').length,
    elapsed_seconds: elapsedSeconds,
    search_uses: actionRecords.filter((record) => record.action_type === 'SEARCH').length,
    refresh_uses: actionRecords.filter((record) => record.action_type === 'REFRESH').length,
    eliminations_recorded: actionRecords.filter((record) => record.action_type === 'SET_ELIMINATION').length,
    tickets_given_up: (state.give_up_statistics ?? []).length,
  };
}

function terminalStoryResult(summary) {
  if (!summary || !storyContext) return null;
  const completion = !summary.valid
    ? 'INVALID'
    : summary.tickets_given_up > 0 ? 'ABANDONED' : 'COMPLETED';
  return {
    schema_version: STORY_MATCH_RESULT_VERSION,
    result_id: summary.result_id,
    match_id: summary.match_id,
    match_ref: storyContext.match_ref,
    completion,
    valid: summary.valid,
    reason_codes: [...summary.reason_codes],
    story_service_points_gained: Math.max(0, summary.service_points_gained),
    tickets_closed: summary.tickets_closed,
    tickets_given_up: summary.tickets_given_up,
    documented_outcome: summary.documentation_actions > 0,
    verified_outcome: summary.verify_passes > 0,
    contributions: {
      tests_run: summary.tests_run,
      isolations_accepted: summary.isolations_accepted,
      repairs_performed: summary.repairs_performed,
      verify_passes: summary.verify_passes,
      documentation_actions: summary.documentation_actions,
    },
  };
}

async function startMatch(payload) {
  if (state) throw new Error('A local Match is already active.');
  assertStartPayload(payload);
  let tutorialDefinition = null;
  let storyDefinition = null;
  let nextStoryContext = null;
  let nextStoryReviewContext = null;
  let loaded;
  let configuration;
  let builderResult;
  if (payload.tutorial_id) {
    const tutorial = await loadTutorialCatalogs();
    tutorialDefinition = tutorial.tutorialContent.tutorials.find((entry) => entry.id === payload.tutorial_id) ?? null;
    if (!tutorialDefinition) throw new Error('The requested Tutorial does not exist in the pinned catalog.');
    if (payload.seed !== tutorialDefinition.seed || payload.ticket_count !== 1) throw new Error('Tutorial start pins do not match its versioned definition.');
    loaded = tutorial.loaded;
    configuration = tutorialBuilderConfiguration(tutorialDefinition, payload.card_definition_ids, loaded);
    builderResult = buildTicketsV2({ configuration, catalogs: loaded });
  } else if (payload.story_context) {
    const prepared = await prepareStoryMatch(
      payload.story_context.match_ref,
      payload.card_definition_ids,
      { includeSnapshots: true },
    );
    if (!prepared.result.ok) {
      throw new Error(`The active deck did not pass Story Match preflight (${prepared.result.code}).`);
    }
    storyDefinition = prepared.definition;
    nextStoryContext = assertStoryContext(payload.story_context, storyDefinition);
    if (payload.seed !== storyDefinition.seed
        || payload.ticket_count !== storyDefinition.requested_ticket_count) {
      throw new Error('Story Match start pins do not match the reviewed registry.');
    }
    loaded = prepared.loadedCatalogs;
    configuration = prepared.configuration;
    builderResult = prepared.builderResult;
  } else if (payload.story_review) {
    const prepared = await prepareStoryMatch(
      payload.story_review.match_ref,
      payload.card_definition_ids,
      { includeSnapshots: true },
    );
    if (!prepared.result.ok) {
      throw new Error(`The active deck did not pass Story practice preflight (${prepared.result.code}).`);
    }
    storyDefinition = prepared.definition;
    nextStoryReviewContext = assertStoryReviewContext(payload.story_review, storyDefinition);
    if (payload.seed !== storyDefinition.seed
        || payload.ticket_count !== storyDefinition.requested_ticket_count) {
      throw new Error('Story practice start pins do not match the reviewed registry.');
    }
    loaded = prepared.loadedCatalogs;
    configuration = prepared.configuration;
    builderResult = prepared.builderResult;
  } else {
    loaded = await loadCatalogs();
    configuration = builderConfiguration(payload.ticket_count, payload.seed, payload.card_definition_ids, loaded);
    builderResult = buildTicketsV3({ configuration, catalogs: loaded });
  }
  catalogs = loaded;
  const attempt = selectedAttempt(builderResult);
  if (!attempt || builderResult.status !== 'SUCCESS' || attempt.ticket_snapshots.length !== payload.ticket_count) {
    const codes = builderResult.attempts.flatMap((candidate) => candidate.diagnostics.map((item) => item.code));
    throw new Error(`Ticket Builder could not create a complete Match (${[...new Set(codes)].join(', ') || 'unknown diagnostic'}).`);
  }
  if (tutorialDefinition) {
    const selectedTemplate = loaded.ticketContent.templates.find((entry) =>
      entry.template_id === attempt.selected_template_ids[0]);
    if (selectedTemplate?.ticket?.id !== tutorialDefinition.expected_ticket_definition_id) {
      throw new Error('Tutorial Builder output did not match its pinned Ticket checkpoint contract.');
    }
  }
  const now = new Date().toISOString();
  startedAtMilliseconds = Date.parse(now);
  matchMetadata = {
    ticket_count: payload.ticket_count,
    deck_id: payload.deck_id,
    has_repeated_fingerprint: new Set(attempt.selected_template_ids).size < attempt.selected_template_ids.length,
  };
  const nextState = createMatch({
    matchId: payload.match_id,
    players: [{
      player_id: PLAYER_ID,
      display_name: payload.display_name,
      controller_type: 'human',
      team_id: TEAM_ID,
      seat_number: 1,
    }],
    decksByPlayer: { [PLAYER_ID]: clone(payload.card_definition_ids) },
    ticketSnapshots: attempt.ticket_snapshots,
    catalogs: loaded.engineCatalogs,
    configuration: {
      collaboration_mode: 'cooperative',
      execution_mode: 'offline',
      starting_ticket_count: payload.ticket_count,
      queue_minimum: 0,
      termination_score: -1,
      starting_search_tokens: 3,
      ticket_search_tokens: 1,
      max_search_tokens: 5,
      starting_refresh_tokens: 1,
      max_refresh_tokens: 1,
      turn_cap: null,
      closure_cap: null,
      // Story carries its own validated return context, but the Match itself keeps
      // the ordinary Solo rules contract (including Give Up and settlement).
      play_context: tutorialDefinition ? 'TRAINING' : 'SOLO',
    },
    rulesetVersion: loaded.rulesetVersion,
    seed: payload.seed,
    now,
    ticketSource: {
      source_type: 'generated',
      content_version: loaded.ticketContent.ticket_content_version,
      generator_version: configuration.generator_version,
      configuration_id: configuration.id,
      seed: payload.seed,
      builder_result_id: builderResult.id,
    },
  });
  state = nextState;
  storyContext = nextStoryContext;
  storyReviewContext = nextStoryReviewContext;
  postMessage({
    type: 'MATCH_STARTED',
    projection: project(),
    story_context: storyContext ? clone(storyContext) : null,
    story_review: storyReviewContext ? clone(storyReviewContext) : null,
  });
}

function submitSelectedIntent(intentId) {
  if (!state) throw new Error('No local Match is active.');
  if (typeof intentId !== 'string' || !intentLookup.has(intentId)) throw new Error('The selected action is no longer legal.');
  const intent = intentLookup.get(intentId);
  requestSequence += 1;
  const requestId = `${state.match_id}.request.${String(requestSequence).padStart(6, '0')}`;
  const outcome = submitIntent({
    state,
    request: {
      request_id: requestId,
      match_id: state.match_id,
      player_id: PLAYER_ID,
      expected_revision: state.revision,
      action_type: intent.action_type,
      payload: clone(intent.payload),
      client_nonce: requestId,
    },
    authenticatedPlayerId: PLAYER_ID,
    catalogs: catalogs.engineCatalogs,
    now: new Date().toISOString(),
  });
  state = outcome.state;
  const projection = project();
  const safeEvents = [
    ...outcome.result.public_events,
    ...outcome.result.private_events,
    ...outcome.result.team_events,
  ].filter((event, index, values) => values.findIndex((candidate) => candidate.event_id === event.event_id) === index);
  const terminalResult = terminalSummary();
  postMessage({
    type: 'INTENT_RESOLVED',
    accepted: outcome.result.accepted,
    result: outcome.result,
    events: safeEvents,
    projection,
    terminal_result: terminalResult,
    story_context: storyContext ? clone(storyContext) : null,
    story_review: storyReviewContext ? clone(storyReviewContext) : null,
    story_match_result: terminalStoryResult(terminalResult),
  });
}

function clearMatch() {
  state = null;
  startedAtMilliseconds = null;
  requestSequence = 0;
  intentLookup = new Map();
  matchMetadata = null;
  storyContext = null;
  storyReviewContext = null;
}

self.addEventListener('message', async (event) => {
  const message = event.data;
  try {
    if (!message || typeof message !== 'object' || Array.isArray(message)) throw new Error('Worker message is invalid.');
    if (message.type === 'START_MATCH') await startMatch(message.payload);
    else if (message.type === 'PREFLIGHT_STORY_MATCH') await preflightStoryMatch(message.payload);
    else if (message.type === 'SUBMIT_INTENT') submitSelectedIntent(message.intent_id);
    else if (message.type === 'END_SESSION') {
      clearMatch();
      postMessage({ type: 'SESSION_ENDED' });
    } else throw new Error('Worker message type is not supported.');
  } catch (error) {
    postMessage({ type: 'WORKER_ERROR', message: error instanceof Error ? error.message : 'Unknown local authority error.' });
  }
});
