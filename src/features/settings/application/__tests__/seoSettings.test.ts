import { describe, expect, it } from 'vitest';
import type { SiteSetting } from '../../domain/siteSetting';
import { resolvePublicSeoSettings } from '../seoSettings';

const setting = (key: string, value: string): SiteSetting => ({
  id: key,
  key,
  value,
  type: 'text',
  label: key,
  description: null,
  category: 'seo',
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('SEO settings', () => {
  it('keeps one space before a saved title suffix', () => {
    expect(resolvePublicSeoSettings([setting('seo_suffix', '| Elevate Ballers League')]).titleSuffix).toBe(' | Elevate Ballers League');
    expect(resolvePublicSeoSettings([setting('seo_suffix', '   | Elevate Ballers League  ')]).titleSuffix).toBe(' | Elevate Ballers League');
  });

  it('lets a blank suffix turn the suffix off', () => {
    expect(resolvePublicSeoSettings([setting('seo_suffix', '  ')]).titleSuffix).toBe('');
  });

  it('uses the default suffix when none is saved', () => {
    expect(resolvePublicSeoSettings([]).titleSuffix).toBe(' | Elevate Ballers');
  });
});
