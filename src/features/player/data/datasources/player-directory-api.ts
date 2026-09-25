import type { PlayerDirectoryRow } from '../../domain/entities/player-directory';

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export const playerDirectoryApi = {
  list: () => getJson<PlayerDirectoryRow[]>('/api/players'),
  seasons: () => getJson<any[]>('/api/seasons'),
  seasonTeams: (seasonId: string, leagueSeasonId?: string) => getJson<Array<{ id: string }>>(`/api/seasons/${seasonId}/teams${leagueSeasonId ? `?leagueSeasonId=${leagueSeasonId}` : ''}`),
  reinstate: (playerId: string, rosterId: string) => getJson(`/api/players/${playerId}/dropout`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rosterId, action: 'REINSTATE' }) }),
  setApproval: (playerId: string, approved: boolean) => getJson(`/api/players/${playerId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ approved }) }),
};

