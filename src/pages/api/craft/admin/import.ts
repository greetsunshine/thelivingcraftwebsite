// Import: two actions, and they are never one call.
//
// ───────────────────────────────────────────────────────────────────────────
// `preview` CHANGES NOTHING. `commit` APPLIES. THERE IS NO THIRD OPTION.
// ───────────────────────────────────────────────────────────────────────────
//
// The brief: "Validate, preview match/conflict counts, then commit." Two
// phases, because the alternative is a button that reads four hundred rows off
// somebody's laptop and writes them straight into the practice's contact list
// with no moment in between where a person could have said no.
//
// The commit does NOT trust the preview. It re-reads the file, re-runs every
// check and re-queries the database, for three reasons: the preview's verdict
// arrived from a browser and anything from a browser is a claim rather than
// evidence; the records may have changed since; and a design where the
// expensive check can be skipped by editing a fetch call is a check that will
// eventually be skipped.
//
// AUTHORISATION is `write.contact` — the operator's, not Sunil's. Contacts and
// qualification are the operator's job in the brief's permissions table, and a
// bulk write of four hundred people is the largest possible version of it.
// Sunil can export and cannot import; that asymmetry is deliberate.
//
// THE RESPONSE NEVER ECHOES A CELL. Every message in a report names a line
// number and a column name. Not a name, not an address, not what somebody
// wrote — error text gets pasted into tickets and chat windows, and it travels
// much further than the file it came from.

import type { APIRoute } from 'astro';
import {
  commitImport,
  IMPORT_CAPABILITY,
  isImportKind,
  MAX_IMPORT_ROWS,
  previewImport,
  blocked,
} from '../../../../lib/admin/import';
import { can, ROLES, ROLE_LABEL } from '../../../../lib/pipeline/roles';
import type { Identity } from '../../../../lib/admin/staff';

export const prerender = false;

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

const actorOf = (who: Identity): string =>
  who.kind === 'staff' ? `${who.name} <${who.id}>` : 'bootstrap (shared password)';

const holders = (): string =>
  ROLES.filter((r) => can([r], IMPORT_CAPABILITY))
    .map((r) => ROLE_LABEL[r])
    .join(' or ');

/**
 * A ceiling on the request body.
 *
 * MAX_IMPORT_ROWS bounds the rows; this bounds the bytes, because a single row
 * can carry four thousand characters of free text and the row limit alone does
 * not stop somebody posting a very large file to find out what happens.
 */
const MAX_BYTES = 4_000_000;

export const POST: APIRoute = async ({ request, locals }) => {
  const who = locals.admin;
  if (!who) return json({ ok: false, error: 'Not signed in.' }, 401);

  if (!can(who.roles, IMPORT_CAPABILITY)) {
    return json({ ok: false, error: `Importing contacts is not one of your roles. ${holders()} can.` }, 403);
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: 'Could not read that request.' }, 400);
  }

  const action = String(body.action ?? '');
  const kind = body.kind;
  const csv = typeof body.csv === 'string' ? body.csv : '';

  if (!isImportKind(kind)) {
    return json({ ok: false, error: 'Say whether this file is people or organisations.' }, 400);
  }
  if (!csv.trim()) {
    return json({ ok: false, error: 'That file is empty.' }, 400);
  }
  if (csv.length > MAX_BYTES) {
    return json(
      {
        ok: false,
        error: `That file is too large to check in one go. The limit is ${MAX_IMPORT_ROWS} rows; split it and run the parts.`,
      },
      413,
    );
  }

  if (action !== 'preview' && action !== 'commit') {
    // Named explicitly rather than defaulted. A missing action must never fall
    // through to the one that writes.
    return json({ ok: false, error: 'Unknown action. Use preview, then commit.' }, 400);
  }

  const answer =
    action === 'preview'
      ? await previewImport(who, kind, csv)
      : await commitImport(who, kind, csv, actorOf(who));

  if (answer.state === 'denied') return json({ ok: false, state: 'denied', error: answer.reason }, 403);
  if (answer.state === 'unavailable') {
    // 'unavailable' is NOT an empty report. A caller must be able to tell "no
    // conflicts" from "not checked", so the state travels with the response and
    // the screen renders them differently.
    return json({ ok: false, state: 'unavailable', error: answer.reason }, 503);
  }

  const report = answer.value;

  // A blocked commit is not an error in the plumbing — the file was read, the
  // checks ran, and the answer is no. 409 says exactly that, and the report
  // that comes with it is what makes the refusal actionable.
  if (action === 'commit' && blocked(report)) {
    return json(
      {
        ok: false,
        state: 'blocked',
        error:
          'Nothing was imported. Conflicting ids are refused rather than applied — fix the lines below and run it again.',
        report,
      },
      409,
    );
  }

  return json({ ok: true, state: 'ok', action, report }, 200);
};
