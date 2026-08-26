import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

export type TeamPortalTheme = 'system' | 'dark' | 'light';

interface TeamPortalThemeState {
  theme: TeamPortalTheme;
  systemTheme: Exclude<TeamPortalTheme, 'system'>;
  toggleTheme: () => void;
  syncSystemTheme: (systemTheme: Exclude<TeamPortalTheme, 'system'>) => void;
}

const getSystemTheme = (): Exclude<TeamPortalTheme, 'system'> => {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
};

/** Client-only presentation state for the Team Portal theme preference. */
const themeStorage: StateStorage = {
  getItem: (name) => {
    if (typeof window === 'undefined') return null;

    const value = window.localStorage.getItem(name);
    // Read the pre-Zustand value once so existing preferences are not lost.
    if (value === 'light' || value === 'dark') {
      return JSON.stringify({ state: { theme: value }, version: 0 });
    }
    return value;
  },
  setItem: (name, value) => window.localStorage.setItem(name, value),
  removeItem: (name) => window.localStorage.removeItem(name),
};

export const useTeamPortalThemeStore = create<TeamPortalThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      systemTheme: getSystemTheme(),
      toggleTheme: () => set((state) => {
        const activeTheme = state.theme === 'system' ? state.systemTheme : state.theme;
        return { theme: activeTheme === 'dark' ? 'light' : 'dark' };
      }),
      syncSystemTheme: (systemTheme) => set({ systemTheme }),
    }),
    {
      name: 'team-portal-theme',
      storage: createJSONStorage(() => themeStorage),
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
);
