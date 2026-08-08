import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  leagueFindUnique: vi.fn(),
}));

vi.mock('../prisma', () => ({
  prisma: {
    league: { findUnique: mocks.leagueFindUnique },
    leagueSeason: { findUnique: vi.fn() },
  },
}));

vi.mock('../../features/seasons/data/league-season-scope', () => ({
  resolveLeagueSeasonScope: vi.fn(),
}));

import { checkRegistrationOpen } from '../registrationGate';

describe('checkRegistrationOpen site master switch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.leagueFindUnique.mockResolvedValue({
      registrationOpen: false,
      registrationOpensAt: null,
      registrationClosesAt: null,
    });
  });

  it('keeps the legacy league switch authoritative by default', async () => {
    await expect(checkRegistrationOpen('league-1')).resolves.toMatchObject({
      open: false,
      status: { reason: 'closed' },
    });
  });

  it('lets a validated Site Settings master switch override the legacy league switch', async () => {
    await expect(checkRegistrationOpen('league-1', null, null, { siteMasterOpen: true })).resolves.toMatchObject({
      open: true,
    });
  });

  it('still enforces the league deadline when the site master switch is open', async () => {
    mocks.leagueFindUnique.mockResolvedValue({
      registrationOpen: false,
      registrationOpensAt: null,
      registrationClosesAt: new Date('2000-01-01T00:00:00.000Z'),
    });

    await expect(checkRegistrationOpen('league-1', null, null, { siteMasterOpen: true })).resolves.toMatchObject({
      open: false,
      status: { reason: 'league-deadline-passed' },
    });
  });
});
