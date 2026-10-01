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
import { eventContext } from '../../lib/analytics/context';

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
  'apply_start', // first keystroke in an application form (until 29 Sep 2026; now form_started)
  'apply_submit', // the /caio and /assessment forms: submitted (see meta.ok)
  'cta_click', // a link to /caio, /assessment or a booking (cohort links: cohort_cta_clicked)

  // The revised outreach readiness handoff, 29 September 2026: "Track
  // form_started, application_saved, resource_requested,
  // requested_delivery_confirmed, tool_started, useful_result_completed and
  // cohort_cta_clicked as distinct events." Five of the seven come from the
  // browser and are listed here. `application_saved` and `resource_requested`
  // are NOT: the server writes them after the commit, and a browser must not
  // be able to claim either one. See src/lib/analytics/events.ts.
  'form_started', // first focus in one of the three route forms (meta.form)
  'tool_started', // first use of a tool's working area (meta.tool)
  'useful_result_completed', // a tool's result became complete (meta.tool)
  'cohort_cta_clicked', // a link to the cohort or its application (meta.to, meta.placement)
  'requested_delivery_confirmed', // the requested file reached the browser (meta.resource, meta.kind)

  // Sent by RouteForm.astro since 10 September and dropped here until 29
  // September, because nobody had added them. Both carry categories only.
  'form_error', // a field was refused (meta.form, meta.field, meta.code; never the value)
  'owner_notified', // the inbox copy of a saved submission (meta.delivered)

  // The resource pages. Added for /resources/cost-ceiling-workbook, which is
  // the first page here with a tool on it rather than only a document.
  'resource_download', // a file was downloaded from a resource page
  'calculator_interaction', // first input change on an on-page calculator
  'cohort_apply_click', // the apply CTA at the foot of a resource page
]);

/**
 * Only our own routes. Keeps a spoofed path from inventing pages in the report.
 *
 * The three offer surfaces are named exactly. The resource pages are matched by
 * PREFIX instead, because there are a dozen of them and a closed list here is a
 * list somebody forgets to extend — the symptom being a page that silently
 * reports nothing, which is the hardest kind of analytics bug to notice.
 *
 * The prefix is deliberately narrow. `/craft` must never match: the course area
 * and the operator console both live under it, and a learner's movements are not
 * traffic to be counted. `isTracked` below tests the exact strings first and
 * then the one allowed prefix, and nothing else is accepted.
 */
const PATHS = new Set(['/', '/caio', '/assessment']);

/**
 * The prefixes that are allowed, alongside the exact paths above.
 *
 * `/tools/` joined on 29 September 2026. The Agent Design Check lives there and
 * carries the same closing cohort row as every resource page; without the
 * prefix its clicks, and its page views, were dropped here with a 204. The page
 * already told its readers that "the page view itself is counted", which was
 * not true until now. `/tools/` cannot reach `/craft`.
 */
const TRACKED_PREFIXES = ['/resources/', '/tools/'];

const isTracked = (path: string): boolean =>
  PATHS.has(path) || (TRACKED_PREFIXES.some((p) => path.startsWith(p)) && !path.includes('..'));

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
    if (!isTracked(path)) return noContent();

    // The browser's own fields, then two the server decides: which deployment
    // this is and what the visitor had answered on the cookie banner. They are
    // written last so a browser cannot claim either one.
    const sent = body.meta && typeof body.meta === 'object' && !Array.isArray(body.meta) ? (body.meta as Record<string, unknown>) : {};
    const meta: Record<string, unknown> = { ...sent, ...eventContext(request) };
    // A repeated beacon carries the same id, and a unique index on
    // `meta->>'event_id'` (supabase/schema.sql) stores it once.
    if (typeof meta.event_id === 'string') meta.event_id = meta.event_id.slice(0, 64);

    await record('events', {
      type,
      path,
      referrer_host: referrerHost(body.referrer),
      country: countryOf(request),
      region: clean(body.region, 40),
      device,
      visitor: await visitorHash(request, clientAddress ?? 'unknown'),
      // Small, bounded, and never rendered as markup by the console.
      meta,
    });
  } catch {
    // Malformed body, Supabase down, anything — swallow it.
  }

  return noContent();
};
