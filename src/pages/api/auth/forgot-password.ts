import type { APIRoute } from 'astro';
import crypto from 'node:crypto';
import { prisma } from '../../../lib/prisma';
import { findUserByEmail } from '../../../features/cms/lib/auth';
import { sendPasswordResetEmail, sendWelcomeSetPasswordEmail } from '../../../lib/email';
import { getRuntimeEmailTemplates } from '../../../lib/email/runtime-settings';
import { checkRateLimit, getRateLimitRetryAfter } from '../../../lib/rateLimit';
import { logAudit } from '../../../features/cms/lib/audit';
import { handleApiError } from '../../../lib/apiError';
import { getResetTtlMinutes, getInviteTtlMinutes } from '../../../features/auth/lib/reset-ttl';
import { getClientIp } from '../../../lib/getClientIp';

export const prerender = false;

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const ip = getClientIp(request, clientAddress);

  // Rate limit: 5 requests per 15 minutes per IP
  if (!await checkRateLimit(`forgot:${ip}`, 5, 15 * 60 * 1000)) {
    const retryAfter = await getRateLimitRetryAfter(`forgot:${ip}`);
    return new Response(
      JSON.stringify({ error: `Too many requests. Please try again in ${retryAfter} seconds.` }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

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

    const email = String(body?.email || '').trim().toLowerCase();

    if (!email || !isValidEmail(email)) {
      return new Response(
        JSON.stringify({ error: 'Please enter a valid email address' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const user = await findUserByEmail(email);
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const isInvite = !user.activatedAt;
      const configuredTtl = (await getRuntimeEmailTemplates()).linkExpiry;
      const ttlMinutes = configuredTtl || (isInvite ? getInviteTtlMinutes() : getResetTtlMinutes());
      const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      const origin = new URL(request.url).origin;
      const resetUrl = `${origin}/admin/reset-password?token=${token}`;

      if (import.meta.env.DEV) {
        // Local-dev affordance: the reset link IS delivered via the server
        // console, so the forgot → reset flow is testable without a reachable
        // email provider. `import.meta.env.DEV` is TRUE only under `astro dev`
        // (compiled to false in production builds), so links are never logged
        // in prod. Mirrors the login OTP affordance in api/auth/login.ts.
        console.log(
          `\n🔑 [dev] Password ${isInvite ? 'set-password (invite)' : 'reset'} link for ${user.email}:\n   ${resetUrl}\n   (expires in ${ttlMinutes} min)\n`,
        );
      }

      if (isInvite) {
        await sendWelcomeSetPasswordEmail({
          email: user.email,
          name: user.name ?? user.email,
          setPasswordUrl: resetUrl,
          expiresInMinutes: ttlMinutes,
        });
      } else {
        await sendPasswordResetEmail({
          email: user.email,
          name: user.name,
          resetUrl,
          expiresInMinutes: ttlMinutes,
        });
      }

      await logAudit(request, isInvite ? 'AUTH_INVITATION_RESENT' : 'AUTH_PASSWORD_RESET_REQUESTED', {
        userId: user.id,
        email: user.email,
        ip,
      }, user.id);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        message: 'If an account exists for that email, a reset link has been sent.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleApiError(error, 'process forgot password request', request);
  }
};
