import { Resend } from 'resend';
import { BrevoClient } from '@getbrevo/brevo';

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set — transactional emails disabled.');
    return null;
  }
  return new Resend(apiKey);
}

const FROM = process.env.RESEND_FROM || 'ElevateBallers <info@elevateballers.com>';
const ADMIN_TO = process.env.ADMIN_EMAIL || 'info@elevateballers.com';
const BREVO_FROM = process.env.BREVO_FROM || 'ElevateBallers <info@elevateballers.com>';
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || 'ElevateBallers';
const SITE_URL = process.env.SITE_URL || 'https://elevateballers.com';
const LOGO_URL = `${SITE_URL}/images/Elevate_Icon.png`;

function getBrevoClient() {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn('[email] BREVO_API_KEY not set — article notifications disabled.');
    return null;
  }
  return new BrevoClient({ apiKey });
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

// ---------------------------------------------------------------------------

export async function sendContactNotification(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend) return;

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

  const { error } = await resend.emails.send({
    from: FROM,
    to: ADMIN_TO,
    replyTo: data.email,
    subject: `New Contact Message: ${data.subject}`,
    html,
  });

  if (error) throw new Error(error.message);
  console.log(`[email] Contact notification sent to ${ADMIN_TO}`);
}

export async function sendContactAutoReply(data: {
  name: string;
  email: string;
  subject: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend) return;

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

  const { error } = await resend.emails.send({
    from: FROM,
    to: data.email,
    subject: `We received your message: ${data.subject}`,
    html,
  });

  if (error) throw new Error(error.message);
  console.log(`[email] Auto-reply sent to ${data.email}`);
}

export async function sendTeamRegistrationAutoReply(data: {
  coachName: string;
  email: string;
  teamName: string;
  leagueName?: string | null;
}): Promise<void> {
  const resend = getResend();
  if (!resend) return;

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

  const { error } = await resend.emails.send({
    from: FROM,
    to: data.email,
    subject: `We received your team registration: ${data.teamName}`,
    html,
  });

  if (error) throw new Error(error.message);
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

  await brevo.transactionalEmails.sendTransacEmail({
    sender: { name: BREVO_SENDER_NAME, email: senderEmail },
    to: [{ email: data.email, name: data.coachName || undefined }],
    subject: `We received your team registration: ${data.teamName}`,
    htmlContent: html,
  });
  console.log(`[email] Team registration auto-reply (Brevo) sent to ${data.email}`);
}

export async function sendPlayerRegistrationAutoReply(data: {
  name: string;
  email: string;
  teamName?: string | null;
}): Promise<void> {
  const resend = getResend();
  if (!resend) return;

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

  const { error } = await resend.emails.send({
    from: FROM,
    to: data.email,
    subject: 'We received your player registration',
    html,
  });

  if (error) throw new Error(error.message);
  console.log(`[email] Player registration auto-reply sent to ${data.email}`);
}

export async function sendPlayerRegistrationAutoReplyBrevo(data: {
  name: string;
  email: string;
  teamName?: string | null;
}): Promise<void> {
  const brevo = getBrevoClient();
  if (!brevo) return;

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

  await brevo.transactionalEmails.sendTransacEmail({
    sender: { name: BREVO_SENDER_NAME, email: senderEmail },
    to: [{ email: data.email, name: data.name || undefined }],
    subject: 'We received your player registration',
    htmlContent: html,
  });
  console.log(`[email] Player registration auto-reply (Brevo) sent to ${data.email}`);
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
      failed++;
    }
  }

  console.log(`[email] Article notification via Brevo: ${sent} sent, ${failed} failed.`);
  return { sent, failed };
}

export async function sendSubscriberWelcome(data: {
  email: string;
  name?: string;
  unsubscribeToken?: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend) return;

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

  const { error } = await resend.emails.send({
    from: FROM,
    to: data.email,
    subject: 'Welcome to ElevateBallers Email Alerts!',
    html,
  });

  if (error) throw new Error(error.message);
  console.log(`[email] Welcome email sent to ${data.email}`);
}
