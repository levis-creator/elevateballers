/**
 * Pure domain logic for the admin Audit Logs view: entities, categorisation,
 * grouping, and stats. No fetch/IO here — see `data/datasources/audit-logs`
 * for the API client and `presentation/v2/hooks/useAuditLogsData` for the
 * stateful hook that wires the two together.
 */

export interface AuditUserRef {
  id: string;
  name: string;
  email: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  performedBy: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: AuditUserRef | null;
  performedByUser: AuditUserRef | null;
}

export interface AuditActionCount {
  action: string;
  count: number;
}

export type AuditCategory =
  | 'Authentication'
  | 'Settings'
  | 'Users & roles'
  | 'Email'
  | 'Content'
  | 'Competition'
  | 'Other';

export const AUDIT_CATEGORIES: AuditCategory[] = [
  'Authentication',
  'Settings',
  'Users & roles',
  'Email',
  'Content',
  'Competition',
];

/** Ordered prefix → category map. First match wins. */
const CATEGORY_PREFIXES: Array<[string, AuditCategory]> = [
  ['AUTH_', 'Authentication'],
  ['SETTING_', 'Settings'],
  ['ROLE_', 'Users & roles'],
  ['USER_', 'Users & roles'],
  ['EMAIL_', 'Email'],
  ['NEWS_', 'Content'],
  ['MEDIA_', 'Content'],
  ['PAGE_', 'Content'],
  ['POTW_', 'Content'],
  ['SPONSOR_', 'Content'],
  ['MATCH_', 'Competition'],
  ['GAME_', 'Competition'],
  ['TEAM_', 'Competition'],
  ['SEASON_', 'Competition'],
  ['LEAGUE_', 'Competition'],
  ['STAFF_', 'Competition'],
];

/** Single prefix per category that the API's `action.contains` filter can apply server-side. */
export const CATEGORY_SERVER_PREFIX: Partial<Record<AuditCategory, string>> = {
  Authentication: 'AUTH_',
  Settings: 'SETTING_',
  Email: 'EMAIL_',
};

export function categorizeAction(action: string): AuditCategory {
  const match = CATEGORY_PREFIXES.find(([prefix]) => action.startsWith(prefix));
  return match ? match[1] : 'Other';
}

export function isFailureAction(action: string): boolean {
  return /_FAILED$|_FAILURE$/.test(action);
}

/** [background, foreground] per category — matches the design's exact tone map. */
const DOMAIN_TONE: Record<AuditCategory, [string, string]> = {
  Authentication: ['rgba(228,0,43,0.12)', '#ff5a72'],
  Settings: ['rgba(255,255,255,0.07)', 'var(--txd)'],
  'Users & roles': ['rgba(228,0,43,0.10)', '#e4002b'],
  Email: ['rgba(255,255,255,0.07)', 'var(--txd)'],
  Content: ['rgba(255,255,255,0.07)', 'var(--txd)'],
  Competition: ['rgba(255,255,255,0.07)', 'var(--txd)'],
  Other: ['rgba(255,255,255,0.07)', 'var(--txd)'],
};

export function domainTone(action: string): [string, string] {
  return DOMAIN_TONE[categorizeAction(action)];
}

export interface AuditDayGroup {
  /** Sortable YYYY-MM-DD key. */
  key: string;
  /** Display label, e.g. "Today · Saturday, 15 August 2026". */
  label: string;
  entries: AuditLogEntry[];
  failureCount: number;
}

function dayKey(date: string): string {
  return new Date(date).toLocaleDateString('en-CA');
}

