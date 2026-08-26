import { useCallback, useEffect, useRef, useState } from 'react';
import type { SeasonWithCounts, TeamWithPlayerCount } from '../../types';

type League = { id: string; name: string };
type Season = SeasonWithCounts & { leagueSeasons: Array<SeasonWithCounts['leagueSeasons'][number]> };

export type TeamsPageData = {
  teams: TeamWithPlayerCount[];
  seasons: Season[];
  leagues: League[];
};

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export function useTeams() {
  const [data, setData] = useState<TeamsPageData>({ teams: [], seasons: [], leagues: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setError('');
    try {
      const [teams, seasons, leagues] = await Promise.all([
        getJson<TeamWithPlayerCount[]>('/api/teams', controller.signal),
        getJson<Season[]>('/api/seasons', controller.signal),
        getJson<League[]>('/api/leagues', controller.signal),
      ]);
      if (controller.signal.aborted) return;
      setData({ teams, seasons, leagues });
    } catch (cause) {
      if (controller.signal.aborted) return;
      setError(cause instanceof Error ? cause.message : 'Unable to load teams');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    return () => requestRef.current?.abort();
  }, [refresh]);

  return { ...data, loading, error, refresh };
}
