import { expect, test } from '@playwright/test';

const browserErrors = new WeakMap();

function watchBrowserErrors(page) {
  const errors = [];
  browserErrors.set(page, errors);
  page.on('pageerror', (error) => errors.push(`page: ${error.stack || error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
}

async function installWorkerProbe(page) {
  await page.addInitScript(() => {
    const requests = [];
    const messages = [];
    Object.defineProperties(window, {
      __task038WorkerRequests: { value: requests },
      __task038WorkerMessages: { value: messages },
    });
    const NativeWorker = window.Worker;
    window.Worker = new Proxy(NativeWorker, {
      construct(Target, argumentsList) {
        const worker = Reflect.construct(Target, argumentsList);
        worker.addEventListener('message', (event) => messages.push(structuredClone(event.data)));
        const nativePost = worker.postMessage.bind(worker);
        worker.postMessage = (message, transfer) => {
          requests.push(structuredClone(message));
          return transfer === undefined ? nativePost(message) : nativePost(message, transfer);
        };
        return worker;
      },
    });
  });
}

async function seedCompletedShift(page) {
  await page.goto('/index.html#/play/story');
  await page.evaluate(async () => {
    const [{ createStoryClient }, { loadPlayCatalog }, { createClientDataContext }, { createStorageService }] = await Promise.all([
      import('/js/play/story-client.mjs'),
      import('/js/play/catalog-service.mjs'),
      import('/js/play/data/client-data.mjs'),
      import('/js/play/storage-service.mjs'),
    ]);
    const catalog = await loadPlayCatalog();
    const storage = createStorageService({
      context: createClientDataContext({ cardCatalog: catalog.cards, deckCatalog: catalog.decks }),
    });
    storage.reset({ confirmed: true });
    sessionStorage.clear();
    const launch = { current: null };
    const client = await createStoryClient({
      progressStore: {
        load: () => storage.load().state.records.story,
        save: (record) => storage.saveStoryProgress(record),
      },
      sessionStorageImpl: sessionStorage,
      rootUrl: new URL('/generated/play/content/story-v1/campaigns/quiet-cascade-characterization-v2/', location.origin),
      runtimeUrl: new URL('/generated/play/src/story/index.mjs', location.origin),
      onStartMatch(value) { launch.current = value; },
    });
    await client.openPrimary();
    for (let step = 0; step < 120 && !launch.current; step += 1) {
      const scene = client.sceneModel();
      if (scene.choices.length) await client.choose(scene.choices[0].optionId);
      else if (scene.controls.advance) await client.advance();
      else throw new Error('Fixture stopped before Shift 1.');
    }
    const context = launch.current.context;
    await client.stageMatchResult({
      schema_version: 'story-match-result-v1',
      result_id: 'result.local.story.task038.browser.seed',
      match_id: 'local.story.task038.browser.seed',
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
    }, context);
    await client.continueFromMatch();
  });
  await page.reload();
  await expect(page.locator('[data-story-replay]')).toHaveCount(1);
}

async function localAuthorityRecords(page) {
  return page.evaluate(async () => {
    const [{ loadPlayCatalog }, { createClientDataContext }, { createStorageService }] = await Promise.all([
      import('/js/play/catalog-service.mjs'),
      import('/js/play/data/client-data.mjs'),
      import('/js/play/storage-service.mjs'),
    ]);
    const catalog = await loadPlayCatalog();
    const storage = createStorageService({
      context: createClientDataContext({ cardCatalog: catalog.cards, deckCatalog: catalog.decks }),
    });
    const records = storage.load().state.records;
    return { statistics: records.statistics, story: records.story };
  });
}

async function advanceReviewToMatch(page) {
  for (let step = 0; step < 40; step += 1) {
    if (new URL(page.url()).hash === '#/play/game') return;
    const signature = await page.locator('.story-scene-route').evaluate((root) => {
      const statement = root.querySelector('[data-story-statement-id]')?.dataset.storyStatementId ?? '';
      const choices = [...root.querySelectorAll('[data-story-choice]')]
        .map((choice) => `${choice.dataset.storyChoice}:${choice.disabled}`);
      const advance = root.querySelector('[data-story-advance]');
      return `${statement}|${choices.join(',')}|${advance?.disabled}`;
    });
    const choice = page.locator('[data-story-choice]').first();
    if (await choice.count() && await choice.isVisible() && await choice.isEnabled()) await choice.click();
    else {
      await expect(page.locator('[data-story-advance]')).toBeEnabled();
      await page.locator('[data-story-advance]').click();
    }
    await expect.poll(async () => {
      if (new URL(page.url()).hash === '#/play/game') return true;
      return page.locator('.story-scene-route').evaluate((root, previous) => {
        const statement = root.querySelector('[data-story-statement-id]')?.dataset.storyStatementId ?? '';
        const choices = [...root.querySelectorAll('[data-story-choice]')]
          .map((item) => `${item.dataset.storyChoice}:${item.disabled}`);
        const advance = root.querySelector('[data-story-advance]');
        const current = `${statement}|${choices.join(',')}|${advance?.disabled}`;
        const enabled = choices.some((item) => item.endsWith(':false')) || advance?.disabled === false;
        return current !== previous && enabled;
      }, signature);
    }, { timeout: 30_000 }).toBe(true);
  }
  throw new Error('Story review did not reach its practice Match.');
}

test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page) ?? []).toEqual([]);
});

test('completed episode review runs one ordinary non-scoring Match and returns to canon', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'The full real-Worker practice path runs once.');
  watchBrowserErrors(page);
  await installWorkerProbe(page);
  await seedCompletedShift(page);
  const canonical = await localAuthorityRecords(page);

  await expect(page.locator('[data-story-primary]')).toHaveText('Continue');
  await expect(page.locator('[data-story-replay]')).toHaveText('Review episode');
  await page.locator('[data-story-replay]').evaluate((button) => {
    button.click();
    button.click();
  });
  await expect(page).toHaveURL(/#\/play\/story\/scene$/);
  await expect(page.locator('.play-global-notice')).toContainText('Practice review · Shift 1');
  await expect(page.locator('[data-story-advance]')).toBeFocused();
  await advanceReviewToMatch(page);
  await expect(page.getByRole('heading', { name: 'Night-shift board' })).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.play-subnav__mode')).toHaveText('Story practice');

  const requests = await page.evaluate(() => window.__task038WorkerRequests);
  const starts = requests.filter((request) => request.type === 'START_MATCH');
  expect(starts).toHaveLength(1);
  expect(starts[0].payload.seed).toBe('story.quiet_cascade.s01.v1');
  expect(starts[0].payload).not.toHaveProperty('story_context');
  expect(starts[0].payload.story_review).toEqual({
    schema_version: 'story-review-session-v1',
    match_ref: 'story.match.qc01.shift01.wrong_device',
  });
  const started = await page.evaluate(() => window.__task038WorkerMessages.find((message) =>
    message.type === 'MATCH_STARTED' && message.story_review));
  expect(started.story_review).toEqual(starts[0].payload.story_review);
  expect(started.projection.view.public_match.repair_queue.map((ticket) =>
    ticket.ticket_definition_id)).toEqual(['ticket.generated.ef8a4924e707349bce5c2be7']);
  expect(await localAuthorityRecords(page)).toEqual(canonical);

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Give Up', exact: true }).click();
  await expect(page.locator('.result-route')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.result-route')).toContainText('Story practice result');
  await expect(page.locator('.result-record-status')).toContainText('not added to canonical Story history');
  await expect(page.getByRole('button', { name: 'Return to Chapter history' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'View Profile' })).toHaveCount(0);
  expect(await localAuthorityRecords(page)).toEqual(canonical);

  await page.getByRole('button', { name: 'Return to Chapter history' }).click();
  await expect(page).toHaveURL(/#\/play\/story$/);
  await expect(page.locator('.play-global-notice')).toContainText('Profile statistics are unchanged');
  await expect(page.locator('[data-story-primary]')).toHaveText('Continue');
  await expect(page.locator('[data-story-replay]')).toHaveCount(1);
  expect(await localAuthorityRecords(page)).toEqual(canonical);
});

test('review scene reloads coherently and practice-Match reload returns to history', async ({ page }, testInfo) => {
  test.skip(!['chromium-mobile', 'chromium-tablet'].includes(testInfo.project.name), 'Touch and reflow path only.');
  watchBrowserErrors(page);
  await seedCompletedShift(page);
  const canonical = await localAuthorityRecords(page);

  await page.locator('[data-story-replay]').click();
  await expect(page.locator('.play-global-notice')).toContainText('Practice review');
  await page.reload();
  await expect(page.locator('.play-global-notice')).toContainText('Practice review');
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);

  await advanceReviewToMatch(page);
  await expect(page.getByRole('heading', { name: 'Night-shift board' })).toBeVisible({ timeout: 30_000 });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Story practice was interrupted' })).toBeVisible();
  await page.getByRole('link', { name: 'Return to Chapter history' }).click();
  await expect(page.locator('.play-global-notice')).toContainText('practice was interrupted');
  await expect(page.locator('[data-story-replay]')).toHaveCount(1);
  expect(await localAuthorityRecords(page)).toEqual(canonical);
});
