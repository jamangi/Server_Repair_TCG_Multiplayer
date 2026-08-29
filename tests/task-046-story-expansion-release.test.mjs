import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  STORY_PROGRESS_STORAGE_KEY,
  createStoryClient,
} from '../viewer/js/play/story-client.mjs';
import {
  STORY_EXPANSION_CARD_CATALOG_VERSION,
  createClientDataContext,
  createDefaultState,
  createExportBundle,
  migrateExportBundle,
  migrateLocalState,
  parseImportBundle,
} from '../viewer/js/play/data/client-data.mjs';
import { createStorageService } from '../viewer/js/play/storage-service.mjs';

const repositoryRoot = new URL('../', import.meta.url);
const releaseRoot = new URL(
  'content/story-v1/campaigns/quiet-cascade-expansion-v3/',
  repositoryRoot,
);
const characterizationRoot = new URL(
  'content/story-v1/campaigns/quiet-cascade-characterization-v2/',
  repositoryRoot,
);
const legacyRoot = new URL('content/story-v1/campaigns/quiet-cascade/', repositoryRoot);
const runtimeUrl = new URL('src/story/index.mjs', repositoryRoot);

async function readJson(relative) {
  return JSON.parse(await readFile(fileURLToPath(new URL(relative, repositoryRoot)), 'utf8'));
}

async function fileFetch(input) {
  try {
    const url = input instanceof URL ? input : new URL(input);
    const value = JSON.parse(await readFile(fileURLToPath(url), 'utf8'));
    return { ok: true, status: 200, async json() { return structuredClone(value); } };
  } catch {
    return { ok: false, status: 404, async json() { throw new Error('not found'); } };
  }
}

function memoryStorage(initial = undefined) {
  const values = new Map();
  if (initial !== undefined) {
    values.set(STORY_PROGRESS_STORAGE_KEY, JSON.stringify(initial));
  }
  let failures = 0;
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) {
      if (failures > 0) {
        failures -= 1;
        throw new Error('injected storage failure');
      }
      values.set(key, String(value));
    },
    removeItem(key) { values.delete(key); },
    failNextWrite(count = 1) { failures = count; },
    storyRecord() {
      const value = values.get(STORY_PROGRESS_STORAGE_KEY);
      return value ? JSON.parse(value) : null;
    },
    raw(key) { return values.get(key) ?? null; },
  };
}

function normalizedResult(context, sequence, {
  completion = 'COMPLETED',
  storyPoints = completion === 'COMPLETED' ? 2 : 0,
} = {}) {
  const completed = completion === 'COMPLETED';
  return {
    schema_version: 'story-match-result-v1',
    result_id: `result.local.story.task046.${sequence}`,
    match_id: `local.story.task046.${sequence}`,
    match_ref: context.match_ref,
    completion,
    valid: true,
    reason_codes: completed ? ['QUEUE_EXHAUSTED'] : ['GIVE_UP'],
    story_service_points_gained: storyPoints,
    tickets_closed: completed ? 1 : 0,
    tickets_given_up: completed ? 0 : 1,
    documented_outcome: completed,
    verified_outcome: completed,
    contributions: {
      tests_run: completed ? 2 : 0,
      isolations_accepted: completed ? 1 : 0,
      repairs_performed: completed ? 1 : 0,
      verify_passes: completed ? 1 : 0,
      documentation_actions: completed ? 1 : 0,
    },
  };
}

async function createHarness({
  rootUrl = releaseRoot,
  storage = memoryStorage(),
  session = memoryStorage(),
} = {}) {
  const launch = { current: null, all: [] };
  const client = await createStoryClient({
    storageImpl: storage,
    sessionStorageImpl: session,
    fetchImpl: fileFetch,
    rootUrl,
    runtimeUrl,
    onStartMatch(value) {
      launch.current = value;
      launch.all.push(structuredClone(value));
    },
  });
  return { client, storage, session, launch };
}

function optionFor(scene, choices = {}) {
  const first = scene.choices[0];
  if (!first) return null;
  const requested = choices[first.choiceId];
  return requested && scene.choices.some((choice) => choice.optionId === requested)
    ? requested
    : first.optionId;
}

