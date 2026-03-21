import type { MediaWithFolderAndUploader } from '../../types';
import MediaItem from './MediaItem';
import { useMediaGalleryStore } from '../../stores/mediaGalleryStore';

interface MediaGridProps {
  items: MediaWithFolderAndUploader[];
  onItemClick: (e: React.MouseEvent, itemId: string, index: number) => void;
  onDragStart: (e: React.DragEvent, itemId: string) => void;
  onDragEnd: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMove: (id: string) => void;
  onRename: (id: string) => void;
  onPreview: (id: string) => void;
  onDownload: (url: string, filename: string) => void;
  onCopyUrl: (url: string) => void;
  onCopyPath: (filePath: string | null) => void;
  onToggleFeatured?: (id: string) => void;
}

export default function MediaGrid({
  items,
  onItemClick,
  onDragStart,
  onDragEnd,
  onDelete,
  onDuplicate,
  onMove,
  onRename,
  onPreview,
  onDownload,
  onCopyUrl,
  onCopyPath,
  onToggleFeatured,
}: MediaGridProps) {
  const { selectedItems, draggedItemId } = useMediaGalleryStore();

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
      role="grid"
      aria-label="Media gallery grid"
    >
      {items.map((item, index) => {
        const isSelected = item.id ? selectedItems.has(item.id) : false;
        const isDragged = draggedItemId === item.id;
        return (
          <MediaItem
            key={item.id}
            item={item}
            index={index}
            isSelected={isSelected}
            isDragged={isDragged}
            onItemClick={onItemClick}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onMove={onMove}
            onRename={onRename}
            onPreview={onPreview}
            onDownload={onDownload}
            onCopyUrl={onCopyUrl}
            onCopyPath={onCopyPath}
            onToggleFeatured={onToggleFeatured}
          />
        );
      })}
    </div>
  );
}
