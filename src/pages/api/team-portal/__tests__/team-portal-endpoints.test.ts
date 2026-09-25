import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const prisma: any = {
    match: { findMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn() },
    matchPlayer: { findMany: vi.fn(), deleteMany: vi.fn(), updateMany: vi.fn(), createMany: vi.fn() },
    season: { findFirst: vi.fn() },
    seasonTeam: { findFirst: vi.fn() },
    matchPeriod: { findMany: vi.fn() },
    seasonTeamPlayer: { findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn(), update: vi.fn() },
    seasonRosterHistory: { findMany: vi.fn(), create: vi.fn() },
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
import { GET as getRoster, POST as postRoster } from '../roster/index';
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
  mocks.prisma.matchPlayer.updateMany.mockResolvedValue({ count: 0 });
  mocks.prisma.matchPlayer.createMany.mockResolvedValue({ count: 0 });
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
    mocks.prisma.seasonRosterHistory.findMany.mockImplementation(async ({ where }: any) =>
      where.createdAt
        ? []
        : [
            { rosterId: 'r1', action: 'ROSTER_REMOVAL_PROPOSED' },
            { rosterId: 'r2', action: 'ROSTER_REMOVAL_REJECTED' },
            { rosterId: 'r2', action: 'ROSTER_REMOVAL_PROPOSED' },
          ]
    );
    const body = await (await getOverview(get('/api/team-portal/overview?teamId=team-1'))).json();
    expect(body.needsYou).toEqual([
      expect.objectContaining({ key: 'roster-pending', detail: '1 removal request pending approval.' }),
    ]);
  });
});

