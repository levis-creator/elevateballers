import { Resend } from 'resend';
import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import { BrevoClient } from '@getbrevo/brevo';
import { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } from './config';

export function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set — transactional emails disabled.');
    return null;
  }
  return new Resend(apiKey);
}

export function getBrevoClient() {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn('[email] BREVO_API_KEY not set — article notifications disabled.');
    return null;
  }
  return new BrevoClient({ apiKey });
}

export function getSmtpTransport() {
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

export function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function hashRecipients(recipients: string[]): string[] {
  return recipients.map((recipient) => hashValue(recipient.toLowerCase().trim()));
}
