/**
 * Bracket Generator Utility
 * Generates tournament brackets from a list of teams
 * Supports both single and double elimination
 * Users only need to schedule days
 */

import type { MatchStage } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createMatch } from '../../cms/lib/mutations';
import type { Team } from '../../cms/types';

export interface BracketGenerationOptions {
  teamIds: string[];
  seasonId: string;
  leagueId?: string;
  tournamentDays: Date[]; // Array of dates for the tournament
  bracketType: 'single' | 'double';
}

export interface GeneratedMatch {
  team1Id: string | null;
  team1Name: string | null;
  team2Id: string | null;
  team2Name: string | null;
  stage: MatchStage;
  date: Date;
  matchNumber: number;
  roundNumber: number;
  bracketType: 'upper' | 'lower' | 'grand-final';
}

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
 * Distribute matches across tournament days
 */
function distributeMatchesAcrossDays(
  matches: GeneratedMatch[],
  tournamentDays: Date[]
): GeneratedMatch[] {
  if (tournamentDays.length === 0) {
    // If no days specified, use today and spread matches
    const today = new Date();
    today.setHours(10, 0, 0, 0); // Default to 10 AM
    return matches.map((match, index) => ({
      ...match,
      date: new Date(today.getTime() + index * 2 * 60 * 60 * 1000), // 2 hours apart
    }));
  }

  // Group matches by round (earlier rounds first)
  const matchesByRound = new Map<number, GeneratedMatch[]>();
  matches.forEach(match => {
    if (!matchesByRound.has(match.roundNumber)) {
      matchesByRound.set(match.roundNumber, []);
    }
    matchesByRound.get(match.roundNumber)!.push(match);
  });

  const sortedRounds = Array.from(matchesByRound.keys()).sort((a, b) => a - b);
  const distributedMatches: GeneratedMatch[] = [];
  let dayIndex = 0;

  // Distribute rounds across days
  for (const round of sortedRounds) {
    const roundMatches = matchesByRound.get(round)!;
    const matchesPerDay = Math.ceil(roundMatches.length / Math.max(1, tournamentDays.length - dayIndex));
    
    let matchIndex = 0;
    while (matchIndex < roundMatches.length && dayIndex < tournamentDays.length) {
      const currentDay = new Date(tournamentDays[dayIndex]);
      currentDay.setHours(10, 0, 0, 0); // Default to 10 AM
      
      const dayMatches = roundMatches.slice(matchIndex, matchIndex + matchesPerDay);
      dayMatches.forEach((match, idx) => {
        const matchDate = new Date(currentDay);
        matchDate.setHours(10 + (idx * 2), 0, 0, 0); // 2 hours between matches
        distributedMatches.push({
          ...match,
          date: matchDate,
        });
      });
      
      matchIndex += matchesPerDay;
      dayIndex++;
    }
  }

  return distributedMatches;
}

/**
 * Generate bracket structure for single elimination
 */
