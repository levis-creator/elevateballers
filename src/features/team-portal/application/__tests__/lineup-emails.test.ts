import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ sendAdminNotificationEmail: vi.fn(), queueOrSend: vi.fn() }));
vi.mock('@/lib/email', () => ({ sendAdminNotificationEmail: mocks.sendAdminNotificationEmail }));
vi.mock('@/lib/email/config', () => ({ SITE_URL: 'https://site.test' }));
vi.mock('@/lib/email/queue-or-send', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/email/queue-or-send')>()),
  queueOrSend: mocks.queueOrSend,
}));

import { lineupEmailKey, notifyAdminsOfLineup, type LineupSubmittedAlert } from '../lineup-emails';

const alert = (overrides: Partial<LineupSubmittedAlert> = {}): LineupSubmittedAlert => ({
  matchId: 'm1',
  teamId: 't1',
  teamName: 'Queens',
  coachName: 'Coach <Kim>',
  opponent: 'City Hawks',
  isHome: true,
  when: 'Sat 26 Sep, 12:30',
  previous: [],
  starters: [{ playerId: 'p1', name: 'Ann Otieno', jerseyNumber: 7 }],
  bench: [{ playerId: 'p2', name: 'Bea Wanjiru', jerseyNumber: null }],
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.SITE_URL;
});

describe('notifyAdminsOfLineup', () => {
  it('emails admins a first submission with starters, bench and a link to the match', async () => {
    await notifyAdminsOfLineup(alert());
    const [jobType, data] = mocks.queueOrSend.mock.calls[0];
    expect(jobType).toBe('admin_notification');
    expect(data).toMatchObject({
      type: 'lineup_submitted',
      title: 'Lineup submitted: Queens',
      actionUrl: 'https://site.test/admin/matches/m1',
      idempotencyKey: lineupEmailKey(alert()),
    });
    expect(data.message).toContain('Coach &lt;Kim&gt; submitted');
    expect(data.message).toContain('Starters (1):</strong> #7 Ann Otieno');
    expect(data.message).toContain('Bench (1):</strong> Bea Wanjiru');
  });

  it('calls a changed lineup an update', async () => {
    await notifyAdminsOfLineup(alert({ previous: [{ playerId: 'p1', started: false }] }));
    expect(mocks.queueOrSend.mock.calls[0][1].title).toBe('Lineup updated: Queens');
  });

  it('sends nothing when the saved squad did not change', async () => {
    await notifyAdminsOfLineup(
      alert({ previous: [{ playerId: 'p2', started: false }, { playerId: 'p1', started: true }] })
    );
    expect(mocks.queueOrSend).not.toHaveBeenCalled();
  });
});

describe('lineupEmailKey', () => {
  it('is the same for a retried save and different for a real change', () => {
    const first = lineupEmailKey(alert());
    expect(lineupEmailKey(alert())).toBe(first);
    expect(lineupEmailKey(alert({ starters: [], bench: alert().bench }))).not.toBe(first);
  });

  it('treats switching back to an earlier squad as a new change', () => {
    const squadA = { starters: alert().starters, bench: alert().bench };
    const aToB = lineupEmailKey(alert({ ...squadA, previous: [] }));
    const bToA = lineupEmailKey(alert({ ...squadA, previous: [{ playerId: 'p3', started: true }] }));
    expect(bToA).not.toBe(aToB);
  });
});
