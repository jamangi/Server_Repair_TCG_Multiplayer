import { expect, test } from '@playwright/test';

const UPDATE_VISUALS = process.env.UPDATE_TASK_020_VISUALS === '1';

async function openSolo(page, ticketCount = 3) {
  await page.addInitScript(() => {
    Object.defineProperty(Crypto.prototype, 'randomUUID', {
      configurable: true,
      value: () => '00000000-0000-4000-8000-000000002001',
    });
  });
  await page.goto('/index.html#/play/home');
  await expect(page.locator('#app')).not.toHaveAttribute('aria-busy', 'true');
  await page.locator('#ticket-count').selectOption(String(ticketCount));
  await page.locator('#start-solo').click();
  await expect(page.getByRole('heading', { name: 'Night-shift board' })).toBeVisible({ timeout: 20_000 });
}

async function boardMeasurements(page) {
  return page.evaluate(() => {
    const boxes = (selector) => [...document.querySelectorAll(selector)].map((node) => {
      const box = node.getBoundingClientRect();
      return { top: box.top, left: box.left, right: box.right, bottom: box.bottom, width: box.width, height: box.height };
    });
    const tiles = boxes('.diagnostic-tile');
    const cards = boxes('.hand-group');
    const uniqueRows = [...new Set(tiles.map((box) => Math.round(box.top)))];
    const titleOverflows = [...document.querySelectorAll('.hand-group .play-card__title')]
      .map((node) => node.scrollHeight - node.clientHeight);
    const handArtHeights = boxes('.hand-group .play-card__art').map((box) => box.height);
    const benchParts = Object.fromEntries([
      ['bench', '.diagnostic-bench'],
      ['heading', '.diagnostic-bench__heading'],
      ['controls', '.diagnostic-bench__controls'],
      ['shelf', '.diagnostic-shelf'],
      ['pagination', '.bench-pagination'],
    ].map(([name, selector]) => [name, boxes(selector)[0]?.height]));
    return {
      benchPageSize: Number(document.querySelector('.diagnostic-bench')?.dataset.benchPageSize),
      handPageSize: Number(document.querySelector('.hand-rail')?.dataset.handPageSize),
      benchRows: uniqueRows.length,
      tileCount: tiles.length,
      tileWidths: tiles.map((box) => box.width),
      tileHeights: tiles.map((box) => box.height),
      handGroupCount: cards.length,
      handWidths: cards.map((box) => box.width),
      handArtHeights,
      handTitleOverflows: titleOverflows,
      documentOverflow: document.documentElement.scrollWidth - innerWidth,
      boardBottomGap: innerHeight - document.querySelector('.game-board').getBoundingClientRect().bottom,
      benchParts,
    };
  });
}

