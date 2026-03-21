import { prisma } from '../../../../lib/prisma';
import type {
    PlayerOfTheWeekWithPlayer,
    Sponsor,
} from '../../types';

/**
 * Get the currently active Player of the Week
 */
export async function getActivePlayerOfTheWeek(): Promise<PlayerOfTheWeekWithPlayer | null> {
    try {
        if (!(prisma as any).playerOfTheWeek) {
            console.error('Prisma model playerOfTheWeek not found. Run "npx prisma generate".');
            return null;
        }

        const potw = await (prisma as any).playerOfTheWeek.findFirst({
            where: { active: true },
            include: {
                player: {
                    include: {
                        team: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return potw as PlayerOfTheWeekWithPlayer | null;
    } catch (error) {
        console.error('Error fetching active player of the week:', error);
        return null;
    }
}

/**
 * Get history of Players of the Week
 */
export async function getPlayerOfTheWeekHistory(): Promise<PlayerOfTheWeekWithPlayer[]> {
    try {
        if (!(prisma as any).playerOfTheWeek) {
            console.error('Prisma model playerOfTheWeek not found. Run "npx prisma generate".');
            return [];
        }

        const history = await (prisma as any).playerOfTheWeek.findMany({
            include: {
                player: {
                    include: {
                        team: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return history as PlayerOfTheWeekWithPlayer[];
    } catch (error) {
        console.error('Error fetching player of the week history:', error);
        return [];
    }
}

/**
 * Get all sponsors
 */
export async function getSponsors(onlyActive = false): Promise<Sponsor[]> {
    try {
        if (!(prisma as any).sponsor) {
            console.error('Prisma model sponsor not found. Run "npx prisma generate".');
            return [];
        }

        const where = onlyActive ? { active: true } : {};

        return await (prisma as any).sponsor.findMany({
            where,
            orderBy: {
                order: 'asc',
            },
        });
    } catch (error) {
        console.error('Error fetching sponsors:', error);
        return [];
    }
}

/**
 * Get a single sponsor by ID
 */
export async function getSponsorById(id: string): Promise<Sponsor | null> {
    try {
        return await prisma.sponsor.findUnique({
            where: { id },
        });
    } catch (error) {
        console.error('Error fetching sponsor by id:', error);
        return null;
    }
}
