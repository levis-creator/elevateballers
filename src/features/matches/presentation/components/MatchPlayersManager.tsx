import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
import { Plus, X, Users, Shirt, AlertCircle, CheckSquare, Square, Loader2 } from 'lucide-react';
import { useMatchPlayersStore } from '../stores/useMatchPlayersStore';

interface MatchPlayersManagerProps {
  matchId: string;
  team1Id?: string | null;
  team2Id?: string | null;
  onPlayerAdded?: () => void;
  refreshTrigger?: number;
}

export default function MatchPlayersManager({
  matchId,
  team1Id,
  team2Id,
  onPlayerAdded,
  refreshTrigger,
}: MatchPlayersManagerProps) {
  const {
    players, availablePlayers, teams,
    loading, error, showAddForm, selectedTeam, deletePlayerId,
    selectedPlayerIds, bulkUpdating, addingPlayers, playersToAdd,
    setShowAddForm, setSelectedTeam, setDeletePlayerId,
    togglePlayerToAdd, toggleStarterStatus,
    togglePlayerSelection, toggleAllPlayersForTeam,
    batchAddPlayers, deletePlayer, toggleStarter, bulkStarterUpdate,
    fetchMatchPlayers,
  } = useMatchPlayersStore();

  useEffect(() => {
    useMatchPlayersStore.getState().init(matchId, team1Id, team2Id);
  }, [matchId, team1Id, team2Id]);

  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      fetchMatchPlayers();
    }
  }, [refreshTrigger]);

  const getPlayersByTeam = (teamId: string) =>
    players.filter((mp) => mp.teamId === teamId);

  const getTeamName = (teamId: string) =>
    teams.find((t) => t.id === teamId)?.name ?? 'Unknown Team';

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const allAvailableSelected =
    availablePlayers.length > 0 && availablePlayers.every((p) => playersToAdd.some((x) => x.id === p.id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-heading font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Match Players
        </h3>
        <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
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
            <CardTitle>Add Players to Match</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="add-team-select">
                  Team <span className="text-destructive">*</span>
                </Label>
                <Select value={selectedTeam} onValueChange={setSelectedTeam} required>
                  <SelectTrigger id="add-team-select">
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

              {selectedTeam && (
                <>
                  <div className="flex items-center justify-between pt-2 pb-2 border-b">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (allAvailableSelected) {
                            availablePlayers.forEach((p) => {
                              if (playersToAdd.some((x) => x.id === p.id)) togglePlayerToAdd(p.id);
                            });
                          } else {
                            availablePlayers.forEach((p) => {
                              if (!playersToAdd.some((x) => x.id === p.id)) togglePlayerToAdd(p.id);
                            });
                          }
                        }}
                        disabled={addingPlayers || availablePlayers.length === 0}
                      >
                        {allAvailableSelected ? (
                          <CheckSquare className="h-4 w-4 mr-1" />
                        ) : (
                          <Square className="h-4 w-4 mr-1" />
                        )}
                        {allAvailableSelected ? 'Deselect All' : 'Select All'}
                      </Button>
                      {playersToAdd.length > 0 && (
                        <span className="text-sm text-muted-foreground">
                          {playersToAdd.length} player{playersToAdd.length !== 1 ? 's' : ''} selected
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-2 border rounded-lg p-4">
                    {availablePlayers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No available players to add. All players from this team are already in the match.
                      </p>
                    ) : (
                      availablePlayers.map((player) => {
                        const entry = playersToAdd.find((x) => x.id === player.id);
                        const isSelected = !!entry;
                        const isStarter = entry?.started ?? false;
                        return (
                          <div
                            key={player.id}
                            className={`flex items-center justify-between p-3 border rounded-lg ${
                              isSelected ? 'bg-primary/5 border-primary/20' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => togglePlayerToAdd(player.id)}
                                disabled={addingPlayers}
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <strong>
                                    {player.firstName} {player.lastName}
                                  </strong>
                                  {player.jerseyNumber && (
                                    <Badge variant="secondary" className="gap-1">
                                      <Shirt className="h-3 w-3" />
                                      {player.jerseyNumber}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={isStarter}
                                  onCheckedChange={() => toggleStarterStatus(player.id)}
                                  disabled={addingPlayers}
                                />
                                <Label className="cursor-pointer text-sm">Starter</Label>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => batchAddPlayers(onPlayerAdded)}
                      disabled={addingPlayers || playersToAdd.length === 0}
                    >
                      {addingPlayers ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding Players...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Add{playersToAdd.length > 0 ? ` ${playersToAdd.length}` : ''} Player
                          {playersToAdd.length !== 1 ? 's' : ''}
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddForm(false)}
                      disabled={addingPlayers}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[team1Id, team2Id].filter(Boolean).map((tid) => {
          const teamId = tid!;
          const teamPlayers = getPlayersByTeam(teamId);
          const allSelected =
            teamPlayers.length > 0 && teamPlayers.every((mp) => selectedPlayerIds.includes(mp.id));
          const selectedForTeam = teamPlayers.filter((mp) => selectedPlayerIds.includes(mp.id));

          return (
            <Card key={teamId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{getTeamName(teamId)}</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleAllPlayersForTeam(teamId)}
                    disabled={bulkUpdating || teamPlayers.length === 0}
                  >
                    {allSelected ? (
                      <CheckSquare className="h-4 w-4 mr-1" />
                    ) : (
                      <Square className="h-4 w-4 mr-1" />
                    )}
                    {allSelected ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {selectedForTeam.length > 0 && (
                  <div className="flex gap-2 mb-4 pb-4 border-b">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => bulkStarterUpdate(teamId, true, onPlayerAdded)}
                      disabled={bulkUpdating}
                    >
                      Mark as Starter ({selectedForTeam.length})
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => bulkStarterUpdate(teamId, false, onPlayerAdded)}
                      disabled={bulkUpdating}
                    >
                      Mark as Sub ({selectedForTeam.length})
                    </Button>
                  </div>
                )}
                <div className="space-y-2">
                  {teamPlayers.map((mp) => (
                    <div
                      key={mp.id}
                      className={`flex items-center justify-between p-3 border rounded-lg ${
                        selectedPlayerIds.includes(mp.id) ? 'bg-primary/5 border-primary/20' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-wrap flex-1">
                        <Checkbox
                          checked={selectedPlayerIds.includes(mp.id)}
                          onCheckedChange={() => togglePlayerSelection(mp.id)}
                          disabled={bulkUpdating}
                        />
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={mp.started}
                            onCheckedChange={() => toggleStarter(mp.id, mp.started, onPlayerAdded)}
                            disabled={bulkUpdating}
                          />
                          <Label className="cursor-pointer text-sm font-normal">Starter</Label>
                        </div>
                        <strong>
                          {mp.player.firstName} {mp.player.lastName}
                        </strong>
                        {mp.jerseyNumber && (
                          <Badge variant="secondary" className="gap-1">
                            <Shirt className="h-3 w-3" />
                            {mp.jerseyNumber}
                          </Badge>
                        )}
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
                  {teamPlayers.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No players added</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog
        open={deletePlayerId !== null}
        onOpenChange={(open) => !open && setDeletePlayerId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Player</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this player from the match? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePlayerId && deletePlayer(deletePlayerId, onPlayerAdded)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
