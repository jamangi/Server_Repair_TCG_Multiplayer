import { expect, test } from '@playwright/test';

const MEMORY_DESCRIPTION = 'Exercises dual in-line memory modules (DIMMs) with memory patterns and sustained access while observing error-correcting code (ECC) reports, failures, and affected locations.';

async function ready(page, hash) {
  await page.goto(`/index.html${hash}`);
  await expect(page.locator('#app')).not.toHaveAttribute('aria-busy', 'true');
}

async function startSolo(page) {
  await ready(page, '#/play/home');
  await page.locator('#ticket-count').selectOption('3');
  await page.locator('#start-solo').click();
  await expect(page.getByRole('heading', { name: 'Night-shift board' })).toBeVisible({ timeout: 20_000 });
}

test('Library, Bench, hand, and Deck Inspect share domain-authored technical meaning', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Cross-surface content contract runs once on desktop.');

  await ready(page, '#/library/test.memory.diagnostic');
  const libraryDialog = page.locator('#dialog');
  await expect(libraryDialog).toBeVisible();
  await expect(libraryDialog.getByRole('heading', { name: 'What it does' })).toBeVisible();
  await expect(libraryDialog.locator('.library-learning-section').first()).toContainText(MEMORY_DESCRIPTION);
  await expect(libraryDialog).toContainText('dual in-line memory module');
  await expect(libraryDialog).toContainText('error-correcting code');
  await expect(libraryDialog.locator('.library-advanced')).not.toHaveAttribute('open', '');
  const visibleReferenceNames = await libraryDialog.locator('.library-reference-list a').allTextContents();
  expect(visibleReferenceNames.every((name) => !/^\w+\.[a-z0-9_.-]+$/.test(name))).toBe(true);
  await page.getByRole('button', { name: 'Close details' }).click();
  await expect(page).toHaveURL(/#\/library$/);

  await ready(page, '#/library/test.power.distribution_path_isolation');
  await expect(page.getByRole('heading', { name: 'Safety note' })).toBeVisible();
  await expect(page.locator('#dialog')).toContainText('Do not live-probe undocumented connectors');

  await ready(page, '#/play/decks');
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Edit response kit' })).toBeVisible();
  for (const domainId of ['repair.memory.replace_dimm', 'verify.memory.full_test']) {
    const inspect = page.locator(`.deck-card-tile[data-card-id="card.response.${domainId}"] .play-button--quiet`);
    await inspect.click();
    const deckDialog = page.locator('#editor-card-dialog');
    await expect(deckDialog).toBeVisible();
    await expect(deckDialog.getByText('What it does', { exact: true })).toBeVisible();
    await expect(deckDialog.getByText('In this game', { exact: true })).toBeVisible();
    await expect(deckDialog.locator('.card-detail__reference-name').first()).not.toHaveText(domainId);
    await page.getByRole('button', { name: 'Close Card details' }).click();
  }

  await startSolo(page);
  await page.getByRole('button', { name: 'Global', exact: true }).click();
  await page.locator('[data-bench-search]').fill('Memory Diagnostic');
  const memoryTile = page.locator('.diagnostic-tile:has(.play-card[data-card-id="card.bench.test.memory.diagnostic"])');
  await memoryTile.locator('[data-inspect-diagnostic]').click();
  const gameDialog = page.locator('#game-card-dialog');
  await expect(gameDialog).toBeVisible();
  await expect(gameDialog.locator('.card-detail__description')).toHaveText(MEMORY_DESCRIPTION);
  await expect(gameDialog.getByText('In this game', { exact: true })).toBeVisible();
  await expect(gameDialog.locator('.card-detail__advanced')).not.toHaveAttribute('open', '');
  await page.getByRole('button', { name: 'Close Card details' }).click();
});

test('technical Library detail remains readable and navigable across the browser matrix', async ({ page }) => {
  await ready(page, '#/library/command.linux.lspci');
  const dialog = page.locator('#dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'What it does' })).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Technical method' })).toBeVisible();
  await expect(dialog).toContainText('Platform');
  await expect(dialog).toContainText('Syntax');
  await expect(dialog.locator('.library-reference-list a').first()).toHaveAttribute('href', /^#\/library\//);
  const overflow = await dialog.evaluate((node) => ({
    horizontal: node.scrollWidth - node.clientWidth,
    viewportRight: node.getBoundingClientRect().right - window.innerWidth,
  }));
  expect(overflow.horizontal).toBeLessThanOrEqual(1);
  expect(overflow.viewportRight).toBeLessThanOrEqual(1);
});
