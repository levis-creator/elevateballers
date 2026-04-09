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

  try {
    await qstash.publishJSON({
      url: `${baseUrl.replace(/\/$/, '')}${path}`,
      body,
    });
    return true;
  } catch (err) {
    console.warn(`[qstash] Failed to publish to ${path}:`, err);
    return false;
  }
}
