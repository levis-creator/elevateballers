import { prisma } from '../../../../../lib/prisma';
import type { Team } from '../../../types';

/**
 * Teams participating in a season, ordered by name. Returns the Team rows
 * (not the join rows) since callers want the teams themselves. When `leagueId`
 * is given, only that league's roster within the season is returned.
 */
export async function getSeasonTeams(seasonId: string, leagueId?: string): Promise<Team[]> {
  const rows = await prisma.seasonTeam.findMany({
    where: { seasonId, ...(leagueId ? { leagueId } : {}) },
    include: { team: true },
    orderBy: { team: { name: 'asc' } },
  });
  return rows.map((r: { team: Team }) => r.team);
}

/**
 * Teams in a league, derived as the union of participants across all of the
 * league's season rosters. Deduplicated by team id and ordered by name.
 * Reads the league directly off SeasonTeam now that rosters are scoped to
 * a (season, league, team).
 */
export async function getLeagueTeams(leagueId: string): Promise<Team[]> {
  const rows = await prisma.seasonTeam.findMany({
    where: { leagueId },
    include: { team: true },
    orderBy: { team: { name: 'asc' } },
  });

  const byId = new Map<string, Team>();
  for (const r of rows as { team: Team }[]) {
    if (!byId.has(r.team.id)) byId.set(r.team.id, r.team);
  }
  return [...byId.values()];
}
