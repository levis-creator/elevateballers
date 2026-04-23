/**
 * Quick Event Buttons Component
 * Provides rapid event entry buttons for common game events
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Zap, CheckCircle } from 'lucide-react';
import type { GameStateData, MatchWithGameState } from '../../types';
import type { Player } from '@prisma/client';
import type { MatchPlayerWithDetails } from '../../../cms/types';
import { getTeam1Id, getTeam2Id, getTeam1Name, getTeam2Name } from '../../../matches/lib/team-helpers';
import { useGameTrackingStore } from '../../stores/useGameTrackingStore';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import ConnectionStatus from './ConnectionStatus';

interface QuickEventButtonsProps {
  matchId: string;
  match: MatchWithGameState | null;
  gameState: GameStateData | null;
  onEventRecorded?: () => void;
  refreshTrigger?: number;
  matchPlayers?: MatchPlayerWithDetails[];
}

type QuickEventType =
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

// Short-form labels used on the action buttons. `A` reads as "attempted" in
// the two missed-shot events, matching the scoresheet shorthand the user
// uses courtside.
const EVENT_LABELS: Record<QuickEventType, string> = {
  TWO_POINT_MADE: '2PTM',
  TWO_POINT_MISSED: '2PTA',
  THREE_POINT_MADE: '3PTM',
  THREE_POINT_MISSED: '3PTA',
  FREE_THROW_MADE: 'FTM',
  FREE_THROW_MISSED: 'FTA',
  FOUL_PERSONAL: 'PF',
  FOUL_TECHNICAL: 'TF',
  FOUL_UNSPORTSMANLIKE: 'UF',
  EJECTION: 'EJ',
  FOUL_BENCH_TECHNICAL: 'BTF',
  FOUL_COACH_TECHNICAL: 'CTF',
  TURNOVER: 'TO',
  REBOUND_OFFENSIVE: 'OReb',
  REBOUND_DEFENSIVE: 'DReb',
  STEAL: 'Steal',
  BLOCK: 'Block',
  ASSIST: 'Ast',
};

// Bench and coach technicals are charged directly to the coach — no player
// selection needed. The event still carries teamId so it counts toward the
// team foul counter for bonus purposes.
const TEAM_ONLY_EVENTS: ReadonlySet<QuickEventType> = new Set([
  'FOUL_BENCH_TECHNICAL',
  'FOUL_COACH_TECHNICAL',
]);

const TEAM_ONLY_DESCRIPTIONS: Partial<Record<QuickEventType, string>> = {
  FOUL_BENCH_TECHNICAL: 'Bench technical foul',
  FOUL_COACH_TECHNICAL: 'Coach technical foul',
};

export default function QuickEventButtons({
  matchId,
  match,
  gameState,
  onEventRecorded,
  matchPlayers: matchPlayersProp,
}: QuickEventButtonsProps) {
  const { localClockSeconds, updateGameState, setGameState } = useGameTrackingStore();
  const [teamId, setTeamId] = useState<string>('');
  const [playerId, setPlayerId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Use matchPlayers from parent (single source of truth in GameTrackingPanel)
  const matchPlayers = matchPlayersProp ?? [];

  const { isOnline, pendingCount, enqueue, syncNow } = useOfflineSync(matchId, onEventRecorded);

  const team1Id = match ? getTeam1Id(match) : null;
  const team2Id = match ? getTeam2Id(match) : null;
  const team1Name = match ? getTeam1Name(match) : 'Team 1';
  const team2Name = match ? getTeam2Name(match) : 'Team 2';
  const isLive = match?.status === 'LIVE';

  const availableTeams = [
    team1Id && { id: team1Id, name: team1Name },
    team2Id && { id: team2Id, name: team2Name },
  ].filter(Boolean) as Array<{ id: string; name: string }>;

  // Filter players for the selected team, with fallback logic
  const teamPlayers = teamId
    ? (() => {
        const currentMatchTeamPlayers = matchPlayers.filter((mp) => mp.teamId === teamId && mp.player);
        const hasAnyActive = currentMatchTeamPlayers.some((mp) => mp.isActive);
        // If any players are active, show only active players; otherwise show players who started
        return hasAnyActive
          ? currentMatchTeamPlayers.filter((mp) => mp.isActive)
          : currentMatchTeamPlayers.filter((mp) => mp.started);
      })()
    : [];

  // Set default team when component mounts
  useEffect(() => {
    if (team1Id && !teamId) {
      setTeamId(team1Id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team1Id]);

  // Reset player selection when team changes
  useEffect(() => {
    setPlayerId('');
  }, [teamId]);

  // Auto-select the first player if none is selected
  useEffect(() => {
    if (teamPlayers.length > 0 && !playerId) {
      setPlayerId(teamPlayers[0].playerId);
    }
  }, [teamPlayers, playerId]);

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const getScoreValue = (eventType: QuickEventType): number => {
    switch (eventType) {
      case 'TWO_POINT_MADE':
        return 2;
      case 'THREE_POINT_MADE':
        return 3;
      case 'FREE_THROW_MADE':
        return 1;
      default:
        return 0;
    }
  };

  const applyOptimisticScore = (eventType: QuickEventType, scoringTeamId: string) => {
    const points = getScoreValue(eventType);
    if (!points || !gameState) return null;

    const previousState = { ...gameState };

    if (scoringTeamId === team1Id) {
      setGameState({
        ...gameState,
        team1Score: gameState.team1Score + points,
      });
    } else if (scoringTeamId === team2Id) {
      setGameState({
        ...gameState,
        team2Score: gameState.team2Score + points,
      });
    }

    return previousState;
  };

  const handleSetPossession = (targetTeamId: string) => {
    if (!matchId || !targetTeamId) return;

    const teamName = targetTeamId === team1Id ? team1Name : team2Name;
    const currentPeriod = gameState?.period ?? 1;
    const minutesPerPeriod = match?.gameRules?.minutesPerPeriod ?? 10;
    const secondsInPeriod = (localClockSeconds ?? gameState?.clockSeconds ?? (minutesPerPeriod * 60));
    const elapsedSecondsInPeriod = (minutesPerPeriod * 60) - secondsInPeriod;
    const calculatedMinute = ((currentPeriod - 1) * minutesPerPeriod) + Math.floor(elapsedSecondsInPeriod / 60) + 1;

    // Optimistic feedback
    setError(null);
    setSuccess(`Possession switched to ${teamName}`);
    setLoading(true);

    // Fire-and-forget persistence
    (async () => {
      try {
        await updateGameState(matchId, { possessionTeamId: targetTeamId });
        await fetch(`/api/matches/${matchId}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'OTHER',
            teamId: targetTeamId,
            description: `Possession: ${teamName}`,
            minute: calculatedMinute,
            period: currentPeriod,
            secondsRemaining: localClockSeconds ?? gameState?.clockSeconds ?? null,
          }),
        });
        onEventRecorded?.();
      } catch (err: any) {
        setError(err.message || 'Failed to update possession');
        setSuccess(null);
      } finally {
        setLoading(false);
      }
    })();
  };

  const handleQuickEvent = (eventType: QuickEventType) => {
    const teamOnly = TEAM_ONLY_EVENTS.has(eventType);
    if (!teamId) {
      setError('Please select team first');
      return;
    }
    if (!teamOnly && !playerId) {
      setError('Please select team and player first');
      return;
    }

    // Compute game minute based on period and clock
    const minutesPerPeriod = match?.gameRules?.minutesPerPeriod ?? 10;
    const currentPeriod = gameState?.period ?? 1;
    const secondsInPeriod = (localClockSeconds ?? gameState?.clockSeconds ?? (minutesPerPeriod * 60));
    const elapsedSecondsInPeriod = (minutesPerPeriod * 60) - secondsInPeriod;
    const calculatedMinute = ((currentPeriod - 1) * minutesPerPeriod) + Math.floor(elapsedSecondsInPeriod / 60) + 1;

    const eventPayload = {
      matchId,
      eventType,
      teamId,
      // Team-only events (bench / coach technicals) intentionally omit playerId
      // — the event is charged to the coach, not any on-court player.
      ...(teamOnly ? {} : { playerId }),
      ...(TEAM_ONLY_DESCRIPTIONS[eventType]
        ? { description: TEAM_ONLY_DESCRIPTIONS[eventType] }
        : {}),
      minute: calculatedMinute,
      period: currentPeriod,
      secondsRemaining: localClockSeconds ?? gameState?.clockSeconds ?? null,
    };

    // Optimistic UI — show success immediately, clear inputs, don't block
    setError(null);
    setSuccess('Event recorded');
    if (!teamOnly) setPlayerId('');
    const previousState = applyOptimisticScore(eventType, teamId);
    setLoading(true);

    // Fire-and-forget persistence
    (async () => {
      try {
        if (!navigator.onLine) {
          await enqueue(eventPayload);
          setSuccess('Saved offline — will sync when reconnected');
          return;
        }
        const response = await fetch(`/api/matches/${matchId}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventPayload),
        });
        if (!response.ok) {
          // Try to buffer locally on server error
          await enqueue(eventPayload);
          setSuccess('Saved offline — will sync when reconnected');
          return;
        }
        onEventRecorded?.();
      } catch {
        // Network failure — buffer locally
        try {
          await enqueue(eventPayload);
          setSuccess('Saved offline — will sync when reconnected');
        } catch {
          if (previousState) {
            setGameState(previousState);
          }
          setError('Failed to record event');
          setSuccess(null);
        }
      } finally {
        setLoading(false);
      }
    })();
  };

  const getPlayerDisplayName = (player: Player) => {
    return `${player.firstName} ${player.lastName}${player.jerseyNumber ? ` (#${player.jerseyNumber})` : ''}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Event Entry
          </CardTitle>
          <ConnectionStatus
            isOnline={isOnline}
            pendingCount={pendingCount}
            onSyncClick={syncNow}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quick-event-team">
              Team <span className="text-destructive">*</span>
            </Label>
            <Select value={teamId} onValueChange={setTeamId} required disabled={!isLive}>
              <SelectTrigger id="quick-event-team">
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                {availableTeams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-event-player">
              Player <span className="text-destructive">*</span>
            </Label>
            <Select
              value={playerId}
              onValueChange={setPlayerId}
              required
              disabled={!teamId || teamPlayers.length === 0 || !isLive}
            >
              <SelectTrigger id="quick-event-player">
                <SelectValue placeholder="Select player" />
              </SelectTrigger>
              <SelectContent>
                {teamPlayers.map((mp) => (
                  <SelectItem key={mp.id} value={mp.playerId}>
                    {getPlayerDisplayName(mp.player)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

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

        <div className="space-y-3">
          <div className="pb-2 border-b">
            <Label className="text-sm font-semibold flex items-center gap-2">
              Current Possession
            </Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button
                type="button"
                variant={gameState?.possessionTeamId === team1Id ? "default" : "outline"}
                size="sm"
                onClick={() => team1Id && handleSetPossession(team1Id)}
                className={gameState?.possessionTeamId === team1Id ? "bg-primary text-primary-foreground" : ""}
                disabled={loading || !team1Id || !isLive}
              >
                {team1Name}
              </Button>
              <Button
                type="button"
                variant={gameState?.possessionTeamId === team2Id ? "default" : "outline"}
                size="sm"
                onClick={() => team2Id && handleSetPossession(team2Id)}
                className={gameState?.possessionTeamId === team2Id ? "bg-primary text-primary-foreground" : ""}
                disabled={loading || !team2Id || !isLive}
              >
                {team2Name}
              </Button>
            </div>
          </div>

          {(() => {
            // Local helper keeps the disabled logic in one place. Team-only
            // events (BTF / CTF) don't require a player selection.
            const EventButton = ({ eventType }: { eventType: QuickEventType }) => {
              const teamOnly = TEAM_ONLY_EVENTS.has(eventType);
              return (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickEvent(eventType)}
                  disabled={
                    loading || !teamId || !isLive || (!teamOnly && !playerId)
                  }
                  title={
                    teamOnly
                      ? 'Charged to the coach — no player selection required'
                      : undefined
                  }
                >
                  {EVENT_LABELS[eventType]}
                </Button>
              );
            };

            const SHOT_EVENTS: QuickEventType[] = [
              'TWO_POINT_MADE',
              'TWO_POINT_MISSED',
              'THREE_POINT_MADE',
              'THREE_POINT_MISSED',
              'FREE_THROW_MADE',
              'FREE_THROW_MISSED',
            ];
            const FOUL_EVENTS: QuickEventType[] = [
              'FOUL_PERSONAL',
              'FOUL_TECHNICAL',
              'FOUL_UNSPORTSMANLIKE',
              'EJECTION',
              'FOUL_BENCH_TECHNICAL',
              'FOUL_COACH_TECHNICAL',
            ];
            const DEFENSE_EVENTS: QuickEventType[] = [
              'REBOUND_DEFENSIVE',
              'REBOUND_OFFENSIVE',
              'STEAL',
              'BLOCK',
            ];
            const OTHER_EVENTS: QuickEventType[] = ['ASSIST', 'TURNOVER'];

            return (
              <>
                <div>
                  <Label className="text-sm font-semibold">Shots</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {SHOT_EVENTS.map((e) => (
                      <EventButton key={e} eventType={e} />
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold">Fouls &amp; discipline</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {FOUL_EVENTS.map((e) => (
                      <EventButton key={e} eventType={e} />
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    BTF and CTF are charged to the coach — team selection is
                    all that's required.
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-semibold">Defense</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {DEFENSE_EVENTS.map((e) => (
                      <EventButton key={e} eventType={e} />
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold">Other</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {OTHER_EVENTS.map((e) => (
                      <EventButton key={e} eventType={e} />
                    ))}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      </CardContent>
    </Card>
  );
}
