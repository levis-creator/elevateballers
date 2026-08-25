import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/features/rbac/middleware';
import { handleApiError, json } from '@/lib/apiError';

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'staff:read');
    const sheets = await prisma.staffMatchSheet.findMany({
      where: { staffId: params.id! },
      orderBy: { match: { date: 'desc' } },
      take: 100,
      include: { team: { select: { id: true, name: true } }, match: { include: { team1: true, team2: true, league: true } } },
    });
    return json({ matches: sheets }, 200);
  } catch (error) {
    return handleApiError(error, 'fetch staff match sheets', request);
  }
};

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const actor = await requirePermission(request, 'staff:update');
    const body = await request.json();
    const staffId = params.id!;
    const staff = await prisma.staff.findUnique({ where: { id: staffId }, select: { userId: true } });
    if (!staff) return json({ error: 'Staff member not found' }, 404);
    if (!body.matchId || !body.teamId || !body.capacity) return json({ error: 'matchId, teamId, and capacity are required' }, 400);
    const assignment = await prisma.teamStaff.findFirst({ where: { staffId, teamId: body.teamId }, select: { id: true } });
    if (!assignment) return json({ error: 'Staff member is not assigned to this team' }, 409);
    const sheet = await prisma.staffMatchSheet.upsert({
      where: { staffId_matchId_teamId_capacity: { staffId, matchId: body.matchId, teamId: body.teamId, capacity: String(body.capacity).slice(0, 80) } },
      create: { staffId, matchId: body.matchId, teamId: body.teamId, capacity: String(body.capacity).slice(0, 80), status: String(body.status || 'APPEARED').slice(0, 32) },
      update: { status: String(body.status || 'APPEARED').slice(0, 32) },
      include: { team: { select: { id: true, name: true } }, match: { include: { team1: true, team2: true, league: true } } },
    });
    await prisma.userAuditLog.create({ data: { userId: staff.userId ?? actor.id, action: 'STAFF_MATCH_SHEET_RECORDED', performedBy: actor.id, metadata: { staffId, matchId: body.matchId, teamId: body.teamId, capacity: body.capacity } } });
    return json({ match: sheet }, 201);
  } catch (error) {
    return handleApiError(error, 'record staff match sheet', request);
  }
};
