/**
 * Airtable automation: "Recompute needed-by dates"
 * Trigger: Projects - when "Recompute dates" is ticked.
 * Input variable: projectId -> trigger record id
 *
 * Rewrites every selection's "Needed by" on this project as the construction
 * start minus that item's lead time - the same arithmetic the build does when
 * it first creates the row.
 *
 * It exists because Needed by is stored, not calculated. The build writes it
 * once and never looks at it again, so moving a construction date leaves every
 * existing row pointing at the old one. On Hahitti that meant the long-lead
 * items read as months overdue before the owner had even been handed the link,
 * which is the portal shouting at someone about a deadline they never had.
 *
 * Only Needed by is touched. Status, the owner's answers, approvals and the
 * supersede trail are all left alone, so this is safe to run on a job that is
 * already underway and part-approved.
 *
 * Lead time is read from the selection, not from the library, deliberately. A
 * row whose lead was adjusted by hand for this job keeps that adjustment.
 */
const cfg = input.config();
const projects = base.getTable('Projects');
const selections = base.getTable('Selections');

// Same reasoning as the room build: stop short of the ~30s ceiling so the
// untick and the log still land.
const BUDGET_MS = 20000;
const startedAt = Date.now();
let log = [];

const project = await projects.selectRecordAsync(cfg.projectId, {
  fields: ['Project name', 'Construction start'],
});

if (!project) {
  log.push('Project not found: ' + cfg.projectId);
} else {
  const startValue = project.getCellValue('Construction start');
  if (!startValue) {
    log.push('No construction start on this project, so there is nothing to count back from. Set it and tick again.');
  } else {
    const start = new Date(startValue);
    const query = await selections.selectRecordsAsync({
      fields: ['Item', 'Project', 'Lead time (weeks)', 'Needed by'],
    });

    const mine = query.records.filter((r) =>
      (r.getCellValue('Project') || []).some((p) => p.id === cfg.projectId)
    );

    const updates = [];
    for (const r of mine) {
      const lead = r.getCellValue('Lead time (weeks)') || 0;
      const d = new Date(start.getTime());
      d.setDate(d.getDate() - lead * 7);
      const wanted = d.toISOString().slice(0, 10);
      // Only write the rows that actually move. A no-op update still costs a
      // call against the time budget and still shows as a change in history.
      if (r.getCellValue('Needed by') !== wanted) {
        updates.push({ id: r.id, fields: { 'Needed by': wanted } });
      }
    }

    let done = 0;
    let more = false;
    for (let i = 0; i < updates.length; i += 50) {
      if (Date.now() - startedAt > BUDGET_MS) { more = true; break; }
      const batch = updates.slice(i, i + 50);
      await selections.updateRecordsAsync(batch);
      done += batch.length;
    }

    log.push(
      'Construction start ' + startValue.slice(0, 10) + '. ' +
      mine.length + ' selection(s) on this job, ' + done + ' date(s) changed' +
      (updates.length === 0 ? ' - every date already matched.' : '.')
    );
    if (more) {
      log.push('Stopped early to stay inside the time limit, ' +
        (updates.length - done) + ' still to go. Tick Recompute dates again.');
    }
  }
}

const message = log.join(' ');
await projects.updateRecordAsync(cfg.projectId, {
  'Recompute dates': false,
  'Setup log': new Date().toISOString().slice(0, 16).replace('T', ' ') + '  ' + message,
});

output.set('message', message);
