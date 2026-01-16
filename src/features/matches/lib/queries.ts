/**
 * Match queries for public-facing pages
 * Provides optimized queries for displaying matches
 */

import { prisma } from '../../../lib/prisma';
import type { Match, MatchStatus, MatchStage } from '@prisma/client';
import type { MatchFilter, MatchSortOption } from '../types';
import type { MatchWithTeamsAndLeagueAndSeason } from '../../../features/cms/types';

/**
 * Get upcoming matches (matches with date >= today and status UPCOMING or LIVE)
 */
export async function getUpcomingMatches(limit?: number): Promise<MatchWithTeamsAndLeagueAndSeason[]> {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const matches = await prisma.match.findMany({
    where: {
      OR: [
        {
          date: { gte: now },
          status: { in: ['UPCOMING', 'LIVE'] },
        },
        {
          status: 'LIVE',
        },
      ],
    },
    // @ts-expect-error - Prisma types will be correct after migration
    include: {
      team1: true,
      team2: true,
      league: true,
      season: true,
    },
    orderBy: {
      date: 'asc',
    },
    take: limit,
  }) as MatchWithTeamsAndLeagueAndSeason[];

  return matches;
}

/**
 * Get completed matches (status COMPLETED)
 */
export async function getCompletedMatches(limit?: number): Promise<MatchWithTeamsAndLeagueAndSeason[]> {
  const matches = await (prisma.match.findMany({
    where: {
      status: 'COMPLETED',
    },
    // @ts-expect-error - Prisma types will be correct after migration
    include: {
      team1: true,
      team2: true,
      league: true,
      season: true,
    },
    orderBy: {
      date: 'desc',
    },
    take: limit,
  }) as Promise<MatchWithTeamsAndLeagueAndSeason[]>);

  return matches;
}

/**
 * Get live matches (status LIVE)
 */
export async function getLiveMatches(): Promise<MatchWithTeamsAndLeagueAndSeason[]> {
  const matches = await (prisma.match.findMany({
    where: {
      status: 'LIVE',
    },
    // @ts-expect-error - Prisma types will be correct after migration
    include: {
      team1: true,
      team2: true,
      league: true,
      season: true,
    },
    orderBy: {
      date: 'asc',
    },
  }) as Promise<MatchWithTeamsAndLeagueAndSeason[]>);

  return matches;
}

/**
 * Get next match (single upcoming match)
 */
export async function getNextMatch(): Promise<MatchWithTeamsAndLeagueAndSeason | null> {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const match = await (prisma.match.findFirst({
    where: {
      OR: [
        {
          date: { gte: now },
          status: { in: ['UPCOMING', 'LIVE'] },
        },
        {
          status: 'LIVE',
        },
      ],
    },
    // @ts-expect-error - Prisma types will be correct after migration
    include: {
      team1: true,
      team2: true,
      league: true,
      season: true,
    },
    orderBy: {
      date: 'asc',
    },
  }) as Promise<MatchWithTeamsAndLeagueAndSeason | null>);

  return match;
}

/**
 * Get matches with advanced filtering
 */
