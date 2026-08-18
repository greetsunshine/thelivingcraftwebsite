// Intake responses as CSV.
//
// One row per learner, one column per question — the shape the answers would
// have had in a spreadsheet if this had been a Google Form, which is what makes
// it useful for the comparisons the console deliberately does not try to be.
// Columns are generated FROM the question set rather than listed here, so a
// question added to lib/craft/intake.ts appears in the export without anyone
// remembering to widen this file.

import type { APIRoute } from 'astro';
import { LEADERSHIP, QUICK_CHECK, REALITY, TECHNICAL, listIntake } from '../../../lib/craft/intake';

export const prerender = false;

/**
 * Quote everything, and neutralise formula injection — same reasoning as the
 * leads export. These cells are prose typed by a person and opened in Excel or
 * Sheets, and a cell starting =, +, - or @ is executed there as a formula.
 */
const cell = (value: unknown): string => {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

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
        cell(r.submitted_at ?? ''),
        cell(r.updated_at),
        cell(r.name ?? ''),
        cell(r.email),
        cell(r.cohort),
        cell(r.submitted_at ? 'submitted' : 'in progress'),
        ...QUICK_CHECK.map((q) => cell(r.quick_check?.[q.id] ?? '')),
        ...TECHNICAL.map((q) => cell(r.technical?.[q.id] ?? '')),
        ...LEADERSHIP.map((q) => cell(r.leadership?.[q.id] ?? '')),
        ...REALITY.map((q) => cell(r.reality?.[q.id] ?? '')),
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
