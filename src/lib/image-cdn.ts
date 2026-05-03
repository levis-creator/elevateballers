/**
 * Routes Supabase Storage images through Vercel Image Optimization
 * (`/_vercel/image?url=…&w=…&q=…`) so they're resized, converted to WebP,
 * and served from Vercel's CDN instead of being downloaded full-resolution
 * from Supabase. Cuts ~13 MB of homepage weight when populated.
 *
 * The function is defensive: it only transforms URLs we know Vercel can
 * fetch (Supabase Storage, Sanity CDN). Local paths, data URIs, and
 * unknown remotes pass through unchanged so callers never have to
 * pre-validate inputs.
 *
 * Sizes you pass should match the largest expected display dimension at
 * 2× pixel density (so a 110 px logo → request width=220).
 */

const ALLOWED_REMOTE_HOSTS = [
  'zjnlvnyjsidnelgciqmz.supabase.co',
  'cdn.sanity.io',
];

function isOptimizable(src: string): boolean {
  if (!src) return false;
  if (src.startsWith('data:') || src.startsWith('blob:')) return false;
  if (src.startsWith('/')) return true; // same-origin path
  try {
    const u = new URL(src);
    return ALLOWED_REMOTE_HOSTS.includes(u.hostname);
  } catch {
    return false;
  }
}

export interface OptimizeOptions {
  /** Target render width in CSS px (multiply by 2 for retina). */
  width?: number;
  /** JPEG/WebP quality 1–100. Defaults to 75 — visually indistinguishable, ~half the bytes. */
  quality?: number;
}

export function optimizeImageUrl(
  src: string | null | undefined,
  opts: OptimizeOptions = {},
): string {
  if (!src) return '';
  if (!isOptimizable(src)) return src;

  const params = new URLSearchParams();
  params.set('url', src);
  if (opts.width) params.set('w', String(opts.width));
  params.set('q', String(opts.quality ?? 75));

  return `/_vercel/image?${params.toString()}`;
}
