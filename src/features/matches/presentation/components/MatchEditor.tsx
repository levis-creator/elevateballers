import { useEffect, useMemo } from 'react';
import type { MatchStatus } from '@/lib/types';
import type { MatchStage } from '@prisma/client';
import MatchPlayersManager from './MatchPlayersManager';
import MatchEventsManager from './MatchEventsManager';
import MatchImagesManager from './MatchImagesManager';
import TeamSelect from '@/features/team/presentation/components/TeamSelect';
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
import { useMatchEditorStore } from '../stores/useMatchEditorStore';

const MATCH_STATUSES: MatchStatus[] = ['UPCOMING', 'LIVE', 'COMPLETED'];
const MATCH_STAGES: MatchStage[] = [
  'REGULAR_SEASON', 'PRESEASON', 'EXHIBITION', 'PLAYOFF',
  'QUARTER_FINALS', 'SEMI_FINALS', 'CHAMPIONSHIP', 'QUALIFIER', 'OTHER',
];

interface MatchEditorProps {
  matchId?: string;
  seasonId?: string;
}

export default function MatchEditor({ matchId, seasonId: initialSeasonId }: MatchEditorProps) {
  const {
    loading, saving, errors, teams, teamsLoading, leagues, seasons,
    formData, updateForm, fetchTeams, fetchSeasons, clearSeasons, abort, submit,
  } = useMatchEditorStore();

  useEffect(() => {
    useMatchEditorStore.getState().init(matchId, initialSeasonId);
    return () => abort();
  }, [matchId, initialSeasonId]);

  // Fetch seasons when league changes
  useEffect(() => {
    if (formData.leagueId) {
      fetchSeasons(formData.leagueId);
      if (!initialSeasonId) updateForm({ seasonId: '' });
    } else {
      clearSeasons();
      if (!initialSeasonId) updateForm({ seasonId: '' });
    }
  }, [formData.leagueId]);

  const team1Options = useMemo(
    () => (formData.team2Id ? teams.filter((t) => t.id !== formData.team2Id) : teams),
    [teams, formData.team2Id]
  );

  const team2Options = useMemo(
    () => (formData.team1Id ? teams.filter((t) => t.id !== formData.team1Id) : teams),
    [teams, formData.team1Id]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await submit();
    if (ok) window.location.href = '/admin/matches';
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

  const hasError = errors.save || errors.match || errors.leagues || errors.teams;

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

      {hasError && (
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
                <Button type="button" variant="outline" size="sm" onClick={fetchTeams} disabled={teamsLoading}>
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
                  const t = teams.find((t) => t.id === value);
                  updateForm({
                    team1Id: value,
                    team1Name: t?.name ?? '',
                    team1Logo: t?.logo ?? '',
                    ...(formData.team2Id === value ? { team2Id: '', team2Name: '', team2Logo: '' } : {}),
                  });
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
                  const t = teams.find((t) => t.id === value);
                  updateForm({
                    team2Id: value,
                    team2Name: t?.name ?? '',
                    team2Logo: t?.logo ?? '',
                    ...(formData.team1Id === value ? { team1Id: '', team1Name: '', team1Logo: '' } : {}),
                  });
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
                  onChange={(e) => updateForm({ date: e.target.value })}
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
                  onValueChange={(value) => updateForm({ leagueId: value, seasonId: '' })}
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
                  value={formData.seasonId || '__none'}
                  onValueChange={(value) => updateForm({ seasonId: value === '__none' ? '' : value })}
                  disabled={saving || loading || !formData.leagueId}
                >
                  <SelectTrigger id="seasonId">
                    <SelectValue placeholder={formData.leagueId ? 'Select a season' : 'Select a league first'} />
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
                  <p className="text-sm text-muted-foreground">Select a league first to choose a season</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="stage">Match Stage</Label>
                <Select
                  value={formData.stage || '__none'}
                  onValueChange={(value) =>
                    updateForm({ stage: (value === '__none' ? '' : value) as MatchStage | '' })
                  }
                  disabled={saving || loading}
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
                <p className="text-sm text-muted-foreground">Select the stage or round of the match</p>
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
                  onChange={(e) => updateForm({ team1Score: e.target.value })}
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
                  onChange={(e) => updateForm({ team2Score: e.target.value })}
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
                  onChange={(e) => updateForm({ duration: e.target.value })}
                  min="0"
                  disabled={saving || loading}
                  placeholder="e.g. 40"
                />
                <p className="text-sm text-muted-foreground">Total match duration in minutes</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => updateForm({ status: value as MatchStatus })}
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

            <Separator className="my-6" />
            <MatchImagesManager matchId={matchId} />
          </div>
        </>
      )}
    </div>
  );
}
