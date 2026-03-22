import { create } from 'zustand';
import type { MatchStatus, Team, League, Season, TeamWithPlayerCount } from '@/lib/types';
import type { MatchStage } from '@prisma/client';
import {
  getTeam1Id, getTeam1Name, getTeam1Logo,
  getTeam2Id, getTeam2Name, getTeam2Logo,
} from '@/features/matches/domain/usecases/team-helpers';
import { getLeagueId } from '@/features/matches/domain/usecases/league-helpers';
import { getSeasonId } from '@/features/matches/domain/usecases/season-helpers';

const MATCH_TIMEZONE = import.meta.env.PUBLIC_MATCH_TIMEZONE || 'Africa/Nairobi';

// ── Timezone helpers ──────────────────────────────────────────────────────────

const getTimeZoneOffsetMinutes = (date: Date, timeZone: string): number => {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const parts = dtf.formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? '0');
  const asUTC = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return (asUTC - date.getTime()) / 60000;
};

export const parseLocalDateTimeToUTC = (dateTimeLocal: string, timeZone: string): string => {
  const [datePart, timePart = '00:00'] = dateTimeLocal.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  const utcBaseMs = Date.UTC(year, month - 1, day, hour, minute, 0);
  const offsetMinutes = getTimeZoneOffsetMinutes(new Date(utcBaseMs), timeZone);
  return new Date(utcBaseMs - offsetMinutes * 60000).toISOString();
};

