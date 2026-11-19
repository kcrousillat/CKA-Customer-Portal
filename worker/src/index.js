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

/**
 * MSRP is held in Airtable but not published. Kevin's call: a list price next
 * to a decision invites the owner to shop it, and it is not the number on
 * their contract anyway. The catalog keeps collecting it, so turning this to
 * true is the whole job if that view changes — the portal already knows how
 * to render it, labelled and noted as excluding installation.
 *
 * The gate is here rather than in the page on purpose: with it off the figure
 * never leaves the Worker, so it is not sitting in the JSON for anyone who
 * opens the network tab.
 */
const SHOW_MSRP = false;

const T = {
  projects:  "Projects",
  spaces:    "Spaces",
  selections:"Selections",
  options:   "Options",
  sections:  "Sections",
  trades:    "Trades",
  templates: "Item Templates",
  inspiration:"Inspiration",
};

/**
 * A room can carry twenty-six decisions. Grouping them under a heading the
 * owner already thinks in — appliances, plumbing, cabinetry — is the
 * difference between a list and a wall.
 *
 * The headings live in the Sections table so they can be renamed, reordered
 * and re-pointed from Airtable without a deploy. Each row there claims one or
 * more trades; a selection files itself under whichever section claims its
 * trade. The Section field on the selection itself still overrides that.
 *
 * FALLBACK below is what the portal looked like before the table existed. It
 * is used only if the Sections table is missing or empty, so a fat-fingered
 * delete degrades to the old behaviour instead of dumping every room's rows
 * under "Other".
 */
const FALLBACK_TRADE_SECTION = {
  "Appliances": "Appliances",
  "Plumbing": "Plumbing",
  "Millwork": "Cabinetry & millwork",
  "Closets": "Cabinetry & millwork",
  "Tile": "Tile & stone",
  "Stone": "Tile & stone",
  "Flooring": "Flooring",
  "Lighting": "Lighting & electrical",
  "Electrical": "Lighting & electrical",
  "Low voltage / AV": "Lighting & electrical",
  "Glazing": "Glass & mirrors",
  "Hardware": "Hardware",
  "Doors": "Doors",
  "Paint": "Paint & finishes",
  "Stucco": "Paint & finishes",
  "Window treatments": "Paint & finishes",
  "Roofing": "Roof & exterior",
  "Landscape / hardscape": "Roof & exterior",
  "Pool": "Pool & outdoor",
  "Metals / railings": "Metals & railings",
  "HVAC": "Systems",
  "Elevator": "Systems",
};

/**
 * A selection's Trade is a dropdown today and may become a link to the Trades
 * table tomorrow. Airtable hands those back as a string and as an array of
 * record IDs respectively, so everything downstream goes through here and the
 * conversion is a non-event for this Worker.
 */
function tradeName(v, tradeById) {
  if (Array.isArray(v)) {
    const row = tradeById[v[0]];
    return row ? (row.fields["Trade name"] || "").trim() : "";
  }
  return (v || "").trim();
}

/**
 * Builds { byTrade, order, tradeById }.
 *
 * The trade-to-heading mapping lives in the Trades table: one row per trade,
 * linked to the Section it files under. Two older sources are kept behind it
 * so no single deletion can strand every selection under "Other" — the
 * "Trades — old list" column on Sections, and finally the map below, which is
 * what the portal did before any of this was in Airtable.
 */
const FALLBACK_TRADE_SECTION_ORDER = [
  "Appliances", "Plumbing", "Cabinetry & millwork", "Tile & stone", "Flooring",
  "Lighting & electrical", "Glass & mirrors", "Hardware", "Doors",
  "Paint & finishes", "Roof & exterior", "Pool & outdoor", "Metals & railings",
  "Systems", "Other",
];

async function sectionMap(env) {
  let sectionRows = [], tradeRows = [];
  try {
    [sectionRows, tradeRows] = await Promise.all([
      allRecords(env, T.sections, {}),
      allRecords(env, T.trades, {}).catch(() => []),
    ]);
  } catch {
    return { byTrade: FALLBACK_TRADE_SECTION, order: FALLBACK_TRADE_SECTION_ORDER, tradeById: {} };
  }

  const tradeById = {};
  for (const t of tradeRows) tradeById[t.id] = t;

  const live = sectionRows
    .filter((r) => r.fields["Hidden"] !== true && (r.fields["Section name"] || "").trim())
    .sort((a, b) => num(a.fields["Sort order"], 999) - num(b.fields["Sort order"], 999));

  if (!live.length) {
    return { byTrade: FALLBACK_TRADE_SECTION, order: FALLBACK_TRADE_SECTION_ORDER, tradeById };
  }

  const nameById = {};
  for (const r of live) nameById[r.id] = r.fields["Section name"].trim();
  const order = live.map((r) => nameById[r.id]);

  // Preferred source: the Trades table.
  const byTrade = {};
  for (const t of tradeRows) {
    if (t.fields["Hidden"] === true) continue;
    const name = (t.fields["Trade name"] || "").trim();
    const sectionId = (t.fields["Section"] || [])[0];
    if (name && sectionId && nameById[sectionId]) byTrade[name] = nameById[sectionId];
  }
  if (Object.keys(byTrade).length) return { byTrade, order, tradeById };

  // Nothing usable in Trades — fall back to the old column on Sections.
  for (const r of live) {
    for (const trade of r.fields["Trades — old list"] || []) {
      if (!byTrade[trade]) byTrade[trade] = nameById[r.id];
    }
  }
  if (Object.keys(byTrade).length) return { byTrade, order, tradeById };

  return { byTrade: FALLBACK_TRADE_SECTION, order, tradeById };
}

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
      /* Leads dashboard. The page is served from here rather than from
         public/ because the deploy script only downloads this file: a page
         sitting in public/ would never reach the live Worker. */
      if ((url.pathname === "/leads" || url.pathname === "/leads/") && request.method === "GET") {
        return new Response(LEADS_HTML, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store",
            // The key rides in the URL; never hand it to another site.
            "Referrer-Policy": "no-referrer",
            "X-Robots-Tag": "noindex",
          },
        });
      }
      if (url.pathname.startsWith("/api/leads")) {
        return json(await leadsRoute(env, request, url), cors);
      }

      if (url.pathname === "/api/project" && request.method === "GET") {
        return json(await getProject(env, requireKey(url.searchParams.get("key"))), cors);
      }

      const write = url.pathname.match(/^\/api\/selection\/(rec[A-Za-z0-9]{14})\/(approve|submit|change|photo)$/);
      if (write && request.method === "POST") {
        const [, selectionId, action] = write;
        const body = await request.json();
        const key = requireKey(body.key);
        const ctx = await authorize(env, key, selectionId);

        if (action === "approve") return json(await approve(env, ctx, body), cors);
        if (action === "submit")  return json(await submit(env, ctx, body), cors);
        if (action === "change")  return json(await requestChange(env, ctx, body), cors);
        if (action === "photo")   return json(await addPhoto(env, ctx, body), cors);
      }

      if (url.pathname === "/api/inspiration" && request.method === "POST") {
        const body = await request.json();
        const project = await findProject(env, requireKey(body.key));
        return json(await addInspiration(env, project, body), cors);
      }

      const insp = url.pathname.match(/^\/api\/inspiration\/(rec[A-Za-z0-9]{14})\/remove$/);
      if (insp && request.method === "POST") {
        const body = await request.json();
        const project = await findProject(env, requireKey(body.key));
        return json(await removeInspiration(env, project, insp[1]), cors);
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

async function at(env, table, { params = {}, method = "GET", body = null, recordId = "", base = env.AIRTABLE_BASE } = {}) {
  const url = new URL(
    `https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}${recordId ? "/" + recordId : ""}`
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

async function allRecords(env, table, params, base) {
  let offset, out = [];
  do {
    const page = await at(env, table, { params: { ...params, pageSize: 100, offset }, base });
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

  const [spaces, selections, sections, templates, inspiration] = await Promise.all([
    linkedRecords(env, T.spaces, project),
    linkedRecords(env, T.selections, project),
    sectionMap(env),
    // The owner-entry box labels live on the library item, not on the
    // selection, so they are read live. Rename them in Airtable and every job
    // follows on the next page load — no rebuild, no backfill.
    allRecords(env, T.templates, { "fields[]": ["Owner boxes"] }).catch(() => []),
    // Caught rather than thrown: the gallery is a nice-to-have beside the
    // decisions, and a job whose base predates the Inspiration table should
    // still load its selections rather than show the owner an error page.
    linkedRecords(env, T.inspiration, project).catch(() => []),
  ]);
  const boxesByTemplate = {};
  for (const t of templates) boxesByTemplate[t.id] = t.fields["Owner boxes"] || "";

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
          trade: tradeName(r.fields["Trade"], sections.tradeById),
          section: (r.fields["Section"] || "").trim() ||
                   sections.byTrade[tradeName(r.fields["Trade"], sections.tradeById)] ||
                   "Other",
          // No lead time in the payload. "Lead time (weeks)" is still on the
          // row for CKA's own ordering, but it is a single number standing in
          // for an item that may be sourced a dozen ways, so it is not sent
          // to the owner and nothing in the portal renders it.
          // The group a selection belongs to - "Group 2" - and the date that
          // group falls due on this job. The date is what the portal sorts and
          // warns on; the group is what makes five dates read as five rounds
          // rather than 283 unrelated deadlines.
          group: (r.fields["Group number"] || [])[0] || "",
          needed: r.fields["Needed by"] || null,
          status: r.fields["Status"] || "Not started",
          mode: r.fields["Mode"] === "Owner specifies" ? "open" : "curated",
        // Positional, so an empty slot keeps that box's default label. Unlike
        // splitList this must not drop the blanks.
        ownerBoxes: String(boxesByTemplate[(r.fields["Item Template"] || [])[0]] || "")
          .split(",").map((x) => x.trim()),
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
            // Colour is its own field, not folded into finish: a paint order
            // needs the colour number and the sheen as separate facts.
            color: r.fields["Owner color"] || "",
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
              // On most undercounter and column units the hinge is part of the
              // model number, so it is fixed at order. The owner has to see it
              // before they approve, not at delivery.
              hinge: (o.fields["Hinge"] && o.fields["Hinge"].name) || o.fields["Hinge"] || "",
              // Standard = in the allowance, Upgrade = costs more. An owner who
              // picks a colour and only then learns it is extra has been set up
              // to be disappointed, so it is on the card rather than in a later
              // conversation. Empty renders nothing, which is the honest state
              // for anything nobody has priced.
              tier: (o.fields["Tier"] && o.fields["Tier"].name) || o.fields["Tier"] || "",
              msrp: SHOW_MSRP && typeof o.fields["MSRP"] === "number" ? o.fields["MSRP"] : null,
              photos: attachments(o.fields["Photo"]),
              order: num(o.fields["Sort order"], 999),
            }))
            // Standards first, upgrades last, and anything untiered in
            // between. An owner scanning a colour board should meet everything
            // their allowance covers before they meet anything that costs
            // more - otherwise they fall for an upgrade on the way past.
            // Untiered sits in the middle because no tier means nobody has
            // priced it, which is neither "included" nor "extra". A list where
            // nothing is tiered therefore keeps exactly the order it had.
            .sort((a, b) => tierRank(a.tier) - tierRank(b.tier) ||
                            a.order - b.order ||
                            a.name.localeCompare(b.name)),
        };
      })
      .sort((a, b) => a.order - b.order),
    // The order Kevin put the Sections table in. The portal still leads with
    // whatever is late, then whatever is waiting on the owner; this only
    // settles the ties, so headings do not shuffle alphabetically.
    sectionOrder: sections.order,
    /* Internal note is deliberately absent: it is CKA's read on the photo and
       the owner never sees it, same rule as Note vs Internal note in the
       catalog. Newest first, because the most recent thing they sent is the
       thing they are thinking about. */
    inspiration: inspiration
      .map((r) => ({
        id: r.id,
        caption: r.fields["Caption"] || "",
        photos: attachments(r.fields["Photo"]),
        space: (r.fields["Space"] || [])[0] || null,
        addedBy: r.fields["Added by"] || "",
        addedOn: r.fields["Added on"] || null,
      }))
      .filter((r) => r.photos.length)
      .sort((a, b) => String(b.addedOn || "").localeCompare(String(a.addedOn || ""))),
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
  // Asked for, not assumed. This used to fall back to the project's Owner 1,
  // so a two-owner job credited the wrong person half the time - and on an
  // owner-specifies line this name IS the record of whose selection it is.
  const name = cleanName(body.name, "send this to CKA");
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
        "Owner color": text(body.color, 200),
        "Owner finish": text(body.finish, 200),
        "Owner notes": text(body.notes, 2000),
        "Submitted by": name,
        "Submitted on": new Date().toISOString(),
      },
    },
  });
  return { ok: true, status: updated.fields["Status"] };
}

