import { useState, useEffect, type ComponentType } from 'react';
import type { Player } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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

export default function PlayerList() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [icons, setIcons] = useState<{
    Plus?: ComponentType<any>;
    Search?: ComponentType<any>;
    List?: ComponentType<any>;
    Grid?: ComponentType<any>;
    Edit?: ComponentType<any>;
    Trash2?: ComponentType<any>;
    Users?: ComponentType<any>;
    AlertCircle?: ComponentType<any>;
    RefreshCw?: ComponentType<any>;
    MoreVertical?: ComponentType<any>;
    User?: ComponentType<any>;
    Shield?: ComponentType<any>;
    MapPin?: ComponentType<any>;
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
        Users: mod.Users,
        AlertCircle: mod.AlertCircle,
        RefreshCw: mod.RefreshCw,
        MoreVertical: mod.MoreVertical,
        User: mod.User,
        Shield: mod.Shield,
        MapPin: mod.MapPin,
      });
    });
  }, []);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/players');
      if (!response.ok) throw new Error('Failed to fetch players');
      const data = await response.json();
      setPlayers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this player?\n\nThis action cannot be undone.'
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/players/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete player');
      
      setError('');
      fetchPlayers();
    } catch (err: any) {
      setError('Error deleting player: ' + err.message);
      setTimeout(() => setError(''), 5000);
    }
  };

  const getPlayerName = (player: Player): string => {
    const firstName = (player as any).firstName || '';
    const lastName = (player as any).lastName || '';
    return `${firstName} ${lastName}`.trim() || 'Unnamed Player';
  };

  const filteredPlayers = players.filter((player) => {
    const fullName = getPlayerName(player).toLowerCase();
    return (
      fullName.includes(searchTerm.toLowerCase()) ||
      ((player as any).team?.name && (player as any).team.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (player.position && player.position.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const PlusIcon = icons.Plus;
  const SearchIcon = icons.Search;
  const ListIcon = icons.List;
  const GridIcon = icons.Grid;
  const EditIcon = icons.Edit;
  const Trash2Icon = icons.Trash2;
  const UsersIcon = icons.Users;
  const AlertCircleIcon = icons.AlertCircle;
  const RefreshCwIcon = icons.RefreshCw;
  const MoreVerticalIcon = icons.MoreVertical;
  const UserIcon = icons.User;
  const ShieldIcon = icons.Shield;
  const MapPinIcon = icons.MapPin;

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
              <p className="font-semibold mb-2">Error Loading Players</p>
              <p className="text-muted-foreground">{error}</p>
            </div>
            <Button onClick={fetchPlayers} variant="default">
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
            {UsersIcon ? <UsersIcon size={28} /> : null}
            Players
          </h1>
          <p className="text-muted-foreground">Manage player profiles and information</p>
        </div>
        <Button asChild>
          <a href="/admin/players/new" data-astro-prefetch>
            {PlusIcon ? <PlusIcon size={18} className="mr-2" /> : null}
            Create Player
          </a>
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        <div className="relative flex-1">
          <label htmlFor="player-search" className="sr-only">Search players</label>
          {SearchIcon ? (
            <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          ) : null}
          <Input
            id="player-search"
            type="text"
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            aria-label="Search players by name, team, or position"
          />
        </div>
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

      {/* Empty State */}
      {filteredPlayers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="text-muted-foreground">
                {searchTerm ? (
                  SearchIcon ? <SearchIcon size={64} /> : null
                ) : (
                  UsersIcon ? <UsersIcon size={64} /> : null
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  {searchTerm ? 'No players found' : 'No players yet'}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Try a different search term' : 'Create your first player to get started'}
                </p>
              </div>
              {!searchTerm && (
                <Button asChild>
                  <a href="/admin/players/new" data-astro-prefetch>
                    {PlusIcon ? <PlusIcon size={18} className="mr-2" /> : null}
                    Create Player
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
                <TableHead>
                  <div className="flex items-center gap-2">
                    {UserIcon ? <UserIcon size={16} /> : null}
                    Player
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    {ShieldIcon ? <ShieldIcon size={16} /> : null}
                    Team
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    {MapPinIcon ? <MapPinIcon size={16} /> : null}
                    Position
                  </div>
                </TableHead>
                <TableHead>Jersey #</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlayers.map((player) => (
                <TableRow key={player.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {player.image ? (
                        <img
                          src={player.image}
                          alt={getPlayerName(player)}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/placeholder-player.jpg';
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          {UserIcon ? <UserIcon size={20} className="text-muted-foreground" /> : null}
                        </div>
                      )}
                      <div className="flex flex-col gap-1">
                        <strong className="font-semibold text-foreground">{getPlayerName(player)}</strong>
                        {player.bio && (
                          <small className="text-xs text-muted-foreground line-clamp-1">
                            {player.bio.substring(0, 50)}...
                          </small>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {(player as any).team?.name ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {ShieldIcon ? <ShieldIcon size={14} /> : null}
                        <span>{(player as any).team.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {player.position || <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell>
                    {player.jerseyNumber || <span className="text-muted-foreground">-</span>}
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
                          <a href={`/admin/players/${player.id}`} data-astro-prefetch>
                            {EditIcon ? <EditIcon size={16} className="mr-2" /> : null}
                            Edit
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(player.id!)}
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
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlayers.map((player) => (
            <Card key={player.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative w-full h-64 bg-muted overflow-hidden">
                {player.image ? (
                  <img
                    src={player.image}
                    alt={getPlayerName(player)}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/placeholder-player.jpg';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {UserIcon ? <UserIcon size={64} className="text-muted-foreground" /> : null}
                  </div>
                )}
                {player.jerseyNumber && (
                  <div className="absolute top-4 right-4 bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg">
                    {player.jerseyNumber}
                  </div>
                )}
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-3 text-foreground">{getPlayerName(player)}</h3>
                <div className="space-y-2 mb-4">
                  {(player as any).team?.name && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {ShieldIcon ? <ShieldIcon size={16} /> : null}
                      <span>{(player as any).team.name}</span>
                    </div>
                  )}
                  {player.position && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {MapPinIcon ? <MapPinIcon size={16} /> : null}
                      <span>{player.position}</span>
                    </div>
                  )}
                </div>
                {player.bio && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{player.bio.substring(0, 100)}...</p>
                )}
                <div className="flex justify-end pt-4 border-t">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        {MoreVerticalIcon ? <MoreVerticalIcon size={16} /> : null}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <a href={`/admin/players/${player.id}`} data-astro-prefetch>
                          {EditIcon ? <EditIcon size={16} className="mr-2" /> : null}
                          Edit
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(player.id!)}
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
          ))}
        </div>
      )}
    </div>
  );
}
