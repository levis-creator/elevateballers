// @ts-check
import { defineConfig, envField } from 'astro/config';
import react from '@astrojs/react';
import alpinejs from '@astrojs/alpinejs';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel';
import { fileURLToPath } from 'url';
import { resolve } from 'path';

// Determine adapter based on environment variable
// Set DEPLOY_TARGET=vercel for Vercel, or DEPLOY_TARGET=cpanel (or unset) for cPanel
const deployTarget = process.env.DEPLOY_TARGET || 'cpanel';

// Injects the site-wide Tailwind layers into every page, as the retired
// @astrojs/tailwind integration did. Tailwind itself runs from postcss.config.mjs.
const tailwindBaseStyles = {
  name: 'tailwind-base-styles',
  hooks: {
    'astro:config:setup': ({ injectScript }) => {
      injectScript('page-ssr', "import '/src/styles/tailwind-base.css';");
    },
  },
};

// https://astro.build/config
export default defineConfig({
  site: 'https://elevateballers.com',
  // Sitemap generation is runtime-managed by src/pages/sitemap.xml.ts so the
  // Site Settings → SEO switch and excluded paths are always respected.
  integrations: [react(), tailwindBaseStyles, alpinejs()],
  output: 'server',
  // Astro 7 defaults to JSX-style whitespace collapsing, which would join
  // adjacent inline elements; keep the previous HTML compression.
  compressHTML: true,
  // Enable link prefetching so `data-astro-prefetch` hints actually fetch.
  // Default strategy is hover; the admin uses <ClientRouter /> for SPA-style nav.
  prefetch: true,
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
      includeFiles: ['./src/assets/fonts/Rubik-Regular.ttf', './src/assets/fonts/Rubik-SemiBold.ttf', './src/assets/fonts/Rubik-Bold.ttf', './src/assets/fonts/Rubik-ExtraBold.ttf', './src/assets/fonts/Rubik-Black.ttf', ...[
        'anton-latin-400-normal.woff', 'archivo-black-latin-400-normal.woff',
        'archivo-latin-400-normal.woff', 'archivo-latin-700-normal.woff',
        'inter-latin-400-normal.woff', 'inter-latin-700-normal.woff',
        'space-mono-latin-400-normal.woff', 'space-mono-latin-700-normal.woff',
        'ibm-plex-mono-latin-400-normal.woff', 'ibm-plex-mono-latin-700-normal.woff',
      ].map((file) => `./src/assets/fonts/stat-sheet/${file}`)],
    })
    : node({
      mode: 'standalone'
    }),
  trailingSlash: 'ignore',
  env: {
    schema: {
      PUBLIC_TURNSTILE_SITE_KEY: envField.string({ context: 'client', access: 'public' }),
      TURNSTILE_SECRET_KEY: envField.string({ context: 'server', access: 'secret' }),
      // Public UI toggle. 'v1' = current site, 'v2' = redesign.
      // Defaults to 'v1' so the new UI ships dormant and is opt-in per environment.
      // NOTE: PUBLIC_* vars are inlined at build time — flipping this requires a
      // rebuild/redeploy (a zero-code, one-click revert), not a live env change.
      PUBLIC_UI_VERSION: envField.string({ context: 'client', access: 'public', default: 'v1', optional: true }),
      // Admin UI toggle — SEPARATE from PUBLIC_UI_VERSION so the admin console
      // (login/OTP) rolls out/back independently of the public site.
      // 'v1' = legacy CMS forms, 'v2' = redesign. Defaults to 'v1'.
      PUBLIC_ADMIN_UI_VERSION: envField.string({ context: 'client', access: 'public', default: 'v1', optional: true }),
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
      // Force a single React instance across every island's module graph.
      // Without this, Vite's dev dep-optimizer can serve a second React copy
      // when new client components are added, breaking hooks ("Invalid hook
      // call / more than one copy of React").
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      // Keep dependencies used by lazy admin chunks in one optimizer graph.
      // This prevents Vite's dev server from returning 504 Outdated Optimize
      // Dep responses when the news editor chunk is requested for the first time.
      include: ['react-masonry-css', '@radix-ui/react-checkbox', 'sanitize-html', 'quill', 'zustand'],
    },
    ssr: {
      noExternal: ['react-masonry-css'],
      // Keep @prisma/client external only for cPanel (CJS interop)
      // For Vercel, bundle it with the serverless function
      external: deployTarget === 'cpanel' ? ['@prisma/client', '@prisma/adapter-mariadb'] : [],
    },
    server: {
      watch: {
        // Production builds can run while the dev server is open. Do not let
        // their generated output create thousands of Windows watcher handles.
        ignored: ['**/dist/**', '**/.vercel/**', '**/.astro/**'],
      },
      fs: {
        // Allow serving files from one level up to the project root
        allow: ['..'],
      },
    },
  },
});
