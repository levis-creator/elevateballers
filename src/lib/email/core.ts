import crypto from 'node:crypto';
import { prisma } from '../prisma';
import { logAuditSystem } from '../../features/cms/lib/audit';
import { SMTP_FROM, SITE_URL, LOGO_URL, C, FONT_DISPLAY, FONT_BODY, FONT_MONO, type AdminNotificationType } from './config';
import { getResend, getSmtpTransport, hashValue, hashRecipients, parseSmtpCredential, sendBrevoEmail, sendMailgunEmail, type ProviderMessage } from './providers';
import { cacheGet, cacheSet } from '../cache';
import {
  resolveEmailDeliverySettings,
  resolveOutboundEmailSettings,
  siteSettingsService,
  type EmailDeliverySettings,
  type OutboundEmailSettings,
} from '../../features/settings';

let runtimeSettingsCache: { expires: number; outbound: OutboundEmailSettings; delivery: EmailDeliverySettings } | null = null;
async function getRuntimeSettings() {
  if (runtimeSettingsCache && runtimeSettingsCache.expires > Date.now()) return runtimeSettingsCache;
  const [email, delivery] = await Promise.all([
    siteSettingsService.list('email').catch(() => []),
    siteSettingsService.list('emailDelivery').catch(() => []),
  ]);
  runtimeSettingsCache = { expires: Date.now() + 30_000, outbound: resolveOutboundEmailSettings(email), delivery: resolveEmailDeliverySettings(delivery) };
  return runtimeSettingsCache;
}
const htmlToText = (html: string) => html.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] || char));
function applyEmailPresentation(html: string, settings: OutboundEmailSettings): string {
  let result = html;
  if (!settings.brandHeader) {
    result = result.replace(/\s*<!-- Header \(dark band[\s\S]*?<!-- Brand accent line -->\s*<tr><td[^>]*>[\s\S]*?<\/td><\/tr>/, '');
  }
  const extra = [settings.signature, settings.footerNote].filter(Boolean).map((value, index) => `<p style="margin:${index ? '12px' : '28px'} 0 0;white-space:pre-line;font-size:${index ? '11px' : '13px'};color:#6f665c;${index ? 'border-top:1px solid #e6e1d8;padding-top:12px;' : ''}">${escapeHtml(value)}</p>`).join('');
  return extra ? result.replace(/(<td class="email-body"[\s\S]*?)(<\/td>)/, `$1${extra}$2`) : result;
}
async function deliveryAllowed(recipients: string[], subject: string, template: string, settings: EmailDeliverySettings): Promise<{ allowed: boolean; dedupeKey: string }> {
  const minute = Math.floor(Date.now() / 60_000);
  const minuteKey = `email:minute:${minute}`;
  const minuteCount = await cacheGet<number>(minuteKey) ?? 0;
  if (minuteCount >= settings.perMinute) return { allowed: false, dedupeKey: '' };
  await cacheSet(minuteKey, minuteCount + 1, 70);
  const day = new Date().toISOString().slice(0, 10);
  for (const recipient of recipients) {
    const key = `email:recipient:${day}:${hashValue(recipient.toLowerCase())}`;
    const count = await cacheGet<number>(key) ?? 0;
    if (count >= settings.perRecipientDay) return { allowed: false, dedupeKey: '' };
    await cacheSet(key, count + 1, 90_000);
  }
  const dedupeKey = `email:dedupe:${hashValue(`${template}|${recipients.map((item) => item.toLowerCase()).sort().join(',')}|${subject}`)}`;
  if (settings.dedupe && await cacheGet<boolean>(dedupeKey)) return { allowed: false, dedupeKey };
  return { allowed: true, dedupeKey };
}

type RuntimeProvider = OutboundEmailSettings['providers'][number];
type EmailPurpose = 'transactional' | 'bulk' | 'newsletter';
type TransactionalEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  from?: string;
  purpose?: EmailPurpose;
  dedupeKey?: string;
  audit?: { type?: string; template?: string };
};

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const providerName = (provider: RuntimeProvider) => provider.provider.trim().toLowerCase();
const isHardBounce = (error: unknown) => /hard bounce|invalid recipient|mailbox (?:does not exist|unavailable)|user unknown|5\.1\.1/i.test(error instanceof Error ? error.message : String(error));

async function incrementCache(key: string, ttl: number): Promise<number> {
  const next = (await cacheGet<number>(key) ?? 0) + 1;
  await cacheSet(key, next, ttl);
  return next;
}

