/**
 * CKA Selections — Airtable proxy
 *
 * The owner's portal is a static page; it must never hold an Airtable token.
 * This Worker does. It exposes exactly one project at a time, addressed by the
 * unguessable "Portal key" on that project's row, and accepts only the three
 * writes the portal is allowed to make.
 *
 * Secrets (wrangler secret put ...):
 *   AIRTABLE_TOKEN   personal access token, scoped to the CKA Selections base
 * Vars (wrangler.toml):
 *   AIRTABLE_BASE    appfRsDMRMX4sGSPK
 *   ALLOWED_ORIGIN   where the portal is served from, or * while testing
 */

const T = {
  projects:  "Projects",
  spaces:    "Spaces",
  selections:"Selections",
  options:   "Options",
};

const OWNER_VISIBLE_STATUSES = [
  "Not started", "Options presented", "Owner selected",
  "Approved", "Released for order", "On hold",
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(env);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    try {
      if (url.pathname === "/api/project" && request.method === "GET") {
        return json(await getProject(env, requireKey(url.searchParams.get("key"))), cors);
      }

      const write = url.pathname.match(/^\/api\/selection\/(rec[A-Za-z0-9]{14})\/(approve|submit|change)$/);
      if (write && request.method === "POST") {
        const [, selectionId, action] = write;
        const body = await request.json();
        const key = requireKey(body.key);
        const ctx = await authorize(env, key, selectionId);

        if (action === "approve") return json(await approve(env, ctx, body), cors);
        if (action === "submit")  return json(await submit(env, ctx, body), cors);
        if (action === "change")  return json(await requestChange(env, ctx, body), cors);
      }

      return json({ error: "Not found" }, cors, 404);
    } catch (err) {
      const status = err.status || 500;
      return json({ error: err.message || "Server error" }, cors, status);
    }
  },
};

/* ------------------------------------------------------------------ */
/* Airtable REST                                                       */

async function at(env, table, { params = {}, method = "GET", body = null, recordId = "" } = {}) {
  const url = new URL(
    `https://api.airtable.com/v0/${env.AIRTABLE_BASE}/${encodeURIComponent(table)}${recordId ? "/" + recordId : ""}`
  );
  for (const [k, v] of Object.entries(params)) {
    if (Array.isArray(v)) v.forEach((item) => url.searchParams.append(k, item));
    else if (v != null) url.searchParams.set(k, v);
  }

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${env.AIRTABLE_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const detail = await res.text();
    throw httpError(502, `Airtable ${res.status}: ${detail.slice(0, 300)}`);
  }
  return res.json();
}

async function allRecords(env, table, params) {
  let offset, out = [];
  do {
    const page = await at(env, table, { params: { ...params, pageSize: 100, offset } });
    out = out.concat(page.records);
    offset = page.offset;
  } while (offset);
  return out;
}

/* ------------------------------------------------------------------ */
/* Read                                                                */

async function findProject(env, key) {
  const rows = await allRecords(env, T.projects, {
    filterByFormula: `{Portal key} = ${quote(key)}`,
  });
  if (!rows.length) throw httpError(404, "No project found for that link.");
  return rows[0];
}

