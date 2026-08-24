import { readFile } from 'node:fs/promises';

import { expect, test } from '@playwright/test';

const LOCAL_STATE_KEY = 'server-repair-tcg:solo-pages-v1:state';
const DESKTOP_PROJECT = 'chromium-desktop';
const UPDATE_VISUALS = process.env.UPDATE_TASK_010_VISUALS === '1';

test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chromium-reduced-motion') {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  }
});

function desktopOnly(testInfo) {
  test.skip(testInfo.project.name !== DESKTOP_PROJECT, 'The long-form interaction path runs once; layout coverage runs in every project.');
}

function collectClientErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  return errors;
}

function cssDurationMilliseconds(duration) {
  const value = Number.parseFloat(duration);
  return duration.trim().endsWith('ms') ? value : value * 1_000;
}

function maximumCssDurationMilliseconds(durations) {
  return Math.max(...durations.split(',').map(cssDurationMilliseconds));
}

async function openRoute(page, hash) {
  await page.goto(`/index.html${hash}`);
  await expect(page.locator('#app')).not.toHaveAttribute('aria-busy', 'true');
}

async function expectNoPageOverflow(page) {
  await expect.poll(() => page.evaluate(() => ({
    documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    bodyOverflow: document.body.scrollWidth - document.body.clientWidth,
  }))).toEqual({ documentOverflow: 0, bodyOverflow: 0 });
}

async function settleVisualSurface(page) {
  await page.waitForTimeout(1_400);
}

async function activate(page, locator, mode = 'click') {
  await expect(locator).toBeVisible();
  await expect(locator).toBeEnabled();
  if (mode === 'keyboard') {
    await locator.focus();
    await expect(locator).toBeFocused();
    const tagName = await locator.evaluate((node) => node.tagName);
    await page.keyboard.press(tagName === 'BUTTON' ? 'Space' : 'Enter');
  } else {
    await locator.click();
  }
}

async function activateWithDialog(page, locator, { accept, message, mode = 'click' }) {
  await expect(locator).toBeVisible();
  if (mode === 'keyboard') {
    await locator.focus();
    await expect(locator).toBeFocused();
  }
  const dialogPromise = page.waitForEvent('dialog');
  const activationPromise = mode === 'keyboard' ? page.keyboard.press('Enter') : locator.click();
  const dialog = await dialogPromise;
  if (message) expect(dialog.message()).toContain(message);
  if (accept) await dialog.accept();
  else await dialog.dismiss();
  await activationPromise;
}

async function chooseSelectOptionWithKeyboard(page, select, value) {
  const options = await select.locator('option').evaluateAll((nodes) => nodes.map((node) => node.value));
  const index = options.indexOf(value);
  expect(index, `Expected option ${value}`).toBeGreaterThanOrEqual(0);
  await select.focus();
  await page.keyboard.press('Home');
  for (let cursor = 0; cursor < index; cursor += 1) await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(select).toHaveValue(value);
}

async function installWorkerProbe(page, seedSuffix = 0) {
  await page.addInitScript(({ suffix }) => {
    const messagesToWorker = [];
    const messagesFromWorker = [];
    Object.defineProperties(window, {
      __soloMessagesToWorker: { value: messagesToWorker, configurable: false },
      __soloMessagesFromWorker: { value: messagesFromWorker, configurable: false },
    });

    const NativeWorker = window.Worker;
    window.Worker = new Proxy(NativeWorker, {
      construct(Target, argumentsList) {
        const worker = Reflect.construct(Target, argumentsList);
        const nativePostMessage = worker.postMessage.bind(worker);
        worker.postMessage = (message, transfer) => {
          messagesToWorker.push(structuredClone(message));
          return transfer === undefined
            ? nativePostMessage(message)
            : nativePostMessage(message, transfer);
        };
        worker.addEventListener('message', (event) => {
          messagesFromWorker.push(structuredClone(event.data));
        });
        return worker;
      },
    });

    const uuids = [
      '00000000-0000-4000-8000-999999999999',
      `00000000-0000-4000-8000-${String(suffix).padStart(12, '0')}`,
    ];
    let uuidIndex = 0;
    const originalRandomUuid = globalThis.crypto.randomUUID.bind(globalThis.crypto);
    Object.defineProperty(Crypto.prototype, 'randomUUID', {
      configurable: true,
      value() { return uuids[uuidIndex++] ?? originalRandomUuid(); },
    });
  }, { suffix: seedSuffix });
}

async function setTicketCount(page, count, mode = 'click') {
  const select = page.locator('#ticket-count');
  if (mode === 'keyboard') await chooseSelectOptionWithKeyboard(page, select, String(count));
  else await select.selectOption(String(count));
  await expect(select).toHaveValue(String(count));
}

async function startSolo(page, { count = 1, mode = 'click' } = {}) {
  await setTicketCount(page, count, mode);
  await activate(page, page.locator('#start-solo'), mode);
  await expect(page).toHaveURL(new RegExp(`#\/play\/game$`));
  await expect(page.getByRole('heading', { name: 'Night-shift board' })).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.ticket-card')).toHaveCount(count);
}

