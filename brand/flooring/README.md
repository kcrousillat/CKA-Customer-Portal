# Flooring chips

Cut from the manufacturer's own catalog and committed so Airtable can ingest
them into the Palettes `Photo` field. Airtable copies an image on ingest, so
nothing here stays hot-linked.

## Supergres — Moonlit (5 colors)

Porcelain, stone look. Cropped from the catalog's "Colori" page, where the five
round chips carry the manufacturer's own names — **Moon Greige, Moon Pearl,
Moon Sand, Moon White, Moon Red**. Each chip is paired to the label directly
beneath it in the same column, and the crop refuses to run unless the chip count
and the name count match: a chip under the wrong name is a floor ordered wrong.

The crop is the square inscribed in the round chip, so it is the material with
no white corners — which is also what the portal's square photo tile wants.

Verified on a labelled contact sheet before committing, not by eye on the page.

## Refin — Eras, Etherea, Ink, Moon (24 colors)

Porcelain. Cropped from each catalog's "The complete range" page, where the colour names sit
directly above their chips in one row. Paired left to right after asserting that the number of
names, the number of chips and the number of distinct names all agree, and that no chip drifts
more than 90pt from its name.

- **Eras** (6) - White, Grey, Black, Ivory, Sand, Greige
- **Etherea** (5) - White, Perle, Grey, Ivory, Sand
- **Ink** (8) - Pure, Grace, Bold, Wavy, Cozy, Earthy, Blush, Quiet
- **Moon** (5) - Shine, Glow, Twilight, Eclipse, Dark

Eras, Etherea and Moon print their chips as **circles on a transparent background**, which renders
with black corners. Those are cropped to the square inscribed in the circle; Ink's chips are
already square and are cropped with a 3% inset. The script detects which it is from the corner
pixels rather than being told, and asserts afterwards that no crop still has dark corners - the
first pass shipped black-cornered chips and only the contact sheet caught it.

Refin's **Moon** and Supergres's **Moonlit** are different collections from different
manufacturers. Supplier on the catalog row is what tells them apart in the portal.
