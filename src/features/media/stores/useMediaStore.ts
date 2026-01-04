import { create } from 'zustand';
import type { MediaFilter } from '../types';

/**
 * Media store for managing media gallery tab state
 */
interface MediaState {
  activeMediaTab: MediaFilter;
  setActiveMediaTab: (tab: MediaFilter) => void;
}

export const useMediaStore = create<MediaState>((set) => ({
  activeMediaTab: 'all_medias',
  setActiveMediaTab: (tab: MediaFilter) => set({ activeMediaTab: tab }),
}));

