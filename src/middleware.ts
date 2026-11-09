import { defineMiddleware } from 'astro:middleware';
import { htmlCacheControl } from './lib/htmlCacheControl';
import { resolveLegacyPath } from './lib/legacyUrls';
import { legacyUrlResponse } from './lib/legacyUrlResponse';
import { canonicalHostRedirect } from './lib/canonicalHost';

function cacheControlFor(pathname: string, signedIn: boolean, pagePolicy: string | null): string | null {
  return htmlCacheControl({
    pathname,
    signedIn,
    pagePolicy,
    publicCaching: import.meta.env.PUBLIC_UI_VERSION === 'v2',
  });
}

export const onRequest = defineMiddleware(async (context, next) => {
  // One canonical host for search engines: www.elevateballers.com → elevateballers.com.
  // Only page reads are redirected; API calls (webhooks, cron jobs, form posts)
  // keep working on either host, since a 301 would turn a POST into a GET.
  const wwwRedirect = canonicalHostRedirect(context.url, context.request.method);
  if (wwwRedirect) return wwwRedirect;

  // Old WordPress URLs: redirect to the new page or answer 410 Gone.
  const legacy = resolveLegacyPath(context.url.pathname);
  if (legacy) {
    const legacyResponse = await legacyUrlResponse(legacy);
    if (legacyResponse) return legacyResponse;
  }

  const response = await next();
  // Mutate Astro's response in place. Re-wrapping a streaming response with
  // `new Response(response.body, ...)` can make Astro attempt to write to a
  // response that has already started.
  const headers = response.headers;

  // Audit logging moved OUT of middleware — it was causing an extra DB write
  // on every mutation, blocking responses and duplicating logs that individual
  // endpoints already record. Endpoints still call logAudit() explicitly where
  // it matters (high-value actions); high-frequency mutations (events, clock
  // toggles, subs) are no longer audit-logged twice.

  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Guarantee Content-Type charset on HTML responses. Astro/Vercel usually
  // emits "text/html; charset=utf-8", but the parameter can be dropped at
  // the edge — Seobility flags this. Only touches HTML; APIs and binary
  // assets keep their own Content-Type untouched.
  const contentType = headers.get('Content-Type');
  if (contentType && contentType.toLowerCase().includes('text/html') && !/charset=/i.test(contentType)) {
    headers.set('Content-Type', `${contentType}; charset=UTF-8`);
  }

  // Public V2 pages are server-rendered for SEO, but they are also read-heavy,
  // so Cloudflare caches them briefly (its cache rule only stores HTML that
  // says it may, and skips requests carrying the auth cookie). Anything that
  // can differ per visitor must never be cached: a logged-in request (match
  // pages show staff extra detail), and pages built around the current user.
  if (contentType?.toLowerCase().includes('text/html')) {
    const policy = cacheControlFor(context.url.pathname, context.cookies.has('auth-token'), headers.get('Cache-Control'));
    if (policy) {
      headers.set('Cache-Control', policy);
      headers.set('CDN-Cache-Control', policy);
      headers.set('Vercel-CDN-Cache-Control', policy);
    }
  }

  if (process.env.NODE_ENV === 'production') {
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  return response;
});
