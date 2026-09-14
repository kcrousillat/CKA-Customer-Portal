#!/usr/bin/env python3
"""
Pull the products out of a Ferguson "Premium Spec Package" PDF.

Ferguson generates these off a bid number, for appliances and for plumbing
alike, and they are the document worth having: the manufacturer's own model
number, the full description, and a product photo. The price quote has none of
that - it has Ferguson's internal SKU and a twenty-character abbreviation.

Usage:
    python3 tools/specbook-extract.py <specbook.pdf> [--images-dir brand/plumbing]

Prints a table of products, and with --images-dir also writes one image per
product named <brand>-<model>-<slug>.<ext>. Commit those, and Airtable can
ingest them straight from raw.githubusercontent into the Palettes Photo field.

How it reads the page: the summary pages are a 2x2 grid of products. Each cell
is a text block holding "Brand\\nModel", one or more description blocks under
it, then the product photo under those. So each photo is matched to the text
directly above it in the same column - position, not reading order, which is
what stops a long description in one cell stealing the next cell's photo.

Only the summary pages are read. The manufacturer sheets that follow are left
alone; they are for the trades, not for the catalog.
"""
import argparse
import os
import re
import sys

try:
    import pymupdf
except ImportError:  # older installs
    import fitz as pymupdf

# The page is 612pt wide and the grid splits down the middle.
COLUMN_SPLIT = 306
# How far above a photo its own text can sit. The gap is ~35pt in practice;
# 120 covers a three-line description without reaching the row above.
TEXT_WINDOW = 120
# Anything this wide is the page background, not a product.
FULL_PAGE_W = 500
# The Ferguson logo, top left of every summary page.
LOGO_BOX = (30, 30)
# Every summary page carries this footer, and no manufacturer sheet does. It is
# what separates the four-up product grid from the 40-odd pages of installation
# drawings behind it - which also hold captioned images, and would otherwise
# come through as products called "Front View" and "Group 1".
SUMMARY_FOOTER = "Images may not match"


def slug(text, limit=48):
    s = re.sub(r"[^a-z0-9]+", "-", (text or "").lower()).strip("-")
    return s[:limit].strip("-")


def product_images(page):
    """Product photos on a summary page, in position order."""
    out = []
    for info in page.get_images(full=True):
        xref = info[0]
        for r in page.get_image_rects(xref):
            if r.width > FULL_PAGE_W and r.height > 700:
                continue  # page background
            if r.x0 < LOGO_BOX[0] and r.y0 < LOGO_BOX[1]:
                continue  # logo
            if r.width < 20 or r.height < 20:
                continue  # rules, spacers
            out.append((xref, r))
    out.sort(key=lambda t: (round(t[1].y0), t[1].x0))
    return out


def products_on_page(page):
    """Every product on one summary page: brand, model, description, image."""
    blocks = [b for b in page.get_text("blocks") if b[4].strip()]
    found = []

    for xref, rect in product_images(page):
        left = rect.x0 < COLUMN_SPLIT
        above = [
            b for b in blocks
            if (b[0] < COLUMN_SPLIT) == left            # same column
            and b[3] <= rect.y0 + 2                     # above the photo
            and b[1] >= rect.y0 - TEXT_WINDOW           # but not the row above
        ]
        if not above:
            continue
        above.sort(key=lambda b: b[1])

        lines = [ln.strip() for ln in above[0][4].strip().split("\n") if ln.strip()]
        if len(lines) < 2:
            # Not a product cell - a stray caption or a footer.
            continue
        brand, model = lines[0], lines[1]
        desc_parts = lines[2:] + [
            " ".join(x.strip() for x in b[4].strip().split("\n") if x.strip())
            for b in above[1:]
        ]
        found.append({
            "brand": brand,
            "model": model,
            "description": " ".join(p for p in desc_parts if p).strip(),
            "xref": xref,
        })
    return found


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("pdf")
    ap.add_argument("--images-dir", help="write one image per product here")
    args = ap.parse_args()

    doc = pymupdf.open(args.pdf)
    if args.images_dir:
        os.makedirs(args.images_dir, exist_ok=True)

    rows, seen = [], set()
    for page in doc:
        if SUMMARY_FOOTER not in page.get_text():
            continue
        for p in products_on_page(page):
            key = (p["brand"], p["model"])
            if key in seen:
                continue          # the same product can appear on two summaries
            seen.add(key)

            if args.images_dir:
                img = doc.extract_image(p["xref"])
                name = "-".join(filter(None, [
                    slug(p["brand"], 24), slug(p["model"], 24), slug(p["description"], 40)
                ])) + "." + img["ext"]
                with open(os.path.join(args.images_dir, name), "wb") as fh:
                    fh.write(img["image"])
                p["image"] = name
            rows.append(p)

    if not rows:
        print("No products found. Is this a Ferguson spec package?", file=sys.stderr)
        return 1

    width = max(len(r["model"]) for r in rows)
    for r in rows:
        print(f'{r["model"]:<{width}}  {r["brand"]}')
        print(f'{"":<{width}}  {r["description"]}')
        if r.get("image"):
            print(f'{"":<{width}}  -> {r["image"]}')
    print(f"\n{len(rows)} products.", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
