// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// https://astro.build/config
// Render every route on demand. This keeps page generation, content loading,
// authentication and request-specific decisions on the server. Browser scripts
// are used only as progressive enhancement for interactive controls.
// Old per-region paths redirect to the single page with a ?region= param.
export default defineConfig({
  output: 'server',
  adapter: vercel(),
  redirects: {
    '/india': '/?region=india',
    '/dubai': '/?region=dubai',
    '/australia': '/?region=australia',
  },
});
