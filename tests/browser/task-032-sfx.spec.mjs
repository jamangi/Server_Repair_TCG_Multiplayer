import { expect, test } from '@playwright/test';

const LOCAL_STATE_KEY = 'server-repair-tcg:solo-pages-v2:state';

async function installAudioProbe(page) {
  await page.addInitScript(() => {
    const probe = {
      contexts: 0,
      resumes: 0,
      cues: [],
      masterTargets: [],
      disconnects: 0,
      noiseFrames: 0,
    };
    Object.defineProperty(window, '__task032SfxProbe', { value: probe });

    class Param {
      constructor(kind) { this.kind = kind; this.value = 0; }
      setValueAtTime(value) { this.value = value; }
      linearRampToValueAtTime(value) {
        this.value = value;
        if (this.kind === 'gain') probe.cues.push(value);
      }
      exponentialRampToValueAtTime(value) { this.value = value; }
      setTargetAtTime(value) { this.value = value; probe.masterTargets.push(value); }
      cancelScheduledValues() {}
    }
    class Node {
      constructor(kind) {
        this.kind = kind;
        this.gain = new Param('gain');
        this.frequency = new Param('frequency');
        this.Q = new Param('q');
        this.delayTime = new Param('delay');
      }
      connect() { return this; }
      disconnect() { probe.disconnects += 1; }
      start() {}
      stop() {}
    }
    class ProbeAudioContext {
      constructor() {
        probe.contexts += 1;
        this.state = 'suspended';
        this.currentTime = 1;
        this.sampleRate = 8_000;
        this.destination = new Node('destination');
      }
      createGain() { return new Node('gain'); }
      createBiquadFilter() { return new Node('filter'); }
      createDelay() { return new Node('delay'); }
      createOscillator() { return new Node('oscillator'); }
      createBufferSource() { return new Node('buffer-source'); }
      createBuffer(channels, frames) {
        probe.noiseFrames += frames;
        const data = new Float32Array(frames);
        return { getChannelData: () => data };
      }
      async resume() { probe.resumes += 1; this.state = 'running'; }
      async close() { this.state = 'closed'; }
    }
    window.AudioContext = ProbeAudioContext;
    window.webkitAudioContext = ProbeAudioContext;
  });
}

const cueCount = (page) => page.evaluate(() => window.__task032SfxProbe.cues.length);

async function expectKeyboardCue(page, locator, action = null) {
  await expect(locator).toBeVisible();
  await expect(locator).toBeEnabled();
  await locator.focus();
  const before = await cueCount(page);
  const tag = await locator.evaluate((element) => element.tagName);
  await page.keyboard.press(action ?? (tag === 'BUTTON' ? 'Space' : 'Enter'));
  await expect.poll(() => cueCount(page)).toBeGreaterThan(before);
}

test.beforeEach(async ({ page }) => {
  await installAudioProbe(page);
});

