import { sendTransactionalEmail } from './core';
import { sendContactNotification, sendContactAutoReply } from './templates/contact';
import { sendAdminNotificationEmail, sendRegistrationPaymentEmail } from '../email';
import { processRegistrationEmailJob } from '../../features/registration/application/process-registration-email-job';
import { sendRosterDecisionEmail } from '../../features/registration/application/roster-request-emails';
import { sendPlayerTransferEmail } from '../../features/player/application/transfer-emails';

/** A payload that can never succeed, so retrying it is pointless. */
export class InvalidEmailJobError extends Error {
  name = 'InvalidEmailJobError';
}

/**
 * Runs one email job body, as stored by the email outbox for retry:
 * `{ registrationJobId }`, `{ jobType, data }`, or a direct
 * `{ to, subject, html, ... }` send. Throws when the send fails.
 */
export async function runEmailJob(body: any): Promise<void> {
  if (body?.registrationJobId) {
    await processRegistrationEmailJob(String(body.registrationJobId));
    return;
  }

  if (body?.jobType) {
    switch (body.jobType) {
      case 'contact_notification':
        return sendContactNotification(body.data);
      case 'contact_auto_reply':
        return sendContactAutoReply(body.data);
      case 'admin_notification':
        return sendAdminNotificationEmail(body.data);
      case 'roster_decision':
        return sendRosterDecisionEmail(body.data);
      case 'player_transfer':
        return sendPlayerTransferEmail(body.data);
      case 'registration_payment_received':
        return sendRegistrationPaymentEmail(body.data);
      default:
        throw new InvalidEmailJobError(`Unknown jobType: ${body.jobType}`);
    }
  }

  const { to, subject, html, replyTo, from, audit } = body ?? {};
  if (!to || !subject || !html) throw new InvalidEmailJobError('Missing required fields: to, subject, html');
  await sendTransactionalEmail({ to, subject, html, replyTo, from, audit });
}
