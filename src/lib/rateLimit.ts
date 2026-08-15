/**
 * Rate limiter with Upstash Redis (primary) and in-memory fallback.
 *
 * Uses @upstash/ratelimit when Redis is available. If Redis is down or
 * credentials are missing, falls back to the original in-memory Map store
 * so the app keeps working on single-instance deployments.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { getRedisClient } from './redis';

// ---------------------------------------------------------------------------
// In-memory fallback store (original implementation)
// ---------------------------------------------------------------------------

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();
const distributedResets = new Map<string, number>();

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
 * them on every call. Invalidated whenever the underlying Redis client
 * changes (e.g. an admin points the app at a different Upstash account),
 * since a stale limiter would keep talking to the old instance.
 */
const limiters = new Map<string, Ratelimit>();
let lastRedisClient: Awaited<ReturnType<typeof getRedisClient>> | undefined;

async function getLimiter(max: number, windowMs: number): Promise<Ratelimit | null> {
  const redis = await getRedisClient();
  if (redis !== lastRedisClient) {
    limiters.clear();
    lastRedisClient = redis;
  }
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
  const limiter = await getLimiter(max, windowMs);
  if (!limiter) return memoryCheck(key, max, windowMs);

  try {
    const { success, reset } = await limiter.limit(key);
    distributedResets.set(key, reset);
    return success;
  } catch (err) {
    console.warn('[rateLimit] Redis failed, using in-memory fallback:', err);
    distributedResets.delete(key);
    return memoryCheck(key, max, windowMs);
  }
}

/** Reset rate limit for a key (e.g. after a successful login). */
export async function resetRateLimit(key: string): Promise<void> {
  store.delete(key);
  distributedResets.delete(key);
  const redis = await getRedisClient();
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
  const distributedReset = distributedResets.get(key);
  if (distributedReset !== undefined) {
    const remaining = distributedReset - Date.now();
    if (remaining > 0) return Math.ceil(remaining / 1000);
    distributedResets.delete(key);
  }
  return memoryRetryAfter(key);
}

/** Build a consistent JSON 429 response for protected mutation endpoints. */
export function rateLimitResponse(
  retryAfterSeconds: number,
  message = 'Too many requests. Please try again later.',
): Response {
  const retryAfter = Math.max(1, Math.ceil(retryAfterSeconds));
  return new Response(JSON.stringify({ error: message, retryAfter }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': String(retryAfter),
    },
  });
}

/** Apply a scoped limiter and return a response when the request is blocked. */
export async function enforceRateLimit(
  key: string,
  max: number,
  windowMs: number,
  message?: string,
): Promise<Response | null> {
  if (await checkRateLimit(key, max, windowMs)) return null;
  return rateLimitResponse(await getRateLimitRetryAfter(key), message);
}
