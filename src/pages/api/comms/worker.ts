// The scheduled worker. One tick: plan every due follow-up, then sweep the
// outbox. Called by a cron (vercel.json in production, the GitHub Actions
// schedule for the staging preview) and by nothing a visitor can reach.
//
// AUTHORISATION IS A BEARER SECRET AND NOTHING ELSE. Vercel's cron sends
// `Authorization: Bearer $CRON_SECRET` on its own when that variable is set;
// the Actions workflow sends COMMS_WORKER_SECRET. Either is accepted; neither
// being set closes the route (401), never opens it. The comparison is
// constant-time and the refusal is constant: there is nothing here to learn.
//
// Safe to call twice at once. See "TWO PLANNERS AT ONCE" in lib/comms/drip.ts
// and "CHECK, THEN CLAIM" in lib/comms/outbox.ts.

import type { APIRoute } from 'astro';
import { env } from '../../../lib/admin/env';
import { runCommsWorker } from '../../../lib/comms/drip-runtime';

export const prerender = false;

const safeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

const authorised = (request: Request): boolean => {
  const header = request.headers.get('authorization') ?? '';
  const secrets = [env('COMMS_WORKER_SECRET'), env('CRON_SECRET')].filter((s) => s.length >= 16);
  return secrets.some((s) => safeEqual(header, `Bearer ${s}`));
};

const handler: APIRoute = async ({ request }) => {
  if (!authorised(request)) return new Response('', { status: 401, headers: { 'Cache-Control': 'no-store' } });

  const result = await runCommsWorker();
  return new Response(
    JSON.stringify({
      ok: true,
      ranAt: result.ranAt,
      note: result.note,
      planner: result.planner
        ? { considered: result.planner.considered, planned: result.planner.planned, completed: result.planner.completed, skipped: result.planner.skipped }
        : null,
      sweep: {
        dueConsidered: result.sweep.dueConsidered,
        sent: result.sweep.sent,
        failed: result.sweep.failed,
        held: result.sweep.held,
        cancelled: result.sweep.cancelled,
        wouldSend: result.sweep.wouldSend,
        dispatch: result.sweep.dispatchReason,
      },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } },
  );
};

export const GET = handler;
export const POST = handler;
