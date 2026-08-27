import { expect, test } from '@playwright/test';

const UPDATE_VISUALS = process.env.UPDATE_TASK_019_VISUALS === '1';

async function openSolo(page, ticketCount = 3) {
  await page.addInitScript(() => {
    const inbound = [];
    Object.defineProperty(window, '__task019WorkerMessages', { value: inbound });
    const NativeWorker = window.Worker;
    window.Worker = new Proxy(NativeWorker, {
      construct(Target, argumentsList) {
        const worker = Reflect.construct(Target, argumentsList);
        worker.addEventListener('message', (event) => inbound.push(structuredClone(event.data)));
        return worker;
      },
    });
    Object.defineProperty(Crypto.prototype, 'randomUUID', {
      configurable: true,
      value: () => '00000000-0000-4000-8000-000000001601',
    });
  });
  await page.goto('/index.html#/play/home');
  await expect(page.locator('#app')).not.toHaveAttribute('aria-busy', 'true');
  await page.locator('#ticket-count').selectOption(String(ticketCount));
  await page.locator('#start-solo').click();
  await expect(page.getByRole('heading', { name: 'Night-shift board' })).toBeVisible({ timeout: 20_000 });
}

async function expectDiagnosticAnatomy(page) {
  const tiles = page.locator('.diagnostic-tile');
  expect(await tiles.count()).toBeGreaterThan(0);
  for (const tile of await tiles.all()) {
    const anatomy = await tile.evaluate((node) => {
      const card = node.querySelector('.play-card');
      const family = node.querySelector('.play-card__family');
      const cost = node.querySelector('.play-card__cost');
      const title = node.querySelector('.play-card__title');
      const art = node.querySelector('.play-card__art');
      const image = node.querySelector('.play-card__art-image');
      const inspect = node.querySelector('[data-inspect-diagnostic]');
      const tileBox = node.getBoundingClientRect();
      const intersects = (child) => {
        const box = child.getBoundingClientRect();
        return Math.min(box.right, tileBox.right) > Math.max(box.left, tileBox.left)
          && Math.min(box.bottom, tileBox.bottom) > Math.max(box.top, tileBox.top);
      };
      const titleStyle = getComputedStyle(title);
      return {
        family: family.textContent.trim(),
        cost: cost.textContent.trim(),
        title: title.textContent.trim(),
        titleLines: Math.round(title.getBoundingClientRect().height / Number.parseFloat(titleStyle.lineHeight)),
        titleOverflow: title.scrollHeight - title.clientHeight,
        artWidth: art.getBoundingClientRect().width,
        artHeight: art.getBoundingClientRect().height,
        naturalWidth: image.naturalWidth,
        intrinsicWidth: Number(image.getAttribute('width')),
        intrinsicHeight: Number(image.getAttribute('height')),
        artStatus: image.dataset.artStatus,
        loading: image.loading,
        objectFit: getComputedStyle(image).objectFit,
        childIntersections: [card, family, cost, title, art, inspect].every(intersects),
        hasRules: Boolean(node.querySelector('.play-card__rules')),
        hasDisclosure: Boolean(node.querySelector('details')),
      };
    });
    expect(anatomy.family).toMatch(/test|command/i);
    expect(anatomy.cost).toMatch(/^\d+$/);
    expect(anatomy.title.length).toBeGreaterThan(0);
    expect(anatomy.titleLines).toBeLessThanOrEqual(2);
    expect(anatomy.titleOverflow).toBeLessThanOrEqual(1);
    expect(anatomy.artWidth).toBeGreaterThan(20);
    expect(anatomy.artHeight).toBeGreaterThan(20);
    if (anatomy.artStatus === 'loading') {
      expect(anatomy.loading).toBe('lazy');
      expect(anatomy.intrinsicWidth).toBe(800);
      expect(anatomy.intrinsicHeight).toBe(450);
    } else {
      expect(anatomy.naturalWidth).toBeGreaterThan(0);
    }
    expect(anatomy.objectFit).toMatch(/cover|contain/);
    expect(anatomy.childIntersections).toBe(true);
    expect(anatomy.hasRules).toBe(false);
    expect(anatomy.hasDisclosure).toBe(false);
  }
}

