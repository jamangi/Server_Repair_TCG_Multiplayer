import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173';
const artRequests = JSON.parse(fs.readFileSync(path.join(
  ROOT,
  'docs/story/revisions/quiet-cascade-expansion-v3/ART_REQUESTS.json',
), 'utf8'));
const EXPANSION_ASSETS = artRequests.asset_reuse.assets.map((asset) => ({
  assetId: asset.asset_id,
  alt: asset.alt_text,
  fallbackAssetId: asset.fallback_asset_id,
  focalPoint: asset.focal_point,
  layer: asset.layer,
  protectedZones: asset.protected_zones,
}));
const BACKGROUNDS = EXPANSION_ASSETS.filter((asset) => asset.layer === 'BACKGROUND');
const CHARACTERS = EXPANSION_ASSETS.filter((asset) => asset.layer === 'CHARACTER');
const RENDERED_ASSETS = Object.freeze([...BACKGROUNDS, ...CHARACTERS]);
const FALLBACK_REQUESTS = Object.freeze([
  { assetId: 'story.qc02.missing.background', expectedAssetId: 'story.fallback.background', layer: 'BACKGROUND' },
  { assetId: 'story.qc02.missing.character', expectedAssetId: 'story.fallback.character', layer: 'CHARACTER' },
]);

function trackPageErrors(page, { allowFailedResource = false } = {}) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(`page: ${error.stack || error.message}`));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    if (allowFailedResource && /Failed to load resource|ERR_FAILED/.test(message.text())) return;
    errors.push(`console: ${message.text()}`);
  });
  return errors;
}

