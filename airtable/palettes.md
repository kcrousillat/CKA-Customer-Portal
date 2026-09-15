# Palettes — brand option libraries

One table, every brand, every job. A palette row is written once and copied into a job's
Selections automatically when that brand is approved.

## Why it exists

Before this, loading a window color palette meant someone typing four to seven option rows by
hand and dragging four to seven chips in — per job, and differently depending on which
manufacturer won. That is the kind of work that gets skipped on a busy Tuesday, and a skipped
palette means an owner choosing from the wrong brand's colors.

## How a row flows into a job

1. An **Option** on a manufacturer selection carries a **Brand** (`PGT`, `ES Windows`).
2. A **Selection** that waits on it carries **Depends on** (the manufacturer selection) and a
   **Palette category** (`Frame color`, `Glass tint`, `Grid style`, `Door hardware style`…).
3. When the owner approves the manufacturer, the *Unlock dependent selections* automation reads
   the brand off the approved option, finds every active Palettes row with that brand and
   category, copies them in as Options — name, supplier, model, finish, code, note, link,
   swatch **and the chip photo** — and flips the selection to *Options presented*.

A selection that already has options is left alone: it is only ever opened, never refilled. A
selection with no palette to draw on stays On hold and the run history says so by name.

## Options that carry a finish

Some options are a style *and* a finish, and the finishes are not the same for every style —
PGT's Curved sliding door handle comes in three finishes, Raised in five, and Modern only on the
narrow-stile door. Put the offered finishes in **Finish options** as a comma-separated list and
the portal shows them as a second choice under the style the owner picked, refusing to approve
until both are answered. The chosen finish is written to the selection's **Owner finish** and
appears in the approval stamp, the email and the record PDF.

Leave **Finish options** empty for anything with no variants — a frame color is just a color.

## Attaching chips

**Attach the chip once, here, on the Palettes row.** Every future job inherits it. Do not attach
chips to a job's Options rows — that work is thrown away when the job closes.

## What belongs in here, and what does not

**A catalog row is something you would put in front of another client.** That is the whole
test, and it is worth applying every time, because the failure is slow: a catalog nobody
pruned turns into a junk drawer, and then nobody trusts it enough to pick from it.

The Newport Brass Chesterfield faucet, yes. The wax ring, no. The Sub-Zero column, yes. The
supply kit that comes in the box with it, no.

A vendor quote will not make this distinction for you — it lists every orderable part, because
somebody has to order every part. A toilet arrives as four lines: bowl, trip lever, supply kit,
wax ring. The master bath shower system is eight. **The consumables and the parts came with the
decision; they were not the decision.** Only the thing the owner chose belongs here.

Two more that fail the test even though they are real products:

- **Anything specified once for one house** — a custom size, a one-off finish match. It will
  never be offered again, so it is a job record, not a catalog row.
- **Anything we have not verified.** A row with a guessed color code is worse than no row,
  because the next person assumes it was checked. Leave it out and say so.

Nothing automatic enforces this. The health check tests structure — that rows point at things
that exist — and cannot tell a faucet from a wax ring. This one is judgement, on the way in.

## What is loaded now

| Brand | Category | Rows |
|---|---|---|
| PGT | Frame color | 4 |
| PGT | Glass tint | 7 |
| PGT | Grid style | 3 |
| PGT | Door hardware style | 5 |
| ES Windows | Frame color | 6 |
| ES Windows | Woodgrain finish | 7 |
| ES Windows | Hardware finish | 4 |
| Sub-Zero | Built-in refrigerator, Freezer column, Beverage center | 3 |
| Wolf | Range, Vent hood | 2 |
| Cove | Dishwasher | 1 |
| Sharp | Microwave / speed oven | 1 |
| LG | Washer & dryer | 1 |
| Brizo, Pfister, Newport Brass, American Standard, Kohler, Toto, Miseno, Elkay, InSinkErator, Wyndham Collection, Infinity Drain, Signature Hardware, Outdoor Shower Company | plumbing fixtures and bath accessories | 38 |
| Emtek, Sietto, Alno | cabinet, door and shower-door hardware | 7 |
| Trustile | Interior door | 1 |
| Visual Comfort, Millennium Lighting, Hinkley, Quorum, Modern Forms | Pendant, Sconce, Chandelier | 6 |
| Shades of Light, Kohler, Robern | Mirror | 3 |
| Sherwin Williams | Paint color | 6 |
| Mapei | Grout | 4 |
| Florida Stucco | Pool finish | 28 |

144 rows: 36 window and door options, 8 appliances, 65 from a designer's spec book. Every one of
them is a product that could be offered to the next client.

## Chips out of a scanned brochure

A pool or plaster brochure arrives as a **flat scan** - one image per page, no text layer - so
neither of the other extractors works on it. `tools/chip-crop.py` finds chips by texture instead:
an aggregate chip is dense speckle and the page behind it is flat color, which separates them
cleanly.

Two things it does on purpose:

- **It refuses when the count is wrong.** Given names and finding a different number of chips, it
  prints what it found and stops. A chip paired with the wrong name is a color ordered wrong, and
  that is the one failure here worth being loud about.
- **It takes an explicit grid when detection is not enough.** A pale chip - White Gem, Petite
  Silver - has too little speckle to register, so on those pages the grid is passed in, read off
  the positions detection did find.

