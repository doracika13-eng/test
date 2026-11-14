"""Cut the models out of the concept fronts for the runway section.

Requires: pip install "rembg[cpu]"  (downloads the u2net_human_seg model once)
Usage:    python3 scripts/make_runway_cutouts.py
Output:   public/images/runway/<name>.webp  (RGBA, bottom edge softly faded)
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from rembg import new_session, remove

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "images" / "products"
OUT = ROOT / "public" / "images" / "runway"
OUT.mkdir(parents=True, exist_ok=True)

LOOKS = ["cfm-k01-front", "ess-e01-bone-front", "ess-e01-bordeaux-front", "ess-e01-black-front",
         "ess-l01-front", "ied-001-front", "cfm-t01-front"]

session = new_session("u2net_human_seg")
for name in LOOKS:
    im = Image.open(SRC / f"{name}.jpg").convert("RGB")
    im = im.resize((im.width * 2, im.height * 2), Image.LANCZOS)
    cut = remove(im, session=session, post_process_mask=True)
    # soften matte edge slightly
    r, g, b, a = cut.split()
    a = a.filter(ImageFilter.GaussianBlur(0.8))
    # figures are cropped at the thigh: fade the bottom 10% into the floor
    w, h = a.size
    fade = Image.linear_gradient("L").resize((w, int(h * 0.1)))  # 0 top -> 255 bottom
    fade = fade.point(lambda v: 255 - v)
    mask = Image.new("L", (w, h), 255)
    mask.paste(fade, (0, h - fade.height))
    a = Image.fromarray(np.minimum(np.array(a), np.array(mask)))
    cut = Image.merge("RGBA", (r, g, b, a))
    bbox = cut.getbbox()
    cut = cut.crop((bbox[0], bbox[1], bbox[2], h))  # keep the bottom line
    cut.save(OUT / f"{name}.webp", "WEBP", quality=88, method=6)
    print(name, cut.size)
