import { create } from 'zustand';
import type { Player, Team, MatchPlayerWithDetails } from '@/lib/types';

export interface PlayerToAdd {
  id: string;
  started: boolean;
}

interface MatchPlayersStore {
  matchId: string;
  team1Id: string | null;
  team2Id: string | null;

  players: MatchPlayerWithDetails[];
  availablePlayers: Player[];
  teams: Team[];

  loading: boolean;
  error: string;
  showAddForm: boolean;
  selectedTeam: string;
  deletePlayerId: string | null;
  selectedPlayerIds: string[];
  bulkUpdating: boolean;
  addingPlayers: boolean;
  playersToAdd: PlayerToAdd[];

  init: (matchId: string, team1Id?: string | null, team2Id?: string | null) => Promise<void>;
  fetchMatchPlayers: () => Promise<void>;
  fetchTeams: () => Promise<void>;
  fetchPlayersForTeam: (teamId: string) => Promise<void>;
  setShowAddForm: (show: boolean) => void;
  setSelectedTeam: (teamId: string) => void;
  setDeletePlayerId: (id: string | null) => void;
  togglePlayerToAdd: (playerId: string) => void;
  toggleStarterStatus: (playerId: string) => void;
  togglePlayerSelection: (matchPlayerId: string) => void;
  toggleAllPlayersForTeam: (teamId: string) => void;
  batchAddPlayers: (onPlayerAdded?: () => void) => Promise<void>;
  deletePlayer: (id: string, onPlayerAdded?: () => void) => Promise<void>;
  toggleStarter: (matchPlayerId: string, currentStarted: boolean, onPlayerAdded?: () => void) => Promise<void>;
  bulkStarterUpdate: (teamId: string, started: boolean, onPlayerAdded?: () => void) => Promise<void>;
}

