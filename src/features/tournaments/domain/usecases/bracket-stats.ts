/**
 * Bracket Statistics Utility (Client-Safe)
 * Pure functions for calculating bracket statistics
 * Can be used in client components without server dependencies
 */

/**
 * Calculate the number of rounds needed for a bracket
 */
function calculateRounds(teamCount: number): number {
  return Math.ceil(Math.log2(teamCount));
}

/**
 * Calculate the number of teams needed (round up to nearest power of 2)
 */
function roundToPowerOfTwo(teamCount: number): number {
  return Math.pow(2, Math.ceil(Math.log2(teamCount)));
}

/**
 * Calculate bracket statistics
 */
export function calculateBracketStats(
  teamCount: number,
  bracketType: 'single' | 'double'
): {
  totalMatches: number;
  rounds: number;
  byes: number;
  upperMatches?: number;
  lowerMatches?: number;
} {
  const totalTeams = roundToPowerOfTwo(teamCount);
  const byes = totalTeams - teamCount;
  const rounds = calculateRounds(totalTeams);

  if (bracketType === 'single') {
    const totalMatches = totalTeams - 1;
    return {
      totalMatches,
      rounds,
      byes,
    };
  } else {
    const upperMatches = totalTeams - 1;
    const lowerMatches = (totalTeams - 2) * 2;
    const grandFinal = 1;
    const totalMatches = upperMatches + lowerMatches + grandFinal;

    return {
      totalMatches,
      rounds,
      byes,
      upperMatches,
      lowerMatches,
    };
  }
}
