# Flooring

Split three ways, on Kevin's call: **wood**, **porcelain**, **natural stone**. In the base those
are Palettes `Category` values, and a category is created when the first product lands in it -
not before, because the health check counts an empty category as a problem and a check that always
reports something is a check nobody reads.

Live today: **Porcelain tile** - 29 colors across two manufacturers. Wood flooring and Natural
stone are named but empty until there is a catalog to put in them.

## Floor tile and wall tile are not siblings

Kevin's rule, and it is the one that decides the shape of the whole catalog:

> **Floor tile can be used for walls. Wall tile can only be used for walls.**

So the two categories are not a pair. One is a superset of the other's uses, which means a
backsplash or shower-wall selection pointing only at `Wall tile` would be hiding two thirds of the
usable stock from the person choosing.

Categories are therefore named by **what the tile can do**, not by what the showroom calls it:

| Category | What is in it | Loaded by |
|---|---|---|
| `Porcelain tile` | Floor-rated. Legal on floors *and* walls. | Flooring selections, and wall selections |
| `Wall tile` | Wall only. | Wall selections, in addition to the above |

### Loading both onto a wall selection

No new machinery needed. **Ticking Load catalog options twice adds nothing twice** - the loader
skips catalog rows already on the selection by name. So on a backsplash:

1. Palette category `Porcelain tile`, tick **Load catalog options**.
2. Change it to `Wall tile`, tick again.

Both loads land on the same selection. Then delete down to the two or three being presented.

Two ticks instead of one. If that becomes a nuisance the field can be made to hold several
categories so one tick pulls both - a change to the loader script and the field type, worth doing
only once the two-tick version has actually annoyed somebody.

### What this rule kept out of the catalog

**Colovers+ white-body wall tile is deliberately not loaded.** Every one of its colors already
exists in the floor-rated porcelain range, and a floor tile goes on a wall - so loading the wall
version would put two rows with the same color name in front of an owner, one of them strictly
less useful. Colovers goes in the flooring catalog only.

INX's white-body wall range is the opposite case: its colors (Loto, Dune, Jasmine, Agave, Plume,
Aqua, Sugar) are nothing like its floor colors (Cement, Grey, White, Pearl, Ivory, Clay), so it
adds seven colors that cannot be had floor-rated. Worth loading. Bricksy likewise - a 2.5"x9.5"
glossy brick has no floor-rated equivalent anywhere in the vendor's book.

**The test is not "is it a wall tile".** It is: *does this add a color the floor-rated catalog
cannot already supply?* If not, it is a duplicate with a worse spec.

### Floor-rated is not the same as right for the floor

Etherea is made in a gloss face. Legal on a floor, and a poor idea on a wet one. The anti-slip
faces are Refin's C2 GRIP and Supergres's R10 B / R11 C, and they sit in Finish options on every
row - so the owner picks a finish alongside the color. Wet-area item descriptions should say the
finish is a slip decision and not only a look.

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
