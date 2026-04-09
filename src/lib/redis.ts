/**
 * Upstash Redis singleton client
 *
 * Gracefully degrades when credentials are missing or Redis is unreachable.
 * All consumers should check `isRedisAvailable()` or handle `null` returns.
 */

import { Redis } from '@upstash/redis';
import { getEnv } from './env';

const url = getEnv('UPSTASH_REDIS_REST_URL');
const token = getEnv('UPSTASH_REDIS_REST_TOKEN');

export const redis: Redis | null =
  url && token ? new Redis({ url, token }) : null;

export function isRedisAvailable(): boolean {
  return redis !== null;
}
