import { useState, useEffect, type ComponentType } from 'react';
import type { Match } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { getTeam1Name, getTeam1Logo, getTeam2Name, getTeam2Logo } from '../../matches/lib/team-helpers';
import { getLeagueName } from '../../matches/lib/league-helpers';

export default function MatchList() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);
  const [icons, setIcons] = useState<{
    Plus?: ComponentType<any>;
    Search?: ComponentType<any>;
    List?: ComponentType<any>;
    Grid?: ComponentType<any>;
    Edit?: ComponentType<any>;
    Trash2?: ComponentType<any>;
    Calendar?: ComponentType<any>;
    AlertCircle?: ComponentType<any>;
    Clock?: ComponentType<any>;
    CheckCircle?: ComponentType<any>;
    Play?: ComponentType<any>;
    MoreVertical?: ComponentType<any>;
    Trophy?: ComponentType<any>;
    Users?: ComponentType<any>;
    RefreshCw?: ComponentType<any>;
    Eye?: ComponentType<any>;
  }>({});

  useEffect(() => {
    import('lucide-react').then((mod) => {
      setIcons({
        Plus: mod.Plus,
        Search: mod.Search,
        List: mod.List,
        Grid: mod.Grid,
        Edit: mod.Edit,
        Trash2: mod.Trash2,
        Calendar: mod.Calendar,
        AlertCircle: mod.AlertCircle,
        Clock: mod.Clock,
        CheckCircle: mod.CheckCircle,
        Play: mod.Play,
        MoreVertical: mod.MoreVertical,
        Trophy: mod.Trophy,
        Users: mod.Users,
        RefreshCw: mod.RefreshCw,
        Eye: mod.Eye,
      });
    });
  }, []);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/matches');
      if (!response.ok) throw new Error('Failed to fetch matches');
      const data = await response.json();
      setMatches(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this match?\n\nThis action cannot be undone.'
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/matches/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete match');
      
      setError('');
      fetchMatches();
    } catch (err: any) {
      setError('Error deleting match: ' + err.message);
      setTimeout(() => setError(''), 5000);
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      UPCOMING: 'bg-slate-500',
      LIVE: 'bg-red-500',
      COMPLETED: 'bg-green-500',
    };
    return colors[status] || 'bg-slate-500';
  };

  const getStatusIcon = (status: string): ComponentType<any> | null => {
    switch (status) {
      case 'UPCOMING':
        return icons.Clock || null;
      case 'LIVE':
        return icons.Play || null;
      case 'COMPLETED':
        return icons.CheckCircle || null;
      default:
        return icons.Clock || null;
    }
  };

  const filteredMatches = matches.filter((match) => {
    const team1Name = getTeam1Name(match);
    const team2Name = getTeam2Name(match);
    const leagueName = getLeagueName(match);
    const matchesSearch =
      team1Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team2Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leagueName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || match.status === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(filteredMatches.map(match => match.id)));
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
      `Are you sure you want to delete ${selectedItems.size} match(es)?\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    setIsBulkActionLoading(true);
    try {
      const response = await fetch('/api/matches/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedItems) }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete matches');
      }

      clearSelection();
      fetchMatches();
    } catch (err: any) {
      setError('Error deleting matches: ' + err.message);
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const allSelected = filteredMatches.length > 0 && selectedItems.size === filteredMatches.length;

  const PlusIcon = icons.Plus;
  const SearchIcon = icons.Search;
  const ListIcon = icons.List;
  const GridIcon = icons.Grid;
  const EditIcon = icons.Edit;
  const Trash2Icon = icons.Trash2;
  const CalendarIcon = icons.Calendar;
  const AlertCircleIcon = icons.AlertCircle;
  const RefreshCwIcon = icons.RefreshCw;
  const TrophyIcon = icons.Trophy;
  const UsersIcon = icons.Users;
  const EyeIcon = icons.Eye;
  const MoreVerticalIcon = icons.MoreVertical;

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
              <p className="font-semibold mb-2">Error Loading Matches</p>
              <p className="text-muted-foreground">{error}</p>
            </div>
            <Button onClick={fetchMatches} variant="default">
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
            {TrophyIcon ? <TrophyIcon size={28} /> : null}
            Matches
          </h1>
          <p className="text-muted-foreground">Manage match fixtures and results</p>
        </div>
        <Button asChild>
          <a href="/admin/matches/new" data-astro-prefetch>
            {PlusIcon ? <PlusIcon size={18} className="mr-2" /> : null}
            Create Match
          </a>
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
          <div className="relative flex-1">
            <label htmlFor="match-search" className="sr-only">Search matches</label>
            {SearchIcon ? (
              <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            ) : null}
            <Input
              id="match-search"
              type="text"
              placeholder="Search matches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              aria-label="Search matches by teams or league"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2 bg-background p-1 rounded-lg border">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('table')}
              title="Table View"
              aria-label="Switch to table view"
              aria-pressed={viewMode === 'table'}
            >
              {ListIcon ? <ListIcon size={16} /> : null}
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
              title="Grid View"
              aria-label="Switch to grid view"
              aria-pressed={viewMode === 'grid'}
            >
              {GridIcon ? <GridIcon size={16} /> : null}
            </Button>
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        {selectedItems.size > 0 && viewMode === 'table' && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="text-sm font-medium text-foreground">
                  {selectedItems.size} match(es) selected
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
      {filteredMatches.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' ? (
                  SearchIcon ? <SearchIcon size={64} /> : null
                ) : (
                  TrophyIcon ? <TrophyIcon size={64} /> : null
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  {searchTerm || statusFilter !== 'all' ? 'No matches found' : 'No matches yet'}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Create your first match to get started'}
                </p>
              </div>
              {!searchTerm && statusFilter === 'all' && (
                <Button asChild>
                  <a href="/admin/matches/new" data-astro-prefetch>
                    {PlusIcon ? <PlusIcon size={18} className="mr-2" /> : null}
                    Create Match
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        /* Table View */
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all matches"
                  />
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    {UsersIcon ? <UsersIcon size={16} /> : null}
                    Teams
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    {TrophyIcon ? <TrophyIcon size={16} /> : null}
                    League
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    {icons.CheckCircle ? <icons.CheckCircle size={16} /> : null}
                    Status
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    {CalendarIcon ? <CalendarIcon size={16} /> : null}
                    Date & Time
                  </div>
                </TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMatches.map((match) => {
                const StatusIcon = getStatusIcon(match.status);
                const hasScore = match.team1Score !== null && match.team2Score !== null;
                const team1Name = getTeam1Name(match);
                const team1Logo = getTeam1Logo(match);
                const team2Name = getTeam2Name(match);
                const team2Logo = getTeam2Logo(match);
                
                return (
                  <TableRow key={match.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedItems.has(match.id)}
                        onCheckedChange={(checked) => handleSelectItem(match.id, checked as boolean)}
                        aria-label={`Select match ${team1Name} vs ${team2Name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          {team1Logo && (
                            <img
                              src={team1Logo}
                              alt={team1Name}
                              className="w-6 h-6 object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <span className="font-semibold text-sm">{team1Name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground px-2">vs</span>
                        <div className="flex items-center gap-2">
                          {team2Logo && (
                            <img
                              src={team2Logo}
                              alt={team2Name}
                              className="w-6 h-6 object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <span className="font-semibold text-sm">{team2Name}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{getLeagueName(match)}</Badge>
                    </TableCell>
                    <TableCell>
                      {StatusIcon && (
                        <Badge
                          variant="outline"
                          className={cn(
                            'flex items-center gap-1.5 uppercase text-xs font-semibold',
                            getStatusColor(match.status),
                            'text-white border-0'
                          )}
                        >
                          <StatusIcon size={14} />
                          {match.status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {CalendarIcon ? <CalendarIcon size={14} /> : null}
                        <span>{formatDate(match.date)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {hasScore ? (
                        <span className="font-bold text-foreground">
                          {match.team1Score} - {match.team2Score}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">TBD</span>
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
                            <a href={`/admin/matches/view/${match.id}`} data-astro-prefetch>
                              {EyeIcon ? <EyeIcon size={16} className="mr-2" /> : null}
                              View Details
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <a href={`/admin/matches/${match.id}`} data-astro-prefetch>
                              {EditIcon ? <EditIcon size={16} className="mr-2" /> : null}
                              Edit
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(match.id!)}
                            className="text-destructive focus:text-destructive"
                          >
                            {Trash2Icon ? <Trash2Icon size={16} className="mr-2" /> : null}
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMatches.map((match) => {
            const StatusIcon = getStatusIcon(match.status);
            const hasScore = match.team1Score !== null && match.team2Score !== null;
            const team1Name = getTeam1Name(match);
            const team1Logo = getTeam1Logo(match);
            const team2Name = getTeam2Name(match);
            const team2Logo = getTeam2Logo(match);
            
            return (
              <Card key={match.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4 pb-4 border-b">
                    <Badge variant="secondary">{getLeagueName(match)}</Badge>
                    {StatusIcon && (
                      <Badge
                        variant="outline"
                        className={cn(
                          'flex items-center gap-1.5 uppercase text-xs font-semibold',
                          getStatusColor(match.status),
                          'text-white border-0'
                        )}
                      >
                        <StatusIcon size={14} />
                        {match.status}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-4 mb-4">
                    <div className="flex items-center gap-3">
                      {team1Logo && (
                        <img
                          src={team1Logo}
                          alt={team1Name}
                          className="w-10 h-10 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <span className="flex-1 font-semibold">{team1Name}</span>
                      {hasScore && (
                        <span className="text-xl font-bold">{match.team1Score}</span>
                      )}
                    </div>
                    <div className="text-center text-sm text-muted-foreground font-medium">vs</div>
                    <div className="flex items-center gap-3">
                      {team2Logo && (
                        <img
                          src={team2Logo}
                          alt={team2Name}
                          className="w-10 h-10 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <span className="flex-1 font-semibold">{team2Name}</span>
                      {hasScore && (
                        <span className="text-xl font-bold">{match.team2Score}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {CalendarIcon ? <CalendarIcon size={16} /> : null}
                      <span>{formatDate(match.date)}</span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          {MoreVerticalIcon ? <MoreVerticalIcon size={16} /> : null}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <a href={`/admin/matches/view/${match.id}`} data-astro-prefetch>
                            {EyeIcon ? <EyeIcon size={16} className="mr-2" /> : null}
                            View Details
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a href={`/admin/matches/${match.id}`} data-astro-prefetch>
                            {EditIcon ? <EditIcon size={16} className="mr-2" /> : null}
                            Edit
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(match.id!)}
                          className="text-destructive focus:text-destructive"
                        >
                          {Trash2Icon ? <Trash2Icon size={16} className="mr-2" /> : null}
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
