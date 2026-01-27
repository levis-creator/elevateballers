/**
 * Game Tracking Panel Component
 * Main component that combines scoreboard, clock, and controls
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import GameScoreboard from './GameScoreboard';
import GameClock from './GameClock';
import PlayByPlayLog from './PlayByPlayLog';
import TimeoutControls from './TimeoutControls';
import SubstitutionPanel from './SubstitutionPanel';
import QuickEventButtons from './QuickEventButtons';
import { useGameTrackingStore } from '../stores/useGameTrackingStore';
import { Play, AlertCircle } from 'lucide-react';
import type { Match } from '@prisma/client';
import { getTeam1Name, getTeam2Name, getTeam1Logo, getTeam2Logo } from '../../matches/lib/team-helpers';

interface GameTrackingPanelProps {
  matchId: string;
  match: Match | null;
}

export default function GameTrackingPanel({ matchId, match }: GameTrackingPanelProps) {
  const {
    gameState,
    isLoading,
    error,
    fetchGameState,
    startGame,
    endGame,
    toggleClock,
    updateGameState,
    localClockSeconds,
  } = useGameTrackingStore();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [timerWarning, setTimerWarning] = useState<string | null>(null);

  useEffect(() => {
    if (matchId) {
      fetchGameState(matchId);
      // Set up polling for live games (every 2 seconds)
      const interval = setInterval(() => {
        if (match?.status === 'LIVE') {
          fetchGameState(matchId);
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [matchId, match?.status, fetchGameState]);

  const handleStartGame = async () => {
    await startGame(matchId);
  };

  const handleEndGame = async () => {
    if (window.confirm('Are you sure you want to end this game? This action cannot be undone.')) {
      await endGame(matchId);
      // Refresh match data
      if (match) {
        window.location.reload();
      }
    }
  };

  const handleToggleClock = async () => {
    // Check if timer is set before allowing start
    if (!gameState?.clockRunning) {
      // Timer is paused, check if it's set before allowing start
      if (localClockSeconds === null || localClockSeconds === 0) {
        setTimerWarning('Please set the timer duration before starting. Use the Settings button or click on the timer to set the time.');
        // Auto-dismiss after 5 seconds
        setTimeout(() => setTimerWarning(null), 5000);
        return;
      }
    }
    // Clear any existing warning when successfully toggling
    setTimerWarning(null);
    await toggleClock(matchId);
  };

  const handleEventRecorded = async () => {
    await fetchGameState(matchId);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handlePeriodChange = async (newPeriod: number) => {
    await updateGameState(matchId, {
      currentPeriod: newPeriod,
    });
  };

  const team1Name = match ? getTeam1Name(match) : undefined;
  const team2Name = match ? getTeam2Name(match) : undefined;
  const team1Logo = match ? getTeam1Logo(match) : undefined;
  const team2Logo = match ? getTeam2Logo(match) : undefined;

  // Show loading only on initial load (when no gameState exists yet)
  if (isLoading && !gameState && !error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Show error only if there's an actual error (not just missing gameState)
  if (error && !gameState) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // If no gameState but no error, game hasn't started yet - show UI anyway

  return (
    <div className="space-y-4">
      {/* Timer Warning Alert */}
      {timerWarning && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{timerWarning}</AlertDescription>
        </Alert>
      )}

      {/* End Game Button - Prominently displayed for live games */}
      {match?.status === 'LIVE' && (
        <Card className="border-red-500 border-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Game is Live</h3>
                <p className="text-sm text-muted-foreground">Click below to end the game</p>
              </div>
              <Button
                onClick={handleEndGame}
                disabled={isLoading}
                variant="destructive"
                size="lg"
                className="min-w-[150px]"
              >
                {isLoading ? 'Ending...' : 'End Game'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Scoreboard */}
        <div className="md:col-span-2">
          <GameScoreboard
            gameState={gameState}
            match={match}
            team1Name={team1Name}
            team2Name={team2Name}
            team1Logo={team1Logo}
            team2Logo={team2Logo}
            team1Id={match?.team1Id || null}
            team2Id={match?.team2Id || null}
            onPeriodChange={handlePeriodChange}
          />
        </div>

        {/* Clock */}
        <div>
          <GameClock
            gameState={gameState}
            match={match}
            onToggleClock={handleToggleClock}
            onStartGame={match?.status !== 'LIVE' ? handleStartGame : undefined}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Controls Grid */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <TimeoutControls
            matchId={matchId}
            match={match}
            gameState={gameState}
            onTimeoutRecorded={() => fetchGameState(matchId)}
          />
        </div>
        <div className="flex-1">
          <SubstitutionPanel
            matchId={matchId}
            match={match}
            gameState={gameState}
            onSubstitutionRecorded={handleEventRecorded}
            refreshTrigger={refreshTrigger}
          />
        </div>
        <div className="flex-1">
          <QuickEventButtons
            matchId={matchId}
            match={match}
            gameState={gameState}
            onEventRecorded={handleEventRecorded}
            refreshTrigger={refreshTrigger}
          />
        </div>
      </div>

      {/* Play-by-Play Log */}
      <PlayByPlayLog matchId={matchId} onRefresh={() => fetchGameState(matchId)} />
    </div>
  );
}
