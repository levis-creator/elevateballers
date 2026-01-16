import { useState, useEffect } from 'react';
import type { League, SeasonWithCounts } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowLeft, AlertCircle, Loader2, Save, X, Plus, Edit, Trash2, MoreVertical, CheckCircle, XCircle, CalendarRange, Eye } from 'lucide-react';

interface LeagueEditorProps {
  leagueId?: string;
  mode?: 'view' | 'edit';
}

export default function LeagueEditor({ leagueId, mode = 'edit' }: LeagueEditorProps) {
  const isViewMode = mode === 'view';
  const [loading, setLoading] = useState(!!leagueId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    logo: '',
    active: true,
  });

  // Seasons state
  const [seasons, setSeasons] = useState<SeasonWithCounts[]>([]);
  const [seasonsLoading, setSeasonsLoading] = useState(false);
  const [seasonsError, setSeasonsError] = useState('');
  const [showSeasonEditor, setShowSeasonEditor] = useState(false);
  const [editingSeasonId, setEditingSeasonId] = useState<string | undefined>(undefined);
  const [seasonFormData, setSeasonFormData] = useState({
    name: '',
    slug: '',
    description: '',
    startDate: '',
    endDate: '',
    active: true,
  });
  const [seasonSaving, setSeasonSaving] = useState(false);
  const [seasonFormError, setSeasonFormError] = useState('');

  useEffect(() => {
    if (leagueId) {
      fetchLeague();
      fetchSeasons();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leagueId]);

  const fetchLeague = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/leagues/${leagueId}`);
      if (!response.ok) throw new Error('Failed to fetch league');
      const league: League = await response.json();

      setFormData({
        name: league.name,
        slug: league.slug,
        description: league.description || '',
        logo: league.logo || '',
        active: league.active,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load league');
    } finally {
      setLoading(false);
    }
  };

  const fetchSeasons = async () => {
    if (!leagueId) return;

    try {
      setSeasonsLoading(true);
      setSeasonsError('');
      const response = await fetch(`/api/seasons?leagueId=${leagueId}`);
      if (!response.ok) throw new Error('Failed to fetch seasons');
      const data = await response.json();
      setSeasons(data);
    } catch (err: any) {
      setSeasonsError(err.message || 'Failed to load seasons');
    } finally {
      setSeasonsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const url = leagueId ? `/api/leagues/${leagueId}` : '/api/leagues';
      const method = leagueId ? 'PUT' : 'POST';

      const payload: any = {
        name: formData.name,
        slug: formData.slug || undefined,
        description: formData.description || undefined,
        logo: formData.logo || undefined,
        active: formData.active,
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
        throw new Error(errorData.error || 'Failed to save league');
      }

      window.location.href = '/admin/leagues';
    } catch (err: any) {
      setError(err.message || 'Failed to save league');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSeason = () => {
    setEditingSeasonId(undefined);
    setSeasonFormData({
      name: '',
      slug: '',
      description: '',
      startDate: '',
      endDate: '',
      active: true,
    });
    setSeasonFormError('');
    setShowSeasonEditor(true);
  };

  const handleEditSeason = async (id: string) => {
    try {
      const response = await fetch(`/api/seasons/${id}`);
      if (!response.ok) throw new Error('Failed to fetch season');
      const season: SeasonWithCounts = await response.json();

      setSeasonFormData({
        name: season.name,
        slug: season.slug || '',
        description: season.description || '',
        startDate: new Date(season.startDate).toISOString().slice(0, 10),
        endDate: new Date(season.endDate).toISOString().slice(0, 10),
        active: season.active,
      });
      setEditingSeasonId(id);
      setSeasonFormError('');
      setShowSeasonEditor(true);
    } catch (err: any) {
      setSeasonFormError(err.message || 'Failed to load season');
    }
  };

  const handleDeleteSeason = async (id: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this season?\n\nThis action cannot be undone. Matches associated with this season will have their season reference removed.'
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/seasons/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete season');
      
      setSeasonsError('');
      fetchSeasons();
    } catch (err: any) {
      setSeasonsError('Error deleting season: ' + err.message);
      setTimeout(() => setSeasonsError(''), 5000);
    }
  };

  const handleSeasonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSeasonSaving(true);
    setSeasonFormError('');

    try {
      const url = editingSeasonId ? `/api/seasons/${editingSeasonId}` : '/api/seasons';
      const method = editingSeasonId ? 'PUT' : 'POST';

      const payload = {
        ...seasonFormData,
        slug: seasonFormData.slug || undefined,
        startDate: new Date(seasonFormData.startDate).toISOString(),
        endDate: new Date(seasonFormData.endDate).toISOString(),
        leagueId: leagueId!,
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

      setShowSeasonEditor(false);
      fetchSeasons();
    } catch (err: any) {
      setSeasonFormError(err.message || 'Failed to save season');
    } finally {
      setSeasonSaving(false);
    }
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleViewSeasonMatches = (seasonId: string) => {
    window.location.href = `/admin/seasons/${seasonId}/matches`;
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

  // Safety check: if in view mode and no leagueId, show error
  if (isViewMode && !leagueId) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>League ID is required to view league details.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-6 border-b">
        <div>
          <h1 className="text-3xl font-heading font-semibold mb-2 text-foreground">
            {isViewMode ? 'View League' : leagueId ? 'Edit League' : 'Create New League'}
          </h1>
          <p className="text-muted-foreground">
            {isViewMode ? 'View league information and seasons' : leagueId ? 'Update league information' : 'Create a new league'}
          </p>
        </div>
        <div className="flex gap-2">
          {isViewMode && (
            <Button variant="default" asChild>
              <a href={`/admin/leagues/${leagueId}`} data-astro-prefetch>
                <Edit className="mr-2 h-4 w-4" />
                Edit League
              </a>
            </Button>
          )}
          <Button variant="outline" asChild>
            <a href="/admin/leagues" data-astro-prefetch>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to List
            </a>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isViewMode ? (
        <Card>
          <CardHeader>
            <CardTitle>League Information</CardTitle>
            <CardDescription>League details and information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>League Name</Label>
                <div className="text-base font-medium text-foreground">{formData.name || 'Not set'}</div>
              </div>

              <div className="space-y-2">
                <Label>Slug</Label>
                <div className="text-base font-mono text-foreground">{formData.slug || 'Not set'}</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <div className="text-base text-foreground whitespace-pre-wrap">
                {formData.description || 'No description provided'}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Logo</Label>
                {formData.logo ? (
                  <div className="mt-2">
                    <img
                      src={formData.logo}
                      alt="League logo"
                      className="h-24 w-24 object-contain border rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <a href={formData.logo} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:underline mt-2 block">
                      {formData.logo}
                    </a>
                  </div>
                ) : (
                  <div className="text-base text-muted-foreground">No logo set</div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <div>
                  {formData.active ? (
                    <Badge variant="outline" className="bg-green-500 text-white border-0 flex items-center gap-1.5 w-fit">
                      <CheckCircle size={14} />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-slate-500 text-white border-0 flex items-center gap-1.5 w-fit">
                      <XCircle size={14} />
                      Inactive
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>League Information</CardTitle>
              <CardDescription>Enter the details for this league</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    League Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    required
                    disabled={saving}
                    placeholder="League name"
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
                  placeholder="League description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="logo">Logo URL</Label>
                  <Input
                    id="logo"
                    type="url"
                    value={formData.logo}
                    onChange={(e) => setFormData((prev) => ({ ...prev, logo: e.target.value }))}
                    disabled={saving}
                    placeholder="https://example.com/logo.png"
                  />
                  {formData.logo && (
                    <div className="mt-2">
                      <img
                        src={formData.logo}
                        alt="Logo preview"
                        className="h-16 w-16 object-contain border rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
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
                  {leagueId ? 'Update League' : 'Create League'}
                </>
              )}
            </Button>
            <Button type="button" variant="outline" asChild>
              <a href="/admin/leagues" data-astro-prefetch>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </a>
            </Button>
          </div>
        </form>
      )}

      {/* Seasons Section - Show when viewing or editing existing league */}
      {leagueId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CalendarRange className="h-5 w-5" />
                  Seasons
                </CardTitle>
                <CardDescription>
                  {isViewMode ? 'Seasons for this league' : 'Manage seasons for this league'}
                </CardDescription>
              </div>
              <Button onClick={handleCreateSeason} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Create Season
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {seasonsError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{seasonsError}</AlertDescription>
              </Alert>
            )}

            {seasonsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : seasons.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <CalendarRange className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No seasons yet</h3>
                <p className="text-muted-foreground mb-4">
                  {isViewMode ? 'This league has no seasons yet' : 'Create your first season for this league'}
                </p>
                <Button onClick={handleCreateSeason} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Season
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Season Name</TableHead>
                    <TableHead>Date Range</TableHead>
                    <TableHead>Matches</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {seasons.map((season) => (
                    <TableRow key={season.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <strong className="font-semibold text-foreground">{season.name}</strong>
                          {season.description && (
                            <span className="text-sm text-muted-foreground line-clamp-1">
                              {season.description.substring(0, 100)}
                              {season.description.length > 100 ? '...' : ''}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm">
                          <span>{formatDate(season.startDate)}</span>
                          <span className="text-muted-foreground">to</span>
                          <span>{formatDate(season.endDate)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{season._count.matches}</span>
                      </TableCell>
                      <TableCell>
                        {season.active ? (
                          <Badge variant="outline" className="bg-green-500 text-white border-0 flex items-center gap-1.5 w-fit">
                            <CheckCircle size={14} />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-slate-500 text-white border-0 flex items-center gap-1.5 w-fit">
                            <XCircle size={14} />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9">
                              <MoreVertical size={18} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewSeasonMatches(season.id)}>
                              <Eye size={16} className="mr-2" />
                              View Matches
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditSeason(season.id)}>
                              <Edit size={16} className="mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteSeason(season.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 size={16} className="mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Season Editor Modal */}
      <Dialog open={showSeasonEditor} onOpenChange={setShowSeasonEditor}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSeasonId ? 'Edit Season' : 'Create New Season'}
            </DialogTitle>
            <DialogDescription>
              {editingSeasonId ? 'Update season information' : 'Create a new season for this league'}
            </DialogDescription>
          </DialogHeader>

          {seasonFormError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{seasonFormError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSeasonSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="season-name">
                  Season Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="season-name"
                  type="text"
                  value={seasonFormData.name}
                  onChange={(e) => setSeasonFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  disabled={seasonSaving}
                  placeholder="e.g., 2024-2025"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="season-slug">Slug</Label>
                <Input
                  id="season-slug"
                  type="text"
                  value={seasonFormData.slug}
                  onChange={(e) => setSeasonFormData((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder="Auto-generated from name"
                  disabled={seasonSaving}
                />
                <p className="text-sm text-muted-foreground">
                  Leave empty to auto-generate from name
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="season-description">Description</Label>
              <Textarea
                id="season-description"
                rows={3}
                value={seasonFormData.description}
                onChange={(e) => setSeasonFormData((prev) => ({ ...prev, description: e.target.value }))}
                disabled={seasonSaving}
                placeholder="Season description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="season-start-date">
                  Start Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="season-start-date"
                  type="date"
                  value={seasonFormData.startDate}
                  onChange={(e) => setSeasonFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                  required
                  disabled={seasonSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="season-end-date">
                  End Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="season-end-date"
                  type="date"
                  value={seasonFormData.endDate}
                  onChange={(e) => setSeasonFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                  required
                  disabled={seasonSaving}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="season-active">Status</Label>
              <Select
                value={seasonFormData.active ? 'true' : 'false'}
                onValueChange={(value) => setSeasonFormData((prev) => ({ ...prev, active: value === 'true' }))}
                disabled={seasonSaving}
              >
                <SelectTrigger id="season-active">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowSeasonEditor(false)} disabled={seasonSaving}>
                Cancel
              </Button>
              <Button type="submit" disabled={seasonSaving}>
                {seasonSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {editingSeasonId ? 'Update Season' : 'Create Season'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
