import React from 'react';
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
  matches: BracketMatch[];
  isDoubleElimination?: boolean;
  isEditable?: boolean;
  onMatchClick?: (matchId: string | null, match: BracketMatch) => void;
  seasonId?: string;
  leagueId?: string;
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
    return (
      <div className="sp-tournament-bracket sp-tournament-bracket-double">
        <DoubleEliminationBracket
          matches={matches}
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
  }

  return (
    <div className="sp-tournament-bracket sp-tournament-bracket-single">
      <SingleEliminationBracket
        matches={matches}
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
};

export default TournamentBracket;
