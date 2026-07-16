import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MatchStatus, MatchStage } from '@prisma/client';
import {
  validateMatchForm,
  matchChecklist,
  type MatchFormData,
} from '../../../domain/usecases/match-form';
import { parseLocalDateTimeToUTC, formatUTCToLocalInput } from '../../../domain/usecases/match-datetime';
import {
  getTeam1Id,
  getTeam1Name,
  getTeam1Logo,
  getTeam2Id,
  getTeam2Name,
  getTeam2Logo,
} from '../../../domain/usecases/team-helpers';
import { getLeagueId } from '../../../domain/usecases/league-helpers';
import { getSeasonId } from '../../../domain/usecases/season-helpers';

export interface TeamOption {
  id: string;
  name: string;
  logo?: string | null;
}
interface NamedOption {
  id: string;
  name: string;
}

const EMPTY: MatchFormData = {
  team1Id: '',
  team1Name: '',
  team2Id: '',
  team2Name: '',
  leagueId: '',
  seasonId: '',
  date: '',
  status: 'UPCOMING' as MatchStatus,
  stage: 'REGULAR_SEASON' as MatchStage,
  team1Score: '',
  team2Score: '',
  duration: '',
};

async function getJson<T = any>(url: string): Promise<T[]> {
  const res = await fetch(url);
  if (!res.ok) return [];
  const d = await res.json();
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  return [];
}

/**
 * Owns all state + IO for the create/edit match form: option lists (teams,
 * leagues, league-scoped seasons), the form fields, validation, and submit
 * (POST create / PUT edit, plus "save & add another"). The component is pure
 * presentation over this.
 */
export function useMatchForm({ matchId, seasonId }: { matchId?: string; seasonId?: string }) {
  const editing = Boolean(matchId);

  const [form, setForm] = useState<MatchFormData>({ ...EMPTY, seasonId: seasonId || '' });
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [leagues, setLeagues] = useState<NamedOption[]>([]);
  const [seasons, setSeasons] = useState<NamedOption[]>([]);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedCount, setSavedCount] = useState(0);
  const addAnother = useRef(false);

  const setField = useCallback(<K extends keyof MatchFormData>(key: K, value: MatchFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Option lists ------------------------------------------------------------
  useEffect(() => {
    getJson<TeamOption>('/api/teams').then((list) =>
      setTeams(list.map((t) => ({ id: t.id, name: t.name, logo: (t as any).logo ?? null }))),
    );
    getJson<NamedOption>('/api/leagues').then(setLeagues);
  }, []);

  // Seasons cascade off the chosen league. Clear the season when the league
  // changes to a different one (but keep a pre-seeded season on first load).
  const leagueId = form.leagueId;
  useEffect(() => {
    if (!leagueId) {
      setSeasons([]);
      return;
    }
    let cancelled = false;
    getJson<NamedOption>(`/api/seasons?leagueId=${leagueId}`).then((list) => {
      if (!cancelled) setSeasons(list);
    });
    return () => {
      cancelled = true;
    };
  }, [leagueId]);

  // Edit mode — load the existing match.
  useEffect(() => {
    if (!matchId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/matches/${matchId}`);
        if (!res.ok) throw new Error('Failed to load match');
        const m = await res.json();
        if (cancelled) return;
        setForm({
          team1Id: getTeam1Id(m) || '',
          team1Name: getTeam1Name(m) || '',
          team2Id: getTeam2Id(m) || '',
          team2Name: getTeam2Name(m) || '',
          leagueId: getLeagueId(m) || '',
          seasonId: getSeasonId(m) || '',
          date: m.date ? formatUTCToLocalInput(m.date) : '',
          status: m.status,
          stage: (m.stage as MatchStage) || 'REGULAR_SEASON',
          team1Score: m.team1Score?.toString() || '',
          team2Score: m.team2Score?.toString() || '',
          duration: m.duration?.toString() || '',
        });
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load match');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [matchId]);

  // Team selection helpers --------------------------------------------------
  const pickTeam = useCallback((slot: 1 | 2, team: TeamOption) => {
    setForm((prev) => ({
      ...prev,
      [`team${slot}Id`]: team.id,
      [`team${slot}Name`]: team.name,
    }));
  }, []);

  // A typed value with no matching team becomes a custom name (no id).
  const typeTeam = useCallback((slot: 1 | 2, name: string) => {
    setForm((prev) => ({ ...prev, [`team${slot}Id`]: '', [`team${slot}Name`]: name }));
  }, []);

  const clearTeam = useCallback((slot: 1 | 2) => {
    setForm((prev) => ({ ...prev, [`team${slot}Id`]: '', [`team${slot}Name`]: '' }));
  }, []);

  // Derived -----------------------------------------------------------------
  const checklist = useMemo(() => matchChecklist(form), [form]);
  const errors = useMemo(() => validateMatchForm(form), [form]);
  const canSubmit = errors.length === 0 && !saving;

  const buildPayload = () => {
    const payload: Record<string, unknown> = {
      date: parseLocalDateTimeToUTC(form.date),
      status: form.status,
      stage: form.stage || null,
      team1Score: form.team1Score ? Number.parseInt(form.team1Score, 10) : null,
      team2Score: form.team2Score ? Number.parseInt(form.team2Score, 10) : null,
      duration: form.duration ? Number.parseInt(form.duration, 10) : null,
    };
    if (form.leagueId) payload.leagueId = form.leagueId;
    if (form.seasonId) payload.seasonId = form.seasonId;
    if (form.team1Id) payload.team1Id = form.team1Id;
    else payload.team1Name = form.team1Name;
    if (form.team2Id) payload.team2Id = form.team2Id;
    else payload.team2Name = form.team2Name;
    return payload;
  };

  const submit = useCallback(
    async (mode: 'save' | 'again' = 'save') => {
      const validationErrors = validateMatchForm(form);
      if (validationErrors.length > 0) {
        setError(validationErrors.join('. '));
        return;
      }
      addAnother.current = mode === 'again';
      setSaving(true);
      setError('');
      try {
        const res = await fetch(matchId ? `/api/matches/${matchId}` : '/api/matches', {
          method: matchId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildPayload()),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || 'Failed to save match');
        }
        if (!matchId && mode === 'again') {
          // Keep league/season/stage/status/date as context; reset the rest.
          setForm((prev) => ({
            ...prev,
            team1Id: '',
            team1Name: '',
            team2Id: '',
            team2Name: '',
            team1Score: '',
            team2Score: '',
            duration: '',
          }));
          setSavedCount((c) => c + 1);
          return;
        }
        window.location.href = '/admin/matches';
      } catch (err: any) {
        setError(err?.message || 'Failed to save match');
      } finally {
        setSaving(false);
      }
    },
    [form, matchId],
  );

  return {
    editing,
    form,
    setField,
    teams,
    leagues,
    seasons,
    loading,
    saving,
    error,
    savedCount,
    checklist,
    canSubmit,
    pickTeam,
    typeTeam,
    clearTeam,
    submit,
  };
}
