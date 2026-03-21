import { useState, useEffect, type ComponentType } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { MediaWithFolderAndUploader } from '../../types';
import { getMediaTypeColor, getMediaIcon, isStringArray } from '../../utils/mediaUtils';
import MediaContextMenu from './MediaContextMenu';

interface MediaItemProps {
  item: MediaWithFolderAndUploader;
  index: number;
  isSelected: boolean;
  isDragged: boolean;
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

export default function MediaItem({
  item,
  index,
  isSelected,
  isDragged,
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
}: MediaItemProps) {
  const [icons, setIcons] = useState<{
    Check?: ComponentType<any>;
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
        Check: mod.Check,
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

  const CheckIcon = icons.Check;
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
      <Card
        className={cn(
          'overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:scale-[1.02]',
          isSelected && 'ring-2 ring-primary ring-offset-2 shadow-lg',
          isDragged && 'opacity-50'
        )}
        onClick={(e) => item.id && onItemClick(e, item.id, index)}
        draggable={!!item.id}
        onDragStart={(e) => item.id && onDragStart(e, item.id)}
        onDragEnd={onDragEnd}
        role="button"
        tabIndex={0}
        aria-label={`Select ${item.title}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (item.id) onItemClick(e as any, item.id, index);
          }
        }}
      >
        {/* Selection checkbox */}
        {isSelected && (
          <div className="absolute top-2 left-2 z-10 bg-primary text-primary-foreground rounded-full p-1">
            {CheckIcon ? <CheckIcon size={16} /> : null}
          </div>
        )}
        {/* Featured indicator */}
        {item.featured && (
          <div className="absolute top-2 left-2 z-10 bg-yellow-400 text-yellow-900 rounded-full p-1">
            {StarIcon ? <StarIcon size={16} className="fill-current" /> : null}
          </div>
        )}
        <div className="relative w-full h-48 bg-muted overflow-hidden">
          {item.type === 'IMAGE' ? (
            <img
              src={item.url}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div
              className={cn(
                'w-full h-full flex items-center justify-center',
                getMediaTypeColor(item.type),
                'bg-opacity-20'
              )}
            >
              {MediaIcon && <MediaIcon size={48} className="text-primary" />}
            </div>
          )}
          <Badge
            variant="outline"
            className={cn(
              'absolute top-2 right-2 text-white border-0 flex items-center gap-1.5 uppercase text-xs font-semibold',
              getMediaTypeColor(item.type)
            )}
          >
            {MediaIcon && <MediaIcon size={14} />}
            {item.type}
          </Badge>
          {item.thumbnail && item.type !== 'IMAGE' && (
            <img
              src={item.thumbnail}
              alt={item.title}
              className="absolute inset-0 w-full h-full object-cover opacity-30"
            />
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2 text-foreground line-clamp-2">{item.title}</h3>
          {(() => {
            const tags = item.tags && isStringArray(item.tags) ? item.tags : null;
            return tags && tags.length > 0 ? (
              <div className="flex flex-wrap gap-1 mb-3">
                {tags.slice(0, 3).map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{tags.length - 3}
                  </Badge>
                )}
              </div>
            ) : null;
          })()}
          <div className="flex justify-end gap-2 pt-3 border-t" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <a href={item.url} target="_blank" rel="noopener noreferrer" title="View">
                {ExternalLinkIcon ? <ExternalLinkIcon size={16} /> : null}
              </a>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                if (item.id) onPreview(item.id);
              }}
              title="Preview"
            >
              {ImageIcon ? <ImageIcon size={16} /> : null}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <a href={`/admin/media/${item.id}`} data-astro-prefetch title="Edit">
                {EditIcon ? <EditIcon size={16} /> : null}
              </a>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(item.id!)}
              title="Delete"
            >
              {Trash2Icon ? <Trash2Icon size={16} /> : null}
            </Button>
          </div>
        </CardContent>
      </Card>
    </MediaContextMenu>
  );
}
