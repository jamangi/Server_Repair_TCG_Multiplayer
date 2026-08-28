#!/usr/bin/env python3
"""Build TASK-030 Story Mode delivery art, manifests, provenance, and contact sheets.

The committed PNG files in ``art_sources/task-030/masters`` are the reviewed
generation masters.  This script is the only writer for the optimized Story
asset tree and its derived audit records.
"""

from __future__ import annotations

import hashlib
import io
import json
import math
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
MASTER_ROOT = ROOT / "art_sources" / "task-030" / "masters"
DELIVERY_ROOT = ROOT / "viewer" / "assets" / "story"
CONTACT_ROOT = ROOT / "docs" / "art" / "task-030-contact-sheets"
REGISTRY_PATH = ROOT / "content" / "story-v1" / "campaigns" / "quiet-cascade" / "registry.json"
TEXT_PATH = ROOT / "content" / "story-v1" / "campaigns" / "quiet-cascade" / "texts" / "en.json"
INVENTORY_PATH = ROOT / "docs" / "art" / "task-030-story-art-inventory.json"
LEDGER_PATH = ROOT / "art_sources" / "task-030" / "generation-log.json"

CAMPAIGN_ID = "story.campaign.quiet_cascade.v1"
BUILD_DATE = "2026-08-27"
TOOL_NAME = "OpenAI built-in image generation"
MANIFEST_VERSION = "story-art-v1"
INVENTORY_VERSION = "task-030-story-art-inventory-v1"
LEDGER_VERSION = "task-030-story-art-provenance-v1"
CHARACTER_NORMALIZATION_VERSION = "character-presentation-normalization-v1"
ALPHA_VISIBILITY_THRESHOLD = 8
CHARACTER_PORTRAIT_BAND_RATIO = 0.40
CHARACTER_SCALE_NOOP_TOLERANCE = 0.03
CHARACTER_SCALE_LIMITS = (0.75, 1.50)

CHARACTER_REFERENCE_ASSETS = {
    "ev_shaw": "story.asset.character.ev_shaw.focused",
    "inez_calder": "story.asset.character.inez_calder.focused",
    "malik_okoye": "story.asset.character.malik_okoye.focused",
    "sora_chen": "story.asset.character.sora_chen.focused",
    "hana_park": "story.asset.character.hana_park.skeptical",
    "jonah_reed": "story.asset.character.jonah_reed.thoughtful",
    "priya_nayar": "story.asset.character.priya_nayar.concerned",
}

REFERENCE_PATHS = [
    "docs/ui-plan/ui-reference_images/story-mode-choice-dialogue-reference.png",
    "docs/ui-plan/ui-reference_images/story-mode-background-repair-floor-reference.png",
    "docs/ui-plan/ui-reference_images/story-mode-background-inflow-dock-reference.png",
    "docs/ui-plan/ui-reference_images/story-mode-character-ensemble-a-reference.png",
    "docs/ui-plan/ui-reference_images/story-mode-dialogue-inflow-reference.png",
    "docs/ui-plan/ui-reference_images/story-mode-character-ensemble-b-reference.png",
]

SHARED_ART_DIRECTION = (
    "Original static 2D art for Server Repair TCG Story Mode, painterly realism with visible "
    "brush texture, grounded enterprise server-service practice, graphite and earth neutrals, "
    "restrained cool rack light and warm service lamps, strong value grouping, and human stakes. "
    "No named-artist imitation, brands, logos, readable or pseudo text, magical interfaces, "
    "hidden gameplay answers, unsafe handling, photorealism, anime, or generic cyberpunk neon."
)

BACKGROUND_PROMPT = (
    SHARED_ART_DIRECTION
    + " Wide cinematic environmental painting with a dialogue-safe dark lower third, centered "
      "portrait-mobile crop, practical equipment, clear depth, and no people or rasterized UI. "
)
CHARACTER_PROMPT = (
    SHARED_ART_DIRECTION
    + " Full-height isolated character portrait on true transparent alpha, feet visible, subtle "
      "three-quarter stance, consistent grounded semi-realistic face, practical role-specific "
      "workwear, empty hands unless a safe role prop is specified, no background or cast shadow. "
)
INSERT_PROMPT = (
    SHARED_ART_DIRECTION
    + " Text-free technical still-life insert on true transparent alpha. Use blank geometric "
      "marks and colored shapes only; the accessible HTML layer carries every exact fact. "
)

