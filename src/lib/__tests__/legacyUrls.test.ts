import { describe, expect, it } from 'vitest';
import { resolveLegacyPath } from '../legacyUrls';

describe('resolveLegacyPath', () => {
  it('looks up old detail pages under their new paths', () => {
    expect(resolveLegacyPath('/player/samuel-njuguna/')).toEqual({ kind: 'lookup', entity: 'player', slug: 'samuel-njuguna' });
    expect(resolveLegacyPath('/event/legends-vs-dagorreti-high-b/')).toEqual({ kind: 'lookup', entity: 'match', slug: 'legends-vs-dagorreti-high-b' });
    expect(resolveLegacyPath('/team/outlaws')).toEqual({ kind: 'lookup', entity: 'team', slug: 'outlaws' });
  });

  it('drops old archives and listings', () => {
    for (const path of ['/position/0-guard/page/11/', '/league/ebl/page/3/', '/league/ebl/', '/player/', '/2025/', '/2025/04/some-post/', '/feed/']) {
      expect(resolveLegacyPath(path)).toEqual({ kind: 'gone' });
    }
  });

  it('drops the junk URLs made by the broken sponsor link', () => {
    expect(resolveLegacyPath('/players/velma-onyango/http/www,ubalozikenya.com')).toEqual({ kind: 'gone' });
    expect(resolveLegacyPath('/staff/http//www,ubalozikenya.com')).toEqual({ kind: 'gone' });
  });

  it('points the old compressed sitemap at the current one', () => {
    expect(resolveLegacyPath('/sitemap.xml.gz')).toEqual({ kind: 'redirect', to: '/sitemap.xml' });
  });

  it('leaves current pages alone', () => {
    for (const path of ['/', '/players/samuel-njuguna/', '/matches/a-vs-b-2026-11-01/', '/teams/outlaws/', '/staff/', '/league-registration', '/news/x', '/stats/leaders']) {
      expect(resolveLegacyPath(path)).toBeNull();
    }
  });
});
