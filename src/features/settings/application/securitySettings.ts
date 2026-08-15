import type { SiteSetting } from '../domain/siteSetting';

export const SECURITY_SETTING_DEFINITIONS = {
  security_loginMaxAttempts: {
    label: 'Maximum login attempts',
    description: 'Invalid passwords allowed before the account is locked.',
    min: 3,
    max: 10,
    defaultValue: 5,
  },
  security_loginLockoutMinutes: {
    label: 'Login lockout duration',
    description: 'How long an account is locked after the maximum invalid password attempts.',
    min: 5,
    max: 60,
    defaultValue: 15,
  },
  security_loginRateLimitMax: {
    label: 'Login requests per window',
    description: 'Login attempts allowed for one source IP before a temporary rate limit.',
    min: 3,
    max: 30,
    defaultValue: 10,
  },
  security_loginRateLimitWindowMinutes: {
    label: 'Login rate-limit window',
    description: 'Length of the login rate-limit window in minutes.',
    min: 5,
    max: 60,
    defaultValue: 15,
  },
  security_otpExpiryMinutes: {
    label: 'OTP expiry duration',
    description: 'How long a sign-in verification code remains valid.',
    min: 5,
    max: 30,
    defaultValue: 10,
  },
  security_otpMaxAttempts: {
    label: 'Maximum OTP attempts',
    description: 'Invalid codes allowed before the current code is locked.',
    min: 3,
    max: 10,
    defaultValue: 5,
  },
  security_otpLockoutMinutes: {
    label: 'OTP lockout duration',
    description: 'How long a code is blocked after the maximum invalid attempts.',
    min: 5,
    max: 60,
    defaultValue: 15,
  },
  security_otpRateLimitMax: {
    label: 'OTP requests per window',
    description: 'Verification requests allowed for one user before a temporary rate limit.',
    min: 3,
    max: 20,
    defaultValue: 5,
  },
  security_otpRateLimitWindowMinutes: {
    label: 'OTP rate-limit window',
    description: 'Length of the OTP verification rate-limit window in minutes.',
    min: 5,
    max: 60,
    defaultValue: 15,
  },
  security_settingsMutationMax: {
    label: 'Settings changes per window',
    description: 'Site Settings creates and updates allowed for one administrator before a temporary rate limit.',
    min: 10,
    max: 100,
    defaultValue: 30,
  },
  security_settingsMutationWindowMinutes: {
    label: 'Settings rate-limit window',
    description: 'Length of the Site Settings mutation rate-limit window in minutes.',
    min: 5,
    max: 60,
    defaultValue: 10,
  },
  security_sessionDurationDays: {
    label: 'Admin session duration',
    description: 'How long an authenticated admin session remains valid.',
    min: 1,
    max: 14,
    defaultValue: 7,
  },
  security_maxConcurrentSessions: {
    label: 'Maximum concurrent sessions',
    description: 'Active admin sessions retained per user; oldest sessions are revoked first.',
    min: 1,
    max: 10,
    defaultValue: 3,
  },
  security_passwordMinLength: {
    label: 'Minimum password length',
    description: 'Minimum length required for new or changed passwords. Existing passwords are not changed automatically.',
    min: 8,
    max: 64,
    defaultValue: 8,
  },
  security_passwordHistoryCount: {
    label: 'Password history count',
    description: 'Recent password hashes to retain and reject for reuse. Applies to future changes and resets.',
    min: 0,
    max: 10,
    defaultValue: 5,
  },
  security_mediaUploadMaxSizeMB: {
    label: 'Media upload max size (MB)',
    description: 'Largest image or media file accepted by the media library, per file.',
    min: 1,
    max: 50,
    defaultValue: 12,
  },
  security_documentUploadMaxSizeMB: {
    label: 'Document upload max size (MB)',
    description: 'Largest PDF accepted for the rulebook document upload.',
    min: 1,
    max: 50,
    defaultValue: 25,
  },
  security_mediaUploadRateLimitMax: {
    label: 'Media uploads per window',
    description: 'Uploads allowed for one administrator before a temporary rate limit.',
    min: 3,
    max: 60,
    defaultValue: 20,
  },
  security_mediaUploadRateLimitWindowMinutes: {
    label: 'Media upload rate-limit window',
    description: 'Length of the media upload rate-limit window in minutes.',
    min: 5,
    max: 60,
    defaultValue: 15,
  },
  security_batchUploadMaxFiles: {
    label: 'Maximum files per batch upload',
    description: 'Files accepted in a single batch media upload request.',
    min: 1,
    max: 50,
    defaultValue: 20,
  },
} as const;

