/**
 * Team helper functions
 * Utilities for working with match teams (either from relations or fallback fields)
 */

import type { Match, Team } from '@prisma/client';

type MatchWithTeams = Match & {
  team1: Team | null;
  team2: Team | null;
  winner: Team | null;
};

/**
 * Get team 1 name from match (prefers relation, falls back to team1Name)
 */
export function getTeam1Name(match: MatchWithTeams | Match | null | undefined): string {
  if (!match) return 'Team 1';
  if ('team1' in match && match.team1) {
    return match.team1.name;
  }
  return match.team1Name || 'Team 1';
}

/**
 * Get team 1 logo from match (prefers relation, falls back to team1Logo)
 */
export function getTeam1Logo(match: MatchWithTeams | Match | null | undefined): string | null {
  if (!match) return null;
  if ('team1' in match && match.team1?.logo) {
    return match.team1.logo;
  }
  return match.team1Logo || null;
}

/**
 * Get team 2 name from match (prefers relation, falls back to team2Name)
 */
export function getTeam2Name(match: MatchWithTeams | Match | null | undefined): string {
  if (!match) return 'Team 2';
  if ('team2' in match && match.team2) {
    return match.team2.name;
  }
  return match.team2Name || 'Team 2';
}

/**
 * Get team 2 logo from match (prefers relation, falls back to team2Logo)
 */
export function getTeam2Logo(match: MatchWithTeams | Match | null | undefined): string | null {
  if (!match) return null;
  if ('team2' in match && match.team2?.logo) {
    return match.team2.logo;
  }
  return match.team2Logo || null;
}

/**
 * Get team 1 ID from match
 */
export function getTeam1Id(match: MatchWithTeams | Match | null | undefined): string | null {
  if (!match) return null;
  if ('team1' in match && match.team1) {
    return match.team1.id;
  }
  return match.team1Id || null;
}

/**
 * Get team 2 ID from match
 */
export function getTeam2Id(match: MatchWithTeams | Match | null | undefined): string | null {
  if (!match) return null;
  if ('team2' in match && match.team2) {
    return match.team2.id;
  }
  return match.team2Id || null;
}

/**
 * Get winner name from match
 */
export function getWinnerName(match: MatchWithTeams | Match | null | undefined): string | null {
  if (!match) return null;
  if ('winner' in match && match.winner) {
    return match.winner.name;
  }
  // Fallback: determine winner from scores if winner relation not loaded
  if (match.status === 'COMPLETED' && match.team1Score !== null && match.team2Score !== null) {
    if (match.team1Score > match.team2Score) {
      return getTeam1Name(match);
    } else if (match.team2Score > match.team1Score) {
      return getTeam2Name(match);
    }
  }
  return null;
}

/**
 * Get winner ID from match
 */
export function getWinnerId(match: MatchWithTeams | Match | null | undefined): string | null {
  if (!match) return null;
  if ('winner' in match && match.winner) {
    return match.winner.id;
  }
  return match.winnerId || null;
}

/**
 * Check if a team is the winner
 */
export function isWinner(match: MatchWithTeams | Match | null | undefined, teamId: string | null): boolean {
  if (!match || !teamId) return false;
  const winnerId = getWinnerId(match);
  return winnerId === teamId;
}
