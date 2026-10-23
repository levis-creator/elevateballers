import type { APIRoute } from 'astro';
import { markContactNotificationsRead } from '@/features/cms/lib/notificationCleanup';
import { logAudit } from '@/features/cms/lib/audit';
import { requirePermission } from '@/features/rbac/middleware';
import { handleApiError } from '@/lib/apiError';
import { prisma } from '@/lib/prisma';
import { sendContactReplyEmail } from '@/lib/email';
import { checkAuth } from '@/features/cms/lib/auth-astro';
import { appendSentMessage } from '@/features/messages/application/imap-mailbox';
import { createOperationalNotification } from '@/features/cms/lib/adminNotifications';

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

    const outboundMessageId = `reply-${crypto.randomUUID()}@elevateballers.com`;
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
      try {
        await send;
      } catch (error) {
        await createOperationalNotification({
          type: 'EMAIL_DELIVERY_FAILED',
          message: `Reply to ${message.email} could not be delivered.`,
          severity: 'critical',
          metadata: { contactMessageId: id, action: 'RETRY_EMAIL', error: error instanceof Error ? error.message : String(error) },
        }).catch((notificationError) => console.warn('[messages] delivery notification failed:', notificationError));
        throw error;
      }
    }

    const updated = await prisma.contactMessage.update({
      where: { id },
      // Store the sent reply so it shows in the thread; clear any saved draft.
      data: { repliedAt: new Date(), repliedBy, replyBody: reply, read: true, draftReply: null },
    });

    await prisma.contactMessage.create({ data: {
      name: message.name,
      email: message.email,
      subject: `Re: ${message.subject}`,
      message: reply,
      read: true,
      source: 'ADMIN',
      direction: 'OUTBOUND',
      folder: 'SENT',
      sentAt: new Date(),
      externalId: outboundMessageId,
      threadId: message.threadId ?? message.id,
    } });
    await appendSentMessage({ to: message.email, subject: `Re: ${message.subject}`, text: reply, messageId: outboundMessageId }).catch((error) => console.warn('[messages] sent-mail append failed:', error));

    await markContactNotificationsRead([id]);
    // The reply text stays on the message row; the log records who replied and when.
    logAudit(request, 'CONTACT_MESSAGE_REPLIED', { contactMessageId: id });

    return json({ ok: true, message: updated }, 200);
  } catch (error) {
    return handleApiError(error, 'reply to contact message', request);
  }
};
