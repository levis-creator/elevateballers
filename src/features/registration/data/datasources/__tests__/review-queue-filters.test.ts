import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const model = () => ({ findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(0), updateMany: vi.fn() });
  return {
    prisma: {
      player: model(),
      team: model(),
      seasonTeamPlayer: model(),
      user: model(),
      playerDuplicateReview: model(),
    } as any,
  };
});

vi.mock('../../../../../lib/prisma', () => ({ prisma: mocks.prisma }));
vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }));
vi.mock('../public-submission', () => ({ approvePendingSeasonRegistrations: vi.fn() }));

import {
  exportRegistrationReviewQueue,
  getRegistrationReviewQueue,
  requestRegistrationChanges,
  reviewQueueFiltersFromUrl,
} from '../review-queue';
import { csvCell } from '../../../../../lib/csv';

const whereOf = (fn: any) => fn.mock.calls[0][0].where;

beforeEach(() => {
  vi.clearAllMocks();
  for (const model of Object.values(mocks.prisma) as any[]) {
    model.findMany.mockResolvedValue([]);
    model.count.mockResolvedValue(0);
  }
});

describe('review queue filters', () => {
  it('reads every filter from the URL and drops blanks', () => {
    const url = new URL('https://x.test/?kind=TEAM&status=&leagueId=l1&seasonId=s1&teamId=t1&from=2026-01-01&to=2026-02-01&search=%20');
    expect(reviewQueueFiltersFromUrl(url)).toEqual({
      kind: 'TEAM', status: undefined, search: undefined, leagueId: 'l1', seasonId: 's1', teamId: 't1', from: '2026-01-01', to: '2026-02-01',
    });
  });

  it('scopes teams by league, season, team and an inclusive submitted-date range', async () => {
    await getRegistrationReviewQueue({ page: 1, limit: 25, kind: 'TEAM', leagueId: 'l1', seasonId: 's1', teamId: 't1', from: '2026-01-01', to: '2026-01-31' });
    const and = whereOf(mocks.prisma.team.findMany).AND;
    expect(and).toContainEqual({ OR: [
      { seasonTeams: { some: { leagueId: 'l1', seasonId: 's1' } } },
      { seasonRegistrationApplications: { some: { leagueSeason: { leagueId: 'l1', seasonId: 's1' } } } },
    ] });
    expect(and).toContainEqual({ id: 't1' });
    expect(and).toContainEqual({ createdAt: { gte: new Date('2026-01-01T00:00:00.000Z'), lte: new Date('2026-01-31T23:59:59.999Z') } });
    // Players are still scanned for duplicates, but not listed.
    expect(mocks.prisma.player.count).not.toHaveBeenCalled();
  });

  it('ignores a malformed date instead of failing', async () => {
    await getRegistrationReviewQueue({ page: 1, limit: 25, kind: 'PLAYER', from: 'yesterday' });
    expect(JSON.stringify(whereOf(mocks.prisma.player.findMany))).not.toContain('createdAt');
  });

  it('shows needs-changes players and teams, and leaves coach roster requests out', async () => {
    await getRegistrationReviewQueue({ page: 1, limit: 25, status: 'NEEDS_CHANGES' });
    expect(whereOf(mocks.prisma.player.findMany).AND[0]).toEqual({ approved: false, reviewStatus: 'NEEDS_CHANGES' });
    expect(mocks.prisma.seasonTeamPlayer.count).not.toHaveBeenCalled();
  });

  it('lists other teams with the same coach email as context', async () => {
    mocks.prisma.team.findMany
      .mockResolvedValueOnce([{ id: 't1', name: 'Hawks', contactEmail: 'Coach@Example.com' }])
      .mockResolvedValueOnce([
        { id: 't1', name: 'Hawks', contactEmail: 'coach@example.com' },
        { id: 't2', name: 'Eagles', contactEmail: 'coach@example.com' },
      ]);
    const queue = await getRegistrationReviewQueue({ page: 1, limit: 25, kind: 'TEAM' });
    expect(queue.teams[0].sameCoachTeams).toEqual([{ id: 't2', name: 'Eagles' }]);
  });

  it('exports every batch, not just the first 100 rows', async () => {
    const batch = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `p${i}` }));
    mocks.prisma.player.findMany.mockResolvedValueOnce(batch(500)).mockResolvedValueOnce(batch(120));
    const data = await exportRegistrationReviewQueue({ kind: 'PLAYER' });
    expect(data.players).toHaveLength(620);
    expect(mocks.prisma.player.findMany.mock.calls[1][0]).toMatchObject({ skip: 500, take: 500 });
  });
});

describe('requestRegistrationChanges', () => {
  it('marks only unapproved registrations and stores the note', async () => {
    mocks.prisma.team.findMany.mockResolvedValueOnce([{ id: 't1' }]);
    mocks.prisma.team.updateMany.mockResolvedValueOnce({ count: 1 });
    const result = await requestRegistrationChanges({ kind: 'TEAM', ids: ['t1', 't2'], note: 'Add a venue' });
    expect(whereOf(mocks.prisma.team.findMany)).toEqual({ id: { in: ['t1', 't2'] }, approved: false });
    expect(mocks.prisma.team.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['t1'] } },
      data: { reviewStatus: 'NEEDS_CHANGES', reviewNotes: 'Add a venue' },
    });
    expect(result).toEqual({ count: 1, ids: ['t1'] });
  });
});

describe('csvCell', () => {
  it('quotes commas, quotes and newlines', () => {
    expect(csvCell('a,"b"\nc')).toBe('"a,""b""\nc"');
  });
  it('stops spreadsheet formulas from running', () => {
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell('+254700000000')).toBe("'+254700000000");
  });
  it('writes dates as ISO and blanks for null', () => {
    expect(csvCell(new Date('2026-01-02T03:04:05.000Z'))).toBe('2026-01-02T03:04:05.000Z');
    expect(csvCell(null)).toBe('');
  });
});
