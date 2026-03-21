/**
 * League helper functions
 * Utilities for working with match leagues (either from relations or fallback fields)
 */

import type { Match, League } from '@prisma/client';

type MatchWithLeague = Match & {
  league: League | null;
};

/**
 * Get league name from match (prefers relation, falls back to leagueName field)
 */
export function getLeagueName(match: MatchWithLeague | Match | null | undefined): string | null {
  if (!match) return null;
  if ('league' in match && match.league) {
    return match.league.name;
  }
  return (match as any).leagueName || null;
}

/**
 * Get league slug from match (from relation only)
 */
export function getLeagueSlug(match: MatchWithLeague | Match): string | null {
  if ('league' in match && match.league) {
    return match.league.slug;
  }
  return null;
}

/**
 * Get league ID from match
 */
export function getLeagueId(match: MatchWithLeague | Match): string | null {
  return match.leagueId || null;
}

