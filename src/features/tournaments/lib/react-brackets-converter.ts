/**
 * Converter for react-brackets library
 * Converts BracketMatch format to react-brackets rounds format
 */

import type { BracketMatch } from './bracket-converter';

// Types for react-brackets (defined locally as they may not be exported)
export interface SeedTeam {
  name: string;
  seed?: number | null;
}

export interface Seed {
  id: string | number;
  date: string;
  teams: [SeedTeam | null, SeedTeam | null];
  [key: string]: any; // Allow custom properties for our use
}

export interface RoundProps {
  title: string;
  seeds: Seed[];
}

export interface ReactBracketsRound {
  title: string;
  seeds: Seed[];
}

/**
 * Organize matches into rounds based on tree structure
 * Uses nextMatchId relationships to build proper tournament rounds
 */
function organizeMatchesIntoRounds(matches: BracketMatch[]): BracketMatch[][] {
  if (matches.length === 0) {
    return [];
  }

  // Build a map of match ID to match for quick lookup
  const matchMap = new Map<string, BracketMatch>();
  matches.forEach(m => matchMap.set(m.id, m));

  // Build reverse index: map from child match ID to parent matches
  const childToParents = new Map<string, BracketMatch[]>();
  matches.forEach(match => {
    if (match.nextMatchId) {
      if (!childToParents.has(match.nextMatchId)) {
        childToParents.set(match.nextMatchId, []);
      }
      childToParents.get(match.nextMatchId)!.push(match);
    }
  });

  // Find root matches (matches with no nextMatchId or CHAMPIONSHIP stage)
  const roots = matches.filter(m => 
    !m.nextMatchId || m.stage === 'CHAMPIONSHIP' || m.bracketType === 'grand-final'
  );

  // If no clear roots, find matches that aren't children of any other match
  let actualRoots = roots.length > 0 ? roots : matches.filter(m => {
    return !Array.from(childToParents.values()).some(parents => 
      parents.some(parent => parent.id === m.id)
    );
  });

  if (actualRoots.length === 0 && matches.length > 0) {
    // Fallback: use matches with highest stage hierarchy
    actualRoots = [matches.reduce((highest, current) => {
      const currentHierarchy = getStageHierarchy(current.stage);
      const highestHierarchy = getStageHierarchy(highest.stage);
      return currentHierarchy > highestHierarchy ? current : highest;
    })];
  }

  // Build rounds by traversing from root to leaves
  const rounds: BracketMatch[][] = [];
  const processed = new Set<string>();

  // Start with root round
  if (actualRoots.length > 0) {
    rounds.push([...actualRoots]);
    actualRoots.forEach(r => processed.add(r.id));
  }

  // Build subsequent rounds
  let currentRound = actualRoots;
  while (currentRound.length > 0) {
    const nextRound: BracketMatch[] = [];
    const nextRoundIds = new Set<string>();

    // For each match in current round, find its parent matches
    currentRound.forEach(match => {
      const parents = childToParents.get(match.id) || [];
      parents.forEach(parent => {
        if (!processed.has(parent.id) && !nextRoundIds.has(parent.id)) {
          nextRound.push(parent);
          nextRoundIds.add(parent.id);
          processed.add(parent.id);
        }
      });
    });

    if (nextRound.length > 0) {
      // Sort matches in round by their position (maintain order for proper pairing)
      nextRound.sort((a, b) => {
        // Try to maintain order based on nextMatchId relationships
        // Matches that feed into the same next match should be adjacent
        if (a.nextMatchId === b.nextMatchId && a.nextMatchId) {
          // Same parent, sort by date or id
          return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
        }
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      });
      
      rounds.push(nextRound);
      currentRound = nextRound;
    } else {
      break;
    }
  }

  // Add any orphaned matches (matches not connected to the tree)
  const orphaned = matches.filter(m => !processed.has(m.id));
  if (orphaned.length > 0) {
    // Group orphaned matches by stage and add as additional rounds
    const orphanedByStage = new Map<string, BracketMatch[]>();
    orphaned.forEach(m => {
      const stage = m.stage || 'OTHER';
      if (!orphanedByStage.has(stage)) {
        orphanedByStage.set(stage, []);
      }
      orphanedByStage.get(stage)!.push(m);
    });
    
    // Add orphaned rounds in stage hierarchy order
    const stageOrder = ['PLAYOFF', 'QUARTER_FINALS', 'SEMI_FINALS', 'CHAMPIONSHIP'];
    stageOrder.forEach(stage => {
      if (orphanedByStage.has(stage)) {
        rounds.push(orphanedByStage.get(stage)!);
      }
    });
  }

  // Reverse rounds so earliest rounds come first (for horizontal tree display)
  return rounds.reverse();
}

