/**
 * Quick Event Buttons Component
 * Provides rapid event entry buttons for common game events
 */

import { useState, useEffect, useCallback } from 'react';
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
import type { GameStateData } from '../types';
import type { Match, Player } from '@prisma/client';
import type { MatchPlayerWithDetails } from '../../cms/types';
import { getTeam1Id, getTeam2Id, getTeam1Name, getTeam2Name } from '../../matches/lib/team-helpers';
import { useGameTrackingStore } from '../stores/useGameTrackingStore';

interface QuickEventButtonsProps {
  matchId: string;
  match: Match | null;
  gameState: GameStateData | null;
  onEventRecorded?: () => void;
  refreshTrigger?: number;
}

type QuickEventType =
  | 'TWO_POINT_MADE'
  | 'TWO_POINT_MISSED'
  | 'THREE_POINT_MADE'
  | 'THREE_POINT_MISSED'
  | 'FREE_THROW_MADE'
  | 'FREE_THROW_MISSED'
  | 'FOUL_PERSONAL'
  | 'TURNOVER'
  | 'REBOUND_OFFENSIVE'
  | 'REBOUND_DEFENSIVE'
  | 'STEAL'
  | 'BLOCK'
  | 'ASSIST';

const EVENT_LABELS: Record<QuickEventType, string> = {
  TWO_POINT_MADE: '2PT Made',
  TWO_POINT_MISSED: '2PT Miss',
  THREE_POINT_MADE: '3PT Made',
  THREE_POINT_MISSED: '3PT Miss',
  FREE_THROW_MADE: 'FT Made',
  FREE_THROW_MISSED: 'FT Miss',
  FOUL_PERSONAL: 'Foul',
  TURNOVER: 'TO',
  REBOUND_OFFENSIVE: 'OReb',
  REBOUND_DEFENSIVE: 'DReb',
  STEAL: 'Steal',
  BLOCK: 'Block',
  ASSIST: 'Ast',
};

export default function QuickEventButtons({
  matchId,
  match,
  gameState,
  onEventRecorded,
  refreshTrigger,
}: QuickEventButtonsProps) {
  const { localClockSeconds } = useGameTrackingStore();
  const [teamId, setTeamId] = useState<string>('');
  const [playerId, setPlayerId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [matchPlayers, setMatchPlayers] = useState<MatchPlayerWithDetails[]>([]);

  const team1Id = match ? getTeam1Id(match) : null;
  const team2Id = match ? getTeam2Id(match) : null;
  const team1Name = match ? getTeam1Name(match) : 'Team 1';
  const team2Name = match ? getTeam2Name(match) : 'Team 2';

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

  const fetchMatchPlayers = useCallback(async () => {
    if (!matchId) return;
    try {
      const response = await fetch(`/api/matches/${matchId}/players`);
      if (response.ok) {
        const data = await response.json();
        setMatchPlayers(data || []);
      } else {
        console.error('Failed to fetch match players:', response.status, response.statusText);
      }
    } catch (err) {
      console.error('Failed to fetch match players:', err);
    }
  }, [matchId]);

  // Set default team when component mounts
  useEffect(() => {
    if (team1Id && !teamId) {
      setTeamId(team1Id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team1Id]);

  // Fetch players when component mounts
  useEffect(() => {
    if (matchId) {
      fetchMatchPlayers();
    }
  }, [matchId, fetchMatchPlayers]);

  // Reset player selection when team changes
  useEffect(() => {
    setPlayerId('');
  }, [teamId]);

  // Refresh match players when refreshTrigger changes (e.g., after substitutions)
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      fetchMatchPlayers();
    }
  }, [refreshTrigger, fetchMatchPlayers]);

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleQuickEvent = async (eventType: QuickEventType) => {
    if (!teamId || !playerId) {
      setError('Please select team and player first');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/matches/${matchId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          teamId,
          playerId,
          minute: 0, // Minute is required but not critical for quick events
          period: gameState?.period ?? 1,
          secondsRemaining: localClockSeconds ?? gameState?.clockSeconds ?? null,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to record event';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        console.error('Quick event submission error:', errorMessage, response.status, eventType);
        throw new Error(errorMessage);
      }

      setError(null);
      setSuccess('Event recorded successfully!');
      // Clear inputs after successful event recording
      setPlayerId('');
      onEventRecorded?.();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to record event';
      console.error('Quick event error:', err);
      setError(errorMessage);
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  const getPlayerDisplayName = (player: Player) => {
    return `${player.firstName} ${player.lastName}${player.jerseyNumber ? ` (#${player.jerseyNumber})` : ''}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Quick Event Entry
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quick-event-team">
              Team <span className="text-destructive">*</span>
            </Label>
            <Select value={teamId} onValueChange={setTeamId} required>
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
              disabled={!teamId || teamPlayers.length === 0}
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
          <div>
            <Label className="text-sm font-semibold">Shots</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickEvent('TWO_POINT_MADE')}
                disabled={loading || !teamId || !playerId}
              >
                {EVENT_LABELS.TWO_POINT_MADE}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickEvent('TWO_POINT_MISSED')}
                disabled={loading || !teamId || !playerId}
              >
                {EVENT_LABELS.TWO_POINT_MISSED}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickEvent('THREE_POINT_MADE')}
                disabled={loading || !teamId || !playerId}
              >
                {EVENT_LABELS.THREE_POINT_MADE}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickEvent('THREE_POINT_MISSED')}
                disabled={loading || !teamId || !playerId}
              >
                {EVENT_LABELS.THREE_POINT_MISSED}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickEvent('FREE_THROW_MADE')}
                disabled={loading || !teamId || !playerId}
              >
                {EVENT_LABELS.FREE_THROW_MADE}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickEvent('FREE_THROW_MISSED')}
                disabled={loading || !teamId || !playerId}
              >
                {EVENT_LABELS.FREE_THROW_MISSED}
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold">Defense & Fouls</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickEvent('FOUL_PERSONAL')}
                disabled={loading || !teamId || !playerId}
              >
                {EVENT_LABELS.FOUL_PERSONAL}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickEvent('REBOUND_DEFENSIVE')}
                disabled={loading || !teamId || !playerId}
              >
                {EVENT_LABELS.REBOUND_DEFENSIVE}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickEvent('REBOUND_OFFENSIVE')}
                disabled={loading || !teamId || !playerId}
              >
                {EVENT_LABELS.REBOUND_OFFENSIVE}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickEvent('STEAL')}
                disabled={loading || !teamId || !playerId}
              >
                {EVENT_LABELS.STEAL}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickEvent('BLOCK')}
                disabled={loading || !teamId || !playerId}
              >
                {EVENT_LABELS.BLOCK}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickEvent('TURNOVER')}
                disabled={loading || !teamId || !playerId}
              >
                {EVENT_LABELS.TURNOVER}
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold">Other</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickEvent('ASSIST')}
                disabled={loading || !teamId || !playerId}
              >
                {EVENT_LABELS.ASSIST}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
