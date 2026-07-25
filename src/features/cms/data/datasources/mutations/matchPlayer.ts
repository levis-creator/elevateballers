import { prisma } from '../../../../../lib/prisma';
import type { CreateMatchPlayerInput, UpdateMatchPlayerInput, MatchPlayer } from '../../../types';

export type CreateMatchPlayerResult = {
  matchPlayer: MatchPlayer;
  created: boolean;
};

export async function createMatchPlayer(
  data: CreateMatchPlayerInput
): Promise<CreateMatchPlayerResult | null> {
  try {
    const matchPlayer = await prisma.matchPlayer.create({
      data: {
        matchId: data.matchId,
        playerId: data.playerId,
        teamId: data.teamId,
        started: data.started ?? false,
        isActive: data.started ?? false,
        position: data.position,
        jerseyNumber: data.jerseyNumber,
        minutesPlayed: data.minutesPlayed,
        subOut: data.subOut ?? false,
      },
    });
    return { matchPlayer, created: true };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const matchPlayer = await prisma.matchPlayer.findUnique({
        where: {
          matchId_playerId_teamId: {
            matchId: data.matchId,
            playerId: data.playerId,
            teamId: data.teamId,
          },
        },
      });
      if (matchPlayer) return { matchPlayer, created: false };
    }
    console.error('Error creating match player:', error);
    return null;
  }
}

function isUniqueConstraintError(error: unknown): error is { code: 'P2002' } {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}

export async function updateMatchPlayer(
  id: string,
  data: UpdateMatchPlayerInput
): Promise<MatchPlayer | null> {
  try {
    const updateData: any = { ...data };
    if (data.started !== undefined) updateData.isActive = data.started;
    if (data.subOut !== undefined) updateData.subOut = data.subOut;

    return await prisma.matchPlayer.update({ where: { id }, data: updateData });
  } catch (error) {
    console.error('Error updating match player:', error);
    return null;
  }
}

export async function deleteMatchPlayer(id: string): Promise<boolean> {
  const result = await prisma.matchPlayer.deleteMany({ where: { id } });
  return result.count > 0;
}
