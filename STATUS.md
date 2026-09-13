# Where things stand

Kept here rather than in chat so it survives. Updated 13 Sep 2026.

## Nothing is waiting on a deploy

The updater has been run and the live Worker was read back to confirm it:
MSRP is off, hinge is being served. Airtable changes need only a page reload -
only a change to the portal page or the Worker needs the updater:

    powershell -ExecutionPolicy Bypass -File "$([Environment]::GetFolderPath('Desktop'))\update-cka-portal.ps1"

Three green numbered steps, then "All done." It downloads the current portal
and Worker from GitHub before deploying, so a stale local copy cannot go live.

## The demo job

**DEMO - Practice job** is built and waiting. Eighteen rooms, 203 selections,
13 paint lines. Status **Example**, so it is unmistakably not a client.
Nothing in it gets ordered from; delete the Project row whenever it has served
its purpose and its rooms and selections go with it.

Construction start is 1 Mar 2027 on purpose - far enough out that the
needed-by dates land in the future, so the portal does not open with
everything red.

Portal key `demo-practice-7k4m2q`. It is a throwaway, and it should stay one:
`ALLOWED_ORIGIN` on the Worker is still `*`, so the pre-client hardening is not
done and nothing real belongs behind this key yet.

    https://cka-selections-api.kevin-7c1.workers.dev/?p=demo-practice-7k4m2q

The house it describes: kitchen, bar, 3 baths, powder, laundry, 3 bedrooms,
primary bedroom (with its second closet switched on), stair, outdoor kitchen,
pool, garage, two floor levels. No elevator. Change any count on the Room Plan and tick
**Build rooms** again - it only ever adds, so nothing already there is
disturbed.

Still to do on it if you want the full picture: open **Project setup ->
Optional items** and switch on the tubs, prep sink, pot filler and second
dishwasher this imaginary house has - and the second closets, if a bedroom
other than the primary has one. They are generated but hidden until
somebody says so.

## Project setup, step by step

1. On the Project, tick **Load starter plan**. The Room Plan fills with one
   line per room type in the library, all at zero except Whole house.
2. Go down the **How many** column and type the counts. Bedroom 4, Bath 3,
   Powder 1, Elevator 1, Floor / level 2. Leave the zeros alone - a zero is
   skipped, so a room type the house does not have costs nothing.
3. Tick **Build rooms**. Rooms and their selections appear.
4. Open the **Project setup -> Optional items** interface page, pick the job
   from the Job dropdown, and set the Status of everything that house actually
   has to "Not started". Everything left as "Not applicable" stays invisible
   to the owner.

That last screen is the whole answer to "which of these does this house
have". It lists only the rows marked Optional in the library, grouped by room,
in both states - so an item can be switched on or back off from the one place.
Today that means tubs (one line per bath), the kitchen prep sink, prep faucet,
pot filler and second dishwasher.

    https://airtable.com/appfRsDMRMX4sGSPK/pagl5l9DF1uWwbixg

## Hinge sides are all filled in

On Sub-Zero the trailing letter of the model number is the hinge: `R` right,
`L` left. So the refrigerator column DEC3650RIDR is hinged right, the freezer
column DEC3650FIL is hinged left, and the beverage center DEU2450BGL is left -
which the bid had already said in words.

The paired columns are deliberately opposite so the doors open away from each
other. All eight appliance rows now carry a hinge or are correctly blank.

## Hinge side is recorded and shown

Doors on undercounter and column appliances are hinged left or right, and on
most of them the hinge is part of the model number - a left-hand unit and a
right-hand unit are two different products. It cannot be swapped on site. So
an owner who never saw which way the door opens has a fair complaint, and CKA
has no record they agreed to it.

New **Hinge** field on both Options and Palettes: Left, Right, Reversible,
French / double. Set it once on the catalog row and it follows into every job.
The portal shows it on the option card, and any room with a hinged option
carries a standing line: the swing is fixed once the order goes in, so say
something before approving. Approving the option is then a record that the
hinge was approved too.

