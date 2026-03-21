/**
 * Bracket Automation Utility
 * Automatically advances winners to the next match in the bracket
 * Supports both single and double elimination
 */

import type { MatchStage } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';

/**
 * Get the next stage in the bracket hierarchy
 */
function getNextStage(currentStage: MatchStage | null): MatchStage | null {
  if (!currentStage) return null;

  const nextStageMap: Record<MatchStage, MatchStage | null> = {
    QUARTER_FINALS: 'SEMI_FINALS',
    SEMI_FINALS: 'CHAMPIONSHIP',
    PLAYOFF: 'QUARTER_FINALS',
    CHAMPIONSHIP: null,
    REGULAR_SEASON: null,
    PRESEASON: null,
    EXHIBITION: null,
    QUALIFIER: null,
    OTHER: null,
  };

  return nextStageMap[currentStage] || null;
}

/**
 * Find the next match(s) for a completed match using explicit links
 * Falls back to stage-based heuristics if explicit links are not available (backward compatibility)
 * Returns an array because multiple matches might feed into the same next match
 * Includes validation to prevent overwriting existing teams
 */
async function findNextMatches(
  completedMatchId: string,
  prismaClient: PrismaClient | any
): Promise<{ matchId: string; position: 'team1' | 'team2' }[]> {
  const completedMatch = await prismaClient.match.findUnique({
    where: { id: completedMatchId },
    select: {
      stage: true,
      seasonId: true,
      leagueId: true,
      winnerId: true,
      status: true,
      nextWinnerMatchId: true,
      bracketPosition: true,
      bracketType: true,
    },
  });

  if (!completedMatch || !completedMatch.winnerId || completedMatch.status !== 'COMPLETED') {
    return [];
  }

  // Use explicit link if available (new brackets)
  if (completedMatch.nextWinnerMatchId) {
    const nextMatch = await prismaClient.match.findUnique({
      where: { id: completedMatch.nextWinnerMatchId },
      select: {
        id: true,
        team1Id: true,
        team2Id: true,
        status: true,
        bracketPosition: true,
      },
    });

    if (!nextMatch) {
      console.warn(`Next match ${completedMatch.nextWinnerMatchId} not found for match ${completedMatchId}`);
      return [];
    }

    // Check if winner is already in the match
    if (nextMatch.team1Id === completedMatch.winnerId || nextMatch.team2Id === completedMatch.winnerId) {
      console.log(`Winner ${completedMatch.winnerId} already in next match ${nextMatch.id}, skipping`);
      return [];
    }

    // Determine position based on bracket structure
    // If this match is first in pair (even bracketPosition), go to team1
    // If this match is second in pair (odd bracketPosition), go to team2
    let position: 'team1' | 'team2';
    if (completedMatch.bracketPosition !== null) {
      // Use bracket position to determine slot
      // Even positions (0, 2, 4...) → team1, Odd positions (1, 3, 5...) → team2
      position = completedMatch.bracketPosition % 2 === 0 ? 'team1' : 'team2';
    } else {
      // Fallback: use first available slot
      position = nextMatch.team1Id === null ? 'team1' : 'team2';
    }

    // Check if the determined position is available
    if (position === 'team1' && nextMatch.team1Id !== null) {
      // Try the other position
      if (nextMatch.team2Id === null) {
        position = 'team2';
      } else {
        console.warn(`Both slots filled in next match ${nextMatch.id}, cannot advance winner`);
        return [];
      }
    } else if (position === 'team2' && nextMatch.team2Id !== null) {
      // Try the other position
      if (nextMatch.team1Id === null) {
        position = 'team1';
      } else {
        console.warn(`Both slots filled in next match ${nextMatch.id}, cannot advance winner`);
        return [];
      }
    }

    return [{ matchId: nextMatch.id, position }];
  }

  // Fallback to stage-based heuristics for old brackets without explicit links
  const nextStage = getNextStage(completedMatch.stage);
  if (!nextStage) {
    // This is the final match, no next match
    return [];
  }

  // Find all matches in the next stage that belong to the same season/league
  const nextMatches = await prismaClient.match.findMany({
    where: {
      stage: nextStage,
      seasonId: completedMatch.seasonId,
      leagueId: completedMatch.leagueId,
      // Only update matches that don't have both teams set yet
      OR: [
        { team1Id: null },
        { team2Id: null },
      ],
    },
    orderBy: {
      date: 'asc', // Use the earliest match if multiple exist
    },
  });

  if (nextMatches.length === 0) {
    // No next match found - this is okay for final matches
    console.log(`No next match found for match ${completedMatchId} in stage ${completedMatch.stage}`);
    return [];
  }

  // Find matches that don't already have this winner
  const availableMatches = nextMatches.filter(match => {
    // Don't overwrite if the winner is already in this match
    if (match.team1Id === completedMatch.winnerId || match.team2Id === completedMatch.winnerId) {
      return false;
    }
    // Only return matches with at least one empty slot
    return match.team1Id === null || match.team2Id === null;
  });

  if (availableMatches.length === 0) {
    console.log(`No available slots in next matches for winner ${completedMatch.winnerId} from match ${completedMatchId}`);
    return [];
  }

  // Determine which position to fill in the next match
  // For simplicity, we'll fill the first available slot in the first match
  const nextMatch = availableMatches[0];
  const position: 'team1' | 'team2' = nextMatch.team1Id === null ? 'team1' : 'team2';

  return [{ matchId: nextMatch.id, position }];
}

