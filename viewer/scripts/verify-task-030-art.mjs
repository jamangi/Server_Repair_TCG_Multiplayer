import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { validateStoryArtManifest } from "../js/play/story-art-resolver.mjs";
import { readWebpDimensions } from "./verify-task-011-art.mjs";

const ROOT = path.resolve(import.meta.dirname, "../..");
const MANIFEST_PATH = "viewer/assets/story/manifest.json";
const INVENTORY_PATH = "docs/art/task-030-story-art-inventory.json";
const LEDGER_PATH = "art_sources/task-030/generation-log.json";
const REGISTRY_PATH = "content/story-v1/campaigns/quiet-cascade/registry.json";
const TEXT_PATH = "content/story-v1/campaigns/quiet-cascade/texts/en.json";
const EXPECTED_FALLBACKS = new Set([
  "story.fallback.background",
  "story.fallback.character",
  "story.fallback.transient",
]);
const EXPECTED_CHARACTER_REFERENCES = {
  ev_shaw: "story.asset.character.ev_shaw.focused",
  inez_calder: "story.asset.character.inez_calder.focused",
  malik_okoye: "story.asset.character.malik_okoye.focused",
  sora_chen: "story.asset.character.sora_chen.focused",
  hana_park: "story.asset.character.hana_park.skeptical",
  jonah_reed: "story.asset.character.jonah_reed.thoughtful",
  priya_nayar: "story.asset.character.priya_nayar.concerned",
};

function readJson(root, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function isSafeRelativeImagePath(value) {
  return typeof value === "string"
    && /^(?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.(?:avif|png|webp)$/.test(value)
    && !value.includes("..") && !path.isAbsolute(value);
}

function readPngMetadata(buffer) {
  const signature = "89504e470d0a1a0a";
  if (buffer.length < 33 || buffer.subarray(0, 8).toString("hex") !== signature
      || buffer.toString("ascii", 12, 16) !== "IHDR") {
    throw new TypeError("Expected a PNG image with an IHDR chunk.");
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    colorType: buffer[25],
  };
}

function walkFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const candidate = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(candidate) : [candidate];
  });
}

