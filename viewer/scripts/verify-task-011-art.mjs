import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(import.meta.dirname, "../..");
const readJson = (relativePath) => JSON.parse(
  fs.readFileSync(path.join(ROOT, relativePath), "utf8"),
);

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export function readWebpDimensions(buffer) {
  if (buffer.length < 30 || buffer.toString("ascii", 0, 4) !== "RIFF"
    || buffer.toString("ascii", 8, 12) !== "WEBP") {
    throw new TypeError("Expected a RIFF WebP image.");
  }

  const chunk = buffer.toString("ascii", 12, 16);
  if (chunk === "VP8 ") {
    if (buffer[23] !== 0x9d || buffer[24] !== 0x01 || buffer[25] !== 0x2a) {
      throw new TypeError("Invalid lossy WebP frame header.");
    }
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
    };
  }
  if (chunk === "VP8L") {
    if (buffer[20] !== 0x2f) {
      throw new TypeError("Invalid lossless WebP frame header.");
    }
    return {
      width: 1 + buffer[21] + ((buffer[22] & 0x3f) << 8),
      height: 1 + ((buffer[22] & 0xc0) >> 6) + (buffer[23] << 2)
        + ((buffer[24] & 0x0f) << 10),
    };
  }
  if (chunk === "VP8X") {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3),
    };
  }
  throw new TypeError(`Unsupported WebP chunk ${chunk}.`);
}

