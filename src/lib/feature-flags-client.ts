/**
 * Client-side Feature Flags Utilities
 * 
 * This module provides client-side utilities for checking feature flags.
 * It fetches feature flags from the server on initialization.
 */

import type { FeatureFlag } from './feature-flags';

/**
 * Client-side feature flags store
 */
let clientFeatureFlags: Record<FeatureFlag, boolean> | null = null;
let flagsPromise: Promise<Record<FeatureFlag, boolean>> | null = null;

/**
 * Fetches feature flags from the server
 */
async function fetchFeatureFlags(): Promise<Record<FeatureFlag, boolean>> {
  try {
    const response = await fetch('/api/feature-flags');
    if (!response.ok) {
      throw new Error('Failed to fetch feature flags');
    }
    return await response.json();
  } catch (error) {
    console.warn('Failed to fetch feature flags, using defaults:', error);
    // Return all features enabled as fallback
    return {} as Record<FeatureFlag, boolean>;
  }
}

/**
 * Gets feature flags (client-side)
 * Caches the result after first fetch
 */
export async function getClientFeatureFlags(): Promise<Record<FeatureFlag, boolean>> {
  if (clientFeatureFlags) {
    return clientFeatureFlags;
  }
  
  if (!flagsPromise) {
    flagsPromise = fetchFeatureFlags();
  }
  
  clientFeatureFlags = await flagsPromise;
  return clientFeatureFlags;
}

/**
 * Checks if a feature is enabled (client-side)
 * 
 * @param flag - The feature flag to check
 * @returns Promise that resolves to true if enabled, false otherwise
 */
export async function isClientFeatureEnabled(flag: FeatureFlag): Promise<boolean> {
  const flags = await getClientFeatureFlags();
  return flags[flag] ?? true; // Default to enabled if not found
}

/**
 * Synchronously checks if a feature is enabled (client-side)
 * Returns the cached value or true as fallback
 * 
 * @param flag - The feature flag to check
 * @returns true if enabled, false otherwise (or true if not yet loaded)
 */
export function isClientFeatureEnabledSync(flag: FeatureFlag): boolean {
  if (!clientFeatureFlags) {
    return true; // Default to enabled until flags are loaded
  }
  return clientFeatureFlags[flag] ?? true;
}

/**
 * Resets the client-side feature flags cache
 */
export function resetClientFeatureFlags(): void {
  clientFeatureFlags = null;
  flagsPromise = null;
}

