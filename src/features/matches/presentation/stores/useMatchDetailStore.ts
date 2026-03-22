import { create } from 'zustand';
import type { MatchWithFullDetails } from '@/lib/types';

interface MatchDetailStore {
  matchId: string;
  match: MatchWithFullDetails | null;
  loading: boolean;
  error: string;

  // Modal visibility
  showAddPlayerModal: boolean;
  showAddEventModal: boolean;
  showEditPlayerModal: boolean;
  editingMatchPlayerId: string | null;
  editEventId: string | null;

  // Destructive action state
  deleteEventId: string | null;
  deletePlayerId: string | null;
  deletingPlayer: boolean;

  // Game control dialogs
  showStartGameDialog: boolean;
  showEndGameDialog: boolean;
  isStartingGame: boolean;
  isEndingGame: boolean;

  // Refresh trigger for QuickEventButtons / SubstitutionPanel
  playerRefreshTrigger: number;

  // Pagination
  page1: number;
  page2: number;

  // Lifecycle
  init: (matchId: string, initialMatch?: any) => Promise<void>;

  // Data fetching
  silentRefresh: () => Promise<void>;
  fetchMatchDetails: () => Promise<void>;

  // Modal actions
  setShowAddPlayerModal: (show: boolean) => void;
  openEditPlayer: (id: string) => void;
  closeEditPlayer: () => void;
  openAddEvent: () => void;
  openEditEvent: (id: string) => void;
  closeEventModal: () => void;
  setDeleteEventId: (id: string | null) => void;
  setDeletePlayerId: (id: string | null) => void;
  setShowStartGameDialog: (show: boolean) => void;
  setShowEndGameDialog: (show: boolean) => void;

  // Mutations
  deletePlayer: () => Promise<void>;
  deleteEvent: () => Promise<void>;
  startGame: () => Promise<void>;
  endGame: () => Promise<void>;

  // Post-mutation hooks
  onPlayerMutationSuccess: () => Promise<void>;
  onEventMutationSuccess: () => Promise<void>;

  // Pagination
  setPage1: (page: number) => void;
  setPage2: (page: number) => void;

  bumpPlayerRefresh: () => void;
}

