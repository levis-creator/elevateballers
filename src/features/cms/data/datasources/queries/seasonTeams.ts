import { prisma } from '../../../../../lib/prisma';
import type { Team } from '../../../types';

/**
 * Teams participating in a season, ordered by name. Returns the Team rows
 * (not the join rows) since callers want the teams themselves.
 */
export async function getSeasonTeams(seasonId: string): Promise<Team[]> {
  const rows = await prisma.seasonTeam.findMany({
    where: { seasonId },
    include: { team: true },
    orderBy: { team: { name: 'asc' } },
  });
  return rows.map((r: { team: Team }) => r.team);
}

/**
 * Teams in a league, derived as the union of participants across all of the
 * league's seasons. Deduplicated by team id and ordered by name.
 */
export async function getLeagueTeams(leagueId: string): Promise<Team[]> {
  const rows = await prisma.seasonTeam.findMany({
    where: { season: { leagueId } },
    include: { team: true },
    orderBy: { team: { name: 'asc' } },
  });

  const byId = new Map<string, Team>();
  for (const r of rows as { team: Team }[]) {
    if (!byId.has(r.team.id)) byId.set(r.team.id, r.team);
  }
  return [...byId.values()];
}
