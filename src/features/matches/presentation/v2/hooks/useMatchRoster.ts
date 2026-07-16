import { useCallback, useEffect, useMemo, useState } from 'react';

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
  const res = await fetch(url);
  if (!res.ok) return [];
  const d = await res.json();
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  return [];
}

const fullName = (p: { firstName?: string; lastName?: string }) =>
  `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || 'Unknown';

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

  const mark = (key: string, on: boolean) =>
    setBusy((prev) => {
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });

  const loadRoster = useCallback(async () => {
    if (!matchId) return;
    const list = await getJson(`/api/matches/${matchId}/players`);
    setRoster(
      list.map((mp: any) => ({
        id: mp.id,
        playerId: mp.playerId,
        teamId: mp.teamId,
        started: Boolean(mp.started),
        jerseyNumber: mp.jerseyNumber ?? mp.player?.jerseyNumber ?? null,
        name: fullName(mp.player ?? {}),
      })),
    );
  }, [matchId]);

  // Load roster + both team pools when enabled / teams change.
  useEffect(() => {
    if (!enabled || !matchId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        await loadRoster();
        const teamIds = [team1Id, team2Id].filter(Boolean);
        const entries = await Promise.all(
          teamIds.map(async (id) => [id, await getJson<PoolPlayer>(`/api/players?teamId=${id}`)] as const),
        );
        if (!cancelled) setPools(Object.fromEntries(entries));
      } catch {
        if (!cancelled) setError('Failed to load roster');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, matchId, team1Id, team2Id, loadRoster]);

  const rosterFor = useCallback((teamId: string) => roster.filter((r) => r.teamId === teamId), [roster]);

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
      mark(`add-${player.id}`, true);
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
        await loadRoster();
      } catch {
        setError('Failed to add player');
        setTimeout(() => setError(''), 4000);
      } finally {
        mark(`add-${player.id}`, false);
      }
    },
    [matchId, loadRoster],
  );

  const removePlayer = useCallback(
    async (mp: RosterPlayer) => {
      if (!matchId) return;
      mark(mp.id, true);
      try {
        const res = await fetch(`/api/matches/${matchId}/players/${mp.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        await loadRoster();
      } catch {
        setError('Failed to remove player');
        setTimeout(() => setError(''), 4000);
      } finally {
        mark(mp.id, false);
      }
    },
    [matchId, loadRoster],
  );

  const toggleStarter = useCallback(
    async (mp: RosterPlayer) => {
      if (!matchId) return;
      mark(mp.id, true);
      // Optimistic flip; reconcile from the server response.
      setRoster((prev) => prev.map((r) => (r.id === mp.id ? { ...r, started: !r.started } : r)));
      try {
        const res = await fetch(`/api/matches/${matchId}/players/${mp.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ started: !mp.started }),
        });
        if (!res.ok) throw new Error();
        await loadRoster();
      } catch {
        setRoster((prev) => prev.map((r) => (r.id === mp.id ? { ...r, started: mp.started } : r)));
        setError('Failed to update starter');
        setTimeout(() => setError(''), 4000);
      } finally {
        mark(mp.id, false);
      }
    },
    [matchId, loadRoster],
  );

  const totals = useMemo(
    () => ({ count: roster.length, starters: roster.filter((r) => r.started).length }),
    [roster],
  );

  return { loading, error, busy, rosterFor, availableFor, addPlayer, removePlayer, toggleStarter, totals };
}