async function advanceUntilBoundary(harness, {
  choices = {},
  maximumSteps = 2_000,
} = {}) {
  for (let step = 0; step < maximumSteps; step += 1) {
    if (harness.launch.current) return 'MATCH';
    const scene = harness.client.sceneModel();
    if (!scene.review && harness.client.homeModel().status === 'COMPLETE') return 'COMPLETE';
    const selected = optionFor(scene, choices);
    if (selected) await harness.client.choose(selected);
    else if (scene.controls.advance) await harness.client.advance();
    else throw new Error(`Story stopped outside an authored boundary at ${scene.statement?.statementId ?? 'no statement'}.`);
  }
  throw new Error('Story traversal exceeded its bounded step count.');
}

async function completeCampaign(harness, {
  choices = {},
  resultForIndex = (context, index) => normalizedResult(context, index),
  expectedMatches,
  assertExactlyOnce = false,
} = {}) {
  await harness.client.openPrimary();
  const accepted = [];
  for (;;) {
    const boundary = await advanceUntilBoundary(harness, { choices });
    if (boundary === 'COMPLETE') break;
    const launched = harness.launch.current;
    const sequence = accepted.length + 1;
    const result = resultForIndex(launched.context, sequence);
    await harness.client.stageMatchResult(result, launched.context);
    if (assertExactlyOnce) {
      await assert.rejects(
        () => harness.client.stageMatchResult(result, launched.context),
        /stale or mismatched|already waiting|already accepted/i,
      );
    }
    harness.launch.current = null;
    await harness.client.continueFromMatch();
    if (assertExactlyOnce) {
      await assert.rejects(() => harness.client.continueFromMatch(), /No validated Story Match result/);
    }
    accepted.push(result);
    if (expectedMatches !== undefined && accepted.length > expectedMatches) {
      throw new Error(`Story launched more than ${expectedMatches} Matches.`);
    }
  }
  if (expectedMatches !== undefined) assert.equal(accepted.length, expectedMatches);
  return accepted;
}

async function oldBoundary(rootUrl, phase) {
  const harness = await createHarness({ rootUrl });
  await harness.client.openPrimary();
  if (phase !== 'SCENE') {
    assert.equal(await advanceUntilBoundary(harness), 'MATCH');
    if (phase !== 'PRE_MATCH') {
      const launched = harness.launch.current;
      await harness.client.stageMatchResult(
        normalizedResult(launched.context, `${phase.toLowerCase()}.source`),
        launched.context,
      );
      harness.launch.current = null;
      if (phase === 'POST_MATCH') await harness.client.continueFromMatch();
    }
  }
  return harness;
}

function assertMigratedCheckpoint(source, migrated) {
  assert.equal(migrated.pack_id, source.pack_id);
  assert.equal(migrated.content_version, 'quiet-cascade-expansion-v3');
  assert.equal(migrated.schema_version, source.schema_version);
  assert.equal(migrated.pending_result === null, source.pending_result === null);
  if (source.pending_result !== null) assert.deepEqual(migrated.pending_result, source.pending_result);
  if (source.checkpoint === null) return;
  assert.equal(migrated.checkpoint.checkpoint_id, source.checkpoint.checkpoint_id);
  for (const field of [
    'choices', 'story_service_points', 'branch_history', 'match_results',
    'pending_match', 'returned_match',
  ]) assert.deepEqual(migrated.checkpoint[field], source.checkpoint[field], field);
  for (const [id, value] of Object.entries(source.checkpoint.variables)) {
    assert.deepEqual(migrated.checkpoint.variables[id], value, id);
  }
  assert.equal(migrated.checkpoint.variables['story.qc02.initial_evidence_frame'], 'UNSET');
  assert.equal(migrated.checkpoint.variables['story.qc02.change_evidence_frame'], 'UNSET');
  assert.notEqual(migrated.checkpoint.digest, source.checkpoint.digest);
}

