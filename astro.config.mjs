// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// https://astro.build/config
// Render every route on demand. This keeps page generation, content loading,
// authentication and request-specific decisions on the server. Browser scripts
// are used only as progressive enhancement for interactive controls.
// Old per-region paths redirect to the single page with a ?region= param.
//
// The resources entry is a RETIREMENT, not a rename. The Contract Agent Test
// Kit was published, listed in the sitemap and in /llms.txt, and was then
// replaced by the generic checklist that covers the same ground for any step.
// A retired page that was indexed has to go somewhere a reader recognises, so
// it points at the piece that replaced it rather than returning a 404.
export default defineConfig({
  output: 'server',
  adapter: vercel(),
  redirects: {
    '/india': '/?region=india',
    '/dubai': '/?region=dubai',
    '/australia': '/?region=australia',
    '/resources/contract-agent-test-kit': '/resources/model-selection-checklist',
  },
});
