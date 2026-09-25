import type { PlayerDirectoryRow } from '../../domain/entities/player-directory';

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json() as Promise<T>;
}

/** Like getJson, but surfaces the API's own error message. */
async function sendJson<T = unknown>(url: string, method: string, body: unknown): Promise<T> {
  const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const value = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(value.error || `Request failed (${response.status})`);
  return value as T;
}

export const playerDirectoryApi = {
  list: () => getJson<PlayerDirectoryRow[]>('/api/players'),
  seasons: () => getJson<any[]>('/api/seasons'),
  seasonTeams: (seasonId: string, leagueSeasonId?: string) => getJson<Array<{ id: string }>>(`/api/seasons/${seasonId}/teams${leagueSeasonId ? `?leagueSeasonId=${leagueSeasonId}` : ''}`),
  dropout: (ids: string[], action: 'DROP_OUT' | 'REINSTATE', reason?: string) => sendJson<{ done: string[]; skipped: { id: string; error: string }[] }>('/api/players/bulk-dropout', 'POST', { ids, action, reason }),
  bulkApprove: (ids: string[]) => sendJson('/api/players/bulk-approve', 'POST', { ids, approved: true }),
  bulkDelete: (ids: string[]) => sendJson('/api/players/bulk-delete', 'POST', { ids }),
  setApproval: (playerId: string, approved: boolean) => getJson(`/api/players/${playerId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ approved }) }),
};

