import { useState, useEffect, useCallback, useRef, type ComponentType } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import FolderBrowser from './FolderBrowser';
import MediaPreviewPanel from './MediaPreviewPanel';
import MoveMediaDialog from './MoveMediaDialog';
import RenameMediaDialog from './RenameMediaDialog';
import BulkRenameDialog from './BulkRenameDialog';
import BulkTagDialog from './BulkTagDialog';
import MediaToolbar from './MediaToolbar';
import AdvancedFilters from './AdvancedFilters';
import UploadQueue from './UploadQueue';
import SelectionToolbar from './SelectionToolbar';
import MediaGrid from './MediaGrid';
import MediaList from './MediaList';
import { useMediaGalleryStore } from '../../stores/mediaGalleryStore';
import { useMediaGallery } from '../../hooks/useMediaGallery';
import { useMediaOperations } from '../../hooks/useMediaOperations';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import type { MediaWithFolderAndUploader } from '../../types';

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
    deleteConfirmOpen,
    bulkDeleteConfirmOpen,
    itemToDeleteId,
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
    setDeleteConfirmOpen,
    setBulkDeleteConfirmOpen,
    setItemToDeleteId,
    setSortField,
    setSortDirection,
    setIsDragging,
    setSelectedFolderId,
    mediaItems,
  } = useMediaGalleryStore();

  // Custom hooks
  const { fetchMedia, filteredMedia } = useMediaGallery();
  const {
    handleDelete: deleteAction,
    handleBulkDelete: bulkDeleteAction,
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

  // Override handleDelete to open dialog
  const handleDelete = useCallback((id: string) => {
    setItemToDeleteId(id);
    setDeleteConfirmOpen(true);
  }, [setItemToDeleteId, setDeleteConfirmOpen]);

  // Override handleBulkDelete to open dialog
  const onHandleBulkDelete = useCallback(() => {
    if (selectedItems.size > 0) {
      setBulkDeleteConfirmOpen(true);
    }
  }, [selectedItems.size, setBulkDeleteConfirmOpen]);

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
  }, [filterType, selectedFolderId]); 

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      if (ctrlOrCmd && e.key === 'a') {
        e.preventDefault();
        handleSelectAll();
      }
      else if (ctrlOrCmd && e.key === 'c') {
        e.preventDefault();
        const state = useMediaGalleryStore.getState();
        state.setClipboardItems(new Set(selectedItems));
        state.setClipboardMode('copy');
      }
      else if (ctrlOrCmd && e.key === 'x') {
        e.preventDefault();
        const state = useMediaGalleryStore.getState();
        state.setClipboardItems(new Set(selectedItems));
        state.setClipboardMode('cut');
      }
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
      else if (e.key === 'Delete' && selectedItems.size > 0) {
        e.preventDefault();
        onHandleBulkDelete(); // Use the dialog version
      }
      else if (e.key === 'F2' && selectedItems.size === 1) {
        e.preventDefault();
        const firstId = Array.from(selectedItems)[0];
        handleRenameClick(firstId);
      }
      else if (ctrlOrCmd && e.key === 'd' && selectedItems.size > 0) {
        e.preventDefault();
        handleBulkDuplicate(Array.from(selectedItems));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItems, selectedFolderId, handleSelectAll, handleBulkMove, handleBulkDuplicate, onHandleBulkDelete, handleRenameClick]);

  const PlusIcon = icons.Plus;
  const UploadIcon = icons.Upload;
  const ImagesIcon = icons.Images;
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
    <div
      className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 relative"
      role="main"
      aria-label="Media Gallery"
    >
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
          <h1 className="text-3xl font-heading font-semibold mb-1 text-foreground">Media Gallery</h1>
          <p className="text-muted-foreground">Manage your visual assets and documents</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              fileInputRef.current?.click();
            }}
          >
            {UploadIcon ? <UploadIcon size={18} className="mr-2" /> : null}
            Upload Files
          </Button>
          <Button asChild className="rounded-xl">
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
        onBulkDelete={onHandleBulkDelete}
      />

      {/* Upload Queue */}
      <UploadQueue onRefresh={fetchMedia} />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
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

        {/* Content */}
        <div
          className={cn(
            'lg:col-span-3 space-y-6 relative transition-all min-h-[400px]',
            isDragging && 'ring-2 ring-primary ring-offset-4 rounded-xl bg-primary/5'
          )}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isDragging && (
            <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-xl z-10 flex items-center justify-center pointer-events-none backdrop-blur-sm animate-in fade-in duration-300">
              <div className="text-center">
                {UploadIcon ? <UploadIcon size={64} className="mx-auto mb-4 text-primary animate-bounce" /> : null}
                <p className="text-2xl font-bold text-primary">Drop to Upload</p>
              </div>
            </div>
          )}

          <MediaToolbar searchInputRef={searchInputRef} />
          {advancedFiltersOpen && <AdvancedFilters />}

          {filteredMedia.length === 0 ? (
            <Card className="border-dashed py-20 bg-muted/30">
              <CardContent className="text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-muted rounded-full">
                    {ImagesIcon ? <ImagesIcon size={40} className="text-muted-foreground" /> : null}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">No media found</h3>
                    <p className="text-muted-foreground max-w-xs mx-auto">
                      Adjust your search or filters, or add some new media.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
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

      {/* Panels & Dialogs */}
      {previewMedia && (
        <MediaPreviewPanel
          media={previewMedia}
          onClose={() => setPreviewMedia(null)}
          onEdit={(id) => { window.location.href = `/admin/media/${id}`; }}
          onDelete={handleDelete}
        />
      )}

      <MoveMediaDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        mediaIds={Array.from(selectedItems)}
        onMove={handleBulkMove}
      />

      {renameMediaId && (
        <RenameMediaDialog
          open={renameDialogOpen}
          onOpenChange={setRenameDialogOpen}
          mediaId={renameMediaId}
          currentTitle={renameMediaTitle}
          onRename={handleRename}
        />
      )}

      <BulkRenameDialog
        open={bulkRenameDialogOpen}
        onOpenChange={setBulkRenameDialogOpen}
        selectedCount={selectedItems.size}
        onRename={handleBulkRename}
      />

      <BulkTagDialog
        open={bulkTagDialogOpen}
        onOpenChange={setBulkTagDialogOpen}
        selectedCount={selectedItems.size}
        onTag={handleBulkTag}
      />

      {/* Delete Single Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the media item. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (itemToDeleteId) {
                  deleteAction(itemToDeleteId);
                  setItemToDeleteId(null);
                }
              }}
            >
              Delete Item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Multiple Confirmation */}
      <AlertDialog open={bulkDeleteConfirmOpen} onOpenChange={setBulkDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedItems.size} items?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to delete {selectedItems.size} media files. This action is permanent and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => bulkDeleteAction()}
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
