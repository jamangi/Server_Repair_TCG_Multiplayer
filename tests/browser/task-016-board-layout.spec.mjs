import { expect, test } from '@playwright/test';

async function openSolo(page, ticketCount = 3, seed = 16) {
  await page.addInitScript((stableSeed) => {
    Object.defineProperty(Crypto.prototype, 'randomUUID', {
      configurable: true,
      value: () => `00000000-0000-4000-8000-${String(stableSeed).padStart(12, '0')}`,
    });
  }, seed);
  await page.goto('/index.html#/play/home');
  await expect(page.locator('#app')).not.toHaveAttribute('aria-busy', 'true');
  await page.locator('#ticket-count').selectOption(String(ticketCount));
  await page.locator('#start-solo').click();
  await expect(page.getByRole('heading', { name: 'Night-shift board' })).toBeVisible({ timeout: 20_000 });
}

async function box(page, selector) {
  return page.locator(selector).evaluate((element) => element.getBoundingClientRect().toJSON());
}

async function capture(page, testInfo, name) {
  if (!process.env.UPDATE_TASK_016_VISUALS) return;
  await page.screenshot({
    path: `tests/visual/task-016/${name}-${testInfo.project.name}.png`,
    fullPage: true,
    animations: 'disabled',
  });
}

test('board preserves the approved desktop viewport composition and bounded overflow', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Desktop breakpoint and short-laptop regression.');
  await openSolo(page, 3, 1601);

  for (const viewport of [{ width: 1920, height: 1080 }, { width: 1600, height: 1000 }, { width: 1366, height: 768 }]) {
    await page.setViewportSize(viewport);
    await expect(page.locator('.game-board')).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      documentHeight: document.documentElement.scrollHeight,
      documentWidth: document.documentElement.scrollWidth,
      innerHeight,
      innerWidth,
    }));
    expect(dimensions.documentHeight).toBeLessThanOrEqual(dimensions.innerHeight);
    expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.innerWidth);

    const queue = await box(page, '.ticket-queue');
    const center = await box(page, '.board-center');
    const rail = await box(page, '.investigation-rail');
    const board = await box(page, '.game-board');
    expect(queue.right).toBeLessThan(center.left);
    expect(center.right).toBeLessThan(rail.left);
    expect(Math.abs(queue.height - board.height)).toBeLessThan(2);
    for (const selector of ['.ticket-sheet', '.diagnostic-bench', '.hand-rail', '.intelligence-panel', '.legal-action-panel', '.basic-actions-panel']) {
      const panel = await box(page, selector);
      expect(panel.top, `${selector} begins inside the viewport`).toBeGreaterThanOrEqual(board.top - 1);
      expect(panel.bottom, `${selector} ends inside the viewport`).toBeLessThanOrEqual(viewport.height + 1);
    }
    expect(await page.locator('.ticket-sheet').evaluate((element) => element.scrollHeight - element.clientHeight)).toBeLessThanOrEqual(2);
    expect(await page.locator('.legal-action-panel').evaluate((element) => element.scrollHeight - element.clientHeight)).toBeLessThanOrEqual(2);
  }

  await expect(page.locator('.diagnostic-tile')).toHaveCount(6);
  await expect(page.locator('.closed-ticket-list')).not.toHaveAttribute('open', '');
  await capture(page, testInfo, 'relevant-short-laptop');

  const opener = page.getByRole('button', { name: 'View full Ticket' });
  await opener.click();
  await expect(page.locator('#full-ticket-dialog')).toBeVisible();
  expect(await page.locator('#full-ticket-dialog .candidate-row').count()).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Close full Ticket' }).click();
  await expect(opener).toBeFocused();
});

