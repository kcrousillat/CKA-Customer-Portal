# Where things stand

Kept here rather than in chat so it survives. Updated 12 Sep 2026.

## Next time at a computer

Three commands in PowerShell, in order. The first two are one-offs; the third
is the one to use from then on.

    curl.exe -o "$([Environment]::GetFolderPath('Desktop'))\update-cka-portal.ps1" https://raw.githubusercontent.com/kcrousillat/CKA-Customer-Portal/1adfa6c9749568640856286706281ced0a5387bd/tools/update-cka-portal.ps1

    curl.exe -o "$([Environment]::GetFolderPath('Desktop'))\CKA-Customer-Portal-claude-exciting-heisenberg-pqq69a\worker\wrangler.toml" https://raw.githubusercontent.com/kcrousillat/CKA-Customer-Portal/1adfa6c9749568640856286706281ced0a5387bd/worker/wrangler.toml

    powershell -ExecutionPolicy Bypass -File "$([Environment]::GetFolderPath('Desktop'))\update-cka-portal.ps1"

That makes the Worker serve the portal page, so it opens on a phone at

    https://cka-selections-api.kevin-7c1.workers.dev/?p=sunset-isle-9f2c7a41

A file on a Desktop cannot do that: opening it from OneDrive on a phone lands
in a preview sandbox with no network and no address bar for the ?p= key.

## Recently fixed

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
