/**
 * React Hook for Feature Flags
 * 
 * Provides a React hook to check feature flags in client components
 */

import { useEffect, useState } from 'react';
import type { FeatureFlag } from '../lib/feature-flags';
import {
  getClientFeatureFlags,
  isClientFeatureEnabled,
  isClientFeatureEnabledSync,
} from '../lib/feature-flags-client';

/**
 * Hook to check if a feature is enabled
 * 
 * @param flag - The feature flag to check
 * @returns true if the feature is enabled, false otherwise
 */
export function useFeatureFlag(flag: FeatureFlag): boolean {
  const [enabled, setEnabled] = useState(() => isClientFeatureEnabledSync(flag));
  
  useEffect(() => {
    isClientFeatureEnabled(flag).then(setEnabled);
  }, [flag]);
  
  return enabled;
}

/**
 * Hook to check multiple features
 * 
 * @param flags - Array of feature flags to check
 * @param requireAll - If true, all flags must be enabled. If false, any flag enabled returns true
 * @returns true if conditions are met, false otherwise
 */
export function useFeatureFlags(
  flags: FeatureFlag[],
  requireAll = true
): boolean {
  const [enabled, setEnabled] = useState(() => {
    // For initial render, we'll use sync check
    if (requireAll) {
      return flags.every((flag) => isClientFeatureEnabledSync(flag));
    }
    return flags.some((flag) => isClientFeatureEnabledSync(flag));
  });
  
  useEffect(() => {
    getClientFeatureFlags().then((featureFlags) => {
      if (requireAll) {
        setEnabled(flags.every((flag) => featureFlags[flag] ?? true));
      } else {
        setEnabled(flags.some((flag) => featureFlags[flag] ?? true));
      }
    });
  }, [flags, requireAll]);
  
  return enabled;
}

/**
 * Hook to get all feature flags
 * 
 * @returns Record of all feature flags and their enabled state
 */
export function useAllFeatureFlags(): Record<FeatureFlag, boolean> | null {
  const [flags, setFlags] = useState<Record<FeatureFlag, boolean> | null>(null);
  
  useEffect(() => {
    getClientFeatureFlags().then(setFlags);
  }, []);
  
  return flags;
}

