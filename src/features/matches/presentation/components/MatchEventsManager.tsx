import { useEffect } from 'react';
import type { MatchEventType } from '@/lib/types';
import { getPeriodLabel, formatClockTime } from '@/features/game-tracking/domain/usecases/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  Plus, X, Activity, Target, Square as CardIcon, Users,
  Clock, AlertCircle, Circle, Shield, Pencil,
} from 'lucide-react';
import { useMatchEventsStore } from '../stores/useMatchEventsStore';

interface MatchEventsManagerProps {
  matchId: string;
  team1Id?: string | null;
  team2Id?: string | null;
}

const EVENT_TYPES: { value: MatchEventType; label: string; icon: React.ElementType }[] = [
  { value: 'TWO_POINT_MADE', label: '2-Point Made', icon: Target },
  { value: 'TWO_POINT_MISSED', label: '2-Point Missed', icon: Target },
  { value: 'THREE_POINT_MADE', label: '3-Point Made', icon: Target },
  { value: 'THREE_POINT_MISSED', label: '3-Point Missed', icon: Target },
  { value: 'FREE_THROW_MADE', label: 'Free Throw Made', icon: Target },
  { value: 'FREE_THROW_MISSED', label: 'Free Throw Missed', icon: Target },
  { value: 'ASSIST', label: 'Assist', icon: Activity },
  { value: 'REBOUND_OFFENSIVE', label: 'Offensive Rebound', icon: Circle },
  { value: 'REBOUND_DEFENSIVE', label: 'Defensive Rebound', icon: Circle },
  { value: 'STEAL', label: 'Steal', icon: Shield },
  { value: 'BLOCK', label: 'Block', icon: Shield },
  { value: 'TURNOVER', label: 'Turnover', icon: Activity },
  { value: 'FOUL_PERSONAL', label: 'Personal Foul', icon: CardIcon },
  { value: 'FOUL_TECHNICAL', label: 'Technical Foul', icon: CardIcon },
  { value: 'FOUL_FLAGRANT', label: 'Flagrant Foul', icon: CardIcon },
  { value: 'SUBSTITUTION_IN', label: 'Substitution In', icon: Users },
  { value: 'SUBSTITUTION_OUT', label: 'Substitution Out', icon: Users },
  { value: 'TIMEOUT', label: 'Timeout', icon: Clock },
  { value: 'INJURY', label: 'Injury', icon: Activity },
  { value: 'BREAK', label: 'Break', icon: Clock },
  { value: 'PLAY_RESUMED', label: 'Play Resumed', icon: Activity },
  { value: 'OTHER', label: 'Other', icon: Activity },
];

const needsTeam = (t: MatchEventType) => !['BREAK', 'PLAY_RESUMED'].includes(t);
const needsPlayer = (t: MatchEventType) => !['TIMEOUT', 'BREAK', 'PLAY_RESUMED'].includes(t);
const requiresPlayer = (t: MatchEventType) => !['TIMEOUT', 'BREAK', 'PLAY_RESUMED', 'OTHER'].includes(t);
const needsAssist = (t: MatchEventType) => ['TWO_POINT_MADE', 'THREE_POINT_MADE'].includes(t);

const getEventMeta = (eventType: MatchEventType) =>
  EVENT_TYPES.find((e) => e.value === eventType);

