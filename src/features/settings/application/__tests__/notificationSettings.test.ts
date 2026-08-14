import { describe, expect, it } from 'vitest';
import type { SiteSetting } from '../../domain/siteSetting';
import { fillEmailTemplate, resolveEmailDeliverySettings, resolveEmailTemplateSettings, resolveOutboundEmailSettings } from '../notificationSettings';

const setting = (key: string, value: string, category: string): SiteSetting => ({ id: key, key, value, type: 'text', label: key, description: null, category, createdAt: new Date(), updatedAt: new Date() });

describe('notification settings', () => {
  it('includes Brevo in the default provider stack', () => {
    const result = resolveOutboundEmailSettings([]);
    expect(result.providers.map((provider) => provider.provider)).toEqual(['Resend', 'Brevo', 'Mailgun', 'SMTP']);
  });

  it('resolves sender, provider priority, failover, and format controls', () => {
    const result = resolveOutboundEmailSettings([
      setting('email_autoReplies', 'false', 'email'),
      setting('email_senderName', 'League Office', 'email'),
      setting('email_providers', '[{"provider":"SMTP","credential":"mail.test:587","useFor":"All mail","status":"Verified"}]', 'email'),
      setting('email_failoverAfter', '4', 'email'),
      setting('email_format', 'Plain text only', 'email'),
    ]);
    expect(result).toMatchObject({ autoReplies: false, senderName: 'League Office', failoverAfter: 4, format: 'Plain text only' });
    expect(result.providers[0].provider).toBe('SMTP');
  });

  it('resolves templates, expiry, delivery limits, and duplicate controls', () => {
    const templates = resolveEmailTemplateSettings([
      setting('emailTemplates_registrationEnabled', 'false', 'emailTemplates'),
      setting('emailTemplates_registrationSubject', 'Hello {firstName}', 'emailTemplates'),
      setting('emailTemplates_linkExpiry', '120', 'emailTemplates'),
    ]);
    const delivery = resolveEmailDeliverySettings([
      setting('emailDelivery_perMinute', '75', 'emailDelivery'),
      setting('emailDelivery_dedupe', 'false', 'emailDelivery'),
      setting('emailDelivery_retention', '180', 'emailDelivery'),
    ]);
    expect(templates.registration).toMatchObject({ enabled: false, subject: 'Hello {firstName}' });
    expect(templates.linkExpiry).toBe(120);
    expect(delivery).toMatchObject({ perMinute: 75, dedupe: false, retention: 180 });
  });

  it('fills known variables and preserves unknown variables', () => {
    expect(fillEmailTemplate('Hi {firstName}, {missing}', { firstName: 'Levi' })).toBe('Hi Levi, {missing}');
  });
});
