import { describe, expect, it } from 'vitest';
import { buildBracketLinks, editionKey } from './bracket-links';

const season2026 = {
  id: 's26',
  slug: '2026',
  leagues: [
    { id: 'ebl', slug: 'ebl' },
    { id: 'ewbl', slug: 'ewbl' },
    { id: 'u15', slug: 'u15' },
  ],
};

describe('buildBracketLinks', () => {
  it('filters by league when a season has playoffs in several leagues', () => {
    const links = buildBracketLinks(
      [{ seasonId: 's26', leagueId: 'ebl' }, { seasonId: 's26', leagueId: 'ewbl' }],
      [season2026]
    );
    expect(links.bySeason).toEqual({ s26: '/playoffs/2026/' });
    expect(links.byEdition).toEqual({
      [editionKey('s26', 'ebl')]: '/playoffs/2026/?league=ebl',
      [editionKey('s26', 'ewbl')]: '/playoffs/2026/?league=ewbl',
    });
  });

  it('gives no link to a league in the season that has no playoff games', () => {
    const links = buildBracketLinks([{ seasonId: 's26', leagueId: 'ebl' }, { seasonId: 's26', leagueId: 'ewbl' }], [season2026]);
    expect(links.byEdition[editionKey('s26', 'u15')]).toBeUndefined();
  });

  it('uses the plain season page when only one league has playoffs', () => {
    const links = buildBracketLinks([{ seasonId: 's26', leagueId: 'ebl' }], [season2026]);
    expect(links.byEdition).toEqual({ [editionKey('s26', 'ebl')]: '/playoffs/2026/' });
  });

  it('gives nothing for a season without playoff games', () => {
    expect(buildBracketLinks([], [season2026])).toEqual({ byEdition: {}, bySeason: {} });
  });

  it('encodes slugs safely', () => {
    const links = buildBracketLinks([{ seasonId: 'x', leagueId: 'a' }, { seasonId: 'x', leagueId: 'b' }], [
      { id: 'x', slug: 'summer 2026', leagues: [{ id: 'a', slug: 'a&b' }, { id: 'b', slug: 'b' }] },
    ]);
    expect(links.byEdition[editionKey('x', 'a')]).toBe('/playoffs/summer%202026/?league=a%26b');
  });
});