async function installHarness(page, { expectedFallbacks = 0, saveData = false } = {}) {
  await page.goto('/assets/story/manifest.json');
  await page.setContent(`<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>TASK-045 expansion art browser harness</title>
        <style>
          * { box-sizing: border-box; }
          :root { color-scheme: dark; font: 100%/1.45 system-ui, sans-serif; }
          body { margin: 0; color: #edf8fb; background: #02080c; }
          main { width: min(100%, 90rem); margin-inline: auto; padding: 1rem; }
          h1 { font-size: 1.35rem; }
          .critical-copy { max-width: 70ch; }
          .gallery { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr)); gap: 1rem; }
          figure { min-width: 0; margin: 0; border: 1px solid #52849a; border-radius: .6rem; overflow: hidden; background: #07141c; }
          figcaption { padding: .5rem; overflow-wrap: anywhere; }
          .visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
          .scene-slot { grid-column: 1 / -1; }
          .scene-stage { position: relative; min-height: 36rem; overflow: hidden; background: #061018; }
          .scene-stage > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; animation: art-arrival 180ms ease-out; }
          .location { position: absolute; z-index: 2; top: 0; left: 0; display: grid; align-content: center; width: 30%; height: 12%; padding: .65rem; color: #eafaff; background: rgb(3 12 18 / 82%); }
          .dialogue { position: absolute; z-index: 2; right: 0; bottom: 0; left: 0; display: grid; grid-template-rows: minmax(0, 1fr) auto; gap: .5rem; height: 34%; padding: .75rem; background: rgb(2 9 14 / 94%); }
          .dialogue p { min-height: 0; margin: 0; overflow: auto; }
          button { min-width: 8rem; min-height: 2.75rem; padding: .65rem 1rem; border: 2px solid #73dff7; border-radius: .35rem; color: #fff; background: #12485b; font: inherit; touch-action: manipulation; }
          button:focus-visible { outline: 3px solid #ffd166; outline-offset: 2px; }
          .character-frame { position: relative; height: 28rem; overflow: hidden; background: linear-gradient(#0e2732, #030a0e); }
          .character-frame img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: contain; animation: art-arrival 180ms ease-out; }
          .fallback-frame { position: relative; height: 16rem; overflow: hidden; }
          .fallback-frame img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: contain; }
          .art-unavailable img { visibility: hidden; }
          @keyframes art-arrival { from { opacity: 0; } to { opacity: 1; } }
          @media (prefers-reduced-motion: reduce) {
            .scene-stage > img, .character-frame img { animation-duration: .001s; animation-iteration-count: 1; }
          }
          @media (max-width: 60rem) {
            main { padding: .65rem; }
            .scene-stage { min-height: 36rem; }
            .location { width: 30%; font-size: .8rem; }
          }
        </style>
      </head>
      <body>
        <main>
          <h1>TASK-045 expansion art browser harness</h1>
          <p class="critical-copy" data-critical-copy>The Ticket, Evidence, choice, Match result, and next action are HTML. Art may orient the scene, but it never supplies the fault, the diagnosis, or permission to repair.</p>
          <p role="status" aria-live="polite" data-action-status>No Story action selected.</p>
          <section class="gallery" aria-label="Exact expansion art references" data-gallery></section>
        </main>
      </body>
    </html>`);

  await page.evaluate(async ({ assets, fallbackRequests, saveDataValue }) => {
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: Object.freeze({ saveData: saveDataValue }),
    });
    const [{
      createStoryArtResolver,
      loadStoryArtManifest,
    }, { bindResolvedImage }] = await Promise.all([
      import('/js/play/story-art-resolver.mjs'),
      import('/js/play/art-resolver.mjs'),
    ]);
    const manifestUrl = new URL('/assets/story/manifest.json', location.href);
    const manifest = await loadStoryArtManifest({ manifestUrl });
    const resolver = createStoryArtResolver({ manifest, manifestUrl });
    const gallery = document.querySelector('[data-gallery]');
    const cleanups = [];
    const resolutions = [];
    const presentationResolution = (resolution) => ({
      ...resolution,
      alt: '',
      decorative: true,
      fallback: resolution.fallback ? { ...resolution.fallback, alt: '' } : null,
    });
    const resolve = (asset) => asset.layer === 'BACKGROUND'
      ? resolver.resolveBackground(asset.assetId)
      : resolver.resolveCharacter(asset.assetId);
    const bind = (image, resolution) => {
      cleanups.push(bindResolvedImage(image, presentationResolution(resolution), { eager: true }));
      resolutions.push({
        assetId: resolution.assetId,
        requestedAssetId: resolution.requestedAssetId,
        alt: resolution.alt,
        src: resolution.src,
        layer: resolution.layer,
        fallbackAssetId: resolution.fallback?.assetId ?? null,
        focalPoint: resolution.focalPoint,
        protectedZones: resolution.protectedZones,
        source: resolution.source,
      });
    };

    for (const asset of assets.filter((entry) => entry.layer === 'BACKGROUND')) {
      const resolution = resolve(asset);
      const figure = document.createElement('figure');
      figure.className = 'scene-slot';
      figure.dataset.assetId = asset.assetId;
      figure.dataset.resolvedAlt = resolution.alt;
      figure.innerHTML = `<div class="scene-stage">
        <img alt="" aria-hidden="true">
        <header class="location" data-protected-overlay="location">Shift review</header>
        <section class="dialogue" data-protected-overlay="dialogue" aria-label="Story dialogue">
          <p>The visible scene never establishes the hidden fault. Read the Ticket and gather Evidence before choosing a Repair.</p>
          <button type="button" data-story-action>Continue with text</button>
        </section>
      </div><figcaption class="visually-hidden" data-reviewed-alternative>${resolution.alt}</figcaption>`;
      const image = figure.querySelector('img');
      image.style.objectPosition = `${resolution.focalPoint.x * 100}% ${resolution.focalPoint.y * 100}%`;
      bind(image, resolution);
      gallery.append(figure);
    }

    for (const asset of assets.filter((entry) => entry.layer === 'CHARACTER')) {
      const resolution = resolve(asset);
      const figure = document.createElement('figure');
      figure.dataset.assetId = asset.assetId;
      figure.dataset.resolvedAlt = resolution.alt;
      figure.innerHTML = `<div class="character-frame"><img alt="" aria-hidden="true"></div>
        <figcaption class="visually-hidden" data-reviewed-alternative>${resolution.alt}</figcaption>`;
      bind(figure.querySelector('img'), resolution);
      gallery.append(figure);
    }

    for (const request of fallbackRequests) {
      const resolution = request.layer === 'BACKGROUND'
        ? resolver.resolveBackground(request.assetId)
        : resolver.resolveCharacter(request.assetId);
      const figure = document.createElement('figure');
      figure.dataset.fallbackRequest = request.assetId;
      figure.innerHTML = '<div class="fallback-frame"><img alt="" aria-hidden="true"></div><figcaption>Intentional same-layer fallback</figcaption>';
      bind(figure.querySelector('img'), resolution);
      gallery.append(figure);
    }

    let actionCount = 0;
    document.querySelectorAll('[data-story-action]').forEach((button) => {
      button.addEventListener('click', () => {
        actionCount += 1;
        document.querySelector('[data-action-status]').textContent = `Story text action ${actionCount} accepted.`;
      });
    });
    window.__task045 = Object.freeze({
      get actionCount() { return actionCount; },
      cleanups,
      manifestVersion: resolver.manifestVersion,
      resolutions,
      sourceProfile: resolver.sourceProfile,
    });
  }, {
    assets: EXPANSION_ASSETS,
    fallbackRequests: FALLBACK_REQUESTS,
    saveDataValue: saveData,
  });

  await expect.poll(() => page.locator('img').evaluateAll((images) => images.map((image) => image.dataset.artStatus)
    .filter((status) => status === 'fallback').length)).toBe(expectedFallbacks);
  await expect(page.locator('img[data-art-status="ready"], img[data-art-status="fallback"]'))
    .toHaveCount(EXPANSION_ASSETS.length + FALLBACK_REQUESTS.length);
}

