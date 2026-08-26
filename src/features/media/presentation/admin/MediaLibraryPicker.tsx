import * as React from 'react';
import { Search, Loader2, Image as ImageIcon, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { MediaWithFolderAndUploader } from '../../types';

interface MediaLibraryPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
  title?: string;
}

export function MediaLibraryPicker({
  open,
  onOpenChange,
  onSelect,
  title = 'Select Image from Library',
}: MediaLibraryPickerProps) {
  const [items, setItems] = React.useState<MediaWithFolderAndUploader[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [selectedUrl, setSelectedUrl] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => void fetchMedia(1, searchTerm), searchTerm ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [open, searchTerm]);

  const fetchMedia = async (requestedPage = 1, query = searchTerm) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ type: 'IMAGE', page: String(requestedPage), limit: '32' });
      if (query.trim()) params.set('q', query.trim());
      const response = await fetch(`/api/media?${params}`);
      if (!response.ok) throw new Error('Failed to fetch media');
      const data = await response.json();
      setItems(Array.isArray(data) ? data : data.items || []);
      setPage(Array.isArray(data) ? requestedPage : data.page || requestedPage);
      setTotalPages(Array.isArray(data) ? 1 : Math.max(1, data.totalPages || 1));
    } catch (err) {
      console.error('Error fetching media:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.tags &&
        Array.isArray(item.tags) &&
        item.tags.some(
          (tag) => typeof tag === 'string' && tag.toLowerCase().includes(searchTerm.toLowerCase())
        ))
  );

  const handleSelect = () => {
    if (selectedUrl) {
      onSelect(selectedUrl);
      onOpenChange(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      formData.append('folder', 'general');

      const response = await fetch('/api/media/batch-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload images');
      }

      const data = await response.json();
      const firstSuccess = Array.isArray(data.results)
        ? data.results.find((r: { url?: string; error?: string }) => r.url && !r.error)
        : null;

      await fetchMedia(1, searchTerm);

      if (firstSuccess?.url) {
        setSelectedUrl(firstSuccess.url);
      }
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col border-white/10 bg-[#111010] text-[#f3efe9] shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 my-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a817a]" />
            <Input
              placeholder="Search images..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-white/10 bg-[#181616] text-[#f3efe9] placeholder:text-[#8a817a] pl-10 focus-visible:ring-[#e4002b] focus-visible:ring-offset-0"
            />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFilesSelected}
          />
          <Button variant="outline" className="border-white/10 bg-[#181616] text-[#b8afa6] hover:bg-white/10 hover:text-[#f3efe9]" onClick={handleUploadClick} disabled={uploading}>
            {uploading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </span>
            ) : (
              'Upload Images'
            )}
          </Button>
        </div>

        {uploadError && <p className="text-sm text-[#ff6b81] mt-1">{uploadError}</p>}

        <div className="flex-1 overflow-y-auto pr-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-[#8a817a]">Loading library...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <ImageIcon className="h-12 w-12 text-[#8a817a] mb-2" />
              <p className="text-lg font-semibold">No images found</p>
              <p className="text-[#8a817a]">
                Try a different search term or upload new media.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'group relative aspect-square rounded-lg border-2 overflow-hidden cursor-pointer transition-all hover:scale-105 bg-[#181616]',
                    selectedUrl === item.url
                      ? 'border-primary ring-2 ring-primary ring-offset-2'
                      : 'border-white/10 hover:border-[#8a817a]'
                  )}
                  onClick={() => setSelectedUrl(item.url)}
                >
                  <img
                    src={item.thumbnail || item.url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {selectedUrl === item.url && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <div className="bg-primary text-primary-foreground rounded-full p-1 shadow-lg">
                        <Check className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[10px] text-white truncate text-center font-medium">
                      {item.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/10 pt-3 text-sm text-[#8a817a]">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-white/10 bg-[#181616] text-[#b8afa6] hover:bg-white/10 hover:text-[#f3efe9]" disabled={page <= 1} onClick={() => void fetchMedia(page - 1, searchTerm)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" className="border-white/10 bg-[#181616] text-[#b8afa6] hover:bg-white/10 hover:text-[#f3efe9]" disabled={page >= totalPages} onClick={() => void fetchMedia(page + 1, searchTerm)}>
                Next
              </Button>
            </div>
          </div>
        )}

        <DialogFooter className="border-t border-white/10 pt-4">
          <Button variant="outline" className="border-white/10 bg-[#181616] text-[#b8afa6] hover:bg-white/10 hover:text-[#f3efe9]" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSelect} disabled={!selectedUrl}>
            Select Image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default MediaLibraryPicker;
