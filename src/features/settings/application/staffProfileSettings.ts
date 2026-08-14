import type { SiteSetting } from '../domain/siteSetting';

export type PublicStaffProfileSettings = {
  roleEyebrow: boolean;
  tagline: boolean;
  contactButtons: boolean;
  aboutHeading: string;
  dutiesHeading: string;
  factsHeading: string;
  backLink: string;
};

export const DEFAULT_PUBLIC_STAFF_PROFILE_SETTINGS: PublicStaffProfileSettings = {
  roleEyebrow: true,
  tagline: true,
  contactButtons: true,
  aboutHeading: 'About',
  dutiesHeading: 'Responsibilities',
  factsHeading: 'At the League',
  backLink: 'All staff',
};

const bool = (value: string | undefined, fallback: boolean) => value === 'true' ? true : value === 'false' ? false : fallback;
const text = (value: string | undefined, fallback: string) => value === undefined ? fallback : value.trim();

export function resolvePublicStaffProfileSettings(settings: SiteSetting[]): PublicStaffProfileSettings {
  const values = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
  const defaults = DEFAULT_PUBLIC_STAFF_PROFILE_SETTINGS;
  return {
    roleEyebrow: bool(values.staffMember_roleEyebrow, defaults.roleEyebrow),
    tagline: bool(values.staffMember_tagline, defaults.tagline),
    contactButtons: bool(values.staffMember_contactButtons, defaults.contactButtons),
    aboutHeading: text(values.staffMember_aboutHeading, defaults.aboutHeading),
    dutiesHeading: text(values.staffMember_dutiesHeading, defaults.dutiesHeading),
    factsHeading: text(values.staffMember_factsHeading, defaults.factsHeading),
    backLink: text(values.staffMember_backLink, defaults.backLink),
  };
}

