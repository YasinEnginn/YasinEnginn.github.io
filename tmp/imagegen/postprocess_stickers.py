from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image


def save_webp_under_limit(image: Image.Image, output: Path, limit: int) -> int:
    for quality in range(90, 34, -5):
        image.save(output, "WEBP", quality=quality, method=6, exact=True)
        if output.stat().st_size <= limit:
            return quality
    raise RuntimeError(f"Could not compress {output.name} below {limit} bytes")


def validate_transparency(image: Image.Image, name: str) -> dict[str, object]:
    if image.mode != "RGBA":
        raise RuntimeError(f"{name}: expected RGBA, got {image.mode}")
    alpha = image.getchannel("A")
    corners = [alpha.getpixel((0, 0)), alpha.getpixel((511, 0)), alpha.getpixel((0, 511)), alpha.getpixel((511, 511))]
    if any(corner != 0 for corner in corners):
        raise RuntimeError(f"{name}: corners are not transparent: {corners}")
    nonzero = alpha.point(lambda value: 255 if value else 0)
    coverage = sum(nonzero.histogram()[1:]) / (image.width * image.height)
    if not 0.08 <= coverage <= 0.90:
        raise RuntimeError(f"{name}: implausible subject coverage {coverage:.3f}")
    return {"coverage": round(coverage, 4), "alpha_corners": corners}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-dir", type=Path, required=True)
    parser.add_argument("--png-dir", type=Path, required=True)
    parser.add_argument("--webp-dir", type=Path, required=True)
    parser.add_argument("--tray-source", type=Path, required=True)
    parser.add_argument("--tray-out", type=Path, required=True)
    args = parser.parse_args()

    args.png_dir.mkdir(parents=True, exist_ok=True)
    args.webp_dir.mkdir(parents=True, exist_ok=True)
    summary: list[dict[str, object]] = []

    for source in sorted(args.input_dir.glob("[0-9][0-9]-*.png")):
        image = Image.open(source).convert("RGBA").resize((512, 512), Image.Resampling.LANCZOS)
        validation = validate_transparency(image, source.name)
        png_path = args.png_dir / source.name
        webp_path = args.webp_dir / f"{source.stem}.webp"
        image.save(png_path, "PNG", optimize=True)
        quality = save_webp_under_limit(image, webp_path, 100_000)
        summary.append({
            "file": webp_path.name,
            "size": webp_path.stat().st_size,
            "quality": quality,
            **validation,
        })

    if len(summary) != 12:
        raise RuntimeError(f"Expected 12 stickers, found {len(summary)}")

    tray = Image.open(args.tray_source).convert("RGBA").resize((96, 96), Image.Resampling.LANCZOS)
    args.tray_out.parent.mkdir(parents=True, exist_ok=True)
    tray.save(args.tray_out, "PNG", optimize=True)
    if args.tray_out.stat().st_size > 50_000:
        raise RuntimeError(f"Tray icon exceeds 50 KB: {args.tray_out.stat().st_size}")

    print(json.dumps({
        "stickers": summary,
        "tray_icon": {"file": args.tray_out.name, "size": args.tray_out.stat().st_size},
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
