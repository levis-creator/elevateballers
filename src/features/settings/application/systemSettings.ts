import type { SiteSetting } from '../domain/siteSetting';

export type SystemLink = { label: string; path: string };

export type PublicSystemSettings = {
  notFoundEyebrow: string;
  notFoundTitle: string;
  notFoundAccent: string;
  notFoundBody: string;
  notFoundLinks: SystemLink[];
  redirectEyebrow: string;
  redirectTitle: string;
  redirectBody: string;
  redirectSeconds: number;
  redirectCta: string;
  redirectFallback: string;
  redirectLinks: SystemLink[];
  loadingLabel: string;
  loadingLines: string[];
  splashThreshold: number;
  skeletons: boolean;
  maintenance: boolean;
  maintenanceMsg: string;
};

export const DEFAULT_PUBLIC_SYSTEM_SETTINGS: PublicSystemSettings = {
  notFoundEyebrow: 'Error 404',
  notFoundTitle: 'Airball',
  notFoundAccent: 'ball',
  notFoundBody: 'That shot missed everything — the page you’re looking for isn’t on the court. It may have been moved, renamed, or never existed.',
  notFoundLinks: [
    { label: 'Back to Home', path: '/' },
    { label: 'View Fixtures', path: '/fixtures' },
    { label: 'Standings', path: '/standings' },
  ],
  redirectEyebrow: 'Page moved',
  redirectTitle: 'Redirecting',
  redirectBody: 'This page has a new home. We’re taking you there now — you’ll arrive in {countdown}.',
  redirectSeconds: 5,
  redirectCta: 'Go There Now →',
  redirectFallback: 'Not redirected automatically? Use the button above.',
  redirectLinks: [
    { label: 'Home', path: '/' },
    { label: 'Teams', path: '/teams' },
    { label: 'Standings', path: '/standings' },
    { label: 'Fixtures', path: '/fixtures' },
    { label: 'News', path: '/news' },
  ],
  loadingLabel: 'Loading',
  loadingLines: ['Tipping off…', 'Loading standings', 'Fetching fixtures', 'Warming up the court'],
  splashThreshold: 400,
  skeletons: true,
  maintenance: false,
  maintenanceMsg: 'We’re updating results from last night’s games. Back shortly.',
};

function text(value: string | undefined, fallback: string): string {
  return value?.trim() || fallback;
}

function bool(value: string | undefined, fallback: boolean): boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

function integer(value: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.round(parsed))) : fallback;
}

function links(value: string | undefined, fallback: SystemLink[]): SystemLink[] {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return fallback;
    const result = parsed.map((item) => ({
      label: String(item?.label ?? '').trim(),
      path: String(item?.path ?? '').trim(),
    })).filter((item) => item.label && item.path);
    return result.length ? result : fallback;
  } catch {
    return fallback;
  }
}

function lines(value: string | undefined, fallback: string[]): string[] {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return fallback;
    const result = parsed.map((item) => String(item?.line ?? item ?? '').trim()).filter(Boolean);
    return result.length ? result : fallback;
  } catch {
    return fallback;
  }
}

export function resolvePublicSystemSettings(settings: SiteSetting[]): PublicSystemSettings {
  const values = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
  const defaults = DEFAULT_PUBLIC_SYSTEM_SETTINGS;
  return {
    notFoundEyebrow: text(values.system_notFoundEyebrow, defaults.notFoundEyebrow),
    notFoundTitle: text(values.system_notFoundTitle, defaults.notFoundTitle),
    notFoundAccent: text(values.system_notFoundAccent, defaults.notFoundAccent),
    notFoundBody: text(values.system_notFoundBody, defaults.notFoundBody),
    notFoundLinks: links(values.system_notFoundLinks, defaults.notFoundLinks),
    redirectEyebrow: text(values.system_redirectEyebrow, defaults.redirectEyebrow),
    redirectTitle: text(values.system_redirectTitle, defaults.redirectTitle),
    redirectBody: text(values.system_redirectBody, defaults.redirectBody),
    redirectSeconds: integer(values.system_redirectSeconds, defaults.redirectSeconds, 0, 60),
    redirectCta: text(values.system_redirectCta, defaults.redirectCta),
    redirectFallback: text(values.system_redirectFallback, defaults.redirectFallback),
    redirectLinks: links(values.system_redirectLinks, defaults.redirectLinks),
    loadingLabel: text(values.system_loadingLabel, defaults.loadingLabel),
    loadingLines: lines(values.system_loadingLines, defaults.loadingLines),
    splashThreshold: integer(values.system_splashThreshold, defaults.splashThreshold, 0, 5000),
    skeletons: bool(values.system_skeletons, defaults.skeletons),
    maintenance: bool(values.system_maintenance, defaults.maintenance),
    maintenanceMsg: text(values.system_maintenanceMsg, defaults.maintenanceMsg),
  };
}