test('shared SFX service covers Library, Settings, every Play destination, game, result, and recovery', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'The complete route audit runs once on desktop.');
  const errors = [];
  const audioRequests = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', (request) => {
    if (/\.(?:mp3|wav|ogg|aac|flac)(?:$|[?#])/i.test(request.url())) audioRequests.push(request.url());
  });

  await page.goto('/index.html#/library');
  await expect(page.getByRole('heading', { name: /Domain Library/i })).toBeVisible();
  expect(await page.evaluate(() => window.__task032SfxProbe.contexts)).toBe(0);
  const invalidSelectors = await page.evaluate(async () => {
    const { SFX_INTERACTIONS } = await import('/generated/sfx/catalog.mjs');
    return SFX_INTERACTIONS.flatMap((interaction) => {
      try {
        document.querySelector(interaction.selector);
        return [];
      } catch (error) {
        return [{ id: interaction.interaction_id, selector: interaction.selector, message: error.message }];
      }
    });
  });
  expect(invalidSelectors).toEqual([]);

  await expectKeyboardCue(page, page.locator('.library-card').first());
  await expect(page.locator('#dialog')).toBeVisible();
  const beforeEscape = await cueCount(page);
  await page.keyboard.press('Escape');
  await expect.poll(() => cueCount(page)).toBeGreaterThan(beforeEscape);
  await expect(page.locator('#dialog')).not.toBeVisible();
  const beforeSecondOpen = await cueCount(page);
  await page.locator('.library-card').first().click();
  await expect(page.locator('#dialog')).toBeVisible();
  await expect.poll(() => cueCount(page)).toBeGreaterThan(beforeSecondOpen);
  const beforeBackdrop = await cueCount(page);
  await page.mouse.click(2, 2);
  await expect.poll(() => cueCount(page)).toBeGreaterThan(beforeBackdrop);
  await expect(page.locator('#dialog')).not.toBeVisible();
  await page.waitForTimeout(350);
  expect(await page.evaluate(() => window.__task032SfxProbe.contexts)).toBe(1);

  await expectKeyboardCue(page, page.locator('#play-tab'));
  await expect(page.locator('.home-route')).toBeVisible();
  await expectKeyboardCue(page, page.locator('#settings-trigger'));
  const settings = page.locator('dialog.settings-dialog');
  await expect(settings).toBeVisible();
  const slider = settings.locator('#settings-sfx-volume');
  await expect(slider).toHaveValue('40');
  await expect(settings.locator('#settings-sfx-volume-output')).toHaveText('40%');

  await slider.focus();
  await page.keyboard.press('End');
  await expect(slider).toHaveValue('100');
  await expect(settings.locator('#settings-sfx-volume-output')).toHaveText('100%');
  const afterSlider = await cueCount(page);
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await expect(slider).toHaveValue('98');
  expect(await cueCount(page)).toBe(afterSlider);
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).records.settings.sfx_volume_percent, LOCAL_STATE_KEY)).toBe(40);

  await expectKeyboardCue(page, settings.locator('[data-preview-sfx]'));
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).records.settings.sfx_volume_percent, LOCAL_STATE_KEY)).toBe(40);
  await slider.focus();
  await page.keyboard.press('Home');
  const beforeZeroSave = await cueCount(page);
  await settings.locator('button[type=submit]').focus();
  await page.keyboard.press('Space');
  await expect(settings.locator('[data-inline-notice]')).toHaveText('Settings saved.');
  expect(await cueCount(page)).toBe(beforeZeroSave);
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).records.settings.sfx_volume_percent, LOCAL_STATE_KEY)).toBe(0);

  await slider.focus();
  await page.keyboard.press('End');
  await page.waitForTimeout(150);
  await expectKeyboardCue(page, settings.locator('[data-preview-sfx]'));
  await expectKeyboardCue(page, settings.locator('button[type=submit]'));
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).records.settings.sfx_volume_percent, LOCAL_STATE_KEY)).toBe(100);
  await expectKeyboardCue(page, settings.locator('[data-close-settings]'));
  await expect(settings).not.toBeVisible();
  await page.waitForTimeout(350);

  const ticketCount = page.locator('#ticket-count');
  const beforeHomeValue = await cueCount(page);
  await ticketCount.focus();
  await page.keyboard.press('ArrowUp');
  await expect(ticketCount).toHaveValue('2');
  await expect.poll(() => cueCount(page)).toBeGreaterThan(beforeHomeValue);

  await expectKeyboardCue(page, page.getByRole('link', { name: 'Decks', exact: true }));
  await expect(page.locator('.decks-route')).toBeVisible();
  await expectKeyboardCue(page, page.locator('[data-edit-deck]').first());
  await expect(page.locator('.deck-editor-route')).toBeVisible();
  const beforeDeckFilter = await cueCount(page);
  await page.locator('#deck-family').focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#deck-family')).toHaveValue('test');
  await expect.poll(() => cueCount(page)).toBeGreaterThan(beforeDeckFilter);
  await expectKeyboardCue(page, page.locator('.deck-editor-route .back-link'));
  await expect(page.locator('.decks-route')).toBeVisible();

  await expectKeyboardCue(page, page.getByRole('link', { name: 'Profile', exact: true }));
  await expect(page.locator('.profile-route')).toBeVisible();
  const icon = page.locator('[data-icon-id][aria-pressed="false"]').first();
  await expectKeyboardCue(page, icon);
  await expectKeyboardCue(page, page.locator('.profile-route button[type=submit]'));

  await expectKeyboardCue(page, page.getByRole('link', { name: 'Story', exact: true }));
  await expect(page.locator('.story-home-route')).toBeVisible();
  await expectKeyboardCue(page, page.locator('[data-story-primary]'));
  await expect(page.locator('.story-scene-route')).toBeVisible();
  await expectKeyboardCue(page, page.locator('[data-story-advance]'));

  await expectKeyboardCue(page, page.getByRole('link', { name: 'Home', exact: true }));
  await expect(page.locator('.home-route')).toBeVisible();
  await expectKeyboardCue(page, page.locator('#start-solo'));
  await expect(page.getByRole('heading', { name: 'Night-shift board' })).toBeVisible({ timeout: 30_000 });
  const beforeBench = await cueCount(page);
  await page.locator('[data-bench-type-button="TEST"]').focus();
  await page.keyboard.press('Space');
  await expect.poll(() => cueCount(page)).toBeGreaterThan(beforeBench);

  for (let ticket = 0; ticket < 2 && !await page.locator('.result-route').count(); ticket += 1) {
    page.once('dialog', (dialog) => dialog.accept());
    await expectKeyboardCue(page, page.locator('[data-give-up-intent]'));
    await page.waitForTimeout(150);
  }
  await expect(page.locator('.result-route')).toBeVisible({ timeout: 30_000 });
  await expectKeyboardCue(page, page.locator('[data-finish-game]').first());
  await expect(page.locator('.home-route')).toBeVisible();
  await page.goto('/index.html#/play/game');
  await expect(page.getByRole('heading', { name: /Start from Home|Story Match was interrupted/ })).toBeVisible();
  await expectKeyboardCue(page, page.locator('.game-loading a').first());

  const probe = await page.evaluate(() => window.__task032SfxProbe);
  expect(probe.contexts).toBe(1);
  expect(probe.resumes).toBe(1);
  expect(probe.noiseFrames).toBeGreaterThan(0);
  expect(probe.masterTargets.some((value) => value === 0)).toBe(true);
  expect(probe.masterTargets.some((value) => value > 0.3)).toBe(true);
  expect(audioRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test('touch activation sounds once without touch-hover Cursor chatter', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-mobile', 'Touch policy is exercised on the mobile project.');
  await page.goto('/index.html#/play/home');
  await expect(page.locator('.home-route')).toBeVisible();
  expect(await cueCount(page)).toBe(0);
  await page.locator('[data-open-settings]').tap();
  await expect(page.locator('dialog.settings-dialog')).toBeVisible();
  await expect.poll(() => cueCount(page)).toBe(1);
  await page.getByRole('heading', { name: 'Settings & local data' }).tap();
  await page.waitForTimeout(80);
  expect(await cueCount(page)).toBe(1);
});

test('programmatic focus restoration and slider input never emit cues', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Focused policy probe runs once on desktop.');
  await page.goto('/index.html#/play/home');
  await expect(page.locator('.home-route')).toBeVisible();
  await expect(page.locator('#settings-trigger')).toBeVisible();
  await page.locator('#settings-trigger').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('dialog.settings-dialog')).toBeVisible();
  const before = await cueCount(page);
  await page.evaluate(() => document.querySelector('#settings-sfx-volume').focus());
  await page.evaluate(() => {
    const slider = document.querySelector('#settings-sfx-volume');
    slider.value = '77';
    slider.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForTimeout(80);
  expect(await cueCount(page)).toBe(before);
});
