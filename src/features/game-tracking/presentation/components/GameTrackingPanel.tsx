/**
 * Game Tracking Panel Component
 * Main component that combines scoreboard, clock, and controls
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import GameScoreboard from './GameScoreboard';
import GameClock from './GameClock';
import PlayByPlayLog from './PlayByPlayLog';
import TimeoutControls from './TimeoutControls';
import SubstitutionPanel from './SubstitutionPanel';
import QuickEventButtons from './QuickEventButtons';
import { useGameTrackingStore } from '../../stores/useGameTrackingStore';
import { AlertCircle } from 'lucide-react';
import type { MatchWithGameState } from '../../types';
import { getTeam1Name, getTeam2Name, getTeam1Logo, getTeam2Logo } from '../../../matches/lib/team-helpers';

interface GameTrackingPanelProps {
  matchId: string;
  match: MatchWithGameState | null;
  onRefresh?: () => void;
}

export default function GameTrackingPanel({ matchId, match, onRefresh }: GameTrackingPanelProps) {
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
  const [eventsRefreshTrigger, setEventsRefreshTrigger] = useState(0);   // play-by-play
  const [timerWarning, setTimerWarning] = useState<string | null>(null);
  const [isEndingGame, setIsEndingGame] = useState(false);

  // Match players come directly from the parent (MatchDetailView owns the
  // roster card and refetches after every edit). Reading them here means any
  // add/edit/remove on that card is immediately reflected in the
  // Substitution and Quick Event panels without a duplicate fetch.
  const matchPlayers = useMemo(() => match?.matchPlayers ?? [], [match?.matchPlayers]);

  useEffect(() => {
    if (!matchId) return;
    fetchGameState(matchId);

    // Pause polling when the tab is hidden to save resources
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && match?.status === 'LIVE') {
        fetchGameState(matchId);
      }
    }, 10000);

    // Refetch immediately when the tab becomes visible again
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && match?.status === 'LIVE') {
        fetchGameState(matchId);
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [matchId, match?.status, fetchGameState]);

  const handleStartGame = async () => {
    await startGame(matchId);
    // Initial game start — starters get marked server-side. Ask the parent to
    // refetch so match.matchPlayers carries isActive=true for the starters.
    setEventsRefreshTrigger((p) => p + 1);
    if (onRefresh) onRefresh();
  };

  const handleEndGame = async () => {
    if (window.confirm('Are you sure you want to end this game? This action cannot be undone.')) {
      setIsEndingGame(true);
      try {
        await endGame(matchId);
        if (onRefresh) onRefresh();
      } catch {
        // keep button enabled so user can retry
      } finally {
        setIsEndingGame(false);
      }
    }
  };

  const handleToggleClock = () => {
    // Check if timer is set before allowing start
    if (!gameState?.clockRunning) {
      if (localClockSeconds === null || localClockSeconds === 0) {
        setTimerWarning('Please set the timer duration before starting. Use the Settings button or click on the timer to set the time.');
        setTimeout(() => setTimerWarning(null), 5000);
        return;
      }
    }
    setTimerWarning(null);
    // Fire and forget — store handles optimistic update + background persist
    toggleClock(matchId);
  };

  // Generic event recorded — only refreshes play-by-play + game state (score/fouls)
  // Does NOT refetch match players (those don't change on scoring events)
  const handleEventRecorded = async () => {
    await fetchGameState(matchId);
    setEventsRefreshTrigger((p) => p + 1);
    if (onRefresh) onRefresh();
  };

  // Substitution recorded — parent refresh brings back updated matchPlayers
  // (isActive flipped on both sides), which flows through to the children.
  const handleSubstitutionRecorded = async () => {
    await fetchGameState(matchId);
    setEventsRefreshTrigger((p) => p + 1);
    if (onRefresh) onRefresh();
  };

  const handlePeriodChange = async (newPeriod: number) => {
    await updateGameState(matchId, {
      period: newPeriod,
    });
  };

  const handlePossessionChange = async (targetTeamId: string) => {
    await updateGameState(matchId, {
      possessionTeamId: targetTeamId,
    });

    // Record possession change as an event so it appears in play-by-play
    if (match) {
      const teamName = targetTeamId === match.team1Id ? getTeam1Name(match) : getTeam2Name(match);
      const currentPeriod = gameState?.period ?? 1;
      const minutesPerPeriod = match.gameRules?.minutesPerPeriod ?? 10;
      const secondsInPeriod = (localClockSeconds ?? gameState?.clockSeconds ?? (minutesPerPeriod * 60));
      const elapsedSecondsInPeriod = (minutesPerPeriod * 60) - secondsInPeriod;
      const calculatedMinute = ((currentPeriod - 1) * minutesPerPeriod) + Math.floor(elapsedSecondsInPeriod / 60) + 1;

      await fetch(`/api/matches/${matchId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'OTHER',
          teamId: targetTeamId,
          description: `Possession: ${teamName}`,
          minute: calculatedMinute,
          period: currentPeriod,
          secondsRemaining: localClockSeconds ?? gameState?.clockSeconds ?? null,
        }),
      });
    }

    await handleEventRecorded();
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
                disabled={isEndingGame}
                variant="destructive"
                size="lg"
                className="min-w-[150px]"
              >
                {isEndingGame ? 'Ending...' : 'End Game'}
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
            onPossessionChange={handlePossessionChange}
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
            onSubstitutionRecorded={handleSubstitutionRecorded}
            matchPlayers={matchPlayers}
          />
        </div>
        <div className="flex-1">
          <QuickEventButtons
            matchId={matchId}
            match={match}
            gameState={gameState}
            onEventRecorded={handleEventRecorded}
            matchPlayers={matchPlayers}
          />
        </div>
      </div>

      {/* Play-by-Play Log */}
      <PlayByPlayLog
        matchId={matchId}
        onRefresh={() => fetchGameState(matchId)}
        refreshTrigger={eventsRefreshTrigger}
      />
    </div>
  );
}
