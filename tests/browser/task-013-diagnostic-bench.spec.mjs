import { expect, test } from '@playwright/test';

async function openSolo(page) {
  await page.addInitScript(() => {
    const inbound = [];
    Object.defineProperty(window, '__task013WorkerMessages', { value: inbound });
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
      value: () => '00000000-0000-4000-8000-131313131313',
    });
  });
  await page.goto('/index.html#/play/home');
  await expect(page.locator('#app')).not.toHaveAttribute('aria-busy', 'true');
  await page.locator('#ticket-count').selectOption('1');
  await page.locator('#start-solo').click();
  await expect(page.getByRole('heading', { name: 'Diagnostic Bench' })).toBeVisible({ timeout: 20_000 });
}

test('Relevant and Global organize one Bench without authority changes and Give Up reveals privately', async ({ page }, testInfo) => {
  test.skip(!['chromium-desktop', 'chromium-mobile'].includes(testInfo.project.name), 'Bench smoke runs at desktop and narrow layouts.');
  await openSolo(page);

  const initial = await page.evaluate(() => window.__task013WorkerMessages.find((message) => message.type === 'MATCH_STARTED'));
  expect(initial.projection.view.diagnostic_bench).toHaveLength(50);
  expect(initial.projection.view.hand).toHaveLength(6);
  expect(initial.projection.view.diagnostic_relevance_notice).toContain('graph may be incomplete');
  const revision = initial.projection.view.revision;
  const legalIntents = initial.projection.legal_intents;

  const relevant = page.getByRole('button', { name: 'Relevant', exact: true });
  const global = page.getByRole('button', { name: 'Global', exact: true });
  await expect(relevant).toHaveAttribute('aria-pressed', 'true');
  await global.click();
  await expect(global).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-bench-search]')).toBeVisible();
  await expect(page.locator('.diagnostic-tile')).toHaveCount(8);
  expect(await page.evaluate(() => window.__task013WorkerMessages.length)).toBe(1);

  const latest = await page.evaluate(() => window.__task013WorkerMessages.at(-1));
  expect(latest.projection.view.revision).toBe(revision);
  expect(latest.projection.legal_intents).toEqual(legalIntents);

  await page.locator('[data-bench-search]').fill('smartctl');
  await expect(page.locator('.diagnostic-tile')).toHaveCount(1);
  await expect(page.locator('.diagnostic-bench__count')).toContainText('Showing 1–1 of 1');
  await page.locator('.diagnostic-tile button[data-select-diagnostic]').click();
  await expect(page.locator('.selected-card-actions')).toContainText('COMMAND');
  await expect(page.locator('.selected-card-actions')).toContainText('1 Action');
  const run = page.locator('.selected-card-actions [data-intent-id]').first();
  const messagesBeforeRun = await page.evaluate(() => window.__task013WorkerMessages.length);
  await run.click();
  await expect.poll(() => page.evaluate(() => window.__task013WorkerMessages.length)).toBeGreaterThan(messagesBeforeRun);
  const resolved = await page.evaluate(() => [...window.__task013WorkerMessages].reverse()
    .find((message) => message.type === 'INTENT_RESOLVED'));
  expect(resolved.result.accepted).toBe(true);
  expect(resolved.result.target_summary).toBeTruthy();
  expect(resolved.result.result_summary).toBeTruthy();
  expect(resolved.events.some((event) => event.event_type === 'EVIDENCE_CREATED')).toBe(true);
  expect(resolved.projection.view.diagnostic_bench).toHaveLength(50);

  const giveUp = page.getByRole('button', { name: 'Give Up', exact: true });
  const dialogPromise = page.waitForEvent('dialog');
  const giveUpClick = giveUp.click();
  const dialog = await dialogPromise;
  expect(dialog.message()).toContain('complete solution revealed');
  await dialog.accept();
  await giveUpClick;
  await expect(page.getByRole('heading', { name: 'Shift ended' })).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.solution-reveal')).toContainText('Causal truth');
  await expect(page.locator('.solution-reveal')).toContainText('No further play can target this archived Ticket');
  await expect(page.getByText('Tickets given up').locator('..')).toContainText('1');
});