function scanCandidateEffects(value, target = []) {
  if (Array.isArray(value)) {
    for (const entry of value) scanCandidateEffects(entry, target);
    return target;
  }
  if (!value || typeof value !== 'object') return target;
  if (typeof value.candidate_fault_id === 'string' && typeof value.disposition === 'string') {
    target.push(value);
  }
  for (const child of Object.values(value)) scanCandidateEffects(child, target);
  return target;
}

function evidenceScore(projection, intent) {
  const candidate = intent.candidate_fault_id;
  if (!candidate) return 0;
  const weights = { CONFIRM: 8, SUPPORT: 3, INCONCLUSIVE: 0, CONTRADICT: -4, RULE_OUT: -8 };
  return scanCandidateEffects(projection.view)
    .filter((record) => record.candidate_fault_id === candidate)
    .reduce((sum, record) => sum + (weights[record.disposition] ?? 0), 0);
}

function evidenceCount(projection, ticketId) {
  return projection.view.authorized_events.filter((event) => event.ticket_instance_id === ticketId
    && ['EVIDENCE_CREATED', 'VERIFY_RESOLVED', 'VERIFY_EVIDENCE_CREATED'].includes(event.event_type)).length;
}

function preferredSearchIntent(projection, intents, searchedDefinitions) {
  if (!intents.length) return null;
  const queue = projection.view.public_match.repair_queue;
  const selectedTicket = queue.find((ticket) => ticket.ticket_instance_id === projection.__selectedTicketId) ?? queue[0];
  const acceptedFaultIds = selectedTicket?.accepted_isolations.map((entry) => entry.candidate_fault_id) ?? [];
  let preferredIds = [];
  if (selectedTicket?.status === 'REPAIR_READY') {
    preferredIds = acceptedFaultIds.includes('fault.storage.cable.loose')
      ? ['card.core.reseat_storage_cable']
      : acceptedFaultIds.includes('fault.storage.raid.degraded')
        ? ['card.core.rebuild_raid_array']
        : ['card.core.replace_raid_member'];
  } else if (selectedTicket?.status === 'AWAITING_VERIFY') {
    preferredIds = acceptedFaultIds.includes('fault.storage.cable.loose')
      ? ['card.core.storage_detection_verification']
      : ['card.core.raid_health_verification'];
  } else {
    const cableScenario = selectedTicket?.public_candidate_fault_ids.includes('fault.storage.cable.loose');
    preferredIds = cableScenario
      ? ['card.core.storage_device_inventory', 'card.core.visual_inspection']
      : ['card.core.raid_status_inspection', 'card.core.drive_health_test', 'card.core.smartctl_drive_health', 'card.core.raid_console_snapshot'];
    preferredIds = preferredIds.filter((id) => !searchedDefinitions.has(`${selectedTicket?.ticket_instance_id}:${id}`));
  }
  return preferredIds.map((id) => intents.find((intent) => intent.selected_card_definition_id === id)).find(Boolean)
    ?? intents.find((intent) => !searchedDefinitions.has(`${selectedTicket?.ticket_instance_id}:${intent.selected_card_definition_id}`))
    ?? intents[0];
}

function chooseSeatSafeIntent(projection, state) {
  const serialized = JSON.stringify(projection);
  for (const forbidden of ['server_only_truth', 'authored_evidence_outcomes', 'authored_repair_outcomes', 'authored_verification_outcomes', 'actual_present']) {
    expect(serialized).not.toContain(forbidden);
  }
  const intents = projection.legal_intents;
  const failureVisible = serialized.includes('"result":"FAIL"') || serialized.includes('VERIFY_FAILED');
  const queue = projection.view.public_match.repair_queue;
  const selectedTicket = queue.find((ticket) => ticket.ticket_instance_id === projection.__selectedTicketId) ?? queue[0];
  const searchTokens = projection.view.utility_resources.search_tokens;

  if (state.forceRefresh) {
    const refresh = intents.find((intent) => intent.action_type === 'REFRESH');
    if (refresh) return refresh;
  }
  if (state.forceSearch) {
    const searches = intents.filter((intent) => intent.action_type === 'SEARCH');
    const search = preferredSearchIntent(projection, searches, state.searchedDefinitions);
    if (search) return search;
  }

  const usable = intents.filter((intent) => {
    if (intent.action_type === 'SEARCH'
      && !['REPAIR_READY', 'AWAITING_VERIFY'].includes(selectedTicket?.status)
      && searchTokens <= 1) return false;
    if (intent.action_type === 'REVISE_HYPOTHESIS') {
      const key = `${intent.ticket_instance_id}:${intent.candidate_fault_id}:${evidenceCount(projection, intent.ticket_instance_id)}`;
      return !state.hypothesisStates.has(key);
    }
    if (intent.action_type !== 'COMMIT_ISOLATION') return true;
    const key = `${intent.ticket_instance_id}:${intent.candidate_fault_id}`;
    const previousAttempt = state.isolationAttemptEvidenceCounts.get(key);
    return previousAttempt === undefined || evidenceCount(projection, intent.ticket_instance_id) > previousAttempt;
  });
  const ranked = usable.map((intent) => {
    let priority = 50;
    if (intent.action_type === 'PUBLISH_CLOSURE') priority = 0;
    else if (intent.action_type === 'DOCUMENT_LIVE' && failureVisible) priority = 1;
    else if (intent.action_type === 'PERFORM_VERIFY') priority = 2;
    else if (intent.action_type === 'PERFORM_REPAIR') priority = 3;
    else if (intent.action_type === 'COMMIT_ISOLATION') priority = evidenceScore(projection, intent) > 0 ? 4 : 20;
    else if (intent.action_type === 'RUN_TEST' || intent.action_type === 'PLAY_CARD') priority = 6;
    else if (intent.action_type === 'DOCUMENT_LIVE') priority = 7;
    else if (intent.action_type === 'SEARCH') priority = 8;
    else if (intent.action_type === 'REFRESH') priority = 9;
    else if (intent.action_type === 'REVISE_HYPOTHESIS') priority = 10;
    else if (intent.action_type === 'PASS_TURN') priority = 100;
    return { intent, priority, evidence: evidenceScore(projection, intent) };
  }).sort((left, right) => left.priority - right.priority
    || right.evidence - left.evidence
    || JSON.stringify(left.intent).localeCompare(JSON.stringify(right.intent)));
  return ranked[0]?.intent ?? intents.find((intent) => intent.action_type === 'PASS_TURN');
}

