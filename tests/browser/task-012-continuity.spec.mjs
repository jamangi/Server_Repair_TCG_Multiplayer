import { expect, test } from '@playwright/test';

const DESKTOP = 'chromium-desktop';
const MOBILE = 'chromium-mobile';

function continuityProject(testInfo) {
  test.skip(![DESKTOP, MOBILE].includes(testInfo.project.name), 'TASK-012 runs at the desktop and narrow-mobile continuity layouts.');
}

async function openRoute(page, hash) {
  await page.goto(`/index.html${hash}`);
  await expect(page.locator('#app')).not.toHaveAttribute('aria-busy', 'true');
}

async function selection(locator) {
  return locator.evaluate((input) => ({
    start: input.selectionStart,
    end: input.selectionEnd,
    direction: input.selectionDirection,
  }));
}

async function exerciseSequentialEditing(page, locator) {
  await locator.focus();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.press('Backspace');
  let expected = '';
  for (const character of 'storage') {
    await page.keyboard.type(character);
    expected += character;
    await expect(locator).toHaveValue(expected);
    await expect.poll(() => selection(locator)).toEqual({
      start: expected.length,
      end: expected.length,
      direction: 'forward',
    });
  }

  await locator.evaluate((input) => input.setSelectionRange(3, 3, 'none'));
  await page.keyboard.type('X');
  await expect(locator).toHaveValue('stoXrage');
  await expect.poll(() => selection(locator)).toEqual({ start: 4, end: 4, direction: 'forward' });
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Delete');
  await expect(locator).toHaveValue('storage');
  await expect.poll(() => selection(locator)).toEqual({ start: 3, end: 3, direction: 'forward' });
  await page.keyboard.press('Backspace');
  await expect(locator).toHaveValue('strage');
  await expect.poll(() => selection(locator)).toEqual({ start: 2, end: 2, direction: 'forward' });
  await page.keyboard.press('Home');
  await expect.poll(() => selection(locator)).toEqual({ start: 0, end: 0, direction: 'forward' });
  await page.keyboard.press('End');
  await expect.poll(() => selection(locator)).toEqual({ start: 6, end: 6, direction: 'forward' });

  await locator.evaluate((input) => {
    input.value = 'storage';
    input.setSelectionRange(2, 5, 'forward');
    input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertReplacementText' }));
  });
  await page.keyboard.type('X');
  await expect(locator).toHaveValue('stXge');
  await expect.poll(() => selection(locator)).toEqual({ start: 3, end: 3, direction: 'forward' });

  await locator.evaluate((input) => {
    input.setSelectionRange(2, 3, 'forward');
    input.setRangeText('ora', 2, 3, 'end');
    input.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      data: 'ora',
      inputType: 'insertFromPaste',
    }));
  });
  await expect(locator).toHaveValue('storage');
  await expect.poll(() => selection(locator)).toEqual({ start: 5, end: 5, direction: 'forward' });
  await expect(locator).toBeFocused();
}

async function exerciseComposition(page, locator, resultLocator) {
  const before = await resultLocator.count();
  await locator.evaluate((input) => {
    input.focus();
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: '' }));
    input.value = 'thermal';
    input.setSelectionRange(7, 7);
    input.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      data: 'thermal',
      inputType: 'insertCompositionText',
      isComposing: true,
    }));
  });
  expect(await resultLocator.count()).toBe(before);
  await locator.evaluate((input) => {
    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: 'thermal' }));
  });
  await expect(locator).toHaveValue('thermal');
  await expect(locator).toBeFocused();
  await expect.poll(() => selection(locator)).toEqual({ start: 7, end: 7, direction: 'forward' });
  await expect.poll(() => resultLocator.count()).not.toBe(before);
}

