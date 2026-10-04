import { describe, expect, it } from 'vitest';
import type { HomeData, Potw } from '@/features/home/domain/entities/home-v2';
import { buildHomeJsonLd } from './structured-data';

const potw = (overrides: Partial<Potw>): Potw => ({
  slotLabel: 'Clutch',
  slotDescription: 'Clutch conference, EBL',
  name: 'Jane Doe',
  teamName: 'City Hawks',
  teamLabel: 'City Hawks · #7',
  awardedAt: '2026-10-04T08:00:00.000Z',
  tagline: null,
  image: '/media/jane.jpg',
  description: 'Story',
  stats: [],
  href: '/players/jane-doe',
  ...overrides,
});

const home = (potws: Potw[]) => ({ upcoming: [], news: [], potws }) as unknown as HomeData;
const people = (graph: Record<string, unknown>[]) => graph.filter((node) => node['@type'] === 'Person');

describe('buildHomeJsonLd — Player of the Week', () => {
  it('marks up each real winner as a Person with the slot award', () => {
    const { '@graph': graph } = buildHomeJsonLd('https://elevateballers.com', home([
      potw({}),
      potw({ name: 'Amy Wanjiru', slotLabel: 'EWBL', slotDescription: "Elevate Women's Basketball League", href: '/players/amy', teamName: null }),
    ]));

    const [clutch, ewbl] = people(graph);
    expect(clutch).toMatchObject({
      '@id': 'https://elevateballers.com/players/jane-doe#person',
      name: 'Jane Doe',
      url: 'https://elevateballers.com/players/jane-doe',
      image: 'https://elevateballers.com/media/jane.jpg',
      award: 'Player of the Week — Clutch conference, EBL',
      memberOf: { '@type': 'SportsTeam', name: 'City Hawks' },
    });
    expect(ewbl).toMatchObject({ award: "Player of the Week — Elevate Women's Basketball League" });
    expect(ewbl).not.toHaveProperty('memberOf');
  });

  it('skips demo content with no profile link or award date', () => {
    const { '@graph': graph } = buildHomeJsonLd('https://elevateballers.com', home([
      potw({ href: null, awardedAt: null }),
    ]));
    expect(people(graph)).toHaveLength(0);
  });
});
