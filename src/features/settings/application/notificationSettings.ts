import type { SiteSetting } from '../domain/siteSetting';

export type EmailProviderSetting = { provider: string; credential: string; useFor: string; status: string };
export type EmailTemplateEvent = 'registration' | 'approved' | 'rejected' | 'payment' | 'match' | 'verify';
export type EmailTemplate = { enabled: boolean; subject: string; body: string };

export type OutboundEmailSettings = {
  autoReplies: boolean; adminCopy: boolean; senderName: string; senderEmail: string; replyTo: string;
  providers: EmailProviderSetting[]; routing: string; failover: boolean; failoverAfter: number;
  failoverCooldown: number; failoverAlert: boolean; format: string; brandHeader: boolean;
  signature: string; footerNote: string;
};
export type EmailTemplateSettings = Record<EmailTemplateEvent, EmailTemplate> & { matchLead: number; linkExpiry: number };
export type EmailDeliverySettings = {
  perMinute: number; perRecipientDay: number; dedupe: boolean; dedupeWindow: number;
  logErrors: boolean; retries: number; alertEmail: string; bounceThreshold: number;
  history: boolean; retention: number; trackOpens: boolean;
};

export const DEFAULT_OUTBOUND_EMAIL_SETTINGS: OutboundEmailSettings = {
  autoReplies: true, adminCopy: false, senderName: 'Elevate Ballers', senderEmail: 'no-reply@elevateballers.com',
  replyTo: 'ballers@elevateballers.com',
  providers: [
    { provider: 'Resend', credential: '', useFor: 'Transactional', status: 'Verified' },
    { provider: 'Brevo', credential: '', useFor: 'Bulk & newsletter', status: 'Verified' },
    { provider: 'Mailgun', credential: '', useFor: 'Bulk & newsletter', status: 'Verified' },
    { provider: 'SMTP', credential: 'smtp.elevateballers.com:587', useFor: 'Fallback only', status: 'Unverified' },
  ],
  routing: 'By “Use for” column', failover: true, failoverAfter: 2, failoverCooldown: 15,
  failoverAlert: true, format: 'HTML and plain text', brandHeader: true,
  signature: 'Elevate Ballers League\nPepo Lane, off Dagoretti Road, Nairobi\n0703 913 923 · ballers@elevateballers.com',
  footerNote: 'You are receiving this because you registered with Elevate Ballers.',
};

export const DEFAULT_EMAIL_TEMPLATE_SETTINGS: EmailTemplateSettings = {
  registration: { enabled: true, subject: 'We’ve received your {season} registration', body: 'Hi {firstName},\n\nThanks for registering {team} for the {season} {league} season. Your application ID is {applicationId}.\n\nOur team reviews entries within 3 working days and will email you the outcome.' },
  approved: { enabled: true, subject: '{team} is in — {season} registration approved', body: 'Hi {firstName},\n\nGood news: {team} has been accepted into the {season} {league} season. Application {applicationId} is now marked {status}.\n\nYour entry fee of {amount} is due before the roster deadline. Fixtures are published once all entries are confirmed.' },
  rejected: { enabled: true, subject: 'About your {season} registration', body: 'Hi {firstName},\n\nThanks for applying to the {season} {league} season. We’re unable to confirm {team} this time — application {applicationId} is marked {status}.\n\nReply to this email and we’ll explain the reason and what would make a future entry successful.' },
  payment: { enabled: true, subject: 'Payment received — {amount} for {team}', body: 'Hi {firstName},\n\nWe’ve received {amount} for {team}’s {season} entry. Application {applicationId} is fully paid.\n\nKeep this email as your receipt.' },
  match: { enabled: true, subject: '{team} vs {opponent} — {matchDate}', body: 'Hi {firstName},\n\n{team} play {opponent} on {matchDate} at {venue}.\n\nArrive 45 minutes before tip-off with your squad list. Full fixture details: {link}' },
  verify: { enabled: true, subject: 'Confirm your Elevate Ballers account', body: 'Hi {firstName},\n\nUse the link below to continue. It expires in {expiry}.\n\n{link}\n\nIf you didn’t request this, ignore this email and nothing will change.' },
  matchLead: 2,
  linkExpiry: 60,
};

export const DEFAULT_EMAIL_DELIVERY_SETTINGS: EmailDeliverySettings = {
  perMinute: 60, perRecipientDay: 5, dedupe: true, dedupeWindow: 30, logErrors: true,
  retries: 3, alertEmail: 'ballers@elevateballers.com', bounceThreshold: 5,
  history: true, retention: 90, trackOpens: false,
};

