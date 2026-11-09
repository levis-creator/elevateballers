/**
 * Redirects page requests on `www.<domain>` to the bare domain, so search
 * engines index one host. The canonical tags already point at the bare domain;
 * this makes the www copies 301 instead of serving duplicates.
 *
 * Only GET/HEAD requests outside `/api/` are redirected: a 301 turns a POST into
 * a GET, and webhooks or cron jobs may still call the www host.
 */
export function canonicalHostRedirect(url: URL, method: string): Response | null {
  if (!url.hostname.startsWith('www.')) return null;
  if (method !== 'GET' && method !== 'HEAD') return null;
  if (url.pathname === '/api' || url.pathname.startsWith('/api/')) return null;

  const target = new URL(url.toString());
  target.hostname = url.hostname.slice(4);
  target.protocol = 'https:';
  target.port = '';
  return new Response(null, {
    status: 301,
    headers: {
      Location: target.toString(),
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