GENERATION_REFERENCES = {
    "story.bg.trinity.inflow.predawn_storm": "exec-f907c69f-7441-4c07-abde-6487204b0ab0",
    "story.bg.trinity.core_floor.night_storm": "exec-208ccb02-361b-43f5-9663-0d70b0ab3934",
    "story.bg.trinity.trace.night": "exec-2431a0af-42ab-4793-b19e-858c44c50a4c",
    "story.bg.trinity.validation_gate.predawn": "exec-8249529a-5d31-44ba-89f0-efdd4c5fd52f",
    "story.bg.trinity.knowledge_systems.night": "exec-f3425f4a-78c0-41eb-b5b6-bfde352ad647",
    "story.bg.trinity.client_review.dawn": "exec-f2375680-d6ca-45ca-90f2-76d73985188e",
    "story.asset.character.ev_shaw.focused": "exec-def021c0-9a0a-4e2a-a0ce-8f97790e2107",
    "story.asset.character.ev_shaw.concerned": "exec-ca841123-7ac2-4345-a751-5764f9a62da6",
    "story.asset.character.inez_calder.focused": "exec-4478edb6-fe1f-44d7-af33-3ebac40e5968",
    "story.asset.character.inez_calder.amused": "exec-7909a32d-7a02-4abe-ba63-2839a49fbf75",
    "story.asset.character.malik_okoye.focused": "exec-e2fe75b8-4ed6-432b-b337-6492979f885a",
    "story.asset.character.malik_okoye.defensive": "exec-4f448237-3bb6-43b7-8b8e-4a9cb40d6d43",
    "story.asset.character.sora_chen.focused": "exec-a5c00e4c-16b8-4de9-9bd9-0ed7f64a147c",
    "story.asset.character.sora_chen.approving": "exec-94cfd104-3319-41cf-970c-a7ab9461a6dc",
    "story.asset.character.hana_park.skeptical": "exec-ac451eae-d397-445e-b40b-21220fc9ee47",
    "story.asset.character.hana_park.relief": "exec-749a3e23-6ae3-41b2-b5f9-633e98c8fa17",
    "story.asset.character.jonah_reed.thoughtful": "exec-0b767cf1-b2ff-4786-b512-2abc0d253b0b",
    "story.asset.character.jonah_reed.defensive": "exec-de8997bf-9900-4fa7-a719-f653b6105bac",
    "story.asset.character.priya_nayar.concerned": "exec-5dd59b45-3b07-4daa-8e5d-28bb4ca2badc",
    "story.asset.character.priya_nayar.resolved": "exec-f4eae652-dd8b-48e6-bcd2-dba5ef2201c3",
    "story.insert.qc01.repeat_serial_history": "exec-8239052e-8516-43d2-a2d7-bf475b9e6eaf",
    "story.insert.qc01.sift_provenance_gap": "exec-79c4c0a7-ba31-4735-88da-8d6c63f4731c",
    "story.insert.qc01.final_incident_queue": "exec-fac6284b-f130-4959-ad51-6bad13451d3b",
    "story.fallback.background": "exec-9d4bfd44-fc5a-46a0-958a-e3a7127295b4",
    "story.fallback.character": "exec-cae0feae-ee9f-4d62-a305-19811666ab9a",
    "story.fallback.transient": "exec-a81e8752-22a5-4300-a0ed-c6846ea2742f",
}

# Some expression edits were returned with an unintended opaque matte.  They
# were passed back through the same image workflow for background removal only;
# both the expression-generation reference above and final cleanup reference
# are retained so a future coherent revision can start from either stage.
FINAL_CLEANUP_REFERENCES = {
    "story.asset.character.ev_shaw.concerned": "exec-fbb47264-db28-42e7-8766-ad30f816231a",
    "story.asset.character.inez_calder.amused": "exec-217625d9-b8ee-457a-b98e-fe8228100403",
    "story.asset.character.malik_okoye.defensive": "exec-e1656734-2c8b-4458-a175-59b8ef2ff2b1",
    "story.asset.character.sora_chen.approving": "exec-208fe211-e0aa-4d5c-ab60-e22b6e2910f3",
    "story.asset.character.hana_park.relief": "exec-bc4b2223-8d6d-4c1d-8fdc-65a8e5d17907",
    "story.asset.character.jonah_reed.defensive": "exec-603c8b34-ec5e-4215-9d49-b52c24e33e1d",
    "story.asset.character.priya_nayar.resolved": "exec-7fe3d3cc-1b1b-41f0-b84c-f84967c40010",
}


def asset(
    asset_id: str,
    layer: str,
    master: str,
    brief: str,
    *,
    focal: tuple[float, float] = (0.5, 0.4),
    fallback: str | None = None,
    kind: str = "production",
    labels: list[str] | None = None,
    edit_history: list[str] | None = None,
) -> dict[str, Any]:
    return {
        "asset_id": asset_id,
        "layer": layer,
        "master": master,
        "brief": brief,
        "focal": focal,
        "fallback": fallback,
        "kind": kind,
        "labels": labels or [],
        "edit_history": edit_history or ["Generated as an original master; no source pixels copied."],
    }


