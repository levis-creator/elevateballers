import type { APIRoute } from 'astro';
import { getSponsors } from '../../../../features/cms/lib/editorial-queries';
import { createSponsor, reorderSponsors } from '../../../../features/cms/lib/editorial-mutations';
import { requireAdmin } from '../../../../features/cms/lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
    try {
        const url = new URL(request.url);
        const onlyActive = url.searchParams.get('active') !== 'false'; // Default to true if not specified

        const sponsors = await getSponsors(onlyActive);
        return new Response(JSON.stringify(sponsors), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Error fetching sponsors:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch sponsors' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};

export const POST: APIRoute = async ({ request }) => {
    try {
        await requireAdmin(request);
        const data = await request.json();

        // Handle reordering
        if (data.reorder && Array.isArray(data.ids)) {
            await reorderSponsors(data.ids);
            return new Response(JSON.stringify({ success: true }), {
                headers: { 'Content-Type': 'application/json' },
            });
        }

        if (!data.name || !data.image) {
            return new Response(JSON.stringify({ error: 'Name and image are required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const sponsor = await createSponsor(data);

        return new Response(JSON.stringify(sponsor), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Error creating sponsor:', error);
        return new Response(JSON.stringify({ error: error.message || 'Failed to create sponsor' }), {
            status: error.message === 'Unauthorized' || error.message.includes('Forbidden') ? 401 : 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
