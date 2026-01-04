import { create } from 'zustand';
import type { NewsFilter } from '../types';

/**
 * News store for managing news filtering and tab state
 */
interface NewsState {
  activeTab: NewsFilter;
  setActiveTab: (tab: NewsFilter) => void;
}

export const useNewsStore = create<NewsState>((set) => ({
  activeTab: 'All',
  setActiveTab: (tab: NewsFilter) => set({ activeTab: tab }),
}));

