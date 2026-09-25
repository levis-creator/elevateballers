import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  prisma: { user: { findMany: vi.fn() } },
  publishToJob: vi.fn(),
  sendAdminNotificationEmail: vi.fn(),
  sendTransactionalEmail: vi.fn(),
  enqueueFailedEmail: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }));
vi.mock('@/lib/qstash', () => ({ publishToJob: mocks.publishToJob }));
vi.mock('@/lib/email', () => ({ sendAdminNotificationEmail: mocks.sendAdminNotificationEmail }));
vi.mock('@/lib/email/outbox', () => ({ enqueueFailedEmail: mocks.enqueueFailedEmail }));
vi.mock('@/lib/email/config', () => ({ C: {}, SITE_URL: 'https://site.test' }));
vi.mock('@/lib/email/core', () => ({
  btn: (text: string, url: string) => `[${text}](${url})`,
  emailWrapper: (html: string) => html,
  sendTransactionalEmail: mocks.sendTransactionalEmail,
}));

import {
  notifyAdminsOfRosterRequest,
  notifyCoachesOfRosterDecisions,
  type RosterDecision,
} from '../roster-request-emails';

const decision = (overrides: Partial<RosterDecision> = {}): RosterDecision => ({
  rosterId: 'r1',
  playerId: 'p1',
  type: 'NEW',
  approved: true,
  playerName: 'Ann Otieno',
  teamId: 'team-1',
  teamName: 'Queens',
  coachId: 'coach-1',
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.SITE_URL;
  mocks.publishToJob.mockResolvedValue(false);
  mocks.sendAdminNotificationEmail.mockResolvedValue(undefined);
  mocks.sendTransactionalEmail.mockResolvedValue(undefined);
  mocks.prisma.user.findMany.mockResolvedValue([
    { id: 'coach-1', name: 'Coach Kim', email: 'kim@example.test', notificationSettings: null },
  ]);
});

describe('notifyAdminsOfRosterRequest', () => {
  it('sends a roster_request admin email with escaped coach input', async () => {
    await notifyAdminsOfRosterRequest({
      kind: 'NEW',
      playerName: 'Ann <b>Otieno</b>',
      teamName: 'Queens',
      coachName: 'Coach Kim',
      jerseyNumber: 7,
      position: 'PG',
      note: 'Transfer from <script>',
    });
    const [data] = mocks.sendAdminNotificationEmail.mock.calls[0];
    expect(data).toMatchObject({
      type: 'roster_request',
      title: 'New player proposed',
      actionUrl: 'https://site.test/admin/registrations?kind=ROSTER',
    });
    expect(data.message).toContain('Ann &lt;b&gt;Otieno&lt;/b&gt;');
    expect(data.message).toContain('#7 · PG');
    expect(data.message).not.toContain('<script>');
  });

  it('uses the job queue when it is configured', async () => {
    mocks.publishToJob.mockResolvedValue(true);
    await notifyAdminsOfRosterRequest({ kind: 'REMOVAL', playerName: 'Ann', teamName: 'Queens', coachName: null });
    expect(mocks.publishToJob).toHaveBeenCalledWith(
      '/api/jobs/send-email',
      expect.objectContaining({ jobType: 'admin_notification' })
    );
    expect(mocks.sendAdminNotificationEmail).not.toHaveBeenCalled();
  });

  it('never throws when the email fails, and saves it for the hourly resend', async () => {
    const failure = new Error('smtp down');
    mocks.sendAdminNotificationEmail.mockRejectedValue(failure);
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(
      notifyAdminsOfRosterRequest({ kind: 'NEW', playerName: 'Ann', teamName: 'Queens', coachName: null })
    ).resolves.toBeUndefined();
    expect(mocks.enqueueFailedEmail).toHaveBeenCalledWith(
      { jobType: 'admin_notification', data: expect.objectContaining({ type: 'roster_request' }) },
      failure,
      'inline'
    );
    error.mockRestore();
  });

  it('still sends directly when queueing throws', async () => {
    mocks.publishToJob.mockRejectedValue(new Error('qstash down'));
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    await notifyAdminsOfRosterRequest({ kind: 'NEW', playerName: 'Ann', teamName: 'Queens', coachName: null });
    expect(mocks.sendAdminNotificationEmail).toHaveBeenCalled();
    expect(mocks.enqueueFailedEmail).not.toHaveBeenCalled();
    error.mockRestore();
  });
});

describe('notifyCoachesOfRosterDecisions', () => {
  it('sends the proposing coach one email covering all their decisions', async () => {
    await notifyCoachesOfRosterDecisions([
      decision(),
      decision({ type: 'REMOVAL', approved: false, playerName: 'Bea Wanjiru' }),
    ]);
    expect(mocks.sendTransactionalEmail).toHaveBeenCalledTimes(1);
    const [email] = mocks.sendTransactionalEmail.mock.calls[0];
    expect(email.to).toBe('kim@example.test');
    expect(email.subject).toBe('Roster requests reviewed · Queens');
    expect(email.html).toContain('Ann Otieno is approved');
    expect(email.html).toContain('remove Bea Wanjiru was declined');
    expect(email.html).toContain('https://site.test/team-portal?team=team-1&view=roster');
  });

  it('skips coaches who turned email notifications off', async () => {
    mocks.prisma.user.findMany.mockResolvedValue([
      { id: 'coach-1', name: 'Kim', email: 'kim@example.test', notificationSettings: { enabled: true, emailEnabled: false } },
    ]);
    await notifyCoachesOfRosterDecisions([decision()]);
    expect(mocks.sendTransactionalEmail).not.toHaveBeenCalled();
  });

  it('does nothing when no coach is known', async () => {
    await notifyCoachesOfRosterDecisions([decision({ coachId: null })]);
    expect(mocks.prisma.user.findMany).not.toHaveBeenCalled();
  });
});
