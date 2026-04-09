/**
 * Rate limiter with Upstash Redis (primary) and in-memory fallback.
 *
 * Uses @upstash/ratelimit when Redis is available. If Redis is down or
 * credentials are missing, falls back to the original in-memory Map store
 * so the app keeps working on single-instance deployments.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { redis } from './redis';

// ---------------------------------------------------------------------------
// In-memory fallback store (original implementation)
// ---------------------------------------------------------------------------

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

// Prune expired entries every 10 minutes to prevent unbounded growth
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 10 * 60 * 1000);

function memoryCheck(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= max) return false;

  entry.count++;
  return true;
}

function memoryRetryAfter(key: string): number {
  const entry = store.get(key);
  if (!entry) return 0;
  const remaining = entry.resetAt - Date.now();
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

// ---------------------------------------------------------------------------
// Upstash Ratelimit helpers
// ---------------------------------------------------------------------------

/**
 * Cache of Ratelimit instances keyed by "max:windowMs" so we don't recreate
 * them on every call.
 */
const limiters = new Map<string, Ratelimit>();

function getLimiter(max: number, windowMs: number): Ratelimit | null {
  if (!redis) return null;

  const cacheKey = `${max}:${windowMs}`;
  let limiter = limiters.get(cacheKey);
  if (limiter) return limiter;

  // Convert milliseconds to the closest human-readable window string
  const windowStr = msToWindow(windowMs);

  limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(max, windowStr),
    prefix: 'rl',
  });

  limiters.set(cacheKey, limiter);
  return limiter;
}

/** Convert milliseconds to an @upstash/ratelimit window string. */
function msToWindow(ms: number): `${number} ${'ms' | 's' | 'm' | 'h' | 'd'}` {
  if (ms >= 86_400_000 && ms % 86_400_000 === 0) return `${ms / 86_400_000} d`;
  if (ms >= 3_600_000 && ms % 3_600_000 === 0) return `${ms / 3_600_000} h`;
  if (ms >= 60_000 && ms % 60_000 === 0) return `${ms / 60_000} m`;
  if (ms >= 1_000 && ms % 1_000 === 0) return `${ms / 1_000} s`;
  return `${ms} ms`;
}

// ---------------------------------------------------------------------------
// Public API — same signatures as before, now async
// ---------------------------------------------------------------------------

/**
 * Returns true if the request is allowed, false if it should be blocked.
 */
export async function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
): Promise<boolean> {
  const limiter = getLimiter(max, windowMs);
  if (!limiter) return memoryCheck(key, max, windowMs);

  try {
    const { success } = await limiter.limit(key);
    return success;
  } catch (err) {
    console.warn('[rateLimit] Redis failed, using in-memory fallback:', err);
    return memoryCheck(key, max, windowMs);
  }
}

/** Reset rate limit for a key (e.g. after a successful login). */
export async function resetRateLimit(key: string): Promise<void> {
  store.delete(key);
  if (redis) {
    try {
      // Delete all Upstash ratelimit keys for this identifier
      await redis.del(`rl:${key}`);
    } catch {
      // Best-effort — in-memory was already cleared
    }
  }
}

/** Returns seconds until the rate limit window resets, or 0 if not limited. */
export async function getRateLimitRetryAfter(
  key: string,
): Promise<number> {
  // In-memory fallback always available
  return memoryRetryAfter(key);
}
