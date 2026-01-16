import { useState, useEffect, type ComponentType } from 'react';
import type { Player, Team } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { tekoFont } from '../lib/ui-helpers';

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
    Filter?: ComponentType<any>;
    Eye?: ComponentType<any>;
    CheckCircle2?: ComponentType<any>;
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
        Users: mod.Users,
        AlertCircle: mod.AlertCircle,
        RefreshCw: mod.RefreshCw,
        MoreVertical: mod.MoreVertical,
        User: mod.User,
        Filter: mod.Filter,
        Eye: mod.Eye,
        CheckCircle2: mod.CheckCircle2,
        CheckCircle: mod.CheckCircle,
        XCircle: mod.XCircle,
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
    const matchesSearch = 
      fullName.includes(searchTerm.toLowerCase()) ||
      ((player as any).team?.name && (player as any).team.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (player.position && player.position.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTeam = teamFilter === 'all-teams' || 
      (teamFilter === 'no-team' && !(player as any).team?.id) ||
      ((player as any).team?.id === teamFilter);
    
    const matchesPosition = positionFilter === 'all-positions' ||
      player.position?.toUpperCase() === positionFilter.toUpperCase() ||
      (positionFilter === 'PG' && (player.position === 'PG' || player.position?.toLowerCase().includes('point guard'))) ||
      (positionFilter === 'SG' && (player.position === 'SG' || player.position?.toLowerCase().includes('shooting guard'))) ||
      (positionFilter === 'SF' && (player.position === 'SF' || player.position?.toLowerCase().includes('small forward'))) ||
      (positionFilter === 'PF' && (player.position === 'PF' || player.position?.toLowerCase().includes('power forward'))) ||
      (positionFilter === 'C' && (player.position === 'C' || player.position?.toLowerCase().includes('center')));
    
    return matchesSearch && matchesTeam && matchesPosition;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPlayers = filteredPlayers.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, teamFilter, positionFilter]);

  // Get unique teams from players for filter dropdown
  const uniqueTeams = Array.from(
    new Map(
      players
        .filter(p => (p as any).team?.id)
        .map(p => [(p as any).team.id, (p as any).team])
    ).values()
  );


  const clearSelection = () => {
    setSelectedItems(new Set());
  };

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
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete players');
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
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve players');
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

  const allSelected = paginatedPlayers.length > 0 && paginatedPlayers.every(p => selectedItems.has(p.id!));

  const PlusIcon = icons.Plus;
  const SearchIcon = icons.Search;
  const EditIcon = icons.Edit;
  const Trash2Icon = icons.Trash2;
  const UsersIcon = icons.Users;
  const AlertCircleIcon = icons.AlertCircle;
  const RefreshCwIcon = icons.RefreshCw;
  const MoreVerticalIcon = icons.MoreVertical;
  const UserIcon = icons.User;
  const FilterIcon = icons.Filter;
  const EyeIcon = icons.Eye;
  const CheckCircle2Icon = icons.CheckCircle2;
  const CheckCircleIcon = icons.CheckCircle;
  const XCircleIcon = icons.XCircle;

  const togglePlayerSelection = (playerId: string) => {
    setSelectedItems(prev =>
      prev.has(playerId)
        ? new Set([...prev].filter(id => id !== playerId))
        : new Set([...prev, playerId])
    );
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(paginatedPlayers.map(p => p.id!)));
    }
  };

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
        <div className="p-6">
          <div className="flex flex-col items-center text-center gap-4">
            {AlertCircleIcon ? <AlertCircleIcon className="w-6 h-6 text-destructive" /> : null}
            <div>
              <p className="font-semibold mb-2">Error Loading Players</p>
              <p className="text-slate-500">{error}</p>
            </div>
            <Button onClick={fetchPlayers} variant="default">
              {RefreshCwIcon ? <RefreshCwIcon className="w-4 h-4 mr-2" /> : null}
              Try Again
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-0">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 -mx-8 mb-6 z-40 shadow-sm">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 flex items-center gap-3" style={tekoFont}>
                {UsersIcon ? <UsersIcon className="w-8 h-8 text-red-500" /> : null}
                PLAYERS
              </h2>
              <p className="text-sm text-slate-500 mt-1">Manage player profiles and information</p>
            </div>
            <Button asChild className="bg-red-500 hover:bg-red-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all">
              <a href="/admin/players/new" data-astro-prefetch>
                {PlusIcon ? <PlusIcon className="w-4 h-4 mr-2" /> : null}
                <span style={tekoFont} className="text-lg">Add New Player</span>
              </a>
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              {SearchIcon ? (
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              ) : null}
              <Input
                type="text"
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-slate-300 focus:border-yellow-400 focus:ring-yellow-400"
              />
            </div>
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger className="w-48 border-slate-300 focus:border-yellow-400 focus:ring-yellow-400">
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
              <SelectTrigger className="w-48 border-slate-300 focus:border-yellow-400 focus:ring-yellow-400">
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
            <Button variant="outline" className="border-slate-300 hover:bg-slate-50">
              {FilterIcon ? <FilterIcon className="w-4 h-4 mr-2" /> : null}
              More Filters
            </Button>
          </div>
        </div>
      </header>

      {/* Bulk Actions Toolbar */}
      {selectedItems.size > 0 && (
        <div className="bg-primary/5 border-primary/20 border-b px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-foreground">
              {selectedItems.size} player(s) selected
            </div>
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={handleBulkApprove}
                disabled={isBulkActionLoading}
              >
                {CheckCircleIcon ? <CheckCircleIcon className="w-4 h-4 mr-2" /> : null}
                Approve
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={isBulkActionLoading}
              >
                {Trash2Icon ? <Trash2Icon className="w-4 h-4 mr-2" /> : null}
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
        </div>
      )}

      {/* Players Table */}
      <div className="px-8">

        {filteredPlayers.length === 0 ? (
          <Card className="border-dashed">
            <div className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="text-slate-400">
                  {searchTerm || teamFilter !== 'all-teams' || positionFilter !== 'all-positions' ? (
                    SearchIcon ? <SearchIcon className="w-16 h-16" /> : null
                  ) : (
                    UsersIcon ? <UsersIcon className="w-16 h-16" /> : null
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-slate-900">
                    {searchTerm || teamFilter !== 'all-teams' || positionFilter !== 'all-positions' 
                      ? 'No players found' 
                      : 'No players yet'}
                  </h3>
                  <p className="text-slate-500">
                    {searchTerm || teamFilter !== 'all-teams' || positionFilter !== 'all-positions'
                      ? 'Try adjusting your search or filters'
                      : 'Create your first player to get started'}
                  </p>
                </div>
                {!searchTerm && teamFilter === 'all-teams' && positionFilter === 'all-positions' && (
                  <Button asChild className="bg-red-500 hover:bg-red-600 text-white">
                    <a href="/admin/players/new" data-astro-prefetch>
                      {PlusIcon ? <PlusIcon className="w-4 h-4 mr-2" /> : null}
                      Create Player
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ) : (
          <Card className="shadow-lg border-slate-200 overflow-hidden">
            {/* Table Header */}
            <div className="bg-yellow-400 px-6 py-4">
              <div className="grid grid-cols-12 gap-4 items-center font-semibold text-slate-900">
                <div className="col-span-1 flex items-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-900 text-slate-900 focus:ring-yellow-500"
                  />
                </div>
                <div className="col-span-3 flex items-center gap-2">
                  {UserIcon ? <UserIcon className="w-4 h-4" /> : null}
                  <span style={tekoFont} className="text-lg">PLAYER</span>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  {UsersIcon ? <UsersIcon className="w-4 h-4" /> : null}
                  <span style={tekoFont} className="text-lg">TEAM</span>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span style={tekoFont} className="text-lg">POSITION</span>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span style={tekoFont} className="text-lg">JERSEY</span>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  {CheckCircle2Icon ? <CheckCircle2Icon className="w-4 h-4" /> : null}
                  <span style={tekoFont} className="text-lg">APPROVED</span>
                </div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-slate-200">
              {paginatedPlayers.map((player, index) => (
                <div
                  key={player.id}
                  className={`px-6 py-4 hover:bg-slate-50 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                  }`}
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-1">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(player.id!)}
                        onChange={() => togglePlayerSelection(player.id!)}
                        className="w-4 h-4 rounded border-slate-300 text-yellow-400 focus:ring-yellow-400"
                      />
                    </div>
                    <div className="col-span-3 flex items-center gap-3">
                      {player.image ? (
                        <img
                          src={player.image}
                          alt={getPlayerName(player)}
                          className="w-12 h-12 rounded-full border-2 border-slate-200 object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${getPlayerName(player)}`;
                          }}
                        />
                      ) : (
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${getPlayerName(player)}`}
                          alt={getPlayerName(player)}
                          className="w-12 h-12 rounded-full border-2 border-slate-200"
                        />
                      )}
                      <div>
                        <p className="font-semibold text-slate-900">{getPlayerName(player)}</p>
                        {player.bio && (
                          <p className="text-xs text-slate-500 truncate max-w-[200px]">
                            {player.bio.substring(0, 30)}...
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2">
                      {(player as any).team?.name ? (
                        <div className="flex items-center gap-2 text-slate-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span className="text-sm">{(player as any).team.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </div>
                    <div className="col-span-2">
                      {player.position ? (
                        <Badge variant="outline" className="border-purple-300 text-purple-700 bg-purple-50">
                          {player.position}
                        </Badge>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </div>
                    <div className="col-span-2">
                      {player.jerseyNumber ? (
                        <span className="text-lg font-bold text-slate-900" style={tekoFont}>
                          {player.jerseyNumber}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </div>
                    <div className="col-span-2 flex items-center justify-between">
                      {(player as any).approved ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                          {CheckCircle2Icon ? <CheckCircle2Icon className="w-3 h-3 mr-1" /> : null}
                          Approved
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                          {XCircleIcon ? <XCircleIcon className="w-3 h-3 mr-1" /> : null}
                          Pending
                        </Badge>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100">
                            {MoreVerticalIcon ? <MoreVerticalIcon className="w-4 h-4" /> : null}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem className="cursor-pointer" asChild>
                            <a href={`/admin/players/view/${player.id}`} data-astro-prefetch>
                              {EyeIcon ? <EyeIcon className="w-4 h-4 mr-2" /> : null}
                              View Player
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer" asChild>
                            <a href={`/admin/players/${player.id}`} data-astro-prefetch>
                              {EditIcon ? <EditIcon className="w-4 h-4 mr-2" /> : null}
                              Edit Player
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="cursor-pointer text-red-600"
                            onClick={() => handleDelete(player.id!)}
                          >
                            {Trash2Icon ? <Trash2Icon className="w-4 h-4 mr-2" /> : null}
                            Delete Player
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Pagination */}
        {filteredPlayers.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Showing <span className="font-semibold">{startIndex + 1}-{Math.min(endIndex, filteredPlayers.length)}</span> of <span className="font-semibold">{filteredPlayers.length}</span> players
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="border-slate-300"
              >
                Previous
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
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
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={
                      currentPage === pageNum
                        ? 'border-yellow-400 bg-yellow-400 text-slate-900 hover:bg-yellow-500'
                        : 'border-slate-300 hover:bg-slate-50'
                    }
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="border-slate-300"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
