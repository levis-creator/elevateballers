import { useState, useEffect, type ComponentType } from 'react';
import type { MatchWithFullDetails, MatchPlayerWithDetails } from '../../types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
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
import { getTeam1Name, getTeam1Logo, getTeam2Name, getTeam2Logo, getTeam1Id, getTeam2Id, getWinnerName, isWinner } from '../../../matches/lib/team-helpers';
import TeamLogo from '../../../matches/components/TeamLogo';
import { getLeagueName } from '../../../matches/lib/league-helpers';
import AddNewPlayerModal from './AddNewPlayerModal';
import GameTrackingPanel from '../../../game-tracking/components/GameTrackingPanel';
import MatchImagesDisplay from './MatchImagesDisplay';
import MatchEventImportModal from './MatchEventImportModal';
import { formatClockTime } from '../../../game-tracking/lib/utils';
import { getPeriodLabel } from '../../../game-tracking/lib/utils';
import {
  ArenaPanel,
  ArenaPanelContent,
  ArenaPanelHeader,
  ArenaPanelTitle,
} from '../../../game-tracking/presentation/components/ArenaPanel';
import { ArenaChip } from '../../../game-tracking/presentation/components/ArenaChip';
import CompletedScoresheet from '../../../game-tracking/presentation/components/CompletedScoresheet';
import { useGameTrackingStore } from '../../../game-tracking/stores/useGameTrackingStore';

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

const BASKETBALL_POSITIONS = [
  { value: 'PG', label: 'PG - Point Guard' },
  { value: 'SG', label: 'SG - Shooting Guard' },
  { value: 'SF', label: 'SF - Small Forward' },
  { value: 'PF', label: 'PF - Power Forward' },
  { value: 'C', label: 'C - Center' },
];

