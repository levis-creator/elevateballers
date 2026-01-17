import { useState, useEffect, type ComponentType } from 'react';
import type { MatchWithFullDetails, MatchPlayerWithDetails, MatchEventWithDetails } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getTeam1Name, getTeam1Logo, getTeam2Name, getTeam2Logo, getTeam1Id, getTeam2Id, getWinnerName, isWinner } from '../../matches/lib/team-helpers';
import { getLeagueName } from '../../matches/lib/league-helpers';
import AddNewPlayerModal from './AddNewPlayerModal';
import GameTrackingPanel from '../../game-tracking/components/GameTrackingPanel';
import { formatClockTime } from '../../game-tracking/lib/utils';
import { getPeriodLabel } from '../../game-tracking/lib/utils';
import { useGameTrackingStore } from '../../game-tracking/stores/useGameTrackingStore';

interface MatchDetailViewProps {
  matchId: string;
  initialMatch?: any;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  TWO_POINT_MADE: '2-Point Made',
  TWO_POINT_MISSED: '2-Point Missed',
  THREE_POINT_MADE: '3-Point Made',
  THREE_POINT_MISSED: '3-Point Missed',
  FREE_THROW_MADE: 'Free Throw Made',
  FREE_THROW_MISSED: 'Free Throw Missed',
  ASSIST: 'Assist',
  REBOUND_OFFENSIVE: 'Offensive Rebound',
  REBOUND_DEFENSIVE: 'Defensive Rebound',
  STEAL: 'Steal',
  BLOCK: 'Block',
  TURNOVER: 'Turnover',
  FOUL_PERSONAL: 'Personal Foul',
  FOUL_TECHNICAL: 'Technical Foul',
  FOUL_FLAGRANT: 'Flagrant Foul',
  SUBSTITUTION_IN: 'Sub In',
  SUBSTITUTION_OUT: 'Sub Out',
  TIMEOUT: 'Timeout',
  INJURY: 'Injury',
  BREAK: 'Break',
  PLAY_RESUMED: 'Play Resumed',
  OTHER: 'Other',
};

// Add/Edit Match Event Modal Component
interface AddMatchEventModalProps {
  matchId: string;
  team1Id: string | null;
  team2Id: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editEventId?: string | null;
  matchStatus?: string;
}

