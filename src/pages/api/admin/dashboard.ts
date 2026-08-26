import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';
import { getCurrentUser } from '../../../features/cms/lib/auth';
import { getUserWithPermissions } from '../../../features/rbac/permissions';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;

const DAY = 86_400_000;

export const GET: APIRoute = async ({ request }) => {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) return Response.json({ error: 'Not authenticated' }, { status: 401 });

    const user = await getUserWithPermissions(currentUser.id);
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

    const permissions = new Set(user.permissions);
    const can = (permission: string) => permissions.has(permission);
    const canAudit = can('audit_logs:read') || can('audit_logs:manage');
    const now = new Date();

    // Run independent work in bounded batches: cPanel accounts commonly cap
    // the MariaDB pool at three connections, so one unbounded Promise.all can
    // turn a faster dashboard into pool timeouts.
    const [teams, players, matches] = await Promise.all([
      can('teams:read') ? prisma.team.count() : Promise.resolve(0),
      can('players:read') ? prisma.player.count() : Promise.resolve(0),
      can('matches:read') ? prisma.match.count() : Promise.resolve(0),
    ]);
    const [media, articles, sponsors] = await Promise.all([
      can('media:read') ? prisma.media.count() : Promise.resolve(0),
      can('news_articles:read') ? prisma.newsArticle.count() : Promise.resolve(0),
      can('sponsors:read') ? prisma.sponsor.count() : Promise.resolve(0),
    ]);

    const matchListPromise = can('matches:read')
      ? prisma.match.findMany({
          where: { date: { gte: now }, status: { not: 'COMPLETED' } },
          select: {
            id: true,
            date: true,
            status: true,
            team1Name: true,
            team2Name: true,
            team1: { select: { name: true } },
            team2: { select: { name: true } },
          },
          orderBy: { date: 'asc' },
          take: 6,
        })
      : Promise.resolve([]);

    const totalMatches = can('matches:read') ? matches : 0;
    const completedMatchesPromise = can('matches:read')
      ? prisma.match.count({ where: { status: 'COMPLETED' } })
      : Promise.resolve(0);
    const seasonsPromise = can('seasons:read') || can('matches:read')
      ? prisma.season.findMany({
          where: { active: true },
          select: { name: true, startDate: true, endDate: true },
          orderBy: { startDate: 'desc' },
          take: 1,
        })
      : Promise.resolve([]);
    const [matchList, completedMatches, seasons] = await Promise.all([matchListPromise, completedMatchesPromise, seasonsPromise]);
    const activeSeason = seasons[0];
    const start = activeSeason?.startDate?.getTime() ?? now.getTime();
    const end = activeSeason?.endDate?.getTime() ?? start + DAY;
    const weeks = Math.max(1, Math.ceil((end - start) / (7 * DAY)));
    const week = Math.min(weeks, Math.max(1, Math.ceil((now.getTime() - start) / (7 * DAY))));
    const weekStart = start + (week - 1) * 7 * DAY;
    const weekEnd = weekStart + 7 * DAY;
    const gamesThisWeek = matchList.filter((match) => {
      const time = match.date.getTime();
      return time >= weekStart && time < weekEnd;
    }).length;

    const mediaSizePromise = can('media:read')
      ? prisma.media.aggregate({ _sum: { size: true } })
      : Promise.resolve({ _sum: { size: null } });

    let pipeline = { published: 0, draft: 0, scheduled: 0, recent: [] as Array<{ title: string; status: string }> };
    const newsPromise = can('news_articles:read')
      ? prisma.newsArticle.findMany({
        select: { title: true, published: true, publishedAt: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      })
      : Promise.resolve([]);
    const [mediaSize, news] = await Promise.all([mediaSizePromise, newsPromise]);
    const mediaBytes = Number(mediaSize._sum.size || 0);
    if (can('news_articles:read')) {
      const statusOf = (article: { published: boolean; publishedAt: Date | null }) =>
        article.published ? 'PUBLISHED' : article.publishedAt && article.publishedAt > now ? 'SCHEDULED' : 'DRAFT';
      pipeline = {
        published: news.filter((article) => statusOf(article) === 'PUBLISHED').length,
        draft: news.filter((article) => statusOf(article) === 'DRAFT').length,
        scheduled: news.filter((article) => statusOf(article) === 'SCHEDULED').length,
        recent: news.slice(0, 4).map((article) => ({ title: article.title || 'Untitled', status: statusOf(article) })),
      };
    }

    const notificationsPromise = can('notifications:read')
      ? prisma.registrationNotification.findMany({
          where: { read: false },
          include: {
            team: { select: { id: true, name: true, slug: true } },
            player: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        })
      : Promise.resolve([]);
    const notifications = await notificationsPromise;

    const logs = canAudit
      ? await prisma.userAuditLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: 6,
          select: { id: true, action: true, createdAt: true, userId: true },
        })
      : [];

    const userIds = [...new Set(logs.map((log) => log.userId))];
    const logUsers = userIds.length
      ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } })
      : [];
    const userNames = new Map(logUsers.map((logUser) => [logUser.id, logUser.name]));

    const usedGb = mediaBytes / 1_000_000_000;
    const storageCap = Math.max(1, Math.ceil(usedGb));

    return Response.json({
      kpis: [
        can('teams:read') && { key: 'teams', label: 'Teams', value: teams, href: '/admin/teams', tint: '#e4002b' },
        can('players:read') && { key: 'players', label: 'Players', value: players, href: '/admin/players', tint: '#1f8a5b' },
        can('matches:read') && { key: 'matches', label: 'Matches', value: matches, href: '/admin/matches', tint: '#2a6fdb' },
        can('media:read') && { key: 'media', label: 'Media', value: media, href: '/admin/media', tint: '#d98324' },
        can('news_articles:read') && { key: 'articles', label: 'Articles', value: articles, href: '/admin/news', tint: '#7c5cff' },
        can('sponsors:read') && { key: 'sponsors', label: 'Sponsors', value: sponsors, href: '/admin/highlights/sponsors', tint: '#c026a6' },
      ].filter(Boolean),
      season: {
        name: activeSeason?.name || `Season ${now.getFullYear()}`,
        week,
        weeks,
        gamesThisWeek,
        played: completedMatches,
        total: totalMatches,
        pct: totalMatches ? Math.round((completedMatches / totalMatches) * 100) : 0,
        nextLabel: matchList[0]?.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) || 'No upcoming fixtures',
      },
      fixtures: matchList.map((match) => ({
        id: match.id,
        home: match.team1?.name || match.team1Name || 'Team 1',
        away: match.team2?.name || match.team2Name || 'Team 2',
        date: match.date,
        status: match.status,
      })),
      pipeline,
      storage: { usedGb: Math.round(usedGb * 100) / 100, items: media, pct: Math.min(100, Math.round((usedGb / storageCap) * 100)) },
      approvals: notifications.map((notification) => ({
        id: notification.id,
        tab: notification.type === 'PLAYER_REGISTERED' ? 'Players' : notification.type === 'TEAM_REGISTERED' ? 'Teams' : 'Messages',
        title: notification.player ? `${notification.player.firstName} ${notification.player.lastName}`.trim() : notification.team?.name || notification.message || 'New notification',
        meta: notification.message || 'New notification',
        entityId: notification.player?.id || notification.team?.id,
      })),
      activity: logs.map((log) => ({
        id: log.id,
        text: `${log.action.replace(/_/g, ' ').toLowerCase()}${userNames.get(log.userId) ? ` · ${userNames.get(log.userId)}` : ''}`,
        at: log.createdAt,
      })),
    });
  } catch (error) {
    return handleApiError(error, 'fetch admin dashboard', request);
  }
};
