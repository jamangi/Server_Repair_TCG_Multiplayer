import { expect, test } from '@playwright/test';

const FULL_MOTION = 'chromium-desktop';
const REDUCED_MOTION = 'chromium-reduced-motion';
const UPDATE_VISUALS = process.env.UPDATE_TASK_018_VISUALS === '1';

async function openRoute(page, hash) {
  await page.goto(`/index.html${hash}`);
  await expect(page.locator('#app')).not.toHaveAttribute('aria-busy', 'true');
}

async function openSolo(page, ticketCount = 1) {
  await openRoute(page, '#/play/home');
  await page.locator('#ticket-count').selectOption(String(ticketCount));
  await page.locator('#start-solo').click();
  await expect(page.getByRole('heading', { name: 'Night-shift board' })).toBeVisible({ timeout: 20_000 });
}

async function expectUsableDialog(dialog, contentSelector) {
  await expect(dialog).toBeVisible();
  await expect.poll(() => dialog.evaluate((node, selector) => {
    const content = node.querySelector(selector);
    const dialogBox = node.getBoundingClientRect();
    const contentBox = content?.getBoundingClientRect();
    const opacity = Number.parseFloat(getComputedStyle(node).opacity);
    return {
      open: node.open,
      opaque: opacity >= 0.99,
      contentVisible: Boolean(contentBox
        && contentBox.width > 0
        && contentBox.height > 0
        && contentBox.right > dialogBox.left
        && contentBox.left < dialogBox.right
        && contentBox.bottom > dialogBox.top
        && contentBox.top < dialogBox.bottom),
      closing: node.hasAttribute('data-motion-closing'),
      animations: typeof node.getAnimations === 'function' ? node.getAnimations().length : 0,
    };
  }, contentSelector)).toEqual({
    open: true,
    opaque: true,
    contentVisible: true,
    closing: false,
    animations: 0,
  });
}

async function closeAndExpectRestore(page, dialog, opener, closeName) {
  await dialog.getByRole('button', { name: closeName }).click({ force: true });
  await expect(dialog).toBeHidden();
  await expect.poll(() => dialog.evaluate((node) => ({
    open: node.open,
    closing: node.hasAttribute('data-motion-closing'),
    animations: typeof node.getAnimations === 'function' ? node.getAnimations().length : 0,
  }))).toEqual({ open: false, closing: false, animations: 0 });
  await expect(opener).toBeFocused();
  expect(await page.locator('dialog[open]').count()).toBe(0);
}

