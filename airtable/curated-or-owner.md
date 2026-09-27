# Choosing from CKA options, or the owner specifying

Every item carries a **Default mode** in the library, copied onto the selection when a room is
built - and changeable per job on the selection itself.

- **CKA presents options** - CKA loads two or three products, the owner picks one and approves it.
- **Owner specifies** - the owner types what they chose into the entry boxes and submits it.

## The rule

Three questions, in this order.

**1. Is there a catalog for it?** This is the binding one. Curated means real products with real
photos in front of the owner. With no catalog the row just sits saying *"CKA is putting options
together for this item"* until somebody notices - which is worse than never having offered.

**2. Does the choice constrain the build?** If getting it wrong costs money - a cutout size, a
rough-in, a fuel type, a clearance - curate it, because the shortlist is where that control lives.
Appliances are the clearest case: a grill's cutout is formed into the island and a dryer's fuel is
a line in the wall.

**3. Does the owner have a designer, or a firm opinion?** Someone arriving with a spec book does
not want three CKA picks. Owner specifies captures what they chose and keeps the record.

## The asymmetry

**Owner specifies is the safe default.** An owner who turns out to have no idea can have options
loaded onto that row and the mode flipped to curated, per job, in two clicks. A curated row with
nothing in it is a dead end that makes CKA look unprepared.

Easy to go one way. Embarrassing to be caught the other.

## Where this stands today

**There is no catalog worth curating from yet.** It gets built as jobs go by: a designer's spec
book arrives, it is extracted and loaded, and those products become the catalog for the next job.
Until then the default is owner specifies almost everywhere, and that is correct rather than a
compromise.

**All plumbing fixtures are owner-specified** - Kevin's call, 27 Sep. Every sink, faucet, toilet,
tub, tub filler, drain, shower system, pot filler, disposal, steam generator and outdoor shower
fixture, in every room type.

**Appliances stay curated**, because there the shortlist is doing real work: the width sets the
cabinet opening, the fuel sets the rough-in, and the hinge is baked into the model number.

## Entry boxes are worth setting

When an item is owner-specified, fill **Owner boxes** rather than taking the four paint-shaped
defaults. A faucet wants Manufacturer / Model number / Finish. A sink wants Manufacturer / Model
number / Size and bowl configuration / Material or finish. A toilet wants a Color, because the
colour is a real ordering fact.

Four boxes is the ceiling, and the portal always adds a free-text "Anything we should know" box
beyond them.

Owner boxes is one of the three things the portal reads **live** from the library, so changing it
reaches every existing job on the next page load. Default mode is not - that is copied at build
time and has to be changed on each live selection.

## Plumbing trim finish, retired

A single row per room that set the metal finish every tap, valve, drain and accessory in that room
was then ordered in.

It made sense while CKA picked the fixtures. Once the owner specifies each fixture, the finish
arrives with the fixture and the row is asking a question whose answer is already in the other
rows. Retired 27 Sep: Active unticked in the library, live rows set to Not applicable rather than
deleted.

## The catalog test, 27 Sep

Kevin: *"for now while we build our catalog let's make everything an input from the client."*

Taken at face value that would have flipped the tile and appliance lines too, and those are the
ones with a real catalog behind them - the Supergres and Refin colours loaded this week would have
sat in Airtable and never appeared on a page. So the rule applied was the one his reason implies,
not the literal sentence:

> **A line only says "CKA presents options" if there is something to present.** If the Palettes
> table has no rows for its subject, the owner gets entry boxes instead.

That is a test, not a taste. Run it against Palettes and the answer is the same every time,
which also means it can be re-run as the catalog grows: load a catalog, flip the line back.

**Stayed curated** - roughly 30 lines, because there are 231 palette rows behind them: all tile
and flooring (Porcelain tile, Wall tile), the window and door package (Frame color, Glass tint,
Grid style, Woodgrain finish, Door hardware), Pool finish, Bath accessories, Cabinet hardware,
Mirrors, decorative lighting (Chandelier, Sconce, Pendant), Grout, and the appliances that have
options loaded - Range, Cooktop's neighbours Dishwasher and Microwave, Built-in refrigerator,
Freezer column, Beverage center, Vent hood, Washer, Dryer.

**Flipped to owner input** - 46 library items and the 122 live selections built from them, across
both jobs. Cabinetry and millwork finishes, ceiling details, wall treatments, closet systems and
closet lighting, the elevator cab, baseboard and casing profiles, roof tile, stucco texture, deck
and driveway paving, HVAC grilles, landscape lighting, pool lighting, coping, water feature,
garage floor coating, the grill, and the appliances with no options loaded - cooktop, wall ovens,
ice maker, coffee system, steam oven, warming drawer, wine storage, undercounter refrigeration.

Each one got entry-box labels that suit it rather than the generic four. A grill asks Manufacturer
/ Model number / Width / Fuel. Coping asks Material / Color / Edge profile / Finish or texture.
Stucco asks Texture / Finish / Color. Leaving the labels empty would have worked - the portal
falls back to Manufacturer / Product / Color / Sheen - but "Color name or number" over an elevator
cab is the kind of thing that makes an owner stop and wonder what is being asked.

### Two that failed the test and stayed curated anyway

**Window & door package - manufacturer** and **Low voltage, AV & security**. Neither has palette
rows, but neither is a catalog item: CKA bids them and brings the owner the numbers. Flipping them
would have told the owner to go and source their own impact window manufacturer, which is not the
job. Worth knowing they are the two exceptions to the rule above.
