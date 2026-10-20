/* Runs airtable/daily-digest.js against a stubbed Airtable base.
   The digest decides who gets email and who does not, and it fails silently:
   a wrong filter sends nothing and nobody notices for a day. Worth a test. */
import fs from "node:fs";
const src = fs.readFileSync("airtable/daily-digest.js", "utf8").split("*/")[1];

const now = Date.now();
const ago = (h) => new Date(now - h * 3600 * 1000).toISOString();

const cell = (rec, name) => rec[name] === undefined ? null : rec[name];
const mkTable = (rows) => ({
  selectRecordsAsync: async () => ({
    records: rows.map((r) => ({ id: r.id, getCellValue: (n) => cell(r, n) })),
  }),
});

const projectRows = [
  { id: "p1", "Project name": "Hahitti Residence", "Owner emails": "rami@example.com",
    "Notify CKA": "kevin@ckaconstruction.com, davidf@ckaconstruction.com",
    "Portal link": "https://portal.example/?p=abc" },
  { id: "p2", "Project name": "DEMO — Practice job", "Owner emails": "",
    "Notify CKA": "", "Portal link": "https://portal.example/?p=demo" },
  { id: "p3", "Project name": "Quiet job", "Owner emails": "",
    "Notify CKA": "kevin@ckaconstruction.com", "Portal link": "x" },
  // Its own job, so the presented-options assertions cannot disturb Hahitti's
  // counts and Hahitti stays a regression guard for a digest with none.
  { id: "p4", "Project name": "Presented job", "Owner emails": "dan@example.com",
    "Notify CKA": "nicolas@ckaconstruction.com", "Portal link": "https://portal.example/?p=p4" },
];

const S = (n) => ({ name: n });
const selectionRows = [
  // in window, reportable
  { id: "s1", Item: "Range", "Item and room": "Range (Kitchen)", Status: S("Owner selected"),
    "Status changed": ago(3), Project: [{ id: "p1" }], "Owner supplier": "Wolf",
    "Owner model": "GR486G", "Needed by": "2026-11-18", "Submitted by": "Rami Hahitti" },
  { id: "s2", Item: "Vent hood", "Item and room": "Vent hood (Kitchen)", Status: S("Approved"),
    "Status changed": ago(10), Project: [{ id: "p1" }], "Owner supplier": "Zephyr",
    "Owner model": "AK7000", "Needed by": "2026-11-18", "Submitted by": "Rami Hahitti" },
  { id: "s3", Item: "Driveway", "Item and room": "Driveway", Status: S("Released for order"),
    "Status changed": ago(1), Project: [{ id: "p1" }], "Owner supplier": "", "Owner model": "" },
  // too old
  { id: "s4", Item: "Old one", "Item and room": "Old one (Bath)", Status: S("Approved"),
    "Status changed": ago(50), Project: [{ id: "p1" }] },
  // status we do not report
  { id: "s5", Item: "Parked", "Item and room": "Parked (Bath)", Status: S("On hold"),
    "Status changed": ago(2), Project: [{ id: "p1" }] },
  // DEMO: in window but no recipients at all
  { id: "s6", Item: "Sink", "Item and room": "Sink (Bath)", Status: S("Approved"),
    "Status changed": ago(2), Project: [{ id: "p2" }] },
  // orphan - no project link
  { id: "s7", Item: "Orphan", "Item and room": "Orphan", Status: S("Approved"),
    "Status changed": ago(2), Project: [] },
  // job with CKA list but no owner email -> CKA email only
  { id: "s8", Item: "Toilet", "Item and room": "Toilet (Powder)", Status: S("Owner selected"),
    "Status changed": ago(2), Project: [{ id: "p3" }], "Owner supplier": "Toto" },
  // Newly presented: no supplier or model yet, because the owner has not picked.
  { id: "s9", Item: "Pool finish", "Item and room": "Pool finish (Pool)",
    Status: S("Options presented"), "Status changed": ago(4), Project: [{ id: "p4" }],
    "Owner supplier": "", "Owner model": "", "Needed by": "2027-03-15" },
];