Leave it empty for anything without a door that swings.

## The catalog loader was broken, and is fixed

Worth knowing, because it means "Load catalog options" had never actually
worked. The automation was carrying the wrong script entirely - a copy of the
space expander - so it read a `spaceId` that was never passed to it. It had
run once, on 12 Sep, and done nothing. Airtable recorded that run as a success,
because the script did not throw; it just quietly did not do its job.

It now has the script it was always described as having, that script lives in
the repo at `airtable/load-catalog.js` like the other three, and it is
**tested**: ticking the box on the demo's Second dishwasher loaded the Cove
row, unticked itself and wrote the rough-in into Internal notes. Ticking it on
the Beverage center carried the hinge through as Left.

Two things the test caught that no amount of reading would have:

**Single-selects have to agree across tables.** Palettes had learned Sub-Zero,
Wolf, Sharp and Cove; Options still only knew PGT and ES Windows. The scripting
API has no typecast, so writing an unknown choice throws and takes the whole
load down. Both lists match now, and the script asks the field what it accepts
rather than assuming - an unknown choice is left empty and named in the log
instead of killing the run. That is the draft waiting on the Update button.

**A catalog note is owner-facing.** Palettes.Note is copied onto the option and
shown in the portal, and mine held bid numbers, a trade rep's name and another
client's house. New **Internal note** field on Palettes for exactly that, and
the loader does not read it. Rule: if it names another client, a bid, or a
price, it goes in Internal note, never Note.

Also corrected while in there: catalog **Model** now holds the manufacturer's
model number and the Ferguson SKU lives in Internal note. It was the other way
round, which would have shown an owner a vendor SKU as the model.

## Decoding a Ferguson SKU

Ferguson's item numbers are the manufacturer's model number with the brand's
letter stuck on the front. Drop it and you have the real model:

    SDEC3650RIDR  ->  Sub-Zero  DEC3650RIDR
    WDF48650GSP   ->  Wolf      DF48650GSP
    SSMD2470ASY   ->  Sharp     SMD2470ASY
    CDW2451       ->  Cove      DW2451
    LGWM6500HBA   ->  LG        WM6500HBA

LG is the exception that proves it: two letters, because the brand is two
letters. S covers both Sub-Zero and Sharp, so the product type is what tells
them apart - a 36" column is Sub-Zero, a microwave drawer is Sharp.

Catalog rows carry both: **Model** is the manufacturer's, and the Ferguson SKU
is in **Internal note** and in the selection's Internal notes - so whichever
number the order desk or the rep is working from, it is there, without a vendor
SKU ever reaching an owner.

The rule held on the one I doubted. The microwave drawer decodes to
SMD2470ASY and Sharp's own product page shows exactly that - so the flag on
that record is cleared. The page also corrected the bid: Sharp says 950W,
the bid said 1000W. Take the manufacturer's number.

## Appliances from a vendor quote

This is the normal path: the interior designer picks the appliances and the
vendor quotes them, so the decision is already made by the time it reaches
us. The job is to record it, not to present choices.

What that looks like in the base - all of it done on the demo job already, so
open the Kitchen there to see it:

  - One **Option** per appliance, attached to the matching selection, carrying
    supplier, the order number, and the finish.
  - Selection status **Options presented**. The owner sees one card per
    appliance and approves it; they are not being asked to choose.
  - The bid's own notes land in **Internal notes**, which the owner never
    sees - "CONFIRM BLOWER", the left-hand hinge on the beverage center, the
    brushed brass knobs being a separate line that has to be ordered with the
    range.
  - **Rough-in notes** on the catalog row carry what the MEP rough and the
    cabinet shop need: panel-ready, dual fuel, 1200 CFM, 240V dryer circuit.

