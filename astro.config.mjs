// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// https://astro.build/config
// Static by default; the home route opts into on-demand rendering
// (prerender = false) so it can geo-detect and pick the region's pricing.
// Old per-region paths redirect to the single page with a ?region= param.
export default defineConfig({
  output: 'static',
  adapter: vercel(),
  redirects: {
    '/india': '/?region=india',
    '/dubai': '/?region=dubai',
    '/australia': '/?region=australia',
  },
});
