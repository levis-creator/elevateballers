import type { SiteSetting } from '../domain/siteSetting';

export type StaffDepartmentSetting = { name: string };

export type PublicStaffPageSettings = {
  eyebrow: string;
  title: string;
  intro: string;
  leaders: boolean;
  leaderBadge: string;
  groupByRole: boolean;
  departments: StaffDepartmentSetting[];
  counts: boolean;
  bios: boolean;
  recruitBlock: boolean;
  recruitEyebrow: string;
  recruitHeading: string;
  recruitBody: string;
  recruitCta: string;
};

export const DEFAULT_PUBLIC_STAFF_PAGE_SETTINGS: PublicStaffPageSettings = {
  eyebrow: 'The People Behind the League',
  title: 'Our Staff',
  intro: 'The organisers, officials, and volunteers who keep Elevate Ballers running — from tip-off to final buzzer, every match day of the season.',
  leaders: true,
  leaderBadge: 'Leadership',
  groupByRole: true,
  departments: [{ name: 'League Management' }, { name: 'Officiating' }, { name: 'Operations & Media' }],
  counts: true,
  bios: false,
  recruitBlock: true,
  recruitEyebrow: 'Get Involved',
  recruitHeading: 'Referee, score, or volunteer with us',
  recruitBody: "We're always looking for certified officials, table crew, and match-day volunteers. Join the team that runs Kenya's premier basketball league.",
  recruitCta: 'Get in touch',
};

const bool = (value: string | undefined, fallback: boolean) => value === 'true' ? true : value === 'false' ? false : fallback;
const text = (value: string | undefined, fallback: string) => value === undefined ? fallback : value.trim();
const departments = (value: string | undefined, fallback: StaffDepartmentSetting[]) => {
  if (value === undefined) return fallback;
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return fallback;
    const items = parsed
      .map((item) => ({ name: String(item?.name ?? '').trim() }))
      .filter((item) => item.name)
      .slice(0, 12);
    return items;
  } catch {
    return fallback;
  }
};

export function resolvePublicStaffPageSettings(settings: SiteSetting[]): PublicStaffPageSettings {
  const values = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
  const defaults = DEFAULT_PUBLIC_STAFF_PAGE_SETTINGS;
  return {
    eyebrow: text(values.staff_eyebrow, defaults.eyebrow),
    title: text(values.staff_title, defaults.title),
    intro: text(values.staff_intro, defaults.intro),
    leaders: bool(values.staff_leaders, defaults.leaders),
    leaderBadge: text(values.staff_leaderBadge, defaults.leaderBadge),
    groupByRole: bool(values.staff_groupByRole, defaults.groupByRole),
    departments: departments(values.staff_departments, defaults.departments),
    counts: bool(values.staff_counts, defaults.counts),
    bios: bool(values.staff_bios, defaults.bios),
    recruitBlock: bool(values.staff_recruitBlock, defaults.recruitBlock),
    recruitEyebrow: text(values.staff_recruitEyebrow, defaults.recruitEyebrow),
    recruitHeading: text(values.staff_recruitHeading, defaults.recruitHeading),
    recruitBody: text(values.staff_recruitBody, defaults.recruitBody),
    recruitCta: text(values.staff_recruitCta, defaults.recruitCta),
  };
}
