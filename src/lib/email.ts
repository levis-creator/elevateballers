import { Resend } from 'resend';
import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import { BrevoClient } from '@getbrevo/brevo';
import { prisma } from './prisma';
import { logAuditSystem } from '../features/cms/lib/audit';

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set — transactional emails disabled.');
    return null;
  }
  return new Resend(apiKey);
}

const FROM = process.env.RESEND_FROM || 'ElevateBallers <info@elevateballers.com>';
const SMTP_FROM = process.env.SMTP_FROM || FROM;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? Number.parseInt(process.env.SMTP_PORT, 10) : undefined;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const ADMIN_TO = process.env.ADMIN_EMAIL || 'info@elevateballers.com';
const BREVO_FROM = process.env.BREVO_FROM || process.env.RESEND_FROM || 'ElevateBallers <info@elevateballers.com>';
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || 'ElevateBallers';
const SITE_URL = process.env.SITE_URL || 'https://elevateballers.com';
const LOGO_URL = `${SITE_URL}/images/Elevate_Icon.png`;

function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function hashRecipients(recipients: string[]): string[] {
  return recipients.map((recipient) => hashValue(recipient.toLowerCase().trim()));
}

function getBrevoClient() {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn('[email] BREVO_API_KEY not set — article notifications disabled.');
    return null;
  }
  return new BrevoClient({ apiKey });
}

function getSmtpTransport() {
  if (!SMTP_HOST || !SMTP_PORT) {
    console.warn('[email] SMTP_HOST/SMTP_PORT not set — SMTP fallback disabled.');
    return null;
  }

  const secure = SMTP_PORT === 465;

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure,
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
}

