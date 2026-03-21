import { useEffect, useRef } from 'react';
import { useMediaGalleryStore } from '../stores/mediaGalleryStore';

export function useKeyboardShortcuts() {
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = useMediaGalleryStore.getState();
      
      // Don't trigger shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        // Allow Ctrl+F to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd + F: Focus search
      if (ctrlOrCmd && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Esc: Deselect all / Close modals
      else if (e.key === 'Escape') {
        if (state.selectedItems.size > 0) {
          state.setSelectedItems(new Set());
        }
        if (state.previewMedia) {
          state.setPreviewMedia(null);
        }
        if (state.moveDialogOpen) {
          state.setMoveDialogOpen(false);
        }
        if (state.renameDialogOpen) {
          state.setRenameDialogOpen(false);
        }
        if (state.advancedFiltersOpen) {
          state.setAdvancedFiltersOpen(false);
        }
      }
      // Note: Other shortcuts (Ctrl+A, Ctrl+C, etc.) are handled by the component
      // to avoid circular dependencies with useMediaOperations
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { searchInputRef };
}
