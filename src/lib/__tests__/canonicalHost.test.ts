import { describe, expect, it } from 'vitest';
import { canonicalHostRedirect } from '../canonicalHost';

describe('canonicalHostRedirect', () => {
  it('301s www page reads to the bare domain, keeping path and query', () => {
    const res = canonicalHostRedirect(new URL('https://www.elevateballers.com/teams/cba-jets/?season=2026'), 'GET');
    expect(res?.status).toBe(301);
    expect(res?.headers.get('Location')).toBe('https://elevateballers.com/teams/cba-jets/?season=2026');
  });

  it('redirects HEAD and robots.txt too', () => {
    expect(canonicalHostRedirect(new URL('https://www.elevateballers.com/robots.txt'), 'HEAD')?.status).toBe(301);
  });

  it('leaves the bare domain and local hosts alone', () => {
    expect(canonicalHostRedirect(new URL('https://elevateballers.com/about/'), 'GET')).toBeNull();
    expect(canonicalHostRedirect(new URL('http://localhost:4321/about/'), 'GET')).toBeNull();
  });

  it('never redirects API calls or non-GET requests', () => {
    expect(canonicalHostRedirect(new URL('https://www.elevateballers.com/api/jobs/sync-mailbox'), 'GET')).toBeNull();
    expect(canonicalHostRedirect(new URL('https://www.elevateballers.com/contacts/'), 'POST')).toBeNull();
  });
});
