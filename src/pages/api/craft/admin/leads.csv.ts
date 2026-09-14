// Leads as CSV.
//
// The console is not a CRM and should not grow into one. An export means the
// day this needs to become a mail-merge, a spreadsheet, or somebody else's
// pipeline, the data walks out without a migration.

import type { APIRoute } from 'astro';
import { leads } from '../../../../lib/admin/queries';

export const prerender = false;

import { csvCell } from '../../../../lib/admin/csv';

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
 * Cells come from csvCell() in src/lib/admin/csv.ts, which is the ONE owner
 * of this format.
 *
 * It used to be a local `csvCell()` here, and an identical one in intake.csv.ts,
 * and a third in the scoped exporter. Three copies of the rule that stops a
 * spreadsheet executing what a stranger typed into a public form — which is
 * precisely the failure CLAUDE.md names twice, under "Two places that own a
 * format": the copies agree until the day somebody hardens one of them.
 *
 * The attack, in full, is documented where the function lives. Do not
 * reintroduce a local copy to avoid an import.
 */

export const GET: APIRoute = async ({ url }) => {
  const status = url.searchParams.get('status') ?? 'all';
  const rows = await leads({ status, limit: 5000 });

  const body = [
    COLUMNS.join(','),
    ...rows.map((row) => COLUMNS.map((c) => csvCell((row as unknown as Record<string, unknown>)[c])).join(',')),
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