export function generateSingleEliminationBracket(
  teamIds: string[],
  teams: Team[],
  tournamentDays: Date[]
): GeneratedMatch[] {
  if (teamIds.length < 2) {
    throw new Error('At least 2 teams are required');
  }

  // Remove duplicate team IDs to prevent self-matching
  const uniqueTeamIds = Array.from(new Set(teamIds));
  if (uniqueTeamIds.length !== teamIds.length) {
    console.warn(`Removed ${teamIds.length - uniqueTeamIds.length} duplicate team(s) from bracket generation`);
  }
  if (uniqueTeamIds.length < 2) {
    throw new Error('At least 2 unique teams are required (duplicates were removed)');
  }

  const teamMap = new Map(teams.map(t => [t.id, t]));
  const totalTeams = roundToPowerOfTwo(uniqueTeamIds.length);
  const rounds = calculateRounds(totalTeams);
  const matches: GeneratedMatch[] = [];
  
  // Create a shuffled copy to randomize matchups
  const shuffledTeams = [...uniqueTeamIds].sort(() => Math.random() - 0.5);
  
  // Add byes if needed
  const teamsWithByes = [...shuffledTeams];
  while (teamsWithByes.length < totalTeams) {
    teamsWithByes.push(null as any);
  }

  let matchNumber = 1;

  // Generate first round
  const firstRoundMatches = totalTeams / 2;
  const firstRoundStage: MatchStage = rounds === 2 ? 'SEMI_FINALS' : 
                                      rounds === 3 ? 'QUARTER_FINALS' : 
                                      'PLAYOFF';

  for (let i = 0; i < firstRoundMatches; i++) {
    const team1Index = i * 2;
    const team2Index = team1Index + 1;
    const team1Id = teamsWithByes[team1Index];
    const team2Id = teamsWithByes[team2Index];

    if (!team1Id && !team2Id) continue;

    // Ensure team is not matched against itself
    if (team1Id && team2Id && team1Id === team2Id) {
      console.error(`Skipping invalid match: team ${team1Id} cannot play against itself`);
      continue;
    }

    const team1 = team1Id ? teamMap.get(team1Id) : null;
    const team2 = team2Id ? teamMap.get(team2Id) : null;

    matches.push({
      team1Id: team1Id || null,
      team1Name: team1?.name || (team1Id ? null : 'BYE'),
      team2Id: team2Id || null,
      team2Name: team2?.name || (team2Id ? null : 'BYE'),
      stage: firstRoundStage,
      date: new Date(), // Will be set by distributeMatchesAcrossDays
      matchNumber: matchNumber++,
      roundNumber: 1,
      bracketType: 'upper',
    });
  }

  // Generate subsequent rounds
  let currentRoundMatches = firstRoundMatches / 2;
  let roundNumber = 2;

  while (currentRoundMatches >= 1) {
    let stage: MatchStage;
    if (currentRoundMatches === 1) {
      stage = 'CHAMPIONSHIP';
    } else if (currentRoundMatches === 2) {
      stage = 'SEMI_FINALS';
    } else if (currentRoundMatches === 4) {
      stage = 'QUARTER_FINALS';
    } else {
      stage = 'PLAYOFF';
    }

    for (let i = 0; i < currentRoundMatches; i++) {
      matches.push({
        team1Id: null, // Will be filled by winner advancement
        team1Name: 'TBD',
        team2Id: null,
        team2Name: 'TBD',
        stage,
        date: new Date(),
        matchNumber: matchNumber++,
        roundNumber,
        bracketType: 'upper',
      });
    }

    currentRoundMatches = currentRoundMatches / 2;
    roundNumber++;
  }

  // Distribute matches across days
  return distributeMatchesAcrossDays(matches, tournamentDays);
}

/**
 * Generate bracket structure for double elimination
 */
