import { getAdminRecipientEmails, sendTransactionalEmail, emailWrapper } from './email/core';
import { resolveSecuritySettings, siteSettingsService, type SecurityAlertSettingKey } from '../features/settings';

const EVENT_TO_SETTING: Record<string, SecurityAlertSettingKey> = {
  security_settings_changed: 'security_alertSettingsChanges',
  security_session_activity: 'security_alertSessionActivity',
  security_password_activity: 'security_alertPasswordActivity',
  security_auth_incidents: 'security_alertAuthIncidents',
};

const EVENT_TO_TEMPLATE: Record<string, string> = {
  security_settings_changed: 'security-settings-changed',
  security_session_activity: 'security-session-activity',
  security_password_activity: 'security-password-activity',
  security_auth_incidents: 'security-auth-incident',
};

export async function notifySecurityAdmins(event: string, title: string, details: string): Promise<void> {
  try {
    const settingKey = EVENT_TO_SETTING[event];
    if (!settingKey) return;
    const settings = resolveSecuritySettings(await siteSettingsService.list('security').catch(() => []));
    if (!settings[settingKey]) return;
    const recipients = await getAdminRecipientEmails(event as Parameters<typeof getAdminRecipientEmails>[0]);
    if (!recipients.length) return;
    await sendTransactionalEmail({
      to: recipients,
      subject: `Security alert: ${title}`,
      html: emailWrapper(`<h2>${title}</h2><p>${details}</p><p>This notification contains no credentials or authentication codes.</p>`),
      dedupeKey: EVENT_TO_TEMPLATE[event],
      audit: { template: EVENT_TO_TEMPLATE[event] },
    });
  } catch (error) {
    console.warn('[security] Notification delivery failed:', error instanceof Error ? error.message : String(error));
  }
}
