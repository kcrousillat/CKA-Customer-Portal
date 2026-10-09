/**
 * Airtable automation: "Recompute needed-by dates"
 * Trigger: Projects - when "Recompute dates" is ticked.
 * Input variable: projectId -> trigger record id
 *
 * Rewrites every selection's "Needed by" on this project as
 *
 *     Construction start  +  the selection group's "Days from construction start"
 *
 * which is how the owner selections sheet has always worked: group 1 is due 30
 * days after the job breaks ground, group 2 at 60, and so on - the owner has the
 * first months of the build to make the decisions, in rounds. The original
 * version counted BACK from the construction start by each item's lead time,
 * which gave an owner 283 private deadlines instead of five dates to work to,
 * and made every long-lead item read as overdue the moment the start moved.
 *
 * It exists because Needed by is stored, not calculated. Nothing recomputes
 * itself. That is deliberate - a job part way through should not have its dates
 * shift under the owner because someone edited the library - but it means two
 * things only reach a live job when this is ticked:
 *
 *   - a changed construction start
 *   - a changed allowance on a Selection group (30 days to 20, say)
 *
 * Only Needed by is touched. Status, the owner's answers, approvals and the
 * supersede trail are left alone, so this is safe on a job already underway.
 *
 * The group and the lead time are read from the selection, not the library, so
 * a row moved to another group by hand for this job keeps that move.
 *
 * One exception, and only into a blank: a selection with no group at all falls
 * back to its library item's group and has it written onto the row. That is not
 * the library backfilling a built room - it never overwrites a group someone
 * set - it is how rows created before Selection group existed get one without
 * anybody editing 283 cells by hand. After the first tick there is nothing left
 * to heal, and a new library item added later heals itself the same way.
 *
 * Lead time no longer sets anything, and since October 2026 the owner never
 * sees it: one number cannot speak for a whole line item, so it is CKA's
 * planning figure and stays off the portal. There is no collision check
 * against it any more either: with
 * every date now falling after the construction start, a check for dates that
 * land after the construction start would fire on all 283 rows and mean
 * nothing. Catching a decision that arrives too late for its trade needs the
 * trade's own schedule, which this base does not hold.
 */
const cfg = input.config();
const projects = base.getTable('Projects');
const selections = base.getTable('Selections');
const groupsT = base.getTable('Selection groups');
const templates = base.getTable('Item Templates');

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
    log.push('No construction start on this project, so there is nothing to count forward from. Set it and tick again.');
  } else {
    const start = new Date(startValue);

    const daysByGroupId = {};
    for (const g of (await groupsT.selectRecordsAsync({
      fields: ['Group', 'Days from construction start'],
    })).records) {
      daysByGroupId[g.id] = g.getCellValue('Days from construction start');
    }

    const groupByTemplateId = {};
    for (const t of (await templates.selectRecordsAsync({
      fields: ['Item name', 'Selection group'],
    })).records) {
      const link = t.getCellValue('Selection group') || [];
      if (link.length) groupByTemplateId[t.id] = link[0].id;
    }

    const query = await selections.selectRecordsAsync({
      fields: ['Item', 'Project', 'Item Template', 'Selection group', 'Needed by'],
    });

    const mine = query.records.filter((r) =>
      (r.getCellValue('Project') || []).some((p) => p.id === cfg.projectId)
    );

    const updates = [];
    let ungrouped = 0;
    let healed = 0;

    for (const r of mine) {
      let link = r.getCellValue('Selection group') || [];
      let healedHere = false;
      if (!link.length) {
        const tmpl = r.getCellValue('Item Template') || [];
        const fromLibrary = tmpl.length ? groupByTemplateId[tmpl[0].id] : null;
        if (fromLibrary) { link = [{ id: fromLibrary }]; healedHere = true; healed++; }
      }
      if (!link.length || daysByGroupId[link[0].id] === null || daysByGroupId[link[0].id] === undefined) {
        // No group means no date. Better a blank cell than a date invented
        // here - a blank is visibly missing, a wrong date is not.
        ungrouped++;
        if (r.getCellValue('Needed by') !== null) {
          updates.push({ id: r.id, fields: { 'Needed by': null } });
        }
        continue;
      }

      const days = daysByGroupId[link[0].id];
      const d = new Date(start.getTime());
      d.setDate(d.getDate() + days);
      const wanted = d.toISOString().slice(0, 10);

      // Only write the rows that actually move. A no-op update still costs a
      // call against the time budget and still shows as a change in history.
      const fields = {};
      if (r.getCellValue('Needed by') !== wanted) fields['Needed by'] = wanted;
      if (healedHere) fields['Selection group'] = [{ id: link[0].id }];
      if (Object.keys(fields).length) updates.push({ id: r.id, fields });
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
      'Construction start ' + String(startValue).slice(0, 10) + '. ' +
      mine.length + ' selection(s) on this job, ' + done + ' date(s) changed' +
      (updates.length === 0 ? ' - every date already matched.' : '.')
    );
    if (healed) {
      log.push(healed + ' selection(s) had no group and took the one on their library item.');
    }
    if (ungrouped) {
      log.push(ungrouped + ' selection(s) have no selection group, so they have no due date. '
        + 'Set a group on the library item and rebuild, or set it on the row itself.');
    }
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
