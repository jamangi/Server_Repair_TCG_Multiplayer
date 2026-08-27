from __future__ import annotations

import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
INVENTORY_PATH = REPOSITORY_ROOT / "docs" / "art" / "task-011-illustration-inventory.json"
OUTPUT_ROOT = REPOSITORY_ROOT / "docs" / "art" / "task-011-contact-sheets"
BACKGROUND = (7, 18, 25)
PANEL = (13, 34, 44)
INK = (226, 238, 240)
MUTED = (151, 181, 190)


def load_font(size: int) -> ImageFont.ImageFont:
    candidates = [
        Path("C:/Windows/Fonts/segoeui.ttf"),
        Path("C:/Windows/Fonts/arial.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size=size)
    return ImageFont.load_default()


def groups(subjects: list[dict]) -> dict[str, list[dict]]:
    result: dict[str, list[dict]] = {}
    for subject in subjects:
        key = subject["family"] if subject["family"] != "symptom" else f"symptoms-{subject['subsystem']}"
        result.setdefault(key, []).append(subject)
    return dict(sorted(result.items()))


def build_sheet(name: str, subjects: list[dict]) -> Path:
    columns = 4
    thumb_width = 320
    thumb_height = 180 if not name.startswith("symptoms-") else 96
    label_height = 72
    gutter = 20
    header_height = 70
    rows = math.ceil(len(subjects) / columns)
    width = gutter + columns * (thumb_width + gutter)
    height = header_height + rows * (thumb_height + label_height + gutter) + gutter
    sheet = Image.new("RGB", (width, height), BACKGROUND)
    draw = ImageDraw.Draw(sheet)
    title_font = load_font(28)
    label_font = load_font(16)
    small_font = load_font(13)
    draw.text((gutter, 18), f"TASK-011 · {name.replace('-', ' ').title()}", fill=INK, font=title_font)
    for index, subject in enumerate(subjects):
        row, column = divmod(index, columns)
        x = gutter + column * (thumb_width + gutter)
        y = header_height + row * (thumb_height + label_height + gutter)
        draw.rounded_rectangle((x - 4, y - 4, x + thumb_width + 4, y + thumb_height + label_height + 4), radius=8, fill=PANEL)
        image_path = REPOSITORY_ROOT / subject["output_path"]
        if image_path.exists():
            with Image.open(image_path) as opened:
                image = opened.convert("RGB")
            image.thumbnail((thumb_width, thumb_height), Image.Resampling.LANCZOS)
            left = x + (thumb_width - image.width) // 2
            top = y + (thumb_height - image.height) // 2
            sheet.paste(image, (left, top))
        else:
            draw.rectangle((x, y, x + thumb_width, y + thumb_height), fill=(20, 44, 54))
            draw.text((x + 12, y + 12), "MISSING", fill=(255, 132, 109), font=label_font)
        label_y = y + thumb_height + 8
        draw.text((x + 6, label_y), subject["display_name"][:38], fill=INK, font=label_font)
        draw.text((x + 6, label_y + 25), subject["domain_id"][:48], fill=MUTED, font=small_font)
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    output = OUTPUT_ROOT / f"{name}.jpg"
    sheet.save(output, format="JPEG", quality=90, optimize=True)
    return output


def main() -> None:
    inventory = json.loads(INVENTORY_PATH.read_text(encoding="utf-8"))
    outputs = [build_sheet(name, subjects) for name, subjects in groups(inventory["subjects"]).items()]
    print(f"Wrote {len(outputs)} TASK-011 contact sheets.")


if __name__ == "__main__":
    main()
