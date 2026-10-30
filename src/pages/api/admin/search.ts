import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';
import { getCurrentUser } from '../../../features/cms/lib/auth';
import { getUserWithPermissions } from '../../../features/rbac/permissions';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;

const LIMIT = 5;
const MIN_QUERY = 2;

export type AdminSearchKind = 'player' | 'team' | 'article' | 'match' | 'staff';

export interface AdminSearchResult {
  kind: AdminSearchKind;
  id: string;
  label: string;
  detail: string | null;
  href: string;
}

const fullName = (first: string | null, last: string | null) => [first, last].filter(Boolean).join(' ').trim();

/**
 * Global admin search for the topbar. Returns a few records per type the
 * signed-in user may read. MySQL's default collation makes `contains`
 * case-insensitive.
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) return Response.json({ error: 'Not authenticated' }, { status: 401 });

    const user = await getUserWithPermissions(currentUser.id);
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

    const q = (new URL(request.url).searchParams.get('q') ?? '').trim().slice(0, 100);
    if (q.length < MIN_QUERY) return Response.json({ results: [] });

    const permissions = new Set(user.permissions);
    const can = (permission: string) => permissions.has(permission);
    // Every word must match a first or last name, so "john sm" finds John Smith.
    const nameTerms = q.split(/\s+/).map((word) => ({
      OR: [{ firstName: { contains: word } }, { lastName: { contains: word } }],
    }));

    // Two small batches: cPanel MariaDB pools are often capped at three connections.
    const [players, teams, articles] = await Promise.all([
      can('players:read')
        ? prisma.player.findMany({
            where: { mergedIntoId: null, AND: nameTerms },
            select: { id: true, firstName: true, lastName: true, archived: true, team: { select: { name: true } } },
            orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
            take: LIMIT,
          })
        : Promise.resolve([]),
      can('teams:read')
        ? prisma.team.findMany({
            where: {
              OR: [{ name: { contains: q } }, { shortName: { contains: q } }, { abbreviation: { contains: q } }, { nickname: { contains: q } }],
            },
            select: { id: true, name: true, city: true },
            orderBy: { name: 'asc' },
            take: LIMIT,
          })
        : Promise.resolve([]),
      can('news_articles:read')
        ? prisma.newsArticle.findMany({
            where: { title: { contains: q } },
            select: { id: true, title: true, published: true, category: true },
            orderBy: { createdAt: 'desc' },
            take: LIMIT,
          })
        : Promise.resolve([]),
    ]);
    const [matches, staff] = await Promise.all([
      can('matches:read')
        ? prisma.match.findMany({
            where: { OR: [{ team1Name: { contains: q } }, { team2Name: { contains: q } }] },
            select: { id: true, team1Name: true, team2Name: true, date: true, status: true },
            orderBy: { date: 'desc' },
            take: LIMIT,
          })
        : Promise.resolve([]),
      can('staff:read')
        ? prisma.staff.findMany({
            where: { AND: nameTerms },
            select: { id: true, firstName: true, lastName: true },
            orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
            take: LIMIT,
          })
        : Promise.resolve([]),
    ]);

    const results: AdminSearchResult[] = [
      ...players.map((p) => ({
        kind: 'player' as const,
        id: p.id,
        label: fullName(p.firstName, p.lastName) || 'Unnamed player',
        detail: [p.team?.name ?? 'No team', p.archived ? 'Archived' : null].filter(Boolean).join(' · '),
        href: `/admin/players/view/${p.id}`,
      })),
      ...teams.map((t) => ({
        kind: 'team' as const,
        id: t.id,
        label: t.name,
        detail: t.city,
        href: `/admin/teams/view/${t.id}`,
      })),
      ...articles.map((a) => ({
        kind: 'article' as const,
        id: a.id,
        label: a.title,
        detail: `${a.category} · ${a.published ? 'Published' : 'Draft'}`,
        href: `/admin/news/view/${a.id}`,
      })),
      ...matches.map((m) => ({
        kind: 'match' as const,
        id: m.id,
        label: `${m.team1Name ?? 'TBD'} vs ${m.team2Name ?? 'TBD'}`,
        detail: `${m.date.toISOString().slice(0, 10)} · ${m.status.toLowerCase()}`,
        href: `/admin/matches/view/${m.id}`,
      })),
      ...staff.map((s) => ({
        kind: 'staff' as const,
        id: s.id,
        label: fullName(s.firstName, s.lastName),
        detail: null,
        href: `/admin/staff/${s.id}`,
      })),
    ];

    return Response.json({ results }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiError(error, 'admin search', request);
  }
};
