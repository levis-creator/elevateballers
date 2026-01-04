import { useState, useEffect } from 'react';
import type { Media, MediaType } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, AlertCircle } from 'lucide-react';

interface MediaEditorProps {
  mediaId?: string;
}

export default function MediaEditor({ mediaId }: MediaEditorProps) {
  const [loading, setLoading] = useState(!!mediaId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    type: 'IMAGE' as MediaType,
    thumbnail: '',
    tags: '',
  });

  useEffect(() => {
    if (mediaId) {
      fetchMedia();
    }
  }, [mediaId]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/media/${mediaId}`);
      if (!response.ok) throw new Error('Failed to fetch media');
      const media: Media = await response.json();

      setFormData({
        title: media.title,
        url: media.url,
        type: media.type,
        thumbnail: media.thumbnail || '',
        tags: media.tags ? media.tags.join(', ') : '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const url = mediaId ? `/api/media/${mediaId}` : '/api/media';
      const method = mediaId ? 'PUT' : 'POST';

      const tags = formData.tags
        ? formData.tags.split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0)
        : [];

      const payload = {
        ...formData,
        tags,
        thumbnail: formData.thumbnail || undefined,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save media');
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

  const types: MediaType[] = ['IMAGE', 'VIDEO', 'AUDIO'];

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
                onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value as MediaType }))}
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

            <div className="space-y-2">
              <Label htmlFor="url">
                URL <span className="text-destructive">*</span>
              </Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
                required
                disabled={saving}
                placeholder="https://example.com/image.jpg"
              />
              <p className="text-sm text-muted-foreground">
                Full URL to the media file (image, video, or audio)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnail">Thumbnail URL</Label>
              <Input
                id="thumbnail"
                type="url"
                value={formData.thumbnail}
                onChange={(e) => setFormData((prev) => ({ ...prev, thumbnail: e.target.value }))}
                disabled={saving}
                placeholder="https://example.com/thumbnail.jpg"
              />
              <p className="text-sm text-muted-foreground">
                Optional thumbnail URL (useful for videos and audio)
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
