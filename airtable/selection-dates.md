# When a selection is due

## The rule

    Needed by  =  Project "Contract executed"  +  the item's Selection group allowance

Group 1 is 30 days after contract, group 2 is 60, group 3 is 90, group 4 is 120,
group 5 is 150. Those allowances live in the **Selection groups** table and are
meant to be edited — if a job needs group 1 in 20 days instead of 30, change the
number in that one cell.

This replaces the original rule, which was construction start minus each item's
lead time. That gave an owner 283 private deadlines, one per row, and made every
long-lead item read as months overdue the moment a construction date moved. The
groups come straight from the Owner Selections sheet CKA has always used.

## Where each piece lives

| What | Where |
| --- | --- |
| Contract execution date | Projects → `Contract executed` (`fld6DGWo7ZTN0fGRN`) |
| The five groups and their allowances | Selection groups `tblST2fJbAQweq9Fx` |
| Which group a library item is in | Item Templates → `Selection group` (`fldX69p2ePF6iAsMj`) |
| Which group a live row is in | Selections → `Selection group` (`fldxYP31nLBDGSjpZ`) |
| The group number, for the portal | Selections → `Group number` (`fldOjpHBo1wtTOAOi`, a lookup — read only) |
| The computed date | Selections → `Needed by` |

## Nothing recalculates itself

`Needed by` is **stored, not calculated**, and that is on purpose: a job part way
through should not have its dates shift under the owner because somebody edited
the library. So two changes do nothing until **Recompute dates** is ticked on the
project:

- a changed contract execution date
- a changed allowance on a Selection group

Tick the box on the Projects row. The automation rewrites every date on that job
and writes what it did into `Setup log`. Other jobs are untouched.

## What the recompute reports

- **healed** — rows that had no group and took the one from their library item.
  This is how the 283 rows built before the field existed got a group without
  anyone editing cells. It only ever fills a blank; a group set by hand survives.
- **ungrouped** — rows with no group anywhere. These get a *blank* date, not a
  guessed one. A blank is visibly missing; a wrong date is not.
- **tight** — rows where the due date plus the trade's lead time lands *after*
  the construction start. Either the group allowance is too generous for this
  job or the construction start is too close to contract. This is the only job
  lead time still does.

## Lead time

`Lead time (weeks)` stays on every row, but it no longer sets any date. It is how
long the thing takes to arrive once ordered, which is what the "tight" check
above needs and what the portal now labels **Time to deliver**.

## Assigning groups to new library items

Set `Selection group` on the Item Template. New rooms pick it up at build;
existing jobs pick it up on the next Recompute. An item with no group produces
rows with no due date — which is the loud failure, deliberately.
