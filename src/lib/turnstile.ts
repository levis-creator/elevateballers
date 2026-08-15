import { TURNSTILE_SECRET_KEY } from 'astro:env/server';
import { siteSettingsService, resolveSecuritySettings } from '../features/settings';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstile(token: string | undefined, ip?: string): Promise<boolean> {
  const records = await siteSettingsService.list('security').catch(() => []);
  const security = resolveSecuritySettings(records);
  if (!security.security_turnstileEnabled) return true;

  if (!token) return false;

  const secretKey = records.find((record) => record.key === 'security_turnstileSecretKey')?.value || TURNSTILE_SECRET_KEY;

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
    body.append('secret', secretKey);
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
