import type { APIRoute } from 'astro';
import { requirePermission } from '../../../features/rbac/middleware';
import { prisma } from '../../../lib/prisma';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;

export const PUT: APIRoute = async ({ request }) => {
  try {
    await requireAdmin(request);
    const { mediaIds, featured } = await request.json();

    if (!Array.isArray(mediaIds) || mediaIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No media IDs provided' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (typeof featured !== 'boolean') {
      return new Response(
        JSON.stringify({ error: 'Featured status must be a boolean' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // First, verify the featured column exists
    try {
      const columnCheck = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_name = 'media' AND column_name = 'featured'`
      );
      
      if (columnCheck.length === 0) {
        console.error('[BATCH-FEATURED] Featured column does not exist in media table');
        return new Response(
          JSON.stringify({ 
            error: 'Featured column does not exist. Please run the migration: prisma/migrations/20260131000000_add_featured_to_media/migration.sql'
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    } catch (checkError: any) {
      console.error('[BATCH-FEATURED] Error checking for featured column:', checkError);
      // Continue anyway - might be a permissions issue
    }

    // Update all media items using raw SQL as workaround for Prisma Client sync issue
    // TODO: Switch back to Prisma updateMany once Prisma Client is regenerated
    const placeholders = mediaIds.map(() => '?').join(',');
    const featuredValue = featured ? 1 : 0; // MySQL uses 1/0 for boolean
    
    // Execute update - build SQL with all parameters in correct order
    const updateSql = `UPDATE media SET featured = ? WHERE id IN (${placeholders})`;
    const updateParams = [featuredValue, ...mediaIds];
    
    console.log('[BATCH-FEATURED] Updating media:', {
      mediaIds,
      featured,
      featuredValue,
      sql: updateSql,
      paramCount: updateParams.length,
    });
    
    const updateResult = await prisma.$executeRawUnsafe(updateSql, ...updateParams);
    
    console.log('[BATCH-FEATURED] Update completed, affected rows:', updateResult);
    
    // Verify the update worked by checking one of the updated records
    if (mediaIds.length > 0) {
      const verifyResult = await prisma.$queryRawUnsafe<Array<{ id: string; featured: number }>>(
        `SELECT id, featured FROM media WHERE id = ?`,
        mediaIds[0]
      );
      console.log('[BATCH-FEATURED] Verification check:', {
        mediaId: mediaIds[0],
        featuredValue: verifyResult[0]?.featured,
        expected: featuredValue,
      });
    }

    // Fetch updated media items using raw SQL to ensure we get the featured field
    const updatedMediaRaw = await prisma.$queryRawUnsafe<Array<{
      id: string;
      title: string;
      url: string;
      thumbnail: string | null;
      featured: number; // MySQL returns as number (0 or 1)
      folder_id: string | null;
      folder_name: string | null;
      folder_is_private: number | null;
      createdAt: Date;
      updatedAt: Date;
    }>>(
      `SELECT 
        m.id,
        m.title,
        m.url,
        m.thumbnail,
        m.featured,
        m.created_at as createdAt,
        m.updated_at as updatedAt,
        f.id as folder_id,
        f.name as folder_name,
        f.is_private as folder_is_private
       FROM media m
       LEFT JOIN folders f ON m.folder_id = f.id
       WHERE m.id IN (${placeholders})`,
      ...mediaIds
    );

    // Transform raw results to match expected format
    const updatedMedia = updatedMediaRaw.map((row) => ({
      id: row.id,
      title: row.title,
      url: row.url,
      thumbnail: row.thumbnail,
      featured: Boolean(row.featured), // Convert MySQL number to boolean
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      folder: row.folder_id ? {
        id: row.folder_id,
        name: row.folder_name || '',
        isPrivate: Boolean(row.folder_is_private),
      } : null,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        count: mediaIds.length,
        media: updatedMedia,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return handleApiError(error, 'update featured status', request);
  }
};
