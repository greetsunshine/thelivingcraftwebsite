// Lead ledger.
//
// This does NOT deliver anything. Web3Forms remains the delivery path for every
// lead on this site, posted from the browser, exactly as before — CLAUDE.md is
// explicit that a server-side Web3Forms call returns 403 on the free plan, and
// moving it is what broke the agent's handoff once already.
//
// So the browser does both: it posts to Web3Forms as it always did, then tells
// this endpoint what happened. The inbox stays the system of record; this is
// the searchable history beside it, and `delivered` is the reconciliation
// between them. A row with delivered=false is a lead that never reached the
// inbox — the console surfaces those first, because before this table existed
// a failed submission was simply invisible.

import type { APIRoute } from 'astro';
import { record } from '../../lib/admin/supabase';
import { clean, countryOf, deviceOf } from '../../lib/admin/visitor';
import { checkRate } from '../../lib/agent/ratelimit';

export const prerender = false;

const EMAIL = /^[^\s@,;]+@[^\s@,;.]+\.[^\s@,;]{2,}$/;

const SURFACES = new Set(['/', '/caio', '/assessment']);
const INTERESTS = new Set(['cohort', 'caio', 'assessment', 'unclear']);

const ok = () => new Response(null, { status: 204 });

export const POST: APIRoute = async ({ request, clientAddress }) => {
  // Same rule as the beacon: a visitor never sees this fail. They have already
  // been told their application is in, because Web3Forms already accepted it.
  try {
    const gate = checkRate(`lead:${clientAddress ?? 'unknown'}`);
    if (!gate.ok) return ok();
    if (deviceOf(request) === 'bot') return ok();

    const body = (await request.json()) as Record<string, unknown>;

    // The forms already carry a honeypot for Web3Forms; honour it here too, or
    // the console collects the spam the inbox was spared.
    if (body.botcheck) return ok();

    const email = (clean(body.email, 200) ?? '').toLowerCase();
    if (!EMAIL.test(email)) return ok();

    const surface = String(body.surface ?? '/');
    const interest = String(body.interest ?? '');

    await record('leads', {
      source: body.source === 'agent' ? 'agent' : 'form',
      surface: SURFACES.has(surface) ? surface : '/',
      interest: INTERESTS.has(interest) ? interest : null,
      name: clean(body.name, 200),
      email,
      role: clean(body.role, 200),
      company: clean(body.company, 200),
      region: clean(body.region, 120),
      message: clean(body.message, 4000),
      question: clean(body.question, 4000),
      context: clean(body.context, 4000),
      country: countryOf(request),
      // The browser reports whether Web3Forms accepted it. Untrusted, but the
      // only party that knows — and the failure it flags is one we would
      // otherwise never hear about at all.
      delivered: body.delivered === true,
    });
  } catch {
    // Nothing to do and nobody to tell. The lead is already in the inbox.
  }

  return ok();
};
