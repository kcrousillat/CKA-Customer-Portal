# Working agreement

## Kevin's time is the scarce resource

**Default to doing the work, not handing back a task list.** Kevin runs a construction company;
every minute spent dragging files into cells or re-typing a manufacturer's color list is a minute
not spent building houses. Before asking him to do something repetitive, spend real effort finding
a way to do it directly. Assume there is one.

Things already proven to work — reach for these before delegating a chore:

- **Bulk image attachments.** Airtable ingests attachments from any public URL. The repo
  `kcrousillat/CKA-Customer-Portal` is public, so committing an image puts it at a
  `raw.githubusercontent.com/.../refs/heads/<branch>/<path>` URL that Airtable can fetch. Attaching
  39 chips this way was one API call; by hand it would have been 39 drags. Airtable copies the
  image on ingest, so nothing is hot-linked.
- **Extracting from manufacturer PDFs.** `pymupdf` gives exact image positions
  (`get_image_rects`) and can locate labels (`search_for`) to crop vector artwork accurately.
  Better than eyeballing coordinates off a rendered page, and it lets colors be sampled from the
  real chip.
- **Bulk record writes.** The Airtable MCP tools take 50 records per call. Any "add these
  twenty rows" job is one call, not twenty.
- **Automations.** If a task will recur per job, it belongs in an Airtable automation, not in a
  checklist for a person.

When something genuinely can't be done from here, say plainly why (network egress is blocked, a
credential can only be created by him, Airtable requires a human to review script changes) and
make his part as small as possible — one command to paste, one button to click.

## Verify before reporting

Check the result rather than assuming the write landed: read the records back, read the deployed
Worker code, read the automation run history. Several times a change looked applied and had not
been (a superseded row revived, a trigger that fired against a blank record, an automation update
sitting as an unapplied draft).

## Don't guess at manufacturer data

Color names, codes and option lists go in front of clients and get ordered from. Take them from
the brochure or the rep, never from memory or a marketing page — two vendors' "bronze" are
different colors, and that specific confusion is what this product exists to prevent. If it can't
be verified, leave it empty and say so.

## Output for a non-developer

Mark clearly what is a command to paste and what is expected output — pasted sample output has
caused confusing errors twice. Keep explanations concrete: what to click, what it should say, what
to send back if it doesn't.

## Deploys happen on Kevin's laptop, and only there

The project was set up on the **laptop** and lives there. Ask for it by name: any step he has to
run starts with "this one needs your laptop" *before* the command, not after. If he is not at it,
say what is waiting and let him come back — the work is already pushed, so nothing is lost.

**The project is not under `$HOME`.** His Desktop is redirected into OneDrive, so the folder is

    C:\Users\Kevin\OneDrive - CKA Construction Group\Desktop\CKA-Customer-Portal-<branch>\

`cd $HOME\CKA-Customer-Portal` fails on every machine he owns, which is exactly what happened on
9 Oct. Never construct that path by hand — the script finds the folder itself by searching the
Desktop for `wrangler.toml`, which is the whole reason it does that.

There is also **no git clone on any of his machines.** He deploys with the Desktop script, which
downloads the current branch from `raw.githubusercontent.com` and runs `wrangler deploy` itself:

    powershell -ExecutionPolicy Bypass -File "$([Environment]::GetFolderPath('Desktop'))\update-cka-portal.ps1"

That one line is the whole deploy. Never send him `git pull`, `cd worker`, or a bare
`npx wrangler deploy` — those assume a clone he does not have. Keep it to a single line too: a
multi-line paste makes Windows Terminal throw a scary "unexpected execution of commands" warning.
