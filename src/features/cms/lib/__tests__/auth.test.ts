/**
 * Unit tests for auth.ts pure functions.
 *
 * Prisma is mocked so no database connection is required.
 * JWT_SECRET must be set before the module is imported (module-level throw guard).
 */
import { describe, it, expect, vi } from 'vitest';
// JWT_SECRET is set in src/__tests__/setup.ts before this module loads

// Mock prisma — auth.ts imports it but we only test pure functions here
vi.mock('../../../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    role: { findUnique: vi.fn() },
    twoFactorOtp: {
      deleteMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
    userAuditLog: { create: vi.fn() },
  },
}));

import {
  validatePasswordStrength,
  hashPassword,
  verifyPassword,
  createToken,
  verifyToken,
} from '../auth';

// ─── validatePasswordStrength ─────────────────────────────────────────────────

describe('validatePasswordStrength', () => {
  it('accepts a strong password with all required character classes', () => {
    expect(validatePasswordStrength('StrongPass1!')).toBeNull();
    expect(validatePasswordStrength('C0rrect-Horse-Battery!')).toBeNull();
  });

  it('rejects passwords shorter than 10 characters', () => {
    expect(validatePasswordStrength('Short1!')).toBeTruthy();
    expect(validatePasswordStrength('Ab1!')).toBeTruthy();
  });

  it('rejects passwords missing an uppercase letter', () => {
    expect(validatePasswordStrength('alllowercase1!')).toBeTruthy();
  });

  it('rejects passwords missing a lowercase letter', () => {
    expect(validatePasswordStrength('ALLUPPERCASE1!')).toBeTruthy();
  });

  it('rejects passwords missing a digit', () => {
    expect(validatePasswordStrength('NoDigitsHere!')).toBeTruthy();
  });

  it('rejects passwords missing a special character', () => {
    expect(validatePasswordStrength('NoSpecialChar1')).toBeTruthy();
  });

  it('rejects an empty string', () => {
    expect(validatePasswordStrength('')).toBeTruthy();
  });
});

// ─── hashPassword / verifyPassword ───────────────────────────────────────────

describe('hashPassword + verifyPassword', () => {
  it('produces a bcrypt hash that verifies correctly', async () => {
    const password = 'SuperSecret42!';
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(hash).toMatch(/^\$2[aby]\$/); // bcrypt prefix
    await expect(verifyPassword(password, hash)).resolves.toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('correct-password');
    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false);
  });

  it('produces a different hash each time (salt)', async () => {
    const h1 = await hashPassword('samepassword');
    const h2 = await hashPassword('samepassword');
    expect(h1).not.toBe(h2);
  });
});

// ─── createToken / verifyToken ────────────────────────────────────────────────

describe('createToken + verifyToken', () => {
  const user = { id: 'user-123', email: 'test@example.com', tokenVersion: 1 };

  it('creates a JWT and verifies it successfully', () => {
    const token = createToken(user);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // header.payload.signature

    const payload = verifyToken(token);
    expect(payload).not.toBeNull();
    expect(payload!.userId).toBe(user.id);
    expect(payload!.email).toBe(user.email);
    expect(payload!.tokenVersion).toBe(user.tokenVersion);
  });

  it('returns null for a tampered token', () => {
    const token = createToken(user);
    const tampered = token.slice(0, -5) + 'XXXXX';
    expect(verifyToken(tampered)).toBeNull();
  });

  it('returns null for a completely invalid token', () => {
    expect(verifyToken('not.a.token')).toBeNull();
    expect(verifyToken('')).toBeNull();
  });

  it('encodes the correct tokenVersion', () => {
    const v2User = { ...user, tokenVersion: 2 };
    const token = createToken(v2User);
    const payload = verifyToken(token);
    expect(payload!.tokenVersion).toBe(2);
  });
});
