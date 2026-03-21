import crypto from 'node:crypto';
import { logAuditSystem } from '../../../features/cms/lib/audit';
import { C, SITE_URL, BREVO_FROM, BREVO_SENDER_NAME } from '../config';
import { getBrevoClient, hashValue, hashRecipients } from '../providers';
import { emailWrapper, btn, unsubscribeFooter, sendTransactionalEmail } from '../core';

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