async function latestWorkerProjection(page) {
  return page.evaluate(() => {
    const message = [...window.__soloMessagesFromWorker].reverse()
      .find((candidate) => candidate.type === 'MATCH_STARTED' || candidate.type === 'INTENT_RESOLVED');
    return message ? structuredClone(message) : null;
  });
}

async function submitProjectedIntent(page, intent, mode) {
  if (intent.ticket_instance_id) {
    const ticket = page.locator(`[data-ticket-id="${intent.ticket_instance_id}"]`);
    if (await ticket.getAttribute('aria-current') !== 'true') await activate(page, ticket, mode);
  }
  if (intent.card_instance_id) {
    const card = page.locator(`[data-card-instance-id="${intent.card_instance_id}"]`);
    if (await card.getAttribute('aria-pressed') !== 'true') await activate(page, card, mode);
  }

  if (intent.action_type === 'SEARCH') {
    const select = page.locator('#search-intent');
    if (mode === 'keyboard') await chooseSelectOptionWithKeyboard(page, select, intent.intent_id);
    else await select.selectOption(intent.intent_id);
    await activate(page, page.locator('[data-submit-search]'), mode);
  } else {
    await activate(page, page.locator(`[data-intent-id="${intent.intent_id}"]`), mode);
  }
}

async function completeSoloFromSafeProjections(page, {
  mode,
  forceSearchAndRefresh = false,
  maximumIntents = 400,
} = {}) {
  const state = {
    forceRefresh: forceSearchAndRefresh,
    forceSearch: forceSearchAndRefresh,
    searchedDefinitions: new Set(),
    isolationAttemptEvidenceCounts: new Map(),
    hypothesisStates: new Set(),
    eventTypes: new Set(),
    submittedIntents: 0,
  };

  for (let step = 0; step < maximumIntents; step += 1) {
    const latest = await latestWorkerProjection(page);
    expect(latest).not.toBeNull();
    for (const event of latest.events ?? []) state.eventTypes.add(event.event_type);
    if (latest.terminal_result) return { ...state, terminalResult: latest.terminal_result };

    const selectedTicketId = await page.locator('.ticket-card[aria-current="true"]').getAttribute('data-ticket-id');
    const projection = latest.projection;
    projection.__selectedTicketId = selectedTicketId;
    const intent = chooseSeatSafeIntent(projection, state);
    expect(intent, `No projected intent at step ${step}`).toBeTruthy();
    const beforeInbound = await page.evaluate(() => window.__soloMessagesFromWorker.length);
    const beforeOutbound = await page.evaluate(() => window.__soloMessagesToWorker.filter((message) => message.type === 'SUBMIT_INTENT').length);

    await submitProjectedIntent(page, intent, mode);
    await expect.poll(() => page.evaluate(() => window.__soloMessagesFromWorker.length)).toBeGreaterThan(beforeInbound);
    await expect.poll(() => page.evaluate(() => window.__soloMessagesToWorker.filter((message) => message.type === 'SUBMIT_INTENT').length)).toBe(beforeOutbound + 1);
    const resolved = await latestWorkerProjection(page);
    state.submittedIntents += 1;
    for (const event of resolved.events ?? []) state.eventTypes.add(event.event_type);

    if (intent.action_type === 'REFRESH') state.forceRefresh = false;
    if (intent.action_type === 'SEARCH') {
      state.forceSearch = false;
      state.searchedDefinitions.add(`${intent.ticket_instance_id ?? selectedTicketId}:${intent.selected_card_definition_id}`);
    }
    if (intent.action_type === 'COMMIT_ISOLATION' && resolved.result?.resolution_code === 'ISOLATION_NOT_SUPPORTED') {
      const key = `${intent.ticket_instance_id}:${intent.candidate_fault_id}`;
      state.isolationAttemptEvidenceCounts.set(key, evidenceCount(projection, intent.ticket_instance_id));
    }
    if (intent.action_type === 'REVISE_HYPOTHESIS') {
      const key = `${intent.ticket_instance_id}:${intent.candidate_fault_id}:${evidenceCount(projection, intent.ticket_instance_id)}`;
      state.hypothesisStates.add(key);
    }
  }
  throw new Error(`Solo game did not terminate within ${maximumIntents} projected intents.`);
}

