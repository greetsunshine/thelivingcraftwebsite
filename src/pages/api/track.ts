// First-party traffic beacon.
//
// Vercel Analytics is already on the site and gives headline pageviews, but its
// data is only readable from the Vercel dashboard — the site cannot query it,
// so a console built on it would be an iframe of someone else's product. This
// endpoint records the handful of events the practice actually needs, in a
// table we can join against leads.
//
// It records interest, not people. See lib/admin/visitor.ts for what is and
// is not derivable from a row.

import type { APIRoute } from 'astro';
import { record } from '../../lib/admin/supabase';
import { clean, countryOf, deviceOf, referrerHost, visitorHash } from '../../lib/admin/visitor';
import { checkRate } from '../../lib/agent/ratelimit';

export const prerender = false;

/**
 * Closed set, enforced server-side.
 *
 * An open `type` field is an invitation for anyone with the endpoint to write
 * arbitrary rows into the table the console renders. The console's numbers are
 * only worth reading if this list is the only thing that can appear in them.
 */
const TYPES = new Set([
  'pageview',
  'ask_open', // the Q&A widget was opened
  'ask_question', // a question was actually asked
  'apply_start', // first keystroke in an application form
  'apply_submit', // form submitted (successfully or not — see meta.ok)
  'cta_click', // a cross-surface link was followed
]);

/** Only our own routes. Keeps a spoofed path from inventing pages in the report. */
const PATHS = new Set(['/', '/caio', '/assessment']);

// 204 with no body: the browser sends this with sendBeacon or keepalive and
// never reads a response. Returning JSON nobody parses is just bytes.
const noContent = () => new Response(null, { status: 204 });

export const POST: APIRoute = async ({ request, clientAddress }) => {
  // Analytics failing must never be visible to a visitor, so every path from
  // here returns 204 — including the rejections. The console showing fewer
  // events is the correct failure; a console error in someone's browser is not.
  try {
    const gate = checkRate(`track:${clientAddress ?? 'unknown'}`);
    if (!gate.ok) return noContent();

    // Crawlers are welcome on this site by design (robots.txt allows AI
    // agents), which makes it more important, not less, that they stay out of
    // the traffic figures. A pageview count inflated by ClaudeBot would quietly
    // make every funnel number wrong.
    const device = deviceOf(request);
    if (device === 'bot') return noContent();

    const body = (await request.json()) as Record<string, unknown>;

    const type = String(body.type ?? '');
    if (!TYPES.has(type)) return noContent();

    const path = String(body.path ?? '');
    if (!PATHS.has(path)) return noContent();

    await record('events', {
      type,
      path,
      referrer_host: referrerHost(body.referrer),
      country: countryOf(request),
      region: clean(body.region, 40),
      device,
      visitor: await visitorHash(request, clientAddress ?? 'unknown'),
      // Small, bounded, and never rendered as markup by the console.
      meta: body.meta && typeof body.meta === 'object' ? body.meta : null,
    });
  } catch {
    // Malformed body, Supabase down, anything — swallow it.
  }

  return noContent();
};
