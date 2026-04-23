export const SIDEBAR_WIDTH_EXPANDED = '260px';
export const SIDEBAR_WIDTH_COLLAPSED = '0px';
export const MOBILE_BREAKPOINT_PX = 768;

export function isAdminMatchDetailPath(pathname: string): boolean {
  const match = /^\/admin\/matches\/([^/]+)\/?$/.exec(pathname);
  if (!match) return false;
  return match[1] !== 'new';
}
