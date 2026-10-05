# The emails

The portal promises the owner an email in four places. For a long time nothing
sent one, which made the page lie to a client on CKA's behalf. This is the
work to close that, plus the internal alert Kevin asked for.

## Two emails, not one

They get confused because the same event fires both.

| | Owner confirmation | CKA heads-up |
|---|---|---|
| Goes to | Owner 1 email, Owner 2 email | Notify CKA |
| Says | "We have your kitchen sink. We will confirm it is buildable and priced, then release it for order." | "Rami just submitted the kitchen sink. Go look at it." |
| From | Must be a CKA address - the client may reply | Airtable's own address is fine; nobody replies |
| Status | **Not built** - waiting on a mail account | **Built** |

## What the portal currently promises

Worth keeping this list, because the emails should match the promises rather
than invent new ones.

1. Footer - "Approvals are confirmed by email to both owners and to CKA."
2. A curated item with no options yet - "You will get an email when they are here."
3. The approve panel - "Both owners get the confirmation email."
4. After an owner-specified submit - "You will get a confirmation email when it is released for order."

So the owner is promised mail on three different events: options arriving
(`Options presented`), approval (`Approved`), and release (`Released for
order`). None of those is built yet.

## Tell CKA when the owner acts

Fires when a selection hits **Owner selected** or **Approved** - the two
things only the owner can do - and emails the job's `Notify CKA` list with the
item, the room, the date it is needed, whatever they typed, and a link to the
record.

Recipients are per-project, not one company-wide list, because the super on
Hahitti is not the super on the next job.

Three fields make this work, and two of them are plumbing:

- `Projects.Notify CKA` - the real one. Comma-separated addresses. Edit here.
- `Selections.Notify CKA` - a lookup. An automation watching Selections cannot
  reach the Project's own fields, so the list has to be visible on the row
  that triggers it.
- `Selections.Notify CKA emails` - a formula, `ARRAYJOIN` of that lookup. The
  email action's To box takes a string and a lookup arrives as a list.

A job with `Notify CKA` empty is excluded by the trigger, so it never fires and
never shows a failed run. DEMO stays quiet until someone fills it in.

## The three owner emails - built, deliberately OFF

| Automation | Fires on | Keeps promise |
|---|---|---|
| Owner email - options are ready | `Options presented` | 2 |
| Owner email - approved | `Approved` | 1 and 3 |
| Owner email - released for order | `Released for order` | 4 |

Each one CCs the job's CKA list except the first, carries what was chosen, and
links straight into the owner's portal rather than telling someone to go and
find an old message.

### Why they are off

Outlook needs IT approval at CKA, so on 4 Oct a personal Gmail was connected to
unblock the setup. A client's approval record must not arrive from someone's
personal inbox: it reads as a private note rather than a company record, and it
puts a personal mailbox in the middle of the paper trail.

So they are built against Airtable's built-in send and left off. That is a
deliberate choice of placeholder - if one is ever switched on by accident it
goes out from an `airtable.com` address, which is merely impersonal, rather
than from a personal Gmail, which is worse. When Outlook is approved, the swap
is replacing the send step in each; the recipients, the copy and the triggers
all stay.

### Two safety catches worth knowing

Neither is an oversight:

- **No owner email on the job means nothing sends.** The trigger requires
  `Owner emails text` to be non-empty. Hahitti has no address for Rami yet - on
  purpose - so these stay silent until one is entered.
- **Nothing fires retroactively.** Turning them on does not email anyone about
  selections that reached those statuses in the past.

### The plumbing, and why there is so much of it

An automation watching Selections cannot read the Project's fields, and an
email To box takes a string where a lookup arrives as a list. So each value the
emails need takes three fields: a formula on Projects, a lookup on Selections,
and an `ARRAYJOIN` formula to flatten it.

| On Projects | Lookup on Selections | Flattened to |
|---|---|---|
| `Notify CKA` | `Notify CKA` | `Notify CKA emails` |
| `Owner emails` | `Owner emails lookup` | `Owner emails text` |
| `Portal link` | `Portal link lookup` | `Portal link text` |

All six are marked DO NOT EDIT. Change the addresses on the Project, and the
portal key to revoke access - `Portal link` follows it.

## "Approved by on", 5 Oct

The first real Outlook confirmation arrived reading:

    Approved by on

Both halves empty. `Approved by` and `Approved on` are written by the Worker's
approve route (`worker/src/index.js`), and that route only exists for a curated
line — the owner picks one of CKA's options and the Worker stamps their name and
the time. An **Owner specifies** line has no such button: the owner types what
they want, hits Send to CKA, and somebody at CKA sets Approved in the grid.
Nothing fills the fields.

That had been a rare case. After the appliances moved to owner input it became
the normal one, and the two blanks sat in the middle of the email whose whole
job is to be the record an owner would point at in a disagreement.

Fixed with a script step ahead of the email (`stamp-approval.js`) that fills both
fields when they are empty — `Approved by` as "CKA Construction Group", which is
accurate rather than evasive, since the owner chose it and CKA confirmed it is
buildable and priced.

Two details worth keeping:

- The step **writes the fields back to the record**, not just into the email.
  The portal's record view and the turnover package read the same two fields and
  were equally blank.
- The email reads the values from the **script's outputs**, not from the record.
  An automation's trigger values are a snapshot taken when it fired, so an email
  step reading the record after the script wrote to it would still print the old
  blanks. This was nearly a silent half-fix.

The opening line changed from "a selection you have approved" to "a selection
that is now approved", because on an owner-specifies line the owner chose it and
CKA approved it — telling them they approved it is not what happened.