export function verifyTask030Art({ root = ROOT } = {}) {
  const errors = [];
  const manifest = readJson(root, MANIFEST_PATH);
  const inventory = readJson(root, INVENTORY_PATH);
  const ledger = readJson(root, LEDGER_PATH);
  const registry = readJson(root, REGISTRY_PATH);
  const texts = readJson(root, TEXT_PATH).entries;
  let validatedManifest;
  try {
    validatedManifest = validateStoryArtManifest(manifest);
  } catch (error) {
    errors.push(`manifest validation failed: ${error.message}`);
    validatedManifest = { assets: {} };
  }

  const required = new Map(registry.assets
    .filter((record) => record.required)
    .map((record) => [record.asset_id, record]));
  const manifestProduction = new Set(Object.entries(validatedManifest.assets)
    .filter(([, record]) => record.kind === "production")
    .map(([assetId]) => assetId));
  const manifestFallbacks = new Set(Object.entries(validatedManifest.assets)
    .filter(([, record]) => record.kind === "fallback")
    .map(([assetId]) => assetId));
  const inventoryById = new Map(inventory.assets?.map((record) => [record.asset_id, record]) ?? []);
  const expectedMasterPaths = new Set((inventory.assets ?? [])
    .map((record) => path.normalize(path.join(root, record.master.path))));
  const masterRoot = path.join(root, "art_sources/task-030/masters");
  const actualMasterPaths = new Set(walkFiles(masterRoot)
    .filter((filePath) => path.extname(filePath).toLowerCase() === ".png")
    .map((filePath) => path.normalize(filePath)));
  const counts = { production: 0, fallback: 0, background: 0, character: 0, transient: 0 };
  let deliveryBytes = 0;

  if (manifest.campaign_id !== "story.campaign.quiet_cascade.v1") {
    errors.push(`unexpected campaign ID ${manifest.campaign_id}`);
  }
  if (inventory.inventory_version !== "task-030-story-art-inventory-v1") {
    errors.push("inventory version is not task-030-story-art-inventory-v1");
  }
  if (ledger.provenance_version !== "task-030-story-art-provenance-v1") {
    errors.push("provenance version is not task-030-story-art-provenance-v1");
  }
  if (JSON.stringify([...manifestProduction].sort()) !== JSON.stringify([...required.keys()].sort())) {
    errors.push("production manifest IDs do not exactly match reachable required registry assets");
  }
  if (JSON.stringify([...manifestFallbacks].sort()) !== JSON.stringify([...EXPECTED_FALLBACKS].sort())) {
    errors.push("manifest does not contain exactly one fallback for each Story layer");
  }
  if (inventoryById.size !== manifestProduction.size + manifestFallbacks.size) {
    errors.push("inventory and manifest asset counts differ");
  }
  if (JSON.stringify([...actualMasterPaths].sort()) !== JSON.stringify([...expectedMasterPaths].sort())) {
    errors.push("committed Story master set contains a missing or untracked image");
  }

  for (const [assetId, asset] of Object.entries(validatedManifest.assets)) {
    const inventoryRecord = inventoryById.get(assetId);
    const provenance = ledger.assets?.[assetId];
    const registryRecord = required.get(assetId);
    const isProduction = asset.kind === "production";
    counts[asset.kind] += 1;
    if (isProduction) {
      counts[asset.layer.toLowerCase()] += 1;
      if (!registryRecord || registryRecord.layer !== asset.layer) {
        errors.push(`${assetId}: registry layer is absent or inconsistent`);
      }
      if (!asset.alt_text.trim() || asset.alt_text !== texts[registryRecord?.alt_text_id]) {
        errors.push(`${assetId}: canonical alt text is absent or differs from the text catalog`);
      }
      if (asset.decorative) errors.push(`${assetId}: production Story art must expose canonical alt text`);
    } else if (!asset.decorative || asset.alt_text !== "") {
      errors.push(`${assetId}: fallback must be decorative with empty alt text`);
    }
    if (!inventoryRecord || !provenance) {
      errors.push(`${assetId}: inventory or provenance record is missing`);
      continue;
    }
    if (inventoryRecord.review_state !== "approved"
        || provenance.review_state !== "approved"
        || provenance.approval?.status !== "approved") {
      errors.push(`${assetId}: review and approval are incomplete`);
    }
    if (!provenance.prompt?.trim() || !provenance.brief?.trim()
        || provenance.tool_or_artist !== "OpenAI built-in image generation"
        || provenance.date !== "2026-08-27"
        || !provenance.generation_reference?.trim()
        || provenance.source_pixels_used !== false
        || !Array.isArray(provenance.source_inputs) || provenance.source_inputs.length !== 6
        || !Array.isArray(provenance.edit_history) || provenance.edit_history.length === 0
        || !Array.isArray(provenance.review_notes) || provenance.review_notes.length === 0) {
      errors.push(`${assetId}: provenance is incomplete`);
    }
    if (isProduction && asset.layer === "CHARACTER") {
      const transform = inventoryRecord.presentation_transform;
      const provenanceTransform = provenance.presentation_transform;
      const identity = assetId.split(".").at(-2);
      const expectedReference = EXPECTED_CHARACTER_REFERENCES[identity];
      if (!transform || JSON.stringify(transform) !== JSON.stringify(provenanceTransform)
          || transform.version !== "character-presentation-normalization-v1"
          || transform.reference_asset_id !== expectedReference
          || transform.alpha_visibility_threshold !== 8
          || transform.portrait_band_ratio !== 0.4
          || transform.source_canvas?.width !== 1024
          || transform.source_canvas?.height !== 1536
          || transform.transform_date !== "2026-08-27"
          || transform.measured_scale < 0.75 || transform.measured_scale > 1.50
          || transform.applied_scale < 0.75 || transform.applied_scale > 1.50
          || transform.predicted_unclipped_area_ratio < 0.90
          || transform.predicted_unclipped_area_ratio > 1.10
          || transform.applied !== (Math.abs(transform.measured_scale - 1) > 0.03)
          || (!transform.applied && transform.applied_scale !== 1)) {
        errors.push(`${assetId}: presentation transform audit is absent or invalid`);
      }
    } else if (inventoryRecord.presentation_transform || provenance.presentation_transform) {
      errors.push(`${assetId}: only production character derivatives may carry a presentation transform`);
    }

    const masterPath = path.join(root, inventoryRecord.master.path);
    if (!fs.existsSync(masterPath)) {
      errors.push(`${assetId}: master is missing`);
    } else {
      const master = fs.readFileSync(masterPath);
      const metadata = readPngMetadata(master);
      if (metadata.width !== inventoryRecord.master.width
          || metadata.height !== inventoryRecord.master.height
          || master.length !== inventoryRecord.master.bytes
          || sha256(master) !== inventoryRecord.master.sha256) {
        errors.push(`${assetId}: master metadata or hash differs from inventory`);
      }
      if (["CHARACTER", "TRANSIENT"].includes(asset.layer)
          && ![4, 6].includes(metadata.colorType)) {
        errors.push(`${assetId}: layer-ready master does not contain an alpha channel`);
      }
    }

    for (const profile of ["desktop", "mobile", "reduced_data"]) {
      const relativeSource = asset.sources[profile];
      const derivative = inventoryRecord.derivatives?.[profile];
      if (!isSafeRelativeImagePath(relativeSource) || !derivative) {
        errors.push(`${assetId}: ${profile} source or inventory record is invalid`);
        continue;
      }
      const expectedPath = `viewer/assets/story/${relativeSource}`;
      if (derivative.path !== expectedPath) {
        errors.push(`${assetId}: ${profile} manifest and inventory paths differ`);
      }
      const deliveryPath = path.join(root, expectedPath);
      if (!fs.existsSync(deliveryPath)) {
        errors.push(`${assetId}: ${profile} delivery image is missing`);
        continue;
      }
      const payload = fs.readFileSync(deliveryPath);
      let dimensions;
      try {
        dimensions = readWebpDimensions(payload);
      } catch (error) {
        errors.push(`${assetId}: ${profile} is not a valid supported WebP (${error.message})`);
        continue;
      }
      if (dimensions.width !== derivative.width || dimensions.height !== derivative.height
          || payload.length !== derivative.bytes || sha256(payload) !== derivative.sha256) {
        errors.push(`${assetId}: ${profile} dimensions, bytes, or hash differ from inventory`);
      }
      if (payload.length > derivative.byte_budget) {
        errors.push(`${assetId}: ${profile} exceeds its byte budget`);
      }
      if (JSON.stringify(derivative) !== JSON.stringify(provenance.derivatives?.[profile])) {
        errors.push(`${assetId}: ${profile} inventory and provenance records differ`);
      }
      if (isProduction && asset.layer === "CHARACTER") {
        const full = derivative.visible_alpha_bounds;
        const portrait = derivative.portrait_anchor_bounds;
        const boundsFit = (bounds) => Number.isInteger(bounds?.x) && Number.isInteger(bounds?.y)
          && Number.isInteger(bounds?.width) && Number.isInteger(bounds?.height)
          && bounds.x >= 0 && bounds.y >= 0 && bounds.width > 0 && bounds.height > 0
          && bounds.x + bounds.width <= derivative.width
          && bounds.y + bounds.height <= derivative.height;
        if (!boundsFit(full) || !boundsFit(portrait)
            || !Number.isInteger(derivative.visible_alpha_pixels)
            || derivative.visible_alpha_pixels <= 0
            || full.x <= 0 || full.y <= 0
            || full.x + full.width >= derivative.width) {
          errors.push(`${assetId}: ${profile} presentation bounds or alpha audit is invalid`);
        }
      }
      deliveryBytes += payload.length;
    }
  }

  for (const item of inventory.assets ?? []) {
    if (item.kind !== "production" || item.layer !== "CHARACTER") continue;
    const transform = item.presentation_transform;
    const reference = inventoryById.get(transform?.reference_asset_id);
    if (!transform || !reference) continue;
    for (const profile of ["desktop", "mobile", "reduced_data"]) {
      const derivative = item.derivatives?.[profile];
      const referenceDerivative = reference.derivatives?.[profile];
      if (!derivative?.portrait_anchor_bounds || !referenceDerivative?.portrait_anchor_bounds) continue;
      const band = derivative.portrait_anchor_bounds;
      const referenceBand = referenceDerivative.portrait_anchor_bounds;
      const full = derivative.visible_alpha_bounds;
      const referenceFull = referenceDerivative.visible_alpha_bounds;
      const widthRatio = band.width / referenceBand.width;
      const areaRatio = derivative.visible_alpha_pixels / referenceDerivative.visible_alpha_pixels;
      const center = band.x + band.width / 2;
      const referenceCenter = referenceBand.x + referenceBand.width / 2;
      const widthTolerance = transform.applied ? 0.02 : 0.03;
      const topTolerance = Math.max(2, Math.round(derivative.height * (transform.applied ? 0.005 : 0.01)));
      const centerTolerance = Math.max(2, Math.round(derivative.width * (transform.applied ? 0.005 : 0.02)));
      const bottomClipped = full.y + full.height >= derivative.height;
      const referenceBottomClipped = referenceFull.y + referenceFull.height >= referenceDerivative.height;
      if (widthRatio < 1 - widthTolerance || widthRatio > 1 + widthTolerance
          || Math.abs(full.y - referenceFull.y) > topTolerance
          || Math.abs(center - referenceCenter) > centerTolerance
          || areaRatio < 0.80 || areaRatio > 1.10
          || bottomClipped !== referenceBottomClipped) {
        errors.push(`${item.asset_id}: ${profile} presentation continuity audit failed`);
      }
    }
  }

  if (counts.production !== 23 || counts.fallback !== 3
      || counts.background !== 6 || counts.character !== 14 || counts.transient !== 3) {
    errors.push(`unexpected finite inventory counts ${JSON.stringify(counts)}`);
  }
  if (deliveryBytes !== inventory.total_delivery_bytes
      || deliveryBytes !== ledger.repository_size_audit?.delivery_bytes) {
    errors.push("delivery byte totals differ across files and audit records");
  }
  const actualMasterBytes = [...actualMasterPaths]
    .reduce((total, filePath) => total + fs.statSync(filePath).size, 0);
  if (actualMasterBytes !== ledger.repository_size_audit?.master_bytes) {
    errors.push("master byte total differs from the finite repository-size audit");
  }
  if (deliveryBytes >= inventory.pages_budget_bytes
      || ledger.repository_size_audit?.result !== "pass") {
    errors.push("Story art exceeds the reviewed Pages delivery budget");
  }
  if (ledger.license_audit?.result !== "pass"
      || ledger.license_audit?.third_party_brands_or_marks !== false
      || ledger.license_audit?.named_artist_imitation !== false
      || ledger.license_audit?.runtime_network_dependency !== false
      || ledger.project_owned_reference_inputs?.length !== 6
      || ledger.project_owned_reference_inputs.some((entry) => entry.source_pixels_used !== false)) {
    errors.push("license/reference audit is incomplete or failed");
  }
  if (!Array.isArray(inventory.contact_sheets) || inventory.contact_sheets.length !== 11) {
    errors.push("expected eleven complete TASK-030 contact sheets");
  } else {
    for (const sheet of inventory.contact_sheets) {
      const sheetPath = path.join(root, sheet.path);
      if (!fs.existsSync(sheetPath)) {
        errors.push(`${sheet.path}: contact sheet is missing`);
        continue;
      }
      const payload = fs.readFileSync(sheetPath);
      if (payload.length !== sheet.bytes || sha256(payload) !== sheet.sha256
          || sheet.review_state !== "approved") {
        errors.push(`${sheet.path}: contact sheet hash or review state differs`);
      }
    }
  }

  return {
    errors,
    summary: {
      ...counts,
      delivery_bytes: deliveryBytes,
      pages_budget_bytes: inventory.pages_budget_bytes,
      contact_sheets: inventory.contact_sheets?.length ?? 0,
      approved: inventory.assets?.filter((record) => record.review_state === "approved").length ?? 0,
    },
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const result = verifyTask030Art();
  if (result.errors.length) {
    result.errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
  } else {
    console.log(`Verified ${result.summary.production} production Story assets, `
      + `${result.summary.fallback} fallbacks, and ${result.summary.contact_sheets} contact sheets `
      + `(${result.summary.delivery_bytes} delivery bytes).`);
  }
}
