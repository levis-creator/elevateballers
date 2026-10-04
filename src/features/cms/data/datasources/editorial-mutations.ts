import { prisma } from '../../../../lib/prisma';
import type {
    CreatePlayerOfTheWeekInput,
    UpdatePlayerOfTheWeekInput,
    CreateSponsorInput,
    UpdateSponsorInput,
    PlayerOfTheWeek,
    Sponsor,
} from '../../types';

export class PotwSlotError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'PotwSlotError';
    }
}

type PotwSlotRef = { leagueSeasonId: string | null; conferenceId: string | null };

/**
 * Checks a slot is real and the player belongs to it: the conference must be
 * part of the league edition, an edition split into conferences needs one, and
 * the player must be on an approved roster in that edition (and conference).
 */
async function assertPlayerInSlot(tx: any, playerId: string, slot: PotwSlotRef): Promise<void> {
    if (!slot.leagueSeasonId) {
        if (slot.conferenceId) throw new PotwSlotError('A conference slot needs its league season.');
        return;
    }
    const edition = await tx.leagueSeason.findUnique({
        where: { id: slot.leagueSeasonId },
        select: {
            competitionStructure: true,
            league: { select: { name: true } },
            conferences: { select: { id: true, name: true } },
        },
    });
    if (!edition) throw new PotwSlotError('That league season no longer exists.');

    const conference = slot.conferenceId
        ? edition.conferences.find((item: { id: string }) => item.id === slot.conferenceId)
        : null;
    if (slot.conferenceId && !conference) {
        throw new PotwSlotError(`That conference is not part of the ${edition.league.name} edition.`);
    }
    if (!slot.conferenceId && edition.competitionStructure === 'CONFERENCES' && edition.conferences.length) {
        throw new PotwSlotError(`${edition.league.name} is split into conferences — choose a conference slot.`);
    }

    const membership = await tx.seasonTeamPlayer.findFirst({
        where: {
            playerId,
            leagueSeasonId: slot.leagueSeasonId,
            status: 'APPROVED',
            ...(slot.conferenceId ? { seasonTeam: { conferenceId: slot.conferenceId } } : {}),
        },
        select: { id: true },
    });
    if (!membership) {
        throw new PotwSlotError(
            conference
                ? `This player is not on a ${conference.name} conference roster this season.`
                : `This player is not on a ${edition.league.name} roster this season.`,
        );
    }
}

/** Deactivate every other active award in the same slot. */
async function deactivateSlot(tx: any, slot: PotwSlotRef, exceptId?: string): Promise<void> {
    await tx.playerOfTheWeek.updateMany({
        where: {
            active: true,
            leagueSeasonId: slot.leagueSeasonId,
            conferenceId: slot.conferenceId,
            ...(exceptId ? { id: { not: exceptId } } : {}),
        },
        data: { active: false },
    });
}

/**
 * Set a new Player of the Week for a slot. Only the current holder of that
 * slot is archived — the other conferences and leagues keep their pick.
 */
export async function setActivePlayerOfTheWeek(data: CreatePlayerOfTheWeekInput): Promise<PlayerOfTheWeek> {
    const slot: PotwSlotRef = {
        leagueSeasonId: data.leagueSeasonId || null,
        conferenceId: data.conferenceId || null,
    };
    return await prisma.$transaction(async (tx) => {
        await assertPlayerInSlot(tx, data.playerId, slot);
        if (data.active !== false) await deactivateSlot(tx, slot);

        return await (tx as any).playerOfTheWeek.create({
            data: {
                playerId: data.playerId,
                customImage: data.customImage,
                description: data.description,
                active: data.active ?? true,
                leagueSeasonId: slot.leagueSeasonId,
                conferenceId: slot.conferenceId,
            },
        });
    });
}

/**
 * Update a Player of the Week record. The record keeps its slot unless a new
 * one is sent; re-activating it archives the other pick in that slot.
 */
export async function updatePlayerOfTheWeek(id: string, data: UpdatePlayerOfTheWeekInput): Promise<PlayerOfTheWeek> {
    return await prisma.$transaction(async (tx) => {
        const existing = await (tx as any).playerOfTheWeek.findUnique({
            where: { id },
            select: { playerId: true, leagueSeasonId: true, conferenceId: true },
        });
        if (!existing) throw new Error('Player of the Week not found');

        const slotChanged = data.leagueSeasonId !== undefined || data.conferenceId !== undefined;
        const slot: PotwSlotRef = slotChanged
            ? { leagueSeasonId: data.leagueSeasonId || null, conferenceId: data.conferenceId || null }
            : { leagueSeasonId: existing.leagueSeasonId, conferenceId: existing.conferenceId };
        const playerId = data.playerId ?? existing.playerId;
        if (slotChanged || playerId !== existing.playerId) await assertPlayerInSlot(tx, playerId, slot);
        if (data.active === true) await deactivateSlot(tx, slot, id);

        return await (tx as any).playerOfTheWeek.update({
            where: { id },
            data: {
                playerId: data.playerId,
                customImage: data.customImage,
                description: data.description,
                active: data.active,
                ...(slotChanged ? slot : {}),
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
