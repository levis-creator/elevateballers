import { prisma } from '../../../lib/prisma';
import { cacheGet, cacheSet } from '../../../lib/cache';

interface GetStandingsOptions {
  leagueId?: string;
  seasonId?: string;
}

interface StandingEntry {
  teamId: string;
  team: string;
  logo: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  url: string;
  rank: number;
}

export async function getStandings({ leagueId, seasonId }: GetStandingsOptions = {}): Promise<StandingEntry[]> {
  const cacheKey = `standings:${leagueId ?? 'all'}:${seasonId ?? 'all'}`;
  const cached = await cacheGet<StandingEntry[]>(cacheKey);
  if (cached) return cached;

  const teams = await prisma.team.findMany({
    where: {
      approved: true,
    },
    include: {
      team1Matches: {
        where: {
          status: 'COMPLETED',
          ...(leagueId && { leagueId }),
          ...(seasonId && { seasonId }),
        },
        select: { team1Score: true, team2Score: true },
      },
      team2Matches: {
        where: {
          status: 'COMPLETED',
          ...(leagueId && { leagueId }),
          ...(seasonId && { seasonId }),
        },
        select: { team1Score: true, team2Score: true },
      },
    },
  });

  const standings = teams.map((team) => {
    let played = 0;
    let won = 0;
    let drawn = 0;
    let lost = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;

    team.team1Matches.forEach((match) => {
      if (match.team1Score !== null && match.team2Score !== null) {
        played++;
        goalsFor += match.team1Score;
        goalsAgainst += match.team2Score;

        if (match.team1Score > match.team2Score) {
          won++;
        } else if (match.team1Score === match.team2Score) {
          drawn++;
        } else {
          lost++;
        }
      }
    });

    team.team2Matches.forEach((match) => {
      if (match.team1Score !== null && match.team2Score !== null) {
        played++;
        goalsFor += match.team2Score;
        goalsAgainst += match.team1Score;

        if (match.team2Score > match.team1Score) {
          won++;
        } else if (match.team1Score === match.team2Score) {
          drawn++;
        } else {
          lost++;
        }
      }
    });

    const goalDifference = goalsFor - goalsAgainst;
    const points = won * 3 + drawn;

    return {
      teamId: team.id,
      team: team.name,
      logo: team.logo,
      played,
      won,
      drawn,
      lost,
      goalsFor,
      goalsAgainst,
      goalDifference,
      points,
      url: `/teams/${team.slug}`,
    };
  });

  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });

  const filteredStandings = (leagueId || seasonId)
    ? standings.filter((standing) => standing.played > 0)
    : standings;

  const result = filteredStandings.map((standing, index) => ({
    ...standing,
    rank: index + 1,
  }));

  await cacheSet(cacheKey, result, 1800); // 30 min TTL — invalidated on game end via QStash
  return result;
}
