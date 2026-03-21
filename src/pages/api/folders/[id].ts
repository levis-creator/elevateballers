import type { APIRoute } from 'astro';
import { requirePermission } from '../../../features/rbac/middleware';
import { getFolderById } from '../../../features/cms/lib/queries';
import { updateFolder, deleteFolder } from '../../../features/cms/lib/mutations';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;

/**
 * GET /api/folders/[id]
 * Get a single folder by ID
 */
export const GET: APIRoute = async ({ params }) => {
  try {
    const folder = await getFolderById(params.id!);

    if (!folder) {
      return new Response(JSON.stringify({ error: 'Folder not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(folder), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'fetch folder', request);
  }
};

/**
 * PUT /api/folders/[id]
 * Update a folder (admin only)
 */
export const PUT: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'folders:update');
    const data = await request.json();

    const folder = await updateFolder(params.id!, data);

    if (!folder) {
      return new Response(JSON.stringify({ error: 'Folder not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(folder), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'update folder', request);
  }
};

/**
 * DELETE /api/folders/[id]
 * Delete a folder (admin only)
 * Note: This will set folderId to null on all media in this folder
 */
export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'folders:update');
    const success = await deleteFolder(params.id!);

    if (!success) {
      return new Response(JSON.stringify({ error: 'Failed to delete folder' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error, 'delete folder', request);
  }
};