/**
 * Get stage hierarchy for sorting
 */
function getStageHierarchy(stage: string | null | undefined): number {
  if (!stage) return 0;
  const hierarchy: Record<string, number> = {
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
 * Convert BracketMatch array to react-brackets rounds format
 * Organizes matches into proper tournament rounds based on tree structure
 */
export function convertToReactBracketsFormat(
  matches: BracketMatch[]
): RoundProps[] {
  if (matches.length === 0) {
    return [];
  }

  // Organize matches into rounds based on tree structure
  const rounds = organizeMatchesIntoRounds(matches);

  // Convert to react-brackets format
  const reactBracketsRounds: RoundProps[] = rounds.map((roundMatches, roundIndex) => {
    // Generate round title based on round position and match count
    let roundTitle = `Round ${roundIndex + 1}`;
    
    if (roundMatches.length > 0) {
      const firstMatch = roundMatches[0];
      // Use the match's tournamentRoundText if available
      if (firstMatch.tournamentRoundText) {
        roundTitle = firstMatch.tournamentRoundText;
      } else {
        // Generate title based on stage
        const stage = firstMatch.stage;
        if (stage === 'CHAMPIONSHIP' || firstMatch.bracketType === 'grand-final') {
          roundTitle = 'Final';
        } else if (stage === 'SEMI_FINALS') {
          roundTitle = 'Semi-Final';
        } else if (stage === 'QUARTER_FINALS') {
          roundTitle = 'Quarter-Final';
        } else if (stage === 'PLAYOFF') {
          roundTitle = 'Playoff';
        } else if (roundMatches.length === 1) {
          roundTitle = 'Final';
        } else if (roundMatches.length === 2) {
          roundTitle = 'Semi-Final';
        } else if (roundMatches.length === 4) {
          roundTitle = 'Quarter-Final';
        }
      }
    }

    // Sort matches within round to maintain proper pairing
    // Matches that feed into the same next match should be adjacent
    const sortedMatches = [...roundMatches].sort((a, b) => {
      // If they feed into the same match, keep them together
      if (a.nextMatchId === b.nextMatchId && a.nextMatchId) {
        return 0; // Keep original order
      }
      // Otherwise sort by date
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });

    const seeds: Seed[] = sortedMatches.map(match => {
      const team1 = match.participants[0];
      const team2 = match.participants[1];

      return {
        id: match.id,
        date: new Date(match.startTime).toLocaleDateString(),
        teams: [
          team1 ? {
            name: team1.name || 'TBD',
            seed: null,
          } : null,
          team2 ? {
            name: team2.name || 'TBD',
            seed: null,
          } : null,
        ],
        // Store original match data for editing
        originalMatchId: match.originalMatchId,
        stage: match.stage,
        isEmpty: match.isEmpty,
        score: team1?.resultText && team2?.resultText 
          ? [team1.resultText, team2.resultText]
          : undefined,
      };
    });

    return {
      title: roundTitle,
      seeds,
    };
  });

  return reactBracketsRounds;
}
