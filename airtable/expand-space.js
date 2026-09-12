/**
 * Airtable automation — "Expand space into selections"
 *
 * Trigger:  When a record is created in Spaces
 * Action:   Run script, with one input variable:
 *             name  = spaceId
 *             value = Airtable record ID of the trigger record
 *
 * What it does: reads every active Item Template for that space's type and
 * writes one Selection row per template, carrying the trade, lead time, mode
 * and description across, and setting "Needed by" from the project's
 * construction start minus the lead time.
 *
 * Add "Cabana bath" and its rows appear, named and dated. Delete the space and
 * delete its rows (Airtable does not cascade — the grid view grouped by Space
 * makes that one selection and one delete).
 */

const input_config = input.config();

const spaces     = base.getTable("Spaces");
const templates  = base.getTable("Item Templates");
const selections = base.getTable("Selections");
const projects   = base.getTable("Projects");

const space = await spaces.selectRecordAsync(input_config.spaceId, {
  fields: ["Space name", "Space Type", "Project", "Sort order"],
});
if (!space) throw new Error("Space not found: " + input_config.spaceId);

const spaceType = space.getCellValue("Space Type");
const projectLink = space.getCellValue("Project");
if (!spaceType || !spaceType.length) throw new Error("Set a Space Type before the rows can be generated.");
if (!projectLink || !projectLink.length) throw new Error("Link the space to a Project first.");

const typeId = spaceType[0].id;
const projectId = projectLink[0].id;

// Construction start anchors every needed-by date.
const project = await projects.selectRecordAsync(projectId, { fields: ["Construction start"] });
const start = project && project.getCellValue("Construction start")
  ? new Date(project.getCellValue("Construction start"))
  : null;

const templateRows = await templates.selectRecordsAsync({
  fields: ["Item name", "Space Type", "Default trade", "Default lead time (weeks)",
           "Default mode", "Description", "Sort order", "Active"],
});

const applicable = templateRows.records.filter((t) => {
  if (!t.getCellValue("Active")) return false;
  const types = t.getCellValue("Space Type") || [];
  return types.some((x) => x.id === typeId);
});

if (!applicable.length) {
  output.set("created", 0);
  output.set("message", "No active templates for that space type. Add them to Item Templates.");
  return;
}

const spaceOrder = space.getCellValue("Sort order") || 0;

const rows = applicable.map((t) => {
  const lead = t.getCellValue("Default lead time (weeks)") || 0;
  let neededBy = null;
  if (start) {
    // Order has to be placed `lead` weeks before the trade is on site. Counting
    // back from construction start is the conservative read and it is the one
    // that keeps long-lead items at the top of the owner's list.
    const d = new Date(start);
    d.setDate(d.getDate() - lead * 7);
    neededBy = d.toISOString().slice(0, 10);
  }

  return {
    fields: {
      "Item": t.getCellValue("Item name"),
      "Project": [{ id: projectId }],
      "Space": [{ id: space.id }],
      "Item Template": [{ id: t.id }],
      "Status": { name: "Not started" },
      "Mode": { name: t.getCellValue("Default mode") ? t.getCellValue("Default mode").name : "CKA presents options" },
      "Trade": t.getCellValue("Default trade") ? { name: t.getCellValue("Default trade").name } : null,
      "Lead time (weeks)": lead,
      "Needed by": neededBy,
      "Description": t.getCellValue("Description") || "",
      "Sort order": spaceOrder * 100 + (t.getCellValue("Sort order") || 0) % 100,
    },
  };
});

// createRecordsAsync takes 50 at a time.
let created = 0;
for (let i = 0; i < rows.length; i += 50) {
  const batch = await selections.createRecordsAsync(rows.slice(i, i + 50));
  created += batch.length;
}

output.set("created", created);
output.set("message", `Created ${created} selection rows for ${space.getCellValue("Space name")}.`);