export const useMatchDetailStore = create<MatchDetailStore>((set, get) => ({
  matchId: '',
  match: null,
  loading: false,
  error: '',

  showAddPlayerModal: false,
  showAddEventModal: false,
  showEditPlayerModal: false,
  editingMatchPlayerId: null,
  editEventId: null,

  deleteEventId: null,
  deletePlayerId: null,
  deletingPlayer: false,

  showStartGameDialog: false,
  showEndGameDialog: false,
  isStartingGame: false,
  isEndingGame: false,

  playerRefreshTrigger: 0,
  page1: 1,
  page2: 1,

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  init: async (matchId, initialMatch) => {
    const hasInitial = !!initialMatch?.id;
    set({
      matchId,
      match: hasInitial
        ? { ...initialMatch, matchPlayers: [], events: [] }
        : null,
      loading: !hasInitial,
      error: '',
      showAddPlayerModal: false,
      showAddEventModal: false,
      showEditPlayerModal: false,
      editingMatchPlayerId: null,
      editEventId: null,
      deleteEventId: null,
      deletePlayerId: null,
      deletingPlayer: false,
      showStartGameDialog: false,
      showEndGameDialog: false,
      isStartingGame: false,
      isEndingGame: false,
      playerRefreshTrigger: 0,
      page1: 1,
      page2: 1,
    });

    if (!hasInitial) {
      try {
        const res = await fetch(`/api/matches/${matchId}`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Failed to fetch match' }));
          throw new Error(err.error || `Server returned ${res.status}`);
        }
        const data = await res.json();
        if (!data?.id) throw new Error('Invalid match data received');
        set({
          match: { ...data, matchPlayers: data.matchPlayers || [], events: data.events || [] },
          loading: false,
        });
      } catch (err: any) {
        set({ error: err.message || 'Failed to load match', loading: false });
        return;
      }
    }

    await get().fetchMatchDetails();
  },

  // ─── Data fetching ────────────────────────────────────────────────────────

  /**
   * Fetches match core (scores, status), players, and events in parallel
   * without toggling the full-page loading state. Used by GameTrackingPanel's
   * onRefresh so the header score stays current during live games.
   */
  silentRefresh: async () => {
    const { matchId } = get();
    try {
      const [matchRes, playersRes, eventsRes] = await Promise.all([
        fetch(`/api/matches/${matchId}`),
        fetch(`/api/matches/${matchId}/players`),
        fetch(`/api/matches/${matchId}/events`),
      ]);

      const matchData = matchRes.ok ? await matchRes.json() : null;
      const players = playersRes.ok ? await playersRes.json() : null;
      const events = eventsRes.ok ? await eventsRes.json() : null;

      set((state) => {
        if (!state.match) return state;
        return {
          match: {
            ...state.match,
            ...(matchData && {
              team1Score: matchData.team1Score,
              team2Score: matchData.team2Score,
              status: matchData.status,
            }),
            ...(players && { matchPlayers: players }),
            ...(events && { events }),
          },
        };
      });
    } catch (err) {
      console.warn('Silent refresh failed:', err);
    }
  },

  /**
   * Fetches players and events only. Used after mutations where match
   * core data (scores, status) hasn't changed.
   */
  fetchMatchDetails: async () => {
    const { matchId } = get();
    try {
      const [playersRes, eventsRes] = await Promise.all([
        fetch(`/api/matches/${matchId}/players`),
        fetch(`/api/matches/${matchId}/events`),
      ]);

      if (!playersRes.ok) throw new Error('Failed to fetch match players');
      if (!eventsRes.ok) throw new Error('Failed to fetch match events');

      const [players, events] = await Promise.all([
        playersRes.json(),
        eventsRes.json(),
      ]);

      set((state) => {
        if (!state.match) return state;
        return { match: { ...state.match, matchPlayers: players || [], events: events || [] } };
      });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load match details' });
    }
  },

  // ─── Modal actions ────────────────────────────────────────────────────────

  setShowAddPlayerModal: (show) => set({ showAddPlayerModal: show }),

  openEditPlayer: (id) => set({ editingMatchPlayerId: id, showEditPlayerModal: true }),
  closeEditPlayer: () => set({ editingMatchPlayerId: null, showEditPlayerModal: false }),

  openAddEvent: () => set({ editEventId: null, showAddEventModal: true }),
  openEditEvent: (id) => set({ editEventId: id, showAddEventModal: true }),
  closeEventModal: () => set({ editEventId: null, showAddEventModal: false }),

  setDeleteEventId: (id) => set({ deleteEventId: id }),
  setDeletePlayerId: (id) => set({ deletePlayerId: id }),
  setShowStartGameDialog: (show) => set({ showStartGameDialog: show }),
  setShowEndGameDialog: (show) => set({ showEndGameDialog: show }),

  // ─── Mutations ────────────────────────────────────────────────────────────

  deletePlayer: async () => {
    const { matchId, deletePlayerId } = get();
    if (!deletePlayerId) return;
    set({ deletingPlayer: true });
    try {
      const res = await fetch(`/api/matches/${matchId}/players/${deletePlayerId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to remove player');
      set({ deletePlayerId: null });
      await get().onPlayerMutationSuccess();
    } catch (err: any) {
      set({ error: err.message || 'Failed to remove player', deletePlayerId: null });
    } finally {
      set({ deletingPlayer: false });
    }
  },

  deleteEvent: async () => {
    const { matchId, deleteEventId } = get();
    if (!deleteEventId) return;
    try {
      const res = await fetch(`/api/matches/${matchId}/events/${deleteEventId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete event');
      set({ deleteEventId: null });
      await get().onEventMutationSuccess();
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete event', deleteEventId: null });
    }
  },

  startGame: async () => {
    const { matchId } = get();
    set({ isStartingGame: true, showStartGameDialog: false });
    try {
      const res = await fetch(`/api/games/${matchId}/start`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to start game');
      window.location.reload();
    } catch (err: any) {
      set({ error: err.message || 'Failed to start game', isStartingGame: false });
    }
  },

  endGame: async () => {
    const { matchId } = get();
    set({ isEndingGame: true, showEndGameDialog: false });
    try {
      const res = await fetch(`/api/games/${matchId}/end`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to end game');
      window.location.reload();
    } catch (err: any) {
      set({ error: err.message || 'Failed to end game', isEndingGame: false });
    }
  },

  // ─── Post-mutation hooks ──────────────────────────────────────────────────

  onPlayerMutationSuccess: async () => {
    await get().silentRefresh();
    get().bumpPlayerRefresh();
  },

  onEventMutationSuccess: async () => {
    await get().fetchMatchDetails();
  },

  // ─── Pagination ───────────────────────────────────────────────────────────

  setPage1: (page) => set({ page1: page }),
  setPage2: (page) => set({ page2: page }),

  bumpPlayerRefresh: () =>
    set((state) => ({ playerRefreshTrigger: state.playerRefreshTrigger + 1 })),
}));
