/**
 * POST /api/jobs/send-email
 *
 * Background job endpoint called by QStash to send transactional emails
 * with automatic retries. Protected by QStash signature verification.
 *
 * Supports three payload formats (see runEmailJob):
 * 1. Direct: { to, subject, html, replyTo?, from?, audit? }
 * 2. Templated: { jobType, data } — delegates to the appropriate template function
 * 3. Registration: { registrationJobId }
 *
 * When the last QStash delivery fails, the job moves to the email outbox for
 * the hourly resend instead of being dropped.
 */

import type { APIRoute } from 'astro';
import { verifyQStashSignature } from '../../../lib/qstash-verify';
import { MAX_RETRIES_FIELD, QSTASH_DEFAULT_RETRIES } from '../../../lib/qstash';
import { InvalidEmailJobError, runEmailJob } from '../../../lib/email/jobs';
import { enqueueFailedEmail } from '../../../lib/email/outbox';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request }) => {
  const isValid = await verifyQStashSignature(request);
  if (!isValid) return json({ error: 'Unauthorized' }, 401);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }
  const { [MAX_RETRIES_FIELD]: maxRetries, ...job } = body ?? {};

  try {
    await runEmailJob(job);
    return json({ success: true });
  } catch (error: any) {
    if (error instanceof InvalidEmailJobError) return json({ error: error.message }, 400);
    console.error('[jobs/send-email] Error:', error);

    const retried = Number(request.headers.get('Upstash-Retried') ?? 0);
    const lastAttempt = retried >= (Number(maxRetries) || QSTASH_DEFAULT_RETRIES);
    // Registration emails keep their own attempt state in public_registration_email_jobs.
    if (lastAttempt && !job.registrationJobId && (await enqueueFailedEmail(job, error, 'qstash')))
      return json({ success: false, deferred: true });

    return json({ error: error?.message ?? 'Email send failed' }, 500);
  }
};
