import type { APIRoute } from 'astro';
import {
  verifyOtpSessionToken,
  verifyOtpForUser,
  createToken,
} from '../../../features/cms/lib/auth';
import { checkRateLimit, getRateLimitRetryAfter } from '../../../lib/rateLimit';
import { prisma } from '../../../lib/prisma';
import { logAudit } from '../../../features/cms/lib/audit';
import { handleApiError, json } from '../../../lib/apiError';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
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

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      request.headers.get('x-real-ip') ??
      'unknown';

    const otpSessionToken = cookies.get('otp-session')?.value;
    if (!otpSessionToken) {
      return json({ error: 'Session expired. Please sign in again.' }, 401);
    }

    const session = verifyOtpSessionToken(otpSessionToken);
    if (!session) {
      cookies.delete('otp-session', { path: '/' });
      return json({ error: 'Session expired. Please sign in again.' }, 401);
    }

    // Rate limit OTP attempts per user: 5 per 15 minutes
    if (!await checkRateLimit(`otp:${session.userId}`, 5, 15 * 60 * 1000)) {
      const retryAfter = await getRateLimitRetryAfter(`otp:${session.userId}`);
      return json(
        { error: `Too many attempts. Please try again in ${retryAfter} seconds.` },
        429
      );
    }

    const valid = await verifyOtpForUser(session.userId, code.trim());
    if (!valid) {
      await prisma.loginEvent.create({
        data: {
          userId: session.userId,
          email: '',
          success: false,
          ipAddress: ip,
          userAgent: request.headers.get('user-agent') ?? undefined,
        },
      });
      return json({ error: 'Invalid or expired verification code.' }, 401);
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
    const authToken = createToken({
      id: userWithRoles.id,
      email: userWithRoles.email,
      tokenVersion: userWithRoles.tokenVersion,
    });

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

    cookies.set('auth-token', authToken, { ...cookieOptions, maxAge: 60 * 60 * 24 * 7 });
    cookies.delete('otp-session', { path: '/' });

    await logAudit(request, 'AUTH_LOGIN_SUCCESS', {
      userId: userWithRoles.id,
      email: userWithRoles.email,
      ip,
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
