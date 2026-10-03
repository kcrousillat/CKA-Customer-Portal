# The inspiration gallery

Kevin already asks every client for inspiration pictures. They arrive as texts
and emails, which means that six months later, standing in a showroom, they are
unfindable. This puts them where the client already is and where the decisions
they inform already live.

## Why it is not just more photos on a selection

A selection can already carry photos, and they look identical to these. They do
different jobs:

| | Selection photo | Inspiration photo |
|---|---|---|
| Means | "This is the sink I mean" | "I like this kitchen" |
| When | At the decision | Long before it |
| Attached to | One line item | A room, or nothing |

Sharing a home would bury the one photo that identifies a tap under forty saved
pictures, so the gallery is its own tab and its own table.

## The caption is the feature

Left alone, people write "love this!!", which cannot be ordered from. So the
box does not say Caption, it asks **"What do you like about it?"** with the
placeholder *"The matte black against the white oak"*. That difference is the
whole value of the thing: the first is a nice picture, the second is a
specification waiting to happen.

The composer does not appear until a photo has been chosen. Asking for a
caption before there is anything to caption makes it a form, and nobody fills
in a form.

## The room tag

Optional - "I just like this" is a real answer, and a required tag would only
get answered at random. But it is offered every time, because it is what keeps
the gallery readable at a hundred photos instead of one scroll nobody reaches
the bottom of. Untagged photos collect under "Whole house, or not tagged yet"
at the end rather than scattering through.

This was built in from day one deliberately. Adding it later means hand-sorting
everything already uploaded.

## What is CKA's and what is the owner's

`Caption` is the owner's and is shown back to them. `Internal note` is CKA's,
never leaves the table, and is the place for "third slab backsplash she has
sent" or "that is a 48in range, not the 36 we budgeted". Same split as Note vs
Internal note in the catalog, for the same reason.

## Mechanics

- Table `Inspiration`, linked to Projects and optionally to Spaces.
- The page shrinks to 1600px before upload, same path as the selection photos -
  so phone photos fit under Airtable's 5MB ceiling and a job-site upload is
  quick. Going through a canvas also drops the EXIF, so the GPS the phone
  stamped in does not travel with it.
- The row is created first, then the file is attached to it, because Airtable's
  upload endpoint needs a record to attach to. **If the upload fails the row is
  deleted again** - a caption with no picture renders as an empty tile.
- 120 photos a job. Generous for real use, and a bound on what a leaked portal
  key can do.
- Owners can remove their own. A key for one job cannot touch another job's
  photos; `worker/test/inspiration.test.mjs` pins that down along with the
  other refusals.

## Confirmed working, 3 Oct

Tested against the live Worker and read back in Airtable: the upload, the
shrink, the caption, the room tag, the right job and the right name on it. A
photo saved with no room comes through with Space empty, which is the "not sure
yet" case working rather than a lost tag - worth knowing before anyone reports
it as a bug.

One claim in this file is reasoned rather than proven: EXIF stripping. Drawing
through a canvas and re-encoding produces a file with no EXIF block and nothing
copies it across, and the shrink itself was checked in Chromium - but the
container cannot reach Airtable's attachment host, so no stored file has been
opened and inspected. Worth one look on a real phone photo if it ever matters.

## Not built yet, and worth doing

**Linking an inspiration photo to a selection.** "You flagged the matte black
in this photo - here are three matte black faucets." That closes the loop from
mood to order, and is the real prize. Left out of the first version on purpose:
better to see whether the gallery gets used at all before building on top of it.
