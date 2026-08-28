import { expect, test } from '@playwright/test';

const UPDATE_VISUALS = process.env.UPDATE_TASK_025_VISUALS === '1';

async function installWorkerProbe(page) {
  await page.addInitScript(() => {
    const inbound = [];
    const outbound = [];
    Object.defineProperties(window, {
      __task025WorkerMessages: { value: inbound },
      __task025WorkerRequests: { value: outbound },
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
}

async function latestMessage(page) {
  return page.evaluate(() => [...window.__task025WorkerMessages].reverse()
    .find((message) => message.type === 'MATCH_STARTED' || message.type === 'INTENT_RESOLVED'));
}

async function waitForWorkerMessage(page, before) {
  await expect.poll(() => page.evaluate(() => window.__task025WorkerMessages.length)).toBeGreaterThan(before);
  return latestMessage(page);
}

async function startMatch(page, ticketCount = 2) {
  await installWorkerProbe(page);
  await page.goto('/index.html#/play/home');
  await expect(page.locator('#app')).not.toHaveAttribute('aria-busy', 'true');
  await page.locator('#ticket-count').selectOption(String(ticketCount));
  await page.locator('#start-solo').click();
  await expect(page.getByRole('heading', { name: 'Night-shift board' })).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.ticket-card')).toHaveCount(ticketCount);
}

async function selectAndRunDiagnostic(page, projection, attemptedIds) {
  const ticketId = projection.view.public_match.repair_queue[0].ticket_instance_id;
  const benchById = new Map(projection.view.diagnostic_bench.map((entry) => [entry.card_instance_id, entry]));
  const intents = projection.legal_intents.filter((intent) => intent.action_type === 'RUN_TEST'
    && intent.ticket_instance_id === ticketId
    && !attemptedIds.has(intent.card_instance_id));
  const intent = intents.find((candidate) => benchById.get(candidate.card_instance_id)?.action_cost === 0)
    ?? intents[0];
  expect(intent, 'Expected a projected persistent diagnostic').toBeTruthy();
  attemptedIds.add(intent.card_instance_id);
  let diagnostic = page.locator(`[data-select-diagnostic="${intent.card_instance_id}"]`);
  if (!await diagnostic.count()) {
    await page.getByRole('button', { name: 'Global', exact: true }).click();
    await page.locator('[data-bench-search]').fill(intent.card_definition_id);
    diagnostic = page.locator(`[data-select-diagnostic="${intent.card_instance_id}"]`);
  }
  await diagnostic.click();
  const before = await page.evaluate(() => window.__task025WorkerMessages.length);
  await page.locator(`[data-intent-id="${intent.intent_id}"]`).click();
  return waitForWorkerMessage(page, before);
}

test('Document preview is exact and cancellable, submits once, then archived review stays read only', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'The full authoritative path and visual evidence run once on desktop.');
  await startMatch(page, 2);
  const attempted = new Set();
  let message = await latestMessage(page);
  message = await selectAndRunDiagnostic(page, message.projection, attempted);
  message = await selectAndRunDiagnostic(page, message.projection, attempted);

  const projection = message.projection;
  const ticketId = projection.view.public_match.repair_queue[0].ticket_instance_id;
  const intents = projection.legal_intents.filter((intent) => intent.action_type === 'DOCUMENT_LIVE'
    && intent.ticket_instance_id === ticketId);
  expect(intents.length).toBeGreaterThanOrEqual(2);
  const labels = await page.locator('.legal-action-panel [data-preview-document]').allTextContents();
  expect(new Set(labels).size).toBe(labels.length);

  const intent = intents[0];
  const source = projection.view.documentable_actions.find((entry) =>
    entry.source_action_event_id === intent.source_action_event_id);
  const ticket = projection.view.public_match.repair_queue.find((entry) => entry.ticket_instance_id === ticketId);
  const worklogBefore = ticket.worklog.find((entry) => entry.placeholder_event_id === source.worklog_placeholder_event_id);
  const resultEvent = projection.view.authorized_events.find((event) => event.event_id === source.source_result_event_id);
  const sourceButton = page.locator(`.legal-action-panel [data-preview-document="${intent.intent_id}"]`);
  const selectedBefore = await page.locator('.ticket-card[aria-current="true"]').getAttribute('data-ticket-id');
  const requestsBeforeCancel = await page.evaluate(() => window.__task025WorkerRequests.length);

  await sourceButton.focus();
  await page.keyboard.press('Space');
  const preview = page.locator('#document-preview-dialog');
  await expect(preview).toBeVisible();
  await expect(preview).toContainText(ticketId);
  await expect(preview).toContainText('Original Worklog');
  await expect(preview).toContainText(`#${worklogBefore.sequence}`);
  await expect(preview).toContainText(intent.source_action_event_id);
  await expect(preview).toContainText(source.source_result_event_id);
  await expect(preview).toContainText(resultEvent.payload.public_summary);
  await expect(preview).toContainText('1 Action');
  await expect(preview).toContainText(source.recovery_available
    ? 'returns from discard'
    : 'Diagnostic Bench item remains available');
  await page.locator('[data-cancel-document]').click();
  await expect(preview).not.toBeVisible();
  await expect(sourceButton).toBeFocused();
  expect(await page.evaluate(() => window.__task025WorkerRequests.length)).toBe(requestsBeforeCancel);
  await expect(page.locator('.ticket-card[aria-current="true"]')).toHaveAttribute('data-ticket-id', selectedBefore);

  await sourceButton.click();
  await page.keyboard.press('Escape');
  await expect(preview).not.toBeVisible();
  await expect(sourceButton).toBeFocused();
  await sourceButton.click();
  await preview.click({ position: { x: 2, y: 2 } });
  await expect(preview).not.toBeVisible();
  expect(await page.evaluate(() => window.__task025WorkerRequests.length)).toBe(requestsBeforeCancel);

  await sourceButton.click();
  if (UPDATE_VISUALS) {
    await page.waitForTimeout(400);
    await preview.screenshot({ path: 'tests/visual/task-025/document-preview-chromium-desktop.png' });
  }
  const messagesBeforeSubmit = await page.evaluate(() => window.__task025WorkerMessages.length);
  const submitRequestsBefore = await page.evaluate(() => window.__task025WorkerRequests
    .filter((request) => request.type === 'SUBMIT_INTENT').length);
  await page.locator('[data-submit-document]').evaluate((button) => {
    button.click();
    button.click();
  });
  message = await waitForWorkerMessage(page, messagesBeforeSubmit);
  const submitRequestsAfter = await page.evaluate(() => window.__task025WorkerRequests
    .filter((request) => request.type === 'SUBMIT_INTENT').length);
  expect(submitRequestsAfter - submitRequestsBefore).toBe(1);
  expect(message.result.accepted).toBe(true);
  expect(message.result.actions_spent).toBe(1);
  await expect(preview).not.toBeVisible();
  await expect(page.locator('[data-panel="worklog"]')).toBeVisible();

  const enriched = message.projection.view.public_match.repair_queue
    .find((entry) => entry.ticket_instance_id === ticketId).worklog
    .find((entry) => entry.placeholder_event_id === source.worklog_placeholder_event_id);
  expect(enriched.sequence).toBe(worklogBefore.sequence);
  expect(enriched.action_time).toBe(worklogBefore.action_time);
  expect(enriched.publication_time).toBeTruthy();
  expect(enriched.public_result_summary).toBe(resultEvent.payload.public_summary);
  const enrichedEntry = page.locator(`[data-event-id="${source.worklog_placeholder_event_id}"]`);
  await expect(enrichedEntry).toBeFocused();
  await expect(enrichedEntry).toContainText(resultEvent.payload.public_summary);
  await expect(page.locator('[data-worklog-state="documentation-action"]')).toContainText(
    `Published ${worklogBefore.source_name} result from Worklog #${worklogBefore.sequence}.`,
  );

  page.once('dialog', (dialog) => dialog.accept());
  const beforeGiveUp = await page.evaluate(() => window.__task025WorkerMessages.length);
  await page.locator('[data-give-up-intent]').click();
  message = await waitForWorkerMessage(page, beforeGiveUp);
  expect(message.events.some((event) => event.event_type === 'TICKET_GIVEN_UP')).toBe(true);
  const selectedBeforeArchive = await page.locator('.ticket-card[aria-current="true"]').getAttribute('data-ticket-id');
  await page.locator('.closed-ticket-list > summary').click();
  const archiveButton = page.locator(`[data-archive-ticket-id="${ticketId}"]`);
  await expect(archiveButton).toContainText(ticketId);
  await expect(archiveButton).toContainText('Given up');
  await archiveButton.focus();
  await page.keyboard.press('Space');
  const archive = page.locator('#archived-ticket-dialog');
  await expect(archive).toBeVisible();
  await expect(archive).toContainText(ticketId);
  await expect(archive).toContainText('Authorized Evidence');
  await expect(archive).toContainText('Chronological Worklog');
  await expect(archive).toContainText('Visible milestones and contributors');
  await expect(archive.locator('[data-intent-id], [data-preview-document], [data-give-up-intent]')).toHaveCount(0);
  await expect(archive).not.toContainText('Hidden causal truth');
  await expect(archive.locator('[data-view-solution-ticket]')).toHaveCount(1);
  await expect(page.locator('.ticket-card[aria-current="true"]')).toHaveAttribute('data-ticket-id', selectedBeforeArchive);

  if (UPDATE_VISUALS) {
    await page.waitForTimeout(400);
    await archive.screenshot({ path: 'tests/visual/task-025/archived-ticket-review-chromium-desktop.png' });
  }
  await page.keyboard.press('Escape');
  await expect(archive).not.toBeVisible();
  await expect(archiveButton).toBeFocused();
  await archiveButton.click();
  await archive.click({ position: { x: 2, y: 2 } });
  await expect(archive).not.toBeVisible();
  await expect(archiveButton).toBeFocused();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(250);
  const mobileArchiveList = page.locator('.closed-ticket-list');
  if (!await mobileArchiveList.getAttribute('open')) await page.locator('.closed-ticket-list > summary').click();
  await expect(mobileArchiveList).toHaveAttribute('open', '');
  await expect(archiveButton).toBeVisible();
  await archiveButton.click();
  await expect(archive).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  await expect(archive.locator('.archive-history-region')).toHaveAttribute('role', 'region');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.keyboard.press('Escape');
  await expect(archive).not.toBeVisible();

  await archiveButton.click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.evaluate(() => { location.hash = '#/play/home'; });
  await expect(page.getByRole('heading', { name: 'Take the next repair queue' })).toBeVisible();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(page.locator('#play-page')).not.toHaveCSS('filter', /blur/);
});
