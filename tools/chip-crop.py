#!/usr/bin/env python3
"""
Cut the colour chips out of a scanned manufacturer brochure.

Pool and plaster brochures arrive as a flat scan - one image per page, no text
layer - so the chips cannot be pulled by position the way a spec book's can.
They can be found by texture instead: an aggregate chip is dense speckle, and
the page behind it is flat colour. Edge density separates the two cleanly.

Usage:
    python3 tools/chip-crop.py <page.png> --out DIR --names "A,B,C,..."

Names are given in reading order, left to right then down, and must match the
number of chips found - the script refuses rather than guessing, because a chip
paired with the wrong name is a colour ordered wrong.
"""
import argparse, os, sys
from PIL import Image, ImageFilter

BLOCK = 8          # texture map resolution
EDGE_MIN = 10      # mean edge energy that counts as "speckled"
MIN_W, MIN_H = 400, 180    # smallest thing that can be a chip, at 300dpi
MAX_W = 700                # and the largest - wider than this is a logo or a photo
ASPECT = (1.8, 3.0)        # chips are wide ovals; the corporate logo is wider
INSET = 0.10       # crop inside the blob, to clear the rounded corners


def texture_map(img):
    g = img.convert("L").filter(ImageFilter.FIND_EDGES)
    w, h = g.size
    small = g.resize((w // BLOCK, h // BLOCK), Image.BOX)   # mean edge per block
    return small


def blobs(small, thresh):
    w, h = small.size
    px = small.load()
    seen = [[False] * h for _ in range(w)]
    out = []
    for sx in range(w):
        for sy in range(h):
            if seen[sx][sy] or px[sx, sy] < thresh:
                continue
            stack, cells = [(sx, sy)], []
            seen[sx][sy] = True
            while stack:
                x, y = stack.pop()
                cells.append((x, y))
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and not seen[nx][ny] and px[nx, ny] >= thresh:
                        seen[nx][ny] = True
                        stack.append((nx, ny))
            xs = [c[0] for c in cells]; ys = [c[1] for c in cells]
            out.append((min(xs), min(ys), max(xs) + 1, max(ys) + 1, len(cells)))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("page")
    ap.add_argument("--out", required=True)
    ap.add_argument("--names", required=True)
    ap.add_argument("--skip-top", type=float, default=0.0,
                    help="ignore this fraction of the page (the hero photo)")
    ap.add_argument("--prefix", default="")
    ap.add_argument("--cols", help="grid mode: left edge of each column, comma separated")
    ap.add_argument("--rows", help="grid mode: top edge of each row, comma separated")
    ap.add_argument("--size", help="grid mode: WxH of one chip")
    args = ap.parse_args()

    names = [n.strip() for n in args.names.split(",")]
    img = Image.open(args.page).convert("RGB")
    W, H = img.size
    top = int(H * args.skip_top)
    body = img.crop((0, top, W, H))

    # Grid mode. A pale chip - White Gem, Petite Silver - has too little speckle
    # to register as texture, so on a page carrying one the grid is given
    # explicitly instead, read off the positions detection did find. A "-" name
    # marks a cell the brochure leaves empty for a logo or a caption.
    if args.cols and args.rows and args.size:
        cw, ch = (int(v) for v in args.size.lower().split("x"))
        cells = [(int(x), int(y)) for y in args.rows.split(",") for x in args.cols.split(",")]
        if len(cells) != len(names):
            print(f"Grid has {len(cells)} cells but got {len(names)} names.", file=sys.stderr)
            return 1
        os.makedirs(args.out, exist_ok=True)
        n = 0
        for name, (x, y) in zip(names, cells):
            if name == "-":
                continue
            chip = img.crop((x, y, x + cw, y + ch))
            slug = "".join(c if c.isalnum() else "-" for c in name.lower()).strip("-")
            while "--" in slug:
                slug = slug.replace("--", "-")
            fn = os.path.join(args.out, f"{args.prefix}{slug}.jpg")
            chip.save(fn, "JPEG", quality=92)
            print(f"{name:<20} {chip.size[0]}x{chip.size[1]}  -> {os.path.basename(fn)}")
            n += 1
        print(f"{n} chips.", file=sys.stderr)
        return 0

    names = [n for n in names if n and n != "-"]
    found = []
    for box in blobs(texture_map(body), EDGE_MIN):
        x0, y0, x1, y1 = [v * BLOCK for v in box[:4]]
        w, h = x1 - x0, y1 - y0
        if w < MIN_W or h < MIN_H or w > MAX_W:
            continue
        if not (ASPECT[0] <= w / h <= ASPECT[1]):
            continue
        found.append((x0, y0 + top, x1, y1 + top))

    # reading order: group into rows, then left to right inside each row
    found.sort(key=lambda b: b[1])
    rows, cur = [], []
    for b in found:
        if cur and b[1] > cur[-1][1] + (cur[-1][3] - cur[-1][1]) * 0.5:
            rows.append(sorted(cur, key=lambda r: r[0])); cur = []
        cur.append(b)
    if cur:
        rows.append(sorted(cur, key=lambda r: r[0]))
    ordered = [b for r in rows for b in r]

    if len(ordered) != len(names):
        print(f"Found {len(ordered)} chips but got {len(names)} names - refusing to "
              f"guess which is which.", file=sys.stderr)
        for i, b in enumerate(ordered):
            print(f"  {i+1}: x{b[0]}-{b[2]} y{b[1]}-{b[3]}  {b[2]-b[0]}x{b[3]-b[1]}",
                  file=sys.stderr)
        return 1

    os.makedirs(args.out, exist_ok=True)
    for name, (x0, y0, x1, y1) in zip(names, ordered):
        dx, dy = int((x1 - x0) * INSET), int((y1 - y0) * INSET)
        chip = img.crop((x0 + dx, y0 + dy, x1 - dx, y1 - dy))
        slug = "".join(c if c.isalnum() else "-" for c in name.lower()).strip("-")
        while "--" in slug:
            slug = slug.replace("--", "-")
        fn = os.path.join(args.out, f"{args.prefix}{slug}.jpg")
        chip.save(fn, "JPEG", quality=92)
        print(f"{name:<20} {chip.size[0]}x{chip.size[1]}  -> {os.path.basename(fn)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
