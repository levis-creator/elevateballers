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
 * Convert BracketMatch array to react-brackets rounds format
 */
export function convertToReactBracketsFormat(
  matches: BracketMatch[]
): RoundProps[] {
  if (matches.length === 0) {
    return [];
  }

  // Group matches by round/stage
  const matchesByRound = new Map<string, BracketMatch[]>();
  
  matches.forEach(match => {
    const roundTitle = match.tournamentRoundText || 'Round';
    if (!matchesByRound.has(roundTitle)) {
      matchesByRound.set(roundTitle, []);
    }
    matchesByRound.get(roundTitle)!.push(match);
  });

  // Get round order based on stage hierarchy
  const roundOrder = [
    'Playoff',
    'Quarter-Final',
    'Semi-Final',
    'Final',
    'Round 1', // Fallback for matches without stage
  ];

  // Sort rounds by hierarchy
  const sortedRounds = Array.from(matchesByRound.entries()).sort((a, b) => {
    const aIndex = roundOrder.findIndex(r => a[0].includes(r));
    const bIndex = roundOrder.findIndex(r => b[0].includes(r));
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a[0].localeCompare(b[0]);
  });

  // Convert to react-brackets format
  const rounds: RoundProps[] = sortedRounds.map(([roundTitle, roundMatches]) => {
    // Sort matches within round by date
    const sortedMatches = [...roundMatches].sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

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

  return rounds;
}
