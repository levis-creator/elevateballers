import type { APIRoute } from 'astro';
import { requireAnyPermission } from '../../../features/rbac/middleware';
import { readAllPages } from '../../../features/registration/data/datasources/review-queue';
import { handleApiError } from '../../../lib/apiError';
import { csvDateStamp, csvResponse } from '../../../lib/csv';
import { prisma } from '../../../lib/prisma';

export const prerender = false;

/**
 * All teams as CSV. With `seasonId` and/or `leagueId` it lists the teams entered
 * in that competition edition, with their roster size for it.
 */
export const GET: APIRoute = async ({ url, request }) => {
  try {
    // Contact details are private, so this needs the same access as editing teams.
    await requireAnyPermission(request, ['teams:update']);
    const seasonId = url.searchParams.get('seasonId') || undefined;
    const leagueId = url.searchParams.get('leagueId') || undefined;
    const edition = { ...(seasonId && { seasonId }), ...(leagueId && { leagueId }) };
    const scoped = Boolean(seasonId || leagueId);
    const db = prisma as any;
    const teams = await readAllPages((skip, take) =>
      db.team.findMany({
        where: scoped ? { seasonTeams: { some: edition } } : {},
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip,
        take,
        select: {
          id: true,
          name: true,
          slug: true,
          shortName: true,
          abbreviation: true,
          approved: true,
          reviewStatus: true,
          contactEmail: true,
          city: true,
          venue: true,
          founded: true,
          createdAt: true,
          staff: {
            where: { role: 'COACH' },
            select: { staff: { select: { firstName: true, lastName: true, email: true, phone: true } } },
          },
          seasonTeams: {
            where: edition,
            select: {
              league: { select: { name: true } },
              season: { select: { name: true } },
              conference: { select: { name: true } },
              _count: { select: { players: { where: { status: 'APPROVED', leftAt: null } } } },
            },
          },
          _count: { select: { players: true } },
        },
      })
    );
    const rows: unknown[][] = [
      [
        'id', 'name', 'short name', 'abbreviation', 'status', 'contact email', 'coach', 'coach email', 'coach phone',
        'city', 'venue', 'founded', 'editions', 'conference', 'roster size', 'players on record', 'created',
      ],
    ];
    for (const team of teams as any[]) {
      const coaches = team.staff.map((entry: any) => entry.staff).filter(Boolean);
      const editions = team.seasonTeams;
      rows.push([
        team.id,
        team.name,
        team.shortName,
        team.abbreviation,
        team.approved ? 'APPROVED' : team.reviewStatus || 'PENDING',
        team.contactEmail,
        coaches.map((coach: any) => `${coach.firstName ?? ''} ${coach.lastName ?? ''}`.trim()).join('; '),
        coaches.map((coach: any) => coach.email).filter(Boolean).join('; '),
        coaches.map((coach: any) => coach.phone).filter(Boolean).join('; '),
        team.city,
        team.venue,
        team.founded,
        editions.map((entry: any) => `${entry.league?.name ?? ''} ${entry.season?.name ?? ''}`.trim()).join('; '),
        editions.map((entry: any) => entry.conference?.name).filter(Boolean).join('; '),
        scoped ? editions.reduce((total: number, entry: any) => total + entry._count.players, 0) : '',
        team._count.players,
        team.createdAt,
      ]);
    }
    return csvResponse(rows, `teams-${csvDateStamp()}.csv`);
  } catch (error) {
    return handleApiError(error, 'export teams', request);
  }
};
