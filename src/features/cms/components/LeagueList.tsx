import { useState, useEffect, type ComponentType } from 'react';
import type { LeagueWithMatchCount } from '../types';
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

export default function LeagueList() {
  const [leagues, setLeagues] = useState<LeagueWithMatchCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [icons, setIcons] = useState<{
    Plus?: ComponentType<any>;
    Search?: ComponentType<any>;
    Edit?: ComponentType<any>;
    Trash2?: ComponentType<any>;
    Trophy?: ComponentType<any>;
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
        Trophy: mod.Trophy,
        AlertCircle: mod.AlertCircle,
        RefreshCw: mod.RefreshCw,
        MoreVertical: mod.MoreVertical,
        CheckCircle: mod.CheckCircle,
        XCircle: mod.XCircle,
      });
    });
  }, []);

  useEffect(() => {
    fetchLeagues();
  }, []);

  const fetchLeagues = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/leagues');
      if (!response.ok) throw new Error('Failed to fetch leagues');
      const data = await response.json();
      setLeagues(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load leagues');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this league?\n\nThis action cannot be undone. Matches associated with this league will have their league reference removed.'
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/leagues/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete league');
      
      setError('');
      fetchLeagues();
    } catch (err: any) {
      setError('Error deleting league: ' + err.message);
      setTimeout(() => setError(''), 5000);
    }
  };

  const filteredLeagues = leagues.filter(
    (league) =>
      league.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (league.description && league.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const PlusIcon = icons.Plus;
  const SearchIcon = icons.Search;
  const EditIcon = icons.Edit;
  const Trash2Icon = icons.Trash2;
  const TrophyIcon = icons.Trophy;
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
              <p className="font-semibold mb-2">Error Loading Leagues</p>
              <p className="text-muted-foreground">{error}</p>
            </div>
            <Button onClick={fetchLeagues} variant="default">
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
            Leagues
          </h1>
          <p className="text-muted-foreground">Manage leagues and tournaments</p>
        </div>
        <Button asChild>
          <a href="/admin/leagues/new" data-astro-prefetch>
            {PlusIcon ? <PlusIcon size={18} className="mr-2" /> : null}
            Create League
          </a>
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        <div className="relative flex-1">
          <label htmlFor="league-search" className="sr-only">Search leagues</label>
          {SearchIcon ? (
            <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          ) : null}
          <Input
            id="league-search"
            type="text"
            placeholder="Search leagues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            aria-label="Search leagues by name, description, or season"
          />
        </div>
      </div>

      {/* Empty State */}
      {filteredLeagues.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="text-muted-foreground">
                {searchTerm ? (
                  SearchIcon ? <SearchIcon size={64} /> : null
                ) : (
                  TrophyIcon ? <TrophyIcon size={64} /> : null
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  {searchTerm ? 'No leagues found' : 'No leagues yet'}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Try a different search term' : 'Create your first league to get started'}
                </p>
              </div>
              {!searchTerm && (
                <Button asChild>
                  <a href="/admin/leagues/new" data-astro-prefetch>
                    {PlusIcon ? <PlusIcon size={18} className="mr-2" /> : null}
                    Create League
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
                <TableHead>
                  <div className="flex items-center gap-2">
                    {TrophyIcon ? <TrophyIcon size={16} /> : null}
                    League
                  </div>
                </TableHead>
                <TableHead>Seasons</TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    {CheckCircleIcon ? <CheckCircleIcon size={16} /> : null}
                    Status
                  </div>
                </TableHead>
                <TableHead>Matches</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeagues.map((league) => (
                <TableRow key={league.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        {league.logo && (
                          <img
                            src={league.logo}
                            alt={league.name}
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        <strong className="font-semibold text-foreground">{league.name}</strong>
                      </div>
                      {league.description && (
                        <span className="text-sm text-muted-foreground line-clamp-1">
                          {league.description.substring(0, 100)}
                          {league.description.length > 100 ? '...' : ''}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{league._count.seasons}</span>
                  </TableCell>
                  <TableCell>
                    {league.active ? (
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
                    <span className="text-sm">{league._count.matches}</span>
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
                          <a href={`/admin/leagues/${league.id}`} data-astro-prefetch>
                            {EditIcon ? <EditIcon size={16} className="mr-2" /> : null}
                            Edit
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(league.id!)}
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
