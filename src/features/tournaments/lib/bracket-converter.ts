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
    nextLooserMatchId: null, // Will be set by double elimination converter if needed
    tournamentRoundText: getRoundText(stage),
    startTime: new Date(match.date).toISOString(),
    state: getBracketState(match.status),
    participants,
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
    bracketMatchMap.set(match.id, bracketMatch);
    processedMatches.add(match.id);
  }
  
  // Second pass: link matches to their next rounds
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
      
      if (match.stage && match.stage in nextStageMap) {
        const nextStage = nextStageMap[match.stage as keyof typeof nextStageMap];
        if (nextStage) {
          const nextMatches = matchesByStage.get(nextStage) || [];
          if (nextMatches.length > 0) {
            // Link to the appropriate match in the next stage
            // For QUARTER_FINALS: match 0,1 -> SEMI_FINALS 0; match 2,3 -> SEMI_FINALS 1; etc.
            // For SEMI_FINALS: match 0,1 -> CHAMPIONSHIP 0
            const nextMatchIndex = Math.floor(i / 2); // Pair up matches (2 per next match)
            if (nextMatchIndex < nextMatches.length) {
              bracketMatch.nextMatchId = nextMatches[nextMatchIndex].id;
              console.log(`✓ Linking ${match.stage} match ${i} (${match.id.substring(0, 8)}...) to ${nextStage} match ${nextMatchIndex} (${nextMatches[nextMatchIndex].id.substring(0, 8)}...)`);
            } else if (nextMatches.length > 0) {
              // Fallback: link to last match of next stage if index is out of bounds
              bracketMatch.nextMatchId = nextMatches[nextMatches.length - 1].id;
              console.log(`✓ Linking ${match.stage} match ${i} (${match.id.substring(0, 8)}...) to last ${nextStage} match`);
            }
          } else {
            // No next stage matches exist - this creates an incomplete bracket
            console.warn(`⚠ No ${nextStage} matches found to link ${match.stage} match ${match.id.substring(0, 8)}... to`);
          }
        }
      }
    }
  }
  
  // Add all bracket matches to the result array
  for (const bracketMatch of bracketMatchMap.values()) {
    bracketMatches.push(bracketMatch);
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
    bracketMatchMap.set(match.id, bracketMatch);
    processedMatches.add(match.id);
  }
  
  // Generate ghost matches to complete bracket structure
  const { ghostMatches, ghostMap } = generateGhostMatchesForIncompleteBracket(matchesByStage);
  if (ghostMatches.length > 0) {
    // Add ghost matches to the map and result array
    for (const ghostMatch of ghostMatches) {
      bracketMatchMap.set(ghostMatch.id, ghostMatch);
      bracketMatches.push(ghostMatch);
    }
    
    // Re-link existing matches to ghost matches
    for (const stage of reverseStageOrder) {
      const stageMatches = matchesByStage.get(stage);
      if (!stageMatches || stageMatches.length === 0) continue;
      
      const sortedMatches = [...stageMatches].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      for (let i = 0; i < sortedMatches.length; i++) {
        const match = sortedMatches[i];
        const bracketMatch = bracketMatchMap.get(match.id);
        if (!bracketMatch || bracketMatch.nextMatchId) continue; // Already linked
        
        // Find the appropriate ghost match to link to
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
  
  // Re-add all matches from the map to ensure they're included
  bracketMatches = [];
  for (const bracketMatch of bracketMatchMap.values()) {
    bracketMatches.push(bracketMatch);
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
 * Heuristic: if there are many PLAYOFF matches relative to other stages, likely double elimination
 */
export function detectBracketType(
  matches: MatchWithTeamsAndLeagueAndSeason[]
): 'single' | 'double' {
  if (matches.length === 0) return 'single';

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
): { upper: BracketMatch[]; lower: BracketMatch[] } {
  if (matches.length === 0) {
    return { upper: [], lower: [] };
  }

  // Separate matches into upper and lower brackets
  // Upper bracket: QUARTER_FINALS, SEMI_FINALS, CHAMPIONSHIP (if only one)
  // Lower bracket: PLAYOFF matches and potentially some CHAMPIONSHIP matches
  
  const upperBracketStages: MatchStage[] = ['QUARTER_FINALS', 'SEMI_FINALS'];
  const lowerBracketStages: MatchStage[] = ['PLAYOFF'];
  
  const upperMatches: MatchWithTeamsAndLeagueAndSeason[] = [];
  const lowerMatches: MatchWithTeamsAndLeagueAndSeason[] = [];
  const championshipMatches: MatchWithTeamsAndLeagueAndSeason[] = [];

  matches.forEach(match => {
    if (!match.stage) return;
    
    if (upperBracketStages.includes(match.stage)) {
      upperMatches.push(match);
    } else if (lowerBracketStages.includes(match.stage)) {
      lowerMatches.push(match);
    } else if (match.stage === 'CHAMPIONSHIP') {
      championshipMatches.push(match);
    }
  });

  // Convert upper bracket matches
  const upperBracket: BracketMatch[] = upperMatches.map(match => {
    const bracketMatch = convertMatchToBracket(match, matches);
    bracketMatch.bracketType = 'upper';
    
    // Find next match in upper bracket
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
        const nextMatch = [...upperMatches, ...championshipMatches].find(m => m.stage === nextStage);
        if (nextMatch) {
          bracketMatch.nextMatchId = nextMatch.id;
        }
      }
    }
    
    return bracketMatch;
  });

  // Add championship matches to upper bracket (grand final)
  const upperChampionship: BracketMatch[] = championshipMatches.map(match => {
    const bracketMatch = convertMatchToBracket(match, matches);
    bracketMatch.bracketType = 'grand-final';
    return bracketMatch;
  });

  // Convert lower bracket matches
  const lowerBracket: BracketMatch[] = lowerMatches.map(match => {
    const bracketMatch = convertMatchToBracket(match, matches);
    bracketMatch.bracketType = 'lower';
    
    // Lower bracket progression (simplified - could be enhanced)
    // Lower bracket winners advance to next lower bracket round or grand final
    return bracketMatch;
  });

  // Sort by date
  upperBracket.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  lowerBracket.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  upperChampionship.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  // Ensure we always return arrays (never undefined)
  return {
    upper: Array.isArray(upperBracket) && Array.isArray(upperChampionship) 
      ? [...upperBracket, ...upperChampionship] 
      : [],
    lower: Array.isArray(lowerBracket) ? lowerBracket : [],
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
