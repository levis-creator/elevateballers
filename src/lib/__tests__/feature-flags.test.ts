import { describe, it, expect, afterEach } from 'vitest';
import {
  getFeatureFlags,
  isFeatureEnabled,
  areFeaturesEnabled,
  resetFeatureFlagsCache,
  getEnabledFeatures,
  FEATURE_FLAGS_CONFIG,
} from '../feature-flags';

// Reset the module cache after each test so flag overrides don't bleed between tests
afterEach(() => {
  resetFeatureFlagsCache();
});

describe('getFeatureFlags — defaults', () => {
  it('returns a record for every configured flag', () => {
    const flags = getFeatureFlags();
    const configuredKeys = Object.keys(FEATURE_FLAGS_CONFIG);
    for (const key of configuredKeys) {
      expect(flags).toHaveProperty(key);
      expect(typeof flags[key as keyof typeof flags]).toBe('boolean');
    }
  });

  it('all flags are enabled by default', () => {
    const flags = getFeatureFlags();
    for (const [, enabled] of Object.entries(flags)) {
      expect(enabled).toBe(true);
    }
  });

  it('returns the cached result on a second call', () => {
    const first = getFeatureFlags();
    const second = getFeatureFlags();
    expect(first).toBe(second); // same reference — cached
  });

  it('forceRefresh rebuilds the cache', () => {
    const first = getFeatureFlags();
    const second = getFeatureFlags(true);
    expect(second).not.toBe(first); // new reference
  });
});

describe('resetFeatureFlagsCache', () => {
  it('causes the next getFeatureFlags call to return a fresh object', () => {
    const first = getFeatureFlags();
    resetFeatureFlagsCache();
    const second = getFeatureFlags();
    expect(second).not.toBe(first);
    // Contents should still be equal
    expect(second).toEqual(first);
  });
});

describe('isFeatureEnabled', () => {
  it('returns true for a flag that is enabled by default', () => {
    expect(isFeatureEnabled('module.news')).toBe(true);
  });

  it('returns true for layout flags enabled by default', () => {
    expect(isFeatureEnabled('layout.header')).toBe(true);
    expect(isFeatureEnabled('layout.footer')).toBe(true);
  });

  it('returns true for CMS flags enabled by default', () => {
    expect(isFeatureEnabled('cms.news')).toBe(true);
    expect(isFeatureEnabled('cms.matches')).toBe(true);
  });
});

describe('areFeaturesEnabled', () => {
  it('returns true when all flags are enabled (requireAll=true default)', () => {
    expect(areFeaturesEnabled(['module.news', 'module.matches'])).toBe(true);
  });

  it('returns false when any flag is missing with requireAll=true', () => {
    // Temporarily disable a flag by faking the cache
    resetFeatureFlagsCache();
    // Monkeypatch: replace cached value with one disabled flag
    const flags = getFeatureFlags();
    (flags as any)['module.news'] = false;

    expect(areFeaturesEnabled(['module.news', 'module.matches'], true)).toBe(false);
  });

  it('returns true when any flag is enabled with requireAll=false', () => {
    const flags = getFeatureFlags();
    (flags as any)['module.news'] = false;

    expect(areFeaturesEnabled(['module.news', 'module.matches'], false)).toBe(true);
  });

  it('returns false when all flags are false with requireAll=false', () => {
    const flags = getFeatureFlags();
    (flags as any)['module.news'] = false;
    (flags as any)['module.matches'] = false;

    expect(areFeaturesEnabled(['module.news', 'module.matches'], false)).toBe(false);
  });
});

describe('getEnabledFeatures', () => {
  it('returns all flag keys when all are enabled', () => {
    const enabled = getEnabledFeatures();
    const all = Object.keys(FEATURE_FLAGS_CONFIG);
    expect(enabled.sort()).toEqual(all.sort());
  });

  it('omits disabled flags', () => {
    const flags = getFeatureFlags();
    (flags as any)['module.news'] = false;

    const enabled = getEnabledFeatures();
    expect(enabled).not.toContain('module.news');
    expect(enabled).toContain('module.matches');
  });
});
