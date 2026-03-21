import { C } from '../config';
import { emailWrapper, btn, sendTransactionalEmail } from '../core';

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
