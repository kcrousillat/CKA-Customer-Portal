# Mapping a plumbing quote onto the library

Worked from a Ferguson plumbing bid on a real job, 6 Aug 2026 - about 100 line
items across eight rooms. The client, the bid number and the rep are not named
here; this repo is public. The appliance quote
was 13 lines and mapped almost one-to-one. This one does not, and the
differences are the useful part.

## The shape of the document

Plumbing quotes arrive **organised by room**, which is how the portal is
organised too, so the rooms line up almost exactly:

| Quote heading | Room type in the library |
|---|---|
| KITCHEN | Kitchen |
| LIVING ROOM PANTRY | *no such room type* |
| LAUNDRY/PANTRY | Laundry |
| POWDER ROOM | Powder |
| MASTER BATH | Bath (the primary one) |
| BATH #2, BATH #3 | Bath |
| OUTDOOR SHOWER | *no such room type* |

Inside each room the quote declares **one finish** — `SATIN NICKEL`,
`BRUSHED NICKEL`, `LUXE NICKEL` — and then lists everything in it under
sub-headings: `-- FCT`, `-- SINK`, `-- LAV`, `-- W/C`, `-- SHOWER SYSTEM`,
`-- SHOWER DRAIN`, `-- ACCESSORIES`, `-- CABINET PULL`, `-- MIRROR`.

Those sub-headings are close to our item names. `W/C` is the toilet, `FCT` the
faucet, `LAV` the sink.

## One product is several line items

This is the main difference from appliances. A single owner decision routinely
arrives as three to six lines, because the vendor quotes every orderable part:

- **Master bath shower system** is eight lines — shower arm and flange,
  showerhead, handheld, slide bar, valve trim, diverter trim, diverter rough,
  drain. One decision the owner makes; eight things somebody orders.
- **A toilet** is four — bowl, trip lever, supply kit, wax ring.
- **A freestanding tub** is two, and its **filler** is another three.
- **The kitchen sink** is two — the sink package and the disposal flange.

So the rule for reading these: **the sub-heading is the selection; the lines
under it are the order.** Do not make a row per line — that is the "Plumbing
fixtures" mistake in reverse.

## Gaps this quote exposed — all now closed

**1. Garbage disposal & air switch** — new Kitchen item. The description says
the thing that actually bites: an air switch needs a hole drilled in the stone,
so it has to be settled before the countertop is templated.

**2 and 3. Cabinet hardware on Powder, Laundry and Pantry.** No new template -
the Bath one now claims all four room types. A template can belong to several,
so this cost one edit and no duplication.

**4. Freestanding tub filler** — new Bath item, Optional, since only a room
with a freestanding tub has one. Its rough goes in the slab, so the position is
fixed long before the tub arrives.

**5. Plumbing trim finish now covers Kitchen, Powder and Laundry**, not Bath
alone - again by claiming more room types rather than copying the template. It
is the paint pattern applied to metal: one finish per room, everything else in
that room follows it.

**6. The shower system is one selection with four boxes.** "Shower & tub valve"
is now **Shower system**, set to Owner specifies with
`Manufacturer & finish, Showerhead, Handheld on a slide bar, Valve & diverter
trim`. A vendor quotes it as eight lines; the owner is choosing one system, so
it is approved once and the boxes keep the parts distinct. Leaving the handheld
box empty means no handheld.

**7. Shower door pull** — new Bath item, **Optional**, trade Interior glazing.
The glass contractor normally supplies a standard pull with the enclosure, so
this only needs answering when one is specified - which is exactly what the
Optional mechanism is for. It files with the shower enclosure so the approval
covers it, and the description says it should match the bath hardware rather
than the glass.

**8. Mirrors — no change needed, but worth writing down.** Ferguson sells
appliances, plumbing, HVAC and lighting, so the vendor on a quote tells you
nothing about the trade. **Trade is who installs it, not who invoices it.** The
mirrors on this bid came from the plumbing quote and still belong to Interior
glazing.

**9. Two new room types.** **Pantry** (sort 9, painted) for a walk-in or
butler's pantry that is its own room - distinct from the Kitchen's "Pantry
shelving & finish", which is a cupboard. It reuses the Laundry items: cabinet
finish, cabinet hardware, countertop, backsplash, flooring, lighting. Six
items, no new templates.

**Outdoor shower** (sort 16, not painted) - two items, the fixture and a drain,
reusing Bath's Drains. The fixture description leads on material, because 316
stainless is the decision that matters this close to salt air.

## Ask for the plumbing spec book

The appliance spec book gave us manufacturer model numbers, hinge sides, specs
the quote omitted, and a photo per product. **Ferguson generates the same thing
for plumbing** off the same bid number.

Worth one email to the rep, because this quote needs it more than the appliance
one did. The appliance bid had 13 items; this has about 100, and the brands are
nowhere on it — the item codes are Ferguson SKUs again (`K2214-0`,
`TMS624124CEFG01`, `MNOSA225ZBN`), and the same leading-letter rule seems to
apply, but *seems to* is not good enough for something that gets ordered.

With the spec book: real model numbers, brands, and a photo per fixture,
loaded the same way the appliances were.

## Finish codes on this bid

Recorded as observation only, not as fact to order from — the pattern is
consistent across the quote but wants confirming:

    -15S   satin nickel      (kitchen)
    BN / ZBN   brushed nickel    (laundry, powder, baths 2 and 3)
    NK     luxe nickel       (master bath)

The `HD-1` ... `HD-11` tags against the cabinet hardware look like keys back to a
hardware schedule or drawing. Worth asking what they refer to, since they are
how the installer will find which pull goes where.
