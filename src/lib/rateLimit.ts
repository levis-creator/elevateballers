/**
 * Simple in-memory rate limiter.
 * Suitable for single-instance deployments. For multi-instance, swap the
 * store for a shared Redis client.
 */

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

/**
 * Returns true if the request is allowed, false if it should be blocked.
 * @param key       Unique key, e.g. `login:${ip}` or `otp:${userId}`
 * @param max       Maximum allowed attempts within the window
 * @param windowMs  Window duration in milliseconds
 */
export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
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

/** Reset rate limit for a key (e.g. after a successful login). */
export function resetRateLimit(key: string): void {
  store.delete(key);
}

/** Returns seconds until the rate limit window resets, or 0 if not limited. */
export function getRateLimitRetryAfter(key: string): number {
  const entry = store.get(key);
  if (!entry) return 0;
  const remaining = entry.resetAt - Date.now();
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}
