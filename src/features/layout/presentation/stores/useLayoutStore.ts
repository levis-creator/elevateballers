import { create } from 'zustand';

/**
 * Layout feature store
 * Manages UI state for layout components (mobile menu, navigation, etc.)
 */
interface LayoutState {
  // Mobile menu state
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  openMobileMenu: () => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  // Mobile menu state
  isMobileMenuOpen: false,
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  openMobileMenu: () => set({ isMobileMenuOpen: true }),
}));

