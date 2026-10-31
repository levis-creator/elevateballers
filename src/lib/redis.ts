/**
 * Redis client, resolved dynamically
 *
 * REDIS_URL (a TCP `redis://` URL or a `unix:///path/to/redis.sock` socket,
 * e.g. a Redis on the same cPanel server) takes priority. Otherwise Upstash
 * credentials are used, DB-first (Security → Uploads & Integrations) with
 * UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN as the fallback, so an
 * admin can point the app at their own Upstash account without a redeploy.
 *
 * Both backends sit behind the small `RedisStore` interface below. The
 * resolved store is cached briefly to avoid a settings lookup on every call;
 * it gracefully degrades to `null` when nothing is configured. All consumers
 * should handle a `null` return and treat a thrown error as a cache miss.
 */

import IORedis from 'ioredis';
import { Redis as UpstashRedis } from '@upstash/redis';
import { getEnv } from './env';
import { siteSettingsService } from '../features/settings';

export interface RedisStore {
  get<T>(key: string): Promise<T | null>;
  /** Stores `value` as JSON for `ttlSeconds`. */
  set(key: string, value: unknown, ttlSeconds: number): Promise<void>;
  del(...keys: string[]): Promise<void>;
  /** One SCAN step: returns the next cursor ('0' when done) and matched keys. */
  scan(cursor: string, match: string, count: number): Promise<[string, string[]]>;
  /** Increments `key`, starting a `windowMs` expiry on first use. */
  incrWindow(key: string, windowMs: number): Promise<{ count: number; ttlMs: number }>;
}

const CACHE_TTL_MS = 30_000;

// INCR plus a PEXPIRE on the first hit, in one round trip. Works on any
// Redis version and on Upstash, which also runs Lua.
const INCR_WINDOW_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
return {count, redis.call('PTTL', KEYS[1])}
`;

const parse = <T>(raw: string | null): T | null => {
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return raw as unknown as T;
  }
};

function createLocalStore(url: string): RedisStore {
  const options = {
    // Fail fast so callers fall back instead of queueing commands while Redis is down.
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    connectTimeout: 2_000,
  };
  const client = url.startsWith('unix:')
    ? new IORedis({ ...options, path: new URL(url).pathname })
    : new IORedis(url, options);
  // Without a listener, connection errors would be thrown as unhandled events.
  client.on('error', (error) => console.warn('[redis] connection error:', error.message));

  return {
    async get(key) {
      return parse(await client.get(key));
    },
    async set(key, value, ttlSeconds) {
      await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    },
    async del(...keys) {
      if (keys.length) await client.del(...keys);
    },
    async scan(cursor, match, count) {
      return client.scan(cursor, 'MATCH', match, 'COUNT', count);
    },
    async incrWindow(key, windowMs) {
      const [count, ttlMs] = (await client.eval(INCR_WINDOW_SCRIPT, 1, key, windowMs)) as [number, number];
      return { count, ttlMs };
    },
  };
}

function createUpstashStore(url: string, token: string): RedisStore {
  const client = new UpstashRedis({ url, token });
  return {
    async get<T>(key: string) {
      return (await client.get<T>(key)) ?? null;
    },
    async set(key, value, ttlSeconds) {
      await client.set(key, value, { ex: ttlSeconds });
    },
    async del(...keys) {
      if (keys.length) await client.del(...keys);
    },
    async scan(cursor, match, count) {
      const [next, keys] = await client.scan(cursor, { match, count });
      return [String(next), keys as string[]];
    },
    async incrWindow(key, windowMs) {
      const [count, ttlMs] = (await client.eval(INCR_WINDOW_SCRIPT, [key], [windowMs])) as [number, number];
      return { count, ttlMs };
    },
  };
}

let cache: { expiresAt: number; identity: string; client: RedisStore | null } | null = null;

async function resolveConfig(): Promise<{ redisUrl?: string; url?: string; token?: string }> {
  const redisUrl = getEnv('REDIS_URL');
  if (redisUrl) return { redisUrl };
  const records = await siteSettingsService.list('security').catch(() => []);
  const dbUrl = records.find((record) => record.key === 'security_upstashRedisUrl')?.value;
  const dbToken = records.find((record) => record.key === 'security_upstashRedisToken')?.value;
  return {
    url: dbUrl || getEnv('UPSTASH_REDIS_REST_URL'),
    token: dbToken || getEnv('UPSTASH_REDIS_REST_TOKEN'),
  };
}

/** Resolved Redis store, or `null` when unconfigured. Cached for ~30s. */
export async function getRedisClient(): Promise<RedisStore | null> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache.client;

  const { redisUrl, url, token } = await resolveConfig();
  const identity = redisUrl ? `local:${redisUrl}` : `upstash:${url ?? ''}:${token ?? ''}`;
  if (cache && cache.identity === identity) {
    cache = { ...cache, expiresAt: now + CACHE_TTL_MS };
    return cache.client;
  }

  const client = redisUrl
    ? createLocalStore(redisUrl)
    : url && token
      ? createUpstashStore(url, token)
      : null;
  cache = { expiresAt: now + CACHE_TTL_MS, identity, client };
  return client;
}

export async function isRedisAvailable(): Promise<boolean> {
  return (await getRedisClient()) !== null;
}
