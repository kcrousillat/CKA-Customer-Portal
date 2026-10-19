# Starting a session for a new job

Paste the block at the bottom into a fresh session. Everything above it is the
reasoning, which you do not need to read again.

## What a separate session does and does not do

**It does** keep the conversation clean. The assistant stops carrying one job's
room counts, record IDs and half-finished decisions into another job's
questions. Most of the risk you are worried about is exactly this, and it is
real: the worst mistakes in this project came from acting on a stale assumption
rather than from a wrong click.

**It does not** separate the data. Every session talks to the same Airtable base
(`appfRsDMRMX4sGSPK`), the same Worker, the same repo and the same branch. There
is no sandbox. A write aimed at the wrong project in a new session lands on the
real job just as hard as it would here.

So the separation is worth doing, and it is not a safety net. What actually
protects a job is that every write is filtered to one project record ID, and
that the assistant reads before it writes.

## The rule that makes it safe

**Name the job in the instruction.** Not "add a backsplash to the kitchen" —
"add a backsplash to the Kitchen on *Hahitti*". One word, and it removes the
whole class of mistake you are asking about.

If an instruction does not name a job and more than one job exists, the
assistant should ask rather than guess. That is now written into CLAUDE.md.

## The branch trap — read this one

Your deploy script downloads from one hard-coded branch:

    claude/exciting-heisenberg-pqq69a

A new session that develops on a different branch will commit and push happily,
report success, and **none of it will ever reach your Worker**, because the
script does not look at that branch. The portal would silently stay on the old
code while everything looked fine.

So: a new session must be told to use this same branch, or the branch name in
`tools/update-cka-portal.ps1` has to change to match. The starter block below
says so.

## Library versus job

Worth keeping straight, because it decides how far a change reaches:

- **The library** — Item Templates, Space Types, Palettes, Selection groups,
  Trades, Sections. Shared by every job. A change here affects every job built
  from now on and **does not** backfill a job already built.
- **A job** — the Project row and its Spaces, Selections and Room Plan lines.
  A change here affects only that job.

Most confusion between two jobs is really confusion about which of these two a
change belongs in. "Make backsplashes owner-entered" is a library change.
"Mark this roof flat" is a job change.

---

## Paste this into the new session

> This is the CKA Selections portal repo. Read CLAUDE.md, STATUS.md and
> `airtable/new-job-questionnaire.md` before doing anything.
>
> **Branch: work on `claude/exciting-heisenberg-pqq69a` and push there.** The
> Desktop deploy script reads that branch by name, so anything pushed elsewhere
> never reaches the Worker.
>
> **Base `appfRsDMRMX4sGSPK`. There is one existing job: Hahitti Residence
> (`recVd9NcH8pGmH8mm`), which is live-ish and must not be touched in this
> session.** Every write you make should be filtered to the new project's record
> ID. If I give you an instruction that does not name a job, ask me which one
> before acting.
>
> I want to set up a new job. I will answer the questionnaire in
> `airtable/new-job-questionnaire.md`. Build the project row, load the starter
> plan, enter the room counts, build the rooms, and switch on the optional items
> I list. Leave the owner email addresses blank until I tell you otherwise.
