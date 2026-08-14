import { Resend } from 'resend';
import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import { BrevoClient } from '@getbrevo/brevo';
import { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } from './config';

export function getResend(apiKeyOverride?: string) {
  const apiKey = apiKeyOverride || process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set — transactional emails disabled.');
    return null;
  }
  return new Resend(apiKey);
}

export function getBrevoClient(apiKeyOverride?: string) {
  const apiKey = apiKeyOverride || process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn('[email] BREVO_API_KEY not set — article notifications disabled.');
    return null;
  }
  return new BrevoClient({ apiKey });
}

export function getSmtpTransport(override?: { host?: string; port?: number; user?: string; pass?: string; secure?: boolean }) {
  const host = override?.host || SMTP_HOST;
  const port = override?.port || SMTP_PORT;
  if (!host || !port) {
    console.warn('[email] SMTP_HOST/SMTP_PORT not set — SMTP fallback disabled.');
    return null;
  }

  const secure = override?.secure ?? port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: override?.user && override?.pass
      ? { user: override.user, pass: override.pass }
      : SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
}

export type ProviderMessage = {
  from: string;
  to: string | string[];
  bcc?: string;
  replyTo?: string;
  subject: string;
  html?: string;
  text?: string;
};

export function parseSmtpCredential(credential?: string) {
  if (!credential) return undefined;
  try {
    const parsed = JSON.parse(credential);
    if (parsed && typeof parsed === 'object') {
      return {
        host: String(parsed.host || ''),
        port: Number(parsed.port || 587),
        user: parsed.user ? String(parsed.user) : undefined,
        pass: parsed.pass ? String(parsed.pass) : undefined,
        secure: parsed.secure === undefined ? undefined : Boolean(parsed.secure),
      };
    }
  } catch { /* host:port shorthand */ }
  const match = credential.match(/^([^:]+):(\d+)$/);
  return match ? { host: match[1], port: Number(match[2]) } : undefined;
}

function parseMailgunCredential(credential?: string) {
  let apiKey = process.env.MAILGUN_API_KEY || '';
  let domain = process.env.MAILGUN_DOMAIN || '';
  let baseUrl = process.env.MAILGUN_BASE_URL || 'https://api.mailgun.net';
  if (credential) {
    try {
      const parsed = JSON.parse(credential);
      apiKey = String(parsed.apiKey || parsed.key || apiKey);
      domain = String(parsed.domain || domain);
      baseUrl = String(parsed.baseUrl || baseUrl);
    } catch {
      const separator = credential.includes('|') ? '|' : credential.includes('@') && credential.startsWith('key-') ? '@' : '';
      if (separator) [apiKey, domain] = credential.split(separator, 2);
      else apiKey = credential;
    }
  }
  return apiKey && domain ? { apiKey, domain, baseUrl: baseUrl.replace(/\/$/, '') } : null;
}

export async function sendMailgunEmail(credential: string | undefined, message: ProviderMessage) {
  const config = parseMailgunCredential(credential);
  if (!config) throw new Error('Mailgun requires an API key and domain');
  const form = new URLSearchParams();
  form.set('from', message.from);
  for (const recipient of Array.isArray(message.to) ? message.to : [message.to]) form.append('to', recipient);
  if (message.bcc) form.set('bcc', message.bcc);
  if (message.replyTo) form.set('h:Reply-To', message.replyTo);
  form.set('subject', message.subject);
  if (message.html) form.set('html', message.html);
  if (message.text) form.set('text', message.text);
  const response = await fetch(`${config.baseUrl}/v3/${config.domain}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${config.apiKey}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form,
  });
  const result = await response.json().catch(() => ({})) as { id?: string; message?: string };
  if (!response.ok) throw new Error(result.message || `Mailgun failed with ${response.status}`);
  return { id: result.id };
}

export async function sendBrevoEmail(credential: string | undefined, message: ProviderMessage) {
  const client = getBrevoClient(credential);
  if (!client) throw new Error('Brevo is not configured');
  const senderMatch = message.from.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  const sender = senderMatch
    ? { name: senderMatch[1] || 'Elevate Ballers', email: senderMatch[2] }
    : { name: 'Elevate Ballers', email: message.from };
  const recipients = (Array.isArray(message.to) ? message.to : [message.to]).map((email) => ({ email }));
  const result = await client.transactionalEmails.sendTransacEmail({
    sender,
    to: recipients,
    ...(message.bcc ? { bcc: [{ email: message.bcc }] } : {}),
    ...(message.replyTo ? { replyTo: { email: message.replyTo } } : {}),
    subject: message.subject,
    ...(message.html ? { htmlContent: message.html } : {}),
    ...(message.text ? { textContent: message.text } : {}),
  });
  return { id: String((result as { messageId?: string }).messageId || '') || null };
}

export function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function hashRecipients(recipients: string[]): string[] {
  return recipients.map((recipient) => hashValue(recipient.toLowerCase().trim()));
}
