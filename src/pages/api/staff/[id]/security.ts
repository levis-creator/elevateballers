import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/features/rbac/middleware';
import { invalidateSessions } from '@/features/cms/domain/usecases/auth';
import { logAudit } from '@/features/cms/lib/audit';
import { handleApiError } from '@/lib/apiError';

export const prerender = false;

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const actor = await requirePermission(request, 'staff:update');
    const action = (await request.json().catch(() => ({}))).action;
    if (action !== 'force-2fa' && action !== 'deactivate') {
      return new Response(JSON.stringify({ error: 'Unsupported staff security action' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const staff = await prisma.staff.findUnique({ where: { id: params.id }, select: { id: true, active: true, userId: true } });
    if (!staff) return new Response(JSON.stringify({ error: 'Staff member not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });

    if (action === 'deactivate') {
      await prisma.$transaction(async (database) => {
        await database.staff.update({ where: { id: staff.id }, data: { active: false } });
        if (staff.userId) {
          await database.user.update({ where: { id: staff.userId }, data: { active: false, tokenVersion: { increment: 1 } } });
          await database.userSession.updateMany({ where: { userId: staff.userId, revokedAt: null }, data: { revokedAt: new Date(), revokeReason: 'staff_deactivated' } });
        }
      });
      await logAudit(request, 'STAFF_DEACTIVATED', { staffId: staff.id, userId: staff.userId, actorUserId: actor.id });
      return new Response(JSON.stringify({ ok: true, action }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (!staff.userId) return new Response(JSON.stringify({ error: 'This staff member has no portal account' }), { status: 409, headers: { 'Content-Type': 'application/json' } });
    await prisma.twoFactorOtp.deleteMany({ where: { userId: staff.userId } });
    await invalidateSessions(staff.userId);
    await logAudit(request, 'STAFF_2FA_REENROLMENT_FORCED', { staffId: staff.id, userId: staff.userId, actorUserId: actor.id });
    return new Response(JSON.stringify({ ok: true, action }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return handleApiError(error, 'update staff security', request);
  }
};
