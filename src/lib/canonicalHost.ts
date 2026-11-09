/**
 * Redirects page requests on `www.<site domain>` to the bare domain, so search
 * engines index one host. The canonical tags already point at the bare domain;
 * this makes the www copies 301 instead of serving duplicates.
 *
 * Astro only trusts the Host header when `security.allowedDomains` is set, so
 * `context.url` reports `localhost` in production. The raw Host header is read
 * instead, and only the exact `www.` + site hostname is redirected — always to
 * the configured site, so a forged Host can't turn this into an open redirect.
 *
 * Only GET/HEAD requests outside `/api/` are redirected: a 301 turns a POST into
 * a GET, and webhooks or cron jobs may still call the www host.
 */
export function canonicalHostRedirect(
  url: URL,
  method: string,
  hostHeader: string | null,
  siteUrl: string | undefined,
): Response | null {
  if (!hostHeader || !siteUrl) return null;
  if (method !== 'GET' && method !== 'HEAD') return null;
  if (url.pathname === '/api' || url.pathname.startsWith('/api/')) return null;

  const site = new URL(siteUrl);
  const host = hostHeader.trim().toLowerCase().replace(/:\d+$/, '');
  if (host !== `www.${site.hostname.toLowerCase()}`) return null;

  const target = new URL(`${url.pathname}${url.search}`, site.origin);
  return new Response(null, {
    status: 301,
    headers: {
      Location: target.toString(),
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
