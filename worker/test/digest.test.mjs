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
ok(emails.length === 3, "3 emails: Hahitti owner+CKA, Quiet job CKA - got " + emails.length);

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

ok(emails.every((e) => e.to && e.subject && e.body), "every email has to/subject/body");

console.log("\n--- Hahitti owner email ---\n" + hOwner.body);
console.log(fails ? "\n" + fails + " FAILED" : "\nall passed");
process.exit(fails ? 1 : 0);
