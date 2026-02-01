import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface RenameMediaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaId: string;
  currentTitle: string;
  onRename: (mediaId: string, newTitle: string) => Promise<void>;
}

export default function RenameMediaDialog({
  open,
  onOpenChange,
  mediaId,
  currentTitle,
  onRename,
}: RenameMediaDialogProps) {
  const [title, setTitle] = useState(currentTitle);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(currentTitle);
    }
  }, [open, currentTitle]);

  const handleRename = async () => {
    if (!title.trim()) {
      return;
    }
    try {
      setLoading(true);
      await onRename(mediaId, title.trim());
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to rename media:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Media</DialogTitle>
          <DialogDescription>
            Enter a new name for this media item.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRename();
                }
              }}
              disabled={loading}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleRename} disabled={loading || !title.trim()}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
