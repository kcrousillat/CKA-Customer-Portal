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

### Two that fail the test and stay curated anyway

**Window & door package - manufacturer** and **Low voltage, AV & security**. Neither has palette
rows, but neither is a catalog item: CKA bids them and brings the owner the numbers. Flipping them
would tell the owner to go and source their own impact window manufacturer, which is not the job.

Raised with Kevin when the sweep was done; he confirmed leaving them curated. So these are
settled exceptions to the rule above, not an oversight waiting to be tidied up - if a later pass
flips them for failing the catalog test, it is undoing a decision rather than fixing a gap.

## Owner photos, 2 Oct

Kevin tried to attach a photo to a selection and found he could not - there was
no upload anywhere in the portal. The notes box said "a link to a photo", which
quietly assumed the owner would host the picture somewhere first. Nobody
choosing a tap is going to do that; they were always going to text it to Kevin
instead, which is the thing this product exists to stop.

So the entry form now takes photos directly. Up to six per line, shown as
thumbnails under the boxes, each one opening full size.

**No new service.** Airtable accepts file contents on a host of its own, so
there is no image host, no storage bucket and nothing extra to pay for or keep
running. Airtable appends to the attachment field itself, so two photos
arriving together cannot overwrite each other the way reading and writing back
would.

**The page shrinks the photo before sending it**, to 1600px on the long edge.
A phone photo is routinely 3-12MB and Airtable's limit is 5MB, so without this
most real photos would simply fail. It also means a photo sent from a job site
on one bar does not take minutes. A 4032x3024 test photo came out of the
browser at 1600x1200 and about a third of the size. A side effect worth having:
drawing the photo through a canvas drops the EXIF block, so the GPS location
the phone stamped into the file does not travel to Airtable with it.

The endpoint takes a file from anyone holding a portal key, so the refusals
matter more than the happy path: images only, roughly 4MB, six per line, and
nothing at all on a line already approved - that is what Request a change is
for. `worker/test/photo.test.mjs` covers each of those against the real Worker
with Airtable mocked. Run it with `node worker/test/photo.test.mjs`; it exits
non-zero if anything regresses.

## Resetting a job to untouched, 3 Oct

Kevin, once the photo upload was working: *"clear everything. this has not been
put in use yet. Change the dates so nothing due yet."*

**Cleared.** Five rows carried test data and all five are back to Not started
with every owner field empty - three typed-junk submissions (Hahitti's kitchen
and club-room sinks, DEMO's waterline tile) and two approvals on DEMO (pool
finish, built-in refrigerator). Owner supplier, model, colour, finish, notes,
photos, submitted-by, submitted-on, approved-by, approved-on and the approved
option link were all emptied; the attached screenshot went with them. Hahitti
now holds nothing Rami did not do himself, which is nothing.

**The dates.** `Needed by` is **stored, not calculated** - the build writes it
once as construction start minus the item's lead time and never looks again.
So Hahitti's real 19 Oct 2026 start, 16 days out, had the 16-week items reading
months overdue before the owner had the link. The portal would have opened on a
page of red for a client who had not been asked anything yet.

Construction start is now a **placeholder of 1 Jun 2027**, with the reason
written into the project's Notes so it is visible in Airtable rather than only
in a chat log. It is not a real date. Replace it with the true start and the
dates follow.

### Recompute needed-by dates

Because a stored date that nobody can refresh is the actual bug here, this is
now an automation rather than something to redo by hand: tick **Recompute
dates** on a Project and every selection's Needed by is rewritten from the
current Construction start, same arithmetic as the build.

- Lead time is read from the **selection**, not the library, so a row whose
  lead was adjusted by hand for this job keeps the adjustment.
- Only rows whose date actually moves are written.
- It touches nothing but the date. Status, owner answers, approvals and the
  supersede trail are left alone, so it is safe on a job already underway.
- It watches the clock like the room build, says in the log if it ran out of
  time, unticks itself and writes what it did into Setup log.

Script kept at `airtable/recompute-dates.js`. It earns its place beyond this
one reset: every schedule slip needs it, and it is the seam the Material Log
feed will eventually write through.

## Appliances went all-owner, 5 Oct

Kevin spotted that "Undercounter appliances" had input boxes while the kitchen
appliances beside it did not. The split turned out to be arbitrary — 9 of the 22
appliance templates were `CKA presents options` and 13 were `Owner specifies`,
with Range curated but Cooktop an input, Dishwasher curated but Wall ovens an
input. Nobody had decided that; it accumulated.

Worse, the curated ones failed the catalog test anyway: every appliance category
in Palettes had exactly **one** row. One range, one dishwasher, one refrigerator.
A card showing a single option is not a choice, it is a suggestion with the
alternatives hidden. Outdoor-kitchen `Vent hood` was curated with no palette
category at all, so it rendered an empty space.

All 22 are now `Owner specifies`. The reasoning is the catalog test plus how
appliances are actually bought: an owner picks a model at a showroom or through
their dealer, from a range far wider than anything CKA would carry. The existing
single palette rows stay in Airtable as reference; they just stop being presented
as a decision.

The 16 live Hahitti rows that were still curated were switched in the same pass.
The library does not backfill built rooms, so a library change alone would have
left that job showing the old behaviour — which is also why `Dryer` read as
curated on Hahitti after the template was changed to owner-input on 24 Sep.

### Owner boxes

Appliances now carry explicit boxes rather than the four defaults:

    Manufacturer or brand, Model number, Finish, Size or width

The defaults end in "Color name or number / Sheen or finish", which is right for
paint and wrong for a dishwasher. `Owner boxes` is read live by the Worker, so
this reached the built rooms without a rebuild.
