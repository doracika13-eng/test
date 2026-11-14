"""Crop the supplied DAMI concept boards (references/*.jpg, extracted from the
Sample Order Brief / Master Tech Pack PDFs) into individual web images.

These are AI-generated concept references, NOT final product photography.
Replace files in public/images/products/ with approved photography when available
(keep the same file names, or update content/catalog.json).

Usage: python3 scripts/extract_references.py
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "references"
OUT = ROOT / "public" / "images" / "products"
OUT.mkdir(parents=True, exist_ok=True)

# board -> {output name: (left, top, right, bottom)}
CROPS = {
    "board-cfm-k01.jpg": {
        "cfm-k01-front": (0, 0, 505, 716),
        "cfm-k01-back": (515, 0, 1010, 716),
        "cfm-k01-detail-chest": (0, 724, 322, 967),
        "cfm-k01-detail-label": (328, 724, 692, 967),
        "cfm-k01-detail-sleeve": (698, 724, 932, 967),
        "cfm-k01-detail-cuff": (938, 724, 1196, 967),
        "cfm-k01-detail-fabric": (1202, 724, 1450, 967),
        "cfm-k01-board": (0, 0, 1450, 967),
    },
    "board-ess-e01.jpg": {
        "ess-e01-bone-front": (40, 0, 372, 492),
        "ess-e01-bordeaux-front": (378, 0, 712, 492),
        "ess-e01-black-front": (716, 0, 1050, 492),
        "ess-e01-bone-back": (40, 495, 372, 967),
        "ess-e01-bordeaux-back": (378, 495, 712, 967),
        "ess-e01-black-back": (716, 495, 1050, 967),
        "ess-e01-detail-fabric": (1092, 437, 1426, 590),
        "ess-e01-detail-sleeve": (1092, 593, 1426, 758),
        "ess-e01-detail-motif": (1092, 762, 1426, 940),
        "ess-e01-board": (0, 0, 1450, 967),
    },
    "board-ess-l01.jpg": {
        "ess-l01-front": (0, 0, 472, 602),
        "ess-l01-back": (474, 0, 892, 602),
        "ess-l01-detail-chevron": (907, 374, 1067, 562),
        "ess-l01-detail-back": (1071, 374, 1262, 562),
        "ess-l01-detail-fabric": (1266, 374, 1425, 562),
        "ess-l01-alternates": (0, 606, 1450, 967),
        "ess-l01-board": (0, 0, 1450, 967),
    },
    "board-ied-001.jpg": {
        "ied-001-front": (0, 0, 398, 556),
        "ied-001-back": (392, 0, 762, 556),
        "ied-001-detail-shoulder": (0, 562, 200, 798),
        "ied-001-detail-rib": (204, 562, 388, 798),
        "ied-001-detail-label": (392, 562, 600, 798),
        "ied-001-detail-hood": (604, 562, 800, 798),
        "ied-001-detail-cuff": (804, 562, 1000, 798),
        "ied-001-board": (0, 0, 1000, 1000),
    },
    "board-cfm-t01.jpg": {
        "cfm-t01-front": (0, 0, 505, 672),
        "cfm-t01-back": (505, 0, 962, 672),
        "cfm-t01-detail-print": (0, 678, 336, 967),
        "cfm-t01-detail-label": (340, 678, 760, 967),
        "cfm-t01-detail-sleeve": (765, 678, 1082, 967),
        "cfm-t01-detail-fabric": (1086, 678, 1450, 967),
        "cfm-t01-board": (0, 0, 1450, 967),
    },
}

for board, crops in CROPS.items():
    img = Image.open(SRC / board).convert("RGB")
    for name, box in crops.items():
        img.crop(box).save(OUT / f"{name}.jpg", quality=90, optimize=True, progressive=True)
        print("wrote", name)
