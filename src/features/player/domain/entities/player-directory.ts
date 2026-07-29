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
};

export type PlayerDirectoryFilters = {
  search: string;
  team: string;
  position: string;
  status: string;
  letter: string;
};

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

