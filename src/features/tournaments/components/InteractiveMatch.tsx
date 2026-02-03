/**
 * Interactive Match Component
 * Renders a single bracket match with click handlers and visual indicators for editable brackets.
 * No longer uses @g-loot/react-tournament-brackets (replaced with SimpleBracket).
 */

import React from 'react';
import type { BracketMatch } from '../lib/bracket-converter';

interface InteractiveMatchProps {
  match: BracketMatch;
  onMatchClick?: (matchId: string | null, match: BracketMatch) => void;
  isEditable?: boolean;
}

const InteractiveMatch: React.FC<InteractiveMatchProps> = ({
  match,
  onMatchClick,
  isEditable = false,
}) => {
  const team1 = match.participants[0];
  const team2 = match.participants[1];
  const isEmpty = match.isEmpty || (!team1 && !team2);

  const handleClick = (e: React.MouseEvent) => {
    if (isEditable && onMatchClick) {
      e.stopPropagation();
      const matchId = match.isEmpty ? null : match.originalMatchId || match.id;
      onMatchClick(matchId, match);
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isEditable && !isEmpty) {
      e.currentTarget.style.backgroundColor = '#f8f9fa';
      e.currentTarget.style.transition = 'background-color 0.2s';
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.backgroundColor = '';
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        cursor: isEditable ? 'pointer' : 'default',
        ...(isEmpty && {
          opacity: 0.6,
          border: isEditable ? '2px dashed #cbd5e1' : '1px solid #e2e8f0',
          borderRadius: '4px',
          padding: '4px',
        }),
      }}
      className={`border rounded-lg p-3 bg-white shadow-sm ${isEmpty ? 'empty-match-slot' : 'editable-match'} ${isEditable ? 'hover:bg-gray-50' : ''}`}
    >
      <div
        className={`flex justify-between items-center py-2 px-3 rounded ${team1?.isWinner ? 'bg-green-50 font-semibold' : 'bg-gray-50'}`}
      >
        <span className={isEmpty ? 'text-gray-400 italic' : ''}>
          {team1?.name || 'TBD'}
        </span>
        {team1?.resultText != null && (
          <span className="font-bold text-lg">{team1.resultText}</span>
        )}
      </div>
      <div className="border-t border-gray-200 my-1" />
      <div
        className={`flex justify-between items-center py-2 px-3 rounded ${team2?.isWinner ? 'bg-green-50 font-semibold' : 'bg-gray-50'}`}
      >
        <span className={isEmpty ? 'text-gray-400 italic' : ''}>
          {team2?.name || 'TBD'}
        </span>
        {team2?.resultText != null && (
          <span className="font-bold text-lg">{team2.resultText}</span>
        )}
      </div>
      {match.startTime && !isEmpty && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          {new Date(match.startTime).toLocaleDateString()}
        </div>
      )}
      {isEmpty && isEditable && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '12px',
            color: '#64748b',
            fontWeight: 500,
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          Click to add match
        </div>
      )}
    </div>
  );
};

export default InteractiveMatch;
