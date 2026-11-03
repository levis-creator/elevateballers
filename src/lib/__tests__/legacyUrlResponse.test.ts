import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({ player: vi.fn(), match: vi.fn(), team: vi.fn() }));
vi.mock('../prisma', () => ({
  prisma: {
    player: { findUnique: db.player },
    match: { findUnique: db.match },
    team: { findUnique: db.team },
  },
}));

import { legacyUrlResponse } from '../legacyUrlResponse';

describe('legacyUrlResponse', () => {
  beforeEach(() => vi.clearAllMocks());

  it('permanently redirects an old player URL that still has a page', async () => {
    db.player.mockResolvedValue({ id: 'p1' });
    const response = await legacyUrlResponse({ kind: 'lookup', entity: 'player', slug: 'samuel-njuguna' });
    expect(response?.status).toBe(301);
    expect(response?.headers.get('Location')).toBe('/players/samuel-njuguna/');
    expect(db.player).toHaveBeenCalledWith({ where: { slug: 'samuel-njuguna' }, select: { id: true } });
  });

  it('answers 410 when the old match no longer exists', async () => {
    db.match.mockResolvedValue(null);
    const response = await legacyUrlResponse({ kind: 'lookup', entity: 'match', slug: 'legends-vs-dagorreti-high-b' });
    expect(response?.status).toBe(410);
  });

  it('falls through to normal routing when the database fails', async () => {
    db.team.mockRejectedValue(new Error('db down'));
    await expect(legacyUrlResponse({ kind: 'lookup', entity: 'team', slug: 'outlaws' })).resolves.toBeNull();
  });

  it('answers gone and redirect results without the database', async () => {
    expect((await legacyUrlResponse({ kind: 'gone' }))?.status).toBe(410);
    const redirect = await legacyUrlResponse({ kind: 'redirect', to: '/sitemap.xml' });
    expect(redirect?.status).toBe(301);
    expect(redirect?.headers.get('Location')).toBe('/sitemap.xml');
  });
});
