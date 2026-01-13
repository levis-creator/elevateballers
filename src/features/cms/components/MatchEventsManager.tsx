import { useState, useEffect } from 'react';
import type { Player, Team, MatchEventWithDetails, MatchEventType } from '../types';
import { getPeriodLabel, formatClockTime } from '../../game-tracking/lib/utils';
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
import { Plus, X, Activity, Target, Square as CardIcon, Users, Clock, AlertCircle, Circle, Shield, Pencil } from 'lucide-react';

interface MatchEventsManagerProps {
  matchId: string;
  team1Id?: string | null;
  team2Id?: string | null;
}

const EVENT_TYPES: { value: MatchEventType; label: string; icon: any }[] = [
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

export default function MatchEventsManager({ matchId, team1Id, team2Id }: MatchEventsManagerProps) {
  const [events, setEvents] = useState<MatchEventWithDetails[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editEventId, setEditEventId] = useState<string | null>(null);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [formData, setFormData] = useState({
    eventType: 'TWO_POINT_MADE' as MatchEventType,
    minute: '',
    teamId: '',
    playerId: '',
    assistPlayerId: '',
    description: '',
    period: '',
    secondsRemaining: '',
  });

  useEffect(() => {
    if (matchId) {
      fetchMatchEvents();
      fetchTeams();
      fetchGameState();
    }
  }, [matchId]);

  useEffect(() => {
    if (formData.teamId) {
      fetchPlayersForTeam(formData.teamId);
    }
  }, [formData.teamId]);

  useEffect(() => {
    if (gameState && showAddForm) {
      setFormData((prev) => ({
        ...prev,
        period: prev.period || String(gameState.period || 1),
        secondsRemaining: prev.secondsRemaining || (gameState.clockSeconds !== null && gameState.clockSeconds !== undefined ? String(gameState.clockSeconds) : ''),
      }));
    }
  }, [gameState, showAddForm]);

  const fetchMatchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/matches/${matchId}/events`);
      if (!response.ok) throw new Error('Failed to fetch match events');
      const data = await response.json();
      setEvents(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load match events');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
        // Set default team if available
        if (data.length > 0 && !formData.teamId) {
          const defaultTeam = team1Id || team2Id || data[0].id;
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
        setPlayers(data);
      }
    } catch (err) {
      console.error('Failed to fetch players:', err);
    }
  };

  const fetchGameState = async () => {
    try {
      const response = await fetch(`/api/games/${matchId}/state`);
      if (response.ok) {
        const state = await response.json();
        setGameState(state);
      }
    } catch (err) {
      console.error('Failed to fetch game state:', err);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`/api/matches/${matchId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          minute: parseInt(formData.minute),
          teamId: formData.teamId || undefined,
          playerId: formData.playerId || undefined,
          assistPlayerId: formData.assistPlayerId || undefined,
          period: formData.period ? parseInt(formData.period) : undefined,
          secondsRemaining: formData.secondsRemaining ? parseInt(formData.secondsRemaining) : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add event');
      }

      setShowAddForm(false);
      setFormData({
        eventType: 'TWO_POINT_MADE',
        minute: '',
        teamId: formData.teamId,
        playerId: '',
        assistPlayerId: '',
        description: '',
        period: gameState?.period ? String(gameState.period) : '',
        secondsRemaining: gameState?.clockSeconds !== null && gameState?.clockSeconds !== undefined ? String(gameState.clockSeconds) : '',
      });
      fetchMatchEvents();
    } catch (err: any) {
      setError(err.message || 'Failed to add event');
    }
  };

  const handleStartEdit = async (eventId: string) => {
    try {
      const response = await fetch(`/api/matches/${matchId}/events/${eventId}`);
      if (!response.ok) throw new Error('Failed to fetch event');
      const event = await response.json();

      setFormData({
        eventType: event.eventType,
        minute: String(event.minute || ''),
        teamId: event.teamId || '',
        playerId: event.playerId || '',
        assistPlayerId: event.assistPlayerId || '',
        description: event.description || '',
        period: event.period ? String(event.period) : '',
        secondsRemaining: event.secondsRemaining ? String(event.secondsRemaining) : '',
      });

      if (event.teamId) {
        await fetchPlayersForTeam(event.teamId);
      }

      setEditEventId(eventId);
      setShowAddForm(true);
    } catch (err: any) {
      setError(err.message || 'Failed to load event for editing');
    }
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!editEventId) return;

    try {
      const response = await fetch(`/api/matches/${matchId}/events/${editEventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minute: parseInt(formData.minute),
          teamId: formData.teamId || undefined,
          playerId: formData.playerId || undefined,
          assistPlayerId: formData.assistPlayerId || undefined,
          period: formData.period ? parseInt(formData.period) : undefined,
          secondsRemaining: formData.secondsRemaining ? parseInt(formData.secondsRemaining) : undefined,
          description: formData.description || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update event');
      }

      setShowAddForm(false);
      setEditEventId(null);
      setFormData({
        eventType: 'TWO_POINT_MADE',
        minute: '',
        teamId: formData.teamId,
        playerId: '',
        assistPlayerId: '',
        description: '',
        period: gameState?.period ? String(gameState.period) : '',
        secondsRemaining: gameState?.clockSeconds !== null && gameState?.clockSeconds !== undefined ? String(gameState.clockSeconds) : '',
      });
      fetchMatchEvents();
    } catch (err: any) {
      setError(err.message || 'Failed to update event');
    }
  };

  const handleCancelEdit = () => {
    setShowAddForm(false);
    setEditEventId(null);
    setFormData({
      eventType: 'TWO_POINT_MADE',
      minute: '',
      teamId: formData.teamId,
      playerId: '',
      assistPlayerId: '',
      description: '',
      period: gameState?.period ? String(gameState.period) : '',
      secondsRemaining: gameState?.clockSeconds !== null && gameState?.clockSeconds !== undefined ? String(gameState.clockSeconds) : '',
    });
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      const response = await fetch(`/api/matches/${matchId}/events/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete event');
      fetchMatchEvents();
      setDeleteEventId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete event');
    }
  };

  const getEventIcon = (eventType: MatchEventType) => {
    const event = EVENT_TYPES.find((e) => e.value === eventType);
    return event?.icon || Activity;
  };

  const getEventLabel = (eventType: MatchEventType) => {
    const event = EVENT_TYPES.find((e) => e.value === eventType);
    return event?.label || eventType;
  };

  const getTeamName = (teamId: string | null | undefined) => {
    if (!teamId) return '';
    const team = teams.find((t) => t.id === teamId);
    return team?.name || 'Unknown Team';
  };

  const needsPlayer = (eventType: MatchEventType) => {
    // Events that don't require a player
    return !['TIMEOUT', 'BREAK', 'PLAY_RESUMED'].includes(eventType);
  };

  const requiresPlayer = (eventType: MatchEventType) => {
    // Events that MUST have a player (not optional)
    return !['TIMEOUT', 'BREAK', 'PLAY_RESUMED', 'OTHER'].includes(eventType);
  };

  const needsTeam = (eventType: MatchEventType) => {
    // Events that don't need team selection (game-level events)
    return !['BREAK', 'PLAY_RESUMED'].includes(eventType);
  };

  const needsAssist = (eventType: MatchEventType) => {
    // Events that can have an assist
    return ['TWO_POINT_MADE', 'THREE_POINT_MADE'].includes(eventType);
  };

  const shouldShowMinute = (eventType: MatchEventType) => {
    // Events where minute field is less relevant (use period/seconds instead)
    // For most events, minute is still useful as fallback
    return true;
  };

  const shouldShowPeriodAndSeconds = (eventType: MatchEventType) => {
    // All events benefit from period and seconds tracking
    return true;
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
          <Activity className="h-5 w-5" />
          Match Events
        </h3>
        <Button
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Event
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
            <CardTitle>{editEventId ? 'Edit Match Event' : 'Add Match Event'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={editEventId ? handleUpdateEvent : handleAddEvent} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eventType">
                    Event Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.eventType}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        eventType: value as MatchEventType,
                        assistPlayerId: '',
                      }))
                    }
                    required
                    disabled={!!editEventId}
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
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, minute: e.target.value }))
                    }
                    required
                    min="0"
                    max="120"
                    placeholder="23"
                  />
                </div>

                {needsTeam(formData.eventType) && (
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
                          assistPlayerId: '',
                        }));
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
                )}

                {needsPlayer(formData.eventType) && (
                  <div className="space-y-2">
                    <Label htmlFor="playerId">
                      Player {requiresPlayer(formData.eventType) && <span className="text-destructive">*</span>}
                    </Label>
                    <Select
                      value={formData.playerId}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, playerId: value }))
                      }
                      disabled={!formData.teamId}
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
                    Period <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="period"
                    type="number"
                    value={formData.period}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, period: e.target.value }))
                    }
                    required
                    min="1"
                    max="10"
                    placeholder="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondsRemaining">
                    Seconds Remaining
                  </Label>
                  <Input
                    id="secondsRemaining"
                    type="number"
                    value={formData.secondsRemaining}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, secondsRemaining: e.target.value }))
                    }
                    min="0"
                    max="7200"
                    placeholder={gameState?.clockSeconds !== null && gameState?.clockSeconds !== undefined ? String(gameState.clockSeconds) : "Auto from clock"}
                  />
                  {gameState?.clockSeconds !== null && gameState?.clockSeconds !== undefined && (
                    <p className="text-xs text-muted-foreground">
                      Current: {Math.floor(gameState.clockSeconds / 60)}:{(gameState.clockSeconds % 60).toString().padStart(2, '0')}
                    </p>
                  )}
                </div>
              </div>

              {needsAssist(formData.eventType) && (
                <div className="space-y-2">
                  <Label htmlFor="assistPlayerId">Assist Player</Label>
                  <Select
                    value={formData.assistPlayerId || "__none"}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, assistPlayerId: value === "__none" ? "" : value }))
                    }
                    disabled={!formData.teamId}
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
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Additional details about the event..."
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">{editEventId ? 'Update Event' : 'Add Event'}</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                >
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
                const EventIcon = getEventIcon(event.eventType);
                return (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <EventIcon className="h-5 w-5" />
                      <div>
                        <div className="font-semibold">
                          {getEventLabel(event.eventType)} - {event.period ? `${getPeriodLabel(event.period)} ` : ''}{event.secondsRemaining ? formatClockTime(event.secondsRemaining) : `${event.minute}'`}
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
                        onClick={() => handleStartEdit(event.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteEventId(event.id)}
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

      <AlertDialog open={deleteEventId !== null} onOpenChange={(open) => !open && setDeleteEventId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteEventId && handleDeleteEvent(deleteEventId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