async function expectFullRestingHand(page, expectedCapacity) {
  const hand = page.locator('.hand-rail');
  await expect(hand).toHaveAttribute('data-expanded', 'false');
  await expect(hand).not.toContainText(/Using copy|Use copy/);
  await expect(page.locator('.hand-group__copies')).toHaveCount(0);
  const groups = page.locator('.hand-group');
  expect(await groups.count()).toBeGreaterThan(0);
  expect(await groups.count()).toBeLessThanOrEqual(expectedCapacity);
  for (const group of await groups.all()) {
    const anatomy = await group.evaluate((node) => {
      const title = node.querySelector('.play-card__title');
      const art = node.querySelector('.play-card__art');
      const image = node.querySelector('.play-card__art-image');
      const inspect = node.querySelector('.hand-group__inspect');
      const family = node.querySelector('.play-card__family');
      const cost = node.querySelector('.play-card__cost');
      const faceBox = node.querySelector('.play-card').getBoundingClientRect();
      const titleBox = title.getBoundingClientRect();
      const artBox = art.getBoundingClientRect();
      return {
        family: family?.textContent.trim(),
        cost: cost?.textContent.trim(),
        title: title?.textContent.trim(),
        titleHeight: title?.getBoundingClientRect().height,
        titleOverflow: title.scrollHeight - title.clientHeight,
        artHeight: art?.getBoundingClientRect().height,
        naturalWidth: image?.naturalWidth,
        inspectHeight: inspect?.getBoundingClientRect().height,
        quantity: node.querySelector('.hand-group__quantity')?.textContent.trim(),
        instanceIds: node.dataset.cardInstanceIds?.split(' ').filter(Boolean),
        accessibleName: node.getAttribute('aria-label'),
        identityContained: titleBox.top >= faceBox.top - 1 && titleBox.bottom <= faceBox.bottom + 1
          && artBox.top >= faceBox.top - 1 && artBox.bottom <= faceBox.bottom + 1,
        geometry: { face: [faceBox.top, faceBox.bottom], title: [titleBox.top, titleBox.bottom], art: [artBox.top, artBox.bottom] },
      };
    });
    expect(anatomy.family).toMatch(/repair|verify/i);
    expect(anatomy.cost).toMatch(/^\d+$/);
    expect(anatomy.title.length).toBeGreaterThan(0);
    expect(anatomy.titleHeight).toBeGreaterThan(10);
    expect(anatomy.titleOverflow).toBeLessThanOrEqual(1);
    expect(anatomy.artHeight).toBeGreaterThan(30);
    expect(anatomy.naturalWidth).toBeGreaterThan(0);
    expect(anatomy.inspectHeight).toBeGreaterThanOrEqual(44);
    expect(anatomy.quantity).toMatch(/^×\d+$/);
    expect(anatomy.instanceIds.length).toBeGreaterThan(0);
    expect(anatomy.accessibleName).toContain(anatomy.instanceIds.length === 1 ? '1 copy' : `${anatomy.instanceIds.length} copies`);
    expect(anatomy.identityContained, JSON.stringify(anatomy.geometry)).toBe(true);
  }
}

async function expectFullBenchTiles(page) {
  for (const tile of await page.locator('.diagnostic-tile').all()) {
    const anatomy = await tile.evaluate((node) => {
      const title = node.querySelector('.play-card__title');
      const art = node.querySelector('.play-card__art');
      const faceBox = node.querySelector('.play-card').getBoundingClientRect();
      const titleBox = title.getBoundingClientRect();
      const artBox = art.getBoundingClientRect();
      return {
        family: node.querySelector('.play-card__family')?.textContent.trim(),
        cost: node.querySelector('.play-card__cost')?.textContent.trim(),
        title: title?.textContent.trim(),
        titleHeight: title?.getBoundingClientRect().height,
        titleOverflow: title.scrollHeight - title.clientHeight,
        artHeight: art?.getBoundingClientRect().height,
        inspectHeight: node.querySelector('.diagnostic-tile__inspect')?.getBoundingClientRect().height,
        identityContained: titleBox.top >= faceBox.top - 1 && titleBox.bottom <= faceBox.bottom + 1
          && artBox.top >= faceBox.top - 1 && artBox.bottom <= faceBox.bottom + 1,
        geometry: { face: [faceBox.top, faceBox.bottom], title: [titleBox.top, titleBox.bottom], art: [artBox.top, artBox.bottom] },
      };
    });
    expect(anatomy.family).toMatch(/test|command/i);
    expect(anatomy.cost).toMatch(/^\d+$/);
    expect(anatomy.title.length).toBeGreaterThan(0);
    expect(anatomy.titleHeight).toBeGreaterThan(10);
    expect(anatomy.titleOverflow).toBeLessThanOrEqual(1);
    expect(anatomy.artHeight).toBeGreaterThan(20);
    expect(anatomy.inspectHeight).toBeGreaterThanOrEqual(44);
    expect(anatomy.identityContained, JSON.stringify(anatomy.geometry)).toBe(true);
  }
}

