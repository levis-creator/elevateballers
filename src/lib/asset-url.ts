/**
 * Resolve asset URLs (logos, images) for display in the browser.
 * Relative paths without a leading slash (e.g. "images/logo.png") are resolved
 * relative to the site root so they work on any page (e.g. /teams/slug).
 * Private folder URLs (starting with /api/uploads/private/) are passed through as-is.
 */
export function resolveAssetUrl(
  url: string | null | undefined
): string | null {
  if (url == null || url === '') return null;
  const trimmed = url.trim();
  if (trimmed === '') return null;
  
  // External URLs (http/https) - pass through
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  
  // Private folder URLs (API routes) - pass through as-is
  if (trimmed.startsWith('/api/uploads/private/')) {
    return trimmed;
  }
  
  // Public folder URLs (API routes) - pass through as-is
  if (trimmed.startsWith('/api/uploads/public/')) {
    return trimmed;
  }
  
  // Already absolute paths - pass through
  if (trimmed.startsWith('/')) {
    return trimmed;
  }
  
  // Relative paths - make absolute
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

/**
 * Check if a URL points to a private folder (requires authentication)
 */
export function isPrivateFolderUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes('/api/uploads/private/') || url.includes('/uploads/private/');
}

/**
 * Check if a URL points to a public folder
 */
export function isPublicFolderUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes('/api/uploads/public/') || url.includes('/uploads/public/');
}

/**
 * Check if a URL is an upload folder URL (public or private)
 */
export function isUploadFolderUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return isPrivateFolderUrl(url) || isPublicFolderUrl(url);
}
