// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel';
import { fileURLToPath } from 'url';
import { resolve } from 'path';

// Determine adapter based on environment variable
// Set DEPLOY_TARGET=vercel for Vercel, or DEPLOY_TARGET=cpanel (or unset) for cPanel
const deployTarget = process.env.DEPLOY_TARGET || 'cpanel';

// https://astro.build/config
export default defineConfig({
  integrations: [react(), tailwind()],
  output: 'server',
  adapter: deployTarget === 'vercel'
    ? vercel({
      webAnalytics: {
        enabled: true,
      },
    })
    : node({
      mode: 'standalone'
    }),
  trailingSlash: 'ignore',
  image: {
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }],
  },
  vite: {
    resolve: {
      alias: {
        '@': resolve(fileURLToPath(new URL('.', import.meta.url)), './src'),
      },
    },
    optimizeDeps: {
      include: ['react-masonry-css'],
    },
    ssr: {
      noExternal: ['react-masonry-css'],
      // Keep @prisma/client external only for cPanel (CJS interop)
      // For Vercel, bundle it with the serverless function
      external: deployTarget === 'cpanel' ? ['@prisma/client', '@prisma/adapter-mariadb'] : [],
    },
    server: {
      fs: {
        // Allow serving files from one level up to the project root
        allow: ['..'],
      },
    },
  },
});