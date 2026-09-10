// Sitemap. Small enough to hand-roll from the surface list rather than pull in
// @astrojs/sitemap — three routes, and the region params are the same page.
import type { APIRoute } from 'astro';
import { SITE_ORIGIN, surfaces } from '../data/facts';

export const prerender = true;

// Pages that aren't offers. /latest is listed here rather than added to
// `surfaces` because that array is the offer list — it feeds llms.txt, the
// agent's "what do you offer" answer, and /api/facts, and Field Notes is
// evidence for the offers, not a fourth one.
//
// ───────────────────────────────────────────────────────────────────────────
// THIS LIST IS EXPLICIT, AND MUST STAY EXPLICIT.
// ───────────────────────────────────────────────────────────────────────────
//
// The obvious improvement is to glob src/pages and emit whatever is there.
// Do not. Two kinds of page must never appear in a sitemap and a glob cannot
// tell them apart from the rest:
//
//   * /privacy and /terms are `noindex` — honest placeholders until the owner
//     supplies the facts they are waiting on. Submitting a noindex page to a
//     crawler is asking it to fetch something we have told it to ignore, and
//     an incomplete privacy notice is the last page that should be indexed
//     and cited.
//   * Anything under /craft. The middleware closes it, robots disallows it,
//     and a sitemap listing it would undo both.
//
// A route only joins this list once it RETURNS 200 and is content we stand
// behind. When a page lands, add it here in the same commit — and check it,
// because a sitemap entry that 404s teaches a crawler to trust the file less.
const EXTRA = [
  { path: '/latest', priority: '0.6' },

  // The wider practice site.
  { path: '/about', priority: '0.7' },
  { path: '/programmes/', priority: '0.8' },
  { path: '/programmes/enterprise', priority: '0.7' },
  { path: '/advisory', priority: '0.7' },
  { path: '/contact', priority: '0.5' },

  // The first content cluster. The pillar carries the higher priority because
  // it is the page the three supporting pieces point back at.
  { path: '/resources/guides/', priority: '0.6' },
  { path: '/resources/guides/agentic-system-design', priority: '0.7' },
  { path: '/resources/guides/workflow-or-agent', priority: '0.6' },
  { path: '/resources/guides/tool-permissions', priority: '0.6' },
  { path: '/resources/guides/uncertain-evidence', priority: '0.6' },

  // NOT YET LISTED, because they do not return 200 yet:
  //   /resources/  /tools/  /tools/agent-design-check
  //   /communication-preferences
  // Add each one in the commit that makes it render.
];

// Build date, not request time — a lastmod that moves on every request tells
// crawlers the page changed when it didn't, and they learn to ignore it.
const lastmod = new Date().toISOString().slice(0, 10);

export const GET: APIRoute = () => {
  const urls = [
    ...surfaces.map((s) => ({ path: s.path, priority: s.path === '/' ? '1.0' : '0.8' })),
    ...EXTRA,
  ]
    .map(
      (s) => `  <url>
    <loc>${SITE_ORIGIN}${s.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${s.priority}</priority>
  </url>`,
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