async function submitSpecificProjectedIntent(page, {
  actionType,
  cardDefinitionId = null,
  candidateFaultId = null,
  mode = 'keyboard',
  maximumTurns = 60,
}) {
  for (let attempt = 0; attempt < maximumTurns; attempt += 1) {
    const latest = await latestWorkerProjection(page);
    const projection = latest.projection;
    const serialized = JSON.stringify(projection);
    for (const forbidden of ['server_only_truth', 'authored_evidence_outcomes', 'authored_repair_outcomes', 'authored_verification_outcomes', 'actual_present']) {
      expect(serialized).not.toContain(forbidden);
    }
    const intent = projection.legal_intents.find((candidate) => candidate.action_type === actionType
      && (!cardDefinitionId || candidate.card_definition_id === cardDefinitionId)
      && (!candidateFaultId || candidate.candidate_fault_id === candidateFaultId));
    const beforeInbound = await page.evaluate(() => window.__soloMessagesFromWorker.length);
    if (intent) {
      await submitProjectedIntent(page, intent, mode);
      await expect.poll(() => page.evaluate(() => window.__soloMessagesFromWorker.length)).toBeGreaterThan(beforeInbound);
      return latestWorkerProjection(page);
    }

    const search = cardDefinitionId
      ? projection.legal_intents.find((candidate) => candidate.action_type === 'SEARCH'
        && candidate.selected_card_definition_id === cardDefinitionId)
      : null;
    const pass = projection.legal_intents.find((candidate) => candidate.action_type === 'PASS_TURN');
    const recoveryIntent = search ?? pass;
    expect(recoveryIntent, `No projected Search or Pass while waiting for ${actionType} ${cardDefinitionId ?? candidateFaultId ?? ''}`).toBeTruthy();
    await submitProjectedIntent(page, recoveryIntent, mode);
    await expect.poll(() => page.evaluate(() => window.__soloMessagesFromWorker.length)).toBeGreaterThan(beforeInbound);
  }
  throw new Error(`Projected action ${actionType} ${cardDefinitionId ?? candidateFaultId ?? ''} did not become available.`);
}

