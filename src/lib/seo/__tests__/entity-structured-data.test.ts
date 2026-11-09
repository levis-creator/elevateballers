import { describe, expect, it } from 'vitest';
import type { MatchView } from '@/features/matches/domain/entities/match-detail-v2';
import type { TeamDetail } from '@/features/teams/domain/entities/team-detail';
import type { PlayerView } from '@/features/player/domain/entities/player-detail-v2';
import { buildMatchJsonLd, buildPlayerJsonLd, buildTeamJsonLd } from '../entity-structured-data';

const ORIGIN = 'https://elevateballers.com';
const byType = (graph: Record<string, unknown>[], type: string) => graph.find((n) => n['@type'] === type) as any;

const side = (name: string, slug: string, score: number | null) => ({
  name, abbr: name.slice(0, 3), logo: `/media/${slug}.png`, href: `/teams/${slug}`, color: '#fff', record: null, score,
});

const match = (overrides: Partial<MatchView> = {}) =>
  ({
    id: 'cm123',
    slug: 'jets-vs-oilers-2026-03-22',
    state: 'final',
    league: 'Elevate Ballers League',
    dateText: 'Sunday, Mar 22',
    time: '14:00',
    startDate: '2026-03-22T11:00:00.000Z',
    venue: null,
    home: side('CBA Jets', 'cba-jets', 71),
    away: side('Karen Oilers', 'karen-oilers', 64),
    ...overrides,
  }) as unknown as MatchView;

describe('buildMatchJsonLd', () => {
  it('marks up the game as a SportsEvent with both teams and the start time', () => {
    const { '@graph': graph } = buildMatchJsonLd(ORIGIN, match());
    const event = byType(graph, 'SportsEvent');
    expect(event).toMatchObject({
      '@id': `${ORIGIN}/matches/jets-vs-oilers-2026-03-22/#event`,
      name: 'CBA Jets vs Karen Oilers',
      startDate: '2026-03-22T11:00:00.000Z',
      sport: 'Basketball',
      homeTeam: { '@type': 'SportsTeam', name: 'CBA Jets', url: `${ORIGIN}/teams/cba-jets/`, logo: `${ORIGIN}/media/cba-jets.png` },
      awayTeam: { name: 'Karen Oilers' },
      organizer: { '@id': `${ORIGIN}/#organization` },
    });
    expect(event.description).toContain('CBA Jets 71, Karen Oilers 64');
    expect(event.location).toBeUndefined();
    expect(byType(graph, 'BreadcrumbList').itemListElement).toHaveLength(3);
  });

  it('omits the start date and team links when they are unknown', () => {
    const { '@graph': graph } = buildMatchJsonLd(ORIGIN, match({ startDate: null, home: side('TBD', '', null) as any }));
    const event = byType(graph, 'SportsEvent');
    expect(event.startDate).toBeUndefined();
    expect(event.homeTeam.url).toBeUndefined();
  });
});

describe('buildTeamJsonLd', () => {
  const team = (overrides: Partial<TeamDetail> = {}) =>
    ({
      name: 'CBA Jets',
      nickname: 'Jets',
      slug: 'cba-jets',
      description: '',
      logo: '/media/cba-jets.png',
      league: 'Elevate Ballers League',
      headCoach: 'Jane Coach',
      players: [
        { name: 'Alex Munyao', href: '/players/alex-munyao' },
        { name: '', href: '/players/x' },
      ],
      ...overrides,
    }) as unknown as TeamDetail;

  it('marks up the team with its roster, coach and league', () => {
    const t = byType(buildTeamJsonLd(ORIGIN, team())['@graph'], 'SportsTeam');
    expect(t).toMatchObject({
      '@id': `${ORIGIN}/teams/cba-jets/#team`,
      name: 'CBA Jets',
      alternateName: 'Jets',
      coach: { '@type': 'Person', name: 'Jane Coach' },
      memberOf: { '@type': 'SportsOrganization', name: 'Elevate Ballers League' },
      athlete: [{ '@type': 'Person', name: 'Alex Munyao', url: `${ORIGIN}/players/alex-munyao/` }],
    });
    expect(t.description).toBeUndefined();
  });

  it('skips the placeholder coach', () => {
    const t = byType(buildTeamJsonLd(ORIGIN, team({ headCoach: '—' }))['@graph'], 'SportsTeam');
    expect(t.coach).toBeUndefined();
  });
});

describe('buildPlayerJsonLd', () => {
  const player = (overrides: Partial<PlayerView['hero']> = {}, rest: Partial<PlayerView> = {}) =>
    ({
      id: 'p1',
      slug: 'alex-munyao',
      hero: { first: 'Alex', last: 'Munyao', team: 'DON BOSCO NETS', teamHref: '/teams/don-bosco-nets', image: '/media/alex.jpg', ...overrides },
      biography: null,
      socialLinks: [{ label: 'Instagram', href: 'https://instagram.com/alex' }],
      ...rest,
    }) as unknown as PlayerView;

  it('emits a ProfilePage whose main entity is the player', () => {
    const { '@graph': graph } = buildPlayerJsonLd(ORIGIN, player());
    expect(byType(graph, 'ProfilePage')).toMatchObject({ mainEntity: { '@id': `${ORIGIN}/players/alex-munyao/#person` } });
    expect(byType(graph, 'Person')).toMatchObject({
      name: 'Alex Munyao',
      image: `${ORIGIN}/media/alex.jpg`,
      memberOf: { '@type': 'SportsTeam', name: 'DON BOSCO NETS', url: `${ORIGIN}/teams/don-bosco-nets/` },
      sameAs: ['https://instagram.com/alex'],
    });
  });

  it('leaves out the team for free agents', () => {
    const person = byType(buildPlayerJsonLd(ORIGIN, player({ team: 'Free Agent', teamHref: '/teams/' }))['@graph'], 'Person');
    expect(person.memberOf).toBeUndefined();
  });
});
