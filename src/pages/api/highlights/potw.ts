import type { APIRoute } from 'astro';
import { getActivePlayerOfTheWeek, getActivePlayersOfTheWeek, getPlayerOfTheWeekHistory, getPotwCandidates } from '../../../features/cms/lib/editorial-queries';
import { buildPotwSlots, currentPotwSlots } from '../../../features/cms/lib/potw-slots';
import { getPublicCompetitions } from '../../../features/seasons/data/public-competitions';
import { setActivePlayerOfTheWeek, updatePlayerOfTheWeek, deletePlayerOfTheWeek } from '../../../features/cms/lib/editorial-mutations';
import { requirePermission } from '../../../features/rbac/middleware';
import { logAudit } from '../../../features/cms/lib/audit';
import { handleApiError, json } from '../../../lib/apiError';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
    try {
        const url = new URL(request.url);
        const history = url.searchParams.get('history') === 'true';

        // Award slots (one per conference, or per single-table league) with the
        // active pick in each, for the admin manager.
        if (url.searchParams.get('slots') === 'true') {
            const [competitions, active] = await Promise.all([getPublicCompetitions(), getActivePlayersOfTheWeek()]);
            return json({
                slots: buildPotwSlots(competitions),
                currentSlotKeys: currentPotwSlots(competitions).map((slot) => slot.key),
                active,
            }, 200);
        }

        // Players eligible for one slot, ranked by points per game there.
        if (url.searchParams.get('candidates') === 'true') {
            await requirePermission(request, 'potw:create');
            const leagueSeasonId = url.searchParams.get('leagueSeasonId');
            if (!leagueSeasonId) return json({ error: 'leagueSeasonId is required' }, 400);
            return json(await getPotwCandidates(leagueSeasonId, url.searchParams.get('conferenceId') || null), 200);
        }

        if (history) {
            const allPotw = await getPlayerOfTheWeekHistory();
            return new Response(JSON.stringify(allPotw), {
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const activePotw = await getActivePlayerOfTheWeek();
        return new Response(JSON.stringify(activePotw), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return handleApiError(error, 'fetch POTW', request);
    }
};

export const POST: APIRoute = async ({ request }) => {
    try {
        await requirePermission(request, 'potw:create');
        const data = await request.json();

        if (!data.playerId || !data.description) {
            return new Response(JSON.stringify({ error: 'Player and description are required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const potw = await setActivePlayerOfTheWeek(data);
        await logAudit(
            request,
            'POTW_CREATED',
            {
                playerId: data.playerId,
                leagueSeasonId: data.leagueSeasonId ?? null,
                conferenceId: data.conferenceId ?? null,
                hasDescription: Boolean(data.description),
            }
        );

        return new Response(JSON.stringify(potw), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return handleApiError(error, 'set POTW', request);
    }
};

export const PUT: APIRoute = async ({ request }) => {
    try {
        await requirePermission(request, 'potw:create');
        const data = await request.json();
        const { id, ...updateData } = data;

        if (!id) {
            return new Response(JSON.stringify({ error: 'ID is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const potw = await updatePlayerOfTheWeek(id, updateData);
        await logAudit(
            request,
            'POTW_UPDATED',
            { id, fields: Object.keys(updateData ?? {}) }
        );

        return new Response(JSON.stringify(potw), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return handleApiError(error, 'update POTW', request);
    }
};

export const DELETE: APIRoute = async ({ request, url }) => {
    try {
        await requirePermission(request, 'potw:create');
        const id = new URL(url).searchParams.get('id');

        if (!id) {
            return new Response(JSON.stringify({ error: 'ID is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        await deletePlayerOfTheWeek(id);
        await logAudit(request, 'POTW_DELETED', { id });

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return handleApiError(error, 'delete POTW', request);
    }
};
