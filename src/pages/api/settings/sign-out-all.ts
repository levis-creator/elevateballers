import type { APIRoute } from 'astro';
import { requirePermission } from '../../../features/rbac/middleware';
import { logAudit } from '../../../features/cms/lib/audit';
import { handleApiError, json } from '../../../lib/apiError';
import { enforceRateLimit } from '../../../lib/rateLimit';
import { invalidateAllSessions } from '../../../features/cms/lib/auth';
import { notifySecurityAdmins } from '../../../lib/securityNotifications';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const user = await requirePermission(request, 'site_settings:manage');
    const limited = await enforceRateLimit(
      `settings:${user.id}:sign-out-all`,
      1,
      15 * 60 * 1000,
      'Sign out all users is temporarily limited. Please try again later.',
    );
    if (limited) return limited;

    const affectedUsers = await invalidateAllSessions();
    cookies.delete('auth-token', { path: '/' });
    logAudit(request, 'AUTH_SIGN_OUT_ALL', { affectedUsers, sessionsRevoked: true });
    await notifySecurityAdmins('security_session_activity', 'All sessions signed out', 'An administrator signed out all authenticated users.');

    return json({
      message: 'All authenticated sessions have been signed out.',
      affectedUsers,
    }, 200);
  } catch (error) {
    return handleApiError(error, 'sign out all users', request);
  }
};
