import { useState, useEffect } from 'react';
import type { Season, League } from '../../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, AlertCircle, Loader2, Save, X, Trophy, Info } from 'lucide-react';

interface SeasonEditorProps {
  seasonId?: string;
}

export default function SeasonEditor({ seasonId }: SeasonEditorProps) {
  const [loading, setLoading] = useState(!!seasonId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [leagues, setLeagues] = useState<League[]>([]);
  const [currentLeagueId, setCurrentLeagueId] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    startDate: '',
    endDate: '',
    leagueId: '',
    active: true,
    bracketType: '' as 'single' | 'double' | '',
    registrationOpensAt: '',
    registrationClosesAt: '',
  });

  // Converts a stored ISO/Date value into the local "YYYY-MM-DDTHH:mm" string
  // that a datetime-local input expects (empty string when unset).
  const toDateTimeLocal = (value: string | Date | null | undefined) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  };

  useEffect(() => {
    fetchLeagues();
    if (seasonId) {
      fetchSeason();
    }
  }, [seasonId]);

  const fetchLeagues = async () => {
    try {
      const response = await fetch('/api/leagues');
      if (!response.ok) throw new Error('Failed to fetch leagues');
      const data = await response.json();
      setLeagues(data);
    } catch (err: any) {
      console.error('Error fetching leagues:', err);
    }
  };

  const fetchSeason = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/seasons/${seasonId}`);
      if (!response.ok) throw new Error('Failed to fetch season');
      const season: Season = await response.json();

      // Seasons are many-to-many with leagues; this standalone editor manages a
      // single league, defaulting to the first one the season is attached to.
      const leagueId = (season as any).leagueSeasons?.[0]?.leagueId || '';
      setCurrentLeagueId(leagueId);
      setFormData({
        name: season.name,
        slug: season.slug,
        description: season.description || '',
        startDate: new Date(season.startDate).toISOString().slice(0, 10),
        endDate: new Date(season.endDate).toISOString().slice(0, 10),
        leagueId: leagueId,
        active: season.active,
        bracketType: (season as any).bracketType || '',
        registrationOpensAt: toDateTimeLocal((season as any).registrationOpensAt),
        registrationClosesAt: toDateTimeLocal((season as any).registrationClosesAt),
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load season');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const url = seasonId ? `/api/seasons/${seasonId}` : '/api/seasons';
      const method = seasonId ? 'PUT' : 'POST';

      const { leagueId, ...seasonFields } = formData;
      const payload = {
        ...seasonFields,
        slug: formData.slug || undefined,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        // Attach the chosen league (single-select here). Sends set-semantics on edit.
        leagueIds: leagueId ? [leagueId] : [],
        bracketType: formData.bracketType || undefined,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save season');
      }

      // Redirect to league editor if we have leagueId, otherwise to leagues list
      const redirectLeagueId = formData.leagueId || currentLeagueId;
      if (redirectLeagueId) {
        window.location.href = `/admin/leagues/${redirectLeagueId}`;
      } else {
        window.location.href = '/admin/leagues';
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save season');
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
          <h1 className="text-3xl font-heading font-semibold mb-2 text-foreground">
            {seasonId ? 'Edit Season' : 'Create New Season'}
          </h1>
          <p className="text-muted-foreground">
            {seasonId ? 'Update season information' : 'Create a new season'}
          </p>
        </div>
        <Button variant="outline" asChild>
          <a href={currentLeagueId ? `/admin/leagues/${currentLeagueId}` : '/admin/leagues'} data-astro-prefetch>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {currentLeagueId ? 'League' : 'Leagues'}
          </a>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Season Information</CardTitle>
            <CardDescription>Enter the details for this season</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Season Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  disabled={saving}
                  placeholder="e.g., 2024-2025"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder="Auto-generated from name"
                  disabled={saving}
                />
                <p className="text-sm text-muted-foreground">
                  Leave empty to auto-generate from name
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                disabled={saving}
                placeholder="Season description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="leagueId">
                  League <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.leagueId}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, leagueId: value }))}
                  required
                  disabled={saving}
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

              <div className="space-y-2">
                <Label htmlFor="active">Status</Label>
                <Select
                  value={formData.active ? 'true' : 'false'}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, active: value === 'true' }))}
                  disabled={saving}
                >
                  <SelectTrigger id="active">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">
                  Start Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                  required
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">
                  End Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                  required
                  disabled={saving}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bracketType" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Tournament Bracket Type
              </Label>
              <Select
                value={formData.bracketType || 'none'}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, bracketType: value === 'none' ? '' : value as 'single' | 'double' }))}
                disabled={saving}
              >
                <SelectTrigger id="bracketType" className="w-full">
                  <SelectValue placeholder="Select bracket type (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not specified</SelectItem>
                  <SelectItem value="single">Single Elimination</SelectItem>
                  <SelectItem value="double">Double Elimination</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>
                  This will be used as the default bracket type when generating tournament brackets for this season.
                  You can override this when generating brackets.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="registrationOpensAt">Registration Opens At</Label>
                <Input
                  id="registrationOpensAt"
                  type="datetime-local"
                  value={formData.registrationOpensAt}
                  onChange={(e) => setFormData((prev) => ({ ...prev, registrationOpensAt: e.target.value }))}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="registrationClosesAt">Registration Deadline</Label>
                <Input
                  id="registrationClosesAt"
                  type="datetime-local"
                  value={formData.registrationClosesAt}
                  onChange={(e) => setFormData((prev) => ({ ...prev, registrationClosesAt: e.target.value }))}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>
                Optional. These narrow the league's registration window for this season — registration must be
                open at both the league and season level. Leave empty to use only the league's window.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {seasonId ? 'Update Season' : 'Create Season'}
              </>
            )}
          </Button>
          <Button type="button" variant="outline" asChild>
            <a href={currentLeagueId || formData.leagueId ? `/admin/leagues/${currentLeagueId || formData.leagueId}` : '/admin/leagues'} data-astro-prefetch>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </a>
          </Button>
        </div>
      </form>
    </div>
  );
}
