// @ts-check
import { defineConfig, envField } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel';
import { fileURLToPath } from 'url';
import { resolve } from 'path';

import sitemap from '@astrojs/sitemap';

// Determine adapter based on environment variable
// Set DEPLOY_TARGET=vercel for Vercel, or DEPLOY_TARGET=cpanel (or unset) for cPanel
const deployTarget = process.env.DEPLOY_TARGET || 'cpanel';

// https://astro.build/config
export default defineConfig({
  site: 'https://elevateballers.com',
  integrations: [react(), tailwind(), sitemap()],
  output: 'server',
  adapter: deployTarget === 'vercel'
    ? vercel({
      webAnalytics: {
        enabled: true,
      },
      // Enable Vercel Image Optimization. Components call `optimizeImageUrl()`
      // (src/lib/image-cdn.ts) which constructs `/_vercel/image?url=...&w=...`
      // URLs. Source domains must be allowlisted below or Vercel rejects
      // the request. 1000 transformations/month are free on the Hobby plan.
      imageService: true,
      imagesConfig: {
        sizes: [80, 120, 160, 200, 300, 400, 600, 800, 1200, 1600],
        domains: ['zjnlvnyjsidnelgciqmz.supabase.co', 'cdn.sanity.io'],
        formats: ['image/webp'],
      },
      // OG image generation (src/pages/api/matches/[id]/og.png.ts) reads
      // these font files at runtime via fs.readFile, so they must be bundled
      // into the serverless function output.
      includeFiles: ['./src/assets/fonts/Rubik-Regular.ttf', './src/assets/fonts/Rubik-SemiBold.ttf', './src/assets/fonts/Rubik-Bold.ttf', './src/assets/fonts/Rubik-ExtraBold.ttf', './src/assets/fonts/Rubik-Black.ttf'],
    })
    : node({
      mode: 'standalone'
    }),
  trailingSlash: 'ignore',
  env: {
    schema: {
      PUBLIC_TURNSTILE_SITE_KEY: envField.string({ context: 'client', access: 'public' }),
      TURNSTILE_SECRET_KEY: envField.string({ context: 'server', access: 'secret' }),
    },
  },
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