export const SECURITY_ALERT_SETTING_DEFINITIONS = {
  security_alertSettingsChanges: { label: 'Security setting changes', description: 'Email administrators when Security settings are changed.', defaultValue: true },
  security_alertSessionActivity: { label: 'Session activity', description: 'Email administrators for session revocations, evictions, and global sign-out.', defaultValue: true },
  security_alertPasswordActivity: { label: 'Password activity', description: 'Email administrators when a password is changed or reset.', defaultValue: true },
  security_alertAuthIncidents: { label: 'Authentication incidents', description: 'Email administrators for authentication lockout incidents.', defaultValue: true },
} as const;

export const SECURITY_PASSWORD_TOGGLE_DEFINITIONS = {
  security_passwordBreachCheck: { label: 'Breached-password checks', description: 'Reject passwords found in the privacy-preserving breach range service.', defaultValue: true },
} as const;

export const SECURITY_INTEGRATION_TOGGLE_DEFINITIONS = {
  security_turnstileEnabled: { label: 'Bot protection (Turnstile)', description: 'Require a passed Cloudflare Turnstile check on login, registration, and public forms.', defaultValue: true },
} as const;

export const SECURITY_BOOLEAN_SETTING_DEFINITIONS = {
  ...SECURITY_ALERT_SETTING_DEFINITIONS,
  ...SECURITY_PASSWORD_TOGGLE_DEFINITIONS,
  ...SECURITY_INTEGRATION_TOGGLE_DEFINITIONS,
} as const;

/**
 * Opaque secret values (Turnstile secret key, webhook signing secrets) stored
 * encrypted at rest. Unlike SECURITY_SETTING_DEFINITIONS these have no
 * min/max/default — an empty value means "not configured here, fall back to
 * the environment variable" (see sensitiveSettingValues.ts for encryption).
 */
export const SECURITY_SECRET_SETTING_DEFINITIONS = {
  security_turnstileSecretKey: { label: 'Turnstile secret key', description: 'Overrides the TURNSTILE_SECRET_KEY environment variable when set. Leave blank to use the environment variable.' },
  security_resendWebhookSecret: { label: 'Resend webhook secret', description: 'Overrides the RESEND_WEBHOOK_SECRET environment variable when set. Leave blank to use the environment variable.' },
  security_mailgunWebhookSigningKey: { label: 'Mailgun webhook signing key', description: 'Overrides the MAILGUN_WEBHOOK_SIGNING_KEY environment variable when set. Leave blank to use the environment variable.' },
  security_upstashRedisUrl: { label: 'Upstash Redis REST URL', description: 'Overrides UPSTASH_REDIS_REST_URL when set, together with the token below. Both must be set to take effect.' },
  security_upstashRedisToken: { label: 'Upstash Redis REST token', description: 'Overrides UPSTASH_REDIS_REST_TOKEN when set, together with the URL above. Both must be set to take effect.' },
  security_r2AccountId: { label: 'R2 account ID', description: 'Overrides R2_ACCOUNT_ID. All four R2 fields must be set to take effect.' },
  security_r2BucketName: { label: 'R2 bucket name', description: 'Overrides R2_BUCKET_NAME. All four R2 fields must be set to take effect.' },
  security_r2AccessKeyId: { label: 'R2 access key ID', description: 'Overrides R2_ACCESS_KEY_ID. All four R2 fields must be set to take effect.' },
  security_r2SecretAccessKey: { label: 'R2 secret access key', description: 'Overrides R2_SECRET_ACCESS_KEY. All four R2 fields must be set to take effect.' },
  security_r2PublicUrl: { label: 'R2 public URL', description: 'Overrides R2_PUBLIC_URL. Optional — public objects fall back to a proxied URL when unset.' },
  security_supabaseUrl: { label: 'Supabase project URL', description: 'Overrides SUPABASE_URL when set, together with the service role key below. Both must be set to take effect.' },
  security_supabaseServiceRoleKey: { label: 'Supabase service role key', description: 'Overrides SUPABASE_SERVICE_ROLE_KEY when set, together with the project URL above. Both must be set to take effect.' },
} as const;

