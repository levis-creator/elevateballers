/**
 * Matches feature types
 * Types for match-related components and data handling
 */

import type { Match, MatchStatus, MatchStage, Team, League, Season } from '@prisma/client';

// Re-export Prisma types
export type { Match, MatchStatus, MatchStage };

// Extended match types for display
export type MatchDisplay = Match & {
  formattedDate?: string;
  formattedTime?: string;
  isUpcoming?: boolean;
  isLive?: boolean;
  isCompleted?: boolean;
};

// Match filter options
export type MatchFilter = {
  status?: MatchStatus | 'all';
  stage?: MatchStage;
  league?: string;
  leagueId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
};

// Match sort options
export type MatchSortOption = 'date-asc' | 'date-desc' | 'league-asc' | 'league-desc';

/**
 * Match DTO (Data Transfer Object)
 * Represents a match with its related entities for API responses
 * This structure matches the data returned from the matches API endpoint
 */
export type MatchDTO = Match & {
  team1: Team | null;
  team2: Team | null;
  league: League | null;
  season: Season | null;
};

