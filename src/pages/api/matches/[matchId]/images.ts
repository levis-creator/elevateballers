import type { APIRoute } from 'astro';
import { prisma } from '../../../../lib/prisma';
import { handleApiError } from '../../../../lib/apiError';

export const prerender = false;

/**
 * GET /api/matches/[matchId]/images
 * Fetch all images for a specific match
 */
export const GET: APIRoute = async ({ params, request }) => {
  try {
    // Public read access - match images are visible to all visitors
    const matchId = params.matchId;
    if (!matchId) {
      return new Response(
        JSON.stringify({ error: 'Match ID is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get pagination parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '12', 10);
    const skip = (page - 1) * limit;

    // Get the matches folder
    const matchesFolder = await prisma.folder.findUnique({
      where: { name: 'matches' },
    });

    if (!matchesFolder) {
      return new Response(JSON.stringify({ images: [], total: 0, page: 1, limit, totalPages: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Find all images in the matches folder that are tagged with this match ID
    const matchTag = `match:${matchId}`;

    // Get all images in matches folder first, then filter by tag in JavaScript
    const allImages = await prisma.media.findMany({
      where: {
        folderId: matchesFolder.id,
        type: 'IMAGE',
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        url: true,
        title: true,
        thumbnail: true,
        createdAt: true,
        tags: true,
      },
    });

    // Filter images that have the match tag
    const filteredImages = allImages.filter((image) => {
      if (!image.tags || !Array.isArray(image.tags)) return false;
      return image.tags.includes(matchTag);
    });

    const total = filteredImages.length;
    const totalPages = Math.ceil(total / limit);

    // Apply pagination
    const paginatedImages = filteredImages.slice(skip, skip + limit).map(({ tags, ...rest }) => rest);

    return new Response(JSON.stringify({
      images: paginatedImages,
      total,
      page,
      limit,
      totalPages,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'fetch match images', request);
  }
};