async function expectNoHorizontalOverflow(page) {
  await expect.poll(() => page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))).toEqual(await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.clientWidth,
  })));
}

async function expectImagesBounded(page) {
  const metrics = await page.locator('img').evaluateAll((images) => images.map((image) => {
    const box = image.getBoundingClientRect();
    const parent = image.parentElement.getBoundingClientRect();
    return {
      bottom: box.bottom,
      hidden: image.hidden,
      left: box.left,
      naturalHeight: image.naturalHeight,
      naturalWidth: image.naturalWidth,
      objectFit: getComputedStyle(image).objectFit,
      parentBottom: parent.bottom,
      parentLeft: parent.left,
      parentRight: parent.right,
      parentTop: parent.top,
      right: box.right,
      status: image.dataset.artStatus,
      top: box.top,
    };
  }));
  expect(metrics).toHaveLength(EXPANSION_ASSETS.length + FALLBACK_REQUESTS.length);
  for (const metric of metrics) {
    expect(metric.hidden).toBe(false);
    expect(metric.status).toBe('ready');
    expect(metric.naturalWidth).toBeGreaterThan(0);
    expect(metric.naturalHeight).toBeGreaterThan(0);
    expect(['contain', 'cover']).toContain(metric.objectFit);
    expect(metric.left).toBeGreaterThanOrEqual(metric.parentLeft - 1);
    expect(metric.right).toBeLessThanOrEqual(metric.parentRight + 1);
    expect(metric.top).toBeGreaterThanOrEqual(metric.parentTop - 1);
    expect(metric.bottom).toBeLessThanOrEqual(metric.parentBottom + 1);
  }
}

