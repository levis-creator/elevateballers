/**
 * Bracket converter utility
 * Converts match data to the format expected by @g-loot/react-tournament-brackets
 */

import type { MatchWithTeamsAndLeagueAndSeason } from '../../cms/types';
import type { MatchStage } from '@prisma/client';
import { getTeam1Name, getTeam1Logo, getTeam2Name, getTeam2Logo, getTeam1Id, getTeam2Id } from '../../matches/lib/team-helpers';

export interface BracketMatch {
  id: string;
  nextMatchId: string | null;
  tournamentRoundText: string;
  startTime: string;
  state: 'DONE' | 'NO_SHOW' | 'WALK_OVER' | 'NO_PARTY' | 'DONE' | 'SCORE_DONE';
  participants: Array<{
    id: string;
    resultText: string | null;
    isWinner: boolean;
    status: string | null;
    name: string;
    logo?: string | null;
  }>;
  // Custom fields for our use
  originalMatchId?: string;
  stage?: MatchStage;
  isEmpty?: boolean;
}

/**
 * Map MatchStage to round text for bracket display
 */
function getRoundText(stage: MatchStage | null | undefined): string {
  if (!stage) return 'Round 1';
  
  const stageMap: Record<MatchStage, string> = {
    CHAMPIONSHIP: 'Final',
    SEMI_FINALS: 'Semi-Final',
    QUARTER_FINALS: 'Quarter-Final',
    PLAYOFF: 'Playoff',
    REGULAR_SEASON: 'Regular Season',
    PRESEASON: 'Preseason',
    EXHIBITION: 'Exhibition',
    QUALIFIER: 'Qualifier',
    OTHER: 'Other',
  };
  
  return stageMap[stage] || 'Round 1';
}

/**
 * Get stage hierarchy for determining nextMatchId relationships
 * Lower number = earlier round, higher number = later round
 */
function getStageHierarchy(stage: MatchStage | null | undefined): number {
  if (!stage) return 0;
  
  const hierarchy: Record<MatchStage, number> = {
    REGULAR_SEASON: 1,
    PRESEASON: 1,
    EXHIBITION: 1,
    QUALIFIER: 2,
    PLAYOFF: 3,
    QUARTER_FINALS: 4,
    SEMI_FINALS: 5,
    CHAMPIONSHIP: 6,
    OTHER: 0,
  };
  
  return hierarchy[stage] || 0;
}

/**
 * Convert match status to bracket state
 */
function getBracketState(status: string): BracketMatch['state'] {
  switch (status) {
    case 'COMPLETED':
      return 'DONE';
    case 'LIVE':
      return 'SCORE_DONE';
    case 'UPCOMING':
      return 'NO_SHOW';
    default:
      return 'NO_SHOW';
  }
}

/**
 * Convert a single match to bracket format
 */
function convertMatchToBracket(
  match: MatchWithTeamsAndLeagueAndSeason,
  allMatches: MatchWithTeamsAndLeagueAndSeason[]
): BracketMatch {
  const team1Name = getTeam1Name(match);
  const team2Name = getTeam2Name(match);
  const team1Logo = getTeam1Logo(match);
  const team2Logo = getTeam2Logo(match);
  const team1Id = getTeam1Id(match) || `team1-${match.id}`;
  const team2Id = getTeam2Id(match) || `team2-${match.id}`;
  
  const stage = match.stage;
  const currentHierarchy = getStageHierarchy(stage);
  
  // Find the next match (match with higher hierarchy in same bracket path)
  // For now, we'll find matches with the next stage up
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
  
  const nextStage = stage ? nextStageMap[stage] : null;
  let nextMatchId: string | null = null;
  
  if (nextStage) {
    // Find a match in the next stage (simplified - in real scenario might need more logic)
    const nextMatch = allMatches.find(m => m.stage === nextStage);
    if (nextMatch) {
      nextMatchId = nextMatch.id;
    }
  }
  
  // Determine winner
  const team1Score = match.team1Score ?? null;
  const team2Score = match.team2Score ?? null;
  const isCompleted = match.status === 'COMPLETED';
  const team1Wins = isCompleted && team1Score !== null && team2Score !== null && team1Score > team2Score;
  const team2Wins = isCompleted && team1Score !== null && team2Score !== null && team2Score > team1Score;
  
  return {
    id: match.id,
    nextMatchId,
    tournamentRoundText: getRoundText(stage),
    startTime: new Date(match.date).toISOString(),
    state: getBracketState(match.status),
    participants: [
      {
        id: team1Id,
        resultText: team1Score !== null ? team1Score.toString() : null,
        isWinner: team1Wins,
        status: null,
        name: team1Name,
        logo: team1Logo || undefined,
      },
      {
        id: team2Id,
        resultText: team2Score !== null ? team2Score.toString() : null,
        isWinner: team2Wins,
        status: null,
        name: team2Name,
        logo: team2Logo || undefined,
      },
    ],
    originalMatchId: match.id,
    stage: stage || undefined,
    isEmpty: false,
  };
}

