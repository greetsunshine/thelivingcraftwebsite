// The optional "email me this" request, answered as JSON.
//
// Everything that matters — the rate limit, the honeypot, the idempotency key,
// which resource, the two fields, the save, the queued delivery, the rules
// about what this must never do — is in `handleResourceRequest()` in
// src/lib/pipeline/resource-request.ts, and the long note at the head of that
// file is the one to read. This route only turns its outcome into a response.
// /api/pipeline/resource-pdf is the same sequence with a PDF on the end.

import type { APIRoute } from 'astro';
import { handleResourceRequest } from '../../../lib/pipeline/resource-request';

export const prerender = false;

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

export const POST: APIRoute = async (ctx) => {
  let body: Record<string, unknown>;
  try {
    body = (await ctx.request.json()) as Record<string, unknown>;
  } catch {
    return json(
      { ok: false, error: 'We could not accept that request. The page is the resource either way.' },
      400,
    );
  }

  // This route hands over nothing, so the kind is 'email' whatever was posted.
  const outcome = await handleResourceRequest(ctx, body, { kind: 'email' });

  switch (outcome.kind) {
    case 'refused':
      return json(outcome.body, outcome.status);
    case 'unsaved':
      // 503 and a retry. The message already says the page is not behind
      // this, which is the one reassurance only this path can honestly give.
      return json({ ok: false, error: outcome.message }, 503);
    case 'saved':
      return json(
        {
          ok: true,
          alreadyExisted: outcome.alreadyExisted,
          confirmation: outcome.confirmation,
          delivery: outcome.delivery,
        },
        200,
      );
  }
};

/**
 * Everything else is refused. robots.txt disallows /api/pipeline for the same
 * reason it disallows the other POST endpoints: nothing to index, and a
 * crawler hitting it rate-limits real people for no gain.
 */
export const ALL: APIRoute = () =>
  new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });
