import { expect, test } from "@playwright/test";

const UPDATE_VISUALS = process.env.UPDATE_TASK_011_VISUALS === "1";

async function ready(page, hash) {
  await page.goto(`/index.html${hash}`);
  await expect(page.locator("#app")).not.toHaveAttribute("aria-busy", "true");
}

async function startSolo(page) {
  await page.addInitScript(() => {
    Object.defineProperty(Crypto.prototype, "randomUUID", {
      configurable: true,
      value: () => "00000000-0000-4000-8000-000000001101",
    });
  });
  await ready(page, "#/play/home");
  await page.locator("#ticket-count").selectOption("3");
  await page.locator("#start-solo").click();
  await expect(page.getByRole("heading", { name: "Night-shift board" })).toBeVisible({ timeout: 20_000 });
}

async function imageMetrics(locator) {
  await expect(locator).toHaveAttribute("data-art-status", /^(?:ready|fallback)$/);
  return locator.evaluate((image) => {
    const box = image.getBoundingClientRect();
    const parent = image.parentElement.getBoundingClientRect();
    return {
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      width: box.width,
      height: box.height,
      parentWidth: parent.width,
      parentHeight: parent.height,
      objectFit: getComputedStyle(image).objectFit,
      alt: image.alt,
      assetId: image.dataset.assetId,
      status: image.dataset.artStatus,
    };
  });
}

test("Library loads only the opened canonical illustration and preserves both aspect families", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop", "Library load accounting runs once on desktop.");

  await ready(page, "#/library");
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => performance.getEntriesByType("resource")
    .filter((entry) => entry.name.includes("/canonical/")).length)).toBe(0);

  await ready(page, "#/library/test.electrical.continuity");
  const action = page.locator("[data-library-detail-art]");
  await expect(action).toBeVisible();
  const actionMetrics = await imageMetrics(action);
  expect(actionMetrics).toMatchObject({
    naturalWidth: 800,
    naturalHeight: 450,
    assetId: "art.test.electrical.continuity",
    status: "ready",
    objectFit: "cover",
  });
  expect(actionMetrics.alt.length).toBeGreaterThan(20);
  expect(Math.abs(actionMetrics.width / actionMetrics.height - 16 / 9)).toBeLessThan(0.03);
  if (UPDATE_VISUALS) {
    await page.screenshot({
      path: "tests/visual/task-011/library-action-detail-1600x1000.png",
      animations: "disabled",
    });
  }

  await ready(page, "#/library/symptom.storage.raid_degraded");
  const symptom = page.locator("[data-library-detail-art]");
  await expect(symptom).toBeVisible();
  const symptomMetrics = await imageMetrics(symptom);
  expect(symptomMetrics).toMatchObject({
    naturalWidth: 1200,
    naturalHeight: 360,
    assetId: "art.symptom.storage.raid_degraded",
    status: "ready",
    objectFit: "cover",
  });
  expect(Math.abs(symptomMetrics.width / symptomMetrics.height - 10 / 3)).toBeLessThan(0.03);
  const canonicalLoads = await page.evaluate(() => performance.getEntriesByType("resource")
    .filter((entry) => entry.name.includes("/canonical/")).length);
  expect(canonicalLoads).toBeLessThanOrEqual(2);
  if (UPDATE_VISUALS) {
    await page.waitForTimeout(250);
    await page.screenshot({
      path: "tests/visual/task-011/library-symptom-detail-1600x1000.png",
      animations: "disabled",
    });
  }
});

test("Library image failure uses the deliberate placeholder without a broken-image icon", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop", "Failure-path fixture runs once on desktop.");
  await page.route("**/canonical/actions/tests/test-electrical-continuity.webp", (route) => route.abort());
  await ready(page, "#/library/test.electrical.continuity");
  const image = page.locator("[data-library-detail-art]");
  await expect(image).toHaveAttribute("data-art-status", "fallback");
  await expect(image).toHaveAttribute("data-asset-id", "placeholder.card.generic");
  await expect(image).toHaveAttribute("src", /placeholders\/generic-server\.svg$/);
  await expect(image).toBeVisible();
});

