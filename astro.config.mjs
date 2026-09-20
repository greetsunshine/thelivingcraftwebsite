// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import { readdirSync } from 'node:fs';

// The private downloads folder, listed at config time. `includeFiles` takes
// file paths, not globs, so this is how a new file rides along without a
// config edit. See downloads/README.md.
const privateDownloads = readdirSync('downloads').map((f) => `downloads/${f}`);

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
  // The private downloads folder rides inside the server function, so the
  // download gate can read a file that no URL can reach. See downloads/README.md.
  adapter: vercel({ includeFiles: privateDownloads }),
  // Vite's dev server serves any file under the project root by URL, which
  // would make /downloads/<file> reachable in development exactly the way
  // the private folder exists to prevent. Production never serves the folder
  // (only public/ becomes static output); this makes dev behave the same.
  vite: { server: { fs: { deny: ['**/downloads/**'] } } },
  redirects: {
    '/india': '/?region=india',
    '/dubai': '/?region=dubai',
    '/australia': '/?region=australia',
    // Two earlier addresses for the model selection tool. Both point at the
    // current one directly, so nobody follows a chain of two redirects.
    '/resources/contract-agent-test-kit': '/resources/model-selection-tool',
    '/resources/model-selection-checklist': '/resources/model-selection-tool',
  },
});
