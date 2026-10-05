/**
 * Airtable automation step: "Owner email - approved", before the email.
 *
 * Fills Approved by / Approved on when they are empty, and hands the email
 * step the values to print.
 *
 * Why it is needed: those two fields are written by the portal's approve
 * button, which only exists on a curated line - the owner picks one of CKA's
 * options and the Worker stamps their name and the time. On an "Owner
 * specifies" line there is no such button. The owner types what they want,
 * hits Send to CKA, and somebody at CKA sets the status to Approved in the
 * grid. Nothing fills the fields, so the confirmation email read
 * "Approved by on" - in the one email whose job is to be the record the owner
 * would point at in a disagreement.
 *
 * Most of the library is owner-specifies now, so this was about to be the
 * normal case rather than an edge one.
 *
 * It writes the values back to the record as well as returning them, because
 * the portal's record view and the turnover package read the same two fields
 * and were equally blank. The email cannot simply read the record after the
 * write: an automation's trigger values are a snapshot taken when it fired, so
 * the email step would still print the old blanks. Hence the outputs.
 */
const cfg = input.config();
const selections = base.getTable('Selections');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
const pretty = (d) => MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();

const r = await selections.selectRecordAsync(cfg.recordId, {
  fields: ['Approved by', 'Approved on'],
});

let by = r ? (r.getCellValue('Approved by') || '') : '';
let onValue = r ? r.getCellValue('Approved on') : null;

const fields = {};
// Named rather than left blank. CKA did approve it - the owner chose it and
// CKA confirmed it is buildable and priced - so saying so is accurate, and an
// owner reading "Approved by CKA Construction Group" learns something true.
if (!by) { by = 'CKA Construction Group'; fields['Approved by'] = by; }
if (!onValue) { onValue = new Date().toISOString(); fields['Approved on'] = onValue; }
if (Object.keys(fields).length) {
  await selections.updateRecordAsync(cfg.recordId, fields);
}

output.set('approvedBy', by);
output.set('approvedOn', pretty(new Date(onValue)));
