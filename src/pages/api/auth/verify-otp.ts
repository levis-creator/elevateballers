import type { APIRoute } from 'astro';
import {
  verifyOtpSessionToken,
  verifyOtpForUser,
  createToken,
} from '../../../features/cms/lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { code } = body;

    if (!code || typeof code !== 'string' || !/^\d{6}$/.test(code.trim())) {
      return new Response(
        JSON.stringify({ error: 'A 6-digit verification code is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Read the short-lived OTP session cookie set by login
    const otpSessionToken = cookies.get('otp-session')?.value;
    if (!otpSessionToken) {
      return new Response(
        JSON.stringify({ error: 'Session expired. Please sign in again.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const session = verifyOtpSessionToken(otpSessionToken);
    if (!session) {
      cookies.delete('otp-session', { path: '/' });
      return new Response(
        JSON.stringify({ error: 'Session expired. Please sign in again.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const valid = await verifyOtpForUser(session.userId, code.trim());
    if (!valid) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired verification code.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // OTP verified — issue the full auth token and clear the OTP session cookie
    const { prisma } = await import('../../../lib/prisma');
    const userWithRoles = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!userWithRoles) {
      return new Response(
        JSON.stringify({ error: 'User not found.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const authToken = createToken({ id: userWithRoles.id, email: userWithRoles.email });

    const forwardedProto = request.headers.get('x-forwarded-proto');
    const forwardedSsl = request.headers.get('x-forwarded-ssl');
    const urlProtocol = new URL(request.url).protocol;
    const isSecure =
      forwardedProto === 'https' || forwardedSsl === 'on' || urlProtocol === 'https:';

    const cookieOptions = {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax' as const,
      path: '/',
    };

    cookies.set('auth-token', authToken, { ...cookieOptions, maxAge: 60 * 60 * 24 * 7 });
    cookies.delete('otp-session', { path: '/' });

    return new Response(
      JSON.stringify({
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
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Verify OTP error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({
        error: 'Verification failed',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
