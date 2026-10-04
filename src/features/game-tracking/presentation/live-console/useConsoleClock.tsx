/**
 * Game clock. The timer worker ticks whole seconds into the store (same
 * protocol GameClock uses). The console itself never subscribes to those
 * ticks — only ClockText does — so a running clock doesn't redraw the floor,
 * the action pad or the play-by-play every second.
 */
import { useEffect, useRef, useState } from 'react';
import { useGameTrackingStore } from '../stores/useGameTrackingStore';
import type { GameStateData } from '../../types';

/** Runs the countdown worker. Doesn't re-render its host on ticks. */
export function useClockWorker(gameState: GameStateData | null, onExpire: () => void) {
  const setLocalClockSeconds = useGameTrackingStore((s) => s.setLocalClockSeconds);
  const workerRef = useRef<Worker | null>(null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  const expiredRef = useRef(false);

  const running = !!gameState?.clockRunning;
  const startedAt = gameState?.clockStartedAt ?? null;
  const atStart = gameState?.clockSecondsAtStart ?? null;

  // Paused: show what the server says.
  useEffect(() => {
    if (gameState && !gameState.clockRunning) setLocalClockSeconds(gameState.clockSeconds ?? null);
  }, [gameState?.clockRunning, gameState?.clockSeconds, setLocalClockSeconds]);

  useEffect(() => {
    if (startedAt) expiredRef.current = false;
  }, [startedAt]);

  useEffect(() => () => {
    workerRef.current?.terminate();
    workerRef.current = null;
  }, []);

  useEffect(() => {
    if (!workerRef.current && typeof Worker !== 'undefined') {
      workerRef.current = new Worker('/workers/timer.worker.js');
    }
    const worker = workerRef.current;
    if (!worker) return;
    let cancelled = false;
    const expire = () => {
      setLocalClockSeconds(0);
      if (!expiredRef.current) {
        expiredRef.current = true;
        onExpireRef.current();
      }
    };

    if (running && startedAt && atStart != null) {
      const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
      const remaining = Math.max(0, atStart - elapsed);
      if (remaining > 0) worker.postMessage({ type: 'START', remainingSeconds: remaining });
      else expire();
      worker.onmessage = (e: MessageEvent) => {
        if (cancelled) return;
        if (e.data.type === 'TICK') setLocalClockSeconds(e.data.remainingSeconds);
        else if (e.data.type === 'EXPIRED') expire();
      };
    } else {
      worker.postMessage({ type: 'STOP' });
      worker.onmessage = null;
    }
    return () => {
      cancelled = true;
      worker.postMessage({ type: 'STOP' });
      worker.onmessage = null;
    };
  }, [running, startedAt, atStart, setLocalClockSeconds]);
}

/** Seconds left right now, read without subscribing. */
export function clockNow(): number | null {
  const s = useGameTrackingStore.getState();
  return s.localClockSeconds ?? s.gameState?.clockSeconds ?? null;
}

/** Live clock seconds for small widgets that should re-render each tick. */
export function useClockSeconds(): number | null {
  return useGameTrackingStore((s) => s.localClockSeconds ?? s.gameState?.clockSeconds ?? null);
}

/** The scoreboard digits: m:ss, with tenths in the last minute while running. */
export function ClockText({ half, className }: { half: boolean; className: string }) {
  const seconds = useClockSeconds();
  const gs = useGameTrackingStore((s) => s.gameState);
  const startedAt = gs?.clockRunning ? gs.clockStartedAt : null;
  const atStart = gs?.clockSecondsAtStart ?? null;
  const lastMinute = !!startedAt && atStart != null && (seconds ?? 99) <= 60;
  const [precise, setPrecise] = useState<number | null>(null);
  useEffect(() => {
    if (!lastMinute) {
      setPrecise(null);
      return;
    }
    const t0 = new Date(startedAt!).getTime();
    const id = setInterval(() => setPrecise(Math.max(0, atStart! - (Date.now() - t0) / 1000)), 100);
    return () => clearInterval(id);
  }, [lastMinute, startedAt, atStart]);

  const text = half ? 'HALF' : precise != null && precise < 60 && precise > 0 ? precise.toFixed(1) : mmss(seconds);
  return <span className={className}>{text}</span>;
}

export function mmss(seconds: number | null | undefined): string {
  const t = Math.max(0, Math.ceil(seconds ?? 0));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}
