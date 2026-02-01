import { useState, useEffect, type ComponentType } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

interface Folder {
  id: string;
  name: string;
  path: string;
  description?: string | null;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    media: number;
  };
}

interface FolderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder?: Folder | null;
  onSuccess?: () => void;
}

export default function FolderModal({ open, onOpenChange, folder, onSuccess }: FolderModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: false,
  });

  useEffect(() => {
    if (folder) {
      setFormData({
        name: folder.name,
        description: folder.description || '',
        isPrivate: folder.isPrivate,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        isPrivate: false,
      });
    }
    setError('');
  }, [folder, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = folder ? `/api/folders/${folder.id}` : '/api/folders';
      const method = folder ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          isPrivate: formData.isPrivate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save folder');
      }

      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save folder');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{folder ? 'Edit Folder' : 'Create Folder'}</DialogTitle>
          <DialogDescription>
            {folder ? 'Update folder information' : 'Create a new folder to organize your media files'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="folder-name">
              Folder Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="folder-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
              disabled={loading}
              placeholder="e.g., general, players, teams"
              pattern="[a-zA-Z0-9\-_/]+"
              title="Only letters, numbers, hyphens, underscores, and forward slashes are allowed"
            />
            <p className="text-xs text-muted-foreground">
              Only letters, numbers, hyphens, underscores, and forward slashes are allowed
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="folder-description">Description</Label>
            <Textarea
              id="folder-description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              disabled={loading}
              placeholder="Optional description for this folder"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="folder-private" className="text-base">
                Private Folder
              </Label>
              <p className="text-sm text-muted-foreground">
                Private folders require authentication to access
              </p>
            </div>
            <Switch
              id="folder-private"
              checked={formData.isPrivate}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isPrivate: checked }))}
              disabled={loading}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {folder ? 'Update Folder' : 'Create Folder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
