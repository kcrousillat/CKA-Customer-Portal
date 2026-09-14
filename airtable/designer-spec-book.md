# When the spec comes from the designer

Worked from Jaime Blomquist Interiors' drawings for the Paperny Residence:
**ID 3.0 Finish Schedule**, **ID 3.1 Fixture Schedule**, and a 27-page spec
book, released 4 Aug 2026.

This is a better source than any vendor quote, and it arrives first. The
vendor quotes what the designer specified; the designer's book says what it is
and why.

## The tag is the join key

Every item carries a code — `PL-1`, `HD-7`, `T-3`, `SDH-2`, `PT-2` — and
**everyone on the job uses it**. The Ferguson plumbing bid lists `HD-1` against
the same appliance pull the designer's book calls `HD-1`. The installer works
from it. The drawings label it.

That is the thing our base was missing, and it is now a **Spec tag** field on
Selections and on Options. It means a CKA row can be traced back to the
designer's schedule and across to the vendor's quote line, and that "what is
PL-34?" has an answer.

It belongs on the job, not in the catalog: `PL-1` is *this* job's kitchen
faucet and something else entirely on the next one.

One tag can serve several rooms — `PL-8` and `PL-9` appear in all three baths,
`G-1` almost everywhere. Same product, specified once, used in many places.

## The taxonomy is almost exactly our trades

| Tag | What it is | Where it lands for us |
|---|---|---|
| `PT` | Paint | Paint |
| `ST` | Stain | Paint |
| `B` / `CAS` | Baseboard / casing | Cabinetry & millwork |
| `T` / `G` | Tile / grout | Tile & stone |
| `SL` | Slab | Tile & stone |
| `D` / `DH` | Door / door hardware | Doors |
| `HD` | Cabinet & appliance pulls | Hardware |
| `PL` | Plumbing | Plumbing Fixtures |
| `AP` | Appliances | Appliances |
| `LT` | Lighting | Lighting & electrical |
| `MIR` | Mirror | Glass & mirrors |
| `PA` | Bath accessories | Plumbing Fixtures |
| `SDH` | Shower door hardware | Glass & mirrors |

Two of those are quiet confirmations of decisions made without seeing this
document. **`SDH` exists as its own tag type** — the designer really does spec
shower door hardware separately, which is why the Shower door pull is its own
Optional item. And **`LT-1`…`LT-8`** are per-room lighting, alongside the
recessed lighting decision.

The room pages also line up: kitchen, laundry/pantry, master bath, bath #2,
bath #3, living room, and **outdoor shower** — which only got a room type
yesterday.

## The card format, and what we are missing

Both schedules use the same blank card, which is the designer's canonical
shape:

    #   MANUFACTURER   MODEL NAME   MODEL #   SIZE   COLOR   FINISH   NOTES

Six data fields plus notes and the tag. Our owner-entry boxes give **four**.
Today they map:

| Designer's field | Ours |
|---|---|
| Manufacturer | Owner supplier |
| Model name | *folded into model* |
| Model # | Owner model |
| Size | *nowhere* |
| Color | Owner color |
| Finish | Owner finish |
| Notes | Owner notes |

**Size has no home**, and model name and model number share one. Worth deciding
whether the four boxes should become six to match the industry format. Against
it: four boxes is already a lot to put in front of an owner, and most items do
not need size. For it: this is the format every designer in the trade uses, and
matching it means a spec card can be transcribed without judgement calls.

## What it confirmed that a quote could not

The Ferguson plumbing quote had no brands anywhere — only their own SKUs. The
designer's book names them, which settles the leading-letter rule:

    Ferguson N1030-5103-15S  ->  Newport Brass Chesterfield 1030-5103/15S
    Ferguson EELGRU13322WH0C ->  Elkay Quartz Classic ELGRU13322WH0C
    Ferguson IPRO750WCDK     ->  InSinkErator 79850K-ISE
    Ferguson ISTS00          ->  InSinkErator 76696 countertop air switch

Note the real Newport Brass number uses a slash — `1030-5103/15S` — the same
shape as the Sub-Zero models. Ferguson strips punctuation in its SKUs.

Also named: **Emtek** for door and cabinet hardware, **Trustile TS3000** for
interior doors, **Sherwin Williams** for all paint, **Mapei** grout,
**Smith & DeShields** for trim.

And the paint schedule is exactly the structure we generate:

    PT-1  Interior walls, typical      SW 7005 Pure White
    PT-2  Base & door casing           SW 7757 High Reflective White
    PT-3  Drywall ceilings, typical
    PT-4  Cabinetry                    SW 7009 Pearly White
    PT-5..7  per room

`PT-2` covering base *and* casing is worth noting: they are two rows for us
because they are two orders, but one colour — which is why the casing
description says they are chosen together.

## Every item has a product URL

The spec book links each product to the manufacturer's or retailer's page. Our
Options table already has **Product link**, so those transcribe directly, and
the owner gets a way to see the real thing.

## Ask for this first

When a designer is involved, this book is the document to ask for. It arrives
before the vendor quotes, it names brands the quotes do not, and its tags are
how the whole job refers to itself.