test('Library and Play routes preserve state, history, focus, and page width', async ({ page }, testInfo) => {
  const errors = collectClientErrors(page);
  await openRoute(page, '#/play/home');
  await expect(page.getByRole('heading', { name: 'Take the next repair queue' })).toBeVisible();
  await expect(page.locator('#play-tab')).toHaveAttribute('aria-current', 'page');
  await expectNoPageOverflow(page);

  if (testInfo.project.name === 'chromium-reduced-motion') {
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
    const playDuration = await page.locator('.home-anchor').evaluate((node) => getComputedStyle(node).animationDuration);
    expect(cssDurationMilliseconds(playDuration)).toBeLessThanOrEqual(1);
  }

  await page.locator('#home-heading').evaluate((node) => { node.dataset.acceptanceIdentity = 'preserved'; });
  await page.locator('#play-tab').click();
  await expect(page.getByRole('heading', { name: 'Take the next repair queue' })).toBeVisible();
  await expect(page.locator('#home-heading')).toHaveAttribute('data-acceptance-identity', 'preserved');

  await page.getByRole('link', { name: 'Decks', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your Decks' })).toBeVisible();
  const nestedPlayHistoryLength = await page.evaluate(() => history.length);
  await page.locator('#play-tab').click();
  await expect(page.getByRole('heading', { name: 'Your Decks' })).toBeVisible();
  expect(await page.evaluate(() => history.length)).toBe(nestedPlayHistoryLength);
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Take the next repair queue' })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole('heading', { name: 'Your Decks' })).toBeVisible();
  await expectNoPageOverflow(page);

  await page.locator('#library-tab').click();
  await expect(page.getByRole('heading', { name: 'Domain Library' })).toBeVisible();
  await page.locator('#search').fill('storage');
  await page.locator('#sort').selectOption('id');
  const resultCount = await page.locator('#resultCount').textContent();
  await page.locator('.library-card').first().click();
  await expect(page.locator('#dialog')).toBeVisible();
  await page.evaluate(() => { location.hash = '#/play/home'; });
  await expect(page.getByRole('heading', { name: 'Take the next repair queue' })).toBeVisible();
  await page.locator('#library-tab').click();
  await expect(page.locator('#search')).toHaveValue('storage');
  await expect(page.locator('#sort')).toHaveValue('id');
  await expect(page.locator('#resultCount')).toHaveText(resultCount);
  await expect(page.locator('#dialog')).toBeVisible();
  await expectNoPageOverflow(page);

  if (testInfo.project.name === 'chromium-reduced-motion') {
    const duration = await page.locator('.library-page').evaluate((node) => getComputedStyle(node).animationDuration);
    expect(cssDurationMilliseconds(duration)).toBeLessThanOrEqual(1);
  }
  expect(errors).toEqual([]);
});

test('Deck, Profile, Settings, export/import, and destructive confirmations are keyboard accessible and persistent', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const errors = collectClientErrors(page);
  await openRoute(page, '#/play/decks');
  await expect(page.getByRole('heading', { name: 'Your Decks' })).toBeVisible();
  await expect(page.locator('.deck-gallery-card')).toHaveCount(1);

  const inspect = page.locator('[data-inspect-card]').first();
  await activate(page, inspect, 'keyboard');
  await expect(page.locator('#deck-card-dialog')).toBeVisible();
  await expect(page.locator('#deck-card-dialog .card-detail')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(inspect).toBeFocused();

  await activate(page, page.getByRole('button', { name: 'Edit', exact: true }), 'keyboard');
  await expect(page.getByRole('heading', { name: 'Edit response kit' })).toBeVisible();
  const remove = page.getByRole('button', { name: /^Remove one / }).first();
  await activate(page, remove, 'keyboard');
  await expect(page.locator('.deck-editor-status')).toContainText('29 / 30');
  await activateWithDialog(page, page.getByRole('link', { name: 'Your Decks' }), {
    accept: false,
    message: 'Discard unsaved deck changes',
  });
  await expect(page.getByRole('heading', { name: 'Edit response kit' })).toBeVisible();
  await activateWithDialog(page, page.getByRole('link', { name: 'Your Decks' }), { accept: true });
  await expect(page.getByRole('heading', { name: 'Your Decks' })).toBeVisible();

  await page.getByRole('link', { name: 'Profile', exact: true }).click();
  const profileName = page.locator('#profile-name');
  await profileName.fill('Browser Shift Lead');
  await activate(page, page.getByRole('button', { name: 'Save profile' }), 'keyboard');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();
  await expect(page.locator('#profile-name')).toHaveValue('Browser Shift Lead');

  const settingsTrigger = page.locator('#settings-trigger');
  await activate(page, settingsTrigger, 'keyboard');
  const settings = page.locator('dialog.settings-dialog');
  await expect(settings).toBeVisible();
  await settings.locator('#settings-motion').selectOption('REDUCED');
  await settings.locator('#settings-drag').check();
  await activate(page, settings.getByRole('button', { name: 'Save settings' }), 'keyboard');
  await expect(settings.locator('[data-inline-notice]')).toContainText('Settings saved');
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(false);
  await expect(page.locator('#app')).toHaveAttribute('data-motion', 'reduced');
  const transitionDurations = await settings.getByRole('button', { name: 'Save settings' }).evaluate(
    (node) => getComputedStyle(node).transitionDuration,
  );
  expect(maximumCssDurationMilliseconds(transitionDurations)).toBeLessThanOrEqual(1);

  const downloadPromise = page.waitForEvent('download');
  await activate(page, settings.getByRole('button', { name: 'Export backup' }), 'keyboard');
  const download = await downloadPromise;
  const backupPath = await download.path();
  const backup = JSON.parse(await readFile(backupPath, 'utf8'));
  expect(backup.records.profile.display_name).toBe('Browser Shift Lead');
  expect(JSON.stringify(backup)).not.toContain('match_state');
  expect(Object.keys(backup)).toEqual(['exported_at', 'implementation_profile_id', 'records', 'schema_version']);

  await settings.locator('#import-file').setInputFiles({
    name: 'corrupt.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"__proto__":{"polluted":true}}'),
  });
  await expect(settings.locator('[data-inline-notice]')).toContainText(/rejected|invalid|JSON|field/i);
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).records.profile.display_name, LOCAL_STATE_KEY)).toBe('Browser Shift Lead');

  await settings.locator('#import-file').setInputFiles(backupPath);
  await expect(settings.getByRole('heading', { name: 'Replacement preview' })).toBeVisible();
  await expect(settings.locator('.import-preview')).toContainText('Browser Shift Lead');
  await settings.locator('#confirm-import-check').check();
  await activateWithDialog(page, settings.getByRole('button', { name: 'Replace local data' }), {
    accept: true,
    message: 'Replace all current local',
    mode: 'keyboard',
  });
  await expect(settings).toBeHidden();
  await expect(settingsTrigger).toBeFocused();
  await expect(page.locator('#profile-name')).toHaveValue('Browser Shift Lead');
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).records.settings.drag_enabled, LOCAL_STATE_KEY)).toBe(true);

  await page.getByRole('link', { name: 'Decks', exact: true }).click();
  const reducedMotionInspect = page.locator('[data-inspect-card]').first();
  await reducedMotionInspect.click();
  const reducedMotionCardDialog = page.locator('#deck-card-dialog');
  await expect(reducedMotionCardDialog).toBeVisible();
  const closedSynchronously = await reducedMotionCardDialog.evaluate((dialog) => {
    dialog.querySelector('[data-close-dialog]').click();
    return !dialog.open;
  });
  expect(closedSynchronously).toBe(true);
  await expect(reducedMotionInspect).toBeFocused();
  expect(errors).toEqual([]);
});

