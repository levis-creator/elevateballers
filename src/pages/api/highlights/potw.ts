import type { APIRoute } from 'astro';
import { getActivePlayerOfTheWeek, getPlayerOfTheWeekHistory } from '../../../features/cms/lib/editorial-queries';
import { setActivePlayerOfTheWeek, updatePlayerOfTheWeek, deletePlayerOfTheWeek } from '../../../features/cms/lib/editorial-mutations';
import { requirePermission } from '../../../features/rbac/middleware';

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
    } catch (error: any) {
        console.error('Error fetching POTW:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch POTW' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
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

        return new Response(JSON.stringify(potw), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Error setting POTW:', error);
        return new Response(JSON.stringify({ error: error.message || 'Failed to set POTW' }), {
            status: error.message === 'Unauthorized' || error.message.includes('Forbidden') ? 401 : 500,
            headers: { 'Content-Type': 'application/json' },
        });
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

        return new Response(JSON.stringify(potw), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Error updating POTW:', error);
        return new Response(JSON.stringify({ error: error.message || 'Failed to update POTW' }), {
            status: error.message === 'Unauthorized' || error.message.includes('Forbidden') ? 401 : 500,
            headers: { 'Content-Type': 'application/json' },
        });
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

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Error deleting POTW:', error);
        return new Response(JSON.stringify({ error: error.message || 'Failed to delete POTW' }), {
            status: error.message === 'Unauthorized' || error.message.includes('Forbidden') ? 401 : 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
