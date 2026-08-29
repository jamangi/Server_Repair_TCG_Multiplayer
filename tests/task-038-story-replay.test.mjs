import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  STORY_PROGRESS_STORAGE_KEY,
  STORY_REVIEW_SESSION_STORAGE_KEY,
  createStoryClient,
} from '../viewer/js/play/story-client.mjs';

const repositoryRoot = new URL('../', import.meta.url);
const campaignRoot = new URL(
  'content/story-v1/campaigns/quiet-cascade-characterization-v2/',
  repositoryRoot,
);
const legacyCampaignRoot = new URL('content/story-v1/campaigns/quiet-cascade/', repositoryRoot);
const runtimeUrl = new URL('src/story/index.mjs', repositoryRoot);

async function fileFetch(input) {
  try {
    const value = JSON.parse(await readFile(fileURLToPath(input instanceof URL ? input : new URL(input)), 'utf8'));
    return { ok: true, status: 200, async json() { return structuredClone(value); } };
  } catch {
    return { ok: false, status: 404, async json() { throw new Error('not found'); } };
  }
}

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    storyRecord() {
      const value = values.get(STORY_PROGRESS_STORAGE_KEY);
      return value ? JSON.parse(value) : null;
    },
  };
}

function completedResult(context, sequence) {
  return {
    schema_version: 'story-match-result-v1',
    result_id: `result.local.story.task038.${sequence}`,
    match_id: `local.story.task038.${sequence}`,
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

async function createClient({
  storage = memoryStorage(),
  session = memoryStorage(),
  rootUrl = campaignRoot,
  launch = { current: null },
} = {}) {
  const client = await createStoryClient({
    storageImpl: storage,
    sessionStorageImpl: session,
    fetchImpl: fileFetch,
    rootUrl,
    runtimeUrl,
    onStartMatch(value) { launch.current = value; },
  });
  return { client, storage, session, launch };
}

async function completeShifts(client, launch, count, idPrefix = '') {
  await client.openPrimary();
  let completed = 0;
  for (let step = 0; step < 1_200 && completed < count; step += 1) {
    if (launch.current) {
      assert.equal(launch.current.review, undefined);
      completed += 1;
      const result = completedResult(launch.current.context, `${idPrefix}${completed}`);
      await client.stageMatchResult(result, launch.current.context);
      launch.current = null;
      await client.continueFromMatch();
      continue;
    }
    const scene = client.sceneModel();
    if (scene.choices.length) await client.choose(scene.choices[0].optionId);
    else if (scene.controls.advance) await client.advance();
    else break;
  }
  assert.equal(completed, count);
}

async function advanceReviewToMatch(client, launch) {
  launch.current = null;
  for (let step = 0; step < 80 && !launch.current; step += 1) {
    const scene = client.sceneModel();
    if (scene.choices.length) await client.choose(scene.choices[0].optionId);
    else if (scene.controls.advance) await client.advance();
    else break;
  }
  assert.ok(launch.current?.review, 'review cutscene should reach its selected practice Match');
  return launch.current;
}

async function finishCampaign(client) {
  for (let step = 0; step < 100 && client.homeModel().status !== 'COMPLETE'; step += 1) {
    const scene = client.sceneModel();
    if (scene.choices.length) await client.choose(scene.choices[0].optionId);
    else if (scene.controls.advance) await client.advance();
    else break;
  }
  assert.equal(client.homeModel().status, 'COMPLETE');
}

test('all six accepted episodes use authored review bounds without changing the completed campaign', async () => {
  const harness = await createClient();
  await completeShifts(harness.client, harness.launch, 6, 'all.');
  await finishCampaign(harness.client);
  const canonical = structuredClone(harness.storage.storyRecord());
  const history = harness.client.homeModel().history;
  assert.deepEqual(history.map((entry) => entry.id), [
    'story.match.qc01.shift01.wrong_device',
    'story.match.qc01.shift02.power_lot',
    'story.match.qc01.shift03.memory_compare',
    'story.match.qc01.shift04.passes_cold',
    'story.match.qc01.shift05.no_offer',
    'story.match.qc01.shift06.quiet_cascade',
  ]);
  assert.ok(history.every((entry) => entry.replayable));

  for (const entry of history) {
    await harness.client.replay(entry.id);
    assert.equal(harness.client.sceneModel().review?.active, true);
    assert.deepEqual(harness.storage.storyRecord(), canonical);
    const launch = await advanceReviewToMatch(harness.client, harness.launch);
    assert.equal(launch.context, null);
    assert.equal(launch.review.match_ref, entry.id);
    assert.deepEqual(harness.storage.storyRecord(), canonical);
    harness.client.completeReviewMatch(entry.id);
    assert.deepEqual(harness.storage.storyRecord(), canonical);
    assert.equal(harness.client.homeModel().history.length, 6);
  }
});

test('locked episodes, duplicate review, canonical Continue, and reset remain distinct', async () => {
  const harness = await createClient();
  await completeShifts(harness.client, harness.launch, 1, 'partial.');
  const history = harness.client.homeModel().history;
  assert.equal(history.length, 1);
  assert.equal(history[0].id, 'story.match.qc01.shift01.wrong_device');
  await assert.rejects(
    () => harness.client.replay('story.match.qc01.shift02.power_lot'),
    /accepted durable Match result/,
  );

  const canonicalStatement = harness.client.sceneModel().statement.statementId;
  const canonical = structuredClone(harness.storage.storyRecord());
  await harness.client.replay(history[0].id);
  await assert.rejects(() => harness.client.replay(history[0].id), /already active/);
  harness.client.cancelReview();
  assert.equal(harness.client.sceneModel().statement.statementId, canonicalStatement);
  assert.deepEqual(harness.storage.storyRecord(), canonical);
  await harness.client.advance();
  assert.notEqual(harness.client.sceneModel().statement.statementId, canonicalStatement);

  await harness.client.replay(history[0].id);
  await harness.client.reset();
  assert.equal(harness.client.homeModel().status, 'NEW');
  assert.equal(harness.client.homeModel().history.length, 0);
  assert.equal(harness.session.getItem(STORY_REVIEW_SESSION_STORAGE_KEY), null);
});

test('scene reload, Match interruption, export/import, and v1 migration recover canonically', async () => {
  const current = await createClient();
  await completeShifts(current.client, current.launch, 1, 'reload.');
  const canonical = structuredClone(current.storage.storyRecord());
  const backup = current.client.exportProgress();
  const episode = current.client.homeModel().history[0];
  await current.client.replay(episode.id);

  const resumed = await createClient({
    storage: current.storage,
    session: current.session,
  });
  assert.equal(resumed.client.sceneModel().review?.active, true);
  assert.deepEqual(JSON.parse(resumed.client.exportProgress().json).progress, canonical);
  await advanceReviewToMatch(resumed.client, resumed.launch);

  const interrupted = await createClient({
    storage: current.storage,
    session: current.session,
  });
  assert.equal(interrupted.client.homeModel().reviewInterrupted, true);
  assert.match(interrupted.client.homeModel().reviewNotice, /canonical Story progress is unchanged/i);
  assert.deepEqual(current.storage.storyRecord(), canonical);
  assert.equal(current.session.getItem(STORY_REVIEW_SESSION_STORAGE_KEY), null);

  const prepared = interrupted.client.prepareImport(backup.json);
  interrupted.client.replaceFromImport(prepared, { confirmed: true });
  assert.deepEqual(current.storage.storyRecord(), canonical);
  assert.equal(interrupted.client.homeModel().history.length, 1);

  const legacy = await createClient({ rootUrl: legacyCampaignRoot });
  await completeShifts(legacy.client, legacy.launch, 1, 'migration.');
  assert.equal(legacy.storage.storyRecord().content_version, 'quiet-cascade-content-v1');
  const migrated = await createClient({ storage: legacy.storage, session: legacy.session });
  assert.equal(legacy.storage.storyRecord().content_version, 'quiet-cascade-characterization-v2');
  assert.equal(migrated.client.homeModel().history[0].replayable, true);
  await migrated.client.replay(migrated.client.homeModel().history[0].id);
  assert.equal(migrated.client.sceneModel().review?.active, true);
});
