import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';

import {
  STORY_PROGRESS_STORAGE_KEY,
  createStoryClient,
} from '../viewer/js/play/story-client.mjs';
import { SoloGameSession } from '../viewer/js/play/game-session.mjs';
import {
  createStoryBuilderConfiguration,
  preflightStoryDeck,
  validateStoryMatchRegistry,
} from '../viewer/js/play/story-match-registry.mjs';
import { createClientDataContext } from '../viewer/js/play/data/client-data.mjs';
import { createStorageService } from '../viewer/js/play/storage-service.mjs';

const repositoryRoot = new URL('../', import.meta.url);
const campaignRoot = new URL('content/story-v1/campaigns/quiet-cascade/', repositoryRoot);
const runtimeUrl = new URL('src/story/index.mjs', repositoryRoot);

async function fileFetch(input) {
  try {
    const url = input instanceof URL ? input : new URL(input);
    const value = JSON.parse(await readFile(fileURLToPath(url), 'utf8'));
    return { ok: true, status: 200, async json() { return structuredClone(value); } };
  } catch {
    return { ok: false, status: 404, async json() { throw new Error('not found'); } };
  }
}

async function mismatchedMatchFetch(input) {
  const response = await fileFetch(input);
  if (!response.ok || !new URL(input).pathname.endsWith('/matches.json')) return response;
  const candidate = await response.json();
  candidate.matches[0].return_label = 'story.qc01.shift01.success';
  return { ok: true, status: 200, async json() { return structuredClone(candidate); } };
}

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
  };
}

async function json(relative) {
  return JSON.parse(await readFile(fileURLToPath(new URL(relative, repositoryRoot)), 'utf8'));
}

async function canonicalDeck() {
  const decks = await json('content/gameplay-v1/decks-v3.json');
  const source = decks.decks.find((deck) => deck.id === 'deck.core.multisystem_response_v3');
  return {
    deck_id: source.id,
    display_name: source.display_name,
    card_definition_ids: [...source.card_definition_ids],
    legal: true,
  };
}

async function advanceToFirstMatch(client, launch) {
  await client.openPrimary();
  for (let step = 0; step < 80 && !launch.current; step += 1) {
    const scene = client.sceneModel();
    if (scene.choices.length) await client.choose(scene.choices[0].optionId);
    else if (scene.controls.advance) await client.advance();
    else break;
  }
  assert.ok(launch.current, 'campaign should reach its reviewed first Match boundary');
}

test('Story client persists interruption, validates result, and crosses return exactly once', async () => {
  const storage = memoryStorage();
  const deck = await canonicalDeck();
  const launch = { current: null };
  const client = await createStoryClient({
    storageImpl: storage,
    fetchImpl: fileFetch,
    rootUrl: campaignRoot,
    runtimeUrl,
    activeDeck: () => deck,
    storyArtResolver: null,
    onStartMatch(value) { launch.current = value; },
  });
  await advanceToFirstMatch(client, launch);
  assert.deepEqual(Object.keys(launch.current.context).sort(), [
    'checkpoint_id', 'context_token', 'match_ref', 'return_label', 'schema_version',
  ]);
  assert.equal(launch.current.context.match_ref, 'story.match.qc01.shift01.wrong_device');
  assert.equal(storage.getItem(STORY_PROGRESS_STORAGE_KEY).includes('context_token'), false);

  const interrupted = await createStoryClient({
    storageImpl: storage,
    fetchImpl: fileFetch,
    rootUrl: campaignRoot,
    runtimeUrl,
    activeDeck: () => deck,
    storyArtResolver: null,
  });
  assert.equal(interrupted.homeModel().status, 'INTERRUPTED_MATCH');
  assert.equal(interrupted.homeModel().chapter, 'Learn the Line');
  assert.equal(interrupted.homeModel().shift, 'Shift 1 · Booting the Wrong Device');
  assert.match(interrupted.homeModel().explanation, /does not resume/i);

  const result = {
    schema_version: 'story-match-result-v1',
    result_id: 'result.local.story.match.test01',
    match_id: 'local.story.match.test01',
    match_ref: launch.current.context.match_ref,
    completion: 'COMPLETED',
    valid: true,
    reason_codes: ['QUEUE_EXHAUSTED'],
    story_service_points_gained: 3,
    tickets_closed: 1,
    tickets_given_up: 0,
    documented_outcome: true,
    verified_outcome: true,
    contributions: {
      tests_run: 2,
      isolations_accepted: 1,
      repairs_performed: 1,
      verify_passes: 1,
      documentation_actions: 1,
    },
  };
  await assert.rejects(() => client.stageMatchResult(result, {
    ...launch.current.context,
    return_label: 'story.qc01.shift01.success',
  }), /stale or mismatched/);
  await client.stageMatchResult(result, launch.current.context);
  await assert.rejects(() => client.stageMatchResult(result, launch.current.context), /stale or mismatched/);
  assert.equal(client.homeModel().status, 'RESULT_READY');
  await client.continueFromMatch();
  await assert.rejects(() => client.continueFromMatch(), /No validated Story Match result/);
  const backup = JSON.parse(client.exportProgress().json);
  assert.equal(backup.progress.pending_result, null);
  assert.equal(backup.progress.checkpoint.match_results.length, 1);
  assert.equal(backup.progress.checkpoint.match_results[0].result_id, result.result_id);
});