test('all exact expansion references use the real manifest, reviewed semantics, protected zones, and deterministic paths', async ({ page }, testInfo) => {
  const errors = trackPageErrors(page);
  expect(BACKGROUNDS).toHaveLength(4);
  expect(CHARACTERS).toHaveLength(8);
  expect(artRequests.art_request_disposition.request_count).toBe(0);

  await installHarness(page);
  const expectedProfile = ['chromium-mobile', 'chromium-reduced-motion'].includes(testInfo.project.name)
    ? 'mobile'
    : 'desktop';
  const state = await page.evaluate(() => ({
    manifestVersion: window.__task045.manifestVersion,
    resolutions: window.__task045.resolutions,
    sourceProfile: window.__task045.sourceProfile,
  }));
  expect(state.manifestVersion).toBe('story-art-v1');
  expect(state.sourceProfile).toBe(expectedProfile);
  expect(state.resolutions).toHaveLength(14);

  const exactResolutions = state.resolutions.slice(0, EXPANSION_ASSETS.length);
  for (const [index, resolution] of exactResolutions.entries()) {
    const expected = RENDERED_ASSETS[index];
    expect(resolution.assetId).toBe(expected.assetId);
    expect(resolution.requestedAssetId).toBe(expected.assetId);
    expect(resolution.alt).toBe(expected.alt);
    expect(resolution.fallbackAssetId).toBe(expected.fallbackAssetId);
    expect(resolution.focalPoint).toEqual(expected.focalPoint);
    expect(resolution.protectedZones).toEqual(expected.protectedZones);
    expect(resolution.src).toMatch(new RegExp(`${expectedProfile}\\.webp$`));
  }
  for (const [index, resolution] of state.resolutions.slice(EXPANSION_ASSETS.length).entries()) {
    expect(resolution.assetId).toBe(FALLBACK_REQUESTS[index].expectedAssetId);
    expect(resolution.requestedAssetId).toBe(FALLBACK_REQUESTS[index].expectedAssetId);
    expect(resolution.alt).toBe('');
    expect(resolution.source).toBe('story-layer-fallback');
  }

  expect(await page.locator('[data-asset-id] img').evaluateAll((images) => images.map((image) => ({
    alt: image.getAttribute('alt'),
    ariaHidden: image.getAttribute('aria-hidden'),
  })))).toEqual(RENDERED_ASSETS.map(() => ({ alt: '', ariaHidden: 'true' })));
  const alternatives = await page.locator('[data-reviewed-alternative]').allTextContents();
  expect(alternatives).toEqual(RENDERED_ASSETS.map((asset) => asset.alt));
  expect(await page.locator('[data-fallback-request] img').evaluateAll((images) => images.map((image) => ({
    alt: image.getAttribute('alt'),
    ariaHidden: image.getAttribute('aria-hidden'),
  })))).toEqual(FALLBACK_REQUESTS.map(() => ({ alt: '', ariaHidden: 'true' })));
  await expect(page.locator('[data-fallback-request] [data-reviewed-alternative]')).toHaveCount(0);

  for (const scene of await page.locator('.scene-stage').all()) {
    const geometry = await scene.evaluate((stage) => {
      const stageBox = stage.getBoundingClientRect();
      const dialogue = stage.querySelector('[data-protected-overlay="dialogue"]').getBoundingClientRect();
      const location = stage.querySelector('[data-protected-overlay="location"]').getBoundingClientRect();
      return {
        dialogue: {
          height: dialogue.height / stageBox.height,
          width: dialogue.width / stageBox.width,
          x: (dialogue.left - stageBox.left) / stageBox.width,
          y: (dialogue.top - stageBox.top) / stageBox.height,
        },
        location: {
          height: location.height / stageBox.height,
          width: location.width / stageBox.width,
          x: (location.left - stageBox.left) / stageBox.width,
          y: (location.top - stageBox.top) / stageBox.height,
        },
      };
    });
    expect(geometry.dialogue.x).toBeCloseTo(0, 2);
    expect(geometry.dialogue.y).toBeCloseTo(0.66, 2);
    expect(geometry.dialogue.width).toBeCloseTo(1, 2);
    expect(geometry.dialogue.height).toBeCloseTo(0.34, 2);
    expect(geometry.location.x).toBeCloseTo(0, 2);
    expect(geometry.location.y).toBeCloseTo(0, 2);
    expect(geometry.location.width).toBeCloseTo(0.3, 2);
    expect(geometry.location.height).toBeCloseTo(0.12, 2);
  }

  await expectNoHorizontalOverflow(page);
  await expectImagesBounded(page);
  const firstPaths = state.resolutions.map((resolution) => resolution.src);
  await installHarness(page);
  expect(await page.evaluate(() => window.__task045.resolutions.map((resolution) => resolution.src))).toEqual(firstPaths);
  expect(errors).toEqual([]);
});

test('mobile portrait and landscape keep text, touch controls, and mobile derivatives in bounds', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-mobile', 'The explicit orientation and touch matrix runs once in the mobile project.');
  const errors = trackPageErrors(page);
  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    await installHarness(page);
    expect(await page.evaluate(() => window.__task045.sourceProfile)).toBe('mobile');
    await expectNoHorizontalOverflow(page);
    await expect(page.locator('[data-critical-copy]')).toBeVisible();
    await expect(page.locator('[data-story-action]').first()).toBeVisible();
    const target = await page.locator('[data-story-action]').first().evaluate((button) => {
      const box = button.getBoundingClientRect();
      return { height: box.height, width: box.width };
    });
    expect(target.height).toBeGreaterThanOrEqual(44);
    expect(target.width).toBeGreaterThanOrEqual(44);
  }
  await page.locator('[data-story-action]').first().tap();
  await expect(page.locator('[data-action-status]')).toHaveText('Story text action 1 accepted.');
  expect(errors).toEqual([]);
});

