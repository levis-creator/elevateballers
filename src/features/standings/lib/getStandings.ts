import { prisma } from '../../../lib/prisma';

interface GetStandingsOptions {
  leagueId?: string;
  seasonId?: string;
}

export async function getStandings({ leagueId, seasonId }: GetStandingsOptions = {}) {
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
      },
      team2Matches: {
        where: {
          status: 'COMPLETED',
          ...(leagueId && { leagueId }),
          ...(seasonId && { seasonId }),
        },
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

  return standings.map((standing, index) => ({
    ...standing,
    rank: index + 1,
  }));
}
