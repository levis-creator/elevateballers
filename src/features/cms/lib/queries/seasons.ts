import { prisma } from '../../../../lib/prisma';
import type { SeasonWithCounts } from '../../types';

const SEASON_INCLUDE = {
  // @ts-expect-error - Prisma types will be correct after full sync
  include: { league: true, _count: { select: { matches: true } } },
} as const;

export async function getSeasons(activeOnly = false, leagueId?: string): Promise<SeasonWithCounts[]> {
  const where: any = activeOnly ? { active: true } : {};
  if (leagueId) where.leagueId = leagueId;

  return await prisma.season.findMany({
    where,
    ...SEASON_INCLUDE,
    orderBy: { startDate: 'desc' },
  }) as SeasonWithCounts[];
}

export async function getSeasonById(id: string): Promise<SeasonWithCounts | null> {
  return await prisma.season.findUnique({ where: { id }, ...SEASON_INCLUDE }) as SeasonWithCounts | null;
}

export async function getSeasonBySlug(slug: string, leagueId?: string): Promise<SeasonWithCounts | null> {
  const where: any = { slug };
  if (leagueId) where.leagueId = leagueId;

  return await prisma.season.findFirst({ where, ...SEASON_INCLUDE }) as SeasonWithCounts | null;
}
