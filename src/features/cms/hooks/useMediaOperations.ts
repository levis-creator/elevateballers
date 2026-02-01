import { useCallback } from 'react';
import { useMediaGalleryStore, type UploadFile } from '../stores/mediaGalleryStore';
import type { MediaWithFolderAndUploader } from '../types';
import { useToast } from '@/components/ui/toast';
import { useMediaGallery } from './useMediaGallery';

export function useMediaOperations() {
  const { addToast } = useToast();
  const { fetchMedia } = useMediaGallery();
  const {
    selectedItems,
    selectedFolderId,
    setError,
    setSelectedItems,
    setPreviewMedia,
    addUploadQueueItem,
    updateUploadQueueItem,
    removeUploadQueueItem,
    setMediaItems,
  } = useMediaGalleryStore();

  const handleDelete = useCallback(
    async (id: string) => {
      const confirmed = window.confirm(
        'Are you sure you want to delete this media item?\n\nThis action cannot be undone.'
      );
      if (!confirmed) return;

      try {
        const response = await fetch(`/api/media/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) throw new Error('Failed to delete media');

        addToast({
          description: 'Media item deleted successfully',
          variant: 'success',
        });

        setSelectedItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });

        const { previewMedia } = useMediaGalleryStore.getState();
        if (previewMedia?.id === id) {
          setPreviewMedia(null);
        }
        // Refresh media list
        fetchMedia();
      } catch (err: any) {
        const errorMsg = 'Error deleting media: ' + err.message;
        setError(errorMsg);
        addToast({
          description: errorMsg,
          variant: 'error',
          duration: 7000,
        });
        setTimeout(() => setError(''), 5000);
      }
    },
    [addToast, setError, setSelectedItems, setPreviewMedia, fetchMedia]
  );

  const handleBulkDelete = useCallback(async () => {
    if (selectedItems.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedItems.size} media item(s)?\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const deletePromises = Array.from(selectedItems).map((id) =>
        fetch(`/api/media/${id}`, { method: 'DELETE' })
      );
      await Promise.all(deletePromises);

      addToast({
        description: `${selectedItems.size} media item(s) deleted successfully`,
        variant: 'success',
      });
      setSelectedItems(new Set());
      setPreviewMedia(null);
      // Refresh media list
      fetchMedia();
    } catch (err: any) {
      const errorMsg = 'Error deleting media: ' + err.message;
      setError(errorMsg);
      addToast({
        description: errorMsg,
        variant: 'error',
        duration: 7000,
      });
      setTimeout(() => setError(''), 5000);
    }
  }, [selectedItems, addToast, setError, setSelectedItems, setPreviewMedia, fetchMedia]);

  const handleBulkMove = useCallback(
    async (mediaIds: string[], folderId: string | null) => {
      try {
        const response = await fetch('/api/media/batch-move', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mediaIds, folderId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to move media');
        }

        addToast({
          description: `${mediaIds.length} media item(s) moved successfully`,
          variant: 'success',
        });
        setSelectedItems(new Set());
        // Refresh media list
        fetchMedia();
      } catch (err: any) {
        const errorMsg = 'Error moving media: ' + err.message;
        setError(errorMsg);
        addToast({
          description: errorMsg,
          variant: 'error',
          duration: 7000,
        });
        setTimeout(() => setError(''), 5000);
        throw err;
      }
    },
    [addToast, setError, setSelectedItems, fetchMedia]
  );

  const handleRename = useCallback(
    async (mediaId: string, newTitle: string) => {
      try {
        const response = await fetch(`/api/media/${mediaId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: newTitle }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to rename media');
        }

        addToast({
          description: 'Media renamed successfully',
          variant: 'success',
        });
        // Refresh media list
        fetchMedia();
      } catch (err: any) {
        const errorMsg = 'Error renaming media: ' + err.message;
        setError(errorMsg);
        addToast({
          description: errorMsg,
          variant: 'error',
          duration: 7000,
        });
        setTimeout(() => setError(''), 5000);
        throw err;
      }
    },
    [addToast, setError, fetchMedia]
  );

  const handleDuplicate = useCallback(async (mediaId: string) => {
    try {
      const response = await fetch('/api/media/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to duplicate media');
      }

      addToast({
        description: 'Media duplicated successfully',
        variant: 'success',
      });
      // Refresh media list
      fetchMedia();
    } catch (err: any) {
      setError('Error duplicating media: ' + err.message);
      addToast({
        description: 'Error duplicating media: ' + err.message,
        variant: 'error',
      });
      setTimeout(() => setError(''), 5000);
    }
  }, [setError, addToast, fetchMedia]);

  const handleBulkDuplicate = useCallback(async (mediaIds: string[]) => {
    try {
      const duplicatePromises = mediaIds.map((id) =>
        fetch('/api/media/duplicate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mediaId: id }),
        })
      );
      await Promise.all(duplicatePromises);
      setError('');
      setSelectedItems(new Set());
      addToast({
        description: `${mediaIds.length} media item(s) duplicated successfully`,
        variant: 'success',
      });
      // Refresh media list
      fetchMedia();
    } catch (err: any) {
      const errorMsg = 'Error duplicating media: ' + err.message;
      setError(errorMsg);
      addToast({
        description: errorMsg,
        variant: 'error',
      });
      setTimeout(() => setError(''), 5000);
    }
  }, [setError, setSelectedItems, addToast, fetchMedia]);

  const handleBulkRename = useCallback(
    async (pattern: string) => {
      if (selectedItems.size === 0) return;
      try {
        const { mediaItems } = useMediaGalleryStore.getState();
        const items = Array.from(selectedItems);
        const renamePromises = items.map((id, index) => {
          const media = mediaItems.find((m) => m.id === id);
          if (!media) return Promise.resolve();
          const newTitle = pattern
            .replace('{index}', String(index + 1))
            .replace('{name}', media.title)
            .replace('{original}', media.title);
          return fetch(`/api/media/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: newTitle }),
          });
        });
        await Promise.all(renamePromises);
        setError('');
        setSelectedItems(new Set());
        addToast({
          description: `${selectedItems.size} media item(s) renamed successfully`,
          variant: 'success',
        });
        // Refresh media list
        fetchMedia();
      } catch (err: any) {
        const errorMsg = 'Error renaming media: ' + err.message;
        setError(errorMsg);
        addToast({
          description: errorMsg,
          variant: 'error',
        });
        setTimeout(() => setError(''), 5000);
      }
    },
    [selectedItems, setError, setSelectedItems, addToast, fetchMedia]
  );

  const handleBulkTag = useCallback(
    async (tags: string[]) => {
      if (selectedItems.size === 0) return;
      try {
        const items = Array.from(selectedItems);
        const tagPromises = items.map((id) =>
          fetch(`/api/media/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tags }),
          })
        );
        await Promise.all(tagPromises);
        setError('');
        setSelectedItems(new Set());
        addToast({
          description: `Tags updated for ${selectedItems.size} media item(s)`,
          variant: 'success',
        });
        // Refresh media list
        fetchMedia();
      } catch (err: any) {
        const errorMsg = 'Error updating tags: ' + err.message;
        setError(errorMsg);
        addToast({
          description: errorMsg,
          variant: 'error',
        });
        setTimeout(() => setError(''), 5000);
      }
    },
    [selectedItems, setError, setSelectedItems, addToast, fetchMedia]
  );

  const handleFilesUpload = useCallback(
    async (files: File[], refreshCallback: () => void) => {
      // Get folder name from selected folder
      const foldersResponse = await fetch('/api/folders?includePrivate=true');
      const foldersData = await foldersResponse.json();
      const folder = selectedFolderId
        ? foldersData.find((f: any) => f.id === selectedFolderId)
        : foldersData.find((f: any) => f.name === 'general') || foldersData[0];

      const folderName = folder?.name || 'general';

      // Create upload queue items
      const queueItems: UploadFile[] = files.map((file) => ({
        id: `${Date.now()}-${Math.random()}`,
        file,
        progress: 0,
        status: 'pending' as const,
      }));

      queueItems.forEach((item) => addUploadQueueItem(item));

      // Upload files
      for (const queueItem of queueItems) {
        try {
          updateUploadQueueItem(queueItem.id, { status: 'uploading', progress: 10 });

          // Compress on client side first
          let fileToUpload = queueItem.file;
          try {
            const imageCompression = (await import('browser-image-compression')).default;
            fileToUpload = await imageCompression(queueItem.file, {
              maxSizeMB: 5,
              maxWidthOrHeight: 1920,
              useWebWorker: true,
              fileType: queueItem.file.type,
            });
          } catch (err) {
            console.warn('Client-side compression failed, using original:', err);
          }

          updateUploadQueueItem(queueItem.id, { progress: 50 });

          const formData = new FormData();
          formData.append('files', fileToUpload);
          formData.append('folder', folderName);

          const response = await fetch('/api/media/batch-upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to upload file');
          }

          const data = await response.json();
          const result = data.results.find((r: any) => r.title === queueItem.file.name || !r.error);

          updateUploadQueueItem(queueItem.id, {
            status: 'success',
            progress: 100,
            result: result as any,
          });

          // Refresh media list after successful upload
          if (result && !result.error) {
            setTimeout(() => {
              refreshCallback();
              // Remove from queue after 2 seconds
              removeUploadQueueItem(queueItem.id);
            }, 2000);
          }
        } catch (err: any) {
          updateUploadQueueItem(queueItem.id, {
            status: 'error',
            progress: 0,
            error: err.message,
          });
        }
      }
    },
    [selectedFolderId, addUploadQueueItem, updateUploadQueueItem, removeUploadQueueItem]
  );

  const handleCopyUrl = useCallback(
    async (url: string) => {
      try {
        await navigator.clipboard.writeText(url);
        addToast({
          description: 'URL copied to clipboard',
          variant: 'success',
        });
      } catch (err) {
        addToast({
          description: 'Failed to copy URL',
          variant: 'error',
        });
      }
    },
    [addToast]
  );

  const handleCopyFilePath = useCallback(
    async (filePath: string | null) => {
      if (!filePath) return;
      try {
        await navigator.clipboard.writeText(filePath);
        addToast({
          description: 'File path copied to clipboard',
          variant: 'success',
        });
      } catch (err) {
        addToast({
          description: 'Failed to copy file path',
          variant: 'error',
        });
      }
    },
    [addToast]
  );

  const handleDownload = useCallback((url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleExportZip = useCallback(async () => {
    if (selectedItems.size === 0) {
      addToast({
        description: 'Please select files to export',
        variant: 'warning',
      });
      return;
    }

    try {
      const { mediaItems } = useMediaGalleryStore.getState();
      const mediaToExport = mediaItems.filter((item) => item.id && selectedItems.has(item.id));
      const filePaths = mediaToExport.map((item) => item.filePath).filter(Boolean) as string[];

      if (filePaths.length === 0) {
        addToast({
          description: 'No files available to export',
          variant: 'error',
        });
        return;
      }

      const response = await fetch('/api/media/export-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePaths }),
      });

      if (!response.ok) {
        throw new Error('Failed to create ZIP file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `media-export-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      addToast({
        description: `${selectedItems.size} file(s) exported successfully`,
        variant: 'success',
      });
    } catch (err: any) {
      addToast({
        description: 'Failed to export files: ' + err.message,
        variant: 'error',
      });
    }
  }, [selectedItems, addToast]);

  const handleToggleFeatured = useCallback(
    async (mediaId: string) => {
      try {
        const { mediaItems } = useMediaGalleryStore.getState();
        const media = mediaItems.find((item) => item.id === mediaId);
        const currentFeatured = media?.featured ?? false;

        const response = await fetch(`/api/media/${mediaId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ featured: !currentFeatured }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to toggle featured status');
        }

        addToast({
          description: `Media ${!currentFeatured ? 'featured' : 'unfeatured'} successfully`,
          variant: 'success',
        });
        // Refresh media list
        fetchMedia();
      } catch (err: any) {
        const errorMsg = 'Error toggling featured status: ' + err.message;
        setError(errorMsg);
        addToast({
          description: errorMsg,
          variant: 'error',
          duration: 7000,
        });
        setTimeout(() => setError(''), 5000);
        throw err;
      }
    },
    [addToast, setError, fetchMedia]
  );

  const handleBulkToggleFeatured = useCallback(
    async (mediaIds: string[], featured: boolean) => {
      try {
        const response = await fetch('/api/media/batch-featured', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mediaIds, featured }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update featured status');
        }

        addToast({
          description: `${mediaIds.length} media item(s) ${featured ? 'featured' : 'unfeatured'} successfully`,
          variant: 'success',
        });
        setSelectedItems(new Set());
        // Refresh media list
        fetchMedia();
      } catch (err: any) {
        const errorMsg = 'Error updating featured status: ' + err.message;
        setError(errorMsg);
        addToast({
          description: errorMsg,
          variant: 'error',
          duration: 7000,
        });
        setTimeout(() => setError(''), 5000);
        throw err;
      }
    },
    [addToast, setError, setSelectedItems, fetchMedia]
  );

  const handleBulkDownload = useCallback(async () => {
    if (selectedItems.size === 0) {
      addToast({
        description: 'Please select files to download',
        variant: 'warning',
      });
      return;
    }

    try {
      const { mediaItems } = useMediaGalleryStore.getState();
      const mediaToDownload = mediaItems.filter((item) => item.id && selectedItems.has(item.id));

      // Download each file sequentially to avoid browser blocking
      for (const media of mediaToDownload) {
        if (media.url) {
          handleDownload(media.url, media.title || 'file');
          // Small delay between downloads
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      addToast({
        description: `${mediaToDownload.length} file(s) downloaded successfully`,
        variant: 'success',
      });
    } catch (err: any) {
      addToast({
        description: 'Failed to download files: ' + err.message,
        variant: 'error',
      });
    }
  }, [selectedItems, addToast, handleDownload]);

  return {
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
  };
}
