import { prisma } from '../../../../../lib/prisma';
import type { LeagueWithMatchCount } from '../../../types';

const LEAGUE_INCLUDE = {
  include: { _count: { select: { matches: true, leagueSeasons: true } } },
} as const;

/**
 * Distinct team count per league. `season_teams` holds one row per
 * (season, team), so a team entered in three seasons of the same league must
 * still be counted once. Prisma's `_count` would count the rows, not the teams.
 */
async function getTeamCountsByLeague(): Promise<Map<string, number>> {
  const rows = await prisma.seasonTeam.findMany({
    select: { leagueId: true, teamId: true },
    distinct: ['leagueId', 'teamId'],
  });

  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.leagueId, (counts.get(row.leagueId) ?? 0) + 1);
  }
  return counts;
}

/**
 * @param activeOnly     restrict to leagues flagged active
 * @param withTeamCounts also resolve `teamCount` (one extra query — opt in, so
 *                       public pages that never read it don't pay for it)
 */
export async function getLeagues(
  activeOnly = false,
  withTeamCounts = false
): Promise<LeagueWithMatchCount[]> {
  const leagues = (await prisma.league.findMany({
    where: activeOnly ? { active: true } : {},
    ...LEAGUE_INCLUDE,
    orderBy: { name: 'asc' },
  })) as LeagueWithMatchCount[];

  if (!withTeamCounts) return leagues;

  const teamCounts = await getTeamCountsByLeague();
  return leagues.map((league) => ({ ...league, teamCount: teamCounts.get(league.id) ?? 0 }));
}

export async function getLeagueById(id: string): Promise<LeagueWithMatchCount | null> {
  return await prisma.league.findUnique({ where: { id }, ...LEAGUE_INCLUDE }) as LeagueWithMatchCount | null;
}

export async function getLeagueBySlug(slug: string): Promise<LeagueWithMatchCount | null> {
  return await prisma.league.findUnique({ where: { slug }, ...LEAGUE_INCLUDE }) as LeagueWithMatchCount | null;
}
