import { getFilteredMatches } from '@/features/matches/lib/queries';
import { calculateTeamStatistics } from '@/features/team/lib/teamStats';
import { getStandings } from '@/features/standings/lib/getStandings';

const FORM_LENGTH = 6;

/**
 * Record, form and table position for a team. Scoped to the active league
 * season when the team is registered; otherwise every published result, so an
 * unregistered team still sees its history.
 */
export async function getTeamSeasonSummary(teamId: string, leagueSeasonId: string | null) {
  const [completed, standings] = await Promise.all([
    getFilteredMatches(
      { teamId, status: 'COMPLETED', ...(leagueSeasonId ? { leagueSeasonId } : {}) },
      'date-desc'
    ),
    leagueSeasonId ? getStandings({ leagueSeasonId }).catch(() => []) : Promise.resolve([]),
  ]);
  const stats = calculateTeamStatistics(completed, teamId);
  const form = completed
    .filter((m) => m.team1Score != null && m.team2Score != null)
    .slice(0, FORM_LENGTH)
    .map((m) => {
      const isHome = m.team1Id === teamId;
      const own = (isHome ? m.team1Score : m.team2Score) as number;
      const opp = (isHome ? m.team2Score : m.team1Score) as number;
      return own > opp ? ('W' as const) : own < opp ? ('L' as const) : ('D' as const);
    });
  return {
    completed,
    record: {
      played: stats.totalMatches,
      wins: stats.wins,
      losses: stats.losses,
      draws: stats.draws,
      winPct: stats.winPercentage,
      ppg: stats.averagePointsScored,
      oppPpg: stats.averagePointsAllowed,
      pointDiff: stats.totalPointsScored - stats.totalPointsAllowed,
    },
    tablePosition: standings.find((entry) => entry.teamId === teamId)?.rank ?? null,
    tableSize: standings.length || null,
    form,
  };
}
