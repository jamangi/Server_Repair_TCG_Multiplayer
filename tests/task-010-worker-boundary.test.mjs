import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import {
  DIAGNOSIS_V2_BUILDER_VERSION,
  DIAGNOSIS_V2_CARD_CATALOG_VERSION,
  DIAGNOSIS_V2_CONFIGURATION_VERSION,
  DIAGNOSIS_V2_TICKET_CONTENT_VERSION,
  buildTicketsV2,
  createDiagnosisV2Catalogs,
} from '../viewer/generated/play/src/builder/diagnosis-v2.mjs';
import {
  TASK_014_BUILDER_VERSION,
  TASK_014_CARD_CATALOG_VERSION,
  TASK_014_CONFIGURATION_VERSION,
  TASK_014_DOMAIN_CONTENT_VERSION,
  TASK_014_TICKET_CONTENT_VERSION,
  buildTicketsV3,
  createTask014Catalogs,
} from '../viewer/generated/play/src/builder/task-014.mjs';
import {
  createClientDataContext,
  createDefaultState,
  createExportBundle,
  validateResultSummary,
} from '../viewer/js/play/data/client-data.mjs';
import { SoloGameSession } from '../viewer/js/play/game-session.mjs';

const REPOSITORY_ROOT = path.resolve(import.meta.dirname, '..');
const VIEWER_JS_ROOT = path.join(REPOSITORY_ROOT, 'viewer', 'js');
const WORKER_PATH = path.join(VIEWER_JS_ROOT, 'play', 'solo-worker.mjs');
const GENERATED_ROOT = path.join(REPOSITORY_ROOT, 'viewer', 'generated', 'play');
const PERSISTENCE_PATHS = [
  path.join(VIEWER_JS_ROOT, 'play', 'data', 'client-data.mjs'),
  path.join(VIEWER_JS_ROOT, 'play', 'storage-service.mjs'),
];

const readText = (filePath) => readFile(filePath, 'utf8');
const readJson = async (relativePath) => JSON.parse(
  await readText(path.join(REPOSITORY_ROOT, ...relativePath.split('/'))),
);

const projectionWithActions = (actionsRemaining) => ({
  legal_intents: [],
  view: {
    hand: [],
    public_match: {
      repair_queue: [],
      turn: { actions_remaining: actionsRemaining },
    },
  },
});

async function listFiles(root, relativeDirectory = '') {
  const entries = await readdir(path.join(root, relativeDirectory), { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const relative = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(root, relative));
    else if (entry.isFile()) files.push(relative.split(path.sep).join('/'));
  }
  return files;
}

