// @ts-check
// Local production config using Node adapter for testing
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import { fileURLToPath } from 'url';
import { resolve } from 'path';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  trailingSlash: 'ignore',
  vite: {
    resolve: {
      alias: {
        '@': resolve(fileURLToPath(new URL('.', import.meta.url)), './src'),
      },
    },
    optimizeDeps: {
      include: ['lucide-react'],
    },
    ssr: {
      noExternal: ['lucide-react'],
    },
  },
});