async function installWorkerProbe(page, seedSuffix = 12) {
  await page.addInitScript(({ suffix }) => {
    const inbound = [];
    Object.defineProperty(window, '__task012WorkerMessages', { value: inbound, configurable: false });
    const NativeWorker = window.Worker;
    window.Worker = new Proxy(NativeWorker, {
      construct(Target, argumentsList) {
        const worker = Reflect.construct(Target, argumentsList);
        worker.addEventListener('message', (event) => inbound.push(structuredClone(event.data)));
        return worker;
      },
    });
    const uuids = [
      '00000000-0000-4000-8000-888888888888',
      `00000000-0000-4000-8000-${String(suffix).padStart(12, '0')}`,
    ];
    let index = 0;
    const nativeUuid = globalThis.crypto.randomUUID.bind(globalThis.crypto);
    Object.defineProperty(Crypto.prototype, 'randomUUID', {
      configurable: true,
      value() { return uuids[index++] ?? nativeUuid(); },
    });
  }, { suffix: seedSuffix });
}

async function latestWorkerMessage(page) {
  return page.evaluate(() => [...window.__task012WorkerMessages].reverse()
    .find((message) => message.type === 'MATCH_STARTED' || message.type === 'INTENT_RESOLVED'));
}

async function startSolo(page, count = 3) {
  await page.locator('#ticket-count').selectOption(String(count));
  await page.locator('#start-solo').click();
  await expect(page.getByRole('heading', { name: 'Night-shift board' })).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.ticket-card')).toHaveCount(count);
}

async function submitAndWait(page, intentId) {
  const before = await page.evaluate(() => window.__task012WorkerMessages.length);
  const projectedAction = page.locator(`[data-intent-id="${intentId}"]`);
  if (!await projectedAction.isVisible() && await page.getByRole('button', { name: 'View full Ticket' }).isVisible()) {
    await page.getByRole('button', { name: 'View full Ticket' }).click();
  }
  await projectedAction.click();
  await expect.poll(() => page.evaluate(() => window.__task012WorkerMessages.length)).toBeGreaterThan(before);
}

function scanCandidateEffects(value, target = []) {
  if (Array.isArray(value)) {
    for (const entry of value) scanCandidateEffects(entry, target);
    return target;
  }
  if (!value || typeof value !== 'object') return target;
  if (typeof value.candidate_fault_id === 'string' && typeof value.disposition === 'string') target.push(value);
  for (const child of Object.values(value)) scanCandidateEffects(child, target);
  return target;
}

function evidenceScore(view, candidateFaultId) {
  const weights = { CONFIRM: 8, SUPPORT: 3, INCONCLUSIVE: 0, CONTRADICT: -4, RULE_OUT: -8 };
  return scanCandidateEffects(view)
    .filter((entry) => entry.candidate_fault_id === candidateFaultId)
    .reduce((sum, entry) => sum + (weights[entry.disposition] ?? 0), 0);
}

