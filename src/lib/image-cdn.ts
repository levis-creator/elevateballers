/**
 * Routes remote images through an image CDN so they're resized and converted
 * to modern formats instead of being downloaded full-resolution. Cuts ~13 MB
 * of homepage weight when populated.
 *
 * - On Vercel: Vercel Image Optimization (`/_vercel/image?url=…&w=…&q=…`).
 * - Elsewhere, when PUBLIC_IMAGE_TRANSFORMS is "cloudflare" (set at build
 *   time): Cloudflare image transformations (`/cdn-cgi/image/<options>/<src>`).
 *   The zone must have transformations enabled and these hosts allowed as
 *   sources. The free plan covers 5,000 unique transformations a month.
 * - Otherwise the original URL is returned.
 *
 * The function is defensive: it only transforms URLs the active CDN is set
 * up to fetch. Local paths, data URIs, and unknown remotes pass through
 * unchanged so callers never have to pre-validate inputs.
 *
 * Sizes you pass should match the largest expected display dimension at
 * 2× pixel density (so a 110 px logo → request width=220).
 */

// Must match `imagesConfig.domains` in astro.config.mjs.
const VERCEL_REMOTE_HOSTS = [
  'zjnlvnyjsidnelgciqmz.supabase.co',
  'cdn.sanity.io',
];

// Must match the zone's allowed transformation origins in Cloudflare.
const CLOUDFLARE_REMOTE_HOSTS = [
  'cdn.elevateballers.com',
  'zjnlvnyjsidnelgciqmz.supabase.co',
];

function isOptimizable(src: string, hosts: string[]): boolean {
  if (!src) return false;
  if (src.startsWith('data:') || src.startsWith('blob:')) return false;
  if (src.startsWith('/')) return !src.startsWith('//'); // same-origin path
  try {
    const u = new URL(src);
    return u.protocol === 'https:' && hosts.includes(u.hostname);
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
  // Already optimised upstream (e.g. by a data loader): don't wrap it twice.
  if (src.startsWith('/cdn-cgi/image/') || src.startsWith('/_vercel/image')) return src;
  const quality = opts.quality ?? 75;

  if (import.meta.env.DEPLOY_TARGET === 'vercel') {
    if (!isOptimizable(src, VERCEL_REMOTE_HOSTS)) return src;
    const params = new URLSearchParams();
    params.set('url', src);
    if (opts.width) params.set('w', String(opts.width));
    params.set('q', String(quality));
    return `/_vercel/image?${params.toString()}`;
  }

  if (import.meta.env.PUBLIC_IMAGE_TRANSFORMS === 'cloudflare') {
    if (!isOptimizable(src, CLOUDFLARE_REMOTE_HOSTS)) return src;
    // onerror=redirect serves the original if a transformation fails (for
    // example once the monthly free quota is used up).
    const options = [
      opts.width ? `width=${opts.width}` : null,
      `quality=${quality}`,
      'format=auto',
      'onerror=redirect',
    ].filter(Boolean).join(',');
    return `/cdn-cgi/image/${options}${src.startsWith('/') ? '' : '/'}${src}`;
  }

  return src;
}
