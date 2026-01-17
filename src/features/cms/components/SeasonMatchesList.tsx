import { useState, useEffect, type ComponentType } from 'react';
import type { MatchWithTeamsAndLeagueAndSeason } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { ArrowLeft, AlertCircle, Plus, Edit, Trash2, MoreVertical, CheckCircle, XCircle, Calendar, Clock, Trophy, Users, Eye, RefreshCw, Table2, Network } from 'lucide-react';
import { getTeam1Name, getTeam1Logo, getTeam2Name, getTeam2Logo } from '../../matches/lib/team-helpers';
import { getLeagueName } from '../../matches/lib/league-helpers';
import TournamentBracketView from './TournamentBracketView';

interface SeasonMatchesListProps {
  seasonId: string;
}

type ViewMode = 'table' | 'bracket';

export default function SeasonMatchesList({ seasonId }: SeasonMatchesListProps) {
  const [matches, setMatches] = useState<MatchWithTeamsAndLeagueAndSeason[]>([]);
  const [season, setSeason] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('season-matches-view-mode');
      return (saved === 'bracket' || saved === 'table') ? saved : 'table';
    }
    return 'table';
  });

  useEffect(() => {
    fetchSeason();
    fetchMatches();
  }, [seasonId]);

  const fetchSeason = async () => {
    try {
      const response = await fetch(`/api/seasons/${seasonId}`);
      if (!response.ok) throw new Error('Failed to fetch season');
      const data = await response.json();
      setSeason(data);
    } catch (err: any) {
      console.error('Error fetching season:', err);
    }
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('season-matches-view-mode', mode);
    }
  };

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/matches?seasonId=${seasonId}`);
      if (!response.ok) throw new Error('Failed to fetch matches');
      const data = await response.json();
      
      // Remove duplicates based on match ID
      const uniqueMatches = Array.from(
        new Map(data.map((match: MatchWithTeamsAndLeagueAndSeason) => [match.id, match])).values()
      );
      
      setMatches(uniqueMatches);
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
    });
  };

  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Badge variant="outline" className="bg-green-500 text-white border-0">
            <CheckCircle size={14} className="mr-1" />
            Completed
          </Badge>
        );
      case 'LIVE':
        return (
          <Badge variant="outline" className="bg-red-500 text-white border-0">
            <Clock size={14} className="mr-1" />
            Live
          </Badge>
        );
      case 'UPCOMING':
        return (
          <Badge variant="outline" className="bg-blue-500 text-white border-0">
            <Calendar size={14} className="mr-1" />
            Upcoming
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-slate-500 text-white border-0">
            {status}
          </Badge>
        );
    }
  };

  const filteredMatches = matches.filter((match) => {
    const team1Name = getTeam1Name(match)?.toLowerCase() || '';
    const team2Name = getTeam2Name(match)?.toLowerCase() || '';
    const leagueName = getLeagueName(match)?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    return team1Name.includes(search) || team2Name.includes(search) || leagueName.includes(search);
  });

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
          <h1 className="text-3xl font-heading font-semibold mb-2 text-foreground flex items-center gap-2">
            <Trophy className="h-7 w-7" />
            Season Matches
          </h1>
          <p className="text-muted-foreground">
            {season ? `Matches for ${season.name}` : 'Manage matches for this season'}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 border rounded-md p-1">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('table')}
              className="gap-2"
            >
              <Table2 className="h-4 w-4" />
              Table
            </Button>
            <Button
              variant={viewMode === 'bracket' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('bracket')}
              className="gap-2"
            >
              <Network className="h-4 w-4" />
              Bracket
            </Button>
          </div>
          <Button asChild>
            <a href={`/admin/matches/new?seasonId=${seasonId}`} data-astro-prefetch>
              <Plus className="mr-2 h-4 w-4" />
              Create Match
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href={season?.leagueId ? `/admin/leagues/${season.leagueId}/view` : '/admin/leagues'} data-astro-prefetch>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to League
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

      {/* View Mode Content */}
      {viewMode === 'bracket' ? (
        <TournamentBracketView seasonId={seasonId} leagueId={season?.leagueId} />
      ) : (
        <>
          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search matches by team or league..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          {/* Matches Table */}
      {filteredMatches.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <Trophy className="h-16 w-16 text-muted-foreground" />
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  {searchTerm ? 'No matches found' : 'No matches yet'}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Try a different search term' : 'Create your first match for this season'}
                </p>
              </div>
              {!searchTerm && (
                <Button asChild>
                  <a href={`/admin/matches/new?seasonId=${seasonId}`} data-astro-prefetch>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Match
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Matches ({filteredMatches.length})</CardTitle>
            <CardDescription>All matches for this season</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <Users size={16} />
                      Teams
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      Date & Time
                    </div>
                  </TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} />
                      Status
                    </div>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMatches.map((match) => {
                  const team1Name = getTeam1Name(match);
                  const team2Name = getTeam2Name(match);
                  const team1Logo = getTeam1Logo(match);
                  const team2Logo = getTeam2Logo(match);

                  return (
                    <TableRow key={match.id}>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            {team1Logo && (
                              <img
                                src={team1Logo}
                                alt={team1Name || 'Team 1'}
                                className="w-6 h-6 object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            )}
                            <span className="font-medium">{team1Name || 'Team 1'}</span>
                            {match.team1Score !== null && (
                              <span className="font-bold ml-auto">{match.team1Score}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground text-xs pl-8">
                            vs
                          </div>
                          <div className="flex items-center gap-2">
                            {team2Logo && (
                              <img
                                src={team2Logo}
                                alt={team2Name || 'Team 2'}
                                className="w-6 h-6 object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            )}
                            <span className="font-medium">{team2Name || 'Team 2'}</span>
                            {match.team2Score !== null && (
                              <span className="font-bold ml-auto">{match.team2Score}</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm">
                          <span>{formatDate(match.date)}</span>
                          <span className="text-muted-foreground">{formatTime(match.date)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {match.team1Score !== null && match.team2Score !== null ? (
                          <div className="font-semibold">
                            {match.team1Score} - {match.team2Score}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(match.status)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9">
                              <MoreVertical size={18} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <a href={`/admin/matches/view/${match.id}`} data-astro-prefetch>
                                <Eye size={16} className="mr-2" />
                                View Details
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a href={`/admin/matches/${match.id}`} data-astro-prefetch>
                                <Edit size={16} className="mr-2" />
                                Edit
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(match.id!)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 size={16} className="mr-2" />
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
          </CardContent>
        </Card>
      )}
        </>
      )}
    </div>
  );
}
