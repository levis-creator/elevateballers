import { create } from 'zustand';

interface AdminLayoutState {
  isSidebarOpen: boolean;
  isMobile: boolean;
  activePath: string;
  hideSidebar: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setMobile: (mobile: boolean) => void;
  setActivePath: (path: string) => void;
  setHideSidebar: (hide: boolean) => void;
}

export const useAdminLayoutStore = create<AdminLayoutState>((set) => ({
  isSidebarOpen: false,
  isMobile: false,
  activePath: '',
  hideSidebar: false,
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  setMobile: (mobile) => set({ isMobile: mobile }),
  setActivePath: (path) => set({ activePath: path }),
  setHideSidebar: (hide) => set({ hideSidebar: hide }),
}));
