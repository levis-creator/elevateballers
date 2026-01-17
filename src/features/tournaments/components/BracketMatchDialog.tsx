/**
 * Bracket Match Dialog
 * Dialog component for creating/editing matches from the bracket view
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { MatchStatus, Team, League, Season, TeamWithPlayerCount } from '../../cms/types';
import type { MatchStage } from '@prisma/client';
import type { BracketMatch } from '../lib/bracket-converter';
import { getTeam1Name, getTeam1Logo, getTeam2Name, getTeam2Logo, getTeam1Id, getTeam2Id } from '../../matches/lib/team-helpers';
import { getLeagueId } from '../../matches/lib/league-helpers';
import { getSeasonId } from '../../matches/lib/season-helpers';
import TeamSelect from '../../cms/components/TeamSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { AlertCircle, Calendar, Trophy, Loader2, Save, ArrowUp, ArrowDown, Info } from 'lucide-react';

const MATCH_STATUSES: MatchStatus[] = ['UPCOMING', 'LIVE', 'COMPLETED'];
const MATCH_STAGES: MatchStage[] = [
  'REGULAR_SEASON',
  'PRESEASON',
  'EXHIBITION',
  'PLAYOFF',
  'QUARTER_FINALS',
  'SEMI_FINALS',
  'CHAMPIONSHIP',
  'QUALIFIER',
  'OTHER',
];

interface BracketMatchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  matchId?: string | null;
  bracketMatch?: BracketMatch | null;
  seasonId: string;
  leagueId?: string;
  defaultStage?: MatchStage | null;
}

export default function BracketMatchDialog({
  isOpen,
  onClose,
  onSave,
  matchId,
  bracketMatch,
  seasonId,
  leagueId,
  defaultStage,
}: BracketMatchDialogProps) {
  const [loading, setLoading] = useState(!!matchId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [teams, setTeams] = useState<(Team | TeamWithPlayerCount)[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [formData, setFormData] = useState({
    team1Id: '',
    team1Name: '',
    team1Logo: '',
    team2Id: '',
    team2Name: '',
    team2Logo: '',
    leagueId: leagueId || '',
    seasonId: seasonId,
    date: '',
    team1Score: '',
    team2Score: '',
    status: 'UPCOMING' as MatchStatus,
    stage: (defaultStage || bracketMatch?.stage || '') as MatchStage | '',
    duration: '',
  });

  // Define fetchSeasons before useEffects that use it
  const fetchSeasons = useCallback(async (leagueId: string) => {
    try {
      const response = await fetch(`/api/seasons?leagueId=${leagueId}`);
      if (response.ok) {
        const data = (await response.json()) as Season[];
        setSeasons(data);
      }
    } catch (err) {
      console.error('Failed to fetch seasons:', err);
    }
  }, []);

  // Track previous isOpen state to detect when dialog opens
  const prevIsOpenRef = React.useRef(false);

  // Fetch match data if editing, or initialize form for new match
  useEffect(() => {
    // Only reset form when dialog first opens (transition from closed to open)
    const isOpening = !prevIsOpenRef.current && isOpen;
    prevIsOpenRef.current = isOpen;

    if (!isOpening) return;

    if (matchId) {
      fetchMatch();
    } else {
      // Reset form for new match - only on initial open
      setFormData({
        team1Id: '',
        team1Name: '',
        team1Logo: '',
        team2Id: '',
        team2Name: '',
        team2Logo: '',
        leagueId: leagueId || '',
        seasonId: seasonId,
        date: new Date().toISOString().slice(0, 16),
        team1Score: '',
        team2Score: '',
        status: 'UPCOMING',
        stage: (defaultStage || bracketMatch?.stage || '') as MatchStage | '',
        duration: '',
      });
      setLoading(false);
    }
  }, [matchId, isOpen, leagueId, defaultStage, bracketMatch]);

  // Fetch teams and leagues on open
  useEffect(() => {
    if (isOpen) {
      fetchTeams();
      fetchLeagues();
      // Fetch seasons if we have a leagueId (from formData or prop)
      const currentLeagueId = formData.leagueId || leagueId;
      if (currentLeagueId) {
        fetchSeasons(currentLeagueId);
      }
    }
  }, [isOpen, formData.leagueId, leagueId, fetchSeasons]);

  // Track the previous leagueId to detect actual league changes
  const prevLeagueIdRef = React.useRef<string | undefined>(leagueId);

  // When leagueId in formData changes, fetch seasons for the new league
  // Only reset season if it doesn't belong to the new league
  useEffect(() => {
    const currentLeagueId = formData.leagueId || leagueId;
    const prevLeagueId = prevLeagueIdRef.current;
    
    // Only run if league actually changed (not on initial load)
    if (currentLeagueId && currentLeagueId !== prevLeagueId && isOpen) {
      prevLeagueIdRef.current = currentLeagueId;
      fetchSeasons(currentLeagueId).then(() => {
        // Check if current season belongs to new league
        setSeasons(prevSeasons => {
          const currentSeason = prevSeasons.find(s => s.id === formData.seasonId);
          if (currentSeason && currentSeason.leagueId !== currentLeagueId) {
            // Season doesn't belong to new league, reset to prop seasonId or empty
            setFormData(prev => ({ 
              ...prev, 
              seasonId: seasonId || '' 
            }));
          }
          return prevSeasons;
        });
      });
    } else if (currentLeagueId && !prevLeagueId) {
      // Initial load - just set the ref
      prevLeagueIdRef.current = currentLeagueId;
    }
  }, [formData.leagueId, leagueId, isOpen, fetchSeasons, seasonId]);

  const fetchMatch = async () => {
    if (!matchId) return;
    
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/matches/${matchId}`);
      if (!response.ok) throw new Error('Failed to fetch match');
      
      const match = (await response.json()) as any;
      const leagueId = getLeagueId(match) || '';
      const seasonId = getSeasonId(match) || '';
      
      // Fetch seasons first if we have a leagueId, so the select can display the season
      if (leagueId) {
        await fetchSeasons(leagueId);
      }
      
      setFormData({
        team1Id: getTeam1Id(match) || '',
        team1Name: getTeam1Name(match),
        team1Logo: getTeam1Logo(match) || '',
        team2Id: getTeam2Id(match) || '',
        team2Name: getTeam2Name(match),
        team2Logo: getTeam2Logo(match) || '',
        leagueId: leagueId,
        seasonId: seasonId,
        date: new Date(match.date).toISOString().slice(0, 16),
        team1Score: match.team1Score?.toString() || '',
        team2Score: match.team2Score?.toString() || '',
        status: match.status,
        stage: (match.stage as MatchStage) || '',
        duration: match.duration?.toString() || '',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load match';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      setTeamsLoading(true);
      const response = await fetch('/api/teams');
      if (response.ok) {
        const data = (await response.json()) as (Team | TeamWithPlayerCount)[];
        setTeams(data);
      }
    } catch (err) {
      console.error('Failed to fetch teams:', err);
    } finally {
      setTeamsLoading(false);
    }
  };

  const fetchLeagues = async () => {
    try {
      const response = await fetch('/api/leagues');
      if (response.ok) {
        const data = (await response.json()) as League[];
        setLeagues(data);
      }
    } catch (err) {
      console.error('Failed to fetch leagues:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!formData.team1Id && !formData.team1Name) || (!formData.team2Id && !formData.team2Name)) {
      setError('Please select or enter both teams');
      return;
    }

    if (!formData.date) {
      setError('Please select a date and time');
      return;
    }

    if (!formData.leagueId && !leagueId) {
      setError('Please select a league');
      return;
    }
    
    setSaving(true);
    setError('');

    try {
      const url = matchId ? `/api/matches/${matchId}` : '/api/matches';
      const method = matchId ? 'PUT' : 'POST';

      const payload: any = {
        date: formData.date,
        status: formData.status,
        stage: (formData.stage && formData.stage !== '__none' && formData.stage.trim() !== '') 
          ? formData.stage 
          : null,
        team1Score: formData.team1Score ? Number.parseInt(formData.team1Score, 10) : null,
        team2Score: formData.team2Score ? Number.parseInt(formData.team2Score, 10) : null,
        duration: formData.duration ? Number.parseInt(formData.duration, 10) : null,
        leagueId: formData.leagueId || leagueId,
        seasonId: formData.seasonId || seasonId,
      };

      if (formData.team1Id) {
        payload.team1Id = formData.team1Id;
      } else {
        payload.team1Name = formData.team1Name;
        payload.team1Logo = formData.team1Logo || '';
      }

      if (formData.team2Id) {
        payload.team2Id = formData.team2Id;
      } else {
        payload.team2Name = formData.team2Name;
        payload.team2Logo = formData.team2Logo || '';
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || 'Failed to save match');
      }

      onSave();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save match';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const team1Options = teams.filter(t => t.id !== formData.team2Id);
  const team2Options = teams.filter(t => t.id !== formData.team1Id);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{matchId ? 'Edit Match' : 'Create Match'}</DialogTitle>
          <DialogDescription>
            {matchId ? 'Update match details' : 'Create a new match for this bracket position'}
            {bracketMatch && (
              <div className="mt-2 space-y-1">
                {bracketMatch.tournamentRoundText && (
                  <div className="flex items-center gap-2 text-sm">
                    <Trophy className="h-3 w-3" />
                    <span>Round: {bracketMatch.tournamentRoundText}</span>
                  </div>
                )}
                {bracketMatch.bracketType && (
                  <div className="flex items-center gap-2 text-sm">
                    {bracketMatch.bracketType === 'upper' && (
                      <>
                        <ArrowUp className="h-3 w-3 text-blue-600" />
                        <span className="text-blue-600">Upper Bracket</span>
                      </>
                    )}
                    {bracketMatch.bracketType === 'lower' && (
                      <>
                        <ArrowDown className="h-3 w-3 text-orange-600" />
                        <span className="text-orange-600">Lower Bracket</span>
                      </>
                    )}
                    {bracketMatch.bracketType === 'grand-final' && (
                      <>
                        <Trophy className="h-3 w-3 text-yellow-600" />
                        <span className="text-yellow-600">Grand Final</span>
                      </>
                    )}
                  </div>
                )}
                {bracketMatch.nextMatchId && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Info className="h-3 w-3" />
                    <span>Winner advances to next round</span>
                  </div>
                )}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TeamSelect
                id="team1Id"
                label="Team 1"
                value={formData.team1Id}
                teams={team1Options}
                loading={teamsLoading}
                saving={saving}
                onSelect={(value) => {
                  const selectedTeam = teams.find((t) => t.id === value);
                  setFormData((prev) => ({
                    ...prev,
                    team1Id: value,
                    team1Name: selectedTeam ? selectedTeam.name : '',
                    team1Logo: selectedTeam ? selectedTeam.logo || '' : '',
                    ...(prev.team2Id === value 
                      ? { team2Id: '', team2Name: '', team2Logo: '' }
                      : {}
                    ),
                  }));
                }}
              />

              <TeamSelect
                id="team2Id"
                label="Team 2"
                value={formData.team2Id}
                teams={team2Options}
                loading={teamsLoading}
                saving={saving}
                onSelect={(value) => {
                  const selectedTeam = teams.find((t) => t.id === value);
                  setFormData((prev) => ({
                    ...prev,
                    team2Id: value,
                    team2Name: selectedTeam ? selectedTeam.name : '',
                    team2Logo: selectedTeam ? selectedTeam.logo || '' : '',
                    ...(prev.team1Id === value 
                      ? { team1Id: '', team1Name: '', team1Logo: '' }
                      : {}
                    ),
                  }));
                }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">
                  <Calendar className="inline h-4 w-4 mr-2" />
                  Date & Time <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="date"
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                  required
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="leagueId">
                  <Trophy className="inline h-4 w-4 mr-2" />
                  League
                </Label>
                <Select
                  value={formData.leagueId || leagueId || ''}
                  onValueChange={async (value) => {
                    // Update league first
                    setFormData((prev) => ({
                      ...prev,
                      leagueId: value,
                    }));
                    // Fetch seasons for new league
                    await fetchSeasons(value);
                    // After seasons are fetched, check if current season belongs to new league
                    setSeasons(prevSeasons => {
                      const currentSeason = prevSeasons.find(s => s.id === formData.seasonId);
                      if (!currentSeason || currentSeason.leagueId !== value) {
                        // Season doesn't belong to new league, reset to prop seasonId or empty
                        setFormData(prev => ({
                          ...prev,
                          seasonId: seasonId || '',
                        }));
                      }
                      return prevSeasons;
                    });
                  }}
                  disabled={saving || !!leagueId} // Disable if leagueId is provided as prop
                >
                  <SelectTrigger id="leagueId">
                    <SelectValue placeholder="Select a league" />
                  </SelectTrigger>
                  <SelectContent>
                    {leagues.map((league) => (
                      <SelectItem key={league.id} value={league.id}>
                        {league.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="seasonId">Season</Label>
                <Select
                  value={formData.seasonId ? formData.seasonId : '__none'}
                  onValueChange={(value) => 
                    setFormData((prev) => ({ 
                      ...prev, 
                      seasonId: value === '__none' ? '' : value 
                    }))
                  }
                  disabled={saving || (!formData.leagueId && !leagueId)}
                >
                  <SelectTrigger id="seasonId">
                    <SelectValue placeholder={formData.leagueId || leagueId ? "Select a season" : "Select a league first"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">No Season</SelectItem>
                    {seasons.map((season) => (
                      <SelectItem key={season.id} value={season.id}>
                        {season.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!formData.leagueId && !leagueId && (
                  <p className="text-sm text-muted-foreground">
                    Select a league first to choose a season
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="stage">Match Stage</Label>
                <Select
                  value={formData.stage || '__none'}
                  onValueChange={(value) => 
                    setFormData((prev) => ({ 
                      ...prev, 
                      stage: (value === '__none' ? '' : value) as MatchStage | '' 
                    }))
                  }
                  disabled={saving}
                >
                  <SelectTrigger id="stage">
                    <SelectValue placeholder="Select stage (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Regular Match</SelectItem>
                    {MATCH_STAGES.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {stage.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="team1Score">Team 1 Score</Label>
                <Input
                  id="team1Score"
                  type="number"
                  value={formData.team1Score}
                  onChange={(e) => setFormData((prev) => ({ ...prev, team1Score: e.target.value }))}
                  min="0"
                  disabled={saving}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="team2Score">Team 2 Score</Label>
                <Input
                  id="team2Score"
                  type="number"
                  value={formData.team2Score}
                  onChange={(e) => setFormData((prev) => ({ ...prev, team2Score: e.target.value }))}
                  min="0"
                  disabled={saving}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value as MatchStatus }))}
                  disabled={saving}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MATCH_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {matchId ? 'Update Match' : 'Create Match'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