export type SecuritySettingKey = keyof typeof SECURITY_SETTING_DEFINITIONS;
export type SecurityAlertSettingKey = keyof typeof SECURITY_ALERT_SETTING_DEFINITIONS;
export type SecurityBooleanSettingKey = keyof typeof SECURITY_BOOLEAN_SETTING_DEFINITIONS;
export type SecuritySecretSettingKey = keyof typeof SECURITY_SECRET_SETTING_DEFINITIONS;

export type SecuritySettings = {
  [K in SecuritySettingKey]: number;
} & { [K in SecurityBooleanSettingKey]: boolean };

export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = Object.fromEntries(
  Object.entries(SECURITY_SETTING_DEFINITIONS).map(([key, definition]) => [key, definition.defaultValue]),
) as unknown as SecuritySettings;

function parseBoundedInteger(key: SecuritySettingKey, value: string | undefined): number {
  const definition = SECURITY_SETTING_DEFINITIONS[key];
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < definition.min || parsed > definition.max) {
    return definition.defaultValue;
  }
  return parsed;
}

export function resolveSecuritySettings(settings: Pick<SiteSetting, 'key' | 'value'>[]): SecuritySettings {
  const values = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
  const numeric = Object.fromEntries(
    Object.keys(SECURITY_SETTING_DEFINITIONS).map((key) => [
      key,
      parseBoundedInteger(key as SecuritySettingKey, values[key]),
    ]),
  );
  const booleans = Object.fromEntries(Object.entries(SECURITY_BOOLEAN_SETTING_DEFINITIONS).map(([key, definition]) => [
    key,
    values[key] === undefined ? definition.defaultValue : values[key].toLowerCase() !== 'false',
  ]));
  return { ...numeric, ...booleans } as SecuritySettings;
}

export function normalizeSecuritySettingValue(key: string, value: string): string | null {
  if (key in SECURITY_SECRET_SETTING_DEFINITIONS) {
    return value;
  }
  if (key in SECURITY_BOOLEAN_SETTING_DEFINITIONS) {
    return value === 'true' || value === 'false' ? value : null;
  }
  if (!(key in SECURITY_SETTING_DEFINITIONS)) return null;
  const definition = SECURITY_SETTING_DEFINITIONS[key as SecuritySettingKey];
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < definition.min || parsed > definition.max) return null;
  return String(parsed);
}

export function isSecuritySettingKey(key: string): key is SecuritySettingKey {
  return key in SECURITY_SETTING_DEFINITIONS || key in SECURITY_BOOLEAN_SETTING_DEFINITIONS || key in SECURITY_SECRET_SETTING_DEFINITIONS;
}

export function isSecurityAlertSettingKey(key: string): key is SecurityAlertSettingKey {
  return key in SECURITY_ALERT_SETTING_DEFINITIONS;
}

export function isSecurityBooleanSettingKey(key: string): key is SecurityBooleanSettingKey {
  return key in SECURITY_BOOLEAN_SETTING_DEFINITIONS;
}

export function isSecuritySecretSettingKey(key: string): key is SecuritySecretSettingKey {
  return key in SECURITY_SECRET_SETTING_DEFINITIONS;
}
