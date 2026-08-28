import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  createStoryArtResolver,
  validateStoryArtManifest,
} from "../viewer/js/play/story-art-resolver.mjs";
import { verifyTask030Art } from "../viewer/scripts/verify-task-030-art.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "viewer/assets/story/manifest.json"), "utf8"));
const inventory = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/art/task-030-story-art-inventory.json"), "utf8"));
const manifestUrl = new URL("https://example.invalid/viewer/assets/story/manifest.json");

test("TASK-030 verifies the finite reviewed production set, fallbacks, provenance, and budgets", () => {
  const result = verifyTask030Art();
  assert.deepEqual(result.errors, []);
  assert.deepEqual({
    production: result.summary.production,
    fallback: result.summary.fallback,
    background: result.summary.background,
    character: result.summary.character,
    transient: result.summary.transient,
  }, { production: 23, fallback: 3, background: 6, character: 14, transient: 3 });
  assert.equal(result.summary.approved, 26);
  assert.equal(result.summary.contact_sheets, 11);
  assert.ok(result.summary.delivery_bytes < result.summary.pages_budget_bytes);
});

test("Story art resolver selects desktop, mobile, and reduced-data derivatives deterministically", () => {
  const assetId = "story.bg.trinity.inflow.predawn_storm";
  const desktop = createStoryArtResolver({
    manifest,
    manifestUrl,
    matchMediaImpl: () => ({ matches: false }),
    saveData: false,
  });
  const mobile = createStoryArtResolver({
    manifest,
    manifestUrl,
    matchMediaImpl: () => ({ matches: true }),
    saveData: false,
  });
  const reduced = createStoryArtResolver({
    manifest,
    manifestUrl,
    matchMediaImpl: () => ({ matches: true }),
    saveData: true,
  });
  assert.match(desktop.resolveBackground(assetId).src, /desktop\.webp$/);
  assert.match(mobile.resolveBackground(assetId).src, /mobile\.webp$/);
  assert.match(reduced.resolveBackground(assetId).src, /reduced-data\.webp$/);
  assert.equal(desktop.resolveBackground(assetId).alt, manifest.assets[assetId].alt_text);
  assert.equal(desktop.resolveBackground(assetId).fallback.assetId, "story.fallback.background");
});

test("character delivery pairs carry bounded master-preserving presentation transforms", () => {
  const byId = new Map(inventory.assets.map((asset) => [asset.asset_id, asset]));
  const affected = new Map([
    ["story.asset.character.inez_calder.amused", [1.22, 1.23]],
    ["story.asset.character.malik_okoye.defensive", [1.32, 1.33]],
    ["story.asset.character.sora_chen.approving", [1.24, 1.26]],
    ["story.asset.character.hana_park.relief", [1.33, 1.34]],
    ["story.asset.character.jonah_reed.defensive", [1.38, 1.39]],
  ]);
  for (const [assetId, [minimum, maximum]] of affected) {
    const transform = byId.get(assetId).presentation_transform;
    assert.equal(transform.version, "character-presentation-normalization-v1");
    assert.equal(transform.applied, true);
    assert.ok(transform.applied_scale >= minimum && transform.applied_scale <= maximum);
    assert.ok(transform.predicted_unclipped_area_ratio >= 0.90);
    assert.ok(transform.predicted_unclipped_area_ratio <= 1.10);
  }
  for (const assetId of [
    "story.asset.character.ev_shaw.concerned",
    "story.asset.character.priya_nayar.resolved",
  ]) {
    const transform = byId.get(assetId).presentation_transform;
    assert.equal(transform.applied, false);
    assert.equal(transform.applied_scale, 1);
  }
});

test("missing or cross-layer requests resolve only to bounded same-layer fallbacks", () => {
  const resolver = createStoryArtResolver({ manifest, manifestUrl, saveData: false });
  const character = resolver.resolveCharacter("story.asset.character.unknown.focused");
  const transient = resolver.resolveTransient("story.bg.trinity.inflow.predawn_storm");
  assert.equal(character.assetId, "story.fallback.character");
  assert.equal(character.layer, "character");
  assert.equal(character.alt, "");
  assert.equal(character.isPlaceholder, true);
  assert.equal(transient.assetId, "story.fallback.transient");
  assert.equal(transient.layer, "transient");
});

test("manifest validation rejects traversal, unknown fields, and cross-layer fallbacks", () => {
  const traversal = structuredClone(manifest);
  traversal.assets["story.fallback.background"].sources.desktop = "../escape.webp";
  assert.throws(() => validateStoryArtManifest(traversal), /invalid/);

  const unknownField = structuredClone(manifest);
  unknownField.assets["story.fallback.background"].unreviewed = true;
  assert.throws(() => validateStoryArtManifest(unknownField), /invalid/);

  const wrongLayer = structuredClone(manifest);
  wrongLayer.assets["story.bg.trinity.inflow.predawn_storm"].fallback_asset_id = "story.fallback.character";
  assert.throws(() => validateStoryArtManifest(wrongLayer), /crosses layers/);
});
