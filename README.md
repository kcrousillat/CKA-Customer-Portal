# CKA Customer Portal — Selections

Owner-facing selections portal. **All data lives in Airtable**; the page holds no rooms, items,
options or photos of its own. Add a space in Airtable and it appears here; delete it and it goes.

```
Airtable  ──►  Cloudflare Worker  ──►  selections-portal.html
(all jobs,      (holds the token,       (static page, one job
 one base)       one job per link)       per link, no secrets)
```

## What's already built

**Airtable base: `CKA Selections` (`appfRsDMRMX4sGSPK`)** — all jobs live here.

| Table | Holds |
|---|---|
| Space Types | 13 room types — bath, kitchen, bar, elevator, pool, whole house… |
| Item Templates | The library: 98 items, each with a default trade, lead time, mode and owner-facing description |
| Projects | One row per job, including the **Portal key** that addresses the owner's link |
| Spaces | The actual rooms on a job |
| Selections | The live decision rows |
| Options | The choices shown on a curated item, with a **Photo** attachment field |

Seeded with one example job (1442 Sunset Isle Terrace) — 13 spaces, 24 selections, 37 options.
Delete or archive it before the first live client.

- `selections-portal.html` — the owner's page
- `worker/` — Cloudflare Worker that proxies Airtable (the only thing that ever sees the token)
- `airtable/expand-space.js` — automation script: add a Space → its selection rows are generated

## Setup, in order

**1. Airtable token.** Create a personal access token scoped to **only** the CKA Selections base,
with `data.records:read`, `data.records:write` and `schema.bases:read`.

**2. Deploy the Worker.**
```bash
cd worker
npx wrangler secret put AIRTABLE_TOKEN     # paste the token — never commit it
npx wrangler deploy
```
Set `ALLOWED_ORIGIN` in `wrangler.toml` to wherever the portal is served once it has a home.

**3. Point the page at it.** Set `API_BASE` near the top of the `<script>` in
`selections-portal.html` to the deployed Worker URL. Host the file anywhere static —
Cloudflare Pages sits next to the Worker and is free.

**4. Wire up the room expansion.** In Airtable → Automations → new automation:
- Trigger: *When record created* → table **Spaces**
- Action: *Run script* → paste `airtable/expand-space.js`
- Add one input variable: name `spaceId`, value = the trigger record's **Airtable record ID**

**5. Send an owner their link.**
```
https://<your host>/selections-portal.html?p=<the project's Portal key>
```
The key is the only credential. Change it on the Projects row to revoke a link.

## Running a job

| To do this | Do it here |
|---|---|
| Add or remove a room | Add/delete a row in **Spaces**. Rows generate automatically; deleting a space does not cascade, so delete its Selections too (group the grid by Space and it's one delete) |
| Change a photo | Drag a new image into **Photo** on the Options row. The portal shows the newest on next load |
| Present options | Add Options rows, set the Selection's Status to *Options presented* |
| Add a one-off item | Add a Selections row by hand and link it to the Space |
| Rename or reorder a heading | Edit the **Sections** table. Rename a row and every room's heading changes on the next portal load. If any selection's own **Section** cell names the old heading, change those too — an override is taken literally |
| Move a trade to a different heading | In **Sections**, take the trade off one row's **Trades** and put it on another. A trade on two rows belongs to whichever has the lower Sort order |
| Improve the library | Edit **Item Templates** — every future job inherits it |
| Drop an item this room doesn't have | Status → *Not applicable*. The row stays in Airtable and in the schedule but disappears from the owner's portal and its progress counts — this is how a shower-only bath loses its Tub row |
| Put something on hold | Status → *On hold*. The owner sees why and nothing to do |
| Confirm an owner-specified item | Status → *Approved*, fill **Approved by** and **Approved on** |

Options with no photo fall back to a color tile from the **Swatch color** field, labelled
*Color sample* so nothing is passed off as product photography.

## What the owner can do

Four views of the same rows — *Holding up the job* (lead time sorted, the one that matters),
*By room*, *By trade*, *Approved record* — plus two printable documents: a working copy
(everything, by trade, by blocking date) and a record copy (approved only, by room, with samples
and approval stamps).

Approving types a name; the Worker writes **Status**, **Approved option**, **Approved by** and
**Approved on** and the row locks. *Request a change* never edits that record — it writes a new
Selection with **Supersedes** pointing at the original and marks the original *Superseded*.

The Worker accepts exactly three writes (approve, submit, request change), only on rows belonging
to the project whose Portal key was presented, and never on an already-approved row.

## Not built yet

- **Approval emails.** The plan calls for confirmation to both owners and CKA from
  ckaconstruction.com with SPF/DKIM. Add it as an Airtable automation on *Status → Approved*.
- **Owner photo upload.** Owners paste links in the notes field; attachment upload needs the
  Airtable upload API.
- **Allowances and dollars.** Fields exist (`Allowance`, `Actual cost`, `Price delta`) and are
  deliberately ignored by the portal.

## Opening the file without a Worker

It renders two sample rows and says *Preview* at the top. That is layout review only — a published
artifact of this page can never reach Airtable, because artifact pages are blocked from calling
external APIs.
