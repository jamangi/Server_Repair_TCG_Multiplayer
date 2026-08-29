import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { readWebpDimensions } from "../viewer/scripts/verify-task-011-art.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8"));
const sha256 = (payload) => crypto.createHash("sha256").update(payload).digest("hex");
const hashFile = (relativePath) => sha256(fs.readFileSync(path.join(ROOT, relativePath)));

const manifest = readJson("viewer/assets/story/manifest.json");
const inventory = readJson("docs/art/task-030-story-art-inventory.json");
const provenance = readJson("art_sources/task-030/generation-log.json");
const requests = readJson("docs/story/revisions/quiet-cascade-expansion-v3/ART_REQUESTS.json");
const inventoryById = new Map(inventory.assets.map((asset) => [asset.asset_id, asset]));
const requestById = new Map(requests.asset_reuse.assets.map((asset) => [asset.asset_id, asset]));

const EXPECTED_ASSETS = [
  "story.asset.character.hana_park.relief",
  "story.asset.character.hana_park.skeptical",
  "story.asset.character.jonah_reed.defensive",
  "story.asset.character.jonah_reed.thoughtful",
  "story.asset.character.malik_okoye.defensive",
  "story.asset.character.malik_okoye.focused",
  "story.asset.character.sora_chen.approving",
  "story.asset.character.sora_chen.focused",
  "story.bg.trinity.core_floor.night_storm",
  "story.bg.trinity.knowledge_systems.night",
  "story.bg.trinity.trace.night",
  "story.bg.trinity.validation_gate.predawn",
];

const EPISODES = [
  {
    shift: 7,
    script: "content/story-v1/candidates/quiet-cascade-expansion-v3/scripts/shift-07.json",
    label: "story.qc02.shift07.entry",
    background: "story.bg.trinity.trace.night",
    characters: [
      ["story.asset.character.sora_chen.focused", "RIGHT"],
      ["story.asset.character.malik_okoye.focused", "LEFT"],
    ],
  },
  {
    shift: 8,
    script: "content/story-v1/candidates/quiet-cascade-expansion-v3/scripts/shift-08.json",
    label: "story.qc02.shift08.success",
    background: "story.bg.trinity.validation_gate.predawn",
    characters: [
      ["story.asset.character.malik_okoye.focused", "LEFT"],
      ["story.asset.character.hana_park.relief", "RIGHT"],
    ],
  },
  {
    shift: 9,
    script: "content/story-v1/candidates/quiet-cascade-expansion-v3/scripts/shift-09.json",
    label: "story.qc02.shift09.abandon",
    background: "story.bg.trinity.knowledge_systems.night",
    characters: [
      ["story.asset.character.jonah_reed.thoughtful", "LEFT"],
      ["story.asset.character.hana_park.skeptical", "RIGHT"],
    ],
  },
  {
    shift: 10,
    script: "content/story-v1/candidates/quiet-cascade-expansion-v3/scripts/shift-10.json",
    label: "story.qc02.shift10.entry",
    background: "story.bg.trinity.knowledge_systems.night",
    characters: [
      ["story.asset.character.jonah_reed.defensive", "LEFT"],
      ["story.asset.character.hana_park.skeptical", "RIGHT"],
    ],
  },
  {
    shift: 11,
    script: "content/story-v1/candidates/quiet-cascade-expansion-v3/scripts/shift-11.json",
    label: "story.qc02.shift11.entry",
    background: "story.bg.trinity.core_floor.night_storm",
    characters: [
      ["story.asset.character.malik_okoye.defensive", "LEFT"],
      ["story.asset.character.sora_chen.focused", "RIGHT"],
    ],
  },
  {
    shift: 12,
    script: "content/story-v1/candidates/quiet-cascade-expansion-v3/scripts/shift-12.json",
    label: "story.qc02.shift12.follow_on",
    background: "story.bg.trinity.validation_gate.predawn",
    characters: [
      ["story.asset.character.hana_park.relief", "RIGHT"],
      ["story.asset.character.sora_chen.approving", "LEFT"],
    ],
  },
];

