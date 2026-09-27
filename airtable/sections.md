# The portal's headings

The owner sees the selections for a room grouped under headings — Appliances, Plumbing
Fixtures, Countertops, and so on. Those headings are rows in the **Sections** table, and
the portal reads them live. Rename one, or change its Sort order, and every job picks it
up on the next page load. No deploy, no rebuild of any room.

## How a line finds its heading

Two routes, and the first one that answers wins:

1. **The line's own `Section` cell.** If it is filled in, that is the heading, full stop.
2. **Its Trade.** Each Trade in the Trades table points at one Section. A line with no
   `Section` of its own files under whichever heading claims its trade.

Most lines take route 2 — that is the point of the trades. Route 1 is for the cases where
one trade needs to split across two headings.

> The text in a `Section` cell has to match a Sections row **name exactly**. A typo fails
> silently: the line just disappears from the room. The morning base check catches it, but
> it is worth reading back after any change here.

`Section` exists in two places and they are not the same field:

- **Item Templates → Section** decides where *future* rooms put the line.
- **Selections → Section** decides where *this job's* line sits right now.

Section is copied onto a selection when the room is built, so changing the template alone
does nothing to a job that already exists. Both have to be set. (Trade → Section
re-pointing and Section renames are the exceptions — those are read live.)

## The headings that exist only through overrides

Two headings claim no trade at all. Nothing lands in them by accident; a line gets there
only by naming them in its own `Section` cell.

**Glass & mirrors.** Shower enclosures and mirrors are the Interior glazing trade, which
already points here — so that one is really route 2. It is listed because the *Glazing*
trade still points at Exterior Doors & Windows, which is where the window and door package
belongs. Same material, two very different conversations.

**Countertops.** Split out of Tile & stone on 27 Sep, because that is how CKA cost-codes a
pay application: countertops are their own line there, not part of tile and stone. The
Stone trade still points at Tile & stone — stone flooring and stone tile belong there — so
the countertop lines carry an override each.

Nine templates carry it, and every live selection built from them was updated at the same
time:

| Template | Room | Line |
|---|---|---|
| `recyaL6SiirsmwuPr` | Kitchen | Countertop slab |
| `recqkaLzcZkb9DyLh` | Bar | Countertop |
| `recVAi7rcicDF6nWZ` | Bath | Vanity top |
| `recNST89X89TC8TA7` | Powder | Vanity top |
| `recKlXqLgX3uOukbq` | Laundry + Pantry | Countertop |
| `recRMJyTRzo1KKd5D` | Outdoor kitchen | Countertop |
| `recJ1pmfctS94nL81` | Kitchen | Backsplash |
| `rechSaJL2lyTQGlsR` | Bar | Backsplash |
| `reclZAKUUfqJbRhKL` | Laundry + Pantry | Backsplash |

**Vanity tops are countertops.** Kevin's call: that is where the budget money falls, and
that is how it reads on both the estimate and the pay app. Same fabricator, same slab,
templated and installed on the same trip as the kitchen counter.

**Backsplash is not a tile line.** Renamed from "Backsplash tile", because a backsplash is
as often a slab of the countertop stone as it is tile, and the old name was pre-deciding
the material. It codes with countertops because a slab backsplash is cut from the counter's
own slab and has to be ordered with it, while there is still slab left.

One rough edge worth knowing: the backsplash lines still carry the **Tile** trade, so the
portal's "By trade" view files them under Tile. That is a guess either way until the owner
picks the material, and there is no "tile or stone" trade to point at. Left as Tile.

**Tread & riser material** (Stair, `recBLkka72MVbscqg`) is Stone trade and currently
inactive, so it was left alone. If it is ever switched back on, decide then whether stair
treads code as countertop or as tile and stone — the answer is not obvious and it should
follow the pay app, not this file.

## Adding a heading

1. New row in Sections: a name, and a Sort order that puts it where you want it. The
   portal lists headings in Sort order.
2. Claim a trade only if *every* line of that trade belongs under it. Otherwise leave
   Trades empty and set `Section` on the individual templates.
3. Set the same `Section` on the live selections of any job already built.
4. Read it back, and let the morning base check run once.
