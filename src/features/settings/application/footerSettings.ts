import type { SiteSetting } from '../domain/siteSetting';

export type FooterLink = {
  label: string;
  path: string;
};

export type PublicFooterSettings = {
  siteName: string;
  logo: string;
  showContact: boolean;
  linksHeading: string;
  links: FooterLink[];
  newsletter: boolean;
  newsletterHeading: string;
  newsletterBlurb: string;
  newsletterPlaceholder: string;
  newsletterButton: string;
  socialRow: boolean;
  partners: boolean;
  partnersHeading: string;
  partnersGrayscale: boolean;
  copyright: string;
  legalRight: string;
};

export const DEFAULT_FOOTER_LINKS: FooterLink[] = [
  { label: 'Teams', path: '/teams' },
  { label: 'Standings', path: '/standings' },
  { label: 'Fixtures & Results', path: '/fixtures' },
  { label: 'About', path: '/about' },
  { label: 'Rules', path: '/rules' },
];

export const DEFAULT_PUBLIC_FOOTER_SETTINGS: PublicFooterSettings = {
  siteName: 'Elevate Ballers',
  logo: '/logo/Elevate_Logo.png',
  showContact: true,
  linksHeading: 'Explore',
  links: DEFAULT_FOOTER_LINKS,
  newsletter: true,
  newsletterHeading: 'Sign up for email alerts',
  newsletterBlurb: 'Select topics and stay current with our latest news.',
  newsletterPlaceholder: 'your@email.com',
  newsletterButton: 'Join',
  socialRow: true,
  partners: true,
  partnersHeading: 'Our Partners',
  partnersGrayscale: true,
  copyright: '© 2024–2026 Elevate Ballers · All Rights Reserved',
  legalRight: 'Kenya’s Premier Basketball League',
};

type LegacyFooterContent = {
  exploreTitle?: unknown;
  exploreLinks?: unknown;
  newsletterTitle?: unknown;
  newsletterText?: unknown;
  copyright?: unknown;
};

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

function parseLegacyContent(value: string | undefined): LegacyFooterContent {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function parseLinks(value: unknown): FooterLink[] | null {
  if (!Array.isArray(value)) return null;
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item) => ({
      label: String(item.label ?? '').trim(),
      path: String(item.path ?? item.href ?? '').trim(),
    }))
    .filter((item) => item.label && item.path)
    .slice(0, 5);
}

function parseStoredLinks(value: string | undefined): FooterLink[] | null {
  if (value == null) return null;
  try {
    return parseLinks(JSON.parse(value));
  } catch {
    return null;
  }
}

function normalizeAssetPath(value: string | undefined, fallback: string): string {
  const path = value?.trim();
  if (!path) return fallback;
  if (path === 'assets/elevate-logo.png') return '/logo/Elevate_Logo.png';
  if (/^(https?:)?\/\//.test(path) || path.startsWith('/')) return path;
  return `/${path}`;
}

function stringValue(value: string | undefined, legacy: unknown, fallback: string): string {
  if (value != null) return value;
  return typeof legacy === 'string' ? legacy : fallback;
}

function currentCopyright(value: string): string {
  const year = new Date().getFullYear();
  return value.replace(/(©\s*\d{4}\s*[–-]\s*)\d{4}/, `$1${year}`);
}

export function resolvePublicFooterSettings(
  settings: SiteSetting[],
  headerLogo = DEFAULT_PUBLIC_FOOTER_SETTINGS.logo,
  brandSiteName = DEFAULT_PUBLIC_FOOTER_SETTINGS.siteName,
  brandTagline = DEFAULT_PUBLIC_FOOTER_SETTINGS.legalRight
): PublicFooterSettings {
  const values = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
  const legacy = parseLegacyContent(values.footer_v2_content);
  const legacyLinks = parseLinks(legacy.exploreLinks);

  return {
    siteName: brandSiteName,
    logo: normalizeAssetPath(values.footer_logo, headerLogo),
    showContact: parseBoolean(
      values.footer_showContact,
      DEFAULT_PUBLIC_FOOTER_SETTINGS.showContact
    ),
    linksHeading: stringValue(
      values.footer_linksHeading,
      legacy.exploreTitle,
      DEFAULT_PUBLIC_FOOTER_SETTINGS.linksHeading
    ),
    links:
      parseStoredLinks(values.footer_links) ?? legacyLinks ?? DEFAULT_PUBLIC_FOOTER_SETTINGS.links,
    newsletter: parseBoolean(values.footer_newsletter, DEFAULT_PUBLIC_FOOTER_SETTINGS.newsletter),
    newsletterHeading: stringValue(
      values.footer_newsletterHeading,
      legacy.newsletterTitle,
      DEFAULT_PUBLIC_FOOTER_SETTINGS.newsletterHeading
    ),
    newsletterBlurb: stringValue(
      values.footer_newsletterBlurb,
      legacy.newsletterText,
      DEFAULT_PUBLIC_FOOTER_SETTINGS.newsletterBlurb
    ),
    newsletterPlaceholder:
      values.footer_newsletterPlaceholder ?? DEFAULT_PUBLIC_FOOTER_SETTINGS.newsletterPlaceholder,
    newsletterButton:
      values.footer_newsletterButton ?? DEFAULT_PUBLIC_FOOTER_SETTINGS.newsletterButton,
    socialRow: parseBoolean(values.footer_socialRow, DEFAULT_PUBLIC_FOOTER_SETTINGS.socialRow),
    partners: parseBoolean(values.footer_partners, DEFAULT_PUBLIC_FOOTER_SETTINGS.partners),
    partnersHeading:
      values.footer_partnersHeading ?? DEFAULT_PUBLIC_FOOTER_SETTINGS.partnersHeading,
    partnersGrayscale: parseBoolean(
      values.footer_partnersGrayscale,
      DEFAULT_PUBLIC_FOOTER_SETTINGS.partnersGrayscale
    ),
    copyright: currentCopyright(
      stringValue(
        values.footer_copyright,
        legacy.copyright,
        DEFAULT_PUBLIC_FOOTER_SETTINGS.copyright
      )
    ),
    legalRight: values.footer_legalRight ?? brandTagline,
  };
}
