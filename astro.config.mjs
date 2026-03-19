// @ts-check
import { defineConfig } from 'astro/config';
import sentry from '@sentry/astro';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://plainhirecheck.com',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  build: { inlineStylesheets: 'auto' },
  vite: {
    plugins: [tailwindcss()],
    build: { target: 'es2022' },
  },
  integrations: [
    sentry({
      dsn: 'https://9e120235f5c15edbed9c03649d9ba06c@o4510827630231552.ingest.de.sentry.io/4511071641469008',
      sourceMapsUploadOptions: { enabled: false },
    }),
  ],
});