/**
 * POST /api/jobs/send-email
 *
 * Background job endpoint called by QStash to send transactional emails
 * with automatic retries. Protected by QStash signature verification.
 *
 * Supports two payload formats:
 * 1. Direct: { to, subject, html, replyTo?, from?, audit? }
 * 2. Templated: { jobType, data } — delegates to the appropriate template function
 */

import type { APIRoute } from 'astro';
import { verifyQStashSignature } from '../../../lib/qstash-verify';
import { sendTransactionalEmail } from '../../../lib/email/core';
import { sendContactNotification, sendContactAutoReply } from '../../../lib/email/templates/contact';
import { sendAdminNotificationEmail } from '../../../lib/email';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const isValid = await verifyQStashSignature(request);
  if (!isValid) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();

    // Templated job types
    if (body.jobType) {
      switch (body.jobType) {
        case 'contact_notification':
          await sendContactNotification(body.data);
          break;
        case 'contact_auto_reply':
          await sendContactAutoReply(body.data);
          break;
        case 'admin_notification':
          await sendAdminNotificationEmail(body.data);
          break;
        default:
          return new Response(
            JSON.stringify({ error: `Unknown jobType: ${body.jobType}` }),
            { status: 400, headers: { 'Content-Type': 'application/json' } },
          );
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Direct sendTransactionalEmail payload
    const { to, subject, html, replyTo, from, audit } = body;
    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, html' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    await sendTransactionalEmail({ to, subject, html, replyTo, from, audit });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[jobs/send-email] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
