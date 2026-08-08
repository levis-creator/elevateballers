import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
  resetRateLimit: vi.fn(),
  verifyTurnstile: vi.fn(),
  checkRegistrationOpen: vi.fn(),
  createTeam: vi.fn(),
  createStaff: vi.fn(),
  assignStaffToTeam: vi.fn(),
  createPlayer: vi.fn(),
  sendTeamRegistrationAutoReply: vi.fn(),
  sendPlayerRegistrationAutoReply: vi.fn(),
  sendAdminNotificationEmail: vi.fn(),
  logAudit: vi.fn(),
  teamFindUnique: vi.fn(),
  leagueFindUnique: vi.fn(),
  staffFindFirst: vi.fn(),
  playerFindMany: vi.fn(),
  playerFindFirst: vi.fn(),
  notificationCreate: vi.fn(),
  findSubmission: vi.fn(),
  submitTeamRegistration: vi.fn(),
  submitPlayerRegistration: vi.fn(),
  publishToJob: vi.fn(),
  siteSettingFindMany: vi.fn(),
}));

vi.mock('../../../../lib/rateLimit', () => ({ checkRateLimit: mocks.checkRateLimit, resetRateLimit: mocks.resetRateLimit }));
vi.mock('../../../../lib/turnstile', () => ({ verifyTurnstile: mocks.verifyTurnstile }));
vi.mock('../../../../lib/registrationGate', () => ({ checkRegistrationOpen: mocks.checkRegistrationOpen }));
vi.mock('../../../../features/cms/lib/mutations', () => ({ createTeam: mocks.createTeam, createStaff: mocks.createStaff, assignStaffToTeam: mocks.assignStaffToTeam, createPlayer: mocks.createPlayer }));
vi.mock('../../../../features/cms/lib/audit', () => ({ logAudit: mocks.logAudit }));
vi.mock('../../../../lib/email', () => ({ sendTeamRegistrationAutoReply: mocks.sendTeamRegistrationAutoReply, sendPlayerRegistrationAutoReply: mocks.sendPlayerRegistrationAutoReply, sendAdminNotificationEmail: mocks.sendAdminNotificationEmail }));
vi.mock('../../../../lib/apiError', () => ({ handleApiError: vi.fn(() => new Response(JSON.stringify({ error: 'unexpected' }), { status: 500 })) }));
vi.mock('../../../../lib/qstash', () => ({ publishToJob: mocks.publishToJob }));
vi.mock('../../../../features/registration/application/process-registration-email-job', () => ({ processRegistrationEmailJob: vi.fn() }));
vi.mock('../../../../features/registration/data/datasources/public-submission', () => ({ findSubmission: mocks.findSubmission, submitTeamRegistration: mocks.submitTeamRegistration, submitPlayerRegistration: mocks.submitPlayerRegistration }));
vi.mock('../../../../lib/prisma', () => ({ prisma: { siteSetting: { findMany: mocks.siteSettingFindMany }, team: { findUnique: mocks.teamFindUnique }, league: { findUnique: mocks.leagueFindUnique }, staff: { findFirst: mocks.staffFindFirst }, player: { findMany: mocks.playerFindMany, findFirst: mocks.playerFindFirst }, registrationNotification: { create: mocks.notificationCreate } } }));

import { POST as postTeam } from '../team';
import { POST as postPlayer } from '../player';

