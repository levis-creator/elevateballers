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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface Folder {
  id: string;
  name: string;
  isPrivate: boolean;
}

interface MoveMediaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaIds: string[];
  onMove: (mediaIds: string[], folderId: string | null) => Promise<void>;
}

export default function MoveMediaDialog({
  open,
  onOpenChange,
  mediaIds,
  onMove,
}: MoveMediaDialogProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('none');
  const [loading, setLoading] = useState(false);
  const [loadingFolders, setLoadingFolders] = useState(true);

  useEffect(() => {
    if (open) {
      fetchFolders();
    }
  }, [open]);

  const fetchFolders = async () => {
    try {
      setLoadingFolders(true);
      const response = await fetch('/api/folders?includePrivate=true');
      if (response.ok) {
        const data = await response.json();
        setFolders(data);
      }
    } catch (err) {
      console.error('Failed to fetch folders:', err);
    } finally {
      setLoadingFolders(false);
    }
  };

  const handleMove = async () => {
    try {
      setLoading(true);
      const folderId = selectedFolderId === 'none' ? null : selectedFolderId;
      await onMove(mediaIds, folderId);
      onOpenChange(false);
      setSelectedFolderId('none');
    } catch (err) {
      console.error('Failed to move media:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move {mediaIds.length} item{mediaIds.length !== 1 ? 's' : ''}</DialogTitle>
          <DialogDescription>
            Select a folder to move the selected media items to.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {loadingFolders ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Folder (Root)</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name} {folder.isPrivate && '(Private)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleMove} disabled={loading || loadingFolders}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Move
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
