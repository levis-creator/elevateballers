import type { APIRoute } from 'astro';
import { requireAdmin } from '../../../features/cms/lib/auth';
import { getFolderById } from '../../../features/cms/lib/queries';
import { updateFolder, deleteFolder } from '../../../features/cms/lib/mutations';

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
    console.error('Error fetching folder:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch folder' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * PUT /api/folders/[id]
 * Update a folder (admin only)
 */
export const PUT: APIRoute = async ({ params, request }) => {
  try {
    await requireAdmin(request);
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
  } catch (error: any) {
    console.error('Error updating folder:', error);
    
    // Handle unique constraint violation
    if (error.code === 'P2002' || error.message?.includes('Unique constraint')) {
      return new Response(
        JSON.stringify({ error: 'A folder with this name already exists' }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        error: error.message === 'Unauthorized' || error.message.includes('Forbidden') 
          ? 'Unauthorized' 
          : error.message || 'Failed to update folder' 
      }),
      {
        status: error.message === 'Unauthorized' || error.message.includes('Forbidden') ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * DELETE /api/folders/[id]
 * Delete a folder (admin only)
 * Note: This will set folderId to null on all media in this folder
 */
export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    await requireAdmin(request);
    const success = await deleteFolder(params.id!);

    if (!success) {
      return new Response(JSON.stringify({ error: 'Failed to delete folder' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(null, { status: 204 });
  } catch (error: any) {
    console.error('Error deleting folder:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to delete folder' }),
      {
        status: error.message === 'Unauthorized' || error.message.includes('Forbidden') ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
