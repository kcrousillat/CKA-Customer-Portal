# Where things stand

Kept here rather than in chat so it survives. Updated 13 Sep 2026.

## Next time at a computer

**Two automations have unapplied drafts.** Open each in Airtable and click
Update, or nothing changes:

  - Expand space into selections
  - Build rooms from the Room Plan

Both got the same one-line change: an Item Template ticked **Optional** now
generates as "Not applicable" instead of "Not started".

### Then, the usual update

One command in PowerShell (Windows key, type powershell, Enter):

    powershell -ExecutionPolicy Bypass -File "$([Environment]::GetFolderPath('Desktop'))\update-cka-portal.ps1"

Three green numbered steps, then "All done." It downloads the current portal
and Worker from GitHub before deploying, so a stale local copy cannot go live.

The portal then opens on a phone at

    https://cka-selections-api.kevin-7c1.workers.dev/?p=sunset-isle-9f2c7a41

A file on a Desktop cannot do that: opening it from OneDrive on a phone lands
in a preview sandbox with no network and no address bar for the ?p= key.

## Project setup, step by step

1. On the Project, add a **Room Plan** line per kind of room, then tick
   **Build rooms**. Rooms and their selections appear.
2. Open the **Project setup -> Optional items** interface page, pick the job
   from the Job dropdown, and set the Status of everything that house actually
   has to "Not started". Everything left as "Not applicable" stays invisible
   to the owner.

That second screen is the whole answer to "which of these does this house
have". It lists only the rows marked Optional in the library, grouped by room,
in both states - so an item can be switched on or back off from the one place.
Today that means tubs (one line per bath), the kitchen prep sink, prep faucet,
pot filler and second dishwasher.

    https://airtable.com/appfRsDMRMX4sGSPK/pagl5l9DF1uWwbixg

## Recently fixed

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

## Open questions

- Should the portal's headings use a serif display face instead of Archivo?
  Archivo was chosen to match the logo's squared letterforms; a serif would
  read more like a signed document. One line to change either way.
