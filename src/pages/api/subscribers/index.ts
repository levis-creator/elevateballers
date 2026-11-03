import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';
import { requirePermission } from '../../../features/rbac/middleware';
import { sendSubscriberConfirmation } from '../../../lib/email';

import { handleApiError } from '../../../lib/apiError';
import { verifyTurnstile } from '../../../lib/turnstile';
import { enforceRateLimit } from '../../../lib/rateLimit';
import { getClientIp } from '../../../lib/getClientIp';
import { checkEmailDomain } from '../../../lib/emailDomain';
import { logAudit } from '@/features/cms/lib/audit';
export const prerender = false;

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const ipLimited = await enforceRateLimit(`subscribe:ip:${getClientIp(request, clientAddress)}`, 10, 60 * 60 * 1000);
    if (ipLimited) return ipLimited;

    const data = await request.json();

    // Honeypot
    if (data.website) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    // Cloudflare Turnstile verification
    const turnstileToken = String(data['cf-turnstile-token'] ?? '').trim();
    if (!await verifyTurnstile(turnstileToken)) {
      return new Response(JSON.stringify({ error: 'Security check failed. Please refresh and try again.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const email = String(data.email || '').trim().toLowerCase();
    const name = String(data.name || '').trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Valid email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const domainCheck = await checkEmailDomain(email);
    if (domainCheck !== 'ok') {
      return new Response(JSON.stringify({
        error: domainCheck === 'disposable'
          ? 'Please use your own email address, not a temporary one.'
          : 'That email address can\'t receive mail. Please check it for typos.',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const existing = await prisma.subscriber.findUnique({ where: { email } });

    if (existing?.active) {
      return new Response(JSON.stringify({ ok: true, alreadySubscribed: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Each address gets at most 3 confirmation emails a day, so the form
    // can't be used to flood someone else's inbox.
    const limited = await enforceRateLimit(`subscribe:email:${email}`, 3, 24 * 60 * 60 * 1000,
      'A confirmation email was already sent to this address. Please check your inbox.');
    if (limited) return limited;

    // New and returning sign-ups stay inactive until the address owner
    // confirms from the email (double opt-in); only active subscribers get mail.
    const subscriber = existing
      ? await prisma.subscriber.update({ where: { email }, data: { name: name || existing.name } })
      : await prisma.subscriber.create({ data: { email, name: name || undefined, active: false } });
    logAudit(request, existing ? 'SUBSCRIBER_RECONFIRM_REQUESTED' : 'SUBSCRIBER_ADDED', { subscriberId: subscriber.id });
    sendSubscriberConfirmation({ email, name: subscriber.name || undefined, token: subscriber.token }).catch((err) =>
      console.error('Failed to send subscription confirmation email:', err)
    );

    return new Response(JSON.stringify({ ok: true, confirmationSent: true }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Subscribe error:', error);
    return handleApiError(error, "subscribe", request);
  }
};

export const GET: APIRoute = async ({ request }) => {
  try {
    await requirePermission(request, 'subscribers:read');

    const url = new URL(request.url);
    const activeOnly = url.searchParams.get('active') !== 'false';

    const subscribers = await prisma.subscriber.findMany({
      where: activeOnly ? { active: true } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return new Response(JSON.stringify(subscribers), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'fetch subscribers', request);
  }
};
