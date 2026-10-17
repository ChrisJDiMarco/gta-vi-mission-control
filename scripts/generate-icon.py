#!/usr/bin/env python3
from pathlib import Path
import subprocess

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
RESOURCES = ROOT / "resources"
ICONSET = RESOURCES / "icon.iconset"
SOURCE = RESOURCES / "icon-source.png"
ICNS = RESOURCES / "icon.icns"


def build_iconset():
    if not SOURCE.exists():
        raise SystemExit(f"missing {SOURCE}; generate or copy a 1024px+ PNG first")

    ICONSET.mkdir(parents=True, exist_ok=True)
    source = Image.open(SOURCE).convert("RGBA")
    side = min(source.size)
    left = (source.width - side) // 2
    top = (source.height - side) // 2
    square = source.crop((left, top, left + side, top + side))

    sizes = {
        "icon_16x16.png": 16,
        "icon_16x16@2x.png": 32,
        "icon_32x32.png": 32,
        "icon_32x32@2x.png": 64,
        "icon_128x128.png": 128,
        "icon_128x128@2x.png": 256,
        "icon_256x256.png": 256,
        "icon_256x256@2x.png": 512,
        "icon_512x512.png": 512,
        "icon_512x512@2x.png": 1024,
    }
    for name, size in sizes.items():
        square.resize((size, size), Image.Resampling.LANCZOS).save(ICONSET / name)

    subprocess.run(["iconutil", "-c", "icns", str(ICONSET), "-o", str(ICNS)], check=True)


if __name__ == "__main__":
    RESOURCES.mkdir(parents=True, exist_ok=True)
    build_iconset()
    print(f"wrote {ICNS}")
