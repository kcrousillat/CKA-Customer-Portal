# CKA Customer Portal

## `selections-portal.html`

The owner-facing selections portal described in *CKA Selections Portal — Direction & Data Model*.
One self-contained file: open it in a browser, no build step, no server.

**What it does**

- **Four views of the same rows** — *Holding up the job* (sorted by the date the decision is needed,
  counted back from the trade's lead time), *By room*, *By trade*, and *Approved record*.
- **Both decision modes** — curated items show 2–4 CKA options with samples; open items give the
  owner supplier / model / finish / notes fields that route to CKA for confirmation.
- **Approval by typed name + timestamp.** An approved row locks and shows a record stamp. A change
  writes a *new* selection that supersedes the old one; nothing is edited in place.
- **Two printable documents** — working copy (everything, by trade, by blocking date) and record
  copy (approved only, by room, with samples and approval stamps). Browser print + `@media print`,
  landscape, repeating table headers, address and generated-on date in each document header.
- Light and dark themes, phone width down to ~400px.

**Demo data.** `1442 Sunset Isle Terrace` is an example project — 22 selections across nine spaces,
with generated color samples standing in for product photography. Owner picks save to `localStorage`
only; no email is sent and no order is placed. Buttons marked *CKA only* stand in for the office side.

**Wiring it to Airtable.** The `PROJECT`, `SPACES` and `SEED` constants at the top of the `<script>`
are the shape of one project's rows from the six-table model (Space Types, Item Templates, Projects,
Spaces, Selections, Options). Replace those three with a fetch, and point `save()` at a write-back
endpoint — the rest of the page is unchanged.
