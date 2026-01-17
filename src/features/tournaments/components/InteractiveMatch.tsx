/**
 * Interactive Match Component
 * Wraps the default Match component from @g-loot/react-tournament-brackets
 * to add click handlers and visual indicators for editable brackets
 */

import React from 'react';
import { Match } from '@g-loot/react-tournament-brackets';
import type { BracketMatch } from '../lib/bracket-converter';

interface InteractiveMatchProps {
  match: BracketMatch;
  onMatchClick?: (matchId: string | null, match: BracketMatch) => void;
  isEditable?: boolean;
}

const InteractiveMatch: React.FC<InteractiveMatchProps> = ({ 
  match, 
  onMatchClick,
  isEditable = false 
}) => {
  const handleClick = (e: React.MouseEvent) => {
    if (isEditable && onMatchClick) {
      e.stopPropagation();
      const matchId = match.isEmpty ? null : match.originalMatchId || match.id;
      onMatchClick(matchId, match);
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isEditable && !match.isEmpty) {
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
        ...(match.isEmpty && {
          opacity: 0.6,
          border: isEditable ? '2px dashed #cbd5e1' : '1px solid #e2e8f0',
          borderRadius: '4px',
          padding: '4px',
        }),
      }}
      className={match.isEmpty ? 'empty-match-slot' : 'editable-match'}
    >
      <Match match={match} />
      {match.isEmpty && isEditable && (
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