function sceneAtLabel(statements, label) {
  const index = statements.findIndex((statement) => statement.type === "label" && statement.label_id === label);
  assert.notEqual(index, -1, `${label} is absent`);
  let background = null;
  const characters = [];
  for (const statement of statements.slice(index + 1)) {
    if (["say", "narrate", "choice", "start_match", "jump", "if", "end"].includes(statement.type)) break;
    if (statement.type === "scene") background = statement.background_asset_id;
    if (statement.type === "show" && statement.layer === "characters") {
      characters.push([
        `story.asset.character.${statement.character_id.replace("story.character.", "")}.${statement.pose_id}`,
        statement.position,
      ]);
    }
  }
  return { background, characters };
}

function readJpegDimensions(buffer) {
  assert.equal(buffer.readUInt16BE(0), 0xffd8, "expected JPEG SOI marker");
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    if (marker === 0xd8 || marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    offset += 2 + buffer.readUInt16BE(offset + 2);
  }
  throw new Error("JPEG size marker was not found");
}

test("TASK-045 retains the exact zero-gap, reuse-only 12-asset boundary", () => {
  assert.equal(requests.status, "ZERO_NEW_ART_REQUESTS_EXISTING_INVENTORY_COMPLETE");
  assert.deepEqual(requests.art_request_disposition, {
    gap_count: 0,
    rationale: requests.art_request_disposition.rationale,
    request_count: 0,
    requests: [],
    task_045_mode: "VERIFY_EXISTING_ASSETS_DO_NOT_GENERATE",
  });
  assert.equal(requests.asset_reuse.background_count, 4);
  assert.equal(requests.asset_reuse.character_pose_count, 8);
  assert.equal(requests.asset_reuse.transient_count, 0);
  assert.deepEqual([...requestById.keys()].sort(), [...EXPECTED_ASSETS].sort());
  assert.equal(fs.existsSync(path.join(ROOT, "art_sources/task-045")), false);

  for (const assetId of EXPECTED_ASSETS) {
    const asset = manifest.assets[assetId];
    const record = inventoryById.get(assetId);
    const ledger = provenance.assets[assetId];
    const reuse = requestById.get(assetId);
    assert.equal(asset.kind, "production");
    assert.equal(record.review_state, "approved");
    assert.equal(ledger.review_state, "approved");
    assert.equal(ledger.approval.status, "approved");
    assert.equal(ledger.source_pixels_used, false);
    assert.equal(reuse.exact_existing_reuse, true);
    assert.equal(reuse.review_state, "approved");
    for (const profile of ["desktop", "mobile", "reduced_data"]) {
      const relativePath = `viewer/assets/story/${asset.sources[profile]}`;
      const derivative = record.derivatives[profile];
      const ledgerDerivative = ledger.derivatives[profile];
      const reuseDerivative = reuse.responsive_variants.find((candidate) => candidate.variant === profile);
      assert.equal(derivative.path, relativePath);
      assert.equal(reuseDerivative.path, relativePath);
      assert.equal(hashFile(relativePath), derivative.sha256);
      assert.equal(ledgerDerivative.sha256, derivative.sha256);
      assert.equal(reuseDerivative.sha256, derivative.sha256);
      assert.deepEqual(readWebpDimensions(fs.readFileSync(path.join(ROOT, relativePath))), {
        width: derivative.width,
        height: derivative.height,
      });
    }
  }
});

test("the six sheet compositions are exact reachable script states and cover all reused assets", () => {
  const covered = new Set();
  for (const episode of EPISODES) {
    const script = readJson(episode.script);
    assert.deepEqual(sceneAtLabel(script.statements, episode.label), {
      background: episode.background,
      characters: episode.characters,
    }, `Shift ${episode.shift} composition drifted`);
    covered.add(episode.background);
    episode.characters.forEach(([assetId]) => covered.add(assetId));
  }
  assert.deepEqual([...covered].sort(), [...EXPECTED_ASSETS].sort());
});

