import type { SiteSetting } from '../domain/siteSetting';

export type HeaderNavItem = {
  label: string;
  path: string;
};

export type PublicHeaderSettings = {
  showUtilityBar: boolean;
  utilityText: string;
  statusText: string;
  showLoginLink: boolean;
  logo: string;
  navItems: HeaderNavItem[];
  sticky: boolean;
  ctaLabel: string;
  ctaHref: string;
};

export const DEFAULT_HEADER_NAV_ITEMS: HeaderNavItem[] = [
  { label: 'Home', path: '/' },
  { label: 'Teams', path: '/teams' },
  { label: 'Standings', path: '/standings' },
  { label: 'Fixtures', path: '/fixtures' },
  { label: 'Results', path: '/results' },
  { label: 'About', path: '/about' },
  { label: 'Rules', path: '/rules' },
  { label: 'Contacts', path: '/contacts' },
];

export const DEFAULT_PUBLIC_HEADER_SETTINGS: PublicHeaderSettings = {
  showUtilityBar: true,
  utilityText: 'Nairobi, Kenya · Season 2026',
  statusText: 'Live standings updating',
  showLoginLink: true,
  logo: '/logo/Elevate_Logo.png',
  navItems: DEFAULT_HEADER_NAV_ITEMS,
  sticky: true,
  ctaLabel: 'Register Team',
  ctaHref: '/league-registration',
};

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

function normalizeAssetPath(value: string | undefined, fallback: string): string {
  const path = value?.trim();
  if (!path) return fallback;
  if (path === 'assets/elevate-logo.png') return '/logo/Elevate_Logo.png';
  if (/^(https?:)?\/\//.test(path) || path.startsWith('/')) return path;
  return `/${path}`;
}

function parseNavItems(value: string | undefined): HeaderNavItem[] {
  if (!value) return DEFAULT_HEADER_NAV_ITEMS;
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return DEFAULT_HEADER_NAV_ITEMS;
    const items = parsed
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
      .map((item) => ({
        label: String(item.label ?? '').trim(),
        path: String(item.path ?? '').trim(),
      }))
      .filter((item) => item.label && item.path)
      .slice(0, 8);
    return items.length ? items : DEFAULT_HEADER_NAV_ITEMS;
  } catch {
    return DEFAULT_HEADER_NAV_ITEMS;
  }
}

export function resolvePublicHeaderSettings(settings: SiteSetting[]): PublicHeaderSettings {
  const values = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
  return {
    showUtilityBar: parseBoolean(
      values.header_utilityBar ?? values.header_showUtility,
      DEFAULT_PUBLIC_HEADER_SETTINGS.showUtilityBar
    ),
    utilityText: values.header_utilityText ?? DEFAULT_PUBLIC_HEADER_SETTINGS.utilityText,
    statusText: values.header_statusText ?? DEFAULT_PUBLIC_HEADER_SETTINGS.statusText,
    showLoginLink: parseBoolean(
      values.header_loginLink,
      DEFAULT_PUBLIC_HEADER_SETTINGS.showLoginLink
    ),
    logo: normalizeAssetPath(values.header_logo, DEFAULT_PUBLIC_HEADER_SETTINGS.logo),
    navItems: parseNavItems(values.header_navItems),
    sticky: parseBoolean(values.header_sticky, DEFAULT_PUBLIC_HEADER_SETTINGS.sticky),
    ctaLabel:
      values.header_ctaLabel ??
      values.header_buttonLabel ??
      DEFAULT_PUBLIC_HEADER_SETTINGS.ctaLabel,
    ctaHref:
      values.header_ctaHref ?? values.header_buttonHref ?? DEFAULT_PUBLIC_HEADER_SETTINGS.ctaHref,
  };
}
