/**
 * Feature Flags System
 * 
 * This module provides a centralized way to enable/disable features and modules
 * throughout the application. Features can be controlled via environment variables
 * or through a database configuration (for dynamic control).
 * 
 * Principles:
 * - KISS: Simple boolean flags
 * - SOLID: Single responsibility, extensible design
 * - DRY: Centralized configuration
 */

/**
 * Available feature flags
 * Each feature represents a module or major functionality that can be toggled
 */
export type FeatureFlag =
  // Layout features
  | 'layout.topbar'
  | 'layout.header'
  | 'layout.footer'
  | 'layout.mobileMenu'
  
  // Homepage features
  | 'home.postSlider'
  | 'home.newsTicker'
  | 'home.marqueeMatchup'
  | 'home.nextMatchCarousel'
  | 'home.latestNews'
  | 'home.playerOfTheWeek'
  | 'home.statsSection'
  | 'home.statsLeaders'
  | 'home.mediaGallery'
  | 'home.sponsors'
  | 'home.registrationCta'
  
  // Feature modules
  | 'module.news'
  | 'module.matches'
  | 'module.players'
  | 'module.standings'
  | 'module.media'
  | 'module.team'
  | 'module.registration'
  | 'module.comments'
  | 'module.cms'
  
  // CMS sub-features
  | 'cms.news'
  | 'cms.matches'
  | 'cms.players'
  | 'cms.media'
  | 'cms.teams'
  | 'cms.seasons'
  | 'cms.leagues'
  | 'cms.staff';

/**
 * Feature flag configuration
 * Maps feature flags to their default values and descriptions
 */
export interface FeatureFlagConfig {
  key: FeatureFlag;
  defaultEnabled: boolean;
  description: string;
  category: 'layout' | 'homepage' | 'module' | 'cms';
}

/**
 * Default feature flag configurations
 */
