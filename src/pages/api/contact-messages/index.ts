import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';
import { requirePermission } from '../../../features/rbac/middleware';
import { sendContactNotification, sendContactAutoReply, sendAdminNotificationEmail } from '../../../lib/email';
import { logAudit } from '../../../features/cms/lib/audit';
import { checkRateLimit, getRateLimitRetryAfter } from '../../../lib/rateLimit';
import { json, handleApiError } from '../../../lib/apiError';

export const prerender = false;

const getClientIp = (request: Request): string =>
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
  request.headers.get('x-real-ip') ??
  'unknown';

const parseBody = async (request: Request): Promise<Record<string, string>> => {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return await request.json();
  }
  if (contentType.includes('form')) {
    const form = await request.formData();
    const data: Record<string, string> = {};
    form.forEach((value, key) => { if (typeof value === 'string') data[key] = value; });
    return data;
  }
  return {};
};

export const GET: APIRoute = async ({ request }) => {
  try {
    await requirePermission(request, 'contact_messages:read');

    const url = new URL(request.url);
    const unreadOnly = url.searchParams.get('unread') === 'true';
    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') ?? '50', 10)));

    const where = unreadOnly ? { read: false } : undefined;
    const [messages, total] = await Promise.all([
      prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.contactMessage.count({ where }),
    ]);

    return json({ data: messages, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } }, 200);
  } catch (error) {
    return handleApiError(error, 'fetch contact messages', request);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const ip = getClientIp(request);

    // Rate limit: 5 contact form submissions per hour per IP
    if (!checkRateLimit(`contact:${ip}`, 5, 60 * 60 * 1000)) {
      const retryAfter = getRateLimitRetryAfter(`contact:${ip}`);
      return json({ error: `Too many submissions. Please try again in ${Math.ceil(retryAfter / 60)} minutes.` }, 429);
    }

    const data = await parseBody(request);

    // Honeypot — silent success to fool bots
    if (data.website) return json({ ok: true }, 200);

    const name = String(data.name ?? '').trim();
    const email = String(data.email ?? '').trim();
    const subject = String(data.subject ?? '').trim();
    const message = String(data.message ?? '').trim();

    if (!name || !email || !subject || !message) {
      return json({ error: 'All fields are required' }, 400);
    }
    if (name.length > 120 || email.length > 190 || subject.length > 190) {
      return json({ error: 'One or more fields are too long' }, 400);
    }

    const userAgent = request.headers.get('user-agent') ?? undefined;

    const created = await prisma.contactMessage.create({
      data: { name, email, subject, message, ipAddress: ip, userAgent },
    });

    // Fire-and-forget — don't block the response on email delivery
    sendContactNotification({ name, email, subject, message }).catch((err) =>
      console.error('[contact] notification email failed:', err)
    );
    sendContactAutoReply({ name, email, subject }).catch((err) =>
      console.error('[contact] auto-reply email failed:', err)
    );

    await prisma.registrationNotification.create({
      data: {
        type: 'CONTACT_MESSAGE',
        message: `New contact message from ${name}${subject ? `: ${subject}` : ''}`,
        metadata: { contactMessageId: created.id, name, email, subject },
      },
    });

    const adminUrl = `${process.env.SITE_URL ?? 'https://elevateballers.com'}/admin/messages?id=${created.id}`;
    sendAdminNotificationEmail({
      type: 'contact_message',
      title: 'New Contact Message',
      message: `${name} sent a new contact message${subject ? ` about "${subject}"` : ''}.`,
      actionUrl: adminUrl,
      actionText: 'View Message',
    }).catch((err) => console.error('[contact] admin notification email failed:', err));

    await logAudit(request, 'CONTACT_MESSAGE_SUBMITTED', {
      contactMessageId: created.id,
      name,
      email,
      subject,
    });

    return json({ ok: true }, 201);
  } catch (error) {
    return handleApiError(error, 'send contact message', request);
  }
};

export const PATCH: APIRoute = async ({ request }) => {
  try {
    await requirePermission(request, 'contact_messages:read');

    const data = await request.json();
    if (!data.id) return json({ error: 'Message ID is required' }, 400);

    const message = await prisma.contactMessage.update({
      where: { id: data.id },
      data: { read: data.read !== undefined ? Boolean(data.read) : undefined },
    });

    await logAudit(request, 'CONTACT_MESSAGE_UPDATED', {
      contactMessageId: message.id,
      read: message.read,
    });

    return json(message, 200);
  } catch (error) {
    return handleApiError(error, 'update contact message', request);
  }
};
