/* Inspiration gallery, checked against the real Worker with Airtable mocked.
 *
 * Run it:   node worker/test/inspiration.test.mjs
 *
 * Same shape as photo.test.mjs and for the same reason: this endpoint takes a
 * file and free text from anyone holding a portal key, so what it refuses is
 * the part worth pinning down. The rollback case matters most - a caption with
 * no picture renders as an empty tile in the owner's gallery.
 */
import worker from "../src/index.js";

const PROJ = "recPROJECT0000001";
const OTHER = "recPROJECT0000002";
const SPACE = "recSPACE000000001";
const OTHERSPACE = "recSPACE000000002";
const INSPO = "recINSPO000000001";

const env = { AIRTABLE_BASE: "appTEST", AIRTABLE_TOKEN: "tok", ALLOWED_ORIGIN: "*" };

let inspoRows = [];      // what linkedRecords will find
let inspoOwner = PROJ;   // which job the fetched Inspiration row belongs to
let uploadFails = false; // make content.airtable.com return 500
let calls = [];          // every call, so rollback can be asserted
let created = null;      // the fields sent to Airtable on create

function J(o) {
  return new Response(JSON.stringify(o), { status: 200, headers: { "Content-Type": "application/json" } });
}

globalThis.fetch = async (url, opts = {}) => {
  const u = String(url);
  const method = opts.method || "GET";
  calls.push(method + " " + u.replace(/^https:\/\/[^/]+/, ""));

  if (u.includes("content.airtable.com")) {
    if (uploadFails) return new Response("nope", { status: 500 });
    return J({ id: INSPO, fields: { Photo: [{ url: "https://x/1.jpg" }] } });
  }
  if (u.includes("/Projects")) {
    const f = new URL(u).searchParams.get("filterByFormula") || "";
    const want = f.match(/\{Portal key\} = "([^"]*)"/);
    return J({ records: want && want[1] === "GOODKEY"
      ? [{ id: PROJ, fields: { "Portal key": "GOODKEY", "Project name": "Hahitti", "Owner 1 name": "Rami Hahitti" } }]
      : [] });
  }
  if (u.includes("/Spaces/" + OTHERSPACE)) return J({ id: OTHERSPACE, fields: { Project: [OTHER] } });
  if (u.includes("/Spaces/")) return J({ id: SPACE, fields: { Project: [PROJ] } });
  if (u.includes("/Inspiration/")) {
    if (method === "DELETE") return J({ deleted: true, id: INSPO });
    return J({ id: INSPO, fields: { Project: [inspoOwner] } });
  }
  if (u.includes("/Inspiration")) {
    if (method === "POST") {
      created = JSON.parse(opts.body).records[0].fields;
      /* Stand in for Airtable's own validation. The mock used to accept any
         shape, which is exactly why a link field sent as [{id}] instead of
         ["rec..."] passed the tests and then 422'd against the real base. */
      for (const f of ["Project", "Space"]) {
        const v = created[f];
        if (v === undefined) continue;
        if (!Array.isArray(v) || v.some((x) => typeof x !== "string" || !/^rec/.test(x))) {
          return new Response(JSON.stringify({ error: { type: "INVALID_RECORD_ID",
            message: `Value "${v}" is not a valid record ID.` } }), { status: 422 });
        }
      }
      return J({ records: [{ id: INSPO, fields: {} }] });
    }
    return J({ records: inspoRows });
  }
  return J({ records: [] });
};

const img = (n) => Buffer.alloc(n, 7).toString("base64");
const add = (body) => worker.fetch(new Request("https://w/api/inspiration",
  { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }), env);
const remove = (id, body) => worker.fetch(new Request(`https://w/api/inspiration/${id}/remove`,
  { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }), env);

let failed = 0;
const ok = (s, c) => { if (!c) failed++; console.log(`${c ? "PASS" : "FAIL"}  ${s}`); };
process.on("exit", () => {
  console.log(failed ? `\n${failed} FAILED` : "\nall passed");
  if (failed) process.exitCode = 1;
});

const GOOD = { key: "GOODKEY", caption: "The matte black against the white oak",
               contentType: "image/jpeg", data: img(1000), filename: "IMG_1.jpg" };
let r, b;

calls = [];
r = await add({ ...GOOD, spaceId: SPACE });
b = await r.json();
ok("happy path returns 200 and an id", r.status === 200 && b.ok === true && b.id === INSPO);
ok("creates the row, then attaches the photo to it",
   calls.some((c) => c.startsWith("POST /v0/appTEST/Inspiration")) &&
   calls.some((c) => c.includes("/Photo/uploadAttachment")));
ok("links are arrays of plain record-id strings, which is what REST takes",
   Array.isArray(created.Project) && created.Project[0] === PROJ &&
   Array.isArray(created.Space) && created.Space[0] === SPACE);
ok("stamps who added it and when",
   created["Added by"] === "Rami Hahitti" && typeof created["Added on"] === "string");

r = await add(GOOD);
ok("a photo with no room is fine - 'not sure yet' is a real answer", r.status === 200);

r = await add({ ...GOOD, key: "WRONGKEY" });
ok("wrong portal key is refused", r.status === 404);

r = await add({ ...GOOD, caption: "   " });
b = await r.json();
ok("no caption is refused -> " + JSON.stringify(b.error), r.status === 400);

r = await add({ ...GOOD, spaceId: OTHERSPACE });
ok("a room on another job is refused (403)", r.status === 403);

r = await add({ ...GOOD, spaceId: "not-a-record-id" });
ok("a malformed room id is refused (400)", r.status === 400);

r = await add({ ...GOOD, contentType: "text/html", data: img(100) });
ok("non-image refused (400)", r.status === 400);

r = await add({ ...GOOD, data: img(5 * 1024 * 1024) });
ok("oversize refused (413)", r.status === 413);

// Rollback: if the picture cannot be stored, the row must not survive.
uploadFails = true;
calls = [];
r = await add(GOOD);
ok("upload failure surfaces as an error (502)", r.status === 502);
ok("...and the half-made row is deleted again, not left as an empty tile",
   calls.some((c) => c.startsWith("DELETE /v0/appTEST/Inspiration/")));
uploadFails = false;

inspoRows = Array.from({ length: 120 }, (_, i) => ({ id: "rec" + i, fields: { Project: [PROJ] } }));
r = await add(GOOD);
b = await r.json();
ok("121st photo on a job refused (409) -> " + JSON.stringify(b.error), r.status === 409);
inspoRows = [];

r = await remove(INSPO, { key: "GOODKEY" });
ok("remove works for a photo on this job", r.status === 200);

r = await remove(INSPO, { key: "WRONGKEY" });
ok("remove with the wrong key is refused", r.status === 404);

// The one that matters: a real key for job A must not reach job B's photo.
inspoOwner = OTHER;
calls = [];
r = await remove(INSPO, { key: "GOODKEY" });
ok("a valid key cannot delete another job's photo (403)", r.status === 403);
ok("...and nothing was deleted", !calls.some((c) => c.startsWith("DELETE")));
inspoOwner = PROJ;