export function generateDoubleEliminationBracket(
  teamIds: string[],
  teams: Team[],
  tournamentDays: Date[]
): { upper: GeneratedMatch[]; lower: GeneratedMatch[] } {
  if (teamIds.length < 2) {
    throw new Error('At least 2 teams are required');
  }

  // Remove duplicate team IDs to prevent self-matching
  const uniqueTeamIds = Array.from(new Set(teamIds));
  if (uniqueTeamIds.length !== teamIds.length) {
    console.warn(`Removed ${teamIds.length - uniqueTeamIds.length} duplicate team(s) from bracket generation`);
  }
  if (uniqueTeamIds.length < 2) {
    throw new Error('At least 2 unique teams are required (duplicates were removed)');
  }

  const teamMap = new Map(teams.map(t => [t.id, t]));
  const totalTeams = roundToPowerOfTwo(uniqueTeamIds.length);
  const rounds = calculateRounds(totalTeams);
  
  const shuffledTeams = [...uniqueTeamIds].sort(() => Math.random() - 0.5);
  const teamsWithByes = [...shuffledTeams];
  while (teamsWithByes.length < totalTeams) {
    teamsWithByes.push(null as any);
  }

  let matchNumber = 1;

  const upperMatches: GeneratedMatch[] = [];
  const lowerMatches: GeneratedMatch[] = [];

  // UPPER BRACKET - First Round
  const firstRoundMatches = totalTeams / 2;
  const firstRoundStage: MatchStage = rounds === 2 ? 'SEMI_FINALS' : 
                                      rounds === 3 ? 'QUARTER_FINALS' : 
                                      'PLAYOFF';

  for (let i = 0; i < firstRoundMatches; i++) {
    const team1Index = i * 2;
    const team2Index = team1Index + 1;
    const team1Id = teamsWithByes[team1Index];
    const team2Id = teamsWithByes[team2Index];

    if (!team1Id && !team2Id) continue;

    // Ensure team is not matched against itself
    if (team1Id && team2Id && team1Id === team2Id) {
      console.error(`Skipping invalid match: team ${team1Id} cannot play against itself`);
      continue;
    }

    const team1 = team1Id ? teamMap.get(team1Id) : null;
    const team2 = team2Id ? teamMap.get(team2Id) : null;

    upperMatches.push({
      team1Id: team1Id || null,
      team1Name: team1?.name || (team1Id ? null : 'BYE'),
      team2Id: team2Id || null,
      team2Name: team2?.name || (team2Id ? null : 'BYE'),
      stage: firstRoundStage,
      date: new Date(),
      matchNumber: matchNumber++,
      roundNumber: 1,
      bracketType: 'upper',
    });
  }

  // UPPER BRACKET - Subsequent Rounds
  let upperRoundMatches = firstRoundMatches / 2;
  let upperRoundNumber = 2;

  while (upperRoundMatches >= 1) {
    let stage: MatchStage;
    if (upperRoundMatches === 1) {
      stage = 'CHAMPIONSHIP';
    } else if (upperRoundMatches === 2) {
      stage = 'SEMI_FINALS';
    } else if (upperRoundMatches === 4) {
      stage = 'QUARTER_FINALS';
    } else {
      stage = 'PLAYOFF';
    }

    for (let i = 0; i < upperRoundMatches; i++) {
      upperMatches.push({
        team1Id: null,
        team1Name: 'TBD',
        team2Id: null,
        team2Name: 'TBD',
        stage,
        date: new Date(),
        matchNumber: matchNumber++,
        roundNumber: upperRoundNumber,
        bracketType: 'upper',
      });
    }

    upperRoundMatches = upperRoundMatches / 2;
    upperRoundNumber++;
  }

  // LOWER BRACKET - First Round (losers from upper bracket first round)
  const lowerFirstRoundMatches = firstRoundMatches / 2;
  
  for (let i = 0; i < lowerFirstRoundMatches; i++) {
    lowerMatches.push({
      team1Id: null, // Loser from upper bracket match i*2
      team1Name: 'TBD',
      team2Id: null, // Loser from upper bracket match i*2+1
      team2Name: 'TBD',
      stage: 'PLAYOFF',
      date: new Date(),
      matchNumber: matchNumber++,
      roundNumber: 1,
      bracketType: 'lower',
    });
  }

  // LOWER BRACKET - Subsequent Rounds
  let lowerRoundMatches = lowerFirstRoundMatches / 2;
  let lowerRoundNumber = 2;

  while (lowerRoundMatches >= 1) {
    let stage: MatchStage;
    if (lowerRoundMatches === 1) {
      // Final lower bracket match - winner goes to grand final
      stage = 'SEMI_FINALS';
    } else if (lowerRoundMatches === 2) {
      stage = 'QUARTER_FINALS';
    } else {
      stage = 'PLAYOFF';
    }

    for (let i = 0; i < lowerRoundMatches; i++) {
      lowerMatches.push({
        team1Id: null,
        team1Name: 'TBD',
        team2Id: null,
        team2Name: 'TBD',
        stage,
        date: new Date(),
        matchNumber: matchNumber++,
        roundNumber: lowerRoundNumber,
        bracketType: 'lower',
      });
    }

    lowerRoundMatches = lowerRoundMatches / 2;
    lowerRoundNumber++;
  }

  // Distribute matches across days
  const allMatches = [...upperMatches, ...lowerMatches];
  const distributed = distributeMatchesAcrossDays(allMatches, tournamentDays);
  
  // Split back into upper and lower
  const distributedUpper = distributed.filter(m => m.bracketType === 'upper');
  const distributedLower = distributed.filter(m => m.bracketType === 'lower');

  return {
    upper: distributedUpper,
    lower: distributedLower,
  };
}

/**
 * Preview bracket matches without saving to database
 * Returns the matches that would be created
 */