**MSRP is collected but not shown.** Sharp's page lists the microwave drawer
at $1,899.99 and that is on the catalog row, but the portal does not publish
it. `SHOW_MSRP` in `worker/src/index.js` is `false`, and the gate is in the
Worker rather than the page so the figure never leaves the server - it is not
sitting in the JSON for anyone who opens the network tab.

Keep filling the column. The portal already knows how to render it, labelled
and noted as excluding installation, so flipping that flag to `true` and
redeploying is the whole job if the view changes.

Two things that are not MSRP and never go in that column: a vendor's net or
trade price off a bid, and a retailer's street or sale price. Sharp's page
showed $1,499.99 street against $1,899.99 list - both real numbers, only one
of them MSRP.

**No other prices were loaded, deliberately.** The Net Price column on a vendor bid
is trade pricing, not MSRP. The portal's rule is MSRP only, labelled, and
excluding installation - so putting a bid number in that field would be wrong
twice over and would show an owner what we pay. MSRP stays empty until we
have list pricing. Worth knowing: Ferguson quoted installation as its own
set of lines, which is a good check on the "excludes installation" wording.

**Do not commit a client quote to this repo.** It is public. Committing
images to it is the fast way to get chips into Airtable, and that is fine for
manufacturer artwork - but a vendor bid carries the client's name, the
designer's address and phone, and trade pricing. Those go in Airtable only.

## Recently fixed

**Both sample jobs are gone and the base is clean.** 418 selections, 55
options, 46 rooms, 30 Room Plan lines and the two projects, deleted after the
review below. What survived is everything that should: the 131-item library,
15 room types, the 36-row window catalog, the Sections and Trades maps, and
all four automations.

**Fifty orphaned selections were still in the base.** Deleting the two sample
jobs cleared their Projects, Spaces and most of their rows, but 50 selections
survived with their Project link emptied rather than being deleted - invisible
on every screen that filters by job, and they would have turned up in any
count. Gone now, and Options and Spaces were checked the same way and were
clean. Worth repeating the check after any bulk delete: filter Selections on
Project is empty.

**DEMO_KEY is cleared.** The example job's key was pre-filled in the portal
page, which is a public file. That was on the pre-client list; the job it
pointed at is deleted, so it went now.


**Paint is generated now, not hand-built.** The per-room paint arrangement
existed on exactly one job and nowhere in the library - 17 rows typed by hand,
which would have had to be typed again on every house and were one deletion
away from being lost.

Space Types gets a **Paint row** checkbox, ticked for the ten types that get
painted: Kitchen, Bar, Bath, Powder, Laundry, Bedroom, Primary bedroom,
Stair, Garage. Build a room of a ticked type and the build
also creates a "<room> paint" line under Whole house - Owner specifies, so the
client fills in manufacturer, product, colour and sheen in the four fields.
**Ceilings** is a normal Whole house item alongside it.

The wording of every paint line comes from an inactive **Room paint** template.
Edit that description once and every line created afterwards reads the same.

**Three window items were rescued from the example job.** Glass tint, Window
grids and Sliding glass door hardware existed only there, with 15 options
already built from the ES Windows and PGT catalog. All three are library items
now. **Window & door frame color** was also wired to its 36 catalog rows - it
had a full catalog behind it and no connection to it.


**Baseboard and casing are two decisions, not one.** Whole house carried a
single "Interior trim & baseboard profile" row covering both. It is now
**Baseboard profile** and **Door & window casing**, side by side under
Cabinetry & millwork, both trade Millwork, both 4-week lead. Added to the
library and backfilled onto both existing jobs.

Two new palette categories, **Baseboard profile** and **Casing profile**, are
waiting to be filled - see below.


**The front door and its hardware file with the windows.** Front entry door is
trade Millwork and Exterior door hardware is trade Hardware, so the two halves
of one decision were landing under two headings, neither of them the one an
owner would look in. Both now carry a Section override to Exterior Doors &
Windows.