test('Relevant and Global use one equal-height Bench row and a readable resting hand', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Required desktop measurement matrix runs once.');
  await openSolo(page);
  const viewports = [
    { width: 1366, height: 768, bench: 4, hand: 4 },
    { width: 1920, height: 1080, bench: 6, hand: 5 },
    { width: 1920, height: 960, bench: 6, hand: 5 },
    { width: 2560, height: 1300, bench: 6, hand: 5 },
  ];
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    const measurements = {};
    for (const view of ['Relevant', 'Global']) {
      await page.getByRole('button', { name: view, exact: true }).click();
      await expect(page.locator('.diagnostic-tile').first()).toBeVisible();
      await expectFullBenchTiles(page);
      await expectFullRestingHand(page, viewport.hand);
      const current = await boardMeasurements(page);
      measurements[view] = current;
      expect(current.benchPageSize).toBe(viewport.bench);
      expect(current.handPageSize).toBe(viewport.hand);
      expect(current.benchRows).toBe(1);
      expect(current.tileCount).toBeLessThanOrEqual(viewport.bench);
      expect(Math.max(...current.tileHeights) - Math.min(...current.tileHeights)).toBeLessThanOrEqual(1);
      expect(Math.min(...current.tileWidths)).toBeGreaterThanOrEqual(143);
      expect(Math.min(...current.handWidths)).toBeGreaterThanOrEqual(149);
      expect(Math.min(...current.handArtHeights)).toBeGreaterThan(30);
      expect(Math.max(...current.handTitleOverflows)).toBeLessThanOrEqual(1);
      expect(current.documentOverflow).toBeLessThanOrEqual(0.5);
      expect(current.boardBottomGap).toBeLessThanOrEqual(12);
      if (UPDATE_VISUALS) {
        await page.screenshot({
          path: `tests/visual/task-020/${view.toLowerCase()}-${viewport.width}x${viewport.height}-chromium-desktop.png`,
          animations: 'disabled',
        });
      }
    }
    expect(
      Math.abs(measurements.Relevant.tileHeights[0] - measurements.Global.tileHeights[0]),
      `${viewport.width}x${viewport.height}: ${JSON.stringify({ Relevant: measurements.Relevant.benchParts, Global: measurements.Global.benchParts })}`,
    ).toBeLessThanOrEqual(1);
    expect(measurements.Global.tileCount).toBe(viewport.bench);
    await expect(page.locator('.bench-pagination')).toContainText(/Page 1 \/ (?:[2-9]|\d{2,})/);
  }
});