export const FEATURE_FLAGS_CONFIG: Record<FeatureFlag, FeatureFlagConfig> = {
  // Layout features
  'layout.topbar': {
    key: 'layout.topbar',
    defaultEnabled: true,
    description: 'Top navigation bar with login/signup and social links',
    category: 'layout',
  },
  'layout.header': {
    key: 'layout.header',
    defaultEnabled: true,
    description: 'Main header with logo and navigation menu',
    category: 'layout',
  },
  'layout.footer': {
    key: 'layout.footer',
    defaultEnabled: true,
    description: 'Footer with contact info and newsletter',
    category: 'layout',
  },
  'layout.mobileMenu': {
    key: 'layout.mobileMenu',
    defaultEnabled: true,
    description: 'Mobile navigation menu',
    category: 'layout',
  },
  
  // Homepage features
  'home.postSlider': {
    key: 'home.postSlider',
    defaultEnabled: true,
    description: 'Hero post slider carousel',
    category: 'homepage',
  },
  'home.newsTicker': {
    key: 'home.newsTicker',
    defaultEnabled: true,
    description: 'Scrolling news ticker',
    category: 'homepage',
  },
  'home.marqueeMatchup': {
    key: 'home.marqueeMatchup',
    defaultEnabled: true,
    description: 'Featured match display',
    category: 'homepage',
  },
  'home.nextMatchCarousel': {
    key: 'home.nextMatchCarousel',
    defaultEnabled: true,
    description: 'Upcoming matches carousel',
    category: 'homepage',
  },
  'home.latestNews': {
    key: 'home.latestNews',
    defaultEnabled: true,
    description: 'Latest news grid with category filtering',
    category: 'homepage',
  },
  'home.playerOfTheWeek': {
    key: 'home.playerOfTheWeek',
    defaultEnabled: true,
    description: 'Player of the week showcase',
    category: 'homepage',
  },
  'home.statsSection': {
    key: 'home.statsSection',
    defaultEnabled: true,
    description: 'League statistics section',
    category: 'homepage',
  },
  'home.statsLeaders': {
    key: 'home.statsLeaders',
    defaultEnabled: true,
    description: 'Stats leaders carousel',
    category: 'homepage',
  },
  'home.mediaGallery': {
    key: 'home.mediaGallery',
    defaultEnabled: true,
    description: 'Media gallery section',
    category: 'homepage',
  },
  'home.sponsors': {
    key: 'home.sponsors',
    defaultEnabled: true,
    description: 'Sponsors carousel',
    category: 'homepage',
  },
  'home.registrationCta': {
    key: 'home.registrationCta',
    defaultEnabled: true,
    description: 'Registration call-to-action section',
    category: 'homepage',
  },
  
  // Feature modules
  'module.news': {
    key: 'module.news',
    defaultEnabled: true,
    description: 'News articles and blog functionality',
    category: 'module',
  },
  'module.matches': {
    key: 'module.matches',
    defaultEnabled: true,
    description: 'Match fixtures and results',
    category: 'module',
  },
  'module.players': {
    key: 'module.players',
    defaultEnabled: true,
    description: 'Player profiles and directory',
    category: 'module',
  },
  'module.standings': {
    key: 'module.standings',
    defaultEnabled: true,
    description: 'League standings and rankings',
    category: 'module',
  },
  'module.media': {
    key: 'module.media',
    defaultEnabled: true,
    description: 'Media gallery functionality',
    category: 'module',
  },
  'module.team': {
    key: 'module.team',
    defaultEnabled: true,
    description: 'Team pages and profiles',
    category: 'module',
  },
  'module.registration': {
    key: 'module.registration',
    defaultEnabled: true,
    description: 'League registration functionality',
    category: 'module',
  },
  'module.comments': {
    key: 'module.comments',
    defaultEnabled: true,
    description: 'Comments system',
    category: 'module',
  },
  'module.cms': {
    key: 'module.cms',
    defaultEnabled: true,
    description: 'Content Management System',
    category: 'module',
  },
  
  // CMS sub-features
  'cms.news': {
    key: 'cms.news',
    defaultEnabled: true,
    description: 'CMS: News article management',
    category: 'cms',
  },
  'cms.matches': {
    key: 'cms.matches',
    defaultEnabled: true,
    description: 'CMS: Match management',
    category: 'cms',
  },
  'cms.players': {
    key: 'cms.players',
    defaultEnabled: true,
    description: 'CMS: Player management',
    category: 'cms',
  },
  'cms.media': {
    key: 'cms.media',
    defaultEnabled: true,
    description: 'CMS: Media management',
    category: 'cms',
  },
  'cms.teams': {
    key: 'cms.teams',
    defaultEnabled: true,
    description: 'CMS: Team management',
    category: 'cms',
  },
  'cms.seasons': {
    key: 'cms.seasons',
    defaultEnabled: true,
    description: 'CMS: Season management',
    category: 'cms',
  },
  'cms.leagues': {
    key: 'cms.leagues',
    defaultEnabled: true,
    description: 'CMS: League management',
    category: 'cms',
  },
  'cms.staff': {
    key: 'cms.staff',
    defaultEnabled: true,
    description: 'CMS: Staff management',
    category: 'cms',
  },
};

/**
 * Parses environment variable string to boolean
 */
function parseEnvBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) return defaultValue;
  const normalized = value.toLowerCase().trim();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

/**
 * Gets feature flag value from environment variables
 * Format: FEATURE_FLAG_<KEY> where KEY is uppercase with dots replaced by underscores
 * Example: FEATURE_FLAG_HOME_POST_SLIDER=true
 */
function getFeatureFlagFromEnv(flag: FeatureFlag): boolean | null {
  const envKey = `FEATURE_FLAG_${flag.toUpperCase().replace(/\./g, '_')}`;
  const envValue = import.meta.env[envKey];
  
  if (envValue === undefined) return null;
  return parseEnvBoolean(envValue, true);
}

/**
 * Gets all feature flags from environment variables
 * Can also accept a comma-separated list: FEATURE_FLAGS_ENABLED=home.postSlider,home.newsTicker
 * Or a JSON object: FEATURE_FLAGS={"home.postSlider":true,"home.newsTicker":false}
 */