test('Global filters, pagination, and projection-derived Runnable state survive Ticket switches', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Catalog-state continuity is covered once on desktop.');
  await openSolo(page, 3, 1602);
  await page.getByRole('button', { name: 'Global', exact: true }).click();
  await expect(page.locator('.diagnostic-tile')).toHaveCount(8);
  await page.locator('[data-bench-search]').fill('test');
  await page.locator('[data-bench-sort]').selectOption('COST');
  await page.locator('[data-bench-category]').selectOption({ index: 1 });
  await page.locator('[data-bench-relevant]').check();
  await page.locator('[data-bench-runnable]').check();
  const selectedCategory = await page.locator('[data-bench-category]').inputValue();
  const secondTicket = page.locator('.ticket-card').nth(1);
  await secondTicket.click();
  await expect(page.locator('[data-bench-search]')).toHaveValue('test');
  await expect(page.locator('[data-bench-sort]')).toHaveValue('COST');
  await expect(page.locator('[data-bench-category]')).toHaveValue(selectedCategory);
  await expect(page.locator('[data-bench-relevant]')).toBeChecked();
  await expect(page.locator('[data-bench-runnable]')).toBeChecked();
  await expect(page.locator('.diagnostic-bench__count')).toContainText(/Showing \d+–\d+ of \d+|Showing 0–0 of 0/);

  await page.locator('[data-bench-search]').fill('');
  await page.locator('[data-bench-category]').selectOption('ALL');
  await page.locator('[data-bench-relevant]').uncheck();
  await page.locator('[data-bench-runnable]').uncheck();
  await page.locator('[data-bench-page="2"]').click();
  await expect(page.locator('.diagnostic-bench__count')).toContainText('Showing 9–16');
  await capture(page, testInfo, 'global-catalog');
});

test('ten-Ticket queue is internally bounded while the desktop board stays fixed', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Maximum queue regression is desktop-specific.');
  await openSolo(page, 10, 1610);
  await expect(page.locator('.ticket-card')).toHaveCount(10);
  const overflow = await page.locator('.ticket-queue__list').evaluate((element) => ({
    client: element.clientHeight,
    scroll: element.scrollHeight,
  }));
  expect(overflow.scroll).toBeGreaterThan(overflow.client);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(1000);
});

test('tablet and phone follow queue, Ticket, intelligence, bench, hand, and action hierarchy', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'chromium-desktop', 'Responsive hierarchy is covered by touch-sized projects.');
  await openSolo(page, 3, 1616);
  const selectors = ['.ticket-queue', '.ticket-sheet', '.intelligence-panel', '.diagnostic-bench', '.hand-rail', '.legal-action-panel', '.basic-actions-panel'];
  const tops = [];
  for (const selector of selectors) tops.push((await box(page, selector)).top);
  expect(tops).toEqual([...tops].sort((left, right) => left - right));
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => innerWidth));
  const compactControls = page.locator('.basic-actions-panel :is(button, select):visible');
  for (const control of await compactControls.all()) {
    expect((await control.boundingBox()).height).toBeGreaterThanOrEqual(44);
  }
  await expect(page.locator('.basic-actions-panel')).toHaveCSS('position', testInfo.project.name.includes('mobile') || testInfo.project.name.includes('reduced') ? 'sticky' : 'static');
  await capture(page, testInfo, 'responsive-hierarchy');
});

test('board landmarks, dialogs, live regions, and controls retain accessible names', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Semantic audit is deterministic across layouts.');
  await openSolo(page, 1, 1617);
  await expect(page.getByRole('complementary', { name: 'Active Tickets' })).toBeVisible();
  await expect(page.getByRole('main').getByRole('main')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Diagnostic Bench' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Legal Action' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Basic Actions' })).toBeVisible();
  expect(await page.locator('[id]').evaluateAll((elements) => elements.length - new Set(elements.map((element) => element.id)).size)).toBe(0);
  expect(await page.locator('*').count()).toBeLessThan(900);
  await expect(page.locator('.diagnostic-bench__count')).toHaveAttribute('aria-live', 'polite');
  await expect(page.locator('#announcer')).toHaveAttribute('role', 'status');
  await page.getByRole('button', { name: 'View full Ticket' }).click();
  await expect(page.getByRole('dialog', { name: /Intermittent|Cooling|Network|Memory|Power|Boot|Storage|Temperature/i })).toBeVisible();
});
