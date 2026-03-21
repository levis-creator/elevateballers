import { prisma } from '../../../../../lib/prisma';
import type { MatchEventWithDetails } from '../../../types';

export async function getMatchEvents(matchId: string): Promise<MatchEventWithDetails[]> {
  return await prisma.matchEvent.findMany({
    where: { matchId },
    include: { player: true, assistPlayer: true, team: true },
    orderBy: { createdAt: 'desc' },
  }) as MatchEventWithDetails[];
}

export async function getMatchEventsByTeam(matchId: string, teamId: string): Promise<MatchEventWithDetails[]> {
  return await prisma.matchEvent.findMany({
    where: { matchId, teamId },
    include: { player: true, assistPlayer: true, team: true },
    orderBy: { createdAt: 'desc' },
  }) as MatchEventWithDetails[];
}

export async function getMatchEventsByType(matchId: string, eventType: string): Promise<MatchEventWithDetails[]> {
  return await prisma.matchEvent.findMany({
    where: { matchId, eventType: eventType as any },
    include: { player: true, assistPlayer: true, team: true },
    orderBy: { createdAt: 'desc' },
  }) as MatchEventWithDetails[];
}

export async function getMatchEventById(id: string): Promise<MatchEventWithDetails | null> {
  return await prisma.matchEvent.findUnique({
    where: { id },
    include: { player: true, assistPlayer: true, team: true },
  }) as MatchEventWithDetails | null;
}
