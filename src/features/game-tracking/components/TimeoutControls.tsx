/**
 * Timeout Controls Component
 * Allows recording timeouts for teams
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
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock } from 'lucide-react';
import type { GameStateData, TimeoutWithRelations } from '../types';
import type { Match, TimeoutType } from '@prisma/client';
import { getTeam1Id, getTeam2Id, getTeam1Name, getTeam2Name } from '../../matches/lib/team-helpers';
import { formatClockTime } from '../lib/utils';
import { useGameTrackingStore } from '../stores/useGameTrackingStore';
import { Separator } from '@/components/ui/separator';

interface TimeoutControlsProps {
  matchId: string;
  match: Match | null;
  gameState: GameStateData | null;
  onTimeoutRecorded?: () => void;
}

export default function TimeoutControls({
  matchId,
  match,
  gameState,
  onTimeoutRecorded,
}: TimeoutControlsProps) {
  const { localClockSeconds } = useGameTrackingStore();
  const [teamId, setTeamId] = useState<string>('');
  const [timeoutType, setTimeoutType] = useState<TimeoutType>('SIXTY_SECOND');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeouts, setTimeouts] = useState<TimeoutWithRelations[]>([]);
  const [loadingTimeouts, setLoadingTimeouts] = useState(false);

  const team1Id = match ? getTeam1Id(match) : null;
  const team2Id = match ? getTeam2Id(match) : null;
  const team1Name = match ? getTeam1Name(match) : 'Team 1';
  const team2Name = match ? getTeam2Name(match) : 'Team 2';

  useEffect(() => {
    if (team1Id && !teamId) {
      setTeamId(team1Id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team1Id]);

  const fetchTimeouts = async () => {
    setLoadingTimeouts(true);
    try {
      const response = await fetch(`/api/games/${matchId}/timeout`);
      if (response.ok) {
        const data = await response.json();
        setTimeouts(data);
      }
    } catch (err) {
      console.error('Failed to fetch timeouts:', err);
    } finally {
      setLoadingTimeouts(false);
    }
  };

  useEffect(() => {
    if (matchId) {
      fetchTimeouts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!teamId) {
      setError('Please select a team');
      return;
    }

    // Calculate remaining timeouts for validation
    const currentRemainingTimeouts = teamId === team1Id
      ? gameState?.team1Timeouts ?? null
      : teamId === team2Id
      ? gameState?.team2Timeouts ?? null
      : null;

    // Allow 0 timeouts - server will initialize if needed
    // Only block if explicitly negative (shouldn't happen, but safety check)
    if (currentRemainingTimeouts !== null && currentRemainingTimeouts < 0) {
      setError('Invalid timeout count');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/games/${matchId}/timeout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          timeoutType,
          period: gameState?.period ?? 1,
          secondsRemaining: localClockSeconds ?? gameState?.clockSeconds ?? null,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to record timeout';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        console.error('Timeout submission error:', errorMessage, response.status);
        throw new Error(errorMessage);
      }

      // Reset form after successful submission
      setTimeoutType('SIXTY_SECOND');
      setError(null);
      
      // Refresh game state and timeout list
      fetchTimeouts();
      onTimeoutRecorded?.();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to record timeout';
      console.error('Timeout error:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const availableTeams = [
    team1Id && { id: team1Id, name: team1Name },
    team2Id && { id: team2Id, name: team2Name },
  ].filter(Boolean) as Array<{ id: string; name: string }>;

  const selectedTeam = availableTeams.find((t) => t.id === teamId);
  const remainingTimeouts = teamId === team1Id
    ? gameState?.team1Timeouts ?? null
    : teamId === team2Id
    ? gameState?.team2Timeouts ?? null
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Timeout Controls
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="timeout-team">
              Team <span className="text-destructive">*</span>
            </Label>
            <Select value={teamId} onValueChange={setTeamId}>
              <SelectTrigger id="timeout-team">
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
            {!teamId && availableTeams.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Please select a team
              </p>
            )}
            {selectedTeam && remainingTimeouts !== null && (
              <p className="text-xs text-muted-foreground">
                {remainingTimeouts} timeout{remainingTimeouts !== 1 ? 's' : ''} remaining
              </p>
            )}
            {selectedTeam && remainingTimeouts !== null && remainingTimeouts <= 0 && (
              <p className="text-xs text-destructive">
                No timeouts remaining for this team
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeout-type">
              Timeout Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={timeoutType}
              onValueChange={(value) => setTimeoutType(value as TimeoutType)}
            >
              <SelectTrigger id="timeout-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SIXTY_SECOND">60 Second</SelectItem>
                <SelectItem value="THIRTY_SECOND">30 Second</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {gameState && (
            <div className="text-sm text-muted-foreground space-y-1">
              <div>
                Period: {gameState.period}
              </div>
              {(localClockSeconds !== null || gameState.clockSeconds !== null) && (
                <div>
                  Clock: {formatClockTime(localClockSeconds ?? gameState.clockSeconds ?? 0)}
                </div>
              )}
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={loading || !teamId || (remainingTimeouts !== null && remainingTimeouts < 0)}
            className="w-full"
          >
            {loading ? 'Recording...' : 'Record Timeout'}
          </Button>
        </form>

        {/* Timeout List */}
        {timeouts.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Recorded Timeouts</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {timeouts.map((timeout) => {
                  const timeoutTeamName = timeout.teamId === team1Id ? team1Name : timeout.teamId === team2Id ? team2Name : 'Unknown Team';
                  const timeoutTypeLabel = timeout.timeoutType === 'SIXTY_SECOND' ? '60s' : '30s';
                  const timeoutTime = timeout.secondsRemaining ? formatClockTime(timeout.secondsRemaining) : null;
                  
                  return (
                    <div
                      key={timeout.id}
                      className="flex items-center justify-between p-2 rounded-md border bg-muted/50 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {timeoutTypeLabel}
                        </Badge>
                        <span className="font-medium">{timeoutTeamName}</span>
                        <span className="text-muted-foreground">P{timeout.period}</span>
                        {timeoutTime && (
                          <span className="text-muted-foreground">• {timeoutTime}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
