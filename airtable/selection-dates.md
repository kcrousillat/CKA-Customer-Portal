# When a selection is due

## The rule

    Needed by  =  Project "Construction start"  +  the item's Selection group allowance

Group 1 is 30 days after the job breaks ground, group 2 is 60, group 3 is 90,
group 4 is 120, group 5 is 150. The owner has the first months of the build to
make the decisions, in five rounds rather than item by item.

Those allowances live in the **Selection groups** table and are meant to be
edited — if a job needs group 1 in 20 days instead of 30, change the number in
that one cell.

This replaces the original rule, which was construction start **minus** each
item's lead time. Same anchor, opposite direction. That version gave an owner
283 private deadlines, one per row, and made every long-lead item read as months
overdue the moment a construction date moved.

The groups themselves come from the Owner Selections sheet CKA has always used.
That sheet counted from contract execution; the base counts from construction
start, which is the date CKA actually manages the job against.

## Where each piece lives

| What | Where |
| --- | --- |
| The anchor date | Projects → `Construction start` |
| The five groups and their allowances | Selection groups `tblST2fJbAQweq9Fx` |
| Which group a library item is in | Item Templates → `Selection group` (`fldX69p2ePF6iAsMj`) |
| Which group a live row is in | Selections → `Selection group` (`fldxYP31nLBDGSjpZ`) |
| The group number, for the portal | Selections → `Group number` (`fldOjpHBo1wtTOAOi`, a lookup — read only) |
| The computed date | Selections → `Needed by` |

`Projects.Contract executed` exists and is recorded for reference, but drives
nothing. It is safe to leave blank. It is also the field most likely to be
filled in by mistake when someone means Construction start — if dates do not
move, check which of the two was edited.

## Nothing recalculates itself

`Needed by` is **stored, not calculated**, and that is on purpose: a job part way
through should not have its dates shift under the owner because somebody edited
the library. So two changes do nothing until **Recompute dates** is ticked on the
project:

- a changed construction start
- a changed allowance on a Selection group

Tick the box on the Projects row. The automation rewrites every date on that job
and writes what it did into `Setup log`. Other jobs are untouched.

## What the recompute reports

- **healed** — rows that had no group and took the one from their library item.
  This is how the 283 rows built before the field existed got a group without
  anyone editing cells. It only ever fills a blank; a group set by hand survives.
- **ungrouped** — rows with no group anywhere. These get a *blank* date, not a
  guessed one. A blank is visibly missing; a wrong date is not.

## Lead time

`Lead time (weeks)` stays on every row and sets nothing. It is how long the item
takes to arrive once ordered, which is what the portal now labels **Time to
deliver**.

There is deliberately no warning that compares it against the construction
start. Every due date now falls *after* the start, so such a check would fire on
every row and mean nothing. Catching a decision that arrives too late for its
trade needs that trade's own schedule, which this base does not hold. If that
becomes a real problem, the fix is scheduled trade dates, not a lead-time guess.

## Assigning groups to new library items

Set `Selection group` on the Item Template. New rooms pick it up at build;
existing jobs pick it up on the next Recompute. An item with no group produces
rows with no due date — which is the loud failure, deliberately.
