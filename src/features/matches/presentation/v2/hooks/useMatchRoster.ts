import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface PoolPlayer {
  id: string;
  firstName: string;
  lastName: string;
  jerseyNumber?: number | null;
  position?: string | null;
}

export interface RosterPlayer {
  id: string; // matchPlayer id
  playerId: string;
  teamId: string;
  started: boolean;
  jerseyNumber?: number | null;
  name: string;
}

async function getJson<T = any>(url: string): Promise<T[]> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const d = await res.json();
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  return [];
}

const fullName = (p: { firstName?: string; lastName?: string }) =>
  `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || 'Unknown';

const toRosterPlayer = (mp: any, fallback?: Partial<RosterPlayer>): RosterPlayer => ({
  id: mp.id ?? fallback?.id ?? '',
  playerId: mp.playerId ?? fallback?.playerId ?? '',
  teamId: mp.teamId ?? fallback?.teamId ?? '',
  started: Boolean(mp.started ?? fallback?.started),
  jerseyNumber: mp.jerseyNumber ?? mp.player?.jerseyNumber ?? fallback?.jerseyNumber ?? null,
  name: fullName(mp.player ?? {}) === 'Unknown' ? fallback?.name ?? 'Unknown' : fullName(mp.player),
});

/**
 * Manages a match's roster: the current match-players plus each team's player
 * pool, with add / remove / toggle-starter mutations against the existing
 * /api/matches/[id]/players endpoints. Purely data + IO; the component renders.
 */
export function useMatchRoster({
  matchId,
  team1Id,
  team2Id,
  enabled,
}: {
  matchId?: string;
  team1Id: string;
  team2Id: string;
  enabled: boolean;
}) {
  const [roster, setRoster] = useState<RosterPlayer[]>([]);
  const [pools, setPools] = useState<Record<string, PoolPlayer[]>>({});
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const rosterRef = useRef<RosterPlayer[]>([]);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateRoster = useCallback((update: RosterPlayer[] | ((current: RosterPlayer[]) => RosterPlayer[])) => {
    setRoster((current) => {
      const next = typeof update === 'function' ? update(current) : update;
      rosterRef.current = next;
      return next;
    });
  }, []);

  const showError = useCallback((message: string) => {
    setError(message);
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setError(''), 4000);
  }, []);

  useEffect(() => () => {
    if (errorTimer.current) clearTimeout(errorTimer.current);
  }, []);

  const mark = (key: string, on: boolean) =>
    setBusy((prev) => {
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });

  // Load roster + both team pools when enabled / teams change.
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const teamIds = [team1Id, team2Id].filter(Boolean);
        const [list, entries] = await Promise.all([
          matchId ? getJson(`/api/matches/${matchId}/players`) : Promise.resolve([]),
          Promise.all(teamIds.map(async (id) => [id, await getJson<PoolPlayer>(`/api/players?teamId=${id}`)] as const)),
        ]);
        if (!cancelled) {
          updateRoster(list.map((mp: any) => toRosterPlayer(mp)));
          setPools(Object.fromEntries(entries));
        }
      } catch {
        if (!cancelled) setError('Failed to load roster');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, matchId, team1Id, team2Id, updateRoster]);

  const rosterFor = useCallback((teamId: string) => roster.filter((r) => r.teamId === teamId), [roster]);
  const poolFor = useCallback((teamId: string) => pools[teamId] ?? [], [pools]);

  // Team pool minus players already on the match roster.
  const availableFor = useCallback(
    (teamId: string): PoolPlayer[] => {
      const taken = new Set(roster.filter((r) => r.teamId === teamId).map((r) => r.playerId));
      return (pools[teamId] ?? []).filter((p) => !taken.has(p.id));
    },
    [pools, roster],
  );

  const addPlayer = useCallback(
    async (player: PoolPlayer, teamId: string) => {
      if (!matchId) return;
      if (rosterRef.current.some((item) => item.playerId === player.id && item.teamId === teamId)) return;
      const temporaryId = `pending-${player.id}`;
      const optimistic = toRosterPlayer({}, {
        id: temporaryId,
        playerId: player.id,
        teamId,
        started: false,
        jerseyNumber: player.jerseyNumber,
        name: fullName(player),
      });
      mark(`add-${player.id}`, true);
      setError('');
      updateRoster((current) => [...current, optimistic]);
      try {
        const res = await fetch(`/api/matches/${matchId}/players`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId: player.id,
            teamId,
            started: false,
            jerseyNumber: player.jerseyNumber ?? undefined,
            position: player.position ?? undefined,
          }),
        });
        if (!res.ok) throw new Error();
        const saved = toRosterPlayer(await res.json(), optimistic);
        updateRoster((current) => current.map((item) => (item.id === temporaryId ? saved : item)));
      } catch {
        updateRoster((current) => current.filter((item) => item.id !== temporaryId));
        showError('Failed to add player');
      } finally {
        mark(`add-${player.id}`, false);
      }
    },
    [matchId, showError, updateRoster],
  );

  const removePlayer = useCallback(
    async (mp: RosterPlayer) => {
      if (!matchId) return;
      mark(mp.id, true);
      setError('');
      updateRoster((current) => current.filter((item) => item.id !== mp.id));
      try {
        const res = await fetch(`/api/matches/${matchId}/players/${mp.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
      } catch {
        updateRoster((current) => current.some((item) => item.id === mp.id) ? current : [...current, mp]);
        showError('Failed to remove player');
      } finally {
        mark(mp.id, false);
      }
    },
    [matchId, showError, updateRoster],
  );

  const toggleStarter = useCallback(
    async (mp: RosterPlayer) => {
      if (!matchId) return;
      mark(mp.id, true);
      // Optimistic flip; reconcile from the server response.
      setError('');
      updateRoster((prev) => prev.map((r) => (r.id === mp.id ? { ...r, started: !mp.started } : r)));
      try {
        const res = await fetch(`/api/matches/${matchId}/players/${mp.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ started: !mp.started }),
        });
        if (!res.ok) throw new Error();
        const saved = toRosterPlayer(await res.json(), { ...mp, started: !mp.started });
        updateRoster((prev) => prev.map((r) => (r.id === mp.id ? saved : r)));
      } catch {
        updateRoster((prev) => prev.map((r) => (r.id === mp.id ? { ...r, started: mp.started } : r)));
        showError('Failed to update starter');
      } finally {
        mark(mp.id, false);
      }
    },
    [matchId, showError, updateRoster],
  );

  const totals = useMemo(
    () => ({ count: roster.length, starters: roster.filter((r) => r.started).length }),
    [roster],
  );

  return { loading, error, busy, rosterFor, poolFor, availableFor, addPlayer, removePlayer, toggleStarter, totals };
}
