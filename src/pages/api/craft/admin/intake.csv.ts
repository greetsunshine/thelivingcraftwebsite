// Intake responses as CSV.
//
// One row per learner, one column per question — the shape the answers would
// have had in a spreadsheet if this had been a Google Form, which is what makes
// it useful for the comparisons the console deliberately does not try to be.
// Columns are generated FROM the question set rather than listed here, so a
// question added to lib/craft/intake.ts appears in the export without anyone
// remembering to widen this file.

import type { APIRoute } from 'astro';
import { LEADERSHIP, QUICK_CHECK, REALITY, TECHNICAL, listIntake } from '../../../../lib/craft/intake';

export const prerender = false;

import { csvCell } from '../../../../lib/admin/csv';

/**
 * Cells come from csvCell() in src/lib/admin/csv.ts — the one owner of this
 * format. See the note in leads.csv.ts; there were three copies of this rule.
 */

export const GET: APIRoute = async () => {
  const rows = await listIntake();

  const header = [
    'submitted_at',
    'updated_at',
    'name',
    'email',
    'cohort',
    'status',
    ...QUICK_CHECK.map((q) => q.id),
    ...TECHNICAL.map((q) => q.id),
    ...LEADERSHIP.map((q) => q.id),
    ...REALITY.map((q) => q.id),
  ];

  const body = [
    header.join(','),
    ...rows.map((r) =>
      [
        csvCell(r.submitted_at ?? ''),
        csvCell(r.updated_at),
        csvCell(r.name ?? ''),
        csvCell(r.email),
        csvCell(r.cohort),
        csvCell(r.submitted_at ? 'submitted' : 'in progress'),
        ...QUICK_CHECK.map((q) => csvCell(r.quick_check?.[q.id] ?? '')),
        ...TECHNICAL.map((q) => csvCell(r.technical?.[q.id] ?? '')),
        ...LEADERSHIP.map((q) => csvCell(r.leadership?.[q.id] ?? '')),
        ...REALITY.map((q) => csvCell(r.reality?.[q.id] ?? '')),
      ].join(','),
    ),
  ].join('\n');

  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(`﻿${body}`, {
    headers: {
      // BOM, so Excel reads the non-ASCII names and the ₹ sign correctly.
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="intake-${stamp}.csv"`,
      'Cache-Control': 'private, no-store',
    },
  });
};
