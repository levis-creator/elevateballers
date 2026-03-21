import { prisma } from '../../../../../lib/prisma';
import type { CreateMatchPlayerInput, UpdateMatchPlayerInput, MatchPlayer } from '../../../types';

export async function createMatchPlayer(data: CreateMatchPlayerInput): Promise<MatchPlayer | null> {
  try {
    return await prisma.matchPlayer.create({
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
  } catch (error) {
    console.error('Error creating match player:', error);
    return null;
  }
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
  try {
    await prisma.matchPlayer.delete({ where: { id } });
    return true;
  } catch (error) {
    console.error('Error deleting match player:', error);
    return false;
  }
}
