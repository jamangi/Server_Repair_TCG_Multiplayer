import { expect, test } from '@playwright/test';

const UPDATE_VISUALS = process.env.UPDATE_TASK_055_VISUALS === '1';
const browserErrors = new WeakMap();
const expectedSystemFetchFailures = new WeakSet();

function watchBrowserErrors(page) {
  const errors = [];
  browserErrors.set(page, errors);
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.stack || error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
}

test.beforeEach(async ({ page }) => {
  watchBrowserErrors(page);
  await page.addInitScript(() => {
    const inbound = [];
    const outbound = [];
    Object.defineProperties(window, {
      __task055WorkerMessages: { value: inbound },
      __task055WorkerRequests: { value: outbound },
    });
    const NativeWorker = window.Worker;
    window.Worker = new Proxy(NativeWorker, {
      construct(Target, argumentsList) {
        const worker = Reflect.construct(Target, argumentsList);
        worker.addEventListener('message', (event) => inbound.push(structuredClone(event.data)));
        const nativePost = worker.postMessage.bind(worker);
        worker.postMessage = (message, transfer) => {
          outbound.push(structuredClone(message));
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
});

test.afterEach(async ({ page }) => {
  const errors = browserErrors.get(page) ?? [];
  const unexpected = expectedSystemFetchFailures.has(page)
    ? errors.filter((error) => !error.includes('Failed to load resource: net::ERR_FAILED'))
    : errors;
  expect(unexpected).toEqual([]);
});

async function advanceCurrentStorySceneToMatch(page) {
  for (let step = 0; step < 28; step += 1) {
    if (new URL(page.url()).hash === '#/play/game') break;
    const choice = page.locator('[data-story-choice]').first();
    if (await choice.count() && await choice.isVisible()) await choice.click();
    else {
      const advance = page.locator('[data-story-advance]');
      if (!await advance.count()) break;
      if (await advance.isDisabled()) {
        await expect.poll(async () => new URL(page.url()).hash === '#/play/game'
          || (await advance.count() > 0 && await advance.isEnabled()), { timeout: 30_000 }).toBe(true);
        if (new URL(page.url()).hash === '#/play/game') break;
      }
      await advance.click();
    }
  }
  await expect(page).toHaveURL(/#\/play\/game$/u, { timeout: 30_000 });
  await expect(page.getByRole('heading', { name: 'Night-shift board' })).toBeVisible({ timeout: 30_000 });
}

async function advanceToStoryMatch(page) {
  await page.goto('/index.html#/play/story');
  await expect(page.locator('#app')).not.toHaveAttribute('aria-busy', 'true');
  await expect(page.getByRole('heading', { name: 'Story', exact: true })).toBeVisible();
  await page.locator('[data-story-primary]').click();
  await advanceCurrentStorySceneToMatch(page);
}

async function seedCompletedFirstShift(page) {
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
      rootUrl: new URL('/generated/play/content/story-v1/campaigns/quiet-cascade-expansion-v3/', location.origin),
      runtimeUrl: new URL('/generated/play/src/story/index.mjs', location.origin),
      onStartMatch(value) { launch.current = value; },
    });
    await client.openPrimary();
    for (let step = 0; step < 160 && !launch.current; step += 1) {
      const scene = client.sceneModel();
      if (scene.choices.length) await client.choose(scene.choices[0].optionId);
      else if (scene.controls.advance) await client.advance();
      else throw new Error('Fixture stopped before Shift 1.');
    }
    const context = launch.current.context;
    await client.stageMatchResult({
      schema_version: 'story-match-result-v1',
      result_id: 'result.local.story.task055.seed',
      match_id: 'local.story.task055.seed',
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

async function activate(page, locator, mode = 'mouse') {
  if (mode === 'keyboard') {
    await locator.focus();
    await expect(locator).toBeFocused();
    await page.keyboard.press('Enter');
  } else if (mode === 'touch') await locator.tap();
  else await locator.click();
}

async function openSystem(page, mode = 'mouse') {
  const ticketOpener = page.locator('[data-view-full-ticket]');
  await activate(page, ticketOpener, mode);
  const fullTicket = page.locator('#full-ticket-dialog');
  await expect(fullTicket).toBeVisible();
  const systemOpener = fullTicket.locator('[data-view-system]');
  await expect(systemOpener).toBeVisible();
  await activate(page, systemOpener, mode);
  const system = page.locator('#system-model-dialog');
  await expect(system).toBeVisible();
  return { ticketOpener, fullTicket, systemOpener, system };
}

function workerSnapshot(page) {
  return page.evaluate(() => {
    const message = [...window.__task055WorkerMessages].reverse()
      .find((candidate) => candidate.projection?.view?.public_match);
    const match = message?.projection?.view?.public_match;
    return {
      outboundCount: window.__task055WorkerRequests.length,
      submitCount: window.__task055WorkerRequests.filter((request) => request.type === 'SUBMIT_INTENT').length,
      actions: match?.turn?.actions_remaining,
      machineRevisions: match?.repair_queue?.map((ticket) => ticket.machine_revision),
    };
  });
}

async function runOrdinaryDiagnostic(page) {
  const selection = await page.evaluate(() => {
    const message = [...window.__task055WorkerMessages].reverse()
      .find((candidate) => candidate.projection?.legal_intents);
    const intent = message.projection.legal_intents.find((candidate) => candidate.action_type === 'RUN_TEST');
    return {
      intentId: intent.intent_id,
      cardInstanceId: intent.card_instance_id,
      cardDefinitionId: intent.card_definition_id,
      inboundCount: window.__task055WorkerMessages.length,
    };
  });
  let card = page.locator(`[data-select-diagnostic="${selection.cardInstanceId}"]`);
  if (!await card.count()) {
    await page.getByRole('button', { name: 'Global', exact: true }).click();
    await page.locator('[data-bench-search]').fill(selection.cardDefinitionId);
    card = page.locator(`[data-select-diagnostic="${selection.cardInstanceId}"]`);
  }
  await card.click();
  await page.locator(`[data-intent-id="${selection.intentId}"]`).click();
  await expect.poll(() => page.evaluate(() => window.__task055WorkerMessages.length)).toBeGreaterThan(selection.inboundCount);
  await expect(page.locator('[data-action-result="accepted"]')).toBeVisible();
}

async function documentOverflowMetrics(page) {
  return page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    return {
      document: document.documentElement.scrollWidth - viewportWidth,
      body: document.body.scrollWidth - document.body.clientWidth,
      offenders: [...document.querySelectorAll('body *')]
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            tag: element.tagName.toLowerCase(),
            className: typeof element.className === 'string' ? element.className : '',
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
          };
        })
        .filter((element) => element.left < -1 || element.right > viewportWidth + 1)
        .slice(0, 12),
    };
  });
}

async function expectNoAdditionalDocumentOverflow(page, baseline) {
  const metrics = await documentOverflowMetrics(page);
  expect(metrics.document, JSON.stringify(metrics.offenders, null, 2)).toBeLessThanOrEqual(baseline.document);
  expect(metrics.body, JSON.stringify(metrics.offenders, null, 2)).toBeLessThanOrEqual(baseline.body);
}

test('Show system is a complete zero-Action public explanation with exact stacked-dialog focus restoration', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'The long semantic and repeated lifecycle audit runs once.');
  await advanceToStoryMatch(page);
  const before = await workerSnapshot(page);
  const { ticketOpener, fullTicket, systemOpener, system } = await openSystem(page, 'keyboard');
  const projectionCacheKey = await system.locator('.system-dialog__body').getAttribute('data-system-cache-key');

  await expect(fullTicket).toHaveAttribute('open', '');
  await expect(system).toHaveAttribute('open', '');
  expect(await page.evaluate(() => document.querySelector('#system-model-dialog').matches(':modal'))).toBe(true);
  await expect(system.getByRole('heading', { name: 'A map, not Evidence' })).toBeVisible();
  await expect(system).toContainText('Opening, inspecting, or closing this view spends no Action');
  await expect(system).toContainText(/relevant to this system/iu);
  await expect(system).toContainText(/legal now/iu);
  await expect(system).toContainText(/correct diagnosis/iu);
  await expect(system.locator('.system-lifecycle > ol > li')).not.toHaveCount(0);
  await expect(system.locator('.system-topology__node')).not.toHaveCount(0);
  await expect(system.locator('.system-text-equivalent li')).not.toHaveCount(0);
  await expect(system.locator('.system-components > ul > li')).not.toHaveCount(0);
  const semanticNodeList = system.getByRole('list', { name: 'System topology nodes' });
  await expect(semanticNodeList).toBeAttached();
  await expect(semanticNodeList.getByRole('listitem')).not.toHaveCount(0);
  await expect(system.getByRole('region', { name: 'Scrollable system topology diagram' })).toBeVisible();
  await expect(system.getByRole('heading', { name: 'Complete topology text equivalent' })).toBeVisible();
  for (const kind of ['TEST', 'COMMAND', 'REPAIR', 'VERIFICATION']) {
    await expect(system.locator(`[data-action-kind="${kind}"]`).first()).toBeAttached();
  }
  await expect(system.locator('.system-status--relevant').first()).toContainText('Relevant to this system');
  await expect(system.locator('.system-status--legal[data-legal-now="true"]').first()).toContainText('Legal now');
  await expect(system.locator('.system-status--legal[data-legal-now="false"]').first()).toContainText('Not currently legal');
  const systemText = await system.textContent();
  for (const privateTerm of ['validation_trace', 'resolver_key', 'hidden_fault', 'solution_id', 'fault_instance.', 'fingerprint.']) {
    expect(systemText.toLowerCase()).not.toContain(privateTerm);
  }
  const topology = system.locator('.system-topology__canvas');
  await topology.evaluate((element) => { element.scrollLeft = element.scrollWidth; });
  const firstRationale = system.locator('.system-rationale-group details').first();
  await firstRationale.locator('summary').click();
  await expect(firstRationale).toHaveAttribute('open', '');
  expect(await workerSnapshot(page)).toEqual(before);

  if (UPDATE_VISUALS) {
    await system.evaluate((element) => { element.scrollTop = 0; });
    await page.screenshot({ path: 'tests/visual/task-055/system-model-desktop.png' });
  }

  await page.keyboard.press('Escape');
  await expect(system).not.toBeVisible();
  await expect(fullTicket).toBeVisible();
  await expect(systemOpener).toBeFocused();

  const closeModes = ['footer', 'header', 'escape', 'backdrop', 'footer'];
  for (const closeMode of closeModes) {
    await systemOpener.click();
    await expect(system).toBeVisible();
    if (closeMode === 'footer') await system.locator('.system-dialog__footer [data-close-dialog="system"]').click();
    else if (closeMode === 'header') await system.locator('.system-dialog__header [data-close-dialog="system"]').click();
    else if (closeMode === 'escape') await page.keyboard.press('Escape');
    else await system.click({ position: { x: 2, y: 2 } });
    await expect(system).not.toBeVisible();
    await expect(fullTicket).toBeVisible();
    await expect(systemOpener).toBeFocused();
  }
  expect(await workerSnapshot(page)).toEqual(before);

  await fullTicket.locator('[data-close-dialog="full-ticket"]').click();
  await expect(fullTicket).not.toBeVisible();
  await expect(ticketOpener).toBeFocused();

  await runOrdinaryDiagnostic(page);
  const afterAction = await openSystem(page);
  await expect(afterAction.system.locator('.system-dialog__body')).toHaveAttribute('data-system-cache-key', projectionCacheKey);
  await expect(afterAction.system).toContainText('A map, not Evidence');

  page.once('dialog', (dialog) => dialog.accept());
  await page.evaluate(() => { location.hash = '#/play/home'; });
  await expect(page).toHaveURL(/#\/play\/home$/u);
  await expect(page.locator('dialog[open]')).toHaveCount(0);
});

test('System presentation reflows at 100%, 200%, and 400% with touch, reduced-motion, and forced-color contracts', async ({ page }, testInfo) => {
  await advanceToStoryMatch(page);
  const scale = testInfo.project.name === 'chromium-mobile' ? 4
    : ['chromium-tablet', 'chromium-reduced-motion'].includes(testInfo.project.name) ? 2 : 1;
  await page.addStyleTag({ content: `html { font-size: ${scale * 16}px !important; }` });
  await page.evaluate(() => window.dispatchEvent(new Event('resize')));
  if (testInfo.project.name === 'chromium-desktop') await page.emulateMedia({ forcedColors: 'active' });
  const baselineOverflow = await documentOverflowMetrics(page);
  const mode = ['chromium-tablet', 'chromium-mobile', 'chromium-reduced-motion'].includes(testInfo.project.name)
    ? 'touch' : 'mouse';
  const { fullTicket, systemOpener, system } = await openSystem(page, mode);

  await expect.poll(() => system.locator('.system-dialog__header [data-close-dialog="system"]')
    .evaluate((element) => Math.min(element.getBoundingClientRect().width, element.getBoundingClientRect().height)))
    .toBeGreaterThanOrEqual(44);

  await expectNoAdditionalDocumentOverflow(page, baselineOverflow);
  const viewport = page.viewportSize();
  const box = await system.boundingBox();
  const dialogLayout = await system.evaluate((element) => ({
    computedMaxHeight: getComputedStyle(element).maxHeight,
    computedHeight: getComputedStyle(element).height,
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
    transform: getComputedStyle(element).transform,
    visualViewport: { width: visualViewport.width, height: visualViewport.height },
  }));
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box.y + box.height, JSON.stringify(dialogLayout)).toBeLessThanOrEqual(viewport.height + 1);
  const topologyMetrics = await system.locator('.system-topology__canvas').evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
    overflowX: getComputedStyle(element).overflowX,
  }));
  expect(topologyMetrics.scrollWidth).toBeGreaterThanOrEqual(topologyMetrics.clientWidth);
  if (scale > 1) expect(topologyMetrics.scrollWidth).toBeGreaterThan(topologyMetrics.clientWidth);
  expect(['auto', 'scroll']).toContain(topologyMetrics.overflowX);
  const unboundedSystemContent = await system.evaluate((dialog) => {
    const boundary = dialog.getBoundingClientRect();
    return [...dialog.querySelectorAll('*')]
      .filter((element) => !element.closest('.system-topology__canvas'))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          label: element.getAttribute('aria-label') || element.textContent?.trim().slice(0, 40),
          left: rect.left,
          right: rect.right,
        };
      })
      .filter((element) => element.left < boundary.left - 1 || element.right > boundary.right + 1);
  });
  expect(unboundedSystemContent).toEqual([]);

  const smallTargets = await system.locator('button, a[href], summary, [tabindex="0"]').evaluateAll((elements) => elements
    .map((element) => ({
      label: element.getAttribute('aria-label') || element.textContent.trim().slice(0, 50),
      width: element.getBoundingClientRect().width,
      height: element.getBoundingClientRect().height,
    }))
    .filter((target) => target.width < 44 || target.height < 44));
  expect(smallTargets).toEqual([]);

  await system.locator('.system-topology__node').first().focus();
  await expect(system.locator('.system-topology__node').first()).toBeFocused();
  await system.locator('.system-path-list li').first().focus();
  await expect(system.locator('.system-path-list li').first()).toBeFocused();

  if (mode === 'touch') {
    const portrait = testInfo.project.name === 'chromium-tablet'
      ? { width: 768, height: 1024 }
      : { width: 390, height: 844 };
    const landscape = { width: portrait.height, height: portrait.width };
    const focusAnchor = system.locator('.system-path-list li').first();
    for (const viewportSize of [portrait, landscape, portrait]) {
      await page.setViewportSize(viewportSize);
      await expect(system).toBeVisible();
      await expect(focusAnchor).toBeFocused();
      const resizedBox = await system.boundingBox();
      expect(resizedBox.x).toBeGreaterThanOrEqual(0);
      expect(resizedBox.y).toBeGreaterThanOrEqual(0);
      expect(resizedBox.x + resizedBox.width).toBeLessThanOrEqual(viewportSize.width + 1);
      expect(resizedBox.y + resizedBox.height).toBeLessThanOrEqual(viewportSize.height + 1);
    }
    const constrainedTopology = await system.locator('.system-topology__canvas').evaluate((element) => {
      element.scrollLeft = element.scrollWidth;
      return { scrollLeft: element.scrollLeft, maximum: element.scrollWidth - element.clientWidth };
    });
    expect(constrainedTopology.maximum).toBeGreaterThan(0);
    expect(constrainedTopology.scrollLeft).toBeGreaterThan(0);
  }

  if (testInfo.project.name === 'chromium-reduced-motion') {
    expect(await system.evaluate((element) => element.getAnimations({ subtree: true }).length)).toBe(0);
  }
  if (testInfo.project.name === 'chromium-desktop') {
    const forced = await system.locator('.system-authority').evaluate((element) => ({
      color: getComputedStyle(element).color,
      border: getComputedStyle(element).borderTopColor,
    }));
    expect(forced.color).not.toBe('rgba(0, 0, 0, 0)');
    expect(forced.border).not.toBe('rgba(0, 0, 0, 0)');
  }
  if (UPDATE_VISUALS) {
    await system.evaluate((element) => { element.scrollTop = 0; });
    await page.screenshot({ path: `tests/visual/task-055/system-model-${testInfo.project.name}-${scale * 100}pct.png` });
  }
  await page.keyboard.press('Escape');
  await expect(system).not.toBeVisible();
  await expect(fullTicket).toBeVisible();
  await expect(systemOpener).toBeFocused();
});

