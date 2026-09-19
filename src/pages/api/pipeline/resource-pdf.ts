// The PDF of a filled resource, handed over against an email address. Today
// that is the POC Selection Tool, the Agent Authority Review and the Run-Cost
// Model Tool.
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
// The PAGE is open. Anybody can fill the tool, read the result,
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
// THE FILE IS CHECKED BEFORE IT IS HANDED OVER
// ───────────────────────────────────────────────────────────────────────────
//
// Every renderer runs a list of named checks over what the file will say (the
// total is the sum of the answers, the outcome is what the rubric says, the
// cohort copy carries no unpublished figure, and so on) and then reopens the
// bytes it drew. The checks run once BEFORE the save, so a request that would
// fail one leaves no person or queued email behind it, and again inside the
// render. A failed check is a 500 that says so. The list of passed checks goes
// back in the answer, and the page prints it beside the download.
//
// ───────────────────────────────────────────────────────────────────────────
// THE SCORES ARE USED AND NOT KEPT
// ───────────────────────────────────────────────────────────────────────────
//
// `resource_request_submit()` has no argument for them, and that is right: a
// scored copy of somebody's proof of concept, or the steps of their own
// workflow, is their working document, not a lead attribute. The answers go
// into the PDF and nowhere else. Each page says exactly this beside the form.

import type { APIRoute } from 'astro';
import { handleResourceRequest } from '../../../lib/pipeline/resource-request';
import { resolveResource } from '../../../lib/pipeline/resources';
import { parseScores, renderPocScreenPdf, verifyPocScreenPdf, type PdfCheck } from '../../../lib/resources/poc-screen-pdf';
import { parseSheet, renderAuthorityReviewPdf } from '../../../lib/resources/authority-review-pdf';
import { parseInputs, renderRunCostModelPdf, verifyRunCostModelPdf } from '../../../lib/resources/run-cost-model-pdf';
import type { SheetRow } from '../../../data/authority-review';
import type { ModelInputs } from '../../../data/run-cost-model';

export const prerender = false;

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

const REFUSED = 'We could not accept that request. The page is the resource either way.';

/**
 * Which resources have a PDF, and how each one is built. Each resource gets
 * its own entry here, never a branch on the id inside the handler.
 *
 * `parse` runs BEFORE the request is saved, and that order matters. The save
 * writes a person, a request row, a queued email and an event. Refusing the
 * payload after all of that is written leaves a record for a request that
 * got nothing, and a retry under a fresh key writes a second one. So the
 * payload is checked first, and only a request that will get its file is
 * saved.
 */
interface Renderer<T> {
  parse: (body: Record<string, unknown>) => T | null;
  /**
   * The content checks, run BEFORE the save. Any failure stops the request
   * with nothing written. Optional while the other renderers grow their own.
   */
  verify?: (payload: T, name: string) => PdfCheck[];
  /** The bytes, or the bytes with the checks the render ran on the way. */
  render: (payload: T, name: string) => Promise<Uint8Array | { bytes: Uint8Array; checks: PdfCheck[] }>;
  filename: string;
}

const CHECK_FAILED =
  'The PDF failed a check before download, so it was not built. Nothing was saved and nothing was sent. Try again in a moment.';

const RENDERERS: Record<string, Renderer<any>> = {
  'poc-screen': {
    parse: (body) => parseScores(body.scores),
    verify: (scores: (number | null)[], name) =>
      verifyPocScreenPdf({ scores, name, builtOn: new Date().toISOString() }),
    render: (scores: (number | null)[], name) =>
      renderPocScreenPdf({ scores, name, builtOn: new Date().toISOString() }),
    filename: 'poc-selection-tool-scored.pdf',
  } satisfies Renderer<(number | null)[]>,
  'agent-authority-review': {
    parse: (body) => parseSheet(body.sheet),
    render: (rows: SheetRow[], name) =>
      renderAuthorityReviewPdf({ rows, name, builtOn: new Date().toISOString() }),
    filename: 'agent-authority-review-assessment.pdf',
  } satisfies Renderer<SheetRow[]>,
  'run-cost-model': {
    // `isExample` only changes one line of the cover; a wrong value cannot
    // change a number, so it is read leniently and the inputs strictly.
    parse: (body) => {
      const inputs = parseInputs(body.inputs);
      return inputs ? { inputs, isExample: body.isExample === true } : null;
    },
    verify: (payload: { inputs: ModelInputs; isExample: boolean }, name) =>
      verifyRunCostModelPdf({ ...payload, name, builtOn: new Date().toISOString() }),
    render: (payload: { inputs: ModelInputs; isExample: boolean }, name) =>
      renderRunCostModelPdf({ ...payload, name, builtOn: new Date().toISOString() }),
    filename: 'run-cost-model.pdf',
  } satisfies Renderer<{ inputs: ModelInputs; isExample: boolean }>,
};

export const POST: APIRoute = async (ctx) => {
  let body: Record<string, unknown>;
  try {
    body = (await ctx.request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: REFUSED }, 400);
  }

  // Which resource, and does it have a PDF, and is the payload good: all
  // answered before anything is written. `handleResourceRequest()` resolves
  // the resource again with the same function, so the two cannot disagree.
  const lookup = resolveResource(body.resource);
  if (lookup.state !== 'ok') return json({ ok: false, error: REFUSED }, 400);

  const renderer = RENDERERS[lookup.resource.id];
  if (!renderer) {
    // A real resource with no PDF. Refused rather than answered with an empty
    // file, and refused BEFORE the save: the JSON route is the one for an
    // email copy alone, and the page for that resource links to it.
    return json({ ok: false, error: 'That resource has no PDF. The page itself is the copy.' }, 400);
  }

  const payload = renderer.parse(body);
  if (payload === null) return json({ ok: false, error: REFUSED }, 400);

  const name =
    typeof (body.answers as Record<string, unknown> | undefined)?.name === 'string'
      ? String((body.answers as Record<string, unknown>).name).trim().slice(0, 200)
      : '';

  // The content checks, before anything is written.
  const preflight: PdfCheck[] = renderer.verify ? renderer.verify(payload, name) : [];
  const failed = preflight.filter((c) => !c.ok);
  if (failed.length) {
    console.error('resource pdf check failed:', failed.map((c) => `${c.name}: ${c.detail ?? ''}`).join('; '));
    return json({ ok: false, error: CHECK_FAILED, checks: preflight }, 500);
  }

  const outcome = await handleResourceRequest(ctx, body);
  if (outcome.kind === 'refused') return json(outcome.body, outcome.status);

  let file: { bytes: Uint8Array; filename: string; checks: PdfCheck[] };
  try {
    const built = await renderer.render(payload, name);
    file =
      built instanceof Uint8Array
        ? { bytes: built, checks: [], filename: renderer.filename }
        : { ...built, filename: renderer.filename };
  } catch (err) {
    // The request IS saved at this point, so the person still gets their
    // email copy; only the file failed.
    console.error('resource pdf render threw:', err instanceof Error ? err.name : 'unknown');
    return json(
      { ok: false, error: 'We could not build the PDF just now. Try again in a moment.' },
      500,
    );
  }

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
        checks: file.checks,
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
      checks: file.checks,
    },
    200,
  );
};

/** Everything else is refused. robots.txt already disallows /api/pipeline. */
export const ALL: APIRoute = () =>
  new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });
