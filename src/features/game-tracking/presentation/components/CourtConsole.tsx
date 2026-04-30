import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  ArenaPanel,
  ArenaPanelContent,
  ArenaPanelHeader,
  ArenaPanelTitle,
} from './ArenaPanel';
import { ArenaChip } from './ArenaChip';
import { Button } from '@/components/ui/button';
import { Zap, Swords, RotateCcw } from 'lucide-react';
import CourtTile from './CourtTile';
import ConnectionStatus from './ConnectionStatus';
import { useGameTrackingStore } from '../../stores/useGameTrackingStore';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { useScorekeeperHotkeys } from '../../hooks/useScorekeeperHotkeys';
import { getTeam1Id, getTeam2Id, getTeam1Name, getTeam2Name } from '../../../matches/lib/team-helpers';
import type { GameStateData, MatchWithGameState } from '../../types';
import type { MatchPlayerWithDetails } from '../../../cms/types';

type EventType =
  | 'TWO_POINT_MADE'
  | 'TWO_POINT_MISSED'
  | 'THREE_POINT_MADE'
  | 'THREE_POINT_MISSED'
  | 'FREE_THROW_MADE'
  | 'FREE_THROW_MISSED'
  | 'FOUL_PERSONAL'
  | 'FOUL_TECHNICAL'
  | 'FOUL_UNSPORTSMANLIKE'
  | 'EJECTION'
  | 'FOUL_BENCH_TECHNICAL'
  | 'FOUL_COACH_TECHNICAL'
  | 'TURNOVER'
  | 'REBOUND_OFFENSIVE'
  | 'REBOUND_DEFENSIVE'
  | 'STEAL'
  | 'BLOCK'
  | 'ASSIST';

const POINTS: Partial<Record<EventType, number>> = {
  TWO_POINT_MADE: 2,
  THREE_POINT_MADE: 3,
  FREE_THROW_MADE: 1,
};

const MISS_OF: Partial<Record<EventType, EventType>> = {
  TWO_POINT_MISSED: 'TWO_POINT_MISSED',
  THREE_POINT_MISSED: 'THREE_POINT_MISSED',
  FREE_THROW_MISSED: 'FREE_THROW_MISSED',
};

const MADE_SHOTS: ReadonlySet<EventType> = new Set([
  'TWO_POINT_MADE',
  'THREE_POINT_MADE',
  'FREE_THROW_MADE',
]);
const MISSED_SHOTS: ReadonlySet<EventType> = new Set([
  'TWO_POINT_MISSED',
  'THREE_POINT_MISSED',
  'FREE_THROW_MISSED',
]);
const TEAM_ONLY: ReadonlySet<EventType> = new Set([
  'FOUL_BENCH_TECHNICAL',
  'FOUL_COACH_TECHNICAL',
]);

interface CourtConsoleProps {
  matchId: string;
  match: MatchWithGameState | null;
  gameState: GameStateData | null;
  matchPlayers: MatchPlayerWithDetails[];
  onEventRecorded?: () => void;
}

interface AssistPrompt {
  kind: 'assist';
  scorerId: string;
  scorerTeamId: string;
  period: number;
  secondsRemaining: number | null;
  minute: number;
}

interface ReboundPrompt {
  kind: 'rebound';
  shotTeamId: string;
  period: number;
  secondsRemaining: number | null;
  minute: number;
}

type Prompt = AssistPrompt | ReboundPrompt | null;

function computeGameMinute(
  period: number,
  secondsRemainingInPeriod: number | null,
  minutesPerPeriod: number,
): number {
  const periodSeconds = minutesPerPeriod * 60;
  const remaining = secondsRemainingInPeriod ?? periodSeconds;
  const elapsed = periodSeconds - remaining;
  return (period - 1) * minutesPerPeriod + Math.floor(elapsed / 60) + 1;
}

function onFloorPlayers(
  matchPlayers: MatchPlayerWithDetails[],
  teamId: string,
): MatchPlayerWithDetails[] {
  const teamPlayers = matchPlayers.filter((mp) => mp.teamId === teamId && mp.player);
  const hasActive = teamPlayers.some((mp) => mp.isActive);
  return hasActive
    ? teamPlayers.filter((mp) => mp.isActive)
    : teamPlayers.filter((mp) => mp.started);
}

