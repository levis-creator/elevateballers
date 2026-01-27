/**
 * Game Clock Component
 * Displays and controls the game clock
 */

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatClockTime, parseClockTime, getPeriodLabel, isOvertimePeriod } from '../lib/utils';
import { Play, Pause, Settings, RotateCcw, Plus, Minus } from 'lucide-react';
import type { GameStateData } from '../types';
import { useGameTrackingStore } from '../stores/useGameTrackingStore';
import type { Match } from '@prisma/client';

interface GameClockProps {
  gameState: GameStateData | null;
  match: Match | null;
  onToggleClock: () => void;
  onStartGame?: () => void;
  isLoading?: boolean;
}

export default function GameClock({
  gameState,
  match,
  onToggleClock,
  onStartGame,
  isLoading = false,
}: GameClockProps) {
  const { localClockSeconds, setLocalClockSeconds, updateGameState, isToggling } = useGameTrackingStore();
  
  // Check if match is live
  const isMatchLive = match?.status === 'LIVE';
  
  // Extract gameRules from match with fallback defaults
  const gameRules = match?.gameRules;
  const numberOfPeriods = gameRules?.numberOfPeriods ?? 4;
  const minutesPerPeriod = gameRules?.minutesPerPeriod ?? 10;
  const halftimePeriod = gameRules?.halftimePeriod ?? 2;
  const overtimeLength = gameRules?.overtimeLength ?? 5;
  
  // State management for dialogs and inputs
  const [showSettings, setShowSettings] = useState(false);
  const [durationInput, setDurationInput] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [timeInput, setTimeInput] = useState('');
  const [setDuration, setSetDuration] = useState<number | null>(null);

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

  // Track the set duration for the current quarter - update when quarter changes
  const previousPeriodRef = useRef<number | null>(null);
  useEffect(() => {
    if (!gameState) return;
    
    // When quarter changes, reset the set duration to the new quarter's default duration
    if (previousPeriodRef.current !== null && previousPeriodRef.current !== gameState.period) {
      const isOvertime = isOvertimePeriod(gameState.period, numberOfPeriods);
      const periodDurationMinutes = isOvertime ? overtimeLength : minutesPerPeriod;
      const periodDurationSeconds = periodDurationMinutes * 60;
      setSetDuration(periodDurationSeconds);
    } else if (setDuration === null) {
      // Initialize set duration on first load
      const isOvertime = isOvertimePeriod(gameState.period, numberOfPeriods);
      const periodDurationMinutes = isOvertime ? overtimeLength : minutesPerPeriod;
      const periodDurationSeconds = periodDurationMinutes * 60;
      setSetDuration(periodDurationSeconds);
    }
    
    previousPeriodRef.current = gameState.period;
  }, [gameState?.period, numberOfPeriods, minutesPerPeriod, overtimeLength, setDuration]);

  // Ref to track if auto-pause was triggered to prevent multiple triggers
  const autoPauseTriggeredRef = useRef(false);

  // Auto-pause when clock reaches 0
  useEffect(() => {
    if (
      gameState?.clockRunning &&
      localClockSeconds !== null &&
      localClockSeconds <= 0 &&
      !autoPauseTriggeredRef.current
    ) {
      autoPauseTriggeredRef.current = true;
      onToggleClock();
    }
    // Reset the ref when clock is not running or clock seconds changes to a positive value
    if (!gameState?.clockRunning || (localClockSeconds !== null && localClockSeconds > 0)) {
      autoPauseTriggeredRef.current = false;
    }
  }, [gameState?.clockRunning, localClockSeconds, onToggleClock]);

  // Local countdown timer - only runs when clock is running
  useEffect(() => {
    if (!gameState || !gameState.clockRunning) {
      return;
    }

    const interval = setInterval(() => {
      setLocalClockSeconds((prev) => {
        if (prev === null || prev <= 0) {
          return 0; // Stop at 0, prevent negative values
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState?.clockRunning, gameState, setLocalClockSeconds]);

  // Keyboard shortcuts
  useEffect(() => {
    // Disable keyboard shortcuts if match is not live
    if (!isMatchLive) {
      return;
    }

    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle if not typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (gameState && !isLoading) {
          onToggleClock();
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!gameState?.clockRunning && gameState && match) {
          const seconds = e.shiftKey ? 10 : 1;
          const newSeconds = Math.max(0, (localClockSeconds ?? 0) + seconds);
          setLocalClockSeconds(newSeconds);
          updateGameState(match.id, {
            clockSeconds: newSeconds,
          });
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!gameState?.clockRunning && gameState && match) {
          const seconds = e.shiftKey ? -10 : -1;
          const newSeconds = Math.max(0, (localClockSeconds ?? 0) + seconds);
          setLocalClockSeconds(newSeconds);
          updateGameState(match.id, {
            clockSeconds: newSeconds,
          });
        }
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        if (gameState) {
          setShowResetConfirm(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, isLoading, onToggleClock, localClockSeconds, match, setLocalClockSeconds, updateGameState, isMatchLive]);

  // Calculate display time from local clock seconds
  const displayTime = localClockSeconds !== null ? formatClockTime(localClockSeconds) : '00:00';

  // Get time color based on remaining time
  const getTimeColor = () => {
    if (localClockSeconds === null) return 'text-gray-900';
    if (localClockSeconds <= 30) return 'text-red-600';
    if (localClockSeconds <= 60) return 'text-yellow-600';
    return 'text-gray-900';
  };

  // Handle manual time input submission
  const handleTimeSubmit = async () => {
    if (!gameState || !match || !isMatchLive) return;

    const parsedSeconds = parseClockTime(timeInput);
    if (parsedSeconds === null || parsedSeconds < 0) {
      alert('Invalid time format. Use MM:SS');
      return;
    }

    setLocalClockSeconds(parsedSeconds);
    setIsEditingTime(false);
    // Update the set duration to the manually entered value
    setSetDuration(parsedSeconds);

    // Update backend
    await updateGameState(match.id, {
      clockSeconds: parsedSeconds,
    });
  };

  // Initialize settings dialog with current values
  const openSettings = () => {
    if (!gameState || !match) return;
    setDurationInput(formatClockTime(localClockSeconds ?? (minutesPerPeriod * 60)));
    setShowSettings(true);
  };

  // Handle duration change
  const handleDurationChange = async () => {
    if (!gameState || !match || gameState.clockRunning || !isMatchLive) return;

    const parsedSeconds = parseClockTime(durationInput);
    if (parsedSeconds === null || parsedSeconds < 0) {
      alert('Invalid time format. Use MM:SS');
      return;
    }

    setLocalClockSeconds(parsedSeconds);
    setShowSettings(false);
    // Update the set duration to the manually set value
    setSetDuration(parsedSeconds);

    // Update backend
    await updateGameState(match.id, {
      clockSeconds: parsedSeconds,
    });
  };

  // Adjust time by seconds (only when paused)
  const adjustTime = async (seconds: number) => {
    if (!gameState || !match || gameState.clockRunning || !isMatchLive) return;

    const newSeconds = Math.max(0, (localClockSeconds ?? 0) + seconds);
    setLocalClockSeconds(newSeconds);

    // Update backend
    await updateGameState(match.id, {
      clockSeconds: newSeconds,
    });
  };

  // Handle reset - reset to the duration that was set (manually or quarter start)
  const handleReset = async () => {
    if (!gameState || !match || gameState.clockRunning || !isMatchLive) return;

    // Use the set duration if available, otherwise fall back to quarter duration
    let resetSeconds: number;
    if (setDuration !== null) {
      resetSeconds = setDuration;
    } else {
      // Fallback to quarter duration if setDuration not initialized
      const isOvertime = isOvertimePeriod(gameState.period, numberOfPeriods);
      const periodDurationMinutes = isOvertime ? overtimeLength : minutesPerPeriod;
      resetSeconds = periodDurationMinutes * 60;
    }
    
    setLocalClockSeconds(resetSeconds);
    setShowResetConfirm(false);

    // Update backend
    await updateGameState(match.id, {
      clockSeconds: resetSeconds,
    });
  };

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

  const currentPeriodLabel = getPeriodLabel(
    gameState.period,
    numberOfPeriods,
    halftimePeriod
  );

  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-center space-y-3">
          {/* Quarter Display */}
          <div className="text-xs font-semibold text-muted-foreground">
            {currentPeriodLabel} Quarter
          </div>

          {/* Time Display */}
          <div
            className={`text-4xl font-bold font-mono ${getTimeColor()} transition-colors ${
              localClockSeconds !== null && localClockSeconds <= 30 && gameState.clockRunning
                ? 'animate-pulse'
                : ''
            }`}
            onClick={() => {
              if (!gameState.clockRunning && !isEditingTime && isMatchLive) {
                setIsEditingTime(true);
                setTimeInput(displayTime);
              }
            }}
            style={{ cursor: (gameState.clockRunning || !isMatchLive) ? 'default' : 'pointer' }}
          >
            {isEditingTime ? (
              <Input
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
                onBlur={handleTimeSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleTimeSubmit();
                  } else if (e.key === 'Escape') {
                    setIsEditingTime(false);
                  }
                }}
                className="text-4xl font-mono text-center w-28 mx-auto h-auto py-1"
                autoFocus
              />
            ) : (
              displayTime
            )}
          </div>

          {/* Main Controls */}
          <div className="flex items-center justify-center gap-2">
            <Button
              onClick={onToggleClock}
              disabled={isLoading || isToggling || !isMatchLive}
              variant={gameState.clockRunning ? 'destructive' : 'default'}
              size="default"
              className="flex-1"
            >
              {gameState.clockRunning ? (
                <>
                  <Pause className="w-4 h-4 mr-1.5" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-1.5" />
                  Start
                </>
              )}
            </Button>
            <Button
              onClick={openSettings}
              disabled={isLoading || gameState.clockRunning || !isMatchLive}
              variant="outline"
              size="default"
              className="px-3"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>

          {/* Quick Time Adjustments (only when paused and match is live) */}
          {!gameState.clockRunning && isMatchLive && (
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                <Button
                  onClick={() => adjustTime(30)}
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  className="h-8 px-2 text-xs"
                >
                  <Plus className="w-3 h-3 mr-0.5" />
                  30s
                </Button>
                <Button
                  onClick={() => adjustTime(10)}
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  className="h-8 px-2 text-xs"
                >
                  <Plus className="w-3 h-3 mr-0.5" />
                  10s
                </Button>
                <Button
                  onClick={() => adjustTime(5)}
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  className="h-8 px-2 text-xs"
                >
                  <Plus className="w-3 h-3 mr-0.5" />
                  5s
                </Button>
                <Button
                  onClick={() => adjustTime(-5)}
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  className="h-8 px-2 text-xs"
                >
                  <Minus className="w-3 h-3 mr-0.5" />
                  5s
                </Button>
                <Button
                  onClick={() => adjustTime(-10)}
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  className="h-8 px-2 text-xs"
                >
                  <Minus className="w-3 h-3 mr-0.5" />
                  10s
                </Button>
                <Button
                  onClick={() => adjustTime(-30)}
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  className="h-8 px-2 text-xs"
                >
                  <Minus className="w-3 h-3 mr-0.5" />
                  30s
                </Button>
              </div>
              <div className="flex items-center justify-center">
                <Button
                  onClick={() => setShowResetConfirm(true)}
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  className="h-8 px-3 text-xs"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Reset
                </Button>
              </div>
            </div>
          )}

          {/* Message when match is not live */}
          {!isMatchLive && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground text-center">
                Timer controls are disabled until match is live
              </p>
            </div>
          )}

          {/* Keyboard Shortcuts Hint */}
          <div className="text-[10px] text-muted-foreground pt-1">
            <div>Space: Play/Pause | ↑↓: Adjust Time | R: Reset</div>
          </div>
        </div>
      </CardContent>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Timer Settings</DialogTitle>
            <DialogDescription>
              Adjust duration. Changes only apply when timer is paused.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Duration Setting */}
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (MM:SS)</Label>
              <Input
                id="duration"
                value={durationInput}
                onChange={(e) => setDurationInput(e.target.value)}
                placeholder="10:00"
                className="font-mono"
                disabled={gameState.clockRunning || !isMatchLive}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleDurationChange}
              disabled={gameState.clockRunning || !isMatchLive}
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 font-bold uppercase">
              Reset Timer
            </DialogTitle>
            <DialogDescription>
              Reset timer to {formatClockTime(
                setDuration !== null 
                  ? setDuration 
                  : (gameState 
                    ? (isOvertimePeriod(gameState.period, numberOfPeriods) ? overtimeLength : minutesPerPeriod) * 60
                    : minutesPerPeriod * 60)
              )} (quarter start time)?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReset} disabled={!isMatchLive}>
              Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
