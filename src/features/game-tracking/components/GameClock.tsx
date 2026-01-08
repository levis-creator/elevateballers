/**
 * Game Clock Component
 * Displays and controls the game clock
 */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatClockTime } from '../lib/utils';
import { Play, Pause } from 'lucide-react';
import type { GameStateData } from '../types';
import { useGameTrackingStore } from '../stores/useGameTrackingStore';

interface GameClockProps {
  gameState: GameStateData | null;
  onToggleClock: () => void;
  onStartGame?: () => void;
  isLoading?: boolean;
}

export default function GameClock({
  gameState,
  onToggleClock,
  onStartGame,
  isLoading = false,
}: GameClockProps) {
  const { localClockSeconds, setLocalClockSeconds } = useGameTrackingStore();

  // Sync with backend state - only when clock is paused or initial load
  useEffect(() => {
    // Only sync when clock is NOT running (paused) to avoid interrupting countdown
    if (!gameState?.clockRunning) {
      if (gameState?.clockSeconds !== null && gameState?.clockSeconds !== undefined) {
        setLocalClockSeconds(gameState.clockSeconds);
      } else {
        setLocalClockSeconds(null);
      }
    }
  }, [gameState?.clockSeconds, gameState?.clockRunning, setLocalClockSeconds]);

  // Local countdown timer - only runs when clock is running
  useEffect(() => {
    if (!gameState || !gameState.clockRunning) {
      return;
    }

    const interval = setInterval(() => {
      setLocalClockSeconds((prev) => {
        if (prev === null || prev <= 0) {
          return prev;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState?.clockRunning, gameState, setLocalClockSeconds]);

  // Calculate display time from local clock seconds
  const displayTime = localClockSeconds !== null ? formatClockTime(localClockSeconds) : '00:00';

  if (!gameState) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="text-4xl font-bold mb-4">00:00</div>
            {onStartGame && (
              <Button onClick={onStartGame} disabled={isLoading}>
                Start Game
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center">
          <div className="text-5xl font-bold mb-4 font-mono">{displayTime}</div>
          <div className="flex items-center justify-center gap-2">
            <Button
              onClick={onToggleClock}
              disabled={isLoading}
              variant={gameState.clockRunning ? 'destructive' : 'default'}
              size="lg"
            >
              {gameState.clockRunning ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
