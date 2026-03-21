import { prisma } from '../../../../lib/prisma';
import type { Player } from '../../types';

export async function getPlayers(teamId?: string, isAdmin = false): Promise<Player[]> {
  const where: any = { ...(isAdmin ? {} : { approved: true }) };
  if (teamId) where.teamId = teamId;

  const select: any = {
    id: true, slug: true, firstName: true, lastName: true, image: true,
    bio: true, height: true, weight: true, position: true, jerseyNumber: true,
    stats: true, approved: true, teamId: true, createdAt: true, updatedAt: true,
    team: { select: { id: true, name: true, slug: true, approved: true } },
  };
  if (isAdmin) { select.email = true; select.phone = true; }

  return await prisma.player.findMany({
    where, select,
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
  }) as unknown as Player[];
}

export async function getPlayerById(id: string, isAdmin = false): Promise<Player | null> {
  const select: any = {
    id: true, slug: true, firstName: true, lastName: true, image: true,
    bio: true, height: true, weight: true, position: true, jerseyNumber: true,
    stats: true, approved: true, teamId: true, createdAt: true, updatedAt: true, team: true,
  };
  if (isAdmin) { select.email = true; select.phone = true; }

  return await prisma.player.findUnique({ where: { id }, select }) as unknown as Player | null;
}

export async function getPlayerBySlug(slug: string): Promise<Player | null> {
  const select: any = {
    id: true, slug: true, firstName: true, lastName: true, image: true,
    bio: true, height: true, weight: true, position: true, jerseyNumber: true,
    stats: true, approved: true, teamId: true, createdAt: true, updatedAt: true, team: true,
  };

  return await prisma.player.findFirst({ where: { slug, approved: true }, select }) as unknown as Player | null;
}
