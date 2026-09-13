# Where things stand

Kept here rather than in chat so it survives. Updated 13 Sep 2026.

## Next time at a computer

**Run the updater.** The portal page changed - the example job's key was
pre-filled in it and that job no longer exists, so the box is empty now.

    powershell -ExecutionPolicy Bypass -File "$([Environment]::GetFolderPath('Desktop'))\update-cka-portal.ps1"

Three green numbered steps, then "All done." It downloads the current portal
and Worker from GitHub before deploying, so a stale local copy cannot go live.

Then open the demo job below and click around it.

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

**Mirrors and shower enclosures have their own heading.** There is one Glazing
trade and it points at Exterior Doors & Windows, so a shower door was filing
under the same heading as the window package. New section **Glass & mirrors**
(sort 75, right after Exterior Doors & Windows), claimed by the three interior
glass items through their own Section cell: Shower enclosure, Mirrors (Bath)
and Mirror (Powder).

Done with Section overrides rather than a new trade, because the trade really
is the same one - it is the conversation and often the vendor that differs. If
the glass shop ever becomes a separate trade partner worth tracking, splitting
the trade would be the better answer and would move these automatically.

All 22 existing selections on both jobs were moved too. That is the backfill
gap again: a template's Section is copied onto a selection when it is
generated, so changing the template alone would have fixed only future rooms.


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
