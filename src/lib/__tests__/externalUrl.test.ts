import { describe, expect, it } from 'vitest';
import { normalizeExternalUrl } from '../externalUrl';

describe('normalizeExternalUrl', () => {
  it('keeps valid absolute links', () => {
    expect(normalizeExternalUrl('https://www.ubalozikenya.com')).toBe('https://www.ubalozikenya.com/');
    expect(normalizeExternalUrl('http://example.org/path?q=1')).toBe('http://example.org/path?q=1');
  });

  it('adds https to bare domains', () => {
    expect(normalizeExternalUrl('www.ubalozikenya.com')).toBe('https://www.ubalozikenya.com/');
    expect(normalizeExternalUrl(' example.co.ke ')).toBe('https://example.co.ke/');
  });

  it('repairs a dropped colon', () => {
    expect(normalizeExternalUrl('http//www.ubalozikenya.com')).toBe('http://www.ubalozikenya.com/');
  });

  it('rejects links that cannot be a real site', () => {
    // The stored sponsor link that produced /…/http/www,ubalozikenya.com 404s.
    expect(normalizeExternalUrl('http//www,ubalozikenya.com')).toBeNull();
    expect(normalizeExternalUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeExternalUrl('localhost')).toBeNull();
    expect(normalizeExternalUrl('')).toBeNull();
    expect(normalizeExternalUrl(null)).toBeNull();
  });
});
