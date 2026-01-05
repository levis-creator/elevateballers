/**
 * Environment variable helper
 * 
 * This module provides a consistent way to access environment variables
 * across both development and production environments.
 * 
 * In development: Uses .env file (loaded by dotenv)
 * In production (Vercel): Uses environment variables from Vercel dashboard
 * 
 * For Astro: import.meta.env is used for client-side and SSR
 * For Node.js: process.env is used for server-side code
 */

/**
 * Get an environment variable with optional fallback
 * Checks both import.meta.env (Astro) and process.env (Node.js)
 */
export function getEnv(key: string, defaultValue?: string): string | undefined {
  // Try import.meta.env first (Astro's way)
  let value = import.meta.env[key];
  
  // Fallback to process.env for server-side code (important for production)
  if (value === undefined && typeof process !== 'undefined' && process.env) {
    value = process.env[key];
  }
  
  return value ?? defaultValue;
}

/**
 * Get an environment variable, throwing an error if not set
 */
export function requireEnv(key: string): string {
  const value = getEnv(key);
  if (!value) {
    throw new Error(
      `Required environment variable ${key} is not set. ` +
      `Please configure it in your Vercel project settings under Environment Variables. ` +
      `Go to: Project Settings → Environment Variables → Add ${key}`
    );
  }
  return value;
}

/**
 * Get an environment variable as a boolean
 */
export function getEnvBoolean(key: string, defaultValue: boolean = false): boolean {
  const value = getEnv(key);
  if (!value) return defaultValue;
  const normalized = value.toLowerCase().trim();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

/**
 * Get an environment variable as a number
 */
export function getEnvNumber(key: string, defaultValue?: number): number | undefined {
  const value = getEnv(key);
  if (!value) return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Check if we're in production
 */
export function isProduction(): boolean {
  const nodeEnv = getEnv('NODE_ENV');
  return nodeEnv === 'production';
}

/**
 * Check if we're in development
 */
export function isDevelopment(): boolean {
  const nodeEnv = getEnv('NODE_ENV');
  return nodeEnv === 'development' || (!nodeEnv && !isProduction());
}

// Commonly used environment variables with type safety
export const env = {
  // Database
  DATABASE_URL: () => requireEnv('DATABASE_URL'),
  
  // JWT
  JWT_SECRET: () => requireEnv('JWT_SECRET'),
  
  // Environment
  NODE_ENV: () => getEnv('NODE_ENV', 'development'),
  isProduction: () => isProduction(),
  isDevelopment: () => isDevelopment(),
  
  // Feature flags (optional)
  FEATURE_FLAGS: () => getEnv('FEATURE_FLAGS'),
} as const;

