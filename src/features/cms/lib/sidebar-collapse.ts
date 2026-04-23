export const SIDEBAR_WIDTH_EXPANDED = '260px';
export const SIDEBAR_WIDTH_COLLAPSED = '0px';
export const MOBILE_BREAKPOINT_PX = 768;
export const SIDEBAR_COLLAPSE_STORAGE_KEY = 'admin-sidebar-collapsed';

export function isAdminMatchDetailPath(pathname: string): boolean {
  const match = /^\/admin\/matches\/([^/]+)\/?$/.exec(pathname);
  if (!match) return false;
  return match[1] !== 'new';
}

/**
 * Resolve the initial collapsed state for the admin sidebar.
 * A stored user preference always wins; otherwise fall back to the route default
 * (match-detail pages auto-hide to keep the statistician focused).
 */
export function resolveInitialCollapsed(
  pathname: string,
  storedValue: string | null
): boolean {
  if (storedValue === 'true') return true;
  if (storedValue === 'false') return false;
  return isAdminMatchDetailPath(pathname);
}
