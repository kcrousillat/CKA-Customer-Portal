# The Exterior space type

Added 8 Oct, because the library had no home for a garage sconce.

## Why it is a room and not a Whole house item

Every lighting item was interior except `Landscape lighting` and `Recessed
lighting`, both parked on Whole house. Nothing covered the fixtures you see from
the driveway — entry sconces, garage lanterns, soffit downlights.

Whole house was the obvious place to put them and the wrong one:

- **CKA already thinks this way.** The Owner Selections Sheet has Interior /
  Exterior as its first column.
- **Whole house was becoming a drawer.** Landscape lighting, stucco, roof tile,
  driveway, exterior paint and exterior door hardware are all in there because
  there was nowhere better, not because they belong together.
- **An owner deciding on entry sconces is standing somewhere.** The portal is
  organised the way you walk the house. "Exterior" is a place; "Whole house" is
  a filing decision.
- **The dates would have been incoherent.** Exterior light fixtures are Group 2,
  interior are Group 3. Mixing them in one room puts two different deadlines
  under one heading.

`Space type` = **Exterior** (`recW2uvXIMByxrQ7w`), sort order 15.

`Paint row` is deliberately **unticked**. Exterior paint is already its own
library item; ticking it would generate a second one.

The outdoor cluster was renumbered to let Exterior lead it rather than land
last after Floor / level: Outdoor kitchen 16, Pool 17, Outdoor shower 18,
Garage 19, Floor / level 20.

## What it covers

The house itself — entry, garage doors, soffits, the walls and whatever is
mounted on them. **Not** the yard, which is landscape, and not the outdoor rooms,
which have their own types: Outdoor kitchen, Pool, Outdoor shower.

## The three items

All owner-specifies, trade Lighting, **Group 2** (60 days from construction
start — the same round as the other exterior fixtures).

| Item | Lead | Owner boxes |
| --- | --- | --- |
| Exterior decorative lighting | 10 wk | Manufacturer, Model number, Finish, Lamp color temperature |
| Soffit and eave lighting | 8 wk | Manufacturer, Model number, Size, Finish |
| Address and path lighting | 6 wk | Manufacturer, Model number, Finish, Numeral style |

Leads match the interior equivalents: decorative 10, recessed 8, landscape 6.

The descriptions carry the two things that are different outside — **wet versus
damp rating**, and that **salt air eats plated finishes**, so solid brass and
copper weather rather than peel. Neither is a manufacturer claim; both are why
the decision is not the same one as indoors.

## Fourteen items moved from Whole house, 9 Oct

| Item | Trade | Group |
| --- | --- | --- |
| Window & door package — manufacturer | Glazing | 1 |
| Window & door frame color | Glazing | 1 |
| Glass tint | Glazing | 1 |
| Window grids | Glazing | 1 |
| Sliding glass door hardware | Glazing | 1 |
| Front entry door | Millwork | 1 |
| Exterior door hardware | Hardware | 3 |
| Roof tile profile & color | Roofing | 1 |
| Stucco texture | Stucco | 4 |
| Exterior paint | Paint | 4 |
| Driveway & motor court paving | Landscape / hardscape | 4 |
| Generator | Electrical | 1 |
| Deck paving | Landscape / hardscape | 3 |
| Landscape lighting | Lighting | 2 |

The five glazing lines were the clearest case: they already carried a Section
called **Exterior Doors & Windows**, so the base was calling them exterior and
only the room was out of step.

With the three new lighting items, Exterior holds 17.

The library move affects **jobs built afterwards only**. A job already built
keeps those rows under its Whole house room until someone moves them, because
the selection's `Space` link was set when the room was built and nothing
revisits it. See the migration below.

## Known overlap, not yet resolved

`Address and path lighting` and `Landscape lighting` (Whole house, Group 2) can
both claim the walk from the driveway. The description says so and asks the
owner which they want it to come from, rather than pretending the line is clean.

Still open, and deliberately not done without asking: whether `Landscape
lighting` — and stucco, roof tile, driveway, exterior paint, exterior door
hardware — should move from Whole house to Exterior. Moving a library item's
space type only affects jobs built afterwards, so Hahitti would keep those rows
under Whole house while the next job got them under Exterior. That split is
worse than the current untidiness until someone decides to do all of them at
once.

## Migrating Hahitti, 9 Oct

Hahitti was already built, so its 14 rows sat under Whole house. One of them was
not empty: **Driveway & motor court paving** was at *Owner selected* — German H
Diaz had entered Concrete Pavers / Gray / standard / matte with the note "no
second option. Has to be this one." So rebuilding the room was not an option;
that row had to be carried, not regenerated.

The order matters, and it is the opposite of the obvious one:

1. Create the **Exterior** space with its Space Type and sort order but **no
   Project link**.
2. Repoint all 14 existing rows' `Space` to it, and renumber their `Sort order`
   onto the new room's base.
3. Create the 3 new lighting rows.
4. **Then** add the Project link.

Step 4 last is the whole trick. "Expand space into selections" fires when Space
Type *and* Project are both filled, and would have generated a second copy of
all 17 rows. By the time the Project link lands, the space already has 17
selections — the automation's first check is exactly that, so it saw them and
stopped. Verified: it ran, and the room still holds 17 rows, not 34.

Nothing was deleted and nothing was retyped. German's row kept its status, its
answers, its note and its submission stamp.

### A sort-order collision, caught on the way

Selection sort order is `roomOrder * 100 + (templateOrder % 100)`. The three new
lighting items were numbered 210–212, which modulo 100 give 10–12 — the same
slots as Exterior paint (110), Driveway (111) and Generator (112). Those
templates had never shared a room before, so the clash had never mattered.
Renumbered to 113–115.

### Two stale automations, also caught

`expand-space.js` and `build-rooms.js` had been rewritten in the repo for the
group-based dates but **never pushed to Airtable**. The live scripts still
computed construction start *minus* lead time and wrote no selection group.
Creating the Exterior room would have generated 17 rows with wrong dates.

Both were updated before the migration. The lesson is the one this repo keeps
relearning: the repo is not the system of record for automations, Airtable is,
and a file edited here changes nothing until it is pushed there.

## To put it on a job

Exterior is a room like any other: add a Room Plan line with How many = 1, then
tick Build rooms. The build only adds, so it is safe on a job already underway —
Hahitti picks up the three new lines and nothing else changes.
