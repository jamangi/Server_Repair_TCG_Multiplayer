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
    Object.defineProperty(window, '__task037WorkerRequests', { value: requests });
    const NativeWorker = window.Worker;
    window.Worker = new Proxy(NativeWorker, {
      construct(Target, argumentsList) {
        const worker = Reflect.construct(Target, argumentsList);
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

async function seedFiveShiftCheckpoint(page, chapterFourChoice) {
  await page.goto('/index.html#/play/story');
  await page.evaluate(async (selectedChapterFourChoice) => {
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
    const launch = { current: null };
    const client = await createStoryClient({
      progressStore: {
        load: () => storage.load().state.records.story,
        save: (record) => storage.saveStoryProgress(record),
      },
      rootUrl: new URL('/generated/play/content/story-v1/campaigns/quiet-cascade-characterization-v2/', location.origin),
      runtimeUrl: new URL('/generated/play/src/story/index.mjs', location.origin),
      onStartMatch(value) { launch.current = value; },
    });
    await client.openPrimary();
    let accepted = 0;
    for (let step = 0; step < 800; step += 1) {
      if (launch.current) {
        accepted += 1;
        if (accepted > 5) throw new Error('Fixture crossed into Shift 6.');
        const context = launch.current.context;
        await client.stageMatchResult({
          schema_version: 'story-match-result-v1',
          result_id: `result.local.story.task037.browser.${accepted}`,
          match_id: `local.story.task037.browser.${accepted}`,
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
        launch.current = null;
        await client.continueFromMatch();
        if (accepted === 5) break;
        continue;
      }
      const scene = client.sceneModel();
      if (scene.choices.length) {
        const selected = scene.choices.find((choice) => choice.optionId === selectedChapterFourChoice)
          ?? scene.choices[0];
        await client.choose(selected.optionId);
      } else if (scene.controls.advance) await client.advance();
      else throw new Error('Fixture stopped before five accepted Matches.');
    }
    const record = storage.load().state.records.story;
    if (record.checkpoint?.match_results?.length !== 5) throw new Error('Five-Shift fixture was not stored.');
  }, chapterFourChoice);
  await page.reload();
}

async function reachFinalClientLine(page, chapterFourChoice) {
  await expect(page.locator('[data-story-primary]')).toHaveText('Continue');
  await page.locator('[data-story-primary]').click();
  for (let step = 0; step < 24; step += 1) {
    const current = await page.locator('.story-scene-route').evaluate((root) => {
      const statementId = root.querySelector('[data-story-statement-id]')?.dataset.storyStatementId ?? '';
      const choices = [...root.querySelectorAll('[data-story-choice]')]
        .map((choice) => `${choice.dataset.storyChoice}:${choice.disabled}`);
      const advance = root.querySelector('[data-story-advance]');
      return {
        statementId,
        signature: `${statementId}|${choices.join(',')}|${advance?.disabled}`,
      };
    });
    if (current.statementId === 'story.qc01.ch04.converge.02') return;
    const choice = page.locator(`[data-story-choice="${chapterFourChoice}"]`);
    if (await choice.count()) await choice.click();
    else await page.locator('[data-story-advance]').click();
    await expect.poll(async () => {
      return page.locator('.story-scene-route').evaluate((root, beforeSignature) => {
        const statementId = root.querySelector('[data-story-statement-id]')?.dataset.storyStatementId ?? '';
        const choices = [...root.querySelectorAll('[data-story-choice]')]
          .map((item) => `${item.dataset.storyChoice}:${item.disabled}`);
        const advance = root.querySelector('[data-story-advance]');
        const signature = `${statementId}|${choices.join(',')}|${advance?.disabled}`;
        const enabled = choices.some((item) => item.endsWith(':false')) || advance?.disabled === false;
        return signature !== beforeSignature && enabled;
      }, current.signature);
    }).toBe(true);
  }
  throw new Error('Chapter 4 did not reach Ev Shaw’s final client-review line.');
}

async function advanceThroughShiftSixSetup(page, input = 'pointer') {
  const advance = page.locator('[data-story-advance]');
  const submit = async () => {
    await expect(advance).toBeFocused();
    if (input === 'keyboard') await page.keyboard.press('Enter');
    else await advance.click();
  };
  await submit();
  await expect(page.locator('[data-story-statement-id]')).toHaveAttribute(
    'data-story-statement-id',
    'story.qc01.ch04.shift06.01',
  );
  await submit();
  await expect(page.locator('[data-story-statement-id]')).toHaveAttribute(
    'data-story-statement-id',
    'story.qc01.ch04.shift06.02',
  );
}

async function makeActiveDeckMissShiftSixRequirement(page) {
  await page.evaluate(async () => {
    const [{ loadPlayCatalog }, { createClientDataContext }, { createStorageService }] = await Promise.all([
      import('/js/play/catalog-service.mjs'),
      import('/js/play/data/client-data.mjs'),
      import('/js/play/storage-service.mjs'),
    ]);
    const catalog = await loadPlayCatalog();
    const service = createStorageService({
      context: createClientDataContext({ cardCatalog: catalog.cards, deckCatalog: catalog.decks }),
    });
    const collection = service.load().state.records.decks;
    const source = collection.decks.find((deck) => deck.deck_id === collection.active_deck_id);
    const draft = service.createDeckDraft({ displayName: 'Shift 6 preflight gap fixture' });
    draft.card_definition_ids = source.card_definition_ids.map((id) =>
      id === 'card.response.repair.storage.replace_nvme'
        ? 'card.response.repair.boot.correct_order'
        : id);
    service.saveDeck(draft);
    service.makeActive(draft.deck_id);
  });
  await page.reload();
}

test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page) ?? []).toEqual([]);
});

test('five-Shift desktop save reaches the real Shift 6 Match exactly once', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'The reported desktop boundary runs once.');
  watchBrowserErrors(page);
  await installWorkerProbe(page);
  await seedFiveShiftCheckpoint(page, 'verified_outcomes_first');
  await reachFinalClientLine(page, 'verified_outcomes_first');

  await advanceThroughShiftSixSetup(page);
  await page.locator('[data-story-advance]').evaluate((button) => {
    button.click();
    button.click();
  });
  await expect(page).toHaveURL(/#\/play\/game$/);
  await expect(page.getByRole('heading', { name: 'Night-shift board' })).toBeVisible({ timeout: 30_000 });
  const shiftSixStarts = await page.evaluate(() => window.__task037WorkerRequests.filter((request) =>
    request.type === 'START_MATCH'
      && request.payload.story_context?.match_ref === 'story.match.qc01.shift06.quiet_cascade'));
  expect(shiftSixStarts).toHaveLength(1);
  expect(shiftSixStarts[0].payload.story_context.checkpoint_id)
    .toBe('checkpoint.qc01.shift06.pre_match');
  await expect(page.locator('#announcer')).toContainText('Story Match started');
});

