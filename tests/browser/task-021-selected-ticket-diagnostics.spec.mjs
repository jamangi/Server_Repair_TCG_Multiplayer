import { expect, test } from '@playwright/test';

const UPDATE_VISUALS = process.env.UPDATE_TASK_021_VISUALS === '1';
const PROJECTS = new Set([
  'chromium-desktop',
  'chromium-tablet',
  'chromium-mobile',
  'chromium-reduced-motion',
]);

async function installWorkerProbe(page) {
  await page.addInitScript(() => {
    const inbound = [];
    Object.defineProperty(window, '__task021WorkerMessages', { value: inbound });
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
      value: () => '00000000-0000-4000-8000-000000002101',
    });
  });
}

async function openThreeTicketSolo(page) {
  await installWorkerProbe(page);
  await page.goto('/index.html#/play/home');
  await expect(page.locator('#app')).not.toHaveAttribute('aria-busy', 'true');
  await page.locator('#ticket-count').selectOption('3');
  await page.locator('#start-solo').click();
  await expect(page.getByRole('heading', { name: 'Night-shift board' })).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.ticket-card')).toHaveCount(3);
}

async function latestWorkerMessage(page) {
  return page.evaluate(() => [...window.__task021WorkerMessages].reverse()
    .find((message) => message.type === 'MATCH_STARTED' || message.type === 'INTENT_RESOLVED'));
}

function findThreeTicketDiagnostic(message) {
  const projection = message.projection;
  const tickets = projection.view.public_match.repair_queue;
  const displayedTicketId = tickets[0].ticket_instance_id;
  for (const diagnostic of projection.view.diagnostic_bench) {
    if (diagnostic.action_cost !== 1) continue;
    if (!diagnostic.ticket_relevance.some((entry) =>
      entry.ticket_instance_id === displayedTicketId && entry.relevant)) continue;
    const intents = projection.legal_intents.filter((intent) =>
      intent.card_instance_id === diagnostic.card_instance_id
        && ['RUN_TEST', 'PLAY_CARD'].includes(intent.action_type));
    const targetIds = new Set(intents.map((intent) => intent.ticket_instance_id));
    if (tickets.every((ticket) => targetIds.has(ticket.ticket_instance_id))) {
      return { diagnostic, intents, tickets, displayedTicketId };
    }
  }
  throw new Error('The deterministic three-Ticket fixture has no one-Action Relevant diagnostic for all Tickets.');
}

async function selectDiagnostic(page, diagnostic) {
  await page.getByRole('button', { name: 'Global', exact: true }).click();
  await page.locator('[data-bench-search]').fill(diagnostic.card_definition_id);
  const tile = page.locator(`.diagnostic-tile:has([data-select-diagnostic="${diagnostic.card_instance_id}"])`);
  await expect(tile).toHaveCount(1);
  await tile.locator('[data-select-diagnostic]').click();
  return tile;
}

async function activateByProject(page, locator, projectName) {
  if (projectName === 'chromium-desktop') {
    await locator.click();
    return;
  }
  if (projectName === 'chromium-reduced-motion') {
    await locator.focus();
    await page.keyboard.press('Enter');
    return;
  }
  await locator.tap();
}

