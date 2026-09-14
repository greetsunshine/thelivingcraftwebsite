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
const DISALLOW = ['/craft', '/book', '/api/ask', '/api/track', '/api/lead', '/api/booking'];

export const GET: APIRoute = () => {
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
