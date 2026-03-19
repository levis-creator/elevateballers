import { useState, useEffect } from 'react';
import type { Media, MediaType } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, AlertCircle, FileText, Loader2, Upload, X, Link2 } from 'lucide-react';

interface Folder {
  id: string;
  name: string;
  isPrivate: boolean;
}

interface FileUsage {
  id: string;
  entityType: string;
  entityId: string;
  fieldName: string;
}

interface MediaEditorProps {
  mediaId?: string;
}

export default function MediaEditor({ mediaId }: MediaEditorProps) {
  const [loading, setLoading] = useState(!!mediaId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [fileUsage, setFileUsage] = useState<FileUsage[]>([]);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Store selected file for upload on submit
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // Local preview URL
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    type: 'IMAGE' as MediaType,
    thumbnail: '',
    tags: '',
    folderId: 'none', // Use 'none' instead of empty string for Radix Select compatibility
  });

  useEffect(() => {
    const initializeEditor = async () => {
      const foldersData = await fetchFolders();
      
      // Read folderId from URL query params if creating new media
      if (!mediaId) {
        const urlParams = new URLSearchParams(window.location.search);
        const folderIdFromUrl = urlParams.get('folderId');
        if (folderIdFromUrl) {
          // Verify the folder exists in the fetched folders list
          const folderExists = foldersData.some((f: Folder) => f.id === folderIdFromUrl);
          if (folderExists) {
            setFormData((prev) => ({ ...prev, folderId: folderIdFromUrl }));
          } else {
            // If folder doesn't exist, default to 'none'
            setFormData((prev) => ({ ...prev, folderId: 'none' }));
          }
        }
      } else {
        fetchMedia();
        fetchFileUsage();
      }
    };
    
    initializeEditor();
    
    // Cleanup preview URL on unmount
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [mediaId]);

  // Auto-populate thumbnail for images when URL or type changes
  useEffect(() => {
    if (formData.type === 'IMAGE' && formData.url) {
      // Only auto-populate if thumbnail is empty or matches the previous URL
      // This allows users to manually override if needed
      setFormData((prev) => {
        if (!prev.thumbnail || prev.thumbnail === prev.url) {
          return { ...prev, thumbnail: prev.url };
        }
        return prev;
      });
    }
  }, [formData.type, formData.url]);

  const fetchFolders = async () => {
    try {
      const response = await fetch('/api/folders?includePrivate=true');
      if (response.ok) {
        const data = await response.json();
        setFolders(data);
        return data;
      }
    } catch (err) {
      console.error('Failed to fetch folders:', err);
    }
    return [];
  };

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/media/${mediaId}`);
      if (!response.ok) throw new Error('Failed to fetch media');
      const media: any = await response.json();

      setFormData({
        title: media.title,
        url: media.url,
        type: media.type,
        thumbnail: media.thumbnail || '',
        tags: media.tags ? (Array.isArray(media.tags) ? media.tags.join(', ') : media.tags) : '',
        folderId: media.folderId || 'none', // Use 'none' instead of empty string
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  const fetchFileUsage = async () => {
    if (!mediaId) return;
    try {
      setLoadingUsage(true);
      const response = await fetch(`/api/file-usage?mediaId=${mediaId}`);
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

  const handleFileSelect = (file: File | null) => {
    if (file) {
      setSelectedFile(file);
      // Create local preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      // Clear URL field when file is selected
      setFormData((prev) => ({
        ...prev,
        url: '',
        thumbnail: '',
      }));
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  const handleUrlChange = (url: string) => {
    // Clear file selection when URL is entered
    if (url) {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
    setFormData((prev) => {
      let newThumbnail = prev.thumbnail;
      if (prev.type === 'IMAGE' && url) {
        // Auto-populate thumbnail for images
        if (!prev.thumbnail || prev.thumbnail === prev.url) {
          newThumbnail = url;
        }
      }
      return { ...prev, url, thumbnail: newThumbnail };
    });
  };

  const uploadFile = async (file: File): Promise<{ url: string; mediaId?: string }> => {
    // Compress image on client side first
    let fileToUpload = file;
    try {
      const imageCompression = (await import('browser-image-compression')).default;
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        quality: 0.8,
        fileType: file.type,
      });
      fileToUpload = compressedFile;
    } catch (err) {
      console.warn('Client-side compression failed, using original file:', err);
    }

    const formDataToSend = new FormData();
    formDataToSend.append('file', fileToUpload, file.name);
    
    // Get folder name from selected folder
    const folderName = formData.folderId !== 'none' && formData.folderId
      ? folders.find(f => f.id === formData.folderId)?.name || 'general'
      : 'general';
    
    formDataToSend.append('folder', folderName);
    formDataToSend.append('title', formData.title || file.name);

    const response = await fetch('/api/upload/image', {
      method: 'POST',
      body: formDataToSend,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload image');
    }

    const data = await response.json();
    // Return both URL and mediaId (if the upload endpoint created a media record)
    return { url: data.url, mediaId: data.id };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      let finalUrl = formData.url;
      let finalThumbnail = formData.thumbnail;
      let uploadedMediaId: string | undefined;

      // Upload file if one is selected
      if (selectedFile && formData.type === 'IMAGE') {
        try {
          const uploadResult = await uploadFile(selectedFile);
          finalUrl = uploadResult.url;
          uploadedMediaId = uploadResult.mediaId; // The upload endpoint already created a media record
          finalThumbnail = finalUrl; // Auto-set thumbnail for uploaded images
        } catch (uploadError: any) {
          throw new Error(`Failed to upload image: ${uploadError.message}`);
        }
      }

      // Validate that we have a URL or file
      if (!finalUrl && !selectedFile) {
        throw new Error('Please provide an image URL or select a file to upload');
      }
      
      // If file is selected but upload failed, throw error
      if (selectedFile && !finalUrl) {
        throw new Error('Failed to upload image file');
      }

      // If a file was uploaded, the upload endpoint already created a media record
      // So we should UPDATE that record instead of creating a new one
      const targetMediaId = uploadedMediaId || mediaId;

      if (targetMediaId) {
        // Updating existing media (either the one we just uploaded or an existing one)
        const tags = formData.tags
          ? formData.tags.split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0)
          : [];

        const payload = {
          ...formData,
          url: finalUrl,
          thumbnail: finalThumbnail || undefined,
          tags,
          folderId: formData.folderId === 'none' ? undefined : formData.folderId || undefined,
        };

        const response = await fetch(`/api/media/${targetMediaId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update media');
        }
      } else {
        // Creating new media (only when no file was uploaded - URL-only media)
        const tags = formData.tags
          ? formData.tags.split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0)
          : [];

        const payload = {
          ...formData,
          url: finalUrl,
          thumbnail: finalThumbnail || undefined,
          tags,
          folderId: formData.folderId === 'none' ? undefined : formData.folderId || undefined,
        };

        const response = await fetch('/api/media', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create media');
        }
      }

      // Clean up preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      // Redirect to media gallery
      window.location.href = '/admin/media';
    } catch (err: any) {
      setError(err.message || 'Failed to save media');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  const types: MediaType[] = ['IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT'];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-6 border-b">
        <div>
          <h1 className="text-3xl font-heading font-semibold mb-2 text-foreground">
            {mediaId ? 'Edit Media' : 'Add New Media'}
          </h1>
          <p className="text-muted-foreground">
            {mediaId ? 'Update media information' : 'Add a new media item to the gallery'}
          </p>
        </div>
        <Button variant="outline" asChild>
          <a href="/admin/media" data-astro-prefetch>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Gallery
          </a>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Media Information</CardTitle>
          <CardDescription>Enter the details for this media item</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                required
                disabled={saving}
                placeholder="Media title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">
                Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) => {
                  const newType = value as MediaType;
                  setFormData((prev) => {
                    // Auto-populate thumbnail for images when type changes to IMAGE
                    let newThumbnail = prev.thumbnail;
                    if (newType === 'IMAGE' && prev.url) {
                      // Only auto-populate if thumbnail is empty or matches URL
                      if (!prev.thumbnail || prev.thumbnail === prev.url) {
                        newThumbnail = prev.url;
                      }
                    }
                    return { ...prev, type: newType, thumbnail: newThumbnail };
                  });
                }}
                disabled={saving}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select media type" />
                </SelectTrigger>
                <SelectContent>
                  {types.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Folder Selector - Show before upload so users can select folder first */}
            <div className="space-y-2">
              <Label htmlFor="folder">Folder</Label>
              <Select
                value={formData.folderId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, folderId: value }))}
                disabled={saving}
              >
                <SelectTrigger id="folder">
                  <SelectValue placeholder="Select a folder (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Folder</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name} {folder.isPrivate && '(Private)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Select a folder to organize your media. Files uploaded will be saved to this folder.
              </p>
            </div>

            {/* URL Input or File Upload - Show custom file input for IMAGE type */}
            {formData.type === 'IMAGE' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <Button
                    type="button"
                    variant={!selectedFile && !formData.url ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      setFormData((prev) => ({ ...prev, url: '', thumbnail: '' }));
                    }}
                    disabled={saving}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload File
                  </Button>
                  <Button
                    type="button"
                    variant={formData.url && !selectedFile ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    disabled={saving}
                  >
                    <Link2 className="mr-2 h-4 w-4" />
                    Enter URL
                  </Button>
                </div>

                {selectedFile || previewUrl ? (
                  <div className="space-y-2">
                    <Label>
                      Image Preview <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative border rounded-lg overflow-hidden bg-muted">
                      <img
                        src={previewUrl || formData.url}
                        alt="Preview"
                        className="w-full max-h-[300px] object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      {selectedFile && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => handleFileSelect(null)}
                          disabled={saving}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {selectedFile && (
                      <p className="text-sm text-muted-foreground">
                        File selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        <br />
                        <strong>File will be uploaded when you click "Add Media"</strong>
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="file-input">
                      Image <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <input
                        id="file-input"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileSelect(file);
                          }
                        }}
                        disabled={saving}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          document.getElementById('file-input')?.click();
                        }}
                        disabled={saving}
                        className="w-full"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Choose Image File
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Select an image file. It will be uploaded when you click "Add Media"
                    </p>
                  </div>
                )}

                {!selectedFile && (
                  <div className="space-y-2">
                    <Label htmlFor="url">
                      Or Enter URL <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="url"
                      type="text"
                      value={formData.url}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      required={!selectedFile}
                      disabled={saving}
                      placeholder="https://example.com/image.jpg or /uploads/..."
                    />
                    <p className="text-sm text-muted-foreground">
                      Enter a full URL or relative path to an image
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="url">
                  URL <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => {
                    const newUrl = e.target.value;
                    setFormData((prev) => {
                      // Auto-populate thumbnail for images (only if it was empty or matched old URL)
                      let newThumbnail = prev.thumbnail;
                      if (prev.type === 'IMAGE' && newUrl) {
                        // If thumbnail was empty or matched the old URL, sync it with new URL
                        if (!prev.thumbnail || prev.thumbnail === prev.url) {
                          newThumbnail = newUrl;
                        }
                      }
                      return { ...prev, url: newUrl, thumbnail: newThumbnail };
                    });
                  }}
                  required
                  disabled={saving}
                  placeholder="https://example.com/image.jpg"
                />
                <p className="text-sm text-muted-foreground">
                  Full URL to the media file (image, video, or audio)
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="thumbnail">
                Thumbnail URL
                {formData.type === 'IMAGE' && formData.thumbnail === formData.url && formData.url && (
                  <span className="ml-2 text-xs text-muted-foreground font-normal">(auto-generated)</span>
                )}
              </Label>
              <Input
                id="thumbnail"
                type="text"
                value={formData.thumbnail}
                onChange={(e) => setFormData((prev) => ({ ...prev, thumbnail: e.target.value }))}
                disabled={saving}
                placeholder={formData.type === 'IMAGE' && formData.url ? 'Auto-generated from URL' : 'https://example.com/thumbnail.jpg or /uploads/...'}
              />
              <p className="text-sm text-muted-foreground">
                {formData.type === 'IMAGE' 
                  ? 'Thumbnail is automatically set to the same URL as the image. You can override it if needed. Accepts both full URLs and relative paths.'
                  : 'Optional thumbnail URL (useful for videos and audio). Accepts both full URLs and relative paths.'}
              </p>
            </div>


            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                disabled={saving}
                placeholder="tag1, tag2, tag3"
              />
              <p className="text-sm text-muted-foreground">
                Comma-separated tags for organizing media
              </p>
            </div>

            {formData.url && formData.type === 'IMAGE' && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="border rounded-lg overflow-hidden">
                  <img
                    src={formData.url}
                    alt="Preview"
                    className="w-full max-h-[300px] object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}

            {/* File Usage Display (only when editing) */}
            {mediaId && (
              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label>File Usage</Label>
                  {loadingUsage && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
                {fileUsage.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      This file is currently being used in:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {fileUsage.map((usage) => (
                        <Badge key={usage.id} variant="secondary" className="flex items-center gap-1">
                          <FileText size={12} />
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
            )}

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : mediaId ? 'Update Media' : 'Add Media'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <a href="/admin/media" data-astro-prefetch>
                  Cancel
                </a>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
