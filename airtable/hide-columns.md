# Which columns to hide, and why

Airtable has no cell locking. Hiding a column in a view and then locking that
view is the closest thing, and it is worth doing — most accidental damage is a
mistyped cell or a dragged fill handle in the grid, and hiding stops both.

Be clear about what it is not: a hidden field still shows when a record is
expanded (there is a "show hidden fields" toggle in there), and the base owner
can always unlock the view. It reduces accidents. It does not stop anyone
determined, and it is not a permission.

It breaks nothing else. The portal, the Worker and every automation read and
write fields directly, not through a view, so hiding a column has no effect on
any of them.

## Marked before they are hidden

Airtable cannot colour a column - fields have no colour property. Only dropdown
choices are coloured, and conditional colouring works on rows, not columns.

So the don't-touch fields carry a **description starting "DO NOT EDIT"**
instead. That shows as an information icon on the column header and as text
under the field name whenever a record is expanded - which is the moment
someone is about to type in it. Not red, but it lands at the right time, and it
says *why*, which a colour cannot.

Renaming the fields with a lock emoji was the other option and was rejected:
the Worker, the portal and all four automation scripts find these fields **by
name**. Renaming "Approved by" would break the approval write on the live
portal. Not worth a visual cue.

## How, per table

1. Open the table, main **Grid view**.
2. Bottom toolbar → **Hide fields** → switch off the ones listed below.
3. View menu (click the view name) → **Lock view**.

Unlock it the same way when something genuinely needs changing. Unlocking is
the point at which you are meant to stop and think, which is most of the value.

## Selections — the one that matters

203 rows on a job, and it holds the approval record. Hide:

| Column | Why |
|---|---|
| Project, Space, Item Template | These three are what make a row belong somewhere. Clearing one orphans the row — invisible on every screen that filters by job. Fifty rows were already lost this way once. |
| Approved by, Approved on, Approved option | The record of what the owner agreed to. Written by the portal. Editing by hand falsifies it, and this is the field you would be asked about in a dispute. |
| Submitted by, Submitted on | Same, for owner-specified items. |
| Sort order | Calculated when the row is generated. Typing in it scrambles the order of the owner's portal. |
| Supersedes, From field: Supersedes, From field: Depends on | Change-request plumbing. Written by the portal when an owner asks to change something already approved. |
| Optional item | A lookup — not editable anyway. Hidden to reduce noise. |
| Allowance, Actual cost | Structured for v2, deliberately empty. |

Leave visible: Item, Status, Mode, Trade, Section, Lead time, Needed by,
Description, Palette category, Catalog brands, Load catalog options, Options,
Depends on, all the Owner fields, Internal notes.

## Options

| Column | Why |
|---|---|
| Selections | A second, legacy link to the same table as **Selection**. Two near-identical columns side by side is a trap — sooner or later something gets linked to the wrong one. |
| Price delta | v2, deliberately empty. |

## Spaces

| Column | Why |
|---|---|
| Selections | Hundreds of linked rows. Nothing good comes of editing it here. |
| Room Plan | Written by the build, so it shows what each plan line created. |
| Sort order | Sets room order in the portal; set by the build. |

## Projects

| Column | Why |
|---|---|
| Spaces, Selections, Room Plan | Link fields holding hundreds of rows each. |

Leave **Setup log** visible — it is how you see what the last build did.

## Item Templates

| Column | Why |
|---|---|
| Selections | A reverse link to every row ever generated from that template. |

Everything else stays: editing the library is the whole point of this table.

## Room Plan

| Column | Why |
|---|---|
| Rooms built | Written by the build. It is the record of what each line created. |

## Palettes, Sections, Trades

Nothing to hide. These three are small and editing them is the point.

Worth knowing that Sections and Trades are also where the most damage per
keystroke is done — re-pointing one trade on 13 Sep moved an entire window
package under a mirrors heading. They cannot be protected by hiding, only by
the health check on the backlog.
