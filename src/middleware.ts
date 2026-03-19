import { defineMiddleware } from 'astro:middleware';
import { syncPermissions } from './lib/syncPermissions';
import { logAudit } from './features/cms/lib/audit';

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

  try {
    const { request } = _context;
    const url = new URL(request.url);
    const method = request.method.toUpperCase();
    const isMutation = method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';
    if (isMutation && url.pathname.startsWith('/api/')) {
      await logAudit(
        request,
        response.ok ? 'API_MUTATION' : 'API_MUTATION_FAILED',
        {
          method,
          path: url.pathname,
          status: response.status,
          ok: response.ok,
        },
        undefined,
        'middleware'
      );
    }
  } catch (error) {
    console.error('[audit] Failed to record API mutation:', error);
  }

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  return response;
});
