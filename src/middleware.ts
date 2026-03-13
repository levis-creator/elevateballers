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

  return next();
});
