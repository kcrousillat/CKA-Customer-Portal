/**
 * Airtable automation: "Load catalog options into a selection"
 * Trigger: Selections — when "Load catalog options" is ticked.
 * Input variable: selectionId  ->  trigger record id
 *
 * This file is the record of what is running in Airtable. Airtable is the
 * live copy; paste changes there and keep this in step.
 *
 * Note for editing in Airtable: scripts reject a top-level `return`, which is
 * why this is one if/else chain rather than early exits.
 *
 * What it does: reads the selection's Palette category (and Catalog brands, if
 * any are named), finds the matching active rows in Palettes, and creates one
 * Option per row. Ticking it twice adds nothing twice — a catalog row already
 * on the selection by name is skipped. Then it unticks the box and writes what
 * it did into Internal notes.
 */
const cfg = input.config();
const selections = base.getTable('Selections');
const palettes = base.getTable('Palettes');
const options = base.getTable('Options');

let added = 0;
let message = '';

const sel = await selections.selectRecordAsync(cfg.selectionId, {
  fields: ['Item', 'Palette category', 'Catalog brands', 'Options', 'Internal notes'],
});

const category = sel ? sel.getCellValue('Palette category') : null;
const brandCell = sel ? (sel.getCellValue('Catalog brands') || []) : [];
const existingLinks = sel ? (sel.getCellValue('Options') || []) : [];

