import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import type { User } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Find a user by email
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  return await prisma.user.findUnique({
    where: { email },
  });
}

/**
 * Find a user by ID
 */
export async function findUserById(id: string): Promise<User | null> {
  return await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      userRoles: {
        select: {
          role: {
            select: {
              id: true,
              name: true,
              description: true,
            }
          }
        }
      }
    },
  }) as any; // Type assertion to handle schema mismatch
}

/**
 * Create a new user
 * @param roleName - Optional role name (defaults to 'Editor')
 */
export async function createUser(
  email: string,
  password: string,
  name: string,
  roleName: string = 'Editor'
): Promise<User> {
  const passwordHash = await hashPassword(password);

  // Find the role by name
  const role = await prisma.role.findUnique({
    where: { name: roleName }
  });

  if (!role) {
    throw new Error(`Role "${roleName}" not found`);
  }

  // Create user and assign role
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      userRoles: {
        create: {
          roleId: role.id
        }
      }
    },
    include: {
      userRoles: {
        include: {
          role: true
        }
      }
    }
  });

  return user as any; // Type assertion to handle schema mismatch
}

/**
 * Create a JWT token for a user
 */
export function createToken(user: { id: string; email: string }): string {
  return jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    if (!JWT_SECRET || JWT_SECRET === 'your-secret-key-change-in-production') {
      console.error('JWT_SECRET is not properly configured!');
      return null;
    }
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Token verification failed:', error instanceof Error ? error.message : error);
    }
    return null;
  }
}

/**
 * Get the current user ID from request cookies without a database check
 */
export function getUserIdFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  const cookies = Object.fromEntries(
    cookieHeader.split('; ').map((c) => {
      const [key, ...values] = c.split('=');
      return [key, values.join('=')];
    })
  );

  const token = cookies['auth-token'];
  if (!token) return null;

  const payload = verifyToken(token);
  return payload?.userId || null;
}

/**
 * Get the current user from request cookies
 */
export async function getCurrentUser(request: Request): Promise<User | null> {
  const userId = getUserIdFromRequest(request);
  if (!userId) return null;

  try {
    return await findUserById(userId);
  } catch (error) {
    console.error('Error finding user by ID:', error);
    return null;
  }
}

/**
 * Require authentication - throws error if user is not authenticated
 */
export async function requireAuth(request: Request): Promise<User> {
  const user = await getCurrentUser(request);
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

// ---------------------------------------------------------------------------
// Email OTP helpers
// ---------------------------------------------------------------------------

const OTP_TTL_MINUTES = 10;

function hashOtpCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/**
 * Generate a 6-digit OTP, store its hash, and return the plaintext code.
 * Deletes any previous OTPs for the user before creating the new one.
 */
export async function createOtpForUser(userId: string): Promise<string> {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = hashOtpCode(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await prisma.twoFactorOtp.deleteMany({ where: { userId } });
  await prisma.twoFactorOtp.create({ data: { userId, codeHash, expiresAt } });

  return code;
}

/**
 * Verify an OTP code for a user.
 * Deletes the OTP record on success (single-use).
 */
export async function verifyOtpForUser(userId: string, code: string): Promise<boolean> {
  const codeHash = hashOtpCode(code);
  const otp = await prisma.twoFactorOtp.findFirst({
    where: {
      userId,
      codeHash,
      expiresAt: { gt: new Date() },
    },
  });

  if (!otp) return false;

  await prisma.twoFactorOtp.delete({ where: { id: otp.id } });
  return true;
}

/**
 * Create a short-lived JWT used to carry the user identity between the login
 * step and the OTP verification step. Expires in 15 minutes.
 */
export function createOtpSessionToken(user: { id: string; email: string }): string {
  return jwt.sign(
    { userId: user.id, email: user.email, purpose: 'otp-session' },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
}

/**
 * Verify an OTP session token. Returns the payload or null.
 */
export function verifyOtpSessionToken(token: string): { userId: string; email: string } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    if (payload.purpose !== 'otp-session') return null;
    return { userId: payload.userId, email: payload.email };
  } catch {
    return null;
  }
}

/**
 * Require admin role - throws error if user is not admin
 * @deprecated Use requirePermission from rbac/middleware instead
 */
export async function requireAdmin(request: Request): Promise<User> {
  const user = await requireAuth(request);

  // Check if user has Admin role
  const userWithRoles = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      userRoles: {
        include: {
          role: true
        }
      }
    }
  });

  const hasAdminRole = userWithRoles?.userRoles.some(
    ur => ur.role.name === 'Admin'
  );

  if (!hasAdminRole) {
    throw new Error('Forbidden: Admin access required');
  }

  return user;
}