test("Match Card and Ticket slots use canonical assets without stretching across the browser matrix", async ({ page }, testInfo) => {
  await startSolo(page);

  const ticket = page.locator("#ticket-art");
  await expect(ticket).toBeVisible();
  const ticketMetrics = await imageMetrics(ticket);
  expect(ticketMetrics.naturalWidth).toBe(1200);
  expect(ticketMetrics.naturalHeight).toBe(360);
  expect(ticketMetrics.assetId).toMatch(/^art\.symptom\./);
  expect(ticketMetrics.objectFit).toBe("cover");
  expect(ticketMetrics.width).toBeGreaterThan(80);
  expect(ticketMetrics.height).toBeGreaterThan(20);
  expect(ticketMetrics.alt).not.toMatch(/fault\.|supports|contradicts|repaired|success/i);

  const benchImage = page.locator(".diagnostic-tile .play-card__art-image").first();
  const handImage = page.locator(".hand-group .play-card__art-image").first();
  let expandedHand = false;
  if (await handImage.getAttribute("data-art-status") === "loading") {
    await page.getByRole("button", { name: "Expand hand" }).click();
    expandedHand = true;
  }
  const cardImages = [benchImage, handImage];
  for (const image of cardImages) {
    await expect(image).toBeVisible();
    const metrics = await imageMetrics(image);
    expect(metrics.naturalWidth).toBe(800);
    expect(metrics.naturalHeight).toBe(450);
    expect(metrics.assetId).toMatch(/^art\.(?:command|repair|test|verify)\./);
    expect(metrics.status).toBe("ready");
    expect(metrics.objectFit).toBe("cover");
    expect(metrics.width).toBeGreaterThan(45);
    expect(metrics.height).toBeGreaterThan(20);
  }

  const canonicalLoads = await page.evaluate(() => performance.getEntriesByType("resource")
    .filter((entry) => entry.name.includes("/canonical/")).length);
  expect(canonicalLoads).toBeGreaterThan(2);
  expect(canonicalLoads).toBeLessThan(30);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);

  if (expandedHand) {
    await page.getByRole("button", { name: "Collapse hand" }).click();
  }

  await page.getByRole("button", { name: "View full Ticket" }).click();
  const dialog = page.locator("#full-ticket-dialog");
  await expect(dialog).toBeVisible();
  const fullTicket = page.locator("#full-ticket-art");
  const fullMetrics = await imageMetrics(fullTicket);
  expect(fullMetrics.assetId).toBe(ticketMetrics.assetId);
  expect(fullMetrics.alt).toBe(ticketMetrics.alt);
  expect(fullMetrics.naturalWidth).toBe(1200);
  expect(fullMetrics.naturalHeight).toBe(360);
  expect(Math.abs(fullMetrics.parentWidth / fullMetrics.parentHeight - 2.15)).toBeLessThan(0.05);
  expect(await fullTicket.evaluate((image) => image.outerHTML)).not.toMatch(
    /fault\.[a-z]|SUPPORTS|CONTRADICTS|repaired|success/i,
  );

  if (UPDATE_VISUALS && testInfo.project.name === "chromium-desktop") {
    await page.screenshot({
      path: "tests/visual/task-011/full-ticket-1600x1000.png",
      animations: "disabled",
    });
    await page.getByRole("button", { name: "Close full Ticket" }).click();
    await page.screenshot({
      path: "tests/visual/task-011/game-art-matrix-1600x1000.png",
      animations: "disabled",
    });
  }
  if (UPDATE_VISUALS && testInfo.project.name === "chromium-mobile") {
    await page.getByRole("button", { name: "Close full Ticket" }).click();
    await page.locator(".ticket-sheet__art").scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -96));
    await page.waitForTimeout(200);
    await page.screenshot({
      path: "tests/visual/task-011/game-art-mobile-390x844.png",
      animations: "disabled",
    });
  }
});
