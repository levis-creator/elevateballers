import { prisma } from '../../../../lib/prisma';
import type { MatchPlayerWithDetails } from '../../types';

export async function getMatchPlayers(matchId: string): Promise<MatchPlayerWithDetails[]> {
  return await prisma.matchPlayer.findMany({
    where: { matchId },
    include: { player: true, team: true },
    orderBy: [{ started: 'desc' }, { jerseyNumber: 'asc' }],
  }) as MatchPlayerWithDetails[];
}

export async function getMatchPlayersByTeam(matchId: string, teamId: string): Promise<MatchPlayerWithDetails[]> {
  return await prisma.matchPlayer.findMany({
    where: { matchId, teamId },
    include: { player: true, team: true },
    orderBy: [{ started: 'desc' }, { jerseyNumber: 'asc' }],
  }) as MatchPlayerWithDetails[];
}

export async function getMatchPlayerById(id: string): Promise<MatchPlayerWithDetails | null> {
  return await prisma.matchPlayer.findUnique({
    where: { id },
    include: { player: true, team: true },
  }) as MatchPlayerWithDetails | null;
}
