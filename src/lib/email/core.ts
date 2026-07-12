import crypto from 'node:crypto';
import { prisma } from '../prisma';
import { logAuditSystem } from '../../features/cms/lib/audit';
import { FROM, SMTP_FROM, SITE_URL, LOGO_URL, C, FONT_DISPLAY, FONT_BODY, FONT_MONO, type AdminNotificationType } from './config';
import { getResend, getSmtpTransport, hashValue, hashRecipients } from './providers';
import { cacheGet, cacheSet } from '../cache';

export async function sendTransactionalEmail(data: {
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

export function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Elevate Ballers</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Anton&family=Archivo:wght@400;600;700&family=Space+Mono&display=swap');

    * { box-sizing: border-box; }

    body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: #ece7df;
      font-family: ${FONT_BODY};
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }

    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }

    .email-container { max-width: 600px !important; width: 100% !important; margin: 0 auto !important; }
    .email-body { padding: 40px 34px !important; }
    .email-header { padding: 24px 32px !important; }
    .email-footer { padding: 24px 32px !important; }

    /* ── Mobile ── */
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; }
      .email-body { padding: 30px 22px !important; }
      .email-header { padding: 20px 22px !important; }
      .email-footer { padding: 20px 22px !important; }
      .logo-text { font-size: 22px !important; }
      .btn-primary { display: block !important; width: 100% !important; text-align: center !important; box-sizing: border-box !important; }
      .article-image { width: 100% !important; height: auto !important; }
      h2.article-title { font-size: 22px !important; }
    }
  </style>
</head>
<body>
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">Elevate Ballers — Kenya's premier basketball league.</div>
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ece7df;padding:28px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" class="email-container" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:14px;overflow:hidden;box-shadow:0 20px 50px rgba(12,11,10,0.16);">

          <!-- Header (dark band, logo on a light chip so it stays legible) -->
          <tr>
            <td class="email-header" style="background-color:${C.dark};padding:26px 32px;text-align:center;">
              <span style="display:inline-block;background-color:#ffffff;border-radius:12px;padding:14px 22px;">
                <img src="${LOGO_URL}" alt="Elevate Ballers League" width="204" style="display:block;width:204px;max-width:100%;height:auto;" />
              </span>
            </td>
          </tr>

          <!-- Brand accent line -->
          <tr><td style="height:3px;line-height:3px;font-size:0;background-color:${C.primary};">&nbsp;</td></tr>

          <!-- Body -->
          <tr>
            <td class="email-body" style="background-color:${C.white};padding:40px 34px;color:${C.text};font-family:${FONT_BODY};font-size:15px;line-height:1.7;">
              ${content}
            </td>
          </tr>

          <!-- Footer (dark) -->
          <tr>
            <td class="email-footer" style="background-color:${C.accent};padding:24px 32px;text-align:center;">
              <p style="margin:0 0 6px;font-family:${FONT_MONO};font-size:10px;color:${C.creamdim};text-transform:uppercase;letter-spacing:1.4px;">Nairobi, Kenya · Elevate Ballers League</p>
              <p style="margin:0 0 10px;font-family:${FONT_BODY};font-size:12px;color:${C.creamdim};">© ${new Date().getFullYear()} Elevate Ballers. All rights reserved.</p>
              <a href="${SITE_URL}" style="font-family:${FONT_BODY};font-size:12px;font-weight:700;color:${C.secondary};text-decoration:none;">Visit our website &rarr;</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function btn(text: string, url: string): string {
  return `<a href="${url}" class="btn-primary" style="display:inline-block;margin-top:22px;padding:14px 32px;background-color:${C.primary};color:${C.white};text-decoration:none;border-radius:8px;font-family:${FONT_DISPLAY};font-size:15px;letter-spacing:0.06em;text-transform:uppercase;">${text} &rarr;</a>`;
}

export function unsubscribeFooter(url: string): string {
  return `<p style="margin:32px 0 0;padding-top:24px;border-top:1px solid ${C.border};font-size:12px;color:${C.gray};text-align:center;">
    You're receiving this because you subscribed to ElevateBallers email alerts.&nbsp;
    <a href="${url}" style="color:${C.gray};text-decoration:underline;">Unsubscribe</a>
  </p>`;
}

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

export async function getAdminRecipientEmails(type?: AdminNotificationType): Promise<string[]> {
  const cacheKey = `admin-emails:${type ?? 'all'}`;
  const cached = await cacheGet<string[]>(cacheKey);
  if (cached) return cached;

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
            enabled: true,
            emailEnabled: true,
            emailPreferences: true,
          },
        },
      },
    });

    const emails = admins
      .filter((admin) => {
        // Master switch: if the user turned notifications off entirely, they
        // receive nothing — regardless of the email channel / per-type prefs.
        const enabled = admin.notificationSettings?.enabled ?? true;
        if (!enabled) return false;
        const emailEnabled = admin.notificationSettings?.emailEnabled ?? true;
        if (!emailEnabled) return false;
        if (!type) return true;
        const prefs = normalizeEmailPreferences(admin.notificationSettings?.emailPreferences);
        return prefs[type];
      })
      .map((admin) => admin.email?.trim())
      .filter((email): email is string => Boolean(email));

    const result = Array.from(new Set(emails));
    await cacheSet(cacheKey, result, 1800); // 30 min TTL
    return result;
  } catch (error) {
    console.warn('[email] Failed to read admin emails from users:', error);
    return [];
  }
}
