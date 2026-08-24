import { prisma } from '../../../../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import type { User } from '../../types';
import { siteSettingsService } from '../../../settings';
import { resolveSecuritySettings, type SecuritySettings } from '../../../settings/application/securitySettings';

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

export function validatePasswordStrength(password: string, minimumLength = 8): string | null {
  if (password.length < minimumLength) return `Password must be at least ${minimumLength} characters.`;
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

export function createToken(
  user: { id: string; email: string; tokenVersion: number },
  sessionDurationDays = 7,
  sessionToken?: string,
): string {
  const safeDurationDays = Number.isInteger(sessionDurationDays)
    ? Math.max(1, Math.min(14, sessionDurationDays))
    : 7;
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      tokenVersion: user.tokenVersion,
      ...(sessionToken ? { sessionToken } : {}),
    },
    JWT_SECRET,
    { expiresIn: `${safeDurationDays}d` }
  );
}

async function checkPasswordBreach(password: string): Promise<boolean> {
  const digest = crypto.createHash('sha1').update(password, 'utf8').digest('hex').toUpperCase();
  const response = await fetch(`https://api.pwnedpasswords.com/range/${digest.slice(0, 5)}`, {
    headers: { 'Add-Padding': 'true', 'User-Agent': 'ElevateBallers-password-policy' },
    signal: AbortSignal.timeout(5_000),
  });
  if (response.status === 404) return false;
  if (!response.ok) throw new Error(`Breach check unavailable (${response.status})`);
  const suffix = digest.slice(5);
  const body = await response.text();
  return body.split(/\r?\n/).some((line) => line.split(':', 1)[0]?.trim().toUpperCase() === suffix);
}

export async function validatePasswordAgainstPolicy(
  userId: string | null,
  password: string,
  securitySettings?: SecuritySettings,
): Promise<string | null> {
  const security = securitySettings ?? await getRuntimeSecuritySettings();
  const strengthError = validatePasswordStrength(password, security.security_passwordMinLength);
  if (strengthError) return strengthError;
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
    const history = security.security_passwordHistoryCount > 0
      ? await prisma.passwordHistory.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: security.security_passwordHistoryCount, select: { passwordHash: true } })
      : [];
    if (user && await verifyPassword(password, user.passwordHash)) return 'You cannot reuse a recent password.';
    for (const previous of history) if (await verifyPassword(password, previous.passwordHash)) return 'You cannot reuse a recent password.';
  }
  if (security.security_passwordBreachCheck) {
    try {
      if (await checkPasswordBreach(password)) return 'Choose a different password because this one has appeared in known breach data.';
    } catch (error) {
      console.warn('[auth] Password breach check unavailable, allowing password:', error instanceof Error ? error.message : String(error));
    }
  }
  return null;
}

export async function recordPasswordHistory(
  database: Prisma.TransactionClient | typeof prisma,
  userId: string,
  passwordHash: string,
  keep: number,
): Promise<void> {
  if (keep <= 0) return;
  await database.passwordHistory.create({ data: { userId, passwordHash } });
  const old = await database.passwordHistory.findMany({ where: { userId }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: keep, select: { id: true } });
  if (old.length) await database.passwordHistory.deleteMany({ where: { id: { in: old.map((item) => item.id) } } });
}

export function verifyToken(
  token: string
): { userId: string; email: string; tokenVersion: number; sessionToken?: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      tokenVersion: number;
      sessionToken?: string;
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
    if (payload.sessionToken) {
      const session = await prisma.userSession.findUnique({
        where: { tokenHash: hashSessionToken(payload.sessionToken) },
        select: { userId: true, expiresAt: true, revokedAt: true, id: true, lastSeenAt: true },
      });
      if (!session || session.userId !== user.id || session.revokedAt || session.expiresAt <= new Date()) return null;
      if (!session.lastSeenAt || session.lastSeenAt.getTime() < Date.now() - 5 * 60 * 1000) {
        void prisma.userSession.updateMany({
          where: { id: session.id, revokedAt: null },
          data: { lastSeenAt: new Date() },
        });
      }
    }
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

export async function recordFailedLogin(userId: string): Promise<void> {
  const security = await getRuntimeSecuritySettings();
  const now = new Date();
  const lockedUntil = new Date(now.getTime() + security.security_loginLockoutMinutes * 60 * 1000);

  await prisma.$transaction(async (database) => {
    const incremented = await database.user.updateMany({
      where: { id: userId },
      data: { failedLoginAttempts: { increment: 1 } },
    });
    if (incremented.count === 0) return;

    // The increment is performed by the database, so concurrent failures
    // cannot overwrite one another. Any request observing the threshold sets
    // the same lockout state; no read/modify/write race remains.
    await database.user.updateMany({
      where: {
        id: userId,
        failedLoginAttempts: { gte: security.security_loginMaxAttempts },
        OR: [{ lockedUntil: null }, { lockedUntil: { lte: now } }],
      },
      data: { lockedUntil },
    });
  });
}

export async function resetFailedLogin(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });
}

function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function getSessionTokenFromRequest(request: Request): string | null {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyToken(token)?.sessionToken ?? null;
}