Then **look at the crops before loading them.** A labelled contact sheet of all 28 caught two real
faults the counts could not: the first pass was cropping low enough to catch the brochure's own
printed caption inside the chip, and the Pearl crops came out at inconsistent sizes.

**These chips are photographs of printed paper, twice removed from the product.** Florida Stucco's
own brochure says "actual finishes may vary slightly from the printing process of the actual
sample." They narrow a choice; they never settle one. A pool finish also shifts hard between dry,
wet and under four feet of water, and none of that survives a chip - which is why the Pool finish
item's description tells the owner to look at a real sample outdoors and wet.

One more reason not to trust the web here: a search for this same color list returned **thirteen**
names, including a "Double Sky Blue" and an "Azure" that are nowhere in the brochure. The brochure
has eleven.

## A new brand needs teaching to Options too

The catalog loader is an Airtable script, and **the scripting API has no typecast**: it cannot
write a Brand the Options table has not already been taught. A catalog row carrying an unknown
brand loads in blank.

There is no way to add a select choice through the schema API either. The way that works is to
write one throwaway Options row carrying the new brand with typecast on, then delete the row - the
choice stays. Two API calls however many brands there are.

The health check's "Brands in the catalog that Options does not have" is the tripwire for this,
and it earns its place: it caught Top Knobs and Proflo minutes after they were added, because they
arrived after the batch that taught Options the other 26.

## Category names have to match the library, exactly

A catalog row's **Category** and a library item's **Palette category** are joined by the literal
text. There is no mapping table and no fuzzy match: "Bath faucet" and "Faucet" are two different
categories, and a selection asking for one will not see rows filed under the other.

This is a quiet failure, not a loud one. "Load catalog options" finds nothing, unticks itself and
reports success. The selection just sits there with no options, and nothing says why.

It happened on 14 Sep, an hour after the designer's spec book went in: 65 rows arrived under
invented names - Bath faucet, Bath sink, Shower drain, Shower system - while the library had been
calling those Faucet, Sink, Drain and Valve & trim all along. Fifteen rows were unreachable. The
health check found it on its first real run, under "palette categories with no catalog rows yet",
which is the same fault seen from the library's end.

**So: before adding a category, open Item Templates and read what the Palette category dropdown
already offers.** Reuse the name if one fits. Invent one only when nothing does - and then set it
on the template too, or the rows have nothing to load into.

Two exceptions were kept on purpose. **Kitchen faucet** and **Kitchen sink** are deliberately not
folded into Faucet and Sink: the library's Faucet serves Bath, Powder and Laundry, and a pull-down
kitchen faucet has no business appearing in a powder room. Those two wait for the kitchen
templates to point at them.

## Where this survives, and where it does not

Worth being explicit, because the answer is different per table.

**Survives everything.** Palettes and Item Templates are base-level - they belong to CKA, not to a
job. Delete a project and they are untouched. This is the catalog, and it is the only part of the
base that gets better with every job.

**Dies with the job.** Selections and Options are per-project. They are the record of what one
owner chose. When a job closes they go with it, which is correct - and it is exactly why a product
worth offering again has to be written into Palettes and not left sitting on a job's Options row.

**Never existed unless someone wrote it down.** Anything said in conversation and not put into a
table or a file in this repo is gone. That is what the docs in this folder are for.

**Not in either.** The source PDFs - vendor quotes, designer schedules, spec books - are not in
this repo and must not be, because it is public and they carry client names, addresses and trade
pricing. They need a home in CKA's own file storage. The extracted product data is safe here
(`catalog/designer-spec-products.csv`); the documents themselves are not.

## Transcribing a designer's spec book

`catalog/designer-spec-products.csv` is the flat record of the 65 products above, with the
"Needs confirming" column carrying anything that could not be read cleanly. Four rows are flagged:
two toilets whose model line was not legible in the PDF, a Hinkley sconce with no readable number,
and an Alno shower pull where the printed model and the printed link disagree with each other.
Those are **left as flags, not resolved by guessing** - the Internal note on each Palettes row says
so, and the answer comes from the designer or the rep.

What did not get catalogued, and why: the tile and slab lines (`T-1 Ink Bubble Beeswax Gold
Natural`, `SL-2 Vino Merry Nori Black Polished`) name a pattern and a size but no manufacturer.
They read like a stone yard's own names. Without a manufacturer there is nothing to order from, so
they are not catalog rows yet - ask the designer which supplier they came from.

**The designer's drawings carry a copyright notice**: her information and design are not to be
copied to other projects. That covers her scheme - the combination, the drawings, the room-by-room
palette. It does not cover the fact that Brizo makes an 87476-NK showerhead in Brilliance Luxe
Nickel; that is public manufacturer data, and each row here links to the manufacturer's own page.
So: catalog the products, never re-use her scheme as a package.

Swatch hex values are sampled from the brochure chips and are a fallback tile only — they are not
a color match. The photo is what an owner should be deciding from.

**ES glass tints are missing** — the Prestige brochure carries no tint palette. Get them from the
rep before an ES job reaches the glass decision, or that selection will stay On hold with
"no palette to draw on" in the run history.

## Adding a brand

Nothing in the automation is window-specific. Add rows with a new Brand and a Category, set the
Brand on the manufacturer option, set the Palette category on the selections that wait on it, and
the same machinery works — appliance panel finishes, plumbing trim, garage doors, roof tile.