async function advanceUntilHeldResponseIsLegal(page, maximumIntents = 30) {
  const attemptedDiagnostics = new Set();
  const rejectedIsolationScores = new Map();
  for (let step = 0; step < maximumIntents; step += 1) {
    const latest = await latestWorkerMessage(page);
    const projection = latest.projection;
    const heldIds = new Set(projection.view.hand.map((entry) => entry.card_instance_id));
    if (projection.legal_intents.some((intent) => heldIds.has(intent.card_instance_id) && intent.ticket_instance_id)) return latest;

    const positiveIsolation = projection.legal_intents
      .filter((intent) => intent.action_type === 'COMMIT_ISOLATION')
      .map((intent) => ({ intent, score: evidenceScore(projection.view, intent.candidate_fault_id) }))
      .filter((entry) => entry.score > 0
        && entry.score > (rejectedIsolationScores.get(
          `${entry.intent.ticket_instance_id}:${entry.intent.candidate_fault_id}`,
        ) ?? Number.NEGATIVE_INFINITY))
      .sort((left, right) => right.score - left.score)[0]?.intent;
    const benchIds = new Set((projection.view.diagnostic_bench ?? []).map((entry) => entry.card_instance_id));
    const benchEntryById = new Map((projection.view.diagnostic_bench ?? [])
      .map((entry) => [entry.card_instance_id, entry]));
    const unusedDiagnostic = (intent) => !attemptedDiagnostics.has(
      `${intent.ticket_instance_id}:${intent.card_instance_id}`,
    );
    const diagnostic = projection.legal_intents.find((intent) => intent.action_type === 'RUN_TEST'
      && benchEntryById.get(intent.card_instance_id)?.ticket_relevance.some((relevance) =>
        relevance.ticket_instance_id === intent.ticket_instance_id && relevance.relevant)
      && unusedDiagnostic(intent))
      ?? projection.legal_intents.find((intent) => intent.action_type === 'RUN_TEST'
        && benchIds.has(intent.card_instance_id) && unusedDiagnostic(intent));
    const intent = positiveIsolation ?? diagnostic;
    expect(intent, `No diagnosis-v2 setup intent at step ${step}`).toBeTruthy();

    if (intent.ticket_instance_id) {
      const ticket = page.locator(`[data-ticket-id="${intent.ticket_instance_id}"]`);
      if (await ticket.getAttribute('aria-current') !== 'true') await ticket.click();
    }
    if (benchIds.has(intent.card_instance_id)) {
      let diagnosticButton = page.locator(`[data-select-diagnostic="${intent.card_instance_id}"]`);
      if (!await diagnosticButton.count()) {
        await page.getByRole('button', { name: 'Global', exact: true }).click();
        const benchEntry = projection.view.diagnostic_bench.find(
          (entry) => entry.card_instance_id === intent.card_instance_id,
        );
        await page.locator('[data-bench-search]').fill(benchEntry.card_definition_id);
        diagnosticButton = page.locator(`[data-select-diagnostic="${intent.card_instance_id}"]`);
      }
      await diagnosticButton.click();
      attemptedDiagnostics.add(`${intent.ticket_instance_id}:${intent.card_instance_id}`);
    }
    await submitAndWait(page, intent.intent_id);
    if (intent.action_type === 'COMMIT_ISOLATION') {
      const resolved = await latestWorkerMessage(page);
      if (resolved.result?.resolution_code === 'ISOLATION_NOT_SUPPORTED') {
        rejectedIsolationScores.set(
          `${intent.ticket_instance_id}:${intent.candidate_fault_id}`,
          evidenceScore(projection.view, intent.candidate_fault_id),
        );
      }
    }
  }
  throw new Error(`No held response Card became legal within ${maximumIntents} projected intents.`);
}

async function scrollPosition(locator) {
  return locator.evaluate((element) => ({ left: element.scrollLeft, top: element.scrollTop }));
}

async function setScroll(locator, { left = 0, top = 0 }) {
  return locator.evaluate((element, position) => {
    element.scrollLeft = position.left;
    element.scrollTop = position.top;
    return {
      left: element.scrollLeft,
      top: element.scrollTop,
      maximumLeft: element.scrollWidth - element.clientWidth,
      maximumTop: element.scrollHeight - element.clientHeight,
    };
  }, { left, top });
}

function expectNear(actual, expected, tolerance = 2) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
}