function getFeatureFlagsFromEnv(): Partial<Record<FeatureFlag, boolean>> {
  const flags: Partial<Record<FeatureFlag, boolean>> = {};
  
  // Check for JSON configuration
  const jsonConfig = import.meta.env.FEATURE_FLAGS;
  if (jsonConfig) {
    try {
      const parsed = typeof jsonConfig === 'string' ? JSON.parse(jsonConfig) : jsonConfig;
      Object.entries(parsed).forEach(([key, value]) => {
        if (key in FEATURE_FLAGS_CONFIG) {
          flags[key as FeatureFlag] = parseEnvBoolean(String(value), true);
        }
      });
      return flags;
    } catch (error) {
      console.warn('Failed to parse FEATURE_FLAGS JSON:', error);
    }
  }
  
  // Check individual environment variables
  Object.keys(FEATURE_FLAGS_CONFIG).forEach((flag) => {
    const envValue = getFeatureFlagFromEnv(flag as FeatureFlag);
    if (envValue !== null) {
      flags[flag as FeatureFlag] = envValue;
    }
  });
  
  return flags;
}

/**
 * Feature flags cache (for server-side)
 */
let featureFlagsCache: Record<FeatureFlag, boolean> | null = null;

/**
 * Gets the current feature flags configuration
 * Priority: Environment variables > Default values
 * 
 * @param forceRefresh - Force refresh of cached flags
 * @returns Record of all feature flags and their enabled state
 */
export function getFeatureFlags(forceRefresh = false): Record<FeatureFlag, boolean> {
  if (featureFlagsCache && !forceRefresh) {
    return featureFlagsCache;
  }
  
  const envFlags = getFeatureFlagsFromEnv();
  const flags: Record<FeatureFlag, boolean> = {} as Record<FeatureFlag, boolean>;
  
  // Apply defaults and override with environment variables
  Object.entries(FEATURE_FLAGS_CONFIG).forEach(([key, config]) => {
    flags[key as FeatureFlag] = envFlags[key as FeatureFlag] ?? config.defaultEnabled;
  });
  
  featureFlagsCache = flags;
  return flags;
}

/**
 * Checks if a specific feature is enabled
 * 
 * @param flag - The feature flag to check
 * @returns true if the feature is enabled, false otherwise
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  const flags = getFeatureFlags();
  return flags[flag] ?? false;
}

/**
 * Checks if multiple features are enabled
 * 
 * @param flags - Array of feature flags to check
 * @param requireAll - If true, all flags must be enabled. If false, any flag enabled returns true
 * @returns true if conditions are met, false otherwise
 */
export function areFeaturesEnabled(
  flags: FeatureFlag[],
  requireAll = true
): boolean {
  const featureFlags = getFeatureFlags();
  
  if (requireAll) {
    return flags.every((flag) => featureFlags[flag] ?? false);
  }
  
  return flags.some((flag) => featureFlags[flag] ?? false);
}

/**
 * Gets all enabled features
 * 
 * @returns Array of enabled feature flag keys
 */
export function getEnabledFeatures(): FeatureFlag[] {
  const flags = getFeatureFlags();
  return Object.entries(flags)
    .filter(([, enabled]) => enabled)
    .map(([key]) => key as FeatureFlag);
}

/**
 * Gets all disabled features
 * 
 * @returns Array of disabled feature flag keys
 */
export function getDisabledFeatures(): FeatureFlag[] {
  const flags = getFeatureFlags();
  return Object.entries(flags)
    .filter(([, enabled]) => !enabled)
    .map(([key]) => key as FeatureFlag);
}

/**
 * Gets feature flags grouped by category
 * 
 * @returns Record of category to feature flags
 */
export function getFeatureFlagsByCategory(): Record<string, FeatureFlagConfig[]> {
  const flags = getFeatureFlags();
  const grouped: Record<string, FeatureFlagConfig[]> = {};
  
  Object.entries(FEATURE_FLAGS_CONFIG).forEach(([key, config]) => {
    const category = config.category;
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push({
      ...config,
      defaultEnabled: flags[key as FeatureFlag],
    });
  });
  
  return grouped;
}

/**
 * Resets the feature flags cache
 * Useful for testing or when flags need to be reloaded
 */
export function resetFeatureFlagsCache(): void {
  featureFlagsCache = null;
}

