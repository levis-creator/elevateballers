import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const prisma: any = {
    match: { findMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn() },
    matchPlayer: { findMany: vi.fn(), deleteMany: vi.fn(), upsert: vi.fn() },
    matchPeriod: { findMany: vi.fn() },
    seasonTeamPlayer: { findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn() },
    seasonRosterHistory: { findMany: vi.fn() },
    seasonRegistrationApplication: { findFirst: vi.fn() },
    player: { findMany: vi.fn() },
  };
  prisma.$transaction = vi.fn((fn: (tx: any) => unknown) => fn(prisma));
  return {
    prisma,
    getCurrentUser: vi.fn(),
    requireActiveTeamContext: vi.fn(),
    getActiveSeasonTeam: vi.fn(),
    getFilteredMatches: vi.fn(),
    getStandings: vi.fn(),
    logAudit: vi.fn(),
  };
});

vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }));
vi.mock('@/features/cms/lib/auth', () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock('@/features/cms/lib/audit', () => ({ logAudit: mocks.logAudit }));
vi.mock('@/features/team-portal/application/team-portal-access', () => ({
  requireActiveTeamContext: mocks.requireActiveTeamContext,
}));
vi.mock('@/features/team-portal/data/datasources/team-portal-repository', () => ({
  getActiveSeasonTeam: mocks.getActiveSeasonTeam,
}));
vi.mock('@/features/matches/lib/queries', () => ({ getFilteredMatches: mocks.getFilteredMatches }));
vi.mock('@/features/standings/lib/getStandings', () => ({ getStandings: mocks.getStandings }));

import { GET as getLineup, PUT as putLineup } from '../lineup';
import { GET as getFixtures } from '../fixtures';
import { GET as getStats } from '../stats';
import { GET as getOverview } from '../overview';
import { GET as getRoster } from '../roster/index';
import { GET as getPlayer } from '../player';
import { GET as getMatch } from '../match';

const TEAM = { id: 'team-1', name: 'Queens' };
const SEASON_TEAM = { id: 'st-1', leagueSeasonId: 'ls-1', leagueName: 'EWBL' };
const SEASON = { id: 'season-1', name: '2026' };

const rosterEntry = (id: string, jerseyNumber: number) => ({
  jerseyNumber,
  position: 'PG',
  player: { id, firstName: 'Player', lastName: id, image: null, position: 'PG', jerseyNumber },
});
const ROSTER = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'].map((id, index) => rosterEntry(id, index + 1));

const match = (overrides: Record<string, unknown> = {}) => ({
  id: 'm1',
  slug: 'queens-vs-hawks',
  date: new Date('2026-09-26T09:30:00Z'),
  status: 'UPCOMING',
  leagueSeasonId: 'ls-1',
  team1Id: TEAM.id,
  team2Id: 'team-2',
  team1Score: null,
  team2Score: null,
  team1: { id: TEAM.id, name: 'Queens', logo: null },
  team2: { id: 'team-2', name: 'City Hawks', logo: null },
  ...overrides,
});

const get = (path: string) => ({ request: new Request(`https://example.test${path}`) }) as any;
const put = (body: unknown) =>
  ({
    request: new Request('https://example.test/api/team-portal/lineup', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
  }) as any;
const lineupBody = (players: Array<{ playerId: string; started: boolean }>) => ({
  teamId: TEAM.id,
  matchId: 'm1',
  players,
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentUser.mockResolvedValue({ id: 'coach-1' });
  mocks.requireActiveTeamContext.mockResolvedValue({ team: TEAM });
  mocks.getActiveSeasonTeam.mockResolvedValue({ season: SEASON, seasonTeam: SEASON_TEAM });
  mocks.getFilteredMatches.mockResolvedValue([]);
  mocks.getStandings.mockResolvedValue([]);
  mocks.prisma.match.findMany.mockResolvedValue([]);
  mocks.prisma.match.findFirst.mockResolvedValue(null);
  mocks.prisma.match.findUnique.mockResolvedValue(match());
  mocks.prisma.matchPlayer.findMany.mockResolvedValue([]);
  mocks.prisma.matchPlayer.deleteMany.mockResolvedValue({ count: 0 });
  mocks.prisma.matchPlayer.upsert.mockResolvedValue({});
  mocks.prisma.matchPeriod.findMany.mockResolvedValue([]);
  mocks.prisma.seasonTeamPlayer.findMany.mockResolvedValue(ROSTER);
  mocks.prisma.seasonTeamPlayer.findFirst.mockResolvedValue(null);
  mocks.prisma.seasonTeamPlayer.count.mockResolvedValue(0);
  mocks.prisma.seasonRosterHistory.findMany.mockResolvedValue([]);
  mocks.prisma.seasonRegistrationApplication.findFirst.mockResolvedValue(null);
  mocks.prisma.player.findMany.mockResolvedValue([]);
});

describe('Team Portal endpoints: auth and team scoping', () => {
  const reads = [
    ['lineup', () => getLineup(get('/api/team-portal/lineup?teamId=team-1'))],
    ['fixtures', () => getFixtures(get('/api/team-portal/fixtures?teamId=team-1'))],
    ['stats', () => getStats(get('/api/team-portal/stats?teamId=team-1'))],
    ['overview', () => getOverview(get('/api/team-portal/overview?teamId=team-1'))],
    ['roster', () => getRoster(get('/api/team-portal/roster?teamId=team-1'))],
    ['player', () => getPlayer(get('/api/team-portal/player?teamId=team-1&playerId=p1'))],
    ['match', () => getMatch(get('/api/team-portal/match?teamId=team-1&matchId=m1'))],
  ] as const;

  it.each(reads)('%s returns 401 when signed out', async (_name, call) => {
    mocks.getCurrentUser.mockResolvedValue(null);
    expect((await call()).status).toBe(401);
    expect(mocks.requireActiveTeamContext).not.toHaveBeenCalled();
  });

  it.each(reads)('%s returns 403 for a team not assigned to the coach', async (_name, call) => {
    mocks.requireActiveTeamContext.mockRejectedValue(
      new Error('Forbidden: The selected team is not assigned to this user')
    );
    const response = await call();
    expect(response.status).toBe(403);
    expect(mocks.getActiveSeasonTeam).not.toHaveBeenCalled();
  });

  it.each(reads)('%s checks the requested team against the coach assignments', async (_name, call) => {
    await call();
    expect(mocks.requireActiveTeamContext).toHaveBeenCalledWith('coach-1', 'team-1');
  });
});

describe('Fixtures and stats scoping', () => {
  it('scopes fixtures to the active league season when the team is registered', async () => {
    await getFixtures(get('/api/team-portal/fixtures?teamId=team-1'));
    for (const [filter] of mocks.getFilteredMatches.mock.calls)
      expect(filter).toMatchObject({ teamId: TEAM.id, leagueSeasonId: 'ls-1' });
  });

  it('falls back to all of the team’s matches when not registered', async () => {
    mocks.getActiveSeasonTeam.mockResolvedValue({ season: SEASON, seasonTeam: null });
    const response = await getFixtures(get('/api/team-portal/fixtures?teamId=team-1'));
    expect((await response.json()).registered).toBe(false);
    for (const [filter] of mocks.getFilteredMatches.mock.calls) {
      expect(filter).toMatchObject({ teamId: TEAM.id });
      expect(filter).not.toHaveProperty('leagueSeasonId');
    }
  });

  it('reports results from the team’s point of view', async () => {
    mocks.getFilteredMatches.mockImplementation(async ({ status }: { status: string }) =>
      status === 'COMPLETED'
        ? [
            match({ id: 'home-loss', status: 'COMPLETED', team1Score: 40, team2Score: 55 }),
            match({
              id: 'away-win',
              status: 'COMPLETED',
              team1Id: 'team-2',
              team2Id: TEAM.id,
              team1: { id: 'team-2', name: 'City Hawks', logo: null },
              team2: { id: TEAM.id, name: 'Queens', logo: null },
              team1Score: 31,
              team2Score: 33,
            }),
          ]
        : []
    );
    const body = await (await getFixtures(get('/api/team-portal/fixtures?teamId=team-1'))).json();
    expect(body.results.map((r: any) => [r.id, r.isHome, r.teamScore, r.oppScore, r.result])).toEqual([
      ['home-loss', true, 40, 55, 'loss'],
      ['away-win', false, 33, 31, 'win'],
    ]);
  });

  it('counts lineups only for this team’s rows', async () => {
    mocks.getFilteredMatches.mockImplementation(async ({ status }: { status: string }) =>
      status === 'UPCOMING' ? [match()] : []
    );
    mocks.prisma.matchPlayer.findMany.mockResolvedValue([
      { matchId: 'm1', started: true },
      { matchId: 'm1', started: false },
    ]);
    const body = await (await getFixtures(get('/api/team-portal/fixtures?teamId=team-1'))).json();
    expect(mocks.prisma.matchPlayer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { matchId: { in: ['m1'] }, teamId: TEAM.id } })
    );
    expect(body.upcoming[0].lineup).toEqual({ players: 2, starters: 1 });
  });

  it('builds stats from the approved active-season roster only', async () => {
    await getStats(get('/api/team-portal/stats?teamId=team-1'));
    expect(mocks.prisma.seasonTeamPlayer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { seasonTeamId: 'st-1', status: 'APPROVED', leftAt: null },
      })
    );
    expect(mocks.getStandings).toHaveBeenCalledWith({ leagueSeasonId: 'ls-1' });
  });
});

