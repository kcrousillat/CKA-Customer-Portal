/**
 * Airtable automation step: "Owner email - approved", ahead of the email.
 *
 * Builds the credit block the email prints, and fills Approved on when the
 * portal did not.
 *
 * There are two ways a line reaches Approved, and they credit different people:
 *
 *   Curated line   - CKA presented options, the owner picked one and typed
 *                    their name. The Worker stamps Approved by / Approved on.
 *                    The owner approved it, so the email says so.
 *
 *   Owner-specifies - the owner typed what they want and signed the Send to
 *                    CKA panel, which stamps Submitted by / Submitted on. CKA
 *                    then sets Approved in the grid. The owner made the
 *                    selection; CKA only confirmed it is buildable and priced.
 *                    The email has to say that, in that order - it is the
 *                    owner's decision and the record should read like it.
 *
 * The first version of this printed "Approved by CKA Construction Group" on an
 * owner-specifies line, which took the owner's decision and put CKA's name on
 * it. Most of the library is owner-specifies now, so that was about to be the
 * normal case.
 *
 * Why the email reads the outputs rather than the record: an automation's
 * trigger values are a snapshot taken when it fired, so an email step reading
 * the record after this step wrote to it would still print the old values.
 */
const cfg = input.config();
const selections = base.getTable('Selections');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
const pretty = (v) => {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d.getTime())) return '';
  return MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
};

const r = await selections.selectRecordAsync(cfg.recordId, {
  fields: ['Approved by', 'Approved on', 'Submitted by', 'Submitted on'],
});

const submittedBy = r ? (r.getCellValue('Submitted by') || '') : '';
const submittedOn = r ? r.getCellValue('Submitted on') : null;
let approvedBy = r ? (r.getCellValue('Approved by') || '') : '';
let approvedOn = r ? r.getCellValue('Approved on') : null;

const fields = {};
if (!approvedOn) { approvedOn = new Date().toISOString(); fields['Approved on'] = approvedOn; }
// Only on the owner-specifies path, and only into a blank. CKA did the
// approving there, and the record - which the portal and the turnover package
// both read - should not leave it anonymous. The email leads with the owner
// regardless; this is the grid's own answer to "who approved it".
if (!approvedBy && submittedBy) {
  approvedBy = 'CKA Construction Group';
  fields['Approved by'] = approvedBy;
}
if (Object.keys(fields).length) {
  await selections.updateRecordAsync(cfg.recordId, fields);
}

let credit;
if (submittedBy) {
  credit = 'Selected by ' + submittedBy +
           (submittedOn ? ' on ' + pretty(submittedOn) : '') +
           '\nConfirmed by CKA on ' + pretty(approvedOn);
} else if (approvedBy) {
  credit = 'Approved by ' + approvedBy + ' on ' + pretty(approvedOn);
} else {
  credit = 'Approved on ' + pretty(approvedOn);
}

output.set('credit', credit);
