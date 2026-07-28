import { useCallback, useEffect, useState } from 'react';
import type { SeasonWithCounts, TeamStaffWithStaff, TeamWithPlayers } from '../../types';

type Match = Record<string, any>;
type Registration = {
  season: string;
  league: string;
  structure: string;
  conference: string;
  status: string;
};

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export function useTeamDetail(teamId: string) {
  const [team, setTeam] = useState<TeamWithPlayers | null>(null);
  const [staff, setStaff] = useState<TeamStaffWithStaff[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [seasons, setSeasons] = useState<SeasonWithCounts[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [teamData, staffData, matchesData, seasonData] = await Promise.all([
        getJson<TeamWithPlayers>(`/api/teams/${teamId}`),
        getJson<TeamStaffWithStaff[]>(`/api/teams/${teamId}/staff`).catch(() => []),
        getJson<Match[]>(`/api/matches?teamId=${teamId}&sort=date-desc`).catch(() => []),
        getJson<SeasonWithCounts[]>('/api/seasons').catch(() => []),
      ]);
      setTeam(teamData);
      setStaff(staffData);
      setMatches(matchesData);
      setSeasons(seasonData);

      const registrationRows: Registration[] = [];
      await Promise.all(
        seasonData.slice(0, 8).map(async (season) => {
          const seasonTeams = await getJson<Array<{ id: string }>>(
            `/api/seasons/${season.id}/teams`
          ).catch(() => []);
          if (!seasonTeams.some((entry) => entry.id === teamId)) return;
          for (const leagueSeason of season.leagueSeasons ?? []) {
            registrationRows.push({
              season: season.name,
              league: leagueSeason.league.name,
              structure: String(leagueSeason.competitionStructure ?? 'single').replaceAll('_', ' '),
              conference: season.conferences?.[0]?.name ?? 'Single table',
              status: String(leagueSeason.status ?? 'Active').replaceAll('_', ' '),
            });
          }
        })
      );
      setRegistrations(registrationRows);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load team details');
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const updateApproval = async (approved: boolean) => {
    const response = await fetch(`/api/teams/${teamId}/approve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved }),
    });
    if (!response.ok) throw new Error('Unable to update approval status');
    setTeam((current) => (current ? { ...current, approved } : current));
  };

  return { team, staff, matches, seasons, registrations, loading, error, refresh, updateApproval };
}
