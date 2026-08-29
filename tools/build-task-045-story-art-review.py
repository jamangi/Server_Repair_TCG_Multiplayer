#!/usr/bin/env python3
"""Build the TASK-045 expansion reuse contact sheet and visual review record.

This verifier is deliberately composition-only. It reads the approved TASK-030
desktop/mobile derivatives, places them with the current Story player geometry,
and writes one review JPEG plus its Markdown audit. It never writes a Story
master, runtime derivative, manifest, inventory, or provenance record.
"""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import math
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageStat


ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "viewer" / "assets" / "story" / "manifest.json"
INVENTORY_PATH = ROOT / "docs" / "art" / "task-030-story-art-inventory.json"
PROVENANCE_PATH = ROOT / "art_sources" / "task-030" / "generation-log.json"
REQUESTS_PATH = ROOT / "docs" / "story" / "revisions" / "quiet-cascade-expansion-v3" / "ART_REQUESTS.json"
OUTPUT_PATH = ROOT / "docs" / "art" / "task-045-contact-sheets" / "expansion-reuse.jpg"
REPORT_PATH = ROOT / "docs" / "art" / "TASK-045-VISUAL-REVIEW.md"

REVIEW_DATE = "2026-08-29"
REVIEW_LOCK_SHA256 = "98b72aa77e86d3d2fb04ffddf1471ebc5a0b3737f02a8038289df219075be85f"
EXPECTED_OUTPUT_SHA256 = "a0a4b870d4ea33878179cf57bc717280d32ac7768c74461699be853d4e3c7816"

REUSED_ASSET_IDS = (
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
)

EPISODES = (
    {
        "shift": 7,
        "title": "The Fourth Pair",
        "script": "content/story-v1/candidates/quiet-cascade-expansion-v3/scripts/shift-07.json",
        "label": "story.qc02.shift07.entry",
        "state": "entry",
        "background": "story.bg.trinity.trace.night",
        "characters": (
            ("story.asset.character.sora_chen.focused", "RIGHT"),
            ("story.asset.character.malik_okoye.focused", "LEFT"),
        ),
    },
    {
        "shift": 8,
        "title": "Across Both Bays",
        "script": "content/story-v1/candidates/quiet-cascade-expansion-v3/scripts/shift-08.json",
        "label": "story.qc02.shift08.success",
        "state": "completed return",
        "background": "story.bg.trinity.validation_gate.predawn",
        "characters": (
            ("story.asset.character.malik_okoye.focused", "LEFT"),
            ("story.asset.character.hana_park.relief", "RIGHT"),
        ),
    },
    {
        "shift": 9,
        "title": "Before the Drop",
        "script": "content/story-v1/candidates/quiet-cascade-expansion-v3/scripts/shift-09.json",
        "label": "story.qc02.shift09.abandon",
        "state": "bounded abandonment return",
        "background": "story.bg.trinity.knowledge_systems.night",
        "characters": (
            ("story.asset.character.jonah_reed.thoughtful", "LEFT"),
            ("story.asset.character.hana_park.skeptical", "RIGHT"),
        ),
    },
    {
        "shift": 10,
        "title": "The Alert That Stayed",
        "script": "content/story-v1/candidates/quiet-cascade-expansion-v3/scripts/shift-10.json",
        "label": "story.qc02.shift10.entry",
        "state": "entry",
        "background": "story.bg.trinity.knowledge_systems.night",
        "characters": (
            ("story.asset.character.jonah_reed.defensive", "LEFT"),
            ("story.asset.character.hana_park.skeptical", "RIGHT"),
        ),
    },
    {
        "shift": 11,
        "title": "Version A, Version B",
        "script": "content/story-v1/candidates/quiet-cascade-expansion-v3/scripts/shift-11.json",
        "label": "story.qc02.shift11.entry",
        "state": "entry",
        "background": "story.bg.trinity.core_floor.night_storm",
        "characters": (
            ("story.asset.character.malik_okoye.defensive", "LEFT"),
            ("story.asset.character.sora_chen.focused", "RIGHT"),
        ),
    },
    {
        "shift": 12,
        "title": "Recovery State",
        "script": "content/story-v1/candidates/quiet-cascade-expansion-v3/scripts/shift-12.json",
        "label": "story.qc02.shift12.follow_on",
        "state": "current-content handoff",
        "background": "story.bg.trinity.validation_gate.predawn",
        "characters": (
            ("story.asset.character.hana_park.relief", "RIGHT"),
            ("story.asset.character.sora_chen.approving", "LEFT"),
        ),
    },
)

