import { prisma } from '../../../../../lib/prisma';
import type { SeasonWithCounts } from '../../../types';

const SEASON_INCLUDE = {
  include: { leagueSeasons: { include: { league: true } }, _count: { select: { matches: true } } },
} as const;

/**
 * Completed matches per season, in one grouped query rather than one per season.
 * Matches with no season are excluded — they belong to a league, not a season.
 */
async function getCompletedCountsBySeason(): Promise<Map<string, number>> {
  const rows = await prisma.match.groupBy({
    by: ['seasonId'],
    where: { status: 'COMPLETED', seasonId: { not: null } },
    _count: { _all: true },
  });

  const counts = new Map<string, number>();
  for (const row of rows) {
    if (row.seasonId) counts.set(row.seasonId, row._count._all);
  }
  return counts;
}

/**
 * `withCompletedCounts` is opt-in so the public pages, which only need the
 * season list, don't pay for the extra aggregate query.
 */
export async function getSeasons(
  activeOnly = false,
  leagueId?: string,
  withCompletedCounts = false,
): Promise<SeasonWithCounts[]> {
  const where: any = activeOnly ? { active: true } : {};
  if (leagueId) where.leagueSeasons = { some: { leagueId } };

  const seasons = (await prisma.season.findMany({
    where,
    ...SEASON_INCLUDE,
    orderBy: { startDate: 'desc' },
  })) as SeasonWithCounts[];

  if (!withCompletedCounts) return seasons;

  const completed = await getCompletedCountsBySeason();
  return seasons.map((season) => ({ ...season, completedMatches: completed.get(season.id) ?? 0 }));
}

export async function getSeasonById(id: string): Promise<SeasonWithCounts | null> {
  return await prisma.season.findUnique({ where: { id }, ...SEASON_INCLUDE }) as SeasonWithCounts | null;
}

export async function getSeasonBySlug(slug: string, leagueId?: string): Promise<SeasonWithCounts | null> {
  const where: any = { slug };
  if (leagueId) where.leagueSeasons = { some: { leagueId } };

  return await prisma.season.findFirst({ where, ...SEASON_INCLUDE }) as SeasonWithCounts | null;
}