async function sendTransactionalEmail(data: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  from?: string;
  audit?: {
    type?: string;
    template?: string;
  };
}): Promise<void> {
  const recipients = Array.isArray(data.to) ? data.to : [data.to];
  const traceId = crypto.randomUUID();
  const eventId = crypto.randomUUID();
  const startedAt = Date.now();
  const resend = getResend();
  if (resend) {
    try {
      const { error, data: resendData } = await resend.emails.send({
        from: data.from || FROM,
        to: data.to,
        replyTo: data.replyTo,
        subject: data.subject,
        html: data.html,
      });
      if (error) throw new Error(error.message);
      const durationMs = Date.now() - startedAt;
      await logAuditSystem(data.audit?.type || 'EMAIL_SENT', {
        provider: 'resend',
        template: data.audit?.template ?? null,
        toHash: hashRecipients(recipients),
        subjectHash: hashValue(data.subject),
        eventId,
        traceId,
        durationMs,
        responseId: (resendData as any)?.id ?? null,
      });
      return;
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      await logAuditSystem('EMAIL_FAILED', {
        provider: 'resend',
        template: data.audit?.template ?? null,
        toHash: hashRecipients(recipients),
        subjectHash: hashValue(data.subject),
        eventId,
        traceId,
        durationMs,
        error: error instanceof Error ? error.message : String(error),
      });
      console.warn('[email] Resend failed, falling back to SMTP:', error);
    }
  }

  const transport = getSmtpTransport();
  if (!transport) {
    console.warn('[email] No transactional email provider configured.');
    const durationMs = Date.now() - startedAt;
    await logAuditSystem('EMAIL_FAILED', {
      provider: 'smtp',
      template: data.audit?.template ?? null,
      toHash: hashRecipients(recipients),
      subjectHash: hashValue(data.subject),
      eventId,
      traceId,
      durationMs,
      error: 'SMTP not configured',
    });
    return;
  }

  try {
    const info = await transport.sendMail({
      from: data.from || SMTP_FROM,
      to: data.to,
      subject: data.subject,
      html: data.html,
      replyTo: data.replyTo,
    });
    const durationMs = Date.now() - startedAt;
    await logAuditSystem(data.audit?.type || 'EMAIL_SENT', {
      provider: 'smtp',
      template: data.audit?.template ?? null,
      toHash: hashRecipients(recipients),
      subjectHash: hashValue(data.subject),
      eventId,
      traceId,
      durationMs,
      responseId: info?.messageId ?? null,
    });
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    await logAuditSystem('EMAIL_FAILED', {
      provider: 'smtp',
      template: data.audit?.template ?? null,
      toHash: hashRecipients(recipients),
      subjectHash: hashValue(data.subject),
      eventId,
      traceId,
      durationMs,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// Brand colors
const C = {
  primary: '#dd3333',
  primaryDark: '#bb2222',
  secondary: '#ffba00',
  accent: '#552085',
  dark: '#222222',
  white: '#ffffff',
  gray: '#6b7280',
  lightGray: '#f2f4f7',
  border: '#e5e7eb',
  text: '#1f2937',
};

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>ElevateBallers</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Teko:wght@700&family=Rubik:wght@400;500;600&display=swap');

    * { box-sizing: border-box; }

    body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: ${C.lightGray};
      font-family: 'Rubik', Arial, sans-serif;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }

    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }

    .email-container {
      max-width: 600px !important;
      width: 100% !important;
      margin: 0 auto !important;
    }

    .email-body {
      padding: 40px 32px !important;
    }

    .email-header {
      padding: 20px 32px !important;
    }

    .email-footer {
      padding: 20px 32px !important;
    }

    .logo-text {
      font-size: 28px !important;
    }

    /* ── Mobile ── */
    @media only screen and (max-width: 620px) {
      .email-container {
        width: 100% !important;
      }

      .email-body {
        padding: 28px 20px !important;
      }

      .email-header {
        padding: 16px 20px !important;
        border-radius: 0 !important;
      }

      .email-footer {
        padding: 16px 20px !important;
        border-radius: 0 !important;
      }

      .logo-img {
        width: 44px !important;
        height: 44px !important;
        margin-right: 8px !important;
      }

      .logo-text {
        font-size: 22px !important;
      }

      .btn-primary {
        display: block !important;
        width: 100% !important;
        text-align: center !important;
        padding: 14px 20px !important;
        box-sizing: border-box !important;
      }

      .article-image {
        width: 100% !important;
        height: auto !important;
      }

      h2.article-title {
        font-size: 22px !important;
      }
    }
  </style>
</head>
<body>
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">ElevateBallers — Latest updates from the court.</div>
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${C.lightGray};padding:24px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" class="email-container" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td class="email-header" style="background-color:${C.primary};padding:20px 32px;border-radius:8px 8px 0 0;text-align:center;">
              <img class="logo-img" src="${LOGO_URL}" alt="ElevateBallers" width="56" height="56"
                style="display:inline-block;vertical-align:middle;margin-right:12px;border-radius:4px;width:56px;height:56px;" />
              <span class="logo-text" style="font-family:'Teko',Arial,sans-serif;font-size:28px;font-weight:700;color:${C.white};vertical-align:middle;letter-spacing:1px;text-transform:uppercase;">ElevateBallers</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="email-body" style="background-color:${C.white};padding:40px 32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="email-footer" style="background-color:${C.accent};padding:20px 32px;border-radius:0 0 8px 8px;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;color:${C.white};">
                © ${new Date().getFullYear()} ElevateBallers. All rights reserved.
              </p>
              <p style="margin:0;">
                <a href="${SITE_URL}" style="color:${C.secondary};font-size:13px;text-decoration:none;">Visit our website</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function btn(text: string, url: string): string {
  return `<a href="${url}" class="btn-primary" style="display:inline-block;margin-top:20px;padding:12px 28px;background-color:${C.primary};color:${C.white};text-decoration:none;border-radius:6px;font-weight:600;font-size:15px;letter-spacing:0.5px;">${text}</a>`;
}

function unsubscribeFooter(url: string): string {
  return `<p style="margin:32px 0 0;padding-top:24px;border-top:1px solid ${C.border};font-size:12px;color:${C.gray};text-align:center;">
    You're receiving this because you subscribed to ElevateBallers email alerts.&nbsp;
    <a href="${url}" style="color:${C.gray};text-decoration:underline;">Unsubscribe</a>
  </p>`;
}

type AdminNotificationType =
  | 'contact_message'
  | 'team_registered'
  | 'player_registered'
  | 'player_auto_linked';

const DEFAULT_EMAIL_PREFS: Record<AdminNotificationType, boolean> = {
  contact_message: true,
  team_registered: true,
  player_registered: true,
  player_auto_linked: true,
};

function normalizeEmailPreferences(input: any): Record<AdminNotificationType, boolean> {
  if (!input || typeof input !== 'object') return { ...DEFAULT_EMAIL_PREFS };
  return {
    contact_message: input.contact_message !== undefined ? Boolean(input.contact_message) : true,
    team_registered: input.team_registered !== undefined ? Boolean(input.team_registered) : true,
    player_registered: input.player_registered !== undefined ? Boolean(input.player_registered) : true,
    player_auto_linked: input.player_auto_linked !== undefined ? Boolean(input.player_auto_linked) : true,
  };
}

async function getAdminRecipientEmails(type?: AdminNotificationType): Promise<string[]> {
  try {
    const toggle = await prisma.siteSetting.findUnique({
      where: { key: 'admin_email_notifications_enabled' },
      select: { value: true },
    });

    if (toggle && toggle.value.toLowerCase() === 'false') {
      console.warn('[email] Admin email notifications are disabled by site settings.');
      return [];
    }

    const admins = await prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            role: {
              name: 'Admin',
              permissions: {
                some: {
                  permission: {
                    resource: 'notifications',
                    action: 'email',
                  },
                },
              },
            },
          },
        },
      },
      select: {
        email: true,
        notificationSettings: {
          select: {
            emailEnabled: true,
            emailPreferences: true,
          },
        },
      },
    });

    const emails = admins
      .filter((admin) => {
        const emailEnabled = admin.notificationSettings?.emailEnabled ?? true;
        if (!emailEnabled) return false;
        if (!type) return true;
        const prefs = normalizeEmailPreferences(admin.notificationSettings?.emailPreferences);
        return prefs[type];
      })
      .map((admin) => admin.email?.trim())
      .filter((email): email is string => Boolean(email));

    return Array.from(new Set(emails));
  } catch (error) {
    console.warn('[email] Failed to read admin emails from users:', error);
    return [];
  }
}