/* ------------------------------------------------------------------ */
/* Inspiration gallery                                                 */

/* What the owner likes, before any of it is a decision. Kept in its own table
   rather than on a selection because it is mood, not evidence: "I like this
   kitchen" is not "this is my sink", and letting forty saved pictures sit on
   the sink row would bury the one photo that actually identifies a tap.

   The caption is the point. A photo on its own is a nice picture; a photo that
   says "the matte black against the white oak" is something that can be
   ordered from, so the page asks what they like rather than for a title. */
const INSPO_MAX_PER_PROJECT = 120;

async function addInspiration(env, project, body) {
  const caption = text(body.caption, 500);
  if (!caption) throw httpError(400, "Say what you like about it, even in a few words.");

  /* The room is optional - "I just like this" is a real answer - but if one is
     named it has to be a room on this job, or the gallery would group a photo
     under someone else's house. */
  let space = null;
  if (body.spaceId) {
    const spaceId = String(body.spaceId);
    if (!/^rec[A-Za-z0-9]{14}$/.test(spaceId)) throw httpError(400, "That room is not one we know.");
    const row = await at(env, T.spaces, { recordId: spaceId });
    if (!(row.fields["Project"] || []).includes(project.id)) {
      throw httpError(403, "That room is not on this project.");
    }
    /* A plain record-ID string, not {id}. The REST API takes link fields as
       arrays of id strings; {id} is the scripting API's shape, and sending it
       here stringifies to "[object Object]" and comes back as a 422. */
    space = [spaceId];
  }

  const existing = await linkedRecords(env, T.inspiration, project).catch(() => []);
  if (existing.length >= INSPO_MAX_PER_PROJECT) {
    throw httpError(409, `That is ${INSPO_MAX_PER_PROJECT} photos, which is the limit for one job. Delete a few and add more.`);
  }

  const photo = await preparePhoto(body);
  const created = await at(env, T.inspiration, {
    method: "POST",
    body: {
      records: [{
        fields: {
          "Caption": caption,
          "Project": [project.id],
          ...(space ? { "Space": space } : {}),
          "Added by": cleanName(body.name || (project.fields["Owner 1 name"] || "Owner")),
          "Added on": new Date().toISOString(),
        },
      }],
    },
  });

  const id = created.records[0].id;
  /* The record first, then the file onto it. Airtable's upload endpoint needs a
     record to attach to, so there is no way to do this in one call. If the
     upload fails the row is removed again rather than left as a caption with no
     picture, which would show in the gallery as an empty tile. */
  try {
    await uploadAttachment(env, id, "Photo", photo);
  } catch (err) {
    await at(env, T.inspiration, { recordId: id, method: "DELETE" }).catch(() => {});
    throw err;
  }
  return { ok: true, id };
}

async function removeInspiration(env, project, id) {
  const row = await at(env, T.inspiration, { recordId: id });
  if (!(row.fields["Project"] || []).includes(project.id)) {
    throw httpError(403, "That photo is not on this project.");
  }
  await at(env, T.inspiration, { recordId: id, method: "DELETE" });
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Owner photos                                                        */

/* A showroom snap or a page of a designer's spec book, attached to the line it
   belongs to. Before this the only route was pasting a link into the notes box,
   which meant the owner had to host the picture somewhere first - not a
   reasonable thing to ask of someone choosing a tap.

   Airtable takes the file contents directly on a separate host, so no image
   host, no storage bucket and nothing else to pay for or keep running. It
   appends to the attachment field server side, so two photos arriving at once
   cannot overwrite each other the way a read-then-write would. */
const PHOTO_FIELD = "Owner photos";
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
/* Airtable's own ceiling is 5MB. Stopping short of it means an oversize photo
   is refused here, with a sentence the owner can act on, rather than coming
   back as an Airtable 4xx that says nothing useful. The page shrinks photos
   before sending, so hitting this at all means something unusual. */
const PHOTO_MAX_BYTES = 4 * 1024 * 1024;
/* Enough for a tap from three angles and the spec sheet. A cap mostly so that
   a key in the wrong hands cannot fill the base with megabytes. */
const PHOTO_MAX_COUNT = 6;

async function addPhoto(env, { record }, body) {
  assertOpen(record);

  const already = (record.fields[PHOTO_FIELD] || []).length;
  if (already >= PHOTO_MAX_COUNT) {
    throw httpError(409, `That is already ${PHOTO_MAX_COUNT} photos on this line, which is the limit. Delete one to add another.`);
  }

  const saved = await uploadAttachment(env, record.id, PHOTO_FIELD, preparePhoto(body));
  const field = (saved.fields && saved.fields[PHOTO_FIELD]) || [];
  return { ok: true, photos: attachments(field), count: field.length };
}

/* Checks a photo off the wire and hands back what Airtable wants. Shared by the
   selection photos and the inspiration gallery: the rules about what counts as
   a photo should not be able to drift apart between two upload paths. */
function preparePhoto(body) {
  const contentType = text(body.contentType, 100).toLowerCase();
  if (!PHOTO_TYPES.includes(contentType)) {
    throw httpError(400, "Photos only, please - a JPEG, PNG or WEBP.");
  }

  /* Accept a bare base64 string or a whole data: URL, since which one arrives
     depends on how the page read the file. */
  const raw = String(body.data || "").replace(/^data:[^;]*;base64,/, "").replace(/\s+/g, "");
  if (!raw) throw httpError(400, "That photo arrived empty. Try again.");
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(raw)) throw httpError(400, "That photo did not arrive in one piece. Try again.");

  /* Size of the decoded file, worked out from the base64 length rather than by
     decoding it: the string is the biggest thing in this request and decoding
     it only to measure it would double what the Worker holds in memory. */
  const bytes = Math.floor(raw.length * 3 / 4) - (raw.endsWith("==") ? 2 : raw.endsWith("=") ? 1 : 0);
  if (bytes <= 0) throw httpError(400, "That photo arrived empty. Try again.");
  if (bytes > PHOTO_MAX_BYTES) {
    throw httpError(413, "That photo is too large. Around 4MB is the limit.");
  }

  return { contentType, file: raw, filename: photoName(body.filename, contentType) };
}

/* Uploads go to content.airtable.com, not the api host the rest of the file
   talks to, so this cannot use at(). Airtable appends to the attachment field
   itself, which is why two photos arriving together cannot overwrite each
   other the way a read-then-write would. */
async function uploadAttachment(env, recordId, field, photo) {
  const res = await fetch(
    `https://content.airtable.com/v0/${env.AIRTABLE_BASE}/${recordId}/${encodeURIComponent(field)}/uploadAttachment`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.AIRTABLE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(photo),
    }
  );

  if (!res.ok) {
    const detail = await res.text();
    throw httpError(502, `Airtable ${res.status}: ${detail.slice(0, 300)}`);
  }
  return res.json();
}

/* Whatever the phone called it, reduced to something safe to put in a URL path
   and guaranteed to carry an extension Airtable will recognise. */
function photoName(v, contentType) {
  const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  const base = text(v, 80).replace(/\.[A-Za-z0-9]+$/, "").replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^[-.]+/, "");
  return (base || "owner-photo") + "." + ext;
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
/* Leads dashboard                                                     */

/* A separate base from Selections, so everything here passes its own base ID.
   Tables and fields are addressed by ID, not by name: Kevin renames columns in
   Airtable, and a renamed column must not quietly empty the dashboard.

   Staff get in with a private link, checked against the "Staff access" table.
   That is the whole reason this exists outside Airtable: an Airtable seat per
   person who only needs to move a lead along is not worth paying for. */
