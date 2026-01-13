/**
 * Substitution Panel Component
 * Allows recording player substitutions
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
import { AlertCircle, Users } from 'lucide-react';
import type { GameStateData } from '../types';
import type { Match, Player } from '@prisma/client';
import type { MatchPlayerWithDetails } from '../../cms/types';
import { getTeam1Id, getTeam2Id, getTeam1Name, getTeam2Name } from '../../matches/lib/team-helpers';
import { formatClockTime } from '../lib/utils';
import { useGameTrackingStore } from '../stores/useGameTrackingStore';

interface SubstitutionPanelProps {
  matchId: string;
  match: Match | null;
  gameState: GameStateData | null;
  onSubstitutionRecorded?: () => void;
}

export default function SubstitutionPanel({
  matchId,
  match,
  gameState,
  onSubstitutionRecorded,
}: SubstitutionPanelProps) {
  const { localClockSeconds } = useGameTrackingStore();
  const [teamId, setTeamId] = useState<string>('');
  const [playerInId, setPlayerInId] = useState<string>('');
  const [playerOutId, setPlayerOutId] = useState<string>('');
  const [matchPlayers, setMatchPlayers] = useState<MatchPlayerWithDetails[]>([]);
  const [teamPlayers, setTeamPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const team1Id = match ? getTeam1Id(match) : null;
  const team2Id = match ? getTeam2Id(match) : null;
  const team1Name = match ? getTeam1Name(match) : 'Team 1';
  const team2Name = match ? getTeam2Name(match) : 'Team 2';

  const fetchMatchPlayers = async () => {
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
  };

  const fetchTeamPlayers = async (teamIdToFetch: string) => {
    try {
      const response = await fetch(`/api/players?teamId=${teamIdToFetch}`);
      if (response.ok) {
        const data = await response.json();
        setTeamPlayers(data || []);
      } else {
        console.error('Failed to fetch team players:', response.status, response.statusText);
      }
    } catch (err) {
      console.error('Failed to fetch team players:', err);
    }
  };

  useEffect(() => {
    if (matchId) {
      fetchMatchPlayers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  // Set initial team when teams from players are available, or fall back to match team1Id
  useEffect(() => {
    if (!teamId) {
      // Get unique teams from match players
      const teamsFromPlayers = matchPlayers.reduce((acc, mp) => {
        if (!acc.find(t => t.id === mp.teamId) && mp.team) {
          acc.push({ id: mp.teamId, name: mp.team.name });
        }
        return acc;
      }, [] as Array<{ id: string; name: string }>);
      
      if (teamsFromPlayers.length > 0) {
        setTeamId(teamsFromPlayers[0].id);
      } else if (team1Id) {
        setTeamId(team1Id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchPlayers, team1Id]);

  useEffect(() => {
    // Reset player selections when team changes
    setPlayerInId('');
    setPlayerOutId('');
    
    // Fetch all players from the team
    if (teamId) {
      fetchTeamPlayers(teamId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  // Clear player selections when selected players are no longer available
  useEffect(() => {
    if (teamId) {
      const currentMatchTeamPlayers = matchPlayers.filter((mp) => mp.teamId === teamId && mp.player);
      const hasAnyActive = currentMatchTeamPlayers.some((mp) => mp.isActive);
      const currentActivePlayers = hasAnyActive
        ? currentMatchTeamPlayers.filter((mp) => mp.isActive)
        : currentMatchTeamPlayers.filter((mp) => mp.started);
      const currentMatchPlayerIds = new Set(currentMatchTeamPlayers.map((mp) => mp.playerId));
      const currentPlayersNotInMatch = teamPlayers.filter((player) => !currentMatchPlayerIds.has(player.id));

      // Clear playerOutId if selected player is no longer in active list
      if (playerOutId && !currentActivePlayers.find(mp => mp.playerId === playerOutId)) {
        setPlayerOutId('');
      }

      // Clear playerInId if selected player is now in the match
      if (playerInId && currentMatchPlayerIds.has(playerInId)) {
        setPlayerInId('');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchPlayers, teamPlayers, teamId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/games/${matchId}/substitution`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          playerInId,
          playerOutId,
          period: gameState?.period ?? 1,
          secondsRemaining: localClockSeconds ?? gameState?.clockSeconds ?? null,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to record substitution';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        console.error('Substitution submission error:', errorMessage, response.status);
        throw new Error(errorMessage);
      }

      // Reset form and refresh players
      setPlayerInId('');
      setPlayerOutId('');
      await fetchMatchPlayers();
      if (teamId) {
        await fetchTeamPlayers(teamId);
      }
      setError(null);
      onSubstitutionRecorded?.();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to record substitution';
      console.error('Substitution error:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get unique teams from match players to ensure we have correct team data
  const teamsFromPlayers = matchPlayers.reduce((acc, mp) => {
    if (!acc.find(t => t.id === mp.teamId) && mp.team) {
      acc.push({ id: mp.teamId, name: mp.team.name });
    }
    return acc;
  }, [] as Array<{ id: string; name: string }>);

  // Use teams from players if available, otherwise fall back to match data
  const availableTeams = teamsFromPlayers.length > 0 
    ? teamsFromPlayers
    : [
        team1Id && { id: team1Id, name: team1Name },
        team2Id && { id: team2Id, name: team2Name },
      ].filter(Boolean) as Array<{ id: string; name: string }>;

  const matchTeamPlayers = teamId
    ? matchPlayers.filter((mp) => mp.teamId === teamId && mp.player)
    : [];

  // Determine active players: use isActive if any players have it set, otherwise fall back to started
  const hasAnyActivePlayers = matchTeamPlayers.some((mp) => mp.isActive);
  const activePlayers = hasAnyActivePlayers
    ? matchTeamPlayers.filter((mp) => mp.isActive)
    : matchTeamPlayers.filter((mp) => mp.started);

  // Get players NOT in the match (for "Player In" dropdown)
  const matchPlayerIds = new Set(matchTeamPlayers.map((mp) => mp.playerId));
  const playersNotInMatch = teamPlayers.filter((player) => !matchPlayerIds.has(player.id));

  const getPlayerDisplayName = (player: Player | null | undefined) => {
    if (!player) return 'Unknown Player';
    const name = `${player.firstName || ''} ${player.lastName || ''}`.trim() || 'Unknown Player';
    return player.jerseyNumber ? `${name} (#${player.jerseyNumber})` : name;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Substitution Panel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="substitution-team">
              Team <span className="text-destructive">*</span>
            </Label>
            <Select value={teamId} onValueChange={setTeamId} required>
              <SelectTrigger id="substitution-team">
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

          {teamId && (
            <>
              <div className="space-y-2">
                <Label htmlFor="substitution-player-out">
                  Player Out <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={playerOutId}
                  onValueChange={setPlayerOutId}
                  required
                  disabled={activePlayers.length === 0}
                >
                  <SelectTrigger id="substitution-player-out">
                    <SelectValue placeholder="Select player to remove" />
                  </SelectTrigger>
                  <SelectContent>
                    {activePlayers.map((mp) => (
                      <SelectItem key={mp.id} value={mp.playerId}>
                        {getPlayerDisplayName(mp.player)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {activePlayers.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No players available to substitute out
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="substitution-player-in">
                  Player In <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={playerInId}
                  onValueChange={setPlayerInId}
                  required
                  disabled={playersNotInMatch.length === 0}
                >
                  <SelectTrigger id="substitution-player-in">
                    <SelectValue placeholder="Select player to add" />
                  </SelectTrigger>
                  <SelectContent>
                    {playersNotInMatch.map((player) => (
                      <SelectItem key={player.id} value={player.id}>
                        {getPlayerDisplayName(player)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {playersNotInMatch.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No players available to substitute in
                  </p>
                )}
              </div>
            </>
          )}

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
            disabled={
              loading ||
              !teamId ||
              !playerInId ||
              !playerOutId ||
              playerInId === playerOutId ||
              activePlayers.length === 0 ||
              playersNotInMatch.length === 0
            }
            className="w-full"
          >
            {loading ? 'Recording...' : 'Record Substitution'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
