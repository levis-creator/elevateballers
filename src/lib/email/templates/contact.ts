import { C, ADMIN_TO, SITE_URL } from '../config';
import { emailWrapper, btn, sendTransactionalEmail, getAdminRecipientEmails } from '../core';

export async function sendAdminNotificationEmail(data: {
  type: import('../config').AdminNotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}): Promise<void> {
  const recipients = await getAdminRecipientEmails(data.type);
  if (recipients.length === 0) return;

  const action = data.actionUrl
    ? btn(data.actionText || 'View in Admin', data.actionUrl)
    : '';

  const html = emailWrapper(`
    <h2 style="margin:0 0 12px;font-size:22px;color:${C.primary};font-family:'Teko',Arial,sans-serif;letter-spacing:0.5px;text-transform:uppercase;">${data.title}</h2>
    <p style="margin:0 0 16px;font-size:15px;color:${C.text};line-height:1.7;">
      ${data.message}
    </p>
    ${action}
  `);

  await sendTransactionalEmail({
    to: recipients,
    subject: data.title,
    html,
    audit: { template: 'admin_notification', type: 'EMAIL_SENT' },
  });
  console.log(`[email] Admin notification sent to ${recipients.join(', ')}`);
}

export async function sendContactNotification(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<void> {
  const html = emailWrapper(`
    <h2 style="margin:0 0 4px;font-size:22px;color:${C.primary};font-family:'Teko',Arial,sans-serif;letter-spacing:0.5px;text-transform:uppercase;">New Contact Message</h2>
    <p style="margin:0 0 24px;font-size:13px;color:${C.gray};">Someone submitted the contact form on your website.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.lightGray};border-radius:6px;padding:20px;margin-bottom:24px;">
      <tr><td style="padding:6px 0;font-size:14px;color:${C.text};"><strong>From:</strong> ${data.name}</td></tr>
      <tr><td style="padding:6px 0;font-size:14px;color:${C.text};"><strong>Email:</strong> <a href="mailto:${data.email}" style="color:${C.primary};">${data.email}</a></td></tr>
      <tr><td style="padding:6px 0;font-size:14px;color:${C.text};"><strong>Subject:</strong> ${data.subject}</td></tr>
    </table>

    <div style="background:${C.lightGray};border-left:4px solid ${C.primary};border-radius:0 6px 6px 0;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;font-size:14px;color:${C.text};line-height:1.7;">${data.message.replace(/\n/g, '<br />')}</p>
    </div>

    ${btn('Reply to Message', `mailto:${data.email}`)}
  `);

  await sendTransactionalEmail({
    to: ADMIN_TO,
    replyTo: data.email,
    subject: `New Contact Message: ${data.subject}`,
    html,
    audit: { template: 'contact_notification' },
  });
  console.log(`[email] Contact notification sent to ${ADMIN_TO}`);
}

export async function sendContactAutoReply(data: {
  name: string;
  email: string;
  subject: string;
}): Promise<void> {
  const html = emailWrapper(`
    <h2 style="margin:0 0 16px;font-size:22px;color:${C.primary};font-family:'Teko',Arial,sans-serif;letter-spacing:0.5px;text-transform:uppercase;">Message Received!</h2>
    <p style="margin:0 0 16px;font-size:15px;color:${C.text};line-height:1.7;">Hi ${data.name},</p>
    <p style="margin:0 0 16px;font-size:15px;color:${C.text};line-height:1.7;">
      Thank you for reaching out! We have received your message regarding <strong>${data.subject}</strong> and will get back to you as soon as possible.
    </p>
    <p style="margin:0;font-size:15px;color:${C.text};line-height:1.7;">
      Best regards,<br /><strong>ElevateBallers Team</strong>
    </p>
    ${btn('Visit Website', SITE_URL)}
  `);

  await sendTransactionalEmail({
    to: data.email,
    subject: `We received your message: ${data.subject}`,
    html,
    audit: { template: 'contact_auto_reply' },
  });
  console.log(`[email] Auto-reply sent to ${data.email}`);
}