test('a failed pre-Match checkpoint write cannot expose or launch the Match boundary', async () => {
  const backing = memoryStorage();
  const deck = await canonicalDeck();
  let rejectPreMatch = true;
  let launch = null;
  const storage = {
    getItem: backing.getItem,
    removeItem: backing.removeItem,
    setItem(key, value) {
      const candidate = JSON.parse(value);
      if (rejectPreMatch
          && candidate.checkpoint?.checkpoint_id === 'checkpoint.qc01.shift01.pre_match') {
        throw new Error('simulated durable write failure');
      }
      backing.setItem(key, value);
    },
  };
  const client = await createStoryClient({
    storageImpl: storage,
    fetchImpl: fileFetch,
    rootUrl: campaignRoot,
    runtimeUrl,
    activeDeck: () => deck,
    onStartMatch(value) { launch = value; },
  });
  await client.openPrimary();
  let boundaryError = null;
  for (let step = 0; step < 80 && !boundaryError; step += 1) {
    const scene = client.sceneModel();
    try {
      if (scene.choices.length) await client.choose(scene.choices[0].optionId);
      else if (scene.controls.advance) await client.advance();
      else break;
    } catch (error) {
      boundaryError = error;
    }
  }
  assert.match(boundaryError?.message ?? '', /simulated durable write failure/);
  assert.equal(launch, null);
  assert.notEqual(
    JSON.parse(backing.getItem(STORY_PROGRESS_STORAGE_KEY)).checkpoint.checkpoint_id,
    'checkpoint.qc01.shift01.pre_match',
  );
  assert.equal(client.sceneModel().controls.advance, true);

  rejectPreMatch = false;
  await client.advance();
  assert.equal(launch.context.checkpoint_id, 'checkpoint.qc01.shift01.pre_match');
  assert.equal(
    JSON.parse(backing.getItem(STORY_PROGRESS_STORAGE_KEY)).checkpoint.checkpoint_id,
    'checkpoint.qc01.shift01.pre_match',
  );
});

test('Story Match registry preflight stays separate from canonical Builder provenance', async () => {
  const candidate = await json('content/story-v1/campaigns/quiet-cascade/matches.json');
  const registry = validateStoryMatchRegistry(candidate);
  const definition = registry.matches.get('story.match.qc01.shift01.wrong_device');
  const deck = await canonicalDeck();
  assert.equal(preflightStoryDeck(definition, deck.card_definition_ids).ok, true);
  const incomplete = deck.card_definition_ids.map((id) =>
    id === 'card.response.verify.boot.normal_boot' ? 'card.response.repair.boot.correct_order' : id);
  assert.equal(preflightStoryDeck(definition, incomplete).code, 'DECK_REQUIREMENTS_UNMET');

  const cards = await json('content/gameplay-v1/card-catalog-v3.json');
  const diagnostics = cards.cards.filter((card) => card.play_contract?.contract_type === 'DIAGNOSTIC')
    .map((card) => card.id);
  const configuration = createStoryBuilderConfiguration({
    registry,
    definition,
    cardDefinitionIds: deck.card_definition_ids,
    diagnosticCardIds: diagnostics,
  });
  assert.equal(configuration.id, 'builder.story.quiet_cascade.s01');
  assert.equal(configuration.allow_duplicate_causal_fingerprints, false);
  assert.deepEqual(configuration.allowed_fingerprint_ids, ['fingerprint.boot.incorrect_order']);
});

test('Story client rejects campaign and Match-registry boundary drift before minting a token', async () => {
  const deck = await canonicalDeck();
  await assert.rejects(() => createStoryClient({
    storageImpl: memoryStorage(),
    fetchImpl: mismatchedMatchFetch,
    rootUrl: campaignRoot,
    runtimeUrl,
    activeDeck: () => deck,
  }), /inconsistent across reviewed content/);
});

