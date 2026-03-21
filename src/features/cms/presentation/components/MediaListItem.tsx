import { useState, useEffect, type ComponentType } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { MediaWithFolderAndUploader } from '../../types';
import { getMediaTypeColor, getMediaIcon, isStringArray, formatFileSize, formatDate } from '../../utils/mediaUtils';
import MediaContextMenu from './MediaContextMenu';

interface MediaListItemProps {
  item: MediaWithFolderAndUploader;
  index: number;
  isSelected: boolean;
  isDragged: boolean;
  onItemClick: (e: React.MouseEvent, itemId: string, index: number) => void;
  onDragStart: (e: React.DragEvent, itemId: string) => void;
  onDragEnd: () => void;
  onToggleSelect: (id: string) => void;
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

export default function MediaListItem({
  item,
  index,
  isSelected,
  isDragged,
  onItemClick,
  onDragStart,
  onDragEnd,
  onToggleSelect,
  onDelete,
  onDuplicate,
  onMove,
  onRename,
  onPreview,
  onDownload,
  onCopyUrl,
  onCopyPath,
  onToggleFeatured,
}: MediaListItemProps) {
  const [icons, setIcons] = useState<{
    Image?: ComponentType<any>;
    Video?: ComponentType<any>;
    Music?: ComponentType<any>;
    FileText?: ComponentType<any>;
    ExternalLink?: ComponentType<any>;
    Edit?: ComponentType<any>;
    Trash2?: ComponentType<any>;
    Star?: ComponentType<any>;
  }>({});

  useEffect(() => {
    import('lucide-react').then((mod) => {
      setIcons({
        Image: mod.Image,
        Video: mod.Video,
        Music: mod.Music,
        FileText: mod.FileText,
        ExternalLink: mod.ExternalLink,
        Edit: mod.Edit,
        Trash2: mod.Trash2,
        Star: mod.Star,
      });
    });
  }, []);

  const ImageIcon = icons.Image;
  const ExternalLinkIcon = icons.ExternalLink;
  const EditIcon = icons.Edit;
  const Trash2Icon = icons.Trash2;
  const StarIcon = icons.Star;
  const MediaIcon = getMediaIcon(item.type, icons);

  return (
    <MediaContextMenu
      media={item}
      onEdit={(id) => {
        window.location.href = `/admin/media/${id}`;
      }}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
      onMove={onMove}
      onRename={onRename}
      onPreview={onPreview}
      onDownload={onDownload}
      onCopyUrl={onCopyUrl}
      onCopyPath={onCopyPath}
      onToggleFeatured={onToggleFeatured}
    >
      <TableRow
        className={cn(
          'cursor-pointer transition-colors hover:bg-muted/50',
          isSelected && 'bg-primary/10',
          isDragged && 'opacity-50'
        )}
        onClick={(e) => item.id && onItemClick(e, item.id, index)}
        draggable={!!item.id}
        onDragStart={(e) => item.id && onDragStart(e, item.id)}
        onDragEnd={onDragEnd}
        role="row"
        tabIndex={0}
        aria-label={`Select ${item.title}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (item.id) onItemClick(e as any, item.id, index);
          }
        }}
      >
        <TableCell onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              e.stopPropagation();
              if (item.id) onToggleSelect(item.id);
            }}
            className="rounded"
          />
        </TableCell>
        <TableCell>
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
            {item.type === 'IMAGE' ? (
              <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <div
                className={cn(
                  'w-full h-full flex items-center justify-center',
                  getMediaTypeColor(item.type),
                  'bg-opacity-20'
                )}
              >
                {MediaIcon ? <MediaIcon size={24} className="text-primary" /> : null}
              </div>
            )}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-col gap-1">
            <strong className="font-semibold text-foreground">{item.title}</strong>
            <small className="text-xs text-muted-foreground font-mono">{item.url}</small>
          </div>
        </TableCell>
        <TableCell>
          <Badge
            variant="outline"
            className={cn(
              'text-white border-0 flex items-center gap-1.5 uppercase text-xs font-semibold w-fit',
              getMediaTypeColor(item.type)
            )}
          >
            {MediaIcon && <MediaIcon size={14} />}
            {item.type}
          </Badge>
        </TableCell>
        <TableCell>{formatFileSize(item.size)}</TableCell>
        <TableCell>{formatDate(item.createdAt)}</TableCell>
        <TableCell>
          {item.featured && StarIcon ? (
            <StarIcon 
              size={16} 
              className="text-yellow-400 fill-yellow-400" 
              title="Featured"
            />
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </TableCell>
        <TableCell>
          {(() => {
            const tags = item.tags && isStringArray(item.tags) ? item.tags : null;
            return tags && tags.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {tags.slice(0, 3).map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground">-</span>
            );
          })()}
        </TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
              <a href={item.url} target="_blank" rel="noopener noreferrer" title="View media">
                {ExternalLinkIcon ? <ExternalLinkIcon size={16} /> : null}
              </a>
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => onPreview(item.id!)} title="Preview">
              {ImageIcon ? <ImageIcon size={16} /> : null}
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
              <a href={`/admin/media/${item.id}`} data-astro-prefetch title="Edit media">
                {EditIcon ? <EditIcon size={16} /> : null}
              </a>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-destructive hover:text-destructive"
              onClick={() => onDelete(item.id!)}
              title="Delete media"
            >
              {Trash2Icon ? <Trash2Icon size={16} /> : null}
            </Button>
          </div>
        </TableCell>
      </TableRow>
    </MediaContextMenu>
  );
}
