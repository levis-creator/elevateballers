import type { APIRoute } from 'astro';
import {
  createMediaItem,
  getMediaLibrary,
  getPublicFeaturedMedia,
} from '../../../features/media/application';
import type { MediaType } from '../../../features/media/domain/entities';
import { requirePermission } from '../../../features/rbac/middleware';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;

const MEDIA_TYPES = new Set<MediaType>(['IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT']);

function parseMediaType(value: string | null): MediaType | undefined {
  if (!value) return undefined;
  const normalized = value.toUpperCase() as MediaType;
  return MEDIA_TYPES.has(normalized) ? normalized : undefined;
}

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const featured = url.searchParams.get('featured') === 'true';
    const type = parseMediaType(url.searchParams.get('type'));
    const folderId = url.searchParams.get('folderId') || undefined;
    const rawLimit = Number.parseInt(url.searchParams.get('limit') || '', 10);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : undefined;

    if (featured) {
      return Response.json(await getPublicFeaturedMedia(limit));
    }

    await requirePermission(request, 'media:read');
    return Response.json(await getMediaLibrary({ type, folderId }));
  } catch (error) {
    return handleApiError(error, 'fetch media', request);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    await requirePermission(request, 'media:create');
    const data = await request.json();
    const type = parseMediaType(data.type);

    if (!data.title || !data.url || !type) {
      return Response.json(
        { error: 'Title, URL, and a valid media type are required' },
        { status: 400 },
      );
    }

    const mediaItem = await createMediaItem({
      title: data.title,
      url: data.url,
      type,
      thumbnail: data.thumbnail,
      tags: Array.isArray(data.tags) ? data.tags : [],
    });

    return Response.json(mediaItem, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'create media', request);
  }
};