async function getProject(env, key) {
  const project = await findProject(env, key);
  const pid = project.id;

  const [spaces, selections] = await Promise.all([
    linkedRecords(env, T.spaces, project),
    linkedRecords(env, T.selections, project),
  ]);

  const live = selections.filter((r) =>
    OWNER_VISIBLE_STATUSES.includes(r.fields["Status"] || "Not started")
  );

  const options = live.length ? await allRecords(env, T.options, {}) : [];
  const optionsBySelection = {};
  for (const o of options) {
    for (const sel of o.fields["Selection"] || []) {
      (optionsBySelection[sel] = optionsBySelection[sel] || []).push(o);
    }
  }

  const spaceById = {};
  for (const s of spaces) spaceById[s.id] = s;

  // A held selection should name what it is waiting for, not just sit there.
  const selectionById = {};
  for (const r of selections) selectionById[r.id] = r;

  return {
    project: {
      name: project.fields["Project name"] || "",
      code: project.fields["Project code"] || "",
      address: project.fields["Address"] || project.fields["Project name"] || "",
      owners: [
        project.fields["Owner 1 name"],
        project.fields["Owner 2 name"],
      ].filter(Boolean),
      start: project.fields["Construction start"] || null,
      dryIn: project.fields["Dry-in target"] || null,
      manager: project.fields["Project manager"] || "",
      isExample: project.fields["Status"] === "Example",
    },
    spaces: spaces
      .map((s) => ({
        id: s.id,
        name: s.fields["Space name"] || "Unnamed space",
        order: num(s.fields["Sort order"], 999),
      }))
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)),
    selections: live
      .map((r) => {
        const spaceId = (r.fields["Space"] || [])[0];
        return {
          id: r.id,
          item: r.fields["Item"] || "Untitled selection",
          space: spaceId || null,
          spaceName: spaceId && spaceById[spaceId]
            ? spaceById[spaceId].fields["Space name"]
            : "Whole house",
          trade: r.fields["Trade"] || "",
          lead: num(r.fields["Lead time (weeks)"], 0),
          needed: r.fields["Needed by"] || null,
          status: r.fields["Status"] || "Not started",
          mode: r.fields["Mode"] === "Owner specifies" ? "open" : "curated",
          desc: r.fields["Description"] || "",
          order: num(r.fields["Sort order"], 999),
          approvedOption: (r.fields["Approved option"] || [])[0] || null,
          approvedBy: r.fields["Approved by"] || null,
          approvedOn: r.fields["Approved on"] || null,
          submittedBy: r.fields["Submitted by"] || null,
          submittedOn: r.fields["Submitted on"] || null,
          supersedes: (r.fields["Supersedes"] || [])[0] || null,
          dependsOn: (() => {
            const id = (r.fields["Depends on"] || [])[0];
            const parent = id && selectionById[id];
            if (!parent) return null;
            return {
              id,
              item: parent.fields["Item"] || "another selection",
              status: parent.fields["Status"] || "Not started",
            };
          })(),
          ownerEntry: {
            supplier: r.fields["Owner supplier"] || "",
            model: r.fields["Owner model"] || "",
            finish: r.fields["Owner finish"] || "",
            notes: r.fields["Owner notes"] || "",
          },
          ownerPhotos: attachments(r.fields["Owner photos"]),
          options: (optionsBySelection[r.id] || [])
            .map((o) => ({
              id: o.id,
              name: o.fields["Option name"] || "Option",
              supplier: o.fields["Supplier"] || "",
              model: o.fields["Model"] || "",
              finish: o.fields["Finish"] || "",
              note: o.fields["Note"] || "",
              link: o.fields["Product link"] || "",
              swatch: o.fields["Swatch color"] || "",
              code: o.fields["Color code"] || "",
              finishChoices: splitList(o.fields["Finish options"]),
              photos: attachments(o.fields["Photo"]),
              order: num(o.fields["Sort order"], 999),
            }))
            .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)),
        };
      })
      .sort((a, b) => a.order - b.order),
    generatedAt: new Date().toISOString(),
  };
}

/* ------------------------------------------------------------------ */
/* Write                                                               */

async function authorize(env, key, selectionId) {
  const project = await findProject(env, key);
  const record = await at(env, T.selections, { recordId: selectionId });
  const owns = (record.fields["Project"] || []).includes(project.id);
  if (!owns) throw httpError(403, "That selection is not on this project.");
  return { project, record };
}

function assertOpen(record) {
  const status = record.fields["Status"];
  if (status === "Approved" || status === "Released for order") {
    throw httpError(409, "This selection is already approved. Request a change instead.");
  }
  if (status === "Superseded") throw httpError(409, "This selection has been replaced.");
}

async function approve(env, { record }, body) {
  assertOpen(record);
  const name = cleanName(body.name);
  const optionId = String(body.optionId || "");
  if (!/^rec[A-Za-z0-9]{14}$/.test(optionId)) throw httpError(400, "Choose an option first.");

  const option = await at(env, T.options, { recordId: optionId });
  if (!(option.fields["Selection"] || []).includes(record.id)) {
    throw httpError(400, "That option belongs to a different selection.");
  }

  // Some options carry variants — a door handle style offers a set of finishes,
  // and not the same set for every style. Approving one without the other would
  // record half a decision.
  const choices = splitList(option.fields["Finish options"]);
  const fields = {
    "Status": "Approved",
    "Approved option": [optionId],
    "Approved by": name,
    "Approved on": new Date().toISOString(),
  };
  if (choices.length) {
    const finish = text(body.finish, 200);
    if (!finish) throw httpError(400, "Choose a finish as well as the style.");
    const match = choices.find((c) => c.toLowerCase() === finish.toLowerCase());
    if (!match) {
      throw httpError(400, `${finish} is not offered on ${option.fields["Option name"]}. Offered: ${choices.join(", ")}.`);
    }
    fields["Owner finish"] = match;
  }

  const updated = await at(env, T.selections, {
    recordId: record.id,
    method: "PATCH",
    body: { fields },
  });
  return { ok: true, status: updated.fields["Status"] };
}

