import { getCurrentUser } from './auth';
import type { User } from '../types';

/**
 * Check authentication for Astro pages
 * Returns user if authenticated, null otherwise
 */
export async function checkAuth(request: Request): Promise<User | null> {
  try {
    return await getCurrentUser(request);
  } catch (error) {
    console.error('Auth check error:', error);
    return null;
  }
}

