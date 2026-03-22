import type { APIRoute } from 'astro';
import { getMediaById } from '../../../features/media/lib/queries/media';
import { updateMedia, deleteMedia } from '../../../features/media/lib/mutations/media';
import { requirePermission } from '../../../features/rbac/domain/usecases/middleware';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  try {
    const mediaItem = await getMediaById(params.id!);

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

    const mediaItem = await updateMedia(params.id!, data);

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

