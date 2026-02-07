import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BulkRenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onRename: (pattern: string) => void;
}

export default function BulkRenameDialog({ open, onOpenChange, selectedCount, onRename }: BulkRenameDialogProps) {
  const [pattern, setPattern] = useState('{name}');

  const handleRename = () => {
    if (pattern.trim()) {
      onRename(pattern);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Bulk Rename {selectedCount} Items</DialogTitle>
          <DialogDescription>
            Rename multiple files using a pattern. Available placeholders:
            <br />
            - {'{index}'}: Item number (1, 2, 3...)
            <br />
            - {'{name}'}: Current filename
            <br />
            - {'{original}'}: Original filename on upload
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="pattern">Rename Pattern</Label>
            <Input
              id="pattern"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="e.g. Photo {index} - {name}"
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            />
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Examples</p>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>&bull; &quot;Photo {'{index}'}&quot; &rarr; Photo 1, Photo 2...</li>
              <li>&bull; &quot;{'{name}'} - High Res&quot; &rarr; image1 - High Res...</li>
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleRename} disabled={!pattern.trim()}>Rename All</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
