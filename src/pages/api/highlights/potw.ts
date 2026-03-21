import type { APIRoute } from 'astro';
import { getActivePlayerOfTheWeek, getPlayerOfTheWeekHistory } from '../../../features/cms/lib/editorial-queries';
import { setActivePlayerOfTheWeek, updatePlayerOfTheWeek, deletePlayerOfTheWeek } from '../../../features/cms/lib/editorial-mutations';
import { requirePermission } from '../../../features/rbac/middleware';
import { logAudit } from '../../../features/cms/lib/audit';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
    try {
        const url = new URL(request.url);
        const history = url.searchParams.get('history') === 'true';

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
            { playerId: data.playerId, hasDescription: Boolean(data.description) }
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