test('homogeneous duplicate stack submits its first real eligible instance and updates only that stack', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Synthetic authority continuity check runs once.');
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.addInitScript(() => {
    const NativeWorker = window.Worker;
    window.__task020Submitted = [];
    class Task020Worker extends EventTarget {
      constructor(url, options) {
        super();
        this.native = new NativeWorker(url, options);
        this.projection = null;
        this.native.addEventListener('error', (event) => this.dispatchEvent(new ErrorEvent('error', { message: event.message })));
        this.native.addEventListener('message', (event) => {
          const message = structuredClone(event.data);
          if (message.type !== 'MATCH_STARTED') {
            this.dispatchEvent(new MessageEvent('message', { data: message }));
            return;
          }
          const projection = message.projection;
          const first = projection.view.hand[0];
          const duplicate = { ...first, card_instance_id: `${first.card_instance_id}.duplicate` };
          projection.view.hand.splice(1, 0, duplicate);
          projection.legal_intents = projection.legal_intents.filter((intent) => intent.card_instance_id !== first.card_instance_id);
          const ticketId = projection.view.public_match.repair_queue[0].ticket_instance_id;
          projection.legal_intents.push(
            { intent_id: 'intent.task020.first', action_type: 'PERFORM_REPAIR', ticket_instance_id: ticketId, card_instance_id: first.card_instance_id, card_definition_id: first.card_definition_id },
            { intent_id: 'intent.task020.second', action_type: 'PERFORM_REPAIR', ticket_instance_id: ticketId, card_instance_id: duplicate.card_instance_id, card_definition_id: duplicate.card_definition_id },
          );
          this.projection = projection;
          this.dispatchEvent(new MessageEvent('message', { data: message }));
        });
      }
      postMessage(message) {
        if (message.type !== 'SUBMIT_INTENT' || !message.intent_id.startsWith('intent.task020.')) {
          this.native.postMessage(message);
          return;
        }
        window.__task020Submitted.push(structuredClone(message));
        const selectedIntent = this.projection.legal_intents.find((intent) => intent.intent_id === message.intent_id);
        const next = structuredClone(this.projection);
        next.view.hand = next.view.hand.filter((instance) => instance.card_instance_id !== selectedIntent.card_instance_id);
        next.legal_intents = next.legal_intents.filter((intent) => intent.card_instance_id !== selectedIntent.card_instance_id);
        this.projection = next;
        queueMicrotask(() => this.dispatchEvent(new MessageEvent('message', { data: {
          type: 'INTENT_RESOLVED',
          projection: next,
          events: [],
          result: { accepted: true, resolution_code: 'ACTION_ACCEPTED', actions_spent: 1, utility_resources_spent: { search_tokens: 0, refresh_tokens: 0 } },
          terminal_result: null,
        } })));
      }
      terminate() { this.native.terminate(); }
    }
    window.Worker = Task020Worker;
  });
  await openSolo(page);
  const stack = page.locator('.hand-group--stacked').first();
  await expect(stack).toBeVisible();
  await expect(stack.locator('.hand-group__quantity')).toHaveText('×2');
  const ids = (await stack.getAttribute('data-card-instance-ids')).split(' ');
  await expect(stack).toHaveAttribute('aria-label', /2 copies/);
  await stack.locator('.hand-group__inspect').click();
  await expect(page.locator('#game-card-dialog')).toContainText('2 copies currently in hand');
  await page.getByRole('button', { name: 'Close Card details' }).click();
  await stack.locator('.play-card').click();
  await expect(page.locator('.selected-card-actions')).toContainText('Perform Repair');
  await page.locator('[data-intent-id="intent.task020.first"]').click();
  await expect(page.locator(`.hand-group[data-card-instance-ids~="${ids[1]}"] .hand-group__quantity`)).toHaveText('×1');
  expect(await page.evaluate(() => window.__task020Submitted)).toEqual([{ type: 'SUBMIT_INTENT', intent_id: 'intent.task020.first' }]);
  await expect(page.locator(`[data-card-instance-id="${ids[0]}"]`)).toHaveCount(0);
  await expect(page.locator(`[data-card-instance-id="${ids[1]}"]`)).toHaveCount(1);
});

test('tablet, phone, reduced motion, and 200% text reflow keep all board surfaces in document flow', async ({ page }, testInfo) => {
  await openSolo(page);
  if (testInfo.project.name === 'chromium-desktop') {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  }
  const modes = testInfo.project.name === 'chromium-desktop' ? ['Relevant'] : ['Relevant', 'Global'];
  for (const mode of modes) {
    await page.getByRole('button', { name: mode, exact: true }).click();
    for (const selector of ['.diagnostic-bench', '.hand-rail', '.legal-action-panel', '.basic-actions-panel']) {
      await expect(page.locator(selector)).toBeVisible();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0.5);
    await expect(page.locator('.hand-group__copies')).toHaveCount(0);
    if (UPDATE_VISUALS && testInfo.project.name !== 'chromium-desktop') {
      const viewport = page.viewportSize();
      await page.screenshot({
        path: `tests/visual/task-020/${mode.toLowerCase()}-${viewport.width}x${viewport.height}-${testInfo.project.name}.png`,
        fullPage: true,
        animations: 'disabled',
      });
    }
  }
});
