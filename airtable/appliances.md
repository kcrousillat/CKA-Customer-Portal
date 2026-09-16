# Appliances

Appliances are not shaped like windows. A window package is one decision with four options;
a kitchen is a dozen decisions, each drawn from a catalog of hundreds, and the list of decisions
itself changes house to house. Three layers handle that.

## 1. The catalog lives in Palettes

Every model CKA might ever spec, one row each, in the same **Palettes** table that holds the
window colors. A row carries what an owner needs to choose (name, photo, MSRP) *and* what the
job needs to build (width, rough-in notes).

| Field | Appliance meaning |
|---|---|
| Name | How the owner sees it — "48\" built-in refrigerator/freezer" |
| Brand | Sub-Zero · Wolf · Cove · Thermador |
| Category | The slot it fills: Built-in refrigerator, Range, Vent hood, Dishwasher… |
| Model | Manufacturer model number, verbatim |
| Width | Nominal width. Drives the cabinet opening |
| Rough-in notes | Fuel, dedicated circuit, venting CFM, water line, drain, panel-ready |
| MSRP | List price. See below |
| Photo | Product shot |
| Product link | Spec sheet |

**Rough-in notes are the reason this pays for CKA rather than only for the owner.** An approved
appliance schedule is the document the cabinet shop and the MEP rough need — which is exactly why
appliances have to be decided in month one though they are delivered in month ten.

## 2. Each appliance is its own selection

Thirteen item templates on the Kitchen space type, one per slot: built-in refrigerator, freezer
column, undercounter refrigeration, range, cooktop, wall ovens, vent hood, microwave / speed oven,
steam oven, warming drawer, coffee system, dishwasher, ice maker, beverage center, wine storage.

A kitchen with a range has no cooktop; a kitchen with two dishwashers gets a second row. Delete
what does not apply and add duplicates where needed — each template's description says which.

**Brands mix.** Sub-Zero refrigeration beside a Wolf range beside a Cove dishwasher is the normal
case, so unlike windows there is no manufacturer decision gating the rest. Every appliance stands
on its own.

## 3. CKA loads a shortlist, the owner picks from it

Thirty refrigerators is not a decision. On a selection, tick **Load catalog options** and the
automation pulls in every catalog row matching its **Palette category** — narrowed to **Catalog
brands** if you set them, all brands if you don't — then unticks itself and writes what it did
into Internal notes. Delete down to the two or three that fit the opening and the budget.

Ticking it twice adds nothing twice: rows already on the selection are skipped by name.

## MSRP

**Collected, not shown.** Keep filling the MSRP column — it is the manufacturer's published list
price and it is worth having. The portal does not publish it: `SHOW_MSRP` in
`worker/src/index.js` is `false`, so the figure never leaves the Worker.

Kevin's call, and a reasonable one — a list price next to a decision invites an owner to go
shopping it, and it is not the number on their contract anyway. The portal already knows how to
render it, labelled and noted as excluding installation, so flipping the flag to `true` and
redeploying is the entire job if that view changes.

Two things that are *not* MSRP and never go in that column: a vendor's **net/trade price** off a
bid, and a retailer's **street or sale price**. Both are lower than list, both move, and the first
is effectively CKA's cost. CKA's own cost never goes in at all.

## Two notes on a catalog row, and only one reaches the owner

**Note** is copied onto the option when the row is loaded into a job, and the
portal shows it to the owner. Owner-facing text only: what the thing is, what
panel-ready means, which way the door swings.

**Internal note** is never read by the loader and never leaves the catalog.
Everything else goes here - which bid a model came from, which client's house
it was first specified for, the rep's name, what still needs confirming.

The rule: **if it names another client, a bid, or a price, it goes in Internal
note.** This is not hypothetical. The first eight appliance rows were written
with bid numbers and another client's job name in Note, and loading one into a
real job would have put that in front of an owner.

