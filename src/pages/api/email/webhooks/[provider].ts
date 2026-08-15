import crypto from 'node:crypto';
import type { APIRoute } from 'astro';
import { recordEmailDeliveryEvent } from '../../../../lib/email/core';
import { siteSettingsService } from '../../../../features/settings';

export const prerender = false;

function safeEqual(left: string, right: string) {
  if (!left || left.length !== right.length) return false;
  return crypto.timingSafeEqual(Buffer.from(left), Buffer.from(right));
}

async function getWebhookSecret(key: string, envVar: string | undefined): Promise<string | undefined> {
  const setting = await siteSettingsService.get(key).catch(() => null);
  return setting?.value || envVar;
}

function verifyResend(request: Request, body: string, secret: string | undefined) {
  if (!secret) return false;
  const id = request.headers.get('svix-id') || '';
  const timestamp = request.headers.get('svix-timestamp') || '';
  const signatures = (request.headers.get('svix-signature') || '').split(' ');
  if (!id || !timestamp || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const expected = crypto.createHmac('sha256', key).update(`${id}.${timestamp}.${body}`).digest('base64');
  return signatures.some((value) => safeEqual(value.replace(/^v1,/, ''), expected));
}

function verifyMailgun(payload: any, key: string | undefined) {
  const signature = payload?.signature;
  if (!key || !signature?.timestamp || !signature?.token || !signature?.signature) return false;
  if (Math.abs(Date.now() / 1000 - Number(signature.timestamp)) > 300) return false;
  const expected = crypto.createHmac('sha256', key).update(`${signature.timestamp}${signature.token}`).digest('hex');
  return safeEqual(String(signature.signature), expected);
}

export const POST: APIRoute = async ({ params, request }) => {
  const provider = String(params.provider || '').toLowerCase();
  const raw = await request.text();
  let payload: any;
  try { payload = JSON.parse(raw); } catch { return new Response('Invalid JSON', { status: 400 }); }

  if (provider === 'resend') {
    const secret = await getWebhookSecret('security_resendWebhookSecret', process.env.RESEND_WEBHOOK_SECRET);
    if (!verifyResend(request, raw, secret)) return new Response('Unauthorized', { status: 401 });
    if (payload.type === 'email.bounced') await recordEmailDeliveryEvent({ provider, event: 'bounced', providerMessageId: payload.data?.email_id });
    if (payload.type === 'email.opened') await recordEmailDeliveryEvent({ provider, event: 'opened', providerMessageId: payload.data?.email_id });
  } else if (provider === 'mailgun') {
    const key = await getWebhookSecret('security_mailgunWebhookSigningKey', process.env.MAILGUN_WEBHOOK_SIGNING_KEY);
    if (!verifyMailgun(payload, key)) return new Response('Unauthorized', { status: 401 });
    const event = payload['event-data']?.event;
    const severity = payload['event-data']?.severity;
    const id = payload['event-data']?.message?.headers?.['message-id'];
    if (event === 'failed' && severity === 'permanent') await recordEmailDeliveryEvent({ provider, event: 'bounced', providerMessageId: id });
    if (event === 'opened') await recordEmailDeliveryEvent({ provider, event: 'opened', providerMessageId: id });
  } else {
    return new Response('Unknown provider', { status: 404 });
  }
  return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } });
};
