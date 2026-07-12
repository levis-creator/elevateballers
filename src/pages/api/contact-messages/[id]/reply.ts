import type { APIRoute } from 'astro';
import { requirePermission } from '@/features/rbac/middleware';
import { handleApiError } from '@/lib/apiError';
import { prisma } from '@/lib/prisma';
import { sendContactReplyEmail } from '@/lib/email';
import { checkAuth } from '@/features/cms/lib/auth-astro';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

/**
 * Send an admin reply to a contact message. The reply is delivered to the
 * sender's email through the transactional email layer (Resend if configured,
 * otherwise SMTP). On success the message is marked read + replied.
 *
 * POST /api/contact-messages/:id/reply  { reply: string }
 */
export const POST: APIRoute = async ({ request, params }) => {
  try {
    await requirePermission(request, 'contact_messages:read');

    const id = params.id;
    if (!id) return json({ error: 'Missing message id' }, 400);

    let body: any;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON in request body' }, 400);
    }

    const reply = String(body?.reply ?? '').trim();
    if (!reply) return json({ error: 'Reply cannot be empty.' }, 400);
    if (reply.length > 5000) return json({ error: 'Reply is too long (max 5000 characters).' }, 400);

    const message = await prisma.contactMessage.findUnique({ where: { id } });
    if (!message) return json({ error: 'Message not found.' }, 404);

    // Best-effort record of who replied.
    let repliedBy: string | null = null;
    try {
      const user = await checkAuth(request);
      repliedBy = user?.email ?? user?.name ?? null;
    } catch {
      /* ignore */
    }

    const send = sendContactReplyEmail({
      name: message.name,
      email: message.email,
      subject: message.subject,
      replyBody: reply,
      originalMessage: message.message,
    });

    if (import.meta.env.DEV) {
      // Local dev: the mail host is usually unreachable from a dev machine, so
      // don't block the reply flow on it — log the reply and fire the send in
      // the background. `import.meta.env.DEV` compiles to false in production.
      console.log(`\n📧 [dev] Contact reply to ${message.email} (re: ${message.subject}):\n${reply}\n`);
      void send.catch((e) => console.warn('[dev] reply email send failed (ignored):', e instanceof Error ? e.message : e));
    } else {
      // Production: a delivery failure means the reply didn't send — surface it
      // and do NOT mark the message replied.
      await send;
    }

    const updated = await prisma.contactMessage.update({
      where: { id },
      data: { repliedAt: new Date(), repliedBy, read: true },
    });

    return json({ ok: true, message: updated }, 200);
  } catch (error) {
    return handleApiError(error, 'reply to contact message', request);
  }
};
