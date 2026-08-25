import type { APIRoute } from 'astro';
import crypto from 'node:crypto';
import { prisma } from '../../../../lib/prisma';
import { requireSystemAdmin } from '@/features/rbac/auth-helpers';
import { getUserIdFromRequest, writeAuditLog } from '../../../../features/cms/lib/auth';
import { sendPasswordResetEmail, sendWelcomeSetPasswordEmail } from '../../../../lib/email';
import { getRuntimeEmailTemplates } from '../../../../lib/email/runtime-settings';
import { getResetTtlMinutes, getInviteTtlMinutes } from '../../../../features/auth/lib/reset-ttl';
import { handleApiError } from '../../../../lib/apiError';

export const prerender = false;

/**
 * POST /api/users/[id]/send-reset
 * Admin-triggered password reset/invite email — the same link as the
 * self-service "forgot password" flow, but reachable without knowing whether
 * the target ever checks their inbox for it themselves.
 */
export const POST: APIRoute = async ({ params, request }) => {
  try {
    await requireSystemAdmin(request);

    const { id: userId } = params;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const isInvite = !user.activatedAt;
    const configuredTtl = (await getRuntimeEmailTemplates()).linkExpiry;
    const ttlMinutes = configuredTtl || (isInvite ? getInviteTtlMinutes() : getResetTtlMinutes());
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt } });

    const origin = new URL(request.url).origin;
    const resetUrl = `${origin}/admin/reset-password?token=${token}`;

    if (isInvite) {
      await sendWelcomeSetPasswordEmail({ email: user.email, name: user.name ?? user.email, setPasswordUrl: resetUrl, expiresInMinutes: ttlMinutes });
    } else {
      await sendPasswordResetEmail({ email: user.email, name: user.name, resetUrl, expiresInMinutes: ttlMinutes });
    }

    const adminId = getUserIdFromRequest(request) ?? 'unknown';
    await writeAuditLog(user.id, isInvite ? 'AUTH_INVITATION_RESENT' : 'AUTH_PASSWORD_RESET_REQUESTED', adminId, { email: user.email }).catch(() => {});

    return new Response(JSON.stringify({ ok: true, isInvite }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'send password reset', request);
  }
};
