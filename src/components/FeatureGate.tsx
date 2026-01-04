/**
 * FeatureGate Component
 * 
 * Conditionally renders children based on feature flag status.
 * Useful for wrapping components that should only render when a feature is enabled.
 */

import type { ReactNode } from 'react';
import type { FeatureFlag } from '../lib/feature-flags';
import { useFeatureFlag } from '../hooks/useFeatureFlag';

export interface FeatureGateProps {
  /**
   * The feature flag to check
   */
  feature: FeatureFlag;
  
  /**
   * Children to render when feature is enabled
   */
  children: ReactNode;
  
  /**
   * Optional fallback to render when feature is disabled
   */
  fallback?: ReactNode;
  
  /**
   * If true, renders children even when feature is disabled (for development)
   */
  showWhenDisabled?: boolean;
}

/**
 * FeatureGate component that conditionally renders based on feature flags
 */
export function FeatureGate({
  feature,
  children,
  fallback = null,
  showWhenDisabled = false,
}: FeatureGateProps) {
  const isEnabled = useFeatureFlag(feature);
  
  if (!isEnabled && !showWhenDisabled) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