export async function getFilteredMatches(
  filter: MatchFilter = {},
  sort: MatchSortOption = 'date-asc',
  limit?: number
): Promise<MatchWithTeamsAndLeagueAndSeason[]> {
  const where: any = {};

  // Status filter
  if (filter.status && filter.status !== 'all') {
    where.status = filter.status;
  }

  // Stage filter
  if (filter.stage) {
    where.stage = filter.stage;
  }

  // League filter - support both leagueId and league name
  if (filter.leagueId) {
    where.leagueId = filter.leagueId;
  } else if (filter.league) {
    // Try to find league by name or slug first
    const league = await (prisma.league.findFirst({
      where: {
        OR: [
          { slug: filter.league },
          { name: { equals: filter.league, mode: 'insensitive' } },
        ],
      },
    }) as any);
    
    if (league) {
      where.leagueId = league.id;
    } else {
      // Fallback to leagueName field (backward compatibility)
      where.leagueName = {
        contains: filter.league,
        mode: 'insensitive',
      };
    }
  }

  // Season filter
  if (filter.seasonId) {
    where.seasonId = filter.seasonId;
  }

  // Team filter - matches where team is either team1 or team2
  if (filter.teamId) {
    const teamFilter = {
      OR: [
        { team1Id: filter.teamId },
        { team2Id: filter.teamId },
      ],
    };

    // If search filter also exists, we need to combine OR conditions
    if (filter.search) {
      const searchFilter = {
        OR: [
          { team1Name: { contains: filter.search, mode: 'insensitive' } },
          { team2Name: { contains: filter.search, mode: 'insensitive' } },
          { league: { contains: filter.search, mode: 'insensitive' } },
        ],
      };
      // Combine both filters with AND
      where.AND = [
        teamFilter,
        searchFilter,
      ];
    } else {
      // Just apply team filter
      where.OR = teamFilter.OR;
    }
  } else if (filter.search) {
    // Only search filter, no team filter
    where.OR = [
      { team1Name: { contains: filter.search, mode: 'insensitive' } },
      { team2Name: { contains: filter.search, mode: 'insensitive' } },
      { league: { contains: filter.search, mode: 'insensitive' } },
    ];
  }

  // Date range filter
  if (filter.dateFrom || filter.dateTo) {
    where.date = {};
    if (filter.dateFrom) {
      where.date.gte = filter.dateFrom;
    }
    if (filter.dateTo) {
      where.date.lte = filter.dateTo;
    }
  }

  // Sort options
  const orderBy: any = {};
  if (sort === 'date-asc') {
    orderBy.date = 'asc';
  } else if (sort === 'date-desc') {
    orderBy.date = 'desc';
  } else if (sort === 'league-asc') {
    orderBy.league = 'asc';
  } else if (sort === 'league-desc') {
    orderBy.league = 'desc';
  }

  const matches = await (prisma.match.findMany({
    where,
    // @ts-expect-error - Prisma types will be correct after migration
    include: {
      team1: true,
      team2: true,
      league: true,
      season: true,
    },
    orderBy,
    take: limit,
  }) as Promise<MatchWithTeamsAndLeagueAndSeason[]>);

  return matches;
}

/**
 * Get matches by league (by slug or name)
 */
export async function getMatchesByLeague(leagueSlugOrName: string): Promise<MatchWithTeamsAndLeagueAndSeason[]> {
  // First try to find league by slug
  // @ts-expect-error - Prisma types will be correct after migration
  const league = await (prisma.league.findFirst({
    where: {
      OR: [
        { slug: leagueSlugOrName },
        { name: { equals: leagueSlugOrName, mode: 'insensitive' } },
      ],
    },
  }) as any);

  const where: any = {};
  
  if (league) {
    // Use league ID if found
    where.leagueId = league.id;
  } else {
    // Fallback to league name field
    where.league = {
      equals: leagueSlugOrName,
      mode: 'insensitive',
    };
  }

  const matches = await (prisma.match.findMany({
    where,
    // @ts-expect-error - Prisma types will be correct after migration
    include: {
      team1: true,
      team2: true,
      league: true,
      season: true,
    },
    orderBy: {
      date: 'desc',
    },
  }) as Promise<MatchWithTeamsAndLeagueAndSeason[]>);

  return matches;
}

/**
 * Get matches by specific stage
 */
export async function getMatchesByStage(
  stage: MatchStage,
  options?: {
    status?: MatchStatus;
    limit?: number;
    sort?: 'date-asc' | 'date-desc';
  }
): Promise<MatchWithTeamsAndLeagueAndSeason[]> {
  const where: any = { stage };
  
  if (options?.status) {
    where.status = options.status;
  }

  const matches = await (prisma.match.findMany({
    where,
    // @ts-expect-error - Prisma types will be correct after migration
    include: {
      team1: true,
      team2: true,
      league: true,
      season: true,
    },
    orderBy: {
      date: options?.sort === 'date-desc' ? 'desc' : 'asc',
    },
    take: options?.limit,
  }) as Promise<MatchWithTeamsAndLeagueAndSeason[]>);

  return matches;
}

/**
 * Get all championship matches (useful for marquee matchup)
 */
export async function getChampionships(limit: number = 1): Promise<MatchWithTeamsAndLeagueAndSeason[]> {
  return getMatchesByStage('CHAMPIONSHIP', { 
    status: 'UPCOMING', 
    limit,
    sort: 'date-asc' 
  });
}

/**
 * Get match statistics
 */
export async function getMatchStats() {
  const [total, upcoming, live, completed] = await Promise.all([
    prisma.match.count(),
    prisma.match.count({ where: { status: 'UPCOMING' } }),
    prisma.match.count({ where: { status: 'LIVE' } }),
    prisma.match.count({ where: { status: 'COMPLETED' } }),
  ]);

  return {
    total,
    upcoming,
    live,
    completed,
  };
}