test('real sequential editing and IME composition preserve Library and deck-search carets', async ({ page }, testInfo) => {
  continuityProject(testInfo);
  await openRoute(page, '#/library');
  const librarySearch = page.locator('#search');
  await exerciseSequentialEditing(page, librarySearch);
  await exerciseComposition(page, librarySearch, page.locator('.library-card'));

  await page.locator('#play-tab').click();
  await page.getByRole('link', { name: 'Decks', exact: true }).click();
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  const deckSearch = page.locator('#deck-search');
  await exerciseSequentialEditing(page, deckSearch);
  await exerciseComposition(page, deckSearch, page.locator('.deck-card-tile'));

  await deckSearch.focus();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.press('Backspace');
  await page.addStyleTag({ content: '.play-app .card-catalog-grid, .play-app .deck-summary { max-height: 11rem !important; overflow: auto !important; }' });
  const deckGrid = page.locator('.card-catalog-grid');
  const deckSummary = page.locator('.deck-summary');
  const gridPosition = await setScroll(deckGrid, { top: 96 });
  const summaryPosition = await setScroll(deckSummary, { top: 48 });
  expect(gridPosition.maximumTop).toBeGreaterThan(96);
  expect(summaryPosition.maximumTop).toBeGreaterThan(48);
  const quantityButton = page.getByRole('button', { name: /^Remove one / }).first();
  await quantityButton.evaluate((button) => {
    button.focus({ preventScroll: true });
    button.click();
  });
  expectNear((await scrollPosition(deckGrid)).top, gridPosition.top);
  expectNear((await scrollPosition(deckSummary)).top, summaryPosition.top);
  await expect(page.getByRole('button', { name: /^Remove one / }).first()).toBeFocused();
});

test('desktop compact Ticket and full-detail workflow retain accepted cross-Ticket results', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== DESKTOP, 'The selected Ticket is compact at the desktop layout.');
  await installWorkerProbe(page);
  await openRoute(page, '#/play/home');
  await startSolo(page, 3);
  await page.addStyleTag({ content: '.play-app .intelligence-panel > :is(.evidence-panel, .worklog-panel) { max-height: 5rem !important; }' });

  const firstTicketId = await page.locator('.ticket-card[aria-current="true"]').getAttribute('data-ticket-id');
  const sheet = page.locator('.ticket-sheet');
  expect(await sheet.evaluate((element) => element.scrollHeight - element.clientHeight)).toBeLessThanOrEqual(2);
  const fullTicketButton = page.getByRole('button', { name: 'View full Ticket' });
  await fullTicketButton.click();
  const fullTicket = page.locator('#full-ticket-dialog');
  await expect(fullTicket).toBeVisible();
  expect(await fullTicket.locator('.candidate-row').count()).toBeGreaterThan(0);
  await fullTicket.getByRole('button', { name: 'Close full Ticket' }).click();
  await expect(fullTicketButton).toBeFocused();

  const secondTicketId = await page.locator('.ticket-card').evaluateAll((tickets, selectedId) => tickets
    .map((ticket) => ticket.dataset.ticketId).find((ticketId) => ticketId !== selectedId), firstTicketId);
  await page.locator(`[data-ticket-id="${secondTicketId}"]`).click();
  await page.getByRole('button', { name: 'View full Ticket' }).click();
  await expect(page.locator('#full-ticket-dialog .ticket-code')).toContainText(secondTicketId);
  await page.getByRole('button', { name: 'Close full Ticket' }).click();
  await page.locator(`[data-ticket-id="${firstTicketId}"]`).click();
  await page.locator(`[data-ticket-id="${secondTicketId}"]`).click();

  const latest = await advanceUntilHeldResponseIsLegal(page);
  const projection = latest.projection;
  const ticketIds = projection.view.public_match.repair_queue.map((ticket) => ticket.ticket_instance_id);
  let alternate = null;
  for (const held of projection.view.hand) {
    const intents = projection.legal_intents.filter((intent) => intent.card_instance_id === held.card_instance_id
      && intent.ticket_instance_id);
    const targets = new Set(intents.map((intent) => intent.ticket_instance_id));
    const displayedTicketId = ticketIds.find((ticketId) => !targets.has(ticketId));
    if (intents.length && displayedTicketId) {
      alternate = { held, intent: intents[0], displayedTicketId };
      break;
    }
  }
  expect(alternate, 'Expected one held Card with an explicit alternate Ticket target.').toBeTruthy();
  await page.locator(`[data-ticket-id="${alternate.displayedTicketId}"]`).click();
  await page.locator(`[data-card-instance-id="${alternate.held.card_instance_id}"]`).click();
  const scope = page.locator('[data-alternate-target]');
  await expect(scope).toBeVisible();
  await expect(scope).toContainText('Alternate target only');
  await expect(scope).toContainText('cannot apply to the displayed Ticket');
  await expect(page.locator(`[data-intent-id="${alternate.intent.intent_id}"]`)).toHaveAttribute('data-target-ticket-id', alternate.intent.ticket_instance_id);

  await submitAndWait(page, alternate.intent.intent_id);
  await expect(page.locator(`[data-ticket-id="${alternate.intent.ticket_instance_id}"]`)).toHaveAttribute('aria-current', 'true');
  const result = page.locator('.action-result-notice');
  await expect(result).toBeVisible();
  await expect(result).toContainText('Persistent action result');
  await expect(result).toContainText('Card / disposition');
  await expect(result).toContainText('Payment');
  await expect(result).toContainText(/1 Action/);
  await expect(result).toContainText('Result');
  await expect(page.locator('.is-result-target')).toBeVisible();

  await page.getByRole('tab', { name: 'Evidence' }).click();
  const evidencePanel = page.locator('.evidence-panel');
  const evidencePosition = await setScroll(evidencePanel, { top: 36 });
  expect(evidencePosition.maximumTop).toBeGreaterThan(0);
  await page.getByRole('tab', { name: 'Worklog' }).click();
  const worklogPanel = page.locator('.worklog-panel');
  const worklogPosition = await setScroll(worklogPanel, { top: 28 });
  expect(worklogPosition.maximumTop).toBeGreaterThan(0);
  await page.getByRole('tab', { name: 'Evidence' }).click();
  expectNear((await scrollPosition(evidencePanel)).top, evidencePosition.top);
  await page.getByRole('tab', { name: 'Worklog' }).click();
  expectNear((await scrollPosition(worklogPanel)).top, worklogPosition.top);
  await page.getByRole('tab', { name: 'Evidence' }).click();

  await page.getByRole('button', { name: 'View result' }).click();
  await expect(page.locator('.is-result-target')).toBeFocused();
});

