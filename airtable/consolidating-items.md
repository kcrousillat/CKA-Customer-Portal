# When several rows should be one row

Worked from the stair, which had five decisions on it — tread & riser material, railing design,
railing & handrail finish, stair lighting, and a stair paint line under Whole house — and now has
one.

Kevin's read: *"there's too many items with really not any clear distinction on how we're entering
the information."* That is the symptom to watch for. Not "this list is long" — long is fine — but
**an owner reaching a row and not knowing what kind of answer it wants.**

## The rule, and where it bends

The standing rule is still: **a row exists where somebody would place a separate order; a box
exists where a fact has to be recorded exactly.**

The stair breaks the second half of that, because the five facts are not five orders in the way a
kitchen's are. They are one conversation — what the staircase is going to be — that happens to
touch four trades. An owner does not decide the railing finish independently of the railing
design, and they cannot say anything useful about stair lighting until they know whether there are
step lights at all.

So the amendment: **a row exists where somebody would place a separate order, unless the owner
cannot answer the rows independently. Then it is one row and the boxes carry the parts.**

## What one row costs

Three things, all of which apply to the stair and should be checked before collapsing anything
else.

**One lead time for four deadlines.** Lead time and Needed by live on the row. Collapsing takes
the longest of them — the stair now carries 12 weeks, the railing's — which means the owner is
asked about the paint color long before the painter needs it. The alternative is worse: take the
shortest and the railing is ordered late.

**One trade for four trades.** The row carries Metals / railings, because the railing is the
biggest piece. The stone yard, the electrician and the painter no longer see their part of the
stair when filtering Selections by trade. On a job where that filter is how work gets handed out,
this is a real loss.

**One approval for four orders.** The owner approves the staircase once. Nothing records that they
saw the tread material separately from the paint colour — so if they later say they never agreed
to the riser finish, the record is a single row with four boxes in it, not four stamped approvals.

## The deadline that does not fit

Step lights are roughed in before drywall closes. Everything else on the stair can be settled
months later. Folding lighting into the row means the earliest hard deadline on the stair is now
buried inside a box on a row dated by the railing.

That is why the item's description leads with it as a standing warning rather than relying on the
date: *"step lights are roughed in before drywall closes — if there is any chance you want them,
say so early even if nothing else here is settled."*

If a job ever misses a step-light rough-in because of this, split lighting back out. It is one
row and one unticked checkbox.

## The four-box ceiling is real

Four boxes, because four fields store the answers — Owner supplier, model, color and finish. Five
facts do not fit.

The stair got away with it because one of its five was **discussion, not a fact**: "stair and
railing design" is the conversation, and the portal already renders a free-text
**"Anything we should know"** box under the four entry boxes on every owner-specified item. That
box is not counted in the four and needs no configuration.

So before deciding something does not fit: **check whether one of the facts is really a note.**
If two of them are real facts and there are already four, it does not fit, and the answer is two
rows.

## Doing it

1. Pick the row that survives and rename it to the whole subject (`Railing design` → `Stair &
   railing`). Keeping one of the originals means the selections already generated from it stay
   linked, so nothing is orphaned.
2. Set **Default mode** to *Owner specifies* and fill **Owner boxes** with the labels, in order.
3. Take the **longest** lead time of the group.
4. Write the description so each box is named and explained, and put any hard deadline at the top.
5. Untick **Active** on the rows being absorbed — never delete them. Jobs already carrying them
   keep working.
6. If one of the absorbed items was the paint line, untick **Paint row** on that Space Type, or
   future jobs get both. Note in the Space Type why.
7. **Fix the live jobs by hand.** The library never reaches rooms already built. On each existing
   job: rename the surviving row, set its mode, lead time, description and sort order, and set the
   absorbed rows to **Not applicable** — which hides them from the owner without destroying the
   record — with a line in Internal notes saying where they went.

Step 7 is the whole cost of doing this late. On the practice job it was five rows. On a job with
an owner already in the portal it would also be a conversation.
