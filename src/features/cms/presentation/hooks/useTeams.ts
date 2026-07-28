import { useCallback, useEffect, useState } from 'react';
import type { SeasonWithCounts, TeamWithPlayerCount } from '../../types';

type League = { id: string; name: string };
type Season = SeasonWithCounts & { leagueSeasons: Array<SeasonWithCounts['leagueSeasons'][number]> };

export type TeamsPageData = {
  teams: TeamWithPlayerCount[];
  seasons: Season[];
  leagues: League[];
};

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export function useTeams() {
  const [data, setData] = useState<TeamsPageData>({ teams: [], seasons: [], leagues: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [teams, seasons, leagues] = await Promise.all([
        getJson<TeamWithPlayerCount[]>('/api/teams'),
        getJson<Season[]>('/api/seasons'),
        getJson<League[]>('/api/leagues'),
      ]);
      setData({ teams, seasons, leagues });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load teams');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  return { ...data, loading, error, refresh };
}
