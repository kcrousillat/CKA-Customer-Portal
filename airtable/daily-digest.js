/**
 * Airtable automation: "Daily selections digest"
 * Trigger: cron, 06:00 America/New_York.
 *
 * One email per job per day, instead of one per status change.
 *
 * The per-row emails were right in principle and wrong at scale. An owner who
 * sits down and does fifteen selections in an evening got fifteen emails, then
 * fifteen more as CKA worked through them - and CKA's own inbox got the same
 * treatment. Kevin's team called it: things get lost in the noise, and an
 * inbox nobody reads is worse than no email at all. Hahitti alone is 283
 * selections, which was heading for roughly 850 owner emails over the job.
 *
 * So: at 6am, one email to the owners listing everything that moved on their
 * job in the last 24 hours, and one to that job's CKA list. A job where
 * nothing moved gets nothing - a digest that arrives daily saying "no changes"
 * trains people to delete it unread, and then they delete the one that matters.
 *
 * This script only BUILDS the emails. The loop after it sends them, because a
 * script cannot send through Outlook. Each element it outputs is one email,
 * ready to go.
 *
 * The 24-hour window is deliberately a little wider than the gap between runs,
 * so a row that moved at 05:59 is not lost between two digests. A row that
 * moves twice in one window is reported once, at whatever status it ended on,
 * which is what someone reading it actually wants to know.
 */
const projects = base.getTable('Projects');
const selections = base.getTable('Selections');

const WINDOW_HOURS = 25;
const cutoff = Date.now() - WINDOW_HOURS * 3600 * 1000;

// Only the three that mean something happened. A row going to On hold or
// Not applicable is housekeeping, and the owner did not ask for it.
const REPORT = ['Owner selected', 'Approved', 'Released for order'];

const OWNER_HEADING = {
  'Owner selected': 'You sent these to us',
  'Approved': 'We confirmed these',
  'Released for order': 'These are now on order',
};
const CKA_HEADING = {
  'Owner selected': 'Waiting on you to review',
  'Approved': 'Approved - ready to release for order',
  'Released for order': 'Released for order',
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
const pretty = (v) => {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d.getTime())) return '';
  return MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
};

const jobs = {};
for (const p of (await projects.selectRecordsAsync({
  fields: ['Project name', 'Owner emails', 'Notify CKA', 'Portal link'],
})).records) {
  jobs[p.id] = {
    name: p.getCellValue('Project name') || 'Your job',
    owner: String(p.getCellValue('Owner emails') || '').trim(),
    cka: String(p.getCellValue('Notify CKA') || '').trim(),
    link: String(p.getCellValue('Portal link') || '').trim(),
    rows: [],
  };
}

for (const r of (await selections.selectRecordsAsync({
  fields: ['Item', 'Item and room', 'Status', 'Status changed', 'Project',
           'Owner supplier', 'Owner model', 'Needed by', 'Submitted by'],
})).records) {
  const status = r.getCellValue('Status');
  if (!status || REPORT.indexOf(status.name) === -1) continue;

  const changed = r.getCellValue('Status changed');
  if (!changed || new Date(changed).getTime() < cutoff) continue;

  const link = r.getCellValue('Project') || [];
  const job = link.length ? jobs[link[0].id] : null;
  if (!job) continue;

  job.rows.push({
    status: status.name,
    item: r.getCellValue('Item and room') || r.getCellValue('Item') || 'A selection',
    what: [r.getCellValue('Owner supplier'), r.getCellValue('Owner model')]
            .filter(Boolean).join(' - '),
    by: r.getCellValue('Submitted by') || '',
    needed: pretty(r.getCellValue('Needed by')),
  });
}

// One block per status, in the order the process runs, so the email reads as a
// story rather than an unsorted list.
const block = (rows, headings, showWho) => {
  let out = '';
  for (const status of REPORT) {
    const mine = rows.filter((x) => x.status === status);
    if (!mine.length) continue;
    out += '\n' + headings[status] + ' (' + mine.length + ')\n';
    for (const x of mine) {
      out += '  - ' + x.item + (x.what ? ': ' + x.what : '');
      if (showWho && x.by) out += ' [' + x.by + ']';
      if (status === 'Owner selected' && x.needed) out += ' - due ' + x.needed;
      out += '\n';
    }
  }
  return out;
};

const emails = [];
for (const id of Object.keys(jobs)) {
  const job = jobs[id];
  if (!job.rows.length) continue;
  const n = job.rows.length;
  const count = n + ' selection' + (n === 1 ? '' : 's');

  if (job.owner) {
    emails.push({
      to: job.owner,
      subject: job.name + ' - Your selections update - ' + count,
      body: 'Here is where your selections got to yesterday.\n\nJob: ' + job.name + '\n' +
            block(job.rows, OWNER_HEADING, false) +
            '\nNothing here needs a reply. If any of it is not what you meant, ' +
            'use Request a change on the page, or reply to this email - anything ' +
            'not yet on order costs nothing to change.\n\n' +
            'Your selections page:\n' + job.link + '\n\n' +
            'CKA Construction Group\nselections@ckaconstruction.com',
    });
  }

  if (job.cka) {
    emails.push({
      to: job.cka,
      subject: job.name + ' - Selections update - ' + count,
      body: 'What moved on this job in the last day.\n\nJob: ' + job.name + '\n' +
            block(job.rows, CKA_HEADING, true) +
            '\nOpen the base to action anything waiting on CKA.\n',
    });
  }
}

output.set('emails', emails);
output.set('summary', emails.length + ' email(s) to send.');
