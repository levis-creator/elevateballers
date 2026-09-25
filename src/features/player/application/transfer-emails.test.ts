import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  prisma: { teamOwnership: { findMany: vi.fn() } },
  sendTransactionalEmail: vi.fn(),
  publishToJob: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }));
vi.mock('@/lib/email/core', () => ({
  sendTransactionalEmail: mocks.sendTransactionalEmail,
  emailWrapper: (html: string) => html,
  btn: (label: string, href: string) => `<a href="${href}">${label}</a>`,
}));
vi.mock('@/lib/qstash', () => ({ publishToJob: mocks.publishToJob }));
vi.mock('@/lib/email/outbox', () => ({ enqueueFailedEmail: vi.fn() }));

import { notifyCoachesOfTransfer } from './transfer-emails';

const notice = {
  transferId: 't1',
  playerName: 'Ann Otieno',
  fromTeamId: 'team-1',
  fromTeamName: 'Queens',
  toTeamId: 'team-2',
  toTeamName: 'City Hawks',
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.publishToJob.mockResolvedValue(false);
});

describe('notifyCoachesOfTransfer', () => {
  it('emails the coaches of both teams once each', async () => {
    mocks.prisma.teamOwnership.findMany.mockResolvedValue([
      { teamId: 'team-1', email: 'kim@example.test', user: { name: 'Kim', email: 'kim@example.test', notificationSettings: null } },
      { teamId: 'team-1', email: 'KIM@example.test', user: null },
      { teamId: 'team-2', email: 'lee@example.test', user: null },
    ]);
    await notifyCoachesOfTransfer(notice);
    expect(mocks.sendTransactionalEmail).toHaveBeenCalledTimes(2);
    const [out, into] = mocks.sendTransactionalEmail.mock.calls.map((call) => call[0]);
    expect(out).toMatchObject({ to: 'kim@example.test', subject: 'Player transferred out · Queens', idempotencyKey: 'player-transfer:t1:team-1' });
    expect(out.html).toContain('to <strong>City Hawks</strong>');
    expect(into).toMatchObject({ to: 'lee@example.test', subject: 'New player · City Hawks', idempotencyKey: 'player-transfer:t1:team-2' });
    expect(into.html).toContain('from <strong>Queens</strong>');
  });

  it('skips coaches who turned email notifications off', async () => {
    mocks.prisma.teamOwnership.findMany.mockResolvedValue([
      { teamId: 'team-1', email: 'kim@example.test', user: { name: 'Kim', email: 'kim@example.test', notificationSettings: { enabled: true, emailEnabled: false } } },
    ]);
    await notifyCoachesOfTransfer(notice);
    expect(mocks.sendTransactionalEmail).not.toHaveBeenCalled();
  });
});