export default function CourtConsole({
  matchId,
  match,
  gameState,
  matchPlayers,
  onEventRecorded,
}: CourtConsoleProps) {
  const { localClockSeconds, updateGameState, setGameState, toggleClock } = useGameTrackingStore();
  const { isOnline, pendingCount, enqueue, syncNow } = useOfflineSync(matchId, onEventRecorded);

  const team1Id = match ? getTeam1Id(match) : null;
  const team2Id = match ? getTeam2Id(match) : null;
  const team1Name = match ? getTeam1Name(match) : 'Team 1';
  const team2Name = match ? getTeam2Name(match) : 'Team 2';
  const isLive = match?.status === 'LIVE';
  const minutesPerPeriod = match?.gameRules?.minutesPerPeriod ?? 10;

  const homePlayers = useMemo(
    () => (team1Id ? onFloorPlayers(matchPlayers, team1Id) : []),
    [matchPlayers, team1Id],
  );
  const awayPlayers = useMemo(
    () => (team2Id ? onFloorPlayers(matchPlayers, team2Id) : []),
    [matchPlayers, team2Id],
  );

  const [armedPlayerId, setArmedPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<Prompt>(null);
  const [showMoreFouls, setShowMoreFouls] = useState(false);

  // Auto-arm first available player if none armed
  useEffect(() => {
    if (armedPlayerId) return;
    const first = homePlayers[0] ?? awayPlayers[0];
    if (first) setArmedPlayerId(first.playerId);
  }, [homePlayers, awayPlayers, armedPlayerId]);

  // Gently clear transient flash
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 1200);
    return () => clearTimeout(t);
  }, [flash]);

  const armedTeamId = useMemo(() => {
    const found = matchPlayers.find((mp) => mp.playerId === armedPlayerId);
    return found?.teamId ?? null;
  }, [matchPlayers, armedPlayerId]);

  const nowContext = () => {
    const period = gameState?.period ?? 1;
    const secondsRemaining = localClockSeconds ?? gameState?.clockSeconds ?? null;
    const minute = computeGameMinute(period, secondsRemaining, minutesPerPeriod);
    return { period, secondsRemaining, minute };
  };

  const applyOptimisticScore = (eventType: EventType, scoringTeamId: string) => {
    const points = POINTS[eventType];
    if (!points || !gameState) return null;
    const prev = { ...gameState };
    if (scoringTeamId === team1Id) {
      setGameState({ ...gameState, team1Score: gameState.team1Score + points });
    } else if (scoringTeamId === team2Id) {
      setGameState({ ...gameState, team2Score: gameState.team2Score + points });
    }
    return prev;
  };

  const inferPossession = (
    eventType: EventType,
    teamId: string,
  ): string | null => {
    if (!team1Id || !team2Id) return null;
    const otherTeam = teamId === team1Id ? team2Id : team1Id;
    if (MADE_SHOTS.has(eventType) || eventType === 'TURNOVER') return otherTeam;
    if (eventType === 'STEAL') return teamId; // stealing team gets possession
    if (eventType === 'REBOUND_DEFENSIVE') return teamId;
    if (eventType === 'REBOUND_OFFENSIVE') return teamId;
    return null;
  };

  interface EventPayload {
    matchId: string;
    eventType: EventType;
    teamId: string;
    period: number;
    secondsRemaining: number | null;
    minute: number;
    playerId?: string | null;
    description?: string | null;
    assistPlayerId?: string;
  }

  const postEvent = async (payload: EventPayload) => {
    if (!navigator.onLine) {
      await enqueue(payload);
      setFlash('Saved offline');
      return;
    }
    const res = await fetch(`/api/matches/${matchId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      await enqueue(payload);
      setFlash('Saved offline');
      return;
    }
    onEventRecorded?.();
  };

  const recordEvent = (
    eventType: EventType,
    teamId: string,
    playerId: string | null,
    extras?: Partial<Pick<EventPayload, 'description' | 'assistPlayerId'>>,
  ) => {
    const ctx = nowContext();
    const payload: EventPayload = {
      matchId,
      eventType,
      teamId,
      period: ctx.period,
      secondsRemaining: ctx.secondsRemaining,
      minute: ctx.minute,
      ...(playerId ? { playerId } : {}),
      ...(extras ?? {}),
    };

    // Optimistic score + clear error
    setError(null);
    const previousState = applyOptimisticScore(eventType, teamId);

    // Fire-and-forget persistence + possession inference
    (async () => {
      try {
        await postEvent(payload);
        const nextPossession = inferPossession(eventType, teamId);
        if (nextPossession && gameState?.possessionTeamId !== nextPossession) {
          updateGameState(matchId, { possessionTeamId: nextPossession });
        }
      } catch {
        if (previousState) setGameState(previousState);
        setError('Failed to record event');
      }
    })();
  };

  const handleAction = (eventType: EventType) => {
    if (!isLive) return;
    const teamOnly = TEAM_ONLY.has(eventType);
    if (teamOnly) {
      // Team-only events need a team chosen — default to armed team, or team1
      const teamId = armedTeamId ?? team1Id;
      if (!teamId) {
        setError('No team available');
        return;
      }
      recordEvent(eventType, teamId, null, {
        description: eventType === 'FOUL_BENCH_TECHNICAL' ? 'Bench technical foul' : 'Coach technical foul',
      });
      setFlash('Recorded');
      return;
    }

    if (!armedPlayerId || !armedTeamId) {
      setError('Tap a player jersey first');
      return;
    }

    recordEvent(eventType, armedTeamId, armedPlayerId);
    setFlash('Recorded');

    const ctx = nowContext();
    if (MADE_SHOTS.has(eventType)) {
      setPrompt({
        kind: 'assist',
        scorerId: armedPlayerId,
        scorerTeamId: armedTeamId,
        period: ctx.period,
        secondsRemaining: ctx.secondsRemaining,
        minute: ctx.minute,
      });
    } else if (MISSED_SHOTS.has(eventType)) {
      setPrompt({
        kind: 'rebound',
        shotTeamId: armedTeamId,
        period: ctx.period,
        secondsRemaining: ctx.secondsRemaining,
        minute: ctx.minute,
      });
    }
  };

  // Auto-dismiss compound prompts after 5s
  const promptTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (promptTimer.current) clearTimeout(promptTimer.current);
    if (prompt) {
      promptTimer.current = setTimeout(() => setPrompt(null), 5000);
    }
    return () => {
      if (promptTimer.current) clearTimeout(promptTimer.current);
    };
  }, [prompt]);

  const handleAssist = (assistPlayerId: string) => {
    if (!prompt || prompt.kind !== 'assist') return;
    const payload = {
      matchId,
      eventType: 'ASSIST' as EventType,
      teamId: prompt.scorerTeamId,
      playerId: assistPlayerId,
      period: prompt.period,
      secondsRemaining: prompt.secondsRemaining,
      minute: prompt.minute,
    };
    setFlash('Assist recorded');
    setPrompt(null);
    (async () => {
      try {
        await postEvent(payload);
      } catch {
        setError('Failed to record assist');
      }
    })();
  };

  // Keyboard shortcuts ------------------------------------------------------
  useScorekeeperHotkeys({
    enabled: isLive,
    armTeam1At: (index) => {
      const mp = homePlayers[index];
      if (mp) setArmedPlayerId(mp.playerId);
    },
    armTeam2At: (index) => {
      const mp = awayPlayers[index];
      if (mp) setArmedPlayerId(mp.playerId);
    },
    recordAction: (eventType) => handleAction(eventType as EventType),
    toggleClock: () => toggleClock(matchId),
  });

  const handleRebound = (rebounderPlayerId: string, rebounderTeamId: string) => {
    if (!prompt || prompt.kind !== 'rebound') return;
    const isOffensive = rebounderTeamId === prompt.shotTeamId;
    const eventType: EventType = isOffensive ? 'REBOUND_OFFENSIVE' : 'REBOUND_DEFENSIVE';
    setPrompt(null);
    recordEvent(eventType, rebounderTeamId, rebounderPlayerId);
    setFlash(isOffensive ? 'OReb' : 'DReb');
    setArmedPlayerId(rebounderPlayerId);
  };

  const possessionTeamId = gameState?.possessionTeamId ?? null;

  const renderTeam = (
    teamId: string | null,
    name: string,
    players: MatchPlayerWithDetails[],
    side: 'home' | 'away',
  ) => {
    if (!teamId) return null;
    const isPossession = teamId === possessionTeamId;
    return (
      <div
        className={cn(
          'flex flex-1 flex-col gap-2 rounded-xl border p-3',
          side === 'home' ? 'border-sky-400/20 bg-sky-500/[0.04]' : 'border-rose-400/20 bg-rose-500/[0.04]',
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              'font-heading text-sm uppercase tracking-[0.18em]',
              side === 'home' ? 'text-sky-200' : 'text-rose-200',
            )}
          >
            {name}
          </span>
          {isPossession && (
            <ArenaChip tone="gold" className="px-2 py-0.5 text-[0.62rem]">
              POSS
            </ArenaChip>
          )}
        </div>
        <div className="grid grid-cols-5 gap-2">
          {players.length === 0 ? (
            <div className="col-span-full rounded-lg border border-dashed border-white/10 p-3 text-center text-xs text-slate-400">
              No on-floor players yet
            </div>
          ) : (
            players.map((mp) => (
              <CourtTile
                key={mp.id}
                jersey={mp.jerseyNumber ?? mp.player.jerseyNumber}
                name={`${mp.player.firstName} ${mp.player.lastName}`}
                side={side}
                armed={armedPlayerId === mp.playerId}
                disabled={!isLive}
                onTap={() => setArmedPlayerId(mp.playerId)}
              />
            ))
          )}
        </div>
      </div>
    );
  };

  const ActionBtn = ({
    label,
    eventType,
    variant = 'default',
  }: {
    label: string;
    eventType: EventType;
    variant?: 'default' | 'gold' | 'red' | 'blue';
  }) => {
    // Sporty hover recipe: subtle lift + colored glow shadow + border brighten,
    // and a press-down (translate + scale) on :active so every tap feels
    // physical. transition-all + 150ms keeps it snappy for courtside pace.
    const base =
      'font-heading text-sm uppercase tracking-[0.14em] transition-all duration-150 select-none will-change-transform ' +
      'hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]';
    const tones: Record<string, string> = {
      default:
        'border border-white/15 bg-white/[0.04] text-white ' +
        'hover:bg-white/[0.10] hover:border-white/30 hover:shadow-[0_6px_18px_-8px_rgba(255,255,255,0.25)]',
      gold:
        'border border-brand-gold/40 bg-brand-gold/15 text-brand-gold ' +
        'hover:bg-brand-gold/25 hover:border-brand-gold hover:shadow-[0_8px_22px_-8px_rgba(255,186,0,0.55)]',
      red:
        'border border-red-400/40 bg-red-400/15 text-red-200 ' +
        'hover:bg-red-400/25 hover:border-red-300 hover:shadow-[0_8px_22px_-8px_rgba(248,113,113,0.55)]',
      blue:
        'border border-sky-400/40 bg-sky-400/15 text-sky-200 ' +
        'hover:bg-sky-400/25 hover:border-sky-300 hover:shadow-[0_8px_22px_-8px_rgba(56,189,248,0.55)]',
    };
    return (
      <button
        type="button"
        onClick={() => handleAction(eventType)}
        disabled={!isLive || (!TEAM_ONLY.has(eventType) && !armedPlayerId)}
        className={cn(
          'rounded-md px-3 py-2 disabled:pointer-events-none disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none',
          base,
          tones[variant],
        )}
      >
        {label}
      </button>
    );
  };

  // Compound prompt renderers ------------------------------------------------

  const renderAssistPrompt = () => {
    if (!prompt || prompt.kind !== 'assist') return null;
    const teammates = (
      prompt.scorerTeamId === team1Id ? homePlayers : awayPlayers
    ).filter((mp) => mp.playerId !== prompt.scorerId);
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-brand-gold/30 bg-brand-gold/5 p-3">
        <span className="font-heading text-xs uppercase tracking-[0.18em] text-brand-gold">
          Assist by?
        </span>
        {teammates.map((mp) => (
          <button
            key={mp.id}
            type="button"
            onClick={() => handleAssist(mp.playerId)}
            className="rounded-md border border-brand-gold/40 bg-white/[0.05] px-2 py-1 text-sm text-white hover:bg-brand-gold/20"
          >
            #{mp.jerseyNumber ?? mp.player.jerseyNumber ?? '—'} {mp.player.lastName}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPrompt(null)}
          className="rounded-md border border-white/15 bg-white/[0.04] px-2 py-1 text-sm text-slate-300 hover:bg-white/[0.08]"
        >
          No assist
        </button>
      </div>
    );
  };

  const renderReboundPrompt = () => {
    if (!prompt || prompt.kind !== 'rebound') return null;
    const combined: Array<{ mp: MatchPlayerWithDetails; teamId: string; side: 'home' | 'away' }> = [];
    if (team1Id) homePlayers.forEach((mp) => combined.push({ mp, teamId: team1Id, side: 'home' }));
    if (team2Id) awayPlayers.forEach((mp) => combined.push({ mp, teamId: team2Id, side: 'away' }));
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-sky-400/30 bg-sky-400/5 p-3">
        <span className="font-heading text-xs uppercase tracking-[0.18em] text-sky-200">
          Rebound by?
        </span>
        {combined.map(({ mp, teamId, side }) => (
          <button
            key={mp.id}
            type="button"
            onClick={() => handleRebound(mp.playerId, teamId)}
            className={cn(
              'rounded-md border px-2 py-1 text-sm text-white',
              side === 'home'
                ? 'border-sky-400/40 bg-sky-400/10 hover:bg-sky-400/20'
                : 'border-rose-400/40 bg-rose-400/10 hover:bg-rose-400/20',
            )}
          >
            #{mp.jerseyNumber ?? mp.player.jerseyNumber ?? '—'} {mp.player.lastName}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPrompt(null)}
          className="rounded-md border border-white/15 bg-white/[0.04] px-2 py-1 text-sm text-slate-300 hover:bg-white/[0.08]"
        >
          Skip
        </button>
      </div>
    );
  };

  return (
    <ArenaPanel>
      <ArenaPanelHeader>
        <div className="flex items-center justify-between gap-3">
          <ArenaPanelTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-brand-gold" />
            Court Console
          </ArenaPanelTitle>
          <ConnectionStatus
            isOnline={isOnline}
            pendingCount={pendingCount}
            onSyncClick={syncNow}
          />
        </div>
      </ArenaPanelHeader>
      <ArenaPanelContent className="space-y-4">
        {/* Possession strip */}
        {team1Id && team2Id && (
          <div className="flex items-center justify-center gap-1 rounded-full border border-white/10 bg-white/[0.02] p-1 shadow-inner">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={!isLive}
              onClick={() => updateGameState(matchId, { possessionTeamId: team1Id })}
              className={cn(
                'rounded-full px-4 text-xs font-heading uppercase tracking-[0.14em] transition-all duration-150',
                'active:scale-[0.96] disabled:hover:shadow-none',
                possessionTeamId === team1Id
                  ? 'bg-brand-gold text-[#261f45] shadow-[0_4px_18px_-4px_rgba(255,186,0,0.65)] hover:bg-brand-gold hover:text-[#261f45] hover:shadow-[0_6px_22px_-4px_rgba(255,186,0,0.85)]'
                  : 'text-slate-300 hover:bg-white/[0.06] hover:text-white',
              )}
            >
              ◀ {team1Name}
            </Button>
            <Swords
              className={cn(
                'h-4 w-4 transition-colors',
                possessionTeamId ? 'text-brand-gold/70' : 'text-slate-500',
              )}
            />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={!isLive}
              onClick={() => updateGameState(matchId, { possessionTeamId: team2Id })}
              className={cn(
                'rounded-full px-4 text-xs font-heading uppercase tracking-[0.14em] transition-all duration-150',
                'active:scale-[0.96] disabled:hover:shadow-none',
                possessionTeamId === team2Id
                  ? 'bg-brand-gold text-[#261f45] shadow-[0_4px_18px_-4px_rgba(255,186,0,0.65)] hover:bg-brand-gold hover:text-[#261f45] hover:shadow-[0_6px_22px_-4px_rgba(255,186,0,0.85)]'
                  : 'text-slate-300 hover:bg-white/[0.06] hover:text-white',
              )}
            >
              {team2Name} ▶
            </Button>
          </div>
        )}

        {/* Court tiles */}
        <div className="flex flex-col gap-3 md:flex-row">
          {renderTeam(team1Id, team1Name, homePlayers, 'home')}
          {renderTeam(team2Id, team2Name, awayPlayers, 'away')}
        </div>

        {/* Compound prompts take priority over the action strip */}
        {prompt ? (
          prompt.kind === 'assist' ? renderAssistPrompt() : renderReboundPrompt()
        ) : (
          <div className="space-y-2">
            {/* Shots */}
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              <ActionBtn label="2PM" eventType="TWO_POINT_MADE" variant="gold" />
              <ActionBtn label="3PM" eventType="THREE_POINT_MADE" variant="gold" />
              <ActionBtn label="FTM" eventType="FREE_THROW_MADE" variant="gold" />
              <ActionBtn label="2PA" eventType="TWO_POINT_MISSED" />
              <ActionBtn label="3PA" eventType="THREE_POINT_MISSED" />
              <ActionBtn label="FTA" eventType="FREE_THROW_MISSED" />
            </div>

            {/* Primary actions */}
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              <ActionBtn label="PF" eventType="FOUL_PERSONAL" variant="red" />
              <ActionBtn label="Ast" eventType="ASSIST" variant="blue" />
              <ActionBtn label="OReb" eventType="REBOUND_OFFENSIVE" variant="blue" />
              <ActionBtn label="DReb" eventType="REBOUND_DEFENSIVE" variant="blue" />
              <ActionBtn label="Stl" eventType="STEAL" variant="blue" />
              <ActionBtn label="Blk" eventType="BLOCK" variant="blue" />
            </div>

            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              <ActionBtn label="TO" eventType="TURNOVER" variant="red" />
              <button
                type="button"
                onClick={() => setShowMoreFouls((v) => !v)}
                className="col-span-1 rounded-md border border-white/15 bg-white/[0.04] px-3 py-2 font-heading text-xs uppercase tracking-[0.14em] text-slate-300 hover:bg-white/[0.08]"
              >
                {showMoreFouls ? 'Fewer' : '⋯ More'}
              </button>
            </div>

            {showMoreFouls && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                <ActionBtn label="TF" eventType="FOUL_TECHNICAL" variant="red" />
                <ActionBtn label="UF" eventType="FOUL_UNSPORTSMANLIKE" variant="red" />
                <ActionBtn label="EJ" eventType="EJECTION" variant="red" />
                <ActionBtn label="BTF" eventType="FOUL_BENCH_TECHNICAL" variant="red" />
                <ActionBtn label="CTF" eventType="FOUL_COACH_TECHNICAL" variant="red" />
                <button
                  type="button"
                  onClick={() => setArmedPlayerId(null)}
                  className="rounded-md border border-white/15 bg-white/[0.04] px-3 py-2 font-heading text-xs uppercase tracking-[0.14em] text-slate-300 hover:bg-white/[0.08]"
                  title="Clear armed player"
                >
                  <RotateCcw className="mx-auto h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Inline feedback */}
        <div className="flex min-h-[1.25rem] items-center justify-between text-xs">
          <span className="text-slate-500">
            {armedPlayerId
              ? (() => {
                  const mp = matchPlayers.find((m) => m.playerId === armedPlayerId);
                  return mp
                    ? `Armed · #${mp.jerseyNumber ?? mp.player.jerseyNumber ?? '—'} ${mp.player.firstName} ${mp.player.lastName}`
                    : 'Armed player no longer on floor';
                })()
              : 'Tap a jersey to arm a player'}
          </span>
          <span className={cn(error ? 'text-red-300' : 'text-emerald-300')}>
            {error ?? flash ?? ''}
          </span>
        </div>
      </ArenaPanelContent>
    </ArenaPanel>
  );
}

export type { EventType as CourtConsoleEventType };