test('canonical Settings backup validates and previews durable Story progress atomically', async () => {
  const backing = memoryStorage();
  const cards = await json('content/gameplay-v1/card-catalog-v3.json');
  const decks = await json('content/gameplay-v1/decks-v3.json');
  const storage = createStorageService({
    storage: backing,
    context: createClientDataContext({ cardCatalog: cards, deckCatalog: decks }),
    now: () => '2026-08-27T12:00:00.000Z',
  });
  storage.load();
  const deck = await canonicalDeck();
  const client = await createStoryClient({
    storageImpl: null,
    progressStore: {
      load: () => storage.load().state.records.story,
      save: (progress) => storage.saveStoryProgress(progress),
    },
    fetchImpl: fileFetch,
    rootUrl: campaignRoot,
    runtimeUrl,
    activeDeck: () => deck,
  });
  storage.setStoryImportValidator((progress) => client.validateProgress(progress));
  await client.openPrimary();
  const checkpoint = storage.load().state.records.story.checkpoint;
  assert.equal(checkpoint.checkpoint_id, 'checkpoint.qc01.chapter01.entry');

  const exported = storage.exportBackup();
  const bundle = JSON.parse(exported.json);
  assert.equal(bundle.records.story.checkpoint.checkpoint_id, checkpoint.checkpoint_id);
  assert.equal(JSON.stringify(bundle).includes('context_token'), false);
  const prepared = storage.prepareImport(exported.json);
  assert.equal(prepared.preview.story.checkpoint_id, checkpoint.checkpoint_id);
  assert.equal(prepared.preview.story.result_waiting, false);

  const previous = storage.load().state;
  const incompatible = JSON.parse(exported.json);
  incompatible.records.profile.display_name = 'Should never replace the current profile';
  incompatible.records.story = {
    schema_version: 'story-progress-record-v1',
    pack_id: 'story.campaign.unknown.v1',
    content_version: 'story-content-v1',
    checkpoint: null,
    pending_result: null,
    completed_ending_id: null,
  };
  assert.throws(
    () => storage.prepareImport(JSON.stringify(incompatible)),
    (error) => error.code === 'INVALID_IMPORT'
      && error.details?.[0]?.code === 'STORY_CONTENT_MISMATCH',
  );
  assert.deepEqual(storage.load().state, previous);

  const tampered = storage.prepareImport(exported.json);
  tampered.bundle.records.profile.display_name = 'Should also remain unchanged';
  tampered.bundle.records.story = structuredClone(incompatible.records.story);
  assert.throws(
    () => storage.replaceFromImport(tampered, { confirmed: true }),
    (error) => error.code === 'INVALID_IMPORT'
      && error.details?.[0]?.code === 'STORY_CONTENT_MISMATCH',
  );
  assert.deepEqual(storage.load().state, previous);
});

test('corrupt Story progress fails into a resettable recovery state without touching other records', async () => {
  const backing = memoryStorage();
  const deck = await canonicalDeck();
  backing.setItem(STORY_PROGRESS_STORAGE_KEY, JSON.stringify({
    schema_version: 'story-progress-record-v0',
    pack_id: 'story.campaign.quiet_cascade.v1',
  }));
  const client = await createStoryClient({
    storageImpl: backing,
    fetchImpl: fileFetch,
    rootUrl: campaignRoot,
    runtimeUrl,
    activeDeck: () => deck,
  });
  assert.equal(client.homeModel().status, 'RECOVERY_REQUIRED');
  assert.match(client.homeModel().error, /could not be restored/);
  await client.reset();
  assert.equal(client.homeModel().status, 'NEW');

  await client.openPrimary();
  const forgedEnding = JSON.parse(backing.getItem(STORY_PROGRESS_STORAGE_KEY));
  forgedEnding.completed_ending_id = 'ending.qc01.fabricated';
  backing.setItem(STORY_PROGRESS_STORAGE_KEY, JSON.stringify(forgedEnding));
  const reloaded = await createStoryClient({
    storageImpl: backing,
    fetchImpl: fileFetch,
    rootUrl: campaignRoot,
    runtimeUrl,
    activeDeck: () => deck,
  });
  assert.equal(reloaded.homeModel().status, 'RECOVERY_REQUIRED');
  assert.match(reloaded.homeModel().error, /completion marker/);
});

test('stale Worker context and non-Story terminal results never unlock Story continuation', () => {
  const projection = {
    view: {
      public_match: { repair_queue: [], turn: null },
      hand: [],
      diagnostic_bench: [],
    },
    legal_intents: [],
  };
  const terminal = { match_id: 'local.story.match.boundary' };
  const context = {
    schema_version: 'story-match-context-v1',
    context_token: 'story.context.boundary-proof',
    match_ref: 'story.match.qc01.shift01.wrong_device',
    checkpoint_id: 'checkpoint.qc01.shift01.pre_match',
    return_label: 'story.qc01.shift01.return',
  };
  const candidate = {
    schema_version: 'story-match-result-v1',
    match_id: terminal.match_id,
    match_ref: context.match_ref,
  };
  let staleReturn = 'not-called';
  const stale = new SoloGameSession({
    storyContext: context,
    onCompleted(_summary, storyResult) { staleReturn = storyResult; },
  });
  stale.handleMessage({
    type: 'INTENT_RESOLVED',
    projection,
    events: [],
    result: { accepted: true },
    terminal_result: terminal,
    story_context: { ...context, return_label: 'story.qc01.shift01.success' },
    story_match_result: candidate,
  });
  assert.equal(stale.storyContinuationReady, false);
  assert.equal(staleReturn, null);

  let localReturn = 'not-called';
  const local = new SoloGameSession({
    onCompleted(_summary, storyResult) { localReturn = storyResult; },
  });
  local.handleMessage({
    type: 'INTENT_RESOLVED',
    projection,
    events: [],
    result: { accepted: true },
    terminal_result: terminal,
    story_context: context,
    story_match_result: candidate,
  });
  assert.equal(local.storyContinuationReady, false);
  assert.equal(local.storyMatchResult, null);
  assert.equal(localReturn, null);
});
