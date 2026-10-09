/**
 * Airtable automation: "Expand space into selections"
 * Trigger: Spaces - when Space Type and Project are both filled in.
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
 * The cell itself says which: a select reads back as one object, a link as an
 * array of them, and a linked row's id is already the Trades record id.
 *
 * This assumes both Trade fields are converted together - Selections.Trade
 * and Item Templates.Default trade.
 */
const tradeValue = (cell) => {
  if (Array.isArray(cell)) return cell.length ? [{ id: cell[0].id }] : null;
  return cell ? { name: cell.name } : null;
};

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

  // The construction start anchors every due date: a selection is due its
  // group's allowance of days after the job breaks ground. Lead time rides
  // along on the row as information only - it sets no date.
  const project = await projects.selectRecordAsync(projectId, {
    fields: ['Construction start'],
  });
  const startValue = project ? project.getCellValue('Construction start') : null;
  const start = startValue ? new Date(startValue) : null;

  const groupsT = base.getTable('Selection groups');
  const daysByGroupId = {};
  for (const g of (await groupsT.selectRecordsAsync({
    fields: ['Group', 'Days from construction start'],
  })).records) {
    daysByGroupId[g.id] = g.getCellValue('Days from construction start');
  }
  const dueFor = (groupLink) => {
    if (!start) return null;
    const link = groupLink || [];
    if (!link.length) return null;
    const days = daysByGroupId[link[0].id];
    if (days === null || days === undefined) return null;
    const d = new Date(start.getTime());
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };

  const query = await templates.selectRecordsAsync({
    fields: ['Item name', 'Space Type', 'Default trade', 'Default lead time (weeks)',
             'Default mode', 'Description', 'Sort order', 'Active', 'Optional',
             'Palette category', 'Section', 'Selection group',
             'Default catalog brands', 'Default catalog lines'],
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
      const group = t.getCellValue('Selection group') || [];
      const neededBy = dueFor(group);
      const mode = t.getCellValue('Default mode');
      const trade = t.getCellValue('Default trade');
      const palette = t.getCellValue('Palette category');
      // Which slice of the catalog this item offers. Carried onto the row so
      // "pool finish means Florida Stucco's Florida Gem line" is set once in
      // the library instead of being rebuilt on every job.
      const catalogBrands = (t.getCellValue('Default catalog brands') || []).map((x) => ({ name: x.name }));
      const catalogLines = (t.getCellValue('Default catalog lines') || []).map((x) => ({ name: x.name }));
      const section = t.getCellValue('Section');

      return {
        fields: {
          'Item': t.getCellValue('Item name'),
          'Project': [{ id: projectId }],
          'Space': [{ id: space.id }],
          'Item Template': [{ id: t.id }],
          // An Optional item still generates, so nobody has to remember it
          // exists, but it arrives hidden. Someone sets it to Not started
          // on the jobs that have one. That is one click to add a prep sink,
          // against having to notice a missing row on every other job.
          'Status': { name: t.getCellValue('Optional') ? 'Not applicable' : 'Not started' },
          'Mode': { name: mode ? mode.name : 'CKA presents options' },
          'Trade': tradeValue(trade),
          'Palette category': palette ? { name: palette.name } : null,
          'Catalog brands': catalogBrands.length ? catalogBrands : null,
          'Catalog lines': catalogLines.length ? catalogLines : null,
          // Left empty, the portal files it under its trade's section.
          'Section': section ? { name: section.name } : null,
          'Lead time (weeks)': lead,
          'Selection group': group.length ? [{ id: group[0].id }] : null,
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
  }
}

output.set('created', created);
output.set('message', message);
