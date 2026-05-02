import { prisma } from '../../../../../lib/prisma';
import type {
  MatchWithTeamsAndLeagueAndSeason,
  MatchWithFullDetails,
  MatchStatus,
} from '../../../types';
import { getMatchPlayers } from './matchPlayer';
import { getMatchEvents } from './matchEvent';

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
    include: { team1: true, team2: true, league: true, season: true, winner: true },
  }) as MatchWithTeamsAndLeagueAndSeason | null;
}

export async function getMatchWithFullDetails(matchIdOrSlug: string): Promise<MatchWithFullDetails | null> {
  try {
    // Resolve by slug first (the new canonical lookup); fall back to id for
    // backwards-compat with old links and admin internals that still pass cuids.
    let match = await prisma.match.findUnique({
      where: { slug: matchIdOrSlug },
      include: { team1: true, team2: true, league: true, season: true },
    });
    if (!match) {
      match = await prisma.match.findUnique({
        where: { id: matchIdOrSlug },
        include: { team1: true, team2: true, league: true, season: true },
      });
    }

    if (!match) return null;

    // Use the resolved match's id for sub-queries — the original param may have
    // been a slug, but related lookups (events, players, subs) all key on id.
    const matchId = match.id;
    let matchPlayers: any[] = [];
    let events: any[] = [];

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