describe('Overview', () => {
  it('returns the next fixture and a lineup reminder', async () => {
    mocks.getFilteredMatches.mockImplementation(async ({ status }: { status: string }) =>
      status === 'UPCOMING' ? [match({ date: new Date(Date.now() + 2 * 86_400_000) })] : []
    );
    const body = await (await getOverview(get('/api/team-portal/overview?teamId=team-1'))).json();
    expect(body.nextFixture).toMatchObject({ id: 'm1', opponent: { name: 'City Hawks' } });
    expect(body.needsYou.map((item: any) => item.key)).toEqual(['lineup-m1']);
  });

  it('counts only removal requests whose latest decision is still proposed', async () => {
    mocks.prisma.seasonRosterHistory.findMany.mockResolvedValue([
      { rosterId: 'r1', action: 'ROSTER_REMOVAL_PROPOSED' },
      { rosterId: 'r2', action: 'ROSTER_REMOVAL_REJECTED' },
      { rosterId: 'r2', action: 'ROSTER_REMOVAL_PROPOSED' },
    ]);
    const body = await (await getOverview(get('/api/team-portal/overview?teamId=team-1'))).json();
    expect(body.needsYou).toEqual([
      expect.objectContaining({ key: 'roster-pending', detail: '1 removal request pending approval.' }),
    ]);
  });
});