test('fresh and reset profiles enter the combined campaign deterministically', async () => {
  const first = await createHarness();
  const second = await createHarness();
  assert.equal(first.client.pack.content_version, 'quiet-cascade-expansion-v3');
  assert.equal(first.client.homeModel().status, 'NEW');
  assert.equal(first.client.homeModel().history.length, 0);

  await first.client.openPrimary();
  await second.client.openPrimary();
  assert.deepEqual(first.client.sceneModel(), second.client.sceneModel());
  assert.equal(first.client.sceneModel().statement.statementId, 'story.qc01.ch01.open.01');
  assert.equal(first.storage.storyRecord().checkpoint.digest, second.storage.storyRecord().checkpoint.digest);

  const opening = structuredClone(first.client.sceneModel());
  await first.client.advance();
  await first.client.reset();
  assert.equal(first.client.homeModel().status, 'NEW');
  assert.equal(first.client.homeModel().history.length, 0);
  await first.client.openPrimary();
  assert.deepEqual(first.client.sceneModel(), opening);
});

test('v1-to-v2-to-v3 and v2-to-v3 migration preserve scene, pre-Match, pending-result, and post-Match authority', async () => {
  for (const [label, rootUrl] of [['v1', legacyRoot], ['v2', characterizationRoot]]) {
    for (const phase of ['SCENE', 'PRE_MATCH', 'PENDING_RESULT', 'POST_MATCH']) {
      const sourceHarness = await oldBoundary(rootUrl, phase);
      const source = structuredClone(sourceHarness.storage.storyRecord());
      const migratedHarness = await createHarness({
        storage: sourceHarness.storage,
        session: sourceHarness.session,
      });
      assert.equal(migratedHarness.client.error, null, `${label}/${phase}`);
      const migrated = sourceHarness.storage.storyRecord();
      assertMigratedCheckpoint(source, migrated);
      assert.equal(migrated.completed_ending_id, null);
      const expectedStatus = phase === 'PRE_MATCH' ? 'INTERRUPTED_MATCH'
        : phase === 'PENDING_RESULT' ? 'RESULT_READY' : 'READY';
      assert.equal(migratedHarness.client.homeModel().status, expectedStatus, `${label}/${phase}`);
    }
  }
});

test('all six campaign-one ending checkpoints migrate without replaying or fabricating a result', async () => {
  const endings = [
    ['release', 4, 'verified_outcomes_first', 'checkpoint.qc01.ending.release.outcomes'],
    ['release', 4, 'bounded_uncertainty_first', 'checkpoint.qc01.ending.release.uncertainty'],
    ['bounded', 2, 'verified_outcomes_first', 'checkpoint.qc01.ending.bounded.outcomes'],
    ['bounded', 2, 'bounded_uncertainty_first', 'checkpoint.qc01.ending.bounded.uncertainty'],
    ['hold', 0, 'verified_outcomes_first', 'checkpoint.qc01.ending.hold.outcomes'],
    ['hold', 0, 'bounded_uncertainty_first', 'checkpoint.qc01.ending.hold.uncertainty'],
  ];

  for (const [band, points, clientFrame, checkpointId] of endings) {
    const old = await createHarness({ rootUrl: characterizationRoot });
    await completeCampaign(old, {
      choices: { 'choice.qc01.client_frame': clientFrame },
      resultForIndex: (context, index) => normalizedResult(context, `${band}.${clientFrame}.${index}`, {
        storyPoints: points,
      }),
      expectedMatches: 6,
    });
    const source = structuredClone(old.storage.storyRecord());
    assert.equal(source.checkpoint.checkpoint_id, checkpointId);
    assert.equal(source.checkpoint.match_results.length, 6);
    assert.ok(source.completed_ending_id?.startsWith('ending.qc01.'));

    const migrated = await createHarness({ storage: old.storage, session: old.session });
    const record = old.storage.storyRecord();
    assertMigratedCheckpoint(source, record);
    assert.equal(record.completed_ending_id, null);
    assert.equal(migrated.client.homeModel().history.length, 6);
    assert.equal(migrated.client.homeModel().status, 'READY');
    assert.equal(migrated.client.homeModel().progress,
      'Campaign one is preserved. Continue into the six-episode expansion without replaying completed work.');

    await migrated.client.openPrimary();
    assert.equal(migrated.launch.all.length, 0, `${band}/${clientFrame}`);
    assert.equal(migrated.client.sceneModel().statement.statementId, 'story.qc02.s07.entry.01');
    assert.equal(old.storage.storyRecord().checkpoint.match_results.length, 6);
  }
});

