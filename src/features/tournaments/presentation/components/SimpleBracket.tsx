/**
 * Simple Tournament Bracket Component
 * A lightweight, React 19 compatible bracket visualization
 * Replaces @g-loot/react-tournament-brackets and react-brackets
 */

import React from 'react';
import type { BracketMatch } from '../../lib/bracket-converter';
import { MATCH_TIMEZONE } from '../../../matches/domain/usecases/utils';

interface SimpleBracketProps {
  matches: BracketMatch[] | { upper: BracketMatch[]; lower: BracketMatch[] };
  isDoubleElimination?: boolean;
  isEditable?: boolean;
  onMatchClick?: (matchId: string | null, match: BracketMatch) => void;
}

interface RoundGroup {
  title: string;
  matches: BracketMatch[];
}

const SimpleBracket: React.FC<SimpleBracketProps> = ({
  matches,
  isDoubleElimination = false,
  isEditable = false,
  onMatchClick,
}) => {
  // Group matches by round
  const groupMatchesByRound = (matchList: BracketMatch[]): RoundGroup[] => {
    const roundMap = new Map<string, BracketMatch[]>();
    
    matchList.forEach(match => {
      const roundText = match.tournamentRoundText || 'Round';
      if (!roundMap.has(roundText)) {
        roundMap.set(roundText, []);
      }
      roundMap.get(roundText)!.push(match);
    });

    return Array.from(roundMap.entries()).map(([title, matches]) => ({
      title,
      matches,
    }));
  };

  const renderMatch = (match: BracketMatch) => {
    const team1 = match.participants[0];
    const team2 = match.participants[1];
    const isEmpty = match.isEmpty || (!team1 && !team2);

    const handleClick = () => {
      if (isEditable && onMatchClick) {
        const matchId = match.isEmpty ? null : match.originalMatchId || match.id;
        onMatchClick(matchId, match);
      }
    };

    return (
      <div
        key={match.id}
        onClick={handleClick}
        className={`
          border rounded-lg p-3 mb-3 bg-white shadow-sm
          ${isEditable ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}
          ${isEmpty ? 'border-dashed border-gray-300 opacity-60' : 'border-gray-200'}
        `}
        style={{ minWidth: '200px' }}
      >
        {/* Team 1 */}
        <div className={`flex justify-between items-center py-2 px-3 rounded ${
          team1?.isWinner ? 'bg-green-50 font-semibold' : 'bg-gray-50'
        }`}>
          <span className={isEmpty ? 'text-gray-400 italic' : ''}>
            {team1?.name || 'TBD'}
          </span>
          {team1?.resultText && (
            <span className="font-bold text-lg">{team1.resultText}</span>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-1"></div>

        {/* Team 2 */}
        <div className={`flex justify-between items-center py-2 px-3 rounded ${
          team2?.isWinner ? 'bg-green-50 font-semibold' : 'bg-gray-50'
        }`}>
          <span className={isEmpty ? 'text-gray-400 italic' : ''}>
            {team2?.name || 'TBD'}
          </span>
          {team2?.resultText && (
            <span className="font-bold text-lg">{team2.resultText}</span>
          )}
        </div>

        {/* Match info */}
        {match.startTime && !isEmpty && (
          <div className="mt-2 text-xs text-gray-500 text-center">
            {new Date(match.startTime).toLocaleDateString('en-US', { timeZone: MATCH_TIMEZONE })}
          </div>
        )}

        {/* Empty state message */}
        {isEmpty && isEditable && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xs text-gray-400">Click to add match</span>
          </div>
        )}
      </div>
    );
  };

  const renderBracket = (matchList: BracketMatch[], title?: string) => {
    if (!matchList || matchList.length === 0) {
      return (
        <div className="flex items-center justify-center p-8 text-gray-500">
          No matches to display
        </div>
      );
    }

    const rounds = groupMatchesByRound(matchList);

    return (
      <div className="sp-tournament-bracket">
        {title && (
          <h3 className="text-lg font-semibold mb-4">{title}</h3>
        )}
        <div className="flex gap-6 overflow-x-auto pb-4">
          {rounds.map((round, idx) => (
            <div key={idx} className="flex-shrink-0">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">
                {round.title}
              </h4>
              <div className="flex flex-col justify-around" style={{ minHeight: '300px' }}>
                {round.matches.map(match => renderMatch(match))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Handle double elimination
  if (isDoubleElimination) {
    const doubleElimMatches = Array.isArray(matches)
      ? { upper: matches, lower: [] }
      : matches;

    return (
      <div className="sp-tournament-bracket-double space-y-8">
        {renderBracket(doubleElimMatches.upper, 'Upper Bracket')}
        {doubleElimMatches.lower && doubleElimMatches.lower.length > 0 && (
          renderBracket(doubleElimMatches.lower, 'Lower Bracket')
        )}
      </div>
    );
  }

  // Handle single elimination
  const singleElimMatches = Array.isArray(matches)
    ? matches
    : matches.upper || [];

  return (
    <div className="sp-tournament-bracket-single">
      {renderBracket(singleElimMatches)}
    </div>
  );
};

export default SimpleBracket;
