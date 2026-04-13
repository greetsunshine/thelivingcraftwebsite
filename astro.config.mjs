// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  site: 'https://thelivingcraft.com',
  output: 'static',
  adapter: netlify({ edgeMiddleware: true }),
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
