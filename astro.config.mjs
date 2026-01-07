// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import { fileURLToPath } from 'url';
import { resolve } from 'path';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  adapter: vercel(),
  trailingSlash: 'ignore',
  vite: {
    resolve: {
      alias: {
        '@': resolve(fileURLToPath(new URL('.', import.meta.url)), './src'),
      },
    },
    optimizeDeps: {
      include: ['lucide-react', 'react-masonry-css'],
    },
    ssr: {
      noExternal: ['lucide-react', 'react-masonry-css'],
    },
  },
});