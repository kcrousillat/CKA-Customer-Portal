#!/usr/bin/env python3
"""
Pull the product photos out of a designer's spec book PDF.

Designers send these per job, and they are the best source of product imagery we
get: one photo per specified item, already cropped, already on white. The vendor
quote has none, and the manufacturer sheets behind a Ferguson package are
installation drawings, not product shots.

Usage:
    python3 tools/designer-specbook-images.py <specbook.pdf> --out brand/plumbing

How it reads the page: each room board is a loose grid of product cards. A card
is a caption block that opens with the designer's tag - PL-1, AP-9, HD-7, SDH-2
- and its photo sits directly ABOVE it in the same column. So each caption is
matched to the nearest image whose bottom edge is above the caption and whose
left edge is within COLUMN_SLOP of it. Position, not reading order.

Matching to captions is also what keeps the client's house out of the export.
These books carry room renderings and elevations; those have no tagged caption
above them, so they are never picked up. Only products come through.

Files are named <tag>-<brand>-<model>.<ext> so a row in Palettes can be found
from its Spec tag, and so re-running overwrites rather than duplicates.
"""
import argparse, os, re, sys
try:
    import pymupdf
except ImportError:
    import fitz as pymupdf

# A caption opens with the designer's tag: "PL-1: Kitchen Faucet Qty.1"
TAG = re.compile(r"^([A-Z]{1,3}-\d{1,3}):\s*(.*)")
# How far the photo's left edge may sit from its caption's. Measured spread is
# under 30pt; 45 covers a wide photo over a narrow caption without reaching the
# next column, whose gutter is ~250pt.
COLUMN_SLOP = 45
# A photo can sit this far above its caption. Cards run ~190pt tall in practice.
ABOVE_WINDOW = 320
# Anything smaller is a rule, a bullet or a logo.
MIN_SIDE = 60


def slug(text, limit=40):
    s = re.sub(r"[^a-z0-9]+", "-", (text or "").lower()).strip("-")
    return s[:limit].strip("-")


def images_on(page):
    out = []
    for info in page.get_images(full=True):
        for r in page.get_image_rects(info[0]):
            if r.width >= MIN_SIDE and r.height >= MIN_SIDE:
                out.append((info[0], r))
    return out


def products_on(page):
    imgs = images_on(page)
    used = set()
    found = []
    for b in page.get_text("blocks"):
        lines = [l.strip() for l in b[4].strip().split("\n") if l.strip()]
        if not lines:
            continue
        m = TAG.match(lines[0])
        if not m:
            continue
        tag = m.group(1)
        # Line 2 is "Brand Model name"; a "#CODE" line follows on most cards.
        desc = lines[1] if len(lines) > 1 else m.group(2)
        code = next((l.lstrip("#").strip() for l in lines if l.startswith("#")), "")

        best = None
        for xref, r in imgs:
            if xref in used:
                continue
            if abs(r.x0 - b[0]) > COLUMN_SLOP:
                continue
            gap = b[1] - r.y1
            if gap < -4 or gap > ABOVE_WINDOW:
                continue
            if best is None or gap < best[0]:
                best = (gap, xref)
        if best:
            used.add(best[1])
            found.append({"tag": tag, "desc": desc, "code": code, "xref": best[1]})
    return found


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("pdf")
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    doc = pymupdf.open(args.pdf)
    os.makedirs(args.out, exist_ok=True)
    rows, seen = [], set()
    for page in doc:
        for p in products_on(page):
            key = (p["tag"], p["code"])
            if key in seen:
                continue
            seen.add(key)
            img = doc.extract_image(p["xref"])
            name = "-".join(filter(None, [
                p["tag"].lower(), slug(p["code"], 24), slug(p["desc"], 40)
            ])) + "." + img["ext"]
            with open(os.path.join(args.out, name), "wb") as fh:
                fh.write(img["image"])
            p["file"] = name
            rows.append(p)

    for r in rows:
        print(f'{r["tag"]:<7} {r["code"]:<22} {r["desc"][:52]:<52} -> {r["file"]}')
    print(f"\n{len(rows)} products with photos.", file=sys.stderr)
    return 0 if rows else 1


if __name__ == "__main__":
    sys.exit(main())
