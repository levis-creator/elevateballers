import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';
import { requirePermission } from '../../../features/rbac/middleware';

export const prerender = false;

const getClientIp = (request: Request) => {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim();
  return request.headers.get('x-real-ip') || undefined;
};

const parseBody = async (request: Request) => {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return await request.json();
  }
  if (contentType.includes('form')) {
    const form = await request.formData();
    const data: Record<string, string> = {};
    form.forEach((value, key) => {
      if (typeof value === 'string') data[key] = value;
    });
    return data;
  }
  return {};
};

export const GET: APIRoute = async ({ request }) => {
  try {
    await requirePermission(request, 'contact_messages:read');

    if (!prisma.contactMessage) {
      throw new Error('Prisma contactMessage model not available. Please run: npm run db:generate');
    }

    const url = new URL(request.url);
    const unreadOnly = url.searchParams.get('unread') === 'true';

    const messages = await prisma.contactMessage.findMany({
      where: unreadOnly ? { read: false } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return new Response(JSON.stringify(messages), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error fetching contact messages:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch contact messages' }),
      {
        status: error.message === 'Unauthorized' || error.message.includes('Forbidden') ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!prisma.contactMessage) {
      throw new Error('Prisma contactMessage model not available. Please run: npm run db:generate');
    }

    const data = await parseBody(request);

    if (data.website) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const name = String(data.name || '').trim();
    const email = String(data.email || '').trim();
    const subject = String(data.subject || '').trim();
    const message = String(data.message || '').trim();

    if (!name || !email || !subject || !message) {
      return new Response(JSON.stringify({ error: 'All fields are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (name.length > 120 || email.length > 190 || subject.length > 190) {
      return new Response(JSON.stringify({ error: 'One or more fields are too long' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ipAddress = getClientIp(request);
    const userAgent = request.headers.get('user-agent') || undefined;

    const created = await prisma.contactMessage.create({
      data: {
        name,
        email,
        subject,
        message,
        ipAddress,
        userAgent,
      },
    });

    // Create admin notification
    await prisma.registrationNotification.create({
      data: {
        type: 'CONTACT_MESSAGE',
        message: `New contact message from ${name}${subject ? `: ${subject}` : ''}`,
        metadata: {
          contactMessageId: created.id,
          name,
          email,
          subject,
        },
      },
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error saving contact message:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to send message' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const PATCH: APIRoute = async ({ request }) => {
  try {
    await requirePermission(request, 'contact_messages:read');
    if (!prisma.contactMessage) {
      throw new Error('Prisma contactMessage model not available. Please run: npm run db:generate');
    }
    const data = await request.json();

    if (!data.id) {
      return new Response(JSON.stringify({ error: 'Message ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const message = await prisma.contactMessage.update({
      where: { id: data.id },
      data: {
        read: data.read !== undefined ? Boolean(data.read) : undefined,
      },
    });

    return new Response(JSON.stringify(message), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error updating contact message:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to update message' }),
      {
        status: error.message === 'Unauthorized' || error.message.includes('Forbidden') ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
