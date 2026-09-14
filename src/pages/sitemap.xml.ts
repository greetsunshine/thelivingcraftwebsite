// Sitemap. Small enough to hand-roll from the surface list rather than pull in
// @astrojs/sitemap — three routes, and the region params are the same page.
import type { APIRoute } from 'astro';
import { SITE_ORIGIN, surfaces } from '../data/facts';
import { publishedResources, isDownload } from '../data/resources';

export const prerender = true;

// Pages that aren't offers. /latest and /resources are listed here rather than
// added to `surfaces` because that array is the offer list — it feeds llms.txt,
// the agent's "what do you offer" answer, and /api/facts. Field Notes and the
// resources are evidence for the offers, not more of them.
//
// ───────────────────────────────────────────────────────────────────────────
// THIS LIST IS EXPLICIT, AND MUST STAY EXPLICIT.
// ───────────────────────────────────────────────────────────────────────────
//
// The obvious improvement is to glob src/pages and emit whatever is there.
// Do not. Anything under /craft must never appear in a sitemap, and a glob
// cannot tell it apart from the rest: the middleware closes it, robots
// disallows it, and a sitemap listing it would undo both.
//
// The one list built from data rather than typed out is the resource pages,
// and that is not a glob — `publishedResources` is a curated array in
// src/data/resources.ts, so a page joins the sitemap by being published, not
// by existing on disk.
//
// A route only joins this list once it RETURNS 200 and is content we stand
// behind. When a page lands, add it here in the same commit — and check it,
// because a sitemap entry that 404s teaches a crawler to trust the file less.
const EXTRA = [
  { path: '/latest', priority: '0.6' },

  // /privacy and /terms were noindex placeholders and were correctly withheld.
  // They are real pages now — written from the code rather than a template —
  // so they are listed. Low priority because nobody searches for them; they
  // have to be reachable, including by a Google OAuth consent screen, not
  // ranked.
  { path: '/privacy', priority: '0.3' },
  { path: '/terms', priority: '0.3' },

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

  // Four templates, each a blank plus a completed illustrative example. Listed
  // at the guides' priority because that is what they are for a searcher: the
  // answer to "give me the thing, not an article about the thing".
  { path: '/resources/templates/', priority: '0.6' },
  { path: '/resources/templates/agent-design-canvas', priority: '0.7' },
  { path: '/resources/templates/design-review-agenda', priority: '0.6' },
  { path: '/resources/templates/decision-record', priority: '0.7' },
  { path: '/resources/templates/employer-funding-summary', priority: '0.6' },

  // The V4 addendum's three open resources (LC-R01/R02/R03) and their index.
  // Listed at the templates' priority and for the same reason: for a searcher
  // these ARE the answer to "give me the thing", and each one is a complete
  // document on its own page rather than a teaser for a download. The index
  // carries the lower figure because it only routes to them.
  { path: '/toolkit', priority: '0.6' },
  { path: '/resources/cost-ceiling-worksheet', priority: '0.7' },
  { path: '/resources/evaluation-gates-worksheet', priority: '0.7' },
  { path: '/resources/deployment-checklist', priority: '0.7' },

  { path: '/resources/', priority: '0.6' },
  { path: '/tools/', priority: '0.6' },
  { path: '/tools/agent-design-check', priority: '0.7' },

  // Not an offer page, but a real one somebody may need to find in a hurry:
  // how to stop receiving something. Indexed for that reason.
  { path: '/communication-preferences', priority: '0.4' },

  // Each published resource is listed individually: it is the destination a
  // search or an assistant should land on, not the index that links to it.
  // Downloads are skipped — a file is not a page.
  ...publishedResources
    .filter((r) => r.url.startsWith('/') && !isDownload(r.url))
    .map((r) => ({ path: r.url, priority: '0.7' })),

  // STILL NOT LISTED, and correctly so:
  //   anything under /craft — closed by middleware and disallowed in robots
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