export async function createUserSession(
  userId: string,
  sessionDurationDays: number,
  maxConcurrentSessions: number,
): Promise<{ sessionToken: string; expiresAt: Date; evictedCount: number }> {
  const sessionToken = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + sessionDurationDays * 24 * 60 * 60 * 1000);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const evictedCount = await prisma.$transaction(async (database) => {
        await database.userSession.create({
          data: { userId, tokenHash: hashSessionToken(sessionToken), expiresAt, lastSeenAt: new Date() },
        });
        const activeSessions = await database.userSession.findMany({
          where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          select: { id: true },
        });
        const revokeCount = Math.max(0, activeSessions.length - maxConcurrentSessions);
        if (revokeCount > 0) {
          await database.userSession.updateMany({
            where: { id: { in: activeSessions.slice(0, revokeCount).map((session) => session.id) }, revokedAt: null },
            data: { revokedAt: new Date(), revokeReason: 'concurrent_limit' },
          });
        }
        return revokeCount;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      return { sessionToken, expiresAt, evictedCount };
    } catch (error: unknown) {
      if (attempt === 0 && typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2034') continue;
      throw error;
    }
  }
  throw new Error('Unable to create user session');
}

export async function revokeSessionFromRequest(request: Request): Promise<void> {
  const sessionToken = getSessionTokenFromRequest(request);
  if (!sessionToken) return;
  await prisma.userSession.updateMany({
    where: { tokenHash: hashSessionToken(sessionToken), revokedAt: null },
    data: { revokedAt: new Date(), revokeReason: 'logout' },
  });
}

/** Increment tokenVersion and revoke records to invalidate all sessions for a user. */
export async function invalidateSessions(userId: string): Promise<void> {
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { tokenVersion: { increment: 1 } } }),
    prisma.userSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date(), revokeReason: 'user_invalidation' },
    }),
  ]);
}

export async function invalidateAllSessions(): Promise<number> {
  const [users] = await prisma.$transaction([
    prisma.user.updateMany({ data: { tokenVersion: { increment: 1 } } }),
    prisma.userSession.updateMany({
      where: { revokedAt: null },
      data: { revokedAt: new Date(), revokeReason: 'global_invalidation' },
    }),
  ]);
  return users.count;
}

// ---------------------------------------------------------------------------
// Email OTP helpers
// ---------------------------------------------------------------------------

function hashOtpCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

async function getRuntimeSecuritySettings() {
  const records = await siteSettingsService.list('security').catch(() => []);
  return resolveSecuritySettings(records);
}

export async function createOtpForUser(userId: string): Promise<string> {
  const security = await getRuntimeSecuritySettings();
  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
  const codeHash = hashOtpCode(code);
  const expiresAt = new Date(Date.now() + security.security_otpExpiryMinutes * 60 * 1000);

  await prisma.twoFactorOtp.deleteMany({ where: { userId } });
  await prisma.twoFactorOtp.create({ data: { userId, codeHash, expiresAt } });

  return code;
}

export async function verifyOtpForUser(
  userId: string,
  code: string,
): Promise<{ valid: boolean; attemptsRemaining: number; lockedUntil?: Date }> {
  const security = await getRuntimeSecuritySettings();
  const codeHash = hashOtpCode(code);
  const now = new Date();
  const otp = await prisma.twoFactorOtp.findFirst({
    where: { userId, expiresAt: { gt: now } },
    orderBy: { createdAt: 'desc' },
  });
  if (!otp) return { valid: false, attemptsRemaining: 0 };
  const availableOtpWhere: Prisma.TwoFactorOtpWhereInput = {
    id: otp.id,
    expiresAt: { gt: now },
    attemptCount: { lt: security.security_otpMaxAttempts },
    OR: [{ lockedUntil: null }, { lockedUntil: { lte: now } }],
  };

  if (otp.codeHash === codeHash) {
    const consumed = await prisma.twoFactorOtp.deleteMany({
      where: { ...availableOtpWhere, codeHash },
    });
    if (consumed.count === 1) {
      return { valid: true, attemptsRemaining: security.security_otpMaxAttempts };
    }
  } else {
    const incremented = await prisma.twoFactorOtp.updateMany({
      where: availableOtpWhere,
      data: { attemptCount: { increment: 1 }, lockedUntil: null },
    });
    if (incremented.count === 1) {
      await prisma.twoFactorOtp.updateMany({
        where: { id: otp.id, attemptCount: { gte: security.security_otpMaxAttempts }, lockedUntil: null },
        data: { lockedUntil: new Date(now.getTime() + security.security_otpLockoutMinutes * 60 * 1000) },
      });
    }
  }

  const current = await prisma.twoFactorOtp.findUnique({ where: { id: otp.id } });
  if (!current || current.expiresAt <= now) {
    return { valid: false, attemptsRemaining: 0 };
  }
  if (current.lockedUntil && current.lockedUntil > now) {
    return { valid: false, attemptsRemaining: 0, lockedUntil: current.lockedUntil };
  }
  if (current.codeHash === codeHash) {
    // A concurrent failed attempt may have raced with the first read. Only a
    // conditional delete can consume the still-valid, unlocked code safely.
    const consumed = await prisma.twoFactorOtp.deleteMany({
      where: { ...availableOtpWhere, codeHash },
    });
    if (consumed.count === 1) {
      return { valid: true, attemptsRemaining: security.security_otpMaxAttempts };
    }
  }

  if (current.lockedUntil && current.lockedUntil > now) {
    return { valid: false, attemptsRemaining: 0, lockedUntil: current.lockedUntil };
  }
  return {
    valid: false,
    attemptsRemaining: Math.max(0, security.security_otpMaxAttempts - current.attemptCount),
  };
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
    data: { userId, action, performedBy, metadata: nextMetadata as Prisma.InputJsonValue },
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
