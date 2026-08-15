import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { getEnv } from './env';
import { siteSettingsService } from '../features/settings';

dotenv.config();

export const STORAGE_BUCKET = 'ElevateBallers';

const CACHE_TTL_MS = 30_000;

let cache: { expiresAt: number; identity: string; client: SupabaseClient | null } | null = null;

async function resolveCredentials(): Promise<{ url?: string; serviceKey?: string }> {
  const records = await siteSettingsService.list('security').catch(() => []);
  const dbUrl = records.find((record) => record.key === 'security_supabaseUrl')?.value;
  const dbKey = records.find((record) => record.key === 'security_supabaseServiceRoleKey')?.value;
  return {
    url: dbUrl || getEnv('SUPABASE_URL'),
    serviceKey: dbKey || getEnv('SUPABASE_SERVICE_ROLE_KEY'),
  };
}

/** Resolved Supabase client, or `null` when unconfigured. DB-first, cached ~30s. */
export async function getSupabaseClient(): Promise<SupabaseClient | null> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache.client;

  const { url, serviceKey } = await resolveCredentials();
  const identity = `${url ?? ''}:${serviceKey ?? ''}`;
  if (cache && cache.identity === identity) {
    cache = { ...cache, expiresAt: now + CACHE_TTL_MS };
    return cache.client;
  }

  const client = url && serviceKey
    ? createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
    : null;
  if (!client) console.warn('Supabase credentials not configured. Image upload will not work.');
  cache = { expiresAt: now + CACHE_TTL_MS, identity, client };
  return client;
}