if (!sel) {
  message = 'Selection not found: ' + cfg.selectionId;
} else if (!category) {
  message = 'No Palette category on this selection, so there is no catalog list to load. ' +
            'Set one on the Item Template so every future job inherits it.';
} else {
  // Only the brands named on the selection, or all of them when none are. An
  // appliance package mixes brands, so "all" is usually what you want.
  const wantBrands = brandCell.map((b) => b.name);

  /**
   * Brand and Hinge are single-selects in both tables, and the scripting API
   * has no typecast: writing a choice the target field does not have throws,
   * and takes the whole load down with it. That is exactly what happened the
   * first time this ran - Palettes had learned Sub-Zero, Wolf, Sharp and Cove
   * while Options still only knew PGT and ES Windows.
   *
   * So ask the field what it accepts. An unknown choice is left empty and
   * named in the log, which costs one cell rather than the whole run.
   */
  const choicesOf = (table, fieldName) => {
    const f = table.getField(fieldName);
    const known = {};
    for (const c of (f.options && f.options.choices) || []) known[c.name] = true;
    return known;
  };
  const brandChoices = choicesOf(options, 'Brand');
  const hingeChoices = choicesOf(options, 'Hinge');
  const unknownChoices = new Set();

  const pick = (cell, known, label) => {
    if (!cell || !cell.name) return null;
    if (known[cell.name]) return { name: cell.name };
    unknownChoices.add(label + ' "' + cell.name + '"');
    return null;
  };

  // 'Internal note' is deliberately NOT read. It is the one field on a catalog
  // row that must never reach a job: it holds which bid a model came from and
  // which client's house it was first specified for. Note is the owner-facing
  // one, and it is the only one copied onto the option.
  const catalog = await palettes.selectRecordsAsync({
    fields: ['Name', 'Brand', 'Category', 'Supplier', 'Model', 'Finish', 'Code',
             'Photo', 'Note', 'Product link', 'Swatch color', 'Sort order',
             'Active', 'Finish options', 'MSRP', 'Hinge', 'Rough-in notes'],
  });

  const matching = catalog.records.filter((p) => {
    if (!p.getCellValue('Active')) return false;
    const cat = p.getCellValue('Category');
    if (!cat || cat.name !== category.name) return false;
    if (!wantBrands.length) return true;
    const brand = p.getCellValue('Brand');
    return brand && wantBrands.indexOf(brand.name) !== -1;
  });

  // Already-loaded rows are matched by name. That is what a person sees, and
  // it survives the catalog row being edited afterwards.
  const haveNames = {};
  for (const link of existingLinks) haveNames[(link.name || '').trim()] = true;

  const fresh = matching.filter((p) => !haveNames[(p.getCellValue('Name') || '').trim()]);

  if (!matching.length) {
    message = 'Nothing in the catalog matches "' + category.name + '"' +
              (wantBrands.length ? ' for ' + wantBrands.join(', ') : '') +
              ' yet. Add rows to Palettes and tick again.';
  } else if (!fresh.length) {
    message = 'All ' + matching.length + ' catalog row(s) for "' + category.name +
              '" are already on this selection. Nothing added.';
  } else {
    const rows = fresh.map((p, i) => {
      const brand = p.getCellValue('Brand');
      const hinge = p.getCellValue('Hinge');
      const photo = p.getCellValue('Photo') || [];
      const msrp = p.getCellValue('MSRP');

      return {
        fields: {
          'Option name': p.getCellValue('Name') || 'Option',
          'Selection': [{ id: sel.id }],
          'Brand': pick(brand, brandChoices, 'Brand'),
          'Supplier': p.getCellValue('Supplier') || '',
          'Model': p.getCellValue('Model') || '',
          'Finish': p.getCellValue('Finish') || '',
          'Finish options': p.getCellValue('Finish options') || '',
          // The hinge is baked into the model number on most undercounter and
          // column units, so it travels with the product rather than being a
          // separate question. Carrying it here is what puts it in front of
          // the owner before it is ordered.
          'Hinge': pick(hinge, hingeChoices, 'Hinge'),
          'Color code': p.getCellValue('Code') || '',
          'Note': p.getCellValue('Note') || '',
          'Product link': p.getCellValue('Product link') || '',
          'Swatch color': p.getCellValue('Swatch color') || '',
          // Stored whether or not the portal is publishing it today.
          'MSRP': typeof msrp === 'number' ? msrp : null,
          // Airtable copies the file on ingest, so the option keeps its chip
          // even if the catalog row is later changed.
          'Photo': photo.map((a) => ({ url: a.url, filename: a.filename })),
          'Sort order': p.getCellValue('Sort order') || i + 1,
        },
      };
    });

    for (let i = 0; i < rows.length; i += 50) {
      const batch = await options.createRecordsAsync(rows.slice(i, i + 50));
      added += batch.length;
    }

    message = 'Loaded ' + added + ' option(s) into ' + (sel.getCellValue('Item') || 'this selection') +
              ' from the "' + category.name + '" catalog' +
              (wantBrands.length ? ', limited to ' + wantBrands.join(', ') : '') +
              '. Delete down to the two or three you are recommending.';

    // Rough-in notes are for the MEP rough and the cabinet shop, never the
    // owner, so they land in Internal notes rather than on the option.
    const roughs = fresh
      .map((p) => {
        const r = (p.getCellValue('Rough-in notes') || '').trim();
        return r ? '- ' + (p.getCellValue('Name') || 'Option') + ': ' + r : '';
      })
      .filter(Boolean);

    const hinged = fresh
      .map((p) => {
        const h = p.getCellValue('Hinge');
        return h ? '- ' + (p.getCellValue('Name') || 'Option') + ': hinged ' + h.name.toLowerCase() : '';
      })
      .filter(Boolean);

    if (hinged.length) {
      message += '\n\nHinge, which is fixed at order on most of these:\n' + hinged.join('\n');
    }
    if (roughs.length) {
      message += '\n\nRough-in:\n' + roughs.join('\n');
    }
    if (unknownChoices.size) {
      message += '\n\nLeft empty because the Options table has no such choice yet: ' +
                 Array.from(unknownChoices).join(', ') +
                 '. Add it to that field in Options and tick again.';
    }
  }

  const previous = sel.getCellValue('Internal notes') || '';
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
  await selections.updateRecordAsync(sel.id, {
    'Load catalog options': false,
    'Internal notes': (previous ? previous + '\n\n' : '') + stamp + '  ' + message,
  });
}

output.set('added', added);
output.set('message', message);
