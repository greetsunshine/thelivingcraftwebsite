// Sitemap. Small enough to hand-roll from the surface list rather than pull in
// @astrojs/sitemap — three routes, and the region params are the same page.
import type { APIRoute } from 'astro';
import { SITE_ORIGIN, surfaces } from '../data/facts';

export const prerender = true;

// Build date, not request time — a lastmod that moves on every request tells
// crawlers the page changed when it didn't, and they learn to ignore it.
const lastmod = new Date().toISOString().slice(0, 10);

export const GET: APIRoute = () => {
  const urls = surfaces
    .map(
      (s) => `  <url>
    <loc>${SITE_ORIGIN}${s.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${s.path === '/' ? '1.0' : '0.8'}</priority>
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
