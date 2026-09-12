# Appliances

Appliances are not shaped like windows. A window package is one decision with four options;
a kitchen is a dozen decisions, each drawn from a catalog of hundreds, and the list of decisions
itself changes house to house. Three layers handle that.

## 1. The catalog lives in Palettes

Every model CKA might ever spec, one row each, in the same **Palettes** table that holds the
window colors. A row carries what an owner needs to choose (name, photo, MSRP) *and* what the
job needs to build (width, rough-in notes).

| Field | Appliance meaning |
|---|---|
| Name | How the owner sees it — "48\" built-in refrigerator/freezer" |
| Brand | Sub-Zero · Wolf · Cove · Thermador |
| Category | The slot it fills: Built-in refrigerator, Range, Vent hood, Dishwasher… |
| Model | Manufacturer model number, verbatim |
| Width | Nominal width. Drives the cabinet opening |
| Rough-in notes | Fuel, dedicated circuit, venting CFM, water line, drain, panel-ready |
| MSRP | List price. See below |
| Photo | Product shot |
| Product link | Spec sheet |

**Rough-in notes are the reason this pays for CKA rather than only for the owner.** An approved
appliance schedule is the document the cabinet shop and the MEP rough need — which is exactly why
appliances have to be decided in month one though they are delivered in month ten.

## 2. Each appliance is its own selection

Thirteen item templates on the Kitchen space type, one per slot: built-in refrigerator, freezer
column, undercounter refrigeration, range, cooktop, wall ovens, vent hood, microwave / speed oven,
steam oven, warming drawer, coffee system, dishwasher, ice maker, beverage center, wine storage.

A kitchen with a range has no cooktop; a kitchen with two dishwashers gets a second row. Delete
what does not apply and add duplicates where needed — each template's description says which.

**Brands mix.** Sub-Zero refrigeration beside a Wolf range beside a Cove dishwasher is the normal
case, so unlike windows there is no manufacturer decision gating the rest. Every appliance stands
on its own.

## 3. CKA loads a shortlist, the owner picks from it

Thirty refrigerators is not a decision. On a selection, tick **Load catalog options** and the
automation pulls in every catalog row matching its **Palette category** — narrowed to **Catalog
brands** if you set them, all brands if you don't — then unticks itself and writes what it did
into Internal notes. Delete down to the two or three that fit the opening and the budget.

Ticking it twice adds nothing twice: rows already on the selection are skipped by name.

## MSRP

The portal shows **MSRP**, labelled as such, with a standing note that it excludes installation
and is not the contract number. It is there so an owner can see that one range sits at twice
another before falling in love with it.

CKA's own cost never goes in. The catalog's MSRP is the manufacturer's published list price.

## Getting the catalog in

Sub-Zero's and Thermador's sites are unreachable from the build environment, so catalog data comes
from the manufacturer design guides and spec books — the same route the PGT and ES palettes took.
Send the PDF and the models, specs, images and MSRP are extracted and loaded in bulk.

## Sections inside a room

A kitchen with every appliance slot runs to twenty-six decisions, which is a wall rather than a
list. In the **By room** view, any room with six or more selections splits under headings —
Appliances, Plumbing, Cabinetry & millwork, Tile & stone, Lighting & electrical — each collapsed
with a count of what it is waiting on.

The heading comes from the trade, so nothing needed backfilling and nothing needs maintaining.
The **Section** field on a selection (or on an item template) overrides it, for the cases where
the trade is not how an owner thinks about the item.

Two rules keep it from hiding things: a section holding anything past due opens by itself, and a
room with only one heading never collapses at all.
