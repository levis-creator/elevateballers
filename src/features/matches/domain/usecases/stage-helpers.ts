/**
 * Match stage helper functions
 * Utilities for working with match stages in basketball context
 */

import type { MatchStage } from '@prisma/client';

/**
 * Get display name for a match stage
 */
export function getStageDisplayName(stage: MatchStage | null | undefined): string {
  if (!stage) return '';
  
  const displayNames: Record<MatchStage, string> = {
    REGULAR_SEASON: 'Regular Season',
    PRESEASON: 'Preseason',
    EXHIBITION: 'Exhibition',
    PLAYOFF: 'Playoff',
    QUARTER_FINALS: 'Quarter Finals',
    SEMI_FINALS: 'Semi Finals',
    CHAMPIONSHIP: 'Championship',
    QUALIFIER: 'Qualifier',
    OTHER: 'Other',
  };
  
  return displayNames[stage] || stage;
}

/**
 * Get short display name for a match stage (for compact displays)
 */
export function getStageShortName(stage: MatchStage | null | undefined): string {
  if (!stage) return '';
  
  const shortNames: Record<MatchStage, string> = {
    REGULAR_SEASON: 'Regular',
    PRESEASON: 'Preseason',
    EXHIBITION: 'Exhibition',
    PLAYOFF: 'Playoff',
    QUARTER_FINALS: 'QF',
    SEMI_FINALS: 'SF',
    CHAMPIONSHIP: 'Final',
    QUALIFIER: 'Qualifier',
    OTHER: 'Other',
  };
  
  return shortNames[stage] || stage;
}

/**
 * Check if a stage is a playoff stage
 */
export function isPlayoffStage(stage: MatchStage | null | undefined): boolean {
  if (!stage) return false;
  return [
    'PLAYOFF',
    'QUARTER_FINALS',
    'SEMI_FINALS',
    'CHAMPIONSHIP',
  ].includes(stage);
}

/**
 * Check if a stage is a championship stage
 */
export function isChampionshipStage(stage: MatchStage | null | undefined): boolean {
  return stage === 'CHAMPIONSHIP';
}

/**
 * Get badge color class for a match stage
 */
export function getStageBadgeColor(stage: MatchStage | null | undefined): string {
  if (!stage) return 'bg-gray-500';
  
  const colors: Record<MatchStage, string> = {
    REGULAR_SEASON: 'bg-gray-500',
    PRESEASON: 'bg-blue-500',
    EXHIBITION: 'bg-purple-500',
    PLAYOFF: 'bg-orange-500',
    QUARTER_FINALS: 'bg-blue-600',
    SEMI_FINALS: 'bg-orange-600',
    CHAMPIONSHIP: 'bg-yellow-500',
    QUALIFIER: 'bg-green-500',
    OTHER: 'bg-gray-400',
  };
  
  return colors[stage] || 'bg-gray-500';
}

/**
 * Get stage priority for sorting (higher priority = more important)
 */
export function getStagePriority(stage: MatchStage | null | undefined): number {
  if (!stage) return 0;
  
  const priorities: Record<MatchStage, number> = {
    CHAMPIONSHIP: 10,
    SEMI_FINALS: 8,
    QUARTER_FINALS: 6,
    PLAYOFF: 5,
    QUALIFIER: 4,
    REGULAR_SEASON: 3,
    PRESEASON: 2,
    EXHIBITION: 1,
    OTHER: 0,
  };
  
  return priorities[stage] || 0;
}

