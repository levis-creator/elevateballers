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
import { ArrowLeft, Edit, Users, Shield, User, FileText, Plus, Briefcase, Mail, Phone, X, Info, AlertCircle, Loader2, CheckCircle, XCircle } from 'lucide-react';

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

  useEffect(() => {
    fetchTeam();
  }, [teamId]);

  useEffect(() => {
    if (team) {
      fetchTeamStaff();
      fetchAvailableStaff();
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
                <Card key={player.id} className="overflow-hidden hover:shadow-lg transition-shadow">
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
                    <div className="pt-4 border-t">
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
