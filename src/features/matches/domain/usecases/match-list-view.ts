/**
 * Pure view-model helpers for the admin Matches list (v2 UI).
 *
 * Framework-free and side-effect-free so the grouping / stat / formatting logic
 * can be unit-tested and reused independent of React. The presentation layer
 * (useMatchListData + MatchListV2) is the only place these get wired to state.
 */
import type { Match, MatchWithTeamsAndLeagueAndSeason } from '../../../cms/types';
import { MATCH_TIMEZONE } from './utils';
import { getTeam1Name, getTeam2Name } from './team-helpers';
import { getSeasonName } from './season-helpers';
import { getLeagueName } from './league-helpers';

export type MatchStatusKey = 'UPCOMING' | 'LIVE' | 'COMPLETED';

/** Any match shape carrying the relations the list needs (team/league/season). */
export type ListMatch = Match | MatchWithTeamsAndLeagueAndSeason;

export interface StatusMeta {
  /** Human label shown in the status pill. */
  label: string;
  /** Accent colour (hex) for the pill dot + text. */
  color: string;
  /**
   * Label for the contextual console button, or null when the status has no
   * console action (completed matches show the winner instead).
   */
  consoleLabel: string | null;
  /** Console button accent colour (hex), when consoleLabel is set. */
  consoleColor: string;
}

const STATUS_META: Record<MatchStatusKey, StatusMeta> = {
  LIVE: { label: 'Live', color: '#e4002b', consoleLabel: 'Live Console', consoleColor: '#e4002b' },
  COMPLETED: { label: 'Completed', color: '#1f9d55', consoleLabel: null, consoleColor: '#2a6fdb' },
  UPCOMING: { label: 'Scheduled', color: '#d98324', consoleLabel: 'Score Console', consoleColor: '#2a6fdb' },
};

/** Normalise a raw status string to a known key (defaults to UPCOMING). */
export function toStatusKey(status: string | null | undefined): MatchStatusKey {
  const s = String(status ?? '').toUpperCase();
  return s === 'LIVE' || s === 'COMPLETED' ? s : 'UPCOMING';
}

export function statusMeta(status: string | null | undefined): StatusMeta {
  return STATUS_META[toStatusKey(status)];
}

export interface MatchStats {
  total: number;
  completed: number;
  live: number;
  scheduled: number;
}

/** Tally match counts by status for the summary cards. */
export function computeStats(matches: ListMatch[]): MatchStats {
  const stats: MatchStats = { total: matches.length, completed: 0, live: 0, scheduled: 0 };
  for (const m of matches) {
    const key = toStatusKey(m.status);
    if (key === 'COMPLETED') stats.completed += 1;
    else if (key === 'LIVE') stats.live += 1;
    else stats.scheduled += 1;
  }
  return stats;
}

export type SortDirection = 'asc' | 'desc';

/** Millisecond timestamp for a match, or ±Infinity so undated rows sort last. */
function matchTime(match: ListMatch, direction: SortDirection): number {
  const t = new Date(match.date).getTime();
  if (Number.isFinite(t)) return t;
  return direction === 'desc' ? -Infinity : Infinity;
}

/**
 * Sort matches by date. Defaults to newest-first; undated matches always sort
 * last regardless of direction. Pure (returns a new array).
 */
export function sortByDate(matches: ListMatch[], direction: SortDirection = 'desc'): ListMatch[] {
  return [...matches].sort((a, b) => {
    const ta = matchTime(a, direction);
    const tb = matchTime(b, direction);
    return direction === 'desc' ? tb - ta : ta - tb;
  });
}

export interface MatchDateGroup {
  /** Sortable YYYY-MM-DD key in the match timezone. */
  key: string;
  /** Display label, e.g. "Feb 23, 2026". */
  label: string;
  matches: ListMatch[];
}

/** Sortable day key (YYYY-MM-DD) for a date in the given timezone. */
function dayKey(date: string | Date, timeZone: string): string {
  // en-CA yields ISO-ordered YYYY-MM-DD, which sorts lexicographically by day.
  return new Date(date).toLocaleDateString('en-CA', { timeZone });
}

function dayLabel(date: string | Date, timeZone: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    timeZone,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Group matches by calendar day (in the match timezone). Groups are ordered by
 * date — newest-first by default. Within a group, matches keep their incoming
 * order (callers pass an already date-sorted list). Matches with an unparseable
 * date fall into a trailing "unscheduled" bucket so they never silently vanish.
 */
export function groupByDate(
  matches: ListMatch[],
  timeZone: string = MATCH_TIMEZONE,
  direction: SortDirection = 'desc',
): MatchDateGroup[] {
  const groups = new Map<string, MatchDateGroup>();

  for (const match of matches) {
    const time = new Date(match.date).getTime();
    const valid = Number.isFinite(time);
    const key = valid ? dayKey(match.date, timeZone) : 'unscheduled';
    let group = groups.get(key);
    if (!group) {
      group = { key, label: valid ? dayLabel(match.date, timeZone) : 'Date TBD', matches: [] };
      groups.set(key, group);
    }
    group.matches.push(match);
  }

  return [...groups.values()].sort((a, b) => {
    if (a.key === 'unscheduled') return 1;
    if (b.key === 'unscheduled') return -1;
    return direction === 'desc' ? b.key.localeCompare(a.key) : a.key.localeCompare(b.key);
  });
}

/** Time-of-day label for a match, e.g. "12:00 PM". */
export function formatMatchTime(date: string | Date, timeZone: string = MATCH_TIMEZONE): string {
  const time = new Date(date).getTime();
  if (!Number.isFinite(time)) return 'TBD';
  return new Date(date).toLocaleTimeString('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Deterministic avatar tint for a team, so the same team always renders the same
 * colour without needing a stored brand colour. Pure hash → fixed palette.
 */
const AVATAR_TINTS = [
  '#7c5cff', '#2a6fdb', '#1f9d55', '#e4002b',
  '#d98324', '#c026a6', '#0ea5e9', '#e0a800',
];

export function avatarTint(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return AVATAR_TINTS[Math.abs(hash) % AVATAR_TINTS.length];
}

/**
 * Client-side search predicate — matches team names, league and season. Server
 * already filters by status/season/league; this narrows the loaded page as the
 * user types.
 */
export function matchesQuery(match: ListMatch, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystacks = [
    getTeam1Name(match),
    getTeam2Name(match),
    getLeagueName(match) ?? '',
    getSeasonName(match) ?? '',
  ];
  return haystacks.some((h) => h.toLowerCase().includes(q));
}
