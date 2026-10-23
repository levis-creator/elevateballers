/**
 * File Usage Tracking Utility
 * Tracks where files are referenced across the system
 */

import { prisma } from './prisma';
import type { FileUsageEntityType } from '@prisma/client';

/**
 * Find media record by URL
 * Handles both local file paths and external URLs
 */
export async function findMediaByUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  
  try {
    // Try exact match first
    let media = await prisma.media.findFirst({
      where: { url },
      select: { id: true },
    });
    
    if (media) return media.id;

    // Rich-text editors commonly append cache-busting query strings or
    // fragments to otherwise canonical media URLs.
    const canonicalUrl = url.split(/[?#]/, 1)[0];
    if (canonicalUrl !== url) {
      media = await prisma.media.findFirst({
        where: { url: canonicalUrl },
        select: { id: true },
      });

      if (media) return media.id;
    }
    
    // Try matching by filePath if URL is a local path
    if (url.startsWith('/uploads/') || url.startsWith('/api/uploads/')) {
      // Extract file path from URL
      const filePath = canonicalUrl.replace(/^\/api\/uploads\//, 'uploads/').replace(/^\//, '');
      media = await prisma.media.findFirst({
        where: { filePath },
        select: { id: true },
      });
      
      if (media) return media.id;
    }
    
    return null;
  } catch (error) {
    console.error('Error finding media by URL:', error);
    return null;
  }
}

/**
 * Track file usage for an entity field
 * Helper function that finds media by URL and tracks usage
 */
export async function trackFileUsageByUrl(
  url: string | null | undefined,
  entityType: FileUsageEntityType,
  entityId: string,
  fieldName: string
): Promise<void> {
  if (!url) return;
  
  const mediaId = await findMediaByUrl(url);
  if (mediaId) {
    await trackFileUsage(mediaId, entityType, entityId, fieldName);
  }
}

/**
 * Track file usage when a file is referenced by an entity
 * @param mediaId - Media record ID
 * @param entityType - Type of entity using the file
 * @param entityId - ID of the entity
 * @param fieldName - Field name where file is used (e.g., "image", "logo")
 */
export async function trackFileUsage(
  mediaId: string,
  entityType: FileUsageEntityType,
  entityId: string,
  fieldName: string
): Promise<void> {
  try {
    // Check if usage already exists
    const existing = await prisma.fileUsage.findFirst({
      where: {
        mediaId,
        entityType,
        entityId,
        fieldName,
      },
    });

    if (!existing) {
      await prisma.fileUsage.create({
        data: {
          mediaId,
          entityType,
          entityId,
          fieldName,
        },
      });
    }
  } catch (error) {
    console.error('Error tracking file usage:', error);
    // Don't throw - file usage tracking is non-critical
  }
}

/**
 * Get all usages of a media file
 */
export async function getFileUsage(mediaId: string) {
  try {
    return await prisma.fileUsage.findMany({
      where: { mediaId },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Error getting file usage:', error);
    return [];
  }
}

/**
 * Remove file usage records
 * @param mediaId - Media record ID
 * @param entityType - Optional: filter by entity type
 * @param entityId - Optional: filter by entity ID
 */
export async function removeFileUsage(
  mediaId: string,
  entityType?: FileUsageEntityType,
  entityId?: string
): Promise<void> {
  try {
    const where: any = { mediaId };
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;

    await prisma.fileUsage.deleteMany({
      where,
    });
  } catch (error) {
    console.error('Error removing file usage:', error);
    // Don't throw - cleanup is non-critical
  }
}

/**
 * Check if a file is in use (referenced elsewhere)
 */
export async function checkFileInUse(mediaId: string): Promise<boolean> {
  try {
    const count = await prisma.fileUsage.count({
      where: { mediaId },
    });
    return count > 0;
  } catch (error) {
    console.error('Error checking file usage:', error);
    return false;
  }
}

/**
 * Update file usage when an entity changes its file reference
 * @param oldUrl - Old file URL (if changed)
 * @param newUrl - New file URL
 * @param entityType - Type of entity
 * @param entityId - ID of entity
 * @param fieldName - Field name
 */
export async function updateFileUsageOnChange(
  oldUrl: string,
  newUrl: string,
  entityType: FileUsageEntityType,
  entityId: string,
  fieldName: string
): Promise<void> {
  try {
    // Find media record for old URL
    const oldMedia = await prisma.media.findFirst({
      where: { url: oldUrl },
      select: { id: true },
    });

    // Find media record for new URL
    const newMedia = await prisma.media.findFirst({
      where: { url: newUrl },
      select: { id: true },
    });

    // Remove old usage if old media exists
    if (oldMedia) {
      await removeFileUsage(oldMedia.id, entityType, entityId);
    }

    // Add new usage if new media exists
    if (newMedia) {
      await trackFileUsage(newMedia.id, entityType, entityId, fieldName);
    }
  } catch (error) {
    console.error('Error updating file usage:', error);
    // Don't throw - tracking is non-critical
  }
}

/**
 * Get usage summary for a media file
 * Returns grouped usage by entity type
 */
export async function getFileUsageSummary(mediaId: string) {
  try {
    const usages = await getFileUsage(mediaId);
    
    const summary: Record<string, Array<{ entityId: string; fieldName: string }>> = {};
    
    for (const usage of usages) {
      if (!summary[usage.entityType]) {
        summary[usage.entityType] = [];
      }
      summary[usage.entityType].push({
        entityId: usage.entityId,
        fieldName: usage.fieldName,
      });
    }
    
    return summary;
  } catch (error) {
    console.error('Error getting file usage summary:', error);
    return {};
  }
}

/**
 * Rebuild usage rows from the canonical URL fields on supported entities.
 * This repairs stale rows left by older mutation paths and keeps deletion
 * protection trustworthy.
 */
export async function reconcileFileUsage() {
  const [players, teams, staff, articles, leagues] = await Promise.all([
    prisma.player.findMany({ where: { image: { not: null } }, select: { id: true, image: true } }),
    prisma.team.findMany({ where: { logo: { not: null } }, select: { id: true, logo: true } }),
    prisma.staff.findMany({ where: { image: { not: null } }, select: { id: true, image: true } }),
    prisma.newsArticle.findMany({ select: { id: true, image: true, content: true } }),
    prisma.league.findMany({ where: { logo: { not: null } }, select: { id: true, logo: true } }),
  ]);

  const references: Array<{ url: string; entityType: FileUsageEntityType; entityId: string; fieldName: string }> = [];
  for (const row of players) if (row.image) references.push({ url: row.image, entityType: 'PLAYER', entityId: row.id, fieldName: 'image' });
  for (const row of teams) if (row.logo) references.push({ url: row.logo, entityType: 'TEAM', entityId: row.id, fieldName: 'logo' });
  for (const row of staff) if (row.image) references.push({ url: row.image, entityType: 'STAFF', entityId: row.id, fieldName: 'image' });
  for (const row of articles) {
    if (row.image) references.push({ url: row.image, entityType: 'NEWS_ARTICLE', entityId: row.id, fieldName: 'image' });
    const richTextUrls = [...String(row.content || '').matchAll(/(?:src|href)=["']([^"']+)["']/gi)].map((match) => match[1]);
    for (const url of new Set(richTextUrls)) references.push({ url, entityType: 'NEWS_ARTICLE', entityId: row.id, fieldName: 'content' });
  }
  for (const row of leagues) if (row.logo) references.push({ url: row.logo, entityType: 'LEAGUE', entityId: row.id, fieldName: 'logo' });

  const resolved = [];
  for (const reference of references) {
    const mediaId = await findMediaByUrl(reference.url);
    if (mediaId) resolved.push({ mediaId, entityType: reference.entityType, entityId: reference.entityId, fieldName: reference.fieldName });
  }

  await prisma.$transaction(async (tx) => {
    await tx.fileUsage.deleteMany({});
    if (resolved.length) await tx.fileUsage.createMany({ data: resolved });
  });

  return { references: resolved.length, scanned: references.length };
}
