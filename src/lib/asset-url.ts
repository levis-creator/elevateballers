/**
 * Resolve asset URLs (logos, images) for display in the browser.
 * Relative paths without a leading slash (e.g. "images/logo.png") are resolved
 * relative to the site root so they work on any page (e.g. /teams/slug).
 */
export function resolveAssetUrl(
  url: string | null | undefined
): string | null {
  if (url == null || url === '') return null;
  const trimmed = url.trim();
  if (trimmed === '') return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (trimmed.startsWith('/')) {
    return trimmed;
  }
  return `/${trimmed}`;
}

/**
 * URL suitable for img src. Keeps the original URL; rewrites same-origin
 * http to https to avoid mixed content when the site is served over HTTPS.
 */
export function getDisplayImageUrl(
  url: string | null | undefined,
  currentOrigin?: string
): string | null {
  const resolved = resolveAssetUrl(url);
  if (!resolved) return null;
  if (resolved.startsWith('http://') && currentOrigin) {
    try {
      const originUrl = new URL(currentOrigin);
      const resolvedUrl = new URL(resolved);
      if (originUrl.hostname === resolvedUrl.hostname) {
        return resolved.replace(/^http:\/\//i, 'https://');
      }
    } catch {
      // ignore
    }
  }
  return resolved;
}
