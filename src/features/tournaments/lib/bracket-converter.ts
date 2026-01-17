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
  nextLooserMatchId?: string | null; // For double elimination: loser goes to lower bracket
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
  bracketType?: 'upper' | 'lower' | 'grand-final'; // For double elimination bracket type
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
 * Get enhanced round text that includes bracket type and round number for double elimination
 */
function getEnhancedRoundText(
  stage: MatchStage | null | undefined,
  bracketType?: 'upper' | 'lower' | 'grand-final' | string | null,
  bracketRound?: number | null
): string {
  const stageText = getRoundText(stage);
  
  // For grand final, return special label
  if (bracketType === 'grand-final') {
    return 'Grand Final';
  }
  
  // For double elimination, include bracket type and round number for clarity
  if (bracketType && (bracketType === 'upper' || bracketType === 'lower') && bracketRound !== undefined && bracketRound !== null) {
    const bracketLabel = bracketType === 'lower' ? 'Lower' : 'Upper';
    
    // Format: "Upper Round 1 - Semi-Final" or "Lower Round 2 - Quarter-Final"
    return `${bracketLabel} Round ${bracketRound} - ${stageText}`;
  }
  
  // For single elimination or when bracket info is not available, just return stage text
  return stageText;
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
 * Ensure participants array always has exactly 2 participants
 * This is required by the bracket library
 */
function ensureTwoParticipants(participants: any[]): any[] {
  if (participants.length === 2) {
    return participants;
  }
  
  // If empty, create two TBD participants
  if (participants.length === 0) {
    return [
      {
        id: 'tbd-1',
        resultText: null,
        isWinner: false,
        status: null,
        name: 'TBD',
      },
      {
        id: 'tbd-2',
        resultText: null,
        isWinner: false,
        status: null,
        name: 'TBD',
      },
    ];
  }
  
  // If only one, add a second TBD
  if (participants.length === 1) {
    return [
      ...participants,
      {
        id: 'tbd-2',
        resultText: null,
        isWinner: false,
        status: null,
        name: 'TBD',
      },
    ];
  }
  
  // If more than 2, take first 2
  return participants.slice(0, 2);
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
  
  // Use stored nextWinnerMatchId from database if available (new brackets with explicit links)
  // Fall back to computed links for backward compatibility with old brackets
  let nextMatchId: string | null = null;
  let nextLooserMatchId: string | null = null;
  
  if (match.nextWinnerMatchId) {
    // Use explicit link from database
    nextMatchId = match.nextWinnerMatchId;
  } else {
    // Fallback: compute link using stage-based heuristics (for old brackets)
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
    
    if (nextStage) {
      // Find a match in the next stage (simplified - in real scenario might need more logic)
      const nextMatch = allMatches.find(m => m.stage === nextStage);
      if (nextMatch) {
        nextMatchId = nextMatch.id;
      }
    }
  }
  
  // Use stored nextLoserMatchId for double elimination
  if (match.nextLoserMatchId) {
    nextLooserMatchId = match.nextLoserMatchId;
  }
  
  // Determine winner
  const team1Score = match.team1Score ?? null;
  const team2Score = match.team2Score ?? null;
  const isCompleted = match.status === 'COMPLETED';
  const team1Wins = isCompleted && team1Score !== null && team2Score !== null && team1Score > team2Score;
  const team2Wins = isCompleted && team1Score !== null && team2Score !== null && team2Score > team1Score;
  
  // Ensure we always have exactly 2 participants
  const participants = ensureTwoParticipants([
    {
      id: team1Id,
      resultText: team1Score !== null ? team1Score.toString() : null,
      isWinner: team1Wins,
      status: null,
      name: team1Name || 'TBD',
      logo: team1Logo || undefined,
    },
    {
      id: team2Id,
      resultText: team2Score !== null ? team2Score.toString() : null,
      isWinner: team2Wins,
      status: null,
      name: team2Name || 'TBD',
      logo: team2Logo || undefined,
    },
  ]);

  return {
    id: match.id,
    nextMatchId,
    nextLooserMatchId: nextLooserMatchId || null,
    tournamentRoundText: getEnhancedRoundText(stage, match.bracketType, match.bracketRound),
    startTime: new Date(match.date).toISOString(),
    state: getBracketState(match.status),
    participants,
    originalMatchId: match.id,
    stage: stage || undefined,
    isEmpty: false,
    bracketType: match.bracketType as 'upper' | 'lower' | 'grand-final' | undefined,
  };
}

/**
 * Create an empty match slot for bracket positions that don't have matches
 */
function createEmptyMatch(
  roundText: string,
  position: number,
  nextMatchId: string | null = null,
  stage?: MatchStage
): BracketMatch {
  return {
    id: `ghost-${roundText.toLowerCase().replace(/\s+/g, '-')}-${position}`,
    nextMatchId,
    tournamentRoundText: roundText,
    startTime: new Date().toISOString(),
    state: 'NO_SHOW',
    participants: [
      {
        id: `ghost-team1-${position}`,
        resultText: null,
        isWinner: false,
        status: null,
        name: 'TBD',
      },
      {
        id: `ghost-team2-${position}`,
        resultText: null,
        isWinner: false,
        status: null,
        name: 'TBD',
      },
    ],
    isEmpty: true,
    stage,
  };
}

/**
 * Generate ghost/placeholder matches to complete bracket structure
 * This ensures all rounds exist and are properly linked
 * Returns ghost matches and a map for easy linking
 */
function generateGhostMatchesForIncompleteBracket(
  matchesByStage: Map<MatchStage | 'OTHER' | 'NO_STAGE', MatchWithTeamsAndLeagueAndSeason[]>
): { ghostMatches: BracketMatch[]; ghostMap: Map<string, BracketMatch> } {
  const ghostMatches: BracketMatch[] = [];
  const ghostMap = new Map<string, BracketMatch>();
  
  // Check what stages we have
  const hasQuarterFinals = (matchesByStage.get('QUARTER_FINALS') || []).length > 0;
  const hasSemiFinals = (matchesByStage.get('SEMI_FINALS') || []).length > 0;
  const hasChampionship = (matchesByStage.get('CHAMPIONSHIP') || []).length > 0;
  const hasPlayoff = (matchesByStage.get('PLAYOFF') || []).length > 0;
  
  // Determine how many matches we have in the earliest round
  let earliestRoundCount = 0;
  let earliestStage: MatchStage | null = null;
  
  if (hasPlayoff) {
    earliestRoundCount = (matchesByStage.get('PLAYOFF') || []).length;
    earliestStage = 'PLAYOFF';
  } else if (hasQuarterFinals) {
    earliestRoundCount = (matchesByStage.get('QUARTER_FINALS') || []).length;
    earliestStage = 'QUARTER_FINALS';
  } else if (hasSemiFinals) {
    earliestRoundCount = (matchesByStage.get('SEMI_FINALS') || []).length;
    earliestStage = 'SEMI_FINALS';
  }
  
  // Generate missing rounds based on earliest round
  if (earliestStage === 'QUARTER_FINALS' && earliestRoundCount > 0) {
    // We have Quarter-Finals, need Semi-Finals and Championship
    const quarterFinalsCount = earliestRoundCount;
    const semiFinalsNeeded = Math.ceil(quarterFinalsCount / 2);
    
    // Create Championship first (so Semi-Finals can link to it)
    if (!hasChampionship) {
      const championship = createEmptyMatch('Final', 0, null, 'CHAMPIONSHIP');
      ghostMatches.push(championship);
      ghostMap.set('CHAMPIONSHIP-0', championship);
      console.log(`✨ Generated 1 ghost Championship match`);
    }
    
    // Create Semi-Finals if missing
    if (!hasSemiFinals && semiFinalsNeeded > 0) {
      const championshipGhost = ghostMap.get('CHAMPIONSHIP-0');
      for (let i = 0; i < semiFinalsNeeded; i++) {
        const semiFinal = createEmptyMatch('Semi-Final', i, championshipGhost?.id || null, 'SEMI_FINALS');
        ghostMatches.push(semiFinal);
        ghostMap.set(`SEMI_FINALS-${i}`, semiFinal);
      }
      console.log(`✨ Generated ${semiFinalsNeeded} ghost Semi-Final match(es)`);
    }
  } else if (earliestStage === 'PLAYOFF' && earliestRoundCount > 0) {
    // We have Playoff matches, need Quarter-Finals, Semi-Finals, and Championship
    const playoffCount = earliestRoundCount;
    const quarterFinalsNeeded = Math.ceil(playoffCount / 2);
    const semiFinalsNeeded = Math.ceil(quarterFinalsNeeded / 2);
    
    // Create Championship first
    if (!hasChampionship) {
      const championship = createEmptyMatch('Final', 0, null, 'CHAMPIONSHIP');
      ghostMatches.push(championship);
      ghostMap.set('CHAMPIONSHIP-0', championship);
      console.log(`✨ Generated 1 ghost Championship match`);
    }
    
    // Create Semi-Finals if missing
    if (!hasSemiFinals && semiFinalsNeeded > 0) {
      const championshipGhost = ghostMap.get('CHAMPIONSHIP-0');
      for (let i = 0; i < semiFinalsNeeded; i++) {
        const semiFinal = createEmptyMatch('Semi-Final', i, championshipGhost?.id || null, 'SEMI_FINALS');
        ghostMatches.push(semiFinal);
        ghostMap.set(`SEMI_FINALS-${i}`, semiFinal);
      }
      console.log(`✨ Generated ${semiFinalsNeeded} ghost Semi-Final match(es)`);
    }
    
    // Create Quarter-Finals if missing
    if (!hasQuarterFinals && quarterFinalsNeeded > 0) {
      for (let i = 0; i < quarterFinalsNeeded; i++) {
        const semiFinalIndex = Math.floor(i / 2);
        const semiFinalGhost = ghostMap.get(`SEMI_FINALS-${semiFinalIndex}`);
        const quarterFinal = createEmptyMatch('Quarter-Final', i, semiFinalGhost?.id || null, 'QUARTER_FINALS');
        ghostMatches.push(quarterFinal);
        ghostMap.set(`QUARTER_FINALS-${i}`, quarterFinal);
      }
      console.log(`✨ Generated ${quarterFinalsNeeded} ghost Quarter-Final match(es)`);
    }
  } else if (earliestStage === 'SEMI_FINALS' && earliestRoundCount > 0) {
    // We have Semi-Finals, need Championship
    if (!hasChampionship) {
      const championship = createEmptyMatch('Final', 0, null, 'CHAMPIONSHIP');
      ghostMatches.push(championship);
      ghostMap.set('CHAMPIONSHIP-0', championship);
      console.log(`✨ Generated 1 ghost Championship match`);
    }
  }
  
  return { ghostMatches, ghostMap };
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
  let bracketMatches: BracketMatch[] = [];
  
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
  
  // Convert matches, starting from lowest hierarchy (earliest rounds) up to CHAMPIONSHIP
  // This ensures we can properly link matches to their next rounds
  const processedMatches = new Set<string>();
  const bracketMatchMap = new Map<string, BracketMatch>();
  
  // Process stages from earliest to latest (reverse of hierarchy)
  const reverseStageOrder = [...stageOrder].reverse();
  
  // First pass: convert all matches and store them in a map
  for (const stage of reverseStageOrder) {
    const stageMatches = matchesByStage.get(stage);
    if (!stageMatches || stageMatches.length === 0) continue;
    
    // Sort matches by date
    const sortedMatches = [...stageMatches].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    for (const match of sortedMatches) {
      if (processedMatches.has(match.id)) continue;
      
      const bracketMatch = convertMatchToBracket(match, matches);
      // For single elimination, clear bracketType to avoid "Lower"/"Upper" prefixes
      bracketMatch.bracketType = undefined;
      bracketMatch.tournamentRoundText = getEnhancedRoundText(match.stage, undefined, match.bracketRound);
      bracketMatchMap.set(match.id, bracketMatch);
      processedMatches.add(match.id);
    }
  }
  
  // Handle OTHER and NO_STAGE matches - convert them too
  const otherMatches = matchesByStage.get('OTHER') || [];
  const noStageMatches = matchesByStage.get('NO_STAGE') || [];
  const allOtherMatches = [...otherMatches, ...noStageMatches];
  
  for (const match of allOtherMatches) {
    if (processedMatches.has(match.id)) continue;
    const bracketMatch = convertMatchToBracket(match, matches);
    // For single elimination, clear bracketType to avoid "Lower"/"Upper" prefixes
    bracketMatch.bracketType = undefined;
    bracketMatch.tournamentRoundText = getEnhancedRoundText(match.stage, undefined, match.bracketRound);
    bracketMatchMap.set(match.id, bracketMatch);
    processedMatches.add(match.id);
  }
  
  // IMPORTANT: Include ALL matches, even if they don't fit the stage hierarchy
  // This ensures matches are displayed even if the bracket structure is incomplete
  for (const match of matches) {
    if (processedMatches.has(match.id)) continue;
    console.warn('Match not processed in stage order, adding directly:', {
      id: match.id,
      stage: match.stage,
      teams: `${getTeam1Name(match)} vs ${getTeam2Name(match)}`,
    });
    const bracketMatch = convertMatchToBracket(match, matches);
    // For single elimination, clear bracketType to avoid "Lower"/"Upper" prefixes
    bracketMatch.bracketType = undefined;
    bracketMatch.tournamentRoundText = getEnhancedRoundText(match.stage, undefined, match.bracketRound);
    bracketMatchMap.set(match.id, bracketMatch);
    processedMatches.add(match.id);
  }

  // Generate ghost matches FIRST, before linking, so they're available for linking
  const { ghostMatches, ghostMap } = generateGhostMatchesForIncompleteBracket(matchesByStage);
  if (ghostMatches.length > 0) {
    console.log(`✨ Generated ${ghostMatches.length} ghost matches to complete bracket structure:`, 
      ghostMatches.map(g => ({ id: g.id, stage: g.stage, round: g.tournamentRoundText, nextMatchId: g.nextMatchId?.substring(0, 12) || null }))
    );
    // Add ghost matches to the map immediately so they can be linked to
    for (const ghostMatch of ghostMatches) {
      bracketMatchMap.set(ghostMatch.id, ghostMatch);
    }
  }
  
  // Second pass: link matches to their next rounds (real matches OR ghost matches)
  // For bracket structure: QUARTER_FINALS -> SEMI_FINALS -> CHAMPIONSHIP
  // Pair matches: 2 QUARTER_FINALS -> 1 SEMI_FINALS, 2 SEMI_FINALS -> 1 CHAMPIONSHIP
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
  
  for (const stage of reverseStageOrder) {
    const stageMatches = matchesByStage.get(stage);
    if (!stageMatches || stageMatches.length === 0) continue;
    
    const sortedMatches = [...stageMatches].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    for (let i = 0; i < sortedMatches.length; i++) {
      const match = sortedMatches[i];
      const bracketMatch = bracketMatchMap.get(match.id);
      if (!bracketMatch) continue;
      
      // Skip if already linked (from stored nextWinnerMatchId in database)
      // Only compute links for old brackets that don't have explicit links
      if (bracketMatch.nextMatchId) continue;
      
      // Fallback: compute link using stage-based heuristics (for old brackets without explicit links)
      if (match.stage && match.stage in nextStageMap) {
        const nextStage = nextStageMap[match.stage as keyof typeof nextStageMap];
        if (nextStage) {
          // First try to find real matches in the next stage
          const nextMatches = matchesByStage.get(nextStage) || [];
          if (nextMatches.length > 0) {
            // Link to the appropriate match in the next stage
            const nextMatchIndex = Math.floor(i / 2); // Pair up matches (2 per next match)
            if (nextMatchIndex < nextMatches.length) {
              bracketMatch.nextMatchId = nextMatches[nextMatchIndex].id;
              console.log(`✓ Linked ${match.stage} match ${i} to ${nextStage} match ${nextMatchIndex}`);
            } else if (nextMatches.length > 0) {
              // Fallback: link to last match of next stage if index is out of bounds
              bracketMatch.nextMatchId = nextMatches[nextMatches.length - 1].id;
              console.log(`✓ Linked ${match.stage} match ${i} to last ${nextStage} match`);
            }
          } else {
            // No real matches in next stage, try ghost matches
            if (match.stage === 'QUARTER_FINALS') {
              const semiFinalIndex = Math.floor(i / 2);
              const semiFinalGhost = ghostMap.get(`SEMI_FINALS-${semiFinalIndex}`);
              if (semiFinalGhost) {
                bracketMatch.nextMatchId = semiFinalGhost.id;
                console.log(`🔗 Linked Quarter-Final ${i} to ghost Semi-Final ${semiFinalIndex}`);
              }
            } else if (match.stage === 'SEMI_FINALS') {
              const championshipGhost = ghostMap.get('CHAMPIONSHIP-0');
              if (championshipGhost) {
                bracketMatch.nextMatchId = championshipGhost.id;
                console.log(`🔗 Linked Semi-Final ${i} to ghost Championship`);
              }
            } else if (match.stage === 'PLAYOFF') {
              const quarterFinalIndex = Math.floor(i / 2);
              const quarterFinalGhost = ghostMap.get(`QUARTER_FINALS-${quarterFinalIndex}`);
              if (quarterFinalGhost) {
                bracketMatch.nextMatchId = quarterFinalGhost.id;
                console.log(`🔗 Linked Playoff ${i} to ghost Quarter-Final ${quarterFinalIndex}`);
              }
            }
          }
        }
      }
    }
  }
  
  // Add all bracket matches (real + ghost) to the result array
  bracketMatches = [];
  for (const bracketMatch of bracketMatchMap.values()) {
    bracketMatches.push(bracketMatch);
  }
  
  // Ensure ghost matches are included (double-check)
  if (ghostMatches.length > 0) {
    const existingGhostIds = new Set(bracketMatches.map(m => m.id));
    for (const ghostMatch of ghostMatches) {
      if (!existingGhostIds.has(ghostMatch.id)) {
        console.warn(`⚠️ Ghost match ${ghostMatch.id} was not in bracketMatchMap, adding directly`);
        bracketMatches.push(ghostMatch);
      }
    }
  }
  
  // Sort by hierarchy (earliest rounds first, then CHAMPIONSHIP last)
  // This helps the bracket library understand the structure
  bracketMatches.sort((a, b) => {
    const aHierarchy = getStageHierarchy(a.stage);
    const bHierarchy = getStageHierarchy(b.stage);
    if (aHierarchy !== bHierarchy) {
      return aHierarchy - bHierarchy; // Lower hierarchy (earlier rounds) first
    }
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });
  
  // Debug: Log final bracket structure
  console.log('📊 Final bracket structure:', {
    totalMatches: bracketMatches.length,
    realMatches: bracketMatches.filter(m => !m.isEmpty).length,
    ghostMatches: bracketMatches.filter(m => m.isEmpty).length,
    byStage: {
      QUARTER_FINALS: bracketMatches.filter(m => m.stage === 'QUARTER_FINALS').length,
      SEMI_FINALS: bracketMatches.filter(m => m.stage === 'SEMI_FINALS').length,
      CHAMPIONSHIP: bracketMatches.filter(m => m.stage === 'CHAMPIONSHIP').length,
      PLAYOFF: bracketMatches.filter(m => m.stage === 'PLAYOFF').length,
    },
    linkedMatches: bracketMatches.filter(m => m.nextMatchId !== null).length,
    unlinkedMatches: bracketMatches.filter(m => m.nextMatchId === null).length,
    sampleLinks: bracketMatches.slice(0, 5).map(m => ({
      id: m.id.substring(0, 8),
      round: m.tournamentRoundText,
      stage: m.stage,
      nextMatchId: m.nextMatchId?.substring(0, 8) || null,
      isGhost: m.isEmpty,
    })),
  });
  
  // If we have matches but they're not properly linked (incomplete bracket),
  // we need to ensure they can still be displayed
  // The bracket library might require a complete tree, but we'll try to display what we have
  const hasLinkedMatches = bracketMatches.some(m => m.nextMatchId !== null);
  const unlinkedMatches = bracketMatches.filter(m => m.nextMatchId === null);
  
  if (!hasLinkedMatches && bracketMatches.length > 0) {
    console.warn('⚠️ Bracket is incomplete - matches are not linked. The bracket library may only display some matches.');
    console.log('📊 Matches without nextMatchId:', unlinkedMatches.map(m => ({
      id: m.id.substring(0, 8),
      round: m.tournamentRoundText,
      stage: m.stage,
      participants: m.participants.map(p => p.name),
    })));
    console.log('💡 Tip: Use the "Generate Bracket" button to create a complete bracket structure with all rounds.');
  } else if (unlinkedMatches.length > 0) {
    console.log(`ℹ️ ${unlinkedMatches.length} match(es) without nextMatchId (likely final matches or incomplete bracket)`);
  }
  
  // If we have matches but no bracket structure (all NO_STAGE or OTHER), just return them all
  // This ensures matches are always displayed even if they don't fit a tournament structure
  if (bracketMatches.length === 0 && matches.length > 0) {
    console.log('No bracket structure found, converting all matches as flat list');
    // Fallback: convert all matches without strict bracket structure
    const fallbackMatches = matches.map(match => convertMatchToBracket(match, matches));
    console.log('Fallback conversion result:', {
      count: fallbackMatches.length,
      firstMatch: fallbackMatches[0],
    });
    return fallbackMatches;
  }

  console.log('Bracket conversion complete:', {
    totalMatches: matches.length,
    bracketMatches: bracketMatches.length,
    stages: [...new Set(bracketMatches.map(m => m.stage).filter(Boolean))],
  });

  return bracketMatches;
}

/**
 * Detect if matches represent a double elimination bracket
 * First checks for explicit bracketType field, then falls back to heuristics
 */
export function detectBracketType(
  matches: MatchWithTeamsAndLeagueAndSeason[]
): 'single' | 'double' {
  if (matches.length === 0) return 'single';

  // Priority 1: Check for explicit bracketType field (most reliable)
  // If any match has 'lower', 'upper', or 'grand-final', it's definitely double elimination
  const hasDoubleElimBracketType = matches.some(m => 
    m.bracketType === 'lower' || m.bracketType === 'upper' || m.bracketType === 'grand-final'
  );
  if (hasDoubleElimBracketType) {
    return 'double';
  }

  // Priority 2: Use heuristics for old brackets without bracketType field
  const playoffMatches = matches.filter(m => m.stage === 'PLAYOFF').length;
  const quarterFinals = matches.filter(m => m.stage === 'QUARTER_FINALS').length;
  const semiFinals = matches.filter(m => m.stage === 'SEMI_FINALS').length;
  const championship = matches.filter(m => m.stage === 'CHAMPIONSHIP').length;

  // If we have playoff matches and other tournament stages, likely double elimination
  // Double elimination typically has many more matches than single elimination
  // A simple heuristic: if playoff matches > (quarterFinals + semiFinals), likely double
  if (playoffMatches > 0 && playoffMatches >= (quarterFinals + semiFinals + championship)) {
    return 'double';
  }

  // Another heuristic: if total matches > 2x what single elimination would have
  const tournamentStages = quarterFinals + semiFinals + championship;
  if (tournamentStages > 0) {
    // Single elimination: if we have N teams, we have N-1 matches
    // If we have significantly more matches, likely double elimination
    const expectedSingleElimMatches = tournamentStages;
    if (matches.length > expectedSingleElimMatches * 1.5) {
      return 'double';
    }
  }

  return 'single';
}

/**
 * Convert matches to double elimination bracket format
 * Separates matches into upper and lower brackets
 */
export function convertMatchesToDoubleEliminationBracket(
  matches: MatchWithTeamsAndLeagueAndSeason[]
): { upper: BracketMatch[]; lower: BracketMatch[]; grandFinal?: BracketMatch[] } {
  if (matches.length === 0) {
    return { upper: [], lower: [] };
  }

  // Separate matches into upper, lower, and grand final brackets using bracketType field
  // Fall back to stage-based detection for old brackets without bracketType
  const upperMatches: MatchWithTeamsAndLeagueAndSeason[] = [];
  const lowerMatches: MatchWithTeamsAndLeagueAndSeason[] = [];
  const grandFinalMatches: MatchWithTeamsAndLeagueAndSeason[] = [];

  matches.forEach(match => {
    if (!match.stage) return;
    
    // Use bracketType if available (new brackets)
    if (match.bracketType) {
      if (match.bracketType === 'upper') {
        upperMatches.push(match);
      } else if (match.bracketType === 'lower') {
        lowerMatches.push(match);
      } else if (match.bracketType === 'grand-final') {
        grandFinalMatches.push(match);
      }
    } else {
      // Fallback: use stage-based detection for old brackets
      // For double elimination, PLAYOFF can be in upper bracket (first round) or lower bracket
      // Use context: if PLAYOFF matches have nextLoserMatchId pointing to lower bracket, they're upper bracket
      // Otherwise, assume they're lower bracket
      const upperBracketStages: MatchStage[] = ['QUARTER_FINALS', 'SEMI_FINALS'];
      
      // Check if this is an upper bracket PLAYOFF match (has nextLoserMatchId pointing to lower bracket)
      const isUpperBracketPlayoff = match.stage === 'PLAYOFF' && match.nextLoserMatchId;
      
      if (upperBracketStages.includes(match.stage) || isUpperBracketPlayoff) {
        upperMatches.push(match);
      } else if (match.stage === 'PLAYOFF') {
        // Lower bracket playoff match
        lowerMatches.push(match);
      } else if (match.stage === 'CHAMPIONSHIP') {
        // Could be grand final or upper bracket final - check if there are multiple championship matches
        const championshipCount = matches.filter(m => m.stage === 'CHAMPIONSHIP').length;
        if (championshipCount > 1) {
          // Multiple championships likely means one is grand final
          grandFinalMatches.push(match);
        } else {
          // Single championship - could be single elimination or grand final
          // Assume it's grand final if we have both upper and lower brackets
          if (upperMatches.length > 0 && lowerMatches.length > 0) {
            grandFinalMatches.push(match);
          } else {
            upperMatches.push(match);
          }
        }
      }
    }
  });

  // Convert upper bracket matches
  // Use stored nextWinnerMatchId and nextLoserMatchId from convertMatchToBracket
  const upperBracket: BracketMatch[] = upperMatches.map(match => {
    const bracketMatch = convertMatchToBracket(match, matches);
    // Ensure bracketType is set
    if (!bracketMatch.bracketType) {
      bracketMatch.bracketType = 'upper';
    }
    
    // If nextMatchId wasn't set by convertMatchToBracket (old bracket), try to compute it
    if (!bracketMatch.nextMatchId) {
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
          // Look for next match in upper bracket or grand final
          const nextMatch = [...upperMatches, ...grandFinalMatches].find(m => m.stage === nextStage);
          if (nextMatch) {
            bracketMatch.nextMatchId = nextMatch.id;
          }
        }
      }
    }
    
    return bracketMatch;
  });

  // Convert grand final matches
  const grandFinal: BracketMatch[] = grandFinalMatches.map(match => {
    const bracketMatch = convertMatchToBracket(match, matches);
    // Ensure bracketType is set
    if (!bracketMatch.bracketType) {
      bracketMatch.bracketType = 'grand-final';
    }
    return bracketMatch;
  });

  // Convert lower bracket matches
  // Use stored nextWinnerMatchId from convertMatchToBracket
  const lowerBracket: BracketMatch[] = lowerMatches.map(match => {
    const bracketMatch = convertMatchToBracket(match, matches);
    // Ensure bracketType is set
    if (!bracketMatch.bracketType) {
      bracketMatch.bracketType = 'lower';
    }
    
    // If nextMatchId wasn't set by convertMatchToBracket (old bracket), try to compute it
    if (!bracketMatch.nextMatchId) {
      // Lower bracket progression: winners advance to next lower bracket round or grand final
      // This is simplified - in practice, lower bracket structure is complex
      const nextStageMap: Record<MatchStage, MatchStage | null> = {
        PLAYOFF: 'QUARTER_FINALS',
        QUARTER_FINALS: 'SEMI_FINALS',
        SEMI_FINALS: 'CHAMPIONSHIP', // Lower bracket final goes to grand final
        CHAMPIONSHIP: null,
        REGULAR_SEASON: null,
        PRESEASON: null,
        EXHIBITION: null,
        QUALIFIER: null,
        OTHER: null,
      };
      
      if (match.stage && match.stage in nextStageMap) {
        const nextStage = nextStageMap[match.stage as keyof typeof nextStageMap];
        if (nextStage === 'CHAMPIONSHIP') {
          // Lower bracket final goes to grand final
          const grandFinalMatch = grandFinalMatches[0];
          if (grandFinalMatch) {
            bracketMatch.nextMatchId = grandFinalMatch.id;
          }
        } else if (nextStage) {
          // Look for next match in lower bracket
          const nextMatch = lowerMatches.find(m => m.stage === nextStage);
          if (nextMatch) {
            bracketMatch.nextMatchId = nextMatch.id;
          }
        }
      }
    }
    
    return bracketMatch;
  });

  // Sort by bracketRound and bracketPosition if available, otherwise by date
  const sortMatches = (a: BracketMatch, b: BracketMatch) => {
    const matchA = matches.find(m => m.id === a.originalMatchId);
    const matchB = matches.find(m => m.id === b.originalMatchId);
    
    if (matchA?.bracketRound !== undefined && matchB?.bracketRound !== undefined) {
      if (matchA.bracketRound !== matchB.bracketRound) {
        return matchA.bracketRound - matchB.bracketRound;
      }
      // Same round, sort by position
      if (matchA.bracketPosition !== undefined && matchB.bracketPosition !== undefined) {
        return matchA.bracketPosition - matchB.bracketPosition;
      }
    }
    // Fallback to date
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  };

  upperBracket.sort(sortMatches);
  lowerBracket.sort(sortMatches);
  grandFinal.sort(sortMatches);

  // Ensure we always return arrays (never undefined)
  return {
    upper: Array.isArray(upperBracket) && Array.isArray(grandFinal)
      ? [...upperBracket, ...grandFinal]
      : upperBracket,
    lower: Array.isArray(lowerBracket) ? lowerBracket : [],
    grandFinal: grandFinal.length > 0 ? grandFinal : undefined,
  };
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
