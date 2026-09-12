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

## Broken, needs fixing

**Adding a new room does not generate its selections.** The expand-space
automation fails on every run with a script error. Existing rooms and the
portal are unaffected; only newly added Spaces are.

Airtable does not expose the error text through the API, so the next step is
to read it from the UI: open the automation, click **Test step**, and send the
error. Two blind fixes have already been tried and neither was it — no third
guess without the message.

Workaround in the meantime: Claude can generate a new room's selections
directly, which is how the baths and powder were built.

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
