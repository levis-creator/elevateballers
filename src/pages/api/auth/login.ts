import type { APIRoute } from 'astro';
import {
  findUserByEmail,
  verifyPassword,
  createOtpForUser,
  createOtpSessionToken,
} from '../../../features/cms/lib/auth';
import { sendLoginOtpEmail } from '../../../lib/email';

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

    const { email, password } = body;

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Credentials valid — generate OTP and issue a short-lived session cookie
    const code = await createOtpForUser(user.id);

    // Send OTP email (non-blocking failure: log but don't expose error to client)
    try {
      await sendLoginOtpEmail({ email: user.email, name: user.name, code });
    } catch (emailError) {
      console.error('[login] Failed to send OTP email:', emailError);
      return new Response(
        JSON.stringify({ error: 'Failed to send verification code. Please try again.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Short-lived token to identify the pending session on the verify-otp step
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
      maxAge: 60 * 15, // 15 minutes
      path: '/',
    });

    return new Response(
      JSON.stringify({ status: 'otp_required' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Login error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({
        error: 'Login failed',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
