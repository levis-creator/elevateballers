import { prisma } from '../../../../lib/prisma';
import { generateSlug } from '../utils';
import type { CreatePlayerInput, UpdatePlayerInput, Player } from '../../types';

async function generateUniquePlayerSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let slug = generateSlug(baseSlug);
  let counter = 1;
  const original = slug;

  while (true) {
    const where: any = { slug };
    if (excludeId) where.id = { not: excludeId };
    const existing = await prisma.player.findFirst({ where });
    if (!existing) return slug;
    slug = `${original}-${counter}`;
    counter++;
  }
}

export async function createPlayer(data: CreatePlayerInput): Promise<Player> {
  const baseName = `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim() || 'player';
  const slug = data.slug || await generateUniquePlayerSlug(baseName);

  const player = await prisma.player.create({
    data: { ...data, slug, approved: data.approved ?? true },
  });

  if (player.teamId) {
    try {
      await prisma.playerTeamHistory.create({
        data: { playerId: player.id, teamId: player.teamId },
      });
    } catch (historyError) {
      console.warn('Failed to record initial team history:', historyError);
    }
  }

  if (player.image) {
    try {
      const { trackFileUsageByUrl } = await import('../../../../lib/file-usage');
      await trackFileUsageByUrl(player.image, 'PLAYER', player.id, 'image');
    } catch (error) {
      console.warn('Failed to track file usage for player image:', error);
    }
  }

  return player;
}

export async function updatePlayer(id: string, data: UpdatePlayerInput): Promise<Player | null> {
  try {
    const existing = await prisma.player.findUnique({
      where: { id },
      select: { image: true, teamId: true, firstName: true, lastName: true },
    });

    const updateData: any = { ...data };

    if (data.slug) {
      updateData.slug = await generateUniquePlayerSlug(data.slug, id);
    } else if (data.firstName || data.lastName) {
      const firstName = data.firstName ?? existing?.firstName ?? '';
      const lastName = data.lastName ?? existing?.lastName ?? '';
      const baseName = `${firstName} ${lastName}`.trim() || 'player';
      updateData.slug = await generateUniquePlayerSlug(baseName, id);
    }

    const player = await prisma.player.update({ where: { id }, data: updateData });

    if (data.teamId !== undefined && data.teamId !== existing?.teamId) {
      try {
        const now = new Date();
        if (existing?.teamId) {
          await prisma.playerTeamHistory.updateMany({
            where: { playerId: id, teamId: existing.teamId, leftAt: null },
            data: { leftAt: now },
          });
        }
        await prisma.playerTeamHistory.create({
          data: { playerId: id, teamId: data.teamId || null, joinedAt: now },
        });
      } catch (historyError) {
        console.warn('Failed to record team history:', historyError);
      }
    }

    if (data.image !== undefined && data.image !== existing?.image) {
      try {
        const { updateFileUsageOnChange } = await import('../../../../lib/file-usage');
        await updateFileUsageOnChange(existing?.image || '', data.image || '', 'PLAYER', id, 'image');
      } catch (error) {
        console.warn('Failed to track file usage for player image update:', error);
      }
    }

    return player;
  } catch (error) {
    console.error('Error updating player:', error);
    return null;
  }
}

export async function deletePlayer(id: string): Promise<boolean> {
  try {
    await prisma.player.delete({ where: { id } });
    return true;
  } catch (error) {
    console.error('Error deleting player:', error);
    return false;
  }
}