describe('Lineup', () => {
  it('lists the approved roster and current lineup for the requested match', async () => {
    mocks.prisma.match.findFirst.mockResolvedValue(match());
    mocks.prisma.matchPlayer.findMany.mockResolvedValue([
      { playerId: 'p1', started: true, jerseyNumber: 1, player: { firstName: 'Player', lastName: 'p1' } },
    ]);
    const response = await getLineup(get('/api/team-portal/lineup?teamId=team-1&matchId=m1'));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(mocks.prisma.match.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'm1', leagueSeasonId: 'ls-1' }),
      })
    );
    expect(body.match).toMatchObject({ id: 'm1', locked: false });
    expect(body.roster).toHaveLength(6);
    expect(body.lineup).toEqual([expect.objectContaining({ playerId: 'p1', started: true })]);
  });

  it('returns 404 for a match outside the team’s season', async () => {
    const response = await getLineup(get('/api/team-portal/lineup?teamId=team-1&matchId=other'));
    expect(response.status).toBe(404);
  });

  it('returns 401 when signed out', async () => {
    mocks.getCurrentUser.mockResolvedValue(null);
    expect((await putLineup(put(lineupBody([])))).status).toBe(401);
  });

  it('returns 403 for a team not assigned to the coach', async () => {
    mocks.requireActiveTeamContext.mockRejectedValue(new Error('Forbidden: not assigned'));
    expect((await putLineup(put(lineupBody([])))).status).toBe(403);
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
  });

  it.each(['LIVE', 'COMPLETED'])('returns 409 once the match is %s', async (status) => {
    mocks.prisma.match.findUnique.mockResolvedValue(match({ status }));
    const response = await putLineup(put(lineupBody([{ playerId: 'p1', started: true }])));
    expect(response.status).toBe(409);
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
  });

  it('returns 409 when the match goes live during the save', async () => {
    mocks.prisma.match.findUnique
      .mockResolvedValueOnce(match())
      .mockResolvedValueOnce({ status: 'LIVE' });
    const response = await putLineup(put(lineupBody([{ playerId: 'p1', started: true }])));
    expect(response.status).toBe(409);
    expect(mocks.prisma.matchPlayer.upsert).not.toHaveBeenCalled();
  });

  it('returns 404 for a match the team does not play in', async () => {
    mocks.prisma.match.findUnique.mockResolvedValue(match({ team1Id: 'x', team2Id: 'y' }));
    expect((await putLineup(put(lineupBody([])))).status).toBe(404);
  });

  it('returns 400 for a player not on the approved roster', async () => {
    const response = await putLineup(put(lineupBody([{ playerId: 'stranger', started: false }])));
    expect(response.status).toBe(400);
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
  });

  it('returns 400 for more than 5 starters', async () => {
    const players = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'].map((playerId) => ({ playerId, started: true }));
    const response = await putLineup(put(lineupBody(players)));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatch(/at most 5 starters/);
  });

  it('returns 400 naming the missing field for a malformed body', async () => {
    const response = await putLineup(put({ teamId: TEAM.id, players: [] }));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatch(/^matchId: /);
  });

  it('replaces the team’s lineup rows and audits the change', async () => {
    mocks.prisma.matchPlayer.findMany.mockResolvedValue([
      { playerId: 'p1', started: false },
      { playerId: 'p6', started: true },
    ]);
    const response = await putLineup(
      put(
        lineupBody([
          { playerId: 'p1', started: true },
          { playerId: 'p2', started: false },
        ])
      )
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ players: 2, starters: 1 });

    expect(mocks.prisma.matchPlayer.deleteMany).toHaveBeenCalledWith({
      where: { matchId: 'm1', teamId: TEAM.id, playerId: { notIn: ['p1', 'p2'] } },
    });
    expect(mocks.prisma.matchPlayer.upsert).toHaveBeenCalledTimes(2);
    expect(mocks.prisma.matchPlayer.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { matchId_playerId_teamId: { matchId: 'm1', playerId: 'p1', teamId: TEAM.id } },
        update: { started: true, isActive: true },
        create: expect.objectContaining({ started: true, isActive: true, jerseyNumber: 1, teamId: TEAM.id }),
      })
    );
    expect(mocks.logAudit).toHaveBeenCalledWith(
      expect.any(Request),
      'TEAM_PORTAL_LINEUP_SUBMITTED',
      expect.objectContaining({
        players: { added: ['p2'], removed: ['p6'] },
        starters: { added: ['p1'], removed: ['p6'] },
      })
    );
  });
});