ASSETS = [
    asset("story.bg.trinity.inflow.predawn_storm", "BACKGROUND", "backgrounds/story-bg-trinity-inflow-predawn-storm.png", "The wet Trinity Inflow receiving dock before sunrise: return cages, amber dock lamps, cold storm light, and operational scale.", focal=(0.55, 0.38), fallback="story.fallback.background", labels=["chapter-01", "inflow", "predawn"]),
    asset("story.bg.trinity.core_floor.night_storm", "BACKGROUND", "backgrounds/story-bg-trinity-bench-storm.png", "A wide reconfigurable Core Floor at night spanning First Look, Rigline, and Bench: instrumented rack, safely opened chassis, antistatic work surface, and storm windows.", focal=(0.53, 0.38), fallback="story.fallback.background", labels=["chapters-01-04", "core-floor", "night"]),
    asset("story.bg.trinity.trace.night", "BACKGROUND", "backgrounds/story-bg-trinity-trace-night.png", "Trace analysis bench at night with oscilloscope, small paper fault tree, safe handling, warm task lamp, and cool rack spill.", focal=(0.50, 0.39), fallback="story.fallback.background", labels=["chapter-02", "trace", "night"], edit_history=["Generated as an original master.", "Edited only the authored master to remove generator-made pseudo-writing from the paper while retaining blank analytical marks."]),
    asset("story.bg.trinity.validation_gate.predawn", "BACKGROUND", "backgrounds/story-bg-trinity-validation-gate-predawn.png", "Lived-in Validation Gate before dawn: unit identity station and visibly distinct but text-free hold and release materials.", focal=(0.52, 0.38), fallback="story.fallback.background", labels=["chapters-02-04", "validation-gate", "predawn"]),
    asset("story.bg.trinity.knowledge_systems.night", "BACKGROUND", "backgrounds/story-bg-trinity-knowledge-systems-night.png", "Knowledge Systems desk at night with an attributable source-history display made only from restrained blank timeline blocks.", focal=(0.52, 0.36), fallback="story.fallback.background", labels=["chapter-03", "knowledge-systems", "night"], edit_history=["Generated as an original master.", "Edited only the authored master to replace pseudo-writing with blank geometric source blocks."]),
    asset("story.bg.trinity.client_review.dawn", "BACKGROUND", "backgrounds/story-bg-trinity-client-review-dawn.png", "Modest operational client-review room at dawn with a physical lot summary and quiet practical furniture.", focal=(0.50, 0.38), fallback="story.fallback.background", labels=["chapter-04", "client-review", "dawn"]),
    asset("story.asset.character.ev_shaw.focused", "CHARACTER", "characters/story-character-ev-shaw-focused.png", "Ev Shaw, compact and observant, focused in a charcoal floor jacket with teal seam accents.", fallback="story.fallback.character", labels=["ev-shaw", "focused"]),
    asset("story.asset.character.ev_shaw.concerned", "CHARACTER", "characters/story-character-ev-shaw-concerned.png", "Identity-preserving Ev Shaw variant: listening with visible concern and withholding judgment.", fallback="story.fallback.character", labels=["ev-shaw", "concerned"], edit_history=["Generated from the approved Ev Shaw focused master using an identity-preserving expression edit."]),
    asset("story.asset.character.inez_calder.focused", "CHARACTER", "characters/story-character-inez-calder-focused.png", "Inez Calder, experienced Inflow lead, focused in restrained rust workwear while holding a dock scanner safely.", fallback="story.fallback.character", labels=["inez-calder", "focused"]),
    asset("story.asset.character.inez_calder.amused", "CHARACTER", "characters/story-character-inez-calder-amused.png", "Identity-preserving Inez Calder variant with a dry, knowing smile and the same dock scanner and workwear.", fallback="story.fallback.character", labels=["inez-calder", "amused"], edit_history=["Generated from the approved Inez Calder focused master using an identity-preserving expression edit."]),
    asset("story.asset.character.malik_okoye.focused", "CHARACTER", "characters/story-character-malik-okoye-focused.png", "Malik Okoye, Rigline specialist, focused beside a compact labeled-but-text-free test harness in indigo workwear.", fallback="story.fallback.character", labels=["malik-okoye", "focused"]),
    asset("story.asset.character.malik_okoye.defensive", "CHARACTER", "characters/story-character-malik-okoye-defensive.png", "Identity-preserving Malik Okoye variant with folded arms and a guarded stance, no equipment misuse.", fallback="story.fallback.character", labels=["malik-okoye", "defensive"], edit_history=["Generated from the approved Malik Okoye focused master using an identity-preserving expression and stance edit."]),
    asset("story.asset.character.sora_chen.focused", "CHARACTER", "characters/story-character-sora-chen-focused.png", "Sora Chen, Trace diagnostician, studying a small text-free fault tree notebook in olive and charcoal workwear.", fallback="story.fallback.character", labels=["sora-chen", "focused"]),
    asset("story.asset.character.sora_chen.approving", "CHARACTER", "characters/story-character-sora-chen-approving.png", "Identity-preserving Sora Chen variant closing the notebook with restrained approval.", fallback="story.fallback.character", labels=["sora-chen", "approving"], edit_history=["Generated from the approved Sora Chen focused master using an identity-preserving expression edit."]),
    asset("story.asset.character.hana_park.skeptical", "CHARACTER", "characters/story-character-hana-park-skeptical.png", "Hana Park, exact Validation Gate reviewer, holding a blank traveler with a skeptical expression in light neutral quality workwear.", fallback="story.fallback.character", labels=["hana-park", "skeptical"]),
    asset("story.asset.character.hana_park.relief", "CHARACTER", "characters/story-character-hana-park-relief.png", "Identity-preserving Hana Park variant clipping a blank release record into place with quiet relief.", fallback="story.fallback.character", labels=["hana-park", "relief"], edit_history=["Generated from the approved Hana Park skeptical master using an identity-preserving expression and hand-action edit."]),
    asset("story.asset.character.jonah_reed.thoughtful", "CHARACTER", "characters/story-character-jonah-reed-thoughtful.png", "Jonah Reed, Knowledge Systems steward, thoughtfully studying a small text-free source timeline board in brown and slate workwear.", fallback="story.fallback.character", labels=["jonah-reed", "thoughtful"]),
    asset("story.asset.character.jonah_reed.defensive", "CHARACTER", "characters/story-character-jonah-reed-defensive.png", "Identity-preserving Jonah Reed variant guarded but attentive beside the same source timeline board.", fallback="story.fallback.character", labels=["jonah-reed", "defensive"], edit_history=["Generated from the approved Jonah Reed thoughtful master using an identity-preserving expression and stance edit."]),
    asset("story.asset.character.priya_nayar.concerned", "CHARACTER", "characters/story-character-priya-nayar-concerned.png", "Priya Nayar, practical client-program lead, reviewing a blank lot brief with steady concern in deep teal business-casual workwear.", fallback="story.fallback.character", labels=["priya-nayar", "concerned"]),
    asset("story.asset.character.priya_nayar.resolved", "CHARACTER", "characters/story-character-priya-nayar-resolved.png", "Identity-preserving Priya Nayar variant holding the completed blank brief with a resolved, steady expression.", fallback="story.fallback.character", labels=["priya-nayar", "resolved"], edit_history=["Generated from the approved Priya Nayar concerned master using an identity-preserving expression edit."]),
    asset("story.insert.qc01.repeat_serial_history", "TRANSIENT", "inserts/story-insert-qc01-repeat-serial-history.png", "A blank serial-history still life: two layered service records, one recurring unit marker, and a prior green verify mark without legible text.", fallback="story.fallback.transient", labels=["chapter-01", "repeat-serial-history"]),
    asset("story.insert.qc01.sift_provenance_gap", "TRANSIENT", "inserts/story-insert-qc01-sift-provenance-gap.png", "A blank source-coverage board that separates recorded results, unpublished output, missing context, and confidence using geometric groups only.", fallback="story.fallback.transient", labels=["chapter-03", "sift-provenance-gap"]),
    asset("story.insert.qc01.final_incident_queue", "TRANSIENT", "inserts/story-insert-qc01-final-incident-queue.png", "A three-Ticket physical incident board with three distinct blank server tiles and symptom pictograms that never reveal causes.", fallback="story.fallback.transient", labels=["chapter-04", "final-incident-queue"]),
    asset("story.fallback.background", "BACKGROUND", "fallbacks/story-fallback-background.png", "Neutral Trinity repair-floor establishing painting used only when a registered background derivative cannot load.", kind="fallback", labels=["fallback", "background"]),
    asset("story.fallback.character", "CHARACTER", "fallbacks/story-fallback-character.png", "Anonymous grounded technician silhouette on transparent alpha, with no canonical identity or story fact.", kind="fallback", labels=["fallback", "character"]),
    asset("story.fallback.transient", "TRANSIENT", "fallbacks/story-fallback-transient.png", "Blank layered evidence-board shape on transparent alpha, carrying no story fact or gameplay answer.", kind="fallback", labels=["fallback", "transient"]),
]


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def slug(asset_id: str) -> str:
    return asset_id.replace("story.asset.character.", "").replace("story.bg.", "").replace("story.insert.", "").replace("story.fallback.", "fallback-").replace("_", "-").replace(".", "-")


