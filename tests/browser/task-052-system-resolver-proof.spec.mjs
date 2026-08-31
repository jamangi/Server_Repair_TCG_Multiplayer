import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const reviewHtml = fs.readFileSync(path.join(ROOT, 'docs/system-models/task-052/review.html'), 'utf8');

async function loadReview(page) {
  await page.setContent(reviewHtml, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.pilot-case')).toHaveCount(5);
  await expect(page.locator('.pilot-case svg[role="img"]')).toHaveCount(5);
  await expect(page.locator('.public-review')).toHaveCount(5);
  await expect(page.locator('.private-review')).toHaveCount(5);
}

async function expectNoHorizontalOverflow(page) {
  const widths = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(widths.scrollWidth).toBeLessThanOrEqual(widths.clientWidth + 1);
}

test('the proof surface separates five public resolutions from authoring-only validation', async ({ page }) => {
  await loadReview(page);
  await expect(page.getByText('5/5', { exact: true })).toHaveCount(2);
  await expect(page.locator('.invalid-card')).toHaveCount(5);
  await expect(page.locator('.invalid-card .status.fail')).toHaveCount(5);
  const publicProjectionText = (await page.locator('.public-review').allTextContents()).join('\n');
  expect(publicProjectionText).not.toMatch(/evidence\.|fault_instance\.|repair_outcome\.|verify_outcome\./i);
  await expect(page.locator('.private-review').first()).toContainText('never ship to the Player');
  await expect(page.locator('.public-review').first()).toContainText('ONE_SOURCE_PROJECTION_ACCEPTED');
  const localTargets = await page.locator('nav a').evaluateAll((links) => links.map((link) => ({
    href: link.getAttribute('href'),
    resolves: Boolean(document.querySelector(link.getAttribute('href'))),
  })));
  expect(localTargets.every((target) => target.href?.startsWith('#') && target.resolves)).toBe(true);
  const sourceHrefs = await page.getByRole('link', { name: 'Open primary source' }).evaluateAll((links) =>
    links.map((link) => link.getAttribute('href')));
  expect(sourceHrefs.length).toBeGreaterThan(0);
  expect(sourceHrefs.every((href) => href?.startsWith('https://'))).toBe(true);
});

test('desktop, touch, mobile, and 200% text scale reflow without page overflow', async ({ page }) => {
  await loadReview(page);
  await expectNoHorizontalOverflow(page);
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await expect(page.locator('html')).toHaveCSS('font-size', '32px');
  await expectNoHorizontalOverflow(page);
  const diagramWidths = await page.locator('.diagram-frame svg').evaluateAll((items) => items.map((item) => ({
    own: item.getBoundingClientRect().width,
    parent: item.parentElement.getBoundingClientRect().width,
  })));
  diagramWidths.forEach(({ own, parent }) => expect(own).toBeLessThanOrEqual(parent + 0.5));
});

test('forced colors retains typed line patterns, markers, node bounds, and visible focus', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await loadReview(page);
  const skipLink = page.locator('.skip-link');
  await skipLink.focus();
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toHaveCSS('top', '16px');
  await expect(page.locator('.diagram-edge line[stroke-dasharray]')).not.toHaveCount(0);
  await expect(page.locator('.diagram-edge line[marker-end]')).not.toHaveCount(0);
  const node = page.locator('.diagram-node[tabindex="0"]').first();
  await node.focus();
  await expect(node).toBeFocused();
  const nodeStyle = await node.locator('rect').evaluate((rect) => {
    const style = getComputedStyle(rect);
    return { fill: style.fill, stroke: style.stroke, strokeWidth: Number.parseFloat(style.strokeWidth) };
  });
  expect(nodeStyle.fill).not.toBe('none');
  expect(nodeStyle.stroke).not.toBe('none');
  expect(nodeStyle.strokeWidth).toBeGreaterThanOrEqual(6);
  const edge = page.locator('.diagram-edge[tabindex="0"]').first();
  await edge.focus();
  await expect(edge).toBeFocused();
  const edgeStrokeWidth = await edge.locator('line').evaluate((line) => Number.parseFloat(getComputedStyle(line).strokeWidth));
  expect(edgeStrokeWidth).toBeGreaterThanOrEqual(7);
});

test('keyboard and screen-reader order follows the canonical node and path sequence', async ({ page }) => {
  await loadReview(page);
  const article = page.locator('.pilot-case').first();
  const orders = await article.locator('.diagram-node[tabindex="0"]').evaluateAll((nodes) =>
    nodes.map((node) => Number(node.dataset.readingOrder)));
  expect(orders).toEqual(orders.map((_, index) => index + 1));
  const accessible = await article.locator('svg').evaluate((svg) => ({
    title: svg.querySelector('title')?.textContent ?? '',
    description: svg.querySelector('desc')?.textContent ?? '',
    caption: svg.parentElement.querySelector('figcaption')?.textContent ?? '',
  }));
  expect(accessible.title).toContain('Public-safe system context');
  expect(accessible.description.length).toBeGreaterThan(500);
  expect(accessible.caption).toBe(accessible.description);
  const firstNode = article.locator('.diagram-node[tabindex="0"]').first();
  await firstNode.focus();
  await expect(firstNode).toBeFocused();
  const pathDisclosure = article.locator('details').filter({ hasText: 'Keyboard-readable path list' });
  await pathDisclosure.locator('summary').click();
  await expect(pathDisclosure).toHaveAttribute('open', '');
  await pathDisclosure.locator('.path-list li').first().focus();
  await expect(pathDisclosure.locator('.path-list li').first()).toBeFocused();
});

test('native touch disclosures work and reduced-motion mode has no animated dependency', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await loadReview(page);
  const firstRationale = page.locator('.rationale-list details').first();
  await firstRationale.locator('summary').click();
  await expect(firstRationale).toHaveAttribute('open', '');
  await expect(firstRationale).toContainText('Relevant to this system profile');
  const motion = await firstRationale.evaluate((element) => {
    const style = getComputedStyle(element);
    return { animationName: style.animationName, transitionDuration: style.transitionDuration };
  });
  expect(motion.animationName).toBe('none');
  expect(motion.transitionDuration).toBe('0s');
});
