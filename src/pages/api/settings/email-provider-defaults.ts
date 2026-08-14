import type { APIRoute } from 'astro';
import { requirePermission } from '../../../features/rbac/middleware';
import { DEFAULT_OUTBOUND_EMAIL_SETTINGS } from '../../../features/settings/application/notificationSettings';

export const prerender = false;

const MASK = '••••••••••••';

export const GET: APIRoute = async ({ request }) => {
  await requirePermission(request, 'site_settings:read');
  const configured: Record<string, { credential: string; configured: boolean }> = {
    resend: { credential: process.env.RESEND_API_KEY ? MASK : '', configured: Boolean(process.env.RESEND_API_KEY) },
    brevo: { credential: process.env.BREVO_API_KEY ? MASK : '', configured: Boolean(process.env.BREVO_API_KEY) },
    mailgun: {
      credential: process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN ? `${MASK}|${process.env.MAILGUN_DOMAIN}` : '',
      configured: Boolean(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN),
    },
    smtp: {
      credential: process.env.SMTP_HOST && process.env.SMTP_PORT ? `${process.env.SMTP_HOST}:${process.env.SMTP_PORT}` : '',
      configured: Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT),
    },
  };
  const providers = DEFAULT_OUTBOUND_EMAIL_SETTINGS.providers.map((provider) => {
    const environment = configured[provider.provider.toLowerCase()];
    return environment?.configured
      ? { ...provider, credential: environment.credential, status: 'Configured from environment' }
      : provider;
  });
  return new Response(JSON.stringify({ providers }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
};
