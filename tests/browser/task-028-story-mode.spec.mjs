import { expect, test } from '@playwright/test';

const UPDATE_VISUALS = process.env.UPDATE_TASK_028_VISUALS === '1';
const browserErrors = new WeakMap();

function reportBrowserErrors(page) {
  if (browserErrors.has(page)) return;
  const errors = [];
  browserErrors.set(page, errors);
  page.on('pageerror', (error) => errors.push(`page: ${error.stack || error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
}

async function captureVisual(page, path) {
  await page.waitForTimeout(800);
  await page.screenshot({ path, fullPage: true });
}

test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page) ?? []).toEqual([]);
});

async function installWorkerProbe(page) {
  await page.addInitScript(() => {
    const requests = [];
    const messages = [];
    Object.defineProperties(window, {
      __task028WorkerRequests: { value: requests },
      __task028WorkerMessages: { value: messages },
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
    let sequence = 0;
    Object.defineProperty(Crypto.prototype, 'randomUUID', {
      configurable: true,
      value: () => `00000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}`,
    });
  });
}

async function openFirstScene(page) {
  reportBrowserErrors(page);
  await page.goto('/index.html#/play/story');
  await expect(page.getByRole('heading', { name: 'Story', exact: true })).toBeVisible();
  await page.locator('[data-story-primary]').click();
  await expect(page.locator('.story-stage')).toBeVisible();
  await expect(page.locator('[data-story-statement-id]')).toBeVisible();
}

async function advanceToRoute(page, targetHash) {
  for (let step = 0; step < 24; step += 1) {
    if (new URL(page.url()).hash === targetHash) return;
    const choice = page.locator('[data-story-choice]').first();
    if (await choice.count() && await choice.isVisible()) await choice.click();
    else {
      const advance = page.locator('[data-story-advance]');
      if (!await advance.count() || await advance.isDisabled()) {
        await expect.poll(() => new URL(page.url()).hash, { timeout: 30_000 }).toBe(targetHash);
        return;
      }
      await expect(advance).toBeEnabled();
      await advance.click();
    }
  }
  throw new Error(`Story did not reach its reviewed boundary at ${targetHash}.`);
}

const advanceToMatch = (page) => advanceToRoute(page, '#/play/game');

test('Story navigation, accessible scene, real Match, and exact-once return form one journey', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'The full Worker-authoritative journey runs once on desktop.');
  reportBrowserErrors(page);
  await installWorkerProbe(page);
  await page.goto('/index.html#/play/story');
  await expect(page.getByRole('heading', { name: 'Story', exact: true })).toBeVisible();
  const navigation = await page.locator('.play-subnav > *').allTextContents();
  expect(navigation.map((text) => text.trim())).toEqual(['Home', 'Decks', 'Profile', 'Story', 'Local solo']);
  await expect(page.locator('[data-story-primary]')).toHaveText('Begin Story');
  await expect(page.locator('.story-home__preflight')).toContainText('Multi-System Response Kit');
  if (UPDATE_VISUALS) await captureVisual(page, 'tests/visual/task-028/story-home-desktop.png');

  await page.locator('[data-story-primary]').click();
  const stage = page.locator('.story-stage');
  await expect(stage).toBeVisible();
  await expect(stage.locator('.story-layer--background')).toHaveCount(1);
  await expect(stage.locator('.story-layer--characters [data-story-character-tag="cast.inez"]')).toHaveCount(1);
  await expect(page.locator('[data-story-art-alternative="background"]')).toContainText('Inflow dock before sunrise');
  await expect(page.locator('[data-story-art-alternative="character"]')).toContainText('Inez Calder holds a dock scanner, focused on the intake work ahead.');
  await expect(stage.locator('img[aria-hidden="true"]')).toHaveCount(2);
  await expect(page.locator('.story-dialogue__text')).not.toBeEmpty();
  const firstId = await page.locator('[data-story-statement-id]').getAttribute('data-story-statement-id');
  await page.locator('[data-story-advance]').evaluate((button) => {
    button.click();
    button.click();
  });
  await expect(page.locator('[data-story-statement-id]')).not.toHaveAttribute('data-story-statement-id', firstId);
  await expect(page.locator('[data-story-statement-id]')).toHaveAttribute('data-story-statement-id', 'story.qc01.ch01.open.02');

  await page.locator('[data-story-history]').click();
  const history = page.locator('.story-history-dialog');
  await expect(history).toBeVisible();
  await expect(history.locator('.story-transcript li')).toHaveCount(2);
  await page.keyboard.press('Escape');
  await expect(history).not.toBeVisible();
  if (UPDATE_VISUALS) await captureVisual(page, 'tests/visual/task-028/story-scene-desktop.png');

  for (let step = 0; step < 4 && !await page.locator('[data-story-choice]').count(); step += 1) {
    await page.locator('[data-story-advance]').click();
  }
  const choices = page.locator('[data-story-choice]');
  await expect(page.locator('.story-choices legend')).toHaveText('Choose the first context to carry forward.');
  await expect(choices).toHaveCount(2);
  await expect(page.locator('[data-story-art-alternative="transient"]')).toContainText('serial-history summary');
  await expect(choices.first()).toBeFocused();
  if (UPDATE_VISUALS) await captureVisual(page, 'tests/visual/task-028/story-choice-desktop.png');
  await page.locator('[data-story-history]').click();
  await expect(history).toBeVisible();
  await page.keyboard.press('1');
  await expect(choices).toHaveCount(2);
  await page.keyboard.press('Escape');
  await expect(history).not.toBeVisible();
  await page.keyboard.press('1');
  await expect(page.locator('[data-story-statement-id]')).toHaveAttribute(
    'data-story-statement-id',
    'story.qc01.ch01.package.01',
  );

  await advanceToMatch(page);
  await expect(page.getByRole('heading', { name: 'Night-shift board' })).toBeVisible({ timeout: 30_000 });
  const boundary = await page.evaluate(() => ({
    requests: window.__task028WorkerRequests,
    hash: location.hash,
  }));
  const preflight = boundary.requests.find((request) => request.type === 'PREFLIGHT_STORY_MATCH');
  const start = boundary.requests.find((request) => request.type === 'START_MATCH');
  expect(preflight.payload.match_ref).toBe('story.match.qc01.shift01.wrong_device');
  expect(Object.keys(preflight.payload).sort()).toEqual(['card_definition_ids', 'match_ref']);
  expect(start.payload.story_context.schema_version).toBe('story-match-context-v1');
  expect(start.payload.story_context.return_label).toBe('story.qc01.shift01.return');
  expect(JSON.stringify(start)).not.toContain('builder_configuration');
  expect(boundary.hash).toBe('#/play/game');
  expect(page.url()).not.toContain(start.payload.story_context.context_token);

  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('[data-give-up-intent]').click();
  await expect(page.locator('.result-route')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('[data-continue-story]')).toBeEnabled();
  await expect(page.locator('.result-route')).toContainText('Story Match result');
  await page.locator('[data-continue-story]').click();
  await expect(page).toHaveURL(/#\/play\/story\/scene$/);
  await expect(page.locator('[data-story-statement-id]')).toBeVisible();
  await expect(page.locator('[data-continue-story]')).toHaveCount(0);
});

test('active Story Match reload fails closed and offers a checkpoint restart', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'The full interruption path runs once on desktop.');
  await installWorkerProbe(page);
  await openFirstScene(page);
  await advanceToMatch(page);
  await expect(page.getByRole('heading', { name: 'Night-shift board' })).toBeVisible({ timeout: 30_000 });
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('link', { name: 'Server Repair home' }).click();
  await expect(page.getByRole('heading', { name: 'Take the next repair queue' })).toBeVisible();
  await page.getByRole('link', { name: 'Story', exact: true }).click();
  await expect(page.locator('[data-story-primary]')).toHaveText('Restart Story Match');
  await page.locator('[data-story-primary]').click();
  await expect(page.getByRole('heading', { name: 'Night-shift board' })).toBeVisible({ timeout: 30_000 });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Story Match was interrupted' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Restart from Story Home' })).toBeVisible();
  await expect(page.locator('.ticket-card')).toHaveCount(0);
  await page.getByRole('link', { name: 'Restart from Story Home' }).click();
  await expect(page.locator('[data-story-primary]')).toHaveText('Restart Story Match');
  await expect(page.locator('.story-restart-note')).toContainText('does not resume');
});

test('leaving a non-durable scene returns through its authored checkpoint', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'The route-away checkpoint lifecycle runs once on desktop.');
  await openFirstScene(page);
  await page.locator('[data-story-advance]').click();
  await expect(page.locator('[data-story-statement-id]')).toHaveAttribute(
    'data-story-statement-id',
    'story.qc01.ch01.open.02',
  );
  await page.getByRole('link', { name: 'Home', exact: true }).click();
  await page.getByRole('link', { name: 'Story', exact: true }).click();
  await expect(page.locator('[data-story-primary]')).toHaveText('Continue');
  await page.locator('[data-story-primary]').click();
  await expect(page.locator('[data-story-statement-id]')).toHaveAttribute(
    'data-story-statement-id',
    'story.qc01.ch01.open.01',
  );
});

test('real Worker deck preflight fails safely and returns the Player to Decks', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'The real preflight failure runs once on desktop.');
  await installWorkerProbe(page);
  await page.goto('/index.html#/play/story');
  await expect(page.getByRole('heading', { name: 'Story', exact: true })).toBeVisible();
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
    const draft = service.createDeckDraft({ displayName: 'Preflight gap fixture' });
    draft.card_definition_ids = source.card_definition_ids.map((id) =>
      id === 'card.response.verify.boot.normal_boot'
        ? 'card.response.repair.boot.correct_order'
        : id);
    service.saveDeck(draft);
    service.makeActive(draft.deck_id);
  });
  await page.reload();
  await openFirstScene(page);
  await advanceToRoute(page, '#/play/decks');
  const notice = page.locator('.play-global-notice');
  await expect(notice).toContainText('Select the reviewed campaign-ready deck');
  await expect(notice).not.toContainText('card.response.verify.boot.normal_boot');
  await expect(notice).not.toContainText('Normal Boot Verification');
  const preflight = await page.evaluate(() => window.__task028WorkerMessages
    .find((message) => message.type === 'STORY_MATCH_PREFLIGHT'));
  expect(preflight.result.ok).toBe(false);
  expect(preflight.result.code).toBe('DECK_REQUIREMENTS_UNMET');
  await page.getByRole('link', { name: 'Story', exact: true }).click();
  await expect(page.locator('[data-story-primary]')).toHaveText('Restart Story Match');
});

test('Story scene reflows without obscured controls and honors reduced motion', async ({ page }, testInfo) => {
  await openFirstScene(page);
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  await expect(page.locator('.story-dialogue')).toBeVisible();
  await expect(page.locator('[data-story-advance]')).toBeInViewport();
  await expect(page.locator('.story-location')).toBeVisible();
  await expect(page.locator('.story-location')).toBeInViewport();
  if (testInfo.project.name === 'chromium-reduced-motion') {
    const animation = await page.locator('.story-dialogue').evaluate((element) =>
      getComputedStyle(element).animationDuration);
    expect(['0s', '0.001s']).toContain(animation);
  }
  if (testInfo.project.name === 'chromium-desktop') {
    await page.emulateMedia({ forcedColors: 'active' });
    const colors = await page.locator('.story-location').evaluate((element) => {
      const style = getComputedStyle(element);
      return { color: style.color, background: style.backgroundColor };
    });
    expect(colors.color).not.toBe(colors.background);
  }
  if (UPDATE_VISUALS && ['chromium-mobile', 'chromium-reduced-motion'].includes(testInfo.project.name)) {
    await captureVisual(page, `tests/visual/task-028/story-scene-${testInfo.project.name}.png`);
  }
});

test('Story auto mode pauses while the page is hidden and restarts its delay on return', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'The visibility lifecycle runs once on desktop.');
  await openFirstScene(page);
  await page.clock.install();
  const firstId = await page.locator('[data-story-statement-id]').getAttribute('data-story-statement-id');
  await page.locator('[data-story-auto]').click();
  await expect(page.locator('[data-story-auto]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-story-history]').click();
  await expect(page.locator('.story-history-dialog')).toBeVisible();
  await page.clock.fastForward(6_000);
  await expect(page.locator('[data-story-statement-id]')).toHaveAttribute('data-story-statement-id', firstId);
  await page.keyboard.press('Escape');
  await expect(page.locator('.story-history-dialog')).not.toBeVisible();
  // Leave a full second of scheduling margin around the animated dialog close;
  // the assertion is about receiving a fresh delay, not a millisecond boundary.
  await page.clock.fastForward(4_000);
  await expect(page.locator('[data-story-statement-id]')).toHaveAttribute('data-story-statement-id', firstId);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.clock.fastForward(6_000);
  await expect(page.locator('[data-story-statement-id]')).toHaveAttribute('data-story-statement-id', firstId);

  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.clock.fastForward(5_100);
  await expect(page.locator('[data-story-statement-id]')).not.toHaveAttribute('data-story-statement-id', firstId);
});