function dayLabel(date: string): string {
  const d = new Date(date);
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
  const month = d.toLocaleDateString('en-US', { month: 'long' });
  const full = `${weekday}, ${d.getDate()} ${month} ${d.getFullYear()}`;

  const key = dayKey(date);
  const today = dayKey(new Date().toISOString());
  const yesterday = dayKey(new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  if (key === today) return `Today · ${full}`;
  if (key === yesterday) return `Yesterday · ${full}`;
  return full;
}

/** Group entries by calendar day, newest day first. Entries must already be sorted newest-first. */
export function groupByDay(entries: AuditLogEntry[]): AuditDayGroup[] {
  const groups = new Map<string, AuditDayGroup>();
  for (const entry of entries) {
    const key = dayKey(entry.createdAt);
    let group = groups.get(key);
    if (!group) {
      group = { key, label: dayLabel(entry.createdAt), entries: [], failureCount: 0 };
      groups.set(key, group);
    }
    group.entries.push(entry);
    if (isFailureAction(entry.action)) group.failureCount += 1;
  }
  return Array.from(groups.values());
}

export interface AuditStats {
  entriesLast24h: number;
  failuresLast24h: number;
  settingsChangedLast24h: number;
  settingsSectionsLast24h: number;
  activePeopleLast24h: number;
}

/** Stats are always computed over the last 24 hours, independent of the active filters. */
export function computeStats(entries: AuditLogEntry[]): AuditStats {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const last24h = entries.filter((e) => new Date(e.createdAt).getTime() >= cutoff);
  const failures = last24h.filter((e) => isFailureAction(e.action));
  const settingsEntries = last24h.filter((e) => categorizeAction(e.action) === 'Settings');
  const settingsSections = new Set(settingsEntries.map((e) => e.action));
  const activePeople = new Set(last24h.map((e) => e.performedBy).filter(Boolean));

  return {
    entriesLast24h: last24h.length,
    failuresLast24h: failures.length,
    settingsChangedLast24h: settingsEntries.length,
    settingsSectionsLast24h: settingsSections.size,
    activePeopleLast24h: activePeople.size,
  };
}

export function actionLabel(action: string): string {
  return action
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** Best-effort human summary of an entry's metadata (shape varies per action). */
export function summarizeMetadata(metadata: Record<string, unknown> | null): string | null {
  if (!metadata) return null;
  const entries = Object.entries(metadata).filter(([key]) => key !== 'source');
  if (!entries.length) return null;
  return entries
    .map(([key, value]) => `${key}: ${formatMetadataValue(value)}`)
    .join(' · ');
}

function formatMetadataValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function matchesQuery(entry: AuditLogEntry, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    entry.action,
    entry.user?.name,
    entry.user?.email,
    entry.performedByUser?.name,
    entry.performedByUser?.email,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}

export function matchesActor(entry: AuditLogEntry, actorQuery: string): boolean {
  const q = actorQuery.trim().toLowerCase();
  if (!q) return true;
  const actor = entry.performedByUser;
  const haystack = [actor?.name, actor?.email].filter(Boolean).join(' ').toLowerCase();
  return haystack.includes(q);
}

export function matchesPayload(entry: AuditLogEntry, payloadQuery: string): boolean {
  const q = payloadQuery.trim().toLowerCase();
  if (!q) return true;
  if (!entry.metadata) return false;
  return JSON.stringify(entry.metadata).toLowerCase().includes(q);
}

/** Actor initial for the row/drawer avatar — "?" when there's no name at all. */
export function actorInitial(entry: AuditLogEntry): string {
  const name = entry.performedByUser?.name || entry.performedBy;
  return (name || '?').charAt(0).toUpperCase();
}

/** Actor avatars are neutral (faint) for anonymous/system actors, brand red otherwise. */
export function isAnonymousActor(entry: AuditLogEntry): boolean {
  const name = entry.performedByUser?.name;
  return !name || name === 'Unknown' || name === 'System';
}

export function actorDisplay(entry: AuditLogEntry): { name: string; meta: string } {
  if (entry.performedByUser) {
    return { name: entry.performedByUser.name, meta: entry.performedByUser.email };
  }
  return { name: 'Unknown', meta: entry.performedBy };
}

/** "Saturday, 15 August 2026 at 01:14" — used in the detail drawer subtitle. */
export function formatFullTimestamp(iso: string): string {
  const d = new Date(iso);
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
  const month = d.toLocaleDateString('en-US', { month: 'long' });
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${weekday}, ${d.getDate()} ${month} ${d.getFullYear()} at ${time}`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}