test('narrow mobile rails and document position survive same-route reconstruction', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== MOBILE, 'This regression covers the narrow mobile internal-scroll composition.');
  await installWorkerProbe(page, 21);
  await openRoute(page, '#/play/home');
  await startSolo(page, 3);

  const ticketRail = page.locator('.ticket-queue__list');
  const handRail = page.locator('.hand-rail__cards');
  const resources = page.locator('.game-resources');
  const ticketPosition = await setScroll(ticketRail, { left: 90 });
  const nextHandPage = page.locator('.hand-pagination [data-hand-page]').last();
  await expect(nextHandPage).toBeEnabled();
  await nextHandPage.click();
  const handPageAnnouncement = await page.locator('.hand-rail__range').textContent();
  const resourcePosition = await setScroll(resources, { left: 70 });
  expect(ticketPosition.maximumLeft).toBeGreaterThan(0);
  expect(handPageAnnouncement).toContain('Page 2 /');
  expect(resourcePosition.maximumLeft).toBeGreaterThan(0);

  await page.evaluate(() => window.scrollTo({ top: 520, behavior: 'instant' }));
  const documentTop = await page.evaluate(() => window.scrollY);
  expect(documentTop).toBeGreaterThan(0);
  await page.locator('.ticket-card[aria-current="true"]').evaluate((button) => {
    button.focus({ preventScroll: true });
    button.click();
  });

  expectNear((await scrollPosition(ticketRail)).left, ticketPosition.left);
  await expect(page.locator('.hand-rail__range')).toHaveText(handPageAnnouncement);
  await expect(handRail.locator('[data-card-instance-id]')).not.toHaveCount(0);
  expectNear((await scrollPosition(resources)).left, resourcePosition.left);
  expectNear(await page.evaluate(() => window.scrollY), documentTop);
  await expect(page.locator('.ticket-card[aria-current="true"]')).toBeFocused();
});
