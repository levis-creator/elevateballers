import { useState, useEffect, useCallback } from 'react';
import type { Player, Team, MatchPlayerWithDetails } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, X, Users, Shirt, AlertCircle, CheckSquare, Square } from 'lucide-react';

interface MatchPlayersManagerProps {
  matchId: string;
  team1Id?: string | null;
  team2Id?: string | null;
  onPlayerAdded?: () => void;
  refreshTrigger?: number;
}

export default function MatchPlayersManager({ matchId, team1Id, team2Id, onPlayerAdded, refreshTrigger }: MatchPlayersManagerProps) {
  const [players, setPlayers] = useState<MatchPlayerWithDetails[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [deletePlayerId, setDeletePlayerId] = useState<string | null>(null);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [formData, setFormData] = useState({
    playerId: '',
    teamId: '',
    started: false,
    position: '',
    jerseyNumber: '',
    minutesPlayed: '',
  });

  useEffect(() => {
    if (matchId) {
      fetchTeams();
    }
  }, [matchId]);

  useEffect(() => {
    if (formData.teamId) {
      fetchPlayersForTeam(formData.teamId);
    }
  }, [formData.teamId]);

  const fetchMatchPlayers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/matches/${matchId}/players`);
      if (!response.ok) throw new Error('Failed to fetch match players');
      const data = await response.json();
      setPlayers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load match players');
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    if (matchId) {
      fetchMatchPlayers();
    }
  }, [matchId, fetchMatchPlayers]);

  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      fetchMatchPlayers();
    }
  }, [refreshTrigger, fetchMatchPlayers]);

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
        // Set default team if available
        if (data.length > 0 && !selectedTeam) {
          const defaultTeam = team1Id || team2Id || data[0].id;
          setSelectedTeam(defaultTeam);
          setFormData((prev) => ({ ...prev, teamId: defaultTeam }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch teams:', err);
    }
  };

  const fetchPlayersForTeam = async (teamId: string) => {
    try {
      const response = await fetch(`/api/players?teamId=${teamId}`);
      if (response.ok) {
        const data = await response.json();
        setAvailablePlayers(data);
      }
    } catch (err) {
      console.error('Failed to fetch players:', err);
    }
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`/api/matches/${matchId}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          jerseyNumber: formData.jerseyNumber ? parseInt(formData.jerseyNumber) : undefined,
          minutesPlayed: formData.minutesPlayed ? parseInt(formData.minutesPlayed) : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add player');
      }

      setShowAddForm(false);
      setFormData({
        playerId: '',
        teamId: formData.teamId,
        started: false,
        position: '',
        jerseyNumber: '',
        minutesPlayed: '',
      });
      fetchMatchPlayers();
      if (onPlayerAdded) {
        onPlayerAdded();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add player');
    }
  };

  const handleDeletePlayer = async (id: string) => {
    try {
      const response = await fetch(`/api/matches/${matchId}/players/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove player');
      fetchMatchPlayers();
      if (onPlayerAdded) {
        onPlayerAdded();
      }
      setDeletePlayerId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to remove player');
    }
  };

  const getPlayersByTeam = (teamId: string) => {
    return players.filter((mp) => mp.teamId === teamId);
  };

  const getTeamName = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId);
    return team?.name || 'Unknown Team';
  };

  const togglePlayerSelection = (playerId: string) => {
    setSelectedPlayerIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
      } else {
        newSet.add(playerId);
      }
      return newSet;
    });
  };

  const toggleAllPlayersForTeam = (teamId: string) => {
    const teamPlayers = getPlayersByTeam(teamId);
    const teamPlayerIds = new Set(teamPlayers.map((mp) => mp.id));
    const allSelected = teamPlayers.every((mp) => selectedPlayerIds.has(mp.id));

    setSelectedPlayerIds((prev) => {
      const newSet = new Set(prev);
      if (allSelected) {
        // Deselect all players from this team
        teamPlayerIds.forEach((id) => newSet.delete(id));
      } else {
        // Select all players from this team
        teamPlayerIds.forEach((id) => newSet.add(id));
      }
      return newSet;
    });
  };

  const handleBulkStarterUpdate = async (teamId: string, started: boolean) => {
    const teamPlayers = getPlayersByTeam(teamId);
    const playersToUpdate = teamPlayers.filter((mp) => selectedPlayerIds.has(mp.id));

    if (playersToUpdate.length === 0) {
      setError('Please select at least one player');
      return;
    }

    setBulkUpdating(true);
    setError('');

    try {
      // Update all selected players in parallel
      // Each promise checks response.ok and throws on HTTP errors
      const updatePromises = playersToUpdate.map(async (mp) => {
        const response = await fetch(`/api/matches/${matchId}/players/${mp.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ started }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to update player' }));
          throw new Error(errorData.error || `HTTP ${response.status}: Failed to update player`);
        }

        return response;
      });

      const results = await Promise.allSettled(updatePromises);
      const failures = results.filter((r) => r.status === 'rejected');

      if (failures.length > 0) {
        const errorMessages = failures
          .map((r) => r.status === 'rejected' && r.reason?.message)
          .filter(Boolean)
          .join('; ');
        throw new Error(`Failed to update ${failures.length} player(s)${errorMessages ? `: ${errorMessages}` : ''}`);
      }

      // Clear selection and refresh
      setSelectedPlayerIds(new Set());
      await fetchMatchPlayers();
      if (onPlayerAdded) {
        onPlayerAdded();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update players');
    } finally {
      setBulkUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-heading font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Match Players
        </h3>
        <Button
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Player
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Player to Match</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddPlayer} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="teamId">
                    Team <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.teamId}
                    onValueChange={(value) => {
                      setFormData((prev) => ({
                        ...prev,
                        teamId: value,
                        playerId: '',
                      }));
                      setSelectedTeam(value);
                    }}
                    required
                  >
                    <SelectTrigger id="teamId">
                      <SelectValue placeholder="Select a team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="playerId">
                    Player <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.playerId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, playerId: value }))
                    }
                    required
                    disabled={!formData.teamId}
                  >
                    <SelectTrigger id="playerId">
                      <SelectValue placeholder="Select a player" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePlayers.map((player) => (
                        <SelectItem key={player.id} value={player.id}>
                          {player.firstName} {player.lastName}
                          {player.jerseyNumber ? ` (#${player.jerseyNumber})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    type="text"
                    value={formData.position}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, position: e.target.value }))
                    }
                    placeholder="e.g., Forward"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jerseyNumber">Jersey #</Label>
                  <Input
                    id="jerseyNumber"
                    type="number"
                    value={formData.jerseyNumber}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, jerseyNumber: e.target.value }))
                    }
                    min="0"
                    max="99"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minutesPlayed">Minutes</Label>
                  <Input
                    id="minutesPlayed"
                    type="number"
                    value={formData.minutesPlayed}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, minutesPlayed: e.target.value }))
                    }
                    min="0"
                    max="120"
                  />
                </div>

                <div className="space-y-2 flex items-end">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="started"
                      checked={formData.started}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, started: checked === true }))
                      }
                    />
                    <Label htmlFor="started" className="cursor-pointer">
                      Started
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">Add Player</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {team1Id && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{getTeamName(team1Id)}</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleAllPlayersForTeam(team1Id)}
                    disabled={bulkUpdating || getPlayersByTeam(team1Id).length === 0}
                  >
                    {getPlayersByTeam(team1Id).every((mp) => selectedPlayerIds.has(mp.id)) &&
                    getPlayersByTeam(team1Id).length > 0 ? (
                      <CheckSquare className="h-4 w-4 mr-1" />
                    ) : (
                      <Square className="h-4 w-4 mr-1" />
                    )}
                    {getPlayersByTeam(team1Id).every((mp) => selectedPlayerIds.has(mp.id)) &&
                    getPlayersByTeam(team1Id).length > 0
                      ? 'Deselect All'
                      : 'Select All'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Bulk Action Buttons */}
              {selectedPlayerIds.size > 0 &&
                getPlayersByTeam(team1Id).some((mp) => selectedPlayerIds.has(mp.id)) && (
                  <div className="flex gap-2 mb-4 pb-4 border-b">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleBulkStarterUpdate(team1Id, true)}
                      disabled={bulkUpdating}
                    >
                      Mark as Starter ({getPlayersByTeam(team1Id).filter((mp) => selectedPlayerIds.has(mp.id)).length})
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBulkStarterUpdate(team1Id, false)}
                      disabled={bulkUpdating}
                    >
                      Mark as Sub ({getPlayersByTeam(team1Id).filter((mp) => selectedPlayerIds.has(mp.id)).length})
                    </Button>
                  </div>
                )}
              <div className="space-y-2">
                {getPlayersByTeam(team1Id).map((mp) => (
                  <div
                    key={mp.id}
                    className={`flex items-center justify-between p-3 border rounded-lg ${
                      selectedPlayerIds.has(mp.id) ? 'bg-primary/5 border-primary/20' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-wrap flex-1">
                      <Checkbox
                        checked={selectedPlayerIds.has(mp.id)}
                        onCheckedChange={() => togglePlayerSelection(mp.id)}
                        disabled={bulkUpdating}
                      />
                      <strong>
                        {mp.player.firstName} {mp.player.lastName}
                      </strong>
                      {mp.jerseyNumber && (
                        <Badge variant="secondary" className="gap-1">
                          <Shirt className="h-3 w-3" />
                          {mp.jerseyNumber}
                        </Badge>
                      )}
                      {mp.started && <Badge variant="default">Started</Badge>}
                      {mp.isActive && (
                        <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                          Active
                        </Badge>
                      )}
                      {!mp.isActive && mp.started && (
                        <Badge variant="outline" className="bg-gray-500/10 text-gray-700 border-gray-500/20">
                          Inactive
                        </Badge>
                      )}
                      {mp.position && (
                        <span className="text-sm text-muted-foreground">({mp.position})</span>
                      )}
                      {mp.minutesPlayed !== null && (
                        <span className="text-sm text-muted-foreground">{mp.minutesPlayed}'</span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeletePlayerId(mp.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {getPlayersByTeam(team1Id).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No players added</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {team2Id && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{getTeamName(team2Id)}</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleAllPlayersForTeam(team2Id)}
                    disabled={bulkUpdating || getPlayersByTeam(team2Id).length === 0}
                  >
                    {getPlayersByTeam(team2Id).every((mp) => selectedPlayerIds.has(mp.id)) &&
                    getPlayersByTeam(team2Id).length > 0 ? (
                      <CheckSquare className="h-4 w-4 mr-1" />
                    ) : (
                      <Square className="h-4 w-4 mr-1" />
                    )}
                    {getPlayersByTeam(team2Id).every((mp) => selectedPlayerIds.has(mp.id)) &&
                    getPlayersByTeam(team2Id).length > 0
                      ? 'Deselect All'
                      : 'Select All'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Bulk Action Buttons */}
              {selectedPlayerIds.size > 0 &&
                getPlayersByTeam(team2Id).some((mp) => selectedPlayerIds.has(mp.id)) && (
                  <div className="flex gap-2 mb-4 pb-4 border-b">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleBulkStarterUpdate(team2Id, true)}
                      disabled={bulkUpdating}
                    >
                      Mark as Starter ({getPlayersByTeam(team2Id).filter((mp) => selectedPlayerIds.has(mp.id)).length})
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBulkStarterUpdate(team2Id, false)}
                      disabled={bulkUpdating}
                    >
                      Mark as Sub ({getPlayersByTeam(team2Id).filter((mp) => selectedPlayerIds.has(mp.id)).length})
                    </Button>
                  </div>
                )}
              <div className="space-y-2">
                {getPlayersByTeam(team2Id).map((mp) => (
                  <div
                    key={mp.id}
                    className={`flex items-center justify-between p-3 border rounded-lg ${
                      selectedPlayerIds.has(mp.id) ? 'bg-primary/5 border-primary/20' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-wrap flex-1">
                      <Checkbox
                        checked={selectedPlayerIds.has(mp.id)}
                        onCheckedChange={() => togglePlayerSelection(mp.id)}
                        disabled={bulkUpdating}
                      />
                      <strong>
                        {mp.player.firstName} {mp.player.lastName}
                      </strong>
                      {mp.jerseyNumber && (
                        <Badge variant="secondary" className="gap-1">
                          <Shirt className="h-3 w-3" />
                          {mp.jerseyNumber}
                        </Badge>
                      )}
                      {mp.started && <Badge variant="default">Started</Badge>}
                      {mp.isActive && (
                        <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                          Active
                        </Badge>
                      )}
                      {!mp.isActive && mp.started && (
                        <Badge variant="outline" className="bg-gray-500/10 text-gray-700 border-gray-500/20">
                          Inactive
                        </Badge>
                      )}
                      {mp.position && (
                        <span className="text-sm text-muted-foreground">({mp.position})</span>
                      )}
                      {mp.minutesPlayed !== null && (
                        <span className="text-sm text-muted-foreground">{mp.minutesPlayed}'</span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeletePlayerId(mp.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {getPlayersByTeam(team2Id).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No players added</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={deletePlayerId !== null} onOpenChange={(open) => !open && setDeletePlayerId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Player</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this player from the match? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletePlayerId && handleDeletePlayer(deletePlayerId)}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
