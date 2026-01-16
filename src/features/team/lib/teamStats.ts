/**
 * Team statistics calculation utilities
 * Calculate aggregate team statistics from matches
 */

import type { MatchWithTeamsAndLeagueAndSeason } from '../../cms/types';

export type TeamStatistics = {
  wins: number;
  losses: number;
  draws: number;
  totalMatches: number;
  totalPointsScored: number;
  totalPointsAllowed: number;
  averagePointsScored: number;
  averagePointsAllowed: number;
  winPercentage: number;
};

/**
 * Calculate team statistics from completed matches
 */
export function calculateTeamStatistics(
  matches: MatchWithTeamsAndLeagueAndSeason[],
  teamId: string
): TeamStatistics {
  const stats: TeamStatistics = {
    wins: 0,
    losses: 0,
    draws: 0,
    totalMatches: 0,
    totalPointsScored: 0,
    totalPointsAllowed: 0,
    averagePointsScored: 0,
    averagePointsAllowed: 0,
    winPercentage: 0,
  };

  matches.forEach((match) => {
    // Only count completed matches with scores
    if (match.status !== 'COMPLETED') {
      return;
    }

    const isTeam1 = match.team1Id === teamId;
    const teamScore = isTeam1 ? match.team1Score : match.team2Score;
    const opponentScore = isTeam1 ? match.team2Score : match.team1Score;

    // Skip matches without scores
    if (teamScore === null || opponentScore === null) {
      return;
    }

    stats.totalMatches++;
    stats.totalPointsScored += teamScore;
    stats.totalPointsAllowed += opponentScore;

    if (teamScore > opponentScore) {
      stats.wins++;
    } else if (teamScore < opponentScore) {
      stats.losses++;
    } else {
      stats.draws++;
    }
  });

  // Calculate averages
  if (stats.totalMatches > 0) {
    stats.averagePointsScored = stats.totalPointsScored / stats.totalMatches;
    stats.averagePointsAllowed = stats.totalPointsAllowed / stats.totalMatches;
    stats.winPercentage = (stats.wins / stats.totalMatches) * 100;
  }

  return stats;
}
