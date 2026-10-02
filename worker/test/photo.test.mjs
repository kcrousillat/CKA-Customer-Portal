/* Photo upload, checked against the real Worker with Airtable mocked.
 *
 * Run it:   node worker/test/photo.test.mjs
 *
 * No framework and no install - node runs it as-is. The point is the refusals:
 * this endpoint takes a file from anyone holding a portal key, so the cases
 * that matter are the ones it says no to.
 */
import worker from "../src/index.js";

const SEL = "recPHOTOTEST12345";
const env = { AIRTABLE_BASE:"appTEST", AIRTABLE_TOKEN:"tok", ALLOWED_ORIGIN:"*" };
let photoCount = 0, uploadCall = null;

globalThis.fetch = async (url, opts={}) => {
  const u = String(url);
  const J = (o)=> new Response(JSON.stringify(o), {status:200, headers:{"Content-Type":"application/json"}});
  if (u.includes("content.airtable.com")) {
    uploadCall = { url:u, headers:opts.headers, body:JSON.parse(opts.body) };
    return J({ id:SEL, fields:{ "Owner photos":[{url:"https://x/1.jpg", width:1600, height:1200}] } });
  }
  if (u.includes("/Projects")) {
    // Airtable applies filterByFormula server side; the mock has to as well,
    // or every key looks valid and the auth test proves nothing.
    // searchParams, not decodeURIComponent: a space is "+" in a query string
    // and decodeURIComponent leaves it as a plus, so the match never fires.
    const f = new URL(u).searchParams.get("filterByFormula") || "";
    const wanted = f.match(/\{Portal key\} = "([^"]*)"/);
    return J({ records: wanted && wanted[1] === "GOODKEY"
      ? [{ id:"recPROJ", fields:{ "Portal key":"GOODKEY" } }] : [] });
  }
  if (u.includes("/Selections/")) return J({ id:SEL, fields:{ Project:["recPROJ"], Status:"Not started",
      "Owner photos": Array(photoCount).fill({url:"https://x/old.jpg"}) } });
  throw new Error("unexpected fetch: " + u);
};

const call = (body) => worker.fetch(new Request(`https://w/api/selection/${SEL}/photo`,
  { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) }), env);

const img = (n)=> Buffer.alloc(n, 7).toString("base64");
let failed = 0;
const ok = (s,c)=> { if (!c) failed++; console.log(`${c ? "PASS" : "FAIL"}  ${s}`); };
/* Exit non-zero on a failure. Printing FAIL and exiting 0 means a broken run
   still looks fine to anything checking the exit code, which is how a failing
   test quietly stops being a test. */
process.on("exit", () => {
  console.log(failed ? `\n${failed} FAILED` : "\nall passed");
  if (failed) process.exitCode = 1;
});
let r, b;

r = await call({ key:"GOODKEY", contentType:"image/jpeg", data:img(1000), filename:"IMG_0042.HEIC" });
b = await r.json();
ok("happy path returns 200 + photos", r.status===200 && b.ok===true && b.photos.length===1);
ok("upload hits content host on the right record+field",
   uploadCall.url === "https://content.airtable.com/v0/appTEST/"+SEL+"/Owner%20photos/uploadAttachment");
ok("sends the bearer token", uploadCall.headers.Authorization === "Bearer tok");
ok("filename sanitised to a real jpg  -> " + uploadCall.body.filename, uploadCall.body.filename === "IMG_0042.jpg");

r = await call({ key:"WRONGKEY", contentType:"image/jpeg", data:img(1000) });
ok("wrong portal key is refused", r.status===404);

r = await call({ key:"GOODKEY", contentType:"application/pdf", data:img(1000) });
ok("non-image refused (400)", r.status===400);

r = await call({ key:"GOODKEY", contentType:"image/jpeg", data:img(5*1024*1024) });
b = await r.json();
ok("oversize refused (413) with a plain sentence -> " + JSON.stringify(b.error), r.status===413);

r = await call({ key:"GOODKEY", contentType:"image/jpeg", data:"not valid base64!!" });
ok("corrupt base64 refused (400)", r.status===400);

r = await call({ key:"GOODKEY", contentType:"image/jpeg", data:"" });
ok("empty data refused (400)", r.status===400);

r = await call({ key:"GOODKEY", contentType:"image/jpeg", data:"data:image/jpeg;base64,"+img(1000) });
ok("a whole data: URL is accepted too", r.status===200);

photoCount = 6;
r = await call({ key:"GOODKEY", contentType:"image/jpeg", data:img(1000) });
b = await r.json();
ok("7th photo refused (409) -> " + JSON.stringify(b.error), r.status===409);
photoCount = 0;

// an approved line must not take new photos - use Request a change
globalThis.fetch = (orig => async (url, opts) => {
  if (String(url).includes("/Selections/"))
    return new Response(JSON.stringify({ id:SEL, fields:{ Project:["recPROJ"], Status:"Approved" } }),
      {status:200, headers:{"Content-Type":"application/json"}});
  return orig(url, opts);
})(globalThis.fetch);
r = await call({ key:"GOODKEY", contentType:"image/jpeg", data:img(1000) });
ok("approved line refuses new photos (409)", r.status===409);
