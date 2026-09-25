/**
 * Upstash QStash client for background job processing.
 *
 * When QStash is unavailable, `publishToJob` returns false so the caller
 * can fall back to inline execution.
 */

import { Client } from '@upstash/qstash';
import { getEnv } from './env';

const token = getEnv('QSTASH_TOKEN');

export const qstash: Client | null = token ? new Client({ token }) : null;

/** Retries requested per job; QStash's own default when a plan rejects this. */
export const QSTASH_RETRIES = 5;
export const QSTASH_DEFAULT_RETRIES = 3;
/**
 * Stamped into each job body so the job endpoint knows which delivery is the
 * last one (QStash sends the retries so far in `Upstash-Retried`).
 */
export const MAX_RETRIES_FIELD = '_qstashMaxRetries';

/**
 * Publish a job to an internal API endpoint via QStash.
 *
 * @param path  Absolute path starting with '/' (e.g. '/api/jobs/send-email')
 * @param body  JSON-serialisable payload
 * @returns true if published, false if QStash is unavailable (caller should run inline)
 */
export async function publishToJob(
  path: string,
  body: Record<string, unknown>,
): Promise<boolean> {
  if (!qstash) return false;

  const baseUrl = getEnv('QSTASH_DESTINATION_URL') ?? getEnv('SITE_URL');
  if (!baseUrl) {
    console.warn('[qstash] QSTASH_DESTINATION_URL or SITE_URL not set, cannot publish');
    return false;
  }

  const url = `${baseUrl.replace(/\/$/, '')}${path}`;
  try {
    await qstash.publishJSON({ url, body: { ...body, [MAX_RETRIES_FIELD]: QSTASH_RETRIES }, retries: QSTASH_RETRIES });
    return true;
  } catch (err) {
    // A plan with a lower retry cap rejects the explicit count; fall back to the default.
    try {
      await qstash.publishJSON({ url, body: { ...body, [MAX_RETRIES_FIELD]: QSTASH_DEFAULT_RETRIES } });
      return true;
    } catch {
      console.warn(`[qstash] Failed to publish to ${path}:`, err);
      return false;
    }
  }
}
