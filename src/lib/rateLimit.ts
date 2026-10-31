/**
 * Rate limiter with Redis (primary) and in-memory fallback.
 *
 * Uses a fixed-window counter in Redis when it is available, so every app
 * process shares one count. If Redis is down or unconfigured, falls back to
 * the original in-memory Map store so the app keeps working.
 */

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

const redisKey = (key: string) => `rl:${key}`;

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
  const redis = await getRedisClient();
  if (!redis) return memoryCheck(key, max, windowMs);

  try {
    const { count, ttlMs } = await redis.incrWindow(redisKey(key), windowMs);
    distributedResets.set(key, Date.now() + (ttlMs > 0 ? ttlMs : windowMs));
    return count <= max;
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
      await redis.del(redisKey(key));
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
