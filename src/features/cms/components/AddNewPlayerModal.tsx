import { useState, useEffect, type ComponentType } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

interface AddNewPlayerModalProps {
  team1Id?: string | null;
  team2Id?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newPlayer: any) => void;
}

export default function AddNewPlayerModal({
  team1Id,
  team2Id,
  isOpen,
  onClose,
  onSuccess,
}: AddNewPlayerModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [teams, setTeams] = useState<any[]>([]);
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
  });
  const [icons, setIcons] = useState<{
    AlertCircle?: ComponentType<any>;
    Loader2?: ComponentType<any>;
  }>({});

  useEffect(() => {
    import('lucide-react').then((mod) => {
      setIcons({
        AlertCircle: mod.AlertCircle,
        Loader2: mod.Loader2,
      });
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchMatchTeams();
      // Reset form when modal opens
      setFormData({
        firstName: '',
        lastName: '',
        height: '',
        weight: '',
        image: '',
        bio: '',
        teamId: '',
        position: '',
        jerseyNumber: '',
      });
      setError('');
    }
  }, [isOpen, team1Id, team2Id]);

  const fetchMatchTeams = async () => {
    try {
      // If team1Id or team2Id are provided, only fetch those specific teams (match context)
      if (team1Id || team2Id) {
        const teamPromises: Promise<any>[] = [];
        
        if (team1Id) {
          teamPromises.push(fetch(`/api/teams/${team1Id}`).then(res => res.ok ? res.json() : null));
        }
        
        if (team2Id) {
          teamPromises.push(fetch(`/api/teams/${team2Id}`).then(res => res.ok ? res.json() : null));
        }
        
        const fetchedTeams = await Promise.all(teamPromises);
        const validTeams = fetchedTeams.filter(team => team !== null);
        
        setTeams(validTeams);
        
        if (validTeams.length > 0) {
          setFormData((prev) => ({ ...prev, teamId: validTeams[0].id }));
        }
      } else {
        // Otherwise, fetch all teams (general context)
        const response = await fetch('/api/teams');
        if (response.ok) {
          const allTeams = await response.json();
          setTeams(allTeams);
          
          if (allTeams.length > 0) {
            setFormData((prev) => ({ ...prev, teamId: allTeams[0].id }));
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch teams:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.firstName || !formData.lastName) {
        throw new Error('First name and last name are required');
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
      };

      console.log('Creating player with data:', payload);

      const response = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to create player:', errorData);
        throw new Error(errorData.error || 'Failed to create player');
      }

      const newPlayer = await response.json();
      console.log('Player created successfully:', newPlayer);
      onSuccess(newPlayer);
    } catch (err: any) {
      setError(err.message || 'Failed to create player');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Player</DialogTitle>
          <DialogDescription>
            Create a new player to add to this match.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <Alert variant="destructive">
            {icons.AlertCircle ? <icons.AlertCircle className="h-4 w-4" /> : <span className="h-4 w-4" />}
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-player-firstName">
                First Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="new-player-firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, firstName: e.target.value }))
                }
                required
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-player-lastName">
                Last Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="new-player-lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, lastName: e.target.value }))
                }
                required
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-player-height">Height</Label>
              <Input
                id="new-player-height"
                type="text"
                value={formData.height}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, height: e.target.value }))
                }
                placeholder="6'2&quot;"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-player-weight">Weight</Label>
              <Input
                id="new-player-weight"
                type="text"
                value={formData.weight}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, weight: e.target.value }))
                }
                placeholder="84 kg"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-player-image">Image URL</Label>
            <Input
              id="new-player-image"
              type="url"
              value={formData.image}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, image: e.target.value }))
              }
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-player-bio">Bio</Label>
            <Textarea
              id="new-player-bio"
              value={formData.bio}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, bio: e.target.value }))
              }
              placeholder="Player biography..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-player-teamId">Team</Label>
              <Select
                value={formData.teamId || undefined}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, teamId: value }))
                }
              >
                <SelectTrigger id="new-player-teamId">
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-player-position">Position</Label>
              <Select
                value={formData.position || undefined}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, position: value }))
                }
              >
                <SelectTrigger id="new-player-position">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PG">Point Guard (PG)</SelectItem>
                  <SelectItem value="SG">Shooting Guard (SG)</SelectItem>
                  <SelectItem value="SF">Small Forward (SF)</SelectItem>
                  <SelectItem value="PF">Power Forward (PF)</SelectItem>
                  <SelectItem value="C">Center (C)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-player-jerseyNumber">Jersey #</Label>
            <Input
              id="new-player-jerseyNumber"
              type="number"
              value={formData.jerseyNumber}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, jerseyNumber: e.target.value }))
              }
              min="0"
              max="99"
              placeholder="23"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  {icons.Loader2 ? <icons.Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <span className="mr-2 h-4 w-4" />}
                  Creating...
                </>
              ) : (
                'Create Player'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

