/**
 * Game Scoreboard Component
 * Displays scores, fouls, timeouts, and quarter information
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  getPeriodLabel, 
  getBonusStatus, 
  getFoulsUntilBonus,
  calculateScoreDifference,
  isOvertimePeriod
} from '../lib/utils';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { GameStateData } from '../types';
import type { Match } from '@prisma/client';

interface GameScoreboardProps {
  gameState: GameStateData | null;
  match: Match | null;
  team1Name?: string;
  team2Name?: string;
  team1Logo?: string | null;
  team2Logo?: string | null;
  team1Id?: string | null;
  team2Id?: string | null;
  foulsForBonus?: number;
  onPeriodChange?: (period: number) => void;
}

export default function GameScoreboard({
  gameState,
  match,
  team1Name,
  team2Name,
  team1Logo,
  team2Logo,
  team1Id,
  team2Id,
  foulsForBonus = 5,
  onPeriodChange,
}: GameScoreboardProps) {
  if (!gameState || !match) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">No game data available</div>
        </CardContent>
      </Card>
    );
  }

  // Extract gameRules from match with fallback defaults
  const gameRules = match?.gameRules;
  const numberOfPeriods = gameRules?.numberOfPeriods ?? 4;
  const halftimePeriod = gameRules?.halftimePeriod ?? 2;
  const isMatchLive = match?.status === 'LIVE';

  const team1Bonus = getBonusStatus(gameState.team1Fouls, foulsForBonus);
  const team2Bonus = getBonusStatus(gameState.team2Fouls, foulsForBonus);

  // Handle period change
  const handlePeriodChange = async (newPeriod: number) => {
    if (!gameState || !match || gameState.clockRunning || !isMatchLive || !onPeriodChange) return;
    onPeriodChange(newPeriod);
  };
  
  // Calculate score difference
  const scoreDiff = calculateScoreDifference(gameState.team1Score, gameState.team2Score);
  
  // Check possession
  const team1HasPossession = team1Id && gameState.possessionTeamId === team1Id;
  const team2HasPossession = team2Id && gameState.possessionTeamId === team2Id;
  
  // Calculate fouls until bonus
  const team1FoulsUntilBonus = getFoulsUntilBonus(gameState.team1Fouls, foulsForBonus);
  const team2FoulsUntilBonus = getFoulsUntilBonus(gameState.team2Fouls, foulsForBonus);
  
  // Calculate fouls progress percentage (capped at 100%)
  const team1FoulsProgress = Math.min(100, (gameState.team1Fouls / (foulsForBonus * 2)) * 100);
  const team2FoulsProgress = Math.min(100, (gameState.team2Fouls / (foulsForBonus * 2)) * 100);
  
  // Get fouls progress color
  const getFoulsProgressColor = (teamFouls: number) => {
    if (teamFouls >= foulsForBonus) return 'bg-red-500';
    if (teamFouls >= foulsForBonus - 1) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center space-y-2">
          {/* Score Difference / Lead Indicator */}
          {scoreDiff.leader !== 'tie' && scoreDiff.diff > 0 && (
            <div className={`text-sm font-medium ${
              scoreDiff.leader === 'team1' 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-blue-600 dark:text-blue-400'
            }`}>
              {scoreDiff.leader === 'team1' 
                ? `${team1Name || 'Team 1'} leading by ${scoreDiff.diff}`
                : `${team2Name || 'Team 2'} leading by ${scoreDiff.diff}`}
            </div>
          )}
          {scoreDiff.leader === 'tie' && (
            <div className="text-sm font-medium text-muted-foreground">
              Tied
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Quarter Selector - Centered above score */}
        {onPeriodChange && (
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Quarter:</span>
              <Button
                onClick={() => {
                  if (gameState.period > 1) {
                    handlePeriodChange(gameState.period - 1);
                  }
                }}
                variant="outline"
                size="sm"
                disabled={gameState.period <= 1 || gameState.clockRunning || !isMatchLive}
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
              <Select
                value={gameState.period.toString()}
                onValueChange={(value) => handlePeriodChange(parseInt(value))}
                disabled={gameState.clockRunning || !isMatchLive}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: numberOfPeriods + 5 }, (_, i) => i + 1).map((period) => (
                    <SelectItem key={period} value={period.toString()}>
                      {getPeriodLabel(period, numberOfPeriods, halftimePeriod)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => {
                  handlePeriodChange(gameState.period + 1);
                }}
                variant="outline"
                size="sm"
                disabled={gameState.clockRunning || !isMatchLive}
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
        {!onPeriodChange && (
          <div className="flex items-center justify-center mb-4">
            <Badge variant="outline" className="text-lg">
              {getPeriodLabel(gameState.period, numberOfPeriods, halftimePeriod)}
            </Badge>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          {/* Team 1 */}
          <div className={`text-center relative ${team1HasPossession ? 'ring-2 ring-primary rounded-lg p-2 -m-2' : ''}`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              {team1HasPossession && (
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              )}
              <div className="font-bold text-lg">{team1Name || 'Team 1'}</div>
            </div>
            {team1Logo && (
              <img
                src={team1Logo}
                alt={team1Name || 'Team 1'}
                className="w-16 h-16 mx-auto mb-2 object-contain"
              />
            )}
            <div className="text-4xl font-bold mb-2">{gameState.team1Score}</div>
            <div className="space-y-1 text-sm">
              <div className="space-y-1">
                <div>Fouls: {gameState.team1Fouls}</div>
                {/* Fouls Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${getFoulsProgressColor(gameState.team1Fouls)}`}
                    style={{ width: `${team1FoulsProgress}%` }}
                  />
                </div>
                {/* Fouls Until Bonus */}
                {team1FoulsUntilBonus > 0 ? (
                  <div className="text-xs text-muted-foreground">
                    {team1FoulsUntilBonus} foul{team1FoulsUntilBonus !== 1 ? 's' : ''} until bonus
                  </div>
                ) : (
                  team1Bonus && (
                    <Badge variant="secondary" className="text-xs">
                      {team1Bonus}
                    </Badge>
                  )
                )}
              </div>
              <div>Timeouts: {gameState.team1Timeouts}</div>
            </div>
          </div>

          {/* Team 2 */}
          <div className={`text-center relative ${team2HasPossession ? 'ring-2 ring-primary rounded-lg p-2 -m-2' : ''}`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              {team2HasPossession && (
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              )}
              <div className="font-bold text-lg">{team2Name || 'Team 2'}</div>
            </div>
            {team2Logo && (
              <img
                src={team2Logo}
                alt={team2Name || 'Team 2'}
                className="w-16 h-16 mx-auto mb-2 object-contain"
              />
            )}
            <div className="text-4xl font-bold mb-2">{gameState.team2Score}</div>
            <div className="space-y-1 text-sm">
              <div className="space-y-1">
                <div>Fouls: {gameState.team2Fouls}</div>
                {/* Fouls Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${getFoulsProgressColor(gameState.team2Fouls)}`}
                    style={{ width: `${team2FoulsProgress}%` }}
                  />
                </div>
                {/* Fouls Until Bonus */}
                {team2FoulsUntilBonus > 0 ? (
                  <div className="text-xs text-muted-foreground">
                    {team2FoulsUntilBonus} foul{team2FoulsUntilBonus !== 1 ? 's' : ''} until bonus
                  </div>
                ) : (
                  team2Bonus && (
                    <Badge variant="secondary" className="text-xs">
                      {team2Bonus}
                    </Badge>
                  )
                )}
              </div>
              <div>Timeouts: {gameState.team2Timeouts}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
