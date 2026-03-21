import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { MediaWithFolderAndUploader } from '../../types';
import MediaListItem from './MediaListItem';
import { useMediaGalleryStore } from '../../stores/mediaGalleryStore';

interface MediaListProps {
  items: MediaWithFolderAndUploader[];
  onItemClick: (e: React.MouseEvent, itemId: string, index: number) => void;
  onDragStart: (e: React.DragEvent, itemId: string) => void;
  onDragEnd: () => void;
  onSelectAll: () => void;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMove: (id: string) => void;
  onRename: (id: string) => void;
  onPreview: (id: string) => void;
  onDownload: (url: string, filename: string) => void;
  onCopyUrl: (url: string) => void;
  onCopyPath: (filePath: string | null) => void;
  onSort: (field: 'title' | 'type' | 'size' | 'createdAt' | 'featured') => void;
  onToggleFeatured?: (id: string) => void;
}

export default function MediaList({
  items,
  onItemClick,
  onDragStart,
  onDragEnd,
  onSelectAll,
  onToggleSelect,
  onDelete,
  onDuplicate,
  onMove,
  onRename,
  onPreview,
  onDownload,
  onCopyUrl,
  onCopyPath,
  onSort,
  onToggleFeatured,
}: MediaListProps) {
  const { selectedItems, sortField, sortDirection, draggedItemId } = useMediaGalleryStore();

  return (
    <Card className="overflow-x-auto">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <input
                type="checkbox"
                checked={selectedItems.size === items.length && items.length > 0}
                onChange={onSelectAll}
                className="rounded"
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>Preview</TableHead>
            <TableHead>
              <button
                onClick={() => onSort('title')}
                className="flex items-center gap-2 hover:text-foreground transition-colors"
              >
                Title
                {sortField === 'title' && (
                  <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
            </TableHead>
            <TableHead>
              <button
                onClick={() => onSort('type')}
                className="flex items-center gap-2 hover:text-foreground transition-colors"
              >
                Type
                {sortField === 'type' && (
                  <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
            </TableHead>
            <TableHead>
              <button
                onClick={() => onSort('size')}
                className="flex items-center gap-2 hover:text-foreground transition-colors"
              >
                Size
                {sortField === 'size' && (
                  <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
            </TableHead>
            <TableHead>
              <button
                onClick={() => onSort('createdAt')}
                className="flex items-center gap-2 hover:text-foreground transition-colors"
              >
                Date
                {sortField === 'createdAt' && (
                  <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
            </TableHead>
            <TableHead>
              <button
                onClick={() => onSort('featured')}
                className="flex items-center gap-2 hover:text-foreground transition-colors"
              >
                Featured
                {sortField === 'featured' && (
                  <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
            </TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => {
            const isSelected = item.id ? selectedItems.has(item.id) : false;
            const isDragged = draggedItemId === item.id;
            return (
              <MediaListItem
                key={item.id}
                item={item}
                index={index}
                isSelected={isSelected}
                isDragged={isDragged}
                onItemClick={onItemClick}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onToggleSelect={onToggleSelect}
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
        </TableBody>
      </Table>
    </Card>
  );
}
