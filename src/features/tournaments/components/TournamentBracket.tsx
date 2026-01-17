import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import {
  SingleEliminationBracket,
  DoubleEliminationBracket,
  Match,
  SVGViewer,
  createTheme,
} from '@g-loot/react-tournament-brackets';
import InteractiveMatch from './InteractiveMatch';
import type { BracketMatch } from '../lib/bracket-converter';

// Custom theme to match the site's aesthetics
const customTheme = createTheme({
  textColor: { main: '#363f48', onSecondary: '#ffffff', secondary: '#777777' },
  matchBackground: { won: '#ffffff', lost: '#f8f9fa' },
  score: {
    background: { won: '#e21e22', lost: '#64748b' },
    text: { won: '#ffffff', lost: '#ffffff' },
  },
  border: { color: '#e2e8f0', highlightedColor: '#e21e22' },
  roundHeader: { backgroundColor: '#e21e22', fontColor: '#ffffff' },
  connectorColor: '#cbd5e1',
  connectorColorHighlighted: '#e21e22',
  svgBackground: '#ffffff',
});

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
  // Create match component renderer
  const renderMatch = (match: BracketMatch) => {
    if (isEditable) {
      return (
        <InteractiveMatch
          match={match}
          onMatchClick={onMatchClick}
          isEditable={isEditable}
        />
      );
    }
    return <Match match={match} />;
  };

  if (isDoubleElimination) {
    // Double elimination expects { upper: [], lower: [] } format
    let doubleElimMatches: { upper: BracketMatch[]; lower: BracketMatch[] };
    
    if (Array.isArray(matches)) {
      // Fallback if array passed - treat as upper bracket
      doubleElimMatches = { upper: matches, lower: [] };
    } else if (matches && typeof matches === 'object' && 'upper' in matches && 'lower' in matches) {
      // Ensure both upper and lower are arrays
      doubleElimMatches = {
        upper: Array.isArray(matches.upper) ? matches.upper : [],
        lower: Array.isArray(matches.lower) ? matches.lower : [],
      };
    } else {
      // Invalid format - default to empty
      doubleElimMatches = { upper: [], lower: [] };
    }

    // Validate that arrays are actually arrays and not null/undefined
    if (!Array.isArray(doubleElimMatches.upper)) {
      console.error('Invalid upper bracket format:', doubleElimMatches.upper);
      doubleElimMatches.upper = [];
    }
    if (!Array.isArray(doubleElimMatches.lower)) {
      console.error('Invalid lower bracket format:', doubleElimMatches.lower);
      doubleElimMatches.lower = [];
    }

    // Don't render if both brackets are empty
    if (doubleElimMatches.upper.length === 0 && doubleElimMatches.lower.length === 0) {
      return (
        <div className="sp-tournament-bracket sp-tournament-bracket-double">
          <div className="flex items-center justify-center p-8 text-muted-foreground">
            No matches to display
          </div>
        </div>
      );
    }

    // Validate match objects have required properties
    const validateMatches = (matchArray: BracketMatch[]): BracketMatch[] => {
      return matchArray.filter(match => {
        if (!match || typeof match !== 'object') {
          console.warn('Invalid match object:', match);
          return false;
        }
        // Ensure required properties exist
        if (!match.id || !match.participants || !Array.isArray(match.participants)) {
          console.warn('Match missing required properties:', match);
          return false;
        }
        // Ensure participants array has at least 2 elements (or is empty for TBD)
        if (match.participants.length > 0 && match.participants.length < 2) {
          console.warn('Match has invalid participants array:', match);
          return false;
        }
        return true;
      });
    };

    const validatedUpper = validateMatches(doubleElimMatches.upper);
    const validatedLower = validateMatches(doubleElimMatches.lower);

    // If validation removed all matches, don't render
    if (validatedUpper.length === 0 && validatedLower.length === 0) {
      return (
        <div className="sp-tournament-bracket sp-tournament-bracket-double">
          <div className="flex items-center justify-center p-8 text-muted-foreground">
            No valid matches to display
          </div>
        </div>
      );
    }

    // Wrap in error boundary using try-catch in render
    try {
      return (
        <div className="sp-tournament-bracket sp-tournament-bracket-double">
          <DoubleEliminationBracket
            matches={{ upper: validatedUpper, lower: validatedLower }}
            theme={customTheme}
            options={{
              style: {
                roundHeader: { backgroundColor: '#e21e22' },
              },
            }}
            renderMatchComponent={renderMatch}
            svgWrapper={({ children, ...props }) => (
              <SVGViewer width={1000} height={600} {...props}>
                {children}
              </SVGViewer>
            )}
          />
        </div>
      );
    } catch (error) {
      console.error('Error rendering DoubleEliminationBracket:', error);
      return (
        <div className="sp-tournament-bracket sp-tournament-bracket-double">
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="text-destructive mb-2">Error rendering bracket</div>
            <div className="text-sm text-muted-foreground">
              Upper: {validatedUpper.length} matches, Lower: {validatedLower.length} matches
            </div>
          </div>
        </div>
      );
    }
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
    matchDetails: validatedMatches.map(m => ({
      id: m.id,
      round: m.tournamentRoundText,
      stage: m.stage,
      nextMatchId: m.nextMatchId,
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

  return (
    <BracketErrorBoundary matches={validatedMatches}>
      <div className="sp-tournament-bracket sp-tournament-bracket-single">
        <SingleEliminationBracket
          matches={validatedMatches}
          theme={customTheme}
          options={{
            style: {
              roundHeader: { backgroundColor: '#e21e22' },
            },
          }}
          renderMatchComponent={renderMatch}
          svgWrapper={({ children, ...props }) => (
            <SVGViewer width={1000} height={600} {...props}>
              {children}
            </SVGViewer>
          )}
        />
      </div>
    </BracketErrorBoundary>
  );
};

export default TournamentBracket;
