/**
 * Game Scoreboard Component
 * Displays scores, fouls, timeouts, and quarter information
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getPeriodLabel, getBonusStatus } from '../lib/utils';
import type { GameStateData } from '../types';
import type { Match } from '@prisma/client';

interface GameScoreboardProps {
  gameState: GameStateData | null;
  match: Match | null;
  team1Name?: string;
  team2Name?: string;
  team1Logo?: string | null;
  team2Logo?: string | null;
  foulsForBonus?: number;
}

export default function GameScoreboard({
  gameState,
  match,
  team1Name,
  team2Name,
  team1Logo,
  team2Logo,
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">
          <Badge variant="outline" className="text-lg">
            {getPeriodLabel(gameState.period)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Team 1 */}
          <div className="text-center">
            <div className="font-bold text-lg mb-2">{team1Name || 'Team 1'}</div>
            {team1Logo && (
              <img
                src={team1Logo}
                alt={team1Name || 'Team 1'}
                className="w-16 h-16 mx-auto mb-2 object-contain"
              />
            )}
            <div className="text-4xl font-bold mb-2">{gameState.team1Score}</div>
            <div className="space-y-1 text-sm">
              <div>Fouls: {gameState.team1Fouls}</div>
              {team1Bonus && (
                <Badge variant="secondary" className="text-xs">
                  {team1Bonus}
                </Badge>
              )}
              <div>Timeouts: {gameState.team1Timeouts}</div>
            </div>
          </div>

          {/* Team 2 */}
          <div className="text-center">
            <div className="font-bold text-lg mb-2">{team2Name || 'Team 2'}</div>
            {team2Logo && (
              <img
                src={team2Logo}
                alt={team2Name || 'Team 2'}
                className="w-16 h-16 mx-auto mb-2 object-contain"
              />
            )}
            <div className="text-4xl font-bold mb-2">{gameState.team2Score}</div>
            <div className="space-y-1 text-sm">
              <div>Fouls: {gameState.team2Fouls}</div>
              {team2Bonus && (
                <Badge variant="secondary" className="text-xs">
                  {team2Bonus}
                </Badge>
              )}
              <div>Timeouts: {gameState.team2Timeouts}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