def crop_box_for_size(
    source_size: tuple[int, int],
    size: tuple[int, int],
    focal: tuple[float, float],
) -> tuple[int, int, int, int]:
    width, height = source_size
    target_ratio = size[0] / size[1]
    source_ratio = width / height
    if source_ratio > target_ratio:
        crop_width = int(round(height * target_ratio))
        left = int(round(width * focal[0] - crop_width / 2))
        left = max(0, min(left, width - crop_width))
        return (left, 0, left + crop_width, height)
    crop_height = int(round(width / target_ratio))
    top = int(round(height * focal[1] - crop_height / 2))
    top = max(0, min(top, height - crop_height))
    return (0, top, width, top + crop_height)


def crop_to_size(image: Image.Image, size: tuple[int, int], focal: tuple[float, float]) -> Image.Image:
    width, height = image.size
    box = crop_box_for_size((width, height), size, focal)
    return image.crop(box).resize(size, Image.Resampling.LANCZOS)


def contain_to_size(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    source = image.convert("RGBA")
    source.thumbnail(size, Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    canvas.alpha_composite(source, ((size[0] - source.width) // 2, (size[1] - source.height) // 2))
    return canvas


def alpha_bounds(image: Image.Image) -> tuple[int, int, int, int]:
    """Return the visible-alpha bounds, ignoring near-transparent edge noise."""
    alpha = image.convert("RGBA").getchannel("A")
    visible = alpha.point(lambda value: 255 if value >= ALPHA_VISIBILITY_THRESHOLD else 0)
    bounds = visible.getbbox()
    if bounds is None:
        raise RuntimeError("Transparent Story art has no visible alpha content")
    return bounds


def portrait_band_bounds(
    image: Image.Image,
    full_bounds: tuple[int, int, int, int] | None = None,
) -> tuple[int, int, int, int]:
    full_bounds = full_bounds or alpha_bounds(image)
    _, top, _, bottom = full_bounds
    band_bottom = min(image.height, top + math.ceil((bottom - top) * CHARACTER_PORTRAIT_BAND_RATIO))
    alpha = image.convert("RGBA").getchannel("A")
    visible = alpha.point(lambda value: 255 if value >= ALPHA_VISIBILITY_THRESHOLD else 0)
    band = visible.crop((0, top, image.width, band_bottom)).getbbox()
    if band is None:
        raise RuntimeError("Character portrait band has no visible alpha content")
    return (band[0], band[1] + top, band[2], band[3] + top)


def visible_alpha_pixels(image: Image.Image) -> int:
    histogram = image.convert("RGBA").getchannel("A").histogram()
    return sum(histogram[ALPHA_VISIBILITY_THRESHOLD:])


def bounds_record(bounds: tuple[int, int, int, int]) -> dict[str, int]:
    left, top, right, bottom = bounds
    return {
        "x": left,
        "y": top,
        "width": right - left,
        "height": bottom - top,
    }


def character_identity(asset_id: str) -> str:
    return asset_id.split(".")[-2]


def build_character_normalization() -> dict[str, dict[str, Any]]:
    """Describe one shared delivery scale/alignment target per character.

    Several expression masters use a three-quarter composition while their
    partner uses a full-body composition. Matching the visible width in the
    upper 40% portrait band preserves head scale without letting an extended
    arm, prop, or full-body stance dominate the measurement. The transform is
    presentation-only and never changes the reviewed masters.
    """
    grouped: dict[str, list[dict[str, Any]]] = {}
    for record in ASSETS:
        if record["layer"] != "CHARACTER" or record["kind"] != "production":
            continue
        master_path = MASTER_ROOT / record["master"]
        with Image.open(master_path) as source:
            image = source.convert("RGBA")
            bounds = alpha_bounds(image)
            grouped.setdefault(character_identity(record["asset_id"]), []).append({
                "asset_id": record["asset_id"],
                "source_size": image.size,
                "source_bounds": bounds,
                "portrait_bounds": portrait_band_bounds(image, bounds),
                "visible_alpha_pixels": visible_alpha_pixels(image),
            })

    profiles: dict[str, dict[str, Any]] = {}
    for identity, entries in grouped.items():
        reference_asset_id = CHARACTER_REFERENCE_ASSETS.get(identity)
        reference = next((entry for entry in entries if entry["asset_id"] == reference_asset_id), None)
        if reference is None:
            raise RuntimeError(f"No approved presentation reference is configured for {identity}")
        reference_band_width = reference["portrait_bounds"][2] - reference["portrait_bounds"][0]
        reference_band_center = (reference["portrait_bounds"][0] + reference["portrait_bounds"][2]) / 2
        for entry in entries:
            source_band_width = entry["portrait_bounds"][2] - entry["portrait_bounds"][0]
            measured_scale = reference_band_width / source_band_width
            if not CHARACTER_SCALE_LIMITS[0] <= measured_scale <= CHARACTER_SCALE_LIMITS[1]:
                raise RuntimeError(
                    f"{entry['asset_id']} presentation scale {measured_scale:.4f} is outside "
                    f"the reviewed {CHARACTER_SCALE_LIMITS[0]:.2f}-{CHARACTER_SCALE_LIMITS[1]:.2f} range"
                )
            applied_scale = 1.0 if abs(measured_scale - 1.0) <= CHARACTER_SCALE_NOOP_TOLERANCE else measured_scale
            predicted_area_ratio = (
                entry["visible_alpha_pixels"] * applied_scale * applied_scale
                / reference["visible_alpha_pixels"]
            )
            if not 0.90 <= predicted_area_ratio <= 1.10:
                raise RuntimeError(
                    f"{entry['asset_id']} normalized foreground area {predicted_area_ratio:.4f} "
                    "is outside the reviewed 0.90-1.10 range"
                )
            profiles[entry["asset_id"]] = {
                "version": CHARACTER_NORMALIZATION_VERSION,
                "identity": identity,
                "reference_asset_id": reference_asset_id,
                "alpha_visibility_threshold": ALPHA_VISIBILITY_THRESHOLD,
                "portrait_band_ratio": CHARACTER_PORTRAIT_BAND_RATIO,
                "source_size": entry["source_size"],
                "source_bounds": entry["source_bounds"],
                "source_portrait_bounds": entry["portrait_bounds"],
                "reference_bounds": reference["source_bounds"],
                "reference_portrait_bounds": reference["portrait_bounds"],
                "reference_portrait_center_x": reference_band_center,
                "measured_scale": measured_scale,
                "applied_scale": applied_scale,
                "applied": applied_scale != 1.0,
                "predicted_area_ratio": predicted_area_ratio,
            }
    return profiles


def normalize_character_presentation(image: Image.Image, profile: dict[str, Any]) -> Image.Image:
    source = image.convert("RGBA")
    scale = profile["applied_scale"]
    if scale == 1.0:
        return source.copy()
    rendered = source.resize(
        (max(1, round(source.width * scale)), max(1, round(source.height * scale))),
        Image.Resampling.LANCZOS,
    )
    source_band = profile["source_portrait_bounds"]
    source_band_center = (source_band[0] + source_band[2]) / 2
    left = round(profile["reference_portrait_center_x"] - source_band_center * scale)
    top = round(profile["reference_bounds"][1] - profile["source_bounds"][1] * scale)
    canvas = Image.new("RGBA", source.size, (0, 0, 0, 0))
    canvas.alpha_composite(rendered, (left, top))
    return canvas


def delivery_portrait_anchor_bounds(
    image: Image.Image,
    profile: dict[str, Any],
) -> tuple[int, int, int, int]:
    """Measure the exact source portrait band after its delivery transform."""
    source_width, source_height = profile["source_size"]
    crop_left, crop_top, crop_right, crop_bottom = crop_box_for_size(
        (source_width, source_height), image.size, (0.5, 0.5)
    )
    scale = profile["applied_scale"]
    translation_top = profile["reference_bounds"][1] - profile["source_bounds"][1] * scale
    source_band = profile["source_portrait_bounds"]
    band_top = translation_top + source_band[1] * scale
    band_bottom = translation_top + source_band[3] * scale
    top = max(0, math.floor((band_top - crop_top) * image.height / (crop_bottom - crop_top)))
    bottom = min(image.height, math.ceil((band_bottom - crop_top) * image.height / (crop_bottom - crop_top)))
    alpha = image.convert("RGBA").getchannel("A")
    visible = alpha.point(lambda value: 255 if value >= ALPHA_VISIBILITY_THRESHOLD else 0)
    band = visible.crop((0, top, image.width, bottom)).getbbox()
    if band is None:
        raise RuntimeError("Character delivery portrait anchor has no visible alpha content")
    return (band[0], band[1] + top, band[2], band[3] + top)


def presentation_transform_record(profile: dict[str, Any]) -> dict[str, Any]:
    return {
        "version": profile["version"],
        "reference_asset_id": profile["reference_asset_id"],
        "alpha_visibility_threshold": profile["alpha_visibility_threshold"],
        "portrait_band_ratio": profile["portrait_band_ratio"],
        "source_canvas": {"width": profile["source_size"][0], "height": profile["source_size"][1]},
        "source_full_alpha_bounds": bounds_record(profile["source_bounds"]),
        "source_portrait_band_bounds": bounds_record(profile["source_portrait_bounds"]),
        "reference_full_alpha_bounds": bounds_record(profile["reference_bounds"]),
        "reference_portrait_band_bounds": bounds_record(profile["reference_portrait_bounds"]),
        "measured_scale": round(profile["measured_scale"], 6),
        "applied_scale": round(profile["applied_scale"], 6),
        "predicted_unclipped_area_ratio": round(profile["predicted_area_ratio"], 6),
        "top_anchor": profile["reference_bounds"][1],
        "portrait_center_x_anchor": round(profile["reference_portrait_center_x"], 3),
        "applied": profile["applied"],
        "transform_date": BUILD_DATE,
    }


def derivative_specs(layer: str) -> dict[str, tuple[tuple[int, int], int]]:
    if layer == "BACKGROUND":
        return {
            "desktop": ((1600, 900), 460_000),
            "mobile": ((720, 960), 320_000),
            "reduced_data": ((960, 540), 210_000),
        }
    if layer == "CHARACTER":
        return {
            "desktop": ((640, 960), 280_000),
            "mobile": ((426, 640), 180_000),
            "reduced_data": ((320, 480), 120_000),
        }
    return {
        "desktop": ((1200, 800), 280_000),
        "mobile": ((720, 720), 200_000),
        "reduced_data": ((600, 400), 140_000),
    }


def encode_webp(image: Image.Image, output: Path, budget: int) -> tuple[int, int]:
    output.parent.mkdir(parents=True, exist_ok=True)
    chosen: bytes | None = None
    chosen_quality = 0
    for quality in range(86, 49, -3):
        buffer = io.BytesIO()
        image.save(buffer, "WEBP", quality=quality, method=6, exact=True)
        payload = buffer.getvalue()
        chosen = payload
        chosen_quality = quality
        if len(payload) <= budget:
            break
    if chosen is None or len(chosen) > budget:
        raise RuntimeError(f"Could not encode {output} within {budget} bytes")
    output.write_bytes(chosen)
    return len(chosen), chosen_quality


def prompt_for(record: dict[str, Any]) -> str:
    prefix = {"BACKGROUND": BACKGROUND_PROMPT, "CHARACTER": CHARACTER_PROMPT, "TRANSIENT": INSERT_PROMPT}[record["layer"]]
    return prefix + "Subject brief: " + record["brief"]


def contact_sheet(path: Path, entries: list[tuple[str, Path]], *, columns: int, cell: tuple[int, int]) -> None:
    if not entries:
        return
    font = ImageFont.load_default()
    caption_height = 44
    rows = (len(entries) + columns - 1) // columns
    sheet = Image.new("RGB", (columns * cell[0], rows * (cell[1] + caption_height)), (23, 27, 31))
    draw = ImageDraw.Draw(sheet)
    for index, (label, source_path) in enumerate(entries):
        row, column = divmod(index, columns)
        left = column * cell[0]
        top = row * (cell[1] + caption_height)
        with Image.open(source_path) as source:
            preview = ImageOps.contain(source.convert("RGBA"), cell, Image.Resampling.LANCZOS)
        tile = Image.new("RGBA", cell, (38, 44, 50, 255))
        tile.alpha_composite(preview, ((cell[0] - preview.width) // 2, (cell[1] - preview.height) // 2))
        sheet.paste(tile.convert("RGB"), (left, top))
        wrapped = label if len(label) <= 38 else label[:35] + "..."
        draw.text((left + 8, top + cell[1] + 9), wrapped, fill=(232, 237, 239), font=font)
    path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(path, "JPEG", quality=88, optimize=True, progressive=True)


def validate_character_presentations(inventory_assets: list[dict[str, Any]]) -> None:
    characters = [
        item for item in inventory_assets
        if item["layer"] == "CHARACTER" and item["kind"] == "production"
    ]
    by_id = {item["asset_id"]: item for item in characters}
    for item in characters:
        transform = item.get("presentation_transform")
        if not transform:
            raise RuntimeError(f"{item['asset_id']} has no presentation transform audit")
        reference = by_id.get(transform["reference_asset_id"])
        if reference is None:
            raise RuntimeError(f"{item['asset_id']} references an absent presentation pose")
        for variant, derivative in item["derivatives"].items():
            reference_derivative = reference["derivatives"][variant]
            full = derivative["visible_alpha_bounds"]
            band = derivative["portrait_anchor_bounds"]
            reference_full = reference_derivative["visible_alpha_bounds"]
            reference_band = reference_derivative["portrait_anchor_bounds"]
            width_ratio = band["width"] / reference_band["width"]
            area_ratio = derivative["visible_alpha_pixels"] / reference_derivative["visible_alpha_pixels"]
            center_x = band["x"] + band["width"] / 2
            reference_center_x = reference_band["x"] + reference_band["width"] / 2
            transform = item["presentation_transform"]
            width_tolerance = 0.03 if not transform["applied"] else 0.02
            top_tolerance = max(
                2,
                round(derivative["height"] * (0.01 if not transform["applied"] else 0.005)),
            )
            center_tolerance = max(
                2,
                round(derivative["width"] * (0.02 if not transform["applied"] else 0.005)),
            )
            bottom_clipped = full["y"] + full["height"] >= derivative["height"]
            reference_bottom_clipped = (
                reference_full["y"] + reference_full["height"] >= reference_derivative["height"]
            )
            failures = []
            if not 1.0 - width_tolerance <= width_ratio <= 1.0 + width_tolerance:
                failures.append(f"portrait width ratio {width_ratio:.3f}")
            if abs(full["y"] - reference_full["y"]) > top_tolerance:
                failures.append("top anchor drift")
            if abs(center_x - reference_center_x) > center_tolerance:
                failures.append("portrait center drift")
            # Full-body partners are intentionally clipped at the same bottom
            # boundary as their three-quarter reference. The unclipped 0.90-
            # 1.10 area invariant is recorded in presentation_transform; a
            # decoded floor of 0.80 catches destructive delivery cropping.
            if not 0.80 <= area_ratio <= 1.10:
                failures.append(f"foreground area ratio {area_ratio:.3f}")
            if full["y"] <= 0 or full["x"] <= 0 or full["x"] + full["width"] >= derivative["width"]:
                failures.append("visible alpha touches a protected top or side edge")
            if bottom_clipped != reference_bottom_clipped:
                failures.append("bottom clipping differs from the reference pose")
            if failures:
                raise RuntimeError(
                    f"{item['asset_id']} {variant} presentation QA failed: {', '.join(failures)}"
                )


def main() -> None:
    registry = read_json(REGISTRY_PATH)
    text_catalog = read_json(TEXT_PATH)["entries"]
    required = {item["asset_id"]: item for item in registry["assets"] if item["required"]}
    production = [item for item in ASSETS if item["kind"] == "production"]
    if set(required) != {item["asset_id"] for item in production}:
        missing = sorted(set(required) - {item["asset_id"] for item in production})
        unused = sorted({item["asset_id"] for item in production} - set(required))
        raise RuntimeError(f"Inventory differs from required registry assets: missing={missing}, unused={unused}")
    expected_masters = {(MASTER_ROOT / item["master"]).resolve() for item in ASSETS}
    actual_masters = {item.resolve() for item in MASTER_ROOT.rglob("*.png")}
    if actual_masters != expected_masters:
        missing = sorted(item.relative_to(ROOT).as_posix() for item in expected_masters - actual_masters)
        unused = sorted(item.relative_to(ROOT).as_posix() for item in actual_masters - expected_masters)
        raise RuntimeError(f"Master set is not finite and exact: missing={missing}, unused={unused}")

    references = []
    for relative in REFERENCE_PATHS:
        source = ROOT / relative
        if not source.is_file():
            raise FileNotFoundError(source)
        references.append({
            "path": relative,
            "sha256": sha256(source),
            "usage": "Project-owned planning reference for composition, lighting, layer hierarchy, and cast cohesion only.",
            "source_pixels_used": False,
        })

    manifest_assets: dict[str, Any] = {}
    inventory_assets: list[dict[str, Any]] = []
    provenance_assets: dict[str, Any] = {}
    total_delivery_bytes = 0
    all_contact_entries: dict[str, list[tuple[str, Path]]] = {"BACKGROUND": [], "CHARACTER": [], "TRANSIENT": []}
    character_groups: dict[str, list[tuple[str, Path]]] = {}
    character_normalization = build_character_normalization()

    for record in ASSETS:
        master_path = MASTER_ROOT / record["master"]
        if not master_path.is_file():
            raise FileNotFoundError(master_path)
        with Image.open(master_path) as source:
            source.load()
            original_mode = source.mode
            master_size = source.size
            source_image = source.convert("RGBA")
        if record["layer"] in {"CHARACTER", "TRANSIENT"} and "A" not in original_mode:
            raise RuntimeError(f"{record['asset_id']} requires transparent alpha")

        category = {
            "BACKGROUND": "backgrounds",
            "CHARACTER": "characters",
            "TRANSIENT": "inserts" if record["kind"] == "production" else "fallbacks",
        }[record["layer"]]
        if record["kind"] == "fallback" and record["layer"] != "TRANSIENT":
            category = "fallbacks"
        outputs: dict[str, Any] = {}
        source_manifest: dict[str, str] = {}
        normalization = character_normalization.get(record["asset_id"])
        presentation_source = (
            normalize_character_presentation(source_image, normalization)
            if normalization else source_image
        )
        for variant, (size, budget) in derivative_specs(record["layer"]).items():
            if record["layer"] == "BACKGROUND":
                rendered = crop_to_size(source_image, size, record["focal"]).convert("RGB")
            elif normalization:
                rendered = crop_to_size(presentation_source, size, (0.5, 0.5))
            elif record["layer"] == "CHARACTER":
                rendered = contain_to_size(source_image, size)
            else:
                rendered = contain_to_size(source_image, size)
            filename = f"{slug(record['asset_id'])}-{variant.replace('_', '-')}.webp"
            output_path = DELIVERY_ROOT / category / filename
            byte_count, quality = encode_webp(rendered, output_path, budget)
            relative_source = output_path.relative_to(DELIVERY_ROOT).as_posix()
            source_manifest[variant] = relative_source
            derivative_record = {
                "path": output_path.relative_to(ROOT).as_posix(),
                "width": size[0],
                "height": size[1],
                "bytes": byte_count,
                "byte_budget": budget,
                "quality": quality,
                "sha256": sha256(output_path),
            }
            if normalization:
                with Image.open(output_path) as delivery:
                    if "A" not in delivery.getbands():
                        raise RuntimeError(f"{record['asset_id']} {variant} derivative lost alpha")
                    decoded_delivery = delivery.convert("RGBA")
                    decoded_delivery.load()
                visible_bounds = alpha_bounds(decoded_delivery)
                derivative_record["visible_alpha_bounds"] = bounds_record(visible_bounds)
                derivative_record["portrait_anchor_bounds"] = bounds_record(
                    delivery_portrait_anchor_bounds(decoded_delivery, normalization)
                )
                derivative_record["visible_alpha_pixels"] = visible_alpha_pixels(decoded_delivery)
            outputs[variant] = derivative_record
            total_delivery_bytes += byte_count

        alt_text = ""
        if record["kind"] == "production":
            alt_text = text_catalog[required[record["asset_id"]]["alt_text_id"]]
        protected_zones = []
        if record["layer"] == "BACKGROUND":
            protected_zones = [
                {"x": 0.0, "y": 0.66, "width": 1.0, "height": 0.34},
                {"x": 0.0, "y": 0.0, "width": 0.30, "height": 0.12},
            ]
        manifest_assets[record["asset_id"]] = {
            "layer": record["layer"],
            "kind": record["kind"],
            "sources": source_manifest,
            "alt_text": alt_text,
            "decorative": record["kind"] == "fallback",
            "fallback_asset_id": record["fallback"],
            "focal_point": {"x": record["focal"][0], "y": record["focal"][1]},
            "protected_zones": protected_zones,
        }
        master_info = {
            "path": master_path.relative_to(ROOT).as_posix(),
            "width": master_size[0],
            "height": master_size[1],
            "bytes": master_path.stat().st_size,
            "sha256": sha256(master_path),
            "alpha_required": record["layer"] in {"CHARACTER", "TRANSIENT"},
        }
        inventory_record = {
            "asset_id": record["asset_id"],
            "layer": record["layer"],
            "kind": record["kind"],
            "master": master_info,
            "derivatives": outputs,
            "focal_point": manifest_assets[record["asset_id"]]["focal_point"],
            "protected_zones": protected_zones,
            "alt_text": alt_text,
            "decorative": record["kind"] == "fallback",
            "labels_and_scenes": record["labels"],
            "fallback_asset_id": record["fallback"],
            "review_state": "approved",
        }
        if normalization:
            inventory_record["presentation_transform"] = presentation_transform_record(normalization)
        inventory_assets.append(inventory_record)
        original_generation_reference = GENERATION_REFERENCES[record["asset_id"]]
        cleanup_generation_reference = FINAL_CLEANUP_REFERENCES.get(record["asset_id"])
        edit_history = list(record["edit_history"])
        if cleanup_generation_reference:
            edit_history.append(
                "Removed only the unintended opaque backdrop in a transparent-alpha cleanup edit "
                f"({cleanup_generation_reference})."
            )
        provenance_assets[record["asset_id"]] = {
            "brief": record["brief"],
            "prompt": prompt_for(record),
            "tool_or_artist": TOOL_NAME,
            "date": BUILD_DATE,
            "generation_reference": cleanup_generation_reference or original_generation_reference,
            "source_generation_references": (
                [original_generation_reference] if cleanup_generation_reference else []
            ),
            "source_inputs": REFERENCE_PATHS,
            "source_pixels_used": False,
            "edit_history": edit_history,
            "master": master_info,
            "derivatives": outputs,
            "intended_labels_and_scenes": record["labels"],
            "review_state": "approved",
            "review_notes": [
                "Reviewed for identity continuity, text-free composition, technical safety, crop survival, overlay clearance, and absence of hidden gameplay answers.",
                "Approved for TASK-030 candidate-campaign integration; STORY-007 remains the owner-facing canon package decision.",
            ],
            "approval": {
                "status": "approved",
                "scope": "TASK-030 production integration",
                "date": BUILD_DATE,
            },
        }
        if normalization:
            provenance_assets[record["asset_id"]]["presentation_transform"] = (
                presentation_transform_record(normalization)
            )
        contact_entry = (
            record["asset_id"],
            ROOT / outputs["desktop"]["path"] if normalization else master_path,
        )
        all_contact_entries[record["layer"]].append(contact_entry)
        if record["layer"] == "CHARACTER" and record["kind"] == "production":
            character_key = character_identity(record["asset_id"])
            character_groups.setdefault(character_key, []).append(contact_entry)

    validate_character_presentations(inventory_assets)

    manifest = {
        "asset_manifest_version": MANIFEST_VERSION,
        "campaign_id": CAMPAIGN_ID,
        "assets": dict(sorted(manifest_assets.items())),
    }
    write_json(DELIVERY_ROOT / "manifest.json", manifest)

    contact_sheet(CONTACT_ROOT / "locations.jpg", [item for item in all_contact_entries["BACKGROUND"] if "fallback" not in item[0]], columns=2, cell=(640, 360))
    contact_sheet(CONTACT_ROOT / "expressions.jpg", [item for item in all_contact_entries["CHARACTER"] if "fallback" not in item[0]], columns=7, cell=(210, 315))
    contact_sheet(CONTACT_ROOT / "transient-inserts.jpg", [item for item in all_contact_entries["TRANSIENT"] if "fallback" not in item[0]], columns=3, cell=(430, 300))
    contact_sheet(CONTACT_ROOT / "scene-families.jpg", [(item[0], item[1]) for layer in ("BACKGROUND", "CHARACTER", "TRANSIENT") for item in all_contact_entries[layer]], columns=5, cell=(260, 220))
    for character, entries in sorted(character_groups.items()):
        contact_sheet(CONTACT_ROOT / f"character-{character.replace('_', '-')}.jpg", entries, columns=2, cell=(360, 540))

    contact_sheets = []
    for sheet_path in sorted(CONTACT_ROOT.glob("*.jpg")):
        with Image.open(sheet_path) as sheet:
            width, height = sheet.size
        contact_sheets.append({
            "path": sheet_path.relative_to(ROOT).as_posix(),
            "width": width,
            "height": height,
            "bytes": sheet_path.stat().st_size,
            "sha256": sha256(sheet_path),
            "review_state": "approved",
        })

    inventory = {
        "inventory_version": INVENTORY_VERSION,
        "campaign_id": CAMPAIGN_ID,
        "derived_from": [
            REGISTRY_PATH.relative_to(ROOT).as_posix(),
            TEXT_PATH.relative_to(ROOT).as_posix(),
        ],
        "asset_counts": {
            "production": len(production),
            "fallback": len(ASSETS) - len(production),
            "background": sum(1 for item in production if item["layer"] == "BACKGROUND"),
            "character": sum(1 for item in production if item["layer"] == "CHARACTER"),
            "transient": sum(1 for item in production if item["layer"] == "TRANSIENT"),
        },
        "total_delivery_bytes": total_delivery_bytes,
        "pages_budget_bytes": 15 * 1024 * 1024,
        "assets": sorted(inventory_assets, key=lambda item: item["asset_id"]),
        "contact_sheets": contact_sheets,
        "review_summary": {
            "status": "approved",
            "checks": [
                "identity continuity across expression pairs",
                "desktop and portrait-mobile focal survival",
                "dialogue and location-marker protected zones",
                "transparent character and insert edges",
                "dark and bright scene contrast",
                "text-free imagery and no hidden gameplay answers",
                "safe fallback and reduced-data coverage",
            ],
        },
    }
    write_json(INVENTORY_PATH, inventory)

    ledger = {
        "provenance_version": LEDGER_VERSION,
        "campaign_id": CAMPAIGN_ID,
        "generated_on": BUILD_DATE,
        "tool": TOOL_NAME,
        "shared_art_direction": SHARED_ART_DIRECTION,
        "project_owned_reference_inputs": references,
        "license_audit": {
            "result": "pass",
            "source_ownership": "The six references are project-owned planning images; all masters are original TASK-030 generations.",
            "third_party_brands_or_marks": False,
            "named_artist_imitation": False,
            "runtime_network_dependency": False,
        },
        "repository_size_audit": {
            "master_bytes": sum(item["master"]["bytes"] for item in inventory_assets),
            "delivery_bytes": total_delivery_bytes,
            "pages_budget_bytes": inventory["pages_budget_bytes"],
            "result": "pass" if total_delivery_bytes < inventory["pages_budget_bytes"] else "fail",
        },
        "assets": dict(sorted(provenance_assets.items())),
    }
    if ledger["repository_size_audit"]["result"] != "pass":
        raise RuntimeError("Story delivery asset set exceeds the reviewed Pages budget")
    write_json(LEDGER_PATH, ledger)

    print(
        f"Built {len(production)} production Story assets and {len(ASSETS) - len(production)} fallbacks "
        f"({total_delivery_bytes} delivery bytes; {len(contact_sheets)} contact sheets)."
    )


if __name__ == "__main__":
    main()
