/**
 * Literal Tailwind class sets per side. Tailwind only generates classes it can
 * find verbatim in source, so team colours are never built by concatenation.
 */
export type Side = 'home' | 'away';

export const TONE = {
  home: {
    text: 'text-[var(--home)]',
    bg: 'bg-[var(--home)]',
    bgT: 'bg-[var(--homeT)]',
    border: 'border-[var(--home)]',
    ring: 'ring-[color:var(--home)]',
    hoverBgT: 'hover:bg-[var(--homeT)]',
    hoverBorder: 'hover:border-[var(--home)]',
    avatar: 'bg-[var(--homeT)] text-[var(--home)] ring-1 ring-[color:var(--home)]',
  },
  away: {
    text: 'text-[var(--away)]',
    bg: 'bg-[var(--away)]',
    bgT: 'bg-[var(--awayT)]',
    border: 'border-[var(--away)]',
    ring: 'ring-[color:var(--away)]',
    hoverBgT: 'hover:bg-[var(--awayT)]',
    hoverBorder: 'hover:border-[var(--away)]',
    avatar: 'bg-[var(--awayT)] text-[var(--away)] ring-1 ring-[color:var(--away)]',
  },
} as const;

export const kbdCls = 'ml-auto rounded border border-[var(--bord)] px-1 font-mono text-[9px] text-[var(--txm)]';
export const kbdOnLight =
  'rounded bg-[color-mix(in_srgb,var(--bg)_10%,transparent)] px-1 font-mono text-[10px] font-bold opacity-60';
export const kbdOnDark = 'rounded bg-white/20 px-1 font-mono text-[9px]';

export const card = 'rounded-2xl border border-[var(--bord)] bg-[var(--surf)]';
export const cardHead = 'flex items-center justify-between gap-3 border-b border-[var(--bord2)] px-4 py-3';
export const cardTitle = 'whitespace-nowrap font-anton text-[15px] uppercase';
export const microLabel = 'font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--faint)]';
export const metaLabel = 'font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--txm)]';

export const pipCls = (on: boolean) => `h-1.5 w-1.5 rounded-full ${on ? 'bg-[var(--tx)]' : 'bg-[var(--track)]'}`;

export const segCls = (on: boolean) =>
  `h-8 rounded-md px-3 text-[12px] font-semibold ${on ? 'bg-[var(--tx)] text-[var(--bg)]' : 'text-[var(--txd)] hover:text-[var(--tx)]'}`;
