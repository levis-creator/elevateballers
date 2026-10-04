import { beforeEach, describe, expect, it, vi } from 'vitest';

const tx = {
  leagueSeason: { findUnique: vi.fn() },
  seasonTeamPlayer: { findFirst: vi.fn() },
  playerOfTheWeek: { updateMany: vi.fn(), create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
};

vi.mock('../../../../lib/prisma', () => ({
  prisma: { $transaction: vi.fn((run: (client: typeof tx) => unknown) => run(tx)) },
}));

import { setActivePlayerOfTheWeek, updatePlayerOfTheWeek } from '../editorial-mutations';

const eblEdition = {
  competitionStructure: 'CONFERENCES',
  league: { name: 'EBL' },
  conferences: [{ id: 'clutch', name: 'Clutch' }, { id: 'grind', name: 'Grind' }],
};

beforeEach(() => {
  vi.clearAllMocks();
  tx.leagueSeason.findUnique.mockResolvedValue(eblEdition);
  tx.seasonTeamPlayer.findFirst.mockResolvedValue({ id: 'roster' });
  tx.playerOfTheWeek.create.mockImplementation(({ data }) => Promise.resolve({ id: 'new', ...data }));
});

describe('setActivePlayerOfTheWeek', () => {
  it('archives only the current pick in the same slot', async () => {
    await setActivePlayerOfTheWeek({ playerId: 'p1', description: 'Story', leagueSeasonId: 'ebl-26', conferenceId: 'clutch' });

    expect(tx.playerOfTheWeek.updateMany).toHaveBeenCalledWith({
      where: { active: true, leagueSeasonId: 'ebl-26', conferenceId: 'clutch' },
      data: { active: false },
    });
    expect(tx.playerOfTheWeek.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ playerId: 'p1', leagueSeasonId: 'ebl-26', conferenceId: 'clutch', active: true }),
    });
  });

  it('checks roster membership inside the chosen conference', async () => {
    await setActivePlayerOfTheWeek({ playerId: 'p1', description: 'Story', leagueSeasonId: 'ebl-26', conferenceId: 'grind' });

    expect(tx.seasonTeamPlayer.findFirst).toHaveBeenCalledWith({
      where: { playerId: 'p1', leagueSeasonId: 'ebl-26', status: 'APPROVED', seasonTeam: { conferenceId: 'grind' } },
      select: { id: true },
    });
  });

  it('rejects a player who is not on a roster in that conference', async () => {
    tx.seasonTeamPlayer.findFirst.mockResolvedValue(null);

    await expect(
      setActivePlayerOfTheWeek({ playerId: 'p1', description: 'Story', leagueSeasonId: 'ebl-26', conferenceId: 'clutch' }),
    ).rejects.toMatchObject({ name: 'PotwSlotError', message: expect.stringContaining('Clutch') });
    expect(tx.playerOfTheWeek.create).not.toHaveBeenCalled();
  });

  it('rejects a conference that belongs to another edition', async () => {
    await expect(
      setActivePlayerOfTheWeek({ playerId: 'p1', description: 'Story', leagueSeasonId: 'ebl-26', conferenceId: 'other' }),
    ).rejects.toMatchObject({ name: 'PotwSlotError' });
  });

  it('requires a conference when the edition is split into conferences', async () => {
    await expect(
      setActivePlayerOfTheWeek({ playerId: 'p1', description: 'Story', leagueSeasonId: 'ebl-26' }),
    ).rejects.toMatchObject({ name: 'PotwSlotError', message: expect.stringContaining('conference') });
  });

  it('gives a single-table league one league-wide slot', async () => {
    tx.leagueSeason.findUnique.mockResolvedValue({ competitionStructure: 'SINGLE_TABLE', league: { name: 'EWBL' }, conferences: [] });

    await setActivePlayerOfTheWeek({ playerId: 'p2', description: 'Story', leagueSeasonId: 'ewbl-26' });

    expect(tx.playerOfTheWeek.updateMany).toHaveBeenCalledWith({
      where: { active: true, leagueSeasonId: 'ewbl-26', conferenceId: null },
      data: { active: false },
    });
  });
});

describe('updatePlayerOfTheWeek', () => {
  it('keeps the record in its slot and re-validates a changed player', async () => {
    tx.playerOfTheWeek.findUnique.mockResolvedValue({ playerId: 'p1', leagueSeasonId: 'ebl-26', conferenceId: 'clutch' });

    await updatePlayerOfTheWeek('award', { playerId: 'p3', active: true });

    expect(tx.seasonTeamPlayer.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ playerId: 'p3', seasonTeam: { conferenceId: 'clutch' } }),
    }));
    expect(tx.playerOfTheWeek.updateMany).toHaveBeenCalledWith({
      where: { active: true, leagueSeasonId: 'ebl-26', conferenceId: 'clutch', id: { not: 'award' } },
      data: { active: false },
    });
  });

  it('skips roster checks for a story-only edit', async () => {
    tx.playerOfTheWeek.findUnique.mockResolvedValue({ playerId: 'p1', leagueSeasonId: 'ebl-26', conferenceId: 'clutch' });

    await updatePlayerOfTheWeek('award', { description: 'New story' });

    expect(tx.seasonTeamPlayer.findFirst).not.toHaveBeenCalled();
    expect(tx.playerOfTheWeek.updateMany).not.toHaveBeenCalled();
  });
});