test("focal/dialogue zones, identity pairs, alpha bounds, and content-safety approvals remain intact", () => {
  const backgrounds = EXPECTED_ASSETS.filter((assetId) => manifest.assets[assetId].layer === "BACKGROUND");
  const characters = EXPECTED_ASSETS.filter((assetId) => manifest.assets[assetId].layer === "CHARACTER");
  const expectedZones = [
    { x: 0, y: 0.66, width: 1, height: 0.34 },
    { x: 0, y: 0, width: 0.3, height: 0.12 },
  ];
  for (const assetId of backgrounds) {
    const asset = manifest.assets[assetId];
    assert.ok(asset.focal_point.x >= 0.45 && asset.focal_point.x <= 0.60);
    assert.ok(asset.focal_point.y >= 0.30 && asset.focal_point.y <= 0.45);
    assert.deepEqual(asset.protected_zones, expectedZones);
    assert.deepEqual(
      [inventoryById.get(assetId).derivatives.desktop.width, inventoryById.get(assetId).derivatives.desktop.height],
      [1600, 900],
    );
    assert.deepEqual(
      [inventoryById.get(assetId).derivatives.mobile.width, inventoryById.get(assetId).derivatives.mobile.height],
      [720, 960],
    );
  }
  let pairChecks = 0;
  for (const assetId of characters) {
    const record = inventoryById.get(assetId);
    const reference = inventoryById.get(record.presentation_transform.reference_asset_id);
    for (const profile of ["desktop", "mobile"]) {
      const derivative = record.derivatives[profile];
      const referenceDerivative = reference.derivatives[profile];
      const bounds = derivative.visible_alpha_bounds;
      assert.ok(bounds.x > 0 && bounds.y > 0);
      assert.ok(bounds.x + bounds.width < derivative.width);
      assert.ok(derivative.visible_alpha_pixels > 0);
      const band = derivative.portrait_anchor_bounds;
      const referenceBand = referenceDerivative.portrait_anchor_bounds;
      const tolerance = record.presentation_transform.applied ? 0.02 : 0.03;
      assert.ok(band.width / referenceBand.width >= 1 - tolerance);
      assert.ok(band.width / referenceBand.width <= 1 + tolerance);
      assert.ok(derivative.visible_alpha_pixels / referenceDerivative.visible_alpha_pixels >= 0.80);
      assert.ok(derivative.visible_alpha_pixels / referenceDerivative.visible_alpha_pixels <= 1.10);
      pairChecks += 1;
    }
  }
  assert.equal(pairChecks, 16);

  assert.equal(provenance.license_audit.result, "pass");
  assert.equal(provenance.license_audit.third_party_brands_or_marks, false);
  assert.equal(provenance.license_audit.named_artist_imitation, false);
  assert.equal(provenance.license_audit.runtime_network_dependency, false);
  for (const assetId of EXPECTED_ASSETS) {
    const ledger = provenance.assets[assetId];
    const prompt = ledger.prompt.toLowerCase();
    const review = ledger.review_notes.join(" ").toLowerCase();
    for (const phrase of ["brands", "readable or pseudo text", "hidden gameplay answers", "unsafe handling"]) {
      assert.ok(prompt.includes(phrase), `${assetId} lost ${phrase}`);
    }
    for (const phrase of ["text-free composition", "technical safety", "absence of hidden gameplay answers"]) {
      assert.ok(review.includes(phrase), `${assetId} lost ${phrase}`);
    }
  }
  assert.match(provenance.assets["story.bg.trinity.trace.night"].edit_history.join(" "), /pseudo-writing/);
  assert.match(provenance.assets["story.bg.trinity.knowledge_systems.night"].edit_history.join(" "), /pseudo-writing/);
});

test("the committed labeled review sheet and hash-complete report are deterministic", () => {
  const sheetPath = "docs/art/task-045-contact-sheets/expansion-reuse.jpg";
  const sheet = fs.readFileSync(path.join(ROOT, sheetPath));
  const outputHash = "a0a4b870d4ea33878179cf57bc717280d32ac7768c74461699be853d4e3c7816";
  const reviewLock = "98b72aa77e86d3d2fb04ffddf1471ebc5a0b3737f02a8038289df219075be85f";
  assert.equal(sheet.length, 1_724_536);
  assert.equal(sha256(sheet), outputHash);
  assert.deepEqual(readJpegDimensions(sheet), { width: 2416, height: 3490 });

  const report = fs.readFileSync(path.join(ROOT, "docs/art/TASK-045-VISUAL-REVIEW.md"), "utf8");
  assert.match(report, /6\/6 sheet states/);
  assert.match(report, /twelve already-approved TASK-030 assets/);
  assert.match(report, /No image generation or image editing was performed/);
  assert.match(report, /Production-art mutations: 0/);
  assert.ok(report.includes(outputHash));
  assert.ok(report.includes(reviewLock));
  for (const assetId of EXPECTED_ASSETS) {
    assert.ok(report.includes(assetId));
    for (const profile of ["desktop", "mobile"]) {
      assert.ok(report.includes(inventoryById.get(assetId).derivatives[profile].sha256));
    }
  }
});