describe('Match detail', () => {
  const awayFinal = (overrides: Record<string, unknown> = {}) =>
    match({
      status: 'COMPLETED',
      resultPublishedAt: new Date('2026-07-06T00:00:00Z'),
      team1Id: 'team-2',
      team2Id: TEAM.id,
      team1: { id: 'team-2', name: 'City Hawks', logo: null },
      team2: { id: TEAM.id, name: 'Queens', logo: null },
      team1Score: 31,
      team2Score: 33,
      events: [
        { eventType: 'THREE_POINT_MADE', playerId: 'p1', assistPlayerId: null, isUndone: false },
        { eventType: 'TWO_POINT_MISSED', playerId: 'p1', assistPlayerId: null, isUndone: false },
        { eventType: 'REBOUND_DEFENSIVE', playerId: 'p2', assistPlayerId: null, isUndone: false },
        { eventType: 'FOUL_PERSONAL', playerId: 'p2', assistPlayerId: null, isUndone: false },
      ],
      matchPlayers: [
        { playerId: 'p2', started: false, jerseyNumber: 2, minutesPlayed: 12, player: { firstName: 'B', lastName: 'Bench' } },
        { playerId: 'p1', started: true, jerseyNumber: 1, minutesPlayed: 30, player: { firstName: 'A', lastName: 'Starter' } },
      ],
      ...overrides,
    });
  const load = () => getMatch(get('/api/team-portal/match?teamId=team-1&matchId=m1'));

  it('only loads matches the team plays in', async () => {
    mocks.prisma.match.findFirst.mockResolvedValue(null);
    const response = await load();
    expect(response.status).toBe(404);
    expect(mocks.prisma.match.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'm1', OR: [{ team1Id: TEAM.id }, { team2Id: TEAM.id }] },
      })
    );
  });

  it('returns 400 without a match id', async () => {
    expect((await getMatch(get('/api/team-portal/match?teamId=team-1'))).status).toBe(400);
  });

  it('builds the box score and quarters from the team’s point of view', async () => {
    mocks.prisma.match.findFirst.mockResolvedValue(awayFinal());
    mocks.prisma.matchPeriod.findMany.mockResolvedValue([
      { periodNumber: 1, team1Score: 20, team2Score: 10 },
      { periodNumber: 5, team1Score: 11, team2Score: 23 },
    ]);
    const body = await (await load()).json();
    expect(body.match).toMatchObject({ isHome: false, teamScore: 33, oppScore: 31, result: 'win' });
    expect(body.quarters).toEqual([
      { label: 'Q1', team: 10, opp: 20 },
      { label: 'OT1', team: 23, opp: 11 },
    ]);
    expect(body.players.map((p: any) => [p.playerId, p.started, p.pts, p.reb, p.pf, p.fg, p.tp])).toEqual([
      ['p1', true, 3, 0, 0, '1/2', '1/1'],
      ['p2', false, 0, 1, 1, '0/0', '0/0'],
    ]);
    expect(body.totals).toMatchObject({ pts: 3, reb: 1, pf: 1 });
    expect(body.hasPlayByPlay).toBe(true);
    expect(body.lineupEditable).toBe(false);
  });

  it('hides the score and stats of an unpublished final', async () => {
    mocks.prisma.match.findFirst.mockResolvedValue(awayFinal({ resultPublishedAt: null }));
    const body = await (await load()).json();
    expect(body).toMatchObject({ resultPending: true, showStats: false, totals: null, quarters: [] });
    expect(body.match).toMatchObject({ teamScore: null, oppScore: null, result: null });
    expect(body.players[0]).not.toHaveProperty('pts');
    expect(mocks.prisma.matchPeriod.findMany).not.toHaveBeenCalled();
  });

  it('allows lineup edits only for upcoming matches in the active season', async () => {
    mocks.prisma.match.findFirst.mockResolvedValue(match({ events: [], matchPlayers: [] }));
    expect((await (await load()).json()).lineupEditable).toBe(true);

    mocks.prisma.match.findFirst.mockResolvedValue(
      match({ leagueSeasonId: 'old-season', events: [], matchPlayers: [] })
    );
    expect((await (await load()).json()).lineupEditable).toBe(false);
  });
});
