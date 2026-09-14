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

44 rows: 36 window and door options, 8 appliances. Every one of them is a product that could be
offered to the next client.

Swatch hex values are sampled from the brochure chips and are a fallback tile only — they are not
a color match. The photo is what an owner should be deciding from.

**ES glass tints are missing** — the Prestige brochure carries no tint palette. Get them from the
rep before an ES job reaches the glass decision, or that selection will stay On hold with
"no palette to draw on" in the run history.

## Adding a brand

Nothing in the automation is window-specific. Add rows with a new Brand and a Category, set the
Brand on the manufacturer option, set the Palette category on the selections that wait on it, and
the same machinery works — appliance panel finishes, plumbing trim, garage doors, roof tile.
