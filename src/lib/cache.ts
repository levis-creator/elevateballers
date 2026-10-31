/**
 * Generic cache layer backed by Redis (local or Upstash, see ./redis)
 *
 * Every operation is wrapped in try/catch — if Redis is unavailable or errors,
 * the caller transparently falls through to a database query (cache miss).
 */

import { getRedisClient } from './redis';

/**
 * Read a cached value. Returns `null` on miss or if Redis is unavailable.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = await getRedisClient();
  if (!redis) return null;
  try {
    return await redis.get<T>(key);
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
  const redis = await getRedisClient();
  if (!redis) return;
  try {
    await redis.set(key, value, ttlSeconds);
  } catch (err) {
    console.warn(`[cache] SET "${key}" failed:`, err);
  }
}

/**
 * Delete a single cache key. No-op if Redis is unavailable.
 */
export async function cacheDel(key: string): Promise<void> {
  const redis = await getRedisClient();
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
  const redis = await getRedisClient();
  if (!redis) return;
  try {
    let cursor = '0';
    do {
      const [next, keys] = await redis.scan(cursor, pattern, 100);
      cursor = next;
      await redis.del(...keys);
    } while (cursor !== '0');
  } catch (err) {
    console.warn(`[cache] INVALIDATE "${pattern}" failed:`, err);
  }
}
