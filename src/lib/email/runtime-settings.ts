import {
  fillEmailTemplate,
  resolveEmailTemplateSettings,
  siteSettingsService,
  type EmailTemplateEvent,
  type EmailTemplateSettings,
} from '../../features/settings';

let cached: { expires: number; settings: EmailTemplateSettings } | null = null;

export async function getRuntimeEmailTemplates(): Promise<EmailTemplateSettings> {
  if (cached && cached.expires > Date.now()) return cached.settings;
  const records = await siteSettingsService.list('emailTemplates').catch(() => []);
  const settings = resolveEmailTemplateSettings(records);
  cached = { expires: Date.now() + 30_000, settings };
  return settings;
}

const escape = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] || char));
export async function configuredEmailTemplate(event: EmailTemplateEvent, variables: Record<string, unknown>) {
  const templates = await getRuntimeEmailTemplates();
  const template = templates[event];
  if (!template.enabled) return null;
  const subject = fillEmailTemplate(template.subject, variables);
  const body = fillEmailTemplate(template.body, variables);
  const html = body.split(/\n\s*\n/).map((paragraph) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;white-space:pre-line;">${escape(paragraph)}</p>`).join('');
  return { subject, html };
}
