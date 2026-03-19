import type { APIRoute } from 'astro';
import crypto from 'node:crypto';
import { prisma } from '../../../lib/prisma';
import { hashPassword, validatePasswordStrength, invalidateSessions } from '../../../features/cms/lib/auth';
import { logAudit } from '../../../features/cms/lib/audit';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch (jsonError) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = String(body?.token || '').trim();
    const password = String(body?.password || '');

    if (!token || !password) {
      return new Response(
        JSON.stringify({ error: 'Token and new password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const strengthError = validatePasswordStrength(password);
    if (strengthError) {
      return new Response(
        JSON.stringify({ error: strengthError }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!resetToken) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired reset token' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const passwordHash = await hashPassword(password);

    // Activate the account on first password set (activatedAt is null for new invites)
    const user = await prisma.user.findUnique({
      where: { id: resetToken.userId },
      select: { activatedAt: true },
    });
    const activationData = user?.activatedAt ? {} : { activatedAt: new Date() };

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash, ...activationData },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      prisma.passwordResetToken.deleteMany({
        where: {
          userId: resetToken.userId,
          id: { not: resetToken.id },
        },
      }),
    ]);

    // Invalidate all existing sessions so the new password takes effect immediately
    await invalidateSessions(resetToken.userId);

    await logAudit(request, 'AUTH_PASSWORD_RESET_COMPLETED', {
      userId: resetToken.userId,
    }, resetToken.userId);

    return new Response(
      JSON.stringify({ ok: true, message: 'Password has been reset' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Reset password error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to reset password' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
