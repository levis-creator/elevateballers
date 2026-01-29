import { getCurrentUser } from './auth';
import type { User } from '../types';

/**
 * Check authentication for Astro pages
 * Returns user if authenticated, null otherwise
 * Gracefully handles database connection errors
 */
export async function checkAuth(request: Request): Promise<User | null> {
  try {
    return await getCurrentUser(request);
  } catch (error) {
    // Log error with more context
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Auth check error:', errorMessage);
    
    // If it's a database connection error, log it but don't throw
    // This allows pages to load even if database is temporarily unavailable
    if (errorMessage.includes('DATABASE_URL') || 
        errorMessage.includes('connection') ||
        errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('ENOTFOUND')) {
      console.error('Database connection error in auth check (non-fatal):', error);
    }
    
    return null; // Return null to allow page to continue loading
  }
}

