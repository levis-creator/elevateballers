import { describe, expect, it } from 'vitest';
import { canonicalHostRedirect } from '../canonicalHost';

const SITE = 'https://elevateballers.com';
// In production Astro reports localhost in context.url; only the Host header says www.
const local = (path: string) => new URL(`http://localhost${path}`);

describe('canonicalHostRedirect', () => {
  it('301s www page reads to the site, keeping path and query', () => {
    const res = canonicalHostRedirect(local('/teams/cba-jets/?season=2026'), 'GET', 'www.elevateballers.com', SITE);
    expect(res?.status).toBe(301);
    expect(res?.headers.get('Location')).toBe('https://elevateballers.com/teams/cba-jets/?season=2026');
  });

  it('redirects HEAD, robots.txt and hosts with a port or capitals', () => {
    expect(canonicalHostRedirect(local('/robots.txt'), 'HEAD', 'WWW.elevateballers.com:443', SITE)?.status).toBe(301);
  });

  it('leaves the bare domain, local hosts and other domains alone', () => {
    expect(canonicalHostRedirect(local('/about/'), 'GET', 'elevateballers.com', SITE)).toBeNull();
    expect(canonicalHostRedirect(local('/about/'), 'GET', 'localhost:4321', SITE)).toBeNull();
    expect(canonicalHostRedirect(local('/about/'), 'GET', 'www.evil.example', SITE)).toBeNull();
    expect(canonicalHostRedirect(local('/about/'), 'GET', null, SITE)).toBeNull();
  });

  it('never redirects API calls or non-GET requests', () => {
    expect(canonicalHostRedirect(local('/api/jobs/sync-mailbox'), 'GET', 'www.elevateballers.com', SITE)).toBeNull();
    expect(canonicalHostRedirect(local('/contacts/'), 'POST', 'www.elevateballers.com', SITE)).toBeNull();
  });
});
