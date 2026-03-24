import { useState, useEffect, type ComponentType } from 'react';
import type { Player, Team } from '../../types';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

export default function PlayerList() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState('all-teams');
  const [positionFilter, setPositionFilter] = useState('all-positions');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [transferPlayer, setTransferPlayer] = useState<Player | null>(null);
  const [transferTeamId, setTransferTeamId] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [icons, setIcons] = useState<{
    Plus?: ComponentType<any>;
    Search?: ComponentType<any>;
    Edit?: ComponentType<any>;
    Trash2?: ComponentType<any>;
    Users?: ComponentType<any>;
    AlertCircle?: ComponentType<any>;
    RefreshCw?: ComponentType<any>;
    MoreVertical?: ComponentType<any>;
    User?: ComponentType<any>;
    Eye?: ComponentType<any>;
    CheckCircle2?: ComponentType<any>;
    CheckCircle?: ComponentType<any>;
    XCircle?: ComponentType<any>;
    ArrowRightLeft?: ComponentType<any>;
  }>({});

  useEffect(() => {
    import('lucide-react').then((mod) => {
      setIcons({
        Plus: mod.Plus,
        Search: mod.Search,
        Edit: mod.Edit,
        Trash2: mod.Trash2,
        Users: mod.Users,
        AlertCircle: mod.AlertCircle,
        RefreshCw: mod.RefreshCw,
        MoreVertical: mod.MoreVertical,
        User: mod.User,
        Eye: mod.Eye,
        CheckCircle2: mod.CheckCircle2,
        CheckCircle: mod.CheckCircle,
        XCircle: mod.XCircle,
        ArrowRightLeft: mod.ArrowRightLeft,
      });
    });
  }, []);

  useEffect(() => {
    fetchPlayers();
    fetchTeams();
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

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      if (!response.ok) throw new Error('Failed to fetch teams');
      const data = await response.json();
      setTeams(data);
    } catch (err: any) {
      console.error('Error fetching teams:', err);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this player?\n\nThis action cannot be undone.'
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/players/${id}`, { method: 'DELETE' });
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
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      ((player as any).team?.name && (player as any).team.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (player.position && player.position.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTeam =
      teamFilter === 'all-teams' ||
      (teamFilter === 'no-team' && !(player as any).team?.id) ||
      (player as any).team?.id === teamFilter;

    const matchesPosition =
      positionFilter === 'all-positions' ||
      player.position?.toUpperCase() === positionFilter.toUpperCase() ||
      (positionFilter === 'PG' && (player.position === 'PG' || player.position?.toLowerCase().includes('point guard'))) ||
      (positionFilter === 'SG' && (player.position === 'SG' || player.position?.toLowerCase().includes('shooting guard'))) ||
      (positionFilter === 'SF' && (player.position === 'SF' || player.position?.toLowerCase().includes('small forward'))) ||
      (positionFilter === 'PF' && (player.position === 'PF' || player.position?.toLowerCase().includes('power forward'))) ||
      (positionFilter === 'C' && (player.position === 'C' || player.position?.toLowerCase().includes('center')));

    return matchesSearch && matchesTeam && matchesPosition;
  });

  const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPlayers = filteredPlayers.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, teamFilter, positionFilter]);

  const uniqueTeams = Array.from(
    new Map(
      players
        .filter((p) => (p as any).team?.id)
        .map((p) => [(p as any).team.id, (p as any).team])
    ).values()
  );

  const clearSelection = () => setSelectedItems(new Set());

  const handleBulkDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedItems.size} player(s)?\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    setIsBulkActionLoading(true);
    try {
      const response = await fetch('/api/players/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedItems) }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to delete players');
      }
      clearSelection();
      fetchPlayers();
    } catch (err: any) {
      setError('Error deleting players: ' + err.message);
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const handleBulkApprove = async () => {
    setIsBulkActionLoading(true);
    try {
      const response = await fetch('/api/players/bulk-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedItems), approved: true }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to approve players');
      }
      clearSelection();
      fetchPlayers();
    } catch (err: any) {
      setError('Error approving players: ' + err.message);
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!transferPlayer) return;
    setIsTransferring(true);
    try {
      const response = await fetch(`/api/players/${transferPlayer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: transferTeamId || '' }),
      });
      if (!response.ok) throw new Error('Failed to transfer player');
      setTransferPlayer(null);
      setTransferTeamId('');
      fetchPlayers();
    } catch (err: any) {
      setError('Error transferring player: ' + err.message);
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsTransferring(false);
    }
  };

  const allSelected =
    paginatedPlayers.length > 0 && paginatedPlayers.every((p) => selectedItems.has(p.id!));

  const togglePlayerSelection = (playerId: string) => {
    setSelectedItems((prev) =>
      prev.has(playerId)
        ? new Set([...prev].filter((id) => id !== playerId))
        : new Set([...prev, playerId])
    );
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(paginatedPlayers.map((p) => p.id!)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const PlusIcon = icons.Plus;
  const SearchIcon = icons.Search;
  const EditIcon = icons.Edit;
  const Trash2Icon = icons.Trash2;
  const UsersIcon = icons.Users;
  const AlertCircleIcon = icons.AlertCircle;
  const RefreshCwIcon = icons.RefreshCw;
  const MoreVerticalIcon = icons.MoreVertical;
  const UserIcon = icons.User;
  const EyeIcon = icons.Eye;
  const CheckCircle2Icon = icons.CheckCircle2;
  const CheckCircleIcon = icons.CheckCircle;
  const XCircleIcon = icons.XCircle;
  const ArrowRightLeftIcon = icons.ArrowRightLeft;

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
            Add New Player
          </a>
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4">
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
          <Select value={teamFilter} onValueChange={setTeamFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-teams">All Teams</SelectItem>
              {uniqueTeams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
              <SelectItem value="no-team">No Team</SelectItem>
            </SelectContent>
          </Select>
          <Select value={positionFilter} onValueChange={setPositionFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-positions">All Positions</SelectItem>
              <SelectItem value="PF">Power Forward</SelectItem>
              <SelectItem value="PG">Point Guard</SelectItem>
              <SelectItem value="SF">Small Forward</SelectItem>
              <SelectItem value="SG">Shooting Guard</SelectItem>
              <SelectItem value="C">Center</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions Toolbar */}
        {selectedItems.size > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="text-sm font-medium text-foreground">
                  {selectedItems.size} player(s) selected
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleBulkApprove}
                    disabled={isBulkActionLoading}
                  >
                    {CheckCircleIcon ? <CheckCircleIcon size={16} className="mr-2" /> : null}
                    Approve
                  </Button>
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
      {filteredPlayers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="text-muted-foreground">
                {searchTerm || teamFilter !== 'all-teams' || positionFilter !== 'all-positions' ? (
                  SearchIcon ? <SearchIcon size={64} /> : null
                ) : (
                  UsersIcon ? <UsersIcon size={64} /> : null
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  {searchTerm || teamFilter !== 'all-teams' || positionFilter !== 'all-positions'
                    ? 'No players found'
                    : 'No players yet'}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm || teamFilter !== 'all-teams' || positionFilter !== 'all-positions'
                    ? 'Try adjusting your search or filters'
                    : 'Create your first player to get started'}
                </p>
              </div>
              {!searchTerm && teamFilter === 'all-teams' && positionFilter === 'all-positions' && (
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
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all players"
                  />
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    {UserIcon ? <UserIcon size={16} /> : null}
                    Player
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    {UsersIcon ? <UsersIcon size={16} /> : null}
                    Team
                  </div>
                </TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Jersey</TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    {CheckCircle2Icon ? <CheckCircle2Icon size={16} /> : null}
                    Approved
                  </div>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPlayers.map((player) => (
                <TableRow key={player.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedItems.has(player.id!)}
                      onCheckedChange={() => togglePlayerSelection(player.id!)}
                      aria-label={`Select ${getPlayerName(player)}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        src={player.image || '/images/default-player.png'}
                        alt={getPlayerName(player)}
                        className="w-10 h-10 rounded-full border-2 border-border object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/default-player.png';
                        }}
                      />
                      <div>
                        <p className="font-semibold text-foreground">{getPlayerName(player)}</p>
                        {player.bio && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {player.bio.substring(0, 30)}...
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {(player as any).team?.name ? (
                      <span className="text-sm">{(player as any).team.name}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {player.position ? (
                      <Badge variant="outline" className="border-purple-300 text-purple-700 bg-purple-50">
                        {player.position}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {player.jerseyNumber ? (
                      <span className="text-lg font-bold text-foreground">{player.jerseyNumber}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {(player as any).approved ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        {CheckCircle2Icon ? <CheckCircle2Icon size={12} className="mr-1" /> : null}
                        Approved
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                        {XCircleIcon ? <XCircleIcon size={12} className="mr-1" /> : null}
                        Pending
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
                          <a href={`/admin/players/view/${player.id}`} data-astro-prefetch>
                            {EyeIcon ? <EyeIcon size={16} className="mr-2" /> : null}
                            View Player
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a href={`/admin/players/${player.id}`} data-astro-prefetch>
                            {EditIcon ? <EditIcon size={16} className="mr-2" /> : null}
                            Edit Player
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setTransferPlayer(player);
                            setTransferTeamId((player as any).team?.id || '');
                          }}
                        >
                          {ArrowRightLeftIcon ? <ArrowRightLeftIcon size={16} className="mr-2" /> : null}
                          Transfer Player
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(player.id!)}
                          className="text-destructive focus:text-destructive"
                        >
                          {Trash2Icon ? <Trash2Icon size={16} className="mr-2" /> : null}
                          Delete Player
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

      {/* Pagination */}
      {filteredPlayers.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing{' '}
            <span className="font-semibold">{startIndex + 1}–{Math.min(endIndex, filteredPlayers.length)}</span>{' '}
            of <span className="font-semibold">{filteredPlayers.length}</span> players
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Transfer Player Dialog */}
      <Dialog
        open={!!transferPlayer}
        onOpenChange={(open) => {
          if (!open) {
            setTransferPlayer(null);
            setTransferTeamId('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Transfer Player</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Player</p>
              <p className="font-semibold text-foreground">
                {transferPlayer ? getPlayerName(transferPlayer) : ''}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current Team</p>
              <p className="font-semibold text-foreground">
                {(transferPlayer as any)?.team?.name || 'No team'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Transfer to</p>
              <Select
                value={transferTeamId || '__none'}
                onValueChange={(v) => setTransferTeamId(v === '__none' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">No team</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id!}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTransferPlayer(null);
                setTransferTeamId('');
              }}
              disabled={isTransferring}
            >
              Cancel
            </Button>
            <Button onClick={handleTransfer} disabled={isTransferring}>
              {isTransferring ? 'Transferring...' : 'Confirm Transfer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
