import { useState, useEffect, type ComponentType } from 'react';
import type { SeasonWithCounts } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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
import { Checkbox } from '@/components/ui/checkbox';

export default function SeasonList() {
  const [seasons, setSeasons] = useState<SeasonWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);
  const [icons, setIcons] = useState<{
    Plus?: ComponentType<any>;
    Search?: ComponentType<any>;
    Edit?: ComponentType<any>;
    Trash2?: ComponentType<any>;
    CalendarRange?: ComponentType<any>;
    AlertCircle?: ComponentType<any>;
    RefreshCw?: ComponentType<any>;
    MoreVertical?: ComponentType<any>;
    CheckCircle?: ComponentType<any>;
    XCircle?: ComponentType<any>;
  }>({});

  useEffect(() => {
    import('lucide-react').then((mod) => {
      setIcons({
        Plus: mod.Plus,
        Search: mod.Search,
        Edit: mod.Edit,
        Trash2: mod.Trash2,
        CalendarRange: mod.CalendarRange,
        AlertCircle: mod.AlertCircle,
        RefreshCw: mod.RefreshCw,
        MoreVertical: mod.MoreVertical,
        CheckCircle: mod.CheckCircle,
        XCircle: mod.XCircle,
      });
    });
  }, []);

  useEffect(() => {
    fetchSeasons();
  }, []);

  const fetchSeasons = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/seasons');
      if (!response.ok) throw new Error('Failed to fetch seasons');
      const data = await response.json();
      setSeasons(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load seasons');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this season?\n\nThis action cannot be undone. Leagues and matches associated with this season will have their season reference removed.'
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/seasons/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete season');
      setError('');
      fetchSeasons();
    } catch (err: any) {
      setError('Error deleting season: ' + err.message);
      setTimeout(() => setError(''), 5000);
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

  const filteredSeasons = seasons.filter(
    (season) =>
      season.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (season.description && season.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(filteredSeasons.map(season => season.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  const handleBulkDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedItems.size} season(s)?\n\nThis action cannot be undone. Leagues and matches associated with these seasons will have their season reference removed.`
    );
    if (!confirmed) return;

    setIsBulkActionLoading(true);
    try {
      const response = await fetch('/api/seasons/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedItems) }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete seasons');
      }

      clearSelection();
      fetchSeasons();
    } catch (err: any) {
      setError('Error deleting seasons: ' + err.message);
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const allSelected = filteredSeasons.length > 0 && selectedItems.size === filteredSeasons.length;

  const PlusIcon = icons.Plus;
  const SearchIcon = icons.Search;
  const EditIcon = icons.Edit;
  const Trash2Icon = icons.Trash2;
  const CalendarRangeIcon = icons.CalendarRange;
  const AlertCircleIcon = icons.AlertCircle;
  const RefreshCwIcon = icons.RefreshCw;
  const MoreVerticalIcon = icons.MoreVertical;
  const CheckCircleIcon = icons.CheckCircle;
  const XCircleIcon = icons.XCircle;

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center gap-4">
            {AlertCircleIcon ? <AlertCircleIcon size={24} className="text-destructive" /> : null}
            <div>
              <p className="font-semibold mb-2">Error Loading Seasons</p>
              <p className="text-muted-foreground">{error}</p>
            </div>
            <Button onClick={fetchSeasons} variant="default">
              {RefreshCwIcon ? <RefreshCwIcon size={18} className="mr-2" /> : null}
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-6 border-b">
        <div>
          <h1 className="text-3xl font-heading font-semibold mb-2 text-foreground flex items-center gap-2">
            {CalendarRangeIcon ? <CalendarRangeIcon size={28} /> : null}
            Seasons
          </h1>
          <p className="text-muted-foreground">Manage seasons and tournaments</p>
        </div>
        <Button asChild>
          <a href="/admin/seasons/new" data-astro-prefetch>
            {PlusIcon ? <PlusIcon size={18} className="mr-2" /> : null}
            Create Season
          </a>
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
          <div className="relative flex-1">
            <label htmlFor="season-search" className="sr-only">Search seasons</label>
            {SearchIcon ? (
              <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            ) : null}
            <Input
              id="season-search"
              type="text"
              placeholder="Search seasons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              aria-label="Search seasons by name or description"
            />
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        {selectedItems.size > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="text-sm font-medium text-foreground">
                  {selectedItems.size} season(s) selected
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={isBulkActionLoading}
                  >
                    {Trash2Icon ? <Trash2Icon size={16} className="mr-2" /> : null}
                    Delete
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    disabled={isBulkActionLoading}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Empty State */}
      {filteredSeasons.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="text-muted-foreground">
                {searchTerm ? (
                  SearchIcon ? <SearchIcon size={64} /> : null
                ) : (
                  CalendarRangeIcon ? <CalendarRangeIcon size={64} /> : null
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  {searchTerm ? 'No seasons found' : 'No seasons yet'}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Try a different search term' : 'Create your first season to get started'}
                </p>
              </div>
              {!searchTerm && (
                <Button asChild>
                  <a href="/admin/seasons/new" data-astro-prefetch>
                    {PlusIcon ? <PlusIcon size={18} className="mr-2" /> : null}
                    Create Season
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Table View */
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all seasons"
                  />
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    {CalendarRangeIcon ? <CalendarRangeIcon size={16} /> : null}
                    Season
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    {CalendarRangeIcon ? <CalendarRangeIcon size={16} /> : null}
                    Quarter
                  </div>
                </TableHead>
                <TableHead>League</TableHead>
                <TableHead>Matches</TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    {CheckCircleIcon ? <CheckCircleIcon size={16} /> : null}
                    Status
                  </div>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSeasons.map((season) => (
                <TableRow key={season.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedItems.has(season.id)}
                      onCheckedChange={(checked) => handleSelectItem(season.id, checked as boolean)}
                      aria-label={`Select ${season.name}`}
                    />
                  </TableCell>
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
                    {season.league ? (
                      <span className="text-sm">{season.league.name}</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">Not set</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{season._count.matches}</span>
                  </TableCell>
                  <TableCell>
                    {season.active ? (
                      <Badge variant="outline" className="bg-green-500 text-white border-0 flex items-center gap-1.5 w-fit">
                        {CheckCircleIcon ? <CheckCircleIcon size={14} /> : null}
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-slate-500 text-white border-0 flex items-center gap-1.5 w-fit">
                        {XCircleIcon ? <XCircleIcon size={14} /> : null}
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                          {MoreVerticalIcon ? <MoreVerticalIcon size={18} /> : null}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <a href={`/admin/seasons/${season.id}`} data-astro-prefetch>
                            {EditIcon ? <EditIcon size={16} className="mr-2" /> : null}
                            Edit
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(season.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          {Trash2Icon ? <Trash2Icon size={16} className="mr-2" /> : null}
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
