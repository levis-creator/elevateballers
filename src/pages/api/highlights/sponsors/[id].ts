import type { APIRoute } from 'astro';
import { updateSponsor, deleteSponsor } from '../../../../features/cms/lib/editorial-mutations';
import { getSponsorById } from '../../../../features/cms/lib/editorial-queries';
import { requirePermission } from '../../../../features/rbac/middleware';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
    try {
        const id = params.id;
        if (!id) {
            return new Response(JSON.stringify({ error: 'ID is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const sponsor = await getSponsorById(id);
        if (!sponsor) {
            return new Response(JSON.stringify({ error: 'Sponsor not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify(sponsor), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Error fetching sponsor:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch sponsor' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};

export const PUT: APIRoute = async ({ params, request }) => {
    try {
        await requirePermission(request, 'sponsors:update');
        const id = params.id;
        if (!id) {
            return new Response(JSON.stringify({ error: 'ID is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const data = await request.json();
        const sponsor = await updateSponsor(id, data);

        return new Response(JSON.stringify(sponsor), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Error updating sponsor:', error);
        return new Response(JSON.stringify({ error: error.message || 'Failed to update sponsor' }), {
            status: error.message === 'Unauthorized' || error.message.includes('Forbidden') ? 401 : 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};

export const DELETE: APIRoute = async ({ params, request }) => {
    try {
        await requirePermission(request, 'sponsors:update');
        const id = params.id;
        if (!id) {
            return new Response(JSON.stringify({ error: 'ID is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        await deleteSponsor(id);

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Error deleting sponsor:', error);
        return new Response(JSON.stringify({ error: error.message || 'Failed to delete sponsor' }), {
            status: error.message === 'Unauthorized' || error.message.includes('Forbidden') ? 401 : 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
