/**
 * Game Clock Component
 * Displays and controls the game clock
 */

import { useCallback, useEffect, useRef, useState } from 'react';
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
import { formatClockTime, parseClockTime, getPeriodLabel, isOvertimePeriod } from '../../lib/utils';
import { Play, Pause, Settings, RotateCcw, Plus, Minus } from 'lucide-react';
import type { GameStateData } from '../../types';
import { useGameTrackingStore } from '../../stores/useGameTrackingStore';
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

  // Web Worker ref — one worker instance per component mount
  const workerRef = useRef<Worker | null>(null);

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
  const [isSaving, setIsSaving] = useState(false);

  // Persist a clock value to the backend with visual feedback
  const saveClockSeconds = useCallback(async (seconds: number) => {
    if (!match) return;
    setIsSaving(true);
    try {
      await updateGameState(match.id, { clockSeconds: seconds });
    } finally {
      setIsSaving(false);
    }
  }, [match, updateGameState]);

  // Sync local clock with server state when the clock is paused or the
  // server anchor changes (pause/resume/period change).  When the clock is
  // running the web worker is the single source of truth — we don't touch
  // localClockSeconds here to avoid fighting the worker.
  useEffect(() => {
    if (!gameState) return;

    if (!gameState.clockRunning) {
      // Paused — display whatever the server says
      setLocalClockSeconds(gameState.clockSeconds ?? null);
    }
    // When running, the worker effect (below) handles the initial sync
    // and then ticks it down.  We intentionally do NOT update here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.clockRunning, gameState?.clockSeconds, setLocalClockSeconds]);

  // Track the set duration for the current quarter - update when quarter changes
  const previousPeriodRef = useRef<number | null>(null);
  const setDurationRef = useRef(setDuration);
  setDurationRef.current = setDuration;

  useEffect(() => {
    if (!gameState) return;

    const isOvertime = isOvertimePeriod(gameState.period, numberOfPeriods);
    const periodDurationMinutes = isOvertime ? overtimeLength : minutesPerPeriod;
    const periodDurationSeconds = periodDurationMinutes * 60;

    // Initialize on first load, or reset when quarter changes
    if (setDurationRef.current === null || (previousPeriodRef.current !== null && previousPeriodRef.current !== gameState.period)) {
      setSetDuration(periodDurationSeconds);
    }

    previousPeriodRef.current = gameState.period;
  }, [gameState?.period, numberOfPeriods, minutesPerPeriod, overtimeLength]);

  // Ref to track if auto-pause was triggered to prevent multiple triggers
  const autoPauseTriggeredRef = useRef(false);
  const localClockRef = useRef(localClockSeconds);
  localClockRef.current = localClockSeconds;

  // Auto-pause when clock reaches 0.
  // Uses a ref guard that is ONLY reset when the clock is explicitly started
  // again (clockStartedAt changes), preventing repeated triggers.
  useEffect(() => {
    if (!gameState?.clockRunning) return;

    const checkInterval = setInterval(() => {
      if (
        localClockRef.current !== null &&
        localClockRef.current <= 0 &&
        !autoPauseTriggeredRef.current
      ) {
        autoPauseTriggeredRef.current = true;
        clearInterval(checkInterval); // stop checking immediately
        onToggleClock();
      }
    }, 500);

    return () => clearInterval(checkInterval);
  }, [gameState?.clockRunning, onToggleClock]);

  // Only reset the auto-pause guard when the clock is freshly started
  // (new clockStartedAt), not on every clockRunning change.
  useEffect(() => {
    if (gameState?.clockStartedAt) {
      autoPauseTriggeredRef.current = false;
    }
  }, [gameState?.clockStartedAt]);

  // Terminate worker on unmount
  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  // Web-Worker-based countdown — runs off the main thread, timestamp-based
  // so it never drifts even when the tab is hidden or the JS thread is busy.
  // Depends on clockRunning AND the server anchor (clockStartedAt) so it
  // restarts with the correct time after pause/resume.
  useEffect(() => {
    // Lazily create the worker on first use
    if (!workerRef.current && typeof Worker !== 'undefined') {
      workerRef.current = new Worker('/workers/timer.worker.js');
    }

    const worker = workerRef.current;
    if (!worker) return;

    const isActive = !!(gameState?.clockRunning && gameState?.clockStartedAt && gameState?.clockSecondsAtStart != null);
    let cancelled = false;

    if (isActive) {
      // Compute accurate remaining from server timestamp
      const elapsed = Math.floor((Date.now() - new Date(gameState!.clockStartedAt!).getTime()) / 1000);
      const remaining = Math.max(0, gameState!.clockSecondsAtStart! - elapsed);

      if (remaining > 0) {
        worker.postMessage({ type: 'START', remainingSeconds: remaining });
      } else {
        worker.postMessage({ type: 'STOP' });
      }

      worker.onmessage = (e: MessageEvent) => {
        if (cancelled) return; // Ignore late TICKs after pause
        const { type: msgType, remainingSeconds } = e.data;
        if (msgType === 'TICK') {
          setLocalClockSeconds(remainingSeconds);
        }
      };
    } else {
      // Clock is paused or not initialized — stop the worker and ignore any in-flight ticks
      worker.postMessage({ type: 'STOP' });
      worker.onmessage = null;
    }

    return () => {
      cancelled = true;
      worker.postMessage({ type: 'STOP' });
      worker.onmessage = null;
    };
  }, [gameState?.clockRunning, gameState?.clockStartedAt, gameState?.clockSecondsAtStart, setLocalClockSeconds]);

  // Keyboard shortcuts — use refs so the listener doesn't re-register on every tick
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const onToggleClockRef = useRef(onToggleClock);
  onToggleClockRef.current = onToggleClock;

  useEffect(() => {
    if (!isMatchLive) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      const gs = gameStateRef.current;

      if (e.code === 'Space') {
        e.preventDefault();
        if (gs) onToggleClockRef.current();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!gs?.clockRunning && gs && match) {
          const seconds = e.shiftKey ? 10 : 1;
          const newSeconds = Math.max(0, (localClockRef.current ?? 0) + seconds);
          setLocalClockSeconds(newSeconds);
          saveClockSeconds(newSeconds);
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!gs?.clockRunning && gs && match) {
          const seconds = e.shiftKey ? -10 : -1;
          const newSeconds = Math.max(0, (localClockRef.current ?? 0) + seconds);
          setLocalClockSeconds(newSeconds);
          saveClockSeconds(newSeconds);
        }
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        if (gs) setShowResetConfirm(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
    // Stable deps only — callbacks and state read via refs to avoid re-registering on every tick
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMatchLive, match, setLocalClockSeconds, saveClockSeconds]);

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
    setSetDuration(parsedSeconds);
    await saveClockSeconds(parsedSeconds);
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
    setSetDuration(parsedSeconds);
    await saveClockSeconds(parsedSeconds);
  };

  // Adjust time by seconds (only when paused)
  const adjustTime = async (seconds: number) => {
    if (!gameState || !match || gameState.clockRunning || !isMatchLive) return;

    const newSeconds = Math.max(0, (localClockSeconds ?? 0) + seconds);
    setLocalClockSeconds(newSeconds);
    await saveClockSeconds(newSeconds);
  };

  // Handle reset - reset to the duration that was set (manually or quarter start)
  const handleReset = async () => {
    if (!gameState || !match || gameState.clockRunning || !isMatchLive) return;

    let resetSeconds: number;
    if (setDuration !== null) {
      resetSeconds = setDuration;
    } else {
      const isOvertime = isOvertimePeriod(gameState.period, numberOfPeriods);
      const periodDurationMinutes = isOvertime ? overtimeLength : minutesPerPeriod;
      resetSeconds = periodDurationMinutes * 60;
    }

    setLocalClockSeconds(resetSeconds);
    setShowResetConfirm(false);
    await saveClockSeconds(resetSeconds);
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
            {isSaving && <span className="ml-2 text-blue-500 animate-pulse">Saving...</span>}
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
              disabled={isToggling || !isMatchLive}
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
