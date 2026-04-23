/**
 * Game tracking Zustand store
 * Manages game state and real-time updates
 */

import { create } from 'zustand';
import type { GameStateData } from '../../types';

/** Clamp clock seconds: null stays null, negative becomes 0. */
const clampClock = (seconds: number | null | undefined): number | null =>
  seconds == null ? null : Math.max(0, seconds);

interface GameTrackingState {
  gameState: GameStateData | null;
  localClockSeconds: number | null;
  isLoading: boolean;
  error: string | null;
  matchId: string | null;
  isToggling: boolean; // Flag to prevent multiple simultaneous toggle requests
  isUpdating: boolean; // Flag to skip polling while a mutation is in-flight

  // Actions
  setMatchId: (matchId: string) => void;
  setGameState: (state: GameStateData) => void;
  setLocalClockSeconds: (seconds: number | null | ((prev: number | null) => number | null)) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchGameState: (matchId: string) => Promise<void>;
  updateGameState: (matchId: string, updates: Partial<GameStateData>) => Promise<void>;
  startGame: (matchId: string, gameRulesId?: string) => Promise<void>;
  endGame: (matchId: string) => Promise<void>;
  toggleClock: (matchId: string, running?: boolean) => Promise<void>;
  reset: () => void;
}

export const useGameTrackingStore = create<GameTrackingState>((set, get) => ({
  gameState: null,
  localClockSeconds: null,
  isLoading: false,
  error: null,
  matchId: null,
  isToggling: false,
  isUpdating: false,

  setMatchId: (matchId) => set({ matchId }),

  setGameState: (state) => set((prev) => {
    // Don't overwrite localClockSeconds while the clock is running —
    // the web worker is the source of truth during countdown.
    const keepLocalClock = prev.gameState?.clockRunning && state.clockRunning;
    return {
      gameState: state,
      localClockSeconds: keepLocalClock ? prev.localClockSeconds : clampClock(state?.clockSeconds),
      error: null,
    };
  }),

  setLocalClockSeconds: (seconds) => set((state) => {
    const newSeconds = typeof seconds === 'function' ? seconds(state.localClockSeconds) : seconds;
    // Validate: prevent negative clock values
    const validatedSeconds = newSeconds !== null && newSeconds < 0 ? 0 : newSeconds;
    return { localClockSeconds: validatedSeconds };
  }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  fetchGameState: async (matchId) => {
    // Skip polling while a mutation (updateGameState, toggleClock, etc.) is in-flight
    // to avoid overwriting optimistic state with stale server data.
    if (get().isUpdating) return;

    // Only show loading spinner on initial fetch (when no gameState exists yet).
    // Background polls should NOT set isLoading — it disables all buttons.
    const isInitialFetch = get().gameState === null;
    if (isInitialFetch) {
      set({ isLoading: true, error: null });
    }
    try {
      const response = await fetch(`/api/games/${matchId}/state`);
      if (!response.ok) {
        // 404 means game state doesn't exist yet (match hasn't started)
        // This is normal, not an error
        if (response.status === 404) {
          set({ gameState: null, localClockSeconds: null, isLoading: false, error: null });
          return;
        }
        throw new Error('Failed to fetch game state');
      }
      const state = await response.json();

      // Compute accurate clock from server timestamp when running
      let computedClock: number | null;
      if (state?.clockRunning && state?.clockStartedAt && state?.clockSecondsAtStart != null) {
        const elapsed = Math.floor((Date.now() - new Date(state.clockStartedAt).getTime()) / 1000);
        computedClock = Math.max(0, state.clockSecondsAtStart - elapsed);
      } else {
        const serverClockSeconds = state?.clockSeconds ?? null;
        computedClock = serverClockSeconds !== null && serverClockSeconds < 0 ? 0 : serverClockSeconds;
      }

      // Don't overwrite localClockSeconds from the worker when the clock is running —
      // the worker is the source of truth for display while running.
      const currentlyRunning = get().gameState?.clockRunning;
      const updates: any = {
        gameState: state,
        isLoading: false,
        error: null,
      };
      if (!currentlyRunning || !state.clockRunning) {
        updates.localClockSeconds = computedClock;
      }

      set(updates);
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  updateGameState: async (matchId, updates) => {
    // --- Optimistic update: merge into local state immediately so possession
    // toggles, period changes, and clock tweaks reflect without waiting for
    // the server round-trip. Matches the pattern already used by toggleClock.
    const previousState = get().gameState;
    const previousLocalClock = get().localClockSeconds;

    if (previousState) {
      const optimisticState = { ...previousState, ...updates };
      const optimisticLocalClock =
        'clockSeconds' in updates && updates.clockSeconds !== undefined
          ? clampClock(updates.clockSeconds)
          : previousLocalClock;
      set({
        gameState: optimisticState,
        localClockSeconds: optimisticLocalClock,
        isUpdating: true,
        error: null,
      });
    } else {
      set({ isUpdating: true, error: null });
    }

    // --- Background persist ---
    try {
      // Map period to currentPeriod for API compatibility
      const apiUpdates: any = { ...updates };
      if ('period' in apiUpdates) {
        apiUpdates.currentPeriod = apiUpdates.period;
        delete apiUpdates.period;
      }

      const response = await fetch(`/api/games/${matchId}/state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiUpdates),
      });
      if (!response.ok) {
        throw new Error('Failed to update game state');
      }
      const updatedState = await response.json();
      const validatedClockSeconds = clampClock(updatedState?.clockSeconds);

      set({
        gameState: updatedState,
        localClockSeconds: validatedClockSeconds,
        isUpdating: false,
      });
    } catch (error: any) {
      // Revert optimistic update on failure
      set({
        gameState: previousState,
        localClockSeconds: previousLocalClock,
        error: error.message,
        isUpdating: false,
      });
    }
  },

  startGame: async (matchId, gameRulesId) => {
    set({ isLoading: true, isUpdating: true, error: null });
    try {
      const response = await fetch(`/api/games/${matchId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameRulesId }),
      });
      if (!response.ok) {
        throw new Error('Failed to start game');
      }
      const state = await response.json();
      const validatedClockSeconds = clampClock(state?.clockSeconds);

      set({
        gameState: state,
        localClockSeconds: validatedClockSeconds,
        isLoading: false,
        isUpdating: false,
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false, isUpdating: false });
    }
  },

  endGame: async (matchId) => {
    set({ isLoading: true, isUpdating: true, error: null });
    try {
      const response = await fetch(`/api/games/${matchId}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        throw new Error('Failed to end game');
      }
      const state = await response.json();
      const validatedClockSeconds = clampClock(state?.clockSeconds);

      set({
        gameState: state,
        localClockSeconds: validatedClockSeconds,
        isLoading: false,
        isUpdating: false,
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false, isUpdating: false });
    }
  },

  toggleClock: async (matchId, running) => {
    // Prevent multiple simultaneous toggle requests
    if (get().isToggling) return;

    const currentGameState = get().gameState;
    if (!currentGameState) return;

    const currentLocalClock = get().localClockSeconds;
    const currentRunning = currentGameState.clockRunning ?? false;
    const newRunning = running !== undefined ? running : !currentRunning;

    // --- Optimistic update: update UI immediately, persist in background ---
    const now = new Date().toISOString();
    const clockSecondsNow = currentLocalClock ?? currentGameState.clockSeconds ?? 0;

    const optimisticState = {
      ...currentGameState,
      clockRunning: newRunning,
      // When resuming: set the anchor so the worker can start immediately
      // When pausing: clear the anchor and persist the remaining seconds
      clockStartedAt: newRunning ? now : null,
      clockSecondsAtStart: newRunning ? clockSecondsNow : null,
      clockSeconds: clockSecondsNow,
    };

    set({
      gameState: optimisticState,
      localClockSeconds: clockSecondsNow,
      isToggling: true,
      isUpdating: true,
      error: null,
    });

    // --- Background persist ---
    try {
      const requestBody: any = { running: newRunning };
      if (!newRunning && currentRunning && currentLocalClock !== null) {
        requestBody.clockSeconds = currentLocalClock;
      }

      const response = await fetch(`/api/games/${matchId}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) throw new Error('Failed to toggle clock');

      const serverState = await response.json();
      // Reconcile with server — but don't overwrite localClockSeconds if running
      // because the worker is already ticking
      const updates: any = {
        gameState: serverState,
        isToggling: false,
        isUpdating: false,
      };
      if (!serverState.clockRunning) {
        updates.localClockSeconds = clampClock(serverState.clockSeconds);
      }
      set(updates);
    } catch (error: any) {
      // Revert optimistic update on failure
      set({
        gameState: currentGameState,
        localClockSeconds: currentLocalClock,
        error: error.message,
        isToggling: false,
        isUpdating: false,
      });
    }
  },

  reset: () => set({
    gameState: null,
    localClockSeconds: null,
    isLoading: false,
    isUpdating: false,
    error: null,
    matchId: null,
    isToggling: false,
  }),
}));
