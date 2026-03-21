import { create } from 'zustand';
import type { MediaFilter } from '../../types';

/**
 * Media store for managing media gallery tab state
 */
interface MediaState {
  activeMediaTab: MediaFilter;
  viewMode: 'grid' | 'list';
  setActiveMediaTab: (tab: MediaFilter) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
}

export const useMediaStore = create<MediaState>((set) => ({
  activeMediaTab: 'all_medias',
  viewMode: 'grid',
  setActiveMediaTab: (tab: MediaFilter) => set({ activeMediaTab: tab }),
  setViewMode: (mode: 'grid' | 'list') => set({ viewMode: mode }),
}));

