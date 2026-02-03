/**
 * Tournament Bracket Component
 * Uses SimpleBracket for React 19 compatibility
 */

import React from 'react';
import SimpleBracket from './SimpleBracket';
import type { BracketMatch } from '../lib/bracket-converter';

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

const TournamentBracket: React.FC<TournamentBracketProps> = ({ 
  matches, 
  isDoubleElimination = false,
  isEditable = false,
  onMatchClick,
}) => {
  // Validate matches before rendering
  const isValidBracketMatch = (match: any): match is BracketMatch => {
    return (
      match &&
      typeof match === 'object' &&
      typeof match.id === 'string' &&
      Array.isArray(match.participants) &&
      match.participants.length >= 0 &&
      match.participants.every((p: any) => 
        typeof p === 'object' && 
        typeof p.id === 'string' && 
        typeof p.name === 'string'
      )
    );
  };

  // Handle different match formats
  let processedMatches: BracketMatch[] | { upper: BracketMatch[]; lower: BracketMatch[] };

  if (isDoubleElimination) {
    if (Array.isArray(matches)) {
      processedMatches = { upper: matches.filter(isValidBracketMatch), lower: [] };
    } else if (matches && typeof matches === 'object' && 'upper' in matches && 'lower' in matches) {
      processedMatches = {
        upper: Array.isArray(matches.upper) ? matches.upper.filter(isValidBracketMatch) : [],
        lower: Array.isArray(matches.lower) ? matches.lower.filter(isValidBracketMatch) : [],
      };
    } else {
      processedMatches = { upper: [], lower: [] };
    }
  } else {
    if (Array.isArray(matches)) {
      processedMatches = matches.filter(isValidBracketMatch);
    } else if (matches && typeof matches === 'object' && 'upper' in matches) {
      processedMatches = Array.isArray(matches.upper) ? matches.upper.filter(isValidBracketMatch) : [];
    } else {
      processedMatches = [];
    }
  }

  return (
    <SimpleBracket
      matches={processedMatches}
      isDoubleElimination={isDoubleElimination}
      isEditable={isEditable}
      onMatchClick={onMatchClick}
    />
  );
};

export default TournamentBracket;
