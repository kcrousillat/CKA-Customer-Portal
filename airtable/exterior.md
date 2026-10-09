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

## Six items moved from Whole house, 9 Oct

| Item | Trade | Group |
| --- | --- | --- |
| Landscape lighting | Lighting | 2 |
| Exterior door hardware | Hardware | 3 |
| Roof tile profile & color | Roofing | 1 |
| Stucco texture | Stucco | 4 |
| Exterior paint | Paint | 4 |
| Driveway & motor court paving | Landscape / hardscape | 4 |

The library move affects **jobs built afterwards only**. A job already built
keeps those rows under its Whole house room until someone moves them, because
the selection's `Space` link was set when the room was built and nothing
revisits it.

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

## To put it on a job

Exterior is a room like any other: add a Room Plan line with How many = 1, then
tick Build rooms. The build only adds, so it is safe on a job already underway —
Hahitti picks up the three new lines and nothing else changes.
