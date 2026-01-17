import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Bracket, Seed, SeedItem, SeedTeam } from 'react-brackets';
import InteractiveMatch from './InteractiveMatch';
import type { BracketMatch } from '../lib/bracket-converter';
import { convertToReactBracketsFormat, type RoundProps, type Seed as ReactBracketsSeed } from '../lib/react-brackets-converter';

// Type for render seed props
interface RenderSeedProps {
  seed: ReactBracketsSeed;
  breakpoint: number;
  roundIndex: number;
  seedIndex: number;
}

export interface BracketPosition {
  round: string;
  position: number;
}

interface TournamentBracketProps {
  matches: BracketMatch[] | { upper: BracketMatch[]; lower: BracketMatch[] };
  isDoubleElimination?: boolean;
  isEditable?: boolean;
  onMatchClick?: (matchId: string | null, match: BracketMatch) => void;
  seasonId?: string;
  leagueId?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class BracketErrorBoundary extends Component<
  { children: ReactNode; matches: BracketMatch[] },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; matches: BracketMatch[] }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Bracket rendering error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="sp-tournament-bracket sp-tournament-bracket-single">
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="text-destructive font-semibold">Bracket Rendering Error</div>
            <div className="text-sm text-muted-foreground max-w-md">
              <p className="mb-2">
                The bracket could not be rendered. This usually happens when the bracket structure is incomplete.
              </p>
              <p className="font-medium text-foreground mt-4">
                💡 Use the "Generate Bracket" button to create a complete bracket structure.
              </p>
            </div>
            {this.state.error && (
              <div className="text-xs text-muted-foreground mt-2">
                Error: {this.state.error.message}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const TournamentBracket: React.FC<TournamentBracketProps> = ({ 
  matches, 
  isDoubleElimination = false,
  isEditable = false,
  onMatchClick,
  seasonId,
  leagueId,
}) => {
  // Custom seed renderer for editable brackets
  const renderSeedComponent = (props: RenderSeedProps) => {
    const { seed, breakpoint } = props;
    const seedData = seed as any; // Type assertion for custom properties
    
    if (isEditable && onMatchClick) {
      return (
        <Seed
          mobileBreakpoint={breakpoint}
          style={{
            cursor: 'pointer',
            ...(seedData?.isEmpty && {
              opacity: 0.6,
              border: '2px dashed #cbd5e1',
              borderRadius: '4px',
            }),
          }}
          onClick={() => {
            if (onMatchClick) {
              const matchId = seedData?.originalMatchId || seedData?.id || null;
              // Convert seed back to BracketMatch format for onMatchClick
              const bracketMatch: BracketMatch = {
                id: seedData?.id || '',
                nextMatchId: null,
                tournamentRoundText: '',
                startTime: new Date(seed.date || Date.now()).toISOString(),
                state: 'NO_SHOW',
                participants: [
                  seed.teams[0] ? {
                    id: `team1-${seed.id}`,
                    resultText: seedData?.score?.[0] || null,
                    isWinner: false,
                    status: null,
                    name: seed.teams[0].name || 'TBD',
                  } : {
                    id: `team1-${seed.id}`,
                    resultText: null,
                    isWinner: false,
                    status: null,
                    name: 'TBD',
                  },
                  seed.teams[1] ? {
                    id: `team2-${seed.id}`,
                    resultText: seedData?.score?.[1] || null,
                    isWinner: false,
                    status: null,
                    name: seed.teams[1].name || 'TBD',
                  } : {
                    id: `team2-${seed.id}`,
                    resultText: null,
                    isWinner: false,
                    status: null,
                    name: 'TBD',
                  },
                ],
                originalMatchId: seedData?.originalMatchId,
                stage: seedData?.stage,
                isEmpty: seedData?.isEmpty,
              };
              onMatchClick(matchId, bracketMatch);
            }
          }}
        >
          <SeedItem>
            <div className="flex flex-col gap-1">
              <SeedTeam className={seedData?.isEmpty ? 'text-muted-foreground italic' : ''}>
                {seed.teams[0]?.name || 'TBD'}
                {seedData?.score?.[0] !== undefined && (
                  <span className="ml-2 font-semibold">{seedData.score[0]}</span>
                )}
              </SeedTeam>
              <SeedTeam className={seedData?.isEmpty ? 'text-muted-foreground italic' : ''}>
                {seed.teams[1]?.name || 'TBD'}
                {seedData?.score?.[1] !== undefined && (
                  <span className="ml-2 font-semibold">{seedData.score[1]}</span>
                )}
              </SeedTeam>
            </div>
            {seedData?.isEmpty && isEditable && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-xs text-muted-foreground">Click to add match</span>
              </div>
            )}
          </SeedItem>
        </Seed>
      );
    }

    // Default renderer
    return (
      <Seed mobileBreakpoint={breakpoint}>
        <SeedItem>
          <div className="flex flex-col gap-1">
            <SeedTeam>
              {seed.teams[0]?.name || 'TBD'}
              {seedData?.score?.[0] !== undefined && (
                <span className="ml-2 font-semibold">{seedData.score[0]}</span>
              )}
            </SeedTeam>
            <SeedTeam>
              {seed.teams[1]?.name || 'TBD'}
              {seedData?.score?.[1] !== undefined && (
                <span className="ml-2 font-semibold">{seedData.score[1]}</span>
              )}
            </SeedTeam>
          </div>
        </SeedItem>
      </Seed>
    );
  };

  // Note: react-brackets doesn't natively support double elimination
  // For now, we'll show upper bracket only, or you can display them side by side
  if (isDoubleElimination) {
    // Double elimination - show upper bracket for now
    let doubleElimMatches: { upper: BracketMatch[]; lower: BracketMatch[] };
    
    if (Array.isArray(matches)) {
      doubleElimMatches = { upper: matches, lower: [] };
    } else if (matches && typeof matches === 'object' && 'upper' in matches && 'lower' in matches) {
      doubleElimMatches = {
        upper: Array.isArray(matches.upper) ? matches.upper : [],
        lower: Array.isArray(matches.lower) ? matches.lower : [],
      };
    } else {
      doubleElimMatches = { upper: [], lower: [] };
    }

    // For now, render upper bracket only
    const upperRounds = convertToReactBracketsFormat(doubleElimMatches.upper);
    
    if (upperRounds.length === 0) {
      return (
        <div className="sp-tournament-bracket sp-tournament-bracket-double">
          <div className="flex items-center justify-center p-8 text-muted-foreground">
            No matches to display
          </div>
        </div>
      );
    }

    return (
      <div className="sp-tournament-bracket sp-tournament-bracket-double">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Upper Bracket</h3>
          <Bracket
            rounds={upperRounds}
            renderSeedComponent={renderSeedComponent}
            mobileBreakpoint={768}
          />
        </div>
        {doubleElimMatches.lower.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-2">Lower Bracket</h3>
            <Bracket
              rounds={convertToReactBracketsFormat(doubleElimMatches.lower)}
              renderSeedComponent={renderSeedComponent}
              mobileBreakpoint={768}
            />
          </div>
        )}
      </div>
    );
  }

  // Single elimination expects array format
  let singleElimMatches: BracketMatch[];
  
  if (Array.isArray(matches)) {
    singleElimMatches = matches;
  } else if (matches && typeof matches === 'object' && 'upper' in matches) {
    // If double elimination format passed, use upper bracket
    singleElimMatches = Array.isArray(matches.upper) ? matches.upper : [];
  } else {
    // Invalid format - default to empty
    singleElimMatches = [];
  }

  // Validate matches before rendering
  const isValidBracketMatch = (match: any): match is BracketMatch => {
    return (
      match &&
      typeof match === 'object' &&
      typeof match.id === 'string' &&
      Array.isArray(match.participants) &&
      match.participants.length >= 0 && // Allow empty participants for TBD
      match.participants.every((p: any) => 
        typeof p === 'object' && 
        typeof p.id === 'string' && 
        typeof p.name === 'string'
      )
    );
  };

  const validatedMatches = singleElimMatches.filter(isValidBracketMatch);

  console.log('TournamentBracket validation:', {
    inputMatches: singleElimMatches.length,
    validatedMatches: validatedMatches.length,
    invalidMatches: singleElimMatches.length - validatedMatches.length,
    ghostMatches: validatedMatches.filter(m => m.isEmpty).length,
    realMatches: validatedMatches.filter(m => !m.isEmpty).length,
    linkedMatches: validatedMatches.filter(m => m.nextMatchId !== null).length,
    matchDetails: validatedMatches.map(m => ({
      id: m.id.substring(0, 12),
      round: m.tournamentRoundText,
      stage: m.stage,
      nextMatchId: m.nextMatchId?.substring(0, 12) || null,
      isGhost: m.isEmpty,
      participants: m.participants.map(p => p.name),
    })),
  });

  // Don't render if no valid matches
  if (validatedMatches.length === 0) {
    return (
      <div className="sp-tournament-bracket sp-tournament-bracket-single">
        <div className="flex items-center justify-center p-8 text-muted-foreground">
          No matches to display
        </div>
      </div>
    );
  }

  // Check if bracket is incomplete (matches without nextMatchId links)
  const hasLinkedMatches = validatedMatches.some(m => m.nextMatchId !== null);
  const isIncompleteBracket = !hasLinkedMatches && validatedMatches.length > 1;
  
  if (isIncompleteBracket) {
    // Show a helpful message for incomplete brackets
    const stages = [...new Set(validatedMatches.map(m => m.stage).filter(Boolean))];
    const needsNextRounds = validatedMatches.some(m => 
      m.stage === 'QUARTER_FINALS' || m.stage === 'SEMI_FINALS'
    );
    
    return (
      <div className="sp-tournament-bracket sp-tournament-bracket-single">
        <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="text-lg font-semibold text-muted-foreground">
            Incomplete Bracket Structure
          </div>
          <div className="text-sm text-muted-foreground max-w-md">
            <p className="mb-2">
              Your bracket has {validatedMatches.length} match(es) but they are not properly linked.
            </p>
            {needsNextRounds && (
              <p className="mb-2">
                You have {stages.filter(s => s === 'QUARTER_FINALS').length > 0 ? 'Quarter-Finals' : ''} matches 
                but are missing the next rounds (Semi-Finals, Championship).
              </p>
            )}
            <p className="font-medium text-foreground mt-4">
              💡 Use the "Generate Bracket" button to create a complete bracket structure with all rounds automatically linked.
            </p>
          </div>
          <div className="mt-4 p-4 bg-muted rounded-lg text-left max-w-md">
            <div className="text-sm font-semibold mb-2">Current Matches:</div>
            <div className="space-y-1 text-xs">
              {validatedMatches.slice(0, 5).map((match, idx) => (
                <div key={match.id} className="flex justify-between">
                  <span>{match.tournamentRoundText}: {match.participants.map(p => p.name).join(' vs ')}</span>
                </div>
              ))}
              {validatedMatches.length > 5 && (
                <div className="text-muted-foreground">... and {validatedMatches.length - 5} more</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Convert to react-brackets format
  const rounds = convertToReactBracketsFormat(validatedMatches);

  if (rounds.length === 0) {
    return (
      <div className="sp-tournament-bracket sp-tournament-bracket-single">
        <div className="flex items-center justify-center p-8 text-muted-foreground">
          No matches to display
        </div>
      </div>
    );
  }

  return (
    <BracketErrorBoundary matches={validatedMatches}>
      <div className="sp-tournament-bracket sp-tournament-bracket-single">
        <Bracket
          rounds={rounds}
          renderSeedComponent={renderSeedComponent}
          mobileBreakpoint={768}
        />
      </div>
    </BracketErrorBoundary>
  );
};

export default TournamentBracket;
