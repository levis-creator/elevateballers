import { create } from 'zustand';
import type { Player, Team, MatchEventWithDetails, MatchEventType } from '@/lib/types';

export interface EventFormData {
  eventType: MatchEventType;
  minute: string;
  teamId: string;
  playerId: string;
  assistPlayerId: string;
  description: string;
  period: string;
  secondsRemaining: string;
}

const DEFAULT_FORM: EventFormData = {
  eventType: 'TWO_POINT_MADE',
  minute: '',
  teamId: '',
  playerId: '',
  assistPlayerId: '',
  description: '',
  period: '',
  secondsRemaining: '',
};

interface MatchEventsStore {
  matchId: string;
  team1Id: string | null;
  team2Id: string | null;

  events: MatchEventWithDetails[];
  players: Player[];
  teams: Team[];
  gameState: Record<string, unknown> | null;
  matchStatus: string;

  loading: boolean;
  error: string;
  showAddForm: boolean;
  editEventId: string | null;
  deleteEventId: string | null;
  formData: EventFormData;

  init: (matchId: string, team1Id?: string | null, team2Id?: string | null) => Promise<void>;
  fetchEvents: () => Promise<void>;
  fetchTeams: () => Promise<void>;
  fetchPlayersForTeam: (teamId: string) => Promise<void>;
  fetchGameState: () => Promise<void>;
  fetchMatchStatus: () => Promise<void>;
  setShowAddForm: (show: boolean) => void;
  setDeleteEventId: (id: string | null) => void;
  updateForm: (data: Partial<EventFormData>) => void;
  addEvent: () => Promise<void>;
  startEdit: (eventId: string) => Promise<void>;
  updateEvent: () => Promise<void>;
  cancelEdit: () => void;
  deleteEvent: (id: string) => Promise<void>;
}

const resetForm = (
  teamId: string,
  gameState: Record<string, unknown> | null
): EventFormData => ({
  ...DEFAULT_FORM,
  teamId,
  period: gameState?.period ? String(gameState.period) : '',
  secondsRemaining: gameState?.clockSeconds != null ? String(gameState.clockSeconds) : '',
});