describe('Overview roster decisions', () => {
  it('lists recent league-office decisions for the coach', async () => {
    mocks.prisma.seasonRosterHistory.findMany.mockImplementation(async ({ where }: any) =>
      where.createdAt
        ? [
            {
              id: 'h1',
              action: 'ROSTER_APPROVED',
              createdAt: new Date('2026-09-24T10:00:00Z'),
              player: { firstName: 'Ann', lastName: 'Otieno' },
            },
          ]
        : []
    );
    const body = await (await getOverview(get('/api/team-portal/overview?teamId=team-1'))).json();
    expect(body.needsYou).toEqual([
      expect.objectContaining({
        key: 'roster-decision-h1',
        kind: 'info',
        title: 'Ann Otieno approved',
        target: { view: 'roster' },
      }),
    ]);
    const decisionQuery = mocks.prisma.seasonRosterHistory.findMany.mock.calls.find(
      ([args]: any) => args.where.createdAt
    )[0];
    expect(decisionQuery.where).toMatchObject({ seasonTeamId: 'st-1' });
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
    expect(mocks.prisma.matchPlayer.updateMany).not.toHaveBeenCalled();
    expect(mocks.prisma.matchPlayer.createMany).not.toHaveBeenCalled();
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

  it('saves a full squad with a constant number of queries', async () => {
    const players = ROSTER.map((entry, index) => ({ playerId: entry.player.id, started: index < 5 }));
    const response = await putLineup(put(lineupBody(players)));
    expect(response.status).toBe(200);
    expect(mocks.prisma.matchPlayer.createMany).toHaveBeenCalledTimes(1);
    expect(mocks.prisma.matchPlayer.createMany.mock.calls[0][0].data).toHaveLength(6);
    expect(mocks.prisma.matchPlayer.updateMany).not.toHaveBeenCalled();
    expect(mocks.prisma.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ timeout: expect.any(Number) })
    );
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
    expect(mocks.prisma.matchPlayer.updateMany).toHaveBeenCalledTimes(1);
    expect(mocks.prisma.matchPlayer.updateMany).toHaveBeenCalledWith({
      where: { matchId: 'm1', teamId: TEAM.id, playerId: { in: ['p1'] } },
      data: { started: true, isActive: true },
    });
    expect(mocks.prisma.matchPlayer.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({ playerId: 'p2', started: false, isActive: false, jerseyNumber: 2, teamId: TEAM.id }),
      ],
      skipDuplicates: true,
    });
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

describe('Roster edits', () => {
  const edit = (body: Record<string, unknown>) =>
    postRoster({
      request: new Request('https://example.test/api/team-portal/roster', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ teamId: TEAM.id, rosterId: 'r1', ...body }),
      }),
    } as any);

  beforeEach(() => {
    mocks.prisma.season.findFirst.mockResolvedValue(SEASON);
    mocks.prisma.seasonTeam.findFirst.mockResolvedValue(SEASON_TEAM);
    mocks.prisma.seasonTeamPlayer.findFirst.mockResolvedValue({
      id: 'r1',
      playerId: 'p1',
      jerseyNumber: 4,
      position: 'PG',
    });
    mocks.prisma.seasonTeamPlayer.update.mockResolvedValue({ id: 'r1' });
    mocks.prisma.seasonRosterHistory.create.mockResolvedValue({});
  });

  it('applies jersey and position straight away without re-approval', async () => {
    const response = await edit({ jerseyNumber: '11', position: 'SG' });
    expect(response.status).toBe(200);
    expect((await response.json()).message).toBe('Player details updated.');
    expect(mocks.prisma.seasonTeamPlayer.update).toHaveBeenCalledWith({
      where: { id: 'r1' },
      data: { jerseyNumber: 11, position: 'SG' },
    });
    expect(mocks.prisma.matchPlayer.updateMany).toHaveBeenCalledWith({
      where: {
        playerId: 'p1',
        teamId: TEAM.id,
        match: { leagueSeasonId: 'ls-1', status: 'UPCOMING' },
      },
      data: { jerseyNumber: 11 },
    });
    expect(mocks.prisma.seasonRosterHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'ROSTER_EDITED', changedById: 'coach-1' }),
    });
    expect(mocks.logAudit).toHaveBeenCalledWith(expect.any(Request), 'TEAM_PORTAL_ROSTER_PLAYER_EDITED', {
      teamId: TEAM.id,
      rosterId: 'r1',
      playerId: 'p1',
      jerseyNumber: { from: 4, to: 11 },
      position: { from: 'PG', to: 'SG' },
    });
  });

  it('leaves upcoming lineups alone when the jersey is unchanged', async () => {
    await edit({ jerseyNumber: '4', position: 'SF' });
    expect(mocks.prisma.matchPlayer.updateMany).not.toHaveBeenCalled();
  });

  it('rejects an invalid jersey number', async () => {
    expect((await edit({ jerseyNumber: '120' })).status).toBe(400);
    expect(mocks.prisma.seasonTeamPlayer.update).not.toHaveBeenCalled();
    expect(mocks.logAudit).not.toHaveBeenCalled();
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

  it('marks only active-season roster players as linkable', async () => {
    mocks.prisma.match.findFirst.mockResolvedValue(awayFinal());
    mocks.prisma.seasonTeamPlayer.findMany.mockResolvedValue([{ playerId: 'p1' }]);
    const body = await (await load()).json();
    expect(mocks.prisma.seasonTeamPlayer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          seasonTeamId: 'st-1',
          status: { in: ['APPROVED', 'PENDING'] },
          leftAt: null,
          playerId: { in: ['p2', 'p1'] },
        },
      })
    );
    expect(body.players.map((p: any) => [p.playerId, p.onRoster])).toEqual([
      ['p1', true],
      ['p2', false],
    ]);
  });

  it('treats every player as former when the team is not registered this season', async () => {
    mocks.getActiveSeasonTeam.mockResolvedValue({ season: SEASON, seasonTeam: null });
    mocks.prisma.match.findFirst.mockResolvedValue(awayFinal());
    const body = await (await load()).json();
    expect(body.players.every((p: any) => p.onRoster === false)).toBe(true);
    expect(mocks.prisma.seasonTeamPlayer.findMany).not.toHaveBeenCalled();
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
