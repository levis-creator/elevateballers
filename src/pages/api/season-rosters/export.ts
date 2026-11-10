import type { APIRoute } from 'astro';
import { requireAnyPermission } from '../../../features/rbac/middleware';
import { readAllPages } from '../../../features/registration/data/datasources/review-queue';
import { handleApiError } from '../../../lib/apiError';
import { csvDateStamp, csvResponse } from '../../../lib/csv';
import { prisma } from '../../../lib/prisma';

export const prerender = false;

const ROSTER_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN'];

/**
 * Season rosters as CSV, one row per player per team per edition. Filters:
 * `seasonId`, `leagueId`, `teamId`, `status` (default: current approved players;
 * `ALL` includes every status and players who have left).
 */
export const GET: APIRoute = async ({ url, request }) => {
  try {
    await requireAnyPermission(request, ['teams:update', 'players:update']);
    const seasonId = url.searchParams.get('seasonId') || undefined;
    const leagueId = url.searchParams.get('leagueId') || undefined;
    const teamId = url.searchParams.get('teamId') || undefined;
    const status = url.searchParams.get('status') || 'APPROVED';
    if (status !== 'ALL' && !ROSTER_STATUSES.includes(status))
      return new Response(JSON.stringify({ error: 'Unknown roster status' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    const where: any = {
      ...(seasonId || leagueId
        ? { leagueSeason: { ...(seasonId && { seasonId }), ...(leagueId && { leagueId }) } }
        : {}),
      ...(teamId && { teamId }),
      ...(status === 'ALL' ? {} : { status }),
      ...(status === 'APPROVED' && { leftAt: null }),
    };
    const db = prisma as any;
    const rows = await readAllPages((skip, take) =>
      db.seasonTeamPlayer.findMany({
        where,
        orderBy: [{ leagueSeasonId: 'asc' }, { teamId: 'asc' }, { jerseyNumber: 'asc' }, { id: 'asc' }],
        skip,
        take,
        select: {
          id: true,
          status: true,
          jerseyNumber: true,
          position: true,
          joinedAt: true,
          leftAt: true,
          droppedOutAt: true,
          team: { select: { name: true } },
          leagueSeason: { select: { league: { select: { name: true } }, season: { select: { name: true } } } },
          player: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              dateOfBirth: true,
              nationality: true,
              position: true,
              jerseyNumber: true,
            },
          },
        },
      })
    );
    const csvRows: unknown[][] = [
      [
        'season', 'league', 'team', 'player id', 'first name', 'last name', 'jersey', 'position', 'roster status',
        'email', 'phone', 'date of birth', 'nationality', 'joined', 'left', 'dropped out',
      ],
      ...(rows as any[]).map((row) => [
        row.leagueSeason?.season?.name,
        row.leagueSeason?.league?.name,
        row.team?.name,
        row.player?.id,
        row.player?.firstName,
        row.player?.lastName,
        row.jerseyNumber ?? row.player?.jerseyNumber,
        row.position ?? row.player?.position,
        row.status,
        row.player?.email,
        row.player?.phone,
        row.player?.dateOfBirth ? new Date(row.player.dateOfBirth).toISOString().slice(0, 10) : '',
        row.player?.nationality,
        row.joinedAt,
        row.leftAt,
        row.droppedOutAt,
      ]),
    ];
    return csvResponse(csvRows, `rosters-${csvDateStamp()}.csv`);
  } catch (error) {
    return handleApiError(error, 'export season rosters', request);
  }
};
