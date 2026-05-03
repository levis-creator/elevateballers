import { defineMiddleware } from 'astro:middleware';
import { syncPermissions } from './lib/syncPermissions';

// Runs once per server process — all concurrent first requests
// await the same promise so the sync never executes more than once.
let syncPromise: Promise<void> | null = null;

export const onRequest = defineMiddleware(async (_context, next) => {
  if (!syncPromise) {
    syncPromise = syncPermissions().catch((err) => {
      console.error('[permissions] Auto-sync failed:', err);
      syncPromise = null; // allow retry on the next request
    });
  }

  await syncPromise;

  const response = await next();

  // Audit logging moved OUT of middleware — it was causing an extra DB write
  // on every mutation, blocking responses and duplicating logs that individual
  // endpoints already record. Endpoints still call logAudit() explicitly where
  // it matters (high-value actions); high-frequency mutations (events, clock
  // toggles, subs) are no longer audit-logged twice.

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Guarantee Content-Type charset on HTML responses. Astro/Vercel usually
  // emits "text/html; charset=utf-8", but the parameter can be dropped at
  // the edge — Seobility flags this. Only touches HTML; APIs and binary
  // assets keep their own Content-Type untouched.
  const contentType = response.headers.get('Content-Type');
  if (contentType && contentType.toLowerCase().includes('text/html') && !/charset=/i.test(contentType)) {
    response.headers.set('Content-Type', `${contentType}; charset=UTF-8`);
  }

  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  return response;
});