test('a failed System projection shows the honest unavailable state and never fabricates a Show system control', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'The fail-closed content path runs once.');
  expectedSystemFetchFailures.add(page);
  await page.route('**/system-model-story-v1/public-system-projections-v1.json', (route) => route.abort('failed'));
  await page.goto('/index.html#/play/home');
  await expect(page.locator('#app')).not.toHaveAttribute('aria-busy', 'true');
  await page.locator('#ticket-count').selectOption('1');
  await page.locator('#start-solo').click();
  await expect(page.getByRole('heading', { name: 'Night-shift board' })).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('[data-system-model-availability="unavailable"]')).toHaveCount(1);
  await page.locator('[data-view-full-ticket]').click();
  const fullTicket = page.locator('#full-ticket-dialog');
  await expect(fullTicket.locator('[data-system-model-availability="unavailable"]')).toContainText(
    'A detailed system model is not available for this Ticket. Ordinary troubleshooting remains unchanged.',
  );
  await expect(fullTicket.locator('[data-view-system]')).toHaveCount(0);
  await expect(page.locator('#system-model-dialog')).toHaveCount(0);
});

test('a hanging optional System fetch never blocks Home, the full Ticket, or ordinary diagnosis', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'The optional-resource availability boundary runs once.');
  let releaseSystemFetch;
  await page.route('**/system-model-story-v1/public-system-projections-v1.json', async (route) => {
    await new Promise((resolve) => { releaseSystemFetch = resolve; });
    await route.continue();
  });
  await page.goto('/index.html#/play/home');
  await expect(page.locator('#app')).not.toHaveAttribute('aria-busy', 'true');
  await expect(page.getByRole('heading', { name: 'Take the next repair queue' })).toBeVisible();
  await page.locator('#ticket-count').selectOption('1');
  await page.locator('#start-solo').click();
  await expect(page.getByRole('heading', { name: 'Night-shift board' })).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('[data-system-model-availability="loading"]')).toContainText(
    'Ordinary troubleshooting remains available',
  );
  await page.locator('[data-view-full-ticket]').click();
  const fullTicket = page.locator('#full-ticket-dialog');
  await expect(fullTicket).toBeVisible();
  await expect(fullTicket.locator('[data-view-system]')).toHaveCount(0);
  await fullTicket.locator('[data-close-dialog="full-ticket"]').click();
  await runOrdinaryDiagnostic(page);

  const ticketOpener = page.locator('[data-view-full-ticket]');
  await ticketOpener.click();
  await expect(fullTicket).toBeVisible();
  const focusAnchor = fullTicket.locator('[data-close-dialog="full-ticket"]');
  await focusAnchor.focus();
  await expect(focusAnchor).toBeFocused();
  const response = page.waitForResponse('**/system-model-story-v1/public-system-projections-v1.json');
  releaseSystemFetch();
  await response;
  await expect(page.locator('#app')).toHaveAttribute('data-system-model-status', 'available');
  await expect(fullTicket).toBeVisible();
  await expect(focusAnchor).toBeFocused();
  await expect(fullTicket.locator('[data-system-model-availability="loading"]')).toHaveCount(1);

  await focusAnchor.click();
  await expect(fullTicket).not.toBeVisible();
  await expect(ticketOpener).toBeFocused();
  const settledEntry = page.locator('[data-system-model-availability="available"], [data-system-model-availability="unavailable"]');
  await expect(settledEntry).toHaveCount(1);
  await expect(page.locator('[data-system-model-availability="loading"]')).toHaveCount(0);
  await ticketOpener.click();
  if (await settledEntry.getAttribute('data-system-model-availability') === 'available') {
    await expect(fullTicket.locator('[data-view-system]')).toBeVisible();
  } else {
    await expect(fullTicket.locator('[data-system-model-availability="unavailable"]')).toContainText(
      'Ordinary troubleshooting remains unchanged',
    );
    await expect(fullTicket.locator('[data-view-system]')).toHaveCount(0);
  }
});

