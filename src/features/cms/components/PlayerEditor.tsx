import { useState, useEffect } from 'react';
import type { Player, Team } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, X, AlertCircle, CheckCircle, CheckCircle2, Info, Loader2, User, XCircle } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';
import { Badge } from '@/components/ui/badge';
import { buttonAccent, stickyHeader, stickyFooter, tekoFont, cardElevated, cardHeader, cardTitle, formInput, formSelectTrigger, formLabel, formHelperText } from '../lib/ui-helpers';
import { cn } from '@/lib/utils';

interface PlayerEditorProps {
  playerId?: string;
}

export default function PlayerEditor({ playerId }: PlayerEditorProps) {
  const [loading, setLoading] = useState(!!playerId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [playerApproved, setPlayerApproved] = useState<boolean | null>(null);
  const [approving, setApproving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    height: '',
    weight: '',
    image: '',
    bio: '',
    teamId: '',
    position: '',
    jerseyNumber: '',
    stats: '',
  });

  useEffect(() => {
    fetchTeams();
    if (playerId) {
      fetchPlayer();
    } else {
      // Check for teamId in URL query params when creating new player
      const urlParams = new URLSearchParams(window.location.search);
      const teamIdFromUrl = urlParams.get('teamId');
      if (teamIdFromUrl) {
        setFormData((prev) => ({ ...prev, teamId: teamIdFromUrl }));
      }
    }
  }, [playerId]);

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

  const fetchPlayer = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/players/${playerId}`);
      if (!response.ok) throw new Error('Failed to fetch player');
      const player: Player = await response.json();

      setFormData({
        firstName: (player as any).firstName || '',
        lastName: (player as any).lastName || '',
        height: (player as any).height || '',
        weight: (player as any).weight || '',
        image: player.image || '',
        bio: player.bio || '',
        teamId: (player as any).teamId || (player as any).team?.id || '',
        position: player.position || '',
        jerseyNumber: player.jerseyNumber?.toString() || '',
        stats: player.stats ? JSON.stringify(player.stats, null, 2) : '',
      });
      setPlayerApproved((player as any).approved ?? false);
    } catch (err: any) {
      setError(err.message || 'Failed to load player');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const url = playerId ? `/api/players/${playerId}` : '/api/players';
      const method = playerId ? 'PUT' : 'POST';

      let stats = null;
      if (formData.stats.trim()) {
        try {
          stats = JSON.parse(formData.stats);
        } catch {
          throw new Error('Invalid JSON in stats field');
        }
      }

      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        height: formData.height.trim() || undefined,
        weight: formData.weight.trim() || undefined,
        image: formData.image.trim() || undefined,
        bio: formData.bio.trim() || undefined,
        teamId: formData.teamId || undefined,
        position: formData.position || undefined,
        jerseyNumber: formData.jerseyNumber ? parseInt(formData.jerseyNumber) : undefined,
        stats,
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
        throw new Error(errorData.error || 'Failed to save player');
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/admin/players';
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to save player');
    } finally {
      setSaving(false);
    }
  };

  const handleApprovePlayer = async (approved: boolean) => {
    if (!playerId) return;
    setApproving(true);
    try {
      const response = await fetch(`/api/players/${playerId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update approval status' }));
        throw new Error(errorData.error || 'Failed to update approval status');
      }

      const updatedPlayer = await response.json();
      setPlayerApproved(updatedPlayer.approved);
    } catch (err: any) {
      alert('Error updating approval status: ' + err.message);
    } finally {
      setApproving(false);
    }
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

  return (
    <>
      {/* Header */}
      <header className={cn(stickyHeader, "px-8 py-4 -mx-8 -mt-8 mb-8")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="hover:bg-slate-100" asChild>
              <a href="/admin/players" data-astro-prefetch>
                <ArrowLeft className="w-5 h-5" />
              </a>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold text-slate-900" style={tekoFont}>
                  {playerId ? 'EDIT PLAYER' : 'CREATE NEW PLAYER'}
                </h2>
                {playerId && playerApproved !== null && playerApproved && (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Approved
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-1">
                {playerId ? 'Update player details and information' : 'Add a new player to your organization'}
              </p>
            </div>
          </div>
          <Button className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold shadow-lg hover:shadow-xl transition-all" asChild>
            <a href="/admin/players" data-astro-prefetch>
              <span style={tekoFont} className="text-lg">Back to List</span>
            </a>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Reject Player Button - Above Form */}
        {playerId && playerApproved !== null && playerApproved && (
          <div className="mb-6">
            <Button
              variant="outline"
              className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 border-yellow-500 font-semibold shadow-md"
              onClick={() => handleApprovePlayer(false)}
              disabled={approving}
            >
              {approving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 mr-2" />
                  <span style={tekoFont} className="text-base">Reject Player</span>
                </>
              )}
            </Button>
          </div>
        )}

        {playerId && playerApproved !== null && !playerApproved && (
          <div className="mb-6">
            <Button
              variant="outline"
              className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 border-yellow-500 font-semibold shadow-md"
              onClick={() => handleApprovePlayer(true)}
              disabled={approving}
            >
              {approving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span style={tekoFont} className="text-base">Approving...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  <span style={tekoFont} className="text-base">Approve Player</span>
                </>
              )}
            </Button>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Error:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-500 bg-green-50 text-green-900">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Success!</strong> Player saved successfully! Redirecting...
            </AlertDescription>
          </Alert>
        )}

        <form id="player-form" onSubmit={handleSubmit} className="space-y-6">
        <Card className={cn(cardElevated)}>
          <CardHeader className={cn(cardHeader)}>
            <CardTitle className={cn(cardTitle)} style={tekoFont}>Basic Information</CardTitle>
            <CardDescription>Enter the player's personal details</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className={cn(formLabel)}>
                      First Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                      required
                      disabled={saving}
                      placeholder="John"
                      className={cn(formInput)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className={cn(formLabel)}>
                      Last Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                      required
                      disabled={saving}
                      placeholder="Doe"
                      className={cn(formInput)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="height" className={cn(formLabel)}>Height</Label>
                    <Input
                      id="height"
                      type="text"
                      value={formData.height}
                      onChange={(e) => setFormData((prev) => ({ ...prev, height: e.target.value }))}
                      disabled={saving}
                      placeholder="6'2&quot;"
                      className={cn(formInput)}
                    />
                    <p className={cn(formHelperText, "flex items-center gap-1")}>
                      <Info className="h-3 w-3" />
                      Enter height in feet and inches format (e.g., 6'2&quot; or 5'10&quot;)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight" className={cn(formLabel)}>Weight</Label>
                    <Input
                      id="weight"
                      type="text"
                      value={formData.weight}
                      onChange={(e) => setFormData((prev) => ({ ...prev, weight: e.target.value }))}
                      disabled={saving}
                      placeholder="84 kg"
                      className={cn(formInput)}
                    />
                    <p className={cn(formHelperText, "flex items-center gap-1")}>
                      <Info className="h-3 w-3" />
                      Enter weight with unit (e.g., 84 kg or 185 lbs)
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <ImageUpload
                  value={formData.image}
                  onChange={(url) => setFormData((prev) => ({ ...prev, image: url }))}
                  disabled={saving}
                  label="Player Photo"
                  folder="players"
                  variant="player"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(cardElevated)}>
          <CardHeader className={cn(cardHeader)}>
            <CardTitle className={cn(cardTitle)} style={tekoFont}>Team & Position</CardTitle>
            <CardDescription>Team assignment and playing position</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="teamId" className={cn(formLabel)}>Team</Label>
                <Select
                  value={formData.teamId || "__none"}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, teamId: value === "__none" ? "" : value }))}
                  disabled={saving}
                >
                  <SelectTrigger id="teamId" className={cn(formSelectTrigger)}>
                    <SelectValue placeholder="Select a team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">No team</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="position" className={cn(formLabel)}>Position</Label>
                <Select
                  value={formData.position || ""}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, position: value }))}
                  disabled={saving}
                >
                  <SelectTrigger id="position" className={cn(formSelectTrigger)}>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PG">PG - Point Guard</SelectItem>
                    <SelectItem value="SG">SG - Shooting Guard</SelectItem>
                    <SelectItem value="SF">SF - Small Forward</SelectItem>
                    <SelectItem value="PF">PF - Power Forward</SelectItem>
                    <SelectItem value="C">C - Center</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="jerseyNumber" className={cn(formLabel)}>Jersey Number</Label>
                <Input
                  id="jerseyNumber"
                  type="number"
                  value={formData.jerseyNumber}
                  onChange={(e) => setFormData((prev) => ({ ...prev, jerseyNumber: e.target.value }))}
                  disabled={saving}
                  placeholder="23"
                  min="0"
                  max="99"
                  className={cn(formInput)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(cardElevated)}>
          <CardHeader className={cn(cardHeader)}>
            <CardTitle className={cn(cardTitle)} style={tekoFont}>Biography & Stats</CardTitle>
            <CardDescription>Player biography and statistics</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bio" className={cn(formLabel)}>Bio</Label>
              <Textarea
                id="bio"
                rows={6}
                value={formData.bio}
                onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                disabled={saving}
                placeholder="Enter player's biography"
                className={cn(formInput, "resize-none min-h-32")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stats" className={cn(formLabel)}>Stats (JSON)</Label>
              <Textarea
                id="stats"
                rows={8}
                value={formData.stats}
                onChange={(e) => setFormData((prev) => ({ ...prev, stats: e.target.value }))}
                disabled={saving}
                placeholder='{"points": 25.5, "rebounds": 8.2, "assists": 6.1}'
                className={cn(formInput, "resize-none font-mono text-sm")}
              />
              <p className={cn(formHelperText, "flex items-center gap-2")}>
                <Info className="h-4 w-4" />
                Enter player statistics as valid JSON format
              </p>
            </div>
          </CardContent>
        </Card>

      </form>
      </div>

      {/* Footer */}
      <footer className={cn(stickyFooter, "-mx-8 -mb-8 mt-8")}>
        <div className="flex justify-end gap-3">
          <Button 
            type="button" 
            variant="outline"
            className="px-8 border-slate-300 hover:bg-slate-50"
            asChild
          >
            <a href="/admin/players" data-astro-prefetch>
              <span style={tekoFont} className="text-lg">Cancel</span>
            </a>
          </Button>
          <Button 
            type="submit" 
            form="player-form"
            disabled={saving}
            className="px-8 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span style={tekoFont} className="text-lg">Saving...</span>
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                <span style={tekoFont} className="text-lg">
                  {playerId ? 'Update Player' : 'Create Player'}
                </span>
              </>
            )}
          </Button>
        </div>
      </footer>
    </>
  );
}
