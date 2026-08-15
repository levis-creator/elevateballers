/**
 * Upstash Redis client, resolved dynamically
 *
 * Credentials are DB-first (Security → Uploads & Integrations), falling back
 * to UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN when unset, so an
 * admin can point the app at their own Upstash account without a redeploy.
 * The resolved client is cached briefly to avoid a settings lookup on every
 * call; gracefully degrades to `null` when credentials are missing or
 * Redis is unreachable. All consumers should handle a `null` return.
 */

import { Redis } from '@upstash/redis';
import { getEnv } from './env';
import { siteSettingsService } from '../features/settings';

const CACHE_TTL_MS = 30_000;

let cache: { expiresAt: number; identity: string; client: Redis | null } | null = null;

async function resolveCredentials(): Promise<{ url?: string; token?: string }> {
  const records = await siteSettingsService.list('security').catch(() => []);
  const dbUrl = records.find((record) => record.key === 'security_upstashRedisUrl')?.value;
  const dbToken = records.find((record) => record.key === 'security_upstashRedisToken')?.value;
  return {
    url: dbUrl || getEnv('UPSTASH_REDIS_REST_URL'),
    token: dbToken || getEnv('UPSTASH_REDIS_REST_TOKEN'),
  };
}

/** Resolved Upstash client, or `null` when unconfigured. Cached for ~30s. */
export async function getRedisClient(): Promise<Redis | null> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache.client;

  const { url, token } = await resolveCredentials();
  const identity = `${url ?? ''}:${token ?? ''}`;
  if (cache && cache.identity === identity) {
    cache = { ...cache, expiresAt: now + CACHE_TTL_MS };
    return cache.client;
  }

  const client = url && token ? new Redis({ url, token }) : null;
  cache = { expiresAt: now + CACHE_TTL_MS, identity, client };
  return client;
}

export async function isRedisAvailable(): Promise<boolean> {
  return (await getRedisClient()) !== null;
}
