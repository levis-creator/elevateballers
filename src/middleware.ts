import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (_context, next) => {
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

  // V2 brand settings are emitted as CSS variables in the rendered document.
  // Apply this at the final response boundary because individual page routes
  // set their own CDN cache policy after layouts have rendered. Otherwise a
  // successfully saved colour can remain invisible until s-maxage expires.
  if (contentType?.toLowerCase().includes('text/html') && import.meta.env.PUBLIC_UI_VERSION === 'v2') {
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('CDN-Cache-Control', 'no-store');
    headers.set('Vercel-CDN-Cache-Control', 'no-store');
  }

  if (process.env.NODE_ENV === 'production') {
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  return response;
});
