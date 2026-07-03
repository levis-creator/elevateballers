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
        brand: '#e4002b',
        brandlt: '#ff2d43',
        brandsoft: '#ff5a72',
        ink: '#141009',
        ink2: '#1a1712',
        muted: '#6f665c',
        muted2: '#8a817a',
        paper: '#f5f3ef',
        paper2: '#faf8f4',
        panel: '#efece5',
        night: '#0c0b0a',
        night2: '#111010',
        cream: '#f3efe9',
        creamdim: '#b8afa6',
      },
      fontFamily: {
        display: ['Anton', 'sans-serif'],
        body: ['Archivo', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
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
