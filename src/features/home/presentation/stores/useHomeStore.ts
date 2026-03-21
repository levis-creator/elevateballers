import { create } from 'zustand';

/**
 * Home feature store for homepage-specific state
 */
interface HomeState {
  // Add any homepage-specific state here
  // For now, this is a placeholder for future state needs
}

export const useHomeStore = create<HomeState>(() => ({}));

