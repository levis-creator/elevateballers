import type { APIRoute } from 'astro';
import { getMedia, getFeaturedMedia } from '../../../features/cms/lib/queries';
import { createMedia } from '../../../features/cms/lib/mutations';
import { requireAdmin } from '../../../features/cms/lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || undefined;
    const folderId = url.searchParams.get('folderId') || undefined;
    const featured = url.searchParams.get('featured') === 'true';
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    // Get media with optional filters
    let mediaItems;
    
    // Featured media endpoint - public access, only returns featured media
    if (featured) {
      mediaItems = await getFeaturedMedia(limit);
    } else if (folderId) {
      // Filter by folder - use raw SQL to ensure featured field is included
      const { prisma } = await import('../../../lib/prisma');
      const typeCondition = type ? `AND m.type = ?` : '';
      const typeParam = type ? [type.toUpperCase()] : [];
      
      try {
        const rawMedia = await prisma.$queryRawUnsafe<any[]>(
          `SELECT 
            m.id, m.title, m.url, m.type, m.thumbnail, m.tags, m.size, m.file_path as filePath,
            m.folder_id as folderId, m.uploaded_by as uploaderId, m.created_at as createdAt, m.updated_at as updatedAt,
            COALESCE(m.featured, 0) as featured,
            f.id as folder_id, f.name as folder_name, f.is_private as folder_isPrivate,
            u.id as uploader_id, u.name as uploader_name, u.email as uploader_email
          FROM media m
          LEFT JOIN folders f ON m.folder_id = f.id
          LEFT JOIN users u ON m.uploaded_by = u.id
          WHERE m.folder_id = ? ${typeCondition}
          ORDER BY m.created_at DESC`,
          folderId,
          ...typeParam
        );
        
        // Transform raw SQL results to match expected format
        mediaItems = rawMedia.map((row: any) => ({
          id: row.id,
          title: row.title,
          url: row.url,
          type: row.type,
          thumbnail: row.thumbnail,
          tags: row.tags,
          size: row.size ? Number(row.size) : null,
          filePath: row.filePath,
          folderId: row.folderId,
          uploaderId: row.uploaderId,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          featured: Boolean(row.featured),
          folder: row.folder_id ? {
            id: row.folder_id,
            name: row.folder_name,
            isPrivate: Boolean(row.folder_isPrivate),
          } : null,
          uploader: row.uploader_id ? {
            id: row.uploader_id,
            name: row.uploader_name,
            email: row.uploader_email,
          } : null,
        }));
      } catch (error: any) {
        // Fallback if folders table doesn't exist - query without folder join
        if (error.code === 'P2010' || error.message?.includes("doesn't exist")) {
          const rawMedia = await prisma.$queryRawUnsafe<any[]>(
            `SELECT 
              m.id, m.title, m.url, m.type, m.thumbnail, m.tags, m.size, m.file_path as filePath,
              m.folder_id as folderId, m.uploaded_by as uploaderId, m.created_at as createdAt, m.updated_at as updatedAt,
              COALESCE(m.featured, 0) as featured,
              u.id as uploader_id, u.name as uploader_name, u.email as uploader_email
            FROM media m
            LEFT JOIN users u ON m.uploaded_by = u.id
            WHERE m.folder_id = ? ${typeCondition}
            ORDER BY m.created_at DESC`,
            folderId,
            ...typeParam
          );
          
          mediaItems = rawMedia.map((row: any) => ({
            id: row.id,
            title: row.title,
            url: row.url,
            type: row.type,
            thumbnail: row.thumbnail,
            tags: row.tags,
            size: row.size ? Number(row.size) : null,
            filePath: row.filePath,
            folderId: row.folderId,
            uploaderId: row.uploaderId,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            featured: Boolean(row.featured),
            folder: null,
            uploader: row.uploader_id ? {
              id: row.uploader_id,
              name: row.uploader_name,
              email: row.uploader_email,
            } : null,
          }));
        } else {
          throw error;
        }
      }
    } else {
      // Use getMedia but ensure featured is included via raw SQL fallback
      const { prisma } = await import('../../../lib/prisma');
      const typeCondition = type ? `WHERE m.type = ?` : '';
      const typeParam = type ? [type.toUpperCase()] : [];
      
      try {
        const rawMedia = await prisma.$queryRawUnsafe<any[]>(
          `SELECT 
            m.id, m.title, m.url, m.type, m.thumbnail, m.tags, m.size, m.file_path as filePath,
            m.folder_id as folderId, m.uploaded_by as uploaderId, m.created_at as createdAt, m.updated_at as updatedAt,
            COALESCE(m.featured, 0) as featured,
            f.id as folder_id, f.name as folder_name, f.is_private as folder_isPrivate,
            u.id as uploader_id, u.name as uploader_name, u.email as uploader_email
          FROM media m
          LEFT JOIN folders f ON m.folder_id = f.id
          LEFT JOIN users u ON m.uploaded_by = u.id
          ${typeCondition}
          ORDER BY m.created_at DESC`,
          ...typeParam
        );
        
        // Transform raw SQL results to match expected format
        mediaItems = rawMedia.map((row: any) => ({
          id: row.id,
          title: row.title,
          url: row.url,
          type: row.type,
          thumbnail: row.thumbnail,
          tags: row.tags,
          size: row.size ? Number(row.size) : null,
          filePath: row.filePath,
          folderId: row.folderId,
          uploaderId: row.uploaderId,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          featured: Boolean(row.featured),
          folder: row.folder_id ? {
            id: row.folder_id,
            name: row.folder_name,
            isPrivate: Boolean(row.folder_isPrivate),
          } : null,
          uploader: row.uploader_id ? {
            id: row.uploader_id,
            name: row.uploader_name,
            email: row.uploader_email,
          } : null,
        }));
      } catch (error: any) {
        // Fallback if folders table doesn't exist - query without folder join
        if (error.code === 'P2010' || error.message?.includes("doesn't exist")) {
          const rawMedia = await prisma.$queryRawUnsafe<any[]>(
            `SELECT 
              m.id, m.title, m.url, m.type, m.thumbnail, m.tags, m.size, m.file_path as filePath,
              m.folder_id as folderId, m.uploaded_by as uploaderId, m.created_at as createdAt, m.updated_at as updatedAt,
              COALESCE(m.featured, 0) as featured,
              u.id as uploader_id, u.name as uploader_name, u.email as uploader_email
            FROM media m
            LEFT JOIN users u ON m.uploaded_by = u.id
            ${typeCondition}
            ORDER BY m.created_at DESC`,
            ...typeParam
          );
          
          mediaItems = rawMedia.map((row: any) => ({
            id: row.id,
            title: row.title,
            url: row.url,
            type: row.type,
            thumbnail: row.thumbnail,
            tags: row.tags,
            size: row.size ? Number(row.size) : null,
            filePath: row.filePath,
            folderId: row.folderId,
            uploaderId: row.uploaderId,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            featured: Boolean(row.featured),
            folder: null,
            uploader: row.uploader_id ? {
              id: row.uploader_id,
              name: row.uploader_name,
              email: row.uploader_email,
            } : null,
          }));
        } else {
          throw error;
        }
      }
    }

    // Deduplicate media items by ID, filePath, and URL to prevent duplicates
    // First deduplicate by ID (in case of duplicate IDs)
    const uniqueById = Array.from(
      new Map(mediaItems.map((item: any) => [item.id, item])).values()
    );
    
    // Sort by createdAt (oldest first) so we keep the oldest record when deduplicating
    const sortedByDate = uniqueById.sort((a: any, b: any) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    // Helper function to normalize URLs (remove query params, fragments, trailing slashes)
    const normalizeUrl = (url: string): string => {
      try {
        // Remove trailing slashes
        let normalized = url.trim().toLowerCase().replace(/\/+$/, '');
        // Remove query parameters and fragments for comparison
        const urlObj = new URL(normalized.startsWith('http') ? normalized : `http://example.com${normalized}`);
        return urlObj.pathname.toLowerCase();
      } catch {
        // If URL parsing fails, just normalize the string
        return url.trim().toLowerCase().replace(/\/+$/, '');
      }
    };
    
    // Deduplicate by filePath first (most reliable for local files), then by URL
    const seenFilePaths = new Set<string>();
    const seenUrls = new Set<string>();
    const seenCompositeKeys = new Set<string>(); // filePath + URL combination
    const uniqueByFilePath: any[] = [];
    
    for (const item of sortedByDate) {
      // Create normalized keys for deduplication
      const filePathKey = item.filePath ? item.filePath.trim().toLowerCase() : null;
      const urlKey = item.url ? normalizeUrl(item.url) : null;
      
      // Create composite key (filePath + URL) for more aggressive deduplication
      const compositeKey = [filePathKey || '', urlKey || ''].filter(Boolean).join('|||');
      
      // Priority 1: Skip if we've already seen this exact filePath+URL combination
      if (compositeKey && seenCompositeKeys.has(compositeKey)) {
        console.log(`[DEDUP] Skipping duplicate by composite key: ${item.id} (${item.title}) - filePath: ${item.filePath}, URL: ${item.url}`);
        continue;
      }
      
      // Priority 2: Skip if we've already seen this filePath (most reliable for local files)
      if (filePathKey && seenFilePaths.has(filePathKey)) {
        console.log(`[DEDUP] Skipping duplicate by filePath: ${item.id} (${item.title}) - filePath: ${item.filePath}`);
        continue;
      }
      
      // Priority 3: Skip if we've already seen this URL (for external URLs or when filePath is null)
      if (urlKey && seenUrls.has(urlKey)) {
        // Only skip if this item doesn't have a filePath (external URL)
        if (!filePathKey) {
          console.log(`[DEDUP] Skipping duplicate by URL: ${item.id} (${item.title}) - URL: ${item.url}`);
          continue;
        }
      }
      
      // Mark as seen
      if (filePathKey) {
        seenFilePaths.add(filePathKey);
      }
      if (urlKey) {
        seenUrls.add(urlKey);
      }
      if (compositeKey) {
        seenCompositeKeys.add(compositeKey);
      }
      
      uniqueByFilePath.push(item);
    }

    // Filter out orphaned media records (those with filePath but missing files)
    const { fileExists } = await import('../../../lib/file-storage');
    const validMediaItems: any[] = [];
    const orphanedIds: string[] = [];

    for (const item of uniqueByFilePath) {
      // If item has a filePath, check if the file actually exists
      if (item.filePath) {
        try {
          const exists = await fileExists(item.filePath);
          if (!exists) {
            // File doesn't exist - this is an orphaned record
            console.warn(`Orphaned media record found: ${item.id} (${item.title}) - file missing: ${item.filePath}`);
            orphanedIds.push(item.id);
            continue; // Skip this item
          }
        } catch (error) {
          // If file check fails, log but don't include the item
          console.error(`Error checking file existence for ${item.id}:`, error);
          orphanedIds.push(item.id);
          continue;
        }
      }
      // If no filePath (external URL) or file exists, keep it
      validMediaItems.push(item);
    }

    // Clean up orphaned records synchronously (immediately)
    if (orphanedIds.length > 0) {
      try {
        const { prisma } = await import('../../../lib/prisma');
        const deleteResult = await prisma.media.deleteMany({
          where: { id: { in: orphanedIds } }
        });
        console.log(`[CLEANUP] Deleted ${deleteResult.count} orphaned media record(s)`);
      } catch (error) {
        console.error('Error cleaning up orphaned media records:', error);
        // Don't fail the request - just log the error
      }
    }

    // Final deduplication check by ID (safety measure)
    const finalUnique = Array.from(
      new Map(validMediaItems.map((item: any) => [item.id, item])).values()
    );

    console.log(`[MEDIA API] Summary: ${mediaItems.length} total → ${uniqueById.length} after ID dedup → ${uniqueByFilePath.length} after filePath/URL dedup → ${validMediaItems.length} after file check → ${finalUnique.length} final unique`);

    return new Response(JSON.stringify(finalUnique), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching media:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch media' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    await requireAdmin(request);
    const data = await request.json();

    // Validate required fields
    if (!data.title || !data.url || !data.type) {
      return new Response(
        JSON.stringify({ error: 'Title, URL, and type are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const mediaItem = await createMedia({
      title: data.title,
      url: data.url,
      type: data.type,
      thumbnail: data.thumbnail,
      tags: data.tags || [],
    });

    return new Response(JSON.stringify(mediaItem), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error creating media:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create media' }),
      {
        status: error.message === 'Unauthorized' || error.message.includes('Forbidden') ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

