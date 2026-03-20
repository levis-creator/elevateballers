import { useState, useEffect, type ComponentType } from 'react';
import type { Sponsor } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import ImageUpload from '@/components/ImageUpload';

export default function SponsorManager() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [link, setLink] = useState('');
  const [active, setActive] = useState(true);

  const [icons, setIcons] = useState<{
    Handshake?: ComponentType<any>;
    Plus?: ComponentType<any>;
    Save?: ComponentType<any>;
    Trash2?: ComponentType<any>;
    Edit?: ComponentType<any>;
    ExternalLink?: ComponentType<any>;
    AlertCircle?: ComponentType<any>;
    CheckCircle2?: ComponentType<any>;
    ArrowUp?: ComponentType<any>;
    ArrowDown?: ComponentType<any>;
    RefreshCw?: ComponentType<any>;
  }>({});

  useEffect(() => {
    import('lucide-react').then((mod) => {
      setIcons({
        Handshake: mod.Handshake,
        Plus: mod.Plus,
        Save: mod.Save,
        Trash2: mod.Trash2,
        Edit: mod.Edit,
        ExternalLink: mod.ExternalLink,
        AlertCircle: mod.AlertCircle,
        CheckCircle2: mod.CheckCircle2,
        ArrowUp: mod.ArrowUp,
        ArrowDown: mod.ArrowDown,
        RefreshCw: mod.RefreshCw,
      });
    });
    fetchSponsors();
  }, []);

  const fetchSponsors = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/highlights/sponsors?active=false'); // Fetch all including inactive
      if (!response.ok) throw new Error('Failed to fetch sponsors');
      const data = await response.json();
      setSponsors(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load sponsors');
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
      if (!image.trim()) {
        throw new Error('Please upload or enter a sponsor logo.');
      }

      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/highlights/sponsors/${editingId}` : '/api/highlights/sponsors';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, image, link, active }),
      });

      if (!response.ok) throw new Error('Failed to save sponsor');

      setSuccess(editingId ? 'Sponsor updated!' : 'Sponsor added!');
      resetForm();
      fetchSponsors();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (sponsor: Sponsor) => {
    setEditingId(sponsor.id);
    setName(sponsor.name);
    setImage(sponsor.image);
    setLink(sponsor.link || '');
    setActive(sponsor.active);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sponsor?')) return;

    try {
      const response = await fetch(`/api/highlights/sponsors/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete sponsor');
      fetchSponsors();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    const index = sponsors.findIndex(s => s.id === id);
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sponsors.length - 1) return;

    const newSponsors = [...sponsors];
    const item = newSponsors.splice(index, 1)[0];
    newSponsors.splice(direction === 'up' ? index - 1 : index + 1, 0, item);

    setSponsors(newSponsors);

    // Save order to API
    try {
      await fetch('/api/highlights/sponsors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reorder: true,
          ids: newSponsors.map(s => s.id)
        }),
      });
    } catch (err) {
      console.error('Failed to save order');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setImage('');
    setLink('');
    setActive(true);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const HandshakeIcon = icons.Handshake;
  const PlusIcon = icons.Plus;
  const SaveIcon = icons.Save;
  const TrashIcon = icons.Trash2;
  const EditIcon = icons.Edit;
  const ExternalLinkIcon = icons.ExternalLink;
  const ArrowUpIcon = icons.ArrowUp;
  const ArrowDownIcon = icons.ArrowDown;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex justify-between items-start border-b pb-6">
        <div>
          <h1 className="text-3xl font-heading font-semibold mb-2 flex items-center gap-2">
            {HandshakeIcon && <HandshakeIcon size={28} className="text-primary" />}
            Sponsors
          </h1>
          <p className="text-muted-foreground">Manage the logos displayed in the footer carousel.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? 'Edit Sponsor' : 'Add New Sponsor'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="spon-name">Sponsor Name</Label>
                    <Input 
                      id="spon-name" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      placeholder="e.g. Nike" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <ImageUpload
                      value={image}
                      onChange={setImage}
                      label="Sponsor Logo"
                      helperText="Upload a logo or paste a URL. Recommended: transparent PNG, ~600px wide."
                      folder="sponsors"
                      maxWidthOrHeight={1200}
                      quality={0.85}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="spon-link">Website Link (Optional)</Label>
                    <Input 
                      id="spon-link" 
                      value={link} 
                      onChange={(e) => setLink(e.target.value)} 
                      placeholder="https://nike.com" 
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="spon-active">Show on Website</Label>
                    <Switch 
                      id="spon-active" 
                      checked={active} 
                      onCheckedChange={setActive} 
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={formLoading}>
                    {formLoading ? 'Saving...' : (
                      <>
                        {SaveIcon && <SaveIcon size={18} className="mr-2" />}
                        {editingId ? 'Update' : 'Add Sponsor'}
                      </>
                    )}
                  </Button>
                  {editingId && (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Currently Managed Sponsors</CardTitle>
              <CardDescription>Drag and drop (or use arrows) to change the display order.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Order</TableHead>
                    <TableHead>Logo</TableHead>
                    <TableHead>Sponsor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sponsors.map((s, index) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            onClick={() => handleReorder(s.id, 'up')}
                            disabled={index === 0}
                          >
                            {ArrowUpIcon && <ArrowUpIcon size={14} />}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            onClick={() => handleReorder(s.id, 'down')}
                            disabled={index === sponsors.length - 1}
                          >
                            {ArrowDownIcon && <ArrowDownIcon size={14} />}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="w-16 h-8 bg-muted rounded flex items-center justify-center p-1 overflow-hidden">
                          <img src={s.image} alt={s.name} className="max-w-full max-h-full object-contain" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{s.name}</div>
                        {s.link && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            {ExternalLinkIcon && <ExternalLinkIcon size={10} />}
                            {new URL(s.link).hostname}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {s.active ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">Hidden</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(s)}>
                            {EditIcon && <EditIcon size={16} />}
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(s.id)}>
                            {TrashIcon && <TrashIcon size={16} />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {sponsors.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        No sponsors added yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
