from __future__ import annotations

import argparse
import hashlib
import io
import json
from datetime import date
from pathlib import Path

from PIL import Image


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
INVENTORY_PATH = REPOSITORY_ROOT / "docs" / "art" / "task-011-illustration-inventory.json"
GENERATION_LOG_PATH = REPOSITORY_ROOT / "art_sources" / "task-011" / "generation-log.json"
REFERENCE_PATHS = [
    "docs/ui-plan/ui-reference_images/01-night-shift-board-desktop.png",
    "docs/ui-plan/ui-reference_images/02-card-ticket-specimens.png",
    "docs/ui-plan/ui-reference_images/03-night-shift-board-mobile.png",
    "docs/ui-plan/ui-reference_images/task-020-global-one-row-target.png",
    "docs/ui-plan/ui-reference_images/task-020-relevant-one-row-target.png",
]


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def centered_crop(image: Image.Image, target_width: int, target_height: int) -> Image.Image:
    target_ratio = target_width / target_height
    source_ratio = image.width / image.height
    if source_ratio > target_ratio:
        crop_width = round(image.height * target_ratio)
        left = (image.width - crop_width) // 2
        box = (left, 0, left + crop_width, image.height)
    else:
        crop_height = round(image.width / target_ratio)
        top = (image.height - crop_height) // 2
        box = (0, top, image.width, top + crop_height)
    return image.crop(box)


def encode_webp(image: Image.Image, byte_budget: int) -> tuple[bytes, int]:
    for quality in range(88, 57, -3):
        buffer = io.BytesIO()
        image.save(buffer, format="WEBP", quality=quality, method=6, exact=True)
        payload = buffer.getvalue()
        if len(payload) <= byte_budget:
            return payload, quality
    raise ValueError(f"Could not meet {byte_budget}-byte delivery budget without dropping below quality 58")


def process(
    source: Path,
    subject_id: str,
    generation_reference: str,
    edit_prompt: str | None = None,
    source_generation_reference: str | None = None,
) -> None:
    inventory = load_json(INVENTORY_PATH)
    subject = next((entry for entry in inventory["subjects"] if entry["domain_id"] == subject_id), None)
    if subject is None:
        raise ValueError(f"Unknown TASK-011 subject: {subject_id}")

    master_dimensions = subject["expected_master_dimensions"]
    delivery_dimensions = subject["expected_dimensions"]
    with Image.open(source) as opened:
        original_size = {"width": opened.width, "height": opened.height}
        image = opened.convert("RGB")
    cropped = centered_crop(image, master_dimensions["width"], master_dimensions["height"])
    master = cropped.resize(
        (master_dimensions["width"], master_dimensions["height"]),
        Image.Resampling.LANCZOS,
    )
    master_path = REPOSITORY_ROOT / subject["master_path"]
    master_path.parent.mkdir(parents=True, exist_ok=True)
    master.save(master_path, format="WEBP", quality=92, method=6, exact=True)

    delivery = master.resize(
        (delivery_dimensions["width"], delivery_dimensions["height"]),
        Image.Resampling.LANCZOS,
    )
    delivery_bytes, quality = encode_webp(delivery, subject["byte_budget"])
    output_path = REPOSITORY_ROOT / subject["output_path"]
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(delivery_bytes)

    log = load_json(GENERATION_LOG_PATH) if GENERATION_LOG_PATH.exists() else {
        "format_version": 1,
        "tool": "OpenAI built-in image generation",
        "model": "built-in default (tool-managed)",
        "subjects": {},
    }
    prior = log["subjects"].get(subject_id)
    provenance = {
        "mode": "generated-and-edited" if edit_prompt else "generated",
        "created_on": date.today().isoformat(),
        "tool": "OpenAI built-in image generation",
        "model": "built-in default (tool-managed)",
        "generation_reference": generation_reference,
        "source_generation_reference": source_generation_reference,
        "prompt_version": "task-011-art-bible-v1",
        "prompt": subject["prompt"],
        "edit_prompts": [
            *(prior or {}).get("provenance", {}).get("edit_prompts", []),
            *([edit_prompt] if edit_prompt else []),
        ],
        "source_references": REFERENCE_PATHS,
        "source_pixels_used": False,
        "original_generation_dimensions": original_size,
        "edit_history": [
            *(prior or {}).get("provenance", {}).get("edit_history", []),
            *(["Built-in image edit applied to address pilot review findings."] if edit_prompt else []),
            "Centered crop to the approved family aspect ratio.",
            f"Lanczos resize to {master_dimensions['width']}x{master_dimensions['height']} master.",
            f"Lanczos resize and WebP quality {quality} delivery encoding.",
        ],
        "usage_note": "Generated for this repository; use follows applicable OpenAI terms and the repository license.",
    }
    log["subjects"][subject_id] = {
        "dimensions": delivery_dimensions,
        "bytes": len(delivery_bytes),
        "sha256": hashlib.sha256(delivery_bytes).hexdigest(),
        "review_state": "pilot-review",
        "review_notes": [],
        "provenance": provenance,
    }
    write_json(GENERATION_LOG_PATH, log)
    print(f"Processed {subject_id}: {delivery_dimensions['width']}x{delivery_dimensions['height']}, {len(delivery_bytes)} bytes, q={quality}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Create TASK-011 master and delivery WebP assets.")
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--subject-id", required=True)
    parser.add_argument("--generation-reference", required=True)
    parser.add_argument("--edit-prompt")
    parser.add_argument("--source-generation-reference")
    arguments = parser.parse_args()
    process(
        arguments.source.resolve(),
        arguments.subject_id,
        arguments.generation_reference,
        arguments.edit_prompt,
        arguments.source_generation_reference,
    )


if __name__ == "__main__":
    main()
