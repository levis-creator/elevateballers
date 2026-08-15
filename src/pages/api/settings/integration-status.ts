import type { APIRoute } from 'astro';
import { TURNSTILE_SECRET_KEY } from 'astro:env/server';
import { requirePermission } from '../../../features/rbac/middleware';
import { handleApiError, json } from '../../../lib/apiError';
import { siteSettingsService } from '../../../features/settings';

export const prerender = false;

type Source = 'database' | 'environment' | 'unset';

async function sourceFor(key: string, envVar: string | undefined): Promise<Source> {
  const setting = await siteSettingsService.get(key).catch(() => null);
  if (setting?.value) return 'database';
  if (envVar) return 'environment';
  return 'unset';
}

/** Brevo's credential lives in the `email_providers` setting (Notifications), not a dedicated security_ key. */
async function brevoSource(): Promise<Source> {
  const setting = await siteSettingsService.get('email_providers').catch(() => null);
  try {
    const providers = JSON.parse(setting?.value ?? '[]') as Array<{ provider?: string; credential?: string }>;
    const brevo = providers.find((item) => String(item.provider ?? '').trim().toLowerCase() === 'brevo');
    if (brevo?.credential) return 'database';
  } catch {
    // malformed value, fall through to the environment check below
  }
  return process.env.BREVO_API_KEY ? 'environment' : 'unset';
}

export const GET: APIRoute = async ({ request }) => {
  try {
    await requirePermission(request, 'site_settings:read');
    const entries: Array<[string, string, string | undefined]> = [
      ['turnstileSecretKey', 'security_turnstileSecretKey', TURNSTILE_SECRET_KEY],
      ['resendWebhookSecret', 'security_resendWebhookSecret', process.env.RESEND_WEBHOOK_SECRET],
      ['mailgunWebhookSigningKey', 'security_mailgunWebhookSigningKey', process.env.MAILGUN_WEBHOOK_SIGNING_KEY],
      ['upstashRedisUrl', 'security_upstashRedisUrl', process.env.UPSTASH_REDIS_REST_URL],
      ['upstashRedisToken', 'security_upstashRedisToken', process.env.UPSTASH_REDIS_REST_TOKEN],
      ['r2AccountId', 'security_r2AccountId', process.env.R2_ACCOUNT_ID],
      ['r2BucketName', 'security_r2BucketName', process.env.R2_BUCKET_NAME],
      ['r2AccessKeyId', 'security_r2AccessKeyId', process.env.R2_ACCESS_KEY_ID],
      ['r2SecretAccessKey', 'security_r2SecretAccessKey', process.env.R2_SECRET_ACCESS_KEY],
      ['r2PublicUrl', 'security_r2PublicUrl', process.env.R2_PUBLIC_URL],
      ['supabaseUrl', 'security_supabaseUrl', process.env.SUPABASE_URL],
      ['supabaseServiceRoleKey', 'security_supabaseServiceRoleKey', process.env.SUPABASE_SERVICE_ROLE_KEY],
    ];
    const [resolved, brevo] = await Promise.all([
      Promise.all(entries.map(([name, key, envVar]) => sourceFor(key, envVar).then((source) => [name, source] as const))),
      brevoSource(),
    ]);
    const status = Object.fromEntries(resolved) as Record<string, Source>;

    return json({ ...status, brevo }, 200);
  } catch (error) {
    return handleApiError(error, 'get integration status', request);
  }
};
