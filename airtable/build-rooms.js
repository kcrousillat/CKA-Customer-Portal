/**
 * Airtable automation: "Build rooms from the Room Plan"
 * Trigger: Projects - when "Build rooms" is ticked.
 * Input variable: projectId -> trigger record id
 *
 * Reads the project's Room Plan lines and creates any rooms that are missing,
 * each with its selections from the Item Templates library.
 *
 * Only ever adds. A line asking for 3 bedrooms when 2 exist creates the third.
 * Nothing is renamed, nothing is deleted, so the same plan is re-run whenever
 * a client adds a room mid-job.
 *
 * Six rooms per run, because an automation script is given about thirty
 * seconds and a room can carry eighteen selections. It unticks the box either
 * way and says in the log whether there is more to do.
 */
const cfg = input.config();
const projects = base.getTable('Projects');
const spacesT = base.getTable('Spaces');
const planT = base.getTable('Room Plan');
const templates = base.getTable('Item Templates');
const selections = base.getTable('Selections');

const ROOMS_PER_RUN = 6;
let log = [];
let roomsMade = 0;
let rowsMade = 0;

function tradeValue(cell) {
  if (Array.isArray(cell)) return cell.length ? [{ id: cell[0].id }] : null;
  return cell ? { name: cell.name } : null;
}

const project = await projects.selectRecordAsync(cfg.projectId, {
  fields: ['Project name', 'Construction start'],
});

if (!project) {
  log.push('Project not found: ' + cfg.projectId);
} else {
  const startValue = project.getCellValue('Construction start');
  const start = startValue ? new Date(startValue) : null;

  const planQuery = await planT.selectRecordsAsync({
    fields: ['Room name', 'Project', 'Space type', 'How many', 'Rooms built'],
  });
  const lines = planQuery.records.filter((r) => {
    const p = r.getCellValue('Project') || [];
    return p.some((x) => x.id === cfg.projectId);
  });

  const spaceQuery = await spacesT.selectRecordsAsync({
    fields: ['Space name', 'Space Type', 'Project', 'Sort order'],
  });
  const mine = spaceQuery.records.filter((r) => {
    const p = r.getCellValue('Project') || [];
    return p.some((x) => x.id === cfg.projectId);
  });

  let nextSort = 0;
  for (const s of mine) {
    const n = s.getCellValue('Sort order') || 0;
    if (n > nextSort) nextSort = n;
  }

  const templateQuery = await templates.selectRecordsAsync({
    fields: ['Item name', 'Space Type', 'Default trade', 'Default lead time (weeks)',
             'Default mode', 'Description', 'Sort order', 'Active',
             'Palette category', 'Section'],
  });

  if (!lines.length) {
    log.push('No Room Plan lines for this project. Add a line per kind of room, then tick again.');
  }

  let budget = ROOMS_PER_RUN;
  let more = false;

  for (const line of lines) {
    const typeLink = line.getCellValue('Space type') || [];
    const wanted = line.getCellValue('How many') || 0;
    const baseName = (line.getCellValue('Room name') || '').trim();

    if (!typeLink.length) { log.push('Skipped a line with no Space type set.'); continue; }
    if (!baseName) { log.push('Skipped a line with no Room name set.'); continue; }
    if (wanted < 1) continue;

    const typeId = typeLink[0].id;
    const already = mine.filter((s) => {
      const t = s.getCellValue('Space Type') || [];
      return t.some((x) => x.id === typeId);
    }).length;

    if (already >= wanted) continue;

    const applicable = templateQuery.records.filter((t) => {
      if (!t.getCellValue('Active')) return false;
      const types = t.getCellValue('Space Type') || [];
      return types.some((x) => x.id === typeId);
    });

    const builtHere = [];

    for (let n = already + 1; n <= wanted; n++) {
      if (budget <= 0) { more = true; break; }
      budget--;

      nextSort++;
      const roomName = wanted === 1 ? baseName : baseName + ' ' + n;
      const spaceId = await spacesT.createRecordAsync({
        'Space name': roomName,
        'Space Type': [{ id: typeId }],
        'Project': [{ id: cfg.projectId }],
        'Sort order': nextSort,
      });
      roomsMade++;
      builtHere.push({ id: spaceId });

      const spaceOrder = nextSort;
      const rows = applicable.map((t) => {
        const lead = t.getCellValue('Default lead time (weeks)') || 0;
        let neededBy = null;
        if (start) {
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
            'Project': [{ id: cfg.projectId }],
            'Space': [{ id: spaceId }],
            'Item Template': [{ id: t.id }],
            'Status': { name: 'Not started' },
            'Mode': { name: mode ? mode.name : 'CKA presents options' },
            'Trade': tradeValue(t.getCellValue('Default trade')),
            'Palette category': palette ? { name: palette.name } : null,
            'Section': section ? { name: section.name } : null,
            'Lead time (weeks)': lead,
            'Needed by': neededBy,
            'Description': t.getCellValue('Description') || '',
            'Sort order': spaceOrder * 100 + ((t.getCellValue('Sort order') || 0) % 100),
          },
        };
      });

      for (let i = 0; i < rows.length; i += 50) {
        const batch = await selections.createRecordsAsync(rows.slice(i, i + 50));
        rowsMade += batch.length;
      }
      if (!rows.length) {
        log.push(roomName + ' was created but the library has no active items for that room type yet.');
      }
    }

    if (builtHere.length) {
      const prior = (line.getCellValue('Rooms built') || []).map((r) => ({ id: r.id }));
      await planT.updateRecordAsync(line.id, { 'Rooms built': prior.concat(builtHere) });
    }
    if (more) break;
  }

  if (roomsMade) {
    log.unshift('Built ' + roomsMade + ' room(s) and ' + rowsMade + ' selection(s).');
  } else if (lines.length) {
    log.unshift('Nothing to build - every room on the plan already exists.');
  }
  if (more) {
    log.push('Stopped at ' + ROOMS_PER_RUN + ' rooms to stay inside the time limit. Tick Build rooms again for the rest.');
  }
}

const message = log.join(' ');
await projects.updateRecordAsync(cfg.projectId, {
  'Build rooms': false,
  'Setup log': new Date().toISOString().slice(0, 16).replace('T', ' ') + '  ' + message,
});

output.set('message', message);
