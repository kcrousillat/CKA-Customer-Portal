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

## Attaching chips

**Attach the chip once, here, on the Palettes row.** Every future job inherits it. Do not attach
chips to a job's Options rows — that work is thrown away when the job closes.

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

Swatch hex values are sampled from the brochure chips and are a fallback tile only — they are not
a color match. The photo is what an owner should be deciding from.

**ES glass tints are missing** — the Prestige brochure carries no tint palette. Get them from the
rep before an ES job reaches the glass decision, or that selection will stay On hold with
"no palette to draw on" in the run history.

## Adding a brand

Nothing in the automation is window-specific. Add rows with a new Brand and a Category, set the
Brand on the manufacturer option, set the Palette category on the selections that wait on it, and
the same machinery works — appliance panel finishes, plumbing trim, garage doors, roof tile.
