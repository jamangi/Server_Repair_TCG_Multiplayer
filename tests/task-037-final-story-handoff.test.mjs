import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  STORY_PROGRESS_STORAGE_KEY,
  createStoryClient,
} from '../viewer/js/play/story-client.mjs';
import { createClientDataContext } from '../viewer/js/play/data/client-data.mjs';
import { createStorageService } from '../viewer/js/play/storage-service.mjs';

const repositoryRoot = new URL('../', import.meta.url);
const campaignRoot = new URL(
  'content/story-v1/campaigns/quiet-cascade-characterization-v2/',
  repositoryRoot,
);
const legacyCampaignRoot = new URL(
  'content/story-v1/campaigns/quiet-cascade/',
  repositoryRoot,
);
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

async function json(relative) {
  return JSON.parse(await readFile(fileURLToPath(new URL(relative, repositoryRoot)), 'utf8'));
}

function memoryStorage(initial = null) {
  const values = new Map();
  if (initial !== null) values.set(STORY_PROGRESS_STORAGE_KEY, JSON.stringify(initial));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    storyRecord() { return JSON.parse(values.get(STORY_PROGRESS_STORAGE_KEY)); },
  };
}

function completedResult(context, sequence) {
  return {
    schema_version: 'story-match-result-v1',
    result_id: `result.local.story.task037.${sequence}`,
    match_id: `local.story.task037.${sequence}`,
    match_ref: context.match_ref,
    completion: 'COMPLETED',
    valid: true,
    reason_codes: ['QUEUE_EXHAUSTED'],
    story_service_points_gained: 4,
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
}

function abandonedResult(context, sequence) {
  return {
    ...completedResult(context, sequence),
    completion: 'ABANDONED',
    reason_codes: ['GIVE_UP'],
    story_service_points_gained: 0,
    tickets_closed: 0,
    tickets_given_up: 3,
    documented_outcome: false,
    verified_outcome: false,
    contributions: {
      tests_run: 0,
      isolations_accepted: 0,
      repairs_performed: 0,
      verify_passes: 0,
      documentation_actions: 0,
    },
  };
}

async function localDataHarness() {
  const backing = memoryStorage();
  const [cards, decks] = await Promise.all([
    json('content/gameplay-v1/card-catalog-v3.json'),
    json('content/gameplay-v1/decks-v3.json'),
  ]);
  const localData = createStorageService({
    storage: backing,
    context: createClientDataContext({ cardCatalog: cards, deckCatalog: decks }),
  });
  localData.load();
  return {
    backing,
    localData,
    progressStore: {
      load: () => localData.load().state.records.story,
      save: (record) => localData.saveStoryProgress(record),
    },
  };
}

async function createFiveShiftFixture(client, launch, chapterFourChoice) {
  await client.openPrimary();
  let accepted = 0;
  for (let step = 0; step < 800; step += 1) {
    if (launch.current) {
      accepted += 1;
      assert.ok(accepted <= 5, 'fixture must stop before Shift 6');
      await client.stageMatchResult(completedResult(launch.current.context, accepted), launch.current.context);
      launch.current = null;
      await client.continueFromMatch();
      continue;
    }
    const scene = client.sceneModel();
    if (accepted === 5 && scene.statement?.statementId === 'story.qc01.ch04.converge.02') return;
    if (scene.choices.length) {
      const selected = scene.choices.find((choice) => choice.optionId === chapterFourChoice)
        ?? scene.choices[0];
      await client.choose(selected.optionId);
    } else if (scene.controls.advance) await client.advance();
    else break;
  }
  assert.fail('fixture did not reach the reported five-Shift boundary');
}

async function advanceToStatement(client, statementId, chapterFourChoice) {
  await client.openPrimary();
  for (let step = 0; step < 80; step += 1) {
    const scene = client.sceneModel();
    if (scene.statement?.statementId === statementId) return;
    if (scene.choices.length) {
      const selected = scene.choices.find((choice) => choice.optionId === chapterFourChoice)
        ?? scene.choices[0];
      await client.choose(selected.optionId);
    } else if (scene.controls.advance) await client.advance();
    else break;
  }
  assert.fail(`fixture did not reach ${statementId}`);
}

async function advanceToEnding(client) {
  for (let step = 0; step < 80 && client.homeModel().status !== 'COMPLETE'; step += 1) {
    const scene = client.sceneModel();
    if (scene.choices.length) await client.choose(scene.choices[0].optionId);
    else if (scene.controls.advance) await client.advance();
    else break;
  }
  assert.equal(client.homeModel().status, 'COMPLETE');
}

test('Shift 6 keeps its reviewed Tickets, digests, and response requirements unchanged', async () => {
  const registry = await json('content/story-v1/campaigns/quiet-cascade-characterization-v2/matches.json');
  const shiftSix = registry.matches.find((entry) =>
    entry.match_ref === 'story.match.qc01.shift06.quiet_cascade');
  assert.deepEqual(shiftSix.expected_ticket_definition_ids, [
    'ticket.generated.3ec80b1b0e7221ac725aedf9',
    'ticket.generated.45a70010dd4752f864990575',
    'ticket.generated.5352abd871c2e9076be92a0b',
  ]);
  assert.deepEqual(shiftSix.expected_ticket_snapshot_digests, [
    '1c74ad0725e500ac01d4c356f17551fee11678a88b35ca5b591ff056a2efdff2',
    '863ca5c0e0a72f9440e3352c80b070f4bde1ca166c801e79425821adfa7f4420',
    'b06dc5a7d12c29af78edd71f7a82a611d971844e6e71863e142bc293f4e6af27',
  ]);
  assert.deepEqual(shiftSix.required_response_card_counts, {
    'card.response.repair.storage.replace_nvme': 1,
    'card.response.repair.storage.reseat_cable': 1,
    'card.response.repair.storage.replace_raid_member': 1,
    'card.response.verify.storage.device_detected': 2,
    'card.response.verify.boot.normal_boot': 1,
    'card.response.verify.storage.raid_healthy': 1,
  });
});

test('five completed Shifts advance through Chapter 4 into the authored Shift 6 setup', async () => {
  const storage = memoryStorage();
  const launches = [];
  const launch = { current: null };
  const client = await createStoryClient({
    storageImpl: storage,
    fetchImpl: fileFetch,
    rootUrl: campaignRoot,
    runtimeUrl,
    onStartMatch(value) {
      launches.push(value);
      launch.current = value;
    },
  });

  await createFiveShiftFixture(client, launch, 'verified_outcomes_first');
  const reportedRecord = storage.storyRecord();
  assert.equal(reportedRecord.checkpoint.checkpoint_id, 'checkpoint.qc01.chapter04.entry');
  assert.equal(reportedRecord.checkpoint.match_results.length, 5);

  await client.advance();
  assert.equal(client.sceneModel().statement.statementId, 'story.qc01.ch04.shift06.01');
  assert.equal(storage.storyRecord().checkpoint.checkpoint_id, 'checkpoint.qc01.shift06.scene');

  await client.advance();
  assert.equal(client.sceneModel().statement.statementId, 'story.qc01.ch04.shift06.02');
  await client.advance();
  assert.equal(launches.length, 6);
  assert.equal(launch.current.context.match_ref, 'story.match.qc01.shift06.quiet_cascade');
  assert.equal(launch.current.context.checkpoint_id, 'checkpoint.qc01.shift06.pre_match');
});

test('the five-Shift boundary also advances through the canonical local-data store', async () => {
  const { localData, progressStore } = await localDataHarness();
  const launch = { current: null };
  const client = await createStoryClient({
    storageImpl: null,
    progressStore,
    fetchImpl: fileFetch,
    rootUrl: campaignRoot,
    runtimeUrl,
    onStartMatch(value) { launch.current = value; },
  });

  await createFiveShiftFixture(client, launch, 'bounded_uncertainty_first');
  assert.equal(localData.load().state.records.story.checkpoint.checkpoint_id,
    'checkpoint.qc01.chapter04.entry');
  await client.advance();
  assert.equal(client.sceneModel().statement.statementId, 'story.qc01.ch04.shift06.01');
  assert.equal(localData.load().state.records.story.checkpoint.checkpoint_id,
    'checkpoint.qc01.shift06.scene');
});

test('a reloaded five-Shift save preserves branch sequencing and reaches Shift 6', async () => {
  const { localData, progressStore } = await localDataHarness();
  const initialLaunch = { current: null };
  const initial = await createStoryClient({
    storageImpl: null,
    progressStore,
    fetchImpl: fileFetch,
    rootUrl: campaignRoot,
    runtimeUrl,
    onStartMatch(value) { initialLaunch.current = value; },
  });
  await createFiveShiftFixture(initial, initialLaunch, 'verified_outcomes_first');
  assert.equal(localData.load().state.records.story.checkpoint.checkpoint_id,
    'checkpoint.qc01.chapter04.entry');

  const reloadedLaunch = { current: null };
  const reloaded = await createStoryClient({
    storageImpl: null,
    progressStore,
    fetchImpl: fileFetch,
    rootUrl: campaignRoot,
    runtimeUrl,
    onStartMatch(value) { reloadedLaunch.current = value; },
  });
  await advanceToStatement(reloaded, 'story.qc01.ch04.converge.02', 'verified_outcomes_first');
  await reloaded.advance();
  assert.equal(reloaded.sceneModel().statement.statementId, 'story.qc01.ch04.shift06.01');
});

test('a migrated v1 five-Shift save reaches Shift 6 with either Chapter 4 choice', async () => {
  for (const chapterFourChoice of ['verified_outcomes_first', 'bounded_uncertainty_first']) {
    const { localData, progressStore } = await localDataHarness();
    const legacyLaunch = { current: null };
    const legacy = await createStoryClient({
      storageImpl: null,
      progressStore,
      fetchImpl: fileFetch,
      rootUrl: legacyCampaignRoot,
      runtimeUrl,
      onStartMatch(value) { legacyLaunch.current = value; },
    });
    await createFiveShiftFixture(legacy, legacyLaunch, chapterFourChoice);
    assert.equal(localData.load().state.records.story.content_version, 'quiet-cascade-content-v1');

    const migrated = await createStoryClient({
      storageImpl: null,
      progressStore,
      fetchImpl: fileFetch,
      rootUrl: campaignRoot,
      runtimeUrl,
    });
    assert.equal(localData.load().state.records.story.content_version,
      'quiet-cascade-characterization-v2');
    await advanceToStatement(migrated, 'story.qc01.ch04.converge.02', chapterFourChoice);
    await migrated.advance();
    assert.equal(migrated.sceneModel().statement.statementId, 'story.qc01.ch04.shift06.01');
  }
});

test('export/import and route leave preserve the five-Shift boundary', async () => {
  const source = await localDataHarness();
  const sourceLaunch = { current: null };
  const sourceClient = await createStoryClient({
    storageImpl: null,
    progressStore: source.progressStore,
    fetchImpl: fileFetch,
    rootUrl: campaignRoot,
    runtimeUrl,
    onStartMatch(value) { sourceLaunch.current = value; },
  });
  await createFiveShiftFixture(sourceClient, sourceLaunch, 'verified_outcomes_first');
  const exported = source.localData.exportBackup();

  const destination = await localDataHarness();
  const destinationClient = await createStoryClient({
    storageImpl: null,
    progressStore: destination.progressStore,
    fetchImpl: fileFetch,
    rootUrl: campaignRoot,
    runtimeUrl,
  });
  destination.localData.setStoryImportValidator((progress) =>
    destinationClient.validateProgress(progress));
  const prepared = destination.localData.prepareImport(exported.json);
  destination.localData.replaceFromImport(prepared, { confirmed: true });
  destinationClient.reloadProgress({ notify: false });
  await advanceToStatement(destinationClient, 'story.qc01.ch04.converge.02',
    'verified_outcomes_first');
  destinationClient.reloadProgress({ notify: false });
  await advanceToStatement(destinationClient, 'story.qc01.ch04.converge.02',
    'bounded_uncertainty_first');
  await destinationClient.advance();
  assert.equal(destinationClient.sceneModel().statement.statementId,
    'story.qc01.ch04.shift06.01');
});

test('Shift 6 interruption, completion, exact-once return, and ending remain coherent', async () => {
  const { localData, progressStore } = await localDataHarness();
  const launches = [];
  const launch = { current: null };
  const client = await createStoryClient({
    storageImpl: null,
    progressStore,
    fetchImpl: fileFetch,
    rootUrl: campaignRoot,
    runtimeUrl,
    onStartMatch(value) {
      launches.push(value);
      launch.current = value;
    },
  });
  await createFiveShiftFixture(client, launch, 'verified_outcomes_first');
  await client.advance();
  await client.advance();
  await client.advance();
  assert.equal(localData.load().state.records.story.checkpoint.checkpoint_id,
    'checkpoint.qc01.shift06.pre_match');
  assert.equal(client.homeModel().status, 'INTERRUPTED_MATCH');

  client.reloadProgress({ notify: false });
  launch.current = null;
  assert.equal(client.homeModel().status, 'INTERRUPTED_MATCH');
  assert.deepEqual(await client.openPrimary(), { route: '#/play/game' });
  assert.equal(launch.current.context.match_ref, 'story.match.qc01.shift06.quiet_cascade');
  assert.equal(launches.filter((entry) =>
    entry.context.match_ref === 'story.match.qc01.shift06.quiet_cascade').length, 2);

  const result = completedResult(launch.current.context, 6);
  await client.stageMatchResult(result, launch.current.context);
  await assert.rejects(() => client.stageMatchResult(result, launch.current.context),
    /stale or mismatched/);
  await client.continueFromMatch();
  await assert.rejects(() => client.continueFromMatch(), /No validated Story Match result/);
  const postMatch = localData.load().state.records.story;
  assert.equal(postMatch.checkpoint.checkpoint_id, 'checkpoint.qc01.shift06.post_match');
  assert.equal(postMatch.checkpoint.match_results.length, 6);
  assert.equal(postMatch.checkpoint.story_service_points, 24);
  assert.equal(client.sceneModel().statement.statementId,
    'story.qc01.ch04.shift06.success.01');
  await advanceToEnding(client);
  assert.equal(client.homeModel().shift, 'Campaign complete');
  assert.match(client.homeModel().progress, /Campaign one is complete/i);
  assert.match(client.homeModel().progress, /more Story content is in development/i);
});

test('an abandoned Shift 6 result reaches its authored branch and ending once', async () => {
  const storage = memoryStorage();
  const launch = { current: null };
  const client = await createStoryClient({
    storageImpl: storage,
    fetchImpl: fileFetch,
    rootUrl: campaignRoot,
    runtimeUrl,
    onStartMatch(value) { launch.current = value; },
  });
  await createFiveShiftFixture(client, launch, 'bounded_uncertainty_first');
  await client.advance();
  await client.advance();
  await client.advance();
  const result = abandonedResult(launch.current.context, 6);
  await client.stageMatchResult(result, launch.current.context);
  await client.continueFromMatch();
  assert.equal(client.sceneModel().statement.statementId,
    'story.qc01.ch04.shift06.abandon.01');
  await advanceToEnding(client);
  const record = storage.storyRecord();
  assert.equal(record.checkpoint.match_results.length, 6);
  assert.equal(record.checkpoint.match_results.at(-1).completion, 'ABANDONED');
  assert.ok(record.completed_ending_id);
});
