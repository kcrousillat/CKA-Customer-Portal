# Flooring

Split three ways, on Kevin's call: **wood**, **porcelain**, **natural stone**. In the base those
are Palettes `Category` values, and a category is created when the first product lands in it -
not before, because the health check counts an empty category as a problem and a check that always
reports something is a check nobody reads.

Live today: **Porcelain tile**. Wood flooring and Natural stone are named but empty until there is
a catalog to put in them.

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

## Never put the price list in

The vendor pricing is the reason this vendor is preferred. It does not go in the base and it
absolutely does not go in this repo, which is public. Photos, model numbers, sizes, finishes and
MSRP are fine. A dealer price list is not.