function request(body: Record<string, unknown>, ip = '203.0.113.10', key = 'test-idempotency-key'): Request {
  return new Request('https://example.test/api/registration', { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': ip, 'idempotency-key': key }, body: JSON.stringify(body) });
}

const teamPayload = { name: '  Mavs   Basketball ', coachName: '  Jane   Doe ', contactEmail: ' JANE@EXAMPLE.COM ', contactPhone: ' (+254) 700-000-000 ', 'cf-turnstile-token': 'token' };
const playerPayload = { firstName: '  Asha ', lastName: ' Wanjiku ', email: ' ASHA@EXAMPLE.COM ', phone: ' (+254) 700-000-000 ', position: ' PG ', 'cf-turnstile-token': 'token' };

describe('public registration endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.checkRateLimit.mockResolvedValue(true);
    mocks.resetRateLimit.mockResolvedValue(undefined);
    mocks.verifyTurnstile.mockResolvedValue(true);
    mocks.checkRegistrationOpen.mockResolvedValue({ open: true });
    mocks.sendTeamRegistrationAutoReply.mockResolvedValue(undefined);
    mocks.sendPlayerRegistrationAutoReply.mockResolvedValue(undefined);
    mocks.sendAdminNotificationEmail.mockResolvedValue(undefined);
    mocks.createTeam.mockResolvedValue({ id: 'team-1', name: 'Mavs Basketball' });
    mocks.createStaff.mockResolvedValue({ id: 'staff-1' });
    mocks.assignStaffToTeam.mockResolvedValue(undefined);
    mocks.createPlayer.mockResolvedValue({ id: 'player-1', firstName: 'Asha', lastName: 'Wanjiku' });
    mocks.teamFindUnique.mockResolvedValue(null);
    mocks.leagueFindUnique.mockResolvedValue(null);
    mocks.staffFindFirst.mockResolvedValue(null);
    mocks.playerFindMany.mockResolvedValue([]);
    mocks.playerFindFirst.mockResolvedValue(null);
    mocks.notificationCreate.mockResolvedValue(undefined);
    mocks.findSubmission.mockResolvedValue(null);
    mocks.submitTeamRegistration.mockResolvedValue({ response: { success: true, message: 'Team registration submitted successfully', entityId: 'team-1' }, jobIds: ['job-team'], teamId: 'team-1' });
    mocks.submitPlayerRegistration.mockResolvedValue({ response: { success: true, message: 'Player registration submitted successfully', entityId: 'player-1' }, jobIds: ['job-player'], playerId: 'player-1' });
    mocks.publishToJob.mockResolvedValue(true);
    mocks.siteSettingFindMany.mockResolvedValue([
      { key: 'registration_open', value: 'true' },
      { key: 'registration_opens', value: '2020-01-01' },
      { key: 'registration_closes', value: '2099-12-31' },
      { key: 'registration_playerMode', value: 'true' },
    ]);
  });

  it('rejects honeypot submissions before security verification', async () => {
    const response = await postTeam({ request: request({ ...teamPayload, website: 'bot' }) } as any);
    expect(response.status).toBe(400);
    expect(mocks.verifyTurnstile).not.toHaveBeenCalled();
    expect(mocks.createTeam).not.toHaveBeenCalled();
  });

  it('returns a generic response when the IP/email limit is exceeded', async () => {
    mocks.checkRateLimit.mockResolvedValueOnce(false);
    const response = await postPlayer({ request: request(playerPayload) } as any);
    expect(response.status).toBe(429);
    expect(await response.json()).toEqual(expect.objectContaining({ error: expect.stringContaining('could not process') }));
    expect(mocks.verifyTurnstile).not.toHaveBeenCalled();
  });

  it('rejects failed Turnstile verification', async () => {
    mocks.verifyTurnstile.mockResolvedValue(false);
    const response = await postPlayer({ request: request(playerPayload) } as any);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Security check failed. Please refresh and try again.' });
  });

  it('normalizes the team payload before persistence', async () => {
    const response = await postTeam({ request: request(teamPayload) } as any);
    expect(response.status).toBe(201);
    expect(mocks.checkRegistrationOpen).toHaveBeenCalledWith(undefined, undefined, undefined, { siteMasterOpen: true });
    expect(mocks.submitTeamRegistration).toHaveBeenCalledWith(expect.objectContaining({ name: 'Mavs Basketball', contactEmail: 'jane@example.com', contactPhone: '+254700000000', idempotencyKey: 'test-idempotency-key' }));
  });

  it('releases consumed limits when team persistence fails', async () => {
    mocks.submitTeamRegistration.mockRejectedValueOnce(new Error('database unavailable'));
    const response = await postTeam({ request: request(teamPayload) } as any);
    expect(response.status).toBe(500);
    expect(mocks.resetRateLimit).toHaveBeenCalledTimes(2);
  });

  it('returns a generic response for duplicate players', async () => {
    mocks.playerFindFirst.mockResolvedValueOnce({ id: 'existing-player' });
    const response = await postPlayer({ request: request(playerPayload) } as any);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual(expect.objectContaining({ error: expect.stringContaining('could not process') }));
    expect(mocks.createPlayer).not.toHaveBeenCalled();
  });
});
