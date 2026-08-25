import { expect, test } from '@playwright/test';

const LOCAL_STATE_KEY = 'server-repair-tcg:solo-pages-v2:state';

async function openRoute(page, hash) {
  await page.goto(`/index.html${hash}`);
  await expect(page.locator('#app')).not.toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('#play-page .play-route')).toBeVisible();
}

test('Home, Decks, and Match start expose the expanded playable coverage without repetition', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Expanded coverage start runs once on desktop.');
  await openRoute(page, '#/play/home');
  await expect(page.locator('.active-deck-summary')).toContainText('12 of 12');
  await expect(page.locator('.active-deck-summary')).toContainText('Repetition can begin at Ticket 13');
  await page.locator('#ticket-count').selectOption('10');
  await expect(page.locator('#duplicate-disclosure')).toBeHidden();

  await openRoute(page, '#/play/decks');
  await expect(page.locator('.deck-inspector')).toContainText('12 / 12 fingerprints');
  await expect(page.locator('.deck-inspector')).toContainText('boot 2');
  await expect(page.locator('.deck-inspector')).toContainText('memory 2');
  await expect(page.locator('.deck-inspector')).toContainText('network 2');
  await expect(page.locator('.deck-inspector')).toContainText('power 2');
  await expect(page.locator('.deck-inspector')).toContainText('storage 2');
  await expect(page.locator('.deck-inspector')).toContainText('thermal 2');

  await openRoute(page, '#/play/home');
  await page.locator('#ticket-count').selectOption('10');
  await page.locator('#start-solo').click();
  await expect(page.getByRole('heading', { name: 'Night-shift board' })).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.ticket-card')).toHaveCount(10);
  await expect(page.locator('.game-disclosure')).toHaveCount(0);
  const started = await page.evaluate(() => window.location.hash);
  expect(started).toBe('#/play/game');
});

test('a legal response deck with no complete path is blocked before Worker Match creation', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Preflight failure runs once on desktop.');
  await openRoute(page, '#/play/home');
  await expect(page.locator('.active-deck-summary')).toContainText('12 of 12');
  await page.evaluate(({ storageKey, repairIds }) => {
    const state = JSON.parse(localStorage.getItem(storageKey));
    state.records.decks.decks[0].card_definition_ids = repairIds.flatMap((id) => Array(6).fill(id));
    state.records.decks.decks[0].source_deck_id = null;
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, {
    storageKey: LOCAL_STATE_KEY,
    repairIds: [
      'card.response.repair.boot.correct_order',
      'card.response.repair.memory.replace_dimm',
      'card.response.repair.memory.reseat_dimm',
      'card.response.repair.network.correct_static_ip',
      'card.response.repair.network.replace_cable',
    ],
  });

  await page.getByRole('link', { name: 'Decks', exact: true }).click();
  await expect(page.locator('.deck-inspector')).toContainText('Validity');
  await expect(page.locator('.deck-inspector')).toContainText('Legal');
  await expect(page.locator('.deck-inspector')).toContainText('no complete supported Repair/Verify path');

  await page.getByRole('link', { name: 'Home', exact: true }).click();
  await expect(page.locator('.active-deck-summary')).toContainText('0 of 12');
  await expect(page.locator('.active-deck-summary')).toContainText('No Match can start');
  await expect(page.locator('#start-solo')).toBeDisabled();
});
