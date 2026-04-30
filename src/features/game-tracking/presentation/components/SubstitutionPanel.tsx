/**
 * Substitution Panel
 * Multi-select line-change UX: tap any number of on-floor players and the
 * same number of bench/reserve players, then commit all substitutions at
 * once. Tiles show an order badge so the scorekeeper can see the pairing
 * (#1 out swaps with #1 in, etc.).
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ArenaPanel as Card,
  ArenaPanelContent as CardContent,
  ArenaPanelHeader as CardHeader,
  ArenaPanelTitle as CardTitle,
} from './ArenaPanel';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowRightLeft, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GameStateData } from '../../types';
import type { Match, Player, Substitution } from '@prisma/client';
import type { MatchPlayerWithDetails } from '../../../cms/types';
import {
  getTeam1Id,
  getTeam2Id,
  getTeam1Name,
  getTeam2Name,
} from '../../../matches/lib/team-helpers';
import { formatClockTime } from '../../lib/utils';
import { useGameTrackingStore } from '../../stores/useGameTrackingStore';
import { deriveRoster } from '../../lib/roster';
import {
  resolveSubTap,
  canCommit,
  buildPairs,
  EMPTY_SELECTION,
  type SubSelection,
  type TapRole,
} from '../../lib/subSelection';
import { useOfflineSubSync } from '../../hooks/useOfflineSubSync';

interface SubstitutionPanelProps {
  matchId: string;
  match: Match | null;
  gameState: GameStateData | null;
  onSubstitutionRecorded?: () => void;
  refreshTrigger?: number;
  matchPlayers?: MatchPlayerWithDetails[];
}

function playerLabel(player: Player | null | undefined) {
  if (!player) return 'Unknown';
  const name = `${player.firstName ?? ''} ${player.lastName ?? ''}`.trim();
  return name || 'Unknown';
}

function playerLabelWithJersey(
  player: Player | null | undefined,
  overrideJersey?: number | null,
) {
  const name = playerLabel(player);
  const jersey = overrideJersey ?? player?.jerseyNumber;
  if (jersey === null || jersey === undefined) return name;
  return `${name} #${jersey}`;
}

interface PlayerTileProps {
  jersey: number | string | null | undefined;
  name: string;
  role: 'out' | 'in' | null;
  order: number | null;
  variant: 'floor' | 'bench' | 'reserve';
  disabled: boolean;
  onTap: () => void;
}

function PlayerTile({
  jersey,
  name,
  role,
  order,
  variant,
  disabled,
  onTap,
}: PlayerTileProps) {
  return (
    <button
      type="button"
      onClick={onTap}
      disabled={disabled}
      aria-pressed={role !== null}
      className={cn(
        'relative flex flex-col items-start justify-between gap-0.5 rounded-md border px-2 py-1.5 text-left transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        'disabled:pointer-events-none disabled:opacity-50',
        variant === 'reserve' && 'border-dashed',
        role === 'out' && 'border-destructive bg-destructive/10 text-destructive',
        role === 'in' &&
          'border-green-600 bg-green-600/10 text-green-800 dark:text-green-300',
        role === null && 'hover:bg-accent',
      )}
    >
      {order !== null && (
        <span
          className={cn(
            'absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white shadow',
            role === 'out' ? 'bg-destructive' : 'bg-green-600',
          )}
          aria-label={`Selection ${order}`}
        >
          {order}
        </span>
      )}
      <span className="flex w-full items-center justify-between gap-1 font-mono text-[10px] text-muted-foreground">
        <span>
          {jersey !== null && jersey !== undefined && jersey !== '' ? `#${jersey}` : '—'}
        </span>
        {variant === 'reserve' && (
          <span className="rounded bg-muted px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide">
            Reserve
          </span>
        )}
      </span>
      <span className="text-sm font-medium leading-tight line-clamp-2">{name}</span>
    </button>
  );
}

export default function SubstitutionPanel({
  matchId,
  match,
  gameState,
  onSubstitutionRecorded,
  refreshTrigger,
  matchPlayers: matchPlayersProp,
}: SubstitutionPanelProps) {
  const { localClockSeconds } = useGameTrackingStore();
  const [teamId, setTeamId] = useState<string>('');
  const [selection, setSelection] = useState<SubSelection>(EMPTY_SELECTION);
  const [teamPlayers, setTeamPlayers] = useState<Player[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [substitutions, setSubstitutions] = useState<Substitution[]>([]);

  // Pairs the server has committed but the parent's `match.matchPlayers`
  // refetch hasn't echoed yet. Keeping these on the optimistic overlay for a
  // beat prevents tiles from snapping back to the pre-sub layout between the
  // POST response and the refetch arrival.
  const [pendingPairs, setPendingPairs] = useState<
    Array<{ outId: string; inId: string }>
  >([]);

  // Offline queue: every Execute writes here first (IndexedDB). The
  // projection reads from the queue so tiles reposition instantly; when a
  // batch syncs, the hook hands the pairs to `handleBatchSynced` which moves
  // them to `pendingPairs` so the optimistic overlay survives the refetch.
  const handleBatchSynced = useCallback(
    (batch: { pairs: Array<{ playerOutId: string; playerInId: string }>; teamId: string }) => {
      if (batch.teamId === teamId) {
        setPendingPairs((prev) => [
          ...prev,
          ...batch.pairs.map((p) => ({ outId: p.playerOutId, inId: p.playerInId })),
        ]);
      }
      onSubstitutionRecorded?.();
    },
    [onSubstitutionRecorded, teamId],
  );
  const { isOnline, queuedBatches, enqueue, syncNow } = useOfflineSubSync(
    matchId,
    handleBatchSynced,
  );

  const matchPlayers = (matchPlayersProp ?? []) as MatchPlayerWithDetails[];

  const team1Id = match ? getTeam1Id(match) : null;
  const team2Id = match ? getTeam2Id(match) : null;
  const team1Name = match ? getTeam1Name(match) : 'Team 1';
  const team2Name = match ? getTeam2Name(match) : 'Team 2';

  const fetchingSubsRef = useRef(false);
  const fetchingPlayersRef = useRef<string | null>(null);
  const submittingRef = useRef(false);

  const isPanelDisabled = match?.status !== 'LIVE' || !gameState;

  const fetchSubstitutions = async () => {
    if (fetchingSubsRef.current) return;
    fetchingSubsRef.current = true;
    try {
      const response = await fetch(`/api/games/${matchId}/substitution`);
      if (response.ok) {
        const data = (await response.json()) as Substitution[] | null;
        setSubstitutions(data ?? []);
      }
    } catch {
      // silent — retries on next trigger
    } finally {
      fetchingSubsRef.current = false;
    }
  };

  const fetchTeamPlayers = async (teamIdToFetch: string) => {
    if (fetchingPlayersRef.current === teamIdToFetch) return;
    fetchingPlayersRef.current = teamIdToFetch;
    try {
      const response = await fetch(`/api/players?teamId=${teamIdToFetch}`);
      if (response.ok) {
        const data = (await response.json()) as Player[] | null;
        setTeamPlayers(data ?? []);
      }
    } catch {
      // silent
    } finally {
      if (fetchingPlayersRef.current === teamIdToFetch) {
        fetchingPlayersRef.current = null;
      }
    }
  };

  useEffect(() => {
    if (matchId) fetchSubstitutions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      fetchSubstitutions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), 2500);
    return () => clearTimeout(timer);
  }, [success]);

  const teamsFromPlayers = useMemo(() => {
    const seen = new Set<string>();
    const teams: Array<{ id: string; name: string }> = [];
    for (const mp of matchPlayers) {
      if (mp.team && !seen.has(mp.teamId)) {
        seen.add(mp.teamId);
        teams.push({ id: mp.teamId, name: mp.team.name });
      }
    }
    return teams;
  }, [matchPlayers]);

  const availableTeams = useMemo(() => {
    if (teamsFromPlayers.length > 0) return teamsFromPlayers;
    return [
      team1Id && { id: team1Id, name: team1Name },
      team2Id && { id: team2Id, name: team2Name },
    ].filter(Boolean) as Array<{ id: string; name: string }>;
  }, [teamsFromPlayers, team1Id, team2Id, team1Name, team2Name]);

  useEffect(() => {
    if (teamId) return;
    if (teamsFromPlayers.length > 0) {
      setTeamId(teamsFromPlayers[0].id);
    } else if (team1Id) {
      setTeamId(team1Id);
    }
  }, [teamId, teamsFromPlayers, team1Id]);

  useEffect(() => {
    setSelection(EMPTY_SELECTION);
    // Drop server-confirmed overlay on team switch — it belongs to the team
    // we just left.
    setPendingPairs([]);
    if (teamId) fetchTeamPlayers(teamId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  // Defensive dedupe by playerId. The DB enforces
  // `@@unique(matchId, playerId, teamId)` so this should be a no-op, but if
  // the payload ever carries a stale duplicate (e.g. mid-flight double-add)
  // we'd otherwise render two tiles for the same underlying player and get a
  // React key collision the moment one of them is tapped.
  const matchTeamPlayers = useMemo(() => {
    if (!teamId) return [];
    const seen = new Set<string>();
    const result: MatchPlayerWithDetails[] = [];
    for (const mp of matchPlayers) {
      if (mp.teamId !== teamId || !mp.player) continue;
      if (seen.has(mp.playerId)) continue;
      seen.add(mp.playerId);
      result.push(mp);
    }
    return result;
  }, [teamId, matchPlayers]);

  // Pairs currently queued (either unsent because offline, or mid-sync) AND
  // pairs already synced but awaiting the parent's matchPlayers refetch.
  // Scoped to the team currently being viewed.
  const queuedPairs = useMemo(() => {
    const fromQueue = queuedBatches
      .filter((b) => b.teamId === teamId)
      .flatMap((b) =>
        b.pairs.map((pair) => ({
          outId: pair.playerOutId,
          inId: pair.playerInId,
        })),
      );
    return [...fromQueue, ...pendingPairs];
  }, [queuedBatches, pendingPairs, teamId]);

  // Optimistic projection: flip `isActive`/`subOut` on existing rows for
  // queued out-players, and inject synthetic rows for queued reserves being
  // subbed in. When the hook drains a batch (on sync success), `queuedPairs`
  // shrinks and the projection naturally collapses back to server truth.
  const optimisticMatchTeamPlayers = useMemo(() => {
    if (queuedPairs.length === 0) return matchTeamPlayers;
    const outIds = new Set(queuedPairs.map((p) => p.outId));
    const inIds = new Set(queuedPairs.map((p) => p.inId));
    const existing = new Set(matchTeamPlayers.map((mp) => mp.playerId));

    const updated = matchTeamPlayers.map((mp) => {
      if (outIds.has(mp.playerId)) return { ...mp, isActive: false, subOut: true };
      if (inIds.has(mp.playerId)) return { ...mp, isActive: true, subOut: false };
      return mp;
    });

    const synthetic: MatchPlayerWithDetails[] = [];
    for (const inId of inIds) {
      if (existing.has(inId)) continue;
      const p = teamPlayers.find((tp) => tp.id === inId);
      if (!p) continue;
      synthetic.push({
        id: `__pending__${inId}`,
        matchId,
        playerId: inId,
        teamId,
        started: false,
        isActive: true,
        subOut: false,
        jerseyNumber: p.jerseyNumber ?? null,
        player: p,
      } as unknown as MatchPlayerWithDetails);
    }

    return [...updated, ...synthetic];
  }, [matchTeamPlayers, teamPlayers, queuedPairs, teamId, matchId]);

  // Drain `pendingPairs` once the parent's `matchTeamPlayers` reflects the
  // committed sub (out-player now inactive/subbed, in-player now active).
  // At that point the overlay is redundant and we collapse to server truth.
  useEffect(() => {
    if (pendingPairs.length === 0) return;
    const byPlayerId = new Map(matchTeamPlayers.map((mp) => [mp.playerId, mp]));
    const stillPending = pendingPairs.filter(({ outId, inId }) => {
      const outMp = byPlayerId.get(outId);
      const inMp = byPlayerId.get(inId);
      const outSettled = !outMp || outMp.subOut === true || outMp.isActive === false;
      const inSettled = Boolean(inMp && inMp.isActive === true);
      return !(outSettled && inSettled);
    });
    if (stillPending.length !== pendingPairs.length) {
      setPendingPairs(stillPending);
    }
  }, [matchTeamPlayers, pendingPairs]);

  // Safety net: if the refetch never reflects a committed pair (match ended,
  // someone edited match players mid-air, etc.), drop the overlay after 8s so
  // the UI isn't permanently wrong.
  useEffect(() => {
    if (pendingPairs.length === 0) return;
    const timer = setTimeout(() => setPendingPairs([]), 8000);
    return () => clearTimeout(timer);
  }, [pendingPairs]);

  const {
    onFloor: activePlayers,
    onBench: playersOnBench,
    reserves: playersReserves,
  } = useMemo(
    () => deriveRoster(optimisticMatchTeamPlayers, teamPlayers, substitutions),
    [optimisticMatchTeamPlayers, teamPlayers, substitutions],
  );

  const benchPlayerIds = useMemo(
    () =>
      new Set<string>([
        ...playersOnBench.map((mp) => mp.playerId),
        ...playersReserves.map((p) => p.id),
      ]),
    [playersOnBench, playersReserves],
  );

  // Drop stale selections when the roster shifts beneath us (team switch,
  // substitution sync, edit to match players card).
  useEffect(() => {
    setSelection((prev) => {
      const activeIds = new Set(activePlayers.map((mp) => mp.playerId));
      const filteredOut = prev.outIds.filter((id) => activeIds.has(id));
      const filteredIn = prev.inIds.filter((id) => benchPlayerIds.has(id));
      if (
        filteredOut.length === prev.outIds.length &&
        filteredIn.length === prev.inIds.length
      ) {
        return prev;
      }
      return { outIds: filteredOut, inIds: filteredIn };
    });
  }, [activePlayers, benchPlayerIds]);

  const lookupOutName = (outId: string) => {
    const mp = activePlayers.find((mp) => mp.playerId === outId);
    return playerLabelWithJersey(mp?.player, mp?.jerseyNumber);
  };

  const lookupInName = (inId: string) => {
    const benchMp = playersOnBench.find((mp) => mp.playerId === inId);
    if (benchMp) return playerLabelWithJersey(benchMp.player, benchMp.jerseyNumber);
    return playerLabelWithJersey(playersReserves.find((p) => p.id === inId));
  };

  const handleTap = (role: TapRole, playerId: string) => {
    if (isPanelDisabled || submitting) return;
    setSelection((prev) => resolveSubTap(prev, role, playerId));
    setError(null);
  };

  const clearSelection = () => setSelection(EMPTY_SELECTION);

  const executeSubs = async () => {
    if (submittingRef.current || isPanelDisabled) return;
    if (!teamId || !canCommit(selection)) return;

    const pairs = buildPairs(selection);
    if (pairs.some((p) => p.outId === p.inId)) {
      setError('A player cannot be substituted with themselves');
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError(null);

    const labels = pairs.map(
      ({ outId, inId }) => `${lookupOutName(outId)} → ${lookupInName(inId)}`,
    );
    setSelection(EMPTY_SELECTION);

    // Client-minted UUID. The server indexes substitutions on
    // (matchId, clientBatchId) and short-circuits if a batch with this id has
    // already been committed. That makes retries after a timed-out response
    // idempotent — no duplicates if the network flakes mid-sync.
    const clientBatchId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const queuedBatch = {
      matchId,
      clientBatchId,
      teamId,
      period: gameState?.period ?? 1,
      secondsRemaining: localClockSeconds ?? gameState?.clockSeconds ?? null,
      pairs: pairs.map(({ outId, inId }) => ({
        playerOutId: outId,
        playerInId: inId,
      })),
    };

    // `enqueue` updates React state synchronously (IDB write happens in the
    // background), so tiles reposition in the same frame as the tap.
    void enqueue(queuedBatch);

    const summary =
      pairs.length === 1
        ? `Substitution: ${labels[0]}`
        : `${pairs.length} substitutions: ${labels.join(' · ')}`;

    if (!navigator.onLine) {
      setSuccess(`${summary} — saved offline, will sync when reconnected`);
    } else {
      setSuccess(summary);
      // Fire and forget — the hook drains queued batches on HTTP success and
      // calls `handleBatchSynced` with the pairs, which moves them into the
      // `pendingPairs` overlay so the optimistic layout stays stable while
      // the parent refetches `matchPlayers`. Nothing here needs to await.
      void syncNow();
    }

    // Release the panel immediately — the scorer can start selecting the
    // next sub while this one syncs in the background.
    submittingRef.current = false;
    setSubmitting(false);
  };

  const pairingPreview = useMemo(() => {
    const pairCount = Math.min(selection.outIds.length, selection.inIds.length);
    return Array.from({ length: pairCount }, (_, idx) => ({
      idx: idx + 1,
      outName: lookupOutName(selection.outIds[idx]),
      inName: lookupInName(selection.inIds[idx]),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection, activePlayers, playersOnBench, playersReserves]);

  const mismatch =
    selection.outIds.length !== selection.inIds.length
      ? Math.abs(selection.outIds.length - selection.inIds.length)
      : 0;
  const needsFloor = mismatch > 0 && selection.outIds.length < selection.inIds.length;
  const needsBench = mismatch > 0 && selection.inIds.length < selection.outIds.length;

  const promptLine = (() => {
    if (isPanelDisabled) return null;
    if (submitting) return 'Recording…';
    if (selection.outIds.length === 0 && selection.inIds.length === 0) {
      return 'Tap players on and off the floor — you can select multiple';
    }
    if (needsFloor) return `Pick ${mismatch} more on-floor player${mismatch === 1 ? '' : 's'}`;
    if (needsBench) return `Pick ${mismatch} more bench player${mismatch === 1 ? '' : 's'}`;
    return `Ready — ${selection.outIds.length} swap${selection.outIds.length === 1 ? '' : 's'}`;
  })();

  const totalBenchCount = playersOnBench.length + playersReserves.length;
  const commitReady = canCommit(selection);

  const tileRoleOut = (playerId: string): { role: 'out' | null; order: number | null } => {
    const idx = selection.outIds.indexOf(playerId);
    return idx >= 0 ? { role: 'out', order: idx + 1 } : { role: null, order: null };
  };

  const tileRoleIn = (playerId: string): { role: 'in' | null; order: number | null } => {
    const idx = selection.inIds.indexOf(playerId);
    return idx >= 0 ? { role: 'in', order: idx + 1 } : { role: null, order: null };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Substitutions
          </CardTitle>
          <div className="flex items-center gap-2">
            {(!isOnline || queuedBatches.length > 0) && (
              <button
                type="button"
                onClick={() => syncNow()}
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                  !isOnline
                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                    : 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200',
                )}
                title={
                  !isOnline
                    ? 'Offline — substitutions will sync when the connection returns'
                    : 'Queued substitutions — tap to retry sync now'
                }
              >
                {!isOnline ? 'Offline' : `${queuedBatches.length} queued`}
              </button>
            )}
            {gameState && (
              <div className="text-xs text-muted-foreground tabular-nums">
                Q{gameState.period}
                {(localClockSeconds !== null || gameState.clockSeconds !== null) && (
                  <> · {formatClockTime(localClockSeconds ?? gameState.clockSeconds ?? 0)}</>
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isPanelDisabled && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {match?.status !== 'LIVE'
                ? 'Start the game to record substitutions.'
                : 'Waiting for game state…'}
            </AlertDescription>
          </Alert>
        )}

        {availableTeams.length > 0 && (
          <div
            role="tablist"
            aria-label="Select team"
            className="grid grid-cols-2 gap-1 rounded-md bg-muted p-1"
          >
            {availableTeams.map((t) => {
              const active = teamId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTeamId(t.id)}
                  disabled={isPanelDisabled}
                  className={cn(
                    'rounded px-2 py-1.5 text-sm font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    'disabled:opacity-50',
                    active
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
        )}

        {promptLine && (
          <p className="text-xs text-muted-foreground">{promptLine}</p>
        )}

        <section aria-label="On floor">
          <div className="mb-1.5 flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              On floor
            </h4>
            <span className="text-xs text-muted-foreground tabular-nums">
              {activePlayers.length}
            </span>
          </div>
          {activePlayers.length === 0 ? (
            <p className="text-xs italic text-muted-foreground">No players on the floor</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
              {activePlayers.map((mp) => {
                const { role, order } = tileRoleOut(mp.playerId);
                return (
                  <PlayerTile
                    key={mp.id}
                    jersey={mp.jerseyNumber ?? mp.player?.jerseyNumber ?? null}
                    name={playerLabel(mp.player)}
                    role={role}
                    order={order}
                    variant="floor"
                    disabled={isPanelDisabled || submitting}
                    onTap={() => handleTap('floor', mp.playerId)}
                  />
                );
              })}
            </div>
          )}
        </section>

        <section aria-label="Bench and reserves">
          <div className="mb-1.5 flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Bench &amp; reserves
            </h4>
            <span className="text-xs text-muted-foreground tabular-nums">
              {totalBenchCount}
            </span>
          </div>
          {totalBenchCount === 0 ? (
            <p className="text-xs italic text-muted-foreground">No players available</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
              {playersOnBench.map((mp) => {
                const { role, order } = tileRoleIn(mp.playerId);
                return (
                  <PlayerTile
                    key={mp.id}
                    jersey={mp.jerseyNumber ?? mp.player?.jerseyNumber ?? null}
                    name={playerLabel(mp.player)}
                    role={role}
                    order={order}
                    variant="bench"
                    disabled={isPanelDisabled || submitting}
                    onTap={() => handleTap('bench', mp.playerId)}
                  />
                );
              })}
              {playersReserves.map((p) => {
                const { role, order } = tileRoleIn(p.id);
                return (
                  <PlayerTile
                    key={p.id}
                    jersey={p.jerseyNumber ?? null}
                    name={playerLabel(p)}
                    role={role}
                    order={order}
                    variant="reserve"
                    disabled={isPanelDisabled || submitting}
                    onTap={() => handleTap('bench', p.id)}
                  />
                );
              })}
            </div>
          )}
        </section>

        {pairingPreview.length > 0 && (
          <ul
            aria-label="Pending substitutions"
            className="space-y-0.5 rounded-md bg-muted/50 px-2 py-1.5 text-xs"
          >
            {pairingPreview.map(({ idx, outName, inName }) => (
              <li key={idx} className="flex items-center gap-1.5 tabular-nums">
                <span className="font-semibold text-muted-foreground">{idx}.</span>
                <span className="text-destructive">{outName}</span>
                <ArrowRightLeft className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-green-700 dark:text-green-400">{inName}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-2">
          <Button
            type="button"
            onClick={executeSubs}
            disabled={!commitReady || isPanelDisabled || submitting}
            className="flex-1"
          >
            {submitting
              ? 'Recording…'
              : selection.outIds.length > 1
              ? `Execute ${selection.outIds.length} subs`
              : 'Execute sub'}
          </Button>
          {(selection.outIds.length > 0 || selection.inIds.length > 0) && !submitting && (
            <Button
              type="button"
              variant="ghost"
              size="default"
              onClick={clearSelection}
            >
              Clear
            </Button>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-400/40 bg-green-500/15 text-green-100">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
