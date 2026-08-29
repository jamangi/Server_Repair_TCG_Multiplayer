import { expect, test } from '@playwright/test';

const browserErrors = new WeakMap();

function watchBrowserErrors(page) {
  const errors = [];
  browserErrors.set(page, errors);
  page.on('pageerror', (error) => errors.push(`page: ${error.stack || error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
}

async function seedCompletedCampaign(page, {
  root,
  matchCount,
  points,
} = {}) {
  await page.goto('/index.html#/play/story');
  return page.evaluate(async ({ campaignRoot, expectedMatchCount, storyPoints }) => {
    const [
      { createStoryClient },
      { loadPlayCatalog },
      { createClientDataContext },
      { createStorageService },
    ] = await Promise.all([
      import('/js/play/story-client.mjs'),
      import('/js/play/catalog-service.mjs'),
      import('/js/play/data/client-data.mjs'),
      import('/js/play/storage-service.mjs'),
    ]);
    const catalog = await loadPlayCatalog();
    const storage = createStorageService({
      context: createClientDataContext({ cardCatalog: catalog.cards, deckCatalog: catalog.decks }),
    });
    storage.reset({ confirmed: true });
    const launch = { current: null };
    const client = await createStoryClient({
      progressStore: {
        load: () => storage.load().state.records.story,
        save: (record) => storage.saveStoryProgress(record),
      },
      rootUrl: new URL(campaignRoot, location.origin),
      runtimeUrl: new URL('/generated/play/src/story/index.mjs', location.origin),
      onStartMatch(value) { launch.current = value; },
    });
    const selectedOptions = {
      'choice.qc01.client_frame': 'verified_outcomes_first',
      'choice.qc02.initial_evidence_frame': 'controlled_comparison_first',
      'choice.qc02.change_evidence_frame': 'change_history_first',
    };
    await client.openPrimary();
    let accepted = 0;
    for (let step = 0; step < 4_000; step += 1) {
      if (launch.current) {
        accepted += 1;
        if (accepted > expectedMatchCount) throw new Error('Fixture crossed its expected Match count.');
        const context = launch.current.context;
        await client.stageMatchResult({
          schema_version: 'story-match-result-v1',
          result_id: `result.local.story.task046.browser.${accepted}`,
          match_id: `local.story.task046.browser.${accepted}`,
          match_ref: context.match_ref,
          completion: 'COMPLETED',
          valid: true,
          reason_codes: ['QUEUE_EXHAUSTED'],
          story_service_points_gained: storyPoints,
          tickets_closed: 1,
          tickets_given_up: 0,
          documented_outcome: true,
          verified_outcome: true,
          contributions: {
            tests_run: 2,
            isolations_accepted: 1,
            repairs_performed: 1,
            verify_passes: 1,
            documentation_actions: 1,
          },
        }, context);
        launch.current = null;
        await client.continueFromMatch();
        continue;
      }
      if (client.homeModel().status === 'COMPLETE') break;
      const scene = client.sceneModel();
      if (scene.choices.length) {
        const choiceId = scene.choices[0].choiceId;
        const selected = scene.choices.find((choice) =>
          choice.optionId === selectedOptions[choiceId]) ?? scene.choices[0];
        await client.choose(selected.optionId);
      } else if (scene.controls.advance) await client.advance();
      else throw new Error('Fixture stopped outside an authored boundary.');
    }
    if (accepted !== expectedMatchCount || client.homeModel().status !== 'COMPLETE') {
      throw new Error(`Fixture completed ${accepted}/${expectedMatchCount} Matches without an ending.`);
    }
    const record = storage.load().state.records.story;
    return {
      contentVersion: record.content_version,
      ending: record.completed_ending_id,
      matches: record.checkpoint.match_results.length,
    };
  }, { campaignRoot: root, expectedMatchCount: matchCount, storyPoints: points });
}

async function localStoryRecord(page) {
  return page.evaluate(async () => {
    const [{ loadPlayCatalog }, { createClientDataContext }, { createStorageService }] = await Promise.all([
      import('/js/play/catalog-service.mjs'),
      import('/js/play/data/client-data.mjs'),
      import('/js/play/storage-service.mjs'),
    ]);
    const catalog = await loadPlayCatalog();
    const storage = createStorageService({
      context: createClientDataContext({ cardCatalog: catalog.cards, deckCatalog: catalog.decks }),
    });
    return storage.load().state.records.story;
  });
}

async function expectNoHorizontalOverflow(page) {
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
}

test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page) ?? []).toEqual([]);
});

test('completed v2 saves enter Shift 7 through the live desktop and mobile release surface', async ({ page }, testInfo) => {
  test.skip(!['chromium-desktop', 'chromium-mobile'].includes(testInfo.project.name),
    'Desktop keyboard and mobile touch/reflow paths run once each.');
  watchBrowserErrors(page);
  const seeded = await seedCompletedCampaign(page, {
    root: '/generated/play/content/story-v1/campaigns/quiet-cascade-characterization-v2/',
    matchCount: 6,
    points: 4,
  });
  expect(seeded).toEqual({
    contentVersion: 'quiet-cascade-characterization-v2',
    ending: 'ending.qc01.defensible_release',
    matches: 6,
  });

  await page.reload();
  await expect(page.locator('.story-home__status')).toHaveText('ready');
  await expect(page.locator('.story-home__continuity h2')).toHaveText('Expansion available');
  await expect(page.locator('.story-home__continuity')).toContainText(
    'Campaign one is preserved. Continue into the six-episode expansion without replaying completed work.',
  );
  await expect(page.locator('[data-story-replay]')).toHaveCount(6);
  const migrated = await localStoryRecord(page);
  expect(migrated.content_version).toBe('quiet-cascade-expansion-v3');
  expect(migrated.completed_ending_id).toBeNull();
  expect(migrated.checkpoint.match_results).toHaveLength(6);

  const primary = page.locator('[data-story-primary]');
  await primary.focus();
  await expect(primary).toBeFocused();
  if (testInfo.project.name === 'chromium-desktop') await page.keyboard.press('Enter');
  else await primary.tap();
  await expect(page).toHaveURL(/#\/play\/story\/scene$/);
  await expect(page.locator('[data-story-statement-id]')).toHaveAttribute(
    'data-story-statement-id',
    'story.qc02.s07.entry.01',
  );
  await expect(page.locator('[data-story-advance]')).toBeFocused();
  await expect(page.locator('[data-story-art-alternative="background"]')).not.toBeEmpty();
  await expectNoHorizontalOverflow(page);
});

test('the live current-content ending and Shift 12 review remain honest at reduced motion and 200% text', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-reduced-motion',
    'Reduced-motion mobile reflow and 200% text run once.');
  watchBrowserErrors(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const seeded = await seedCompletedCampaign(page, {
    root: '/generated/play/content/story-v1/campaigns/quiet-cascade-expansion-v3/',
    matchCount: 12,
    points: 2,
  });
  expect(seeded).toEqual({
    contentVersion: 'quiet-cascade-expansion-v3',
    ending: 'ending.qc02.current_content',
    matches: 12,
  });

  await page.reload();
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  await expect(page.locator('.story-home__status')).toHaveText('complete');
  await expect(page.locator('.story-home__continuity h2')).toHaveText('Current content complete');
  await expect(page.locator('.story-home__continuity')).toContainText(
    'All twelve currently released Story episodes are complete. Your record is preserved for future content.',
  );
  await expect(page.locator('[data-story-primary]')).toBeDisabled();
  await expect(page.locator('[data-story-replay]')).toHaveCount(12);
  await expect(page.locator('.story-home-route')).not.toContainText('all future');

  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await expectNoHorizontalOverflow(page);
  const lastReview = page.locator('[data-story-replay]').last();
  await lastReview.scrollIntoViewIfNeeded();
  await expect(lastReview).toBeVisible();
  await lastReview.tap();
  await expect(page).toHaveURL(/#\/play\/story\/scene$/);
  await expect(page.locator('.play-global-notice')).toContainText('Practice review · Shift 12');
  await expect(page.locator('[data-story-statement-id]')).toHaveAttribute(
    'data-story-statement-id',
    'story.qc02.s12.entry.01',
  );
  await expect(page.locator('[data-story-advance]')).toBeFocused();
  await expectNoHorizontalOverflow(page);
});
