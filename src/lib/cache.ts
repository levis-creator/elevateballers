/**
 * Generic cache layer backed by Upstash Redis
 *
 * Every operation is wrapped in try/catch — if Redis is unavailable or errors,
 * the caller transparently falls through to a database query (cache miss).
 */

import { redis } from './redis';

/**
 * Read a cached value. Returns `null` on miss or if Redis is unavailable.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const value = await redis.get<T>(key);
    return value ?? null;
  } catch (err) {
    console.warn(`[cache] GET "${key}" failed:`, err);
    return null;
  }
}

/**
 * Write a value to cache with a TTL (seconds). No-op if Redis is unavailable.
 */
export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number,
): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch (err) {
    console.warn(`[cache] SET "${key}" failed:`, err);
  }
}

/**
 * Delete a single cache key. No-op if Redis is unavailable.
 */
export async function cacheDel(key: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch (err) {
    console.warn(`[cache] DEL "${key}" failed:`, err);
  }
}

/**
 * Delete all keys matching a glob pattern (e.g. "standings:*").
 * Uses SCAN to avoid blocking Redis. No-op if Redis is unavailable.
 */
export async function cacheInvalidatePattern(pattern: string): Promise<void> {
  if (!redis) return;
  try {
    let cursor = 0;
    do {
      const result = await redis.scan(cursor, {
        match: pattern,
        count: 100,
      });
      cursor = Number(result[0]);
      const keys = result[1] as string[];
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== 0);
  } catch (err) {
    console.warn(`[cache] INVALIDATE "${pattern}" failed:`, err);
  }
}
