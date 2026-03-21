import { useCallback, useRef } from 'react';
import { useMediaGalleryStore } from '../stores/mediaGalleryStore';

export function useDragAndDrop() {
  const dragCounterRef = useRef(0);
  const { setIsDragging, setDraggedItemId, setDragOverFolderId } = useMediaGalleryStore();

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current++;
      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setIsDragging(true);
      }
    },
    [setIsDragging]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current--;
      if (dragCounterRef.current === 0) {
        setIsDragging(false);
      }
    },
    [setIsDragging]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, onRefresh: () => void, handleFilesUpload: (files: File[], refreshCallback: () => void) => Promise<void>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounterRef.current = 0;

      const files = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith('image/'));

      if (files.length > 0) {
        await handleFilesUpload(files, onRefresh);
      }
    },
    [setIsDragging]
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent, itemId: string) => {
      setDraggedItemId(itemId);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', itemId);
    },
    [setDraggedItemId]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedItemId(null);
    setDragOverFolderId(null);
  }, [setDraggedItemId, setDragOverFolderId]);

  const handleFolderDragOver = useCallback(
    (e: React.DragEvent, folderId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverFolderId(folderId);
    },
    [setDragOverFolderId]
  );

  const handleFolderDrop = useCallback(
    async (e: React.DragEvent, folderId: string, handleBulkMove: (mediaIds: string[], folderId: string | null) => Promise<void>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverFolderId(null);

      const state = useMediaGalleryStore.getState();
      if (state.draggedItemId) {
        // Check if the dragged item is already in the target folder
        const draggedItem = state.mediaItems.find((item) => item.id === state.draggedItemId);
        if (draggedItem) {
          const currentFolderId = draggedItem.folderId || null;
          const targetFolderId = folderId && folderId !== 'none' ? folderId : null;
          
          // If the item is already in the target folder, prevent the move
          if (currentFolderId === targetFolderId) {
            setDraggedItemId(null);
            return;
          }
        }

        try {
          await handleBulkMove([state.draggedItemId], folderId);
          const { useToast } = await import('@/components/ui/toast');
          const toast = useToast();
          toast.addToast({
            description: 'File moved successfully',
            variant: 'success',
          });
        } catch (err: any) {
          const { useToast } = await import('@/components/ui/toast');
          const toast = useToast();
          toast.addToast({
            description: 'Failed to move file: ' + err.message,
            variant: 'error',
          });
        }
        setDraggedItemId(null);
      }
    },
    [setDragOverFolderId, setDraggedItemId]
  );

  return {
    dragCounterRef,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleDragStart,
    handleDragEnd,
    handleFolderDragOver,
    handleFolderDrop,
  };
}