test('a Bench diagnostic remains in the displayed Ticket context before and after its accepted result', async ({ page }, testInfo) => {
  test.skip(!PROJECTS.has(testInfo.project.name), 'TASK-021 runs across the complete Chromium project matrix.');
  if (testInfo.project.name === 'chromium-desktop') await page.setViewportSize({ width: 1920, height: 1080 });
  await openThreeTicketSolo(page);

  const started = await latestWorkerMessage(page);
  const fixture = findThreeTicketDiagnostic(started);
  const displayedTicket = fixture.tickets[0];
  const otherTickets = fixture.tickets.slice(1);
  const displayedIntent = fixture.intents.find((intent) =>
    intent.ticket_instance_id === fixture.displayedTicketId);
  expect(displayedIntent).toBeTruthy();
  expect(fixture.intents).toHaveLength(3);

  const tile = await selectDiagnostic(page, fixture.diagnostic);
  await expect(tile).toHaveAttribute('data-relevant', 'true');
  await expect(tile).toHaveAttribute('data-runnable', 'true');
  await expect(tile.locator('[data-inspect-diagnostic]')).toContainText('Runnable now');
  const selectedActions = page.locator('.selected-card-actions');
  const confirmation = selectedActions.locator('[data-intent-id]');
  await expect(confirmation).toHaveCount(1);
  await expect(confirmation).toHaveAttribute('data-intent-id', displayedIntent.intent_id);
  await expect(confirmation).toHaveAttribute('data-target-ticket-id', displayedTicket.ticket_instance_id);
  await expect(selectedActions).toContainText(
    started.projection.ticket_presentations[displayedTicket.ticket_instance_id].display_name,
  );
  await expect(selectedActions.locator('[data-alternate-target]')).toHaveCount(0);
  for (const ticket of otherTickets) {
    await expect(selectedActions).not.toContainText(started.projection.ticket_presentations[ticket.ticket_instance_id].display_name);
  }

  const messagesBeforeNoOpInputs = await page.evaluate(() => window.__task021WorkerMessages.length);
  const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
  const diagnosticFace = tile.locator('[data-select-diagnostic]');
  await expect(diagnosticFace).not.toHaveAttribute('draggable', 'true');
  await diagnosticFace.dispatchEvent('dragstart', { dataTransfer });
  await page.locator(`[data-ticket-id="${otherTickets[0].ticket_instance_id}"]`).dispatchEvent('dragover', { dataTransfer });
  await page.locator(`[data-ticket-id="${otherTickets[0].ticket_instance_id}"]`).dispatchEvent('drop', { dataTransfer });
  await diagnosticFace.dispatchEvent('dragend', { dataTransfer });
  await diagnosticFace.dispatchEvent('pointerdown', { pointerId: 21, pointerType: 'touch', clientX: 20, clientY: 20 });
  await diagnosticFace.dispatchEvent('pointermove', { pointerId: 21, pointerType: 'touch', clientX: 120, clientY: 120 });
  await diagnosticFace.dispatchEvent('pointerup', { pointerId: 21, pointerType: 'touch', clientX: 120, clientY: 120 });
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  expect(await page.evaluate(() => window.__task021WorkerMessages.length)).toBe(messagesBeforeNoOpInputs);

  if (UPDATE_VISUALS && testInfo.project.name === 'chromium-desktop') {
    await page.screenshot({
      path: 'tests/visual/task-021/three-ticket-before-run-1920x1080.png',
      animations: 'disabled',
    });
  }

  const actionsBefore = started.projection.view.public_match.turn.actions_remaining;
  const messagesBeforeRun = await page.evaluate(() => window.__task021WorkerMessages.length);
  await activateByProject(page, confirmation, testInfo.project.name);
  await expect.poll(() => page.evaluate(() => window.__task021WorkerMessages.length)).toBeGreaterThan(messagesBeforeRun);
  const resolved = await latestWorkerMessage(page);
  expect(resolved.type).toBe('INTENT_RESOLVED');
  expect(resolved.result.accepted).toBe(true);
  expect(resolved.result.actions_spent).toBe(1);
  expect(resolved.projection.view.public_match.turn.actions_remaining).toBe(actionsBefore - 1);
  const evidence = resolved.events.find((event) => event.event_type === 'EVIDENCE_CREATED');
  expect(evidence.ticket_instance_id).toBe(displayedTicket.ticket_instance_id);
  expect(evidence.payload.machine_revision).toBe(displayedTicket.machine_revision);
  const remainingIntents = resolved.projection.legal_intents.filter((intent) =>
    intent.card_instance_id === fixture.diagnostic.card_instance_id
      && ['RUN_TEST', 'PLAY_CARD'].includes(intent.action_type));
  expect(remainingIntents.map((intent) => intent.ticket_instance_id).sort())
    .toEqual(otherTickets.map((ticket) => ticket.ticket_instance_id).sort());

  await expect(page.locator(`[data-ticket-id="${displayedTicket.ticket_instance_id}"]`)).toHaveAttribute('aria-current', 'true');
  await expect(page.locator(`.diagnostic-tile:has([data-select-diagnostic="${fixture.diagnostic.card_instance_id}"])`)).toHaveAttribute('data-runnable', 'false');
  await expect(page.locator(`.diagnostic-tile:has([data-select-diagnostic="${fixture.diagnostic.card_instance_id}"])`)).toHaveAttribute('data-completed-current-revision', 'true');
  const completedStatus = page.locator('[data-diagnostic-status="COMPLETED_CURRENT_REVISION"]');
  await expect(completedStatus).toContainText('Completed for this machine revision');
  await expect(completedStatus).toContainText('No Action was spent');
  await expect(completedStatus).toBeFocused();
  await expect(selectedActions.locator('[data-intent-id]')).toHaveCount(0);
  await expect(selectedActions.locator('[data-alternate-target]')).toHaveCount(0);
  for (const ticket of otherTickets) {
    await expect(selectedActions).not.toContainText(resolved.projection.ticket_presentations[ticket.ticket_instance_id].display_name);
  }
  await expect(page.locator('.action-result-notice')).toContainText('Persistent action result');
  await expect(page.locator('.action-result-notice')).toContainText('1 Action');
  await expect(page.locator('.is-result-target')).toBeVisible();
  const messagesAfterPresentation = await page.evaluate(() => window.__task021WorkerMessages.length);
  await completedStatus.press('Enter');
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
  expect(await page.evaluate(() => window.__task021WorkerMessages.length)).toBe(messagesAfterPresentation);

  if (UPDATE_VISUALS && testInfo.project.name === 'chromium-desktop') {
    await page.screenshot({
      path: 'tests/visual/task-021/three-ticket-completed-1920x1080.png',
      animations: 'disabled',
    });
  }

  const ticketB = otherTickets[0];
  await page.locator(`[data-ticket-id="${ticketB.ticket_instance_id}"]`).click();
  const ticketBIntent = remainingIntents.find((intent) => intent.ticket_instance_id === ticketB.ticket_instance_id);
  await expect(selectedActions.locator('[data-intent-id]')).toHaveCount(1);
  await expect(selectedActions.locator('[data-intent-id]')).toHaveAttribute('data-intent-id', ticketBIntent.intent_id);
  await expect(selectedActions.locator('[data-intent-id]')).toHaveAttribute('data-target-ticket-id', ticketB.ticket_instance_id);
  await expect(selectedActions).toContainText(resolved.projection.ticket_presentations[ticketB.ticket_instance_id].display_name);

  await page.locator('[data-bench-runnable]').check();
  await expect(page.locator(`.diagnostic-tile:has([data-select-diagnostic="${fixture.diagnostic.card_instance_id}"])`)).toHaveCount(1);
  await page.locator(`[data-ticket-id="${displayedTicket.ticket_instance_id}"]`).click();
  await expect(page.locator(`.diagnostic-tile:has([data-select-diagnostic="${fixture.diagnostic.card_instance_id}"])`)).toHaveCount(0);
  await expect(page.locator('.diagnostic-bench__count')).toContainText('Showing 0–0 of 0');

  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0.5);
  if (testInfo.project.name !== 'chromium-desktop') {
    const statusHeight = await completedStatus.evaluate((node) => node.getBoundingClientRect().height);
    expect(statusHeight).toBeGreaterThanOrEqual(44);
  }
});

