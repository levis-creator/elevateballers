import { TURNSTILE_SECRET_KEY } from 'astro:env/server';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstile(token: string | undefined, ip?: string): Promise<boolean> {
  if (!token) return false;

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