The example job already had the same override set by hand on its front door
and its sliding door hardware. That was the tell: patching each job is what
you do when the library is wrong. Fixed at the source, so future jobs inherit
it and nothing needs patching.

Four overrides in the library now - front door, exterior door hardware,
mirrors, shower enclosures. The rule they all follow: **trade says who
installs it, section says how the owner thinks about it**, and those two do
not always agree. The override exists for the gap.

**Interior glass is its own trade now.** It started as a Section override:
one Glazing trade pointing at Exterior Doors & Windows, with the shower doors
and mirrors overridden across to **Glass & mirrors** (sort 75). That worked,
but it was a patch - and it guessed wrong about the vendor.

It is two contractors. The exterior door and window supplier does the window
package; a shower enclosure and mirror contractor does the interior glass. Two
trade partners, so two trades:

  - **Glazing** -> Exterior Doors & Windows. The window package: manufacturer,
    frame color, glass tint, window grids, sliding glass door hardware.
  - **Interior glazing** (sort 115) -> Glass & mirrors. Shower enclosures,
    bath mirrors, powder mirrors.

Both headings are now driven by a trade like every other section, so the seven
overrides that used to do this job are gone. **Two overrides remain in the
whole base** and both earn it: Front entry door (trade Millwork) and Exterior
door hardware (trade Hardware), each filed under Exterior Doors & Windows
because that is where an owner looks for them.

The rule this all turns on: **a trade can point at only one heading.** When two
groups of items need different headings, that is a second trade, not a
re-pointing of the first. Re-pointing Glazing at Glass & mirrors drags the
entire window order along with it - which is exactly what happened when it was
tried, and why the window package briefly sat under a mirrors heading.

Templates and the demo's existing rows were both updated, because a template's
trade is copied onto a selection when it is generated - changing the library
alone would have fixed only future rooms.

**Every bedroom carries its own closet, and a second one is optional.** The
first go at this made **Walk-in closet** a room type of its own, counted like
bedrooms. It read badly in the portal: a heading saying WALK-IN CLOSET 2 with
no way to tell whose closet it was. A closet is not a room an owner thinks
about on its own - it belongs to a bedroom.

So there is no closet room type any more. Both closet lines - closet system
layout & finish, closet hardware & lighting - hang off **Bedroom** and
**Primary bedroom**, so every bedroom gets one closet by default and it
appears under that bedroom's heading.

Two new **Optional** templates, **Second closet system layout & finish** and
**Second closet hardware & lighting**, cover the room with two - usually his
and hers off a primary suite. Like every Optional item they generate on every
job as "Not applicable" and are switched on per job from Project setup ->
Optional items. Nobody is asked about a closet twice, and nobody has to
remember a second one is possible.

Two bedroom types now:

  - **Bedroom** - secondary. 7 room items, 2 closet lines, 2 optional second-closet lines.
  - **Primary bedroom** - the same, minus nothing. Identical list.

The two differ only in that the primary is numbered separately and named
"Primary bedroom" rather than "Bedroom 4". No template is duplicated - a
template can claim several room types.

**Build rooms no longer stops at six.** It used to cap each run at six rooms
on the theory that a room might be slow. Measured: six rooms and 83 selections
took four seconds, against a thirty-second limit. A twenty-room house needed
four ticks for no reason, and the first person to try it hit exactly that.

It now watches the clock instead of counting rooms - it keeps going until
twenty seconds are spent, which leaves room for the writes that follow the
loop. A normal house finishes in one tick. A very large one still says so in
the Setup log and is finished with a second tick.


**A job now starts from a list, not a blank page.** Ticking **Load starter
plan** on a Project drops in a Room Plan line for every room type in the
library - 14 of them today - each at How many 0, Whole house at 1. Setup is
reading down a column and typing counts.

The point is that nothing has to be remembered. "Two story" is the
Floor / level line set to 2. "Elevator?" is the Elevator line set to 1 or left
at 0. Those were always room-count questions; they just were not being asked.

