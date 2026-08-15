import type { APIRoute } from 'astro';
import { getCurrentUser, hashPassword, verifyPassword, validatePasswordAgainstPolicy, invalidateSessions, recordPasswordHistory } from '../../../features/cms/lib/auth';
import { prisma } from '../../../lib/prisma';
import { getUserWithPermissions } from '../../../features/rbac/permissions';
import { logAudit } from '../../../features/cms/lib/audit';
import { handleApiError } from '../../../lib/apiError';
import { siteSettingsService, resolveSecuritySettings } from '../../../features/settings';
import { notifySecurityAdmins } from '../../../lib/securityNotifications';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get user with roles and permissions
    const userWithPermissions = await getUserWithPermissions(user.id);

    if (!userWithPermissions) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        user: userWithPermissions,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return handleApiError(error, 'get current user', request);
  }
};

export const PUT: APIRoute = async ({ request, cookies }) => {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let data: any;
    try {
      data = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { name, email, password, currentPassword } = data;

    const updateData: any = {};
    let previousPasswordHash: string | null = null;
    let passwordHistoryCount = 0;
    if (name) updateData.name = name;

    const isEmailChange = Boolean(email);
    const isPasswordChange = Boolean(password);
    const requiresReauth = isEmailChange || isPasswordChange;

    if (isEmailChange) {
      const emailValue = String(email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
        return new Response(JSON.stringify({ error: 'Invalid email address' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const existing = await prisma.user.findUnique({
        where: { email: emailValue },
        select: { id: true },
      });
      if (existing && existing.id !== user.id) {
        return new Response(JSON.stringify({ error: 'Email already in use' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      updateData.email = emailValue;
    }

    if (isPasswordChange) {
      const security = resolveSecuritySettings(await siteSettingsService.list('security').catch(() => []));
      passwordHistoryCount = security.security_passwordHistoryCount;
      const strengthError = await validatePasswordAgainstPolicy(user.id, String(password), security);
      if (strengthError) {
        return new Response(JSON.stringify({ error: strengthError }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      updateData.passwordHash = await hashPassword(String(password));
    }

    if (requiresReauth) {
      const current = String(currentPassword || '');
      if (!current) {
        return new Response(JSON.stringify({ error: 'Current password is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { passwordHash: true },
      });
      if (!dbUser || !dbUser.passwordHash) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (isPasswordChange) previousPasswordHash = dbUser.passwordHash;

      const ok = await verifyPassword(current, dbUser.passwordHash);
      if (!ok) {
        return new Response(JSON.stringify({ error: 'Invalid current password' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    await prisma.$transaction(async (database) => {
      await database.user.update({ where: { id: user.id }, data: updateData });
      if (previousPasswordHash && passwordHistoryCount > 0) {
        await recordPasswordHistory(database, user.id, previousPasswordHash, passwordHistoryCount);
      }
    });

    await logAudit(request, 'AUTH_PROFILE_UPDATED', {
      userId: user.id,
      updatedFields: Object.keys(updateData),
    }, user.id);
    if (isPasswordChange) await notifySecurityAdmins('security_password_activity', 'Password changed', 'An administrator password was changed.');

    if (requiresReauth) {
      // Invalidate all existing sessions after sensitive changes
      await invalidateSessions(user.id);
      cookies.delete('auth-token', { path: '/' });
    }

    // Get updated user with roles and permissions
    const updatedUserWithPermissions = await getUserWithPermissions(user.id);

    return new Response(
      JSON.stringify({
        user: updatedUserWithPermissions,
        reloginRequired: requiresReauth,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return handleApiError(error, 'update user', request);
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await prisma.user.delete({
      where: { id: user.id },
    });

    await logAudit(request, 'AUTH_ACCOUNT_DELETED', {
      userId: user.id,
    }, user.id);

    return new Response(JSON.stringify({ message: 'User deleted successfully' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': 'auth-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Strict',
      },
    });
  } catch (error) {
    return handleApiError(error, 'delete user', request);
  }
};