async function orderedProviders(settings: OutboundEmailSettings, purpose: EmailPurpose): Promise<RuntimeProvider[]> {
  const available = settings.providers.filter((provider) => {
    const name = providerName(provider);
    return ['resend', 'brevo', 'mailgun', 'smtp'].includes(name) && !/disabled|inactive/i.test(provider.status);
  });
  if (available.length < 2) return available;
  if (/round-robin/i.test(settings.routing)) {
    const cursor = await incrementCache('email:provider:round-robin', 31_536_000);
    const offset = (cursor - 1) % available.length;
    return [...available.slice(offset), ...available.slice(0, offset)];
  }
  if (/use for/i.test(settings.routing)) {
    const purposeWords = purpose === 'transactional' ? /transactional/i : purpose === 'newsletter' ? /newsletter|bulk/i : /bulk|newsletter/i;
    const preferred = available.filter((provider) => purposeWords.test(provider.useFor));
    const fallback = available.filter((provider) => /fallback/i.test(provider.useFor));
    const remaining = available.filter((provider) => !preferred.includes(provider) && !fallback.includes(provider));
    return [...preferred, ...remaining, ...fallback];
  }
  return available;
}

async function sendWithProvider(provider: RuntimeProvider, message: ProviderMessage): Promise<string | null> {
  const name = providerName(provider);
  const credential = provider.credential && !provider.credential.includes('•') ? provider.credential : undefined;
  if (name === 'resend') {
    const resend = getResend(credential);
    if (!resend) throw new Error('Resend is not configured');
    const { data, error } = await resend.emails.send({
      from: message.from,
      to: message.to,
      bcc: message.bcc,
      replyTo: message.replyTo,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
    if (error) throw new Error(error.message);
    return data?.id ?? null;
  }
  if (name === 'mailgun') return (await sendMailgunEmail(credential, message)).id ?? null;
  if (name === 'brevo') return (await sendBrevoEmail(credential, message)).id ?? null;
  if (name === 'smtp') {
    const transport = getSmtpTransport(parseSmtpCredential(credential));
    if (!transport) throw new Error('SMTP is not configured');
    const result = await transport.sendMail({ ...message, from: message.from || SMTP_FROM });
    return result?.messageId ?? null;
  }
  throw new Error(`Unsupported email provider: ${provider.provider}`);
}

function trackingToken(eventId: string): string | null {
  const secret = process.env.EMAIL_TRACKING_SECRET || process.env.AUTH_SECRET || process.env.JWT_SECRET;
  if (!secret) return null;
  return crypto.createHmac('sha256', secret).update(eventId).digest('base64url');
}

export function verifyEmailTrackingToken(eventId: string, token: string): boolean {
  const expected = trackingToken(eventId);
  if (!expected || expected.length !== token.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}

function addOpenTracking(html: string, eventId: string): string {
  const token = trackingToken(eventId);
  if (!token) return html;
  const origin = (process.env.SITE_URL || SITE_URL).replace(/\/$/, '');
  const pixel = `<img src="${origin}/api/email/open/${encodeURIComponent(eventId)}.gif?t=${encodeURIComponent(token)}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0" />`;
  return html.includes('</body>') ? html.replace('</body>', `${pixel}</body>`) : `${html}${pixel}`;
}

async function cleanupEmailHistory(settings: EmailDeliverySettings): Promise<void> {
  const dayKey = `email:history-cleanup:${new Date().toISOString().slice(0, 10)}`;
  if (await cacheGet(dayKey)) return;
  await cacheSet(dayKey, true, 90_000);
  const before = new Date(Date.now() - settings.retention * 86_400_000);
  await prisma.userAuditLog.deleteMany({
    where: { createdAt: { lt: before }, action: { in: ['EMAIL_SENT', 'EMAIL_FAILED', 'EMAIL_OPENED', 'EMAIL_BOUNCED', 'EMAIL_PROVIDER_FAILOVER'] } },
  }).catch((error) => console.warn('[email] History retention cleanup failed:', error));
}

async function sendFailoverAlert(provider: RuntimeProvider, message: ProviderMessage, failedProviders: string[], settings: EmailDeliverySettings) {
  if (!settings.alertEmail || !failedProviders.length) return;
  const key = `email:failover-alert:${hashValue(failedProviders.join(','))}`;
  if (await cacheGet(key)) return;
  await cacheSet(key, true, 900);
  await sendWithProvider(provider, {
    from: message.from,
    to: settings.alertEmail,
    subject: `Email provider failover: ${failedProviders.join(', ')}`,
    text: `Delivery switched to ${provider.provider} after ${failedProviders.join(', ')} failed. Check the notification delivery logs.`,
  }).catch((error) => console.warn('[email] Failed to send provider failover alert:', error));
}

export async function sendTransactionalEmail(data: TransactionalEmailInput): Promise<void> {
  const { outbound, delivery } = await getRuntimeSettings();
  if (!outbound.autoReplies) {
    console.warn('[email] Automatic replies are disabled by site settings.');
    return;
  }
  void cleanupEmailHistory(delivery);
  const recipients = (Array.isArray(data.to) ? data.to : [data.to]).map((item) => item.trim()).filter(Boolean);
  const gate = await deliveryAllowed(recipients, data.subject, data.dedupeKey || data.audit?.template || 'transactional', delivery);
  if (!gate.allowed) {
    console.warn('[email] Message suppressed by configured rate or duplicate limits.');
    return;
  }
  const eventId = crypto.randomUUID();
  const traceId = crypto.randomUUID();
  const from = data.from || `${outbound.senderName} <${outbound.senderEmail}>`;
  const replyTo = data.replyTo || outbound.replyTo || undefined;
  const bcc = outbound.adminCopy && outbound.replyTo && !recipients.includes(outbound.replyTo) ? outbound.replyTo : undefined;
  let html = applyEmailPresentation(data.html, outbound);
  if (delivery.trackOpens) html = addOpenTracking(html, eventId);
  const text = htmlToText(html);
  const message: ProviderMessage = {
    from,
    to: data.to,
    replyTo,
    bcc,
    subject: data.subject,
    ...(outbound.format !== 'Plain text only' ? { html } : {}),
    ...(outbound.format !== 'HTML only' ? { text } : {}),
  };
  const providers = await orderedProviders(outbound, data.purpose || 'transactional');
  if (!providers.length) throw new Error('No transactional email provider is enabled');
  const failedProviders: string[] = [];
  let lastError: unknown = new Error('No email provider accepted the message');

  for (const [providerIndex, provider] of providers.entries()) {
    if (providerIndex > 0 && !outbound.failover) break;
    const cooldownKey = `email:provider:cooldown:${providerName(provider)}`;
    if (providers.length > 1 && await cacheGet(cooldownKey)) continue;
    const attempts = Math.max(1, Math.min(outbound.failoverAfter, delivery.retries + 1));
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const startedAt = Date.now();
      try {
        const responseId = await sendWithProvider(provider, message);
        await incrementCache(`email:sent:${new Date().toISOString().slice(0, 10)}`, 172_800);
        if (delivery.history) logAuditSystem(data.audit?.type || 'EMAIL_SENT', {
          provider: providerName(provider), template: data.audit?.template ?? null,
          toHash: hashRecipients(recipients), subjectHash: hashValue(data.subject), eventId, traceId,
          durationMs: Date.now() - startedAt, responseId, attempt,
        });
        if (delivery.dedupe && gate.dedupeKey) await cacheSet(gate.dedupeKey, true, delivery.dedupeWindow * 60);
        if (failedProviders.length) {
          logAuditSystem('EMAIL_PROVIDER_FAILOVER', { eventId, traceId, failedProviders, selectedProvider: providerName(provider) });
          if (outbound.failoverAlert) void sendFailoverAlert(provider, message, failedProviders, delivery);
        }
        return;
      } catch (error) {
        lastError = error;
        if (attempt < attempts && !isHardBounce(error)) await wait(Math.min(1000, 150 * (2 ** (attempt - 1))));
        else break;
      }
    }
    failedProviders.push(providerName(provider));
    await cacheSet(cooldownKey, true, outbound.failoverCooldown * 60);
    if (delivery.logErrors) logAuditSystem(isHardBounce(lastError) ? 'EMAIL_BOUNCED' : 'EMAIL_FAILED', {
      provider: providerName(provider), template: data.audit?.template ?? null,
      toHash: hashRecipients(recipients), subjectHash: hashValue(data.subject), eventId, traceId,
      error: lastError instanceof Error ? lastError.message : String(lastError),
    });
  }
  throw lastError;
}

export async function recordEmailDeliveryEvent(input: { provider: string; event: 'opened' | 'bounced'; providerMessageId?: string | null }): Promise<void> {
  const { delivery } = await getRuntimeSettings();
  const action = input.event === 'opened' ? 'EMAIL_OPENED' : 'EMAIL_BOUNCED';
  if (delivery.history || input.event === 'bounced') {
    logAuditSystem(action, { provider: input.provider, responseId: input.providerMessageId || null });
  }
  if (input.event !== 'bounced') return;
  const day = new Date().toISOString().slice(0, 10);
  const bounces = await incrementCache(`email:bounced:${day}`, 172_800);
  const sent = await cacheGet<number>(`email:sent:${day}`) ?? 0;
  if (!delivery.alertEmail || sent < 1 || (bounces / sent) * 100 < delivery.bounceThreshold) return;
  await sendTransactionalEmail({
    to: delivery.alertEmail,
    subject: `Email bounce rate alert — ${Math.round((bounces / sent) * 100)}%`,
    html: emailWrapper(`<h2>Email delivery warning</h2><p>${bounces} of ${sent} recorded sends have bounced today. Review provider logs and recipient quality.</p>`),
    dedupeKey: `bounce-threshold-${day}`,
    audit: { template: 'delivery_bounce_alert' },
  }).catch((error) => console.warn('[email] Bounce threshold alert failed:', error));
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
