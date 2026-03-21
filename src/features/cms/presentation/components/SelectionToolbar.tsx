import { useState, useEffect, useMemo, type ComponentType } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMediaGalleryStore } from '../../stores/mediaGalleryStore';
import { useMediaOperations } from '../../hooks/useMediaOperations';
import type { MediaWithFolderAndUploader } from '../../types';

interface SelectionToolbarProps {
  filteredMediaCount: number;
  filteredMedia: MediaWithFolderAndUploader[];
  onSelectAll: () => void;
  onBulkDelete: () => void;
}

export default function SelectionToolbar({ filteredMediaCount, filteredMedia, onSelectAll, onBulkDelete }: SelectionToolbarProps) {
  const [icons, setIcons] = useState<{
    Check?: ComponentType<any>;
    X?: ComponentType<any>;
    Edit?: ComponentType<any>;
    Trash2?: ComponentType<any>;
    Image?: ComponentType<any>;
    Upload?: ComponentType<any>;
    Star?: ComponentType<any>;
    Download?: ComponentType<any>;
  }>({});

  const {
    selectedItems,
    setSelectedItems,
    setMoveDialogOpen,
    setBulkRenameDialogOpen,
    setBulkTagDialogOpen,
  } = useMediaGalleryStore();

  const {
    handleBulkDuplicate,
    handleExportZip,
    handleBulkToggleFeatured,
    handleBulkDownload,
  } = useMediaOperations();

  useEffect(() => {
    import('lucide-react').then((mod) => {
      setIcons({
        Check: mod.Check,
        X: mod.X,
        Edit: mod.Edit,
        Trash2: mod.Trash2,
        Image: mod.Image,
        Upload: mod.Upload,
        Star: mod.Star,
        Download: mod.Download,
      });
    });
  }, []);

  const CheckIcon = icons.Check;
  const XIcon = icons.X;
  const EditIcon = icons.Edit;
  const Trash2Icon = icons.Trash2;
  const ImageIcon = icons.Image;
  const UploadIcon = icons.Upload;
  const StarIcon = icons.Star;
  const DownloadIcon = icons.Download;

  // Calculate featured/unfeatured counts from filtered media
  const featuredItems = useMemo(() => {
    return filteredMedia.filter((item) => item.id && item.featured === true);
  }, [filteredMedia]);

  const unfeaturedItems = useMemo(() => {
    return filteredMedia.filter((item) => item.id && item.featured !== true);
  }, [filteredMedia]);

  // Handlers for quick selection
  const handleSelectAllFeatured = () => {
    const featuredIds = featuredItems.map((item) => item.id).filter(Boolean) as string[];
    setSelectedItems(new Set(featuredIds));
  };

  const handleSelectAllUnfeatured = () => {
    const unfeaturedIds = unfeaturedItems.map((item) => item.id).filter(Boolean) as string[];
    setSelectedItems(new Set(unfeaturedIds));
  };

  if (selectedItems.size === 0) return null;

  return (
    <Card className="border-primary bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={onSelectAll}>
              {selectedItems.size === filteredMediaCount ? 'Deselect All' : 'Select All'}
            </Button>
            {featuredItems.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleSelectAllFeatured}>
                {StarIcon ? <StarIcon size={16} className="mr-2" /> : null}
                Select All Featured ({featuredItems.length})
              </Button>
            )}
            {unfeaturedItems.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleSelectAllUnfeatured}>
                Select All Unfeatured ({unfeaturedItems.length})
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setMoveDialogOpen(true)}>
              Move Selected
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkDuplicate(Array.from(selectedItems))}
            >
              {CheckIcon ? <CheckIcon size={16} className="mr-2" /> : null}
              Duplicate
            </Button>
            <Button variant="outline" size="sm" onClick={() => setBulkRenameDialogOpen(true)}>
              {EditIcon ? <EditIcon size={16} className="mr-2" /> : null}
              Rename
            </Button>
            <Button variant="outline" size="sm" onClick={() => setBulkTagDialogOpen(true)}>
              {ImageIcon ? <ImageIcon size={16} className="mr-2" /> : null}
              Tags
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportZip}>
              {UploadIcon ? <UploadIcon size={16} className="mr-2" /> : null}
              Export ZIP
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkDownload()}
            >
              {DownloadIcon ? <DownloadIcon size={16} className="mr-2" /> : null}
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const { mediaItems } = useMediaGalleryStore.getState();
                const selectedMedia = mediaItems.filter((item) => item.id && selectedItems.has(item.id));
                const allFeatured = selectedMedia.every((item) => item.featured);
                handleBulkToggleFeatured(Array.from(selectedItems), !allFeatured);
              }}
            >
              {StarIcon ? <StarIcon size={16} className="mr-2" /> : null}
              {(() => {
                const { mediaItems } = useMediaGalleryStore.getState();
                const selectedMedia = mediaItems.filter((item) => item.id && selectedItems.has(item.id));
                const allFeatured = selectedMedia.every((item) => item.featured);
                return allFeatured ? 'Unfeature' : 'Feature';
              })()}
            </Button>
            <Button variant="destructive" size="sm" onClick={onBulkDelete}>
              {Trash2Icon ? <Trash2Icon size={16} className="mr-2" /> : null}
              Delete
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSelectedItems(new Set())}>
              {XIcon ? <XIcon size={16} className="mr-2" /> : null}
              Clear
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
