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
  isToggling: boolean; // Flag to prevent multiple simultaneous toggle requests

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

  setMatchId: (matchId) => set({ matchId }),

  setGameState: (state) => {
    // Validate and ensure localClockSeconds is properly initialized from gameState
    const clockSeconds = state?.clockSeconds ?? null;
    const validatedClockSeconds = clockSeconds !== null && clockSeconds < 0 ? 0 : clockSeconds;
    set({ 
      gameState: state, 
      localClockSeconds: validatedClockSeconds,
      error: null 
    });
  },

  setLocalClockSeconds: (seconds) => set((state) => {
    const newSeconds = typeof seconds === 'function' ? seconds(state.localClockSeconds) : seconds;
    // Validate: prevent negative clock values
    const validatedSeconds = newSeconds !== null && newSeconds < 0 ? 0 : newSeconds;
    return { localClockSeconds: validatedSeconds };
  }),

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
      
      // Validate clock seconds - prevent negative values
      const serverClockSeconds = state?.clockSeconds ?? null;
      const validatedClockSeconds = serverClockSeconds !== null && serverClockSeconds < 0 
        ? 0 
        : serverClockSeconds;
      
      set({ 
        gameState: state, 
        localClockSeconds: shouldUpdateClock ? validatedClockSeconds : currentLocalClock,
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
      // Validate clock seconds - prevent negative values
      const clockSeconds = updatedState?.clockSeconds ?? null;
      const validatedClockSeconds = clockSeconds !== null && clockSeconds < 0 ? 0 : clockSeconds;
      
      set({ 
        gameState: updatedState, 
        localClockSeconds: validatedClockSeconds,
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
      // Validate clock seconds - prevent negative values
      const clockSeconds = state?.clockSeconds ?? null;
      const validatedClockSeconds = clockSeconds !== null && clockSeconds < 0 ? 0 : clockSeconds;
      
      set({ 
        gameState: state, 
        localClockSeconds: validatedClockSeconds,
        isLoading: false 
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  endGame: async (matchId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/games/${matchId}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        throw new Error('Failed to end game');
      }
      const state = await response.json();
      // Validate clock seconds - prevent negative values
      const clockSeconds = state?.clockSeconds ?? null;
      const validatedClockSeconds = clockSeconds !== null && clockSeconds < 0 ? 0 : clockSeconds;
      
      set({ 
        gameState: state, 
        localClockSeconds: validatedClockSeconds,
        isLoading: false 
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  toggleClock: async (matchId, running) => {
    // Prevent multiple simultaneous toggle requests
    if (get().isToggling) {
      return;
    }
    
    set({ isLoading: true, error: null, isToggling: true });
    try {
      const currentGameState = get().gameState;
      const currentLocalClock = get().localClockSeconds;
      const currentRunning = currentGameState?.clockRunning ?? false;
      
      // Determine the new running state: use provided value, or toggle if undefined
      const newRunning = running !== undefined ? running : !currentRunning;
      
      // When pausing (transitioning from running to stopped), send local clock seconds to save it
      // When resuming (stopped to running), don't send clock seconds - let server use its stored value
      const requestBody: any = { running: newRunning };
      if (newRunning === false && currentRunning === true && currentLocalClock !== null) {
        // Pausing: send the current local clock seconds
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
      // Validate clock seconds - prevent negative values
      const clockSeconds = state?.clockSeconds ?? null;
      const validatedClockSeconds = clockSeconds !== null && clockSeconds < 0 ? 0 : clockSeconds;
      
      set({ 
        gameState: state, 
        localClockSeconds: validatedClockSeconds,
        isLoading: false,
        isToggling: false
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false, isToggling: false });
    }
  },

  reset: () => set({ 
    gameState: null, 
    localClockSeconds: null,
    isLoading: false, 
    error: null, 
    matchId: null,
    isToggling: false
  }),
}));
