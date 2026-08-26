import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const UPDATE_VISUALS = process.env.UPDATE_TASK_023_VISUALS === '1';
const PLAY_CSS = await readFile(new URL('../../viewer/css/play.css', import.meta.url), 'utf8');

async function openSolo(page) {
  await page.addInitScript(() => {
    Object.defineProperty(Crypto.prototype, 'randomUUID', {
      configurable: true,
      value: () => '00000000-0000-4000-8000-000000002301',
    });
  });
  await page.goto('/index.html#/play/home');
  await expect(page.locator('#app')).not.toHaveAttribute('aria-busy', 'true');
  await page.locator('#start-solo').click();
  await expect(page.getByRole('heading', { name: 'Night-shift board' })).toBeVisible({ timeout: 20_000 });
}

async function colorMetrics(locator) {
  return locator.evaluate((node) => {
    const rgb = (value) => (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
    const luminance = (value) => rgb(value).map((channel) => {
      const normalized = channel / 255;
      return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
    const ratio = (left, right) => {
      const values = [luminance(left), luminance(right)].sort((a, b) => b - a);
      return (values[0] + 0.05) / (values[1] + 0.05);
    };
    const opaqueBackground = (element) => {
      for (let current = element; current; current = current.parentElement) {
        const value = getComputedStyle(current).backgroundColor;
        const channels = value.match(/[\d.]+/g) ?? [];
        if (channels.length < 4 || Number(channels[3]) >= 0.99) return value;
      }
      return 'rgb(255, 255, 255)';
    };
    const style = getComputedStyle(node);
    const background = opaqueBackground(node);
    const parentBackground = opaqueBackground(node.parentElement);
    return {
      text: ratio(style.color, background),
      border: ratio(style.borderTopColor, background),
      adjacentBorder: ratio(style.borderTopColor, parentBackground),
      color: style.color,
      background,
      borderColor: style.borderTopColor,
      borderStyle: style.borderTopStyle,
      focus: ratio(style.outlineColor, parentBackground),
      outlineStyle: style.outlineStyle,
      opacity: Number(style.opacity),
      decoration: style.textDecorationLine,
      overflow: node.scrollWidth - node.clientWidth,
      heightOverflow: node.scrollHeight - node.clientHeight,
      disabled: 'disabled' in node ? node.disabled : null,
      paperSurface: Boolean(node.closest('[data-semantic-surface="paper"]')),
      classes: node.className,
    };
  });
}

function expectContrast(metrics, textMinimum = 4.5) {
  expect(metrics.text, JSON.stringify(metrics)).toBeGreaterThanOrEqual(textMinimum);
  expect(metrics.border, `${metrics.borderColor} against ${metrics.background}`).toBeGreaterThanOrEqual(3);
  expect(metrics.opacity).toBe(1);
  expect(metrics.overflow).toBeLessThanOrEqual(1);
  expect(metrics.heightOverflow).toBeLessThanOrEqual(1);
}

async function hypothesizeFirstCandidate(page) {
  await page.getByRole('button', { name: 'View full Ticket' }).click();
  const row = page.locator('#full-ticket-dialog .candidate-row:has(button:text-is("Hypothesize"))').first();
  const candidateId = await row.getAttribute('data-candidate-id');
  await row.getByRole('button', { name: 'Hypothesize' }).click();
  const chip = page.locator(`.ticket-sheet .candidate-chip[data-candidate-id="${candidateId}"]`);
  await expect(chip).toHaveAttribute('data-candidate-state', 'hypothesis');
  return chip;
}

test('the real compact Ticket keeps ordinary and hypothesized Candidates readable on paper', async ({ page }, testInfo) => {
  await openSolo(page);
  const ticket = page.locator('.ticket-sheet');
  const symptom = ticket.locator('.ticket-sheet__symptom');
  const symptomBefore = await symptom.evaluate((node) => ({ text: node.textContent, color: getComputedStyle(node).color }));
  const ordinary = ticket.locator('.candidate-chip[data-candidate-state="candidate"]').first();
  await expect(ordinary).toBeVisible();
  expectContrast(await colorMetrics(ordinary));

  const hypothesis = await hypothesizeFirstCandidate(page);
  await expect(hypothesis.getByText('Hypothesis', { exact: true })).toBeVisible();
  expectContrast(await colorMetrics(hypothesis), 7);
  await hypothesis.hover();
  expectContrast(await colorMetrics(hypothesis), 7);

  const symptomAfter = await symptom.evaluate((node) => ({ text: node.textContent, color: getComputedStyle(node).color }));
  expect(symptomAfter).toEqual(symptomBefore);
  expect((await colorMetrics(symptom)).text).toBeGreaterThanOrEqual(4.5);
  const fullTicketButton = ticket.getByRole('button', { name: 'View full Ticket' });
  await page.locator('.ticket-card').last().focus();
  for (let index = 0; index < 4 && !await fullTicketButton.evaluate((node) => node === document.activeElement); index += 1) {
    await page.keyboard.press('Tab');
  }
  await expect(fullTicketButton).toBeFocused();
  const focusedControl = await colorMetrics(fullTicketButton);
  expect(focusedControl.outlineStyle).not.toBe('none');
  expect(focusedControl.focus).toBeGreaterThanOrEqual(3);
  await expect(ticket).toHaveAttribute('aria-current', 'true');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0.5);

  if (UPDATE_VISUALS) {
    await page.screenshot({
      path: `tests/visual/task-023/hypothesis-paper-${testInfo.project.name}.png`,
      fullPage: testInfo.project.name !== 'chromium-desktop',
      animations: 'disabled',
    });
  }

  if (testInfo.project.name === 'chromium-desktop') {
    await page.setViewportSize({ width: 1366, height: 768 });
    await expect(page.locator('[data-bench-page-size]')).toHaveAttribute('data-bench-page-size', '4');
    await expect(hypothesis).toBeVisible();
    expectContrast(await colorMetrics(hypothesis), 7);
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('[data-bench-page-size]')).toHaveAttribute('data-bench-page-size', '6');
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await expect(hypothesis.getByText('Hypothesis', { exact: true })).toBeVisible();
    expectContrast(await colorMetrics(hypothesis), 7);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0.5);
  }
});