export function verifyTask011Art({ root = ROOT } = {}) {
  const errors = [];
  const inventory = readJson("docs/art/task-011-illustration-inventory.json");
  const ledger = readJson("art_sources/task-011/generation-log.json");
  const manifest = readJson("viewer/assets/play/assets.json");
  const stagedManifest = readJson("viewer/generated/play/assets/play/assets.json");
  const cards = readJson("content/gameplay-v1/card-catalog-v3.json").cards;
  const domain = readJson("content/gameplay-v1/domain-snapshot-v2.json").entities;
  const domainById = new Map(domain.map((entity) => [entity.id, entity]));
  const expectedCounts = { test: 37, command: 13, repair: 12, verify: 9, symptom: 33 };
  const actualCounts = Object.fromEntries(Object.keys(expectedCounts).map((key) => [key, 0]));
  const seenAssetIds = new Set();
  let stagedCanonicalBytes = 0;

  if (manifest.asset_manifest_version !== "play-assets-v2") {
    errors.push("canonical manifest is not play-assets-v2");
  }
  if (JSON.stringify(manifest) !== JSON.stringify(stagedManifest)) {
    errors.push("staged and canonical asset manifests differ");
  }
  if (inventory.subjects.length !== 104) {
    errors.push(`inventory has ${inventory.subjects.length} subjects instead of 104`);
  }

  for (const subject of inventory.subjects) {
    const countKey = subject.kind === "symptom" ? "symptom" : subject.family;
    if (!(countKey in actualCounts)) {
      errors.push(`${subject.domain_id}: unexpected family ${countKey}`);
    } else {
      actualCounts[countKey] += 1;
    }
    if (seenAssetIds.has(subject.asset_id)) {
      errors.push(`${subject.domain_id}: duplicate asset ID ${subject.asset_id}`);
    }
    seenAssetIds.add(subject.asset_id);

    const record = domainById.get(subject.domain_id);
    const illustration = record?.presentation?.illustration;
    const asset = manifest.assets[subject.asset_id];
    const provenance = ledger.subjects[subject.domain_id];
    if (!record) errors.push(`${subject.domain_id}: missing from domain snapshot`);
    if (!illustration?.asset_id || !illustration?.alt_text?.trim()) {
      errors.push(`${subject.domain_id}: missing domain illustration metadata`);
    }
    if (illustration?.asset_id !== subject.asset_id) {
      errors.push(`${subject.domain_id}: domain and inventory asset IDs differ`);
    }
    if (!asset || asset.kind !== "canonical" || asset.category !== subject.manifest_state.category) {
      errors.push(`${subject.domain_id}: canonical manifest registration is invalid`);
    }
    if (!asset?.alt_text?.trim() || asset?.alt_text !== illustration?.alt_text) {
      errors.push(`${subject.domain_id}: canonical alt text is missing or inconsistent`);
    }
    if (asset?.src !== subject.manifest_state.src || /placeholder/i.test(asset?.src ?? "")) {
      errors.push(`${subject.domain_id}: canonical source path is invalid`);
    }
    if (provenance?.review_state !== "approved" || !provenance?.review_notes?.length) {
      errors.push(`${subject.domain_id}: review is not approved and documented`);
    }
    if (!provenance?.provenance?.mode?.startsWith("generated")
      || provenance?.provenance?.tool !== "OpenAI built-in image generation"
      || provenance?.provenance?.source_pixels_used !== false
      || !provenance?.provenance?.generation_reference
      || !provenance?.provenance?.prompt
      || !provenance?.provenance?.usage_note) {
      errors.push(`${subject.domain_id}: provenance is incomplete`);
    }

    const deliveryPath = path.join(root, subject.output_path);
    const masterPath = path.join(root, subject.master_path);
    const stagedPath = path.join(
      root,
      subject.output_path.replace("viewer/assets/play/", "viewer/generated/play/assets/play/"),
    );
    for (const [label, filePath] of [["delivery", deliveryPath], ["master", masterPath], ["staged", stagedPath]]) {
      if (!fs.existsSync(filePath)) {
        errors.push(`${subject.domain_id}: missing ${label} image`);
      }
    }
    if (![deliveryPath, masterPath, stagedPath].every(fs.existsSync)) continue;

    const delivery = fs.readFileSync(deliveryPath);
    const master = fs.readFileSync(masterPath);
    const staged = fs.readFileSync(stagedPath);
    const deliveryDimensions = readWebpDimensions(delivery);
    const masterDimensions = readWebpDimensions(master);
    if (JSON.stringify(deliveryDimensions) !== JSON.stringify(subject.expected_dimensions)) {
      errors.push(`${subject.domain_id}: delivery dimensions are incorrect`);
    }
    if (JSON.stringify(masterDimensions) !== JSON.stringify(subject.expected_master_dimensions)) {
      errors.push(`${subject.domain_id}: master dimensions are incorrect`);
    }
    if (delivery.length > subject.byte_budget) {
      errors.push(`${subject.domain_id}: ${delivery.length} bytes exceeds ${subject.byte_budget}`);
    }
    if (delivery.length !== provenance?.bytes || sha256(delivery) !== provenance?.sha256) {
      errors.push(`${subject.domain_id}: delivery bytes/hash differ from provenance`);
    }
    if (!delivery.equals(staged)) {
      errors.push(`${subject.domain_id}: staged bytes differ from canonical bytes`);
    }
    stagedCanonicalBytes += staged.length;
  }

  if (JSON.stringify(actualCounts) !== JSON.stringify(expectedCounts)) {
    errors.push(`family counts ${JSON.stringify(actualCounts)} do not match ${JSON.stringify(expectedCounts)}`);
  }
  const primaryIds = cards.map((card) => card.primary_domain_reference?.entity_id);
  if (cards.length !== 71 || new Set(primaryIds).size !== 71) {
    errors.push("published Card Definitions do not map one-to-one to 71 primary domain records");
  }
  for (const card of cards) {
    const primary = card.primary_domain_reference;
    const assetId = domainById.get(primary?.entity_id)?.presentation?.illustration?.asset_id;
    if (primary?.inherit_illustration !== true || !seenAssetIds.has(assetId)
      || manifest.assets[assetId]?.kind !== "canonical") {
      errors.push(`${card.id}: does not inherit reviewed canonical domain art`);
    }
    if (card.presentation?.illustration) {
      errors.push(`${card.id}: duplicates illustration metadata on the Card Definition`);
    }
  }
  if (stagedCanonicalBytes >= 30 * 1024 * 1024) {
    errors.push(`staged canonical set is ${stagedCanonicalBytes} bytes, not under 30 MiB`);
  }

  return {
    errors,
    summary: {
      subjects: inventory.subjects.length,
      cards: cards.length,
      counts: actualCounts,
      staged_canonical_bytes: stagedCanonicalBytes,
      approved: inventory.subjects.filter((subject) => subject.review_state === "approved").length,
    },
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const result = verifyTask011Art();
  if (result.errors.length) {
    for (const error of result.errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log(`Verified ${result.summary.subjects} canonical illustrations `
      + `(${result.summary.staged_canonical_bytes} staged bytes; ${result.summary.approved} approved).`);
  }
}
