import type { APIRoute } from 'astro';
import { requirePermission } from '../../../features/rbac/middleware';
import { prisma } from '../../../lib/prisma';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;

export const PUT: APIRoute = async ({ request }) => {
  try {
    await requireAdmin(request);
    const { mediaIds, folderId } = await request.json();

    if (!Array.isArray(mediaIds) || mediaIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No media IDs provided' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // If folderId is null or 'none', remove from folder
    const updateData: any = {
      folderId: folderId && folderId !== 'none' ? folderId : null,
    };

    // Update all media items
    const result = await prisma.media.updateMany({
      where: {
        id: { in: mediaIds },
      },
      data: updateData,
    });

    // Fetch updated media items
    const updatedMedia = await prisma.media.findMany({
      where: {
        id: { in: mediaIds },
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            isPrivate: true,
          },
        },
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        count: result.count,
        media: updatedMedia,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return handleApiError(error, 'move media', request);
  }
};
