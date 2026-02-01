import { useState, useEffect, useCallback, useRef, type ComponentType } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import FolderBrowser from './FolderBrowser';
import MediaPreviewPanel from './MediaPreviewPanel';
import MoveMediaDialog from './MoveMediaDialog';
import RenameMediaDialog from './RenameMediaDialog';
import MediaToolbar from './MediaToolbar';
import AdvancedFilters from './AdvancedFilters';
import UploadQueue from './UploadQueue';
import SelectionToolbar from './SelectionToolbar';
import MediaGrid from './MediaGrid';
import MediaList from './MediaList';
import { useMediaGalleryStore } from '../stores/mediaGalleryStore';
import { useMediaGallery } from '../hooks/useMediaGallery';
import { useMediaOperations } from '../hooks/useMediaOperations';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import type { MediaWithFolderAndUploader } from '../types';

export default function MediaGallery() {
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { searchInputRef } = useKeyboardShortcuts();

  // Zustand store state
  const {
    loading,
    error,
    viewMode,
    selectedItems,
    lastSelectedIndex,
    isDragging,
    previewMedia,
    advancedFiltersOpen,
    moveDialogOpen,
    renameDialogOpen,
    renameMediaId,
    renameMediaTitle,
    bulkRenameDialogOpen,
    bulkTagDialogOpen,
    selectedFolderId,
    sortField,
    sortDirection,
    filterType,
    setLoading,
    setError,
    setSelectedItems,
    setLastSelectedIndex,
    setPreviewMedia,
    setMoveDialogOpen,
    setRenameDialogOpen,
    setRenameMediaId,
    setRenameMediaTitle,
    setBulkRenameDialogOpen,
    setBulkTagDialogOpen,
    setSortField,
    setSortDirection,
    setIsDragging,
    setSelectedFolderId,
    mediaItems,
  } = useMediaGalleryStore();

  // Custom hooks
  const { fetchMedia, filteredMedia } = useMediaGallery();
  const {
    handleDelete,
    handleBulkDelete,
    handleBulkMove,
    handleRename,
    handleDuplicate,
    handleBulkDuplicate,
    handleBulkRename,
    handleBulkTag,
    handleFilesUpload,
    handleCopyUrl,
    handleCopyFilePath,
    handleDownload,
    handleExportZip,
    handleToggleFeatured,
    handleBulkToggleFeatured,
    handleBulkDownload,
  } = useMediaOperations();

  const {
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop: handleDropBase,
    handleDragStart,
    handleDragEnd,
    handleFolderDragOver,
    handleFolderDrop: handleFolderDropBase,
  } = useDragAndDrop();

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      await handleDropBase(e, fetchMedia, handleFilesUpload);
    },
    [handleDropBase, fetchMedia, handleFilesUpload]
  );

  const handleFolderDrop = useCallback(
    async (e: React.DragEvent, folderId: string) => {
      await handleFolderDropBase(e, folderId, handleBulkMove);
    },
    [handleFolderDropBase, handleBulkMove]
  );

  // Icons loading
  const [icons, setIcons] = useState<{
    Plus?: ComponentType<any>;
    Upload?: ComponentType<any>;
    Images?: ComponentType<any>;
    AlertCircle?: ComponentType<any>;
    RefreshCw?: ComponentType<any>;
  }>({});

  useEffect(() => {
    import('lucide-react').then((mod) => {
      setIcons({
        Plus: mod.Plus,
        Upload: mod.Upload,
        Images: mod.Images,
        AlertCircle: mod.AlertCircle,
        RefreshCw: mod.RefreshCw,
      });
    });
  }, []);

  // Fetch media on mount and when dependencies change
  useEffect(() => {
    fetchMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, selectedFolderId]); // Only depend on filterType and selectedFolderId, not fetchMedia itself

  // Handle item selection
  const handleItemClick = useCallback(
    (e: React.MouseEvent, itemId: string, index: number) => {
      if (e.shiftKey && lastSelectedIndex !== null) {
        // Range selection
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        const newSelection = new Set(selectedItems);
        filteredMedia.slice(start, end + 1).forEach((item) => {
          if (item.id) newSelection.add(item.id);
        });
        setSelectedItems(newSelection);
      } else if (e.ctrlKey || e.metaKey) {
        // Multi-select
        const newSelection = new Set(selectedItems);
        if (newSelection.has(itemId)) {
          newSelection.delete(itemId);
        } else {
          newSelection.add(itemId);
        }
        setSelectedItems(newSelection);
        setLastSelectedIndex(index);
      } else {
        // Single select or open preview
        if (e.target instanceof HTMLElement && (e.target.closest('a') || e.target.closest('button'))) {
          return; // Don't select if clicking on a link or button
        }
        setSelectedItems(new Set([itemId]));
        setLastSelectedIndex(index);
        const foundMedia = mediaItems.find((m) => m.id === itemId);
        setPreviewMedia(foundMedia ? (foundMedia as MediaWithFolderAndUploader) : null);
      }
    },
    [selectedItems, lastSelectedIndex, filteredMedia, mediaItems, setSelectedItems, setLastSelectedIndex, setPreviewMedia]
  );

  // Select all
  const handleSelectAll = useCallback(() => {
    if (selectedItems.size === filteredMedia.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredMedia.map((item) => item.id!).filter(Boolean)));
    }
  }, [selectedItems.size, filteredMedia, setSelectedItems]);

  // Toggle select
  const handleToggleSelect = useCallback(
    (id: string) => {
      const newSelection = new Set(selectedItems);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      setSelectedItems(newSelection);
    },
    [selectedItems, setSelectedItems]
  );

  // Handle file selection
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      const files = Array.from(e.target.files || []).filter((file) => {
        if (!file.type.startsWith('image/')) {
          addToast({
            description: `File ${file.name} is not an image. Only images are supported.`,
            variant: 'error',
          });
          return false;
        }
        if (file.size > MAX_FILE_SIZE) {
          addToast({
            description: `File ${file.name} is too large. Maximum size is 10MB.`,
            variant: 'error',
          });
          return false;
        }
        return true;
      });
      if (files.length > 0) {
        await handleFilesUpload(files, fetchMedia);
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleFilesUpload, fetchMedia, addToast]
  );


  // Handle sort
  const handleSort = useCallback(
    (field: 'title' | 'type' | 'size' | 'createdAt' | 'featured') => {
      if (sortField === field) {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setSortField(field);
        setSortDirection('asc');
      }
    },
    [sortField, sortDirection, setSortField, setSortDirection]
  );

  // Handle move click
  const handleMoveClick = useCallback(
    (mediaId?: string) => {
      if (mediaId) {
        setSelectedItems(new Set([mediaId]));
      }
      setMoveDialogOpen(true);
    },
    [setSelectedItems, setMoveDialogOpen]
  );

  // Handle rename click
  const handleRenameClick = useCallback(
    (mediaId: string) => {
      const media = mediaItems.find((m) => m.id === mediaId);
      if (media) {
        setRenameMediaId(mediaId);
        setRenameMediaTitle(media.title);
        setRenameDialogOpen(true);
      }
    },
    [mediaItems, setRenameMediaId, setRenameMediaTitle, setRenameDialogOpen]
  );

  // Handle preview
  const handlePreview = useCallback(
    (id: string) => {
      const media = mediaItems.find((m) => m.id === id);
      if (media) setPreviewMedia(media as MediaWithFolderAndUploader);
    },
    [mediaItems, setPreviewMedia]
  );

  // Keyboard shortcuts (Ctrl+A, Ctrl+C, etc.)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd + A: Select all
      if (ctrlOrCmd && e.key === 'a') {
        e.preventDefault();
        handleSelectAll();
      }
      // Ctrl/Cmd + C: Copy selected
      else if (ctrlOrCmd && e.key === 'c') {
        e.preventDefault();
        useMediaGalleryStore.getState().setClipboardItems(new Set(selectedItems));
        useMediaGalleryStore.getState().setClipboardMode('copy');
      }
      // Ctrl/Cmd + X: Cut selected
      else if (ctrlOrCmd && e.key === 'x') {
        e.preventDefault();
        useMediaGalleryStore.getState().setClipboardItems(new Set(selectedItems));
        useMediaGalleryStore.getState().setClipboardMode('cut');
      }
      // Ctrl/Cmd + V: Paste (move/copy)
      else if (ctrlOrCmd && e.key === 'v') {
        const state = useMediaGalleryStore.getState();
        if (state.clipboardItems.size > 0) {
          e.preventDefault();
          if (state.clipboardMode === 'cut') {
            handleBulkMove(Array.from(state.clipboardItems), selectedFolderId);
            state.setClipboardItems(new Set());
            state.setClipboardMode(null);
          } else if (state.clipboardMode === 'copy') {
            handleBulkDuplicate(Array.from(state.clipboardItems));
          }
        }
      }
      // Delete: Delete selected
      else if (e.key === 'Delete' && selectedItems.size > 0) {
        e.preventDefault();
        handleBulkDelete();
      }
      // F2: Rename selected (first item)
      else if (e.key === 'F2' && selectedItems.size === 1) {
        e.preventDefault();
        const firstId = Array.from(selectedItems)[0];
        handleRenameClick(firstId);
      }
      // Ctrl/Cmd + D: Duplicate selected
      else if (ctrlOrCmd && e.key === 'd' && selectedItems.size > 0) {
        e.preventDefault();
        handleBulkDuplicate(Array.from(selectedItems));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItems, selectedFolderId, handleSelectAll, handleBulkMove, handleBulkDuplicate, handleBulkDelete, handleRenameClick]);

  const PlusIcon = icons.Plus;
  const UploadIcon = icons.Upload;
  const ImagesIcon = icons.Images;
  const AlertCircleIcon = icons.AlertCircle;
  const RefreshCwIcon = icons.RefreshCw;

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  // Error state
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
    <div
      className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 relative"
      role="main"
      aria-label="Media Gallery"
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-6 border-b" role="banner">
        <div>
          <h1 className="text-3xl font-heading font-semibold mb-2 text-foreground">Media Gallery</h1>
          <p className="text-muted-foreground">Manage images, videos, and audio files</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              fileInputRef.current?.click();
            }}
          >
            {UploadIcon ? <UploadIcon size={18} className="mr-2" /> : null}
            Upload Files
          </Button>
          <Button asChild>
            <a href={`/admin/media/new${selectedFolderId ? `?folderId=${selectedFolderId}` : ''}`} data-astro-prefetch>
              {PlusIcon ? <PlusIcon size={18} className="mr-2" /> : null}
              Add Media
            </a>
          </Button>
        </div>
      </div>

      {/* Selection toolbar */}
      <SelectionToolbar 
        filteredMediaCount={filteredMedia.length} 
        filteredMedia={filteredMedia}
        onSelectAll={handleSelectAll} 
      />

      {/* Upload Queue */}
      <UploadQueue onRefresh={fetchMedia} />

      {/* Main Content with Folder Browser */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Folder Browser Sidebar */}
        <div className="lg:col-span-1">
          <FolderBrowser
            selectedFolderId={selectedFolderId}
            onFolderSelect={setSelectedFolderId}
            showCreateButton={true}
            onFolderDragOver={handleFolderDragOver}
            onFolderDrop={handleFolderDrop}
            dragOverFolderId={useMediaGalleryStore.getState().dragOverFolderId}
          />
        </div>

        {/* Media Gallery Content */}
        <div
          className={cn(
            'lg:col-span-3 space-y-4 md:space-y-6 relative transition-all',
            isDragging && 'ring-2 ring-primary ring-offset-2 rounded-lg p-2 md:p-4 bg-primary/5'
          )}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="region"
          aria-label="Media gallery content"
        >
          {/* Drag overlay */}
          {isDragging && (
            <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg z-10 flex items-center justify-center pointer-events-none animate-in fade-in-0 duration-200">
              <div className="text-center animate-in zoom-in-95 duration-200">
                {UploadIcon ? (
                  <UploadIcon size={48} className="mx-auto mb-2 text-primary animate-bounce" />
                ) : null}
                <p className="text-lg font-semibold text-primary">Drop files here to upload</p>
              </div>
            </div>
          )}

          {/* Toolbar */}
          <MediaToolbar searchInputRef={searchInputRef} />

          {/* Advanced Filters Panel */}
          {advancedFiltersOpen && <AdvancedFilters />}

          {/* Empty State */}
          {filteredMedia.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="text-muted-foreground">{ImagesIcon ? <ImagesIcon size={64} /> : null}</div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      {useMediaGalleryStore.getState().searchTerm || useMediaGalleryStore.getState().filterType !== 'all'
                        ? 'No media found'
                        : 'No media yet'}
                    </h3>
                    <p className="text-muted-foreground">
                      {useMediaGalleryStore.getState().searchTerm ||
                      useMediaGalleryStore.getState().filterType !== 'all'
                        ? 'Try adjusting your search or filters'
                        : 'Add your first media item to get started'}
                    </p>
                  </div>
                  {!useMediaGalleryStore.getState().searchTerm &&
                    useMediaGalleryStore.getState().filterType === 'all' && (
                      <Button asChild>
                        <a
                          href={`/admin/media/new${selectedFolderId ? `?folderId=${selectedFolderId}` : ''}`}
                          data-astro-prefetch
                        >
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
            <MediaGrid
              items={filteredMedia}
              onItemClick={handleItemClick}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onMove={handleMoveClick}
              onRename={handleRenameClick}
              onPreview={handlePreview}
              onDownload={handleDownload}
              onCopyUrl={handleCopyUrl}
              onCopyPath={handleCopyFilePath}
            />
          ) : (
            /* List View */
            <MediaList
              items={filteredMedia}
              onItemClick={handleItemClick}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onSelectAll={handleSelectAll}
              onToggleSelect={handleToggleSelect}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onMove={handleMoveClick}
              onRename={handleRenameClick}
              onPreview={handlePreview}
              onDownload={handleDownload}
              onCopyUrl={handleCopyUrl}
              onCopyPath={handleCopyFilePath}
              onSort={handleSort}
              onToggleFeatured={handleToggleFeatured}
            />
          )}
        </div>
      </div>

      {/* Preview Panel */}
      {previewMedia && (
        <MediaPreviewPanel
          media={previewMedia}
          onClose={() => setPreviewMedia(null)}
          onEdit={(id) => {
            window.location.href = `/admin/media/${id}`;
          }}
          onDelete={(id) => {
            handleDelete(id);
            setPreviewMedia(null);
          }}
        />
      )}

      {/* Move Dialog */}
      <MoveMediaDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        mediaIds={Array.from(selectedItems)}
        onMove={handleBulkMove}
      />

      {/* Rename Dialog */}
      {renameMediaId && (
        <RenameMediaDialog
          open={renameDialogOpen}
          onOpenChange={setRenameDialogOpen}
          mediaId={renameMediaId}
          currentTitle={renameMediaTitle}
          onRename={handleRename}
        />
      )}

      {/* Bulk Rename Dialog */}
      <Dialog open={bulkRenameDialogOpen} onOpenChange={setBulkRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Bulk Rename {selectedItems.size} Item{selectedItems.size !== 1 ? 's' : ''}
            </DialogTitle>
            <DialogDescription>
              Use patterns: {'{index}'} for item number, {'{name}'} for original name, {'{original}'} for original name
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rename-pattern">Rename Pattern</Label>
              <Input
                id="rename-pattern"
                placeholder="e.g., Image {index} or {name} - Copy"
                defaultValue="{name}"
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    const input = e.target as HTMLInputElement;
                    handleBulkRename(input.value);
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Examples: &quot;Photo {'{index}'}&quot;, &quot;{'{name}'} - Copy&quot;, &quot;Image {'{index}'} -{' '}
                {'{original}'}&quot;
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const input = document.getElementById('rename-pattern') as HTMLInputElement;
                if (input?.value) {
                  handleBulkRename(input.value);
                }
              }}
            >
              Rename All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Tag Dialog */}
      <Dialog open={bulkTagDialogOpen} onOpenChange={setBulkTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Bulk Tag {selectedItems.size} Item{selectedItems.size !== 1 ? 's' : ''}
            </DialogTitle>
            <DialogDescription>Enter tags separated by commas. This will replace existing tags.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-tags">Tags</Label>
              <Textarea
                id="bulk-tags"
                placeholder="e.g., sports, basketball, team"
                rows={3}
                onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    const textarea = e.target as HTMLTextAreaElement;
                    const tags = textarea.value
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean);
                    handleBulkTag(tags);
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">Separate tags with commas. Press Ctrl+Enter to apply.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkTagDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const textarea = document.getElementById('bulk-tags') as HTMLTextAreaElement;
                if (textarea?.value) {
                  const tags = textarea.value
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean);
                  handleBulkTag(tags);
                }
              }}
            >
              Apply Tags
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
