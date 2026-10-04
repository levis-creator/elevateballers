import { prisma } from '../../../../lib/prisma';
import { calculatePlayerStatistics } from '@/features/player/lib/playerStats';
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

const POTW_INCLUDE = {
    player: { include: { team: true } },
    leagueSeason: {
        select: {
            id: true,
            league: { select: { name: true } },
            season: { select: { name: true } },
        },
    },
    conference: { select: { id: true, name: true } },
} as const;

/**
 * Every active Player of the Week — at most one per slot (league edition, plus
 * conference when it has them). Includes slot-less awards made before slots
 * existed so callers can fall back to them.
 */
export async function getActivePlayersOfTheWeek(): Promise<PlayerOfTheWeekWithPlayer[]> {
    try {
        return await prisma.playerOfTheWeek.findMany({
            where: { active: true },
            include: POTW_INCLUDE,
            orderBy: { createdAt: 'desc' },
        }) as PlayerOfTheWeekWithPlayer[];
    } catch (error) {
        console.error('Error fetching active players of the week:', error);
        return [];
    }
}

export interface PotwCandidate {
    id: string;
    firstName: string | null;
    lastName: string | null;
    image: string | null;
    position: string | null;
    jerseyNumber: number | null;
    teamName: string | null;
    /** Points per game in this league edition; null before they've played. */
    pointsPerGame: number | null;
}

/**
 * Players eligible for a slot: approved on a roster in the league edition (and
 * in the conference, for a conference slot), ranked by points per game there.
 */
export async function getPotwCandidates(leagueSeasonId: string, conferenceId: string | null): Promise<PotwCandidate[]> {
    const [rosters, matches] = await Promise.all([
        prisma.seasonTeamPlayer.findMany({
            where: {
                leagueSeasonId,
                status: 'APPROVED',
                ...(conferenceId ? { seasonTeam: { conferenceId } } : {}),
            },
            select: {
                jerseyNumber: true,
                position: true,
                leftAt: true,
                team: { select: { name: true } },
                player: {
                    select: { id: true, firstName: true, lastName: true, image: true, position: true, jerseyNumber: true },
                },
            },
            orderBy: { joinedAt: 'desc' },
        }),
        prisma.match.findMany({
            where: { leagueSeasonId, status: 'COMPLETED', resultPublishedAt: { not: null } },
            select: {
                id: true,
                status: true,
                events: {
                    where: { isUndone: false },
                    select: { eventType: true, playerId: true, assistPlayerId: true, isUndone: true },
                },
            },
        }),
    ]);

    // A player transferred mid-season has several roster rows — prefer the one
    // they're still on.
    const byPlayer = new Map<string, (typeof rosters)[number]>();
    for (const row of rosters) {
        const current = byPlayer.get(row.player.id);
        if (!current || (current.leftAt && !row.leftAt)) byPlayer.set(row.player.id, row);
    }

    return [...byPlayer.values()]
        .map(({ player, team, jerseyNumber, position }) => {
            const stats = calculatePlayerStatistics(matches as any, player.id);
            return {
                id: player.id,
                firstName: player.firstName,
                lastName: player.lastName,
                image: player.image,
                position: position ?? player.position,
                jerseyNumber: jerseyNumber ?? player.jerseyNumber,
                teamName: team?.name ?? null,
                pointsPerGame: stats.totalMatches > 0 ? Math.round(stats.pointsPerGame * 10) / 10 : null,
            };
        })
        .sort((a, b) =>
            (b.pointsPerGame ?? -1) - (a.pointsPerGame ?? -1) ||
            `${a.firstName ?? ''} ${a.lastName ?? ''}`.localeCompare(`${b.firstName ?? ''} ${b.lastName ?? ''}`),
        );
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
            include: POTW_INCLUDE,
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
