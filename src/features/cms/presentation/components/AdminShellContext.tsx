import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  MOBILE_BREAKPOINT_PX,
  SIDEBAR_COLLAPSE_STORAGE_KEY,
  SIDEBAR_WIDTH_COLLAPSED,
  SIDEBAR_WIDTH_EXPANDED,
  resolveInitialCollapsed,
} from '../../lib/sidebar-collapse';

function readStoredCollapsed(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredCollapsed(collapsed: boolean) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SIDEBAR_COLLAPSE_STORAGE_KEY, String(collapsed));
  } catch {
    // localStorage can throw in privacy mode or when quota is exceeded; ignore.
  }
}

interface AdminShellContextValue {
  /** Mobile overlay visibility (mobile only). */
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  /** Desktop pinned-vs-hidden state. */
  isCollapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  /** Single user-facing action: hides/shows on desktop, opens/closes overlay on mobile. */
  toggleSidebar: () => void;
  /** Whether the sidebar is currently visible to the user (pinned on desktop, or overlay open on mobile). */
  sidebarShown: boolean;
  isMobile: boolean;
}

const AdminShellContext = createContext<AdminShellContextValue | null>(null);

export function AdminShellProvider({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setCollapsedState] = useState(() => {
    if (typeof window === 'undefined') return false;
    return resolveInitialCollapsed(window.location.pathname, readStoredCollapsed());
  });

  const setCollapsed = (collapsed: boolean) => {
    setCollapsedState(collapsed);
    writeStoredCollapsed(collapsed);
  };

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT_PX);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const collapsedDesktop = !isMobile && isCollapsed;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.documentElement.style.setProperty(
      '--admin-sidebar-width',
      collapsedDesktop ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED
    );
  }, [collapsedDesktop]);

  useEffect(() => {
    if (!isMobile) return;
    const close = () => setSidebarOpen(false);
    window.addEventListener('popstate', close);
    return () => window.removeEventListener('popstate', close);
  }, [isMobile]);

  const toggleSidebar = () => {
    if (isMobile) setSidebarOpen((v) => !v);
    else setCollapsed(!isCollapsed);
  };

  const sidebarShown = isMobile ? isSidebarOpen : !isCollapsed;

  return (
    <AdminShellContext.Provider
      value={{
        isSidebarOpen,
        setSidebarOpen,
        isCollapsed,
        setCollapsed,
        toggleSidebar,
        sidebarShown,
        isMobile,
      }}
    >
      {children}
    </AdminShellContext.Provider>
  );
}

export function useAdminShell(): AdminShellContextValue {
  const ctx = useContext(AdminShellContext);
  if (!ctx) throw new Error('useAdminShell must be used inside AdminShellProvider');
  return ctx;
}