// Edit Match Player Modal Component
interface EditMatchPlayerModalProps {
  matchId: string;
  matchPlayerId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function EditMatchPlayerModal({ matchId, matchPlayerId, isOpen, onClose, onSuccess }: EditMatchPlayerModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    started: false,
    position: '',
    jerseyNumber: '',
  });
  const [playerInfo, setPlayerInfo] = useState<any>(null);

  useEffect(() => {
    if (isOpen && matchPlayerId) {
      fetchMatchPlayerDetails();
    }
  }, [isOpen, matchPlayerId]);

  const fetchMatchPlayerDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/matches/${matchId}/players/${matchPlayerId}`);
      if (res.ok) {
        const data = await res.json();
        setPlayerInfo(data.player);
        setFormData({
          started: data.started,
          position: data.position || '',
          jerseyNumber: data.jerseyNumber ? String(data.jerseyNumber) : '',
        });
      }
    } catch (err) {
      console.error('Failed to fetch match player details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/matches/${matchId}/players/${matchPlayerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          started: formData.started,
          position: formData.position,
          jerseyNumber: formData.jerseyNumber ? parseInt(formData.jerseyNumber) : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update player');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to update player');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Player - {playerInfo ? `${playerInfo.firstName} ${playerInfo.lastName}` : 'Loading...'}</DialogTitle>
          <DialogDescription>Update match-specific details for this player.</DialogDescription>
        </DialogHeader>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-jersey">Jersey Number</Label>
              <Input
                id="edit-jersey"
                type="number"
                value={formData.jerseyNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, jerseyNumber: e.target.value }))}
                placeholder="#"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-position">Position</Label>
              <Select
                value={formData.position}
                onValueChange={(value) => setFormData(prev => ({ ...prev, position: value }))}
              >
                <SelectTrigger id="edit-position">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {BASKETBALL_POSITIONS.map((pos) => (
                    <SelectItem key={pos.value} value={pos.value}>
                      {pos.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="edit-started"
              checked={formData.started}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, started: !!checked }))}
            />
            <Label htmlFor="edit-started" className="cursor-pointer">Started Match</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  // Track which players should be marked as starters when adding
  const [playersToAdd, setPlayersToAdd] = useState<Map<string, { started: boolean }>>(new Map());
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
    CheckSquare?: ComponentType<any>;
    Square?: ComponentType<any>;
    Shirt?: ComponentType<any>;
  }>({});

  useEffect(() => {
    // Load icons only on client side
    import('lucide-react').then((mod) => {
      setIcons({
        AlertCircle: mod.AlertCircle,
        Loader2: mod.Loader2,
        Plus: mod.Plus,
        CheckSquare: mod.CheckSquare,
        Square: mod.Square,
        Shirt: mod.Shirt,
      });
    });
  }, []);

  useEffect(() => {
    fetchMatchTeams();
  }, [team1Id, team2Id]);

  useEffect(() => {
    if (selectedTeam) {
      fetchPlayersForTeam(selectedTeam);
    } else {
      setAvailablePlayers([]);
    }
    // NOTE: do NOT depend on `existingMatchPlayers` — the parent passes
    // `match.matchPlayers || []`, which is a new array reference every render.
    // Including it caused an infinite fetch loop that exhausted browser sockets
    // (ERR_INSUFFICIENT_RESOURCES) and broke unrelated calls like substitution.
    // Refresh after adding players is handled imperatively in the modal's onSuccess.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTeam]);

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
        setSelectedTeam(defaultTeam);
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

  const togglePlayerToAdd = (playerId: string) => {
    setPlayersToAdd((prev) => {
      const newMap = new Map(prev);
      if (newMap.has(playerId)) {
        newMap.delete(playerId);
      } else {
        newMap.set(playerId, { started: false });
      }
      return newMap;
    });
  };

  const toggleStarterStatus = (playerId: string) => {
    setPlayersToAdd((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(playerId);
      if (current) {
        newMap.set(playerId, { started: !current.started });
      }
      return newMap;
    });
  };

  const handleBatchAddPlayers = async () => {
    if (playersToAdd.size === 0) {
      setError('Please select at least one player');
      return;
    }

    if (!selectedTeam) {
      setError('Please select a team');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Add all selected players in parallel
      const addPromises = Array.from(playersToAdd.entries()).map(async ([playerId, data]) => {
        const playerProfile = availablePlayers.find(p => p.id === playerId);
        const response = await fetch(`/api/matches/${matchId}/players`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId,
            teamId: selectedTeam,
            started: data.started,
            position: playerProfile?.position,
            jerseyNumber: playerProfile?.jerseyNumber,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to add player ${playerId}`);
        }

        return response.json();
      });

      const results = await Promise.allSettled(addPromises);
      const failures = results.filter((r) => r.status === 'rejected');

      if (failures.length > 0) {
        const errorMessages = failures
          .map((r) => r.status === 'rejected' && r.reason?.message)
          .filter(Boolean)
          .join('; ');
        throw new Error(`Failed to add ${failures.length} player(s)${errorMessages ? `: ${errorMessages}` : ''}`);
      }

      // Clear selections and refresh
      setPlayersToAdd(new Map());
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to add players');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setPlayersToAdd(new Map());
        setSelectedTeam('');
        onClose();
      }
    }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Players to Match</DialogTitle>
          <DialogDescription>
            Select a team and choose players to add to this match. You can select multiple players and mark starters.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <Alert variant="destructive">
            {icons.AlertCircle ? <icons.AlertCircle className="h-4 w-4" /> : <span className="h-4 w-4" />}
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="modal-team-select">
                Team <span className="text-destructive">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddNewPlayerModal(true)}
                disabled={!selectedTeam}
              >
                {icons.Plus ? <icons.Plus className="mr-2 h-4 w-4" /> : <span className="mr-2 h-4 w-4" />}
                Add New Player
              </Button>
            </div>
            <Select
              value={selectedTeam}
              onValueChange={(value) => {
                setSelectedTeam(value);
                setPlayersToAdd(new Map());
              }}
              required
            >
              <SelectTrigger id="modal-team-select">
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
                      const allSelected = availablePlayers.every((p) => playersToAdd.has(p.id));
                      if (allSelected) {
                        setPlayersToAdd(new Map());
                      } else {
                        const newMap = new Map();
                        availablePlayers.forEach((p) => {
                          newMap.set(p.id, { started: false });
                        });
                        setPlayersToAdd(newMap);
                      }
                    }}
                    disabled={loading || availablePlayers.length === 0}
                  >
                    {availablePlayers.every((p) => playersToAdd.has(p.id)) &&
                    availablePlayers.length > 0 ? (
                      icons.CheckSquare ? <icons.CheckSquare className="h-4 w-4 mr-1" /> : <span className="h-4 w-4 mr-1" />
                    ) : (
                      icons.Square ? <icons.Square className="h-4 w-4 mr-1" /> : <span className="h-4 w-4 mr-1" />
                    )}
                    {availablePlayers.every((p) => playersToAdd.has(p.id)) &&
                    availablePlayers.length > 0
                      ? 'Deselect All'
                      : 'Select All'}
                  </Button>
                  {playersToAdd.size > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {playersToAdd.size} player{playersToAdd.size !== 1 ? 's' : ''} selected
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
                    const isSelected = playersToAdd.has(player.id);
                    const isStarter = playersToAdd.get(player.id)?.started || false;
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
                            disabled={loading}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <strong>
                                {player.firstName} {player.lastName}
                              </strong>
                              {player.jerseyNumber && (
                                <Badge variant="secondary" className="gap-1">
                                  {icons.Shirt ? <icons.Shirt className="h-3 w-3" /> : <span className="h-3 w-3" />}
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
                              disabled={loading}
                            />
                            <Label className="cursor-pointer text-sm">
                              Starter
                            </Label>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button
                  onClick={handleBatchAddPlayers}
                  disabled={loading || playersToAdd.size === 0}
                >
                  {loading ? (
                    <>
                      {icons.Loader2 ? <icons.Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <span className="mr-2 h-4 w-4" />}
                      Adding Players...
                    </>
                  ) : (
                    <>
                      {icons.Plus ? <icons.Plus className="mr-2 h-4 w-4" /> : <span className="mr-2 h-4 w-4" />}
                      Add {playersToAdd.size > 0 ? `${playersToAdd.size} ` : ''}Player{playersToAdd.size !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </div>
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
          if (selectedTeam) {
            await fetchPlayersForTeam(selectedTeam);
            // Auto-select the newly created player
            setPlayersToAdd((prev) => {
              const newMap = new Map(prev);
              newMap.set(newPlayer.id, { started: false });
              return newMap;
            });
          }
        }}
      />
    </Dialog>
  );
}

function AdminToolsDisclosure({
  collapse,
  children,
}: {
  collapse: boolean;
  children: React.ReactNode;
}) {
  if (!collapse) return <>{children}</>;
  return (
    <details className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
      <summary className="flex cursor-pointer list-none items-center justify-between p-4 font-heading text-sm uppercase tracking-[0.18em] text-slate-300 transition-colors hover:bg-white/5 hover:text-white sm:p-5">
        <span>Admin Tools</span>
        <span className="text-brand-gold transition-transform group-open:rotate-180" aria-hidden>▾</span>
      </summary>
      <div className="space-y-6 border-t border-white/5 p-4 sm:p-5">{children}</div>
    </details>
  );
}

export default function MatchDetailView({ matchId, initialMatch }: MatchDetailViewProps) {
  // Subscribe to the live period from the game-tracking store so the hero
  // label stays fresh when the scorekeeper advances the quarter (which flows
  // through updateGameState and never updates the stale `match` prop).
  const livePeriod = useGameTrackingStore((s) => s.gameState?.period ?? null);

  const [match, setMatch] = useState<MatchWithFullDetails | null>(
    initialMatch ? { ...initialMatch, matchPlayers: [], events: [] } : null
  );
  const [loading, setLoading] = useState(!initialMatch); // Start loading if no initial match
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState('');
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEditPlayerModal, setShowEditPlayerModal] = useState(false);
  const [editingMatchPlayerId, setEditingMatchPlayerId] = useState<string | null>(null);
  const [editEventId, setEditEventId] = useState<string | null>(null);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
  // End Game lives in GameTrackingPanel; Start Game is mirrored in the header below for visibility.
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [isEndingGame, setIsEndingGame] = useState(false);
  const [page1, setPage1] = useState(1);
  const [page2, setPage2] = useState(1);
  const playersPerPage = 10;
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
    Download?: ComponentType<any>;
    Upload?: ComponentType<any>;
    Play?: ComponentType<any>;
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
        Download: mod.Download,
        Upload: mod.Upload,
        Play: mod.Play,
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
      // `cache: 'no-store'` bypasses the endpoint's `s-maxage=15` so edits to
      // the Match Players card show up instantly in the downstream Quick Event
      // and Substitution panels rather than waiting out the CDN window.
      const response = await fetch(`/api/matches/${matchId}/players`, { cache: 'no-store' });
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

  const handleStartGame = async () => {
    if (!matchId || isStartingGame) return;
    setIsStartingGame(true);
    setError('');
    try {
      const response = await fetch(`/api/games/${matchId}/start`, { method: 'POST' });
      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Failed to start game' }));
        throw new Error(data.error || `Server returned ${response.status}`);
      }
      await fetchMatch();
    } catch (err: any) {
      setError(err.message || 'Failed to start game');
    } finally {
      setIsStartingGame(false);
    }
  };

  const handleEndGame = async () => {
    if (!matchId || isEndingGame) return;
    if (!window.confirm('End this game? This action cannot be undone.')) return;
    setIsEndingGame(true);
    setError('');
    try {
      const response = await fetch(`/api/games/${matchId}/end`, { method: 'POST' });
      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Failed to end game' }));
        throw new Error(data.error || `Server returned ${response.status}`);
      }
      await fetchMatch();
    } catch (err: any) {
      setError(err.message || 'Failed to end game');
    } finally {
      setIsEndingGame(false);
    }
  };

  const fetchMatchDetails = async () => {
    try {
      // Always skip the edge cache here — this runs after mutations and needs
      // fresh state to feed the game tracking panels.
      const [playersRes, eventsRes] = await Promise.all([
        fetch(`/api/matches/${matchId}/players`, { cache: 'no-store' }).catch(() => ({ ok: false })),
        fetch(`/api/matches/${matchId}/events`, { cache: 'no-store' }).catch(() => ({ ok: false })),
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
    const teamPlayers = match.matchPlayers.filter((mp) => mp.teamId === teamId);
    
    // Sort logic: active first, then starters, then others
    return [...teamPlayers].sort((a, b) => {
      const aActive = isPlayerOnFloor(a);
      const bActive = isPlayerOnFloor(b);
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      if (a.started && !b.started) return -1;
      if (!a.started && b.started) return 1;
      return 0;
    });
  };

  const isPlayerOnFloor = (mp: MatchPlayerWithDetails) => {
    if (!match?.matchPlayers) return false;
    const teamPlayers = match.matchPlayers.filter(p => p.teamId === mp.teamId);
    const hasExplicitlyActive = teamPlayers.some(p => p.isActive);
    
    if (hasExplicitlyActive) {
      return mp.isActive;
    }
    
    // Fallback: if LIVE and no one is active, show starters as active
    return match.status === 'LIVE' && mp.started;
  };

  const getEventsByTeam = (teamId: string) => {
    if (!match?.events) return [];
    return match.events.filter((e) => e.teamId === teamId);
  };

  const handleEditPlayer = (matchPlayerId: string) => {
    setEditingMatchPlayerId(matchPlayerId);
    setShowEditPlayerModal(true);
  };

  const handleDeletePlayer = async (matchPlayerId: string) => {
    try {
      const response = await fetch(`/api/matches/${matchId}/players/${matchPlayerId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to remove player');
      fetchMatchDetails();
    } catch (error: any) {
      console.error('Error deleting match player:', error);
      setError(error.message || 'Failed to remove player');
    }
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

  const hasScores =
    match.team1Score !== null &&
    match.team1Score !== undefined &&
    match.team2Score !== null &&
    match.team2Score !== undefined;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl bg-surface-deeper font-sans text-slate-100 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.6)]',
        'animate-in fade-in slide-in-from-bottom-4 duration-300',
        // Text
        '[&_.text-muted-foreground]:text-slate-400',
        '[&_.text-foreground]:text-white',
        // Translucent surfaces
        '[&_.bg-muted]:bg-white/5',
        '[&_.bg-muted\\/50]:bg-white/5',
        '[&_.bg-background]:bg-white/[0.04]',
        '[&_.bg-popover]:bg-surface-dark',
        '[&_.text-popover-foreground]:text-slate-100',
        // Borders
        '[&_.border-input]:border-white/15',
        // Inputs / triggers (Select, Input, Textarea) — Radix trigger uses
        // role=combobox; Input/Textarea hit the element selector.
        '[&_input]:bg-white/[0.04] [&_input]:border-white/15 [&_input]:text-white [&_input]:placeholder:text-slate-500',
        '[&_textarea]:bg-white/[0.04] [&_textarea]:border-white/15 [&_textarea]:text-white [&_textarea]:placeholder:text-slate-500',
        '[&_[role=combobox]]:bg-white/[0.04] [&_[role=combobox]]:border-white/15 [&_[role=combobox]]:text-white',
        // shadcn outline Button uses bg-background + border-input; already
        // covered. Primary Buttons use bg-primary text-primary-foreground —
        // keep shadcn defaults; scoreboard-critical buttons (End Game, Start)
        // get explicit sporty classes at the call site.
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_50%_0%,rgba(255,186,0,0.12),transparent_60%)]" />
      <div className="relative space-y-6 p-5 sm:p-8">
        {/* Admin top bar */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="group text-slate-300 transition-all duration-150 hover:bg-white/5 hover:text-white active:scale-[0.97]"
            >
              <a href="/admin/matches" data-astro-prefetch>
                {icons.ArrowLeft ? (
                  <icons.ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-150 group-hover:-translate-x-0.5" />
                ) : (
                  <span className="mr-2 h-4 w-4" />
                )}
                Back
              </a>
            </Button>
            <span className="font-heading text-[0.78rem] uppercase tracking-[0.28em] text-brand-gold">
              Match Center
            </span>
          </div>
          {match && (
            <div className="flex flex-wrap gap-2">
              {match.status === 'COMPLETED' && (
                <Button
                  asChild
                  variant="outline"
                  className="border-white/15 bg-white/5 text-white transition-all duration-150 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10 hover:text-white hover:shadow-[0_8px_20px_-8px_rgba(255,255,255,0.25)] active:translate-y-0 active:scale-[0.97]"
                >
                  <a href={`/api/matches/${matchId}/stat-sheet`}>
                    {icons.Download ? (
                      <icons.Download className="mr-2 h-4 w-4" />
                    ) : (
                      <span className="mr-2 h-4 w-4" />
                    )}
                    Download Stat Sheet
                  </a>
                </Button>
              )}
              {match.status === 'UPCOMING' && (
                <Button
                  onClick={handleStartGame}
                  disabled={isStartingGame}
                  className="bg-brand-red text-white transition-all duration-150 hover:-translate-y-0.5 hover:bg-brand-red-dark hover:shadow-[0_10px_24px_-8px_rgba(221,51,51,0.65)] active:translate-y-0 active:scale-[0.97] disabled:hover:translate-y-0 disabled:hover:shadow-none"
                >
                  {isStartingGame
                    ? icons.Loader2
                      ? <icons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      : <span className="mr-2 h-4 w-4" />
                    : icons.Play
                    ? <icons.Play className="mr-2 h-4 w-4" />
                    : <span className="mr-2 h-4 w-4" />}
                  {isStartingGame ? 'Starting…' : 'Start Game'}
                </Button>
              )}
              {match.status === 'LIVE' && (
                <Button
                  onClick={handleEndGame}
                  disabled={isEndingGame}
                  variant="destructive"
                  className="bg-brand-red text-white transition-all duration-150 hover:-translate-y-0.5 hover:bg-brand-red-dark hover:shadow-[0_10px_24px_-8px_rgba(221,51,51,0.65)] active:translate-y-0 active:scale-[0.97] disabled:hover:translate-y-0 disabled:hover:shadow-none"
                >
                  {isEndingGame
                    ? icons.Loader2
                      ? <icons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      : <span className="mr-2 h-4 w-4" />
                    : null}
                  {isEndingGame ? 'Ending…' : 'End Game'}
                </Button>
              )}
              <Button
                asChild
                disabled={match?.status === 'COMPLETED'}
                className="bg-brand-gold text-[#261f45] transition-all duration-150 hover:-translate-y-0.5 hover:bg-brand-gold/90 hover:shadow-[0_10px_24px_-8px_rgba(255,186,0,0.65)] active:translate-y-0 active:scale-[0.97] disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                <a href={`/admin/matches/${matchId}`} data-astro-prefetch>
                  {icons.Edit ? (
                    <icons.Edit className="mr-2 h-4 w-4" />
                  ) : (
                    <span className="mr-2 h-4 w-4" />
                  )}
                  Edit Match
                </a>
              </Button>
            </div>
          )}
        </div>

        {error && (
          <Alert
            variant="destructive"
            className="border-red-500/40 bg-red-500/10 text-red-100"
          >
            {icons.AlertCircle ? (
              <icons.AlertCircle className="h-4 w-4" />
            ) : (
              <span className="h-4 w-4" />
            )}
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {match && (
          <>
            {/* Sporty scoreboard hero */}
            <ArenaPanel className="overflow-hidden">
              <ArenaPanelContent className="relative px-4 py-6 sm:px-8 sm:py-8">
                {/* Eyebrow row: league + date + non-LIVE status chip. The
                    LIVE/period/clock chips live in the center column during
                    LIVE so the scorekeeper's eye doesn't have to hop between
                    the eyebrow and the score block. */}
                <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
                  {leagueName && (
                    <span className="font-heading text-[0.78rem] uppercase tracking-[0.28em] text-brand-gold">
                      {leagueName}
                    </span>
                  )}
                  {match.status !== 'LIVE' && (
                    <ArenaChip
                      tone={match.status === 'COMPLETED' ? 'muted' : 'gold'}
                    >
                      {match.status}
                    </ArenaChip>
                  )}
                  {isTie && <ArenaChip tone="muted">Tie</ArenaChip>}
                  {match.date && (
                    <span className="flex items-center gap-1.5 text-[0.72rem] uppercase tracking-[0.18em] text-slate-300">
                      {icons.Calendar ? <icons.Calendar className="h-3.5 w-3.5" /> : null}
                      {new Date(match.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                      {' · '}
                      {new Date(match.date).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
                  {/* Team 1 */}
                  <div className="flex flex-col items-center gap-3 text-center">
                    <TeamLogo
                      logo={team1Logo}
                      name={team1Name}
                      size="custom"
                      className="size-24 rounded-full bg-white/5 object-contain p-2 ring-1 ring-white/10"
                    />
                    <h2
                      className={`font-heading text-2xl uppercase tracking-[0.08em] md:text-3xl ${team1IsWinner ? 'text-brand-gold' : 'text-white'}`}
                    >
                      {team1Name}
                    </h2>
                    {team1IsWinner && <ArenaChip tone="gold">🏆 Winner</ArenaChip>}
                  </div>

                  {/* Center block — status-aware:
                      · COMPLETED → big final scoreboard (source of truth)
                      · LIVE      → LIVE pill + live clock + period label (no
                                    numbers here; GameScoreboard owns those)
                      · UPCOMING  → VS placeholder */}
                  <div className="flex min-w-[220px] flex-col items-center gap-2">
                    {match.status === 'COMPLETED' && hasScores ? (
                      <div className="flex items-baseline gap-3 font-heading tabular-nums text-white sm:gap-5">
                        <span className={`text-6xl sm:text-[5rem] leading-none ${team1IsWinner ? 'text-brand-gold' : ''}`}>
                          {match.team1Score}
                        </span>
                        <span className="text-3xl text-white/30" aria-hidden>–</span>
                        <span className={`text-6xl sm:text-[5rem] leading-none ${team2IsWinner ? 'text-brand-gold' : ''}`}>
                          {match.team2Score}
                        </span>
                      </div>
                    ) : match.status === 'LIVE' ? (
                      // Identity-only during LIVE: the live clock lives in
                      // the GameClock panel (the web worker ticks it there).
                      // We show just the LIVE pill + the period label, where
                      // the period reads from the game-tracking store so
                      // quarter changes reflect immediately.
                      <div className="flex flex-col items-center gap-3">
                        <ArenaChip tone="live" pulse>
                          LIVE
                        </ArenaChip>
                        {(() => {
                          const period = livePeriod ?? match.currentPeriod ?? null;
                          if (typeof period !== 'number' || period <= 0) return null;
                          return (
                            <span className="font-heading text-3xl uppercase tracking-[0.18em] text-brand-gold">
                              {getPeriodLabel(period)}
                            </span>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="font-heading text-4xl uppercase tracking-[0.2em] text-white/40">
                        VS
                      </div>
                    )}
                    {match.season && (
                      <span className="text-[0.68rem] uppercase tracking-[0.18em] text-slate-400">
                        Season · {match.season.name}
                      </span>
                    )}
                    {match.status === 'COMPLETED' && winnerName && !isTie && (
                      <span className="text-xs text-slate-300">
                        <strong className="text-brand-gold">{winnerName}</strong> won
                      </span>
                    )}
                  </div>

                  {/* Team 2 */}
                  <div className="flex flex-col items-center gap-3 text-center">
                    <TeamLogo
                      logo={team2Logo}
                      name={team2Name}
                      size="custom"
                      className="size-24 rounded-full bg-white/5 object-contain p-2 ring-1 ring-white/10"
                    />
                    <h2
                      className={`font-heading text-2xl uppercase tracking-[0.08em] md:text-3xl ${team2IsWinner ? 'text-brand-gold' : 'text-white'}`}
                    >
                      {team2Name}
                    </h2>
                    {team2IsWinner && <ArenaChip tone="gold">🏆 Winner</ArenaChip>}
                  </div>
                </div>
              </ArenaPanelContent>
            </ArenaPanel>

      {/* Game Tracking Panel */}
      {match.status === 'LIVE' || match.status === 'UPCOMING' ? (
        <GameTrackingPanel matchId={matchId} match={match} onRefresh={fetchMatchDetails} />
      ) : null}

      {/* Completed Scoresheet — shown above the admin disclosure */}
      {match.status === 'COMPLETED' && (
        <CompletedScoresheet
          match={match}
          team1Id={team1Id}
          team2Id={team2Id}
          team1Name={team1Name}
          team2Name={team2Name}
        />
      )}

      {/* Admin editing blocks — inline only during pre-game UPCOMING; during
          LIVE the CourtConsole is the main surface so we tuck roster/event
          edits under a disclosure; on COMPLETED we do the same to keep the
          scoresheet above the fold. */}
      <AdminToolsDisclosure collapse={match.status !== 'UPCOMING'}>
      {/* Match Players */}
          <ArenaPanel>
            <ArenaPanelHeader>
              <div className="flex items-center justify-between">
                <ArenaPanelTitle className="flex items-center gap-2">
                  {icons.Users ? <icons.Users className="h-6 w-6 text-brand-gold" /> : <span className="h-6 w-6" />}
              Match Players
                  {match.matchPlayers && match.matchPlayers.length > 0 && (
                    <span className="text-sm font-normal text-slate-400">
                  ({match.matchPlayers.length})
                </span>
              )}
                </ArenaPanelTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddPlayerModal(true)}
                  className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                >
                  {icons.Plus ? <icons.Plus className="mr-2 h-4 w-4" /> : <span className="mr-2 h-4 w-4" />}
            Add Player
                </Button>
        </div>
            </ArenaPanelHeader>
            <ArenaPanelContent>
              {match.matchPlayers && match.matchPlayers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {team1Id && (
                <div>
                      <h3 className="text-lg font-semibold mb-4 pb-2 border-b">
                        {team1Name}
                      </h3>
                      <div className="space-y-2">
                        {(() => {
                          const team1Players = getPlayersByTeam(team1Id);
                          const totalPages = Math.ceil(team1Players.length / playersPerPage);
                          const paginatedPlayers = team1Players.slice((page1 - 1) * playersPerPage, page1 * playersPerPage);
                          
                          return (
                            <>
                              {paginatedPlayers.map((mp) => (
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
                                    {mp.started && <Badge variant="default" className="bg-blue-600 text-white border-none">Starter</Badge>}
                                    {isPlayerOnFloor(mp) && <Badge variant="default" className="bg-green-600 text-white border-none animate-pulse">On Floor</Badge>}
                                    {mp.subOut && <Badge variant="destructive" className="animate-pulse">Out</Badge>}
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
                                  <div className="flex items-center gap-1">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8"
                                      onClick={() => handleEditPlayer(mp.id)}
                                    >
                                      {icons.Pencil ? <icons.Pencil className="h-4 w-4 text-muted-foreground" /> : <span className="h-4 w-4" />}
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8 text-destructive"
                                      onClick={() => handleDeletePlayer(mp.id)}
                                    >
                                      {icons.Trash2 ? <icons.Trash2 className="h-4 w-4" /> : <span className="h-4 w-4" />}
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              
                              {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-dashed">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage1(Math.max(1, page1 - 1))}
                                    disabled={page1 === 1}
                                  >
                                    Previous
                                  </Button>
                                  <span className="text-sm text-muted-foreground">
                                    {page1} / {totalPages}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage1(Math.min(totalPages, page1 + 1))}
                                    disabled={page1 === totalPages}
                                  >
                                    Next
                                  </Button>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
              </div>
            )}

                  {team2Id && (
                <div>
                      <h3 className="text-lg font-semibold mb-4 pb-2 border-b">
                        {team2Name}
                      </h3>
                      <div className="space-y-2">
                        {(() => {
                          const team2Players = getPlayersByTeam(team2Id);
                          const totalPages = Math.ceil(team2Players.length / playersPerPage);
                          const paginatedPlayers = team2Players.slice((page2 - 1) * playersPerPage, page2 * playersPerPage);
                          
                          return (
                            <>
                              {paginatedPlayers.map((mp) => (
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
                                    {mp.started && <Badge variant="default" className="bg-blue-600 text-white border-none">Starter</Badge>}
                                    {isPlayerOnFloor(mp) && <Badge variant="default" className="bg-green-600 text-white border-none animate-pulse">On Floor</Badge>}
                                    {mp.subOut && <Badge variant="destructive" className="animate-pulse">Out</Badge>}
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
                                  <div className="flex items-center gap-1">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8"
                                      onClick={() => handleEditPlayer(mp.id)}
                                    >
                                      {icons.Pencil ? <icons.Pencil className="h-4 w-4 text-muted-foreground" /> : <span className="h-4 w-4" />}
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8 text-destructive"
                                      onClick={() => handleDeletePlayer(mp.id)}
                                    >
                                      {icons.Trash2 ? <icons.Trash2 className="h-4 w-4" /> : <span className="h-4 w-4" />}
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              
                              {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-dashed">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage2(Math.max(1, page2 - 1))}
                                    disabled={page2 === 1}
                                  >
                                    Previous
                                  </Button>
                                  <span className="text-sm text-muted-foreground">
                                    {page2} / {totalPages}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage2(Math.min(totalPages, page2 + 1))}
                                    disabled={page2 === totalPages}
                                  >
                                    Next
                                  </Button>
                                </div>
                              )}
                            </>
                          );
                        })()}
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
            </ArenaPanelContent>
          </ArenaPanel>

      {/* Match Events */}
          <ArenaPanel>
            <ArenaPanelHeader>
              <div className="flex items-center justify-between">
                <ArenaPanelTitle className="flex items-center gap-2">
                  {icons.Activity ? <icons.Activity className="h-6 w-6 text-brand-gold" /> : <span className="h-6 w-6" />}
              Match Events
                  {match.events && match.events.length > 0 && (
                    <span className="text-sm font-normal text-slate-400">
                  ({match.events.length})
                </span>
              )}
                </ArenaPanelTitle>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowImportModal(true)}
                    disabled={match?.status === 'COMPLETED'}
                    className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  >
                    {icons.Upload ? <icons.Upload className="mr-2 h-4 w-4" /> : <span className="mr-2 h-4 w-4" />}
                    Import
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddEventModal(true)}
                    disabled={match?.status !== 'LIVE'}
                    className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  >
                    {icons.Plus ? <icons.Plus className="mr-2 h-4 w-4" /> : <span className="mr-2 h-4 w-4" />}
                    Add Event
                  </Button>
                </div>
              </div>
            </ArenaPanelHeader>
            <ArenaPanelContent>
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
                              return 'border-green-400/60 bg-green-500/10';
                            }
                            // Missed shots - orange
                            if (['TWO_POINT_MISSED', 'THREE_POINT_MISSED', 'FREE_THROW_MISSED'].includes(event.eventType)) {
                              return 'border-orange-400/60 bg-orange-500/10';
                            }
                            // Fouls - red/yellow
                            if (event.eventType === 'FOUL_PERSONAL') return 'border-yellow-400/60 bg-yellow-500/10';
                            if (event.eventType === 'FOUL_TECHNICAL') return 'border-orange-400/60 bg-orange-500/10';
                            if (event.eventType === 'FOUL_FLAGRANT') return 'border-red-400/60 bg-red-500/10';
                            // Turnovers - red
                            if (event.eventType === 'TURNOVER') return 'border-red-400/60 bg-red-500/10';
                            // Positive plays - blue
                            if (['ASSIST', 'STEAL', 'BLOCK', 'REBOUND_OFFENSIVE', 'REBOUND_DEFENSIVE'].includes(event.eventType)) {
                              return 'border-sky-400/60 bg-sky-500/10';
                            }
                            return 'border-white/15 bg-white/5';
                          };
                    return (
                            <div
                              key={event.id}
                              className={`p-4 border-l-4 rounded-r-lg ${getEventColor()}`}
                            >
                              <div className="flex items-start gap-3">
                                {['TWO_POINT_MADE', 'THREE_POINT_MADE', 'FREE_THROW_MADE', 'TWO_POINT_MISSED', 'THREE_POINT_MISSED', 'FREE_THROW_MISSED'].includes(event.eventType) && (
                                  icons.Goal ? <icons.Goal className="h-5 w-5 text-green-300 flex-shrink-0 mt-0.5" /> : <span className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                )}
                                {['FOUL_PERSONAL', 'FOUL_TECHNICAL', 'FOUL_FLAGRANT'].includes(event.eventType) && (
                                  icons.Card ? <icons.Card className="h-5 w-5 text-yellow-300 flex-shrink-0 mt-0.5" /> : <span className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                )}
                                {['ASSIST', 'STEAL', 'BLOCK', 'REBOUND_OFFENSIVE', 'REBOUND_DEFENSIVE', 'TURNOVER'].includes(event.eventType) && (
                                  icons.Activity ? <icons.Activity className="h-5 w-5 text-sky-300 flex-shrink-0 mt-0.5" /> : <span className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                )}
                          {!['TWO_POINT_MADE', 'THREE_POINT_MADE', 'FREE_THROW_MADE', 'TWO_POINT_MISSED', 'THREE_POINT_MISSED', 'FREE_THROW_MISSED', 'FOUL_PERSONAL', 'FOUL_TECHNICAL', 'FOUL_FLAGRANT', 'ASSIST', 'STEAL', 'BLOCK', 'REBOUND_OFFENSIVE', 'REBOUND_DEFENSIVE', 'TURNOVER'].includes(event.eventType) && (
                                  icons.Activity ? <icons.Activity className="h-5 w-5 text-slate-300 flex-shrink-0 mt-0.5" /> : <span className="h-5 w-5 flex-shrink-0 mt-0.5" />
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
                              return 'border-green-400/60 bg-green-500/10';
                            }
                            // Missed shots - orange
                            if (['TWO_POINT_MISSED', 'THREE_POINT_MISSED', 'FREE_THROW_MISSED'].includes(event.eventType)) {
                              return 'border-orange-400/60 bg-orange-500/10';
                            }
                            // Fouls - red/yellow
                            if (event.eventType === 'FOUL_PERSONAL') return 'border-yellow-400/60 bg-yellow-500/10';
                            if (event.eventType === 'FOUL_TECHNICAL') return 'border-orange-400/60 bg-orange-500/10';
                            if (event.eventType === 'FOUL_FLAGRANT') return 'border-red-400/60 bg-red-500/10';
                            // Turnovers - red
                            if (event.eventType === 'TURNOVER') return 'border-red-400/60 bg-red-500/10';
                            // Positive plays - blue
                            if (['ASSIST', 'STEAL', 'BLOCK', 'REBOUND_OFFENSIVE', 'REBOUND_DEFENSIVE'].includes(event.eventType)) {
                              return 'border-sky-400/60 bg-sky-500/10';
                            }
                            return 'border-white/15 bg-white/5';
                          };
                    return (
                            <div
                              key={event.id}
                              className={`p-4 border-l-4 rounded-r-lg ${getEventColor()}`}
                            >
                              <div className="flex items-start gap-3">
                                {['TWO_POINT_MADE', 'THREE_POINT_MADE', 'FREE_THROW_MADE', 'TWO_POINT_MISSED', 'THREE_POINT_MISSED', 'FREE_THROW_MISSED'].includes(event.eventType) && (
                                  icons.Goal ? <icons.Goal className="h-5 w-5 text-green-300 flex-shrink-0 mt-0.5" /> : <span className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                )}
                                {['FOUL_PERSONAL', 'FOUL_TECHNICAL', 'FOUL_FLAGRANT'].includes(event.eventType) && (
                                  icons.Card ? <icons.Card className="h-5 w-5 text-yellow-300 flex-shrink-0 mt-0.5" /> : <span className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                )}
                                {['ASSIST', 'STEAL', 'BLOCK', 'REBOUND_OFFENSIVE', 'REBOUND_DEFENSIVE', 'TURNOVER'].includes(event.eventType) && (
                                  icons.Activity ? <icons.Activity className="h-5 w-5 text-sky-300 flex-shrink-0 mt-0.5" /> : <span className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                )}
                          {!['TWO_POINT_MADE', 'THREE_POINT_MADE', 'FREE_THROW_MADE', 'TWO_POINT_MISSED', 'THREE_POINT_MISSED', 'FREE_THROW_MISSED', 'FOUL_PERSONAL', 'FOUL_TECHNICAL', 'FOUL_FLAGRANT', 'ASSIST', 'STEAL', 'BLOCK', 'REBOUND_OFFENSIVE', 'REBOUND_DEFENSIVE', 'TURNOVER'].includes(event.eventType) && (
                                  icons.Activity ? <icons.Activity className="h-5 w-5 text-slate-300 flex-shrink-0 mt-0.5" /> : <span className="h-5 w-5 flex-shrink-0 mt-0.5" />
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
            </ArenaPanelContent>
          </ArenaPanel>

          {/* Match Timeline */}
          {match.events && match.events.length > 0 && (
            <ArenaPanel>
              <ArenaPanelHeader>
                <ArenaPanelTitle className="flex items-center gap-2">
                  {icons.Clock ? <icons.Clock className="h-6 w-6 text-brand-gold" /> : <span className="h-6 w-6" />}
                  Match Timeline
                </ArenaPanelTitle>
              </ArenaPanelHeader>
              <ArenaPanelContent>
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {match.events
                    .sort((a, b) => a.minute - b.minute)
              .map((event, index) => (
                      <div key={event.id} className="relative pl-12 pb-6">
                        {index < match.events!.length - 1 && (
                          <div className="absolute left-6 top-8 bottom-0 w-0.5 bg-border" />
                        )}
                        <div className="absolute left-0 top-0 w-12 h-12 rounded-full bg-surface-deeper border-2 border-brand-gold/40 text-brand-gold flex items-center justify-center font-heading font-bold text-sm tabular-nums z-10">
                    {event.minute}'
                  </div>
                        <Card className="ml-4 border-white/10 bg-white/[0.03] text-slate-100 shadow-[0_10px_24px_rgba(0,0,0,0.25)]">
                          <CardContent className="pt-4">
                            <div className="flex items-center gap-3 mb-2">
                              {['TWO_POINT_MADE', 'THREE_POINT_MADE', 'FREE_THROW_MADE', 'TWO_POINT_MISSED', 'THREE_POINT_MISSED', 'FREE_THROW_MISSED'].includes(event.eventType) && (
                                icons.Goal ? <icons.Goal className="h-5 w-5 text-green-300" /> : <span className="h-5 w-5" />
                              )}
                              {['FOUL_PERSONAL', 'FOUL_TECHNICAL', 'FOUL_FLAGRANT'].includes(event.eventType) && (
                                icons.Card ? <icons.Card className="h-5 w-5 text-yellow-300" /> : <span className="h-5 w-5" />
                              )}
                              {['ASSIST', 'STEAL', 'BLOCK', 'REBOUND_OFFENSIVE', 'REBOUND_DEFENSIVE', 'TURNOVER'].includes(event.eventType) && (
                                icons.Activity ? <icons.Activity className="h-5 w-5 text-sky-300" /> : <span className="h-5 w-5" />
                              )}
                      {!['TWO_POINT_MADE', 'THREE_POINT_MADE', 'FREE_THROW_MADE', 'TWO_POINT_MISSED', 'THREE_POINT_MISSED', 'FREE_THROW_MISSED', 'FOUL_PERSONAL', 'FOUL_TECHNICAL', 'FOUL_FLAGRANT', 'ASSIST', 'STEAL', 'BLOCK', 'REBOUND_OFFENSIVE', 'REBOUND_DEFENSIVE', 'TURNOVER'].includes(event.eventType) && (
                                icons.Activity ? <icons.Activity className="h-5 w-5 text-slate-300" /> : <span className="h-5 w-5" />
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
              </ArenaPanelContent>
            </ArenaPanel>
          )}
          </AdminToolsDisclosure>
        </>
      )}

      {/* Match Images */}
      <MatchImagesDisplay matchId={matchId} />

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

      {/* Edit Match Player Modal */}
      {match && (
        <EditMatchPlayerModal
          matchId={matchId}
          matchPlayerId={editingMatchPlayerId}
          isOpen={showEditPlayerModal}
          onClose={() => {
            setShowEditPlayerModal(false);
            setEditingMatchPlayerId(null);
          }}
          onSuccess={() => {
            setShowEditPlayerModal(false);
            setEditingMatchPlayerId(null);
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

      {/* Import Match Events Modal */}
      {match && (
        <MatchEventImportModal
          matchId={matchId}
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false);
            fetchMatchDetails();
          }}
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

      </div>
    </div>
  );

  function getTeamName(teamId: string): string {
    if (team1Id === teamId) return team1Name;
    if (team2Id === teamId) return team2Name;
    return 'Unknown Team';
  }
}
