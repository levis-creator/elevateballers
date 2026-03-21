import { prisma } from '../../../../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import type { User } from '../../types';

const DEFAULT_SECRET = 'your-secret-key-change-in-production';
const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_SECRET;

// Hard-fail on startup if JWT_SECRET is the default value in any environment
if (JWT_SECRET === DEFAULT_SECRET) {
  throw new Error(
    '[auth] JWT_SECRET is not configured. Set a strong secret in your environment variables.'
  );
}

// ---------------------------------------------------------------------------
// Password
// ---------------------------------------------------------------------------

export function validatePasswordStrength(password: string): string | null {
  if (password.length < 10) return 'Password must be at least 10 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.';
  if (!/\d/.test(password)) return 'Password must contain at least one number.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must contain at least one special character.';
  return null;
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// ---------------------------------------------------------------------------
// User finders
// ---------------------------------------------------------------------------

export async function findUserByEmail(email: string): Promise<User | null> {
  return await prisma.user.findUnique({ where: { email } });
}

export async function findUserById(id: string): Promise<User | null> {
  return await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      active: true,
      tokenVersion: true,
      createdAt: true,
      updatedAt: true,
      userRoles: {
        select: {
          role: {
            select: { id: true, name: true, description: true },
          },
        },
      },
    },
  }) as any;
}

// ---------------------------------------------------------------------------
// User creation
// ---------------------------------------------------------------------------

export async function createUser(
  email: string,
  password: string,
  name: string,
  roleName: string = 'Editor'
): Promise<User> {
  const passwordHash = await hashPassword(password);

  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) throw new Error(`Role "${roleName}" not found`);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      userRoles: { create: { roleId: role.id } },
    },
    include: {
      userRoles: { include: { role: true } },
    },
  });

  return user as any;
}

// ---------------------------------------------------------------------------
// JWT
// ---------------------------------------------------------------------------

export function createToken(user: { id: string; email: string; tokenVersion: number }): string {
  return jwt.sign(
    { userId: user.id, email: user.email, tokenVersion: user.tokenVersion },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(
  token: string
): { userId: string; email: string; tokenVersion: number } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      tokenVersion: number;
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Request helpers
// ---------------------------------------------------------------------------

function getTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;
  const cookies = Object.fromEntries(
    cookieHeader.split('; ').map((c) => {
      const [key, ...values] = c.split('=');
      return [key, values.join('=')];
    })
  );
  return cookies['auth-token'] ?? null;
}

export function getUserIdFromRequest(request: Request): string | null {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyToken(token)?.userId ?? null;
}

/**
 * Get the current authenticated user.
 * Validates token signature AND tokenVersion against the database.
 * Returns null if the user is inactive or the token has been invalidated.
 */
export async function getCurrentUser(request: Request): Promise<User | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  try {
    const user = await findUserById(payload.userId);
    if (!user) return null;
    if (!(user as any).active) return null;
    if ((user as any).tokenVersion !== payload.tokenVersion) return null;
    return user;
  } catch {
    return null;
  }
}

export async function requireAuth(request: Request): Promise<User> {
  const user = await getCurrentUser(request);
  if (!user) throw new Error('Unauthorized');
  return user;
}

// ---------------------------------------------------------------------------
// Account lockout
// ---------------------------------------------------------------------------

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export async function recordFailedLogin(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { failedLoginAttempts: true },
  });
  if (!user) return;

  const attempts = (user.failedLoginAttempts ?? 0) + 1;
  const data: any = { failedLoginAttempts: attempts };

  if (attempts >= MAX_FAILED_ATTEMPTS) {
    data.lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
  }

  await prisma.user.update({ where: { id: userId }, data });
}

export async function resetFailedLogin(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });
}

/** Increment tokenVersion to invalidate all existing sessions for a user. */
export async function invalidateSessions(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { tokenVersion: { increment: 1 } },
  });
}

// ---------------------------------------------------------------------------
// Email OTP helpers
// ---------------------------------------------------------------------------

const OTP_TTL_MINUTES = 10;

function hashOtpCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export async function createOtpForUser(userId: string): Promise<string> {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = hashOtpCode(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await prisma.twoFactorOtp.deleteMany({ where: { userId } });
  await prisma.twoFactorOtp.create({ data: { userId, codeHash, expiresAt } });

  return code;
}

export async function verifyOtpForUser(userId: string, code: string): Promise<boolean> {
  const codeHash = hashOtpCode(code);
  const otp = await prisma.twoFactorOtp.findFirst({
    where: { userId, codeHash, expiresAt: { gt: new Date() } },
  });
  if (!otp) return false;
  await prisma.twoFactorOtp.delete({ where: { id: otp.id } });
  return true;
}

export function createOtpSessionToken(user: { id: string; email: string }): string {
  return jwt.sign(
    { userId: user.id, email: user.email, purpose: 'otp-session' },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
}

export function verifyOtpSessionToken(
  token: string
): { userId: string; email: string } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    if (payload.purpose !== 'otp-session') return null;
    return { userId: payload.userId, email: payload.email };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Audit log helper
// ---------------------------------------------------------------------------

export async function writeAuditLog(
  userId: string,
  action: string,
  performedBy: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const nextMetadata = {
    ...(metadata ?? {}),
    source: metadata && 'source' in metadata ? metadata.source : 'legacy',
  };
  await prisma.userAuditLog.create({
    data: { userId, action, performedBy, metadata: nextMetadata },
  });
}

// ---------------------------------------------------------------------------
// @deprecated — use requirePermission from rbac/middleware instead
// ---------------------------------------------------------------------------

export async function requireAdmin(request: Request): Promise<User> {
  const user = await requireAuth(request);

  const userWithRoles = await prisma.user.findUnique({
    where: { id: user.id },
    include: { userRoles: { include: { role: true } } },
  });

  const hasAdminRole = userWithRoles?.userRoles.some((ur) => ur.role.name === 'Admin');
  if (!hasAdminRole) throw new Error('Forbidden: Admin access required');

  return user;
}
