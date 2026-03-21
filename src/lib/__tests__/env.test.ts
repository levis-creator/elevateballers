import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// Snapshot the env keys we'll modify so we can restore them cleanly
const ORIGINAL = {
  NODE_ENV: process.env.NODE_ENV,
  TEST_VAR_REQUIRED: process.env.TEST_VAR_REQUIRED,
};

// Import AFTER env shim is in place
import {
  getEnv,
  requireEnv,
  getEnvBoolean,
  getEnvNumber,
  isProduction,
  isDevelopment,
} from '../env';

describe('getEnv', () => {
  afterEach(() => {
    delete process.env.TEST_GETENV;
  });

  it('returns value when env var is set', () => {
    process.env.TEST_GETENV = 'hello';
    expect(getEnv('TEST_GETENV')).toBe('hello');
  });

  it('returns defaultValue when env var is absent', () => {
    expect(getEnv('TEST_GETENV', 'fallback')).toBe('fallback');
  });

  it('returns undefined when env var is absent and no default', () => {
    expect(getEnv('TEST_GETENV')).toBeUndefined();
  });
});

describe('requireEnv', () => {
  afterEach(() => {
    delete process.env.TEST_REQUIRED;
  });

  it('returns value when set', () => {
    process.env.TEST_REQUIRED = 'required-value';
    expect(requireEnv('TEST_REQUIRED')).toBe('required-value');
  });

  it('throws when env var is missing', () => {
    expect(() => requireEnv('TEST_REQUIRED')).toThrow(/TEST_REQUIRED/);
  });
});

describe('getEnvBoolean', () => {
  afterEach(() => {
    delete process.env.TEST_BOOL;
  });

  it.each([
    ['true', true],
    ['1', true],
    ['yes', true],
    ['TRUE', true],
    ['false', false],
    ['0', false],
    ['no', false],
    ['off', false],
  ])('parses "%s" → %s', (input, expected) => {
    process.env.TEST_BOOL = input;
    expect(getEnvBoolean('TEST_BOOL')).toBe(expected);
  });

  it('returns defaultValue when not set', () => {
    expect(getEnvBoolean('TEST_BOOL', true)).toBe(true);
    expect(getEnvBoolean('TEST_BOOL', false)).toBe(false);
  });
});

describe('getEnvNumber', () => {
  afterEach(() => {
    delete process.env.TEST_NUM;
  });

  it('parses a numeric string', () => {
    process.env.TEST_NUM = '42';
    expect(getEnvNumber('TEST_NUM')).toBe(42);
  });

  it('returns defaultValue for non-numeric value', () => {
    process.env.TEST_NUM = 'banana';
    expect(getEnvNumber('TEST_NUM', 99)).toBe(99);
  });

  it('returns defaultValue when not set', () => {
    expect(getEnvNumber('TEST_NUM', 7)).toBe(7);
  });
});

describe('isProduction / isDevelopment', () => {
  const orig = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = orig;
  });

  it('isProduction returns true when NODE_ENV=production', () => {
    process.env.NODE_ENV = 'production';
    expect(isProduction()).toBe(true);
    expect(isDevelopment()).toBe(false);
  });

  it('isProduction returns false when NODE_ENV=development', () => {
    process.env.NODE_ENV = 'development';
    expect(isProduction()).toBe(false);
    expect(isDevelopment()).toBe(true);
  });
});