test('a click-only one-Ticket shift uses Search, Refresh, optional drag fallback, opaque Worker intents, closure, and exactly-once Profile totals', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  const errors = collectClientErrors(page);
  await installWorkerProbe(page, 0);
  await openRoute(page, '#/play/home');
  await page.locator('#settings-trigger').click();
  await page.locator('#settings-drag').check();
  await page.getByRole('button', { name: 'Save settings' }).click();
  await page.getByRole('button', { name: 'Close Settings' }).click();
  await startSolo(page, { count: 1, mode: 'click' });

  const firstLegalCard = page.locator('.play-card[data-legal-target="true"]').first();
  await expect(firstLegalCard).toHaveAttribute('draggable', 'true');
  const submitCountBeforeInvalidDrag = await page.evaluate(() => window.__soloMessagesToWorker.filter((message) => message.type === 'SUBMIT_INTENT').length);
  const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
  await firstLegalCard.dispatchEvent('dragstart', { dataTransfer });
  await page.locator('.action-dock').dispatchEvent('dragover', { dataTransfer });
  await page.locator('.action-dock').dispatchEvent('drop', { dataTransfer });
  await firstLegalCard.dispatchEvent('dragend', { dataTransfer });
  expect(await page.evaluate(() => window.__soloMessagesToWorker.filter((message) => message.type === 'SUBMIT_INTENT').length)).toBe(submitCountBeforeInvalidDrag);
  await expect(firstLegalCard).toBeVisible();

  const outcome = await completeSoloFromSafeProjections(page, {
    mode: 'click',
    forceSearchAndRefresh: true,
  });
  expect(outcome.terminalResult.tickets_closed).toBe(1);
  expect(outcome.terminalResult.solo_wins).toBe(1);
  expect(outcome.eventTypes).toContain('CLOSURE_PUBLISHED');
  expect(outcome.terminalResult.search_uses).toBeGreaterThan(0);
  expect(outcome.terminalResult.refresh_uses).toBeGreaterThan(0);
  await expect(page.getByRole('heading', { name: 'Queue cleared' })).toBeVisible();
  await expect(page.locator('#result-heading')).toBeFocused();
  await expect(page.locator('.result-record-status')).toContainText('exactly once');
  await settleVisualSurface(page);
  if (UPDATE_VISUALS) {
    await page.screenshot({
      path: 'tests/visual/task-010/chromium-desktop-result-normal.png',
      fullPage: true,
    });
  }

  const outbound = await page.evaluate(() => structuredClone(window.__soloMessagesToWorker));
  const submissions = outbound.filter((message) => message.type === 'SUBMIT_INTENT');
  expect(submissions.length).toBe(outcome.submittedIntents);
  for (const message of submissions) {
    expect(Object.keys(message).sort()).toEqual(['intent_id', 'type']);
    expect(message.intent_id).toMatch(/^intent\.\d+\.\d{4}$/);
  }

  await page.getByRole('button', { name: 'View Profile' }).click();
  await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();
  await expect(page.locator('.profile-statistics')).toContainText('1');
  const totals = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).records.statistics.totals, LOCAL_STATE_KEY);
  expect(totals.matches_started).toBe(1);
  expect(totals.matches_completed).toBe(1);
  expect(totals.tickets_closed).toBe(1);
  await page.reload();
  const totalsAfterReload = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).records.statistics.totals, LOCAL_STATE_KEY);
  expect(totalsAfterReload).toEqual(totals);
  expect(errors).toEqual([]);
});

test('optional HTML drag submits one engine-projected opaque intent', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  const errors = collectClientErrors(page);
  await installWorkerProbe(page, 0);
  await openRoute(page, '#/play/home');
  await page.locator('#settings-trigger').click();
  await page.locator('#settings-drag').check();
  await page.getByRole('button', { name: 'Save settings' }).click();
  await page.getByRole('button', { name: 'Close Settings' }).click();
  await startSolo(page, { count: 1 });

  const legalDragCard = page.locator('.play-card[data-legal-target="true"]').first();
  const legalDropTarget = page.locator('.ticket-card[data-drop-target="true"]').first();
  await expect(legalDragCard).toHaveAttribute('draggable', 'true');
  const inboundBefore = await page.evaluate(() => window.__soloMessagesFromWorker.length);
  const outboundBefore = await page.evaluate(() => window.__soloMessagesToWorker.filter((message) => message.type === 'SUBMIT_INTENT').length);
  const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
  await legalDragCard.dispatchEvent('dragstart', { dataTransfer });
  await legalDropTarget.dispatchEvent('dragover', { dataTransfer });
  await legalDropTarget.dispatchEvent('drop', { dataTransfer });
  await expect.poll(() => page.evaluate(() => window.__soloMessagesFromWorker.length)).toBeGreaterThan(inboundBefore);
  await expect.poll(() => page.evaluate(() => window.__soloMessagesToWorker.filter((message) => message.type === 'SUBMIT_INTENT').length)).toBe(outboundBefore + 1);
  const submission = await page.evaluate(() => [...window.__soloMessagesToWorker].reverse().find((message) => message.type === 'SUBMIT_INTENT'));
  expect(Object.keys(submission).sort()).toEqual(['intent_id', 'type']);
  expect(submission.intent_id).toMatch(/^intent\.\d+\.\d{4}$/);
  expect(errors).toEqual([]);
});

