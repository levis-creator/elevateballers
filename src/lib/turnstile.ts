import { TURNSTILE_SECRET_KEY } from 'astro:env/server';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstile(token: string | undefined, ip?: string): Promise<boolean> {
  if (!token) return false;

  // Local dev: skip the Cloudflare siteverify round-trip. A dev machine often
  // can't reach challenges.cloudflare.com (the request times out), and bot
  // protection isn't meaningful locally. `import.meta.env.DEV` is TRUE only
  // under `astro dev` and compiles to false in production builds — prod always
  // verifies for real and fails closed. Still requires a token to be present.
  if (import.meta.env.DEV) {
    console.warn('[turnstile] dev mode — skipping siteverify (treated as passed)');
    return true;
  }

  try {
    const body = new FormData();
    body.append('secret', TURNSTILE_SECRET_KEY);
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