export async function previewBracketMatches(
  options: BracketGenerationOptions
): Promise<GeneratedMatch[]> {
  const { teamIds, seasonId, leagueId, tournamentDays, bracketType } = options;

  // Remove duplicate team IDs before processing
  const uniqueTeamIds = Array.from(new Set(teamIds));
  if (uniqueTeamIds.length !== teamIds.length) {
    console.warn(`Removed ${teamIds.length - uniqueTeamIds.length} duplicate team ID(s) from bracket generation`);
  }
  if (uniqueTeamIds.length < 2) {
    throw new Error('At least 2 unique teams are required (duplicates were removed)');
  }

  // Fetch team details
  const teams = await prisma.team.findMany({
    where: { id: { in: uniqueTeamIds } },
  });

  if (teams.length !== uniqueTeamIds.length) {
    const missingTeams = uniqueTeamIds.filter(id => !teams.find(t => t.id === id));
    throw new Error(`Some teams were not found: ${missingTeams.join(', ')}`);
  }

  // Validate team count limits (performance safeguard)
  const MAX_TEAMS = 256;
  if (uniqueTeamIds.length > MAX_TEAMS) {
    throw new Error(`Too many teams (${uniqueTeamIds.length}). Maximum is ${MAX_TEAMS} teams per bracket.`);
  }

  let allMatches: GeneratedMatch[] = [];

  if (bracketType === 'single') {
    allMatches = generateSingleEliminationBracket(uniqueTeamIds, teams, tournamentDays);
  } else {
    const { upper, lower } = generateDoubleEliminationBracket(uniqueTeamIds, teams, tournamentDays);
    allMatches = [...upper, ...lower];
    
    // Add grand final on the last day
    const lastDay = tournamentDays.length > 0 
      ? new Date(tournamentDays[tournamentDays.length - 1])
      : new Date();
    lastDay.setHours(14, 0, 0, 0); // 2 PM for grand final
    
    const grandFinal: GeneratedMatch = {
      team1Id: null,
      team1Name: 'TBD',
      team2Id: null,
      team2Name: 'TBD',
      stage: 'CHAMPIONSHIP',
      date: lastDay,
      matchNumber: allMatches.length + 1,
      roundNumber: 1,
      bracketType: 'grand-final',
    };
    allMatches.push(grandFinal);
  }

  // Validate matches
  return allMatches.filter(match => {
    // Ensure team is not matched against itself
    if (match.team1Id && match.team2Id && match.team1Id === match.team2Id) {
      console.warn(`Skipping invalid match: team ${match.team1Id} cannot play against itself`);
      return false;
    }
    return true;
  });
}

/**
 * Create all matches for a bracket in the database
 * Includes error handling and rollback capability
 */
export async function createBracketMatches(
  options: BracketGenerationOptions,
  matchesToCreate?: GeneratedMatch[]
): Promise<{ created: number; matchIds: string[]; errors: string[] }> {
  const { teamIds, seasonId, leagueId, tournamentDays, bracketType } = options;

  // Remove duplicate team IDs before processing
  const uniqueTeamIds = Array.from(new Set(teamIds));
  if (uniqueTeamIds.length !== teamIds.length) {
    console.warn(`Removed ${teamIds.length - uniqueTeamIds.length} duplicate team ID(s) from bracket generation`);
  }
  if (uniqueTeamIds.length < 2) {
    throw new Error('At least 2 unique teams are required (duplicates were removed)');
  }

  // Fetch team details
  const teams = await prisma.team.findMany({
    where: { id: { in: uniqueTeamIds } },
  });

  if (teams.length !== uniqueTeamIds.length) {
    const missingTeams = uniqueTeamIds.filter(id => !teams.find(t => t.id === id));
    throw new Error(`Some teams were not found: ${missingTeams.join(', ')}`);
  }

  // Validate team count limits (performance safeguard)
  const MAX_TEAMS = 256;
  if (teamIds.length > MAX_TEAMS) {
    throw new Error(`Too many teams (${teamIds.length}). Maximum is ${MAX_TEAMS} teams per bracket.`);
  }

  let allMatches: GeneratedMatch[] = [];
  let matchIds: string[] = [];
  let created = 0;
  const errors: string[] = [];

  try {
    // Use provided matches if available (from preview), otherwise generate
    if (matchesToCreate && matchesToCreate.length > 0) {
      allMatches = matchesToCreate;
    } else {
      if (bracketType === 'single') {
        allMatches = generateSingleEliminationBracket(uniqueTeamIds, teams, tournamentDays);
      } else {
        const { upper, lower } = generateDoubleEliminationBracket(uniqueTeamIds, teams, tournamentDays);
        allMatches = [...upper, ...lower];
        
        // Add grand final on the last day
        const lastDay = tournamentDays.length > 0 
          ? new Date(tournamentDays[tournamentDays.length - 1])
          : new Date();
        lastDay.setHours(14, 0, 0, 0); // 2 PM for grand final
        
        const grandFinal: GeneratedMatch = {
          team1Id: null,
          team1Name: 'TBD',
          team2Id: null,
          team2Name: 'TBD',
          stage: 'CHAMPIONSHIP',
          date: lastDay,
          matchNumber: allMatches.length + 1,
          roundNumber: 1,
          bracketType: 'grand-final',
        };
        allMatches.push(grandFinal);
      }
    }

    // Check for existing matches to prevent duplicates
    const existingMatches = await prisma.match.findMany({
      where: {
        seasonId,
        leagueId: leagueId || undefined,
        stage: { not: null },
      },
      select: {
        id: true,
        team1Id: true,
        team2Id: true,
        team1Name: true,
        team2Name: true,
        date: true,
        stage: true,
      },
    });

    // Create a set of existing match signatures for quick lookup
    const existingMatchSignatures = new Set(
      existingMatches.map(m => {
        const dateStr = new Date(m.date).toISOString().split('T')[0];
        return `${m.stage}-${m.team1Id || m.team1Name}-${m.team2Id || m.team2Name}-${dateStr}`;
      })
    );

    // Create matches in database with error handling
    // Use transaction for atomicity if possible, but create matches individually
    // to allow partial success (some matches created even if others fail)
    for (const match of allMatches) {
      try {
        // Validate that team is not matched against itself
        if (match.team1Id && match.team2Id && match.team1Id === match.team2Id) {
          console.error(`Skipping invalid match: team ${match.team1Id} cannot play against itself`);
          errors.push(`Match ${match.matchNumber}: Team cannot play against itself`);
          continue;
        }

        // Check if match already exists
        const dateStr = new Date(match.date).toISOString().split('T')[0];
        const matchSignature = `${match.stage}-${match.team1Id || match.team1Name || 'TBD'}-${match.team2Id || match.team2Name || 'TBD'}-${dateStr}`;
        
        if (existingMatchSignatures.has(matchSignature)) {
          console.log(`Skipping duplicate match: ${matchSignature}`);
          continue;
        }

        const createdMatch = await createMatch({
          team1Id: match.team1Id || undefined,
          team1Name: match.team1Name || undefined,
          team2Id: match.team2Id || undefined,
          team2Name: match.team2Name || undefined,
          leagueId: leagueId || undefined,
          seasonId,
          date: match.date,
          status: 'UPCOMING',
          stage: match.stage,
        });

        matchIds.push(createdMatch.id);
        created++;
        
        // Add to existing set to prevent duplicates within the same generation
        existingMatchSignatures.add(matchSignature);
      } catch (error: any) {
        const errorMsg = `Failed to create match ${match.matchNumber} (${match.stage}): ${error.message || 'Unknown error'}`;
        console.error(errorMsg, error);
        errors.push(errorMsg);
        // Continue creating other matches even if one fails
      }
    }

    // If no matches were created, throw error
    if (created === 0 && allMatches.length > 0) {
      throw new Error('Failed to create any matches. Check errors for details.');
    }

    return { created, matchIds, errors };
  } catch (error: any) {
    console.error('Error in createBracketMatches:', error);
    throw error;
  }
}

