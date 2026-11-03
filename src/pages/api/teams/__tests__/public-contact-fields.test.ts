import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getTeamById: vi.fn(),
  getStaffByTeam: vi.fn(),
  getMatchPlayers: vi.fn(),
  getMatchPlayersByTeam: vi.fn(),
  requireTeamScopedPermission: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: {} }));
vi.mock('@/features/cms/lib/queries', () => ({
  getTeamById: mocks.getTeamById,
  getStaffByTeam: mocks.getStaffByTeam,
  getMatchPlayers: mocks.getMatchPlayers,
  getMatchPlayersByTeam: mocks.getMatchPlayersByTeam,
}));
vi.mock('@/features/cms/lib/mutations', () => ({}));
vi.mock('@/features/cms/lib/audit', () => ({ logAudit: vi.fn() }));
vi.mock('@/features/cms/lib/auth', () => ({ requireAuth: vi.fn() }));
vi.mock('@/features/rbac/auth-helpers', () => ({ requireSystemAdmin: vi.fn() }));
vi.mock('@/features/rbac/middleware', () => ({ requireTeamScopedPermission: mocks.requireTeamScopedPermission }));
vi.mock('@/features/registration/data/datasources/public-submission', () => ({}));
vi.mock('@/features/registration/application/send-registration-decision', () => ({}));
vi.mock('@/features/game-tracking/domain/squad-limits', () => ({}));
vi.mock('@/features/player/data/datasources/availability-repository', () => ({}));

import { GET as getTeam } from '../[id]';
import { GET as getTeamStaff } from '../[id]/staff';
import { GET as getMatchPlayers } from '../../matches/[matchId]/players/index';

const player = { id: 'p1', firstName: 'Ann', email: 'ann@example.com', phone: '0700000000' };
const staffRow = { id: 'ts1', role: 'COACH', staff: { id: 's1', firstName: 'Ben', email: 'ben@example.com', phone: '0711111111', nextOfKin: 'Kin', idNumber: '123' } };

const call = async (handler: any, url: string, params: Record<string, string>) => {
  const response = await handler({ params, request: new Request(url), url: new URL(url) });
  return response.json();
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getTeamById.mockResolvedValue({ id: 't1', name: 'Queens', players: [player] });
  mocks.getStaffByTeam.mockResolvedValue([staffRow]);
  mocks.getMatchPlayers.mockResolvedValue([{ id: 'mp1', player }]);
});

describe('public team and match responses', () => {
  it('hides player contacts from visitors who cannot manage the team', async () => {
    mocks.requireTeamScopedPermission.mockRejectedValue(new Error('Authentication required'));
    const team = await call(getTeam, 'https://example.test/api/teams/t1', { id: 't1' });
    expect(team.players).toEqual([{ id: 'p1', firstName: 'Ann' }]);
  });

  it('keeps player contacts for staff who manage the team', async () => {
    mocks.requireTeamScopedPermission.mockResolvedValue({ id: 'admin-1' });
    const team = await call(getTeam, 'https://example.test/api/teams/t1', { id: 't1' });
    expect(team.players[0].email).toBe('ann@example.com');
  });

  it('shows visitors only approved staff, without contact details', async () => {
    mocks.requireTeamScopedPermission.mockRejectedValue(new Error('Authentication required'));
    const staff = await call(getTeamStaff, 'https://example.test/api/teams/t1/staff', { id: 't1' });
    expect(mocks.getStaffByTeam).toHaveBeenCalledWith('t1', false);
    expect(staff).toEqual([{ id: 'ts1', role: 'COACH', staff: { id: 's1', firstName: 'Ben' } }]);
  });

  it('shows team managers all staff with contact details', async () => {
    mocks.requireTeamScopedPermission.mockResolvedValue({ id: 'admin-1' });
    const staff = await call(getTeamStaff, 'https://example.test/api/teams/t1/staff', { id: 't1' });
    expect(mocks.requireTeamScopedPermission).toHaveBeenCalledWith(expect.any(Request), 't1', 'staff:read');
    expect(mocks.getStaffByTeam).toHaveBeenCalledWith('t1', true);
    expect(staff[0].staff.email).toBe('ben@example.com');
  });

  it('never includes player contacts in match rosters', async () => {
    const rows = await call(getMatchPlayers, 'https://example.test/api/matches/m1/players', { matchId: 'm1' });
    expect(rows).toEqual([{ id: 'mp1', player: { id: 'p1', firstName: 'Ann' } }]);
  });
});
