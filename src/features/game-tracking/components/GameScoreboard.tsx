/**
 * Game Scoreboard Component
 * Displays scores, fouls, timeouts, and quarter information
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  getPeriodLabel, 
  getBonusStatus, 
  getFoulsUntilBonus,
  calculateScoreDifference
} from '../lib/utils';
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

  const team1Bonus = getBonusStatus(gameState.team1Fouls, foulsForBonus);
  const team2Bonus = getBonusStatus(gameState.team2Fouls, foulsForBonus);
  
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
          <Badge variant="outline" className="text-lg">
            {getPeriodLabel(gameState.period)}
          </Badge>
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
