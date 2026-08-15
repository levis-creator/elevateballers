import type { SiteSetting } from '../domain/siteSetting';

export type SeoListItem = Record<string, string>;
export type AnalyticsProvider = 'None' | 'Google Analytics 4' | 'Plausible';

export type PublicSeoSettings = {
  metaTitle: string;
  metaDescription: string;
  canonicalBase: string;
  titleSuffix: string;
  patternTeam: string;
  patternPlayer: string;
  patternMatch: string;
  patternArticle: string;
  ogImage: string;
  autoCards: boolean;
  twitterHandle: string;
  indexing: boolean;
  sitemap: boolean;
  noindexPaths: SeoListItem[];
  schema: boolean;
  analytics: AnalyticsProvider;
  analyticsId: string;
  verification: SeoListItem[];
};

export const DEFAULT_PUBLIC_SEO_SETTINGS: PublicSeoSettings = {
  metaTitle: 'Elevate Ballers — Kenya Basketball League',
  metaDescription:
    'Fixtures, live scores, standings and player stats for the Elevate Ballers men’s and women’s leagues.',
  canonicalBase: 'https://elevateballers.com',
  titleSuffix: ' | Elevate Ballers',
  patternTeam: '{team} — Roster, Schedule & Stats',
  patternPlayer: '{player} — {team} | Stats & Game Log',
  patternMatch: '{home} vs {away} — {date} Box Score',
  patternArticle: '{title}',
  ogImage: '/media/general/og-default-2026.jpg',
  autoCards: true,
  twitterHandle: '@elevateballers',
  indexing: true,
  sitemap: true,
  noindexPaths: [
    { path: '/admin/*', why: 'Staff only' },
    { path: '/register/thanks', why: 'Post-submit page' },
    { path: '/search', why: 'Duplicate of listings' },
  ],
  schema: true,
  analytics: 'Google Analytics 4',
  analyticsId: 'G-VVZ9P3XBLP',
  verification: [],
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

function assetPath(value: string | undefined, fallback: string): string {
  const candidate = value?.trim();
  if (!candidate) return fallback;
  if (/^(https?:)?\/\//.test(candidate) || candidate.startsWith('/')) return candidate;
  return `/${candidate}`;
}

function list(value: string | undefined, fallback: SeoListItem[]): SeoListItem[] {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return fallback;
    return parsed
      .filter((item) => item && typeof item === 'object')
      .map((item) => Object.fromEntries(Object.entries(item).map(([key, entry]) => [key, String(entry ?? '')])));
  } catch {
    return fallback;
  }
}

export function resolvePublicSeoSettings(settings: SiteSetting[]): PublicSeoSettings {
  const values = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
  const defaults = DEFAULT_PUBLIC_SEO_SETTINGS;
  const analytics = ['None', 'Google Analytics 4', 'Plausible'].includes(values.seo_analytics)
    ? (values.seo_analytics as AnalyticsProvider)
    : defaults.analytics;

  return {
    metaTitle: text(values.seo_metaTitle ?? values.seo_homepage_title, defaults.metaTitle),
    metaDescription: text(
      values.seo_metaDescription ?? values.seo_metaDesc ?? values.seo_homepage_description,
      defaults.metaDescription,
    ),
    canonicalBase: text(values.seo_canonical, defaults.canonicalBase).replace(/\/$/, ''),
    titleSuffix: values.seo_suffix == null ? defaults.titleSuffix : values.seo_suffix.trim(),
    patternTeam: text(values.seo_patternTeam, defaults.patternTeam),
    patternPlayer: text(values.seo_patternPlayer, defaults.patternPlayer),
    patternMatch: text(values.seo_patternMatch, defaults.patternMatch),
    patternArticle: text(values.seo_patternArticle, defaults.patternArticle),
    ogImage: assetPath(values.seo_ogImage ?? values.seo_homepage_image, defaults.ogImage),
    autoCards: boolean(values.seo_autoCards, defaults.autoCards),
    twitterHandle: text(values.seo_twitterHandle, defaults.twitterHandle),
    indexing: boolean(values.seo_indexing, defaults.indexing),
    sitemap: boolean(values.seo_sitemap, defaults.sitemap),
    noindexPaths: list(values.seo_noindexPaths, defaults.noindexPaths),
    schema: boolean(values.seo_schema, defaults.schema),
    analytics,
    analyticsId: text(values.seo_analyticsId, defaults.analyticsId),
    verification: list(values.seo_verification, defaults.verification),
  };
}

export function matchesSeoPath(pathname: string, pattern: string): boolean {
  const normalized = pattern.trim();
  if (!normalized) return false;
  const escaped = normalized.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replaceAll('*', '.*');
  return new RegExp(`^${escaped}/?$`).test(pathname);
}

export function applyTitlePattern(pattern: string, tokens: Record<string, string | number | null | undefined>): string {
  return pattern.replace(/\{([^}]+)\}/g, (token, key: string) => {
    const value = tokens[key];
    return value == null ? '' : String(value);
  }).replace(/\s{2,}/g, ' ').trim();
}
