// The download.
//
// ───────────────────────────────────────────────────────────────────────────
// THE CAPABILITY IS CHECKED HERE, NOT ONLY ON THE SCREEN THAT OFFERS IT.
// ───────────────────────────────────────────────────────────────────────────
//
// The brief says it twice — "Authorisation is enforced server-side on reads,
// exports and writes" and "hiding a button is insufficient" — and an export is
// the place it matters most. Every other control in this console changes one
// record; this one carries the whole set out of the building in a file that
// can be forwarded, uploaded and searched by anybody who ends up holding it.
// Acceptance case E11 is literally "role access and guessed record/export URL".
//
// So: middleware has established that there is a signed-in session. This route
// establishes that the session holds `export.records` — and buildExport()
// checks it a second time, plus `read.people` for the scopes carrying contact
// details, because the library must be safe to call from anywhere and not only
// from a route that remembered.
//
// A GET, deliberately, so the screen can be a plain form and a browser can
// save the file without any JavaScript in the path. It is not indexable
// (middleware seals the whole prefix with X-Robots-Tag and no-store) and it is
// not cacheable.
//
// AND EVERY EXPORT IS LOGGED. Not the rows — the fact that somebody took them.
// If a file turns up somewhere it should not be, the question is who ran it and
// when, and that has to have an answer.

import type { APIRoute } from 'astro';
import { buildExport, DAY_WINDOWS, isScope, scope, type ExportFilters } from '../../../../lib/admin/export';
import { db } from '../../../../lib/admin/supabase';
import { can, ROLES, ROLE_LABEL } from '../../../../lib/pipeline/roles';
import { isRoute } from '../../../../lib/pipeline/forms';
import type { Identity } from '../../../../lib/admin/staff';

export const prerender = false;

/**
 * Errors come back as plain text, not JSON.
 *
 * This route is reached by a form submit, so whatever it returns is what the
 * person is looking at. A JSON body would render as a blob of braces; a
 * sentence renders as a sentence.
 */
const problem = (message: string, status: number) =>
  new Response(`${message}\n`, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'private, no-store' },
  });

const actorOf = (who: Identity): string =>
  who.kind === 'staff' ? `${who.name} <${who.id}>` : 'bootstrap (shared password)';

/** Who to go and ask, when the answer is no. */
const holders = (): string =>
  ROLES.filter((r) => can([r], 'export.records'))
    .map((r) => ROLE_LABEL[r])
    .join(' or ');

export const GET: APIRoute = async ({ url, locals }) => {
  const who = locals.admin;
  if (!who) return problem('Not signed in.', 401);

  // The first of three checks. buildExport() repeats it and adds read.people
  // for the personal scopes; this one is here so a guessed URL never reaches
  // the query at all.
  if (!can(who.roles, 'export.records')) {
    return problem(`Exporting records is not one of your roles. ${holders()} can.`, 403);
  }

  const requested = url.searchParams.get('scope') ?? '';
  if (!isScope(requested)) {
    return problem('Choose a record set to export.', 400);
  }
  const def = scope(requested);

  // ── A MISSING `days` MEANS 30, NOT EVERYTHING ────────────────────────────
  //
  // `Number(null)` is 0 and `Number('')` is 0, and 0 is a legitimate member of
  // DAY_WINDOWS meaning "every row this scope holds". So reading the parameter
  // straight through Number() made an ABSENT window the WIDEST one: a guessed
  // `/api/craft/admin/export?scope=people` handed back the entire people table
  // rather than the last thirty days. An unstated option must resolve to the
  // narrow default, never the permissive one — the same rule that makes an
  // unconfigured console closed rather than open.
  //
  // So `0` is honoured only when it was actually asked for.
  const raw = url.searchParams.get('days');
  const days = raw === null || raw.trim() === '' ? Number.NaN : Number(raw);
  const filters: ExportFilters = {
    days: (DAY_WINDOWS as readonly number[]).includes(days) ? days : 30,
  };

  // Each scope understands exactly one extra filter, and an unknown value is
  // dropped rather than passed to the query — a typo must not silently become
  // a filter that matches nothing and exports an empty file.
  if (def.filter === 'type') {
    const type = url.searchParams.get('type') ?? '';
    if (isRoute(type)) filters.type = type;
  }
  if (def.filter === 'route') {
    const route = url.searchParams.get('route') ?? '';
    if (route === 'member' || route === 'enterprise') filters.route = route;
  }

  const answer = await buildExport(who, requested, filters);

  if (answer.state === 'denied') return problem(answer.reason, 403);
  if (answer.state === 'unavailable') {
    // 503 rather than 200-with-an-empty-file. A CSV with a header row and
    // nothing under it is indistinguishable from a quiet month once it has been
    // saved to somebody's disk, and one of those two readings is a lie about
    // the practice.
    return problem(`No file was produced. ${answer.reason}`, 503);
  }

  // Best-effort and after the fact: the rows are already built, and a failed
  // log entry must not cost somebody their export. Counts only — the audit log
  // holds nothing personal, which is exactly why it survives an erasure.
  try {
    const client = db();
    await client?.from('audit_log').insert({
      record_type: 'export',
      record_id: null,
      actor: actorOf(who),
      previous_value: null,
      new_value: { scope: requested, rows: answer.value.rows, filters },
      occurred_at: new Date().toISOString(),
      reason: `Exported ${answer.value.rows} ${requested} rows.`,
    });
  } catch (err) {
    console.error('export audit write failed:', err instanceof Error ? err.name : 'unknown');
  }

  return new Response(answer.value.csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${answer.value.filename}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
