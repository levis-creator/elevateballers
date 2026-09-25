import { describe, expect, it } from 'vitest';
import { buildNeedsYou, type NeedsYouInput } from './needs-you';

const now = new Date('2026-09-23T09:00:00Z');
const inDays = (days: number) => new Date(now.getTime() + days * 86_400_000);

const base: NeedsYouInput = {
  now,
  hasActiveSeason: true,
  registered: true,
  nextMatch: null,
  latestApplication: null,
  pendingPlayers: 0,
  pendingRemovals: 0,
};
const upcoming = (days: number, lineupPlayers = 0) => ({
  id: 'm1',
  date: inDays(days),
  status: 'UPCOMING' as const,
  opponent: 'City Hawks',
  lineupPlayers,
});

describe('buildNeedsYou', () => {
  it('is empty when a registered team has nothing pending', () => {
    expect(buildNeedsYou(base)).toEqual([]);
  });

  it('asks for a lineup when the next match is within 7 days and none is listed', () => {
    const [item] = buildNeedsYou({ ...base, nextMatch: upcoming(3) });
    expect(item).toMatchObject({
      kind: 'action',
      title: 'Submit your lineup',
      target: { view: 'lineup', matchId: 'm1' },
    });
    expect(item!.detail).toContain('City Hawks');
  });

  it('skips the lineup reminder once players are listed', () => {
    expect(buildNeedsYou({ ...base, nextMatch: upcoming(3, 8) })).toEqual([]);
  });

  it('skips the lineup reminder for matches more than 7 days away', () => {
    expect(buildNeedsYou({ ...base, nextMatch: upcoming(10) })).toEqual([]);
  });

  it('skips the lineup reminder once the match is live', () => {
    const live = { ...upcoming(0), status: 'LIVE' as const };
    expect(buildNeedsYou({ ...base, nextMatch: live })).toEqual([]);
  });

  it('asks an unregistered team to register', () => {
    expect(buildNeedsYou({ ...base, registered: false })).toEqual([
      expect.objectContaining({ key: 'registration-missing', kind: 'action', target: { view: 'register' } }),
    ]);
  });

  it('does not nag about registration when there is no active season', () => {
    expect(buildNeedsYou({ ...base, registered: false, hasActiveSeason: false })).toEqual([]);
  });

  it.each(['PENDING', 'OWNERSHIP_VERIFICATION'] as const)(
    'shows a %s entry as waiting on the league office',
    (status) => {
      const [item] = buildNeedsYou({
        ...base,
        registered: false,
        latestApplication: { status, adminNotes: null },
      });
      expect(item).toMatchObject({ key: 'registration-pending', kind: 'info' });
    }
  );

  it('surfaces the admin notes on a rejected entry', () => {
    const [item] = buildNeedsYou({
      ...base,
      registered: false,
      latestApplication: { status: 'REJECTED', adminNotes: 'Missing coach licence.' },
    });
    expect(item).toMatchObject({
      key: 'registration-rejected',
      kind: 'action',
      detail: 'Missing coach licence.',
    });
  });

  it('summarises pending roster proposals and removals in one item', () => {
    const [item] = buildNeedsYou({ ...base, pendingPlayers: 2, pendingRemovals: 1 });
    expect(item).toMatchObject({ key: 'roster-pending', kind: 'info', target: { view: 'roster' } });
    expect(item!.detail).toBe('2 player proposals and 1 removal request pending approval.');
  });

  it('tells the coach about transfers and dropouts made by the league office', () => {
    const at = inDays(-1);
    const items = buildNeedsYou({
      ...base,
      recentDecisions: [
        { id: 'h1', action: 'TRANSFER_OUT', playerName: 'Ann Otieno', at, otherTeam: 'City Hawks' },
        { id: 'h2', action: 'TRANSFER_IN', playerName: 'Bea Wanjiru', at, otherTeam: 'Queens' },
        { id: 'h3', action: 'ROSTER_DROPPED_OUT', playerName: 'Cy Njoroge', at },
      ],
    });
    expect(items.map((item) => item.title)).toEqual([
      'Ann Otieno transferred out',
      'Bea Wanjiru joined your roster',
      'Cy Njoroge dropped out',
    ]);
    expect(items[0].detail).toContain('to City Hawks');
    expect(items[1].detail).toContain('from Queens');
    expect(items.every((item) => item.target?.view === 'roster')).toBe(true);
  });

  it('orders the lineup reminder before registration and roster items', () => {
    const keys = buildNeedsYou({
      ...base,
      registered: false,
      nextMatch: upcoming(1),
      pendingPlayers: 1,
    }).map((item) => item.key);
    expect(keys).toEqual(['lineup-m1', 'registration-missing', 'roster-pending']);
  });
});
