/**
 * Airtable automation: "Check the base"
 * Trigger: Base health - when "Run check" is ticked.
 * Input variable: rowId  ->  trigger record id
 *
 * This file is the record of what is running in Airtable. Airtable is the
 * live copy; paste changes there and keep this in step.
 *
 * Note for editing in Airtable: scripts reject a top-level `return`, which is
 * why the checks are a list walked in order rather than early exits.
 *
 * What it is for: the things that break quietly. Re-pointing one trade on
 * 13 Sep moved an entire window package under a mirrors heading and nothing
 * complained - the portal just quietly reorganised itself. Every check below
 * is a rule that was true when it was written and would be silently false if
 * somebody changed the wrong cell.
 *
 * Two tiers, on purpose. PROBLEMS are broken: something an owner would see
 * wrong, or an automation that will not work. TIDYING is unfinished: real, but
 * nothing is broken today. Only problems are counted, because a check that
 * always reports something is a check nobody reads.
 *
 * It checks structure, never judgement. It cannot tell you a colour code is
 * wrong or a heading is badly named.
 */
const cfg = input.config();
const health = base.getTable('Base health');

const problems = [];
const tidy = [];
const add = (list, heading, lines) => {
  if (lines.length) list.push(heading + '\n' + lines.map((l) => '  - ' + l).join('\n'));
};
/* Trade is a single select today and may become a link to the Trades table.
   Both shapes expose `name`, so read whichever arrives. */
const nameOf = (cell) => {
  const v = Array.isArray(cell) ? cell[0] : cell;
  return (v && v.name) || '';
};
const linkNames = (cell) => (cell || []).map((x) => x.name);
const unique = (arr) => Array.from(new Set(arr.filter(Boolean)));

// ---- read everything once ----
const sections = (await base.getTable('Sections').selectRecordsAsync({
  fields: ['Section name', 'Hidden'],
})).records;
const trades = (await base.getTable('Trades').selectRecordsAsync({
  fields: ['Trade name', 'Section', 'Hidden'],
})).records;
const templates = (await base.getTable('Item Templates').selectRecordsAsync({
  fields: ['Item name', 'Active', 'Default trade', 'Section', 'Palette category', 'Description'],
})).records;
const palettes = (await base.getTable('Palettes').selectRecordsAsync({
  fields: ['Name', 'Category', 'Active', 'Photo', 'Brand', 'Hinge'],
})).records;
const selections = (await base.getTable('Selections').selectRecordsAsync({
  fields: ['Item', 'Status', 'Section', 'Trade', 'Options'],
})).records;
const projects = (await base.getTable('Projects').selectRecordsAsync({
  fields: ['Project name', 'Portal key'],
})).records;

const liveSections = sections.filter((s) => !s.getCellValue('Hidden'));
const liveTrades = trades.filter((t) => !t.getCellValue('Hidden'));

const sectionNames = {};
for (const s of liveSections) {
  const n = (s.getCellValue('Section name') || '').trim();
  if (n) sectionNames[n] = true;
}
const tradeNames = {};
for (const t of liveTrades) {
  const n = (t.getCellValue('Trade name') || '').trim();
  if (n) tradeNames[n] = true;
}

// ---- 1. A trade with no heading dumps its items under "Other" ----
add(problems, 'Trades with no heading (their items fall under "Other"):',
  liveTrades
    .filter((t) => !(t.getCellValue('Section') || []).length)
    .map((t) => t.getCellValue('Trade name')));

// ---- 2. A heading nothing points at never appears ----
// A section earns its place either by a trade pointing at it, or by a
// selection or template overriding into it by name.
const claimed = {};
for (const t of liveTrades) for (const n of linkNames(t.getCellValue('Section'))) claimed[n] = true;
for (const r of selections) { const o = nameOf(r.getCellValue('Section')); if (o) claimed[o] = true; }
for (const t of templates) { const o = nameOf(t.getCellValue('Section')); if (o) claimed[o] = true; }

add(problems, 'Headings nothing files under (nothing will ever show here):',
  liveSections
    .map((s) => (s.getCellValue('Section name') || '').trim())
    .filter((n) => n && n !== 'Other' && !claimed[n]));

// ---- 3. An active library item with no trade ----
add(problems, 'Library items with no trade (every future job files them under "Other"):',
  templates
    .filter((t) => t.getCellValue('Active') && !t.getCellValue('Default trade'))
    .map((t) => t.getCellValue('Item name')));