It only adds. A room type already on the plan is skipped, counts and all, so
ticking again after a new type is added to the library brings in that one line
and touches nothing else. Add "Office" to Space Types and it appears on every
job set up from then on - which is the thing a spreadsheet questionnaire could
not do without somebody remembering to update the spreadsheet.


**The example job's dates were in the past**, which made Appliances look
broken. It was not: the portal deliberately refuses to collapse a section
holding anything past its needed-by date, and the example's appliances were two
months overdue. Paint had nothing late, so Paint collapsed and Appliances did
not.

The dates come from construction start minus lead time, so the whole example
had drifted. Construction start moved to 15 Feb 2027 (dry-in 30 Jul 2027) and
all 204 selections were re-dated off it. Nothing reads as overdue now; the
20-week window and door package still lands inside the 21-day window, so the
"due soon" styling is still visible on the demo.

Worth knowing: **needed-by is written once, when the row is generated.**
Changing a project's construction start later does NOT re-date its existing
selections. If a real job's start moves, the dates have to be recalculated -
there is no automation for that yet. Add one if start dates start moving often.


**Nine appliance templates had the appliance name in the wrong column** -
Dishwasher, Ice maker, Beverage center, Wine storage, Steam oven, Warming
drawer, Coffee system, Microwave / speed oven, Undercounter refrigeration all
had their name sitting in **Default mode** instead of **Palette category**.
Generating them wrote junk into Mode and left the palette empty, so no option
palette ever loaded. Moved to the right column; Default mode is now
"CKA presents options" on all nine.


**Optional items have a home, and a screen.** Some rooms have a thing and some
do not - a prep sink, a pot filler, a tub, a second dishwasher. There is now an
**Optional** checkbox on Item Templates, and a "Project setup -> Optional
items" page that asks about all of them at once (see above). A ticked item still generates on every job, so nobody has to
remember it exists, but it arrives as "Not applicable" and the owner never
sees it. Someone sets its Status to "Not started" on the jobs that have one.
One click to add, against having to notice a missing row on every other job.

The kitchen was the first case. It used to carry two rows covering five
products - "Sink" meant main and prep, "Plumbing fixtures" meant main faucet,
prep faucet and pot filler in one approval, which is not something an order
desk can key. It is now Sink, Faucet, and three Optional rows: Prep sink,
Prep faucet, Pot filler.

The tub and the second dishwasher are now Optional too. That was safe to do
only because the setup page exists: with a screen that lists every switched-off
item per room, an off-by-default tub cannot quietly go missing.

Existing tub rows on the example job were left in whatever state they were
already in - those decisions are made, and re-defaulting them would have
thrown away real information.


**The room generator works again**, and so does the new Room Plan build. Both
were failing for the same reason and it was not the scripts: writing an
automation through the API put the input-variable setting in the wrong place,
Airtable accepted it silently and dropped it, and the scripts then ran with no
trigger record. "recordId should be a string, not undefined."

The lesson for next time: when writing an automation through the API, inputObj
belongs INSIDE inputs, alongside script. Check a hand-built automation for the
shape before trusting a rewrite, and read the Execution log in the UI early
rather than reasoning about what a script error might be. Three theories were
wrong before the actual message settled it in one line.

Both tested end to end and the test rooms cleaned up.

## Waiting on Kevin

**Trim profiles to load into the catalog.** Send the trim supplier's profile
sheet - a PDF, or photos of the profiles with their part numbers. Profile
drawings and part numbers are supplier data and are not being invented here;
the catalog stays empty until a real sheet arrives.

Once it does, loading it is one pass: the profiles go into Palettes under
category "Baseboard profile" or "Casing profile" with their drawing attached,
and from then on any job's baseboard or casing row fills with them by ticking
Load catalog options. Done once, reused on every house.


