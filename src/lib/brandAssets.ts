// The site logo as a build asset: a small WebP with a hashed /_astro/ name,
// so browsers and Cloudflare cache it for a year. The original PNG in
// public/logo stays for emails and the stat-sheet PDF, which need PNG.
import elevateLogoUrl from '../assets/logo/elevate-logo.webp?url';

export const ELEVATE_LOGO_URL: string = elevateLogoUrl;

const DEFAULT_LOGO_PATHS = new Set(['assets/elevate-logo.png', '/logo/Elevate_Logo.png']);

/** Maps the stored default-logo paths to the optimised logo; other paths pass through. */
export function resolveDefaultLogo(path: string): string {
  return DEFAULT_LOGO_PATHS.has(path) ? ELEVATE_LOGO_URL : path;
}