test('full Ticket paper states and dark Evidence states keep distinct accessible palettes', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'The state palette audit runs once on desktop.');
  await openSolo(page);
  await page.getByRole('button', { name: 'View full Ticket' }).click();
  const dialog = page.locator('#full-ticket-dialog');
  await expect(dialog.locator('[data-semantic-surface="paper"]')).toBeVisible();

  const ordinaryCandidate = dialog.locator('.candidate-row[data-candidate-state="candidate"]').first();
  const candidateId = await ordinaryCandidate.getAttribute('data-candidate-id');
  const ordinary = dialog.locator(`.candidate-row[data-candidate-id="${candidateId}"]`);
  expectContrast(await colorMetrics(ordinary));
  await ordinary.evaluate((node) => {
    node.classList.add('is-hypothesis');
    node.dataset.candidateState = 'hypothesis';
    node.querySelector('div:first-child').insertAdjacentHTML('beforeend', '<small class="candidate-marker">Current hypothesis</small>');
  });
  expectContrast(await colorMetrics(ordinary), 7);
  await ordinary.evaluate((node) => {
    node.classList.remove('is-hypothesis');
    node.classList.add('is-eliminated');
    node.dataset.candidateState = 'ruled-out';
    const marker = node.querySelector('.candidate-marker') ?? document.createElement('small');
    marker.className = 'candidate-marker';
    marker.textContent = 'Ruled out for this diagnosis stage';
    if (!marker.isConnected) node.querySelector('div:first-child').append(marker);
  });
  const ruledOut = await colorMetrics(ordinary);
  expectContrast(ruledOut, 7);
  expect(ruledOut.decoration).toContain('line-through');

  const isolation = dialog.locator('.accepted-isolation');
  await isolation.evaluate((node) => { node.dataset.isolationState = 'accepted'; });
  expectContrast(await colorMetrics(isolation), 7);
  await dialog.locator('[data-semantic-surface="paper"]').evaluate((node) => {
    node.insertAdjacentHTML('beforeend', '<button type="button" class="basic-action task-023-disabled-fixture" disabled>Unavailable action</button>');
  });
  const disabled = dialog.locator('.task-023-disabled-fixture');
  const disabledMetrics = await colorMetrics(disabled);
  expect(disabledMetrics.disabled, JSON.stringify(disabledMetrics)).toBe(true);
  expect(disabledMetrics.paperSurface, JSON.stringify(disabledMetrics)).toBe(true);
  expectContrast(disabledMetrics, 7);

  await dialog.getByRole('button', { name: 'Close full Ticket' }).click();
  const ticket = page.locator('.ticket-sheet');
  await ticket.evaluate((node) => {
    node.classList.add('is-returned');
    const status = node.querySelector('.ticket-status');
    status.dataset.status = 'RETURNED_TO_DIAGNOSIS';
    status.textContent = 'Returned to Diagnosis';
  });
  const returned = await colorMetrics(ticket.locator('.ticket-status'));
  expectContrast(returned, 7);
  await expect(ticket.locator('.ticket-status')).toHaveText('Returned to Diagnosis');

  const evidence = page.locator('.evidence-panel');
  await evidence.evaluate((node) => node.insertAdjacentHTML('beforeend', '<span class="evidence-disposition evidence-disposition--confirm"><strong>CONFIRM</strong>Candidate retained</span>'));
  const darkDisposition = await colorMetrics(evidence.locator('.evidence-disposition--confirm'));
  expect(darkDisposition.text).toBeGreaterThanOrEqual(4.5);
  expect(darkDisposition.background).not.toBe(returned.background);
});

test('forced colors preserves Ticket labels, borders, and non-color state cues', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Forced-colors emulation runs once on desktop.');
  await page.emulateMedia({ forcedColors: 'active' });
  await page.setContent(`<style>${PLAY_CSS}</style><main class="play-app"><section class="ticket-sheet"><p class="ticket-sheet__symptom"><strong>Symptom:</strong> Wrong Boot Device</p><span class="ticket-status" data-status="RETURNED_TO_DIAGNOSIS">Returned to Diagnosis</span><ul class="candidate-chip-row"><li class="candidate-chip is-hypothesis" data-candidate-state="hypothesis"><span>Incorrect Boot Order</span><small>Hypothesis</small></li></ul><button type="button" class="play-button view-full-ticket">View full Ticket</button></section></main>`);
  const hypothesis = page.locator('.ticket-sheet .candidate-chip');
  await expect(hypothesis.getByText('Hypothesis', { exact: true })).toBeVisible();
  const metrics = await colorMetrics(hypothesis);
  expect(metrics.borderStyle).not.toBe('none');
  await expect(page.locator('.ticket-sheet__symptom')).toContainText('Symptom:');
  await expect(page.locator('.ticket-sheet .ticket-status')).toHaveText('Returned to Diagnosis');
  await expect(page.getByRole('button', { name: 'View full Ticket' })).toBeVisible();
});
