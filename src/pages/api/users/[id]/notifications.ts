import type { APIRoute } from 'astro';
import { requirePermission } from '../../../../features/rbac/middleware';
import { prisma } from '../../../../lib/prisma';
import { handleApiError } from '../../../../lib/apiError';

export const prerender = false;

/**
 * PUT /api/users/[id]/notifications
 * Toggle whether a user receives email notifications (match reminders, system alerts).
 */
export const PUT: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'users:update');

    const { id: userId } = params;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await request.json();
    if (typeof data.emailEnabled !== 'boolean') {
      return new Response(JSON.stringify({ error: 'emailEnabled must be a boolean' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const setting = await prisma.userNotificationSetting.upsert({
      where: { userId },
      create: { userId, emailEnabled: data.emailEnabled },
      update: { emailEnabled: data.emailEnabled },
    });

    return new Response(JSON.stringify({ emailEnabled: setting.emailEnabled }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'update notification settings', request);
  }
};
