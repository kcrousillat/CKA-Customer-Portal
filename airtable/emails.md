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

## Still to build: the owner's confirmation

Blocked on one thing only. Airtable's Gmail and Outlook send actions need a
connected mail account, and none is connected to this base - so the owner's
email would have to come from an `airtable.com` address, which is the wrong
face for something a client reads and may reply to.

Once an account is connected, the remaining work is three automations on the
status transitions listed above, built the same way as this one.
