import type { APIRoute } from 'astro';
import { requireAdmin } from '../../../features/cms/lib/auth';
import { prisma } from '../../../lib/prisma';

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
  } catch (error: any) {
    console.error('Error moving media:', error);
    return new Response(
      JSON.stringify({
        error: error.message === 'Unauthorized' || error.message.includes('Forbidden')
          ? 'Unauthorized'
          : error.message || 'Failed to move media',
      }),
      {
        status: error.message === 'Unauthorized' || error.message.includes('Forbidden') ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
