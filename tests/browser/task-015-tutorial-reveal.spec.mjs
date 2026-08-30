import fs from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

const ROOT = path.resolve(import.meta.dirname, '../..');
const tutorialCatalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/gameplay-v1/tutorials-v1.json'), 'utf8'));
const cardCatalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/gameplay-v1/card-catalog.json'), 'utf8'));
const cardIdBySource = new Map(cardCatalog.cards.map((card) => [card.primary_domain_reference?.entity_id, card.id]));
const UPDATE_VISUALS = process.env.UPDATE_TASK_015_VISUALS === '1';

function interactionMode(projectName) {
  if (projectName === 'chromium-mobile') return 'keyboard';
  if (projectName === 'chromium-tablet' || projectName === 'chromium-reduced-motion') return 'touch';
  return 'click';
}

async function activate(page, locator, mode = 'click') {
  await expect(locator).toBeVisible();
  await expect(locator).toBeEnabled();
  if (mode === 'keyboard') {
    await locator.focus();
    await expect(locator).toBeFocused();
    await page.keyboard.press('Space');
  } else if (mode === 'touch') await locator.tap();
  else await locator.click();
}

async function installWorkerProbe(page) {
  await page.addInitScript(() => {
    const inbound = [];
    const outbound = [];
    Object.defineProperty(window, '__task015WorkerMessages', { value: inbound });
    Object.defineProperty(window, '__task015WorkerRequests', { value: outbound });
    const NativeWorker = window.Worker;
    window.Worker = new Proxy(NativeWorker, {
      construct(Target, argumentsList) {
        const worker = Reflect.construct(Target, argumentsList);
        worker.addEventListener('message', (event) => inbound.push(structuredClone(event.data)));
        const nativePost = worker.postMessage.bind(worker);
        worker.postMessage = (message, transfer) => {
          outbound.push(structuredClone(message));
          return nativePost(message, transfer);
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

async function openHome(page) {
  await installWorkerProbe(page);
  await page.goto('/index.html#/play/home');
  await expect(page.locator('#app')).not.toHaveAttribute('aria-busy', 'true');
  await expect(page.getByRole('heading', { name: 'Tutorials' })).toBeVisible();
}

async function startTutorial(page, definition, mode) {
  await activate(page, page.locator(`[data-start-tutorial="${definition.id}"]`), mode);
  await expect(page.locator('.tutorial-coach')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('#play-page')).toHaveAttribute('data-tutorial-id', definition.id);
  await expect(page.locator('.tutorial-coach')).toContainText(definition.checkpoints[0].title);
}

async function latestMessage(page) {
  return page.evaluate(() => [...window.__task015WorkerMessages].reverse()
    .find((message) => message.type === 'MATCH_STARTED' || message.type === 'INTENT_RESOLVED'));
}

async function revealHandCard(page, cardInstanceId, mode) {
  const card = page.locator(`[data-card-instance-id="${cardInstanceId}"]`);
  for (let guard = 0; guard < 20; guard += 1) {
    const previous = page.locator('.hand-pagination [data-hand-page]').first();
    if (!await previous.count() || await previous.isDisabled()) break;
    await activate(page, previous, mode);
  }
  for (let guard = 0; guard < 20; guard += 1) {
    if (await card.count()) return card;
    const next = page.locator('.hand-pagination [data-hand-page]').last();
    if (!await next.count() || await next.isDisabled()) break;
    await activate(page, next, mode);
  }
  return card;
}

async function submitProjectedIntent(page, intent, mode) {
  if (intent.action_type === 'SEARCH') {
    const select = page.locator('#search-intent');
    await select.selectOption(intent.intent_id);
    await activate(page, page.locator('[data-submit-search]'), mode);
    return;
  }

  if (intent.card_instance_id) {
    const handCard = await revealHandCard(page, intent.card_instance_id, mode);
    if (await handCard.count()) {
      if (await handCard.getAttribute('aria-pressed') !== 'true') await activate(page, handCard, mode);
    } else {
      if (!await page.locator(`[data-select-diagnostic="${intent.card_instance_id}"]`).count()) {
        await activate(page, page.getByRole('button', { name: 'Global', exact: true }), mode);
        await page.locator('[data-bench-search]').fill(intent.card_definition_id);
      }
      await activate(page, page.locator(`[data-select-diagnostic="${intent.card_instance_id}"]`), mode);
    }
  }

  if (intent.action_type === 'DOCUMENT_LIVE') {
    await activate(page, page.locator(`[data-preview-document="${intent.intent_id}"]`).first(), mode);
    await expect(page.locator('#document-preview-dialog')).toBeVisible();
    await activate(page, page.locator('[data-submit-document]'), mode);
    return;
  }

  let button = page.locator(`[data-intent-id="${intent.intent_id}"]`).first();
  if (!await button.isVisible() && await page.locator('[data-view-full-ticket]').isVisible()) {
    await activate(page, page.locator('[data-view-full-ticket]'), mode);
    button = page.locator(`[data-intent-id="${intent.intent_id}"]`).first();
  }
  await activate(page, button, mode);
}

function expectedProjectedIntent(projection, checkpoint) {
  const cardId = checkpoint.card_definition_id ?? cardIdBySource.get(checkpoint.source_definition_id);
  return projection.legal_intents.find((intent) => intent.action_type === checkpoint.action_type
    && (!cardId || intent.card_definition_id === cardId));
}

function helperProjectedIntent(projection, checkpoint) {
  const cardId = checkpoint.card_definition_id ?? cardIdBySource.get(checkpoint.source_definition_id);
  if (cardId && checkpoint.support_action_types.includes('SEARCH')) {
    const search = projection.legal_intents.find((intent) => intent.action_type === 'SEARCH'
      && intent.selected_card_definition_id === cardId);
    if (search) return search;
  }
  if (checkpoint.support_action_types.includes('REFRESH')) {
    const refresh = projection.legal_intents.find((intent) => intent.action_type === 'REFRESH');
    if (refresh) return refresh;
  }
  if (checkpoint.support_action_types.includes('PASS_TURN')) {
    return projection.legal_intents.find((intent) => intent.action_type === 'PASS_TURN');
  }
  return null;
}

async function enabledExpectedIntent(page, projection, checkpoint) {
  const cardId = checkpoint.card_definition_id ?? cardIdBySource.get(checkpoint.source_definition_id);
  const candidates = projection.legal_intents.filter((intent) => intent.action_type === checkpoint.action_type
    && (!cardId || intent.card_definition_id === cardId));
  for (const candidate of candidates) {
    const button = candidate.action_type === 'DOCUMENT_LIVE'
      ? page.locator(`[data-preview-document="${candidate.intent_id}"]`).first()
      : page.locator(`[data-intent-id="${candidate.intent_id}"]`).first();
    if (await button.count() && !await button.isDisabled()) return candidate;
    if (candidate.card_instance_id
      && await page.locator(`[data-card-instance-id="${candidate.card_instance_id}"]`).count()) return candidate;
  }
  return expectedProjectedIntent(projection, checkpoint);
}

async function completeTutorial(page, definition, mode, { captureRecovery = false } = {}) {
  const seenEvents = new Set();
  let documentationRecoverySources = null;
  let sawVisibleDocumentationRecovery = false;
  for (let guard = 0; guard < 100; guard += 1) {
    await expect(page.locator('.tutorial-coach, .result-panel')).toHaveCount(1);
    if (await page.locator('.result-panel').count()) break;
    const checkpointId = await page.locator('.tutorial-coach').getAttribute('data-tutorial-checkpoint');
    const checkpoint = definition.checkpoints.find((entry) => entry.id === checkpointId);
    expect(checkpoint, `Unknown rendered checkpoint ${checkpointId}`).toBeTruthy();
    await expect(page.locator('[data-tutorial-target="true"]')).toHaveCount(1);
    await expect(page.locator('[data-tutorial-target="true"]')).toBeVisible();
    await expect(page.locator('#announcer')).toContainText(checkpoint.title);

    if (checkpoint.checkpoint_kind === 'EXPLAIN') {
      if (checkpoint.id === 'tutorial.fundamentals.isolation_help') {
        const latest = await latestMessage(page);
        const ticket = latest.projection.view.public_match.repair_queue[0];
        const effects = latest.projection.view.authorized_events
          .flatMap((event) => event.payload?.candidate_effects ?? [])
          .filter((effect) => [
            'fault.storage.raid.degraded',
            'fault.storage.sas.drive_failed',
          ].includes(effect.candidate_fault_id))
          .map((effect) => [effect.candidate_fault_id, effect.disposition]);
        expect(effects).toEqual([
          ['fault.storage.sas.drive_failed', 'SUPPORT'],
          ['fault.storage.raid.degraded', 'CONFIRM'],
        ]);
        expect(ticket.accepted_isolations).toEqual([]);
        expect(latest.projection.legal_intents.filter((intent) => intent.action_type === 'COMMIT_ISOLATION')).toHaveLength(2);
        expect(latest.projection.legal_intents.some((intent) => intent.action_type === 'PERFORM_REPAIR')).toBe(false);
        expect(JSON.stringify(latest.projection)).not.toMatch(/server_only_truth|actual_present|eligible_outcome_id|evidence\.raid\.single_member_health/);

        const coach = page.locator('.tutorial-coach');
        await expect(coach).toContainText('RAID Status confirmed RAID Array Degraded');
        await expect(coach).toContainText('non-actionable condition');
        await expect(coach).toContainText('Failed SAS Drive is an actionable fault');
        await expect(coach).toContainText('supported, not confirmed');
        await expect(coach).toContainText('drive, cable or backplane path, power, controller, or configuration');
        await expect(coach).toContainText('No accepted repair-opening Isolation exists yet');
        await expect(coach).toContainText('only its returned authorized Evidence');
        await expect(coach).not.toContainText('decisive failed-drive Evidence');

        await activate(page, page.locator('[data-view-full-ticket]'), mode);
        const dialog = page.locator('#full-ticket-dialog');
        await expect(dialog).toBeVisible();
        const guidance = dialog.locator('.isolation-guidance');
        await activate(page, guidance.locator('summary'), mode);
        await expect(guidance).toContainText('Accepted repair-opening Isolation: None yet');
        await expect(guidance).toContainText('Projected legal commit routes: 2 available');
        const array = guidance.locator('[data-candidate-id="fault.storage.raid.degraded"]');
        const drive = guidance.locator('[data-candidate-id="fault.storage.sas.drive_failed"]');
        await expect(array).toHaveAttribute('data-candidate-role', 'non_actionable');
        await expect(array).toHaveAttribute('data-commit-route', 'true');
        await expect(array).toContainText('Non-actionable condition');
        await expect(array).toContainText('CONFIRM');
        await expect(array).toContainText('not a repairable cause');
        await expect(drive).toHaveAttribute('data-candidate-role', 'actionable');
        await expect(drive).toHaveAttribute('data-commit-route', 'true');
        await expect(drive).toContainText('Actionable fault');
        await expect(drive).toContainText('SUPPORT');
        await expect(drive).toContainText('corroborated route');
        await expect(dialog).not.toContainText(/server_only_truth|actual_present|eligible_outcome|single_member_health/i);
        if (page.viewportSize()?.width >= 1500) {
          await page.evaluate(() => {
            document.documentElement.style.fontSize = '32px';
          });
          await expect.poll(() => page.evaluate(() =>
            document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
          await expect(array).toBeVisible();
          await expect(drive).toBeVisible();
          await page.evaluate(() => {
            document.documentElement.style.removeProperty('font-size');
          });
        }
        await activate(page, dialog.getByRole('button', { name: 'Close full Ticket' }), mode);
        await expect(dialog).not.toBeVisible();
      }
      await activate(page, page.locator('[data-tutorial-continue]'), mode);
      continue;
    }

    const latest = await latestMessage(page);
    let intent = await enabledExpectedIntent(page, latest.projection, checkpoint);
    const projectedControl = intent?.action_type === 'DOCUMENT_LIVE'
      ? page.locator(`[data-preview-document="${intent.intent_id}"]`).first()
      : page.locator(`[data-intent-id="${intent?.intent_id}"]`).first();
    if (!intent || (await projectedControl.count() && await projectedControl.isDisabled())) {
      if (checkpoint.id === 'tutorial.verify_recovery.document_live') {
        expect(latest.projection.view.public_match.turn.actions_remaining).toBe(0);
        expect(latest.projection.view.documentable_actions.length).toBeGreaterThan(0);
        expect(latest.projection.legal_intents.some((candidate) => candidate.action_type === 'DOCUMENT_LIVE')).toBe(false);
        documentationRecoverySources = latest.projection.view.documentable_actions
          .map((record) => record.source_action_event_id);
        await expect(page.locator('.tutorial-coach')).toContainText('Document Live costs 1 Action');
        await expect(page.locator('.tutorial-coach')).toContainText('Pass begins a fresh turn');
        await expect(page.locator('#announcer')).toContainText('Pass begins a fresh turn');
        await expect(page.locator('.basic-action--pass')).toBeEnabled();
        await expect(page.locator('.basic-action--pass')).toHaveAttribute('data-tutorial-target', 'true');
        await expect(page.locator('.basic-action--pass')).toBeFocused();
        const documentationWorkflow = page.locator('.legal-action-panel .documentation-workflow');
        await expect(documentationWorkflow).toContainText('eligible');
        await expect(documentationWorkflow).toContainText('1 Action');
        expect(await page.locator('[id]').evaluateAll((elements) =>
          elements.length - new Set(elements.map((element) => element.id)).size)).toBe(0);
        const disabledClose = documentationWorkflow.locator('.basic-action--close');
        if (await disabledClose.count()) {
          await expect(disabledClose).toBeDisabled();
          await expect(disabledClose).not.toHaveAttribute('data-tutorial-target', 'true');
        }
        if (page.viewportSize()?.width >= 1500) {
          await page.evaluate(() => {
            document.documentElement.style.fontSize = '32px';
            window.dispatchEvent(new Event('resize'));
          });
          await expect.poll(() => page.evaluate(() =>
            document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
          await expect(page.locator('.basic-action--pass')).toBeVisible();
          await page.evaluate(() => {
            document.documentElement.style.removeProperty('font-size');
            window.dispatchEvent(new Event('resize'));
          });
        }
        sawVisibleDocumentationRecovery = true;
      }
      intent = helperProjectedIntent(latest.projection, checkpoint);
    }
    expect(intent, `${checkpoint.id} did not expose an expected or recovery intent`).toBeTruthy();
    const before = await page.evaluate(() => window.__task015WorkerMessages.length);
    await submitProjectedIntent(page, intent, mode);
    await expect.poll(() => page.evaluate(() => window.__task015WorkerMessages.length)).toBeGreaterThan(before);
    const resolved = await latestMessage(page);
    for (const event of resolved.events ?? []) seenEvents.add(event.event_type);

    if (checkpoint.id === 'tutorial.verify_recovery.document_live'
        && intent.action_type === 'DOCUMENT_LIVE') {
      expect(sawVisibleDocumentationRecovery).toBe(true);
      expect(resolved.events.some((event) => event.event_type === 'WORKLOG_PUBLICATION'
        && event.payload.source_action_event_id === intent.source_action_event_id)).toBe(true);
      const remaining = resolved.projection.view.documentable_actions
        .map((record) => record.source_action_event_id);
      expect(remaining).toEqual(documentationRecoverySources
        .filter((sourceId) => sourceId !== intent.source_action_event_id));
    }

    if (captureRecovery && checkpoint.id === 'tutorial.verify_recovery.failed_verify'
      && resolved.events.some((event) => event.event_type === 'TICKET_RETURNED_TO_DIAGNOSIS')) {
      await expect(page.locator('.worklog-panel')).toContainText('RAID Healthy Verification');
      await expect(page.locator('.evidence-panel')).toContainText('still fails');
      if (UPDATE_VISUALS) {
        await page.waitForTimeout(1_400);
        await page.screenshot({ path: 'tests/visual/task-015/recovery-return-chromium-desktop.png', fullPage: true });
      }
    }
  }
  await expect(page.locator('.result-panel')).toBeVisible();
  await expect(page.locator('.authority-note')).toContainText('did not change Profile points or statistics');
  if (definition.id === 'tutorial.verify_recovery') expect(sawVisibleDocumentationRecovery).toBe(true);
  return seenEvents;
}

test('both real-engine tutorials complete with replay progress and recovery history', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Both long pinned paths run once on desktop.');
  await openHome(page);
  const [fundamentals, recovery] = tutorialCatalog.tutorials;

  await startTutorial(page, fundamentals, 'click');
  await expect(page.locator('.basic-action--pass')).toBeDisabled();
  if (UPDATE_VISUALS) {
    await page.waitForTimeout(1_400);
    await page.screenshot({ path: 'tests/visual/task-015/fundamentals-observe-chromium-desktop.png', fullPage: true });
  }
  const fundamentalsEvents = await completeTutorial(page, fundamentals, 'click');
  expect(fundamentalsEvents.has('ISOLATION_ACCEPTED')).toBe(true);
  expect(fundamentalsEvents.has('VERIFY_RESOLVED')).toBe(true);
  expect(fundamentalsEvents.has('CLOSURE_PUBLISHED')).toBe(true);
  const closedArchive = page.locator('.result-archive [data-archive-ticket-id]').first();
  await expect(closedArchive).toContainText('Closed');
  await activate(page, closedArchive, 'keyboard');
  await expect(page.locator('#archived-ticket-dialog')).toBeVisible();
  await expect(page.locator('#archived-ticket-dialog')).toContainText('Chronological Worklog');
  await expect(page.locator('#archived-ticket-dialog [data-intent-id], #archived-ticket-dialog [data-preview-document]')).toHaveCount(0);
  await expect(page.locator('#archived-ticket-dialog [data-view-solution-ticket]')).toHaveCount(0);
  await expect(page.locator('#archived-ticket-dialog')).not.toContainText('Hidden causal truth');
  await page.keyboard.press('Escape');
  await expect(closedArchive).toBeFocused();
  await activate(page, page.getByRole('button', { name: 'Return Home' }), 'click');
  await expect(page.locator(`[data-start-tutorial="${fundamentals.id}"]`)).toContainText('Completed · replay');

  await startTutorial(page, recovery, 'click');
  const recoveryEvents = await completeTutorial(page, recovery, 'click', { captureRecovery: true });
  expect(recoveryEvents.has('TICKET_RETURNED_TO_DIAGNOSIS')).toBe(true);
  expect(recoveryEvents.has('CLOSURE_PUBLISHED')).toBe(true);
  await activate(page, page.getByRole('button', { name: 'Replay tutorial' }), 'click');
  await expect(page.locator('.tutorial-coach')).toContainText(recovery.checkpoints[0].title);
});

test('fundamentals completes by keyboard, touch, and reduced-motion paths without overflow', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'chromium-desktop', 'Desktop click completion is covered by the two-path test.');
  const mode = interactionMode(testInfo.project.name);
  await openHome(page);
  const fundamentals = tutorialCatalog.tutorials[0];
  await startTutorial(page, fundamentals, mode);
  if (testInfo.project.name === 'chromium-reduced-motion') {
    const motion = await page.locator('.tutorial-coach').evaluate((node) => getComputedStyle(node).animationDuration);
    expect(motion === '0s' || motion === '0ms').toBe(true);
  }
  await completeTutorial(page, fundamentals, mode);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});

test('failed-Verify Documentation recovery completes by keyboard, touch, and reduced motion without overflow', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'chromium-desktop', 'Desktop click, focus, live region, and 200% reflow are covered by the two-path test.');
  const mode = interactionMode(testInfo.project.name);
  await openHome(page);
  const recovery = tutorialCatalog.tutorials.find((entry) => entry.id === 'tutorial.verify_recovery');
  await startTutorial(page, recovery, mode);
  if (testInfo.project.name === 'chromium-reduced-motion') {
    const motion = await page.locator('.tutorial-coach').evaluate((node) => getComputedStyle(node).animationDuration);
    expect(motion === '0s' || motion === '0ms').toBe(true);
  }
  await completeTutorial(page, recovery, mode);
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});

test('tutorial restart, back/re-explain, confirmed exit, and reload are safe', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Lifecycle controls run once.');
  await openHome(page);
  const definition = tutorialCatalog.tutorials[0];
  await startTutorial(page, definition, 'click');
  await activate(page, page.locator('[data-tutorial-continue]'), 'click');
  await activate(page, page.locator('[data-tutorial-back]'), 'click');
  await expect(page.locator('.tutorial-coach')).toContainText('Review · no state rewind');
  await activate(page, page.locator('[data-tutorial-continue]'), 'click');

  page.once('dialog', (dialog) => dialog.dismiss());
  await page.locator('[data-tutorial-restart]').click();
  await expect(page.locator('.tutorial-coach')).toContainText(definition.checkpoints[1].title);
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('[data-tutorial-restart]').click();
  await expect(page.locator('.tutorial-coach')).toContainText(definition.checkpoints[0].title);

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Start from Home' })).toBeVisible();
  await page.getByRole('link', { name: 'Return Home' }).click();
  await expect(page.getByRole('heading', { name: 'Tutorials' })).toBeVisible();
  await startTutorial(page, definition, 'click');
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('[data-tutorial-exit]').click();
  await expect(page.getByRole('heading', { name: 'Tutorials' })).toBeVisible();
  await expect(page.locator(`[data-start-tutorial="${definition.id}"]`)).toContainText('Start tutorial');

  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Help & guided practice' })).toBeVisible();
  await expect(page.locator(`[data-settings-tutorial="${definition.id}"]`)).toBeVisible();
});

test('Give Up submits once, keeps truth absent beforehand, and renders a rules-faithful diagnosis afterward', async ({ page }, testInfo) => {
  test.skip(!['chromium-desktop', 'chromium-mobile'].includes(testInfo.project.name), 'Reveal layout runs at desktop and mobile widths.');
  await openHome(page);
  await page.locator('#ticket-count').selectOption('1');
  await page.locator('#start-solo').click();
  await expect(page.getByRole('heading', { name: 'Diagnostic Bench' })).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.isolation-guidance')).toContainText('does not say whether the Candidate was wrong');
  await expect(page.locator('.game-route')).not.toContainText('Causal truth');
  const before = await page.evaluate(() => window.__task015WorkerRequests.filter((message) => message.type === 'SUBMIT_INTENT').length);
  const dialogPromise = page.waitForEvent('dialog');
  const click = page.getByRole('button', { name: 'Give Up', exact: true }).click();
  const dialog = await dialogPromise;
  expect(dialog.message()).toContain('voids pending contributions');
  expect(dialog.message()).toContain('Match ends without a solo win');
  await dialog.accept();
  await click;
  await expect(page.getByRole('heading', { name: 'Shift ended' })).toBeVisible({ timeout: 20_000 });
  await expect.poll(() => page.evaluate(() => window.__task015WorkerRequests.filter((message) => message.type === 'SUBMIT_INTENT').length)).toBe(before + 1);
  await expect(page.locator('.solution-reveal')).toContainText('Observe and original Candidates');
  await expect(page.locator('.solution-reveal')).toContainText('Hidden causal truth');
  await expect(page.locator('.solution-reveal')).toContainText('Required Evidence path');
  await expect(page.locator('.solution-reveal')).toContainText('Your investigation compared with the required path');
  await expect(page.locator('.solution-reveal')).toContainText('Verify and closure');
  await expect(page.locator('.solution-reveal')).toContainText('No further play can target this archived Ticket');
  if (UPDATE_VISUALS && testInfo.project.name === 'chromium-desktop') {
    await page.waitForTimeout(1_400);
    await page.screenshot({ path: 'tests/visual/task-015/give-up-reveal-chromium-desktop.png', fullPage: true });
  }
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});