globalThis.base = {
  getTable: (n) => n === "Projects" ? mkTable(projectRows) : mkTable(selectionRows),
};
const out = {};
globalThis.output = { set: (k, v) => { out[k] = v; } };

await (new Function(`return (async () => {${src}})()`))();

let fails = 0;
const ok = (cond, label) => { console.log((cond ? "PASS  " : "FAIL  ") + label); if (!cond) fails++; };

const emails = out.emails;
ok(Array.isArray(emails), "emails is an array");
ok(emails.length === 5, "5 emails: Hahitti owner+CKA, Quiet job CKA, Presented job owner+CKA - got " + emails.length);

const hOwner = emails.find((e) => e.to === "rami@example.com");
ok(!!hOwner, "owner email built for Hahitti");
ok(hOwner.subject === "Hahitti Residence - Your selections update - 3 selections", "owner subject: " + hOwner.subject);
ok(hOwner.body.includes("Range (Kitchen): Wolf - GR486G"), "item and product on one line");
ok(hOwner.body.includes("due November 18, 2026"), "due date on submitted rows");
ok(!hOwner.body.includes("Rami Hahitti"), "owner email does not name the owner back at themselves");
ok(!hOwner.body.includes("Old one"), "row outside the window excluded");
ok(!hOwner.body.includes("Parked"), "On hold excluded");
ok(hOwner.body.indexOf("You sent these to us") < hOwner.body.indexOf("We confirmed these"), "blocks in process order");

const hCka = emails.find((e) => e.to.includes("davidf"));
ok(!!hCka, "CKA email built for Hahitti");
ok(hCka.body.includes("[Rami Hahitti]"), "CKA email names who submitted");
ok(hCka.body.includes("Waiting on you to review"), "CKA headings differ from owner headings");

ok(!emails.some((e) => e.body.includes("Sink (Bath)")), "DEMO silent - no recipients");
ok(!emails.some((e) => e.body.includes("Orphan")), "orphan row with no project excluded");

const quiet = emails.find((e) => e.subject.startsWith("Quiet job"));
ok(!!quiet && quiet.to === "kevin@ckaconstruction.com", "job with no owner email still alerts CKA");
ok(emails.filter((e) => e.subject.startsWith("Quiet job")).length === 1, "and sends only the CKA one");

/* ---- options presented, folded in on 20 Oct 2026 ----
   This block used to be its own immediate email per row. The things that must
   stay true: it appears, it is asked for rather than merely reported, and a
   digest WITHOUT it is still signed off as needing no reply. */
const pOwner = emails.find((e) => e.to === "dan@example.com");
ok(!!pOwner, "owner email built for a job with newly presented options");
ok(pOwner.subject === "Presented job - Options ready for you - 1 selection",
   "subject says options are ready rather than 'update': " + pOwner.subject);
ok(pOwner.body.includes("Ready for you to look at (1)"), "owner heading for presented options");
ok(pOwner.body.includes("Pool finish (Pool)"), "the presented item is listed");
ok(pOwner.body.includes("due March 15, 2027"), "presented rows carry the decision date");
ok(!pOwner.body.includes("Nothing here needs a reply"),
   "a digest that asks for a decision must not say nothing needs a reply");
ok(pOwner.body.includes("waiting on you"), "it says plainly that they are waiting on the owner");
ok(hOwner.body.includes("Nothing here needs a reply"),
   "a digest with no presented options still signs off as needing no reply");

const pCka = emails.find((e) => e.to === "nicolas@ckaconstruction.com");
ok(!!pCka, "CKA email built for the presented job");
ok(pCka.body.includes("Presented to the owner - waiting on them"),
   "CKA heading says who it is waiting on");

ok(emails.every((e) => e.to && e.subject && e.body), "every email has to/subject/body");

console.log("\n--- Hahitti owner email ---\n" + hOwner.body);
console.log(fails ? "\n" + fails + " FAILED" : "\nall passed");
process.exit(fails ? 1 : 0);