test('touch-pointer drag captures, cancels safely, and submits one opaque projected intent', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-tablet', 'The touch-pointer branch runs once in the configured touch project.');
  const errors = collectClientErrors(page);
  await page.addInitScript(() => {
    const captures = new WeakMap();
    const captureEvents = [];
    Object.defineProperty(window, '__touchCaptureEvents', { value: captureEvents, configurable: false });
    Object.defineProperties(Element.prototype, {
      setPointerCapture: {
        configurable: true,
        value(pointerId) {
          captures.set(this, pointerId);
          captureEvents.push({ action: 'set', pointerId });
        },
      },
      hasPointerCapture: {
        configurable: true,
        value(pointerId) { return captures.get(this) === pointerId; },
      },
      releasePointerCapture: {
        configurable: true,
        value(pointerId) {
          if (captures.get(this) === pointerId) captures.delete(this);
          captureEvents.push({ action: 'release', pointerId });
        },
      },
    });
  });
  await installWorkerProbe(page, 10);
  await page.setViewportSize({ width: 1024, height: 3000 });
  await openRoute(page, '#/play/home');
  await page.locator('#settings-trigger').click();
  await page.locator('#settings-drag').check();
  await page.getByRole('button', { name: 'Save settings' }).click();
  await page.getByRole('button', { name: 'Close Settings' }).click();
  await startSolo(page, { count: 1 });

  const touchCard = page.locator('.play-card[data-legal-target="true"]').first();
  const ticket = page.locator('.ticket-card[data-drop-target="true"]').first();
  const cardBox = await touchCard.boundingBox();
  const ticketBox = await ticket.boundingBox();
  expect(cardBox).toBeTruthy();
  expect(ticketBox).toBeTruthy();
  const start = { x: cardBox.x + cardBox.width / 2, y: cardBox.y + cardBox.height / 2 };
  const target = { x: ticketBox.x + ticketBox.width / 2, y: ticketBox.y + ticketBox.height / 2 };
  const dispatch = (type, pointerId, point, buttons) => page.evaluate((eventInit) => {
    const card = document.querySelector('.play-card[data-legal-target="true"]');
    if (!card) throw new Error('Touch test could not find a legal card.');
    card.dispatchEvent(new PointerEvent(eventInit.type, {
      bubbles: true,
      cancelable: true,
      clientX: eventInit.point.x,
      clientY: eventInit.point.y,
      isPrimary: true,
      pointerId: eventInit.pointerId,
      pointerType: 'touch',
      button: eventInit.type === 'pointerdown' ? 0 : -1,
      buttons: eventInit.buttons,
    }));
  }, { type, pointerId, point, buttons });

  const submitCount = () => page.evaluate(() => window.__soloMessagesToWorker.filter((message) => message.type === 'SUBMIT_INTENT').length);
  const beforeCancel = await submitCount();
  await dispatch('pointerdown', 71, start, 1);
  await dispatch('pointermove', 71, target, 1);
  await expect(ticket).toHaveAttribute('data-drag-target', 'true');
  await page.keyboard.press('Escape');
  await expect(ticket).not.toHaveAttribute('data-drag-target', 'true');
  await dispatch('pointerup', 71, target, 0);
  expect(await submitCount()).toBe(beforeCancel);

  await page.waitForTimeout(20);
  await dispatch('pointerdown', 72, start, 1);
  await dispatch('pointermove', 72, target, 1);
  await dispatch('pointerup', 72, target, 0);
  await expect.poll(submitCount).toBe(beforeCancel + 1);
  const submission = await page.evaluate(() => [...window.__soloMessagesToWorker].reverse().find((message) => message.type === 'SUBMIT_INTENT'));
  expect(Object.keys(submission).sort()).toEqual(['intent_id', 'type']);
  const captureEvents = await page.evaluate(() => window.__touchCaptureEvents);
  expect(captureEvents).toEqual([
    { action: 'set', pointerId: 71 },
    { action: 'release', pointerId: 71 },
    { action: 'set', pointerId: 72 },
    { action: 'release', pointerId: 72 },
  ]);
  expect(errors).toEqual([]);
});