async function ticketVisibility(page) {
  return page.locator('.ticket-sheet').evaluate((ticket) => {
    const parseRgb = (value) => (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
    const luminance = (rgb) => rgb.map((channel) => {
      const normalized = channel / 255;
      return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
    const intersect = (left, right) => ({
      left: Math.max(left.left, right.left),
      top: Math.max(left.top, right.top),
      right: Math.min(left.right, right.right),
      bottom: Math.min(left.bottom, right.bottom),
    });
    const ticketBox = ticket.getBoundingClientRect();
    const ticketStyle = getComputedStyle(ticket);
    let visibleBox = {
      left: ticketBox.left + Number.parseFloat(ticketStyle.borderLeftWidth) + Number.parseFloat(ticketStyle.paddingLeft),
      top: ticketBox.top + Number.parseFloat(ticketStyle.borderTopWidth) + Number.parseFloat(ticketStyle.paddingTop),
      right: ticketBox.right - Number.parseFloat(ticketStyle.borderRightWidth) - Number.parseFloat(ticketStyle.paddingRight),
      bottom: ticketBox.bottom - Number.parseFloat(ticketStyle.borderBottomWidth) - Number.parseFloat(ticketStyle.paddingBottom),
    };
    const requiredSelectors = [
      '.ticket-code',
      '#selected-ticket-heading',
      '.ticket-status',
      '.ticket-sheet__symptom',
      '.candidate-chip',
      '.ticket-sheet__revision',
      '.view-full-ticket',
    ];
    const required = requiredSelectors.flatMap((selector) => [...ticket.querySelectorAll(selector)].map((node) => {
      const rect = node.getBoundingClientRect();
      const clipped = intersect(rect, visibleBox);
      const style = getComputedStyle(node);
      return {
        selector,
        text: node.textContent.trim(),
        visibleWidth: Math.max(0, clipped.right - clipped.left),
        visibleHeight: Math.max(0, clipped.bottom - clipped.top),
        width: rect.width,
        height: rect.height,
        visible: style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0,
      };
    }));
    const button = required.find((entry) => entry.selector === '.view-full-ticket');
    const symptom = ticket.querySelector('.ticket-sheet__symptom');
    const foreground = parseRgb(getComputedStyle(symptom).color);
    const background = parseRgb(ticketStyle.backgroundColor);
    const light = Math.max(luminance(foreground), luminance(background));
    const dark = Math.min(luminance(foreground), luminance(background));
    return {
      required,
      buttonFullyVisible: button.visibleWidth >= button.width - 1 && button.visibleHeight >= button.height - 1,
      buttonHeight: button.height,
      contrast: (light + 0.05) / (dark + 0.05),
      foreground: getComputedStyle(symptom).color,
      background: ticketStyle.backgroundColor,
    };
  });
}

async function expectTicketVisible(page) {
  const result = await ticketVisibility(page);
  for (const selector of ['.ticket-code', '#selected-ticket-heading', '.ticket-status', '.ticket-sheet__symptom', '.candidate-chip', '.ticket-sheet__revision', '.view-full-ticket']) {
    expect(result.required.some((entry) => entry.selector === selector), `${selector} is present`).toBe(true);
  }
  for (const entry of result.required) {
    expect(entry.visible, `${entry.selector} “${entry.text}” is rendered`).toBe(true);
    expect(entry.visibleWidth, `${entry.selector} “${entry.text}” has visible width`).toBeGreaterThan(0);
    expect(entry.visibleHeight, `${entry.selector} “${entry.text}” has visible height`).toBeGreaterThan(0);
  }
  expect(result.buttonFullyVisible).toBe(true);
  expect(result.buttonHeight).toBeGreaterThanOrEqual(44);
  expect(result.contrast, `${result.foreground} on ${result.background}`).toBeGreaterThanOrEqual(4.5);
}

test('Inspect and full-Ticket dialogs survive repeated full/reduced-motion lifecycle paths', async ({ page }, testInfo) => {
  test.skip(![FULL_MOTION, REDUCED_MOTION].includes(testInfo.project.name), 'Dialog lifecycle runs with full and reduced motion.');
  if (testInfo.project.name === FULL_MOTION) await page.setViewportSize({ width: 1366, height: 768 });
  await openSolo(page);
  const responseCard = page.locator('.hand-rail__cards .play-card').first();
  await responseCard.click();
  const inspect = page.getByRole('button', { name: 'Inspect', exact: true });
  const cardDialog = page.locator('#game-card-dialog');

  for (let cycle = 0; cycle < 5; cycle += 1) {
    await inspect.click();
    await expectUsableDialog(cardDialog, '.card-detail');
    await closeAndExpectRestore(page, cardDialog, inspect, 'Close Card details');
  }

  await inspect.click();
  await page.evaluate(() => {
    document.querySelector('#game-card-dialog [data-close-dialog]').click();
    document.querySelector('[data-inspect-selected]').click();
  });
  await expectUsableDialog(cardDialog, '.card-detail');
  if (UPDATE_VISUALS && testInfo.project.name === FULL_MOTION) {
    await page.screenshot({ path: 'tests/visual/task-018/reopened-inspect-1366x768.png', animations: 'disabled' });
  }
  await page.keyboard.press('Escape');
  await expect(cardDialog).toBeHidden();
  await expect(inspect).toBeFocused();

  const fullTicket = page.getByRole('button', { name: 'View full Ticket' });
  const ticketDialog = page.locator('#full-ticket-dialog');
  await fullTicket.click();
  await expectUsableDialog(ticketDialog, '.full-ticket-detail');
  await closeAndExpectRestore(page, ticketDialog, fullTicket, 'Close full Ticket');
  await fullTicket.click();
  await expectUsableDialog(ticketDialog, '.full-ticket-detail');
  await page.keyboard.press('Escape');
  await expect(ticketDialog).toBeHidden();
  await expect(fullTicket).toBeFocused();
  await fullTicket.click();
  await expectUsableDialog(ticketDialog, '.full-ticket-detail');
  await ticketDialog.evaluate((node) => node.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await expect(ticketDialog).toBeHidden();
  await expect(fullTicket).toBeFocused();
});

test('Deck, editor, Settings, and route teardown share a safe dialog lifecycle', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== FULL_MOTION, 'Shared dialog variants run once with full motion.');
  await openRoute(page, '#/play/decks');
  const deckInspect = page.locator('[data-inspect-card]').first();
  const deckDialog = page.locator('#deck-card-dialog');
  await deckInspect.click();
  await expectUsableDialog(deckDialog, '.card-detail');
  await closeAndExpectRestore(page, deckDialog, deckInspect, 'Close Card details');
  await deckInspect.click();
  await expectUsableDialog(deckDialog, '.card-detail');
  await page.keyboard.press('Escape');
  await expect(deckInspect).toBeFocused();

  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  const editorInspect = page.getByRole('button', { name: /^Inspect / }).first();
  const editorDialog = page.locator('#editor-card-dialog');
  await editorInspect.click();
  await expectUsableDialog(editorDialog, '.card-detail');
  await closeAndExpectRestore(page, editorDialog, editorInspect, 'Close Card details');

  const settingsTrigger = page.locator('#settings-trigger');
  await settingsTrigger.click();
  let settingsDialog = page.locator('dialog.settings-dialog');
  await expectUsableDialog(settingsDialog, '#settings-form');
  await settingsDialog.getByRole('button', { name: 'Close Settings' }).click();
  await expect(settingsDialog).toBeHidden();
  await expect(settingsTrigger).toBeFocused();
  await settingsTrigger.click();
  settingsDialog = page.locator('dialog.settings-dialog');
  await expectUsableDialog(settingsDialog, '#settings-form');
  await page.keyboard.press('Escape');
  await expect(settingsDialog).toBeHidden();
  await expect(settingsTrigger).toBeFocused();

  await editorInspect.click();
  await expectUsableDialog(editorDialog, '.card-detail');
  await page.evaluate(() => { location.hash = '#/play/profile'; });
  await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();
  expect(await page.locator('dialog[open]').count()).toBe(0);
  expect(await page.evaluate(() => document.activeElement?.isConnected)).toBe(true);
});

test('selected Ticket descendants stay visible and meet contrast at every required composition', async ({ page }, testInfo) => {
  await openSolo(page, 3);
  const viewports = testInfo.project.name === FULL_MOTION
    ? [{ width: 1366, height: 768 }, { width: 1920, height: 1080 }, { width: 1920, height: 960 }]
    : [];
  if (viewports.length === 0) await expectTicketVisible(page);
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    for (const view of ['Relevant', 'Global']) {
      await page.getByRole('button', { name: view, exact: true }).click();
      await expectTicketVisible(page);
      if (UPDATE_VISUALS && viewport.width === 1920 && viewport.height === 960) {
        await page.screenshot({ path: `tests/visual/task-018/ticket-${view.toLowerCase()}-1920x960.png`, animations: 'disabled' });
      }
    }
  }
  if (testInfo.project.name === FULL_MOTION) {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    for (const view of ['Relevant', 'Global']) {
      await page.getByRole('button', { name: view, exact: true }).click();
      await expectTicketVisible(page);
    }
  }
});
