/**
 * Match queries — public-facing and admin
 */

import { prisma } from '../../../../lib/prisma';
import type { Match, MatchStatus, MatchStage } from '@prisma/client';
import type { MatchFilter, MatchSortOption } from '../../domain/entities';
import type {
  MatchWithTeamsAndLeagueAndSeason,
  MatchWithFullDetails,
  MatchEventWithDetails,
  MatchPlayerWithDetails,
} from '@/lib/types';

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
      winner: true,
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
      winner: true,
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
      winner: true,
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
      winner: true,
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
      winner: true,
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
      winner: true,
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
      winner: true,
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

// ─── Admin queries ─────────────────────────────────────────────────────────────

export async function getMatches(status?: string): Promise<MatchWithTeamsAndLeagueAndSeason[]> {
  const where: any = {};

  if (status) {
    const statusMap: Record<string, MatchStatus> = {
      upcoming: 'UPCOMING',
      live: 'LIVE',
      completed: 'COMPLETED',
    };
    if (statusMap[status.toLowerCase()]) {
      where.status = statusMap[status.toLowerCase()];
    }
  }

  return await prisma.match.findMany({
    where,
    include: { team1: true, team2: true, league: true, season: true, winner: true },
    orderBy: { date: 'asc' },
  }) as MatchWithTeamsAndLeagueAndSeason[];
}

export async function getMatchById(id: string): Promise<MatchWithTeamsAndLeagueAndSeason | null> {
  return await prisma.match.findUnique({
    where: { id },
    // @ts-expect-error - Prisma types will be correct after dev server restart
    include: { team1: true, team2: true, league: true, season: true, winner: true },
  }) as MatchWithTeamsAndLeagueAndSeason | null;
}

export async function getMatchWithFullDetails(matchId: string): Promise<MatchWithFullDetails | null> {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { team1: true, team2: true, league: true, season: true },
    });

    if (!match) return null;

    let matchPlayers: MatchPlayerWithDetails[] = [];
    let events: MatchEventWithDetails[] = [];

    try {
      matchPlayers = await getMatchPlayers(matchId);
    } catch (err) {
      console.warn('Failed to fetch match players:', err);
    }

    try {
      events = await getMatchEvents(matchId);
    } catch (err) {
      console.warn('Failed to fetch match events:', err);
    }

    let substitutions: any[] = [];
    try {
      substitutions = await prisma.substitution.findMany({
        where: { matchId },
        orderBy: { createdAt: 'desc' },
        include: { playerIn: true, playerOut: true },
      });
    } catch (err) {
      console.warn('Failed to fetch substitutions:', err);
    }

    return { ...match, matchPlayers, events, substitutions } as MatchWithFullDetails;
  } catch (error: any) {
    console.error('Error in getMatchWithFullDetails:', error);
    throw error;
  }
}

export async function getTournamentMatches(
  leagueId?: string,
  seasonId?: string
): Promise<MatchWithTeamsAndLeagueAndSeason[]> {
  const where: any = {
    stage: { in: ['PLAYOFF', 'QUARTER_FINALS', 'SEMI_FINALS', 'CHAMPIONSHIP'] },
  };
  if (leagueId) where.leagueId = leagueId;
  if (seasonId) where.seasonId = seasonId;

  return await prisma.match.findMany({
    where,
    include: { team1: true, team2: true, league: true, season: true, winner: true },
    orderBy: { date: 'asc' },
  }) as MatchWithTeamsAndLeagueAndSeason[];
}

// ─── Match event queries ───────────────────────────────────────────────────────

export async function getMatchEvents(matchId: string): Promise<MatchEventWithDetails[]> {
  return await prisma.matchEvent.findMany({
    where: { matchId },
    include: { player: true, assistPlayer: true, team: true },
    orderBy: { createdAt: 'desc' },
  }) as MatchEventWithDetails[];
}

export async function getMatchEventsByTeam(matchId: string, teamId: string): Promise<MatchEventWithDetails[]> {
  return await prisma.matchEvent.findMany({
    where: { matchId, teamId },
    include: { player: true, assistPlayer: true, team: true },
    orderBy: { createdAt: 'desc' },
  }) as MatchEventWithDetails[];
}

export async function getMatchEventsByType(matchId: string, eventType: string): Promise<MatchEventWithDetails[]> {
  return await prisma.matchEvent.findMany({
    where: { matchId, eventType: eventType as any },
    include: { player: true, assistPlayer: true, team: true },
    orderBy: { createdAt: 'desc' },
  }) as MatchEventWithDetails[];
}

export async function getMatchEventById(id: string): Promise<MatchEventWithDetails | null> {
  return await prisma.matchEvent.findUnique({
    where: { id },
    include: { player: true, assistPlayer: true, team: true },
  }) as MatchEventWithDetails | null;
}

// ─── Match player queries ──────────────────────────────────────────────────────

export async function getMatchPlayers(matchId: string): Promise<MatchPlayerWithDetails[]> {
  return await prisma.matchPlayer.findMany({
    where: { matchId },
    include: { player: true, team: true },
    orderBy: [{ started: 'desc' }, { jerseyNumber: 'asc' }],
  }) as MatchPlayerWithDetails[];
}

export async function getMatchPlayersByTeam(matchId: string, teamId: string): Promise<MatchPlayerWithDetails[]> {
  return await prisma.matchPlayer.findMany({
    where: { matchId, teamId },
    include: { player: true, team: true },
    orderBy: [{ started: 'desc' }, { jerseyNumber: 'asc' }],
  }) as MatchPlayerWithDetails[];
}

export async function getMatchPlayerById(id: string): Promise<MatchPlayerWithDetails | null> {
  return await prisma.matchPlayer.findUnique({
    where: { id },
    include: { player: true, team: true },
  }) as MatchPlayerWithDetails | null;
}