const LEADS_BASE_DEFAULT = "appZ7bbXZLcbwN6p1";
const LT = {
  leads:    "tblgmDsmUY1EvS7kQ",
  followUp: "tblkMKba3X8yRW7H6",
  staff:    "tblwvYFP3D15BuReo",
};
const LF = {
  name:      "fld2K6Zv72Zcmckv0",
  type:      "fldVsqKRfygi0XoVZ",
  company:   "fldpjTGHl2gN6kQuN",
  phone:     "fldle1hbt5Dpjh6zq",
  email:     "fldZ66GLprwC5lUuD",
  email2:    "fldwTsUx62LZyVhBI",
  source:    "fldvcErN2HB8kSFPU",
  stage:     "fld0MJg3u3Hpvyh3C",
  sourceNote:"fldkiIjGbAbDbeRQl",
  enteredBy: "fldqdJFWt7z9Vhj8C",
  entered:   "fldNXgVr1TQTTHHIs",
  assigned:  "fldQJPNYKRdWL2mil",
  notes:     "fld4ErG5vKPEOXMRP",
  value:     "fldmcWQIqd5mep24V",
  followUps: "fldP6qcexs0aBJtDH",
  nextFU:    "fld7nJnEdnYddXtts",
};
const FF = {
  date:    "fldnrUpSNbukGyGgb",
  notes:   "fldRw4Al6Lpryasdh",
  outcome: "fldieYtaL4siwCpzI",
  lead:    "fldaDr5edCC9k6BRQ",
  by:      "fld5Esk9es9IttmGv",
};

/* The dropdown choices exactly as they exist in the base on 19 Nov 2026.
   Writes are checked against these rather than sent with typecast, so a typo
   is refused here instead of quietly becoming a new option in Airtable. Add a
   choice in Airtable first, then here. */
const LEAD_CHOICES = {
  stage: ["New", "Qualified", "Not Qualified", "Proposal Sent", "Negotiating", "Won", "Lost"],
  assigned: ["Kevin Crousillat", "Nicolas Gomez", "Pattricia Pozo", "German Diaz", "Natalie Acosta"],
  source: ["Referral", "Website", "Sign", "Direct Outreach", "Repeat Client", "Meta", "Google Ads", "Other"],
  type: ["New Construction", "Residential - New Construction", "Residential - Renovation",
         "Commercial - New Construction", "Commercial - Renovation", "Remodel", "Other"],
  outcome: ["Left Voicemail", "Spoke with Lead", "Email Sent", "Meeting Scheduled",
            "Meeting Completed", "No Response", "Lead No Longer Interested"],
  followedUpBy: ["Kevin Crousillat", "Nicolas Gomez", "Pattricia Pozo", "German Diaz", "Natalie Acosta"],
};

async function leadsRoute(env, request, url) {
  const base = env.LEADS_BASE || LEADS_BASE_DEFAULT;

  if (url.pathname === "/api/leads" && request.method === "GET") {
    const staff = await findStaff(env, base, url.searchParams.get("k"));
    return getLeads(env, base, staff);
  }

  const m = url.pathname.match(/^\/api\/leads\/(rec[A-Za-z0-9]{14})\/(update|followup)$/);
  if (m && request.method === "POST") {
    const body = await request.json();
    const staff = await findStaff(env, base, body.k);
    // Confirms the row exists and is a lead, not an ID from some other table.
    await at(env, LT.leads, { recordId: m[1], base });
    if (m[2] === "update") return updateLead(env, base, m[1], body);
    return logFollowUp(env, base, staff, m[1], body);
  }

  throw httpError(404, "Not found");
}

async function findStaff(env, base, key) {
  const k = text(key, 120);
  if (!k) throw httpError(401, "This page needs your personal link. Ask Kevin for it.");
  const rows = await allRecords(env, LT.staff, {
    filterByFormula: `AND({Access key} = ${quote(k)}, {Active})`,
  }, base);
  if (!rows.length) throw httpError(401, "That link is not active. Ask Kevin for a new one.");
  return { id: rows[0].id, name: (rows[0].fields["Name"] || "").trim() };
}

function selName(v) { return v && typeof v === "object" ? v.name || "" : v || ""; }

async function getLeads(env, base, staff) {
  const [leads, logs] = await Promise.all([
    allRecords(env, LT.leads, { returnFieldsByFieldId: "true" }, base),
    allRecords(env, LT.followUp, { returnFieldsByFieldId: "true" }, base),
  ]);

  return {
    me: staff.name,
    choices: LEAD_CHOICES,
    leads: leads.map((r) => {
      const f = r.fields;
      return {
        id: r.id,
        name: f[LF.name] || "(no name)",
        company: f[LF.company] || "",
        phone: f[LF.phone] || "",
        email: f[LF.email] || "",
        email2: f[LF.email2] || "",
        type: selName(f[LF.type]),
        source: selName(f[LF.source]),
        sourceNote: f[LF.sourceNote] || "",
        stage: selName(f[LF.stage]),
        assigned: selName(f[LF.assigned]),
        enteredBy: selName(f[LF.enteredBy]),
        // Date Entered is the real date for rows carried over from the Google
        // Sheet; created time is right for everything that arrived since.
        entered: f[LF.entered] || null,
        created: r.createdTime,
        notes: f[LF.notes] || "",
        value: typeof f[LF.value] === "number" ? f[LF.value] : null,
        nextFollowUp: f[LF.nextFU] || null,
      };
    }),
    followUps: logs
      .filter((r) => (r.fields[FF.lead] || []).length)
      .map((r) => ({
        id: r.id,
        lead: r.fields[FF.lead][0],
        date: r.fields[FF.date] || null,
        outcome: selName(r.fields[FF.outcome]),
        by: selName(r.fields[FF.by]),
        notes: r.fields[FF.notes] || "",
        created: r.createdTime,
      })),
    generatedAt: new Date().toISOString(),
  };
}

