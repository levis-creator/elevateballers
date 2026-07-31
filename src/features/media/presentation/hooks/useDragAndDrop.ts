import { useCallback, useRef } from 'react';
import { useMediaGalleryStore } from '../stores/mediaGalleryStore';

export function useDragAndDrop() {
  const dragCounterRef = useRef(0);
  const { setIsDragging, setDraggedItemId, setDragOverFolderId } = useMediaGalleryStore();
  const handleDragEnter = useCallback((e: React.DragEvent) => { e.preventDefault(); dragCounterRef.current++; if (e.dataTransfer.items.length) setIsDragging(true); }, [setIsDragging]);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); dragCounterRef.current--; if (dragCounterRef.current === 0) setIsDragging(false); }, [setIsDragging]);
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); }, []);
  const handleDrop = useCallback(async (e: React.DragEvent, onRefresh: () => void, handleFilesUpload: (files: File[], refreshCallback: () => void) => Promise<void>) => {
    e.preventDefault(); setIsDragging(false); dragCounterRef.current = 0;
    const files = Array.from(e.dataTransfer.files).filter((file) => /^(image|video|audio)\//.test(file.type));
    if (files.length) await handleFilesUpload(files, onRefresh);
  }, [setIsDragging]);
  const handleDragStart = useCallback((e: React.DragEvent, itemId: string) => { setDraggedItemId(itemId); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', itemId); }, [setDraggedItemId]);
  const handleDragEnd = useCallback(() => { setDraggedItemId(null); setDragOverFolderId(null); }, [setDraggedItemId, setDragOverFolderId]);
  const handleFolderDragOver = useCallback((e: React.DragEvent, folderId: string) => { e.preventDefault(); setDragOverFolderId(folderId); }, [setDragOverFolderId]);
  const handleFolderDrop = useCallback(async (e: React.DragEvent, folderId: string, handleBulkMove: (mediaIds: string[], folderId: string | null) => Promise<void>) => {
    e.preventDefault(); setDragOverFolderId(null);
    const { draggedItemId, mediaItems } = useMediaGalleryStore.getState();
    if (!draggedItemId) return;
    const item = mediaItems.find((media) => media.id === draggedItemId);
    if (item?.folderId === (folderId === 'none' ? null : folderId)) { setDraggedItemId(null); return; }
    await handleBulkMove([draggedItemId], folderId);
    setDraggedItemId(null);
  }, [setDragOverFolderId, setDraggedItemId]);
  return { dragCounterRef, handleDragEnter, handleDragLeave, handleDragOver, handleDrop, handleDragStart, handleDragEnd, handleFolderDragOver, handleFolderDrop };
}
