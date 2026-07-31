import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMediaGalleryStore } from '../stores/mediaGalleryStore';
import { useMediaOperations } from '../hooks/useMediaOperations';
import type { MediaWithFolderAndUploader } from '../../types';

interface SelectionToolbarProps {
  filteredMediaCount: number;
  filteredMedia: MediaWithFolderAndUploader[];
  onSelectAll: () => void;
  onBulkDelete: () => void;
}

export default function SelectionToolbar({ filteredMediaCount, filteredMedia, onSelectAll, onBulkDelete }: SelectionToolbarProps) {
  const { selectedItems, setSelectedItems, setMoveDialogOpen, setBulkRenameDialogOpen, setBulkTagDialogOpen } = useMediaGalleryStore();
  const { handleBulkDuplicate, handleExportZip, handleBulkToggleFeatured, handleBulkDownload } = useMediaOperations();
  const featuredItems = useMemo(() => filteredMedia.filter((item) => item.featured === true), [filteredMedia]);
  const unfeaturedItems = useMemo(() => filteredMedia.filter((item) => item.featured !== true), [filteredMedia]);

  if (selectedItems.size === 0) return null;

  const setSelected = (items: MediaWithFolderAndUploader[]) => setSelectedItems(new Set(items.map((item) => item.id)));

  return (
    <Card className="border-primary bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium">{selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected</span>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={onSelectAll}>{selectedItems.size === filteredMediaCount ? 'Deselect All' : 'Select All'}</Button>
            {featuredItems.length > 0 && <Button variant="outline" size="sm" onClick={() => setSelected(featuredItems)}>Select All Featured ({featuredItems.length})</Button>}
            {unfeaturedItems.length > 0 && <Button variant="outline" size="sm" onClick={() => setSelected(unfeaturedItems)}>Select All Unfeatured ({unfeaturedItems.length})</Button>}
            <Button variant="outline" size="sm" onClick={() => setMoveDialogOpen(true)}>Move Selected</Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkDuplicate(Array.from(selectedItems))}>Duplicate</Button>
            <Button variant="outline" size="sm" onClick={() => setBulkRenameDialogOpen(true)}>Rename</Button>
            <Button variant="outline" size="sm" onClick={() => setBulkTagDialogOpen(true)}>Tags</Button>
            <Button variant="outline" size="sm" onClick={handleExportZip}>Export ZIP</Button>
            <Button variant="outline" size="sm" onClick={handleBulkDownload}>Download</Button>
            <Button variant="outline" size="sm" onClick={() => {
              const selectedMedia = useMediaGalleryStore.getState().mediaItems.filter((item) => selectedItems.has(item.id));
              handleBulkToggleFeatured(Array.from(selectedItems), !selectedMedia.every((item) => item.featured));
            }}>Feature</Button>
            <Button variant="destructive" size="sm" onClick={onBulkDelete}>Delete</Button>
            <Button variant="outline" size="sm" onClick={() => setSelectedItems(new Set())}>Clear</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
