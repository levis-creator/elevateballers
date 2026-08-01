import type { SiteSetting } from '../domain/siteSetting';

export type DisplayTypeface = 'Anton' | 'Archivo Black';
export type BodyTypeface = 'Archivo' | 'Inter';
export type LabelTypeface = 'Space Mono' | 'IBM Plex Mono';

export type PublicBrandSettings = {
  siteName: string;
  tagline: string;
  favicon: string;
  brand: string;
  paper: string;
  night: string;
  ink: string;
  display: DisplayTypeface;
  body: BodyTypeface;
  label: LabelTypeface;
  uppercaseHeadings: boolean;
  counters: boolean;
  heroArt: boolean;
  reducedMotion: boolean;
};

export type ThemeColorPalette = {
  brand: string;
  brandLight: string;
  brandSoft: string;
  brandForeground: string;
  paper: string;
  paperRaised: string;
  paperSoft: string;
  paperPanel: string;
  paperBorder: string;
  night: string;
  nightRaised: string;
  nightSoft: string;
  nightBorder: string;
  ink: string;
  inkMuted: string;
  inkSoft: string;
  cream: string;
  creamDim: string;
};

export const DEFAULT_PUBLIC_BRAND_SETTINGS: PublicBrandSettings = {
  siteName: 'Elevate Ballers',
  tagline: 'Kenya’s Premier Basketball League',
  favicon: '/media/general/favicon-512.png',
  brand: '#e4002b',
  paper: '#f5f3ef',
  night: '#0c0b0a',
  ink: '#141009',
  display: 'Anton',
  body: 'Archivo',
  label: 'Space Mono',
  uppercaseHeadings: true,
  counters: true,
  heroArt: true,
  reducedMotion: true,
};

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

function color(value: string | undefined, fallback: string): string {
  const candidate = value?.trim();
  return candidate && HEX_COLOR.test(candidate) ? candidate.toLowerCase() : fallback;
}

function text(value: string | undefined, fallback: string): string {
  const candidate = value?.trim();
  return candidate || fallback;
}

function assetPath(value: string | undefined, fallback: string): string {
  const candidate = value?.trim();
  if (!candidate) return fallback;
  if (/^(https?:)?\/\//.test(candidate) || candidate.startsWith('/')) return candidate;
  return `/${candidate}`;
}

function option<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function hexToRgbChannels(hex: string): string {
  const normalized = color(hex, '#000000').slice(1);
  return `${Number.parseInt(normalized.slice(0, 2), 16)} ${Number.parseInt(normalized.slice(2, 4), 16)} ${Number.parseInt(normalized.slice(4, 6), 16)}`;
}

function mixColorChannels(source: string, target: string, amount: number): string {
  const from = hexToRgbChannels(source).split(' ').map(Number);
  const to = hexToRgbChannels(target).split(' ').map(Number);
  return from
    .map((channel, index) => Math.round(channel + (to[index] - channel) * amount))
    .join(' ');
}

export function buildThemeColorPalette(settings: Pick<PublicBrandSettings, 'brand' | 'paper' | 'night' | 'ink'>): ThemeColorPalette {
  const foreground = (() => {
    const [red, green, blue] = hexToRgbChannels(settings.brand).split(' ').map(Number);
    return (red * 299 + green * 587 + blue * 114) / 1000 >= 150
      ? hexToRgbChannels(settings.ink)
      : '255 255 255';
  })();

  return {
    brand: hexToRgbChannels(settings.brand),
    brandLight: mixColorChannels(settings.brand, '#ffffff', 0.18),
    brandSoft: mixColorChannels(settings.brand, '#ffffff', 0.36),
    brandForeground: foreground,
    paper: hexToRgbChannels(settings.paper),
    paperRaised: mixColorChannels(settings.paper, '#ffffff', 0.72),
    paperSoft: mixColorChannels(settings.paper, '#ffffff', 0.5),
    paperPanel: mixColorChannels(settings.paper, settings.ink, 0.035),
    paperBorder: mixColorChannels(settings.paper, settings.ink, 0.1),
    night: hexToRgbChannels(settings.night),
    nightRaised: mixColorChannels(settings.night, '#ffffff', 0.02),
    nightSoft: mixColorChannels(settings.night, '#ffffff', 0.04),
    nightBorder: mixColorChannels(settings.night, '#ffffff', 0.1),
    ink: hexToRgbChannels(settings.ink),
    inkMuted: mixColorChannels(settings.ink, settings.paper, 0.42),
    inkSoft: mixColorChannels(settings.ink, settings.paper, 0.56),
    cream: mixColorChannels(settings.paper, settings.night, 0.01),
    creamDim: mixColorChannels(settings.paper, settings.night, 0.26),
  };
}

export function resolvePublicBrandSettings(settings: SiteSetting[]): PublicBrandSettings {
  const values = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
  const defaults = DEFAULT_PUBLIC_BRAND_SETTINGS;

  return {
    siteName: text(values.brand_siteName, defaults.siteName),
    tagline: text(values.brand_tagline, defaults.tagline),
    favicon: assetPath(values.brand_favicon, defaults.favicon),
    brand: color(values.brand_brand ?? values.brand_accent, defaults.brand),
    paper: color(values.brand_paper, defaults.paper),
    night: color(values.brand_night ?? values.brand_surface, defaults.night),
    ink: color(values.brand_ink, defaults.ink),
    display: option(values.brand_display, ['Anton', 'Archivo Black'] as const, defaults.display),
    body: option(values.brand_body, ['Archivo', 'Inter'] as const, defaults.body),
    label: option(values.brand_label, ['Space Mono', 'IBM Plex Mono'] as const, defaults.label),
    uppercaseHeadings: parseBoolean(values.brand_uppercaseHeadings, defaults.uppercaseHeadings),
    counters: parseBoolean(values.brand_counters, defaults.counters),
    heroArt: parseBoolean(values.brand_heroArt, defaults.heroArt),
    reducedMotion: parseBoolean(values.brand_reducedMotion, defaults.reducedMotion),
  };
}