// ---------------------------------------------------------------------------

export async function sendAdminNotificationEmail(data: {
  type: AdminNotificationType;
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

export async function sendPasswordResetEmail(data: {
  email: string;
  name?: string | null;
  resetUrl: string;
  expiresInMinutes: number;
}): Promise<void> {
  const greeting = data.name ? `Hi ${data.name},` : 'Hi there,';

  const html = emailWrapper(`
    <h2 style="margin:0 0 16px;font-size:22px;color:${C.primary};font-family:'Teko',Arial,sans-serif;letter-spacing:0.5px;text-transform:uppercase;">Reset Your Password</h2>
    <p style="margin:0 0 16px;font-size:15px;color:${C.text};line-height:1.7;">${greeting}</p>
    <p style="margin:0 0 16px;font-size:15px;color:${C.text};line-height:1.7;">
      We received a request to reset your ElevateBallers admin password.
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:${C.text};line-height:1.7;">
      Click the button below to set a new password. This link expires in ${data.expiresInMinutes} minutes.
    </p>
    ${btn('Reset Password', data.resetUrl)}
    <p style="margin:20px 0 0;font-size:13px;color:${C.gray};line-height:1.6;">
      If you did not request this, you can safely ignore this email.
    </p>
  `);

  await sendTransactionalEmail({
    to: data.email,
    subject: 'Reset your ElevateBallers password',
    html,
    audit: { template: 'password_reset' },
  });
  console.log(`[email] Password reset email sent to ${data.email}`);
}

export async function sendEmailChangedAlert(data: {
  name: string;
  newEmail: string;
  oldEmail: string;
}): Promise<void> {
  const html = emailWrapper(`
    <h2 style="margin:0 0 16px;font-size:22px;color:${C.primary};font-family:'Teko',Arial,sans-serif;letter-spacing:0.5px;text-transform:uppercase;">Login Email Updated</h2>
    <p style="margin:0 0 16px;font-size:15px;color:${C.text};line-height:1.7;">Hi ${data.name},</p>
    <p style="margin:0 0 16px;font-size:15px;color:${C.text};line-height:1.7;">
      The login email address for your ElevateBallers admin account has been updated by an administrator.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.lightGray};border-radius:6px;padding:16px 20px;margin-bottom:24px;">
      <tr><td style="padding:6px 0;font-size:14px;color:${C.text};"><strong>Previous email:</strong> ${data.oldEmail}</td></tr>
      <tr><td style="padding:6px 0;font-size:14px;color:${C.text};"><strong>New email:</strong> ${data.newEmail}</td></tr>
    </table>
    <p style="margin:0 0 16px;font-size:15px;color:${C.text};line-height:1.7;">
      You will now use <strong>${data.newEmail}</strong> to sign in. If you did not expect this change,
      contact your system administrator immediately.
    </p>
    <p style="margin:0;font-size:13px;color:${C.gray};line-height:1.6;">
      This is an automated security notification. Please do not reply to this email.
    </p>
  `);

  await sendTransactionalEmail({
    to: data.newEmail,
    subject: 'Your ElevateBallers login email has been updated',
    html,
    audit: { template: 'email_changed_alert' },
  });
  console.log(`[email] Email change alert sent to ${data.newEmail} (was ${data.oldEmail})`);
}

export async function sendWelcomeSetPasswordEmail(data: {
  email: string;
  name: string;
  setPasswordUrl: string;
  expiresInMinutes: number;
}): Promise<void> {
  const html = emailWrapper(`
    <h2 style="margin:0 0 16px;font-size:22px;color:${C.primary};font-family:'Teko',Arial,sans-serif;letter-spacing:0.5px;text-transform:uppercase;">Welcome to ElevateBallers!</h2>
    <p style="margin:0 0 16px;font-size:15px;color:${C.text};line-height:1.7;">Hi ${data.name},</p>
    <p style="margin:0 0 16px;font-size:15px;color:${C.text};line-height:1.7;">
      An admin account has been created for you on the ElevateBallers admin panel.
      Click the button below to set your password and activate your account.
    </p>
    <p style="margin:0 0 24px;font-size:15px;color:${C.text};line-height:1.7;">
      This link expires in <strong>${data.expiresInMinutes} minutes</strong>.
    </p>
    ${btn('Set Your Password', data.setPasswordUrl)}
    <p style="margin:20px 0 0;font-size:13px;color:${C.gray};line-height:1.6;">
      If you were not expecting this, please ignore this email.
    </p>
  `);

  await sendTransactionalEmail({
    to: data.email,
    subject: 'Welcome to ElevateBallers — Set your password',
    html,
    audit: { template: 'welcome_set_password' },
  });
  console.log(`[email] Welcome set-password email sent to ${data.email}`);
}

export async function sendLoginOtpEmail(data: {
  email: string;
  name?: string | null;
  code: string;
}): Promise<void> {
  const greeting = data.name ? `Hi ${data.name},` : 'Hi there,';

  const html = emailWrapper(`
    <h2 style="margin:0 0 16px;font-size:22px;color:${C.primary};font-family:'Teko',Arial,sans-serif;letter-spacing:0.5px;text-transform:uppercase;">Your Login Code</h2>
    <p style="margin:0 0 16px;font-size:15px;color:${C.text};line-height:1.7;">${greeting}</p>
    <p style="margin:0 0 24px;font-size:15px;color:${C.text};line-height:1.7;">
      Use the verification code below to complete your sign-in to the ElevateBallers admin panel.
      This code expires in <strong>10 minutes</strong>.
    </p>
    <div style="text-align:center;margin:0 0 24px;padding:24px;background:${C.lightGray};border-radius:8px;border:2px dashed ${C.border};">
      <span style="font-family:'Teko',Arial,sans-serif;font-size:48px;font-weight:700;letter-spacing:12px;color:${C.primary};">${data.code}</span>
    </div>
    <p style="margin:0;font-size:13px;color:${C.gray};line-height:1.6;">
      If you did not attempt to sign in, please ignore this email. Your account remains secure.
    </p>
  `);

  await sendTransactionalEmail({
    to: data.email,
    subject: 'Your ElevateBallers login code',
    html,
    audit: { template: 'login_otp' },
  });
  console.log(`[email] Login OTP sent to ${data.email}`);
}

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

// Article notifications use Brevo (campaign emails — no rate limits)
export async function sendArticleNotification(data: {
  subscribers: { email: string; name: string | null; token: string }[];
  article: { title: string; excerpt: string | null; slug: string; image: string | null };
}): Promise<{ sent: number; failed: number }> {
  const brevo = getBrevoClient();
  if (!brevo) return { sent: 0, failed: 0 };

  const articleUrl = `${SITE_URL}/news/${data.article.slug}`;
  const senderEmail = BREVO_FROM?.match(/<(.+)>/)?.[1] || BREVO_FROM || 'info@elevateballers.com';

  let sent = 0, failed = 0;

  const traceId = crypto.randomUUID();
  const startedAt = Date.now();
  for (const subscriber of data.subscribers) {
    const unsubscribeUrl = `${SITE_URL}/unsubscribe?token=${subscriber.token}`;
    const greeting = subscriber.name ? `Hi ${subscriber.name},` : 'Hi there,';

    const html = emailWrapper(`
      <p style="margin:0 0 8px;font-size:13px;color:${C.gray};text-transform:uppercase;letter-spacing:1px;font-weight:600;">New Article</p>
      <h2 class="article-title" style="margin:0 0 20px;font-size:26px;color:${C.text};font-family:'Teko',Arial,sans-serif;letter-spacing:0.5px;line-height:1.2;">${data.article.title}</h2>

      ${data.article.image ? `<img class="article-image" src="${data.article.image}" alt="${data.article.title}" style="width:100%;max-width:536px;height:auto;border-radius:8px;display:block;margin-bottom:20px;" />` : ''}

      <p style="margin:0 0 16px;font-size:15px;color:${C.text};line-height:1.7;">${greeting}</p>
      <p style="margin:0 0 16px;font-size:15px;color:${C.text};line-height:1.7;">A new article has just been published on ElevateBallers.</p>

      ${data.article.excerpt ? `<p style="margin:0 0 20px;font-size:15px;color:${C.gray};line-height:1.7;border-left:4px solid ${C.secondary};padding-left:16px;">${data.article.excerpt}</p>` : ''}

      ${btn('Read Article →', articleUrl)}
      ${unsubscribeFooter(unsubscribeUrl)}
    `);

    try {
      await brevo.transactionalEmails.sendTransacEmail({
        sender: { name: BREVO_SENDER_NAME, email: senderEmail },
        to: [{ email: subscriber.email, name: subscriber.name || undefined }],
        subject: `New Article: ${data.article.title}`,
        htmlContent: html,
      });
      sent++;
    } catch (err: any) {
      console.error(`[email] Brevo failed for ${subscriber.email}:`, err.message);
      await logAuditSystem('EMAIL_FAILED', {
        provider: 'brevo',
        template: 'article_notification',
        toHash: hashRecipients([subscriber.email]),
        subjectHash: hashValue(`New Article: ${data.article.title}`),
        traceId,
        error: err?.message || String(err),
      });
      failed++;
    }
  }

  const durationMs = Date.now() - startedAt;
  await logAuditSystem('EMAIL_BULK_SENT', {
    provider: 'brevo',
    template: 'article_notification',
    subjectHash: hashValue(`New Article: ${data.article.title}`),
    traceId,
    durationMs,
    sent,
    failed,
  });
  console.log(`[email] Article notification via Brevo: ${sent} sent, ${failed} failed.`);
  return { sent, failed };
}

export async function sendSubscriberWelcome(data: {
  email: string;
  name?: string;
  unsubscribeToken?: string;
}): Promise<void> {
  const unsubscribeUrl = data.unsubscribeToken
    ? `${SITE_URL}/unsubscribe?token=${data.unsubscribeToken}`
    : `${SITE_URL}/unsubscribe`;

  const greeting = data.name ? `Hi ${data.name},` : 'Hi there,';

  const html = emailWrapper(`
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;background:${C.secondary};border-radius:50%;width:64px;height:64px;line-height:64px;font-size:32px;">🏀</div>
    </div>

    <h2 style="margin:0 0 16px;font-size:26px;color:${C.primary};font-family:'Teko',Arial,sans-serif;letter-spacing:0.5px;text-transform:uppercase;text-align:center;">Welcome to ElevateBallers!</h2>

    <p style="margin:0 0 16px;font-size:15px;color:${C.text};line-height:1.7;">${greeting}</p>
    <p style="margin:0 0 16px;font-size:15px;color:${C.text};line-height:1.7;">
      You're now subscribed to ElevateBallers email alerts. We'll keep you updated with the latest:
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr><td style="padding:8px 0;font-size:14px;color:${C.text};">🏆 &nbsp;League standings and match results</td></tr>
      <tr><td style="padding:8px 0;font-size:14px;color:${C.text};">📰 &nbsp;News articles and match reports</td></tr>
      <tr><td style="padding:8px 0;font-size:14px;color:${C.text};">⭐ &nbsp;Player highlights and features</td></tr>
    </table>

    ${btn('Visit ElevateBallers', SITE_URL)}
    ${unsubscribeFooter(unsubscribeUrl)}
  `);

  await sendTransactionalEmail({
    to: data.email,
    subject: 'Welcome to ElevateBallers Email Alerts!',
    html,
    audit: { template: 'subscriber_welcome' },
  });
  console.log(`[email] Welcome email sent to ${data.email}`);
}
