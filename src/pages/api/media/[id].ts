import type { APIRoute } from 'astro';
import { getMediaItem, updateMediaItem } from '../../../features/media/application';
import { deleteMedia } from '../../../features/cms/lib/mutations';
import { requirePermission } from '../../../features/rbac/middleware';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'media:read');
    const mediaItem = await getMediaItem(params.id!);

    if (!mediaItem) {
      return new Response(JSON.stringify({ error: 'Media not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(mediaItem), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'fetch media', request);
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'media:update');
    const data = await request.json();

    const mediaItem = await updateMediaItem(params.id!, data);

    if (!mediaItem) {
      return new Response(JSON.stringify({ error: 'Media not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(mediaItem), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'update media', request);
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'media:update');
    const success = await deleteMedia(params.id!);

    if (!success) {
      return new Response(JSON.stringify({ error: 'Failed to delete media' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error, 'delete media', request);
  }
};

