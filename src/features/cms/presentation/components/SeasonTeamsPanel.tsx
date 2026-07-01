import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Team } from '../../types';
import TeamLogo from '../../../matches/components/TeamLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
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
import { AlertCircle, Plus, Users, X, Loader2, RefreshCw, Search } from 'lucide-react';

interface SeasonTeamsPanelProps {
  seasonId: string;
  // The leagues this season runs in — a team joins one specific league.
  leagues?: { id: string; name: string }[];
}

export default function SeasonTeamsPanel({ seasonId, leagues = [] }: SeasonTeamsPanelProps) {
  const [participants, setParticipants] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  // Add-teams dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [allTeamsLoading, setAllTeamsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedLeagueId, setSelectedLeagueId] = useState('');
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);

  // Default the league selection to the season's first (or only) league.
  useEffect(() => {
    if (!selectedLeagueId && leagues.length > 0) setSelectedLeagueId(leagues[0].id);
  }, [leagues, selectedLeagueId]);

  // Remove-confirmation state
  const [teamToRemove, setTeamToRemove] = useState<Team | null>(null);
  const [removing, setRemoving] = useState(false);
  const [backfilling, setBackfilling] = useState(false);

  const fetchParticipants = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/seasons/${seasonId}/teams`);
      if (!res.ok) throw new Error('Failed to load teams');
      setParticipants((await res.json()) as Team[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  }, [seasonId]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  const participantIds = useMemo(
    () => new Set(participants.map((t) => t.id)),
    [participants]
  );

  const openAddDialog = async () => {
    setDialogOpen(true);
    setSelectedIds(new Set());
    setSearch('');
    if (allTeams.length === 0) {
      try {
        setAllTeamsLoading(true);
        const res = await fetch('/api/teams');
        if (res.ok) setAllTeams((await res.json()) as Team[]);
      } catch {
        // Non-fatal: dialog shows an empty list; user can retry.
      } finally {
        setAllTeamsLoading(false);
      }
    }
  };

  // Teams not already in the season, filtered by the search box.
  const addableTeams = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allTeams
      .filter((t) => !participantIds.has(t.id))
      .filter((t) => (q ? t.name.toLowerCase().includes(q) : true));
  }, [allTeams, participantIds, search]);

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = async () => {
    if (selectedIds.size === 0) return;
    if (!selectedLeagueId) {
      setError('Select a league for these teams first.');
      return;
    }
    try {
      setAdding(true);
      setError('');
      const res = await fetch(`/api/seasons/${seasonId}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leagueId: selectedLeagueId, teamIds: [...selectedIds] }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || 'Failed to add teams');
      }
      const { added } = (await res.json()) as { added: number };
      setInfo(`${added} team${added === 1 ? '' : 's'} added.`);
      setDialogOpen(false);
      await fetchParticipants();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add teams');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async () => {
    if (!teamToRemove) return;
    try {
      setRemoving(true);
      setError('');
      const res = await fetch(`/api/seasons/${seasonId}/teams/${teamToRemove.id}`, {
        method: 'DELETE',
      });
      if (!res.ok && res.status !== 404) throw new Error('Failed to remove team');
      setTeamToRemove(null);
      await fetchParticipants();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove team');
    } finally {
      setRemoving(false);
    }
  };

  const handleBackfill = async () => {
    try {
      setBackfilling(true);
      setError('');
      const res = await fetch(`/api/seasons/${seasonId}/teams/backfill`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to backfill teams');
      const { added } = (await res.json()) as { added: number };
      setInfo(
        added > 0
          ? `${added} team${added === 1 ? '' : 's'} added from existing matches.`
          : 'No new teams found in this season’s matches.'
      );
      await fetchParticipants();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to backfill teams');
    } finally {
      setBackfilling(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Teams in this season ({participants.length})
            </CardTitle>
            <CardDescription>
              Register the teams that play in this season. These narrow the team pickers
              when creating matches and pre-fill the bracket generator.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add teams
            </Button>
            <Button variant="outline" onClick={handleBackfill} disabled={backfilling}>
              {backfilling ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Backfill from matches
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {info && (
          <Alert className="border-green-500/50 text-green-700 dark:text-green-400 [&>svg]:text-green-600">
            <Users className="h-4 w-4" />
            <AlertDescription>{info}</AlertDescription>
          </Alert>
        )}

        {participants.length === 0 ? (
          <div className="border border-dashed rounded-lg p-10 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No teams yet</p>
            <p className="text-sm">
              Add the teams that play in this season, or backfill from existing matches.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {participants.map((team) => (
              <div
                key={team.id}
                className="flex items-center gap-2 rounded-full border bg-muted/40 pl-2 pr-1 py-1"
              >
                <TeamLogo logo={team.logo} name={team.name} size="xs" className="w-6 h-6 object-contain" />
                <span className="text-sm font-medium">{team.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setTeamToRemove(team)}
                  aria-label={`Remove ${team.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add teams dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add teams to this season</DialogTitle>
            <DialogDescription>
              Select the teams that participate. Teams already in the season are hidden.
            </DialogDescription>
          </DialogHeader>

          {leagues.length > 0 && (
            <div className="space-y-1.5">
              <label htmlFor="season-team-league" className="text-sm font-medium">League</label>
              <select
                id="season-team-league"
                value={selectedLeagueId}
                onChange={(e) => setSelectedLeagueId(e.target.value)}
                disabled={leagues.length === 1}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                {leagues.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">Teams join this league within the season.</p>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search teams..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="max-h-72 overflow-y-auto rounded-md border divide-y">
            {allTeamsLoading ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                Loading teams...
              </div>
            ) : addableTeams.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                {allTeams.length === 0
                  ? 'No teams found.'
                  : 'All teams are already in this season (or no match for your search).'}
              </div>
            ) : (
              addableTeams.map((team) => (
                <label
                  key={team.id}
                  className="flex items-center gap-3 p-2.5 cursor-pointer hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selectedIds.has(team.id)}
                    onCheckedChange={() => toggleSelected(team.id)}
                  />
                  <TeamLogo logo={team.logo} name={team.name} size="xs" className="w-6 h-6 object-contain" />
                  <span className="text-sm font-medium">{team.name}</span>
                </label>
              ))
            )}
          </div>

          <DialogFooter className="items-center sm:justify-between gap-2">
            <span className="text-sm text-muted-foreground">{selectedIds.size} selected</span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={adding}>
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={adding || selectedIds.size === 0}>
                {adding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>Add {selectedIds.size > 0 ? selectedIds.size : ''} team{selectedIds.size === 1 ? '' : 's'}</>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove confirmation */}
      <AlertDialog open={!!teamToRemove} onOpenChange={(open) => !open && setTeamToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {teamToRemove?.name} from this season?</AlertDialogTitle>
            <AlertDialogDescription>
              This only removes the team from the season roster. Its existing matches are not
              affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleRemove();
              }}
              disabled={removing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removing ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
