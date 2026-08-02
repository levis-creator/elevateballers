import type { SiteSetting } from '../domain/siteSetting';

export type ConsentCategory = {
  id: string;
  name: string;
  desc: string;
};

export type PublicConsentSettings = {
  enabled: boolean;
  eyebrow: string;
  heading: string;
  message: string;
  accept: string;
  reject: string;
  manage: string;
  policyLabel: string;
  policy: string;
  prefsEyebrow: string;
  prefsHeading: string;
  essentialDesc: string;
  categories: ConsentCategory[];
  saveLabel: string;
  reopen: boolean;
  remember: number;
};

const DEFAULT_CATEGORIES = [
  {
    name: 'Match Stats',
    desc: 'Anonymous stats on which fixtures, players and stories fans view most, so we can improve the coverage.',
  },
  {
    name: 'Your Line-up',
    desc: 'Remember your favourite teams and preferences so standings and fixtures land the way you like them.',
  },
  {
    name: 'Court-side Offers',
    desc: 'Let us and select partners show you relevant tickets, merch and league promotions on and off the site.',
  },
];

export const DEFAULT_PUBLIC_CONSENT_SETTINGS: PublicConsentSettings = {
  enabled: true,
  eyebrow: 'We use cookies',
  heading: 'Game day, your way',
  message: 'We use cookies to keep scores live, remember your favourite teams, and see which stories fans read most. Accept all to get the full experience.',
  accept: 'Accept all',
  reject: 'Reject all',
  manage: 'Customise',
  policyLabel: 'Cookie Policy',
  policy: '/cookie-policy',
  prefsEyebrow: 'Cookie preferences',
  prefsHeading: 'Set your line-up',
  essentialDesc: 'Keep the site running — page navigation, security, and remembering you got this far. These can’t be switched off.',
  categories: DEFAULT_CATEGORIES.map((category, index) => ({
    ...category,
    id: categoryId(category.name, index),
  })),
  saveLabel: 'Save my choices',
  reopen: true,
  remember: 180,
};

function categoryId(name: string, index: number): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `category-${index + 1}`;
}

function text(value: string | undefined, fallback: string): string {
  return value?.trim() || fallback;
}

function bool(value: string | undefined, fallback: boolean): boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

function days(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(730, Math.max(1, Math.round(parsed))) : fallback;
}

function categories(value: string | undefined): ConsentCategory[] {
  if (!value) return DEFAULT_PUBLIC_CONSENT_SETTINGS.categories;
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return DEFAULT_PUBLIC_CONSENT_SETTINGS.categories;
    const result = parsed
      .map((item, index) => ({
        id: categoryId(String(item?.name ?? ''), index),
        name: String(item?.name ?? '').trim(),
        desc: String(item?.desc ?? '').trim(),
      }))
      .filter((item) => item.name && item.desc);
    return result.length ? result : DEFAULT_PUBLIC_CONSENT_SETTINGS.categories;
  } catch {
    return DEFAULT_PUBLIC_CONSENT_SETTINGS.categories;
  }
}

export function resolvePublicConsentSettings(settings: SiteSetting[]): PublicConsentSettings {
  const values = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
  const defaults = DEFAULT_PUBLIC_CONSENT_SETTINGS;
  return {
    enabled: bool(values.consent_enabled, defaults.enabled),
    eyebrow: text(values.consent_eyebrow, defaults.eyebrow),
    heading: text(values.consent_heading, defaults.heading),
    message: text(values.consent_message, defaults.message),
    accept: text(values.consent_accept, defaults.accept),
    reject: text(values.consent_reject, defaults.reject),
    manage: text(values.consent_manage, defaults.manage),
    policyLabel: text(values.consent_policyLabel, defaults.policyLabel),
    policy: text(values.consent_policy, defaults.policy),
    prefsEyebrow: text(values.consent_prefsEyebrow, defaults.prefsEyebrow),
    prefsHeading: text(values.consent_prefsHeading, defaults.prefsHeading),
    essentialDesc: text(values.consent_essentialDesc, defaults.essentialDesc),
    categories: categories(values.consent_categories),
    saveLabel: text(values.consent_saveLabel, defaults.saveLabel),
    reopen: bool(values.consent_reopen, defaults.reopen),
    remember: days(values.consent_remember, defaults.remember),
  };
}