async function submit(env, { project, record }, body) {
  assertOpen(record);
  const name = cleanName(body.name || (project.fields["Owner 1 name"] || "Owner"));
  const supplier = text(body.supplier, 200);
  const model = text(body.model, 300);
  if (!supplier || !model) throw httpError(400, "Supplier and product are both needed.");

  const updated = await at(env, T.selections, {
    recordId: record.id,
    method: "PATCH",
    body: {
      fields: {
        "Status": "Owner selected",
        "Owner supplier": supplier,
        "Owner model": model,
        "Owner finish": text(body.finish, 200),
        "Owner notes": text(body.notes, 2000),
        "Submitted by": name,
        "Submitted on": new Date().toISOString(),
      },
    },
  });
  return { ok: true, status: updated.fields["Status"] };
}

/**
 * Never edit an approved record. Write a new selection that supersedes it and
 * mark the original Superseded; both stay in history.
 */
async function requestChange(env, { record }, body) {
  const status = record.fields["Status"];
  if (status !== "Approved" && status !== "Released for order") {
    throw httpError(409, "Only an approved selection is replaced this way.");
  }
  const f = record.fields;
  const created = await at(env, T.selections, {
    method: "POST",
    body: {
      records: [{
        fields: {
          "Item": f["Item"],
          "Project": f["Project"] || [],
          "Space": f["Space"] || [],
          "Item Template": f["Item Template"] || [],
          "Status": f["Mode"] === "Owner specifies" ? "Not started" : "Options presented",
          "Mode": f["Mode"],
          "Trade": f["Trade"],
          "Lead time (weeks)": f["Lead time (weeks)"],
          "Needed by": f["Needed by"],
          "Description": f["Description"],
          "Sort order": f["Sort order"],
          // A replacement inherits the original's place in the chain. Without
          // these it would never unlock, and never load a brand palette.
          "Depends on": f["Depends on"] || [],
          "Palette category": f["Palette category"] || null,
          "Supersedes": [record.id],
          "Internal notes": `Change requested by ${cleanName(body.name || "owner")} on ${new Date().toISOString()}. ${text(body.reason, 1000)}`.trim(),
        },
      }],
    },
  });

  await at(env, T.selections, {
    recordId: record.id,
    method: "PATCH",
    body: { fields: { "Status": "Superseded" } },
  });

  return { ok: true, newSelectionId: created.records[0].id };
}

/* ------------------------------------------------------------------ */
/* helpers                                                             */

/** "White, Matte Black, Satin Nickel" -> ["White","Matte Black","Satin Nickel"] */
function splitList(v) {
  return String(v == null ? "" : v)
    .split(",").map((x) => x.trim()).filter(Boolean);
}

function attachments(v) {
  if (!Array.isArray(v)) return [];
  return v
    .filter((a) => a && a.url)
    .map((a) => ({
      url: (a.thumbnails && a.thumbnails.large && a.thumbnails.large.url) || a.url,
      full: a.url,
      width: a.width || null,
      height: a.height || null,
    }));
}
/**
 * Fetch the rows of `table` linked to `project`.
 *
 * A linked-record field inside an Airtable formula evaluates to the linked
 * rows' PRIMARY FIELD TEXT, not their record IDs — so filtering on the ID
 * silently returns nothing. Narrow on the project name (cheap, and usually
 * exact), then verify the actual link IDs here, which is the only comparison
 * that cannot be fooled by two jobs sharing a name or a name being edited.
 * If the name filter comes back empty, fall back to scanning: a wrong name
 * must never look like a job with no selections.
 */
async function linkedRecords(env, table, project) {
  const name = project.fields["Project name"] || "";
  const matches = (r) => (r.fields["Project"] || []).includes(project.id);

  if (name) {
    const narrowed = await allRecords(env, table, {
      filterByFormula: `FIND(${quote(name)}, ARRAYJOIN({Project})) > 0`,
    });
    const exact = narrowed.filter(matches);
    if (exact.length) return exact;
  }
  return (await allRecords(env, table, {})).filter(matches);
}
function quote(s) { return `"${String(s).replace(/"/g, '\\"')}"`; }
function num(v, d) { return typeof v === "number" ? v : d; }
function text(v, max) { return String(v == null ? "" : v).trim().slice(0, max); }
function cleanName(v) {
  const name = text(v, 120);
  if (name.length < 3) throw httpError(400, "Type your full name to approve.");
  return name;
}
function requireKey(key) {
  const k = text(key, 120);
  if (!k) throw httpError(400, "Missing project link key.");
  return k;
}
function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}
function corsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store",
  };
}
function json(data, cors, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