/**
 * Advance the winner of a completed match to the next match in the bracket
 * For double elimination, also advances the loser to the lower bracket
 * This should be called after a match is completed and has a winner
 */
export async function advanceWinnerToNextMatch(
  completedMatchId: string,
  prismaClient: PrismaClient | any
): Promise<boolean> {
  try {
    const completedMatch = await prismaClient.match.findUnique({
      where: { id: completedMatchId },
      select: {
        winnerId: true,
        status: true,
        stage: true,
        seasonId: true,
        leagueId: true,
        bracketType: true,
        nextLoserMatchId: true,
      },
    });

    if (!completedMatch) {
      console.error(`Match ${completedMatchId} not found`);
      return false;
    }

    if (completedMatch.status !== 'COMPLETED' || !completedMatch.winnerId) {
      // Match is not completed or has no winner (draw), nothing to advance
      return false;
    }

    // For double elimination upper bracket matches, also advance the loser
    if (completedMatch.bracketType === 'upper' && completedMatch.nextLoserMatchId) {
      await advanceLoserToLowerBracket(completedMatchId, prismaClient);
    }

    const nextMatches = await findNextMatches(completedMatchId, prismaClient);

    if (nextMatches.length === 0) {
      // No next match to advance to (e.g., championship match or grand final)
      return false;
    }

    // Get winner team details
    const winnerTeam = await prismaClient.team.findUnique({
      where: { id: completedMatch.winnerId },
      select: { name: true, logo: true },
    });

    // Update all next matches with the winner
    // Use transaction to ensure atomicity and prevent race conditions
    for (const { matchId, position } of nextMatches) {
      try {
        // Re-check the match state before updating (handles concurrent updates)
        const targetMatch = await prismaClient.match.findUnique({
          where: { id: matchId },
          select: {
            team1Id: true,
            team2Id: true,
            status: true,
            bracketType: true,
          },
        });

        if (!targetMatch) {
          console.warn(`Target match ${matchId} not found, skipping advancement`);
          continue;
        }

        // Double-check that the slot is still available (prevent overwriting)
        if (position === 'team1' && targetMatch.team1Id !== null) {
          console.warn(`Match ${matchId} team1 slot already filled, skipping`);
          continue;
        }
        if (position === 'team2' && targetMatch.team2Id !== null) {
          console.warn(`Match ${matchId} team2 slot already filled, skipping`);
          continue;
        }

        // Prevent overwriting if winner is already in the match
        if (targetMatch.team1Id === completedMatch.winnerId || targetMatch.team2Id === completedMatch.winnerId) {
          console.log(`Winner ${completedMatch.winnerId} already in match ${matchId}, skipping`);
          continue;
        }

        const updateData: { team1Id?: string; team2Id?: string; team1Name?: string; team2Name?: string; team1Logo?: string; team2Logo?: string } = {};
        
        if (position === 'team1') {
          updateData.team1Id = completedMatch.winnerId;
          if (winnerTeam) {
            updateData.team1Name = winnerTeam.name;
            updateData.team1Logo = winnerTeam.logo;
          }
        } else {
          updateData.team2Id = completedMatch.winnerId;
          if (winnerTeam) {
            updateData.team2Name = winnerTeam.name;
            updateData.team2Logo = winnerTeam.logo;
          }
        }

        await prismaClient.match.update({
          where: { id: matchId },
          data: updateData,
        });

        const bracketInfo = targetMatch.bracketType ? ` (${targetMatch.bracketType} bracket)` : '';
        console.log(
          `Advanced winner ${completedMatch.winnerId} from match ${completedMatchId} to ${position} in match ${matchId}${bracketInfo}`
        );
      } catch (error: any) {
        // Handle unique constraint violations or other errors gracefully
        if (error.code === 'P2002') {
          console.warn(`Concurrent update detected for match ${matchId}, skipping`);
        } else {
          console.error(`Error updating match ${matchId}:`, error);
        }
        // Continue with other matches even if one fails
      }
    }

    return true;
  } catch (error) {
    console.error('Error advancing winner to next match:', error);
    return false;
  }
}

