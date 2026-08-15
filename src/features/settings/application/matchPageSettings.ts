import type { SiteSetting } from '../domain/siteSetting';

export type MatchPageTab = { label: string };
export type MatchBoxScoreVisibility = 'Public' | 'Signed-in users' | 'Staff only';

export type PublicMatchPageSettings = {
  tabs: MatchPageTab[];
  boxScore: MatchBoxScoreVisibility;
  playRows: number;
  quarters: boolean;
  lineups: boolean;
  video: boolean;
  delay: number;
  autoPublish: boolean;
  liveBadge: string;
  autoShareCards: boolean;
  shareWatermark: string;
  shareLeagueFallback: string;
};

export const DEFAULT_PUBLIC_MATCH_PAGE_SETTINGS: PublicMatchPageSettings = {
  tabs: [{ label: 'Box Score' }, { label: 'Play-by-Play' }, { label: 'Timeline' }],
  boxScore: 'Public',
  playRows: 25,
  quarters: true,
  lineups: true,
  video: true,
  delay: 30,
  autoPublish: false,
  liveBadge: 'LIVE',
  autoShareCards: true,
  shareWatermark: 'ELEVATEBALLERS.COM',
  shareLeagueFallback: 'Elevate Basketball',
};

const bool = (value: string | undefined, fallback: boolean) => value === 'true' ? true : value === 'false' ? false : fallback;
const integer = (value: string | undefined, fallback: number, min: number, max: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.round(parsed))) : fallback;
};
const list = <T>(value: string | undefined, fallback: T[]): T[] => {
  if (value === undefined) return fallback;
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed as T[] : fallback; } catch { return fallback; }
};

export function resolvePublicMatchPageSettings(settings: SiteSetting[]): PublicMatchPageSettings {
  const values = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
  const defaults = DEFAULT_PUBLIC_MATCH_PAGE_SETTINGS;
  const tabs = list<MatchPageTab>(values.match_tabs, defaults.tabs)
    .map((item) => ({ label: String(item?.label ?? '').trim() }))
    .filter((item) => item.label)
    .slice(0, 3);
  const boxScore = ['Public', 'Signed-in users', 'Staff only'].includes(values.match_boxScore)
    ? values.match_boxScore as MatchBoxScoreVisibility
    : defaults.boxScore;
  return {
    tabs: tabs.length ? tabs : defaults.tabs,
    boxScore,
    playRows: integer(values.match_playRows, defaults.playRows, 1, 200),
    quarters: bool(values.match_quarters, defaults.quarters),
    lineups: bool(values.match_lineups, defaults.lineups),
    video: bool(values.match_video, defaults.video),
    delay: integer(values.match_delay, defaults.delay, 0, 300),
    autoPublish: bool(values.match_autoPublish, defaults.autoPublish),
    liveBadge: values.match_liveBadge === undefined ? defaults.liveBadge : values.match_liveBadge.trim(),
    autoShareCards: bool(values.match_autoShareCards, defaults.autoShareCards),
    shareWatermark: values.match_shareWatermark === undefined ? defaults.shareWatermark : values.match_shareWatermark.trim() || defaults.shareWatermark,
    shareLeagueFallback: values.match_shareLeagueFallback === undefined ? defaults.shareLeagueFallback : values.match_shareLeagueFallback.trim() || defaults.shareLeagueFallback,
  };
}

export type MatchTabKind = 'box' | 'play' | 'timeline';

export function resolveMatchTabs(tabs: MatchPageTab[]): Array<{ kind: MatchTabKind; label: string }> {
  const unused: MatchTabKind[] = ['box', 'play', 'timeline'];
  const resolved: Array<{ kind: MatchTabKind; label: string }> = [];
  for (const tab of tabs) {
    const normalized = tab.label.toLowerCase().replace(/[^a-z]/g, '');
    const preferred: MatchTabKind | undefined = normalized.includes('box')
      ? 'box'
      : normalized.includes('play')
        ? 'play'
        : normalized.includes('timeline')
          ? 'timeline'
          : undefined;
    const kind = preferred && unused.includes(preferred) ? preferred : unused[0];
    if (!kind) break;
    resolved.push({ kind, label: tab.label });
    unused.splice(unused.indexOf(kind), 1);
  }
  return resolved;
}

export function canViewMatchBoxScore(
  visibility: MatchBoxScoreVisibility,
  authenticated: boolean,
  staff: boolean,
): boolean {
  if (visibility === 'Public') return true;
  if (visibility === 'Signed-in users') return authenticated;
  return staff;
}
