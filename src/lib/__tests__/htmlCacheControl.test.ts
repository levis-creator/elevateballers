import { describe, expect, it } from 'vitest';
import { htmlCacheControl } from '../htmlCacheControl';

const base = { signedIn: false, pagePolicy: null, publicCaching: true };

describe('htmlCacheControl', () => {
  it('never caches a page requested by a signed-in visitor', () => {
    expect(htmlCacheControl({ ...base, pathname: '/matches/final-game', signedIn: true, pagePolicy: 'public, s-maxage=86400' }))
      .toBe('private, no-store');
  });

  it.each(['/admin', '/admin/teams', '/team-portal', '/login', '/unauthorized', '/subscribe/confirm', '/unsubscribe'])(
    'never caches the user-specific page %s',
    (pathname) => {
      expect(htmlCacheControl({ ...base, pathname, pagePolicy: 'public, s-maxage=60' })).toBe('private, no-store');
    },
  );

  it('keeps the lifetime a public page chose for itself', () => {
    expect(htmlCacheControl({ ...base, pathname: '/rules', pagePolicy: 'public, s-maxage=600, stale-while-revalidate=1200' }))
      .toBe('public, s-maxage=600, stale-while-revalidate=1200');
  });

  it('gives public pages without their own policy a short default', () => {
    expect(htmlCacheControl({ ...base, pathname: '/' })).toBe('public, s-maxage=60, stale-while-revalidate=300');
  });

  it('does not treat lookalike paths as private', () => {
    expect(htmlCacheControl({ ...base, pathname: '/administrators-news' })).toBe('public, s-maxage=60, stale-while-revalidate=300');
  });

  it('leaves public pages alone when public caching is off', () => {
    expect(htmlCacheControl({ ...base, pathname: '/', publicCaching: false })).toBeNull();
  });
});
