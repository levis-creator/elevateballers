import { useState, useEffect } from 'react';
import type { TeamWithPlayers, TeamStaffWithStaff, StaffRole } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
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
import { ArrowLeft, Edit, Users, Shield, User, FileText, Plus, Briefcase, Mail, Phone, X, Info, AlertCircle, Loader2, CheckCircle, XCircle, Trophy, Calendar, Clock } from 'lucide-react';
import { calculateTeamMatchStats, formatFieldGoalPercentage } from '../lib/matchStats';

interface TeamViewProps {
  teamId: string;
}

export default function TeamView({ teamId }: TeamViewProps) {
  const [team, setTeam] = useState<TeamWithPlayers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [players, setPlayers] = useState<any[]>([]);
  const [staff, setStaff] = useState<TeamStaffWithStaff[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [availableStaff, setAvailableStaff] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedRole, setSelectedRole] = useState<StaffRole>('COACH');
  const [addStaffError, setAddStaffError] = useState('');
  const [addingStaff, setAddingStaff] = useState(false);
  const [removeStaffId, setRemoveStaffId] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [matchStats, setMatchStats] = useState<Record<string, any>>({});
  const [loadingMatches, setLoadingMatches] = useState(true);

  useEffect(() => {
    fetchTeam();
  }, [teamId]);

  useEffect(() => {
    if (team) {
      fetchTeamStaff();
      fetchAvailableStaff();
      fetchTeamMatches();
    }
  }, [team?.id]);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/teams/${teamId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch team');
      }
      const data = await response.json();
      setTeam(data);
      setPlayers(data.players || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load team');
    } finally {
      setLoading(false);
    }
  };

  // Scroll to staff section if hash is present
  useEffect(() => {
    if (window.location.hash === '#staff') {
      setTimeout(() => {
        const staffSection = document.querySelector('#staff');
        if (staffSection) {
          staffSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setShowAddStaffModal(true);
        }
      }, 100);
    }
  }, []);

  const fetchTeamStaff = async () => {
    if (!team) return;
    try {
      setLoadingStaff(true);
      const response = await fetch(`/api/teams/${team.id}/staff`);
      if (response.ok) {
        const data = await response.json();
        setStaff(data);
      }
    } catch (err) {
      console.error('Error fetching team staff:', err);
    } finally {
      setLoadingStaff(false);
    }
  };

  const fetchAvailableStaff = async () => {
    try {
      const response = await fetch('/api/staff');
      if (response.ok) {
        const data = await response.json();
        setAvailableStaff(data);
      }
    } catch (err) {
      console.error('Error fetching available staff:', err);
    }
  };

  const handleAddStaff = async () => {
    if (!team) return;
    if (!selectedStaffId || !selectedRole) {
      setAddStaffError('Please select a staff member and role');
      return;
    }

    setAddingStaff(true);
    setAddStaffError('');

    try {
      const response = await fetch(`/api/teams/${team.id}/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          staffId: selectedStaffId,
          role: selectedRole,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to add staff' }));
        throw new Error(errorData.error || 'Failed to add staff');
      }
      
      setShowAddStaffModal(false);
      setSelectedStaffId('');
      setSelectedRole('COACH');
      setAddStaffError('');
      fetchTeamStaff();
    } catch (err: any) {
      console.error('Error adding staff:', err);
      setAddStaffError(err.message || 'Failed to add staff. Please try again.');
    } finally {
      setAddingStaff(false);
    }
  };

  const handleRemoveStaff = async (teamStaffId: string) => {
    if (!team) return;
    try {
      const response = await fetch(`/api/teams/${team.id}/staff?teamStaffId=${teamStaffId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove staff');
      
      fetchTeamStaff();
      setRemoveStaffId(null);
    } catch (err: any) {
      alert('Error removing staff: ' + err.message);
    }
  };

  const handleApproveTeam = async (approved: boolean) => {
    if (!team) return;
    setApproving(true);
    try {
      const response = await fetch(`/api/teams/${team.id}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update approval status' }));
        throw new Error(errorData.error || 'Failed to update approval status');
      }

      const updatedTeam = await response.json();
      setTeam({ ...team, approved: updatedTeam.approved });
    } catch (err: any) {
      alert('Error updating approval status: ' + err.message);
    } finally {
      setApproving(false);
    }
  };

  const getRoleLabel = (role: StaffRole | string): string => {
    const labels: Record<string, string> = {
      'COACH': 'Coach',
      'ASSISTANT_COACH': 'Assistant Coach',
      'MANAGER': 'Manager',
      'ASSISTANT_MANAGER': 'Assistant Manager',
      'PHYSIOTHERAPIST': 'Physiotherapist',
      'TRAINER': 'Trainer',
      'ANALYST': 'Analyst',
      'OTHER': 'Other',
    };
    return labels[role] || role;
  };

  const getRoleColor = (role: StaffRole | string) => {
    const colors: Record<string, string> = {
      'COACH': '#667eea',
      'ASSISTANT_COACH': '#4facfe',
      'MANAGER': '#f5576c',
      'ASSISTANT_MANAGER': '#43e97b',
      'PHYSIOTHERAPIST': '#fa709a',
      'TRAINER': '#fee140',
      'ANALYST': '#30cfd0',
      'OTHER': '#64748b',
    };
    return colors[role] || '#64748b';
  };

  // Filter out staff already assigned to this team
  const unassignedStaff = availableStaff.filter(
    (s) => !staff.some((ts) => ts.staffId === s.id)
  );

  const fetchTeamMatches = async () => {
    if (!team) return;
    try {
      setLoadingMatches(true);
      const response = await fetch(`/api/matches?teamId=${team.id}&sort=date-desc`);
      if (response.ok) {
        const data = await response.json();
        setMatches(data);
        
        // Fetch stats for completed matches
        const statsPromises = data
          .filter((match: any) => match.status === 'COMPLETED')
          .map(async (match: any) => {
            try {
              const eventsRes = await fetch(`/api/matches/${match.id}/events?teamId=${team.id}`);
              if (eventsRes.ok) {
                const events = await eventsRes.json();
                const stats = calculateTeamMatchStats(team.id, events);
                return { matchId: match.id, stats };
              }
            } catch (err) {
              console.error(`Error fetching stats for match ${match.id}:`, err);
            }
            return { matchId: match.id, stats: null };
          });
        
        const statsResults = await Promise.all(statsPromises);
        const statsMap: Record<string, any> = {};
        statsResults.forEach(({ matchId, stats }) => {
          if (stats) statsMap[matchId] = stats;
        });
        setMatchStats(statsMap);
      }
    } catch (err) {
      console.error('Error fetching team matches:', err);
    } finally {
      setLoadingMatches(false);
    }
  };

  // Group matches by league and sort within each league
  const getMatchesByLeague = () => {
    const leagueMap = new Map<string, any[]>();
    
    matches.forEach((match) => {
      const leagueKey = match.league?.id || match.leagueId || 'no-league';
      const leagueName = match.league?.name || match.leagueName || 'No League';
      
      if (!leagueMap.has(leagueKey)) {
        leagueMap.set(leagueKey, {
          leagueId: leagueKey,
          leagueName,
          matches: [],
        });
      }
      
      leagueMap.get(leagueKey)!.matches.push(match);
    });
    
    // Sort matches within each league by date (most recent first)
    leagueMap.forEach((leagueData) => {
      leagueData.matches.sort((a: any, b: any) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA; // Descending order (most recent first)
      });
    });
    
    return Array.from(leagueMap.values());
  };

  const getTeamScore = (match: any) => {
    if (!team) return null;
    if (match.team1Id === team.id) return match.team1Score;
    if (match.team2Id === team.id) return match.team2Score;
    return null;
  };

  const getOpponentScore = (match: any) => {
    if (!team) return null;
    if (match.team1Id === team.id) return match.team2Score;
    if (match.team2Id === team.id) return match.team1Score;
    return null;
  };

  const getOpponent = (match: any) => {
    if (!team) return null;
    if (match.team1Id === team.id) {
      return match.team2 || { name: match.team2Name || 'Opponent' };
    }
    if (match.team2Id === team.id) {
      return match.team1 || { name: match.team1Name || 'Opponent' };
    }
    return null;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Team not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <a href="/admin/teams" data-astro-prefetch>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Teams
            </a>
          </Button>
          <h1 className="text-3xl font-heading font-semibold text-foreground">Team Details</h1>
        </div>
        <Button asChild>
          <a href={`/admin/teams/${team.id}`} data-astro-prefetch>
            <Edit className="mr-2 h-4 w-4" />
            Edit Team
          </a>
        </Button>
      </div>

      {/* Team Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              {team.logo ? (
                <img
                  src={team.logo}
                  alt={team.name}
                  className="w-32 h-32 rounded-xl object-cover border-4 border-border"
                />
              ) : (
                <div className="w-32 h-32 rounded-xl bg-muted flex items-center justify-center border-4 border-border">
                  <Shield className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4 mb-4">
                <h2 className="text-4xl font-heading font-bold text-foreground">{team.name}</h2>
                <div className="flex items-center gap-2">
                  {team.approved ? (
                    <Badge className="bg-green-500 text-white">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Approved
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <XCircle className="h-3 w-3 mr-1" />
                      Pending Approval
                    </Badge>
                  )}
                </div>
              </div>
              {team.description && (
                <div className="flex gap-3 mt-4">
                  <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                  <p className="text-muted-foreground leading-relaxed">{team.description}</p>
                </div>
              )}
              {/* Approval Actions */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                {team.approved ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApproveTeam(false)}
                    disabled={approving}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {approving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject Team
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleApproveTeam(true)}
                    disabled={approving}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    {approving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve Team
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Players Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6" />
                Players ({players.length})
              </CardTitle>
              <CardDescription>Players currently on this team</CardDescription>
            </div>
            <Button asChild>
              <a href={`/admin/players/new?teamId=${team.id}`} data-astro-prefetch>
                <Plus className="mr-2 h-4 w-4" />
                Add Player
              </a>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {players.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No players yet</h3>
              <p className="text-muted-foreground mb-4">Add players to this team to get started</p>
              <Button asChild>
                <a href={`/admin/players/new?teamId=${team.id}`} data-astro-prefetch>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Player
                </a>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {players.map((player) => (
                <Card 
                  key={player.id} 
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full"
                  onClick={() => {
                    window.location.href = `/admin/players/view/${player.id}`;
                  }}
                >
                  {player.image ? (
                    <div className="w-full h-48 overflow-hidden bg-muted">
                      <img
                        src={player.image}
                        alt={((player as any).firstName || (player as any).lastName)
                          ? `${(player as any).firstName || ''} ${(player as any).lastName || ''}`.trim()
                          : 'Unnamed Player'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-muted flex items-center justify-center">
                      <User className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2">
                      {((player as any).firstName || (player as any).lastName)
                        ? `${(player as any).firstName || ''} ${(player as any).lastName || ''}`.trim()
                        : 'Unnamed Player'}
                    </h3>
                    {((player as any).height || (player as any).weight) && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        {(player as any).height && <span>{(player as any).height}</span>}
                        {(player as any).height && (player as any).weight && <span>•</span>}
                        {(player as any).weight && <span>{(player as any).weight}</span>}
                      </div>
                    )}
                    {player.position && (
                      <div className="mb-2">
                        <Badge variant="secondary">{player.position}</Badge>
                      </div>
                    )}
                    {player.jerseyNumber && (
                      <div className="text-sm text-muted-foreground font-semibold mb-2">
                        #{player.jerseyNumber}
                      </div>
                    )}
                    {player.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                        {player.bio.length > 100 ? `${player.bio.substring(0, 100)}...` : player.bio}
                      </p>
                    )}
                    <div className="pt-4 border-t" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" asChild className="w-full">
                        <a href={`/admin/players/${player.id}`} data-astro-prefetch>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Staff Section */}
      <Card id="staff">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-6 w-6" />
                Staff ({staff.length})
              </CardTitle>
              <CardDescription>Coaches, managers, and team staff</CardDescription>
            </div>
            <Button onClick={() => setShowAddStaffModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Staff
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingStaff ? (
            <div className="space-y-4">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : staff.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Briefcase className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No staff assigned</h3>
              <p className="text-muted-foreground mb-4">Add staff members to this team to get started</p>
              <Button onClick={() => setShowAddStaffModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Staff Member
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staff.map((teamStaff) => (
                <Card key={teamStaff.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {teamStaff.staff.image ? (
                    <div className="w-full h-48 overflow-hidden bg-muted">
                      <img
                        src={teamStaff.staff.image}
                        alt={`${teamStaff.staff.firstName} ${teamStaff.staff.lastName}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-muted flex items-center justify-center">
                      <User className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2">
                      {teamStaff.staff.firstName} {teamStaff.staff.lastName}
                    </h3>
                    <div className="mb-2">
                      <Badge
                        style={{ backgroundColor: getRoleColor(teamStaff.role) }}
                        className="text-white"
                      >
                        {getRoleLabel(teamStaff.role)}
                      </Badge>
                    </div>
                    {(teamStaff.staff.email || teamStaff.staff.phone) && (
                      <div className="flex flex-col gap-2 text-sm text-muted-foreground mb-2">
                        {teamStaff.staff.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <a href={`mailto:${teamStaff.staff.email}`} className="hover:text-primary">
                              {teamStaff.staff.email}
                            </a>
                          </div>
                        )}
                        {teamStaff.staff.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <a href={`tel:${teamStaff.staff.phone}`} className="hover:text-primary">
                              {teamStaff.staff.phone}
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                    {teamStaff.staff.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                        {teamStaff.staff.bio.length > 100
                          ? `${teamStaff.staff.bio.substring(0, 100)}...`
                          : teamStaff.staff.bio}
                      </p>
                    )}
                    <div className="pt-4 border-t flex gap-2">
                      <Button variant="ghost" size="sm" asChild className="flex-1">
                        <a href={`/admin/staff/${teamStaff.staff.id}`} data-astro-prefetch>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 text-destructive hover:text-destructive"
                        onClick={() => setRemoveStaffId(teamStaff.id)}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Matches Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-6 w-6" />
                Matches ({matches.length})
              </CardTitle>
              <CardDescription>All matches involving this team, organized by league</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingMatches ? (
            <div className="space-y-4">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No matches yet</h3>
              <p className="text-muted-foreground">This team hasn't played any matches yet.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {getMatchesByLeague().map((leagueData) => (
                <div key={leagueData.leagueId} className="space-y-4">
                  <div className="border-b pb-2">
                    <h3 className="text-xl font-semibold text-foreground">{leagueData.leagueName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {leagueData.matches.length} {leagueData.matches.length === 1 ? 'match' : 'matches'}
                    </p>
                  </div>
                  <div className="space-y-3">
                    {leagueData.matches.map((match: any) => {
                      const teamScore = getTeamScore(match);
                      const opponentScore = getOpponentScore(match);
                      const opponent = getOpponent(match);
                      const isWin = match.status === 'COMPLETED' && teamScore !== null && opponentScore !== null && teamScore > opponentScore;
                      const isLoss = match.status === 'COMPLETED' && teamScore !== null && opponentScore !== null && teamScore < opponentScore;
                      const isDraw = match.status === 'COMPLETED' && teamScore !== null && opponentScore !== null && teamScore === opponentScore;
                      const stats = matchStats[match.id];
                      
                      return (
                        <Card key={match.id} className="overflow-hidden hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="space-y-4">
                              {/* Match Header */}
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-lg">{team.name}</span>
                                      {match.status === 'COMPLETED' && teamScore !== null && (
                                        <span className={`text-2xl font-bold ${isWin ? 'text-green-600' : isLoss ? 'text-red-600' : 'text-gray-600'}`}>
                                          {teamScore}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-muted-foreground">vs</span>
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-lg">{opponent?.name || 'Opponent'}</span>
                                      {match.status === 'COMPLETED' && opponentScore !== null && (
                                        <span className={`text-2xl font-bold ${isLoss ? 'text-green-600' : isWin ? 'text-red-600' : 'text-gray-600'}`}>
                                          {opponentScore}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-4 w-4" />
                                      {formatDate(match.date)}
                                    </div>
                                    {match.stage && (
                                      <Badge variant="outline">{match.stage.replace(/_/g, ' ')}</Badge>
                                    )}
                                    <Badge
                                      variant={
                                        match.status === 'LIVE'
                                          ? 'destructive'
                                          : match.status === 'COMPLETED'
                                          ? 'default'
                                          : 'secondary'
                                      }
                                    >
                                      {match.status}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <Button variant="ghost" size="sm" asChild>
                                    <a href={`/admin/matches/view/${match.id}`} data-astro-prefetch>
                                      View Details
                                    </a>
                                  </Button>
                                </div>
                              </div>

                              {/* Match Statistics Summary */}
                              {match.status === 'COMPLETED' && stats && (
                                <div className="pt-4 border-t">
                                  <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Team Statistics</h4>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <div className="text-muted-foreground">Points</div>
                                      <div className="font-semibold text-lg">{stats.points}</div>
                                    </div>
                                    <div>
                                      <div className="text-muted-foreground">FG</div>
                                      <div className="font-semibold">
                                        {stats.fieldGoalsMade}/{stats.fieldGoalsAttempted}
                                        <span className="text-xs text-muted-foreground ml-1">
                                          ({formatFieldGoalPercentage(stats.fieldGoalsMade, stats.fieldGoalsAttempted)})
                                        </span>
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-muted-foreground">3PT</div>
                                      <div className="font-semibold">
                                        {stats.threePointersMade}/{stats.threePointersAttempted}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-muted-foreground">FT</div>
                                      <div className="font-semibold">
                                        {stats.freeThrowsMade}/{stats.freeThrowsAttempted}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-muted-foreground">Rebounds</div>
                                      <div className="font-semibold">{stats.rebounds}</div>
                                    </div>
                                    <div>
                                      <div className="text-muted-foreground">Assists</div>
                                      <div className="font-semibold">{stats.assists}</div>
                                    </div>
                                    <div>
                                      <div className="text-muted-foreground">Steals</div>
                                      <div className="font-semibold">{stats.steals}</div>
                                    </div>
                                    <div>
                                      <div className="text-muted-foreground">Blocks</div>
                                      <div className="font-semibold">{stats.blocks}</div>
                                    </div>
                                    <div>
                                      <div className="text-muted-foreground">Turnovers</div>
                                      <div className="font-semibold">{stats.turnovers}</div>
                                    </div>
                                    <div>
                                      <div className="text-muted-foreground">Fouls</div>
                                      <div className="font-semibold">{stats.fouls}</div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Staff Dialog */}
      <Dialog open={showAddStaffModal} onOpenChange={setShowAddStaffModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Staff to Team</DialogTitle>
            <DialogDescription>
              Select a staff member and their role for this team.
            </DialogDescription>
          </DialogHeader>
          {addStaffError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Error:</strong> {addStaffError}
              </AlertDescription>
            </Alert>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="staff-select">
                Staff Member <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedStaffId}
                onValueChange={(value) => {
                  setSelectedStaffId(value);
                  setAddStaffError('');
                }}
                disabled={addingStaff}
              >
                <SelectTrigger id="staff-select">
                  <SelectValue placeholder="Select a staff member" />
                </SelectTrigger>
                <SelectContent>
                  {unassignedStaff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} - {getRoleLabel(s.role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {unassignedStaff.length === 0 && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  No available staff members. <a href="/admin/staff/new" className="text-primary hover:underline">Create a new staff member</a> first.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-select">
                Role for this Team <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedRole}
                onValueChange={(value) => {
                  setSelectedRole(value as StaffRole);
                  setAddStaffError('');
                }}
                disabled={addingStaff}
              >
                <SelectTrigger id="role-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COACH">Coach</SelectItem>
                  <SelectItem value="ASSISTANT_COACH">Assistant Coach</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="ASSISTANT_MANAGER">Assistant Manager</SelectItem>
                  <SelectItem value="PHYSIOTHERAPIST">Physiotherapist</SelectItem>
                  <SelectItem value="TRAINER">Trainer</SelectItem>
                  <SelectItem value="ANALYST">Analyst</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddStaffModal(false);
                setAddStaffError('');
                setSelectedStaffId('');
                setSelectedRole('COACH');
              }}
              disabled={addingStaff}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddStaff}
              disabled={!selectedStaffId || !selectedRole || addingStaff}
            >
              {addingStaff ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Staff
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Staff Confirmation */}
      <AlertDialog open={removeStaffId !== null} onOpenChange={(open) => !open && setRemoveStaffId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Staff Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this staff member from the team? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeStaffId && handleRemoveStaff(removeStaffId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