test('preserve representative Home and live-game visual captures for every configured viewport and motion profile', async ({ page }, testInfo) => {
  const errors = collectClientErrors(page);
  await installWorkerProbe(page, 0);
  await openRoute(page, '#/play/home');
  await expect(page.getByRole('heading', { name: 'Take the next repair queue' })).toBeVisible();
  await expectNoPageOverflow(page);
  await settleVisualSurface(page);
  if (UPDATE_VISUALS) {
    await page.screenshot({
      path: `tests/visual/task-010/${testInfo.project.name}-home.png`,
      fullPage: true,
    });
  }

  await startSolo(page, { count: 1 });
  await expectNoPageOverflow(page);
  await settleVisualSurface(page);
  if (UPDATE_VISUALS) {
    await page.screenshot({
      path: `tests/visual/task-010/${testInfo.project.name}-game.png`,
      fullPage: true,
    });
  }
  expect(errors).toEqual([]);
});

test('a keyboard-only advanced shift preserves failed Verify history and completes without drag', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  test.slow();
  const errors = collectClientErrors(page);
  await installWorkerProbe(page, 1);
  await openRoute(page, '#/play/home');
  await startSolo(page, { count: 1, mode: 'keyboard' });
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).records.settings.drag_enabled, LOCAL_STATE_KEY)).toBe(false);
  await expect(page.locator('#selected-ticket-heading')).toHaveText('The Rebuild Still Needed');

  await submitSpecificProjectedIntent(page, {
    actionType: 'RUN_TEST',
    cardDefinitionId: 'card.core.raid_status_inspection',
  });
  await submitSpecificProjectedIntent(page, {
    actionType: 'RUN_TEST',
    cardDefinitionId: 'card.core.drive_health_test',
  });
  await submitSpecificProjectedIntent(page, {
    actionType: 'COMMIT_ISOLATION',
    candidateFaultId: 'fault.storage.sas.drive_failed',
  });
  await submitSpecificProjectedIntent(page, {
    actionType: 'PERFORM_REPAIR',
    cardDefinitionId: 'card.core.replace_raid_member',
  });
  const failedVerify = await submitSpecificProjectedIntent(page, {
    actionType: 'PERFORM_VERIFY',
    cardDefinitionId: 'card.core.raid_health_verification',
  });
  expect(failedVerify.events.map((event) => event.event_type)).toContain('TICKET_RETURNED_TO_DIAGNOSIS');
  await expect(page.locator('.ticket-sheet')).toHaveAttribute('class', /is-returned/);

  await submitSpecificProjectedIntent(page, {
    actionType: 'COMMIT_ISOLATION',
    candidateFaultId: 'fault.storage.raid.degraded',
  });
  await submitSpecificProjectedIntent(page, {
    actionType: 'PERFORM_REPAIR',
    cardDefinitionId: 'card.core.rebuild_raid_array',
  });
  await submitSpecificProjectedIntent(page, {
    actionType: 'PERFORM_VERIFY',
    cardDefinitionId: 'card.core.raid_health_verification',
  });
  const closure = await submitSpecificProjectedIntent(page, { actionType: 'PUBLISH_CLOSURE' });
  expect(closure.events.map((event) => event.event_type)).toContain('CLOSURE_PUBLISHED');
  expect(closure.terminal_result.solo_wins).toBe(1);
  expect(closure.terminal_result.failed_verifies).toBeGreaterThan(0);
  await expect(page.getByRole('heading', { name: 'Queue cleared' })).toBeVisible();
  await expect(page.locator('.result-stat-grid')).toContainText(/Failed Verify\s*1/);
  expect(errors).toEqual([]);
});

test('ten-Ticket queues disclose repeated structures, prevent duplicate submissions, and confirm active-match exit', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  const errors = collectClientErrors(page);
  await installWorkerProbe(page, 3);
  await openRoute(page, '#/play/home');
  await setTicketCount(page, 10);
  await expect(page.locator('#duplicate-disclosure')).toBeVisible();
  await expect(page.locator('#duplicate-disclosure')).toContainText('repeated templates');
  await activate(page, page.locator('#start-solo'));
  await expect(page.getByRole('heading', { name: 'Night-shift board' })).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.ticket-card')).toHaveCount(10);
  await expect(page.locator('.game-disclosure')).toContainText('10-Ticket training queue');
  await expectNoPageOverflow(page);

  const directIntent = page.locator('[data-intent-id]').first();
  const outboundBefore = await page.evaluate(() => window.__soloMessagesToWorker.filter((message) => message.type === 'SUBMIT_INTENT').length);
  await directIntent.evaluate((button) => { button.click(); button.click(); });
  await expect.poll(() => page.evaluate(() => window.__soloMessagesToWorker.filter((message) => message.type === 'SUBMIT_INTENT').length)).toBe(outboundBefore + 1);

  await activateWithDialog(page, page.getByRole('link', { name: 'Home', exact: true }), {
    accept: false,
    message: 'Leave this active Match',
  });
  await expect(page.getByRole('heading', { name: 'Night-shift board' })).toBeVisible();
  await activateWithDialog(page, page.getByRole('link', { name: 'Home', exact: true }), { accept: true });
  await expect(page.getByRole('heading', { name: 'Take the next repair queue' })).toBeVisible();
  expect(errors).toEqual([]);
});