export const useMatchPlayersStore = create<MatchPlayersStore>((set, get) => ({
  matchId: '',
  team1Id: null,
  team2Id: null,

  players: [],
  availablePlayers: [],
  teams: [],

  loading: true,
  error: '',
  showAddForm: false,
  selectedTeam: '',
  deletePlayerId: null,
  selectedPlayerIds: [],
  bulkUpdating: false,
  addingPlayers: false,
  playersToAdd: [],

  init: async (matchId, team1Id = null, team2Id = null) => {
    set({
      matchId, team1Id, team2Id,
      players: [], availablePlayers: [], teams: [],
      loading: true, error: '', showAddForm: false,
      selectedTeam: '', deletePlayerId: null,
      selectedPlayerIds: [], bulkUpdating: false,
      addingPlayers: false, playersToAdd: [],
    });
    await Promise.all([get().fetchMatchPlayers(), get().fetchTeams()]);
  },

  fetchMatchPlayers: async () => {
    const { matchId } = get();
    try {
      set({ loading: true });
      const res = await fetch(`/api/matches/${matchId}/players`);
      if (!res.ok) throw new Error('Failed to fetch match players');
      set({ players: await res.json(), loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load match players', loading: false });
    }
  },

  fetchTeams: async () => {
    const { team1Id, team2Id, selectedTeam } = get();
    try {
      const res = await fetch('/api/teams');
      if (!res.ok) return;
      const data: Team[] = await res.json();
      const defaultTeam = team1Id || team2Id || (data[0]?.id ?? '');
      set({
        teams: data,
        selectedTeam: selectedTeam || defaultTeam,
      });
      if (!selectedTeam && defaultTeam) {
        get().fetchPlayersForTeam(defaultTeam);
      }
    } catch (err) {
      console.error('Failed to fetch teams:', err);
    }
  },

  fetchPlayersForTeam: async (teamId) => {
    try {
      const res = await fetch(`/api/players?teamId=${teamId}`);
      if (!res.ok) return;
      const data: Player[] = await res.json();
      const existingIds = new Set(get().players.map((mp) => mp.playerId));
      set({ availablePlayers: data.filter((p) => !existingIds.has(p.id)) });
    } catch (err) {
      console.error('Failed to fetch players:', err);
    }
  },

  setShowAddForm: (show) => {
    set({ showAddForm: show });
    if (!show) set({ playersToAdd: [] });
  },

  setSelectedTeam: (teamId) => {
    set({ selectedTeam: teamId, playersToAdd: [] });
    get().fetchPlayersForTeam(teamId);
  },

  setDeletePlayerId: (id) => set({ deletePlayerId: id }),

  togglePlayerToAdd: (playerId) => {
    const { playersToAdd } = get();
    const exists = playersToAdd.find((p) => p.id === playerId);
    set({
      playersToAdd: exists
        ? playersToAdd.filter((p) => p.id !== playerId)
        : [...playersToAdd, { id: playerId, started: true }],
    });
  },

  toggleStarterStatus: (playerId) => {
    set((state) => ({
      playersToAdd: state.playersToAdd.map((p) =>
        p.id === playerId ? { ...p, started: !p.started } : p
      ),
    }));
  },

  togglePlayerSelection: (matchPlayerId) => {
    const { selectedPlayerIds } = get();
    set({
      selectedPlayerIds: selectedPlayerIds.includes(matchPlayerId)
        ? selectedPlayerIds.filter((id) => id !== matchPlayerId)
        : [...selectedPlayerIds, matchPlayerId],
    });
  },

  toggleAllPlayersForTeam: (teamId) => {
    const { players, selectedPlayerIds } = get();
    const teamPlayers = players.filter((mp) => mp.teamId === teamId);
    const allSelected = teamPlayers.every((mp) => selectedPlayerIds.includes(mp.id));
    const teamIds = teamPlayers.map((mp) => mp.id);
    set({
      selectedPlayerIds: allSelected
        ? selectedPlayerIds.filter((id) => !teamIds.includes(id))
        : [...new Set([...selectedPlayerIds, ...teamIds])],
    });
  },

  batchAddPlayers: async (onPlayerAdded) => {
    const { matchId, playersToAdd, selectedTeam, fetchMatchPlayers } = get();
    if (playersToAdd.length === 0) {
      set({ error: 'Please select at least one player' });
      return;
    }
    if (!selectedTeam) {
      set({ error: 'Please select a team' });
      return;
    }

    set({ addingPlayers: true, error: '' });
    try {
      const results = await Promise.allSettled(
        playersToAdd.map(async ({ id: playerId, started }) => {
          const res = await fetch(`/api/matches/${matchId}/players`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId, teamId: selectedTeam, started }),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || `Failed to add player ${playerId}`);
          }
          return res.json();
        })
      );

      const failures = results.filter((r) => r.status === 'rejected');
      if (failures.length > 0) {
        const msgs = failures
          .map((r) => r.status === 'rejected' && r.reason?.message)
          .filter(Boolean)
          .join('; ');
        throw new Error(`Failed to add ${failures.length} player(s)${msgs ? `: ${msgs}` : ''}`);
      }

      set({ playersToAdd: [], showAddForm: false });
      await fetchMatchPlayers();
      onPlayerAdded?.();
    } catch (err: any) {
      set({ error: err.message || 'Failed to add players' });
    } finally {
      set({ addingPlayers: false });
    }
  },

  deletePlayer: async (id, onPlayerAdded) => {
    const { matchId, fetchMatchPlayers } = get();
    try {
      const res = await fetch(`/api/matches/${matchId}/players/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove player');
      set({ deletePlayerId: null });
      await fetchMatchPlayers();
      onPlayerAdded?.();
    } catch (err: any) {
      set({ error: err.message || 'Failed to remove player' });
    }
  },

  toggleStarter: async (matchPlayerId, currentStarted, onPlayerAdded) => {
    const { matchId, fetchMatchPlayers } = get();
    set({ bulkUpdating: true, error: '' });
    try {
      const res = await fetch(`/api/matches/${matchId}/players/${matchPlayerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ started: !currentStarted }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to update player' }));
        throw new Error(err.error || `HTTP ${res.status}: Failed to update player`);
      }
      await fetchMatchPlayers();
      onPlayerAdded?.();
    } catch (err: any) {
      set({ error: err.message || 'Failed to update player' });
    } finally {
      set({ bulkUpdating: false });
    }
  },

  bulkStarterUpdate: async (teamId, started, onPlayerAdded) => {
    const { matchId, players, selectedPlayerIds, fetchMatchPlayers } = get();
    const toUpdate = players
      .filter((mp) => mp.teamId === teamId && selectedPlayerIds.includes(mp.id));

    if (toUpdate.length === 0) {
      set({ error: 'Please select at least one player' });
      return;
    }

    set({ bulkUpdating: true, error: '' });
    try {
      const results = await Promise.allSettled(
        toUpdate.map(async (mp) => {
          const res = await fetch(`/api/matches/${matchId}/players/${mp.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ started }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Failed to update player' }));
            throw new Error(err.error || `HTTP ${res.status}: Failed to update player`);
          }
          return res;
        })
      );

      const failures = results.filter((r) => r.status === 'rejected');
      if (failures.length > 0) {
        const msgs = failures
          .map((r) => r.status === 'rejected' && r.reason?.message)
          .filter(Boolean)
          .join('; ');
        throw new Error(`Failed to update ${failures.length} player(s)${msgs ? `: ${msgs}` : ''}`);
      }

      set({ selectedPlayerIds: [] });
      await fetchMatchPlayers();
      onPlayerAdded?.();
    } catch (err: any) {
      set({ error: err.message || 'Failed to update players' });
    } finally {
      set({ bulkUpdating: false });
    }
  },
}));