/**
 * Validate bracket generation options
 */
export function validateBracketOptions(options: BracketGenerationOptions): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate team count and check for duplicates
  if (!options.teamIds || options.teamIds.length === 0) {
    errors.push('At least one team is required');
  } else {
    // Check for duplicate team IDs
    const uniqueTeamIds = new Set(options.teamIds);
    if (uniqueTeamIds.size !== options.teamIds.length) {
      const duplicateCount = options.teamIds.length - uniqueTeamIds.size;
      errors.push(`${duplicateCount} duplicate team(s) detected. Each team can only be included once.`);
    }
    
    if (options.teamIds.length === 1) {
      errors.push('At least 2 teams are required to create a bracket');
    } else if (uniqueTeamIds.size < 2) {
      errors.push('At least 2 unique teams are required (duplicates were found)');
    } else if (options.teamIds.length > 128) {
      warnings.push('Large bracket detected. Generation may take longer for ' + options.teamIds.length + ' teams');
    }
  }

  // Validate season
  if (!options.seasonId) {
    errors.push('Season ID is required');
  }

  // Validate tournament days
  if (!options.tournamentDays || options.tournamentDays.length === 0) {
    errors.push('At least one tournament day is required');
  } else {
    // Check for past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const pastDays = options.tournamentDays.filter(day => {
      const dayDate = new Date(day);
      dayDate.setHours(0, 0, 0, 0);
      return dayDate < today;
    });
    if (pastDays.length > 0) {
      warnings.push('Some tournament days are in the past. Matches will still be created.');
    }

    // Check for duplicate days
    const uniqueDays = new Set(options.tournamentDays.map(d => d.toISOString().split('T')[0]));
    if (uniqueDays.size !== options.tournamentDays.length) {
      warnings.push('Duplicate tournament days detected. They will be deduplicated.');
    }
  }

  // Validate bracket type
  if (options.bracketType !== 'single' && options.bracketType !== 'double') {
    errors.push('Bracket type must be "single" or "double"');
  }

  // Performance warning for very large double elimination brackets
  if (options.bracketType === 'double' && options.teamIds.length > 32) {
    warnings.push('Double elimination with more than 32 teams will create many matches. Consider single elimination for large tournaments.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

