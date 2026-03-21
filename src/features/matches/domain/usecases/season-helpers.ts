/**
 * Season helper functions
 * Utilities for working with match seasons (either from relations or fallback fields)
 */

import type { Match, Season } from '@prisma/client';

type MatchWithSeason = Match & {
  season: Season | null;
};

/**
 * Get season name from match (from relation only)
 */
export function getSeasonName(match: MatchWithSeason | Match): string | null {
  if ('season' in match && match.season) {
    return match.season.name;
  }
  return null;
}

/**
 * Get season ID from match
 */
export function getSeasonId(match: MatchWithSeason | Match): string | null {
  return match.seasonId || null;
}

