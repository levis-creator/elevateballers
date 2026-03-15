import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';
import { requirePermission } from '../../../features/rbac/middleware';
import { sendSubscriberWelcome } from '../../../lib/email';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();

    // Honeypot
    if (data.website) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    const email = String(data.email || '').trim().toLowerCase();
    const name = String(data.name || '').trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Valid email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const existing = await prisma.subscriber.findUnique({ where: { email } });

    if (existing) {
      if (existing.active) {
        return new Response(JSON.stringify({ ok: true, alreadySubscribed: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      // Re-activate
      await prisma.subscriber.update({ where: { email }, data: { active: true, name: name || existing.name } });
    } else {
      const subscriber = await prisma.subscriber.create({ data: { email, name: name || undefined } });
      sendSubscriberWelcome({ email, name: subscriber.name || undefined, unsubscribeToken: subscriber.token }).catch((err) =>
        console.error('Failed to send welcome email:', err)
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Subscribe error:', error);
    return new Response(JSON.stringify({ error: 'Failed to subscribe' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
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
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Failed to fetch subscribers' }), {
      status: error.message?.includes('Forbidden') || error.message === 'Unauthorized' ? 401 : 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
