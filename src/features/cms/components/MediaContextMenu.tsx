import { useState, useEffect } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Edit, Trash2, Copy, Move, Download, ExternalLink, FileText, Link2, FileCode, Star } from 'lucide-react';

interface MediaContextMenuProps {
  media: any;
  children: React.ReactNode;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onMove?: (id: string) => void;
  onRename?: (id: string) => void;
  onPreview?: (id: string) => void;
  onDownload?: (url: string, filename: string) => void;
  onCopyUrl?: (url: string) => void;
  onCopyPath?: (filePath: string | null) => void;
  onToggleFeatured?: (id: string) => void;
}

export default function MediaContextMenu({
  media,
  children,
  onEdit,
  onDelete,
  onDuplicate,
  onMove,
  onRename,
  onPreview,
  onDownload,
  onCopyUrl,
  onCopyPath,
  onToggleFeatured,
}: MediaContextMenuProps) {
  const handleDownload = () => {
    if (onDownload && media.url) {
      onDownload(media.url, media.title || 'file');
    } else if (media.url) {
      // Fallback: open in new tab
      window.open(media.url, '_blank');
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {onPreview && (
          <ContextMenuItem onClick={() => onPreview(media.id)}>
            <FileText className="mr-2 h-4 w-4" />
            Preview
          </ContextMenuItem>
        )}
        <ContextMenuItem onClick={() => window.open(media.url, '_blank')}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Open
        </ContextMenuItem>
        {onDownload && (
          <ContextMenuItem onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </ContextMenuItem>
        )}
        {onCopyUrl && media.url && (
          <ContextMenuItem onClick={() => onCopyUrl(media.url)}>
            <Link2 className="mr-2 h-4 w-4" />
            Copy URL
          </ContextMenuItem>
        )}
        {onCopyPath && media.filePath && (
          <ContextMenuItem onClick={() => onCopyPath(media.filePath)}>
            <FileCode className="mr-2 h-4 w-4" />
            Copy File Path
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        {onRename && (
          <ContextMenuItem onClick={() => onRename(media.id)}>
            <Edit className="mr-2 h-4 w-4" />
            Rename
          </ContextMenuItem>
        )}
        {onEdit && (
          <ContextMenuItem onClick={() => onEdit(media.id)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Details
          </ContextMenuItem>
        )}
        {onDuplicate && (
          <ContextMenuItem onClick={() => onDuplicate(media.id)}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </ContextMenuItem>
        )}
        {onMove && (
          <ContextMenuItem onClick={() => onMove(media.id)}>
            <Move className="mr-2 h-4 w-4" />
            Move to Folder
          </ContextMenuItem>
        )}
        {onToggleFeatured && (
          <ContextMenuItem onClick={() => onToggleFeatured(media.id)}>
            <Star className={`mr-2 h-4 w-4 ${media.featured ? 'fill-yellow-400 text-yellow-400' : ''}`} />
            {media.featured ? 'Unfeature' : 'Feature'}
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        {onDelete && (
          <ContextMenuItem
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this media item?')) {
                onDelete(media.id);
              }
            }}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