export default function MatchEventsManager({ matchId, team1Id, team2Id }: MatchEventsManagerProps) {
  const {
    events, players, teams, gameState, matchStatus,
    loading, error, showAddForm, editEventId, deleteEventId, formData,
    setShowAddForm, setDeleteEventId, updateForm,
    addEvent, startEdit, updateEvent, cancelEdit, deleteEvent,
    fetchPlayersForTeam,
  } = useMatchEventsStore();

  useEffect(() => {
    useMatchEventsStore.getState().init(matchId, team1Id, team2Id);
  }, [matchId, team1Id, team2Id]);

  // Fetch players when team changes in form
  useEffect(() => {
    if (formData.teamId) fetchPlayersForTeam(formData.teamId);
  }, [formData.teamId]);

  // Pre-fill period/seconds when opening the add form
  useEffect(() => {
    if (gameState && showAddForm && !editEventId) {
      updateForm({
        period: formData.period || String((gameState.period as number) || 1),
        secondsRemaining:
          formData.secondsRemaining ||
          (gameState.clockSeconds != null ? String(gameState.clockSeconds) : ''),
      });
    }
  }, [gameState, showAddForm]);

  const getTeamName = (teamId: string | null | undefined) =>
    teams.find((t) => t.id === teamId)?.name ?? '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editEventId) {
      updateEvent();
    } else {
      addEvent();
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

  const isCompleted = matchStatus === 'COMPLETED';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-heading font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Match Events
        </h3>
        <Button size="sm" onClick={() => setShowAddForm(!showAddForm)} disabled={isCompleted}>
          <Plus className="mr-2 h-4 w-4" />
          Add Event
        </Button>
      </div>

      {isCompleted && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Match is completed.</strong> Cannot add or edit events in a completed match.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editEventId ? 'Edit Match Event' : 'Add Match Event'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eventType">
                    Event Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.eventType}
                    onValueChange={(value) =>
                      updateForm({ eventType: value as MatchEventType, assistPlayerId: '' })
                    }
                    required
                    disabled={!!editEventId || isCompleted}
                  >
                    <SelectTrigger id="eventType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map((event) => (
                        <SelectItem key={event.value} value={event.value}>
                          {event.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minute">
                    Minute <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="minute"
                    type="number"
                    value={formData.minute}
                    onChange={(e) => updateForm({ minute: e.target.value })}
                    required
                    min="0"
                    max="120"
                    placeholder="23"
                    disabled={isCompleted}
                  />
                </div>

                {needsTeam(formData.eventType) && (
                  <div className="space-y-2">
                    <Label htmlFor="teamId">
                      Team <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.teamId}
                      onValueChange={(value) =>
                        updateForm({ teamId: value, playerId: '', assistPlayerId: '' })
                      }
                      required
                      disabled={isCompleted}
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
                )}

                {needsPlayer(formData.eventType) && (
                  <div className="space-y-2">
                    <Label htmlFor="playerId">
                      Player{' '}
                      {requiresPlayer(formData.eventType) && (
                        <span className="text-destructive">*</span>
                      )}
                    </Label>
                    <Select
                      value={formData.playerId}
                      onValueChange={(value) => updateForm({ playerId: value })}
                      disabled={!formData.teamId || isCompleted}
                      required={requiresPlayer(formData.eventType)}
                    >
                      <SelectTrigger id="playerId">
                        <SelectValue placeholder="Select a player" />
                      </SelectTrigger>
                      <SelectContent>
                        {players.map((player) => (
                          <SelectItem key={player.id} value={player.id}>
                            {player.firstName} {player.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="period">
                    Quarter <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="period"
                    type="number"
                    value={formData.period}
                    onChange={(e) => updateForm({ period: e.target.value })}
                    required
                    min="1"
                    max="10"
                    placeholder="1"
                    disabled={isCompleted}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondsRemaining">Seconds Remaining</Label>
                  <Input
                    id="secondsRemaining"
                    type="number"
                    value={formData.secondsRemaining}
                    onChange={(e) => updateForm({ secondsRemaining: e.target.value })}
                    min="0"
                    max="7200"
                    placeholder={
                      gameState?.clockSeconds != null
                        ? String(gameState.clockSeconds)
                        : 'Auto from clock'
                    }
                    disabled={isCompleted}
                  />
                  {gameState?.clockSeconds != null && (
                    <p className="text-xs text-muted-foreground">
                      Current:{' '}
                      {Math.floor((gameState.clockSeconds as number) / 60)}:
                      {String((gameState.clockSeconds as number) % 60).padStart(2, '0')}
                    </p>
                  )}
                </div>
              </div>

              {needsAssist(formData.eventType) && (
                <div className="space-y-2">
                  <Label htmlFor="assistPlayerId">Assist Player</Label>
                  <Select
                    value={formData.assistPlayerId || '__none'}
                    onValueChange={(value) =>
                      updateForm({ assistPlayerId: value === '__none' ? '' : value })
                    }
                    disabled={!formData.teamId || isCompleted}
                  >
                    <SelectTrigger id="assistPlayerId">
                      <SelectValue placeholder="No assist" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">No assist</SelectItem>
                      {players.map((player) => (
                        <SelectItem key={player.id} value={player.id}>
                          {player.firstName} {player.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={2}
                  value={formData.description}
                  onChange={(e) => updateForm({ description: e.target.value })}
                  placeholder="Additional details about the event..."
                  disabled={isCompleted}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isCompleted}>
                  {editEventId ? 'Update Event' : 'Add Event'}
                </Button>
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No events recorded yet
            </p>
          ) : (
            <div className="space-y-2">
              {events.map((event) => {
                const meta = getEventMeta(event.eventType);
                const EventIcon = meta?.icon ?? Activity;
                return (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <EventIcon className="h-5 w-5" />
                      <div>
                        <div className="font-semibold">
                          {meta?.label ?? event.eventType}
                          {' — '}
                          {event.period ? `${getPeriodLabel(event.period)} ` : ''}
                          {event.secondsRemaining
                            ? formatClockTime(event.secondsRemaining)
                            : `${event.minute}'`}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {event.teamId && getTeamName(event.teamId)}
                          {event.teamId && event.player && (
                            <> • {event.player.firstName} {event.player.lastName}</>
                          )}
                          {!event.teamId && event.player && (
                            <>{event.player.firstName} {event.player.lastName}</>
                          )}
                          {event.assistPlayer && (
                            <> (Assist: {event.assistPlayer.firstName} {event.assistPlayer.lastName})</>
                          )}
                          {event.description && <> • {event.description}</>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEdit(event.id)}
                        disabled={isCompleted}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteEventId(event.id)}
                        disabled={isCompleted}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={deleteEventId !== null}
        onOpenChange={(open) => !open && setDeleteEventId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteEventId && deleteEvent(deleteEventId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
