// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel';
import { fileURLToPath } from 'url';
import { resolve } from 'path';

// Determine adapter based on environment variable
// Set DEPLOY_TARGET=vercel for Vercel, or DEPLOY_TARGET=cpanel (or unset) for cPanel
const deployTarget = process.env.DEPLOY_TARGET || 'cpanel';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  output: 'server',
  adapter: deployTarget === 'vercel' 
    ? vercel({
        functionPerRoute: false,
        webAnalytics: {
          enabled: true,
        },
      })
    : node({
        mode: 'standalone'
      }),
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