function scanBalanced(source, openingIndex, opening = '{', closing = '}') {
  assert.equal(source[openingIndex], opening, `Expected ${opening} at ${openingIndex}`);
  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  for (let index = openingIndex; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];
    if (lineComment) {
      if (character === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (character === '*' && next === '/') {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (quote !== null) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === '/' && next === '/') {
      lineComment = true;
      index += 1;
      continue;
    }
    if (character === '/' && next === '*') {
      blockComment = true;
      index += 1;
      continue;
    }
    if (character === '"' || character === "'" || character === '`') {
      quote = character;
      continue;
    }
    if (character === opening) depth += 1;
    if (character === closing) {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  throw new Error(`Unbalanced ${opening}${closing} sequence.`);
}

function extractNamedFunction(source, name) {
  const start = source.search(new RegExp(`(?:async\\s+)?function\\s+${name}\\s*\\(`));
  assert.notEqual(start, -1, `Missing function ${name}`);
  const opening = source.indexOf('{', start);
  const closing = scanBalanced(source, opening);
  return source.slice(start, closing + 1);
}

function extractPostMessageObjects(source) {
  const objects = [];
  const pattern = /\bpostMessage\s*\(\s*\{/g;
  let match;
  while ((match = pattern.exec(source)) !== null) {
    const opening = source.indexOf('{', match.index);
    const closing = scanBalanced(source, opening);
    objects.push(source.slice(opening, closing + 1));
    pattern.lastIndex = closing + 1;
  }
  return objects;
}

function staticImports(source) {
  return [...source.matchAll(/\bimport\s+(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]/g)]
    .map((match) => match[1]);
}

function expectedResultSummaryKeys() {
  return [
    'assists',
    'documentation_actions',
    'elapsed_seconds',
    'eliminations_recorded',
    'failed_verifies',
    'final_service_points',
    'invalid_or_capped_results',
    'isolations_accepted',
    'isolations_rejected',
    'match_id',
    'matches_completed',
    'reason_codes',
    'redundant_or_superseded_actions',
    'refresh_uses',
    'repairs_performed',
    'result_id',
    'search_uses',
    'service_points_gained',
    'solo_losses',
    'solo_stalemates',
    'solo_wins',
    'starting_service_points',
    'summary_version',
    'tests_run',
    'tickets_closed',
    'tickets_given_up',
    'turns_elapsed',
    'valid',
    'verify_attempts',
    'verify_failures',
    'verify_inconclusive',
    'verify_passes',
  ].sort();
}

test('the module Worker is the sole Viewer importer of the canonical staged engine and Builder', async () => {
  const sourceFiles = (await listFiles(VIEWER_JS_ROOT))
    .filter((relative) => /\.(?:mjs|js)$/.test(relative));
  const stagedAuthorityImports = [];
  for (const relative of sourceFiles) {
    const source = await readText(path.join(VIEWER_JS_ROOT, ...relative.split('/')));
    for (const specifier of staticImports(source)) {
      if (/generated\/play\/src\/(?:engine|builder)\//.test(specifier)) {
        stagedAuthorityImports.push({ relative, specifier });
      }
    }
  }
  assert.deepEqual(stagedAuthorityImports, [
    {
      relative: 'play/solo-worker.mjs',
      specifier: '../../generated/play/src/engine/index.mjs',
    },
    {
      relative: 'play/solo-worker.mjs',
      specifier: '../../generated/play/src/builder/task-014.mjs',
    },
    {
      relative: 'play/solo-worker.mjs',
      specifier: '../../generated/play/src/builder/diagnosis-v2.mjs',
    },
  ]);

  const worker = await readText(WORKER_PATH);
  assert.match(worker, /projectPrivatePlayer\(state, PLAYER_ID, catalogs\.engineCatalogs\)/);
  assert.match(worker, /submitIntent\(\{[\s\S]*authenticatedPlayerId:\s*PLAYER_ID/);
  assert.match(worker, /buildTicketsV3\(\{/);
});

test('DOM-side modules neither import rules authority nor access or mutate authoritative Match, Card, or Ticket fields', async () => {
  const sourceFiles = (await listFiles(VIEWER_JS_ROOT))
    .filter((relative) => /\.(?:mjs|js)$/.test(relative) && relative !== 'play/solo-worker.mjs');
  const authoritativeNames = [
    'server_only_truth',
    'definition_snapshot',
    'fault_instances',
    'authored_diagnostic_targets',
    'authored_evidence_outcomes',
    'authored_repair_outcomes',
    'authored_verification_outcomes',
    'card_instances',
    'processed_requests',
    'random_state',
    'ticket_snapshot_queue',
    'contribution_ledger',
  ];
  for (const relative of sourceFiles) {
    const source = await readText(path.join(VIEWER_JS_ROOT, ...relative.split('/')));
    assert.doesNotMatch(
      source,
      /(?:\.\.\/)*generated\/play\/src\/(?:engine|builder)\/|(?:\.\.\/)*src\/(?:engine|builder)\//,
      relative,
    );
    assert.doesNotMatch(
      source,
      /\b(?:createMatch|submitIntent|buildTickets|projectPrivatePlayer|getLegalIntents)\s*\(/,
      relative,
    );
    for (const field of authoritativeNames) {
      assert.doesNotMatch(source, new RegExp(`\\b${field}\\b`), `${relative} references ${field}`);
    }
    assert.doesNotMatch(
      source,
      /\.(?:machine_state_key|machine_revision|revision|zone|controller_player_id|owner_player_id|status)\s*(?:=(?!=|>)|\+=|-=|\+\+|--)/,
      `${relative} writes an authoritative-looking runtime field`,
    );
  }
});

test('the DOM submits only an opaque intent_id and the Worker reconstructs the authoritative request', async () => {
  const sourceFiles = (await listFiles(VIEWER_JS_ROOT))
    .filter((relative) => /\.(?:mjs|js)$/.test(relative) && relative !== 'play/solo-worker.mjs');
  const submitObjects = [];
  for (const relative of sourceFiles) {
    const source = await readText(path.join(VIEWER_JS_ROOT, ...relative.split('/')));
    for (const objectSource of extractPostMessageObjects(source)) {
      if (objectSource.includes('SUBMIT_INTENT')) submitObjects.push({ relative, objectSource });
    }
  }
  assert.equal(submitObjects.length, 1, 'one DOM adapter should submit the opaque Worker intent');
  assert.match(submitObjects[0].objectSource, /\btype\s*:\s*['"]SUBMIT_INTENT['"]/);
  assert.match(submitObjects[0].objectSource, /\bintent_id\s*:/);
  assert.doesNotMatch(
    submitObjects[0].objectSource,
    /\b(?:payload|action_type|request_id|match_id|player_id|expected_revision|card_instance_id|ticket_instance_id)\s*:/,
  );

  const worker = await readText(WORKER_PATH);
  assert.match(worker, /message\.type\s*===\s*['"]SUBMIT_INTENT['"]\)\s*submitSelectedIntent\(message\.intent_id\)/);
  assert.match(worker, /const intent = intentLookup\.get\(intentId\)/);
  assert.match(worker, /action_type:\s*intent\.action_type/);
  assert.match(worker, /payload:\s*clone\(intent\.payload\)/);
  assert.doesNotMatch(worker, /submitSelectedIntent\(message\.(?:payload|request|action_type)\)/);
});

test('Worker output stays projection-safe and emits only audience-filtered events', async () => {
  const worker = await readText(WORKER_PATH);
  assert.match(worker, /delete view\.legal_intents/);
  assert.match(worker, /\.\.\.outcome\.result\.public_events/);
  assert.match(worker, /\.\.\.outcome\.result\.private_events/);
  assert.match(worker, /\.\.\.outcome\.result\.team_events/);
  assert.doesNotMatch(worker, /events\s*:\s*outcome\.events/);

  const postMessageObjects = extractPostMessageObjects(worker);
  assert.ok(postMessageObjects.length >= 4);
  for (const objectSource of postMessageObjects) {
    assert.doesNotMatch(
      objectSource,
      /\b(?:server_only_truth|definition_snapshot|fault_instances|authored_evidence_outcomes|random_state|processed_requests|action_records|ticket_snapshot_queue)\b/,
    );
  }

  const safeTicketPresentations = extractNamedFunction(worker, 'safeTicketPresentations');
  const resolveTicketPresentations = Function(
    'authoritativeState',
    `'use strict'; ${safeTicketPresentations}; return safeTicketPresentations(authoritativeState);`,
  );
  const ticketPresentations = resolveTicketPresentations({
    tickets: {
      'match.test.ticket.001': {
        ticket_instance_id: 'match.test.ticket.001',
        ticket_definition_id: 'ticket.storage.test',
        definition_snapshot: {
          presentation: { display_name: 'Safe title', short_description: 'Safe summary' },
          server_only_truth: { fault_instances: [{ fault_id: 'fault.secret' }] },
        },
        repair_history: [],
      },
    },
    archived_tickets: {},
  });
  assert.deepEqual(ticketPresentations, {
    'match.test.ticket.001': {
      display_name: 'Safe title',
      short_description: 'Safe summary',
      machine_state_summary: 'No authorized machine-state change recorded.',
    },
  });

  const safeIntentMetadata = extractNamedFunction(worker, 'safeIntentMetadata');
  const resolveIntentMetadata = Function(
    'intent',
    'index',
    'view',
    `'use strict'; ${safeIntentMetadata}; return safeIntentMetadata(intent, index, view);`,
  );
  const metadata = resolveIntentMetadata({
    action_type: 'RUN_TEST',
    payload: {
      ticket_instance_id: 'match.test.ticket.001',
      card_instance_id: 'match.test.card.001',
      execution_definition_id: 'test.secret.execution',
      target_ref: 'match.test.target.001',
      observed_machine_revision: 7,
      server_only_truth: { actual_present: true },
    },
  }, 0, {
    revision: 2,
    hand: [{ card_instance_id: 'match.test.card.001', card_definition_id: 'card.core.visual_inspection' }],
  });
  assert.deepEqual(Object.keys(metadata).sort(), [
    'action_type',
    'candidate_fault_id',
    'card_definition_id',
    'card_instance_id',
    'cited_evidence_event_ids',
    'intent_id',
    'selected_card_definition_id',
    'source_action_event_id',
    'ticket_instance_id',
  ].sort());
  assert.equal(Object.hasOwn(metadata, 'payload'), false);
  assert.equal(JSON.stringify(metadata).includes('secret'), false);
});

test('the game session announces starting and changed Action resources', () => {
  const announcements = [];
  const session = new SoloGameSession({ onAnnounce: (message) => announcements.push(message) });
  session.handleMessage({
    type: 'MATCH_STARTED',
    projection: projectionWithActions(2),
  });
  assert.match(announcements.at(-1), /first turn ready with 2 Actions/);

  session.handleMessage({
    type: 'INTENT_RESOLVED',
    projection: projectionWithActions(1),
    events: [],
    result: { accepted: true },
    terminal_result: null,
  });
  assert.match(announcements.at(-1), /1 Action remaining/);

  session.handleMessage({
    type: 'INTENT_RESOLVED',
    projection: projectionWithActions(2),
    events: [{ event_type: 'CARD_DRAWN', payload: {} }],
    result: { accepted: true },
    terminal_result: null,
  });
  assert.match(announcements.at(-1), /Actions refreshed to 2/);
  assert.match(announcements.at(-1), /Card was drawn/);
});

test('a module Worker startup failure rejects promptly and leaves no active Match', async () => {
  const OriginalWorker = globalThis.Worker;
  let terminated = false;
  class FailingWorker {
    constructor() { this.listeners = new Map(); }
    addEventListener(type, listener) { this.listeners.set(type, listener); }
    postMessage() {
      queueMicrotask(() => this.listeners.get('error')?.({ message: 'Synthetic Worker startup failure.' }));
    }
    terminate() { terminated = true; }
  }
  globalThis.Worker = FailingWorker;
  const announcements = [];
  try {
    const session = new SoloGameSession({ onAnnounce: (message) => announcements.push(message) });
    await assert.rejects(session.start({}), /Synthetic Worker startup failure/);
    assert.equal(session.active, false);
    assert.equal(session.worker, null);
    assert.equal(session.error, 'Synthetic Worker startup failure.');
    assert.equal(terminated, true);
    assert.equal(announcements.at(-1), 'Synthetic Worker startup failure.');
  } finally {
    if (OriginalWorker === undefined) delete globalThis.Worker;
    else globalThis.Worker = OriginalWorker;
  }
});

test('Worker result summaries have the exact strict client contract and classify stalemate/final-path Verify correctly', async () => {
  const worker = await readText(WORKER_PATH);
  const allTickets = extractNamedFunction(worker, 'allTickets');
  const terminalSummary = extractNamedFunction(worker, 'terminalSummary');
  const summarize = Function(
    'state',
    'startedAtMilliseconds',
    'TEAM_ID',
    'PLAYER_ID',
    `'use strict'; ${allTickets}; ${terminalSummary}; return terminalSummary();`,
  );
  const summary = summarize({
    match_id: 'match.solo.boundary',
    result: {
      valid: true,
      reason_codes: ['STALEMATE'],
      winner_player_ids: [],
      winning_team_ids: [],
      final_player_scores: { 'player.solo': 0 },
      final_team_scores: { 'team.cooperative': 0 },
      completed_at: '2026-08-23T12:01:05.000Z',
    },
    tickets: {},
    archived_tickets: {
      'match.solo.boundary.ticket.001': {
        ticket_instance_id: 'match.solo.boundary.ticket.001',
        closure: {
          accepted_isolation_event_ids: [],
          decisive_evidence_event_ids: [],
          repair_event_ids: [],
          failed_verify_event_ids: [],
          current_passing_verify_event_ids: ['event.verify.001'],
        },
        verification_history: [{
          verify_event_id: 'event.verify.001',
          evidence_event_id: 'event.verify-evidence.001',
          result: 'PASS',
        }],
      },
    },
    events: [{
      event_id: 'event.verify-evidence.001',
      event_type: 'VERIFY_EVIDENCE_CREATED',
    }],
    action_records: [{
      action_type: 'PERFORM_VERIFY',
      source_result_event_id: 'event.verify-evidence.001',
    }],
    closure_statistics: [{ ticket_instance_id: 'match.solo.boundary.ticket.001' }],
  }, Date.parse('2026-08-23T12:00:00.000Z'), 'team.cooperative', 'player.solo');

  assert.deepEqual(Object.keys(summary).sort(), expectedResultSummaryKeys());
  assert.deepEqual(validateResultSummary(summary), []);
  assert.equal(summary.solo_stalemates, 1);
  assert.equal(summary.solo_losses, 0);
  assert.equal(summary.verify_attempts, 1);
  assert.equal(summary.verify_passes, 1);
  assert.equal(summary.redundant_or_superseded_actions, 0);
  assert.equal(summary.elapsed_seconds, 65);
  assert.equal(Object.hasOwn(summary, 'completed_at'), false);
});

test('the Worker-derived 1/10 Ticket configurations preserve exact resources and build unique-first batches', async () => {
  const worker = await readText(WORKER_PATH);
  const bounds = extractNamedFunction(worker, 'bounds');
  const compactCounts = extractNamedFunction(worker, 'compactCounts');
  const builderConfiguration = extractNamedFunction(worker, 'builderConfiguration');
  const configure = Function(
    'ticketCount',
    'seed',
    'responseCardDefinitionIds',
    'loadedCatalogs',
    'TASK_014_CONFIGURATION_VERSION',
    'TASK_014_BUILDER_VERSION',
    'TASK_014_TICKET_CONTENT_VERSION',
    'TASK_014_DOMAIN_CONTENT_VERSION',
    'TASK_014_CARD_CATALOG_VERSION',
    `'use strict'; ${bounds}; ${compactCounts}; ${builderConfiguration}; return builderConfiguration(ticketCount, seed, responseCardDefinitionIds, loadedCatalogs);`,
  );
  const [cardCatalog, deckCatalog, domainCatalog, parts, coverage] = await Promise.all([
    readJson('content/gameplay-v1/card-catalog-v3.json'),
    readJson('content/gameplay-v1/decks-v3.json'),
    readJson('content/gameplay-v1/domain-snapshot-v2.json'),
    readJson('content/gameplay-v1/task-014-parts.json'),
    readJson('content/gameplay-v1/playable-coverage-v3.json'),
  ]);
  const expandedCatalogs = createTask014Catalogs({ cards: cardCatalog, decks: deckCatalog, domain: domainCatalog, parts, coverage });
  const starterDeck = expandedCatalogs.decks.decks.find((deck) => deck.id === 'deck.core.multisystem_response_v3');

  for (const ticketCount of [1, 10]) {
    const configuration = configure(
      ticketCount,
      `task-010-worker-${ticketCount}`,
      starterDeck.card_definition_ids,
      expandedCatalogs,
      TASK_014_CONFIGURATION_VERSION,
      TASK_014_BUILDER_VERSION,
      TASK_014_TICKET_CONTENT_VERSION,
      TASK_014_DOMAIN_CONTENT_VERSION,
      TASK_014_CARD_CATALOG_VERSION,
    );
    assert.equal(configuration.configuration_version, TASK_014_CONFIGURATION_VERSION);
    assert.equal(configuration.scenario_or_mode_context, 'TRAINING');
    assert.equal(configuration.requested_ticket_count, ticketCount);
    assert.equal(configuration.allow_duplicate_causal_fingerprints, true);
    assert.equal(configuration.diagnostic_card_definition_ids.length, 50);
    assert.equal(Object.values(configuration.available_card_definition_counts).reduce((sum, count) => sum + count, 0), 30);
    assert.equal(configuration.progressive_difficulty_profile.bands[0].end_generated_index, ticketCount - 1);
    const result = buildTicketsV3({ configuration, catalogs: expandedCatalogs });
    assert.equal(result.status, 'SUCCESS');
    const selected = result.attempts.find((attempt) => attempt.attempt_id === result.selected_attempt_id);
    assert.equal(selected.ticket_snapshots.length, ticketCount);
    assert.equal(new Set(selected.selected_template_ids).size, ticketCount);
  }

  assert.match(worker, /starting_ticket_count:\s*payload\.ticket_count/);
  assert.match(worker, /queue_minimum:\s*0/);
  assert.match(worker, /termination_score:\s*-1/);
  assert.match(worker, /collaboration_mode:\s*['"]cooperative['"]/);
  assert.match(worker, /duplicate_ticket_disclosure:\s*matchMetadata\.has_repeated_fingerprint/);
});

test('the generated Pages stage is a strict allowlist with no Node-only or server/simulation surface', async () => {
  const manifest = await readJson('viewer/generated/play/manifest.json');
  const gameplayFiles = new Set([
    'card-catalog.json',
    'decks.json',
    'domain-snapshot.json',
    'ticket-templates.json',
    'task-014-parts.json',
    'domain-snapshot-v2.json',
    'card-catalog-v3.json',
    'decks-v3.json',
    'playable-coverage-v3.json',
    'technical-action-glossary-v1.json',
    'technical-copy-review-v1.json',
    'tutorials-v1.json',
  ]);
  const forbiddenSegments = new Set([
    'automated_games',
    'campaign',
    'docs',
    'examples',
    'reports',
    'schemas',
    'server',
    'simulation',
    'tests',
    'tools',
  ]);
  assert.equal(manifest.profile_id, 'solo-pages-v2');
  assert.equal(manifest.hash_algorithm, 'sha256');
  assert.ok(manifest.files.length > 0);
  for (const entry of manifest.files) {
    const sourceParts = entry.source.split('/');
    const outputParts = entry.path.split('/');
    const canonicalIllustration = entry.source.startsWith('viewer/assets/play/canonical/')
      && entry.path.startsWith('assets/play/canonical/')
      && entry.path.endsWith('.webp');
    assert.ok(canonicalIllustration
      || [...sourceParts, ...outputParts].every((part) => !forbiddenSegments.has(part)), entry.path);
    const allowed = /^src\/(?:engine|builder|shared|story)\/[a-z0-9._-]+\.mjs$/.test(entry.source)
      || (entry.source.startsWith('content/gameplay-v1/')
        && (gameplayFiles.has(entry.source.slice('content/gameplay-v1/'.length))
          || entry.source.endsWith('/diagnosis-v2-migration.json')))
      || entry.source.startsWith('assets/')
      || entry.source.startsWith('content/story-v1/')
      || entry.source.startsWith('viewer/assets/play/')
      || entry.source.startsWith('viewer/vendor/');
    assert.equal(allowed, true, `unexpected staged source ${entry.source}`);
  }

  const actualFiles = await listFiles(GENERATED_ROOT);
  assert.deepEqual(actualFiles, [
    'manifest.json',
    ...manifest.files.map((entry) => entry.path),
  ].sort((left, right) => left.localeCompare(right)));
  for (const relative of actualFiles.filter((file) => /\.(?:mjs|js)$/.test(file))) {
    const source = await readText(path.join(GENERATED_ROOT, ...relative.split('/')));
    assert.doesNotMatch(source, /(?:from\s*|import\s*\()['"]node:/, relative);
    assert.doesNotMatch(source, /\brequire\s*\(\s*['"](?:node:|fs|path|crypto)/, relative);
  }
});

test('local persistence and export contain ledgers/aggregates only, never active Match State', async () => {
  const [baseCards, baseDecks, domain, ticketContent] = await Promise.all([
    readJson('content/gameplay-v1/card-catalog.json'),
    readJson('content/gameplay-v1/decks.json'),
    readJson('content/gameplay-v1/domain-snapshot.json'),
    readJson('content/gameplay-v1/ticket-templates.json'),
  ]);
  const { cards: cardCatalog, decks: deckCatalog } = createDiagnosisV2Catalogs({
    cards: baseCards,
    decks: baseDecks,
    domain,
    ticketContent,
  });
  const context = createClientDataContext({ cardCatalog, deckCatalog });
  const exportBundle = createExportBundle(
    createDefaultState(context),
    context,
    '2026-08-23T12:00:00.000Z',
  );
  assert.deepEqual(Object.keys(exportBundle).sort(), [
    'exported_at',
    'implementation_profile_id',
    'records',
    'schema_version',
  ]);
  assert.deepEqual(Object.keys(exportBundle.records).sort(), ['decks', 'profile', 'settings', 'statistics', 'story', 'tutorials']);
  const serialized = JSON.stringify(exportBundle);
  for (const forbidden of [
    'active_match',
    'match_state',
    'server_only_truth',
    'definition_snapshot',
    'ticket_snapshot_queue',
    'fault_instances',
    'card_instances',
    'random_state',
    'processed_requests',
    'action_records',
  ]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }

  for (const persistencePath of PERSISTENCE_PATHS) {
    const source = await readText(persistencePath);
    assert.doesNotMatch(source, /generated\/play\/src\/(?:engine|builder)\//, persistencePath);
    assert.doesNotMatch(
      source,
      /\b(?:active_match|match_state|server_only_truth|definition_snapshot|ticket_snapshot_queue|fault_instances|card_instances|random_state|processed_requests|action_records)\b/,
      persistencePath,
    );
  }

  const viewerSources = (await listFiles(VIEWER_JS_ROOT))
    .filter((relative) => /\.(?:mjs|js)$/.test(relative));
  const localStorageUsers = [];
  for (const relative of viewerSources) {
    const source = await readText(path.join(VIEWER_JS_ROOT, ...relative.split('/')));
    if (/\blocalStorage\b/.test(source)) localStorageUsers.push(relative);
  }
  assert.deepEqual(localStorageUsers, ['play/storage-service.mjs', 'play/story-client.mjs']);
});
