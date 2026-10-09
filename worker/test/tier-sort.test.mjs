/* The option sort decides what an owner meets first on a colour board, and a
   broken comparator fails silently - the list just looks like the old one.
   Pulls tierRank straight out of the Worker source so the test cannot drift
   from the thing it is testing. */
import fs from "node:fs";

const src = fs.readFileSync("worker/src/index.js", "utf8");
const m = src.match(/const TIER_ORDER = \{[\s\S]*?\n\}/);
if (!m) { console.log("FAIL  could not find tierRank in worker/src/index.js"); process.exit(1); }
const tierRank = new Function(m[0] + "; return tierRank;")();

const sortOpts = (opts) =>
  opts.slice().sort((a, b) => tierRank(a.tier) - tierRank(b.tier) ||
                              a.order - b.order ||
                              a.name.localeCompare(b.name));

let fails = 0;
const ok = (cond, label) => { console.log((cond ? "PASS  " : "FAIL  ") + label); if (!cond) fails++; };
const names = (l) => l.map((o) => o.name).join(",");

// The real Florida Gem list, in catalog order.
const pool = [
  { name: "White Gem", tier: "Standard", order: 1 },
  { name: "Bone Gem", tier: "Standard", order: 2 },
  { name: "Sky Blue", tier: "Standard", order: 3 },
  { name: "Blue Gem", tier: "Standard", order: 4 },
  { name: "Capri", tier: "Upgrade", order: 5 },
  { name: "Hawaiian", tier: "Upgrade", order: 6 },
  { name: "Aqua Gem", tier: "Standard", order: 7 },
  { name: "Aqua Clear", tier: "Standard", order: 8 },
  { name: "Emerald Sea", tier: "Upgrade", order: 9 },
  { name: "French Silver", tier: "Upgrade", order: 10 },
  { name: "Lagoon", tier: "Upgrade", order: 11 },
];
const sorted = sortOpts(pool);
ok(names(sorted) === "White Gem,Bone Gem,Sky Blue,Blue Gem,Aqua Gem,Aqua Clear," +
   "Capri,Hawaiian,Emerald Sea,French Silver,Lagoon", "pool finishes: 6 standards then 5 upgrades");
ok(sorted.slice(0, 6).every((o) => o.tier === "Standard"), "no upgrade reaches the first six");
ok(sorted.slice(6).every((o) => o.tier === "Upgrade"), "no standard is stranded after an upgrade");
ok(sorted[0].name === "White Gem" && sorted[5].name === "Aqua Clear",
   "catalog order is kept inside each tier");

// An untiered list must come out exactly as it went in.
const untiered = [
  { name: "Wolf", tier: "", order: 3 },
  { name: "Sub-Zero", tier: "", order: 1 },
  { name: "Cove", tier: "", order: 2 },
];
ok(names(sortOpts(untiered)) === "Sub-Zero,Cove,Wolf", "untiered list keeps plain sort-order");

// Mixed: untiered is neither included nor extra, so it sits between.
const mixed = [
  { name: "Costs more", tier: "Upgrade", order: 1 },
  { name: "Not priced", tier: "", order: 2 },
  { name: "Included", tier: "Standard", order: 3 },
];
ok(names(sortOpts(mixed)) === "Included,Not priced,Costs more", "standard, untiered, upgrade");

// Case and whitespace come from a human-editable select.
ok(tierRank("standard") === 0 && tierRank("STANDARD") === 0, "tier match ignores case");
ok(tierRank(null) === 1 && tierRank(undefined) === 1, "missing tier does not crash or sort first");
ok(tierRank("Something else") === 1, "an unknown tier sorts as untiered, not as standard");

console.log(fails ? "\n" + fails + " FAILED" : "\nall passed");
process.exit(fails ? 1 : 0);
