import type { APIRoute } from 'astro';
import { getMediaLibraryStats } from '../../../features/media/application';
import type { MediaType } from '../../../features/media/domain/entities';
import { requirePermission } from '../../../features/rbac/middleware';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    await requirePermission(request, 'media:read');
    const url = new URL(request.url);
    const type = url.searchParams.get('type')?.toUpperCase() as MediaType | undefined;
    const storage = url.searchParams.get('storage') as 'r2' | 'supabase' | undefined;
    return Response.json(
      await getMediaLibraryStats({
        type,
        storage,
        folderId: url.searchParams.get('folderId') || undefined,
        q: url.searchParams.get('q') || undefined,
      })
    );
  } catch (error) {
    return handleApiError(error, 'fetch media stats', request);
  }
};