test('high-density delivery and 200% text reflow preserve bounded art and usable controls', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'The explicit high-density and zoom audit runs once.');
  const context = await browser.newContext({
    baseURL: BASE_URL,
    deviceScaleFactor: 2,
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();
  const errors = trackPageErrors(page);
  try {
    await installHarness(page);
    expect(await page.evaluate(() => devicePixelRatio)).toBe(2);
    expect(await page.evaluate(() => window.__task045.sourceProfile)).toBe('desktop');
    await expectImagesBounded(page);

    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await expectNoHorizontalOverflow(page);
    await expect(page.locator('[data-critical-copy]')).toBeVisible();
    const controls = page.locator('[data-story-action]');
    await expect(controls).toHaveCount(4);
    for (const control of await controls.all()) {
      await control.scrollIntoViewIfNeeded();
      await expect(control).toBeVisible();
    }
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});

test('browser save-data chooses reduced-data files and a failed production image uses its same-layer fallback', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'The deterministic save-data and network-failure fixtures run once.');
  const errors = trackPageErrors(page, { allowFailedResource: true });
  await installHarness(page, { saveData: true });
  expect(await page.evaluate(() => ({
    saveData: navigator.connection.saveData,
    sourceProfile: window.__task045.sourceProfile,
  }))).toEqual({ saveData: true, sourceProfile: 'reduced_data' });
  expect(await page.evaluate(() => window.__task045.resolutions.map((resolution) => resolution.src)))
    .toEqual(expect.arrayContaining(EXPANSION_ASSETS.map(() => expect.stringMatching(/reduced-data\.webp$/))));

  const failedId = 'story.asset.character.hana_park.relief';
  await page.route('**/characters/hana-park-relief-reduced-data.webp', (route) => route.abort());
  await installHarness(page, { expectedFallbacks: 1, saveData: true });
  const failedImage = page.locator(`[data-asset-id="${failedId}"] img`);
  await expect(failedImage).toHaveAttribute('data-art-status', 'fallback');
  await expect(failedImage).toHaveAttribute('data-asset-id', 'story.fallback.character');
  await expect(failedImage).toHaveAttribute('src', /fallback-character-reduced-data\.webp$/);
  await expect(failedImage).toHaveAttribute('alt', '');
  await expect(failedImage).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('[data-critical-copy]')).toBeVisible();
  await expect(page.locator('[data-story-action]').first()).toBeEnabled();
  expect(errors).toEqual([]);
});

test('reduced motion removes visual travel without changing text, focus, or action authority', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-reduced-motion', 'The reduced-motion assertion runs in its configured project.');
  const errors = trackPageErrors(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await installHarness(page);
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  const durations = await page.locator('.scene-stage > img, .character-frame img').evaluateAll((images) =>
    [...new Set(images.map((image) => getComputedStyle(image).animationDuration))]);
  expect(durations).toEqual(['0.001s']);
  const button = page.locator('[data-story-action]').first();
  await button.focus();
  await expect(button).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-action-status]')).toHaveText('Story text action 1 accepted.');
  expect(errors).toEqual([]);
});

test('keyboard and touch actions remain operable when every image is unavailable', async ({ page }, testInfo) => {
  test.skip(!['chromium-desktop', 'chromium-mobile'].includes(testInfo.project.name), 'Keyboard and touch run in their representative projects.');
  const errors = trackPageErrors(page);
  await installHarness(page);
  await page.locator('body').evaluate((body) => body.classList.add('art-unavailable'));
  await expect(page.locator('[data-critical-copy]')).toBeVisible();
  const firstButton = page.locator('[data-story-action]').first();
  await expect(firstButton).toBeVisible();
  if (testInfo.project.name === 'chromium-mobile') {
    await firstButton.tap();
  } else {
    await page.keyboard.press('Tab');
    await expect(firstButton).toBeFocused();
    await page.keyboard.press('Enter');
  }
  await expect(page.locator('[data-action-status]')).toHaveText('Story text action 1 accepted.');
  expect(await page.evaluate(() => window.__task045.actionCount)).toBe(1);
  expect(errors).toEqual([]);
});
