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
import { ArrowLeft, Save, X, AlertCircle, CheckCircle, Info, Loader2, User } from 'lucide-react';

interface PlayerEditorProps {
  playerId?: string;
}

export default function PlayerEditor({ playerId }: PlayerEditorProps) {
  const [loading, setLoading] = useState(!!playerId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
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
            <User className="h-8 w-8" />
            {playerId ? 'Edit Player' : 'Create New Player'}
          </h1>
          <p className="text-muted-foreground">
            {playerId ? 'Update player details and information' : 'Add a new player to your organization'}
          </p>
        </div>
        <Button variant="outline" asChild>
          <a href="/admin/players" data-astro-prefetch>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </a>
        </Button>
      </div>

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

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Enter the player's personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">
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
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height">Height</Label>
                <Input
                  id="height"
                  type="text"
                  value={formData.height}
                  onChange={(e) => setFormData((prev) => ({ ...prev, height: e.target.value }))}
                  disabled={saving}
                  placeholder="6'2&quot;"
                />
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Enter height in feet and inches format (e.g., 6'2&quot; or 5'10&quot;)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight</Label>
                <Input
                  id="weight"
                  type="text"
                  value={formData.weight}
                  onChange={(e) => setFormData((prev) => ({ ...prev, weight: e.target.value }))}
                  disabled={saving}
                  placeholder="84 kg"
                />
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Enter weight with unit (e.g., 84 kg or 185 lbs)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Image URL</Label>
              <Input
                id="image"
                type="url"
                value={formData.image}
                onChange={(e) => setFormData((prev) => ({ ...prev, image: e.target.value }))}
                disabled={saving}
                placeholder="https://example.com/image.jpg"
              />
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Info className="h-4 w-4" />
                URL to the player's photo
              </p>
              {formData.image && (
                <div className="mt-2 border rounded-lg overflow-hidden">
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="w-full max-h-[300px] object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team & Position</CardTitle>
            <CardDescription>Team assignment and playing position</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="teamId">Team</Label>
                <Select
                  value={formData.teamId || "__none"}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, teamId: value === "__none" ? "" : value }))}
                  disabled={saving}
                >
                  <SelectTrigger id="teamId">
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
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData((prev) => ({ ...prev, position: e.target.value }))}
                  disabled={saving}
                  placeholder="e.g., Point Guard, Center"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="jerseyNumber">Jersey Number</Label>
              <Input
                id="jerseyNumber"
                type="number"
                value={formData.jerseyNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, jerseyNumber: e.target.value }))}
                disabled={saving}
                placeholder="23"
                min="0"
                max="99"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Biography & Stats</CardTitle>
            <CardDescription>Player biography and statistics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                rows={6}
                value={formData.bio}
                onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                disabled={saving}
                placeholder="Enter player's biography"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stats">Stats (JSON)</Label>
              <Textarea
                id="stats"
                rows={8}
                value={formData.stats}
                onChange={(e) => setFormData((prev) => ({ ...prev, stats: e.target.value }))}
                disabled={saving}
                placeholder='{"points": 25.5, "rebounds": 8.2, "assists": 6.1}'
                className="font-mono text-sm"
              />
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Info className="h-4 w-4" />
                Enter player statistics as valid JSON format
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {playerId ? 'Update Player' : 'Create Player'}
              </>
            )}
          </Button>
          <Button type="button" variant="outline" asChild>
            <a href="/admin/players" data-astro-prefetch>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </a>
          </Button>
        </div>
      </form>
    </div>
  );
}