/**
 * Create an empty match slot for bracket positions that don't have matches
 */
function createEmptyMatch(
  roundText: string,
  position: number,
  nextMatchId: string | null = null
): BracketMatch {
  return {
    id: `empty-${roundText}-${position}`,
    nextMatchId,
    tournamentRoundText: roundText,
    startTime: new Date().toISOString(),
    state: 'NO_SHOW',
    participants: [
      {
        id: `empty-team1-${position}`,
        resultText: null,
        isWinner: false,
        status: null,
        name: 'TBD',
      },
      {
        id: `empty-team2-${position}`,
        resultText: null,
        isWinner: false,
        status: null,
        name: 'TBD',
      },
    ],
    isEmpty: true,
  };
}

/**
 * Convert matches to bracket format, organized by stage
 */
export function convertMatchesToBracket(
  matches: MatchWithTeamsAndLeagueAndSeason[]
): BracketMatch[] {
  if (matches.length === 0) {
    return [];
  }
  
  // Group matches by stage
  const matchesByStage = new Map<MatchStage | 'OTHER' | 'NO_STAGE', MatchWithTeamsAndLeagueAndSeason[]>();
  
  matches.forEach(match => {
    const stage = match.stage || 'NO_STAGE';
    if (!matchesByStage.has(stage)) {
      matchesByStage.set(stage, []);
    }
    matchesByStage.get(stage)!.push(match);
  });
  
  // Convert all matches to bracket format
  const bracketMatches: BracketMatch[] = [];
  
  // Process stages in hierarchy order
  const stageOrder: MatchStage[] = [
    'QUARTER_FINALS',
    'SEMI_FINALS',
    'CHAMPIONSHIP',
    'PLAYOFF',
    'REGULAR_SEASON',
    'PRESEASON',
    'EXHIBITION',
    'QUALIFIER',
  ];
  
  // Build nextMatchId relationships
  const matchMap = new Map<string, MatchWithTeamsAndLeagueAndSeason>();
  matches.forEach(m => matchMap.set(m.id, m));
  
  // Convert matches, starting from highest hierarchy (CHAMPIONSHIP) down
  const processedMatches = new Set<string>();
  
  for (const stage of stageOrder) {
    const stageMatches = matchesByStage.get(stage);
    if (!stageMatches || stageMatches.length === 0) continue;
    
    // Sort matches by date
    const sortedMatches = [...stageMatches].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    for (const match of sortedMatches) {
      if (processedMatches.has(match.id)) continue;
      
      const bracketMatch = convertMatchToBracket(match, matches);
      
      // Find next match in hierarchy
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
      
      if (match.stage && match.stage in nextStageMap) {
        const nextStage = nextStageMap[match.stage as keyof typeof nextStageMap];
        if (nextStage) {
          const nextMatches = matchesByStage.get(nextStage) || [];
          if (nextMatches.length > 0) {
            // Use first match of next stage (simplified logic)
            bracketMatch.nextMatchId = nextMatches[0].id;
          }
        }
      }
      
      bracketMatches.push(bracketMatch);
      processedMatches.add(match.id);
    }
  }
  
  // Handle OTHER and NO_STAGE matches
  const otherMatches = matchesByStage.get('OTHER') || [];
  const noStageMatches = matchesByStage.get('NO_STAGE') || [];
  const allOtherMatches = [...otherMatches, ...noStageMatches];
  
  if (allOtherMatches.length > 0) {
    for (const match of allOtherMatches) {
      if (processedMatches.has(match.id)) continue;
      bracketMatches.push(convertMatchToBracket(match, matches));
      processedMatches.add(match.id);
    }
  }
  
  // Sort by hierarchy (CHAMPIONSHIP first, then down)
  bracketMatches.sort((a, b) => {
    const aHierarchy = getStageHierarchy(a.stage);
    const bHierarchy = getStageHierarchy(b.stage);
    if (aHierarchy !== bHierarchy) {
      return bHierarchy - aHierarchy; // Higher hierarchy first
    }
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });
  
  // If we have matches but no bracket structure (all NO_STAGE), just return them all
  // This ensures matches are always displayed even if they don't fit a tournament structure
  if (bracketMatches.length === 0 && matches.length > 0) {
    // Fallback: convert all matches without strict bracket structure
    return matches.map(match => convertMatchToBracket(match, matches));
  }
  
  return bracketMatches;
}

/**
 * Get the stage for a bracket position (for creating new matches)
 */
export function getStageForRound(roundText: string): MatchStage | null {
  const roundMap: Record<string, MatchStage> = {
    'Final': 'CHAMPIONSHIP',
    'Semi-Final': 'SEMI_FINALS',
    'Quarter-Final': 'QUARTER_FINALS',
    'Playoff': 'PLAYOFF',
    'Regular Season': 'REGULAR_SEASON',
    'Preseason': 'PRESEASON',
    'Exhibition': 'EXHIBITION',
    'Qualifier': 'QUALIFIER',
  };
  
  return roundMap[roundText] || null;
}
