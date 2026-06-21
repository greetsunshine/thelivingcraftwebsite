// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// https://astro.build/config
// Static by default; the home route opts into on-demand rendering
// (prerender = false) so it can geo-detect and redirect to a region.
export default defineConfig({
  output: 'static',
  adapter: vercel(),
});