test('five-Shift mobile save remains keyboard-operable while Story art resolves slowly', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-mobile', 'The mobile keyboard boundary runs once.');
  watchBrowserErrors(page);
  await installWorkerProbe(page);
  await page.route('**/assets/story/**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    await route.continue();
  });
  await seedFiveShiftCheckpoint(page, 'bounded_uncertainty_first');
  await reachFinalClientLine(page, 'bounded_uncertainty_first');

  await advanceThroughShiftSixSetup(page, 'keyboard');
  await expect(page.locator('[data-story-advance]')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#\/play\/game$/);
  await expect(page.getByRole('heading', { name: 'Night-shift board' })).toBeVisible({ timeout: 30_000 });
  const shiftSixStarts = await page.evaluate(() => window.__task037WorkerRequests.filter((request) =>
    request.type === 'START_MATCH'
      && request.payload.story_context?.match_ref === 'story.match.qc01.shift06.quiet_cascade'));
  expect(shiftSixStarts).toHaveLength(1);
  await expect(page.locator('#announcer')).toContainText('Story Match started');
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});

test('Shift 6 failed deck preflight exposes the existing recovery route', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'The Shift 6 preflight failure runs once.');
  watchBrowserErrors(page);
  await installWorkerProbe(page);
  await seedFiveShiftCheckpoint(page, 'verified_outcomes_first');
  await makeActiveDeckMissShiftSixRequirement(page);
  await reachFinalClientLine(page, 'verified_outcomes_first');

  await advanceThroughShiftSixSetup(page);
  await page.locator('[data-story-advance]').click();
  await expect(page).toHaveURL(/#\/play\/decks$/);
  await expect(page.locator('.play-global-notice')).toContainText('Select the reviewed campaign-ready deck');
  await expect(page.locator('#announcer')).toContainText('Select the reviewed campaign-ready deck');
  const requests = await page.evaluate(() => window.__task037WorkerRequests);
  expect(requests.filter((request) => request.type === 'PREFLIGHT_STORY_MATCH'
    && request.payload.match_ref === 'story.match.qc01.shift06.quiet_cascade')).toHaveLength(1);
  expect(requests.filter((request) => request.type === 'START_MATCH'
    && request.payload.story_context?.match_ref === 'story.match.qc01.shift06.quiet_cascade')).toHaveLength(0);
  await page.getByRole('link', { name: 'Story', exact: true }).click();
  await expect(page.locator('[data-story-primary]')).toHaveText('Restart Story Match');
});