const bool = (value: string | undefined, fallback: boolean) => value === 'true' ? true : value === 'false' ? false : fallback;
const text = (value: string | undefined, fallback: string) => value === undefined ? fallback : value.trim();
const num = (value: string | undefined, fallback: number, min = 0, max = 10000) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.round(parsed))) : fallback;
};
const valuesOf = (settings: SiteSetting[]) => Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));

export function resolveOutboundEmailSettings(settings: SiteSetting[]): OutboundEmailSettings {
  const v = valuesOf(settings); const d = DEFAULT_OUTBOUND_EMAIL_SETTINGS;
  let providers = d.providers;
  if (v.email_providers !== undefined) try {
    const parsed = JSON.parse(v.email_providers);
    if (Array.isArray(parsed)) providers = parsed.map((item) => ({ provider: String(item?.provider ?? '').trim(), credential: String(item?.credential ?? ''), useFor: String(item?.useFor ?? '').trim(), status: String(item?.status ?? '').trim() })).filter((item) => item.provider).slice(0, 8);
  } catch { providers = d.providers; }
  return {
    autoReplies: bool(v.email_autoReplies, d.autoReplies), adminCopy: bool(v.email_adminCopy, d.adminCopy),
    senderName: text(v.email_senderName, d.senderName), senderEmail: text(v.email_senderEmail, d.senderEmail), replyTo: text(v.email_replyTo, d.replyTo),
    providers, routing: text(v.email_routing, d.routing), failover: bool(v.email_failover, d.failover),
    failoverAfter: num(v.email_failoverAfter, d.failoverAfter, 1, 20), failoverCooldown: num(v.email_failoverCooldown, d.failoverCooldown, 1, 1440),
    failoverAlert: bool(v.email_failoverAlert, d.failoverAlert), format: text(v.email_format, d.format), brandHeader: bool(v.email_brandHeader, d.brandHeader),
    signature: text(v.email_signature, d.signature), footerNote: text(v.email_footerNote, d.footerNote),
  };
}

export function resolveEmailTemplateSettings(settings: SiteSetting[]): EmailTemplateSettings {
  const v = valuesOf(settings); const d = DEFAULT_EMAIL_TEMPLATE_SETTINGS;
  const event = (name: EmailTemplateEvent): EmailTemplate => ({ enabled: bool(v[`emailTemplates_${name}Enabled`], d[name].enabled), subject: text(v[`emailTemplates_${name}Subject`], d[name].subject), body: text(v[`emailTemplates_${name}Body`], d[name].body) });
  return { registration: event('registration'), approved: event('approved'), rejected: event('rejected'), payment: event('payment'), match: event('match'), verify: event('verify'), matchLead: num(v.emailTemplates_matchLead, d.matchLead, 0, 30), linkExpiry: num(v.emailTemplates_linkExpiry, d.linkExpiry, 5, 10080) };
}

export function resolveEmailDeliverySettings(settings: SiteSetting[]): EmailDeliverySettings {
  const v = valuesOf(settings); const d = DEFAULT_EMAIL_DELIVERY_SETTINGS;
  return {
    perMinute: num(v.emailDelivery_perMinute, d.perMinute, 1, 10000), perRecipientDay: num(v.emailDelivery_perRecipientDay, d.perRecipientDay, 1, 1000),
    dedupe: bool(v.emailDelivery_dedupe, d.dedupe), dedupeWindow: num(v.emailDelivery_dedupeWindow, d.dedupeWindow, 1, 1440),
    logErrors: bool(v.emailDelivery_logErrors, d.logErrors), retries: num(v.emailDelivery_retries, d.retries, 0, 10),
    alertEmail: text(v.emailDelivery_alertEmail, d.alertEmail), bounceThreshold: num(v.emailDelivery_bounceThreshold, d.bounceThreshold, 1, 100),
    history: bool(v.emailDelivery_history, d.history), retention: num(v.emailDelivery_retention, d.retention, 1, 3650), trackOpens: bool(v.emailDelivery_trackOpens, d.trackOpens),
  };
}

export function fillEmailTemplate(template: string, variables: Record<string, unknown>): string {
  return template.replace(/\{(\w+)\}/g, (token, key) => variables[key] == null ? token : String(variables[key]));
}
