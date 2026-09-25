import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({ prisma: {} }));

import { transferPlayer } from './transfer-repository';

const tx: any = {
  seasonTeam: { findUnique: vi.fn() },
  seasonTeamPlayer: { findFirst: vi.fn(), update: vi.fn(), upsert: vi.fn() },
  seasonPlayerTransfer: { create: vi.fn() },
  seasonRosterHistory: { createMany: vi.fn() },
  player: { findUnique: vi.fn(), update: vi.fn() },
  playerTeamHistory: { updateMany: vi.fn(), create: vi.fn() },
  matchPlayer: { deleteMany: vi.fn() },
  playerAvailability: { updateMany: vi.fn() },
};

const input = { playerId: 'p1', toSeasonTeamId: 'st-2', reason: 'Requested by both teams', changedById: 'admin-1' };

beforeEach(() => {
  vi.clearAllMocks();
  tx.seasonTeam.findUnique.mockResolvedValue({ id: 'st-2', leagueSeasonId: 'ls-1', teamId: 'team-2', team: { name: 'City Hawks' } });
  tx.seasonTeamPlayer.findFirst.mockResolvedValue({
    id: 'r1',
    seasonTeamId: 'st-1',
    teamId: 'team-1',
    jerseyNumber: 7,
    position: 'PG',
    team: { name: 'Queens' },
  });
  tx.seasonTeamPlayer.upsert.mockResolvedValue({ id: 'r2' });
  tx.seasonPlayerTransfer.create.mockResolvedValue({ id: 't1' });
  tx.player.findUnique.mockResolvedValue({ teamId: 'team-1' });
});

describe('transferPlayer', () => {
  it('moves the player to the new team straight away', async () => {
    const result = await transferPlayer(tx, input);
    expect(result).toEqual({ transferId: 't1', fromTeamId: 'team-1', fromTeamName: 'Queens', toTeamId: 'team-2', toTeamName: 'City Hawks' });
    expect(tx.seasonTeamPlayer.update).toHaveBeenCalledWith({
      where: { id: 'r1' },
      data: { status: 'WITHDRAWN', leftAt: expect.any(Date) },
    });
    // Jersey and position carry over to the new roster entry.
    expect(tx.seasonTeamPlayer.upsert.mock.calls[0][0].create).toMatchObject({ status: 'APPROVED', jerseyNumber: 7, position: 'PG', teamId: 'team-2' });
    expect(tx.seasonPlayerTransfer.create.mock.calls[0][0].data).toMatchObject({
      status: 'APPROVED',
      fromRosterId: 'r1',
      toRosterId: 'r2',
      reviewedById: 'admin-1',
      reason: 'Requested by both teams',
    });
    expect(tx.seasonRosterHistory.createMany.mock.calls[0][0].data.map((row: any) => [row.action, row.seasonTeamId])).toEqual([
      ['TRANSFER_OUT', 'st-1'],
      ['TRANSFER_IN', 'st-2'],
    ]);
  });

  it("updates the player's current team and team history", async () => {
    await transferPlayer(tx, input);
    expect(tx.player.update).toHaveBeenCalledWith({ where: { id: 'p1' }, data: { teamId: 'team-2' } });
    expect(tx.playerTeamHistory.updateMany).toHaveBeenCalledWith({
      where: { playerId: 'p1', teamId: 'team-1', leftAt: null },
      data: { leftAt: expect.any(Date) },
    });
    expect(tx.playerTeamHistory.create.mock.calls[0][0].data).toMatchObject({ playerId: 'p1', teamId: 'team-2' });
  });

  it("clears the old team's upcoming lineups and moves open suspensions and injuries", async () => {
    await transferPlayer(tx, input);
    expect(tx.matchPlayer.deleteMany).toHaveBeenCalledWith({
      where: { playerId: 'p1', teamId: 'team-1', match: { status: 'UPCOMING' } },
    });
    expect(tx.playerAvailability.updateMany).toHaveBeenCalledWith({
      where: { playerId: 'p1', teamId: 'team-1', resolvedAt: null },
      data: { teamId: 'team-2' },
    });
  });

  it('refuses a player who is not on an approved roster in that edition', async () => {
    tx.seasonTeamPlayer.findFirst.mockResolvedValue(null);
    await expect(transferPlayer(tx, input)).rejects.toMatchObject({ name: 'PlayerTransferError' });
    expect(tx.seasonTeamPlayer.update).not.toHaveBeenCalled();
  });

  it('refuses a transfer to the team they are already on', async () => {
    tx.seasonTeam.findUnique.mockResolvedValue({ id: 'st-1', leagueSeasonId: 'ls-1', teamId: 'team-1', team: { name: 'Queens' } });
    await expect(transferPlayer(tx, { ...input, toSeasonTeamId: 'st-1' })).rejects.toThrow('already on that team');
  });
});