test('multiple component targets are explicit selected-Ticket choices', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Synthetic component-choice presentation runs once.');
  await page.addInitScript(() => {
    const NativeWorker = window.Worker;
    class Task021ComponentWorker extends EventTarget {
      constructor(url, options) {
        super();
        this.native = new NativeWorker(url, options);
        this.native.addEventListener('error', (event) => this.dispatchEvent(new ErrorEvent('error', { message: event.message })));
        this.native.addEventListener('message', (event) => {
          const message = structuredClone(event.data);
          if (message.type === 'MATCH_STARTED') {
            const diagnostic = message.projection.view.diagnostic_bench.find((entry) =>
              entry.card_definition_id === 'card.bench.test.storage.predictive_health');
            const ticketId = message.projection.view.public_match.repair_queue[0].ticket_instance_id;
            message.projection.legal_intents = message.projection.legal_intents
              .filter((intent) => intent.card_instance_id !== diagnostic.card_instance_id);
            message.projection.legal_intents.push(
              { intent_id: 'intent.task021.component.1', action_type: 'RUN_TEST', ticket_instance_id: ticketId, card_instance_id: diagnostic.card_instance_id, card_definition_id: diagnostic.card_definition_id },
              { intent_id: 'intent.task021.component.2', action_type: 'RUN_TEST', ticket_instance_id: ticketId, card_instance_id: diagnostic.card_instance_id, card_definition_id: diagnostic.card_definition_id },
            );
          }
          this.dispatchEvent(new MessageEvent('message', { data: message }));
        });
      }
      postMessage(message) { this.native.postMessage(message); }
      terminate() { this.native.terminate(); }
    }
    window.Worker = Task021ComponentWorker;
    Object.defineProperty(Crypto.prototype, 'randomUUID', {
      configurable: true,
      value: () => '00000000-0000-4000-8000-000000002102',
    });
  });
  await page.goto('/index.html#/play/home');
  await expect(page.locator('#app')).not.toHaveAttribute('aria-busy', 'true');
  await page.locator('#start-solo').click();
  await expect(page.getByRole('heading', { name: 'Night-shift board' })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Global', exact: true }).click();
  await page.locator('[data-bench-search]').fill('card.bench.test.storage.predictive_health');
  await page.locator('[data-select-diagnostic]').click();
  const choices = page.locator('.diagnostic-target-choices [data-component-target-choice]');
  await expect(choices).toHaveCount(2);
  await expect(choices.nth(0)).toContainText('Component target 1');
  await expect(choices.nth(1)).toContainText('Component target 2');
  const selectedTicketId = await page.locator('.ticket-card[aria-current="true"]').getAttribute('data-ticket-id');
  await expect(choices.nth(0)).toHaveAttribute('data-target-ticket-id', selectedTicketId);
  await expect(choices.nth(1)).toHaveAttribute('data-target-ticket-id', selectedTicketId);
  await expect(page.locator('[data-alternate-target]')).toHaveCount(0);
});
