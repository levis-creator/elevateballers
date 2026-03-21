import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface BulkTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onTag: (tags: string[]) => void;
}

export default function BulkTagDialog({ open, onOpenChange, selectedCount, onTag }: BulkTagDialogProps) {
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/,/g, '');
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleApply = () => {
    onTag(tags);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Bulk Tag {selectedCount} Items</DialogTitle>
          <DialogDescription>
            Replace existing tags with these new tags for all selected items.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="tags-input">New Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2 p-2 border rounded-md min-h-[40px] bg-muted/50">
              {tags.map(tag => (
                <Badge key={tag} variant="secondary" className="gap-1 px-2 py-1">
                  {tag}
                  <X 
                    size={12} 
                    className="cursor-pointer hover:text-destructive transition-colors" 
                    onClick={() => removeTag(tag)} 
                  />
                </Badge>
              ))}
              {tags.length === 0 && <span className="text-muted-foreground text-xs p-1">No tags added yet</span>}
            </div>
            <Input
              id="tags-input"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Type tag and press Enter or comma..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleApply} disabled={tags.length === 0}>Apply Tags</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