Same split elsewhere on the row: **Model** is the manufacturer's model number,
because that is what an owner sees and what gets ordered. A vendor SKU is not a
model - it belongs in Internal note. **Rough-in notes** never reach the option
either; the loader summarises them into the selection's Internal notes, for the
MEP rough and the cabinet shop.

## Hinge

Set **Hinge** on any row with a door that swings. On most undercounter and
column units the hinge is part of the model number - a left-hand unit and a
right-hand unit are two different products, and it cannot be changed on site.
So a catalog row is one hinge, not both; if you stock both, that is two rows.

It carries into the job and the portal shows it, with a standing line telling
the owner the swing is fixed once the order goes in. That is what makes the
approval cover the hinge as well as the appliance.

**The model number usually tells you.** On Sub-Zero the trailing letter is the
hinge: `R` right, `L` left. DEC3650RIDR is right, DEC3650FIL is left,
DEU2450BGL is left. That is not a guess to make on other brands - check the
spec sheet - but where the letter is there, it is the most reliable source,
because it is the thing actually being ordered.

A paired 36 + 36 column run wants opposite hinges so the doors open away from
each other. Getting that backwards is a restock, not an adjustment.

## Ask for the spec book, not just the quote

The price quote is one line per product. The **spec book** - Ferguson's
"Premium Spec Package", generated off the same bid number - is one page per
product with the manufacturer's own model number, a full description, the
product photo and the installation drawings.

It is worth asking for every time. From that job's spec book:

  - **The models have slashes.** `DEC3650RID/R`, `DEC3650FI/L`, `DF48650G/S/P`,
    `DEU2450BG/L`. Ferguson's own SKU strips them. The manufacturer's format is
    the one that belongs in Code.
  - **The hinge is spelled out** - "Panel Ready - Right Hinge". Confirms the
    trailing-letter rule rather than relying on it.
  - **Things the quote does not mention.** The Wolf range has an infrared
    griddle. The freezer column has an ice maker, so it needs its own water
    line - a rough-in the one-line quote would not have told anyone about. The
    hood liner is 22" deep, which the cabinet shop needs.
  - **The photos.** One per product, extractable.

There is a script for it now - `tools/specbook-extract.py`:

    python3 tools/specbook-extract.py <specbook.pdf> --images-dir brand/plumbing

It prints brand, model and description for every product and writes one image
each. Commit those, then write the raw.githubusercontent URL into the Palettes
Photo field - Airtable copies the file on ingest, so nothing is hot-linked.

It matches each photo to the text **directly above it in the same column**
rather than trusting reading order, which is what stops a long description in
one cell claiming the next cell's photo. It reads only the summary pages,
found by their footer - the forty-odd manufacturer sheets behind them also hold
captioned images, and without that filter they arrive as products called
"Front View" and "Group 1".

Checked against the appliance book: 12 products, 12 distinct images, every one
matching what had already been pulled by hand - plus three accessories the hand
pass had skipped.

**The photo may not match what was ordered.** The spec book says so itself, and
the Wolf range proves it: the stock photo shows the red knobs, and this order is
brushed brass. Where that happens, say so in the option's note rather than
leaving an owner to assume.

## Getting the catalog in

Sub-Zero's and Thermador's sites are unreachable from the build environment, so catalog data comes
from the manufacturer design guides and spec books — the same route the PGT and ES palettes took.
Send the PDF and the models, specs, images and MSRP are extracted and loaded in bulk.

## Sections inside a room

A kitchen with every appliance slot runs to twenty-six decisions, which is a wall rather than a
list. In the **By room** view, any room with six or more selections splits under headings —
Appliances, Plumbing, Cabinetry & millwork, Tile & stone, Lighting & electrical — each collapsed
with a count of what it is waiting on.

The heading comes from the trade, so nothing needed backfilling and nothing needs maintaining.
The **Section** field on a selection (or on an item template) overrides it, for the cases where
the trade is not how an owner thinks about the item.

Two rules keep it from hiding things: a section holding anything past due opens by itself, and a
room with only one heading never collapses at all.