test('twelve canonical Match boundaries launch and accept exactly once before the honest current-content end', async () => {
  const registry = await readJson(
    'content/story-v1/campaigns/quiet-cascade-expansion-v3/matches.json',
  );
  const expectedRefs = registry.matches.map((entry) => entry.match_ref);
  const harness = await createHarness();
  const accepted = await completeCampaign(harness, {
    choices: {
      'choice.qc01.client_frame': 'bounded_uncertainty_first',
      'choice.qc02.initial_evidence_frame': 'controlled_comparison_first',
      'choice.qc02.change_evidence_frame': 'change_history_first',
    },
    resultForIndex: (context, index) => normalizedResult(context, `exact.${index}`, {
      storyPoints: index <= 6 ? 4 : 2,
    }),
    expectedMatches: 12,
    assertExactlyOnce: true,
  });

  assert.deepEqual(harness.launch.all.map((entry) => entry.context.match_ref), expectedRefs);
  assert.equal(new Set(harness.launch.all.map((entry) => entry.context.context_token)).size, 12);
  assert.deepEqual(accepted.map((entry) => entry.match_ref), expectedRefs);
  const record = harness.storage.storyRecord();
  assert.deepEqual(record.checkpoint.match_results.map((entry) => entry.match_ref), expectedRefs);
  assert.equal(record.checkpoint.match_results.length, 12);
  assert.equal(record.completed_ending_id, 'ending.qc02.current_content');
  assert.equal(harness.client.homeModel().status, 'COMPLETE');
  assert.equal(harness.client.homeModel().shift, 'Current content complete');
  assert.equal(harness.client.homeModel().progress,
    'All twelve currently released Story episodes are complete. Your record is preserved for future content.');
  assert.equal(harness.client.homeModel().canOpen, false);
  assert.equal(harness.client.homeModel().history.length, 12);
});

test('replay for every completed episode is isolated from canonical choices, points, results, and ending', async () => {
  const harness = await createHarness();
  await completeCampaign(harness, { expectedMatches: 12 });
  const canonical = structuredClone(harness.storage.storyRecord());
  const history = harness.client.homeModel().history;
  assert.equal(history.length, 12);
  assert.ok(history.every((entry) => entry.replayable));

  for (const entry of history) {
    harness.launch.current = null;
    await harness.client.replay(entry.id);
    assert.equal(harness.client.sceneModel().review?.active, true);
    assert.deepEqual(harness.storage.storyRecord(), canonical);
    assert.equal(await advanceUntilBoundary(harness), 'MATCH');
    assert.equal(harness.launch.current.context, null);
    assert.equal(harness.launch.current.review.match_ref, entry.id);
    assert.deepEqual(harness.storage.storyRecord(), canonical);
    harness.client.completeReviewMatch(entry.id);
    assert.deepEqual(harness.storage.storyRecord(), canonical);
  }

  assert.equal(harness.client.homeModel().status, 'COMPLETE');
  assert.equal(harness.client.homeModel().history.length, 12);
});

