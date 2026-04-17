// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  site: 'https://thelivingcraft.ai',
  output: 'static',
  adapter: netlify({ edgeMiddleware: true }),
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/admin/') && !page.includes('/api/'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
