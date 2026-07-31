import type { APIRoute } from 'astro';
import {
  createMediaItem,
  getMediaLibraryPage,
  getMediaLibrary,
  getPublicFeaturedMedia,
} from '../../../features/media/application';
import type { MediaLibraryQuery, MediaType } from '../../../features/media/domain/entities';
import { requirePermission } from '../../../features/rbac/middleware';
import { handleApiError } from '../../../lib/apiError';
import { getFileUrl } from '../../../lib/file-storage';
import { prisma } from '../../../lib/prisma';
import { moveR2Object, r2Configured, toR2Key } from '../../../lib/r2';

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
    const pageParam = url.searchParams.get('page');
    const storage =
      url.searchParams.get('storage') === 'supabase' || url.searchParams.get('storage') === 'r2'
        ? (url.searchParams.get('storage') as 'supabase' | 'r2')
        : undefined;
    const rawLimit = Number.parseInt(url.searchParams.get('limit') || '', 10);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : undefined;

    if (featured) {
      return Response.json(await getPublicFeaturedMedia(limit));
    }

    await requirePermission(request, 'media:read');
    if (pageParam) {
      const query: MediaLibraryQuery = {
        type,
        folderId,
        storage,
        q: url.searchParams.get('q') || undefined,
        sort: ['createdAt', 'name', 'size', 'type'].includes(url.searchParams.get('sort') || '')
          ? (url.searchParams.get('sort') as MediaLibraryQuery['sort'])
          : undefined,
        dir: url.searchParams.get('dir') === 'asc' ? 'asc' : 'desc',
        page: Number.parseInt(pageParam, 10) || 1,
        limit: Math.min(
          Math.max(Number.parseInt(url.searchParams.get('limit') || '24', 10) || 24, 1),
          100
        ),
      };
      return Response.json(await getMediaLibraryPage(query));
    }
    return Response.json(await getMediaLibrary({ type, folderId }));
  } catch (error) {
    return handleApiError(error, 'fetch media', request);
  }
};

export const PATCH: APIRoute = async ({ request }) => {
  try {
    await requirePermission(request, 'media:update');
    const body = await request.json();
    if (!Array.isArray(body.ids) || body.ids.length === 0)
      return Response.json({ error: 'ids are required' }, { status: 400 });
    if (body.action === 'move') {
      if (typeof body.folderId !== 'string' || !body.folderId)
        return Response.json({ error: 'A destination folder is required' }, { status: 400 });
      const target = await prisma.folder.findUnique({ where: { id: body.folderId } });
      if (!target) return Response.json({ error: 'Destination folder not found' }, { status: 404 });
      const media = await prisma.media.findMany({
        where: { id: { in: body.ids } },
        select: { id: true, filePath: true, url: true },
      });
      for (const item of media) {
        let filePath = item.filePath;
        if (r2Configured && filePath && !item.url.includes('supabase')) {
          const fileName = filePath.split('/').pop();
          if (fileName) {
            const nextPath = `uploads/${target.path}/${fileName}`;
            await moveR2Object(toR2Key(filePath), toR2Key(nextPath));
            filePath = nextPath;
          }
        }
        await prisma.media.update({
          where: { id: item.id },
          data: {
            folderId: target.id,
            ...(filePath ? { filePath, url: getFileUrl(filePath, target.isPrivate) } : {}),
          },
        });
      }
    } else if (body.action === 'tag') {
      await (
        await import('../../../lib/prisma')
      ).prisma.media.updateMany({
        where: { id: { in: body.ids } },
        data: { tags: Array.isArray(body.tags) ? body.tags : [] },
      });
    } else if (body.action === 'feature') {
      await (
        await import('../../../lib/prisma')
      ).prisma.$executeRawUnsafe(
        `UPDATE media SET featured = ? WHERE id IN (${body.ids.map(() => '?').join(',')})`,
        body.featured ? 1 : 0,
        ...body.ids
      );
    } else return Response.json({ error: 'Unsupported bulk action' }, { status: 400 });
    return Response.json({ success: true });
  } catch (error) {
    return handleApiError(error, 'bulk update media', request);
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
        { status: 400 }
      );
    }

    const mediaItem = await createMediaItem({
      title: data.title,
      url: data.url,
      type,
      thumbnail: data.thumbnail,
      tags: Array.isArray(data.tags) ? data.tags : [],
      folderId: typeof data.folderId === 'string' ? data.folderId : undefined,
      featured: data.featured === true,
    });

    return Response.json(mediaItem, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'create media', request);
  }
};