test('scene, pre-Match, result-ready, and post-Match interruption restart only at authored boundaries', async () => {
  const campaignOne = await createHarness({ rootUrl: characterizationRoot });
  await completeCampaign(campaignOne, {
    choices: { 'choice.qc01.client_frame': 'verified_outcomes_first' },
    resultForIndex: (context, index) => normalizedResult(context, `boundary.base.${index}`, {
      storyPoints: 4,
    }),
    expectedMatches: 6,
  });
  const initial = await createHarness({ storage: campaignOne.storage, session: campaignOne.session });
  await initial.client.openPrimary();
  assert.equal(initial.client.sceneModel().statement.statementId, 'story.qc02.s07.entry.01');
  const sceneCheckpoint = structuredClone(initial.storage.storyRecord().checkpoint);
  assert.equal(sceneCheckpoint.checkpoint_id, 'checkpoint.qc02.shift07.entry');

  const sceneReload = await createHarness({ storage: initial.storage, session: initial.session });
  assert.equal(sceneReload.client.homeModel().status, 'READY');
  await sceneReload.client.openPrimary();
  assert.equal(sceneReload.storage.storyRecord().checkpoint.digest, sceneCheckpoint.digest);
  assert.equal(await advanceUntilBoundary(sceneReload), 'MATCH');
  const firstLaunch = structuredClone(sceneReload.launch.current);
  assert.equal(firstLaunch.context.match_ref, 'story.match.qc02.shift07.socket_contacts');
  const preMatch = structuredClone(sceneReload.storage.storyRecord());

  const preReload = await createHarness({ storage: sceneReload.storage, session: sceneReload.session });
  assert.equal(preReload.client.homeModel().status, 'INTERRUPTED_MATCH');
  assert.equal(preReload.client.homeModel().primaryLabel, 'Restart Story Match');
  await preReload.client.openPrimary();
  assert.equal(preReload.launch.current.context.match_ref, firstLaunch.context.match_ref);
  assert.notEqual(preReload.launch.current.context.context_token, firstLaunch.context.context_token);
  assert.deepEqual(preReload.storage.storyRecord(), preMatch);

  const relaunched = preReload.launch.current;
  await preReload.client.stageMatchResult(
    normalizedResult(relaunched.context, 'interrupted.first'),
    relaunched.context,
  );
  preReload.launch.current = null;
  const resultReady = structuredClone(preReload.storage.storyRecord());
  assert.ok(resultReady.pending_result);

  const resultReload = await createHarness({ storage: preReload.storage, session: preReload.session });
  assert.equal(resultReload.client.homeModel().status, 'RESULT_READY');
  await resultReload.client.openPrimary();
  assert.equal(resultReload.launch.all.length, 0);
  assert.equal(resultReload.storage.storyRecord().pending_result, null);
  assert.equal(resultReload.storage.storyRecord().checkpoint.match_results.length, 7);
  assert.equal(resultReload.storage.storyRecord().checkpoint.checkpoint_id,
    'checkpoint.qc02.shift07.post_match');

  const postReload = await createHarness({ storage: resultReload.storage, session: resultReload.session });
  assert.equal(postReload.client.homeModel().status, 'READY');
  assert.equal(postReload.client.homeModel().history.length, 7);
  await postReload.client.openPrimary();
  assert.equal(postReload.storage.storyRecord().checkpoint.match_results.length, 7);
});

test('Story export/import migrates, previews conflicts, requires confirmation, and rolls back atomically', async () => {
  const source = await oldBoundary(characterizationRoot, 'POST_MATCH');
  const oldRecord = structuredClone(source.storage.storyRecord());
  const target = await createHarness();
  await target.client.openPrimary();
  const before = structuredClone(target.storage.storyRecord());
  const backup = {
    backup_version: 'story-progress-backup-v1',
    exported_at: '2046-08-29T00:00:00.000Z',
    progress: oldRecord,
  };
  const prepared = target.client.prepareImport(backup);
  assert.equal(prepared.value.content_version, 'quiet-cascade-expansion-v3');
  assert.equal(prepared.preview.completed_matches, 1);
  assert.equal(prepared.preview.checkpoint, 'checkpoint.qc01.shift01.post_match');
  await assert.rejects(
    async () => target.client.replaceFromImport(prepared),
    /requires confirmation/,
  );
  assert.deepEqual(target.storage.storyRecord(), before);

  target.storage.failNextWrite();
  assert.throws(
    () => target.client.replaceFromImport(prepared, { confirmed: true }),
    /injected storage failure/,
  );
  assert.deepEqual(target.storage.storyRecord(), before);
  assert.deepEqual(JSON.parse(target.client.exportProgress().json).progress, before);

  target.client.replaceFromImport(prepared, { confirmed: true });
  assert.equal(target.storage.storyRecord().content_version, 'quiet-cascade-expansion-v3');
  assert.equal(target.client.homeModel().history.length, 1);
});

