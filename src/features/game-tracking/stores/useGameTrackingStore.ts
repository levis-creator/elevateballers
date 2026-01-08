/**
 * Game tracking Zustand store
 * Manages game state and real-time updates
 */

import { create } from 'zustand';
import type { GameStateData } from '../types';

interface GameTrackingState {
  gameState: GameStateData | null;
  localClockSeconds: number | null;
  isLoading: boolean;
  error: string | null;
  matchId: string | null;

  // Actions
  setMatchId: (matchId: string) => void;
  setGameState: (state: GameStateData) => void;
  setLocalClockSeconds: (seconds: number | null | ((prev: number | null) => number | null)) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchGameState: (matchId: string) => Promise<void>;
  updateGameState: (matchId: string, updates: Partial<GameStateData>) => Promise<void>;
  startGame: (matchId: string, gameRulesId?: string) => Promise<void>;
  toggleClock: (matchId: string, running?: boolean) => Promise<void>;
  reset: () => void;
}

export const useGameTrackingStore = create<GameTrackingState>((set, get) => ({
  gameState: null,
  localClockSeconds: null,
  isLoading: false,
  error: null,
  matchId: null,

  setMatchId: (matchId) => set({ matchId }),

  setGameState: (state) => set({ 
    gameState: state, 
    localClockSeconds: state?.clockSeconds ?? null,
    error: null 
  }),

  setLocalClockSeconds: (seconds) => set((state) => ({ 
    localClockSeconds: typeof seconds === 'function' ? seconds(state.localClockSeconds) : seconds 
  })),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  fetchGameState: async (matchId) => {
    set({ isLoading: true, error: null });
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
      // Only update localClockSeconds if clock is not running (paused)
      // When clock is running, the local countdown should continue uninterrupted
      const currentLocalClock = get().localClockSeconds;
      const shouldUpdateClock = !state?.clockRunning;
      
      set({ 
        gameState: state, 
        localClockSeconds: shouldUpdateClock ? (state?.clockSeconds ?? null) : currentLocalClock,
        isLoading: false, 
        error: null 
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  updateGameState: async (matchId, updates) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/games/${matchId}/state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        throw new Error('Failed to update game state');
      }
      const updatedState = await response.json();
      set({ 
        gameState: updatedState, 
        localClockSeconds: updatedState?.clockSeconds ?? null,
        isLoading: false 
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  startGame: async (matchId, gameRulesId) => {
    set({ isLoading: true, error: null });
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
      set({ 
        gameState: state, 
        localClockSeconds: state?.clockSeconds ?? null,
        isLoading: false 
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  toggleClock: async (matchId, running) => {
    set({ isLoading: true, error: null });
    try {
      const currentLocalClock = get().localClockSeconds;
      const currentRunning = get().gameState?.clockRunning;
      // Determine if we're pausing: if currently running, we're pausing (toggling to false)
      const isPausing = currentRunning === true;
      
      // When pausing, send the current local clock seconds to save it
      const requestBody: any = { running };
      if (isPausing && currentLocalClock !== null) {
        requestBody.clockSeconds = currentLocalClock;
      }

      const response = await fetch(`/api/games/${matchId}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) {
        throw new Error('Failed to toggle clock');
      }
      const state = await response.json();
      set({ 
        gameState: state, 
        localClockSeconds: state?.clockSeconds ?? null,
        isLoading: false 
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  reset: () => set({ 
    gameState: null, 
    localClockSeconds: null,
    isLoading: false, 
    error: null, 
    matchId: null 
  }),
}));
