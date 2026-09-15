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
  // Any deployment that is not the promoted production one — a Vercel preview
  // (staging) or a local build — blocks everything. This is read at request
  // time (see src/lib/env.ts), so promoting a staging build to production
  // flips this without a rebuild. There is no permissive body to accidentally
  // ship early and no staging body to accidentally leave behind.
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