function AddMatchEventModal({ matchId, team1Id, team2Id, isOpen, onClose, onSuccess, editEventId, matchStatus }: AddMatchEventModalProps) {
  const [teams, setTeams] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gameState, setGameState] = useState<any>(null);
  const isCompleted = matchStatus === 'COMPLETED';
  const isLive = matchStatus === 'LIVE';
  const isNotLive = matchStatus !== 'LIVE';
  const [formData, setFormData] = useState({
    eventType: 'TWO_POINT_MADE' as string,
    minute: '',
    teamId: '',
    playerId: '',
    assistPlayerId: '',
    description: '',
    period: '',
    secondsRemaining: '',
  });
  const [icons, setIcons] = useState<{
    AlertCircle?: ComponentType<any>;
    Loader2?: ComponentType<any>;
    Activity?: ComponentType<any>;
    Goal?: ComponentType<any>;
    Square?: ComponentType<any>;
    Users?: ComponentType<any>;
    Clock?: ComponentType<any>;
  }>({});

  useEffect(() => {
    // Load icons only on client side
    import('lucide-react').then((mod) => {
      setIcons({
        AlertCircle: mod.AlertCircle,
        Loader2: mod.Loader2,
        Activity: mod.Activity,
        Goal: mod.Goal,
        Square: mod.Square,
        Users: mod.Users,
        Clock: mod.Clock,
      });
    });
  }, []);

  useEffect(() => {
    fetchMatchTeams();
    if (isOpen) {
      fetchGameState();
    }
  }, [team1Id, team2Id, isOpen]);

  useEffect(() => {
    if (formData.teamId) {
      fetchPlayersForTeam(formData.teamId);
    } else {
      setPlayers([]);
    }
  }, [formData.teamId]);

  useEffect(() => {
    if (gameState && isOpen) {
      setFormData((prev) => ({
        ...prev,
        period: prev.period || String(gameState.period || 1),
        secondsRemaining: prev.secondsRemaining || (gameState.clockSeconds !== null && gameState.clockSeconds !== undefined ? String(gameState.clockSeconds) : ''),
      }));
    }
  }, [gameState, isOpen]);


  const fetchMatchTeams = async () => {
    try {
      const teamPromises: Promise<any>[] = [];
      
      if (team1Id) {
        teamPromises.push(fetch(`/api/teams/${team1Id}`).then(res => res.ok ? res.json() : null));
      }
      
      if (team2Id) {
        teamPromises.push(fetch(`/api/teams/${team2Id}`).then(res => res.ok ? res.json() : null));
      }
      
      const fetchedTeams = await Promise.all(teamPromises);
      const validTeams = fetchedTeams.filter(team => team !== null);
      
      setTeams(validTeams);
      
      if (validTeams.length > 0) {
        const defaultTeam = team1Id || team2Id || validTeams[0].id;
        setFormData((prev) => ({ ...prev, teamId: defaultTeam }));
      }
    } catch (err) {
      console.error('Failed to fetch match teams:', err);
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

  const needsPlayer = (eventType: string) => {
    // Events that don't require a player
    return !['TIMEOUT', 'BREAK', 'PLAY_RESUMED'].includes(eventType);
  };

  const requiresPlayer = (eventType: string) => {
    // Events that MUST have a player (not optional)
    return !['TIMEOUT', 'BREAK', 'PLAY_RESUMED', 'OTHER'].includes(eventType);
  };

  const needsTeam = (eventType: string) => {
    // Events that don't need team selection (game-level events)
    return !['BREAK', 'PLAY_RESUMED'].includes(eventType);
  };

  const needsAssist = (eventType: string) => {
    // Events that can have an assist
    return ['TWO_POINT_MADE', 'THREE_POINT_MADE'].includes(eventType);
  };

  const shouldShowMinute = (eventType: string) => {
    // Events where minute field is less relevant (use period/seconds instead)
    // For most events, minute is still useful as fallback
    return true;
  };

  const shouldShowPeriodAndSeconds = (eventType: string) => {
    // All events benefit from quarter and seconds tracking
    return true;
  };

  useEffect(() => {
    if (editEventId && isOpen) {
      fetchEventData();
    } else if (isOpen && !editEventId) {
      // Reset form for new event
      if (gameState) {
        setFormData({
          eventType: 'TWO_POINT_MADE',
          minute: '',
          teamId: '',
          playerId: '',
          assistPlayerId: '',
          description: '',
          period: gameState.period ? String(gameState.period) : '',
          secondsRemaining: gameState.clockSeconds !== null && gameState.clockSeconds !== undefined ? String(gameState.clockSeconds) : '',
        });
      }
    }
  }, [editEventId, isOpen, gameState]);

  const fetchEventData = async () => {
    if (!editEventId) return;
    try {
      const response = await fetch(`/api/matches/${matchId}/events/${editEventId}`);
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
    } catch (err: any) {
      setError(err.message || 'Failed to load event');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Block submission if match is not live
    if (isNotLive) {
      setError('Match must be live to add or edit events');
      return;
    }
    
    // Block submission if match is completed
    if (isCompleted) {
      setError('Cannot add or edit events in a completed match');
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      const url = editEventId 
        ? `/api/matches/${matchId}/events/${editEventId}`
        : `/api/matches/${matchId}/events`;
      const method = editEventId ? 'PUT' : 'POST';
      
      const body = editEventId ? {
        minute: parseInt(formData.minute),
        teamId: formData.teamId || undefined,
        playerId: formData.playerId || undefined,
        assistPlayerId: formData.assistPlayerId || undefined,
        period: formData.period ? parseInt(formData.period) : undefined,
        secondsRemaining: formData.secondsRemaining ? parseInt(formData.secondsRemaining) : undefined,
        description: formData.description || undefined,
      } : {
        ...formData,
        minute: parseInt(formData.minute),
        teamId: formData.teamId || undefined,
        playerId: formData.playerId || undefined,
        assistPlayerId: formData.assistPlayerId || undefined,
        period: formData.period ? parseInt(formData.period) : undefined,
        secondsRemaining: formData.secondsRemaining ? parseInt(formData.secondsRemaining) : undefined,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${editEventId ? 'update' : 'add'} event`);
      }

      onSuccess();
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
    } catch (err: any) {
      setError(err.message || `Failed to ${editEventId ? 'update' : 'add'} event`);
    } finally {
      setLoading(false);
    }
  };

  const EVENT_TYPES = [
    { value: 'TWO_POINT_MADE', label: '2-Point Made' },
    { value: 'TWO_POINT_MISSED', label: '2-Point Missed' },
    { value: 'THREE_POINT_MADE', label: '3-Point Made' },
    { value: 'THREE_POINT_MISSED', label: '3-Point Missed' },
    { value: 'FREE_THROW_MADE', label: 'Free Throw Made' },
    { value: 'FREE_THROW_MISSED', label: 'Free Throw Missed' },
    { value: 'ASSIST', label: 'Assist' },
    { value: 'REBOUND_OFFENSIVE', label: 'Offensive Rebound' },
    { value: 'REBOUND_DEFENSIVE', label: 'Defensive Rebound' },
    { value: 'STEAL', label: 'Steal' },
    { value: 'BLOCK', label: 'Block' },
    { value: 'TURNOVER', label: 'Turnover' },
    { value: 'FOUL_PERSONAL', label: 'Personal Foul' },
    { value: 'FOUL_TECHNICAL', label: 'Technical Foul' },
    { value: 'FOUL_FLAGRANT', label: 'Flagrant Foul' },
    { value: 'SUBSTITUTION_IN', label: 'Substitution In' },
    { value: 'SUBSTITUTION_OUT', label: 'Substitution Out' },
    { value: 'TIMEOUT', label: 'Timeout' },
    { value: 'INJURY', label: 'Injury' },
    { value: 'BREAK', label: 'Break' },
    { value: 'PLAY_RESUMED', label: 'Play Resumed' },
    { value: 'OTHER', label: 'Other' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editEventId ? 'Edit Match Event' : 'Add Match Event'}</DialogTitle>
          <DialogDescription>
            {editEventId ? 'Update the event details.' : 'Record an event that occurred during this match (goal, card, substitution, etc.).'}
          </DialogDescription>
        </DialogHeader>
        {isNotLive && (
          <Alert variant="destructive">
            {icons.AlertCircle ? <icons.AlertCircle className="h-4 w-4" /> : <span className="h-4 w-4" />}
            <AlertDescription>
              <strong>Match is not live.</strong> {isCompleted ? 'Cannot add or edit events in a completed match.' : 'Match must be live to add or edit events.'}
            </AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive">
            {icons.AlertCircle ? <icons.AlertCircle className="h-4 w-4" /> : <span className="h-4 w-4" />}
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="modal-eventType">
                Event Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.eventType}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    eventType: value,
                    assistPlayerId: '',
                  }))
                }
                required
                disabled={!!editEventId || isNotLive}
              >
                <SelectTrigger id="modal-eventType">
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
              <Label htmlFor="modal-minute">
                {icons.Clock ? <icons.Clock className="inline h-4 w-4 mr-2" /> : null}
                Minute <span className="text-destructive">*</span>
              </Label>
              <Input
                id="modal-minute"
                type="number"
                value={formData.minute}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, minute: e.target.value }))
                }
                required
                min="0"
                max="120"
                placeholder="23"
                disabled={isNotLive}
              />
            </div>

            {needsTeam(formData.eventType) && (
              <div className="space-y-2">
                <Label htmlFor="modal-teamId">
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
                  required={needsTeam(formData.eventType)}
                  disabled={isNotLive}
                >
                  <SelectTrigger id="modal-teamId">
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
                <Label htmlFor="modal-playerId">
                  Player {requiresPlayer(formData.eventType) && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={formData.playerId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, playerId: value }))
                  }
                  disabled={!formData.teamId || isNotLive}
                  required={requiresPlayer(formData.eventType)}
                >
                  <SelectTrigger id="modal-playerId">
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
              <Label htmlFor="modal-period">
                Quarter <span className="text-destructive">*</span>
              </Label>
              <Input
                id="modal-period"
                type="number"
                value={formData.period}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, period: e.target.value }))
                }
                required
                min="1"
                max="10"
                placeholder="1"
                disabled={isNotLive}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="modal-secondsRemaining">
                Seconds Remaining
              </Label>
              <Input
                id="modal-secondsRemaining"
                type="number"
                value={formData.secondsRemaining}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, secondsRemaining: e.target.value }))
                }
                min="0"
                max="7200"
                placeholder={gameState?.clockSeconds !== null && gameState?.clockSeconds !== undefined ? String(gameState.clockSeconds) : "Auto from clock"}
                disabled={isNotLive}
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
              <Label htmlFor="modal-assistPlayerId">Assist Player</Label>
              <Select
                value={formData.assistPlayerId || "__none"}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, assistPlayerId: value === "__none" ? "" : value }))
                }
                disabled={!formData.teamId || isNotLive}
              >
                <SelectTrigger id="modal-assistPlayerId">
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
            <Label htmlFor="modal-description">Description</Label>
            <Textarea
              id="modal-description"
              rows={2}
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Additional details about the event..."
              disabled={isNotLive}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || isNotLive}>
              {loading ? (
                <>
                  {icons.Loader2 ? <icons.Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <span className="mr-2 h-4 w-4" />}
                  {editEventId ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                editEventId ? 'Update Event' : 'Add Event'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Add Player Modal Component
interface AddPlayerModalProps {
  matchId: string;
  team1Id: string | null;
  team2Id: string | null;
  existingMatchPlayers?: any[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function AddPlayerModal({ matchId, team1Id, team2Id, existingMatchPlayers = [], isOpen, onClose, onSuccess }: AddPlayerModalProps) {
  const [availablePlayers, setAvailablePlayers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddNewPlayerModal, setShowAddNewPlayerModal] = useState(false);
  const [formData, setFormData] = useState({
    playerId: '',
    teamId: '',
    started: false,
    position: '',
    jerseyNumber: '',
    minutesPlayed: '',
  });
  const [icons, setIcons] = useState<{
    AlertCircle?: ComponentType<any>;
    Loader2?: ComponentType<any>;
    Plus?: ComponentType<any>;
  }>({});

  useEffect(() => {
    // Load icons only on client side
    import('lucide-react').then((mod) => {
      setIcons({
        AlertCircle: mod.AlertCircle,
        Loader2: mod.Loader2,
        Plus: mod.Plus,
      });
    });
  }, []);

  useEffect(() => {
    fetchMatchTeams();
  }, [team1Id, team2Id]);

  useEffect(() => {
    if (formData.teamId) {
      fetchPlayersForTeam(formData.teamId);
    } else {
      setAvailablePlayers([]);
    }
  }, [formData.teamId, existingMatchPlayers]);

  const fetchMatchTeams = async () => {
    try {
      const teamPromises: Promise<any>[] = [];
      
      if (team1Id) {
        teamPromises.push(fetch(`/api/teams/${team1Id}`).then(res => res.ok ? res.json() : null));
      }
      
      if (team2Id) {
        teamPromises.push(fetch(`/api/teams/${team2Id}`).then(res => res.ok ? res.json() : null));
      }
      
      const fetchedTeams = await Promise.all(teamPromises);
      const validTeams = fetchedTeams.filter(team => team !== null);
      
      setTeams(validTeams);
      
      if (validTeams.length > 0) {
        const defaultTeam = team1Id || team2Id || validTeams[0].id;
        setFormData((prev) => ({ ...prev, teamId: defaultTeam }));
      }
    } catch (err) {
      console.error('Failed to fetch match teams:', err);
    }
  };

  const fetchPlayersForTeam = async (teamId: string) => {
    try {
      const response = await fetch(`/api/players?teamId=${teamId}`);
      if (response.ok) {
        const data = await response.json();
        // Filter out players that are already added as match players
        const existingPlayerIds = new Set(
          existingMatchPlayers
            .map((mp) => {
              // Handle both playerId field and nested player object
              return mp.playerId || mp.player?.id;
            })
            .filter((id): id is string => Boolean(id))
        );
        const filteredPlayers = data.filter((player: any) => !existingPlayerIds.has(player.id));
        setAvailablePlayers(filteredPlayers);
      }
    } catch (err) {
      console.error('Failed to fetch players:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

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

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to add player');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
    }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Player to Match</DialogTitle>
          <DialogDescription>
            Select a team and player to add to this match.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <Alert variant="destructive">
            {icons.AlertCircle ? <icons.AlertCircle className="h-4 w-4" /> : <span className="h-4 w-4" />}
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="modal-teamId">
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
              }}
              required
            >
              <SelectTrigger id="modal-teamId">
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
            <div className="flex items-center justify-between">
              <Label htmlFor="modal-playerId">
                Player <span className="text-destructive">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddNewPlayerModal(true)}
                disabled={!formData.teamId}
              >
                {icons.Plus ? <icons.Plus className="mr-2 h-4 w-4" /> : <span className="mr-2 h-4 w-4" />}
                Add New Player
              </Button>
            </div>
            <Select
              value={formData.playerId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, playerId: value }))
              }
              required
              disabled={!formData.teamId}
            >
              <SelectTrigger id="modal-playerId">
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

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="modal-position">Position</Label>
              <Select
                value={formData.position || undefined}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, position: value }))
                }
              >
                <SelectTrigger id="modal-position">
                  <SelectValue placeholder="Select position (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PG">Point Guard (PG)</SelectItem>
                  <SelectItem value="SG">Shooting Guard (SG)</SelectItem>
                  <SelectItem value="SF">Small Forward (SF)</SelectItem>
                  <SelectItem value="PF">Power Forward (PF)</SelectItem>
                  <SelectItem value="C">Center (C)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="modal-jerseyNumber">Jersey #</Label>
              <Input
                id="modal-jerseyNumber"
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
              <Label htmlFor="modal-minutesPlayed">Minutes</Label>
              <Input
                id="modal-minutesPlayed"
                type="number"
                value={formData.minutesPlayed}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, minutesPlayed: e.target.value }))
                }
                min="0"
                max="120"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="modal-started"
              checked={formData.started}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, started: checked === true }))
              }
            />
            <Label htmlFor="modal-started" className="cursor-pointer">
              Started
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  {icons.Loader2 ? <icons.Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <span className="mr-2 h-4 w-4" />}
                  Adding...
                </>
              ) : (
                'Add Player'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      
      {/* Add New Player Modal */}
      <AddNewPlayerModal
        team1Id={team1Id}
        team2Id={team2Id}
        isOpen={showAddNewPlayerModal}
        onClose={() => setShowAddNewPlayerModal(false)}
        onSuccess={async (newPlayer) => {
          setShowAddNewPlayerModal(false);
          // Refresh players list for the selected team
          if (formData.teamId) {
            await fetchPlayersForTeam(formData.teamId);
            // Auto-select the newly created player
            setFormData((prev) => ({ ...prev, playerId: newPlayer.id }));
          }
        }}
      />
    </Dialog>
  );
}

export default function MatchDetailView({ matchId, initialMatch }: MatchDetailViewProps) {
  const [match, setMatch] = useState<MatchWithFullDetails | null>(
    initialMatch ? { ...initialMatch, matchPlayers: [], events: [] } : null
  );
  const [loading, setLoading] = useState(!initialMatch); // Start loading if no initial match
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState('');
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [editEventId, setEditEventId] = useState<string | null>(null);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
  const [isEndingGame, setIsEndingGame] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const { endGame, startGame } = useGameTrackingStore();
  const [icons, setIcons] = useState<{
    Calendar?: ComponentType<any>;
    Clock?: ComponentType<any>;
    Trophy?: ComponentType<any>;
    Users?: ComponentType<any>;
    Activity?: ComponentType<any>;
    Goal?: ComponentType<any>;
    Card?: ComponentType<any>;
    Edit?: ComponentType<any>;
    ArrowLeft?: ComponentType<any>;
    Plus?: ComponentType<any>;
    AlertCircle?: ComponentType<any>;
    Loader2?: ComponentType<any>;
    Shirt?: ComponentType<any>;
    Pencil?: ComponentType<any>;
    X?: ComponentType<any>;
    MoreVertical?: ComponentType<any>;
    Trash2?: ComponentType<any>;
  }>({});

  useEffect(() => {
    // Load icons only on client side
    import('lucide-react').then((mod) => {
      setIcons({
        Calendar: mod.Calendar,
        Clock: mod.Clock,
        Trophy: mod.Trophy,
        Users: mod.Users,
        Activity: mod.Activity,
        Goal: mod.Goal,
        Card: mod.Square,
        Edit: mod.Edit,
        ArrowLeft: mod.ArrowLeft,
        Plus: mod.Plus,
        AlertCircle: mod.AlertCircle,
        Loader2: mod.Loader2,
        Shirt: mod.Shirt,
        Pencil: mod.Pencil,
        X: mod.X,
        MoreVertical: mod.MoreVertical,
        Trash2: mod.Trash2,
      });
    });
  }, []);

  useEffect(() => {
    // Always fetch match data since we're client-rendered
    if (matchId) {
      fetchMatch();
    } else {
      setError('Match ID is required');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  const fetchMatch = async () => {
    if (!matchId) {
      setError('Match ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/matches/${matchId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch match' }));
        throw new Error(errorData.error || `Server returned ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data || !data.id) {
        throw new Error('Invalid match data received');
      }
      
      const matchData = {
        ...data,
        matchPlayers: data.matchPlayers || [],
        events: data.events || [],
      };
      
      setMatch(matchData);
      setLoading(false);
      
      // Fetch additional details (players and events)
      setLoadingDetails(true);
      fetchMatchDetails().finally(() => setLoadingDetails(false));
    } catch (err: any) {
      setError(err.message || 'Failed to load match');
      setLoading(false);
    }
  };

  const refreshMatchPlayers = async () => {
    try {
      const response = await fetch(`/api/matches/${matchId}/players`);
      if (response.ok) {
        const players = await response.json();
        setMatch((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            matchPlayers: players || [],
          };
        });
      }
    } catch (err) {
      console.error('Failed to refresh match players:', err);
    }
  };

  const fetchMatchDetails = async () => {
    try {
      const [playersRes, eventsRes] = await Promise.all([
        fetch(`/api/matches/${matchId}/players`).catch(() => ({ ok: false })),
        fetch(`/api/matches/${matchId}/events`).catch(() => ({ ok: false })),
      ]);
      
      const players = playersRes.ok && playersRes instanceof Response ? await playersRes.json() : [];
      const events = eventsRes.ok && eventsRes instanceof Response ? await eventsRes.json() : [];
      
      setMatch((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          matchPlayers: players || [],
          events: events || [],
        };
      });
    } catch (err) {
      console.warn('Failed to fetch match details:', err);
    }
  };

  const getPlayersByTeam = (teamId: string) => {
    if (!match?.matchPlayers) return [];
    return match.matchPlayers.filter((mp) => mp.teamId === teamId);
  };

  const getEventsByTeam = (teamId: string) => {
    if (!match?.events) return [];
    return match.events.filter((e) => e.teamId === teamId);
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/matches/${matchId}/events/${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete event');
      setDeleteEventId(null);
      fetchMatchDetails();
    } catch (err: any) {
      setError(err.message || 'Failed to delete event');
      setDeleteEventId(null);
    }
  };

  const handleEditEvent = (eventId: string) => {
    setEditEventId(eventId);
    setShowAddEventModal(true);
  };

  const handleCloseEventModal = () => {
    setShowAddEventModal(false);
    setEditEventId(null);
  };

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' => {
    if (status === 'LIVE') return 'destructive';
    if (status === 'COMPLETED') return 'default';
    return 'secondary';
  };

  // Early return if no matchId
  if (!matchId) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>Match ID is required</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading || (!match && !error)) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Alert variant="destructive">
          {icons.AlertCircle ? <icons.AlertCircle className="h-4 w-4" /> : <span className="h-4 w-4" />}
          <AlertDescription>{error || 'Match not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const team1Name = getTeam1Name(match);
  const team1Logo = getTeam1Logo(match);
  const team2Name = getTeam2Name(match);
  const team2Logo = getTeam2Logo(match);
  const leagueName = getLeagueName(match);
  const team1Id = getTeam1Id(match);
  const team2Id = getTeam2Id(match);
  const team1IsWinner = isWinner(match, team1Id);
  const team2IsWinner = isWinner(match, team2Id);
  const winnerName = getWinnerName(match);
  const isTie = match.status === 'COMPLETED' && match.team1Score !== null && match.team2Score !== null && match.team1Score === match.team2Score;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <a href="/admin/matches" data-astro-prefetch>
              {icons.ArrowLeft ? <icons.ArrowLeft className="mr-2 h-4 w-4" /> : <span className="mr-2 h-4 w-4" />}
            Back to Matches
          </a>
          </Button>
          <h1 className="text-3xl font-heading font-semibold text-foreground">Match Details</h1>
        </div>
        {match && (
          <div className="flex gap-2">
            {match.status === 'UPCOMING' && (
              <Button
                onClick={async () => {
                  if (window.confirm('Are you sure you want to start this game? This will change the match status to LIVE.')) {
                    setIsStartingGame(true);
                    try {
                      await startGame(matchId);
                      // Refresh the page to show updated status
                      window.location.reload();
                    } catch (error) {
                      console.error('Failed to start game:', error);
                      alert('Failed to start game. Please try again.');
                      setIsStartingGame(false);
                    }
                  }
                }}
                disabled={isStartingGame}
                variant="default"
                size="default"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isStartingGame ? 'Starting...' : 'Start Match'}
              </Button>
            )}
            {match.status === 'LIVE' && (
              <Button
                onClick={async () => {
                  if (window.confirm('Are you sure you want to end this game? This action cannot be undone.')) {
                    setIsEndingGame(true);
                    try {
                      await endGame(matchId);
                      // Refresh the page to show updated status
                      window.location.reload();
                    } catch (error) {
                      console.error('Failed to end game:', error);
                      alert('Failed to end game. Please try again.');
                      setIsEndingGame(false);
                    }
                  }
                }}
                disabled={isEndingGame}
                variant="destructive"
                size="default"
              >
                {isEndingGame ? 'Ending...' : 'End Game'}
              </Button>
            )}
            <Button asChild disabled={match?.status === 'COMPLETED'}>
              <a href={`/admin/matches/${matchId}`} data-astro-prefetch>
                {icons.Edit ? <icons.Edit className="mr-2 h-4 w-4" /> : <span className="mr-2 h-4 w-4" />}
            Edit Match
          </a>
            </Button>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          {icons.AlertCircle ? <icons.AlertCircle className="h-4 w-4" /> : <span className="h-4 w-4" />}
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loadingDetails && (
        <Alert>
          {icons.Loader2 ? <icons.Loader2 className="h-4 w-4 animate-spin" /> : <span className="h-4 w-4" />}
          <AlertDescription>Loading players and events...</AlertDescription>
        </Alert>
      )}

      {match && (
        <>
          {/* Match Header Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Team 1 */}
                <div className={`flex-1 text-center ${team1IsWinner ? 'winner-highlight' : ''}`}>
            {team1Logo && (
                    <img
                      src={team1Logo}
                      alt={team1Name}
                      className="w-24 h-24 mx-auto mb-4 object-contain"
                    />
                  )}
                  <h2 className="text-2xl font-heading font-semibold mb-2">{team1Name}</h2>
                  {match.team1Score !== null && match.team1Score !== undefined && (
                    <div className="text-5xl font-bold">{match.team1Score}</div>
            )}
                  {team1IsWinner && (
                    <div className="mt-2">
                      <Badge className="bg-yellow-500 text-white">
                        🏆 Winner
                      </Badge>
                    </div>
                  )}
          </div>
          
                {/* Match Info Center */}
                <div className="flex-shrink-0 text-center min-w-[200px]">
                  <Badge variant={getStatusVariant(match.status)} className="mb-4">
                    {match.status}
                  </Badge>
                  {isTie && (
                    <Badge variant="outline" className="mb-4 ml-2">Tie</Badge>
                  )}
                  {match.date && (
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        {icons.Calendar ? <icons.Calendar className="h-4 w-4" /> : <span className="h-4 w-4" />}
                        {new Date(match.date).toLocaleDateString('en-US', {
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                          day: 'numeric',
              })}
            </div>
                      <div className="flex items-center justify-center gap-2">
                        {icons.Clock ? <icons.Clock className="h-4 w-4" /> : <span className="h-4 w-4" />}
                        {new Date(match.date).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
            </div>
            {leagueName && (
                        <div className="flex items-center justify-center gap-2">
                          {icons.Trophy ? <icons.Trophy className="h-4 w-4" /> : <span className="h-4 w-4" />}
                {leagueName}
              </div>
            )}
                      {match.season && (
                        <div className="text-xs opacity-85">
                Season: {match.season.name}
                        </div>
                      )}
              </div>
            )}
          </div>
          
                {/* Team 2 */}
                <div className={`flex-1 text-center ${team2IsWinner ? 'winner-highlight' : ''}`}>
            {team2Logo && (
                    <img
                      src={team2Logo}
                      alt={team2Name}
                      className="w-24 h-24 mx-auto mb-4 object-contain"
                    />
                  )}
                  <h2 className="text-2xl font-heading font-semibold mb-2">{team2Name}</h2>
                  {match.team2Score !== null && match.team2Score !== undefined && (
                    <div className="text-5xl font-bold">{match.team2Score}</div>
            )}
                  {team2IsWinner && (
                    <div className="mt-2">
                      <Badge className="bg-yellow-500 text-white">
                        🏆 Winner
                      </Badge>
                    </div>
                  )}
          </div>
        </div>
            </CardContent>
          </Card>

      {/* Winner Summary (for completed matches) */}
      {match.status === 'COMPLETED' && (winnerName || isTie) && (
        <Alert>
          {icons.Trophy ? <icons.Trophy className="h-4 w-4" /> : <span className="h-4 w-4" />}
          <AlertDescription>
            <strong>Match Result:</strong>{' '}
            {isTie ? (
              <span>Match ended in a tie ({match.team1Score} - {match.team2Score})</span>
            ) : (
              <span><strong>{winnerName}</strong> won the match</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Alert for non-live matches */}
      {match.status !== 'LIVE' && (
        <Alert>
          {icons.AlertCircle ? <icons.AlertCircle className="h-4 w-4" /> : <span className="h-4 w-4" />}
          <AlertDescription>
            <strong>Match is not live.</strong> {match.status === 'UPCOMING' 
              ? 'Start the match to enable event tracking and timer controls. You can still add players to the match.' 
              : 'This match has been completed. Event tracking and timer controls are no longer available.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Game Tracking Panel */}
      {match.status === 'LIVE' || match.status === 'UPCOMING' ? (
        <GameTrackingPanel matchId={matchId} match={match} />
      ) : null}

      {/* Match Players */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {icons.Users ? <icons.Users className="h-6 w-6" /> : <span className="h-6 w-6" />}
              Match Players
                  {match.matchPlayers && match.matchPlayers.length > 0 && (
                    <span className="text-sm font-normal text-muted-foreground">
                  ({match.matchPlayers.length})
                </span>
              )}
                </CardTitle>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setShowAddPlayerModal(true)}
                >
                  {icons.Plus ? <icons.Plus className="mr-2 h-4 w-4" /> : <span className="mr-2 h-4 w-4" />}
            Add Player
                </Button>
        </div>
            </CardHeader>
            <CardContent>
              {match.matchPlayers && match.matchPlayers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {team1Id && (
                <div>
                      <h3 className="text-lg font-semibold mb-4 pb-2 border-b">
                        {team1Name}
                      </h3>
                      <div className="space-y-2">
                  {getPlayersByTeam(team1Id).map((mp) => (
                          <div
                            key={mp.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-2 flex-wrap">
                              <strong>{mp.player.firstName} {mp.player.lastName}</strong>
                            {mp.jerseyNumber && (
                                <Badge variant="secondary" className="gap-1">
                                  {icons.Shirt ? <icons.Shirt className="h-3 w-3" /> : <span className="h-3 w-3" />}
                                  {mp.jerseyNumber}
                                </Badge>
                              )}
                              {mp.started && <Badge variant="default">Started</Badge>}
                            {mp.position && (
                                <span className="text-sm text-muted-foreground">
                                {mp.position}
                              </span>
                            )}
                            {mp.minutesPlayed !== null && (
                                <span className="text-sm text-muted-foreground">
                                {mp.minutesPlayed}'
                              </span>
                            )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

                  {team2Id && (
                <div>
                      <h3 className="text-lg font-semibold mb-4 pb-2 border-b">
                        {team2Name}
                      </h3>
                      <div className="space-y-2">
                  {getPlayersByTeam(team2Id).map((mp) => (
                          <div
                            key={mp.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-2 flex-wrap">
                              <strong>{mp.player.firstName} {mp.player.lastName}</strong>
                            {mp.jerseyNumber && (
                                <Badge variant="secondary" className="gap-1">
                                  {icons.Shirt ? <icons.Shirt className="h-3 w-3" /> : <span className="h-3 w-3" />}
                                  {mp.jerseyNumber}
                                </Badge>
                              )}
                              {mp.started && <Badge variant="default">Started</Badge>}
                            {mp.position && (
                                <span className="text-sm text-muted-foreground">
                                {mp.position}
                              </span>
                            )}
                            {mp.minutesPlayed !== null && (
                                <span className="text-sm text-muted-foreground">
                                {mp.minutesPlayed}'
                              </span>
                            )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
                <div className="text-center py-12">
                  {icons.Users ? <icons.Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" /> : <span className="h-12 w-12 mx-auto mb-4" />}
                  <p className="text-muted-foreground">No players added to this match yet</p>
          </div>
        )}
            </CardContent>
          </Card>

      {/* Match Events */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {icons.Activity ? <icons.Activity className="h-6 w-6" /> : <span className="h-6 w-6" />}
              Match Events
                  {match.events && match.events.length > 0 && (
                    <span className="text-sm font-normal text-muted-foreground">
                  ({match.events.length})
                </span>
              )}
                </CardTitle>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setShowAddEventModal(true)}
                  disabled={match?.status !== 'LIVE'}
                >
                  {icons.Plus ? <icons.Plus className="mr-2 h-4 w-4" /> : <span className="mr-2 h-4 w-4" />}
              Add Event
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {match.events && match.events.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[600px] overflow-y-auto pr-2">
                  {team1Id && (
                <div>
                      <h3 className="text-lg font-semibold mb-4 pb-2 border-b">
                        {team1Name}
                      </h3>
                      <div className="space-y-3">
                  {getEventsByTeam(team1Id).map((event) => {
                          const getEventColor = () => {
                            // Made shots - green
                            if (['TWO_POINT_MADE', 'THREE_POINT_MADE', 'FREE_THROW_MADE'].includes(event.eventType)) {
                              return 'border-green-500 bg-green-50';
                            }
                            // Missed shots - orange
                            if (['TWO_POINT_MISSED', 'THREE_POINT_MISSED', 'FREE_THROW_MISSED'].includes(event.eventType)) {
                              return 'border-orange-500 bg-orange-50';
                            }
                            // Fouls - red/yellow
                            if (event.eventType === 'FOUL_PERSONAL') return 'border-yellow-500 bg-yellow-50';
                            if (event.eventType === 'FOUL_TECHNICAL') return 'border-orange-500 bg-orange-50';
                            if (event.eventType === 'FOUL_FLAGRANT') return 'border-red-500 bg-red-50';
                            // Turnovers - red
                            if (event.eventType === 'TURNOVER') return 'border-red-500 bg-red-50';
                            // Positive plays - blue
                            if (['ASSIST', 'STEAL', 'BLOCK', 'REBOUND_OFFENSIVE', 'REBOUND_DEFENSIVE'].includes(event.eventType)) {
                              return 'border-blue-500 bg-blue-50';
                            }
                            return 'border-gray-500 bg-gray-50';
                          };
                    return (
                            <div
                              key={event.id}
                              className={`p-4 border-l-4 rounded-r-lg ${getEventColor()}`}
                            >
                              <div className="flex items-start gap-3">
                                {['TWO_POINT_MADE', 'THREE_POINT_MADE', 'FREE_THROW_MADE', 'TWO_POINT_MISSED', 'THREE_POINT_MISSED', 'FREE_THROW_MISSED'].includes(event.eventType) && (
                                  icons.Goal ? <icons.Goal className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" /> : <span className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                )}
                                {['FOUL_PERSONAL', 'FOUL_TECHNICAL', 'FOUL_FLAGRANT'].includes(event.eventType) && (
                                  icons.Card ? <icons.Card className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" /> : <span className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                )}
                                {['ASSIST', 'STEAL', 'BLOCK', 'REBOUND_OFFENSIVE', 'REBOUND_DEFENSIVE', 'TURNOVER'].includes(event.eventType) && (
                                  icons.Activity ? <icons.Activity className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" /> : <span className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                )}
                          {!['TWO_POINT_MADE', 'THREE_POINT_MADE', 'FREE_THROW_MADE', 'TWO_POINT_MISSED', 'THREE_POINT_MISSED', 'FREE_THROW_MISSED', 'FOUL_PERSONAL', 'FOUL_TECHNICAL', 'FOUL_FLAGRANT', 'ASSIST', 'STEAL', 'BLOCK', 'REBOUND_OFFENSIVE', 'REBOUND_DEFENSIVE', 'TURNOVER'].includes(event.eventType) && (
                                  icons.Activity ? <icons.Activity className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" /> : <span className="h-5 w-5 flex-shrink-0 mt-0.5" />
                          )}
                                <div className="flex-1">
                                  <div className="font-semibold mb-1">
                            {EVENT_TYPE_LABELS[event.eventType] || event.eventType} - {event.period ? `${getPeriodLabel(event.period)} ` : ''}{event.secondsRemaining ? formatClockTime(event.secondsRemaining) : `${event.minute}'`}
                          </div>
                                  <div className="text-sm text-muted-foreground space-y-1">
                            {event.player && (
                              <div>
                                <strong>{event.player.firstName} {event.player.lastName}</strong>
                              </div>
                            )}
                            {event.assistPlayer && (
                                      <div>
                                Assist: {event.assistPlayer.firstName} {event.assistPlayer.lastName}
                              </div>
                            )}
                            {event.description && (
                                      <div className="italic">{event.description}</div>
                            )}
                                  </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-end mt-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                {icons.MoreVertical ? <icons.MoreVertical className="h-4 w-4" /> : <span className="h-4 w-4" />}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => handleEditEvent(event.id)}
                                disabled={match?.status !== 'LIVE'}
                              >
                                {icons.Pencil ? <icons.Pencil className="h-4 w-4 mr-2" /> : <span className="h-4 w-4 mr-2" />}
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeleteEventId(event.id)}
                                className="text-destructive focus:text-destructive"
                                disabled={match?.status !== 'LIVE'}
                              >
                                {icons.Trash2 ? <icons.Trash2 className="h-4 w-4 mr-2" /> : <span className="h-4 w-4 mr-2" />}
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

                  {team2Id && (
                <div>
                      <h3 className="text-lg font-semibold mb-4 pb-2 border-b">
                        {team2Name}
                      </h3>
                      <div className="space-y-3">
                  {getEventsByTeam(team2Id).map((event) => {
                          const getEventColor = () => {
                            // Made shots - green
                            if (['TWO_POINT_MADE', 'THREE_POINT_MADE', 'FREE_THROW_MADE'].includes(event.eventType)) {
                              return 'border-green-500 bg-green-50';
                            }
                            // Missed shots - orange
                            if (['TWO_POINT_MISSED', 'THREE_POINT_MISSED', 'FREE_THROW_MISSED'].includes(event.eventType)) {
                              return 'border-orange-500 bg-orange-50';
                            }
                            // Fouls - red/yellow
                            if (event.eventType === 'FOUL_PERSONAL') return 'border-yellow-500 bg-yellow-50';
                            if (event.eventType === 'FOUL_TECHNICAL') return 'border-orange-500 bg-orange-50';
                            if (event.eventType === 'FOUL_FLAGRANT') return 'border-red-500 bg-red-50';
                            // Turnovers - red
                            if (event.eventType === 'TURNOVER') return 'border-red-500 bg-red-50';
                            // Positive plays - blue
                            if (['ASSIST', 'STEAL', 'BLOCK', 'REBOUND_OFFENSIVE', 'REBOUND_DEFENSIVE'].includes(event.eventType)) {
                              return 'border-blue-500 bg-blue-50';
                            }
                            return 'border-gray-500 bg-gray-50';
                          };
                    return (
                            <div
                              key={event.id}
                              className={`p-4 border-l-4 rounded-r-lg ${getEventColor()}`}
                            >
                              <div className="flex items-start gap-3">
                                {['TWO_POINT_MADE', 'THREE_POINT_MADE', 'FREE_THROW_MADE', 'TWO_POINT_MISSED', 'THREE_POINT_MISSED', 'FREE_THROW_MISSED'].includes(event.eventType) && (
                                  icons.Goal ? <icons.Goal className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" /> : <span className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                )}
                                {['FOUL_PERSONAL', 'FOUL_TECHNICAL', 'FOUL_FLAGRANT'].includes(event.eventType) && (
                                  icons.Card ? <icons.Card className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" /> : <span className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                )}
                                {['ASSIST', 'STEAL', 'BLOCK', 'REBOUND_OFFENSIVE', 'REBOUND_DEFENSIVE', 'TURNOVER'].includes(event.eventType) && (
                                  icons.Activity ? <icons.Activity className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" /> : <span className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                )}
                          {!['TWO_POINT_MADE', 'THREE_POINT_MADE', 'FREE_THROW_MADE', 'TWO_POINT_MISSED', 'THREE_POINT_MISSED', 'FREE_THROW_MISSED', 'FOUL_PERSONAL', 'FOUL_TECHNICAL', 'FOUL_FLAGRANT', 'ASSIST', 'STEAL', 'BLOCK', 'REBOUND_OFFENSIVE', 'REBOUND_DEFENSIVE', 'TURNOVER'].includes(event.eventType) && (
                                  icons.Activity ? <icons.Activity className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" /> : <span className="h-5 w-5 flex-shrink-0 mt-0.5" />
                          )}
                                <div className="flex-1">
                                  <div className="font-semibold mb-1">
                            {EVENT_TYPE_LABELS[event.eventType] || event.eventType} - {event.period ? `${getPeriodLabel(event.period)} ` : ''}{event.secondsRemaining ? formatClockTime(event.secondsRemaining) : `${event.minute}'`}
                          </div>
                                  <div className="text-sm text-muted-foreground space-y-1">
                            {event.player && (
                              <div>
                                <strong>{event.player.firstName} {event.player.lastName}</strong>
                              </div>
                            )}
                            {event.assistPlayer && (
                                      <div>
                                Assist: {event.assistPlayer.firstName} {event.assistPlayer.lastName}
                              </div>
                            )}
                            {event.description && (
                                      <div className="italic">{event.description}</div>
                            )}
                                  </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-end mt-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                {icons.MoreVertical ? <icons.MoreVertical className="h-4 w-4" /> : <span className="h-4 w-4" />}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => handleEditEvent(event.id)}
                                disabled={match?.status !== 'LIVE'}
                              >
                                {icons.Pencil ? <icons.Pencil className="h-4 w-4 mr-2" /> : <span className="h-4 w-4 mr-2" />}
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeleteEventId(event.id)}
                                className="text-destructive focus:text-destructive"
                                disabled={match?.status !== 'LIVE'}
                              >
                                {icons.Trash2 ? <icons.Trash2 className="h-4 w-4 mr-2" /> : <span className="h-4 w-4 mr-2" />}
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
                <div className="text-center py-12">
                  {icons.Activity ? <icons.Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" /> : <span className="h-12 w-12 mx-auto mb-4" />}
                  <p className="text-muted-foreground">No events recorded for this match yet</p>
          </div>
        )}
            </CardContent>
          </Card>

          {/* Match Timeline */}
          {match.events && match.events.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {icons.Clock ? <icons.Clock className="h-6 w-6" /> : <span className="h-6 w-6" />}
                  Match Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {match.events
                    .sort((a, b) => a.minute - b.minute)
              .map((event, index) => (
                      <div key={event.id} className="relative pl-12 pb-6">
                        {index < match.events!.length - 1 && (
                          <div className="absolute left-6 top-8 bottom-0 w-0.5 bg-border" />
                        )}
                        <div className="absolute left-0 top-0 w-12 h-12 rounded-full bg-background border-2 border-border flex items-center justify-center font-bold text-sm z-10">
                    {event.minute}'
                  </div>
                        <Card className="ml-4">
                          <CardContent className="pt-4">
                            <div className="flex items-center gap-3 mb-2">
                              {['TWO_POINT_MADE', 'THREE_POINT_MADE', 'FREE_THROW_MADE', 'TWO_POINT_MISSED', 'THREE_POINT_MISSED', 'FREE_THROW_MISSED'].includes(event.eventType) && (
                                icons.Goal ? <icons.Goal className="h-5 w-5 text-green-600" /> : <span className="h-5 w-5" />
                              )}
                              {['FOUL_PERSONAL', 'FOUL_TECHNICAL', 'FOUL_FLAGRANT'].includes(event.eventType) && (
                                icons.Card ? <icons.Card className="h-5 w-5 text-yellow-600" /> : <span className="h-5 w-5" />
                              )}
                              {['ASSIST', 'STEAL', 'BLOCK', 'REBOUND_OFFENSIVE', 'REBOUND_DEFENSIVE', 'TURNOVER'].includes(event.eventType) && (
                                icons.Activity ? <icons.Activity className="h-5 w-5 text-blue-600" /> : <span className="h-5 w-5" />
                              )}
                      {!['TWO_POINT_MADE', 'THREE_POINT_MADE', 'FREE_THROW_MADE', 'TWO_POINT_MISSED', 'THREE_POINT_MISSED', 'FREE_THROW_MISSED', 'FOUL_PERSONAL', 'FOUL_TECHNICAL', 'FOUL_FLAGRANT', 'ASSIST', 'STEAL', 'BLOCK', 'REBOUND_OFFENSIVE', 'REBOUND_DEFENSIVE', 'TURNOVER'].includes(event.eventType) && (
                                icons.Activity ? <icons.Activity className="h-5 w-5 text-gray-600" /> : <span className="h-5 w-5" />
                      )}
                              <div className="font-semibold">
                        {EVENT_TYPE_LABELS[event.eventType] || event.eventType}
                    </div>
                              {event.teamId && <Badge variant="outline">{getTeamName(event.teamId)}</Badge>}
                            </div>
                      {event.player && (
                              <div className="text-sm text-muted-foreground">
                          <strong>{event.player.firstName} {event.player.lastName}</strong>
                        </div>
                      )}
                      {event.assistPlayer && (
                              <div className="text-sm text-muted-foreground">
                          Assist: {event.assistPlayer.firstName} {event.assistPlayer.lastName}
                        </div>
                      )}
                      {event.description && (
                              <div className="text-sm text-muted-foreground italic mt-2">
                          {event.description}
                        </div>
                      )}
                            <div className="flex items-center justify-end mt-3 pt-3 border-t">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    {icons.MoreVertical ? <icons.MoreVertical className="h-4 w-4" /> : <span className="h-4 w-4" />}
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem 
                                    onClick={() => handleEditEvent(event.id)}
                                    disabled={match?.status !== 'LIVE'}
                                  >
                                    {icons.Pencil ? <icons.Pencil className="h-4 w-4 mr-2" /> : <span className="h-4 w-4 mr-2" />}
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => setDeleteEventId(event.id)}
                                    className="text-destructive focus:text-destructive"
                                    disabled={match?.status !== 'LIVE'}
                                  >
                                    {icons.Trash2 ? <icons.Trash2 className="h-4 w-4 mr-2" /> : <span className="h-4 w-4 mr-2" />}
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </CardContent>
                        </Card>
                </div>
              ))}
          </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Add Player Modal */}
      {match && (
        <AddPlayerModal
          matchId={matchId}
          team1Id={team1Id}
          team2Id={team2Id}
          existingMatchPlayers={match.matchPlayers || []}
          isOpen={showAddPlayerModal}
          onClose={() => setShowAddPlayerModal(false)}
          onSuccess={() => {
            setShowAddPlayerModal(false);
            refreshMatchPlayers();
            fetchMatchDetails();
          }}
        />
      )}

      {/* Add/Edit Match Event Modal */}
      {match && (
        <AddMatchEventModal
          matchId={matchId}
          team1Id={team1Id}
          team2Id={team2Id}
          isOpen={showAddEventModal}
          onClose={handleCloseEventModal}
          onSuccess={() => {
            handleCloseEventModal();
            fetchMatchDetails();
          }}
          editEventId={editEventId}
          matchStatus={match?.status}
        />
      )}

      {/* Delete Event Confirmation Dialog */}
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

      <style>{`
        .winner-highlight {
          position: relative;
          padding: 1rem;
          border-radius: 8px;
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%);
        }

        .winner-highlight::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border: 2px solid #fbbf24;
          border-radius: 8px;
          pointer-events: none;
        }
      `}</style>
    </div>
  );

  function getTeamName(teamId: string): string {
    if (team1Id === teamId) return team1Name;
    if (team2Id === teamId) return team2Name;
    return 'Unknown Team';
  }
}