export const useMatchEventsStore = create<MatchEventsStore>((set, get) => ({
  matchId: '',
  team1Id: null,
  team2Id: null,

  events: [],
  players: [],
  teams: [],
  gameState: null,
  matchStatus: '',

  loading: true,
  error: '',
  showAddForm: false,
  editEventId: null,
  deleteEventId: null,
  formData: { ...DEFAULT_FORM },

  init: async (matchId, team1Id = null, team2Id = null) => {
    set({
      matchId, team1Id, team2Id,
      events: [], players: [], teams: [], gameState: null, matchStatus: '',
      loading: true, error: '', showAddForm: false,
      editEventId: null, deleteEventId: null,
      formData: { ...DEFAULT_FORM },
    });
    await Promise.all([
      get().fetchEvents(),
      get().fetchTeams(),
      get().fetchGameState(),
      get().fetchMatchStatus(),
    ]);
  },

  fetchEvents: async () => {
    const { matchId } = get();
    try {
      set({ loading: true });
      const res = await fetch(`/api/matches/${matchId}/events`);
      if (!res.ok) throw new Error('Failed to fetch match events');
      set({ events: await res.json(), loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load match events', loading: false });
    }
  },

  fetchTeams: async () => {
    const { team1Id, team2Id } = get();
    try {
      const res = await fetch('/api/teams');
      if (!res.ok) return;
      const data: Team[] = await res.json();
      set((state) => {
        const defaultTeam = team1Id || team2Id || (data[0]?.id ?? '');
        return {
          teams: data,
          formData: state.formData.teamId
            ? state.formData
            : { ...state.formData, teamId: defaultTeam },
        };
      });
    } catch (err) {
      console.error('Failed to fetch teams:', err);
    }
  },

  fetchPlayersForTeam: async (teamId) => {
    try {
      const res = await fetch(`/api/players?teamId=${teamId}`);
      if (res.ok) set({ players: await res.json() });
    } catch (err) {
      console.error('Failed to fetch players:', err);
    }
  },

  fetchGameState: async () => {
    const { matchId } = get();
    try {
      const res = await fetch(`/api/games/${matchId}/state`);
      if (res.ok) set({ gameState: await res.json() });
    } catch (err) {
      console.error('Failed to fetch game state:', err);
    }
  },

  fetchMatchStatus: async () => {
    const { matchId } = get();
    try {
      const res = await fetch(`/api/matches/${matchId}`);
      if (res.ok) {
        const match = await res.json();
        set({ matchStatus: match.status || '' });
      }
    } catch (err) {
      console.error('Failed to fetch match status:', err);
    }
  },

  setShowAddForm: (show) => {
    const { gameState, formData, editEventId } = get();
    if (show && !editEventId) {
      set({
        showAddForm: true,
        formData: {
          ...formData,
          period: formData.period || String((gameState?.period as number) || 1),
          secondsRemaining:
            formData.secondsRemaining ||
            (gameState?.clockSeconds != null ? String(gameState.clockSeconds) : ''),
        },
      });
    } else {
      set({ showAddForm: show });
    }
  },

  setDeleteEventId: (id) => set({ deleteEventId: id }),

  updateForm: (data) => set((state) => ({ formData: { ...state.formData, ...data } })),

  addEvent: async () => {
    const { matchId, matchStatus, formData, gameState, fetchEvents } = get();
    if (matchStatus === 'COMPLETED') {
      set({ error: 'Cannot add events to a completed match' });
      return;
    }
    set({ error: '' });
    try {
      const res = await fetch(`/api/matches/${matchId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          minute: parseInt(formData.minute),
          teamId: formData.teamId || undefined,
          playerId: formData.playerId || undefined,
          assistPlayerId: formData.assistPlayerId || undefined,
          period: formData.period ? parseInt(formData.period) : undefined,
          secondsRemaining: formData.secondsRemaining ? parseInt(formData.secondsRemaining) : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add event');
      }
      set({ showAddForm: false, formData: resetForm(formData.teamId, gameState) });
      await fetchEvents();
    } catch (err: any) {
      set({ error: err.message || 'Failed to add event' });
    }
  },

  startEdit: async (eventId) => {
    const { matchId, fetchPlayersForTeam } = get();
    try {
      const res = await fetch(`/api/matches/${matchId}/events/${eventId}`);
      if (!res.ok) throw new Error('Failed to fetch event');
      const event = await res.json();
      set({
        formData: {
          eventType: event.eventType,
          minute: String(event.minute || ''),
          teamId: event.teamId || '',
          playerId: event.playerId || '',
          assistPlayerId: event.assistPlayerId || '',
          description: event.description || '',
          period: event.period ? String(event.period) : '',
          secondsRemaining: event.secondsRemaining ? String(event.secondsRemaining) : '',
        },
        editEventId: eventId,
        showAddForm: true,
      });
      if (event.teamId) await fetchPlayersForTeam(event.teamId);
    } catch (err: any) {
      set({ error: err.message || 'Failed to load event for editing' });
    }
  },

  updateEvent: async () => {
    const { matchId, matchStatus, editEventId, formData, gameState, fetchEvents } = get();
    if (matchStatus === 'COMPLETED') {
      set({ error: 'Cannot edit events in a completed match' });
      return;
    }
    if (!editEventId) return;
    set({ error: '' });
    try {
      const res = await fetch(`/api/matches/${matchId}/events/${editEventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minute: parseInt(formData.minute),
          teamId: formData.teamId || undefined,
          playerId: formData.playerId || undefined,
          assistPlayerId: formData.assistPlayerId || undefined,
          period: formData.period ? parseInt(formData.period) : undefined,
          secondsRemaining: formData.secondsRemaining ? parseInt(formData.secondsRemaining) : undefined,
          description: formData.description || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update event');
      }
      set({ showAddForm: false, editEventId: null, formData: resetForm(formData.teamId, gameState) });
      await fetchEvents();
    } catch (err: any) {
      set({ error: err.message || 'Failed to update event' });
    }
  },

  cancelEdit: () => {
    const { formData, gameState } = get();
    set({ showAddForm: false, editEventId: null, formData: resetForm(formData.teamId, gameState) });
  },

  deleteEvent: async (id) => {
    const { matchId, matchStatus, fetchEvents } = get();
    if (matchStatus === 'COMPLETED') {
      set({ error: 'Cannot delete events from a completed match', deleteEventId: null });
      return;
    }
    try {
      const res = await fetch(`/api/matches/${matchId}/events/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete event');
      set({ deleteEventId: null });
      await fetchEvents();
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete event' });
    }
  },
}));
