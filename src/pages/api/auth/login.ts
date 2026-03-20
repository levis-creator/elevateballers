import type { APIRoute } from 'astro';
import {
  findUserByEmail,
  verifyPassword,
  createOtpForUser,
  createOtpSessionToken,
  recordFailedLogin,
  resetFailedLogin,
} from '../../../features/cms/lib/auth';
import { sendLoginOtpEmail } from '../../../lib/email';
import { checkRateLimit, getRateLimitRetryAfter } from '../../../lib/rateLimit';
import { prisma } from '../../../lib/prisma';
import { logAudit } from '../../../features/cms/lib/audit';

export const prerender = false;

function getIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  if (local.length <= 2) return `${local[0] ?? '*'}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const ip = getIp(request);
  const userAgent = request.headers.get('user-agent') ?? undefined;

  // Rate limit: 10 attempts per 15 minutes per IP
  if (!checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000)) {
    const retryAfter = getRateLimitRetryAfter(`login:${ip}`);
    await logAudit(request, 'AUTH_LOGIN_RATE_LIMITED', {
      ip,
      userAgent,
    });
    return json(
      { error: `Too many login attempts. Please try again in ${retryAfter} seconds.` },
      429
    );
  }

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON in request body' }, 400);
    }

    const { email, password } = body;

    if (!email || !password) {
      return json({ error: 'Email and password are required' }, 400);
    }

    const user = await findUserByEmail(email);

    // Log the attempt and return generic error for unknown email
    if (!user) {
      await prisma.loginEvent.create({
        data: {
          email,
          success: false,
          ipAddress: ip,
          userAgent,
          failReason: 'USER_NOT_FOUND',
        },
      });
      await logAudit(request, 'AUTH_LOGIN_FAILED', {
        reason: 'USER_NOT_FOUND',
        email: maskEmail(email),
        ip,
        userAgent,
      });
      return json({ error: 'Invalid credentials' }, 401);
    }

    // Check account lockout
    if (user.lockedUntil && new Date() < new Date(user.lockedUntil)) {
      const secondsLeft = Math.ceil(
        (new Date(user.lockedUntil).getTime() - Date.now()) / 1000
      );
      await prisma.loginEvent.create({
        data: {
          userId: user.id,
          email,
          success: false,
          ipAddress: ip,
          userAgent,
          failReason: 'ACCOUNT_LOCKED',
        },
      });
      await logAudit(
        request,
        'AUTH_LOGIN_FAILED',
        {
          reason: 'ACCOUNT_LOCKED',
          email: maskEmail(email),
          ip,
          userAgent,
        },
        user.id
      );
      return json(
        { error: `Account locked. Try again in ${Math.ceil(secondsLeft / 60)} minutes.` },
        423
      );
    }

    // Check active status
    if (!user.active) {
      await prisma.loginEvent.create({
        data: {
          userId: user.id,
          email,
          success: false,
          ipAddress: ip,
          userAgent,
          failReason: 'ACCOUNT_INACTIVE',
        },
      });
      await logAudit(
        request,
        'AUTH_LOGIN_FAILED',
        {
          reason: 'ACCOUNT_INACTIVE',
          email: maskEmail(email),
          ip,
          userAgent,
        },
        user.id
      );
      return json({ error: 'Invalid credentials' }, 401);
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      await recordFailedLogin(user.id);
      await prisma.loginEvent.create({
        data: {
          userId: user.id,
          email,
          success: false,
          ipAddress: ip,
          userAgent,
          failReason: 'INVALID_PASSWORD',
        },
      });
      await logAudit(
        request,
        'AUTH_LOGIN_FAILED',
        {
          reason: 'INVALID_PASSWORD',
          email: maskEmail(email),
          ip,
          userAgent,
        },
        user.id
      );
      return json({ error: 'Invalid credentials' }, 401);
    }

    // Credentials valid — reset lockout counters
    await resetFailedLogin(user.id);

    // Generate and send OTP
    const code = await createOtpForUser(user.id);
    try {
      await sendLoginOtpEmail({ email: user.email, name: user.name, code });
    } catch (emailError) {
      console.error('[login] Failed to send OTP email:', emailError);
      return json({ error: 'Failed to send verification code. Please try again.' }, 500);
    }

    const otpSessionToken = createOtpSessionToken({ id: user.id, email: user.email });

    const forwardedProto = request.headers.get('x-forwarded-proto');
    const forwardedSsl = request.headers.get('x-forwarded-ssl');
    const urlProtocol = new URL(request.url).protocol;
    const isSecure =
      forwardedProto === 'https' || forwardedSsl === 'on' || urlProtocol === 'https:';

    cookies.set('otp-session', otpSessionToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 60 * 15,
      path: '/',
    });

    await logAudit(request, 'AUTH_LOGIN_OTP_SENT', {
      userId: user.id,
      email: user.email,
      ip,
    });

    return json({ status: 'otp_required' }, 200);
  } catch (error) {
    console.error('Login error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return json(
      { error: 'Login failed', details: process.env.NODE_ENV === 'development' ? msg : undefined },
      500
    );
  }
};
