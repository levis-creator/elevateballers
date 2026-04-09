/**
 * QStash signature verification for background job endpoints.
 *
 * Verifies that incoming requests are genuinely from QStash using
 * the signing keys configured in the environment.
 */

import { Receiver } from '@upstash/qstash';
import { getEnv } from './env';

const currentKey = getEnv('QSTASH_CURRENT_SIGNING_KEY');
const nextKey = getEnv('QSTASH_NEXT_SIGNING_KEY');

const receiver: Receiver | null =
  currentKey && nextKey
    ? new Receiver({ currentSigningKey: currentKey, nextSigningKey: nextKey })
    : null;

/**
 * Verify that a request was sent by QStash.
 * Returns true if valid, false if verification fails or keys are not configured.
 */
export async function verifyQStashSignature(request: Request): Promise<boolean> {
  if (!receiver) return false;

  const signature = request.headers.get('upstash-signature');
  if (!signature) return false;

  try {
    const body = await request.clone().text();
    await receiver.verify({ signature, body });
    return true;
  } catch {
    return false;
  }
}
