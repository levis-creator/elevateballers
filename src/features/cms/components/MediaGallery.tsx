import { useState, useEffect, type ComponentType } from 'react';
import type { Media, MediaType } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export default function MediaGallery() {
  const [mediaItems, setMediaItems] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [icons, setIcons] = useState<{
    Plus?: ComponentType<any>;
    Search?: ComponentType<any>;
    List?: ComponentType<any>;
    Grid?: ComponentType<any>;
    Edit?: ComponentType<any>;
    Trash2?: ComponentType<any>;
    Images?: ComponentType<any>;
    Image?: ComponentType<any>;
    Video?: ComponentType<any>;
    Music?: ComponentType<any>;
    AlertCircle?: ComponentType<any>;
    ExternalLink?: ComponentType<any>;
    RefreshCw?: ComponentType<any>;
  }>({});

  useEffect(() => {
    import('lucide-react').then((mod) => {
      setIcons({
        Plus: mod.Plus,
        Search: mod.Search,
        List: mod.List,
        Grid: mod.Grid,
        Edit: mod.Edit,
        Trash2: mod.Trash2,
        Images: mod.Images,
        Image: mod.Image,
        Video: mod.Video,
        Music: mod.Music,
        AlertCircle: mod.AlertCircle,
        ExternalLink: mod.ExternalLink,
        RefreshCw: mod.RefreshCw,
      });
    });
  }, []);

  useEffect(() => {
    fetchMedia();
  }, [filterType]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const type = filterType === 'all' ? undefined : filterType.toUpperCase();
      const response = await fetch(`/api/media${type ? `?type=${type}` : ''}`);
      if (!response.ok) throw new Error('Failed to fetch media');
      const data = await response.json();
      setMediaItems(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this media item?\n\nThis action cannot be undone.'
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/media/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete media');
      
      setError('');
      fetchMedia();
    } catch (err: any) {
      setError('Error deleting media: ' + err.message);
      setTimeout(() => setError(''), 5000);
    }
  };

  const getMediaTypeColor = (type: MediaType) => {
    const colors: Record<MediaType, string> = {
      IMAGE: 'bg-primary',
      VIDEO: 'bg-red-500',
      AUDIO: 'bg-green-500',
    };
    return colors[type] || 'bg-slate-500';
  };

  const getMediaIcon = (type: MediaType) => {
    if (type === 'IMAGE') return icons.Image;
    if (type === 'VIDEO') return icons.Video;
    if (type === 'AUDIO') return icons.Music;
    return null;
  };

  const filteredMedia = mediaItems.filter((item) =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.tags && item.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const PlusIcon = icons.Plus;
  const SearchIcon = icons.Search;
  const ListIcon = icons.List;
  const GridIcon = icons.Grid;
  const EditIcon = icons.Edit;
  const Trash2Icon = icons.Trash2;
  const ImagesIcon = icons.Images;
  const ImageIcon = icons.Image;
  const VideoIcon = icons.Video;
  const MusicIcon = icons.Music;
  const ExternalLinkIcon = icons.ExternalLink;
  const AlertCircleIcon = icons.AlertCircle;
  const RefreshCwIcon = icons.RefreshCw;

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center gap-4">
            {AlertCircleIcon ? <AlertCircleIcon size={24} className="text-destructive" /> : null}
            <div>
              <p className="font-semibold mb-2">Error Loading Media</p>
              <p className="text-muted-foreground">{error}</p>
            </div>
            <Button onClick={fetchMedia} variant="default">
              {RefreshCwIcon ? <RefreshCwIcon size={18} className="mr-2" /> : null}
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-6 border-b">
        <div>
          <h1 className="text-3xl font-heading font-semibold mb-2 text-foreground">Media Gallery</h1>
          <p className="text-muted-foreground">Manage images, videos, and audio files</p>
        </div>
        <Button asChild>
          <a href="/admin/media/new" data-astro-prefetch>
            {PlusIcon ? <PlusIcon size={18} className="mr-2" /> : null}
            Add Media
          </a>
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        <div className="relative flex-1">
          <label htmlFor="media-search" className="sr-only">Search media</label>
          {SearchIcon ? (
            <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          ) : null}
          <Input
            id="media-search"
            type="text"
            placeholder="Search media..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            aria-label="Search media by title or tags"
          />
        </div>
        <div className="flex gap-2 bg-background p-1 rounded-lg border">
          <Button
            variant={filterType === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilterType('all')}
            aria-label="Show all media"
            aria-pressed={filterType === 'all'}
          >
            All
          </Button>
          <Button
            variant={filterType === 'image' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilterType('image')}
            aria-label="Filter images"
            aria-pressed={filterType === 'image'}
          >
            {ImageIcon ? <ImageIcon size={16} className="mr-2" /> : null}
            Images
          </Button>
          <Button
            variant={filterType === 'video' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilterType('video')}
            aria-label="Filter videos"
            aria-pressed={filterType === 'video'}
          >
            {VideoIcon ? <VideoIcon size={16} className="mr-2" /> : null}
            Videos
          </Button>
          <Button
            variant={filterType === 'audio' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilterType('audio')}
            aria-label="Filter audio"
            aria-pressed={filterType === 'audio'}
          >
            {MusicIcon ? <MusicIcon size={16} className="mr-2" /> : null}
            Audio
          </Button>
        </div>
        <div className="flex gap-2 bg-background p-1 rounded-lg border">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
            title="Grid View"
            aria-label="Switch to grid view"
            aria-pressed={viewMode === 'grid'}
          >
            {GridIcon ? <GridIcon size={16} /> : null}
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
            title="List View"
            aria-label="Switch to list view"
            aria-pressed={viewMode === 'list'}
          >
            {ListIcon ? <ListIcon size={16} /> : null}
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {filteredMedia.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="text-muted-foreground">
                {ImagesIcon ? <ImagesIcon size={64} /> : null}
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  {searchTerm || filterType !== 'all' ? 'No media found' : 'No media yet'}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm || filterType !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Add your first media item to get started'}
                </p>
              </div>
              {!searchTerm && filterType === 'all' && (
                <Button asChild>
                  <a href="/admin/media/new" data-astro-prefetch>
                    {PlusIcon ? <PlusIcon size={18} className="mr-2" /> : null}
                    Add Media
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMedia.map((item) => {
            const MediaIcon = getMediaIcon(item.type);
            return (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative w-full h-48 bg-muted overflow-hidden">
                  {item.type === 'IMAGE' ? (
                    <img
                      src={item.url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className={cn('w-full h-full flex items-center justify-center', getMediaTypeColor(item.type), 'bg-opacity-20')}>
                      {MediaIcon ? <MediaIcon size={48} className="text-primary" /> : null}
                    </div>
                  )}
                  <Badge
                    variant="outline"
                    className={cn(
                      'absolute top-2 right-2 text-white border-0 flex items-center gap-1.5 uppercase text-xs font-semibold',
                      getMediaTypeColor(item.type)
                    )}
                  >
                    {MediaIcon ? <MediaIcon size={14} /> : null}
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
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.tags.slice(0, 3).map((tag: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {item.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{item.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                  <div className="flex justify-end gap-2 pt-3 border-t">
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <a href={item.url} target="_blank" rel="noopener noreferrer" title="View">
                        {ExternalLinkIcon ? <ExternalLinkIcon size={16} /> : null}
                      </a>
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
                      onClick={() => handleDelete(item.id!)}
                      title="Delete"
                    >
                      {Trash2Icon ? <Trash2Icon size={16} /> : null}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* List View */
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Preview</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMedia.map((item) => {
                const MediaIcon = getMediaIcon(item.type);
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                        {item.type === 'IMAGE' ? (
                          <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className={cn('w-full h-full flex items-center justify-center', getMediaTypeColor(item.type), 'bg-opacity-20')}>
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
                        {MediaIcon ? <MediaIcon size={14} /> : null}
                        {item.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.tags && item.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {item.tags.slice(0, 3).map((tag: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
                          <a href={item.url} target="_blank" rel="noopener noreferrer" title="View media">
                            {ExternalLinkIcon ? <ExternalLinkIcon size={16} /> : null}
                          </a>
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
                          onClick={() => handleDelete(item.id!)}
                          title="Delete media"
                        >
                          {Trash2Icon ? <Trash2Icon size={16} /> : null}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