function pick(v, list, label) {
  if (v === "" || v === null) return null;          // clearing the field
  const s = text(v, 100);
  if (!list.includes(s)) throw httpError(400, `${s} is not a ${label} option.`);
  return s;
}
function isoDate(v) {
  if (v === "" || v === null) return null;
  const s = text(v, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw httpError(400, "Dates go in as YYYY-MM-DD.");
  return s;
}

/* Only the fields someone actually sent are written, so saving a stage cannot
   blank an owner that was set by someone else a minute earlier. */
async function updateLead(env, base, id, body) {
  const fields = {};
  if ("stage" in body)        fields[LF.stage]    = pick(body.stage, LEAD_CHOICES.stage, "stage");
  if ("assigned" in body)     fields[LF.assigned] = pick(body.assigned, LEAD_CHOICES.assigned, "person");
  if ("source" in body)       fields[LF.source]   = pick(body.source, LEAD_CHOICES.source, "lead source");
  if ("type" in body)         fields[LF.type]     = pick(body.type, LEAD_CHOICES.type, "project type");
  if ("nextFollowUp" in body) fields[LF.nextFU]   = isoDate(body.nextFollowUp);
  if ("value" in body) {
    const n = body.value === "" || body.value === null ? null : Number(body.value);
    if (n !== null && !(n >= 0 && n < 1e10)) throw httpError(400, "Estimated value has to be a number.");
    fields[LF.value] = n;
  }
  if (!Object.keys(fields).length) throw httpError(400, "Nothing to save.");
  await at(env, LT.leads, { recordId: id, method: "PATCH", body: { fields }, base });
  return { ok: true };
}

async function logFollowUp(env, base, staff, id, body) {
  const outcome = pick(body.outcome, LEAD_CHOICES.outcome, "outcome");
  const notes = text(body.notes, 5000);
  if (!outcome && !notes) throw httpError(400, "Pick what happened or write a note.");
  const fields = {
    [FF.lead]: [id],
    [FF.date]: isoDate(body.date) || new Date().toISOString().slice(0, 10),
    [FF.notes]: notes,
  };
  if (outcome) fields[FF.outcome] = outcome;
  // Credited to whoever's link was used, when they are on the dropdown.
  if (LEAD_CHOICES.followedUpBy.includes(staff.name)) fields[FF.by] = staff.name;

  const created = await at(env, LT.followUp, { method: "POST", body: { records: [{ fields }] }, base });
  // Logging a call usually means setting the next one; do both in one save.
  if ("nextFollowUp" in body) {
    await at(env, LT.leads, {
      recordId: id, method: "PATCH", base,
      body: { fields: { [LF.nextFU]: isoDate(body.nextFollowUp) } },
    });
  }
  return { ok: true, id: created.records[0].id };
}

/* Built from worker/src/leads.html by tools/embed-leads.mjs. Edit that file and
   re-run the tool; do not edit this string by hand. */
const LEADS_HTML = "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<meta name=\"robots\" content=\"noindex\">\n<meta name=\"referrer\" content=\"no-referrer\">\n<title>CKA Leads</title>\n<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n<link rel=\"stylesheet\" href=\"https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700&family=Inter:wght@400;500;600&display=swap\">\n<style>\n/* CKA brand: Slate Blue #668599, Light Gray #d3d3d3, Light Beige #f2efeb,\n   Black, White. Montserrat for headings, Inter for everything else.\n   --slate-ink is the slate darkened so it is readable as text on white; the\n   brand slate itself does the structural work (bars, rules, buttons). The one\n   red is functional - \"overdue\" - and always comes with words. */\n:root{\n  --slate:#668599; --slate-ink:#4a6474; --slate-dark:#3f5a6b; --slate-tint:#b4c6d1; --slate-soft:#e8eef2;\n  --gray:#d3d3d3; --beige:#f2efeb; --white:#ffffff; --black:#000000;\n  --ink:#1a1a1a; --ink-2:#4d4d4d; --muted:#6b6b6b; --rule:#e4e1dc;\n  --late:#9e2b21; --late-soft:#f8e8e6; --soon:#7a5a10; --soon-soft:#f7efdc;\n  --head:\"Montserrat\",Arial,sans-serif; --ui:\"Inter\",Arial,Helvetica,sans-serif;\n}\n*{box-sizing:border-box}\nhtml{-webkit-text-size-adjust:100%}\nbody{margin:0;background:var(--beige);color:var(--ink);font:14.5px/1.5 var(--ui);-webkit-font-smoothing:antialiased}\n[hidden]{display:none!important}\nbutton,input,select,textarea{font:inherit;color:inherit}\n:focus-visible{outline:2px solid var(--slate);outline-offset:2px}\na{color:var(--slate-ink)}\n.wrap{max-width:1180px;margin:0 auto;padding:0 16px}\n\n/* masthead */\n.bar{background:var(--white);border-bottom:1px solid var(--rule);position:sticky;top:0;z-index:10}\n.bar .wrap{display:flex;align-items:center;gap:14px;padding-block:10px;flex-wrap:wrap}\n.logo{height:34px;width:auto;display:block}\n.bar h1{font:700 15px/1 var(--head);letter-spacing:.14em;text-transform:uppercase;color:var(--slate-ink);margin:0;padding-left:14px;border-left:1px solid var(--gray)}\n.bar .sp{flex:1}\n.who{color:var(--muted);font-size:13px}\n.seg{display:inline-flex;border:1px solid var(--gray);border-radius:6px;overflow:hidden;background:var(--white)}\n.seg button{border:0;background:none;padding:6px 12px;cursor:pointer;font-size:13px;font-weight:500;color:var(--ink-2)}\n.seg button[aria-pressed=\"true\"]{background:var(--slate);color:var(--white)}\n.icon-btn{border:1px solid var(--gray);background:var(--white);border-radius:6px;padding:6px 10px;cursor:pointer;font-size:13px}\n\nmain{padding:20px 0 60px}\n.label{font:700 11px/1 var(--head);letter-spacing:.16em;text-transform:uppercase;color:var(--slate-ink);margin:0 0 4px}\nh2{font:700 19px/1.25 var(--head);margin:0;color:var(--ink)}\n.sec{margin-top:28px}\n.sec-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-bottom:10px;flex-wrap:wrap}\n.sec-head p{margin:2px 0 0;color:var(--muted);font-size:13px}\n.card{background:var(--white);border:1px solid var(--rule);border-radius:8px}\n\n/* stat tiles */\n.tiles{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}\n.tile{background:var(--white);border:1px solid var(--rule);border-radius:8px;padding:14px 14px 12px;text-align:left;cursor:pointer;border-top:3px solid var(--slate)}\n.tile:hover{border-color:var(--slate-tint);border-top-color:var(--slate)}\n.tile .n{font:700 30px/1 var(--head);color:var(--ink);font-variant-numeric:tabular-nums}\n.tile .t{font-size:12.5px;color:var(--ink-2);margin-top:6px;font-weight:500}\n.tile .s{font-size:12px;color:var(--muted);margin-top:2px}\n.tile.alert{border-top-color:var(--late)}\n.tile.alert .n{color:var(--late)}\n@media (max-width:860px){.tiles{grid-template-columns:repeat(2,minmax(0,1fr))}.tiles .tile:first-child{grid-column:1/-1}}\n\n/* lists */\n.rows{list-style:none;margin:0;padding:0}\n.row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 14px;padding:12px 14px;border-top:1px solid var(--rule);align-items:center}\n.row:first-child{border-top:0}\n.row .nm{font-weight:600;cursor:pointer;background:none;border:0;padding:0;text-align:left;color:var(--ink)}\n.row .nm:hover{color:var(--slate-ink);text-decoration:underline}\n.meta{color:var(--muted);font-size:12.5px;display:flex;gap:4px 10px;flex-wrap:wrap;margin-top:2px}\n.snip{color:var(--ink-2);font-size:13px;margin-top:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}\n.acts{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}\n@media (max-width:640px){.row{grid-template-columns:1fr}.acts{justify-content:flex-start}}\n.btn{border:1px solid var(--slate);background:var(--white);color:var(--slate-ink);border-radius:6px;padding:6px 11px;cursor:pointer;font-size:13px;font-weight:600;white-space:nowrap}\n.btn:hover{background:var(--slate-soft)}\n.btn.primary{background:var(--slate-ink);border-color:var(--slate-ink);color:var(--white)}\n.btn.primary:hover{background:var(--slate-dark)}\n.btn.quiet{border-color:var(--gray);color:var(--ink-2);font-weight:500}\n.btn:disabled{opacity:.5;cursor:default}\n.more{display:block;width:100%;border:0;border-top:1px solid var(--rule);background:none;padding:10px;color:var(--slate-ink);font-weight:600;cursor:pointer;font-size:13px}\n.empty{padding:18px 14px;color:var(--muted);font-size:13.5px}\n\n.pill{display:inline-block;font-size:11.5px;font-weight:600;padding:2px 8px;border-radius:999px;background:var(--slate-soft);color:var(--slate-ink);white-space:nowrap}\n.pill.gray{background:#efefef;color:var(--ink-2)}\n.due{font-size:12px;font-weight:600;white-space:nowrap}\n.due.late{color:var(--late)}\n.due.soon{color:var(--soon)}\n.due.late::before{content:\"\\25CF  \"}\n\n/* pipeline board */\n.board{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}\n@media (max-width:900px){.board{grid-template-columns:repeat(2,minmax(0,1fr))}}\n@media (max-width:560px){.board{grid-template-columns:1fr}}\n.col{background:var(--white);border:1px solid var(--rule);border-radius:8px;display:flex;flex-direction:column;min-width:0}\n.col h3{font:700 12px/1 var(--head);letter-spacing:.1em;text-transform:uppercase;margin:0;padding:12px 12px 10px;border-bottom:2px solid var(--slate);display:flex;justify-content:space-between;color:var(--ink)}\n.col h3 span{color:var(--muted)}\n.col .sum{font-size:12px;color:var(--muted);padding:6px 12px 0}\n.col ul{list-style:none;margin:0;padding:6px;display:flex;flex-direction:column;gap:6px}\n.lc{border:1px solid var(--rule);border-radius:6px;padding:9px 10px;cursor:pointer;background:var(--white);text-align:left;width:100%}\n.lc:hover{border-color:var(--slate-tint);background:#fbfbfa}\n.lc b{display:block;font-weight:600;font-size:13.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.lc .meta{font-size:12px}\n\n/* charts */\n.charts{display:grid;grid-template-columns:3fr 2fr;gap:10px}\n@media (max-width:860px){.charts{grid-template-columns:1fr}}\n.chart{padding:14px 14px 10px;position:relative}\n.chart h3{font:700 13px/1.3 var(--head);margin:0 0 2px}\n.chart .cap{font-size:12px;color:var(--muted);margin:0 0 10px}\n.vbars{display:flex;align-items:flex-end;gap:6px;height:170px;border-bottom:1px solid var(--gray);padding-top:16px}\n.vb{flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;height:100%;position:relative;cursor:default;min-width:0}\n.vb i{display:block;width:100%;max-width:34px;background:var(--slate);border-radius:4px 4px 0 0;min-height:2px}\n.vb:hover i,.vb:focus i{background:var(--slate-dark)}\n.vb em{font-style:normal;font-size:11.5px;color:var(--ink-2);font-variant-numeric:tabular-nums;margin-bottom:3px}\n.vlabels{display:flex;gap:6px;margin-top:5px}\n.vlabels span{flex:1;text-align:center;font-size:11px;color:var(--muted);min-width:0;overflow:hidden}\n.hbars{display:grid;grid-template-columns:auto 1fr auto;gap:7px 10px;align-items:center;font-size:13px}\n.hbars .bar-t{height:14px;background:#f1f1f0;border-radius:0 4px 4px 0;overflow:hidden}\n.hbars .bar-t i{display:block;height:100%;background:var(--slate);border-radius:0 4px 4px 0}\n.hbars .bar-t i.unk{background:repeating-linear-gradient(135deg,var(--gray) 0 4px,#e6e6e6 4px 8px)}\n.hbars .v{font-variant-numeric:tabular-nums;color:var(--ink-2);text-align:right}\n.tip{position:absolute;pointer-events:none;background:var(--black);color:var(--white);font-size:12px;padding:5px 8px;border-radius:4px;white-space:nowrap;transform:translate(-50%,-100%);z-index:3}\n\n/* all-leads table */\n.tools{display:flex;gap:8px;flex-wrap:wrap}\n.tools input,.tools select{border:1px solid var(--gray);border-radius:6px;padding:7px 10px;background:var(--white);min-width:0}\n.tools input{width:220px}\n.tbl{width:100%;border-collapse:collapse;font-size:13px}\n.tbl th{font:700 11px/1 var(--head);letter-spacing:.08em;text-transform:uppercase;text-align:left;color:var(--white);background:var(--slate);padding:9px 10px}\n.tbl th:first-child{border-top-left-radius:7px}.tbl th:last-child{border-top-right-radius:7px}\n.tbl td{padding:8px 10px;border-top:1px solid var(--rule);vertical-align:top}\n.tbl tr:nth-child(even) td{background:#faf9f7}\n.tbl tbody tr{cursor:pointer}\n.tbl tbody tr:hover td{background:var(--slate-soft)}\n.tbl .r{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}\n@media (max-width:700px){.tbl .hide-s{display:none}}\n\n/* drawer */\n.scrim{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:30}\n.drawer{position:fixed;top:0;right:0;bottom:0;width:min(560px,100%);background:var(--white);z-index:31;overflow-y:auto;box-shadow:-10px 0 30px rgba(0,0,0,.15);display:flex;flex-direction:column}\n.dh{padding:16px 18px 14px;border-bottom:1px solid var(--rule);position:sticky;top:0;background:var(--white);z-index:1;display:flex;gap:10px;align-items:flex-start}\n.dh h2{font-size:20px}\n.dh .sp{flex:1}\n.db{padding:4px 18px 30px}\n.dsec{padding:14px 0;border-bottom:1px solid var(--rule)}\n.dsec:last-child{border-bottom:0}\n.kv{display:grid;grid-template-columns:120px 1fr;gap:5px 12px;font-size:13.5px}\n.kv dt{color:var(--muted)}\n.kv dd{margin:0;word-break:break-word}\n.inq{white-space:pre-wrap;background:var(--beige);border-radius:6px;padding:10px 12px;font-size:13px;color:var(--ink-2);max-height:260px;overflow:auto;margin:0}\n.form{display:grid;grid-template-columns:1fr 1fr;gap:10px 12px}\n.form label{display:flex;flex-direction:column;gap:4px;font-size:12px;font-weight:600;color:var(--ink-2)}\n.form .full{grid-column:1/-1}\n.form select,.form input,.form textarea{border:1px solid var(--gray);border-radius:6px;padding:8px 10px;font-weight:400;font-size:14px;background:var(--white);width:100%}\n.form textarea{min-height:76px;resize:vertical}\n.hint{font-weight:400;color:var(--muted);font-size:11.5px}\n.save-row{display:flex;align-items:center;gap:10px;margin-top:12px}\n.msg{font-size:12.5px;color:var(--muted)}\n.msg.err{color:var(--late)}\n.hist{list-style:none;margin:0;padding:0}\n.hist li{padding:9px 0;border-top:1px solid var(--rule);font-size:13px}\n.hist li:first-child{border-top:0}\n.hist .hm{color:var(--muted);font-size:12px}\n@media (max-width:480px){.form{grid-template-columns:1fr}.kv{grid-template-columns:100px 1fr}}\n\n.notice{background:var(--white);border:1px solid var(--rule);border-left:3px solid var(--slate);border-radius:6px;padding:16px;max-width:560px;margin:60px auto}\n.notice h2{margin-bottom:6px}\n.foot{color:var(--muted);font-size:12px;margin-top:30px}\n.toast{position:fixed;bottom:18px;left:50%;transform:translateX(-50%);background:var(--black);color:var(--white);padding:9px 16px;border-radius:6px;font-size:13px;z-index:40}\n</style>\n</head>\n<body>\n<header class=\"bar\">\n  <div class=\"wrap\">\n    <img class=\"logo\" src=\"data:image/png;base64,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epYrnMeL0brjjuHb3vY2XvjCF5qZmbLfTJ7npGnKzp07ueeee/iLv/iL91U3c8vLX/5yLrroIl772teaer2O67porUnTlDRN+cIXvsDll1+OlPIj4+eqfr9kYr7gBS8Q1113XXreeee5w+GQt7/97SNz9JSpqSnz8pe/3Dz1qU9FCMFgMMC2bbrdLjfccAN/+qd/ypi/k1RMFezevXv8HmfGpX232wW4AHj/GMrkSynjwWBwkP/z6le/mve9730opUyj0SDPy+k5eZ7z4IMPctttt/GOd7zjY6O/f+c738nll1/O+eefb1avXs1wOCTLMizL4u677yaOY9avX79p/JqjvamIZ9zfdaWUOs/zkaYE4G1vexsvfelLueeee5ae0yj0MRwOuf766znnnHOQUl4zuk6ldftjWtCVUr7v85//fPed73znR9VPfsKf/+VfVWwyaFGrzbHKu19F+MGzz/Ke+tSnpC944YvNs55VgkSWZVFkKQa45ZZbyLKMNWvWvGHkv+/evRul1DlSyuuWE/JwOCRJkiVT/xWveMVNL33pS8/o9/tm48aNZQjHGHKTU+QFN954IytXruS0pz5VqLgTyHBD96yzzuIv/uLP/+b000//m1qthk5T8qoT889+9jPWrFmDlPIzI0skiiJGIazDZes/Fkz2a+JoB0rGpZTJ7bffbpRSSyBAvV5Ha02j0eDJT37yZ6SUl4x8AaWU2+v10i1btmDbdhWzKsEM27bZvHnzQeibUurGbrd7xnhsbdwmVkqlt99+u3vqqae+WUr5seqzc+64445rkyTBtsvBDKNrbN68mYmJCa9ipHhksiqlzrn//vuvXb9+/VSlycanoKy97777th577LGjGEt7zAft/vjHPzae52kpDyQgf+tb3zKdTqeKudlLzFar1TjllFNukVKeXp1HSynnfvzjH5uf/vSnVU98e2lWwdTUFMcff/wHpZR/MgIwgLlqzR/ftWvXZatXr25WJmoMBFLKrlLqgcXFxdlnPOMZYowJza233spgMKDZbC75MFmWMTs7y1FHHTUzivUppWY7nc4D7XZ7E9AZ893c6vx/c9ttt739Kac/7Tp50onnqq27Z5mcjhngku7w5aZ1c2r79ta9P79jPooiHMfBYHCrvZiYmODEE0+8cMTYSil53333/eTYY489Vko5Qjb96jUPXNvv959zxhlnjNPGV5VS5/V6PWq1Wtml0xJorVmzZg1P2LjpXFavvgl6DeqO5sHF1t13/Hzrrl27sCwL13EwhaEoCprNJps3bx6noYvm5uaunJ2dnanut1U9q5jH+Hg4jDYDzP+6TOYqfjTSRjMjh/3X/KYFxGOVrKPB5vMjqb4MNTwIDPg15x49RLfyhZLx7yoiPkiYLEPrOAxaOjqvN+Zv/rr70xXsrx/GmoPqQSfj7w/zTFieeVOtubE0+ulXX8dfvv4R+DIypQ/67q6ojUOCU9ek8z6bNs2zZdtmfLdDu53IXwN7H65Cedm9+MuJu9q7/sPRKKrTCQiAPYstOTIXf/V62hXdxcvowX+sNNgjYTR/TBOMCDZZRqDLNUZQPaiRxHUPIyU3VkDKIWXo44xVARjx4dZQIZ5zI1RxtDljTHAgj+/Amv0jJBGPX7s15teMCN5dlpQ7Khz1K/N6qZHnONAx0uxj++KOnXuUTd+vtFdc3ddIuLSrf8djv9dj9++NCYLRd+kygTXS1I3qvJ0jMezYfjIueJbOE1ZavEeDDZWf1MGHGBaTFna9j2cn1Afl/UXR+B63ge4Y8KQPs/+MXY9l+z5ChkcAUYPphse6TaXJv3XrDDNewiBzCZt9ol4DXXism4zpDFza7aRCHb1lezT+XNPlwvY3yWitihDGmlLSqm66P8YAsyzNq2LkWMcc2nCzcZjPR3/rj0nT8c/02O+Ww/GHY5RxjXAQ0xzm+uNCIF12jZEp442hiqN76xwmPBCM5buOiHR22TlG5/EqJvSX3dv4Qx8JsXSZwHLH/Cl3GdEGY+c6aO/HNfN4GKbas+UCyBuZrkv32AxdnLqmHmgWdgd4+xOy1S4bmjHbo4Bm2GdhR8CmdfOoKIBofC/Hwahxn3j0fNdW69Zjfzu+/rFuxKRl1f/2gCawK/OpB6UGH8QtqMfE7YTG1hkmJ2Py/lpmj+ug1JLAqZg+WSb8krG1PS4MZ/2KOFp37CHG1fvuuJapvptfZhr1xzZpBBsnI5Omuonx8442NxmPdUkpR6OM4rFz68OYYOmYuROPbdIoUyNexkhptf64MonnpJTdaiCgHs/uGEP44mr9y4PZo0GC3bF1J8vuLR179YH5MWnaPwyTjboAxxWUP9LSSbXOZGnE08GaoT+2N+nYkMNk2brS8T0bX1/1+3QcCJNSxvSimLiTEJEyqWPiOKG3PUZFHr2oTxRBP09QijCM+sv2Z7QvutprvexZ7az2b5wGRvu+PBvDQymPqBezvdcnHnSJolSGYSLbT+qU86YVTE7GRFHK7HGdZfTXHaPJeOy6jD/zx0Oj/b8FLfy/ql+3JwAAAABJRU5ErkJggg==\" alt=\"CKA Construction Group\">\n    <h1>Leads</h1>\n    <span class=\"sp\"></span>\n    <span class=\"who\" id=\"who\"></span>\n    <div class=\"seg\" role=\"group\" aria-label=\"Whose leads\">\n      <button type=\"button\" data-scope=\"all\" aria-pressed=\"true\">Everyone</button>\n      <button type=\"button\" data-scope=\"mine\" aria-pressed=\"false\">Mine</button>\n    </div>\n    <button type=\"button\" class=\"icon-btn\" id=\"refresh\" title=\"Reload from Airtable\">Refresh</button>\n  </div>\n</header>\n\n<main class=\"wrap\" id=\"app\">\n  <p class=\"empty\" id=\"loading\">Loading leads&hellip;</p>\n</main>\n\n<div id=\"drawer-root\"></div>\n<div class=\"toast\" id=\"toast\" hidden></div>\n\n<script>\n(function () {\n  \"use strict\";\n\n  /* ---------------------------------------------------------------- */\n  /* Settings                                                          */\n\n  // Stages that are still in play. Stage is the field that decides it (Kevin,\n  // 19 Nov); Status is left alone.\n  var OPEN = [\"New\", \"Qualified\", \"Proposal Sent\", \"Negotiating\"];\n  // The website form puts a budget band into Estimated Value as a code rather\n  // than a dollar figure. Kevin confirmed 500 = \"$500K - $1M\". Any other code\n  // below $1,000 is shown as \"not stated\" until someone says what it means.\n  var BUDGET_BANDS = { 500: \"$500K–$1M\" };\n  var REAL_VALUE_MIN = 1000;\n\n  /* ---------------------------------------------------------------- */\n  /* State                                                             */\n\n  var qs = new URLSearchParams(location.search);\n  var KEY = qs.get(\"k\") || store(\"get\", \"cka-leads-k\") || \"\";\n  if (qs.get(\"k\")) store(\"set\", \"cka-leads-k\", qs.get(\"k\"));\n\n  var data = null;\n  var scope = store(\"get\", \"cka-leads-scope\") === \"mine\" ? \"mine\" : \"all\";\n  var show = { triage: 8, fu: 8, all: 40 };\n  var filter = { q: \"\", stage: \"open\" };\n  var openId = null;\n\n  function store(op, k, v) {\n    try { return op === \"get\" ? localStorage.getItem(k) : localStorage.setItem(k, v); } catch (e) { return null; }\n  }\n\n  /* ---------------------------------------------------------------- */\n  /* Helpers                                                           */\n\n  function esc(s) {\n    return String(s == null ? \"\" : s).replace(/[&<>\"']/g, function (c) {\n      return { \"&\": \"&amp;\", \"<\": \"&lt;\", \">\": \"&gt;\", '\"': \"&quot;\", \"'\": \"&#39;\" }[c];\n    });\n  }\n  function $(sel, root) { return (root || document).querySelector(sel); }\n  function ymd(d) {\n    return d.getFullYear() + \"-\" + String(d.getMonth() + 1).padStart(2, \"0\") + \"-\" + String(d.getDate()).padStart(2, \"0\");\n  }\n  var TODAY = ymd(new Date());\n  function addDays(s, n) { var d = new Date(s + \"T12:00:00\"); d.setDate(d.getDate() + n); return ymd(d); }\n  function daysBetween(a, b) { return Math.round((new Date(b + \"T12:00:00\") - new Date(a + \"T12:00:00\")) / 864e5); }\n  function fmtDate(s) {\n    if (!s) return \"\";\n    var d = new Date(s.length === 10 ? s + \"T12:00:00\" : s);\n    var opts = { month: \"short\", day: \"numeric\" };\n    if (d.getFullYear() !== new Date().getFullYear()) opts.year = \"numeric\";\n    return d.toLocaleDateString(\"en-US\", opts);\n  }\n  function ago(s) {\n    var n = daysBetween(s, TODAY);\n    if (n <= 0) return \"today\";\n    if (n === 1) return \"yesterday\";\n    if (n < 14) return n + \" days ago\";\n    if (n < 60) return Math.round(n / 7) + \" weeks ago\";\n    return fmtDate(s);\n  }\n  function money(n) {\n    if (n >= 1e6) return \"$\" + (n / 1e6).toFixed(n % 1e6 ? 2 : 0).replace(/\\.?0+$/, \"\") + \"M\";\n    if (n >= 1e3) return \"$\" + Math.round(n / 1e3) + \"K\";\n    return \"$\" + n;\n  }\n  function budget(l) {\n    if (l.value == null) return \"\";\n    if (l.value >= REAL_VALUE_MIN) return money(l.value);\n    return BUDGET_BANDS[l.value] || \"\";\n  }\n  function first(name) { return String(name || \"\").split(\" \")[0]; }\n  // The day a lead came in. Date Entered when someone typed it (rows carried\n  // over from the Google Sheet), otherwise when the row was created.\n  function received(l) { return l.entered || ymd(new Date(l.created)); }\n  function snippet(t) {\n    // Website inquiries start \"City: message\"; keep it, it is useful context.\n    return String(t || \"\").replace(/\\s+/g, \" \").trim().slice(0, 220);\n  }\n  function dueTag(d) {\n    if (!d) return \"\";\n    var n = daysBetween(TODAY, d);\n    if (n < 0) return '<span class=\"due late\">' + (n === -1 ? \"1 day\" : -n + \" days\") + \" overdue</span>\";\n    if (n === 0) return '<span class=\"due soon\">Due today</span>';\n    if (n <= 7) return '<span class=\"due soon\">Due ' + fmtDate(d) + \"</span>\";\n    return '<span class=\"due\">' + fmtDate(d) + \"</span>\";\n  }\n  function toast(msg) {\n    var t = $(\"#toast\"); t.textContent = msg; t.hidden = false;\n    clearTimeout(toast.t); toast.t = setTimeout(function () { t.hidden = true; }, 2600);\n  }\n\n  /* ---------------------------------------------------------------- */\n  /* Data                                                              */\n\n  function api(path, body) {\n    var opts = body\n      ? { method: \"POST\", headers: { \"Content-Type\": \"application/json\" }, body: JSON.stringify(Object.assign({ k: KEY }, body)) }\n      : {};\n    var url = body ? path : path + (path.indexOf(\"?\") < 0 ? \"?\" : \"&\") + \"k=\" + encodeURIComponent(KEY);\n    return fetch(url, opts).then(function (r) {\n      return r.json().catch(function () { return {}; }).then(function (j) {\n        if (!r.ok) { var e = new Error(j.error || \"Something went wrong (\" + r.status + \").\"); e.status = r.status; throw e; }\n        return j;\n      });\n    });\n  }\n\n  function load(quiet) {\n    if (!KEY) return notice(\"This page needs your personal link\", \"Open the link Kevin sent you. It ends in ?k= followed by your key. Once opened, this browser remembers it.\");\n    return api(\"/api/leads\").then(function (j) {\n      data = j;\n      var logsBy = {};\n      j.followUps.forEach(function (f) { (logsBy[f.lead] = logsBy[f.lead] || []).push(f); });\n      j.leads.forEach(function (l) {\n        l.logs = (logsBy[l.id] || []).sort(function (a, b) {\n          return String(b.date || b.created).localeCompare(String(a.date || a.created));\n        });\n        l.lastContact = l.logs.length ? (l.logs[0].date || l.logs[0].created.slice(0, 10)) : null;\n        l.recv = received(l);\n      });\n      $(\"#who\").textContent = j.me ? \"Signed in as \" + first(j.me) : \"\";\n      render();\n      if (openId) openDrawer(openId);\n      if (!quiet) $(\"#loading\") && $(\"#loading\").remove();\n    }).catch(function (e) {\n      if (e.status === 401) { store(\"set\", \"cka-leads-k\", \"\"); return notice(\"This link is not active\", e.message); }\n      notice(\"Could not load the leads\", e.message + \" Try Refresh in a minute. If it keeps happening, send Kevin a screenshot of this message.\");\n    });\n  }\n\n  function notice(title, body) {\n    $(\"#app\").innerHTML = '<div class=\"notice\"><h2>' + esc(title) + \"</h2><p>\" + esc(body) + \"</p></div>\";\n  }\n\n  function mine(l) { return scope === \"all\" || l.assigned === data.me; }\n  function isOpen(l) { return OPEN.indexOf(l.stage) >= 0; }\n\n  /* ---------------------------------------------------------------- */\n  /* Render                                                            */\n\n  function render() {\n    var L = data.leads;\n    var triage = L.filter(function (l) { return !l.stage; })\n      .sort(function (a, b) { return b.recv.localeCompare(a.recv); });\n    var open = L.filter(function (l) { return isOpen(l) && mine(l); });\n    var overdue = open.filter(function (l) { return l.nextFollowUp && l.nextFollowUp < TODAY; });\n    var soon = open.filter(function (l) { return l.nextFollowUp && l.nextFollowUp >= TODAY && l.nextFollowUp <= addDays(TODAY, 7); });\n    var noDate = open.filter(function (l) { return !l.nextFollowUp; });\n    var monthStart = TODAY.slice(0, 7);\n    var thisMonth = L.filter(function (l) { return l.recv.slice(0, 7) === monthStart && mine(l); });\n    var won = L.filter(function (l) { return l.stage === \"Won\" && mine(l); });\n    var knownVal = open.reduce(function (s, l) { return s + (l.value >= REAL_VALUE_MIN ? l.value : 0); }, 0);\n\n    var h = \"\";\n\n    h += '<div class=\"tiles\">';\n    h += tile(\"triage\", triage.length, \"Waiting for a first look\", \"No stage set yet\", triage.length > 0);\n    h += tile(\"fu\", overdue.length, \"Follow-ups overdue\", noDate.length + \" open with no date set\", overdue.length > 0);\n    h += tile(\"pipe\", open.length, \"Open leads\", knownVal ? money(knownVal) + \" with a real estimate\" : \"New to negotiating\");\n    h += tile(\"flow\", thisMonth.length, \"Came in this month\", new Date().toLocaleDateString(\"en-US\", { month: \"long\" }));\n    h += tile(\"all\", won.length, \"Won\", \"All time\");\n    h += \"</div>\";\n\n    /* 1. Triage */\n    h += '<section class=\"sec\" id=\"s-triage\"><div class=\"sec-head\"><div><p class=\"label\">01 Triage</p><h2>Waiting for a first look</h2>' +\n         \"<p>New inquiries nobody has set a stage on. Newest first. Everyone sees these, whatever the toggle says.</p></div></div>\";\n    h += '<div class=\"card\"><ul class=\"rows\">';\n    if (!triage.length) h += '<li class=\"empty\">Nothing waiting. Every lead has a stage.</li>';\n    triage.slice(0, show.triage).forEach(function (l) {\n      h += '<li class=\"row\"><div><button class=\"nm\" data-open=\"' + l.id + '\">' + esc(l.name) + \"</button>\" +\n           '<div class=\"meta\"><span>' + esc(ago(l.recv)) + \"</span>\" +\n           (l.type ? \"<span>\" + esc(l.type) + \"</span>\" : \"\") +\n           (budget(l) ? \"<span>\" + esc(budget(l)) + \"</span>\" : \"\") +\n           (l.source ? \"<span>\" + esc(l.source) + \"</span>\" : \"\") + \"</div>\" +\n           (l.notes ? '<div class=\"snip\">' + esc(snippet(l.notes)) + \"</div>\" : \"\") + \"</div>\" +\n           '<div class=\"acts\"><button class=\"btn\" data-quick=\"Qualified\" data-id=\"' + l.id + '\">Qualified</button>' +\n           '<button class=\"btn quiet\" data-quick=\"Not Qualified\" data-id=\"' + l.id + '\">Not qualified</button>' +\n           '<button class=\"btn quiet\" data-open=\"' + l.id + '\">Open</button></div></li>';\n    });\n    h += \"</ul>\" + more(\"triage\", triage.length) + \"</div></section>\";\n\n    /* 2. Follow-ups */\n    var fu = overdue.sort(byDue).concat(soon.sort(byDue));\n    h += '<section class=\"sec\" id=\"s-fu\"><div class=\"sec-head\"><div><p class=\"label\">02 Follow-ups</p><h2>Who to call</h2>' +\n         \"<p>Open leads that are overdue or due in the next 7 days.</p></div></div>\";\n    h += '<div class=\"card\"><ul class=\"rows\">';\n    if (!fu.length) h += '<li class=\"empty\">Nothing overdue or due this week' + (scope === \"mine\" ? \" for you\" : \"\") + \".</li>\";\n    fu.slice(0, show.fu).forEach(function (l) { h += fuRow(l); });\n    h += \"</ul>\" + more(\"fu\", fu.length) + \"</div>\";\n    if (noDate.length) {\n      h += '<p class=\"foot\" style=\"margin-top:8px\">' + noDate.length + \" open lead\" + (noDate.length === 1 ? \" has\" : \"s have\") +\n           \" no next follow-up date, so they can't come up here: \" +\n           noDate.slice(0, 12).map(function (l) { return '<a href=\"#\" data-open=\"' + l.id + '\">' + esc(l.name) + \"</a>\"; }).join(\", \") +\n           (noDate.length > 12 ? \" and \" + (noDate.length - 12) + \" more\" : \"\") + \".</p>\";\n    }\n    h += \"</section>\";\n\n    /* 3. Pipeline */\n    h += '<section class=\"sec\" id=\"s-pipe\"><div class=\"sec-head\"><div><p class=\"label\">03 Pipeline</p><h2>Open leads by stage</h2>' +\n         \"<p>Tap a lead to update it or log a call.</p></div></div>\";\n    h += '<div class=\"board\">';\n    OPEN.forEach(function (st) {\n      var items = open.filter(function (l) { return l.stage === st; }).sort(byDue);\n      var v = items.reduce(function (s, l) { return s + (l.value >= REAL_VALUE_MIN ? l.value : 0); }, 0);\n      h += '<div class=\"col\"><h3>' + esc(st) + \"<span>\" + items.length + \"</span></h3>\" +\n           (v ? '<div class=\"sum\">' + money(v) + \" estimated</div>\" : \"\") + \"<ul>\";\n      if (!items.length) h += '<li class=\"empty\" style=\"padding:8px 6px\">None</li>';\n      items.forEach(function (l) {\n        h += '<li><button class=\"lc\" data-open=\"' + l.id + '\"><b>' + esc(l.name) + '</b><div class=\"meta\">' +\n             \"<span>\" + esc(l.assigned ? first(l.assigned) : \"Unassigned\") + \"</span>\" +\n             (budget(l) ? \"<span>\" + esc(budget(l)) + \"</span>\" : \"\") +\n             (l.nextFollowUp ? dueTag(l.nextFollowUp) : '<span class=\"due\">No date</span>') +\n             \"</div></button></li>\";\n      });\n      h += \"</ul></div>\";\n    });\n    h += \"</div></section>\";\n\n    /* 4. Lead flow */\n    h += '<section class=\"sec\" id=\"s-flow\"><div class=\"sec-head\"><div><p class=\"label\">04 Lead flow</p><h2>Where leads come from</h2></div></div>';\n    h += '<div class=\"charts\"><div class=\"card chart\" id=\"c-month\">' + monthChart() + \"</div>\" +\n         '<div class=\"card chart\">' + sourceChart() + \"</div></div></section>\";\n\n    /* 5. All leads */\n    h += '<section class=\"sec\" id=\"s-all\"><div class=\"sec-head\"><div><p class=\"label\">05 All leads</p><h2>Find a lead</h2></div>' +\n         '<div class=\"tools\"><input type=\"search\" id=\"q\" placeholder=\"Search name, company, email\" value=\"' + esc(filter.q) + '\">' +\n         '<select id=\"stagef\"><option value=\"open\">Open stages</option><option value=\"\">All stages</option><option value=\"(none)\">No stage</option>' +\n         data.choices.stage.map(function (s) { return \"<option\" + (filter.stage === s ? \" selected\" : \"\") + \">\" + esc(s) + \"</option>\"; }).join(\"\") +\n         \"</select></div></div>\";\n    h += '<div class=\"card\" id=\"all-wrap\">' + allTable() + \"</div></section>\";\n\n    h += '<p class=\"foot\">Live from the CKA Live Leads base in Airtable. Updated ' +\n         new Date(data.generatedAt).toLocaleTimeString(\"en-US\", { hour: \"numeric\", minute: \"2-digit\" }) + \".</p>\";\n\n    $(\"#app\").innerHTML = h;\n    var sf = $(\"#stagef\"); if (sf) sf.value = filter.stage;\n    wireCharts();\n  }\n\n  function byDue(a, b) { return String(a.nextFollowUp || \"9999\").localeCompare(String(b.nextFollowUp || \"9999\")); }\n  function tile(target, n, t, s, alert) {\n    return '<button class=\"tile' + (alert ? \" alert\" : \"\") + '\" data-jump=\"s-' + target + '\"><div class=\"n\">' + n +\n           '</div><div class=\"t\">' + esc(t) + '</div><div class=\"s\">' + esc(s) + \"</div></button>\";\n  }\n  function more(which, total) {\n    if (total <= show[which]) return \"\";\n    return '<button class=\"more\" data-more=\"' + which + '\">Show ' + Math.min(total - show[which], 40) + \" more of \" + total + \"</button>\";\n  }\n  function fuRow(l) {\n    return '<li class=\"row\"><div><button class=\"nm\" data-open=\"' + l.id + '\">' + esc(l.name) + \"</button>\" +\n      '<div class=\"meta\"><span class=\"pill\">' + esc(l.stage) + \"</span>\" +\n      \"<span>\" + esc(l.assigned ? first(l.assigned) : \"Unassigned\") + \"</span>\" +\n      (l.lastContact ? \"<span>Last contact \" + esc(ago(l.lastContact)) + \"</span>\" : \"<span>No calls logged</span>\") +\n      (l.phone ? '<span><a href=\"tel:' + esc(l.phone) + '\">' + esc(l.phone) + \"</a></span>\" : \"\") +\n      \"</div></div>\" +\n      '<div class=\"acts\">' + dueTag(l.nextFollowUp) + '<button class=\"btn\" data-log=\"' + l.id + '\">Log a call</button></div></li>';\n  }\n\n  function monthChart() {\n    var months = [], d = new Date(); d.setDate(1);\n    for (var i = 11; i >= 0; i--) {\n      var m = new Date(d.getFullYear(), d.getMonth() - i, 1);\n      months.push({ key: ymd(m).slice(0, 7), label: m.toLocaleDateString(\"en-US\", { month: \"short\" }), n: 0 });\n    }\n    data.leads.forEach(function (l) {\n      if (!mine(l)) return;\n      var mm = months.find(function (x) { return x.key === l.recv.slice(0, 7); });\n      if (mm) mm.n++;\n    });\n    var max = Math.max.apply(null, months.map(function (m) { return m.n; }).concat([1]));\n    var bars = months.map(function (m) {\n      return '<div class=\"vb\" tabindex=\"0\" data-tip=\"' + esc(m.label + \" \" + m.key.slice(0, 4) + \": \" + m.n + \" lead\" + (m.n === 1 ? \"\" : \"s\")) + '\">' +\n             (m.n ? \"<em>\" + m.n + \"</em>\" : \"\") + '<i style=\"height:' + (m.n / max * 100) + '%\"></i></div>';\n    }).join(\"\");\n    var labels = months.map(function (m) { return \"<span>\" + esc(m.label) + \"</span>\"; }).join(\"\");\n    return \"<h3>Leads per month</h3><p class=\\\"cap\\\">Last 12 months, by the date each lead came in\" +\n           (scope === \"mine\" ? \", assigned to you\" : \"\") + \".</p>\" +\n           '<div class=\"vbars\">' + bars + '</div><div class=\"vlabels\">' + labels + \"</div>\";\n  }\n\n  function sourceChart() {\n    var counts = {}, total = 0;\n    data.leads.forEach(function (l) {\n      if (!mine(l)) return;\n      var k = l.source || \"Not recorded\"; counts[k] = (counts[k] || 0) + 1; total++;\n    });\n    var rows = Object.keys(counts).map(function (k) { return { k: k, n: counts[k] }; })\n      // \"Not recorded\" always last so it never looks like the top channel.\n      .sort(function (a, b) { return (a.k === \"Not recorded\") - (b.k === \"Not recorded\") || b.n - a.n; });\n    var max = Math.max.apply(null, rows.map(function (r) { return r.n; }).concat([1]));\n    var h = \"<h3>Lead source</h3><p class=\\\"cap\\\">All leads\" + (scope === \"mine\" ? \" assigned to you\" : \"\") +\n            \". Set the source when you triage a lead so this fills in.</p><div class=\\\"hbars\\\">\";\n    rows.forEach(function (r) {\n      h += \"<span>\" + esc(r.k) + '</span><div class=\"bar-t\" title=\"' + esc(r.k + \": \" + r.n + \" (\" + Math.round(r.n / total * 100) + \"%)\") + '\"><i' +\n           (r.k === \"Not recorded\" ? ' class=\"unk\"' : \"\") + ' style=\"width:' + (r.n / max * 100) + '%\"></i></div><span class=\"v\">' + r.n + \"</span>\";\n    });\n    return h + \"</div>\";\n  }\n\n  function wireCharts() {\n    var box = $(\"#c-month\"); if (!box) return;\n    var tip = document.createElement(\"div\"); tip.className = \"tip\"; tip.hidden = true; box.appendChild(tip);\n    box.querySelectorAll(\".vb\").forEach(function (b) {\n      function on() {\n        var r = b.getBoundingClientRect(), br = box.getBoundingClientRect(), bar = b.querySelector(\"i\").getBoundingClientRect();\n        tip.textContent = b.getAttribute(\"data-tip\"); tip.hidden = false;\n        tip.style.left = (r.left - br.left + r.width / 2) + \"px\";\n        tip.style.top = (bar.top - br.top - 22) + \"px\";\n      }\n      b.addEventListener(\"mouseenter\", on); b.addEventListener(\"focus\", on);\n      b.addEventListener(\"mouseleave\", function () { tip.hidden = true; });\n      b.addEventListener(\"blur\", function () { tip.hidden = true; });\n    });\n  }\n\n  function allTable() {\n    var q = filter.q.toLowerCase();\n    var rows = data.leads.filter(function (l) {\n      if (!mine(l)) return false;\n      if (filter.stage === \"open\" && !isOpen(l)) return false;\n      if (filter.stage === \"(none)\" && l.stage) return false;\n      if (filter.stage && filter.stage !== \"open\" && filter.stage !== \"(none)\" && l.stage !== filter.stage) return false;\n      if (q && (l.name + \" \" + l.company + \" \" + l.email + \" \" + l.phone).toLowerCase().indexOf(q) < 0) return false;\n      return true;\n    }).sort(function (a, b) { return b.recv.localeCompare(a.recv); });\n    if (!rows.length) return '<p class=\"empty\">No leads match.</p>';\n    var h = '<table class=\"tbl\"><thead><tr><th>Lead</th><th>Stage</th><th class=\"hide-s\">Owner</th><th class=\"hide-s\">Came in</th><th class=\"r\">Budget</th></tr></thead><tbody>';\n    rows.slice(0, show.all).forEach(function (l) {\n      h += '<tr data-open=\"' + l.id + '\"><td><b>' + esc(l.name) + \"</b>\" + (l.company ? '<div class=\"meta\">' + esc(l.company) + \"</div>\" : \"\") + \"</td>\" +\n           \"<td>\" + (l.stage ? '<span class=\"pill' + (isOpen(l) ? \"\" : \" gray\") + '\">' + esc(l.stage) + \"</span>\" : '<span class=\"pill gray\">No stage</span>') + \"</td>\" +\n           '<td class=\"hide-s\">' + esc(l.assigned ? first(l.assigned) : \"\") + \"</td>\" +\n           '<td class=\"hide-s\">' + esc(fmtDate(l.recv)) + \"</td>\" +\n           '<td class=\"r\">' + esc(budget(l)) + \"</td></tr>\";\n    });\n    return h + \"</tbody></table>\" + more(\"all\", rows.length);\n  }\n\n  /* ---------------------------------------------------------------- */\n  /* Drawer                                                            */\n\n  function opts(list, cur, blank) {\n    return (blank ? '<option value=\"\">' + esc(blank) + \"</option>\" : \"\") +\n      list.map(function (o) { return \"<option\" + (o === cur ? \" selected\" : \"\") + \">\" + esc(o) + \"</option>\"; }).join(\"\");\n  }\n\n  function openDrawer(id, focusLog) {\n    var l = data.leads.find(function (x) { return x.id === id; });\n    if (!l) return closeDrawer();\n    openId = id;\n    var C = data.choices;\n    var band = l.value != null && l.value < REAL_VALUE_MIN;\n    var h = '<div class=\"scrim\" data-close></div><aside class=\"drawer\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"dtitle\">' +\n      '<div class=\"dh\"><div><p class=\"label\">' + esc(l.stage || \"No stage yet\") + '</p><h2 id=\"dtitle\">' + esc(l.name) + \"</h2></div>\" +\n      '<span class=\"sp\"></span><button class=\"icon-btn\" data-close aria-label=\"Close\">Close</button></div><div class=\"db\">';\n\n    h += '<div class=\"dsec\"><dl class=\"kv\">' +\n      (l.company ? \"<dt>Company</dt><dd>\" + esc(l.company) + \"</dd>\" : \"\") +\n      (l.phone ? '<dt>Phone</dt><dd><a href=\"tel:' + esc(l.phone) + '\">' + esc(l.phone) + \"</a></dd>\" : \"\") +\n      (l.email ? '<dt>Email</dt><dd><a href=\"mailto:' + esc(l.email) + '\">' + esc(l.email) + \"</a></dd>\" : \"\") +\n      (l.email2 ? '<dt>Email 2</dt><dd><a href=\"mailto:' + esc(l.email2) + '\">' + esc(l.email2) + \"</a></dd>\" : \"\") +\n      \"<dt>Came in</dt><dd>\" + esc(fmtDate(l.recv)) + (daysBetween(l.recv, TODAY) < 60 ? \" (\" + esc(ago(l.recv)) + \")\" : \"\") + \"</dd>\" +\n      (l.enteredBy ? \"<dt>Entered by</dt><dd>\" + esc(l.enteredBy) + \"</dd>\" : \"\") +\n      (budget(l) ? \"<dt>Budget</dt><dd>\" + esc(budget(l)) + (band ? ' <span class=\"hint\">(website form band)</span>' : \"\") + \"</dd>\" : \"\") +\n      (l.sourceNote ? \"<dt>Source note</dt><dd>\" + esc(l.sourceNote) + \"</dd>\" : \"\") +\n      \"</dl></div>\";\n\n    if (l.notes) h += '<div class=\"dsec\"><p class=\"label\">Inquiry and notes</p><pre class=\"inq\">' + esc(l.notes) + \"</pre></div>\";\n\n    h += '<div class=\"dsec\"><p class=\"label\">Update</p><form class=\"form\" id=\"f-upd\">' +\n      '<label>Stage<select name=\"stage\">' + opts(C.stage, l.stage, \"No stage\") + \"</select></label>\" +\n      '<label>Assigned to<select name=\"assigned\">' + opts(C.assigned, l.assigned, \"Unassigned\") + \"</select></label>\" +\n      '<label>Lead source<select name=\"source\">' + opts(C.source, l.source, \"Not recorded\") + \"</select></label>\" +\n      '<label>Project type<select name=\"type\">' + opts(C.type, l.type, \"Not set\") + \"</select></label>\" +\n      '<label>Estimated value ($)<input name=\"value\" inputmode=\"numeric\" value=\"' + (l.value == null ? \"\" : l.value) + '\">' +\n      (band ? '<span class=\"hint\">' + esc(BUDGET_BANDS[l.value] ? l.value + \" is the form's \" + BUDGET_BANDS[l.value] + \" band. Replace it with a real figure once you have one.\" : \"This is a website-form code, not a dollar figure.\") + \"</span>\" : \"\") + \"</label>\" +\n      '<label>Next follow-up<input type=\"date\" name=\"nextFollowUp\" value=\"' + esc(l.nextFollowUp || \"\") + '\"></label>' +\n      '<div class=\"full save-row\"><button class=\"btn primary\" type=\"submit\">Save changes</button><span class=\"msg\" id=\"m-upd\"></span></div>' +\n      \"</form></div>\";\n\n    h += '<div class=\"dsec\" id=\"log-sec\"><p class=\"label\">Log a call or email</p><form class=\"form\" id=\"f-log\">' +\n      '<label>What happened<select name=\"outcome\">' + opts(C.outcome, \"\", \"Choose…\") + \"</select></label>\" +\n      '<label>Date<input type=\"date\" name=\"date\" value=\"' + TODAY + '\"></label>' +\n      '<label class=\"full\">Notes<textarea name=\"notes\" placeholder=\"What was said, what they need next\"></textarea></label>' +\n      '<label>Next follow-up<input type=\"date\" name=\"nextFollowUp\" value=\"' + esc(l.nextFollowUp && l.nextFollowUp > TODAY ? l.nextFollowUp : \"\") + '\">' +\n      '<span class=\"hint\">Leave empty to keep the current date.</span></label>' +\n      '<div class=\"full save-row\"><button class=\"btn primary\" type=\"submit\">Save to log</button><span class=\"msg\" id=\"m-log\"></span></div>' +\n      \"</form></div>\";\n\n    h += '<div class=\"dsec\"><p class=\"label\">History</p>';\n    if (!l.logs.length) h += '<p class=\"empty\" style=\"padding:6px 0\">Nothing logged yet.</p>';\n    else {\n      h += '<ul class=\"hist\">';\n      l.logs.forEach(function (f) {\n        h += \"<li><div><b>\" + esc(f.outcome || \"Note\") + '</b> <span class=\"hm\">' + esc(fmtDate(f.date || f.created)) +\n             (f.by ? \" · \" + esc(first(f.by)) : \"\") + \"</span></div>\" + (f.notes ? \"<div>\" + esc(f.notes) + \"</div>\" : \"\") + \"</li>\";\n      });\n      h += \"</ul>\";\n    }\n    h += \"</div></div></aside>\";\n\n    var root = $(\"#drawer-root\");\n    var wasOpen = !!root.innerHTML;\n    root.innerHTML = h;\n    document.body.style.overflow = \"hidden\";\n    if (focusLog) { $(\"#log-sec\").scrollIntoView(); $(\"#f-log select\").focus(); }\n    else if (!wasOpen) $(\".drawer .icon-btn\").focus();\n\n    $(\"#f-upd\").addEventListener(\"submit\", function (ev) {\n      ev.preventDefault();\n      var f = ev.target, body = {};\n      [\"stage\", \"assigned\", \"source\", \"type\", \"nextFollowUp\"].forEach(function (k) {\n        if ((f[k].value || \"\") !== (l[k] || \"\")) body[k] = f[k].value;\n      });\n      var v = f.value.value.replace(/[$,\\s]/g, \"\");\n      if (v !== (l.value == null ? \"\" : String(l.value))) body.value = v;\n      if (!Object.keys(body).length) { $(\"#m-upd\").textContent = \"Nothing changed.\"; return; }\n      save(\"/api/leads/\" + l.id + \"/update\", body, f, \"#m-upd\", \"Saved.\");\n    });\n    $(\"#f-log\").addEventListener(\"submit\", function (ev) {\n      ev.preventDefault();\n      var f = ev.target, body = { outcome: f.outcome.value, notes: f.notes.value, date: f.date.value };\n      if (f.nextFollowUp.value) body.nextFollowUp = f.nextFollowUp.value;\n      if (!body.outcome && !body.notes.trim()) { $(\"#m-log\").textContent = \"Pick what happened or write a note.\"; return; }\n      save(\"/api/leads/\" + l.id + \"/followup\", body, f, \"#m-log\", \"Logged.\");\n    });\n  }\n\n  function save(path, body, form, msgSel, done) {\n    var btn = form.querySelector(\"button[type=submit]\"); btn.disabled = true;\n    var m = $(msgSel); m.className = \"msg\"; m.textContent = \"Saving…\";\n    api(path, body).then(function () {\n      toast(done);\n      return load(true);\n    }).catch(function (e) {\n      m.className = \"msg err\"; m.textContent = e.message; btn.disabled = false;\n    });\n  }\n\n  function closeDrawer() {\n    openId = null; $(\"#drawer-root\").innerHTML = \"\"; document.body.style.overflow = \"\";\n  }\n\n  /* ---------------------------------------------------------------- */\n  /* Events                                                            */\n\n  document.addEventListener(\"click\", function (ev) {\n    var t = ev.target.closest(\"[data-open],[data-log],[data-close],[data-quick],[data-more],[data-jump],[data-scope]\");\n    if (!t) return;\n    if (t.hasAttribute(\"data-close\")) return closeDrawer();\n    if (t.hasAttribute(\"data-open\")) { ev.preventDefault(); return openDrawer(t.getAttribute(\"data-open\")); }\n    if (t.hasAttribute(\"data-log\")) return openDrawer(t.getAttribute(\"data-log\"), true);\n    if (t.hasAttribute(\"data-jump\")) { var s = document.getElementById(t.getAttribute(\"data-jump\")); if (s) s.scrollIntoView({ behavior: \"smooth\" }); return; }\n    if (t.hasAttribute(\"data-more\")) { var w = t.getAttribute(\"data-more\"); show[w] += 40; return render(); }\n    if (t.hasAttribute(\"data-scope\")) {\n      scope = t.getAttribute(\"data-scope\"); store(\"set\", \"cka-leads-scope\", scope);\n      document.querySelectorAll(\"[data-scope]\").forEach(function (b) { b.setAttribute(\"aria-pressed\", String(b === t)); });\n      return data && render();\n    }\n    if (t.hasAttribute(\"data-quick\")) {\n      var id = t.getAttribute(\"data-id\"), stage = t.getAttribute(\"data-quick\");\n      t.disabled = true;\n      var body = { stage: stage };\n      // Qualifying a lead from the triage list hands it to whoever qualified it.\n      var lead = data.leads.find(function (x) { return x.id === id; });\n      if (stage === \"Qualified\" && lead && !lead.assigned && data.choices.assigned.indexOf(data.me) >= 0) body.assigned = data.me;\n      api(\"/api/leads/\" + id + \"/update\", body)\n        .then(function () { toast(lead.name + \": \" + stage + (body.assigned ? \", assigned to you\" : \"\")); return load(true); })\n        .catch(function (e) { t.disabled = false; toast(e.message); });\n    }\n  });\n  document.addEventListener(\"keydown\", function (ev) { if (ev.key === \"Escape\" && openId) closeDrawer(); });\n  document.addEventListener(\"input\", function (ev) {\n    if (ev.target.id === \"q\") { filter.q = ev.target.value; show.all = 40; $(\"#all-wrap\").innerHTML = allTable(); }\n  });\n  document.addEventListener(\"change\", function (ev) {\n    if (ev.target.id === \"stagef\") { filter.stage = ev.target.value; show.all = 40; $(\"#all-wrap\").innerHTML = allTable(); }\n  });\n  $(\"#refresh\").addEventListener(\"click\", function () { load(true).then(function () { toast(\"Up to date.\"); }); });\n  document.querySelectorAll(\"[data-scope]\").forEach(function (b) { b.setAttribute(\"aria-pressed\", String(b.getAttribute(\"data-scope\") === scope)); });\n\n  load();\n})();\n</script>\n</body>\n</html>\n";

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
const TIER_ORDER = { standard: 0, upgrade: 2 };
function tierRank(tier) {
  const t = String(tier || "").toLowerCase();
  return t in TIER_ORDER ? TIER_ORDER[t] : 1;
}
function cleanName(v, verb) {
  const name = text(v, 120);
  if (name.length < 3) throw httpError(400, "Type your full name to " + (verb || "approve") + ".");
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
