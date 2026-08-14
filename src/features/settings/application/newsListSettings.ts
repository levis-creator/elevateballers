import type { SiteSetting } from '../domain/siteSetting';

export type NewsCategorySetting = { name: string };

export type PublicNewsListSettings = {
  eyebrow: string;
  title: string;
  searchPlaceholder: string;
  featured: boolean;
  featuredBadge: string;
  categories: NewsCategorySetting[];
  perPage: number;
  readTime: boolean;
  sidebarCategories: boolean;
  archives: boolean;
  newsletterCard: boolean;
  newsletterHeading: string;
  newsletterBlurb: string;
  newsletterButton: string;
  emptyBody: string;
  emptyBodyCategory: string;
};

export const DEFAULT_PUBLIC_NEWS_LIST_SETTINGS: PublicNewsListSettings = {
  eyebrow: 'From Around the League',
  title: 'News',
  searchPlaceholder: 'Search news…',
  featured: true,
  featuredBadge: 'Featured',
  categories: [{ name: 'Match Report' }, { name: 'Championships' }, { name: 'Interviews' }],
  perPage: 6,
  readTime: true,
  sidebarCategories: true,
  archives: true,
  newsletterCard: true,
  newsletterHeading: 'Newsletter',
  newsletterBlurb: 'Get the latest stories in your inbox.',
  newsletterButton: 'Subscribe',
  emptyBody: 'Nothing matches “{q}”. Try another search.',
  emptyBodyCategory: 'No articles in this category yet — check back soon.',
};

const bool = (value: string | undefined, fallback: boolean) => value === 'true' ? true : value === 'false' ? false : fallback;
const text = (value: string | undefined, fallback: string) => value === undefined ? fallback : value.trim();
const integer = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(48, Math.max(1, Math.round(parsed))) : fallback;
};
const categories = (value: string | undefined, fallback: NewsCategorySetting[]) => {
  if (value === undefined) return fallback;
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return fallback;
    return parsed
      .map((item) => ({ name: String(item?.name ?? '').trim() }))
      .filter((item) => item.name)
      .slice(0, 16);
  } catch {
    return fallback;
  }
};

export function resolvePublicNewsListSettings(settings: SiteSetting[]): PublicNewsListSettings {
  const values = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
  const defaults = DEFAULT_PUBLIC_NEWS_LIST_SETTINGS;
  return {
    eyebrow: text(values.news_eyebrow, defaults.eyebrow),
    title: text(values.news_title, defaults.title),
    searchPlaceholder: text(values.news_searchPlaceholder, defaults.searchPlaceholder),
    featured: bool(values.news_featured, defaults.featured),
    featuredBadge: text(values.news_featuredBadge, defaults.featuredBadge),
    categories: categories(values.news_categories, defaults.categories),
    perPage: integer(values.news_perPage, defaults.perPage),
    readTime: bool(values.news_readTime, defaults.readTime),
    sidebarCategories: bool(values.news_sidebarCategories, defaults.sidebarCategories),
    archives: bool(values.news_archives, defaults.archives),
    newsletterCard: bool(values.news_newsletterCard, defaults.newsletterCard),
    newsletterHeading: text(values.news_newsletterHeading, defaults.newsletterHeading),
    newsletterBlurb: text(values.news_newsletterBlurb, defaults.newsletterBlurb),
    newsletterButton: text(values.news_newsletterButton, defaults.newsletterButton),
    emptyBody: text(values.news_emptyBody, defaults.emptyBody),
    emptyBodyCategory: text(values.news_emptyBodyCategory, defaults.emptyBodyCategory),
  };
}

export const newsListToken = (template: string, query: string) => template.replaceAll('{q}', query);

