import type { APIRoute } from 'astro';
import {
  verifyOtpSessionToken,
  verifyOtpForUser,
  createToken,
  createUserSession,
  writeAuditLog,
} from '../../../features/cms/lib/auth';
import { checkRateLimit, getRateLimitRetryAfter, rateLimitResponse } from '../../../lib/rateLimit';
import { prisma } from '../../../lib/prisma';
import { logAudit } from '../../../features/cms/lib/audit';
import { handleApiError, json } from '../../../lib/apiError';
import { siteSettingsService, resolveSecuritySettings } from '../../../features/settings';
import { notifySecurityAdmins } from '../../../lib/securityNotifications';
import { getClientIp } from '../../../lib/getClientIp';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON in request body' }, 400);
    }

    const { code } = body;

    if (!code || typeof code !== 'string' || !/^\d{6}$/.test(code.trim())) {
      return json({ error: 'A 6-digit verification code is required' }, 400);
    }

    const ip = getClientIp(request, clientAddress);

    const otpSessionToken = cookies.get('otp-session')?.value;
    if (!otpSessionToken) {
      return json({ error: 'Session expired. Please sign in again.' }, 401);
    }

    const session = verifyOtpSessionToken(otpSessionToken);
    if (!session) {
      cookies.delete('otp-session', { path: '/' });
      return json({ error: 'Session expired. Please sign in again.' }, 401);
    }

    const security = resolveSecuritySettings(
      await siteSettingsService.list('security').catch(() => []),
    );

    if (!await checkRateLimit(
      `otp:${session.userId}`,
      security.security_otpRateLimitMax,
      security.security_otpRateLimitWindowMinutes * 60 * 1000,
    )) {
      const retryAfter = await getRateLimitRetryAfter(`otp:${session.userId}`);
      return rateLimitResponse(
        retryAfter,
        `Too many attempts. Please try again in ${retryAfter} seconds.`,
      );
    }

    const verification = await verifyOtpForUser(session.userId, code.trim());
    if (!verification.valid) {
      await prisma.loginEvent.create({
        data: {
          userId: session.userId,
          email: '',
          success: false,
          ipAddress: ip,
          userAgent: request.headers.get('user-agent') ?? undefined,
        },
      });
      if (verification.lockedUntil) {
        return json({
          error: `Too many invalid codes. This code is locked for ${security.security_otpLockoutMinutes} minutes. Return to login to request a new code.`,
          lockedUntil: verification.lockedUntil.toISOString(),
          attemptsRemaining: 0,
        }, 429);
      }
      return json({
        error: verification.attemptsRemaining > 0
          ? `Invalid verification code. ${verification.attemptsRemaining} attempt${verification.attemptsRemaining === 1 ? '' : 's'} remaining.`
          : 'Invalid or expired verification code.',
        attemptsRemaining: verification.attemptsRemaining,
      }, 401);
    }

    const userWithRoles = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { userRoles: { include: { role: true } } },
    });

    if (!userWithRoles) {
      return json({ error: 'User not found.' }, 401);
    }

    // Re-check active status at the point of issuing the full token
    if (!userWithRoles.active) {
      return json({ error: 'Invalid credentials' }, 401);
    }

    await prisma.loginEvent.create({
      data: {
        userId: userWithRoles.id,
        email: userWithRoles.email,
        success: true,
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') ?? undefined,
      },
    });

    // Include tokenVersion so existing sessions can be invalidated
    const userSession = await createUserSession(
      userWithRoles.id,
      security.security_sessionDurationDays,
      security.security_maxConcurrentSessions,
    );
    if (userSession.evictedCount > 0) {
      await writeAuditLog(userWithRoles.id, 'AUTH_SESSION_EVICTED', userWithRoles.id, {
        evictedCount: userSession.evictedCount,
        maxConcurrentSessions: security.security_maxConcurrentSessions,
        reason: 'concurrent_limit',
        source: 'explicit',
      });
      await notifySecurityAdmins('security_session_activity', 'Session limit enforced', 'An older administrator session was revoked because the concurrent-session limit was reached.');
    }

    const authToken = createToken({
      id: userWithRoles.id,
      email: userWithRoles.email,
      tokenVersion: userWithRoles.tokenVersion,
    }, security.security_sessionDurationDays, userSession.sessionToken);

    const forwardedProto = request.headers.get('x-forwarded-proto');
    const forwardedSsl = request.headers.get('x-forwarded-ssl');
    const urlProtocol = new URL(request.url).protocol;
    const isSecure =
      forwardedProto === 'https' || forwardedSsl === 'on' || urlProtocol === 'https:';

    const cookieOptions = {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'strict' as const,
      path: '/',
    };

    cookies.set('auth-token', authToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * security.security_sessionDurationDays,
    });
    cookies.delete('otp-session', { path: '/' });

    await logAudit(request, 'AUTH_LOGIN_SUCCESS', {
      userId: userWithRoles.id,
      email: userWithRoles.email,
      ip,
      sessionCreated: true,
      sessionDurationDays: security.security_sessionDurationDays,
    }, userWithRoles.id);

    return json(
      {
        user: {
          id: userWithRoles.id,
          email: userWithRoles.email,
          name: userWithRoles.name,
          roles: userWithRoles.userRoles.map((ur) => ({
            id: ur.role.id,
            name: ur.role.name,
            description: ur.role.description,
          })),
        },
      },
      200
    );
  } catch (error) {
    return handleApiError(error, 'verify OTP', request);
  }
};