async function expectCollapsedHandAnatomy(page) {
  const hand = page.locator('.hand-rail');
  await expect(hand).toHaveAttribute('data-expanded', 'false');
  await expect(hand).not.toContainText('DISCARD');
  const groups = page.locator('.hand-group');
  expect(await groups.count()).toBeGreaterThan(0);
  expect(await groups.count()).toBeLessThanOrEqual(5);
  for (const group of await groups.all()) {
    const anatomy = await group.evaluate((node) => {
      const title = node.querySelector('.play-card__title');
      return {
        family: node.querySelector('.play-card__family')?.textContent.trim(),
        title: title?.textContent.trim(),
        titleOverflow: title.scrollHeight - title.clientHeight,
        quantity: node.querySelector('.hand-group__quantity')?.textContent.trim(),
        inspect: node.querySelector('.hand-group__inspect')?.getBoundingClientRect().height,
      };
    });
    expect(anatomy.family).toMatch(/repair|verify/i);
    expect(anatomy.title.length).toBeGreaterThan(0);
    expect(anatomy.titleOverflow).toBeLessThanOrEqual(1);
    expect(anatomy.quantity).toMatch(/^×\d+$/);
    expect(anatomy.inspect).toBeGreaterThanOrEqual(44);
  }
}

test('shared Bench tiles and grouped hand preserve detail, identity, expansion, and authority', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Detailed interaction contract runs once on desktop.');
  await page.setViewportSize({ width: 1920, height: 1080 });
  await openSolo(page);
  const started = await page.evaluate(() => window.__task019WorkerMessages.find((message) => message.type === 'MATCH_STARTED'));
  const projectedHandIds = started.projection.view.hand.map((instance) => instance.card_instance_id).sort();
  const expectedGroups = [...new Set(started.projection.view.hand.map((instance) => instance.card_definition_id))];

  await expectDiagnosticAnatomy(page);
  const relevantTile = page.locator('.diagnostic-tile[data-relevant="true"]').first();
  await relevantTile.locator('[data-inspect-diagnostic]').click();
  await expect(page.locator('#game-card-dialog')).toContainText('Why relevant?');
  await expect(page.locator('#game-card-dialog')).toContainText('graph may be incomplete');
  await page.getByRole('button', { name: 'Close Card details' }).click();
  await expect(page.locator('#game-card-dialog')).toBeHidden();

  await page.getByRole('button', { name: 'Global', exact: true }).click();
  await expectDiagnosticAnatomy(page);
  const globalTile = page.locator('.diagnostic-tile[data-relevant="false"]').first();
  await globalTile.locator('[data-inspect-diagnostic]').click();
  await expect(page.locator('#game-card-dialog')).toContainText('Global catalog availability');
  await expect(page.locator('#game-card-dialog')).toContainText('does not decide legality');
  await page.getByRole('button', { name: 'Close Card details' }).click();
  await expect(page.locator('#game-card-dialog')).toBeHidden();

  await expectCollapsedHandAnatomy(page);
  await expect(page.locator('.hand-rail__counts')).toContainText(`${projectedHandIds.length} Cards`);
  await expect(page.locator('.hand-rail__counts')).toContainText(`Deck ${started.projection.view.deck_count}`);
  await expect(page.locator('.hand-rail__counts')).toContainText(`Discard ${started.projection.view.discard_card_instance_ids.length}`);
  expect(expectedGroups.length).toBeGreaterThan(5);
  const presentedGroups = [];
  const presentedInstances = [];
  for (let pageNumber = 1; pageNumber <= Math.ceil(expectedGroups.length / 5); pageNumber += 1) {
    presentedGroups.push(...await page.locator('.hand-group').evaluateAll((nodes) => nodes.map((node) => node.dataset.handGroup)));
    presentedInstances.push(...await page.locator('.hand-group [data-card-instance-id]').evaluateAll((nodes) => nodes.map((node) => node.dataset.cardInstanceId)));
    const next = page.locator('[data-hand-page]').filter({ hasText: 'Next' });
    if (pageNumber < Math.ceil(expectedGroups.length / 5)) await next.click();
  }
  expect(presentedGroups).toEqual(expectedGroups);
  expect(presentedInstances.sort()).toEqual(projectedHandIds);
  await page.locator('[data-hand-page]').filter({ hasText: 'Previous' }).click();

  const selected = page.locator('.hand-group .play-card').first();
  const selectedId = await selected.getAttribute('data-card-instance-id');
  await selected.click();
  await expect(page.locator(`.play-card[data-card-instance-id="${selectedId}"]`)).toHaveAttribute('aria-pressed', 'true');
  const toggle = page.locator('[data-toggle-hand]');
  await toggle.click();
  await expect(page.locator('.hand-rail')).toHaveAttribute('data-expanded', 'true');
  await expect(page.locator(`.play-card[data-card-instance-id="${selectedId}"]`)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.hand-group .play-card__rules').first()).not.toBeEmpty();
  const expandedBounds = await page.evaluate(() => {
    const hand = document.querySelector('.hand-rail').getBoundingClientRect();
    const ticket = document.querySelector('.ticket-sheet').getBoundingClientRect();
    const rail = document.querySelector('.investigation-rail').getBoundingClientRect();
    return { hand, ticket, rail };
  });
  expect(expandedBounds.hand.top).toBeGreaterThanOrEqual(expandedBounds.ticket.bottom - 1);
  expect(expandedBounds.hand.right).toBeLessThanOrEqual(expandedBounds.rail.left - 1);
  expect(expandedBounds.hand.height).toBeGreaterThan(300);
  await expect(page.locator('.hand-group .play-card__rules').first()).toBeVisible();
  if (UPDATE_VISUALS) {
    await page.screenshot({
      path: 'tests/visual/task-019/expanded-global-1920x1080-chromium-desktop.png',
      animations: 'disabled',
    });
  }

  const handInspect = page.locator('.hand-group__inspect').first();
  await handInspect.click();
  await expect(page.locator('#game-card-dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#game-card-dialog')).toBeHidden();
  await expect(page.locator('#game-card-dialog')).not.toHaveAttribute('open', '');
  await expect(page.locator('.hand-rail')).toHaveAttribute('data-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(page.locator('.hand-rail')).toHaveAttribute('data-expanded', 'false');
  await expect(page.locator('[data-toggle-hand]')).toBeFocused();

  const messagesAfterPresentation = await page.evaluate(() => window.__task019WorkerMessages);
  expect(messagesAfterPresentation).toHaveLength(1);
  expect(messagesAfterPresentation[0].projection.legal_intents).toEqual(started.projection.legal_intents);
});

test('Bench and hand children reflow across required desktop, touch, and reduced-motion compositions', async ({ page }, testInfo) => {
  await openSolo(page);
  const desktopViewports = [
    { width: 1366, height: 768 },
    { width: 1920, height: 1080 },
    { width: 1920, height: 960 },
    { width: 2560, height: 1300 },
  ];
  const viewports = testInfo.project.name === 'chromium-desktop' ? desktopViewports : [page.viewportSize()];
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    for (const view of ['Relevant', 'Global']) {
      await page.getByRole('button', { name: view, exact: true }).click();
      await expectDiagnosticAnatomy(page);
      await expectCollapsedHandAnatomy(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
      if (testInfo.project.name === 'chromium-desktop') {
        expect(await page.locator('.game-board').evaluate((board) => innerHeight - board.getBoundingClientRect().bottom)).toBeLessThanOrEqual(12);
      } else {
        for (const selector of ['.diagnostic-bench', '.hand-rail', '.legal-action-panel', '.basic-actions-panel']) {
          expect(await page.locator(selector).evaluate((panel) => panel.getBoundingClientRect().width)).toBeGreaterThan(viewport.width * 0.8);
        }
      }
      if (UPDATE_VISUALS && (viewport.width === 1920 || testInfo.project.name !== 'chromium-desktop')) {
        await page.screenshot({
          path: `tests/visual/task-019/${view.toLowerCase()}-${viewport.width}x${viewport.height}-${testInfo.project.name}.png`,
          fullPage: testInfo.project.name !== 'chromium-desktop',
          animations: 'disabled',
        });
      }
    }
  }
  if (testInfo.project.name === 'chromium-desktop') {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await expect(page.getByRole('button', { name: 'Relevant', exact: true })).toBeVisible();
    await expect(page.locator('.view-full-ticket')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1920);
  }
});
