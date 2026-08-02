import type { SiteSetting } from '../domain/siteSetting';

export type ContactDepartment = {
  name: string;
  email: string;
  handles: string;
};

export type ContactSocial = {
  label: 'FB' | 'IG' | 'YT' | 'X';
  url: string;
};

export type PublicContactSettings = {
  email: string;
  phones: string;
  address: string;
  hours: string;
  facebook: string;
  instagram: string;
  youtube: string;
  x: string;
  socialOrder: ContactSocial['label'][];
  socials: ContactSocial[];
  departments: ContactDepartment[];
  inbox: string;
  notify: boolean;
  responseTarget: string;
};

export const DEFAULT_CONTACT_DEPARTMENTS: ContactDepartment[] = [
  { name: 'Competition', email: 'competition@elevateballers.com', handles: 'Fixtures, results, standings' },
  { name: 'Registration', email: 'register@elevateballers.com', handles: 'Team entries and transfers' },
  { name: 'Officiating', email: 'referees@elevateballers.com', handles: 'Referees and match reports' },
  { name: 'Media', email: 'media@elevateballers.com', handles: 'Press access and interviews' },
  { name: 'Partnerships', email: 'partners@elevateballers.com', handles: 'Sponsorship and events' },
  { name: 'Support', email: 'ballers@elevateballers.com', handles: 'Anything else' },
];

export const DEFAULT_PUBLIC_CONTACT_SETTINGS: Omit<PublicContactSettings, 'socials'> = {
  email: 'ballers@elevateballers.com',
  phones: '0703 913 923 · 0729 259 496',
  address: 'Pepo Lane, off Dagoretti Road, Nairobi, Kenya',
  hours: 'Saturdays & Sundays · 8:00 AM – 6:00 PM',
  facebook: 'https://facebook.com/elevateballers',
  instagram: 'https://instagram.com/elevateballers',
  youtube: 'https://youtube.com/@elevateballers',
  x: 'https://x.com/elevateballers',
  socialOrder: ['FB', 'IG', 'YT', 'X'],
  departments: DEFAULT_CONTACT_DEPARTMENTS,
  inbox: 'ballers@elevateballers.com',
  notify: true,
  responseTarget: 'within 48 hours',
};

function text(value: string | undefined, fallback: string): string {
  const candidate = value?.trim();
  return candidate || fallback;
}

function boolean(value: string | undefined, fallback: boolean): boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

function list(value: string | undefined, fallback: ContactDepartment[]): ContactDepartment[] {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return fallback;
    const departments = parsed.map((item) => ({
      name: String(item?.name ?? '').trim(),
      email: String(item?.email ?? '').trim(),
      handles: String(item?.handles ?? item?.desc ?? '').trim(),
    })).filter((item) => item.name && item.email);
    return departments.length ? departments : fallback;
  } catch {
    return fallback;
  }
}

function socialUrl(value: string | undefined, platform: ContactSocial['label'], fallback: string): string {
  const candidate = value?.trim();
  if (candidate === '') return '';
  if (!candidate) return fallback;
  if (/^https?:\/\//i.test(candidate)) return candidate;
  const handle = candidate.replace(/^@/, '').replace(/^\/+|\/+$/g, '');
  if (handle.includes('.')) return `https://${handle}`;
  const host = platform === 'FB' ? 'facebook.com' : platform === 'IG' ? 'instagram.com' : platform === 'YT' ? 'youtube.com' : 'x.com';
  return `https://${host}/${platform === 'YT' && !handle.startsWith('@') ? `@${handle}` : handle}`;
}

function order(value: string | undefined): ContactSocial['label'][] {
  const aliases: Record<string, ContactSocial['label']> = {
    FB: 'FB', FACEBOOK: 'FB', IG: 'IG', INSTAGRAM: 'IG', YT: 'YT', YOUTUBE: 'YT',
    X: 'X', TWITTER: 'X',
  };
  const parsed = (value || DEFAULT_PUBLIC_CONTACT_SETTINGS.socialOrder.join(','))
    .split(',').map((item) => aliases[item.trim().toUpperCase()]).filter(Boolean);
  return [...new Set(parsed.length ? parsed : DEFAULT_PUBLIC_CONTACT_SETTINGS.socialOrder)];
}

export function resolvePublicContactSettings(settings: SiteSetting[]): PublicContactSettings {
  const values = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
  const defaults = DEFAULT_PUBLIC_CONTACT_SETTINGS;
  const facebook = socialUrl(values.social_facebook ?? values.contact_facebook, 'FB', defaults.facebook);
  const instagram = socialUrl(values.social_instagram ?? values.contact_instagram, 'IG', defaults.instagram);
  const youtube = socialUrl(values.social_youtube ?? values.contact_youtube, 'YT', defaults.youtube);
  const x = socialUrl(values.social_twitter ?? values.contact_x, 'X', defaults.x);
  const socialOrder = order(values.social_order ?? values.contact_socialOrder);
  const byLabel: Record<ContactSocial['label'], string> = { FB: facebook, IG: instagram, YT: youtube, X: x };

  return {
    email: text(values.contact_email, defaults.email),
    phones: text(values.contact_phone ?? values.contact_phones, defaults.phones),
    address: text(values.contact_address, defaults.address),
    hours: text(values.contact_hours, defaults.hours),
    facebook,
    instagram,
    youtube,
    x,
    socialOrder,
    socials: socialOrder.map((label) => ({ label, url: byLabel[label] })).filter((item) => item.url),
    departments: list(values.contact_departmentList, defaults.departments),
    inbox: text(values.contact_inbox, defaults.inbox),
    notify: boolean(values.contact_notify, defaults.notify),
    responseTarget: text(values.contact_responseTarget, defaults.responseTarget),
  };
}

export function contactRecipients(settings: PublicContactSettings, subject: string): string[] {
  const normalized = subject.trim().toLowerCase();
  const desk = settings.departments.find((department) =>
    department.name.toLowerCase() === normalized ||
    department.handles.split(',').some((topic) => topic.trim().toLowerCase() === normalized)
  );
  return [...new Set([
    settings.inbox,
    ...(settings.notify && desk?.email ? [desk.email] : []),
  ].filter(Boolean))];
}
