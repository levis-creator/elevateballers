/**
 * Tailwind config for the v2 public redesign ONLY.
 *
 * Wired via the `@config` directive at the top of src/styles/v2.css, so v2 pages
 * compile against these design tokens while the rest of the app keeps using the
 * main tailwind.config.mjs. This avoids collisions: v1 already defines `brand`
 * (as an object), `muted` and `accent`, which the flat v2 tokens below would
 * otherwise clobber.
 *
 * Tokens mirror the standalone design export (Elevate Ballers redesign).
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/layouts/v2/**/*.{astro,html,js,ts,jsx,tsx}',
    './src/features/**/presentation/v2/**/*.{astro,html,js,ts,jsx,tsx}',
    './src/features/**/v2/**/*.{astro,html,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: 'rgb(var(--site-brand-rgb, 228 0 43) / <alpha-value>)',
        brandlt: 'rgb(var(--site-brand-light-rgb, 255 45 67) / <alpha-value>)',
        brandsoft: 'rgb(var(--site-brand-soft-rgb, 255 90 114) / <alpha-value>)',
        brandfg: 'rgb(var(--site-brand-foreground-rgb, 255 255 255) / <alpha-value>)',
        ink: 'rgb(var(--site-ink-rgb, 20 16 9) / <alpha-value>)',
        ink2: 'rgb(var(--site-ink-rgb, 20 16 9) / <alpha-value>)',
        muted: 'rgb(var(--site-ink-muted-rgb, 111 102 92) / <alpha-value>)',
        muted2: 'rgb(var(--site-ink-soft-rgb, 138 129 122) / <alpha-value>)',
        paper: 'rgb(var(--site-paper-rgb, 245 243 239) / <alpha-value>)',
        paper2: 'rgb(var(--site-paper-soft-rgb, 250 248 244) / <alpha-value>)',
        panel: 'rgb(var(--site-paper-panel-rgb, 239 236 229) / <alpha-value>)',
        night: 'rgb(var(--site-night-rgb, 12 11 10) / <alpha-value>)',
        night2: 'rgb(var(--site-night-raised-rgb, 17 16 16) / <alpha-value>)',
        cream: 'rgb(var(--site-cream-rgb, 243 239 233) / <alpha-value>)',
        creamdim: 'rgb(var(--site-cream-dim-rgb, 184 175 166) / <alpha-value>)',
      },
      fontFamily: {
        display: ['var(--site-font-display, Anton)', 'sans-serif'],
        body: ['var(--site-font-body, Archivo)', 'sans-serif'],
        mono: ['var(--site-font-label, "Space Mono")', 'monospace'],
      },
      keyframes: {
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        marquee: 'marquee 34s linear infinite',
      },
    },
  },
};
