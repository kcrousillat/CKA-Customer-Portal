/**
 * Airtable automation: "Load the starter plan"
 * Trigger: Projects - when "Load starter plan" is ticked.
 * Input variable: projectId -> trigger record id
 *
 * Drops one Room Plan line in for every room type in the library, so setting
 * up a job is reading down a list of counts rather than remembering which
 * rooms exist. Everything starts at zero and Build rooms skips a zero, so a
 * line left alone costs nothing.
 *
 * Only adds. A line for a type that is already on the plan is left exactly as
 * it is, counts included, so ticking again after a new room type is added to
 * the library brings in that one line and disturbs nothing else.
 *
 * Note for editing in Airtable: scripts reject a top-level `return`, which is
 * why this is one if/else chain rather than early exits.
 */
const cfg = input.config();
const projects = base.getTable('Projects');
const typesT = base.getTable('Space Types');
const planT = base.getTable('Room Plan');

// Every job has exactly one of these, and it is not a room you would count.
const ALWAYS_ONE = ['Whole house'];

let added = 0;
let message = '';

const project = await projects.selectRecordAsync(cfg.projectId, { fields: ['Project name'] });

if (!project) {
  message = 'Project not found: ' + cfg.projectId;
} else {
  const typeQuery = await typesT.selectRecordsAsync({ fields: ['Space type', 'Sort order'] });
  const types = typeQuery.records
    .filter((t) => (t.getCellValue('Space type') || '').trim())
    .sort((a, b) => (a.getCellValue('Sort order') || 999) - (b.getCellValue('Sort order') || 999));

  const planQuery = await planT.selectRecordsAsync({ fields: ['Project', 'Space type'] });
  const mine = planQuery.records.filter((r) => {
    const p = r.getCellValue('Project') || [];
    return p.some((x) => x.id === cfg.projectId);
  });

  // A type already on this plan is left alone - counts typed earlier survive.
  const taken = {};
  for (const line of mine) {
    for (const t of line.getCellValue('Space type') || []) taken[t.id] = true;
  }

  const rows = types.filter((t) => !taken[t.id]).map((t) => {
    const name = t.getCellValue('Space type').trim();
    return {
      fields: {
        'Room name': name,
        'Project': [{ id: cfg.projectId }],
        'Space type': [{ id: t.id }],
        'How many': ALWAYS_ONE.indexOf(name) > -1 ? 1 : 0,
      },
    };
  });

  if (!rows.length) {
    message = 'Every room type in the library is already on this plan. Nothing added.';
  } else {
    // createRecordsAsync takes 50 at a time.
    for (let i = 0; i < rows.length; i += 50) {
      const batch = await planT.createRecordsAsync(rows.slice(i, i + 50));
      added += batch.length;
    }
    message = 'Added ' + added + ' room type(s) to the plan, all at zero except Whole house. '
            + 'Type the counts in How many, then tick Build rooms.';
  }
}

await projects.updateRecordAsync(cfg.projectId, {
  'Load starter plan': false,
  'Setup log': new Date().toISOString().slice(0, 16).replace('T', ' ') + '  ' + message,
});

output.set('added', added);
output.set('message', message);
