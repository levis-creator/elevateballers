/**
 * Turns an admin-entered external link (sponsor sites and the like) into a
 * safe absolute URL, or null when it can't be one. Without a scheme, browsers
 * and crawlers treat "www.example.com" or "http//example.com" as a path on
 * this site, which produced endless junk URLs like /players/x/http/www,…
 */
export function normalizeExternalUrl(raw: string | null | undefined): string | null {
  let value = String(raw ?? '').trim();
  if (!value) return null;

  // "http//example.com" / "https//example.com": the colon was dropped.
  value = value.replace(/^(https?)\/\//i, '$1://');
  // "www.example.com" or "example.com": assume https.
  if (!/^[a-z][a-z0-9+.-]*:/i.test(value)) value = `https://${value.replace(/^\/+/, '')}`;

  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(url.hostname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}
