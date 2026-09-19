# Flooring

Split three ways, on Kevin's call: **wood**, **porcelain**, **natural stone**. In the base those
are Palettes `Category` values, and a category is created when the first product lands in it -
not before, because the health check counts an empty category as a problem and a check that always
reports something is a check nobody reads.

Live today: **Porcelain tile** - 29 colors across two manufacturers. Wood flooring and Natural
stone are named but empty until there is a catalog to put in them.

## The category goes on the selection, not the library item

Tempting to set `Palette category` on the Flooring item template once and be done. Don't. The next
house does wood where this one does porcelain, and the template is shared by every job forever.

So the flooring templates leave it empty, and it is set on the **selection**, per job, once the
family is settled. Then tick **Load catalog options** and the list arrives.

## What the five vendor catalogs actually are

All five are **Supergres** - one Italian manufacturer, five collections. None is wood. None is
natural stone. Every one is porcelain, including Moonlit, which is a stone *look* and is still
porcelain. Filed accordingly.

| Collection | Colors | What it is | Flooring? |
|---|---|---|---|
| **Moonlit** | 5 | Porcelain, stone look. Up to 48"x48", plus a 20mm outdoor paver | Yes |
| **Kave** | 3 | Porcelain, large slabs, indoor and outdoor | Yes |
| **INX** | 6 | Porcelain, concrete look - **plus a separate white-body wall tile range** | Yes, in part |
| **Colovers+** | 15 | Mostly white-body **wall** tile, with a porcelain floor range and a 20mm outdoor | In part |
| **Bricksy** | 8 | 6x24cm (2.5"x9.5") glossy brick-format - a **wall** tile | No |

Bricksy is not a floor. Loading it into a flooring list would put a wall tile in front of an owner
choosing what they walk on. When it goes in, it goes in as wall tile.

## Moonlit, loaded

Five rows, one per color, chips cropped from the catalog's own "Colori" page where the
manufacturer prints the names: **Moon Greige, Moon Pearl, Moon Sand, Moon White, Moon Red**.

**Moon Red is not a floor.** It appears only in the R11 C 8.5mm 22,5x45,3 group - not in the 9mm
floor sizes, not in the grid face, not in the 20mm outdoor range. Its owner-facing note says so,
because at 220px an owner will look at that terracotta and want it.

Not filled in, deliberately:

- **Supplier** - the vendor's name. Brand is the manufacturer (Supergres); Supplier is who CKA
  buys from, and it is what the portal prints under the option name to tell two products apart.
  Empty until the name is confirmed.
- **Code** - the catalog prints no SKU codes. Empty rather than invented.
- **MSRP** - not published in these catalogs.

## Refin - Eras, Etherea, Ink, Moon (24 colors)

A second manufacturer, bought through the same vendor.

| Collection | Colors | Sizes | Shade variation |
|---|---|---|---|
| **Eras** | 6 - White, Grey, Black, Ivory, Sand, Greige | 48x48, 24x48, 24x24, 12x24; matt or C2 GRIP | V3 moderate |
| **Etherea** | 5 - White, Perle, Grey, Ivory, Sand | 48x48 and 30x60 matt or gloss; 32x32, 24x48, 24x24, 12x24 matt; 48x110 slab | V2 slight |
| **Ink** | 8 - Pure, Grace, Bold, Wavy, Cozy, Earthy, Blush, Quiet | 32x32 only, matt | V3 moderate |
| **Moon** | 5 - Shine, Glow, Twilight, Eclipse, Dark | 48x48, 32x32, 24x48, 24x24, 12x24; 48x110 slab | V4 substantial |

**Shade variation is in the owner-facing note on purpose.** V4 means one tile differs substantially
from the next. An owner who picks Moon off a single 220px chip and then sees the floor laid has a
complaint; an owner told "expect real variety from tile to tile" does not.

**Refin's Moon and Supergres's Moonlit are different collections from different manufacturers.**
Supplier is what tells them apart on the option card.

Ink is one size and one finish - 32"x32" matt, nothing else. Its Finish options are left empty
rather than offering a choice that does not exist.

Moon's range page lists sizes but never names a finish, so Finish is empty on those five rows.
Empty and honest beats "Matt" and guessed.

## The vendor is not the supplier

CKA buys this through **Tile Jungle**. That name lives in **Internal note** and nowhere else.

`Supplier` carries the **manufacturer** - Supergres, Refin - because Supplier is the field the
portal prints under the option name, and the manufacturer is what an owner should be reading on
their approval. It is also what an installer needs. The vendor is CKA's commercial relationship
and is not the owner's business.

## Never put the price list in

The vendor pricing is the reason this vendor is preferred. It does not go in the base and it
absolutely does not go in this repo, which is public. Photos, model numbers, sizes, finishes and
MSRP are fine. A dealer price list is not.
