import type { APIRoute } from 'astro';
import crypto from 'node:crypto';
import { prisma } from '../../../lib/prisma';
import { findUserByEmail } from '../../../features/cms/lib/auth';
import { sendPasswordResetEmail } from '../../../lib/email';

export const prerender = false;

const DEFAULT_TTL_MINUTES = 60;

function getTtlMinutes(): number {
  const raw = process.env.PASSWORD_RESET_TTL_MINUTES;
  const parsed = raw ? Number.parseInt(raw, 10) : DEFAULT_TTL_MINUTES;
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_TTL_MINUTES;
  return parsed;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

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
      const ttlMinutes = getTtlMinutes();
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

      try {
        await sendPasswordResetEmail({
          email: user.email,
          name: user.name,
          resetUrl,
          expiresInMinutes: ttlMinutes,
        });
      } catch (emailError) {
        console.error('Password reset email failed:', emailError);
      }

    }

    return new Response(
      JSON.stringify({
        ok: true,
        message: 'If an account exists for that email, a reset link has been sent.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to start password reset' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