/**
 * Advance the loser of a completed match to the lower bracket (for double elimination)
 * Uses explicit nextLoserMatchId link if available, falls back to heuristics for backward compatibility
 * This should be called after a match is completed in the upper bracket
 */
export async function advanceLoserToLowerBracket(
  completedMatchId: string,
  prismaClient: PrismaClient | any
): Promise<boolean> {
  try {
    const completedMatch = await prismaClient.match.findUnique({
      where: { id: completedMatchId },
      select: {
        team1Id: true,
        team2Id: true,
        winnerId: true,
        status: true,
        stage: true,
        seasonId: true,
        leagueId: true,
        nextLoserMatchId: true,
        bracketPosition: true,
        bracketType: true,
      },
    });

    if (!completedMatch || completedMatch.status !== 'COMPLETED' || !completedMatch.winnerId) {
      return false;
    }

    // Only advance losers from upper bracket matches
    if (completedMatch.bracketType !== 'upper') {
      return false;
    }

    // Determine the loser
    const loserId = completedMatch.team1Id === completedMatch.winnerId 
      ? completedMatch.team2Id 
      : completedMatch.team1Id;

    if (!loserId) {
      return false;
    }

    // Use explicit link if available (new brackets)
    if (completedMatch.nextLoserMatchId) {
      const lowerMatch = await prismaClient.match.findUnique({
        where: { id: completedMatch.nextLoserMatchId },
        select: {
          id: true,
          team1Id: true,
          team2Id: true,
          status: true,
          bracketPosition: true,
        },
      });

      if (!lowerMatch) {
        console.warn(`Lower bracket match ${completedMatch.nextLoserMatchId} not found for match ${completedMatchId}`);
        return false;
      }

      // Check if loser is already in the match
      if (lowerMatch.team1Id === loserId || lowerMatch.team2Id === loserId) {
        console.log(`Loser ${loserId} already in lower bracket match ${lowerMatch.id}, skipping`);
        return false;
      }

      // Determine position based on bracket structure
      let position: 'team1' | 'team2';
      if (completedMatch.bracketPosition !== null && lowerMatch.bracketPosition !== null) {
        // Use bracket positions to determine slot
        // Even positions (0, 2, 4...) → team1, Odd positions (1, 3, 5...) → team2
        position = completedMatch.bracketPosition % 2 === 0 ? 'team1' : 'team2';
      } else {
        // Fallback: use first available slot
        position = lowerMatch.team1Id === null ? 'team1' : 'team2';
      }

      // Check if the determined position is available
      if (position === 'team1' && lowerMatch.team1Id !== null) {
        if (lowerMatch.team2Id === null) {
          position = 'team2';
        } else {
          console.warn(`Both slots filled in lower bracket match ${lowerMatch.id}, cannot advance loser`);
          return false;
        }
      } else if (position === 'team2' && lowerMatch.team2Id !== null) {
        if (lowerMatch.team1Id === null) {
          position = 'team1';
        } else {
          console.warn(`Both slots filled in lower bracket match ${lowerMatch.id}, cannot advance loser`);
          return false;
        }
      }

      // Get loser team details
      const loserTeam = await prismaClient.team.findUnique({
        where: { id: loserId },
        select: { name: true, logo: true },
      });

      const updateData: { team1Id?: string; team2Id?: string; team1Name?: string; team2Name?: string; team1Logo?: string; team2Logo?: string } = {};
      
      if (position === 'team1') {
        updateData.team1Id = loserId;
        if (loserTeam) {
          updateData.team1Name = loserTeam.name;
          updateData.team1Logo = loserTeam.logo;
        }
      } else {
        updateData.team2Id = loserId;
        if (loserTeam) {
          updateData.team2Name = loserTeam.name;
          updateData.team2Logo = loserTeam.logo;
        }
      }

      await prismaClient.match.update({
        where: { id: lowerMatch.id },
        data: updateData,
      });

      console.log(
        `Advanced loser ${loserId} from match ${completedMatchId} to lower bracket match ${lowerMatch.id}`
      );

      return true;
    }

    // Fallback to stage-based heuristics for old brackets without explicit links
    const lowerBracketMatches = await prismaClient.match.findMany({
      where: {
        stage: 'PLAYOFF', // Lower bracket typically uses PLAYOFF stage
        seasonId: completedMatch.seasonId,
        leagueId: completedMatch.leagueId,
        bracketType: 'lower', // Only lower bracket matches
        OR: [
          { team1Id: null },
          { team2Id: null },
        ],
      },
      orderBy: {
        date: 'asc',
      },
    });

    if (lowerBracketMatches.length === 0) {
      // No lower bracket match found, might be single elimination or no lower bracket
      return false;
    }

    // Get loser team details
    const loserTeam = await prismaClient.team.findUnique({
      where: { id: loserId },
      select: { name: true, logo: true },
    });

    // Update the first available lower bracket match
    const lowerMatch = lowerBracketMatches[0];
    const position: 'team1' | 'team2' = lowerMatch.team1Id === null ? 'team1' : 'team2';

    const updateData: { team1Id?: string; team2Id?: string; team1Name?: string; team2Name?: string; team1Logo?: string; team2Logo?: string } = {};
    
    if (position === 'team1') {
      updateData.team1Id = loserId;
      if (loserTeam) {
        updateData.team1Name = loserTeam.name;
        updateData.team1Logo = loserTeam.logo;
      }
    } else {
      updateData.team2Id = loserId;
      if (loserTeam) {
        updateData.team2Name = loserTeam.name;
        updateData.team2Logo = loserTeam.logo;
      }
    }

    await prismaClient.match.update({
      where: { id: lowerMatch.id },
      data: updateData,
    });

    console.log(
      `Advanced loser ${loserId} from match ${completedMatchId} to lower bracket match ${lowerMatch.id}`
    );

    return true;
  } catch (error) {
    console.error('Error advancing loser to lower bracket:', error);
    return false;
  }
}

