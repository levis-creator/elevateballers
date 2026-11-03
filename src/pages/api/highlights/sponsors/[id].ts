import type { APIRoute } from 'astro';
import { normalizeExternalUrl } from '../../../../lib/externalUrl';
import { updateSponsor, deleteSponsor } from '../../../../features/cms/lib/editorial-mutations';
import { getSponsorById } from '../../../../features/cms/lib/editorial-queries';
import { requirePermission } from '../../../../features/rbac/middleware';

import { handleApiError } from '../../../../lib/apiError';
import { logAudit } from '@/features/cms/lib/audit';
export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
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
        return handleApiError(error, "fetch sponsor", request);
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
        // Store sponsor links as full URLs: a link without a scheme renders as a
        // path on this site and sends crawlers to junk URLs.
        if (typeof data.link === 'string' && data.link.trim()) {
            const link = normalizeExternalUrl(data.link);
            if (!link) {
                return new Response(JSON.stringify({ error: 'Enter the sponsor link as a full web address, like https://example.com' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
            data.link = link;
        }

        const sponsor = await updateSponsor(id, data);
        logAudit(request, 'SPONSOR_UPDATED', { sponsorId: id, fields: Object.keys(data ?? {}) });

        return new Response(JSON.stringify(sponsor), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return handleApiError(error, 'update sponsor', request);
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
        logAudit(request, 'SPONSOR_DELETED', { sponsorId: id });

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return handleApiError(error, 'delete sponsor', request);
    }
};
