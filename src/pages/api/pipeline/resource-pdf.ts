// The PDF of a scored POC Selection Tool, handed over against an email address.
//
// Same request as /api/pipeline/resource — the same rate limit, honeypot,
// key, fields, save and queued delivery, through the same function — plus a
// `scores` array, and a built PDF in the answer. Read the note at the head of
// src/lib/pipeline/resource-request.ts before changing what is saved.
//
// ───────────────────────────────────────────────────────────────────────────
// WHAT THE GATE IS, AND WHAT IT IS NOT
// ───────────────────────────────────────────────────────────────────────────
//
// The PAGE is open. Anybody can score the twelve questions, read the result,
// copy the scorecard and print it, and none of that asks for anything. The
// PDF is the one artefact that asks for a name and an address first, and it is
// the honest place for that ask: it is a copy to keep and to pass around, the
// email is a second copy of the same thing, and the person typing an address
// is asking to be sent something.
//
// So this route refuses a PDF to a request that fails validation — no address,
// a malformed one, a honeypot hit, a resource we do not publish. What it does
// NOT do is refuse a PDF because OUR database was unavailable. The person did
// what was asked. Withholding the file because the schema is not applied or
// Supabase timed out would punish them for a fault on this side, and the
// console's health banner already reports that fault where it belongs. The
// answer says `saved: false` and why, so the page can tell them plainly.
//
// ───────────────────────────────────────────────────────────────────────────
// THE SCORES ARE USED AND NOT KEPT
// ───────────────────────────────────────────────────────────────────────────
//
// `resource_request_submit()` has no argument for them, and that is right: a
// scored copy of somebody's proof of concept is their working document, not a
// lead attribute. The scores go into the PDF and nowhere else. The page says
// exactly this beside the form.

import type { APIRoute } from 'astro';
import { handleResourceRequest } from '../../../lib/pipeline/resource-request';
import { parseScores, renderPocScreenPdf } from '../../../lib/resources/poc-screen-pdf';

export const prerender = false;

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

const REFUSED = 'We could not accept that request. The page is the resource either way.';

/**
 * Which resources have a PDF, and how each one is built. One entry today. A
 * second resource gets a second renderer here, never a branch on the id
 * inside the handler.
 */
const RENDERERS: Record<
  string,
  (body: Record<string, unknown>, name: string) => Promise<{ bytes: Uint8Array; filename: string } | null>
> = {
  'poc-screen': async (body, name) => {
    const scores = parseScores(body.scores);
    if (!scores) return null;
    const bytes = await renderPocScreenPdf({ scores, name, builtOn: new Date().toISOString() });
    return { bytes, filename: 'poc-selection-tool-scored.pdf' };
  },
};

export const POST: APIRoute = async (ctx) => {
  let body: Record<string, unknown>;
  try {
    body = (await ctx.request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: REFUSED }, 400);
  }

  const outcome = await handleResourceRequest(ctx, body);
  if (outcome.kind === 'refused') return json(outcome.body, outcome.status);

  const render = RENDERERS[outcome.resource.id];
  if (!render) {
    // A real resource with no PDF. Refused rather than answered with an empty
    // file, and refused AFTER the save on purpose: the request was valid and
    // the person still gets their email copy.
    return json({ ok: false, error: 'That resource has no PDF. The page itself is the copy.' }, 400);
  }

  const name =
    typeof (body.answers as Record<string, unknown> | undefined)?.name === 'string'
      ? String((body.answers as Record<string, unknown>).name).trim().slice(0, 200)
      : '';

  let file: { bytes: Uint8Array; filename: string } | null;
  try {
    file = await render(body, name);
  } catch (err) {
    console.error('resource pdf render threw:', err instanceof Error ? err.name : 'unknown');
    return json(
      { ok: false, error: 'We could not build the PDF just now. Use Print on the page instead.' },
      500,
    );
  }
  if (!file) return json({ ok: false, error: REFUSED }, 400);

  // Base64 in JSON rather than a binary body, so the save outcome and the file
  // travel together and the browser branches on one shape. A scored copy is
  // about 20 KB; the encoding overhead is not worth a second round trip.
  const pdf = Buffer.from(file.bytes).toString('base64');

  if (outcome.kind === 'unsaved') {
    return json(
      {
        ok: true,
        saved: false,
        note: outcome.message,
        delivery: null,
        pdf,
        filename: file.filename,
      },
      200,
    );
  }

  return json(
    {
      ok: true,
      saved: true,
      alreadyExisted: outcome.alreadyExisted,
      confirmation: outcome.confirmation,
      delivery: outcome.delivery,
      pdf,
      filename: file.filename,
    },
    200,
  );
};

/** Everything else is refused. robots.txt already disallows /api/pipeline. */
export const ALL: APIRoute = () =>
  new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });
