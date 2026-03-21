import crypto from 'node:crypto';
import { logAuditSystem } from '../../../features/cms/lib/audit';
import { C, SITE_URL, BREVO_FROM, BREVO_SENDER_NAME } from '../config';
import { getBrevoClient, hashValue, hashRecipients } from '../providers';
import { emailWrapper, btn, sendTransactionalEmail, getAdminRecipientEmails } from '../core';

export async function sendTeamRegistrationAutoReply(data: {
  coachName: string;
  email: string;
  teamName: string;
  leagueName?: string | null;
}): Promise<void> {
  const leagueLine = data.leagueName
    ? `<p style="margin:0 0 16px;font-size:15px;color:${C.text};line-height:1.7;">League: <strong>${data.leagueName}</strong></p>`
    : '';

  const html = emailWrapper(`
    <h2 style="margin:0 0 16px;font-size:22px;color:${C.primary};font-family:'Teko',Arial,sans-serif;letter-spacing:0.5px;text-transform:uppercase;">Team Registration Received</h2>
    <p style="margin:0 0 16px;font-size:15px;color:${C.text};line-height:1.7;">Hi ${data.coachName},</p>
    <p style="margin:0 0 16px;font-size:15px;color:${C.text};line-height:1.7;">
      Thanks for registering <strong>${data.teamName}</strong>. Our staff will review the submission and follow up soon.
    </p>
    ${leagueLine}
    <p style="margin:0;font-size:15px;color:${C.text};line-height:1.7;">
      If we need any additional details, we will reach out at ${data.email}.
    </p>
    <p style="margin:16px 0 0;font-size:15px;color:${C.text};line-height:1.7;">
      Best regards,<br /><strong>ElevateBallers Team</strong>
    </p>
    ${btn('Visit Website', SITE_URL)}
  `);

  await sendTransactionalEmail({
    to: data.email,
    subject: `We received your team registration: ${data.teamName}`,
    html,
    audit: { template: 'team_registration_auto_reply' },
  });
  console.log(`[email] Team registration auto-reply sent to ${data.email}`);
}

export async function sendTeamRegistrationAutoReplyBrevo(data: {
  coachName: string;
  email: string;
  teamName: string;
  leagueName?: string | null;
}): Promise<void> {
  const brevo = getBrevoClient();
  if (!brevo) return;

  const recipients = await getAdminRecipientEmails('team_registered');
  if (recipients.length === 0) {
    console.warn('[email] No admin recipients found for team admin auto-reply.');
    return;
  }

  const leagueLine = data.leagueName
    ? `<p style="margin:0 0 16px;font-size:15px;color:${C.text};line-height:1.7;">League: <strong>${data.leagueName}</strong></p>`
    : '';

  const html = emailWrapper(`
    <h2 style="margin:0 0 16px;font-size:22px;color:${C.primary};font-family:'Teko',Arial,sans-serif;letter-spacing:0.5px;text-transform:uppercase;">Team Registration Received</h2>
    <p style="margin:0 0 16px;font-size:15px;color:${C.text};line-height:1.7;">Hi ${data.coachName},</p>
    <p style="margin:0 0 16px;font-size:15px;color:${C.text};line-height:1.7;">
      Thanks for registering <strong>${data.teamName}</strong>. Our staff will review the submission and follow up soon.
    </p>
    ${leagueLine}
    <p style="margin:0;font-size:15px;color:${C.text};line-height:1.7;">
      If we need any additional details, we will reach out at ${data.email}.
    </p>
    <p style="margin:16px 0 0;font-size:15px;color:${C.text};line-height:1.7;">
      Best regards,<br /><strong>ElevateBallers Team</strong>
    </p>
    ${btn('Visit Website', SITE_URL)}
  `);

  const senderEmail = BREVO_FROM?.match(/<(.+)>/)?.[1] || BREVO_FROM || 'info@elevateballers.com';

  const traceId = crypto.randomUUID();
  const eventId = crypto.randomUUID();
  const startedAt = Date.now();
  try {
    await brevo.transactionalEmails.sendTransacEmail({
      sender: { name: BREVO_SENDER_NAME, email: senderEmail },
      to: recipients.map((recipient) => ({ email: recipient })),
      subject: `New team created (admin): ${data.teamName}`,
      htmlContent: html,
    });
    const durationMs = Date.now() - startedAt;
    await logAuditSystem('EMAIL_SENT', {
      provider: 'brevo',
      template: 'team_registration_admin_notify',
      toHash: hashRecipients(recipients),
      subjectHash: hashValue(`New team created (admin): ${data.teamName}`),
      eventId,
      traceId,
      durationMs,
    });
    console.log(`[email] Team admin auto-reply (Brevo) sent to ${recipients.join(', ')}`);
  } catch (error: any) {
    await logAuditSystem('EMAIL_FAILED', {
      provider: 'brevo',
      template: 'team_registration_admin_notify',
      toHash: hashRecipients(recipients),
      subjectHash: hashValue(`New team created (admin): ${data.teamName}`),
      eventId,
      traceId,
      durationMs: Date.now() - startedAt,
      error: error?.message || String(error),
    });
    throw error;
  }
}

export async function sendPlayerRegistrationAutoReply(data: {
  name: string;
  email: string;
  teamName?: string | null;
}): Promise<void> {
  const teamLine = data.teamName
    ? `<p style="margin:0 0 16px;font-size:15px;color:${C.text};line-height:1.7;">Team preference: <strong>${data.teamName}</strong></p>`
    : '';

  const html = emailWrapper(`
    <h2 style="margin:0 0 16px;font-size:22px;color:${C.primary};font-family:'Teko',Arial,sans-serif;letter-spacing:0.5px;text-transform:uppercase;">Player Registration Received</h2>
    <p style="margin:0 0 16px;font-size:15px;color:${C.text};line-height:1.7;">Hi ${data.name},</p>
    <p style="margin:0 0 16px;font-size:15px;color:${C.text};line-height:1.7;">
      Thanks for registering to play with ElevateBallers. Our staff will review your submission and get back to you soon.
    </p>
    ${teamLine}
    <p style="margin:0;font-size:15px;color:${C.text};line-height:1.7;">
      If we need any additional details, we will reach out at ${data.email}.
    </p>
    <p style="margin:16px 0 0;font-size:15px;color:${C.text};line-height:1.7;">
      Best regards,<br /><strong>ElevateBallers Team</strong>
    </p>
    ${btn('Visit Website', SITE_URL)}
  `);

  await sendTransactionalEmail({
    to: data.email,
    subject: 'We received your player registration',
    html,
    audit: { template: 'player_registration_auto_reply' },
  });
  console.log(`[email] Player registration auto-reply sent to ${data.email}`);
}

export async function sendPlayerRegistrationAutoReplyBrevo(data: {
  name: string;
  email: string;
  teamName?: string | null;
}): Promise<void> {
  const brevo = getBrevoClient();
  if (!brevo) return;

  const recipients = await getAdminRecipientEmails('player_registered');
  if (recipients.length === 0) {
    console.warn('[email] No admin recipients found for player admin auto-reply.');
    return;
  }

  const teamLine = data.teamName
    ? `<p style="margin:0 0 16px;font-size:15px;color:${C.text};line-height:1.7;">Team preference: <strong>${data.teamName}</strong></p>`
    : '';

  const html = emailWrapper(`
    <h2 style="margin:0 0 16px;font-size:22px;color:${C.primary};font-family:'Teko',Arial,sans-serif;letter-spacing:0.5px;text-transform:uppercase;">Player Registration Received</h2>
    <p style="margin:0 0 16px;font-size:15px;color:${C.text};line-height:1.7;">Hi ${data.name},</p>
    <p style="margin:0 0 16px;font-size:15px;color:${C.text};line-height:1.7;">
      Thanks for registering to play with ElevateBallers. Our staff will review your submission and get back to you soon.
    </p>
    ${teamLine}
    <p style="margin:0;font-size:15px;color:${C.text};line-height:1.7;">
      If we need any additional details, we will reach out at ${data.email}.
    </p>
    <p style="margin:16px 0 0;font-size:15px;color:${C.text};line-height:1.7;">
      Best regards,<br /><strong>ElevateBallers Team</strong>
    </p>
    ${btn('Visit Website', SITE_URL)}
  `);

  const senderEmail = BREVO_FROM?.match(/<(.+)>/)?.[1] || BREVO_FROM || 'info@elevateballers.com';

  const traceId = crypto.randomUUID();
  const eventId = crypto.randomUUID();
  const startedAt = Date.now();
  try {
    await brevo.transactionalEmails.sendTransacEmail({
      sender: { name: BREVO_SENDER_NAME, email: senderEmail },
      to: recipients.map((recipient) => ({ email: recipient })),
      subject: `New player created (admin): ${data.name}`,
      htmlContent: html,
    });
    const durationMs = Date.now() - startedAt;
    await logAuditSystem('EMAIL_SENT', {
      provider: 'brevo',
      template: 'player_registration_admin_notify',
      toHash: hashRecipients(recipients),
      subjectHash: hashValue(`New player created (admin): ${data.name}`),
      eventId,
      traceId,
      durationMs,
    });
    console.log(`[email] Player admin auto-reply (Brevo) sent to ${recipients.join(', ')}`);
  } catch (error: any) {
    await logAuditSystem('EMAIL_FAILED', {
      provider: 'brevo',
      template: 'player_registration_admin_notify',
      toHash: hashRecipients(recipients),
      subjectHash: hashValue(`New player created (admin): ${data.name}`),
      eventId,
      traceId,
      durationMs: Date.now() - startedAt,
      error: error?.message || String(error),
    });
    throw error;
  }
}

export async function sendTeamApprovedEmail(data: {
  coachName: string;
  email: string;
  teamName: string;
}): Promise<void> {
  const html = emailWrapper(`
    <h2 style="margin:0 0 16px;font-size:22px;color:${C.primary};font-family:'Teko',Arial,sans-serif;letter-spacing:0.5px;text-transform:uppercase;">Team Approved!</h2>
    <p style="margin:0 0 16px;font-size:15px;color:${C.text};line-height:1.7;">Hi ${data.coachName},</p>
    <p style="margin:0 0 16px;font-size:15px;color:${C.text};line-height:1.7;">
      Great news! Your team <strong>${data.teamName}</strong> has been approved and is now officially registered with ElevateBallers.
    </p>
    <p style="margin:0;font-size:15px;color:${C.text};line-height:1.7;">
      You can now access your team dashboard and manage your roster.
    </p>
    <p style="margin:16px 0 0;font-size:15px;color:${C.text};line-height:1.7;">
      Best regards,<br /><strong>ElevateBallers Team</strong>
    </p>
    ${btn('Visit Website', SITE_URL)}
  `);

  await sendTransactionalEmail({
    to: data.email,
    subject: `Your team ${data.teamName} has been approved!`,
    html,
    audit: { template: 'team_approved' },
  });
  console.log(`[email] Team approved email sent to ${data.email}`);
}

export async function sendPlayerApprovedEmail(data: {
  name: string;
  email: string;
  teamName?: string | null;
}): Promise<void> {
  const teamLine = data.teamName
    ? `<p style="margin:0 0 16px;font-size:15px;color:${C.text};line-height:1.7;">Team: <strong>${data.teamName}</strong></p>`
    : '';

  const html = emailWrapper(`
    <h2 style="margin:0 0 16px;font-size:22px;color:${C.primary};font-family:'Teko',Arial,sans-serif;letter-spacing:0.5px;text-transform:uppercase;">Player Registration Approved!</h2>
    <p style="margin:0 0 16px;font-size:15px;color:${C.text};line-height:1.7;">Hi ${data.name},</p>
    <p style="margin:0 0 16px;font-size:15px;color:${C.text};line-height:1.7;">
      Congratulations! Your player registration has been approved and you are now officially part of ElevateBallers.
    </p>
    ${teamLine}
    <p style="margin:0;font-size:15px;color:${C.text};line-height:1.7;">
      Welcome to the league — we look forward to seeing you on the court!
    </p>
    <p style="margin:16px 0 0;font-size:15px;color:${C.text};line-height:1.7;">
      Best regards,<br /><strong>ElevateBallers Team</strong>
    </p>
    ${btn('Visit Website', SITE_URL)}
  `);

  await sendTransactionalEmail({
    to: data.email,
    subject: 'Your player registration has been approved!',
    html,
    audit: { template: 'player_approved' },
  });
  console.log(`[email] Player approved email sent to ${data.email}`);
}
