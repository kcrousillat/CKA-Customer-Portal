// Copies worker/src/leads.html into worker/src/index.js as the LEADS_HTML string.
//
// Why: the deploy script on Kevin's laptop downloads exactly one code file,
// index.js. A page kept anywhere else would never reach the live Worker, so the
// leads page has to travel inside it. leads.html is the copy to edit.
//
//   node tools/embed-leads.mjs          rewrite index.js
//   node tools/embed-leads.mjs --check  fail if index.js is out of date
//
// The logo is the official file in brand/, inlined so the page needs nothing
// else from the server.
import fs from "node:fs";

const PAGE = "worker/src/leads.html";
const WORKER = "worker/src/index.js";
const LOGO = "brand/cka-logo.png";

const logo = "data:image/png;base64," + fs.readFileSync(LOGO).toString("base64");
const html = fs.readFileSync(PAGE, "utf8").replace("__CKA_LOGO__", logo);
const line = "const LEADS_HTML = " + JSON.stringify(html) + ";";

const src = fs.readFileSync(WORKER, "utf8");
const re = /^const LEADS_HTML = .*;$/m;
if (!re.test(src)) {
  console.error("No `const LEADS_HTML = ...;` line found in " + WORKER);
  process.exit(1);
}
const next = src.replace(re, () => line);

if (process.argv.includes("--check")) {
  if (next !== src) {
    console.error("index.js is stale: run node tools/embed-leads.mjs");
    process.exit(1);
  }
  console.log("index.js carries the current leads page.");
} else {
  fs.writeFileSync(WORKER, next);
  console.log(`Embedded ${PAGE} (${Math.round(html.length / 1024)} KB) into ${WORKER}.`);
}
