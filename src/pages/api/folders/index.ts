import type { APIRoute } from 'astro';
import { requireAdmin, getCurrentUser } from '../../../features/cms/lib/auth';
import { getFolders } from '../../../features/cms/lib/queries';
import { createFolder } from '../../../features/cms/lib/mutations';
import { initializeDefaultFolders } from '../../../lib/folder-init';
import { requirePermission } from '../../../features/rbac/middleware';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;

/**
 * GET /api/folders
 * Get all folders (public folders for everyone, all folders for admins)
 * Automatically initializes default folders if they don't exist
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    // Initialize default folders before fetching
    await initializeDefaultFolders();

    const url = new URL(request.url);
    const includePrivate = url.searchParams.get('includePrivate') === 'true';
    
    // Check if user is admin (for private folders)
    let isAdmin = false;
    try {
      await requirePermission(request, 'folders:create');
      isAdmin = true;
    } catch {
      // Not an admin, only show public folders
      isAdmin = false;
    }

    const folders = await getFolders(isAdmin && includePrivate);

    return new Response(JSON.stringify(folders), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'fetch folders', request);
  }
};

/**
 * POST /api/folders
 * Create a new folder (admin only)
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const user = await requirePermission(request, 'folders:create');
    const data = await request.json();

    // Validate required fields
    if (!data.name) {
      return new Response(
        JSON.stringify({ error: 'Folder name is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const folder = await createFolder(
      {
        name: data.name,
        description: data.description,
        isPrivate: data.isPrivate || false,
      },
      user.id
    );

    return new Response(JSON.stringify(folder), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'create folder', request);
  }
};
