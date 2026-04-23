/**
 * Substitution Panel
 * Tap-to-swap UX: pick a player on the floor and a player on the bench in
 * either order; the second tap records the substitution optimistically.
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { resolveSubTap, type SubSelection, type TapRole } from '../../lib/subSelection';

interface SubstitutionPanelProps {
  matchId: string;
  match: Match | null;
  gameState: GameStateData | null;
  onSubstitutionRecorded?: () => void;
  refreshTrigger?: number;
  matchPlayers?: MatchPlayerWithDetails[];
}

const EMPTY_SELECTION: SubSelection = { outId: '', inId: '' };

function playerLabel(player: Player | null | undefined) {
  if (!player) return 'Unknown';
  const name = `${player.firstName ?? ''} ${player.lastName ?? ''}`.trim();
  return name || 'Unknown';
}

interface PlayerTileProps {
  jersey: number | string | null | undefined;
  name: string;
  role: 'out' | 'in' | null;
  variant: 'floor' | 'bench' | 'reserve';
  disabled: boolean;
  onTap: () => void;
}

function PlayerTile({ jersey, name, role, variant, disabled, onTap }: PlayerTileProps) {
  return (
    <button
      type="button"
      onClick={onTap}
      disabled={disabled}
      aria-pressed={role !== null}
      className={cn(
        'flex flex-col items-start justify-between gap-0.5 rounded-md border px-2 py-1.5 text-left transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        'disabled:pointer-events-none disabled:opacity-50',
        variant === 'reserve' && 'border-dashed',
        role === 'out' && 'border-destructive bg-destructive/10 text-destructive',
        role === 'in' &&
          'border-green-600 bg-green-600/10 text-green-800 dark:text-green-300',
        role === null && 'hover:bg-accent',
      )}
    >
      <span className="font-mono text-[10px] text-muted-foreground">
        {jersey !== null && jersey !== undefined && jersey !== '' ? `#${jersey}` : '—'}
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
    const timer = setTimeout(() => setSuccess(null), 2000);
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
    if (teamId) fetchTeamPlayers(teamId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  const matchTeamPlayers = useMemo(
    () => (teamId ? matchPlayers.filter((mp) => mp.teamId === teamId && mp.player) : []),
    [teamId, matchPlayers],
  );

  const {
    onFloor: activePlayers,
    onBench: playersOnBench,
    reserves: playersReserves,
  } = useMemo(
    () => deriveRoster(matchTeamPlayers, teamPlayers, substitutions),
    [matchTeamPlayers, teamPlayers, substitutions],
  );

  const benchPlayerIds = useMemo(
    () =>
      new Set<string>([
        ...playersOnBench.map((mp) => mp.playerId),
        ...playersReserves.map((p) => p.id),
      ]),
    [playersOnBench, playersReserves],
  );

  // Drop stale selections when the roster changes underneath us.
  useEffect(() => {
    setSelection((prev) => {
      const next = { ...prev };
      if (prev.outId && !activePlayers.some((mp) => mp.playerId === prev.outId)) {
        next.outId = '';
      }
      if (prev.inId && !benchPlayerIds.has(prev.inId)) {
        next.inId = '';
      }
      return next.outId === prev.outId && next.inId === prev.inId ? prev : next;
    });
  }, [activePlayers, benchPlayerIds]);

  const lookupOutName = (outId: string) =>
    playerLabel(activePlayers.find((mp) => mp.playerId === outId)?.player);

  const lookupInName = (inId: string) => {
    const fromBench = playersOnBench.find((mp) => mp.playerId === inId)?.player;
    if (fromBench) return playerLabel(fromBench);
    return playerLabel(playersReserves.find((p) => p.id === inId));
  };

  const submitSubstitution = async (outId: string, inId: string) => {
    if (submittingRef.current || isPanelDisabled) return;
    if (!teamId || !outId || !inId || outId === inId) return;

    submittingRef.current = true;
    setSubmitting(true);
    setError(null);

    const label = `${lookupOutName(outId)} → ${lookupInName(inId)}`;
    setSuccess(`Substitution: ${label}`);

    const payload = {
      teamId,
      playerInId: inId,
      playerOutId: outId,
      period: gameState?.period ?? 1,
      secondsRemaining: localClockSeconds ?? gameState?.clockSeconds ?? null,
    };

    try {
      const response = await fetch(`/api/games/${matchId}/substitution`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let serverMessage = 'Failed to record substitution';
        try {
          const errorData = await response.json();
          serverMessage = errorData.error || serverMessage;
          if (errorData.details) serverMessage = `${serverMessage}: ${errorData.details}`;
        } catch {
          serverMessage = `Server error: ${response.status}`;
        }
        setError(`${serverMessage} (${label})`);
        setSuccess(null);
        return;
      }

      fetchSubstitutions();
      fetchTeamPlayers(teamId);
      onSubstitutionRecorded?.();
    } catch (err: any) {
      setError(`${err?.message || 'Failed to record substitution'} (${label})`);
      setSuccess(null);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const handleTap = (role: TapRole, playerId: string) => {
    if (isPanelDisabled || submitting) return;
    const result = resolveSubTap(selection, role, playerId);
    setSelection(result.next);
    if (result.kind === 'submit') {
      setError(null);
      submitSubstitution(result.selection.outId, result.selection.inId);
    } else {
      setError(null);
    }
  };

  const clearSelection = () => setSelection(EMPTY_SELECTION);

  const promptLine = (() => {
    if (isPanelDisabled) return null;
    if (selection.outId && !selection.inId) return 'Now tap a bench player to sub in';
    if (!selection.outId && selection.inId) return 'Now tap an on-floor player to sub out';
    if (!selection.outId && !selection.inId) return 'Tap a player to start a substitution';
    return null;
  })();

  const totalBenchCount = playersOnBench.length + playersReserves.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Substitutions
          </CardTitle>
          {gameState && (
            <div className="text-xs text-muted-foreground tabular-nums">
              Q{gameState.period}
              {(localClockSeconds !== null || gameState.clockSeconds !== null) && (
                <> · {formatClockTime(localClockSeconds ?? gameState.clockSeconds ?? 0)}</>
              )}
            </div>
          )}
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
            <div className="grid grid-cols-2 gap-1.5 md:grid-cols-3">
              {activePlayers.map((mp) => (
                <PlayerTile
                  key={mp.id}
                  jersey={mp.player?.jerseyNumber ?? null}
                  name={playerLabel(mp.player)}
                  role={selection.outId === mp.playerId ? 'out' : null}
                  variant="floor"
                  disabled={isPanelDisabled || submitting}
                  onTap={() => handleTap('floor', mp.playerId)}
                />
              ))}
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
            <div className="grid grid-cols-2 gap-1.5 md:grid-cols-3">
              {playersOnBench.map((mp) => (
                <PlayerTile
                  key={mp.id}
                  jersey={mp.player?.jerseyNumber ?? null}
                  name={playerLabel(mp.player)}
                  role={selection.inId === mp.playerId ? 'in' : null}
                  variant="bench"
                  disabled={isPanelDisabled || submitting}
                  onTap={() => handleTap('bench', mp.playerId)}
                />
              ))}
              {playersReserves.map((p) => (
                <PlayerTile
                  key={p.id}
                  jersey={p.jerseyNumber ?? null}
                  name={playerLabel(p)}
                  role={selection.inId === p.id ? 'in' : null}
                  variant="reserve"
                  disabled={isPanelDisabled || submitting}
                  onTap={() => handleTap('bench', p.id)}
                />
              ))}
            </div>
          )}
        </section>

        {(selection.outId || selection.inId) && !submitting && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearSelection}
            className="w-full"
          >
            Clear selection
          </Button>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-500/50 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