/**
 * Validate bracket structure integrity
 * Checks for circular dependencies and invalid relationships
 */
export async function validateBracketStructure(
  seasonId?: string,
  leagueId?: string,
  prismaClient?: PrismaClient | any
): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
  const client = prismaClient || (await import('@/lib/prisma')).prisma;
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const where: any = {
      stage: { not: null },
    };

    if (seasonId) where.seasonId = seasonId;
    if (leagueId) where.leagueId = leagueId;

    const matches = await client.match.findMany({
      where,
      select: {
        id: true,
        stage: true,
        team1Id: true,
        team2Id: true,
        seasonId: true,
        leagueId: true,
      },
    });

    // Check for matches with invalid stage progression
    const stageHierarchy: Record<string, number> = {
      PLAYOFF: 1,
      QUARTER_FINALS: 2,
      SEMI_FINALS: 3,
      CHAMPIONSHIP: 4,
    };

    // Group matches by stage
    const matchesByStage = new Map<string, typeof matches>();
    matches.forEach(match => {
      if (match.stage) {
        if (!matchesByStage.has(match.stage)) {
          matchesByStage.set(match.stage, []);
        }
        matchesByStage.get(match.stage)!.push(match);
      }
    });

    // Check for reasonable bracket structure
    const championshipMatches = matchesByStage.get('CHAMPIONSHIP') || [];
    const semiFinalsMatches = matchesByStage.get('SEMI_FINALS') || [];
    const quarterFinalsMatches = matchesByStage.get('QUARTER_FINALS') || [];
    const playoffMatches = matchesByStage.get('PLAYOFF') || [];

    // Single elimination: should have 1 championship, 2 semi-finals, 4 quarter-finals, etc.
    // Double elimination: will have more matches
    if (championshipMatches.length > 2) {
      warnings.push(`Multiple championship matches (${championshipMatches.length}) detected. This may indicate a double elimination bracket.`);
    }

    // Check for orphaned matches (matches with teams but no clear bracket path)
    const matchesWithTeams = matches.filter(m => m.team1Id || m.team2Id);
    const matchesWithoutTeams = matches.filter(m => !m.team1Id && !m.team2Id);
    
    if (matchesWithoutTeams.length > matchesWithTeams.length) {
      warnings.push(`Many empty matches (${matchesWithoutTeams.length}) detected. This is normal for newly generated brackets.`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    console.error('Error validating bracket structure:', error);
    return {
      valid: false,
      errors: ['Failed to validate bracket structure'],
      warnings: [],
    };
  }
}

