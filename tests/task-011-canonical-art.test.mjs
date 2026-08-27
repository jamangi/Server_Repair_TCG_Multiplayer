import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  createArtResolver,
  validateArtManifest,
} from "../viewer/js/play/art-resolver.mjs";
import { verifyTask011Art } from "../viewer/scripts/verify-task-011-art.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const readJson = (relativePath) => JSON.parse(
  fs.readFileSync(path.join(ROOT, relativePath), "utf8"),
);
const manifest = readJson("viewer/assets/play/assets.json");
const domain = readJson("content/gameplay-v1/domain-snapshot-v2.json").entities;
const cards = readJson("content/gameplay-v1/card-catalog-v3.json").cards;
const inventory = readJson("docs/art/task-011-illustration-inventory.json");
const domainById = new Map(domain.map((entity) => [entity.id, entity]));
const resolver = createArtResolver({
  manifest,
  manifestUrl: new URL("https://example.invalid/viewer/assets/play/assets.json"),
  domainEntities: domain,
});

test("TASK-011 verifies all 104 reviewed canonical files, masters, provenance, and byte budgets", () => {
  const result = verifyTask011Art();
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.summary.counts, {
    test: 37,
    command: 13,
    repair: 12,
    verify: 9,
    symptom: 33,
  });
  assert.equal(result.summary.subjects, 104);
  assert.equal(result.summary.approved, 104);
  assert.ok(result.summary.staged_canonical_bytes < 30 * 1024 * 1024);
});

test("all 71 Card Definitions inherit one unique canonical primary-domain illustration", () => {
  assert.equal(cards.length, 71);
  assert.equal(new Set(cards.map((card) => card.primary_domain_reference.entity_id)).size, 71);

  for (const card of cards) {
    const primary = domainById.get(card.primary_domain_reference.entity_id);
    const resolved = resolver.resolveCardArt(card);
    assert.equal(card.primary_domain_reference.inherit_illustration, true, card.id);
    assert.equal(card.presentation.illustration, undefined, card.id);
    assert.equal(resolved.assetId, primary.presentation.illustration.asset_id, card.id);
    assert.equal(resolved.alt, primary.presentation.illustration.alt_text, card.id);
    assert.equal(resolved.kind, "canonical", card.id);
    assert.equal(resolved.isPlaceholder, false, card.id);
    assert.equal(resolved.source, "domain", card.id);
  }
});

test("all 33 public Symptoms resolve canonical panoramic art", () => {
  const symptoms = inventory.subjects.filter((subject) => subject.family === "symptom");
  assert.equal(symptoms.length, 33);
  for (const subject of symptoms) {
    const resolved = resolver.resolveEntityArt(subject.domain_id);
    assert.equal(resolved.assetId, subject.asset_id, subject.domain_id);
    assert.equal(resolved.kind, "canonical", subject.domain_id);
    assert.equal(resolved.category, "symptom", subject.domain_id);
    assert.equal(resolved.isPlaceholder, false, subject.domain_id);
  }
});

test("Ticket art inherits the first public Symptom and ignores hidden Fault state", () => {
  const visibleSymptomIds = [
    "symptom.storage.drive_missing",
    "symptom.storage.io_errors",
  ];
  const baseTicket = {
    id: "ticket.generated.fixture",
    presentation: { display_name: "Generated repair ticket" },
    visible_symptom_ids: visibleSymptomIds,
  };
  const first = resolver.resolveTicketArt({
    ...baseTicket,
    hidden_fault_definition_id: "fault.storage.cable",
    evidence_dispositions: { "test.storage.device_inventory": "SUPPORTS" },
  });
  const second = resolver.resolveTicketArt({
    ...baseTicket,
    hidden_fault_definition_id: "fault.storage.drive",
    future_machine_state: "repaired",
  });
  const symptom = domainById.get(visibleSymptomIds[0]);

  assert.deepEqual(first, second);
  assert.equal(first.assetId, symptom.presentation.illustration.asset_id);
  assert.equal(first.source, "public-symptom");
  assert.equal(first.alt, symptom.presentation.illustration.alt_text);
  assert.doesNotMatch(JSON.stringify(first), /fault\.storage|SUPPORTS|repaired/i);
});

test("direct Ticket art takes precedence while deliberate missing art falls back safely", () => {
  const direct = resolver.resolveTicketArt({
    presentation: {
      display_name: "Direct-art fixture",
      illustration: {
        asset_id: "art.symptom.network.no_link",
        alt_text: "Direct public network observation.",
      },
    },
    visible_symptom_ids: ["symptom.storage.drive_missing"],
  });
  const missing = resolver.resolveTicketArt({
    presentation: { display_name: "Missing-art fixture" },
    visible_symptom_ids: ["symptom.fixture.unpublished"],
  });

  assert.equal(direct.source, "ticket");
  assert.equal(direct.assetId, "art.symptom.network.no_link");
  assert.equal(direct.alt, "Direct public network observation.");
  assert.equal(missing.source, "ticket-placeholder");
  assert.equal(missing.isPlaceholder, true);
  assert.match(missing.src, /placeholders\/ticket-storage\.svg$/);
});

test("raster path validation permits the explicit safe set and rejects traversal or code", () => {
  for (const src of [
    "canonical/example.avif",
    "canonical/example.png",
    "canonical/example.svg",
    "canonical/example.webp",
  ]) {
    const candidate = structuredClone(manifest);
    candidate.assets["art.test.safe_extension"] = {
      src,
      kind: "canonical",
      category: "test",
      alt_text: "Safe extension fixture.",
    };
    assert.doesNotThrow(() => validateArtManifest(candidate));
  }

  for (const src of [
    "../secret.webp",
    "canonical/../../secret.webp",
    "canonical/script.js",
    "canonical/payload.exe",
    "https://example.invalid/image.webp",
    "canonical/image.webp?cache=1",
  ]) {
    const candidate = structuredClone(manifest);
    candidate.assets["art.test.unsafe_path"] = {
      src,
      kind: "canonical",
      category: "test",
      alt_text: "Unsafe path fixture.",
    };
    assert.throws(() => validateArtManifest(candidate), /unsafe or unsupported path/);
  }
});
