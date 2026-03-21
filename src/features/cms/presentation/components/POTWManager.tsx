import { useState, useEffect, type ComponentType } from 'react';
import type { Player, PlayerOfTheWeekWithPlayer, PlayerWithTeam } from '../../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { PlayerSelector } from './PlayerSelector';
import ImageUpload from '@/components/ImageUpload';
import { MediaLibraryPicker } from './MediaLibraryPicker';

export default function POTWManager() {
  const [players, setPlayers] = useState<PlayerWithTeam[]>([]);
  const [activePotw, setActivePotw] = useState<PlayerOfTheWeekWithPlayer | null>(null);
  const [history, setHistory] = useState<PlayerOfTheWeekWithPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [customImage, setCustomImage] = useState<string>('');
  const [pickerOpen, setPickerOpen] = useState(false);

  const [icons, setIcons] = useState<{
    Star?: ComponentType<any>;
    History?: ComponentType<any>;
    Save?: ComponentType<any>;
    Plus?: ComponentType<any>;
    Trash2?: ComponentType<any>;
    User?: ComponentType<any>;
    Image?: ComponentType<any>;
    AlertCircle?: ComponentType<any>;
    CheckCircle2?: ComponentType<any>;
    Edit?: ComponentType<any>;
  }>({});

  useEffect(() => {
    import('lucide-react').then((mod) => {
      setIcons({
        Star: mod.Star,
        History: mod.History,
        Save: mod.Save,
        Plus: mod.Plus,
        Trash2: mod.Trash2,
        User: mod.User,
        Image: mod.Image,
        AlertCircle: mod.AlertCircle,
        CheckCircle2: mod.CheckCircle2,
        Edit: mod.Edit,
      });
    });
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [playersRes, potwRes, historyRes] = await Promise.all([
        fetch('/api/players'),
        fetch('/api/highlights/potw'),
        fetch('/api/highlights/potw?history=true'),
      ]);

      if (!playersRes.ok || !potwRes.ok || !historyRes.ok) throw new Error('Failed to fetch data');

      const playersData = await playersRes.json();
      const potwData = await potwRes.json();
      const historyData = await historyRes.json();

      setPlayers(playersData);
      setActivePotw(potwData);
      setHistory(historyData);

      // Pre-fill form with active POTW if it exists
      if (potwData) {
        setSelectedPlayerId(potwData.playerId);
        setDescription(potwData.description);
        setCustomImage(potwData.customImage || '');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/highlights/potw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: selectedPlayerId,
          description,
          customImage: customImage || undefined,
          active: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update Player of the Week');
      }

      setSuccess('Player of the Week updated successfully!');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this historical record?')) return;

    try {
      const response = await fetch(`/api/highlights/potw?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete record');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[400px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  const StarIcon = icons.Star;
  const HistoryIcon = icons.History;
  const SaveIcon = icons.Save;
  const UserIcon = icons.User;
  const ImageIcon = icons.Image;
  const AlertCircleIcon = icons.AlertCircle;
  const CheckCircleIcon = icons.CheckCircle2;
  const TrashIcon = icons.Trash2;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex justify-between items-start border-b pb-6">
        <div>
          <h1 className="text-3xl font-heading font-semibold mb-2 flex items-center gap-2">
            {StarIcon && <StarIcon className="text-yellow-500" />}
            Player of the Week
          </h1>
          <p className="text-muted-foreground">Feature a standout performer and tell their story.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Management Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Update Featured Player</CardTitle>
              <CardDescription>Select a player and write an inspiring story about their performance.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Featured Player</Label>
                    <PlayerSelector
                      players={players}
                      selectedId={selectedPlayerId}
                      onSelect={setSelectedPlayerId}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="action-image">Action Shot / Feature Image</Label>
                    <div className="space-y-4">
                      <ImageUpload
                        value={customImage}
                        onChange={setCustomImage}
                        disabled={formLoading}
                        label="Upload New Action Shot"
                        folder="potw"
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setPickerOpen(true)}
                          className="w-full"
                        >
                          {icons.Image && <icons.Image size={16} className="mr-2" />}
                          Select from Media Library
                        </Button>
                        {customImage && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setCustomImage('')}
                          >
                            Reset to Profile Pic
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Upload an action shot or select a high-quality game photo. If empty, the player's profile picture will be used.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">The Story / Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Tell the story of their performance this week..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-[200px]"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-center gap-2 text-sm">
                    {AlertCircleIcon && <AlertCircleIcon size={16} />}
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-green-500/10 text-green-600 p-3 rounded-md flex items-center gap-2 text-sm">
                    {CheckCircleIcon && <CheckCircleIcon size={16} />}
                    {success}
                  </div>
                )}

                <Button type="submit" className="w-full sm:w-auto" disabled={formLoading || !selectedPlayerId}>
                  {formLoading ? 'Saving...' : (
                    <>
                      {SaveIcon && <SaveIcon size={18} className="mr-2" />}
                      Set as Player of the Week
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Current Preview */}
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/50 border-b">
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground font-bold">Live Preview</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {activePotw ? (
                <div className="relative group">
                  <div className="aspect-square bg-muted">
                    <img 
                      src={customImage || activePotw.player.image || '/images/default-player.png'} 
                      alt="Player Preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.src = '/images/default-player.png'; }}
                    />
                  </div>
                  <div className="p-4 bg-white">
                    <h3 className="text-xl font-bold uppercase">{activePotw.player.firstName} {activePotw.player.lastName}</h3>
                    <p className="text-primary text-sm font-semibold mb-3">{activePotw.player.team?.name || 'Free Agent'}</p>
                    <p className="text-sm text-gray-600 line-clamp-4 italic">"{description.substring(0, 150)}..."</p>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No active player of the week.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* History Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {HistoryIcon && <HistoryIcon size={20} />}
              Past Winners
            </CardTitle>
            <CardDescription>History of previous selected players.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead>Date Awarded</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.player.firstName} {item.player.lastName}
                  </TableCell>
                  <TableCell>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {item.active ? (
                      <Badge className="bg-yellow-500 hover:bg-yellow-600">Active</Badge>
                    ) : (
                      <Badge variant="outline">Past</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                       <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => {
                          setSelectedPlayerId(item.playerId);
                          setDescription(item.description);
                          setCustomImage(item.customImage || '');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        title="Edit / Restore"
                      >
                        {icons.Edit ? <icons.Edit size={16} /> : 'Edit'}
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(item.id)}>
                        {TrashIcon && <TrashIcon size={16} />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {history.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No history records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <MediaLibraryPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={setCustomImage}
      />
    </div>
  );
}