- **Sub-Zero / Wolf / Cove Design Guide** and the **Thermador spec book**, as
  PDFs. Their sites are blocked from Claude's sandbox. These fill the
  appliance catalog, which is what makes "Load catalog options" useful.
- **ES Windows glass tint list**, from the rep. Not in the Prestige brochure,
  and it must not be guessed at.
- Optionally, an **official reversed (light-on-dark) logo**, if the designer
  has one. Dark mode currently sits the standard mark on a light plate rather
  than recolouring the artwork.

## Ready to do, in order

1. **Fix expand-space** (above). Everything below that touches trades waits on
   this.
2. **Convert the Trade fields to links.** `Selections -> Trade` and
   `Item Templates -> Default trade`, both together, to the Trades table.
   Duplicate the Trade column first as a backup. This makes adding a trade one
   row instead of three edits.
3. **Rename "Glass & mirrors"** to whatever it should be, in the Sections
   table. Two selections override into that heading by name — Sliding glass
   door hardware and Front Entry Door — and their Section cells need the same
   edit or they strand under the old name.
4. **Host the portal.** It currently lives as a file on the Desktop. On
   Cloudflare Pages it becomes a link. Do this before the first real client.
5. **Lock down `ALLOWED_ORIGIN`.** It is `*` in worker/wrangler.toml, meaning
   any site can call the API. Set it to the portal's host once step 4 is done.
6. **Clear `DEMO_KEY`** from selections-portal.html before the first real
   client. It pre-fills the example job's portal key, and this repo is public.

## To revisit: how paint is organised

Paint is currently one list under Whole house, with a row per room, plus
Exterior, Interior, Ceilings and Interior trim & doors. Per-room paint was
switched off in the library so it is not asked twice.

Kevin's concern, and it is the right one: every other item generates itself
when a room is added, and paint does not. Adding a room, renaming one, or
dropping one means someone hand-edits the paint list to match. A manual
procedure that applies to exactly one item is the kind of thing that gets
missed, and it pulls against wanting to grow the page freely.

Three ways out, for that conversation:

1. **Back to per-room paint.** Each room generates its own paint row again,
   and the By trade tab is the one-sitting paint list -- it already groups
   every paint decision across the house on one screen. Costs nothing to
   build; loses the single curated list under Whole house.

2. **Keep it central and make it generate.** Extend the expand-space
   automation so adding a room also creates that room's paint row under Whole
   house, named from the room. Keeps the list Kevin wants and removes the
   manual step. Needs the room rename case thought through: rename a room and
   its paint row has to follow.

3. **Leave it manual** and accept a checklist step when rooms change.

Option 2 is probably what he actually wants, and it is only worth building
once the expand-space automation is working again.

## Parked by Kevin

- **The needed-by date model.** Dates count lead time back from construction
  start, so everything reads past due. The real driver is when a decision
  gates other work, not when the material arrives. The MS Project schedule in
  the 223 Royal material-log base is the likely anchor.
- **Consolidating the Material Log bases.** The two running jobs stay separate
  and get archived when complete, so a combined base starts empty with the
  next job. The two gotchas identified were a composite task key and a
  mismatch-guard view.

## Known gap: the library does not backfill

Changing Item Templates only affects rooms built **afterwards**. Build rooms
adds missing *rooms*; it never adds a newly-added item to a room that already
exists. Add an item to the library mid-job and every room already on that job
stays as it was, silently.

This bit immediately on the sandbox: bedrooms built before the closet lines
were attached came out with no closet, and it read as the change not working.

Worth an automation - a "Top up selections" tick that walks a project's rooms
and creates any template row that is missing, add-only, same shape as Build
rooms. Until then, remember that a library change is for future rooms, and
existing jobs need the rows added by hand.

## Open questions

- Should the portal's headings use a serif display face instead of Archivo?
  Archivo was chosen to match the logo's squared letterforms; a serif would
  read more like a signed document. One line to change either way.
