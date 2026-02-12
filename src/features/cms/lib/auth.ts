import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { User, UserRole } from '../types';

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
 * Get the current user from request cookies
 */
export async function getCurrentUser(request: Request): Promise<User | null> {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) {
    if (process.env.NODE_ENV === 'development') {
      console.log('No cookie header found in request');
    }
    return null;
  }

  const cookies = Object.fromEntries(
    cookieHeader.split('; ').map((c) => {
      const [key, ...values] = c.split('=');
      return [key, values.join('=')];
    })
  );

  const token = cookies['auth-token'];
  if (!token) {
    if (process.env.NODE_ENV === 'development') {
      console.log('No auth-token cookie found');
    }
    return null;
  }

  const payload = verifyToken(token);
  if (!payload) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Token verification failed - invalid or expired token');
    }
    return null;
  }

  try {
    return await findUserById(payload.userId);
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

