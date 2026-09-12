/**
 * Airtable automation: "Expand space into selections"
 * Trigger: Spaces — when Space Type and Project are both filled in.
 * Input variable: spaceId  ->  trigger record id
 *
 * This file is the record of what is running in Airtable. Airtable is the
 * live copy; paste changes there and keep this in step.
 *
 * Note for editing in Airtable: scripts reject a top-level `return`, which is
 * why this is one if/else chain rather than early exits.
 */
const cfg = input.config();
const spaces = base.getTable('Spaces');
const templates = base.getTable('Item Templates');
const selections = base.getTable('Selections');
const projects = base.getTable('Projects');

let created = 0;
let message = '';

/**
 * Trade is a single-select today and may become a link to the Trades table.
 * Which one decides the shape this script has to WRITE, so it asks the target
 * field rather than assuming. Both shapes expose the same `name` — a select
 * option's label, or a linked row's primary field — so the name is the bridge
 * between them and the lookup below only runs when it is actually needed.
 */
const tradeIsLink = selections.getField('Trade').type === 'multipleRecordLinks';
const tradeIdByName = {};
if (tradeIsLink) {
  const tradeRows = await base.getTable('Trades').selectRecordsAsync({ fields: ['Trade name'] });
  for (const r of tradeRows.records) {
    const n = (r.getCellValue('Trade name') || '').trim();
    if (n) tradeIdByName[n] = r.id;
  }
}

const unmatchedTrades = new Set();

function tradeValue(cell) {
  const first = Array.isArray(cell) ? cell[0] : cell;
  if (!first || !first.name) return null;
  if (!tradeIsLink) return { name: first.name };
  const id = tradeIdByName[first.name.trim()];
  if (!id) {
    // No row in Trades by that name. Leave it empty rather than guess: the
    // selection shows under "Other" and the message below says which.
    unmatchedTrades.add(first.name);
    return null;
  }
  return [{ id }];
}

const space = await spaces.selectRecordAsync(cfg.spaceId, {
  fields: ['Space name', 'Space Type', 'Project', 'Sort order', 'fld08DtEGCJNfw7Pq'],
});

const spaceType = space ? space.getCellValue('Space Type') : null;
const projectLink = space ? space.getCellValue('Project') : null;
const existing = space ? (space.getCellValue('fld08DtEGCJNfw7Pq') || []) : [];

if (!space) {
  message = 'Space not found: ' + cfg.spaceId;
} else if (existing.length) {
  // Already expanded. Editing a space must never duplicate its rows.
  message = space.getCellValue('Space name') + ' already has ' + existing.length + ' selections. Nothing changed.';
} else if (!spaceType || !spaceType.length) {
  message = 'No Space Type set on "' + space.getCellValue('Space name') + '". Set one and the rows will generate.';
} else if (!projectLink || !projectLink.length) {
  message = 'No Project linked on "' + space.getCellValue('Space name') + '". Link it to a job first.';
} else {
  const typeId = spaceType[0].id;
  const projectId = projectLink[0].id;

  // Construction start anchors every needed-by date.
  const project = await projects.selectRecordAsync(projectId, { fields: ['Construction start'] });
  const startValue = project ? project.getCellValue('Construction start') : null;
  const start = startValue ? new Date(startValue) : null;

  const query = await templates.selectRecordsAsync({
    fields: ['Item name', 'Space Type', 'Default trade', 'Default lead time (weeks)',
             'Default mode', 'Description', 'Sort order', 'Active',
             'Palette category', 'Section'],
  });

  const applicable = query.records.filter((t) => {
    if (!t.getCellValue('Active')) return false;
    const types = t.getCellValue('Space Type') || [];
    return types.some((x) => x.id === typeId);
  });

  if (!applicable.length) {
    message = 'No active Item Templates for that space type yet. Add them and they will apply to every future job.';
  } else {
    const spaceOrder = space.getCellValue('Sort order') || 0;

    const rows = applicable.map((t) => {
      const lead = t.getCellValue('Default lead time (weeks)') || 0;
      let neededBy = null;
      if (start) {
        // The order has to be placed `lead` weeks before the trade is on site.
        const d = new Date(start.getTime());
        d.setDate(d.getDate() - lead * 7);
        neededBy = d.toISOString().slice(0, 10);
      }
      const mode = t.getCellValue('Default mode');
      const palette = t.getCellValue('Palette category');
      const section = t.getCellValue('Section');

      return {
        fields: {
          'Item': t.getCellValue('Item name'),
          'Project': [{ id: projectId }],
          'Space': [{ id: space.id }],
          'Item Template': [{ id: t.id }],
          'Status': { name: 'Not started' },
          'Mode': { name: mode ? mode.name : 'CKA presents options' },
          'Trade': tradeValue(t.getCellValue('Default trade')),
          'Palette category': palette ? { name: palette.name } : null,
          // Left empty, the portal files it under its trade's section.
          'Section': section ? { name: section.name } : null,
          'Lead time (weeks)': lead,
          'Needed by': neededBy,
          'Description': t.getCellValue('Description') || '',
          'Sort order': spaceOrder * 100 + ((t.getCellValue('Sort order') || 0) % 100),
        },
      };
    });

    // createRecordsAsync takes 50 at a time.
    for (let i = 0; i < rows.length; i += 50) {
      const batch = await selections.createRecordsAsync(rows.slice(i, i + 50));
      created += batch.length;
    }
    message = 'Created ' + created + ' selection rows for ' + space.getCellValue('Space name') + '.';
    if (unmatchedTrades.size) {
      message += ' Left the trade empty on some rows: no row in Trades named ' +
                 Array.from(unmatchedTrades).join(', ') + '. Add it there and set those rows.';
    }
  }
}

output.set('created', created);
output.set('message', message);