export const formatUTCToLocalInput = (value: Date | string, timeZone: string): string => {
  const date = typeof value === 'string' ? new Date(value) : value;
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
  const parts = dtf.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EditorFormData {
  team1Id: string;
  team1Name: string;
  team1Logo: string;
  team2Id: string;
  team2Name: string;
  team2Logo: string;
  leagueId: string;
  seasonId: string;
  date: string;
  team1Score: string;
  team2Score: string;
  status: MatchStatus;
  stage: MatchStage | '';
  duration: string;
}

interface EditorErrors {
  teams: string;
  leagues: string;
  match: string;
  save: string;
}

const DEFAULT_FORM: EditorFormData = {
  team1Id: '', team1Name: '', team1Logo: '',
  team2Id: '', team2Name: '', team2Logo: '',
  leagueId: '', seasonId: '', date: '',
  team1Score: '', team2Score: '',
  status: 'UPCOMING', stage: '', duration: '',
};

const DEFAULT_ERRORS: EditorErrors = { teams: '', leagues: '', match: '', save: '' };

interface MatchEditorStore {
  matchId: string;
  loading: boolean;
  saving: boolean;
  errors: EditorErrors;
  teams: (Team | TeamWithPlayerCount)[];
  teamsLoading: boolean;
  leagues: League[];
  leaguesLoading: boolean;
  seasons: Season[];
  seasonsLoading: boolean;
  formData: EditorFormData;

  init: (matchId?: string, initialSeasonId?: string) => void;
  abort: () => void;
  fetchTeams: () => Promise<void>;
  fetchLeagues: () => Promise<void>;
  fetchMatch: () => Promise<void>;
  fetchSeasons: (leagueId: string) => Promise<void>;
  clearSeasons: () => void;
  updateForm: (data: Partial<EditorFormData>) => void;
  setErrors: (errors: Partial<EditorErrors>) => void;
  validate: () => string[];
  submit: () => Promise<boolean>;
}

// Abort controller lives outside the store to avoid reactivity issues
let _abortController: AbortController | null = null;

export const useMatchEditorStore = create<MatchEditorStore>((set, get) => ({
  matchId: '',
  loading: false,
  saving: false,
  errors: { ...DEFAULT_ERRORS },
  teams: [],
  teamsLoading: true,
  leagues: [],
  leaguesLoading: false,
  seasons: [],
  seasonsLoading: false,
  formData: { ...DEFAULT_FORM },

  init: (matchId = '', initialSeasonId = '') => {
    set({
      matchId,
      loading: !!matchId,
      saving: false,
      errors: { ...DEFAULT_ERRORS },
      teams: [],
      teamsLoading: true,
      leagues: [],
      leaguesLoading: false,
      seasons: [],
      seasonsLoading: false,
      formData: { ...DEFAULT_FORM, seasonId: initialSeasonId },
    });

    const { fetchTeams, fetchLeagues, fetchMatch, fetchSeasons } = get();
    fetchTeams();
    fetchLeagues();
    if (matchId) fetchMatch();

    if (initialSeasonId && !matchId) {
      fetch(`/api/seasons/${initialSeasonId}`)
        .then((r) => r.json())
        .then((season: any) => {
          if (season?.leagueId) {
            set((state) => ({
              formData: { ...state.formData, leagueId: season.leagueId, seasonId: initialSeasonId },
            }));
            fetchSeasons(season.leagueId);
          }
        })
        .catch(console.error);
    }
  },

  abort: () => {
    if (_abortController) {
      _abortController.abort();
      _abortController = null;
    }
  },

  fetchTeams: async () => {
    if (_abortController) _abortController.abort();
    const controller = new AbortController();
    _abortController = controller;
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    set({ teamsLoading: true, errors: { ...get().errors, teams: '' } });

    try {
      let response: Response;
      try {
        response = await fetch('/api/teams', {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
          cache: 'no-cache',
        });
        clearTimeout(timeoutId);
      } catch (fetchErr: unknown) {
        clearTimeout(timeoutId);
        if (fetchErr instanceof Error && fetchErr.name === 'AbortError') {
          set({
            teams: [], teamsLoading: false,
            errors: { ...get().errors, teams: 'Request timeout: The server is taking too long to respond.' },
          });
          return;
        }
        throw fetchErr;
      }

      if (!response.ok) {
        let errMsg = `Failed to load teams (${response.status})`;
        try { errMsg = ((await response.json()) as { error?: string }).error || errMsg; } catch {}
        set({ teams: [], teamsLoading: false, errors: { ...get().errors, teams: errMsg } });
        return;
      }

      const data: unknown = await response.json();
      if (Array.isArray(data)) {
        set({ teams: data as (Team | TeamWithPlayerCount)[], teamsLoading: false });
      } else if (data && typeof data === 'object' && 'error' in data) {
        set({
          teams: [], teamsLoading: false,
          errors: { ...get().errors, teams: (data as { error: string }).error },
        });
      } else {
        set({ teams: [], teamsLoading: false, errors: { ...get().errors, teams: 'Unexpected response format' } });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      set({ teams: [], teamsLoading: false, errors: { ...get().errors, teams: `Failed to load teams: ${msg}` } });
    } finally {
      _abortController = null;
    }
  },

  fetchLeagues: async () => {
    set({ leaguesLoading: true, errors: { ...get().errors, leagues: '' } });
    try {
      const res = await fetch('/api/leagues');
      if (res.ok) {
        set({ leagues: await res.json(), leaguesLoading: false });
      } else {
        set({
          leaguesLoading: false,
          errors: { ...get().errors, leagues: `Failed to load leagues (${res.status})` },
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      set({ leaguesLoading: false, errors: { ...get().errors, leagues: `Failed to load leagues: ${msg}` } });
    }
  },

  fetchMatch: async () => {
    const { matchId, fetchSeasons } = get();
    if (!matchId) return;
    set({ loading: true, errors: { ...get().errors, match: '' } });
    try {
      const res = await fetch(`/api/matches/${matchId}`);
      if (!res.ok) throw new Error('Failed to fetch match');
      const match = await res.json();

      const leagueId = getLeagueId(match) || '';
      const seasonId = getSeasonId(match) || '';

      set({
        loading: false,
        formData: {
          team1Id: getTeam1Id(match) || '',
          team1Name: getTeam1Name(match),
          team1Logo: getTeam1Logo(match) || '',
          team2Id: getTeam2Id(match) || '',
          team2Name: getTeam2Name(match),
          team2Logo: getTeam2Logo(match) || '',
          leagueId,
          seasonId,
          date: match.date ? formatUTCToLocalInput(match.date, MATCH_TIMEZONE) : '',
          team1Score: match.team1Score?.toString() ?? '',
          team2Score: match.team2Score?.toString() ?? '',
          status: match.status,
          stage: match.stage || '',
          duration: match.duration?.toString() ?? '',
        },
      });

      if (leagueId) fetchSeasons(leagueId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load match';
      set({ loading: false, errors: { ...get().errors, match: msg } });
    }
  },

  fetchSeasons: async (leagueId) => {
    set({ seasonsLoading: true });
    try {
      const res = await fetch(`/api/seasons?leagueId=${leagueId}`);
      if (res.ok) {
        set({ seasons: await res.json(), seasonsLoading: false });
      } else {
        set({ seasonsLoading: false });
      }
    } catch {
      set({ seasonsLoading: false });
    }
  },

  clearSeasons: () => set({ seasons: [] }),

  updateForm: (data) => set((state) => ({ formData: { ...state.formData, ...data } })),

  setErrors: (errors) => set((state) => ({ errors: { ...state.errors, ...errors } })),

  validate: () => {
    const { formData } = get();
    const errs: string[] = [];
    if (!formData.team1Id) errs.push('Team 1 is required');
    if (!formData.team2Id) errs.push('Team 2 is required');
    if (!formData.leagueId) errs.push('League is required');
    if (!formData.date) {
      errs.push('Date & Time is required');
    } else {
      const matchDate = new Date(parseLocalDateTimeToUTC(formData.date, MATCH_TIMEZONE));
      if (matchDate < new Date() && formData.status === 'UPCOMING') {
        errs.push('Upcoming matches must be scheduled in the future');
      }
    }
    if (formData.team1Score) {
      const s = parseInt(formData.team1Score, 10);
      if (isNaN(s) || s < 0 || s > 999) errs.push('Team 1 score must be between 0 and 999');
    }
    if (formData.team2Score) {
      const s = parseInt(formData.team2Score, 10);
      if (isNaN(s) || s < 0 || s > 999) errs.push('Team 2 score must be between 0 and 999');
    }
    return errs;
  },

  submit: async () => {
    const { matchId, formData, validate } = get();

    if (matchId && formData.status === 'COMPLETED') {
      set({ errors: { ...DEFAULT_ERRORS, save: 'Cannot edit a completed match' } });
      return false;
    }

    set({ saving: true, errors: { ...DEFAULT_ERRORS } });

    try {
      const validationErrors = validate();
      if (validationErrors.length > 0) throw new Error(validationErrors.join('. '));

      const url = matchId ? `/api/matches/${matchId}` : '/api/matches';
      const method = matchId ? 'PUT' : 'POST';

      const payload: Record<string, unknown> = {
        date: parseLocalDateTimeToUTC(formData.date, MATCH_TIMEZONE),
        status: formData.status,
        stage: formData.stage || null,
        team1Score: formData.team1Score ? parseInt(formData.team1Score, 10) : null,
        team2Score: formData.team2Score ? parseInt(formData.team2Score, 10) : null,
        duration: formData.duration ? parseInt(formData.duration, 10) : null,
      };

      if (formData.leagueId) payload.leagueId = formData.leagueId;
      if (formData.seasonId) payload.seasonId = formData.seasonId;

      if (formData.team1Id) {
        payload.team1Id = formData.team1Id;
      } else {
        payload.team1Name = formData.team1Name;
        payload.team1Logo = formData.team1Logo || '';
      }

      if (formData.team2Id) {
        payload.team2Id = formData.team2Id;
      } else {
        payload.team2Name = formData.team2Name;
        payload.team2Logo = formData.team2Logo || '';
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = (await res.json()) as { error?: string };
        throw new Error(errorData.error || 'Failed to save match');
      }

      set({ saving: false });
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save match';
      set({ saving: false, errors: { ...get().errors, save: msg } });
      return false;
    }
  },
}));
