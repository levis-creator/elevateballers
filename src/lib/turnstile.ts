/**
 * Cloudflare Turnstile server-side verification.
 *
 * Set TURNSTILE_SECRET_KEY in your environment.
 * For local development without keys, verification is skipped with a warning.
 *
 * Test keys (always pass):
 *   Site key:   1x00000000000000000000AA
 *   Secret key: 1x0000000000000000000000000000000AA
 */

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstile(token: string | undefined, ip?: string): Promise<boolean> {
  const secret = import.meta.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    console.warn('[turnstile] TURNSTILE_SECRET_KEY is not set — skipping bot check');
    return true;
  }

  if (!token) return false;

  try {
    const body = new FormData();
    body.append('secret', secret);
    body.append('response', token);
    if (ip) body.append('remoteip', ip);

    const res = await fetch(SITEVERIFY_URL, { method: 'POST', body });
    const json = (await res.json()) as { success: boolean; 'error-codes'?: string[] };

    if (!json.success) {
      console.warn('[turnstile] verification failed:', json['error-codes']);
    }

    return json.success === true;
  } catch (err) {
    console.error('[turnstile] siteverify request failed:', err);
    return false;
  }
}
