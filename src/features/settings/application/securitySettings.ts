import type { SiteSetting } from '../domain/siteSetting';

export const SECURITY_SETTING_DEFINITIONS = {
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
} as const;

export type SecuritySettingKey = keyof typeof SECURITY_SETTING_DEFINITIONS;

export type SecuritySettings = {
  [K in SecuritySettingKey]: number;
};

export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = Object.fromEntries(
  Object.entries(SECURITY_SETTING_DEFINITIONS).map(([key, definition]) => [key, definition.defaultValue]),
) as SecuritySettings;

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
  return Object.fromEntries(
    Object.keys(SECURITY_SETTING_DEFINITIONS).map((key) => [
      key,
      parseBoundedInteger(key as SecuritySettingKey, values[key]),
    ]),
  ) as SecuritySettings;
}

export function normalizeSecuritySettingValue(key: string, value: string): string | null {
  if (!(key in SECURITY_SETTING_DEFINITIONS)) return null;
  const definition = SECURITY_SETTING_DEFINITIONS[key as SecuritySettingKey];
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < definition.min || parsed > definition.max) return null;
  return String(parsed);
}

export function isSecuritySettingKey(key: string): key is SecuritySettingKey {
  return key in SECURITY_SETTING_DEFINITIONS;
}
