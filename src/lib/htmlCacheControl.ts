// Cache-Control for HTML pages. Cloudflare's cache rule stores a page only when
// this says "public", and never for requests carrying the auth cookie, so this
// is what keeps one visitor's page from being served to another.

const PRIVATE = 'private, no-store';
const DEFAULT_PUBLIC = 'public, s-maxage=60, stale-while-revalidate=300';

// Pages built around the current user or a one-off token.
const PRIVATE_PREFIXES = ['/admin', '/api', '/team-portal', '/login', '/unauthorized', '/subscribe', '/unsubscribe'];

function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function htmlCacheControl(options: {
  pathname: string;
  signedIn: boolean;
  /** Cache-Control the page set itself, if any. */
  pagePolicy: string | null;
  /** Public caching is only enabled for the v2 site. */
  publicCaching: boolean;
}): string | null {
  if (options.signedIn || isPrivatePath(options.pathname)) return PRIVATE;
  if (!options.publicCaching) return null;
  // Pages tune their own lifetimes (a finished match caches for a day,
  // standings for a minute); only fill in a default when a page set none.
  return options.pagePolicy || DEFAULT_PUBLIC;
}
