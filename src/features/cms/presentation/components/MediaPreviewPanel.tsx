import { useEffect, useState, type ComponentType } from 'react';
import type { Media, MediaWithFolderAndUploader } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { X, ExternalLink, Edit, Trash2, FileText, Calendar, Folder, User, Image as ImageIcon, Save, Loader2 } from 'lucide-react';

interface MediaPreviewPanelProps {
  media: MediaWithFolderAndUploader | null;
  onClose: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function MediaPreviewPanel({ media, onClose, onEdit, onDelete }: MediaPreviewPanelProps) {
  const [fileUsage, setFileUsage] = useState<any[]>([]);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedTags, setEditedTags] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchFileUsage = async () => {
    if (!media?.id) return;
    try {
      setLoadingUsage(true);
      const response = await fetch(`/api/file-usage?mediaId=${media.id}`);
      if (response.ok) {
        const data = await response.json();
        setFileUsage(data.usage || []);
      }
    } catch (err) {
      console.error('Failed to fetch file usage:', err);
    } finally {
      setLoadingUsage(false);
    }
  };

  useEffect(() => {
    if (media?.id) {
      fetchFileUsage();
      setEditedTitle(media.title || '');
      const tags = media.tags && Array.isArray(media.tags) ? media.tags.join(', ') : '';
      setEditedTags(tags);
      setIsEditing(false); // Reset editing state when media changes
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media?.id, media?.title, media?.tags]);

  if (!media) return null;

  const formatFileSize = (bytes?: number | null): string => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Unknown';
    }
  };

  const getMediaTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      IMAGE: 'bg-primary',
      VIDEO: 'bg-red-500',
      AUDIO: 'bg-green-500',
      DOCUMENT: 'bg-amber-500',
    };
    return colors[type] || 'bg-slate-500';
  };

  const handleSaveMetadata = async () => {
    if (!media?.id) return;
    try {
      setSaving(true);
      const tagsArray = editedTags.split(',').map(t => t.trim()).filter(Boolean);
      const response = await fetch(`/api/media/${media.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editedTitle,
          tags: tagsArray,
        }),
      });

      if (!response.ok) throw new Error('Failed to update metadata');
      
      setIsEditing(false);
      // Refresh media data by calling onEdit or triggering a refresh
      if (onEdit) {
        onEdit(media.id);
      }
    } catch (err: any) {
      console.error('Failed to save metadata:', err);
      alert('Failed to save metadata: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-background border-l shadow-lg z-50 flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Media Details</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Preview */}
        {media.type === 'IMAGE' && (
          <div className="w-full aspect-video rounded-lg overflow-hidden bg-muted">
            <img
              src={media.url}
              alt={media.title}
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        {media.type === 'DOCUMENT' && media.mimeType === 'application/pdf' && (
          <div className="w-full aspect-video rounded-lg overflow-hidden border bg-muted">
            <iframe
              src={`${media.url}${media.url.includes('#') ? '&' : '#'}toolbar=1&navpanes=0`}
              title={media.title}
              className="h-full w-full"
            />
          </div>
        )}

        {/* Title */}
        <div>
          {isEditing ? (
            <div className="space-y-2">
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="text-xl font-semibold"
                placeholder="Media title"
              />
            </div>
          ) : (
            <h3 className="text-xl font-semibold mb-2">{media.title}</h3>
          )}
          <Badge
            variant="outline"
            className={`${getMediaTypeColor(media.type)} text-white border-0`}
          >
            {media.type}
          </Badge>
        </div>

        <Separator />

        {/* File Information */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" />
            File Information
          </h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Size:</span>
              <span className="font-medium">{formatFileSize(media.size)}</span>
            </div>
            {media.originalSize && media.size && media.originalSize !== media.size && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Original Size:</span>
                <span className="font-medium">{formatFileSize(media.originalSize)}</span>
              </div>
            )}
            {media.compressionRatio && media.compressionRatio > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Compression:</span>
                <span className="font-medium">{media.compressionRatio.toFixed(1)}%</span>
              </div>
            )}
            {media.mimeType && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium">{media.mimeType}</span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Metadata */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Metadata
          </h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created:</span>
              <span className="font-medium">{formatDate(media.createdAt as any)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Updated:</span>
              <span className="font-medium">{formatDate(media.updatedAt as any)}</span>
            </div>
            {(media as any).folder && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Folder className="h-3 w-3" />
                  Folder:
                </span>
                <Badge variant="secondary" className="font-medium">
                  {(media as any).folder.name}
                </Badge>
              </div>
            )}
            {(media as any).uploader && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Uploaded by:
                </span>
                <span className="font-medium">{(media as any).uploader.name || (media as any).uploader.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        <Separator />
        <div className="space-y-3">
          <h4 className="font-semibold">Tags</h4>
          {isEditing ? (
            <div className="space-y-2">
              <Input
                value={editedTags}
                onChange={(e) => setEditedTags(e.target.value)}
                placeholder="Comma-separated tags"
              />
              <p className="text-xs text-muted-foreground">
                Separate tags with commas
              </p>
            </div>
          ) : (
            media.tags && Array.isArray(media.tags) && media.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {media.tags.map((tag: string, idx: number) => (
                  <Badge key={idx} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No tags</p>
            )
          )}
        </div>

        {/* File Usage */}
        <Separator />
        <div className="space-y-3">
          <h4 className="font-semibold">File Usage</h4>
          {loadingUsage ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : fileUsage.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                This file is currently being used in:
              </p>
              <div className="flex flex-wrap gap-2">
                {fileUsage.map((usage) => (
                  <Badge key={usage.id} variant="secondary" className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {usage.entityType} ({usage.fieldName})
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              This file is not currently being used anywhere.
            </p>
          )}
        </div>

        {/* URLs */}
        <Separator />
        <div className="space-y-3">
          <h4 className="font-semibold">URLs</h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground block mb-1">URL:</span>
              <code className="block p-2 bg-muted rounded text-xs break-all">
                {media.url}
              </code>
            </div>
            {media.thumbnail && media.thumbnail !== media.url && (
              <div>
                <span className="text-muted-foreground block mb-1">Thumbnail:</span>
                <code className="block p-2 bg-muted rounded text-xs break-all">
                  {media.thumbnail}
                </code>
              </div>
            )}
            {(media as any).filePath && (
              <div>
                <span className="text-muted-foreground block mb-1">File Path:</span>
                <code className="block p-2 bg-muted rounded text-xs break-all">
                  {(media as any).filePath}
                </code>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t space-y-2">
        {isEditing ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                setIsEditing(false);
                setEditedTitle(media.title || '');
                const tags = media.tags && Array.isArray(media.tags) ? media.tags.join(', ') : '';
                setEditedTags(tags);
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              onClick={handleSaveMetadata}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <a href={media.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Metadata
              </Button>
            </div>
            {onDelete && (
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={() => {
                  onDelete(media.id!);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
