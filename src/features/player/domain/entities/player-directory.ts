export type PlayerDirectoryScope = 'season' | 'directory';
export type PlayerSortKey = 'name' | 'jersey';
export type SortDirection = 'asc' | 'desc';

export type PlayerDirectoryRow = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  position?: string | null;
  jerseyNumber?: number | null;
  image?: string | null;
  height?: string | number | null;
  approved?: boolean | null;
  teamId?: string | null;
  team?: { id?: string; name?: string | null; shortName?: string | null; logo?: string | null; image?: string | null; logoUrl?: string | null } | null;
  /** Set (admins only) when the player has left the league; `rosterId` is the entry to reinstate. */
  dropout?: { rosterId: string; droppedOutAt: string } | null;
};

export type PlayerDirectoryFilters = {
  search: string;
  team: string;
  position: string;
  status: string;
  letter: string;
  /** League participation: everyone, only players still playing, or only those who dropped out. */
  participation: PlayerParticipation;
};

export type PlayerParticipation = 'all' | 'active' | 'dropped';

export function matchesParticipation(player: PlayerDirectoryRow, participation: PlayerParticipation): boolean {
  if (participation === 'dropped') return Boolean(player.dropout);
  if (participation === 'active') return !player.dropout;
  return true;
}

const csvCell = (value: unknown) => {
  const text = value == null ? '' : String(value);
  // Quote anything with separators, and neutralise spreadsheet formulas.
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

/** The selected players as CSV for the bulk Export action. */
export function toPlayersCsv(players: PlayerDirectoryRow[]): string {
  const header = ['First name', 'Last name', 'Team', 'Position', 'Jersey', 'Approved', 'Dropped out'];
  const rows = players.map((p) => [
    p.firstName,
    p.lastName,
    p.team?.name,
    p.position,
    p.jerseyNumber,
    p.approved ? 'Yes' : 'No',
    p.dropout ? new Date(p.dropout.droppedOutAt).toISOString().slice(0, 10) : '',
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
}

export const PLAYER_POSITIONS: Record<string, { label: string; color: string }> = {
  PG: { label: 'Point Guard', color: '#2a6fdb' },
  SG: { label: 'Shooting Guard', color: '#7c5cff' },
  SF: { label: 'Small Forward', color: '#c026a6' },
  PF: { label: 'Power Forward', color: '#d98324' },
  C: { label: 'Center', color: '#1f8a5b' },
};

export function getPlayerName(player: PlayerDirectoryRow): string {
  return `${player.firstName ?? ''} ${player.lastName ?? ''}`.trim() || 'Unnamed player';
}

export function getPositionKey(value: unknown): string {
  const text = String(value ?? '').toUpperCase();
  return Object.keys(PLAYER_POSITIONS).find((key) => text === key || text.includes(PLAYER_POSITIONS[key].label.toUpperCase())) ?? '';
}

export function getInitials(value: string): string {
  return value.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase();
}

export function getMissingProfileFields(player: PlayerDirectoryRow): string[] {
  return [!player.image && 'photo', player.jerseyNumber == null && 'jersey', !player.height && 'height'].filter(Boolean) as string[];
}

export function getProfileCompleteness(player: PlayerDirectoryRow): number {
  return Math.max(0, 100 - getMissingProfileFields(player).length * 22);
}

export function sortPlayers(players: PlayerDirectoryRow[], key: PlayerSortKey, direction: SortDirection): PlayerDirectoryRow[] {
  return [...players].sort((a, b) => {
    const left = key === 'name' ? getPlayerName(a) : (a.jerseyNumber ?? 999);
    const right = key === 'name' ? getPlayerName(b) : (b.jerseyNumber ?? 999);
    const result = typeof left === 'string' ? left.localeCompare(right as string) : left - (right as number);
    return direction === 'asc' ? result : -result;
  });
}

