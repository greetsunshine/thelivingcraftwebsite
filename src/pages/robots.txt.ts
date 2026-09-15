// robots.txt — deliberately open to AI crawlers.
//
// Blocking GPTBot/ClaudeBot/PerplexityBot is the reflex, but this practice is
// discovered by senior engineers and executives who increasingly ask an
// assistant before they ask a search engine. Being absent from those answers
// costs more than the scraping does. /llms.txt and /api/facts exist so the
// answer they get is the one we wrote.
//
// Six paths are disallowed, for three different reasons:
//   /api/ask     a POST endpoint that costs money per call, nothing to index
//   /api/track   the analytics beacon — indexing it would pollute its own data
//   /api/lead    the lead ledger, POST only
//   /api/pipeline the application/enquiry save, POST only. Same reasoning as
//                the other two: nothing to index, and a crawler hitting it
//                would be rate-limiting real applicants for no gain.
//   /book        a booking's manage page. Its URL carries the reschedule
//                token, so an indexed one is a leaked credential.
//   /api/booking POST only, and it writes rows
//   /craft       the cohort's course area AND, under /craft/admin, the operator
//                console — one prefix now covers both. robots.txt is a request,
//                not a control, so this is politeness on top of the real
//                defence: every route under it is behind a session check in
//                src/middleware.ts and sends X-Robots-Tag: noindex. Listing the
//                prefix does reveal it, which is fine — the seat code and the
//                password are the secrets, not the paths.
import type { APIRoute } from 'astro';
import { SITE_ORIGIN } from '../data/facts';
import { isProduction } from '../lib/env';

const AI_AGENTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
  'Bytespider',
  'meta-externalagent',
];

// '/book' holds one person's booking behind a token in the URL. A booking page
// in a search result would be a leaked credential, and there is nothing on it
// worth indexing either. The pages carry noindex headers and tags as well —
// robots.txt is a request, not a control.
const DISALLOW = [
  '/craft',
  '/book',
  '/api/ask',
  '/api/track',
  '/api/lead',
  '/api/booking',
  '/api/pipeline',
  // The one-click unsubscribe. It only exists inside an email, so a crawler
  // should never meet it — but a link that acts on arrival is exactly the kind
  // a prefetcher or a link-scanner follows on somebody's behalf, and the action
  // is not one we want taken by a machine that has not read it.
  '/api/unsubscribe',
];

export const GET: APIRoute = () => {
  // Any deployment that is not production blocks everything. That covers a
  // Vercel preview and a local build.
  //
  // This route is rendered on demand, so the check runs per request and there
  // is no permissive body baked into a file that could ship early. Promoting a
  // preview to production rebuilds it anyway; see src/lib/env.ts for the paths
  // that do not rebuild and why none of them strands a Disallow on the domain.
  //
  // This is also the ONLY cover /llms.txt and /sitemap.xml get off production.
  // Both are prerendered, so the middleware header never runs for them, and
  // plain text and XML carry no robots meta tag.
  //
  // One known cost, so nobody "fixes" it by accident: Disallow stops a crawler
  // fetching the page, which means it never reads the noindex beside it. For a
  // preview URL nothing links to that is the cheaper defence. For a URL already
  // in the index it is the wrong one, and removing the Disallow is what lets
  // the noindex be seen.
  if (!isProduction()) {
    return new Response(
      ['# Non-production deployment. Nothing here should be indexed.', '', 'User-agent: *', 'Disallow: /', ''].join(
        '\n',
      ),
      { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
    );
  }

  const body = [
    '# Search and AI crawlers are welcome here.',
    '# Grounded, machine-readable facts: /llms.txt and /api/facts',
    '',
    'User-agent: *',
    'Allow: /',
    ...DISALLOW.map((p) => `Disallow: ${p}`),
    '',
    ...AI_AGENTS.flatMap((ua) => [
      `User-agent: ${ua}`,
      'Allow: /',
      ...DISALLOW.map((p) => `Disallow: ${p}`),
      '',
    ]),
    `Sitemap: ${SITE_ORIGIN}/sitemap.xml`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