// ---- 4. Overrides naming a heading that no longer exists ----
// This is the one a rename causes: the Sections table changes, the override
// dropdown does not, and the item strands under a heading of its own.
add(problems, 'Library items overriding into a heading that does not exist:',
  templates
    .filter((t) => { const o = nameOf(t.getCellValue('Section')); return o && !sectionNames[o]; })
    .map((t) => t.getCellValue('Item name') + ' -> "' + nameOf(t.getCellValue('Section')) + '"'));

add(problems, 'Selections overriding into a heading that does not exist:',
  selections
    .filter((r) => { const o = nameOf(r.getCellValue('Section')); return o && !sectionNames[o]; })
    .map((r) => r.getCellValue('Item') + ' -> "' + nameOf(r.getCellValue('Section')) + '"'));

// ---- 5. A selection whose trade has no row in Trades ----
add(problems, 'Trades used on selections with no row in Trades (they fall under "Other"):',
  unique(selections.map((r) => nameOf(r.getCellValue('Trade'))))
    .filter((n) => !tradeNames[n]));

// ---- 6. "Options presented" with nothing to present ----
add(problems, 'Selections saying "Options presented" with no options on them:',
  selections
    .filter((r) => nameOf(r.getCellValue('Status')) === 'Options presented'
                && !(r.getCellValue('Options') || []).length)
    .map((r) => r.getCellValue('Item')));

// ---- 7. A palette category the catalog cannot fill ----
const stocked = {};
for (const p of palettes) {
  if (!p.getCellValue('Active')) continue;
  const c = nameOf(p.getCellValue('Category'));
  if (c) stocked[c] = true;
}
add(tidy, 'Palette categories with no catalog rows yet ("Load catalog options" finds nothing):',
  unique(templates
    .filter((t) => t.getCellValue('Active'))
    .map((t) => nameOf(t.getCellValue('Palette category'))))
    .filter((c) => !stocked[c]));

// ---- 8. Dropdown choices that have drifted apart between tables ----
// The scripting API has no typecast, so the catalog loader cannot write a
// choice the Options table does not have. This is what took the first load
// down: Palettes had learned Sub-Zero and Cove, Options had not.
const optionChoices = (fieldName) => {
  const f = base.getTable('Options').getField(fieldName);
  const known = {};
  for (const c of (f.options && f.options.choices) || []) known[c.name] = true;
  return known;
};
const knownBrands = optionChoices('Brand');
const knownHinges = optionChoices('Hinge');

add(problems, 'Brands in the catalog that Options does not have (they would load in blank):',
  unique(palettes.map((p) => nameOf(p.getCellValue('Brand')))).filter((b) => !knownBrands[b]));
add(problems, 'Hinge values in the catalog that Options does not have:',
  unique(palettes.map((p) => nameOf(p.getCellValue('Hinge')))).filter((h) => !knownHinges[h]));

// ---- 9. A project with no portal key cannot be opened ----
add(problems, 'Projects with no Portal key (the owner link will not work):',
  projects
    .filter((p) => !(p.getCellValue('Portal key') || '').trim())
    .map((p) => p.getCellValue('Project name')));

// ---- 10 and 11. Unfinished rather than broken ----
add(tidy, 'Active catalog rows with no photo (the owner sees an empty tile):',
  palettes
    .filter((p) => p.getCellValue('Active') && !(p.getCellValue('Photo') || []).length)
    .map((p) => p.getCellValue('Name')));

add(tidy, 'Active library items with no description (the owner reads a blank card):',
  templates
    .filter((t) => t.getCellValue('Active') && !(t.getCellValue('Description') || '').trim())
    .map((t) => t.getCellValue('Item name')));

// ---- write the result ----
const parts = [];
if (problems.length) {
  parts.push('PROBLEMS - these are broken\n' + problems.join('\n\n'));
} else {
  parts.push('No problems found. Trades, headings, the library, the catalog '
           + 'and every project checked out.');
}
if (tidy.length) {
  parts.push('WORTH TIDYING - real, but nothing is broken today\n' + tidy.join('\n\n'));
}

await health.updateRecordAsync(cfg.rowId, {
  'Run check': false,
  'Problems': problems.length,
  'Findings': parts.join('\n\n\n'),
  'Last run': new Date().toISOString(),
});

output.set('problems', problems.length);
output.set('summary', parts.join('\n\n'));
