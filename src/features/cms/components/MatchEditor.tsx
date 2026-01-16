import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Match, MatchStatus, Team, League, Season, TeamWithPlayerCount } from '../types';
import type { MatchStage } from '@prisma/client';
import { getTeam1Name, getTeam1Logo, getTeam2Name, getTeam2Logo, getTeam1Id, getTeam2Id } from '../../matches/lib/team-helpers';
import { getLeagueName, getLeagueId } from '../../matches/lib/league-helpers';
import { getSeasonId } from '../../matches/lib/season-helpers';
import MatchPlayersManager from './MatchPlayersManager';
import MatchEventsManager from './MatchEventsManager';
import TeamSelect from './TeamSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, X, AlertCircle, Trophy, Calendar, RefreshCw, Loader2 } from 'lucide-react';

// Constants moved outside component to prevent recreation on each render
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

// Environment-based logging
const isDev = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const log = isDev ? console.log : () => {};
const logError = isDev ? console.error : () => {};
const logWarn = isDev ? console.warn : () => {};

interface MatchEditorProps {
  matchId?: string;
  seasonId?: string;
}

export default function MatchEditor({ matchId, seasonId: initialSeasonId }: MatchEditorProps) {
  const [loading, setLoading] = useState(!!matchId);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({
    teams: '',
    leagues: '',
    match: '',
    save: '',
  });
  const [teams, setTeams] = useState<(Team | TeamWithPlayerCount)[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [leaguesLoading, setLeaguesLoading] = useState(false);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [seasonsLoading, setSeasonsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [formData, setFormData] = useState({
    team1Id: '',
    team1Name: '',
    team1Logo: '',
    team2Id: '',
    team2Name: '',
    team2Logo: '',
    leagueId: '',
    league: '',
    seasonId: initialSeasonId || '',
    date: '',
    team1Score: '',
    team2Score: '',
    status: 'UPCOMING' as MatchStatus,
    stage: '' as MatchStage | '',
    duration: '',
  });

  // Define fetch functions first
  const fetchSeasons = useCallback(async (leagueId: string) => {
    try {
      setSeasonsLoading(true);
      const response = await fetch(`/api/seasons?leagueId=${leagueId}`);
      if (response.ok) {
        const data = (await response.json()) as Season[];
        setSeasons(data);
      }
    } catch (err: unknown) {
      logError('Failed to fetch seasons:', err);
    } finally {
      setSeasonsLoading(false);
    }
  }, []);

  const fetchMatch = useCallback(async () => {
    if (!matchId) return;
    
    try {
      setLoading(true);
      setErrors((prev) => ({ ...prev, match: '' }));
      const response = await fetch(`/api/matches/${matchId}`);
      if (!response.ok) throw new Error('Failed to fetch match');
      
      const match = (await response.json()) as Match & {
        team1?: Team | null;
        team2?: Team | null;
        league?: League | null;
        season?: Season | null;
      };

      const leagueId = getLeagueId(match) || '';
      const seasonId = getSeasonId(match) || '';
      
      setFormData({
        team1Id: getTeam1Id(match) || '',
        team1Name: getTeam1Name(match),
        team1Logo: getTeam1Logo(match) || '',
        team2Id: getTeam2Id(match) || '',
        team2Name: getTeam2Name(match),
        team2Logo: getTeam2Logo(match) || '',
        leagueId: leagueId,
        league: '',
        seasonId: seasonId,
        date: new Date(match.date).toISOString().slice(0, 16),
        team1Score: match.team1Score?.toString() || '',
        team2Score: match.team2Score?.toString() || '',
        status: match.status,
        stage: (match.stage as MatchStage) || '',
        duration: match.duration?.toString() || '',
      });

      // Fetch seasons for the selected league
      if (leagueId) {
        fetchSeasons(leagueId);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load match';
      setErrors((prev) => ({ ...prev, match: message }));
    } finally {
      setLoading(false);
    }
  }, [matchId, fetchSeasons]);

  const fetchLeagues = useCallback(async () => {
    try {
      setLeaguesLoading(true);
      setErrors((prev) => ({ ...prev, leagues: '' }));
      const response = await fetch('/api/leagues');
      if (response.ok) {
        const data = (await response.json()) as League[];
        setLeagues(data);
      } else {
        setErrors((prev) => ({
          ...prev,
          leagues: `Failed to load leagues (${response.status})`,
        }));
      }
    } catch (err: unknown) {
      logError('Failed to fetch leagues:', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      setErrors((prev) => ({
        ...prev,
        leagues: `Failed to load leagues: ${message}`,
      }));
    } finally {
      setLeaguesLoading(false);
    }
  }, []);

  const fetchTeams = useCallback(async () => {
    try {
      setTeamsLoading(true);
      setErrors((prev) => ({ ...prev, teams: '' }));
      log('[Client] Fetching teams from /api/teams...');
      
      // Cleanup previous abort controller
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const timeoutId = setTimeout(() => {
        logWarn('[Client] Request timeout - aborting...');
        controller.abort();
      }, 8000);
      
      let response: Response;
      try {
        response = await fetch('/api/teams', {
          signal: controller.signal,
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          cache: 'no-cache',
        });
        clearTimeout(timeoutId);
      } catch (fetchError: unknown) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          logError('[Client] Request timeout');
          setErrors((prev) => ({
            ...prev,
            teams: 'Request timeout: The server is taking too long to respond. You can still enter custom team names.',
          }));
          setTeams([]);
          setTeamsLoading(false);
          return;
        }
        throw fetchError;
      }
      
      if (!response.ok) {
        let errorData: { error?: string };
        try {
          const text = await response.text();
          errorData = JSON.parse(text) as { error?: string };
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        logError('[Client] API request failed:', response.status, errorData);
        setErrors((prev) => ({
          ...prev,
          teams: errorData.error || `Failed to load teams (${response.status})`,
        }));
        setTeams([]);
        setTeamsLoading(false);
        return;
      }
      
      let data: unknown;
      try {
        const text = await response.text();
        data = JSON.parse(text);
      } catch (parseError) {
        logError('[Client] Failed to parse JSON response:', parseError);
        setErrors((prev) => ({
          ...prev,
          teams: 'Failed to parse server response. Check console for details.',
        }));
        setTeams([]);
        setTeamsLoading(false);
        return;
      }
      
      // Check if data is an array (teams) or an object with error
      if (Array.isArray(data)) {
        setTeams(data as (Team | TeamWithPlayerCount)[]);
        log(`[Client] Successfully loaded ${data.length} teams from database`);
        if (data.length === 0) {
          logWarn('[Client] No teams found in database');
        }
      } else if (data && typeof data === 'object' && 'error' in data) {
        const errorData = data as { error: string };
        logError('[Client] API returned error:', errorData.error);
        setErrors((prev) => ({
          ...prev,
          teams: `Failed to load teams: ${errorData.error}`,
        }));
        setTeams([]);
      } else {
        logError('[Client] Unexpected response format:', data);
        setErrors((prev) => ({
          ...prev,
          teams: 'Failed to load teams: Unexpected response format',
        }));
        setTeams([]);
      }
    } catch (err: unknown) {
      logError('[Client] Exception in fetchTeams:', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      setErrors((prev) => ({
        ...prev,
        teams: `Failed to load teams: ${message}. You can still enter custom team names.`,
      }));
      setTeams([]);
    } finally {
      setTeamsLoading(false);
      abortControllerRef.current = null;
    }
  }, []);

  // Use effects after functions are defined
  useEffect(() => {
    fetchTeams();
    fetchLeagues();
    if (matchId) {
      fetchMatch();
    }
    
    // If initialSeasonId is provided, fetch the season to get the leagueId
    if (initialSeasonId && !matchId) {
      fetch(`/api/seasons/${initialSeasonId}`)
        .then(res => res.json())
        .then((season: any) => {
          if (season?.leagueId) {
            setFormData(prev => ({ ...prev, leagueId: season.leagueId, seasonId: initialSeasonId }));
            fetchSeasons(season.leagueId);
          }
        })
        .catch(err => logError('Failed to fetch season:', err));
    }
    
    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, initialSeasonId]);

  useEffect(() => {
    // Fetch seasons when league is selected
    if (formData.leagueId) {
      fetchSeasons(formData.leagueId);
      // If we have initialSeasonId but league changed, clear it unless it belongs to new league
      if (!initialSeasonId && formData.seasonId !== initialSeasonId) {
        setFormData((prev) => ({ ...prev, seasonId: '' }));
      }
    } else {
      setSeasons([]);
      if (!initialSeasonId) {
        setFormData((prev) => ({ ...prev, seasonId: '' }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.leagueId]);

  // Filter teams to exclude the selected team from the other team's options
  const team1Options = useMemo(() => {
    if (!formData.team2Id) return teams;
    return teams.filter((team) => team.id !== formData.team2Id);
  }, [teams, formData.team2Id]);

  const team2Options = useMemo(() => {
    if (!formData.team1Id) return teams;
    return teams.filter((team) => team.id !== formData.team1Id);
  }, [teams, formData.team1Id]);

  const validateForm = (): string[] => {
    const errors: string[] = [];

    // Team validation
    if (!formData.team1Id) {
      errors.push('Team 1 is required');
    }
    if (!formData.team2Id) {
      errors.push('Team 2 is required');
    }

    // League validation
    if (!formData.leagueId) {
      errors.push('League is required');
    }

    // Date validation
    if (!formData.date) {
      errors.push('Date & Time is required');
    } else {
      const matchDate = new Date(formData.date);
      const now = new Date();
      if (matchDate < now && formData.status === 'UPCOMING') {
        errors.push('Upcoming matches must be scheduled in the future');
      }
    }

    // Score validation
    if (formData.team1Score) {
      const score = Number.parseInt(formData.team1Score, 10);
      if (isNaN(score) || score < 0 || score > 999) {
        errors.push('Team 1 score must be between 0 and 999');
      }
    }
    if (formData.team2Score) {
      const score = Number.parseInt(formData.team2Score, 10);
      if (isNaN(score) || score < 0 || score > 999) {
        errors.push('Team 2 score must be between 0 and 999');
      }
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Block submission if match is completed
    if (matchId && formData.status === 'COMPLETED') {
      setErrors({ teams: '', leagues: '', match: '', save: 'Cannot edit a completed match' });
      return;
    }
    
    setSaving(true);
    setErrors({ teams: '', leagues: '', match: '', save: '' });

    try {
      // Validate form
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join('. '));
      }

      const url = matchId ? `/api/matches/${matchId}` : '/api/matches';
      const method = matchId ? 'PUT' : 'POST';

      const payload: {
        date: string;
        status: MatchStatus;
        stage: MatchStage | null;
        team1Score: number | null;
        team2Score: number | null;
        duration: number | null;
        leagueId?: string;
        league?: string;
        seasonId?: string;
        team1Id?: string;
        team1Name?: string;
        team1Logo?: string;
        team2Id?: string;
        team2Name?: string;
        team2Logo?: string;
      } = {
        date: formData.date,
        status: formData.status,
        stage: (formData.stage as MatchStage) || null,
        team1Score: formData.team1Score ? Number.parseInt(formData.team1Score, 10) : null,
        team2Score: formData.team2Score ? Number.parseInt(formData.team2Score, 10) : null,
        duration: formData.duration ? Number.parseInt(formData.duration, 10) : null,
      };

      // Use league ID
      if (formData.leagueId) {
        payload.leagueId = formData.leagueId;
      }

      // Use season ID if selected
      if (formData.seasonId) {
        payload.seasonId = formData.seasonId;
      }

      // Use team IDs if selected, otherwise use fallback fields
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

      // Redirect to matches list
      window.location.href = '/admin/matches';
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save match';
      setErrors((prev) => ({ ...prev, save: message }));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }


  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-6 border-b">
        <div>
          <h1 className="text-3xl font-heading font-semibold mb-2 text-foreground flex items-center gap-2">
            <Trophy className="h-8 w-8" />
            {matchId ? 'Edit Match' : 'Create New Match'}
          </h1>
          <p className="text-muted-foreground">
            {matchId ? 'Update match details and information' : 'Create a new match fixture'}
          </p>
        </div>
        <Button variant="outline" asChild>
          <a href="/admin/matches" data-astro-prefetch>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </a>
        </Button>
      </div>

      {(errors.teams || errors.leagues || errors.match || errors.save) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {errors.save || errors.match || errors.leagues || errors.teams}
            {errors.teams && (
              <div className="mt-2 text-sm">
                <p>Please check:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Database connection is active</li>
                  <li>Teams exist in the database</li>
                  <li>Check browser console for detailed error logs</li>
                </ul>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Teams */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
            <CardTitle>Teams</CardTitle>
            <CardDescription>Select teams or enter custom team information</CardDescription>
              </div>
              {!teamsLoading && (teams.length === 0 || errors.teams) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={fetchTeams}
                  disabled={teamsLoading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TeamSelect
                id="team1Id"
                label="Team 1"
                value={formData.team1Id}
                teams={team1Options}
                loading={teamsLoading}
                saving={saving}
                error={errors.teams}
                onSelect={(value) => {
                  const selectedTeam = teams.find((t) => t.id === value);
                  setFormData((prev) => ({
                    ...prev,
                    team1Id: value,
                    team1Name: selectedTeam ? selectedTeam.name : '',
                    team1Logo: selectedTeam ? selectedTeam.logo || '' : '',
                    // Clear team2 if it's the same team
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
                error={errors.teams}
                onSelect={(value) => {
                  const selectedTeam = teams.find((t) => t.id === value);
                  setFormData((prev) => ({
                    ...prev,
                    team2Id: value,
                    team2Name: selectedTeam ? selectedTeam.name : '',
                    team2Logo: selectedTeam ? selectedTeam.logo || '' : '',
                    // Clear team1 if it's the same team
                    ...(prev.team1Id === value 
                      ? { team1Id: '', team1Name: '', team1Logo: '' }
                      : {}
                    ),
                  }));
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Match Details */}
        <Card>
          <CardHeader>
            <CardTitle>Match Details</CardTitle>
            <CardDescription>Date, league, season, and stage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                  disabled={saving || loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="leagueId">
                  <Trophy className="inline h-4 w-4 mr-2" />
                  League <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.leagueId}
                  onValueChange={(value) => {
                    setFormData((prev) => ({
                      ...prev,
                      leagueId: value,
                      seasonId: '', // Reset season when league changes
                    }));
                  }}
                  required
                  disabled={saving || loading}
                >
                  <SelectTrigger id="leagueId">
                    <SelectValue placeholder="Select a league from database..." />
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
                value={formData.seasonId || "__none"}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, seasonId: value === "__none" ? "" : value }))}
                disabled={saving || loading || !formData.leagueId}
              >
                <SelectTrigger id="seasonId">
                  <SelectValue placeholder={formData.leagueId ? "Select a season" : "Select a league first"} />
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
              {!formData.leagueId && (
                <p className="text-sm text-muted-foreground">
                  Select a league first to choose a season
                </p>
              )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="stage">Match Stage</Label>
                <Select
                  value={formData.stage || "__none"}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, stage: (value === "__none" ? "" : value) as MatchStage || '' }))}
                  disabled={saving || loading}
                >
                  <SelectTrigger id="stage">
                    <SelectValue placeholder="Select stage (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Regular Match</SelectItem>
                    {MATCH_STAGES.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {stage.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Select the stage or round of the match
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scores & Status */}
        <Card>
          <CardHeader>
            <CardTitle>Scores & Status</CardTitle>
            <CardDescription>Match scores and current status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="team1Score">Team 1 Score</Label>
                <Input
                  id="team1Score"
                  type="number"
                  value={formData.team1Score}
                  onChange={(e) => setFormData((prev) => ({ ...prev, team1Score: e.target.value }))}
                  min="0"
                  disabled={saving || loading}
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
                  disabled={saving || loading}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData((prev) => ({ ...prev, duration: e.target.value }))}
                  min="0"
                  disabled={saving || loading}
                  placeholder="e.g. 40"
                />
                <p className="text-sm text-muted-foreground">
                  Total match duration in minutes
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value as MatchStatus }))}
                  disabled={saving || loading}
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
          </CardContent>
        </Card>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={saving || loading}>
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
          <Button type="button" variant="outline" asChild>
            <a href="/admin/matches" data-astro-prefetch>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </a>
          </Button>
        </div>
      </form>

      {matchId && (
        <>
          <Separator className="my-6" />
          <div className="space-y-6">
            <MatchPlayersManager
              matchId={matchId}
              team1Id={formData.team1Id || null}
              team2Id={formData.team2Id || null}
            />

            <Separator className="my-6" />
            <MatchEventsManager
              matchId={matchId}
              team1Id={formData.team1Id || null}
              team2Id={formData.team2Id || null}
            />
          </div>
        </>
      )}
    </div>
  );
}
