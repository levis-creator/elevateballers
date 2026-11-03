// URLs from the old WordPress (SportsPress) site that crawlers still request.
// Detail pages that still exist under a new path get a permanent redirect;
// everything else is answered 410 Gone so search engines drop it instead of
// retrying a 404 forever.

export type LegacyResolution =
  | { kind: 'gone' }
  | { kind: 'redirect'; to: string }
  | { kind: 'lookup'; entity: 'player' | 'match' | 'team'; slug: string };

// Old detail routes and where the same slug lives now.
const DETAIL_ROUTES: Record<string, 'player' | 'match' | 'team'> = {
  player: 'player',
  event: 'match',
  team: 'team',
};

// Old archive and listing routes with no equivalent page.
const GONE_PREFIXES = ['position', 'league', 'list', 'calendar', 'table', 'venue', 'season', 'tag', 'category', 'author', 'feed'];

export const NEW_DETAIL_PATH = { player: '/players', match: '/matches', team: '/teams' } as const;

export function resolveLegacyPath(pathname: string): LegacyResolution | null {
  // A broken sponsor link ("http//www,ubalozikenya.com") was resolved
  // relative to every page, e.g. /players/x/http/www,ubalozikenya.com.
  if (/\/https?\/\/?www,/i.test(pathname)) return { kind: 'gone' };
  if (pathname === '/sitemap.xml.gz') return { kind: 'redirect', to: '/sitemap.xml' };

  const [first, second] = pathname.split('/').filter(Boolean);
  if (!first) return null;

  const entity = DETAIL_ROUTES[first];
  if (entity) {
    return second ? { kind: 'lookup', entity, slug: decodeURIComponent(second) } : { kind: 'gone' };
  }
  if (GONE_PREFIXES.includes(first)) return { kind: 'gone' };
  // WordPress date archives: /2025/, /2025/04/…
  if (/^\d{4}$/.test(first)) return { kind: 'gone' };
  return null;
}
