import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const reviewHtml = fs.readFileSync(path.join(ROOT, 'docs/system-models/task-050/review.html'), 'utf8');

async function loadReview(page) {
  await page.setContent(reviewHtml, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('article')).toHaveCount(5);
  await expect(page.locator('article svg[role="img"]')).toHaveCount(5);
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

test('five diagrams reflow at the project viewport and at 200% text scale', async ({ page }) => {
  await loadReview(page);
  await expectNoHorizontalOverflow(page);
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await expect(page.locator('html')).toHaveCSS('font-size', '32px');
  await expectNoHorizontalOverflow(page);
  const sizes = await page.locator('article svg').evaluateAll((items) => items.map((item) => ({
    parent: item.parentElement.getBoundingClientRect().width,
    width: item.getBoundingClientRect().width,
  })));
  for (const size of sizes) expect(size.width).toBeLessThanOrEqual(size.parent + 0.5);
});
test('forced colors preserves nodes, text, relation patterns, and focus', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await loadReview(page);
  const firstNode = page.locator('svg .node[tabindex="0"]').first();
  await firstNode.focus();
  await expect(firstNode).toBeFocused();
  const styles = await firstNode.locator('rect').evaluate((rect) => {
    const computed = getComputedStyle(rect);
    return { fill: computed.fill, stroke: computed.stroke, strokeWidth: computed.strokeWidth };
  });
  expect(styles.fill).not.toBe('none');
  expect(styles.stroke).not.toBe('none');
  expect(Number.parseFloat(styles.strokeWidth)).toBeGreaterThanOrEqual(2);
  await expect(page.locator('svg line[stroke-dasharray]')).not.toHaveCount(0);
  await expect(page.locator('svg line[marker-end]')).not.toHaveCount(0);
});

test('keyboard and screen-reader order follows the text-equivalent component sequence', async ({ page }) => {
  await loadReview(page);
  const firstArticle = page.locator('article').first();
  const orders = await firstArticle.locator('svg .node[tabindex="0"]').evaluateAll((nodes) => nodes.map((node) => Number(node.dataset.readingOrder)));
  expect(orders).toEqual(orders.map((_, index) => index + 1));
  await firstArticle.locator('svg').focus();
  await page.keyboard.press('Tab');
  await expect(firstArticle.locator('svg .node[tabindex="0"]').first()).toBeFocused();
  for (let index = 1; index < orders.length; index += 1) {
    await page.keyboard.press('Tab');
    await expect(firstArticle.locator('svg .node[tabindex="0"]').nth(index)).toBeFocused();
  }
  const accessible = await firstArticle.locator('svg').evaluate((svg) => ({
    description: svg.querySelector('desc')?.textContent ?? '',
    title: svg.querySelector('title')?.textContent ?? '',
    caption: svg.parentElement.querySelector('figcaption')?.textContent ?? '',
  }));
  expect(accessible.title).toContain('Public-safe system context');
  expect(accessible.description.length).toBeGreaterThan(250);
  expect(accessible.caption).toBe(accessible.description);
});