test('selected-Ticket switching keeps each covered Shift 2 projection pinned to its own public Ticket', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'The real two-Ticket continuity path runs once.');
  await seedCompletedFirstShift(page);
  await page.locator('[data-story-primary]').click();
  await advanceCurrentStorySceneToMatch(page);
  await expect(page.locator('.ticket-card')).toHaveCount(2);

  const cacheKeys = [];
  for (let index = 0; index < 2; index += 1) {
    const ticket = page.locator('.ticket-card').nth(index);
    await ticket.click();
    await expect(ticket).toHaveAttribute('aria-current', 'true');
    const { fullTicket, systemOpener, system } = await openSystem(page);
    cacheKeys.push(await system.locator('.system-dialog__body').getAttribute('data-system-cache-key'));
    await expect(system).toContainText('A map, not Evidence');
    await page.keyboard.press('Escape');
    await expect(systemOpener).toBeFocused();
    await fullTicket.locator('[data-close-dialog="full-ticket"]').click();
    await expect(ticket).toHaveAttribute('aria-current', 'true');
  }
  expect(new Set(cacheKeys).size).toBe(2);
});

test('an isolated Story replay can inspect the same public System and reload tears down both modal layers safely', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'The isolated practice/reload lifecycle runs once.');
  await seedCompletedFirstShift(page);
  await page.locator('[data-story-replay]').click();
  await expect(page.locator('.play-global-notice')).toContainText('Practice review');
  await advanceCurrentStorySceneToMatch(page);
  await expect(page.locator('.play-subnav__mode')).toHaveText('Story practice');
  const { fullTicket, system } = await openSystem(page);
  await expect(fullTicket).toBeVisible();
  await expect(system).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Story practice was interrupted' })).toBeVisible();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await page.getByRole('link', { name: 'Return to Chapter history' }).click();
  await expect(page.locator('[data-story-replay]')).toHaveCount(1);
});
