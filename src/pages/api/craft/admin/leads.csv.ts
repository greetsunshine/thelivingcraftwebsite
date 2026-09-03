// Leads as CSV.
//
// The console is not a CRM and should not grow into one. An export means the
// day this needs to become a mail-merge, a spreadsheet, or somebody else's
// pipeline, the data walks out without a migration.

import type { APIRoute } from 'astro';
import { leads } from '../../../../lib/admin/queries';

export const prerender = false;

const COLUMNS = [
  'created_at',
  'source',
  'surface',
  'interest',
  'name',
  'email',
  'role',
  'company',
  'region',
  'country',
  'status',
  'delivered',
  'message',
  'question',
  'context',
  'admin_note',
] as const;

/**
 * Quote everything, and neutralise formula injection.
 *
 * A cell beginning =, +, - or @ is executed as a formula when the file is
 * opened in Excel or Sheets. These cells contain text a stranger typed into a
 * public form, so that is a live path from the internet to code running on the
 * machine of the person reading their leads. Prefixing with an apostrophe is
 * the standard defusal and is invisible in the sheet.
 */
const cell = (value: unknown): string => {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

export const GET: APIRoute = async ({ url }) => {
  const status = url.searchParams.get('status') ?? 'all';
  const rows = await leads({ status, limit: 5000 });

  const body = [
    COLUMNS.join(','),
    ...rows.map((row) => COLUMNS.map((c) => cell((row as unknown as Record<string, unknown>)[c])).join(',')),
  ].join('\n');

  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(`﻿${body}`, {
    headers: {
      // The BOM keeps Excel from mangling the ₹ sign and any non-ASCII name.
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="leads-${status}-${stamp}.csv"`,
      'Cache-Control': 'private, no-store',
    },
  });
};
