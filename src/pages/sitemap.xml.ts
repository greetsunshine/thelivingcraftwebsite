// Sitemap. Small enough to hand-roll from the surface list rather than pull in
// @astrojs/sitemap — three routes, and the region params are the same page.
import type { APIRoute } from 'astro';
import { SITE_ORIGIN, surfaces } from '../data/facts';
import { publishedResources, isDownload } from '../data/resources';

// Pages that aren't offers. /latest and /resources are listed here rather than
// added to `surfaces` because that array is the offer list — it feeds llms.txt,
// the agent's "what do you offer" answer, and /api/facts. Field Notes and the
// resources are evidence for the offers, not more of them.
const EXTRA = [
  { path: '/latest', priority: '0.6' },
  { path: '/resources', priority: '0.6' },
  // Listed so a crawler and a Google OAuth consent screen can both fetch it.
  // Low priority because nobody is searching for it — it has to be reachable,
  // not ranked.
  { path: '/privacy', priority: '0.3' },
  // Resource pages are listed individually: each one is the destination a search
  // or an assistant should land on, not the index that links to it.
  ...publishedResources
    .filter((r) => r.url.startsWith('/') && !isDownload(r.url))
    .map((r) => ({ path: r.url, priority: '0.7' })),
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