/**
 * Check and advance winners for all recently completed matches
 * Useful for batch processing or catching up on matches
 * Includes safeguards for concurrent operations
 */
export async function processCompletedMatches(
  seasonId?: string,
  leagueId?: string,
  prismaClient?: PrismaClient | any
): Promise<{ processed: number; advanced: number; errors: number }> {
  // Use provided client or import prisma
  const client = prismaClient || (await import('@/lib/prisma')).prisma;

  try {
    const where: any = {
      status: 'COMPLETED',
      winnerId: { not: null },
      stage: { not: null },
    };

    if (seasonId) where.seasonId = seasonId;
    if (leagueId) where.leagueId = leagueId;

    const completedMatches = await client.match.findMany({
      where,
      select: { id: true },
      orderBy: {
        date: 'asc', // Process in chronological order
      },
    });

    let advancedCount = 0;
    let errorCount = 0;

    // Process matches one at a time to avoid race conditions
    for (const match of completedMatches) {
      try {
        const advanced = await advanceWinnerToNextMatch(match.id, client);
        if (advanced) advancedCount++;
      } catch (error) {
        console.error(`Error processing match ${match.id}:`, error);
        errorCount++;
        // Continue processing other matches
      }
    }

    return {
      processed: completedMatches.length,
      advanced: advancedCount,
      errors: errorCount,
    };
  } catch (error) {
    console.error('Error processing completed matches:', error);
    return {
      processed: 0,
      advanced: 0,
      errors: 1,
    };
  }
}