AUDIT_INPUT_PATHS = (
    "viewer/assets/story/manifest.json",
    "docs/art/task-030-story-art-inventory.json",
    "art_sources/task-030/generation-log.json",
    "docs/story/VISUAL_DIRECTION.md",
    "docs/story/BACKGROUNDS.md",
    "docs/story/revisions/quiet-cascade-expansion-v3/CHOREOGRAPHY.md",
    "docs/story/revisions/quiet-cascade-expansion-v3/ART_REQUESTS.md",
    "docs/story/revisions/quiet-cascade-expansion-v3/ART_REQUESTS.json",
    "docs/story/revisions/quiet-cascade-expansion-v3/ALT_TEXT_BRIEFS.md",
    *(episode["script"] for episode in EPISODES),
)

SHEET_BG = (10, 16, 22)
PANEL_BG = (22, 30, 38)
PANEL_EDGE = (65, 91, 105)
TEXT = (235, 241, 243)
MUTED = (166, 185, 193)
ACCENT = (92, 205, 226)
PASS = (111, 210, 153)


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def sha256_bytes(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def sha256_path(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def font(size: int, *, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    name = "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"
    try:
        return ImageFont.truetype(name, size=size)
    except OSError:
        return ImageFont.load_default(size=size)


def wrap_for_width(draw: ImageDraw.ImageDraw, value: str, selected_font: ImageFont.ImageFont, width: int) -> list[str]:
    words = value.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if current and draw.textbbox((0, 0), candidate, font=selected_font)[2] > width:
            lines.append(current)
            current = word
        else:
            current = candidate
    if current:
        lines.append(current)
    return lines or [""]


def draw_wrapped(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    value: str,
    selected_font: ImageFont.ImageFont,
    fill: tuple[int, int, int],
    width: int,
    *,
    line_gap: int = 5,
) -> int:
    x, y = xy
    line_height = draw.textbbox((0, 0), "Ag", font=selected_font)[3]
    for line in wrap_for_width(draw, value, selected_font, width):
        draw.text((x, y), line, font=selected_font, fill=fill)
        y += line_height + line_gap
    return y


def alpha_bounds(image: Image.Image, threshold: int = 8) -> tuple[int, int, int, int]:
    alpha = image.convert("RGBA").getchannel("A")
    visible = alpha.point(lambda value: 255 if value >= threshold else 0)
    bounds = visible.getbbox()
    if bounds is None:
        raise RuntimeError("Character derivative has no visible alpha content")
    return bounds


def bounds_record(bounds: tuple[int, int, int, int]) -> dict[str, int]:
    left, top, right, bottom = bounds
    return {"x": left, "y": top, "width": right - left, "height": bottom - top}


def exact_protected_zones(zones: list[dict[str, float]]) -> bool:
    expected = [
        {"x": 0.0, "y": 0.66, "width": 1.0, "height": 0.34},
        {"x": 0.0, "y": 0.0, "width": 0.3, "height": 0.12},
    ]
    return zones == expected


def relevant_maps() -> tuple[dict[str, Any], dict[str, Any], dict[str, Any], dict[str, Any]]:
    manifest = read_json(MANIFEST_PATH)
    inventory = read_json(INVENTORY_PATH)
    provenance = read_json(PROVENANCE_PATH)
    requests = read_json(REQUESTS_PATH)
    return (
        manifest,
        {record["asset_id"]: record for record in inventory["assets"]},
        provenance,
        requests,
    )


def validate_reachable_compositions() -> None:
    for episode in EPISODES:
        statements = read_json(ROOT / episode["script"])["statements"]
        label_index = next(
            index for index, statement in enumerate(statements)
            if statement.get("type") == "label" and statement.get("label_id") == episode["label"]
        )
        background = None
        characters: list[tuple[str, str]] = []
        for statement in statements[label_index + 1:]:
            if statement.get("type") in {"say", "narrate", "choice", "start_match", "jump", "if", "end"}:
                break
            if statement.get("type") == "scene":
                background = statement["background_asset_id"]
            if statement.get("type") == "show" and statement.get("layer") == "characters":
                asset_id = (
                    "story.asset.character."
                    + statement["character_id"].removeprefix("story.character.")
                    + "."
                    + statement["pose_id"]
                )
                characters.append((asset_id, statement["position"]))
        if background != episode["background"] or tuple(characters) != episode["characters"]:
            raise RuntimeError(
                f"Shift {episode['shift']} review composition is not the exact reachable state at {episode['label']}"
            )


def validate_inputs() -> dict[str, Any]:
    manifest, inventory_by_id, provenance, requests = relevant_maps()
    request_assets = {record["asset_id"]: record for record in requests["asset_reuse"]["assets"]}
    if set(request_assets) != set(REUSED_ASSET_IDS):
        raise RuntimeError("TASK-044 reuse ledger is not the exact 12-asset TASK-045 scope")
    disposition = requests["art_request_disposition"]
    if (
        requests["status"] != "ZERO_NEW_ART_REQUESTS_EXISTING_INVENTORY_COMPLETE"
        or disposition["request_count"] != 0
        or disposition["gap_count"] != 0
        or disposition["requests"] != []
        or disposition["task_045_mode"] != "VERIFY_EXISTING_ASSETS_DO_NOT_GENERATE"
    ):
        raise RuntimeError("TASK-044 did not preserve the verification-only zero-gap boundary")
    if requests["asset_reuse"]["transient_count"] != 0:
        raise RuntimeError("Expansion reuse unexpectedly includes a transient")

    ledger_assets = provenance["assets"]
    if (
        provenance["license_audit"]["result"] != "pass"
        or provenance["license_audit"]["third_party_brands_or_marks"] is not False
        or provenance["license_audit"]["named_artist_imitation"] is not False
        or provenance["license_audit"]["runtime_network_dependency"] is not False
    ):
        raise RuntimeError("TASK-030 license and source boundary is not approved")

    derivative_paths: list[str] = []
    input_rows: list[dict[str, str]] = []
    alpha_edge_count = 0
    background_metrics: list[dict[str, float | str]] = []
    for asset_id in REUSED_ASSET_IDS:
        asset = manifest["assets"].get(asset_id)
        inventory = inventory_by_id.get(asset_id)
        ledger = ledger_assets.get(asset_id)
        request = request_assets[asset_id]
        if not asset or not inventory or not ledger:
            raise RuntimeError(f"{asset_id}: manifest, inventory, or provenance is missing")
        if (
            asset["kind"] != "production"
            or inventory["kind"] != "production"
            or request["exact_existing_reuse"] is not True
            or request["review_state"] != "approved"
            or inventory["review_state"] != "approved"
            or ledger["review_state"] != "approved"
            or ledger["approval"]["status"] != "approved"
            or ledger["source_pixels_used"] is not False
        ):
            raise RuntimeError(f"{asset_id}: prior production approval is incomplete")
        negative_contract = ledger["prompt"].lower()
        for phrase in ("brands", "readable or pseudo text", "hidden gameplay answers", "unsafe handling"):
            if phrase not in negative_contract:
                raise RuntimeError(f"{asset_id}: provenance prompt lost the {phrase!r} exclusion")
        review_contract = " ".join(ledger["review_notes"]).lower()
        for phrase in ("text-free composition", "technical safety", "absence of hidden gameplay answers"):
            if phrase not in review_contract:
                raise RuntimeError(f"{asset_id}: prior review notes lost the {phrase!r} decision")
        if any(token in asset["alt_text"].lower() for token in ("fault.", "required diagnostic", "hidden answer")):
            raise RuntimeError(f"{asset_id}: accessible copy exposes a solution identifier")

        row = {"asset_id": asset_id, "layer": asset["layer"]}
        for profile in ("desktop", "mobile"):
            source = asset["sources"][profile]
            expected_path = f"viewer/assets/story/{source}"
            derivative = inventory["derivatives"][profile]
            request_derivative = next(
                record for record in request["responsive_variants"] if record["variant"] == profile
            )
            if derivative["path"] != expected_path or request_derivative["path"] != expected_path:
                raise RuntimeError(f"{asset_id}: {profile} path differs across approved ledgers")
            source_path = ROOT / expected_path
            payload_hash = sha256_path(source_path)
            if not (
                payload_hash == derivative["sha256"]
                == ledger["derivatives"][profile]["sha256"]
                == request_derivative["sha256"]
            ):
                raise RuntimeError(f"{asset_id}: {profile} pixels differ from TASK-030 approval")
            derivative_paths.append(expected_path)
            row[f"{profile}_path"] = expected_path
            row[f"{profile}_sha256"] = payload_hash
            with Image.open(source_path) as image:
                image.load()
                expected_size = (derivative["width"], derivative["height"])
                if image.size != expected_size:
                    raise RuntimeError(f"{asset_id}: {profile} decoded dimensions changed")
                if asset["layer"] == "CHARACTER":
                    if "A" not in image.getbands():
                        raise RuntimeError(f"{asset_id}: {profile} lost its alpha channel")
                    actual_bounds = bounds_record(alpha_bounds(image))
                    if actual_bounds != derivative["visible_alpha_bounds"]:
                        raise RuntimeError(f"{asset_id}: {profile} visible alpha bounds changed")
                    bounds = actual_bounds
                    if (
                        bounds["x"] <= 0
                        or bounds["y"] <= 0
                        or bounds["x"] + bounds["width"] >= image.width
                    ):
                        raise RuntimeError(f"{asset_id}: {profile} alpha clips a protected top or side edge")
                    alpha_histogram = image.convert("RGBA").getchannel("A").histogram()
                    if sum(alpha_histogram[1:255]) == 0:
                        raise RuntimeError(f"{asset_id}: {profile} has no antialiased alpha transition")
                    alpha_edge_count += 1
                else:
                    expected_dimensions = (1600, 900) if profile == "desktop" else (720, 960)
                    if image.size != expected_dimensions:
                        raise RuntimeError(f"{asset_id}: {profile} no longer matches the reviewed crop family")
                    focal = asset["focal_point"]
                    if not (0.45 <= focal["x"] <= 0.60 and 0.30 <= focal["y"] <= 0.45):
                        raise RuntimeError(f"{asset_id}: focal point escaped the portrait-safe center")
                    if not exact_protected_zones(asset["protected_zones"]):
                        raise RuntimeError(f"{asset_id}: dialogue/location protected zones changed")
                    grayscale = image.convert("L")
                    lower = grayscale.crop((0, round(grayscale.height * 0.66), grayscale.width, grayscale.height))
                    fx = round(grayscale.width * focal["x"])
                    fy = round(grayscale.height * focal["y"])
                    fw = max(12, round(grayscale.width * 0.20))
                    fh = max(12, round(grayscale.height * 0.20))
                    focal_crop = grayscale.crop((fx - fw // 2, fy - fh // 2, fx + fw // 2, fy + fh // 2))
                    lower_mean = ImageStat.Stat(lower).mean[0]
                    focal_stddev = ImageStat.Stat(focal_crop).stddev[0]
                    if lower_mean > 50 or focal_stddev < 8:
                        raise RuntimeError(
                            f"{asset_id}: {profile} failed dialogue-value or focal-detail review "
                            f"(lower mean {lower_mean:.2f}, focal deviation {focal_stddev:.2f})"
                        )
                    background_metrics.append({
                        "asset_id": asset_id,
                        "profile": profile,
                        "lower_mean": round(lower_mean, 2),
                        "focal_stddev": round(focal_stddev, 2),
                    })
        input_rows.append(row)

    character_assets = [inventory_by_id[asset_id] for asset_id in REUSED_ASSET_IDS if ".character." in asset_id]
    pair_checks = 0
    for item in character_assets:
        transform = item.get("presentation_transform")
        reference = inventory_by_id.get(transform.get("reference_asset_id") if transform else None)
        if not transform or not reference:
            raise RuntimeError(f"{item['asset_id']}: presentation-pair audit is missing")
        for profile in ("desktop", "mobile"):
            derivative = item["derivatives"][profile]
            reference_derivative = reference["derivatives"][profile]
            band = derivative["portrait_anchor_bounds"]
            reference_band = reference_derivative["portrait_anchor_bounds"]
            full = derivative["visible_alpha_bounds"]
            reference_full = reference_derivative["visible_alpha_bounds"]
            width_ratio = band["width"] / reference_band["width"]
            area_ratio = derivative["visible_alpha_pixels"] / reference_derivative["visible_alpha_pixels"]
            center = band["x"] + band["width"] / 2
            reference_center = reference_band["x"] + reference_band["width"] / 2
            width_tolerance = 0.02 if transform["applied"] else 0.03
            top_tolerance = max(2, round(derivative["height"] * (0.005 if transform["applied"] else 0.01)))
            center_tolerance = max(2, round(derivative["width"] * (0.005 if transform["applied"] else 0.02)))
            if (
                not 1 - width_tolerance <= width_ratio <= 1 + width_tolerance
                or not 0.80 <= area_ratio <= 1.10
                or abs(full["y"] - reference_full["y"]) > top_tolerance
                or abs(center - reference_center) > center_tolerance
            ):
                raise RuntimeError(f"{item['asset_id']}: {profile} identity/pose presentation drifted")
            pair_checks += 1

    validate_reachable_compositions()

    audit_file_hashes = [
        {"path": relative_path, "sha256": sha256_path(ROOT / relative_path)}
        for relative_path in AUDIT_INPUT_PATHS
    ]
    lock_entries = sorted(
        [(record["path"], record["sha256"]) for record in audit_file_hashes]
        + [(path, sha256_path(ROOT / path)) for path in derivative_paths]
    )
    lock_payload = "".join(f"{path}\0{digest}\n" for path, digest in lock_entries).encode("utf-8")
    review_lock = sha256_bytes(lock_payload)
    if REVIEW_LOCK_SHA256 != "PENDING" and review_lock != REVIEW_LOCK_SHA256:
        raise RuntimeError(
            f"Review input lock changed: expected {REVIEW_LOCK_SHA256}, received {review_lock}. "
            "A new human visual review is required before updating the lock."
        )

    return {
        "manifest": manifest,
        "inventory_by_id": inventory_by_id,
        "input_rows": input_rows,
        "audit_file_hashes": audit_file_hashes,
        "review_lock": review_lock,
        "alpha_edge_count": alpha_edge_count,
        "pair_checks": pair_checks,
        "background_metrics": background_metrics,
        "derivative_paths": sorted(set(derivative_paths)),
    }


def contain_rgba(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    preview = ImageOps.contain(image.convert("RGBA"), size, Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    canvas.alpha_composite(preview, ((size[0] - preview.width) // 2, (size[1] - preview.height) // 2))
    return canvas


def compose_scene(episode: dict[str, Any], profile: str, manifest: dict[str, Any]) -> Image.Image:
    background_record = manifest["assets"][episode["background"]]
    background_path = ROOT / "viewer" / "assets" / "story" / background_record["sources"][profile]
    with Image.open(background_path) as source:
        stage = source.convert("RGBA")
        stage.load()
    if profile == "desktop":
        element_width = round(stage.width * 0.28)
        element_height = round(stage.height * 0.72)
        bottom = round(stage.height * 0.25)
        horizontal_offset = round(stage.width * 0.01)
        left_x = horizontal_offset
        right_x = stage.width - horizontal_offset - element_width
    else:
        element_width = round(stage.width * 0.68)
        element_height = round(stage.height * 0.92)
        bottom = 0
        extension = round(stage.width * 0.14)
        left_x = -extension
        right_x = stage.width + extension - element_width
    element_y = stage.height - bottom - element_height
    for asset_id, position in episode["characters"]:
        character_record = manifest["assets"][asset_id]
        character_path = ROOT / "viewer" / "assets" / "story" / character_record["sources"][profile]
        with Image.open(character_path) as source:
            character = contain_rgba(source, (element_width, element_height))
        stage.alpha_composite(character, (left_x if position == "LEFT" else right_x, element_y))
    return stage.convert("RGB")


def checker(size: tuple[int, int], block: int = 24) -> Image.Image:
    canvas = Image.new("RGBA", size, (28, 35, 42, 255))
    draw = ImageDraw.Draw(canvas)
    for y in range(0, size[1], block):
        for x in range(0, size[0], block):
            if (x // block + y // block) % 2:
                draw.rectangle((x, y, min(x + block - 1, size[0]), min(y + block - 1, size[1])), fill=(160, 166, 168, 255))
    return canvas


def asset_preview(asset_id: str, manifest: dict[str, Any], size: tuple[int, int]) -> Image.Image:
    record = manifest["assets"][asset_id]
    source_path = ROOT / "viewer" / "assets" / "story" / record["sources"]["desktop"]
    with Image.open(source_path) as source:
        source.load()
        if record["layer"] == "CHARACTER":
            canvas = checker(size)
            contained = contain_rgba(source, size)
            canvas.alpha_composite(contained)
            return canvas.convert("RGB")
        contained = ImageOps.contain(source.convert("RGB"), size, Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", size, PANEL_BG)
    canvas.paste(contained, ((size[0] - contained.width) // 2, (size[1] - contained.height) // 2))
    return canvas


def render_sheet(audit: dict[str, Any]) -> Image.Image:
    manifest = audit["manifest"]
    margin = 32
    gap = 32
    tile_width = 1160
    tile_height = 640
    header_height = 214
    atlas_heading_height = 132
    atlas_cell_height = 344
    sheet_width = margin * 2 + tile_width * 2 + gap
    episode_rows = math.ceil(len(EPISODES) / 2)
    atlas_rows = math.ceil(len(REUSED_ASSET_IDS) / 4)
    sheet_height = (
        header_height
        + episode_rows * tile_height
        + (episode_rows - 1) * gap
        + gap
        + atlas_heading_height
        + atlas_rows * atlas_cell_height
        + (atlas_rows - 1) * gap
        + margin
    )
    sheet = Image.new("RGB", (sheet_width, sheet_height), SHEET_BG)
    draw = ImageDraw.Draw(sheet)
    title_font = font(50, bold=True)
    subtitle_font = font(24)
    heading_font = font(27, bold=True)
    body_font = font(18)
    small_font = font(15)

    draw.text((margin, 32), "Quiet Cascade expansion · reuse composition review", font=title_font, fill=TEXT)
    draw.text(
        (margin, 98),
        "Six exact reachable episode states · approved TASK-030 desktop/mobile pixels · labels remain outside every image panel",
        font=subtitle_font,
        fill=MUTED,
    )
    badges = ("6/6 EPISODES", "12/12 REUSED ASSETS", "0 NEW ART", "PASS")
    badge_x = margin
    for label in badges:
        bbox = draw.textbbox((0, 0), label, font=body_font)
        badge_width = bbox[2] - bbox[0] + 32
        draw.rounded_rectangle((badge_x, 148, badge_x + badge_width, 190), radius=18, fill=(25, 61, 67), outline=PASS)
        draw.text((badge_x + 16, 158), label, font=body_font, fill=PASS)
        badge_x += badge_width + 14

    start_y = header_height
    for index, episode in enumerate(EPISODES):
        row, column = divmod(index, 2)
        x = margin + column * (tile_width + gap)
        y = start_y + row * (tile_height + gap)
        draw.rounded_rectangle((x, y, x + tile_width, y + tile_height), radius=20, fill=PANEL_BG, outline=PANEL_EDGE, width=2)
        draw.text((x + 22, y + 18), f"SHIFT {episode['shift']} · {episode['title']}", font=heading_font, fill=TEXT)
        draw.text((x + 22, y + 54), f"Reachable state: {episode['state']} · {episode['label']}", font=small_font, fill=MUTED)
        desktop = compose_scene(episode, "desktop", manifest).resize((720, 405), Image.Resampling.LANCZOS)
        mobile = compose_scene(episode, "mobile", manifest).resize((304, 405), Image.Resampling.LANCZOS)
        desktop_x = x + 22
        mobile_x = x + 788
        image_y = y + 100
        sheet.paste(desktop, (desktop_x, image_y))
        sheet.paste(mobile, (mobile_x, image_y))
        draw.rectangle((desktop_x, image_y, desktop_x + 720, image_y + 405), outline=PANEL_EDGE, width=2)
        draw.rectangle((mobile_x, image_y, mobile_x + 304, image_y + 405), outline=PANEL_EDGE, width=2)
        draw.text((desktop_x, image_y + 415), "DESKTOP · 16:9 · lower 34% reserved for HTML dialogue", font=small_font, fill=ACCENT)
        draw.text((mobile_x, image_y + 415), "MOBILE · 3:4 · dialogue reflows below art", font=small_font, fill=ACCENT)
        character_summary = " · ".join(
            asset_id.removeprefix("story.asset.character.").replace("_", " ") + f" ({position.lower()})"
            for asset_id, position in episode["characters"]
        )
        draw_wrapped(
            draw,
            (x + 22, image_y + 451),
            "Background: " + episode["background"],
            small_font,
            MUTED,
            tile_width - 44,
        )
        draw_wrapped(
            draw,
            (x + 22, image_y + 480),
            "Characters: " + character_summary,
            small_font,
            MUTED,
            tile_width - 44,
        )

    atlas_y = start_y + episode_rows * tile_height + (episode_rows - 1) * gap + gap
    draw.text((margin, atlas_y), "Approved reuse inventory", font=title_font, fill=TEXT)
    draw.text(
        (margin, atlas_y + 64),
        "Desktop derivative previews; character alpha is shown over a dual-tone checker. Every asset also appears in a mobile episode composition above.",
        font=subtitle_font,
        fill=MUTED,
    )
    atlas_start = atlas_y + atlas_heading_height
    atlas_gap = gap
    atlas_width = (sheet_width - 2 * margin - atlas_gap * 3) // 4
    for index, asset_id in enumerate(REUSED_ASSET_IDS):
        row, column = divmod(index, 4)
        x = margin + column * (atlas_width + atlas_gap)
        y = atlas_start + row * (atlas_cell_height + gap)
        draw.rounded_rectangle((x, y, x + atlas_width, y + atlas_cell_height), radius=16, fill=PANEL_BG, outline=PANEL_EDGE)
        preview = asset_preview(asset_id, manifest, (atlas_width - 28, 246))
        sheet.paste(preview, (x + 14, y + 14))
        draw.rectangle((x + 14, y + 14, x + atlas_width - 14, y + 260), outline=PANEL_EDGE)
        draw_wrapped(draw, (x + 16, y + 274), asset_id, small_font, TEXT, atlas_width - 32, line_gap=2)

    return sheet


def encode_jpeg(sheet: Image.Image) -> bytes:
    output = io.BytesIO()
    sheet.save(
        output,
        "JPEG",
        quality=90,
        subsampling=0,
        optimize=False,
        progressive=False,
    )
    return output.getvalue()


def report_text(audit: dict[str, Any], sheet: Image.Image, sheet_payload: bytes) -> str:
    output_hash = sha256_bytes(sheet_payload)
    min_lower = min(record["lower_mean"] for record in audit["background_metrics"])
    max_lower = max(record["lower_mean"] for record in audit["background_metrics"])
    min_focal = min(record["focal_stddev"] for record in audit["background_metrics"])
    max_focal = max(record["focal_stddev"] for record in audit["background_metrics"])
    lines = [
        "# TASK-045 Story expansion visual reuse review",
        "",
        "Status: **approved verification-only reuse review — zero new masters and zero new derivatives**",
        "",
        "The six-episode expansion is visually complete with the twelve already-approved TASK-030 assets named by TASK-044. The contact sheet at [`task-045-contact-sheets/expansion-reuse.jpg`](task-045-contact-sheets/expansion-reuse.jpg) renders one exact reachable state from each episode using the current Story player’s desktop and mobile placement geometry. Source pixels are read-only; labels and review copy sit outside every image panel.",
        "",
        "No image generation or image editing was performed. This record approves reuse of byte-identical production art; it does not create a new visual canon or expand TASK-044 topology.",
        "",
        "## Review result",
        "",
        "| Check | Mechanical evidence | Result |",
        "| --- | --- | ---: |",
        f"| Crop, focal point, and dialogue-safe composition | 4/4 backgrounds retain 1600×900 desktop and 720×960 mobile families, centered focal metadata, the lower-34% dialogue zone, and the upper-left location zone. Across 8 background/profile checks, lower-zone mean luminance is {min_lower:.2f}–{max_lower:.2f}/255 and focal-region deviation is {min_focal:.2f}–{max_focal:.2f}. | PASS |",
        f"| Identity and pose cohesion | 8/8 character poses retain their approved identity reference, portrait-band scale, top anchor, center, and visible-area bounds across {audit['pair_checks']} desktop/mobile pair checks. | PASS |",
        f"| Transparent edges | All {audit['alpha_edge_count']} character/profile decodes retain alpha, antialiased transition pixels, and clear top/side margins matching the TASK-030 inventory. Character thumbnails are reviewed against both dark and light matte values. | PASS |",
        "| Hidden solution, pseudo-text, brand, and unsafe-action boundary | All 24 image inputs are hash-identical to approved TASK-030 derivatives. Their provenance retains the no-brand, no-readable-or-pseudo-text, no-hidden-answer, and no-unsafe-handling prompt constraints; review notes and the passed license audit remain intact. Direct inspection of this sheet found no hidden Fault/required diagnostic, pseudo-writing, third-party mark, or unsafe service action. | PASS |",
        "| Exact episode use | 6/6 sheet states are reconstructed from the named candidate-script label before any dialogue; their background, pose, and LEFT/RIGHT placement exactly match the authored statements. | PASS |",
        "| Zero-new-art boundary | TASK-044 reports 0 gaps, 0 requests, and 0 transients. This builder writes only this review JPEG and this Markdown record; production masters, derivatives, manifests, provenance, Story content, and gameplay remain untouched. | PASS |",
        "",
        "## Episode compositions",
        "",
        "| Shift | Exact reachable state | Background | Characters |",
        "| ---: | --- | --- | --- |",
    ]
    for episode in EPISODES:
        characters = "; ".join(f"`{asset_id}` ({position})" for asset_id, position in episode["characters"])
        lines.append(
            f"| {episode['shift']} — {episode['title']} | `{episode['label']}` ({episode['state']}) | `{episode['background']}` | {characters} |"
        )
    lines.extend([
        "",
        "Together these six actual states display all four backgrounds and all eight poses in both delivery geometries. The sheet intentionally uses no dialogue rasterization, solution insert, transient, vignette, brand mark, or technical status overlay. Desktop source panels remain unobscured so the protected lower third can be inspected; mobile dialogue is correctly outside the image stage.",
        "",
        "## Approved derivative inputs",
        "",
        "| Asset | Desktop SHA-256 | Mobile SHA-256 |",
        "| --- | --- | --- |",
    ])
    for row in audit["input_rows"]:
        lines.append(
            f"| `{row['asset_id']}` | `{row['desktop_sha256']}` | `{row['mobile_sha256']}` |"
        )
    lines.extend([
        "",
        "The 24 paths are the manifest-owned `desktop` and `mobile` sources under `viewer/assets/story/`; their dimensions, byte counts, hashes, and approval records agree across the TASK-030 inventory, provenance ledger, and TASK-044 reuse ledger.",
        "",
        "## Review-input lock",
        "",
        f"Aggregate SHA-256: `{audit['review_lock']}`",
        "",
        "The aggregate covers the manifest, TASK-030 inventory/provenance, visual direction/background registry, TASK-044 choreography/art/alt briefs, all six candidate scripts, and all 24 source derivatives. A changed input stops the builder and requires a fresh visual review before the lock can be updated.",
        "",
        "<details><summary>Individual document hashes</summary>",
        "",
        "| Input | SHA-256 |",
        "| --- | --- |",
    ])
    for record in audit["audit_file_hashes"]:
        lines.append(f"| `{record['path']}` | `{record['sha256']}` |")
    lines.extend([
        "",
        "</details>",
        "",
        "## Output and reproduction",
        "",
        f"- Output: `docs/art/task-045-contact-sheets/expansion-reuse.jpg`",
        f"- Dimensions: {sheet.width}×{sheet.height}",
        f"- Bytes: {len(sheet_payload)}",
        f"- SHA-256: `{output_hash}`",
        "- Labels: rendered only in the contact-sheet canvas outside source-image panels",
        "- Production-art mutations: 0",
        "",
        "Rebuild and verify with the repository Python environment that supplies Pillow:",
        "",
        "```powershell",
        "python tools/build-task-045-story-art-review.py",
        "python tools/build-task-045-story-art-review.py --check",
        "node --test tests/task-045-story-expansion-visual-review.test.mjs",
        "```",
        "",
        "Unresolved visual items: **none**. A later topology-authorized script change that introduces a different location, pose, transient, or comprehension need must reopen the gap analysis instead of silently reusing this approval.",
        "",
    ])
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="Verify committed outputs without writing")
    args = parser.parse_args()

    audit = validate_inputs()
    sheet = render_sheet(audit)
    sheet_payload = encode_jpeg(sheet)
    output_hash = sha256_bytes(sheet_payload)
    if EXPECTED_OUTPUT_SHA256 != "PENDING" and output_hash != EXPECTED_OUTPUT_SHA256:
        raise RuntimeError(
            f"Contact sheet differs from reviewed output: expected {EXPECTED_OUTPUT_SHA256}, received {output_hash}"
        )
    report = report_text(audit, sheet, sheet_payload)

    if args.check:
        if not OUTPUT_PATH.is_file() or OUTPUT_PATH.read_bytes() != sheet_payload:
            raise RuntimeError(f"{OUTPUT_PATH.relative_to(ROOT)} is stale; rebuild the visual review")
        if not REPORT_PATH.is_file() or REPORT_PATH.read_text(encoding="utf-8") != report:
            raise RuntimeError(f"{REPORT_PATH.relative_to(ROOT)} is stale; rebuild the visual review")
        action = "Verified"
    else:
        OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT_PATH.write_bytes(sheet_payload)
        REPORT_PATH.write_text(report, encoding="utf-8")
        action = "Built"

    print(
        f"{action} TASK-045 visual review: 6/6 episode compositions, 12/12 approved assets, "
        f"24/24 desktop/mobile inputs, {audit['alpha_edge_count']}/{audit['alpha_edge_count']} alpha edges, "
        f"0 new masters/derivatives; {OUTPUT_PATH.relative_to(ROOT)} sha256={output_hash}."
    )


if __name__ == "__main__":
    main()
