import { prisma } from '../../../lib/prisma';
import type {
    CreatePlayerOfTheWeekInput,
    UpdatePlayerOfTheWeekInput,
    CreateSponsorInput,
    UpdateSponsorInput,
    PlayerOfTheWeek,
    Sponsor,
} from '../types';

/**
 * Set a new Player of the Week
 * This will set all other POTW records to inactive
 */
export async function setActivePlayerOfTheWeek(data: CreatePlayerOfTheWeekInput): Promise<PlayerOfTheWeek> {
    // Use a transaction to ensure atomicity
    return await prisma.$transaction(async (tx) => {
        // If this new one is active, deactivate all others
        if (data.active !== false) {
            await (tx as any).playerOfTheWeek.updateMany({
                where: { active: true },
                data: { active: false },
            });
        }

        return await (tx as any).playerOfTheWeek.create({
            data: {
                playerId: data.playerId,
                customImage: data.customImage,
                description: data.description,
                active: data.active ?? true,
            },
        });
    });
}

/**
 * Update a Player of the Week record
 */
export async function updatePlayerOfTheWeek(id: string, data: UpdatePlayerOfTheWeekInput): Promise<PlayerOfTheWeek> {
    return await prisma.$transaction(async (tx) => {
        // If setting this one to active, deactivate all others
        if (data.active === true) {
            await (tx as any).playerOfTheWeek.updateMany({
                where: {
                    active: true,
                    id: { not: id }
                },
                data: { active: false },
            });
        }

        return await (tx as any).playerOfTheWeek.update({
            where: { id },
            data: {
                playerId: data.playerId,
                customImage: data.customImage,
                description: data.description,
                active: data.active,
            },
        });
    });
}

/**
 * Delete a Player of the Week record
 */
export async function deletePlayerOfTheWeek(id: string): Promise<void> {
    await (prisma as any).playerOfTheWeek.delete({
        where: { id },
    });
}

/**
 * Create a new sponsor
 */
export async function createSponsor(data: CreateSponsorInput): Promise<Sponsor> {
    // Get the current highest order to put the new one at the end
    const lastSponsor = await (prisma as any).sponsor.findFirst({
        orderBy: { order: 'desc' },
    });

    const order = data.order ?? (lastSponsor ? lastSponsor.order + 1 : 0);

    return await (prisma as any).sponsor.create({
        data: {
            name: data.name,
            image: data.image,
            link: data.link,
            order,
            active: data.active ?? true,
        },
    });
}

/**
 * Update a sponsor
 */
export async function updateSponsor(id: string, data: UpdateSponsorInput): Promise<Sponsor> {
    return await (prisma as any).sponsor.update({
        where: { id },
        data,
    });
}

/**
 * Delete a sponsor
 */
export async function deleteSponsor(id: string): Promise<void> {
    await (prisma as any).sponsor.delete({
        where: { id },
    });
}

/**
 * Reorder sponsors
 */
export async function reorderSponsors(ids: string[]): Promise<void> {
    await prisma.$transaction(
        ids.map((id, index) =>
            (prisma as any).sponsor.update({
                where: { id },
                data: { order: index },
            })
        )
    );
}
