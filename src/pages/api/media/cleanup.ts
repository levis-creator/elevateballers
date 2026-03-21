import type { APIRoute } from 'astro';
import { requirePermission } from '../../../features/rbac/middleware';
import { prisma } from '../../../lib/prisma';
import { fileExists } from '../../../lib/file-storage';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;

/**
 * Cleanup endpoint to remove orphaned media records (records with filePath but missing files)
 * Admin only
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    await requirePermission(request, 'media:cleanup');

    // Get all media records with filePath
    const mediaWithFiles = await prisma.media.findMany({
      where: {
        filePath: { not: null },
      },
      select: {
        id: true,
        title: true,
        filePath: true,
      },
    });

    const orphanedIds: string[] = [];
    const errors: string[] = [];

    // Check each media record
    for (const media of mediaWithFiles) {
      if (!media.filePath) continue;

      try {
        const exists = await fileExists(media.filePath);
        if (!exists) {
          orphanedIds.push(media.id);
          console.log(`Found orphaned record: ${media.id} (${media.title}) - ${media.filePath}`);
        }
      } catch (error: any) {
        errors.push(`Error checking ${media.id}: ${error.message}`);
      }
    }

    // Delete orphaned records
    let deletedCount = 0;
    if (orphanedIds.length > 0) {
      const result = await prisma.media.deleteMany({
        where: {
          id: { in: orphanedIds },
        },
      });
      deletedCount = result.count;
    }

    return new Response(
      JSON.stringify({
        success: true,
        checked: mediaWithFiles.length,
        orphaned: orphanedIds.length,
        deleted: deletedCount,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return handleApiError(error, 'cleanup orphaned media', request);
  }
};