test('corrupt, unknown-version, and cross-pack Story records fail closed without overwriting storage', async () => {
  const source = await oldBoundary(characterizationRoot, 'POST_MATCH');
  const valid = structuredClone(source.storage.storyRecord());
  const candidates = [
    ['corrupt digest', (() => {
      const value = structuredClone(valid);
      value.checkpoint.story_service_points += 1;
      return value;
    })()],
    ['unknown version', (() => {
      const value = structuredClone(valid);
      value.content_version = 'quiet-cascade-future-v99';
      value.checkpoint.content_version = value.content_version;
      return value;
    })()],
    ['cross pack', (() => {
      const value = structuredClone(valid);
      value.pack_id = 'story.campaign.foreign.v1';
      value.checkpoint.pack_id = value.pack_id;
      return value;
    })()],
  ];

  for (const [label, candidate] of candidates) {
    const storage = memoryStorage(candidate);
    const rawBefore = storage.raw(STORY_PROGRESS_STORAGE_KEY);
    const harness = await createHarness({ storage });
    assert.match(harness.client.error, /could not be restored/i, label);
    assert.equal(harness.client.homeModel().status, 'RECOVERY_REQUIRED', label);
    assert.equal(storage.raw(STORY_PROGRESS_STORAGE_KEY), rawBefore, label);
    assert.equal(harness.client.homeModel().history.length, 0, label);
  }
});

test('v5 local data keeps fresh defaults, v4 custom decks, current exports, and atomic failure safety', async () => {
  const [v4Cards, v4Decks, v5Cards, v5Decks] = await Promise.all([
    readJson('content/gameplay-v1/card-catalog-v3.json'),
    readJson('content/gameplay-v1/decks-v3.json'),
    readJson('content/gameplay-v1/card-catalog-v4.json'),
    readJson('content/gameplay-v1/decks-v4.json'),
  ]);
  const v4Context = createClientDataContext({ cardCatalog: v4Cards, deckCatalog: v4Decks });
  const v5Context = createClientDataContext({ cardCatalog: v5Cards, deckCatalog: v5Decks });
  const fresh = createDefaultState(v5Context);
  assert.equal(fresh.records.decks.card_catalog_version, STORY_EXPANSION_CARD_CATALOG_VERSION);
  assert.equal(fresh.records.decks.decks.length, 1);
  assert.equal(fresh.records.decks.active_deck_id, 'deck.local.storage_response_v2');

  const v4Custom = createDefaultState(v4Context);
  const deck = v4Custom.records.decks.decks[0];
  deck.deck_id = 'deck.local.task046.custom';
  deck.display_name = 'Preserved release deck';
  v4Custom.records.decks.active_deck_id = deck.deck_id;
  v4Custom.records.profile.display_name = 'Returning Release Technician';
  const expected = structuredClone(v4Custom);
  expected.records.decks.card_catalog_version = STORY_EXPANSION_CARD_CATALOG_VERSION;
  assert.deepEqual(migrateLocalState(v4Custom, v5Context), expected);

  const v4Export = createExportBundle(v4Custom, v4Context, '2046-08-29T00:00:00.000Z');
  const migratedExport = migrateExportBundle(v4Export, v5Context);
  assert.equal(migratedExport.records.decks.card_catalog_version,
    STORY_EXPANSION_CARD_CATALOG_VERSION);
  assert.deepEqual(
    { ...migratedExport.records.decks, card_catalog_version: v4Export.records.decks.card_catalog_version },
    v4Export.records.decks,
  );
  assert.deepEqual(parseImportBundle(JSON.stringify(v4Export), v5Context), migratedExport);

  const storage = memoryStorage();
  const service = createStorageService({ storage, context: v5Context });
  service.load();
  service.saveProfile({
    ...service.load().state.records.profile,
    display_name: 'Atomic Current Technician',
  });
  const current = structuredClone(service.load().state);
  const prepared = service.prepareImport(JSON.stringify(v4Export));
  storage.failNextWrite();
  assert.throws(
    () => service.replaceFromImport(prepared, { confirmed: true }),
    (error) => error.code === 'STORAGE_UNAVAILABLE',
  );
  assert.deepEqual(service.load().state, current);
});
