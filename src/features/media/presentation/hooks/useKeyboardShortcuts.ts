import { useEffect, useRef } from 'react';
import { useMediaGalleryStore } from '../stores/mediaGalleryStore';

export function useKeyboardShortcuts() {
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = useMediaGalleryStore.getState();
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') { e.preventDefault(); searchInputRef.current?.focus(); }
      if (e.key === 'Escape') { state.setSelectedItems(new Set()); state.setPreviewMedia(null); state.setMoveDialogOpen(false); state.setRenameDialogOpen(false); state.setAdvancedFiltersOpen(false); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  return { searchInputRef };
}
