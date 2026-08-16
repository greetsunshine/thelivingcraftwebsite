// robots.txt — deliberately open to AI crawlers.
//
// Blocking GPTBot/ClaudeBot/PerplexityBot is the reflex, but this practice is
// discovered by senior engineers and executives who increasingly ask an
// assistant before they ask a search engine. Being absent from those answers
// costs more than the scraping does. /llms.txt and /api/facts exist so the
// answer they get is the one we wrote.
//
// Four paths are disallowed, for three different reasons:
//   /api/ask     a POST endpoint that costs money per call, nothing to index
//   /api/track   the analytics beacon — indexing it would pollute its own data
//   /api/lead    the lead ledger, POST only
//   /admin       the console. robots.txt is a request, not a control, so this
//                is politeness on top of the real defence: every /admin route
//                is behind a session check in src/middleware.ts and sends
//                X-Robots-Tag: noindex. Listing it here does reveal the path,
//                which is fine — the password is the secret, not the URL.
import type { APIRoute } from 'astro';
import { SITE_ORIGIN } from '../data/facts';

export const prerender = true;

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

const DISALLOW = ['/admin', '/api/ask', '/api/track', '/api/lead'];

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
