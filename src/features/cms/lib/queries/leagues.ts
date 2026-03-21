import { prisma } from '../../../../lib/prisma';
import type { LeagueWithMatchCount } from '../../types';

const LEAGUE_INCLUDE = {
  // @ts-expect-error - Prisma types will be correct after full sync
  include: { _count: { select: { matches: true, seasons: true } } },
} as const;

export async function getLeagues(activeOnly = false): Promise<LeagueWithMatchCount[]> {
  return await prisma.league.findMany({
    where: activeOnly ? { active: true } : {},
    ...LEAGUE_INCLUDE,
    orderBy: { name: 'asc' },
  }) as LeagueWithMatchCount[];
}

export async function getLeagueById(id: string): Promise<LeagueWithMatchCount | null> {
  return await prisma.league.findUnique({ where: { id }, ...LEAGUE_INCLUDE }) as LeagueWithMatchCount | null;
}

export async function getLeagueBySlug(slug: string): Promise<LeagueWithMatchCount | null> {
  return await prisma.league.findUnique({ where: { slug }, ...LEAGUE_INCLUDE }) as LeagueWithMatchCount | null;
}
