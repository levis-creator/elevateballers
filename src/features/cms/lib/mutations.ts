import { prisma } from '../../../lib/prisma';
import { generateSlug } from './utils';
import { getEnvBoolean } from '../../../lib/env';
import type {
  CreateNewsArticleInput,
  UpdateNewsArticleInput,
  NewsArticleWithAuthor,
  CreateMatchInput,
  UpdateMatchInput,
  CreatePlayerInput,
  UpdatePlayerInput,
  CreateTeamInput,
  UpdateTeamInput,
  CreateStaffInput,
  UpdateStaffInput,
  CreateTeamStaffInput,
  UpdateTeamStaffInput,
  CreateMediaInput,
  UpdateMediaInput,
  CreatePageContentInput,
  UpdatePageContentInput,
  CreateSiteSettingInput,
  UpdateSiteSettingInput,
  CreateCommentInput,
  UpdateCommentInput,
  CreateLeagueInput,
  UpdateLeagueInput,
  CreateSeasonInput,
  UpdateSeasonInput,
  CreateMatchPlayerInput,
  UpdateMatchPlayerInput,
  CreateMatchEventInput,
  UpdateMatchEventInput,
  CreateFolderInput,
  UpdateFolderInput,
  Match,
  Player,
  Team,
  Staff,
  TeamStaff,
  Media,
  MediaWithFolderAndUploader,
  PageContent,
  SiteSetting,
  Comment,
  League,
  Season,
  MatchPlayer,
  MatchEvent,
  Folder,
} from '../types';

/**
 * Helper function to manage featured articles limit
 * If there are already 5 featured articles, unfeatures the oldest one
 * @param excludeArticleId - Article ID to exclude from the count (for updates)
 */
async function manageFeaturedLimit(excludeArticleId?: string): Promise<void> {
  const MAX_FEATURED = 5;

  // Count featured articles, excluding the current one if updating
  const whereClause: any = {
    published: true,
    feature: true,
  };

  if (excludeArticleId) {
    whereClause.id = { not: excludeArticleId };
  }

  const featuredCount = await prisma.newsArticle.count({
    where: whereClause,
  });

  // If we're at or over the limit, unfeature the oldest one
  if (featuredCount >= MAX_FEATURED) {
    // Find the oldest featured article (excluding the current one if updating)
    // Get all featured articles and sort them to find the oldest
    const allFeatured = await prisma.newsArticle.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        publishedAt: true,
        createdAt: true,
      },
    });

    // Sort by publishedAt (oldest first), with nulls last, then by createdAt
    const sortedFeatured = allFeatured.sort((a, b) => {
      // If both have publishedAt, compare them
      if (a.publishedAt && b.publishedAt) {
        return a.publishedAt.getTime() - b.publishedAt.getTime();
      }
      // If only a has publishedAt, a comes first
      if (a.publishedAt && !b.publishedAt) {
        return -1;
      }
      // If only b has publishedAt, b comes first
      if (!a.publishedAt && b.publishedAt) {
        return 1;
      }
      // Both null, use createdAt
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    const oldestFeatured = sortedFeatured[0];

    if (oldestFeatured) {
      // Unfeature the oldest article
      await prisma.newsArticle.update({
        where: { id: oldestFeatured.id },
        data: { feature: false },
      });

      console.log(`Automatically unfeatured oldest article: "${oldestFeatured.title}" (ID: ${oldestFeatured.id})`);
    }
  }
}

/**
 * Create a new news article
 */
export async function createNewsArticle(
  data: CreateNewsArticleInput
): Promise<NewsArticleWithAuthor> {
  // If this article is being featured, manage the featured limit
  if (data.feature === true && data.published === true) {
    await manageFeaturedLimit();
  }

  const article = await prisma.newsArticle.create({
    data: {
      ...data,
      publishedAt: data.published ? (data.publishedAt || new Date()) : null,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // Track file usage if image is provided
  if (article.image) {
    try {
      const { trackFileUsageByUrl } = await import('../../../lib/file-usage');
      await trackFileUsageByUrl(article.image, 'NEWS_ARTICLE', article.id, 'image');
    } catch (error) {
      // Non-critical - continue even if tracking fails
      console.warn('Failed to track file usage for news article image:', error);
    }
  }

  return article as NewsArticleWithAuthor;
}

/**
 * Update an existing news article
 */
export async function updateNewsArticle(
  id: string,
  data: UpdateNewsArticleInput
): Promise<NewsArticleWithAuthor | null> {
  // Handle publishedAt logic
  const updateData: any = { ...data };

  if (data.published === true) {
    // If publishing, set publishedAt if not already set
    updateData.publishedAt = data.publishedAt || new Date();
  } else if (data.published === false) {
    // If unpublishing, clear publishedAt
    updateData.publishedAt = null;
  }

  // If this article is being featured and published, manage the featured limit
  // Check if feature is being set to true and article is/will be published
  const willBeFeatured = data.feature === true;
  const willBePublished = data.published === true || (data.published === undefined);

  // Get current article state to check if it's already published
  const currentArticle = await prisma.newsArticle.findUnique({
    where: { id },
    select: { published: true, feature: true },
  });

  const isCurrentlyPublished = currentArticle?.published ?? false;
  const isCurrentlyFeatured = currentArticle?.feature ?? false;

  // Only manage limit if:
  // 1. Feature is being set to true AND
  // 2. Article is/will be published AND
  // 3. Article wasn't already featured (to avoid unnecessary operations)
  if (willBeFeatured && (willBePublished || isCurrentlyPublished) && !isCurrentlyFeatured) {
    await manageFeaturedLimit(id);
  }

  // Get existing article to check for image changes
  const existing = await prisma.newsArticle.findUnique({
    where: { id },
    select: { image: true },
  });

  const article = await prisma.newsArticle.update({
    where: { id },
    data: updateData,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // Track file usage if image changed
  if (data.image !== undefined && data.image !== existing?.image) {
    try {
      const { updateFileUsageOnChange } = await import('../../../lib/file-usage');
      const oldUrl = existing?.image || '';
      const newUrl = data.image || '';
      await updateFileUsageOnChange(oldUrl, newUrl, 'NEWS_ARTICLE', id, 'image');
    } catch (error) {
      // Non-critical - continue even if tracking fails
      console.warn('Failed to track file usage for news article image update:', error);
    }
  }

  return article as NewsArticleWithAuthor;
}

/**
 * Delete a news article
 */
export async function deleteNewsArticle(id: string): Promise<boolean> {
  try {
    await prisma.newsArticle.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    console.error('Error deleting news article:', error);
    return false;
  }
}

// Re-export generateSlug for backward compatibility (server-side only)
export { generateSlug } from './utils';

/**
 * Generate a unique slug from a name
 * If the slug already exists, appends a number to make it unique
 */
async function generateUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let slug = generateSlug(baseSlug);
  let counter = 1;
  const originalSlug = slug;

  while (true) {
    const whereClause: any = { slug };
    if (excludeId) {
      whereClause.id = { not: excludeId };
    }

    const existing = await prisma.team.findFirst({
      where: whereClause,
    });

    if (!existing) {
      return slug;
    }

    slug = `${originalSlug}-${counter}`;
    counter++;
  }
}

/**
 * Create a new team
 */
export async function createTeam(data: CreateTeamInput): Promise<Team> {
  // Generate slug from name if not provided
  const slug = data.slug || await generateUniqueSlug(data.name);

  const team = await prisma.team.create({
    data: {
      ...data,
      slug,
      approved: data.approved ?? true, // Default to true for admin-created teams
    },
  });

  // Track file usage if logo is provided
  if (team.logo) {
    try {
      const { trackFileUsageByUrl } = await import('../../../lib/file-usage');
      await trackFileUsageByUrl(team.logo, 'TEAM', team.id, 'logo');
    } catch (error) {
      // Non-critical - continue even if tracking fails
      console.warn('Failed to track file usage for team logo:', error);
    }
  }

  return team;
}

/**
 * Update an existing team
 */
export async function updateTeam(id: string, data: UpdateTeamInput): Promise<Team | null> {
  try {
    // Get existing team to check for logo changes
    const existing = await prisma.team.findUnique({
      where: { id },
      select: { logo: true },
    });

    const updateData: any = { ...data };

    // If name is being updated and slug is not provided, regenerate slug
    if (data.name && !data.slug) {
      updateData.slug = await generateUniqueSlug(data.name, id);
    } else if (data.slug) {
      // If slug is provided, ensure it's unique
      updateData.slug = await generateUniqueSlug(data.slug, id);
    }

    const team = await prisma.team.update({
      where: { id },
      data: updateData,
    });

    // Track file usage if logo changed
    if (data.logo !== undefined && data.logo !== existing?.logo) {
      try {
        const { updateFileUsageOnChange } = await import('../../../lib/file-usage');
        const oldUrl = existing?.logo || '';
        const newUrl = data.logo || '';
        await updateFileUsageOnChange(oldUrl, newUrl, 'TEAM', id, 'logo');
      } catch (error) {
        // Non-critical - continue even if tracking fails
        console.warn('Failed to track file usage for team logo update:', error);
      }
    }

    return team;
  } catch (error) {
    console.error('Error updating team:', error);
    return null;
  }
}
export async function createMatch(data: CreateMatchInput): Promise<Match> {
  // Validate that a team is not matched against itself
  // Only check if both teams have actual IDs (not null/TBD)
  if (data.team1Id && data.team2Id && data.team1Id === data.team2Id) {
    throw new Error('A team cannot be matched against itself');
  }

  // Also check by name if IDs are not provided, but allow TBD matches (both teams null)
  // TBD matches are valid for bracket generation where teams will be filled in later
  if (!data.team1Id && !data.team2Id && data.team1Name && data.team2Name &&
    data.team1Name === data.team2Name &&
    data.team1Name !== 'TBD' && data.team2Name !== 'TBD' &&
    data.team1Name !== 'BYE' && data.team2Name !== 'BYE') {
    throw new Error('A team cannot be matched against itself');
  }

  const matchData: any = {
    date: new Date(data.date),
    team1Score: data.team1Score,
    team2Score: data.team2Score,
    status: data.status || 'UPCOMING',
  };

  // Only include stage if it has a valid value
  if (data.stage && data.stage.trim() !== '') {
    matchData.stage = data.stage;
  }

  // Use league ID if provided, otherwise use fallback field
  // Use relation connect syntax to ensure compatibility
  if (data.leagueId) {
    matchData.league = { connect: { id: data.leagueId } };
  } else {
    matchData.leagueName = data.league || '';
  }

  // Use season ID if provided
  // Use relation connect syntax to ensure compatibility
  if (data.seasonId) {
    matchData.season = { connect: { id: data.seasonId } };
  }

  // Use team IDs if provided, otherwise use fallback fields
  // Use relation connect syntax to ensure compatibility
  if (data.team1Id) {
    matchData.team1 = { connect: { id: data.team1Id } };
  } else {
    matchData.team1Name = data.team1Name || '';
    matchData.team1Logo = data.team1Logo || '';
  }

  if (data.team2Id) {
    matchData.team2 = { connect: { id: data.team2Id } };
  } else {
    matchData.team2Name = data.team2Name || '';
    matchData.team2Logo = data.team2Logo || '';
  }

  // Bracket relationship fields (optional)
  if (data.nextWinnerMatchId !== undefined) {
    matchData.nextWinnerMatchId = data.nextWinnerMatchId;
  }
  if (data.nextLoserMatchId !== undefined) {
    matchData.nextLoserMatchId = data.nextLoserMatchId;
  }
  if (data.bracketPosition !== undefined) {
    matchData.bracketPosition = data.bracketPosition;
  }
  if (data.bracketRound !== undefined) {
    matchData.bracketRound = data.bracketRound;
  }
  if (data.bracketType !== undefined) {
    matchData.bracketType = data.bracketType;
  }

  return await prisma.match.create({
    data: matchData,
    // @ts-expect-error - Prisma types will be correct after full sync
    include: {
      team1: true,
      team2: true,
      league: true,
      season: true,
    },
  });
}

/**
 * Update an existing match
 */
export async function updateMatch(id: string, data: UpdateMatchInput): Promise<Match | null> {
  const updateData: any = {};

  // Convert date string to Date object if provided
  if (data.date) {
    updateData.date = new Date(data.date);
  }

  // Handle other fields
  if (data.team1Score !== undefined) updateData.team1Score = data.team1Score;
  if (data.team2Score !== undefined) updateData.team2Score = data.team2Score;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.duration !== undefined) updateData.duration = data.duration;
  // Only include stage if it has a valid value (not empty string)
  if (data.stage !== undefined) {
    if (data.stage && data.stage.trim() !== '') {
      updateData.stage = data.stage;
    } else {
      updateData.stage = null;
    }
  }

  // Handle league: prefer league ID, fallback to name
  if (data.leagueId !== undefined) {
    if (data.leagueId) {
      updateData.leagueId = data.leagueId;
      updateData.leagueName = null;
    } else {
      // Clearing league relationship, use fallback
      updateData.leagueId = null;
      updateData.leagueName = data.league || '';
    }
  } else if (data.league !== undefined) {
    // Only updating fallback field, keep existing league ID if present
    updateData.leagueName = data.league;
  }

  // Handle season: use season ID if provided
  if (data.seasonId !== undefined) {
    if (data.seasonId) {
      updateData.seasonId = data.seasonId;
    } else {
      // Clearing season relationship
      updateData.seasonId = null;
    }
  }

  // Handle team 1: prefer team ID, fallback to name/logo
  if (data.team1Id !== undefined) {
    if (data.team1Id) {
      updateData.team1Id = data.team1Id;
      updateData.team1Name = null;
      updateData.team1Logo = null;
    } else {
      // Clearing team relationship, use fallback
      updateData.team1Id = null;
      updateData.team1Name = data.team1Name || '';
      updateData.team1Logo = data.team1Logo || '';
    }
  } else if (data.team1Name !== undefined || data.team1Logo !== undefined) {
    // Only updating fallback fields, keep existing team ID if present
    if (data.team1Name !== undefined) updateData.team1Name = data.team1Name;
    if (data.team1Logo !== undefined) updateData.team1Logo = data.team1Logo;
  }

  // Handle team 2: prefer team ID, fallback to name/logo
  if (data.team2Id !== undefined) {
    if (data.team2Id) {
      updateData.team2Id = data.team2Id;
      updateData.team2Name = null;
      updateData.team2Logo = null;
    } else {
      // Clearing team relationship, use fallback
      updateData.team2Id = null;
      updateData.team2Name = data.team2Name || '';
      updateData.team2Logo = data.team2Logo || '';
    }
  } else if (data.team2Name !== undefined || data.team2Logo !== undefined) {
    // Only updating fallback fields, keep existing team ID if present
    if (data.team2Name !== undefined) updateData.team2Name = data.team2Name;
    if (data.team2Logo !== undefined) updateData.team2Logo = data.team2Logo;
  }

  try {
    // Get current match status before update
    const currentMatch = await prisma.match.findUnique({
      where: { id },
      select: { status: true },
    });

    const updatedMatch = await prisma.match.update({
      where: { id },
      data: updateData,
      // @ts-expect-error - Prisma types will be correct after full sync
      include: {
        team1: true,
        team2: true,
        league: true,
        season: true,
      },
    });

    // Update winner if:
    // 1. Status was changed to COMPLETED, or
    // 2. Match is already COMPLETED and scores were updated
    const statusChangedToCompleted =
      data.status === 'COMPLETED' && currentMatch?.status !== 'COMPLETED';
    const scoresUpdatedOnCompletedMatch =
      currentMatch?.status === 'COMPLETED' &&
      (data.team1Score !== undefined || data.team2Score !== undefined);

    if (statusChangedToCompleted || scoresUpdatedOnCompletedMatch) {
      // Import here to avoid circular dependency
      const { updateMatchWinner } = await import('../../game-tracking/lib/score-calculation');
      await updateMatchWinner(id, prisma);

      // Automatically advance winner to next match (if enabled)
      if (getEnvBoolean('ENABLE_AUTOMATCHING', true)) {
        const { advanceWinnerToNextMatch } = await import('../../tournaments/lib/bracket-automation');
        await advanceWinnerToNextMatch(id, prisma);
      }
    }

    return updatedMatch;
  } catch (error) {
    console.error('Error updating match:', error);
    return null;
  }
}

/**
 * Delete a match
 */
export async function deleteMatch(id: string): Promise<boolean> {
  try {
    await prisma.match.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    console.error('Error deleting match:', error);
    return false;
  }
}

/**
 * Create a new player
 */
export async function createPlayer(data: CreatePlayerInput): Promise<Player> {
  const player = await prisma.player.create({
    data: {
      ...data,
      approved: data.approved ?? true, // Default to true for admin-created players
    },
  });

  // Track file usage if image is provided
  if (player.image) {
    try {
      const { trackFileUsageByUrl } = await import('../../../lib/file-usage');
      await trackFileUsageByUrl(player.image, 'PLAYER', player.id, 'image');
    } catch (error) {
      // Non-critical - continue even if tracking fails
      console.warn('Failed to track file usage for player image:', error);
    }
  }

  return player;
}

/**
 * Update an existing player
 */
export async function updatePlayer(id: string, data: UpdatePlayerInput): Promise<Player | null> {
  try {
    // Get existing player to check for image changes
    const existing = await prisma.player.findUnique({
      where: { id },
      select: { image: true },
    });

    const player = await prisma.player.update({
      where: { id },
      data,
    });

    // Track file usage if image changed
    if (data.image !== undefined && data.image !== existing?.image) {
      try {
        const { updateFileUsageOnChange } = await import('../../../lib/file-usage');
        const oldUrl = existing?.image || '';
        const newUrl = data.image || '';
        await updateFileUsageOnChange(oldUrl, newUrl, 'PLAYER', id, 'image');
      } catch (error) {
        // Non-critical - continue even if tracking fails
        console.warn('Failed to track file usage for player image update:', error);
      }
    }

    return player;
  } catch (error) {
    console.error('Error updating player:', error);
    return null;
  }
}

/**
 * Delete a player
 */
export async function deletePlayer(id: string): Promise<boolean> {
  try {
    await prisma.player.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    console.error('Error deleting player:', error);
    return false;
  }
}

/**
 * Delete a team
 */
export async function deleteTeam(id: string): Promise<boolean> {
  try {
    await prisma.team.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    console.error('Error deleting team:', error);
    return false;
  }
}

/**
 * Create a new media item
 */
export async function createMedia(data: CreateMediaInput): Promise<MediaWithFolderAndUploader> {
  return await prisma.media.create({
    data: {
      ...data,
      tags: data.tags || [],
    },
    include: {
      folder: {
        select: {
          id: true,
          name: true,
          isPrivate: true,
        },
      },
      uploader: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  }) as MediaWithFolderAndUploader;
}

/**
 * Update an existing media item
 */
export async function updateMedia(id: string, data: UpdateMediaInput): Promise<MediaWithFolderAndUploader | null> {
  try {
    // If updating featured field, use raw SQL as workaround for Prisma Client sync issue
    if ('featured' in data && typeof data.featured === 'boolean') {
      await prisma.$executeRawUnsafe(
        `UPDATE media SET featured = ? WHERE id = ?`,
        data.featured ? 1 : 0, // MySQL uses 1/0 for boolean
        id
      );
      // Remove featured from data to avoid Prisma error
      const { featured, ...restData } = data;
      if (Object.keys(restData).length > 0) {
        await prisma.media.update({
          where: { id },
          data: restData,
        });
      }
    } else {
      // Normal update for other fields
      await prisma.media.update({
        where: { id },
        data,
      });
    }

    // Fetch updated media using raw SQL to ensure we get the featured field
    const updatedMediaRaw = await prisma.$queryRawUnsafe<Array<{
      id: string;
      title: string;
      url: string;
      file_path: string | null;
      folder_id: string | null;
      size: number | null;
      original_size: number | null;
      compression_ratio: number | null;
      mime_type: string | null;
      type: string;
      thumbnail: string | null;
      is_private: number;
      featured: number;
      uploaded_by: string | null;
      created_at: Date;
      updated_at: Date;
      folder_name: string | null;
      folder_is_private: number | null;
      uploader_name: string | null;
      uploader_email: string | null;
      tags: any;
    }>>(
      `SELECT 
        m.id,
        m.title,
        m.url,
        m.file_path,
        m.folder_id,
        m.size,
        m.original_size,
        m.compression_ratio,
        m.mime_type,
        m.type,
        m.thumbnail,
        m.is_private,
        m.featured,
        m.uploaded_by,
        m.created_at,
        m.updated_at,
        m.tags,
        f.name as folder_name,
        f.is_private as folder_is_private,
        u.name as uploader_name,
        u.email as uploader_email
       FROM media m
       LEFT JOIN folders f ON m.folder_id = f.id
       LEFT JOIN users u ON m.uploaded_by = u.id
       WHERE m.id = ?`,
      id
    );

    if (updatedMediaRaw.length === 0) {
      return null;
    }

    const row = updatedMediaRaw[0];
    return {
      id: row.id,
      title: row.title,
      url: row.url,
      filePath: row.file_path,
      folderId: row.folder_id,
      size: row.size,
      originalSize: row.original_size,
      compressionRatio: row.compression_ratio,
      mimeType: row.mime_type,
      type: row.type as any,
      thumbnail: row.thumbnail,
      isPrivate: Boolean(row.is_private),
      featured: Boolean(row.featured),
      uploadedBy: row.uploaded_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      tags: row.tags,
      folder: row.folder_id ? {
        id: row.folder_id,
        name: row.folder_name || '',
        isPrivate: Boolean(row.folder_is_private),
      } : null,
      uploader: row.uploaded_by ? {
        id: row.uploaded_by,
        name: row.uploader_name || '',
        email: row.uploader_email || '',
      } : null,
    } as MediaWithFolderAndUploader;
  } catch (error) {
    console.error('Error updating media:', error);
    return null;
  }
}

/**
 * Delete a media item
 * Also deletes the file from disk and cleans up file usage records
 * FileUsage records are automatically deleted by database cascade (onDelete: Cascade)
 */
export async function deleteMedia(id: string): Promise<boolean> {
  try {
    // Get media record first to retrieve file path and check usage
    const media = await prisma.media.findUnique({
      where: { id },
      select: {
        id: true,
        filePath: true,
        url: true,
        title: true,
      },
    });

    if (!media) {
      console.warn(`Media with id ${id} not found`);
      return false;
    }

    // Check if file is in use (optional warning)
    try {
      const { checkFileInUse } = await import('../../../lib/file-usage');
      const inUse = await checkFileInUse(id);
      if (inUse) {
        console.warn(`Media "${media.title}" (${id}) is still in use but will be deleted`);
      }
    } catch (usageError) {
      // Non-critical - continue with deletion
      console.warn('Could not check file usage:', usageError);
    }

    // Delete file from disk if filePath exists AND no other media records reference it
    // Also delete any duplicate records that reference the same filePath
    if (media.filePath) {
      try {
        // Check if any other media records reference the same filePath
        const otherMediaWithSameFile = await prisma.media.findMany({
          where: {
            filePath: media.filePath,
            id: { not: id }, // Exclude the current record being deleted
          },
          select: {
            id: true,
            title: true,
          },
        });

        // Only delete the physical file if no other records reference it
        if (otherMediaWithSameFile.length === 0) {
          const { deleteFile } = await import('../../../lib/file-storage');
          const deleted = await deleteFile(media.filePath);
          if (!deleted) {
            console.warn(`File ${media.filePath} may not have existed or was already deleted`);
          } else {
            console.log(`Deleted file ${media.filePath} (no other media records reference it)`);
          }
        } else {
          console.log(
            `Skipping file deletion for ${media.filePath} - ${otherMediaWithSameFile.length} other media record(s) still reference it:`,
            otherMediaWithSameFile.map((m) => `${m.title} (${m.id})`).join(', ')
          );
        }
      } catch (fileError: any) {
        // Log error but continue with database deletion
        console.error('Error checking/deleting file from disk:', fileError);
        // Don't fail the entire operation if file deletion fails
        // (file might already be deleted or not exist)
      }
    } else {
      // If no filePath, this might be an external URL (Supabase or other)
      // Log for reference but don't fail
      console.log(`Media ${id} has no filePath, skipping file deletion (may be external URL)`);
    }

    // Delete media record from database
    // FileUsage records will be automatically deleted due to onDelete: Cascade
    await prisma.media.delete({
      where: { id },
    });

    // After deleting, check if the file still exists and if there are any orphaned records
    // If the file was deleted and there are other records with the same filePath, delete them too
    if (media.filePath) {
      try {
        const { fileExists } = await import('../../../lib/file-storage');
        const fileStillExists = await fileExists(media.filePath);

        if (!fileStillExists) {
          // File doesn't exist - find and delete any other records with this filePath
          const orphanedRecords = await prisma.media.findMany({
            where: {
              filePath: media.filePath,
            },
            select: {
              id: true,
              title: true,
            },
          });

          if (orphanedRecords.length > 0) {
            const orphanedIds = orphanedRecords.map((r) => r.id);
            await prisma.media.deleteMany({
              where: { id: { in: orphanedIds } },
            });
            console.log(
              `[CLEANUP] Deleted ${orphanedRecords.length} orphaned record(s) with missing file: ${media.filePath}`
            );
          }
        }
      } catch (cleanupError) {
        // Non-critical - just log
        console.warn('Error cleaning up orphaned records after deletion:', cleanupError);
      }
    }

    return true;
  } catch (error) {
    console.error('Error deleting media:', error);
    return false;
  }
}

/**
 * Create a new page content
 */
export async function createPageContent(data: CreatePageContentInput): Promise<PageContent> {
  return await prisma.pageContent.create({
    data,
  });
}

/**
 * Update an existing page content
 */
export async function updatePageContent(
  id: string,
  data: UpdatePageContentInput
): Promise<PageContent | null> {
  try {
    return await prisma.pageContent.update({
      where: { id },
      data,
    });
  } catch (error) {
    console.error('Error updating page content:', error);
    return null;
  }
}

/**
 * Delete a page content
 */
export async function deletePageContent(id: string): Promise<boolean> {
  try {
    await prisma.pageContent.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    console.error('Error deleting page content:', error);
    return false;
  }
}

/**
 * Create a new site setting
 */
export async function createSiteSetting(data: CreateSiteSettingInput): Promise<SiteSetting> {
  return await prisma.siteSetting.create({
    data,
  });
}

/**
 * Update an existing site setting
 */
export async function updateSiteSetting(
  id: string,
  data: UpdateSiteSettingInput
): Promise<SiteSetting | null> {
  try {
    return await prisma.siteSetting.update({
      where: { id },
      data,
    });
  } catch (error) {
    console.error('Error updating site setting:', error);
    return null;
  }
}

/**
 * Update a site setting by key
 */
export async function updateSiteSettingByKey(
  key: string,
  value: string
): Promise<SiteSetting | null> {
  try {
    return await prisma.siteSetting.update({
      where: { key },
      data: { value },
    });
  } catch (error) {
    console.error('Error updating site setting by key:', error);
    return null;
  }
}

/**
 * Delete a site setting
 */
export async function deleteSiteSetting(id: string): Promise<boolean> {
  try {
    await prisma.siteSetting.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    console.error('Error deleting site setting:', error);
    return false;
  }
}

/**
 * Create a new comment
 * Comments are approved by default
 */
export async function createComment(data: CreateCommentInput): Promise<Comment> {
  // Safety check: ensure comment model exists
  if (!prisma.comment) {
    throw new Error('Prisma comment model not available. Please run: npx prisma generate');
  }

  // Verify article exists
  const article = await prisma.newsArticle.findUnique({
    where: { id: data.articleId },
  });

  if (!article) {
    throw new Error('Article not found');
  }

  // If parentId is provided, verify parent comment exists
  if (data.parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: data.parentId },
    });

    if (!parent) {
      throw new Error('Parent comment not found');
    }

    // Ensure parent comment belongs to the same article
    if (parent.articleId !== data.articleId) {
      throw new Error('Parent comment does not belong to this article');
    }
  }

  const comment = await prisma.comment.create({
    data: {
      content: data.content,
      authorName: data.authorName || null, // Allow null for anonymous comments
      authorEmail: data.authorEmail,
      authorUrl: data.authorUrl,
      articleId: data.articleId,
      userId: data.userId,
      parentId: data.parentId,
      approved: true, // Comments are approved by default
    },
  });

  return comment;
}

/**
 * Update a comment (admin only - for moderation)
 */
export async function updateComment(id: string, data: UpdateCommentInput): Promise<Comment | null> {
  // Safety check: ensure comment model exists
  if (!prisma.comment) {
    console.error('Prisma comment model not available. Please run: npx prisma generate');
    return null;
  }

  try {
    const comment = await prisma.comment.update({
      where: { id },
      data: {
        ...(data.content && { content: data.content }),
        ...(data.approved !== undefined && { approved: data.approved }),
      },
    });

    return comment;
  } catch (error) {
    console.error('Error updating comment:', error);
    return null;
  }
}

/**
 * Delete a comment
 * Also deletes all replies (cascade)
 */
export async function deleteComment(id: string): Promise<boolean> {
  // Safety check: ensure comment model exists
  if (!prisma.comment) {
    console.error('Prisma comment model not available. Please run: npx prisma generate');
    return false;
  }

  try {
    await prisma.comment.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    console.error('Error deleting comment:', error);
    return false;
  }
}

/**
 * Approve a comment (admin only)
 */
export async function approveComment(id: string): Promise<Comment | null> {
  return updateComment(id, { approved: true });
}

/**
 * Reject/unapprove a comment (admin only)
 */
export async function rejectComment(id: string): Promise<Comment | null> {
  return updateComment(id, { approved: false });
}

/**
 * Create a new staff member
 */
export async function createStaff(data: CreateStaffInput): Promise<Staff> {
  const staff = await prisma.staff.create({
    data,
  });

  // Track file usage if image is provided
  if (staff.image) {
    try {
      const { trackFileUsageByUrl } = await import('../../../lib/file-usage');
      await trackFileUsageByUrl(staff.image, 'STAFF', staff.id, 'image');
    } catch (error) {
      // Non-critical - continue even if tracking fails
      console.warn('Failed to track file usage for staff image:', error);
    }
  }

  return staff;
}

/**
 * Update an existing staff member
 */
export async function updateStaff(id: string, data: UpdateStaffInput): Promise<Staff | null> {
  try {
    // Get existing staff to check for image changes
    const existing = await prisma.staff.findUnique({
      where: { id },
      select: { image: true },
    });

    const staff = await prisma.staff.update({
      where: { id },
      data,
    });

    // Track file usage if image changed
    if (data.image !== undefined && data.image !== existing?.image) {
      try {
        const { updateFileUsageOnChange } = await import('../../../lib/file-usage');
        const oldUrl = existing?.image || '';
        const newUrl = data.image || '';
        await updateFileUsageOnChange(oldUrl, newUrl, 'STAFF', id, 'image');
      } catch (error) {
        // Non-critical - continue even if tracking fails
        console.warn('Failed to track file usage for staff image update:', error);
      }
    }

    return staff;
  } catch (error) {
    console.error('Error updating staff:', error);
    return null;
  }
}

/**
 * Delete a staff member
 */
export async function deleteStaff(id: string): Promise<boolean> {
  try {
    await prisma.staff.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    console.error('Error deleting staff:', error);
    return false;
  }
}

/**
 * Assign staff to a team
 */
export async function assignStaffToTeam(data: CreateTeamStaffInput): Promise<TeamStaff> {
  // Check if staff is already assigned to this team
  const existing = await prisma.teamStaff.findUnique({
    where: {
      teamId_staffId: {
        teamId: data.teamId,
        staffId: data.staffId,
      },
    },
  });

  if (existing) {
    throw new Error('This staff member is already assigned to this team');
  }

  return await prisma.teamStaff.create({
    data,
  });
}

/**
 * Update team staff assignment
 */
export async function updateTeamStaff(id: string, data: UpdateTeamStaffInput): Promise<TeamStaff | null> {
  try {
    return await prisma.teamStaff.update({
      where: { id },
      data,
    });
  } catch (error) {
    console.error('Error updating team staff:', error);
    return null;
  }
}

/**
 * Remove staff from a team
 */
export async function removeStaffFromTeam(id: string): Promise<boolean> {
  try {
    await prisma.teamStaff.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    console.error('Error removing staff from team:', error);
    return false;
  }
}

/**
 * Create a new league
 */
export async function createLeague(data: CreateLeagueInput): Promise<League> {
  // Generate slug from name if not provided
  let slug = data.slug;
  if (!slug) {
    slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // Ensure slug is unique
  let uniqueSlug = slug;
  let counter = 1;
  while (await prisma.league.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  const league = await prisma.league.create({
    data: {
      ...data,
      slug: uniqueSlug,
    },
  });

  // Track file usage if logo is provided
  if (league.logo) {
    try {
      const { trackFileUsageByUrl } = await import('../../../lib/file-usage');
      await trackFileUsageByUrl(league.logo, 'LEAGUE', league.id, 'logo');
    } catch (error) {
      // Non-critical - continue even if tracking fails
      console.warn('Failed to track file usage for league logo:', error);
    }
  }

  return league;
}

/**
 * Update an existing league
 */
export async function updateLeague(id: string, data: UpdateLeagueInput): Promise<League | null> {
  try {
    // If name is being updated and slug is not provided, regenerate slug
    if (data.name && !data.slug) {
      const existing = await prisma.league.findUnique({ where: { id } });
      if (existing) {
        const newSlug = data.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        // Ensure slug is unique (excluding current league)
        let uniqueSlug = newSlug;
        let counter = 1;
        while (await prisma.league.findFirst({
          where: {
            slug: uniqueSlug,
            NOT: { id }
          }
        })) {
          uniqueSlug = `${newSlug}-${counter}`;
          counter++;
        }
        data.slug = uniqueSlug;
      }
    }

    // Get existing league to check for logo changes
    const existing = await prisma.league.findUnique({
      where: { id },
      select: { logo: true },
    });

    const league = await prisma.league.update({
      where: { id },
      data,
    });

    // Track file usage if logo changed
    if (data.logo !== undefined && data.logo !== existing?.logo) {
      try {
        const { updateFileUsageOnChange } = await import('../../../lib/file-usage');
        const oldUrl = existing?.logo || '';
        const newUrl = data.logo || '';
        await updateFileUsageOnChange(oldUrl, newUrl, 'LEAGUE', id, 'logo');
      } catch (error) {
        // Non-critical - continue even if tracking fails
        console.warn('Failed to track file usage for league logo update:', error);
      }
    }

    return league;
  } catch (error) {
    console.error('Error updating league:', error);
    return null;
  }
}

/**
 * Delete a league
 */
export async function deleteLeague(id: string): Promise<boolean> {
  try {
    await prisma.league.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    console.error('Error deleting league:', error);
    return false;
  }
}

/**
 * Create a new season
 */
export async function createSeason(data: CreateSeasonInput): Promise<Season> {
  if (!data.leagueId) {
    throw new Error('League ID is required for creating a season');
  }

  // Generate slug from name if not provided
  let slug = data.slug;
  if (!slug) {
    slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // Ensure slug is unique within the league
  let uniqueSlug = slug;
  let counter = 1;
  while (await prisma.season.findFirst({
    where: {
      slug: uniqueSlug,
      leagueId: data.leagueId
    }
  })) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  return await prisma.season.create({
    data: {
      ...data,
      slug: uniqueSlug,
      leagueId: data.leagueId,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      bracketType: data.bracketType || null,
    },
  });
}

/**
 * Update an existing season
 */
export async function updateSeason(id: string, data: UpdateSeasonInput): Promise<Season | null> {
  try {
    const existing = await prisma.season.findUnique({ where: { id } });
    if (!existing) {
      return null;
    }

    const leagueId = data.leagueId || existing.leagueId;

    // If name is being updated and slug is not provided, regenerate slug
    if (data.name && !data.slug) {
      const newSlug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Ensure slug is unique within the league (excluding current season)
      let uniqueSlug = newSlug;
      let counter = 1;
      while (await prisma.season.findFirst({
        where: {
          slug: uniqueSlug,
          leagueId: leagueId,
          NOT: { id }
        }
      })) {
        uniqueSlug = `${newSlug}-${counter}`;
        counter++;
      }
      data.slug = uniqueSlug;
    } else if (data.slug) {
      // If slug is being updated, ensure it's unique within the league
      let uniqueSlug = data.slug;
      let counter = 1;
      while (await prisma.season.findFirst({
        where: {
          slug: uniqueSlug,
          leagueId: leagueId,
          NOT: { id }
        }
      })) {
        uniqueSlug = `${data.slug}-${counter}`;
        counter++;
      }
      data.slug = uniqueSlug;
    }

    const updateData: any = { ...data };
    if (data.startDate) {
      updateData.startDate = new Date(data.startDate);
    }
    if (data.endDate) {
      updateData.endDate = new Date(data.endDate);
    }
    if (data.leagueId) {
      updateData.leagueId = data.leagueId;
    }

    return await prisma.season.update({
      where: { id },
      data: updateData,
    });
  } catch (error) {
    console.error('Error updating season:', error);
    return null;
  }
}

/**
 * Delete a season
 */
export async function deleteSeason(id: string): Promise<boolean> {
  try {
    await prisma.season.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    console.error('Error deleting season:', error);
    return false;
  }
}

/**
 * Create a match player
 */
export async function createMatchPlayer(data: CreateMatchPlayerInput): Promise<MatchPlayer | null> {
  try {
    return await prisma.matchPlayer.create({
      data: {
        matchId: data.matchId,
        playerId: data.playerId,
        teamId: data.teamId,
        started: data.started ?? false,
        isActive: data.started ?? false, // Sycnc initial active status with starter status
        position: data.position,
        jerseyNumber: data.jerseyNumber,
        minutesPlayed: data.minutesPlayed,
        subOut: data.subOut ?? false,
      },
    });
  } catch (error) {
    console.error('Error creating match player:', error);
    return null;
  }
}

/**
 * Update a match player
 */
export async function updateMatchPlayer(id: string, data: UpdateMatchPlayerInput): Promise<MatchPlayer | null> {
  try {
    const updateData: any = { ...data };
    if (data.started !== undefined) {
      updateData.isActive = data.started;
    }
    if (data.subOut !== undefined) {
      updateData.subOut = data.subOut;
    }

    return await prisma.matchPlayer.update({
      where: { id },
      data: updateData,
    });
  } catch (error) {
    console.error('Error updating match player:', error);
    return null;
  }
}

/**
 * Delete a match player
 */
export async function deleteMatchPlayer(id: string): Promise<boolean> {
  try {
    await prisma.matchPlayer.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    console.error('Error deleting match player:', error);
    return false;
  }
}

/**
 * Create a match event
 */
export async function createMatchEvent(data: CreateMatchEventInput): Promise<MatchEvent | null> {
  try {
    // Import scoring utilities
    const { isScoringEvent, updateMatchScoresFromEvents } = await import('../../game-tracking/lib/score-calculation');

    // Get current game state if quarter/secondsRemaining not provided
    let period = data.period;
    let secondsRemaining = data.secondsRemaining;

    if (period === undefined || secondsRemaining === undefined) {
      const match = await prisma.match.findUnique({
        where: { id: data.matchId },
        select: {
          currentPeriod: true,
          clockSeconds: true,
        },
      });

      if (match) {
        period = period ?? match.currentPeriod;
        secondsRemaining = secondsRemaining ?? match.clockSeconds ?? undefined;
      } else {
        period = period ?? 1;
      }
    }

    // Calculate sequence number
    const { getNextSequenceNumber } = await import('../../game-tracking/lib/utils');
    const sequenceNumber = await getNextSequenceNumber(data.matchId, prisma);

    const isScoring = isScoringEvent(data.eventType);

    // If PLAY_RESUMED event, update match quarter and clock
    if (data.eventType === 'PLAY_RESUMED') {
      const match = await prisma.match.findUnique({
        where: { id: data.matchId },
        include: { gameRules: true },
      });

      if (match) {
        const rules = match.gameRules;
        const periodLengthSeconds = (rules?.minutesPerPeriod ?? 10) * 60;
        const targetPeriod = period ?? match.currentPeriod;
        const targetSeconds = secondsRemaining ?? periodLengthSeconds;

        // Update match period and clock in transaction with event creation
        return await prisma.$transaction(async (tx) => {
          // Update match period and clock
          await tx.match.update({
            where: { id: data.matchId },
            data: {
              currentPeriod: targetPeriod,
              clockSeconds: targetSeconds,
              clockRunning: false, // Clock starts paused when resuming
            },
          });

          // Create the event
          const event = await tx.matchEvent.create({
            data: {
              matchId: data.matchId,
              eventType: data.eventType,
              minute: data.minute,
              period: targetPeriod,
              secondsRemaining: targetSeconds,
              sequenceNumber,
              teamId: data.teamId,
              playerId: data.playerId,
              assistPlayerId: data.assistPlayerId,
              description: data.description,
              metadata: data.metadata,
            },
          });

          // Update scores if scoring event (PLAY_RESUMED is not scoring, but keeping pattern consistent)
          if (isScoring) {
            await updateMatchScoresFromEvents(data.matchId, tx);
          }

          return event;
        });
      }
    }

    // For scoring events, use transaction to ensure atomicity
    if (isScoring) {
      return await prisma.$transaction(async (tx) => {
        const event = await tx.matchEvent.create({
          data: {
            matchId: data.matchId,
            eventType: data.eventType,
            minute: data.minute,
            period: period ?? 1,
            secondsRemaining: secondsRemaining ?? null,
            sequenceNumber,
            teamId: data.teamId,
            playerId: data.playerId,
            assistPlayerId: data.assistPlayerId,
            description: data.description,
            metadata: data.metadata,
          },
        });

        // Update scores after creating scoring event
        await updateMatchScoresFromEvents(data.matchId, tx);

        return event;
      });
    }

    // For substitution events, update player active status
    if (data.eventType === 'SUBSTITUTION_IN' || data.eventType === 'SUBSTITUTION_OUT') {
      return await prisma.$transaction(async (tx) => {
        // Update player active status
        if (data.playerId && data.teamId) {
          await tx.matchPlayer.updateMany({
            where: {
              matchId: data.matchId,
              playerId: data.playerId,
              teamId: data.teamId,
            },
            data: {
              isActive: data.eventType === 'SUBSTITUTION_IN',
              subOut: data.eventType === 'SUBSTITUTION_OUT',
            },
          });
        }

        // Create the event
        return await tx.matchEvent.create({
          data: {
            matchId: data.matchId,
            eventType: data.eventType,
            minute: data.minute,
            period: period ?? 1,
            secondsRemaining: secondsRemaining ?? null,
            sequenceNumber,
            teamId: data.teamId,
            playerId: data.playerId,
            assistPlayerId: data.assistPlayerId,
            description: data.description,
            metadata: data.metadata,
          },
        });
      });
    }

    // Non-scoring events don't need transaction
    return await prisma.matchEvent.create({
      data: {
        matchId: data.matchId,
        eventType: data.eventType,
        minute: data.minute,
        period: period ?? 1,
        secondsRemaining: secondsRemaining ?? null,
        sequenceNumber,
        teamId: data.teamId,
        playerId: data.playerId,
        assistPlayerId: data.assistPlayerId,
        description: data.description,
        metadata: data.metadata,
      },
    });
  } catch (error) {
    console.error('Error creating match event:', error);
    return null;
  }
}

/**
 * Update a match event
 */
export async function updateMatchEvent(id: string, data: UpdateMatchEventInput): Promise<MatchEvent | null> {
  try {
    // Import scoring utilities
    const { isScoringEvent, updateMatchScoresFromEvents } = await import('../../game-tracking/lib/score-calculation');

    // Get the existing event to check if it's PLAY_RESUMED and for score recalculation
    const existingEvent = await prisma.matchEvent.findUnique({
      where: { id },
      select: { eventType: true, matchId: true, isUndone: true },
    });

    if (!existingEvent) {
      return null;
    }

    const wasScoringEvent = isScoringEvent(existingEvent.eventType);
    const isNowScoringEvent = data.eventType ? isScoringEvent(data.eventType) : wasScoringEvent;
    const isUndoneChanged = data.isUndone !== undefined && data.isUndone !== existingEvent.isUndone;
    const eventTypeChanged = data.eventType !== undefined && data.eventType !== existingEvent.eventType;
    const needsScoreRecalculation = (wasScoringEvent || isNowScoringEvent) && (isUndoneChanged || eventTypeChanged);

    // If updating PLAY_RESUMED event and quarter/secondsRemaining changed, update match
    if (existingEvent.eventType === 'PLAY_RESUMED' && (data.period !== undefined || data.secondsRemaining !== undefined)) {
      const match = await prisma.match.findUnique({
        where: { id: existingEvent.matchId },
        include: { gameRules: true },
      });

      if (match) {
        const rules = match.gameRules;
        const periodLengthSeconds = (rules?.minutesPerPeriod ?? 10) * 60;
        const targetPeriod = data.period ?? match.currentPeriod;
        const targetSeconds = data.secondsRemaining ?? periodLengthSeconds;

        // Update match period and clock in transaction with event update
        return await prisma.$transaction(async (tx) => {
          // Update match period and clock
          await tx.match.update({
            where: { id: existingEvent.matchId },
            data: {
              currentPeriod: targetPeriod,
              clockSeconds: targetSeconds,
            },
          });

          // Update the event with resolved period/seconds
          const updatedEvent = await tx.matchEvent.update({
            where: { id },
            data: {
              ...data,
              period: targetPeriod,
              secondsRemaining: targetSeconds,
            },
          });

          // Update scores if needed (PLAY_RESUMED is not scoring, but keeping pattern consistent)
          if (needsScoreRecalculation) {
            await updateMatchScoresFromEvents(existingEvent.matchId, tx);
          }

          return updatedEvent;
        });
      }
    }

    // For scoring events that need recalculation, use transaction
    if (needsScoreRecalculation) {
      return await prisma.$transaction(async (tx) => {
        const updatedEvent = await tx.matchEvent.update({
          where: { id },
          data,
        });

        // Recalculate scores after update
        await updateMatchScoresFromEvents(existingEvent.matchId, tx);

        return updatedEvent;
      });
    }

    // Non-scoring events or scoring events without changes that affect scores
    return await prisma.matchEvent.update({
      where: { id },
      data,
    });
  } catch (error) {
    console.error('Error updating match event:', error);
    return null;
  }
}

/**
 * Delete a match event
 */
export async function deleteMatchEvent(id: string): Promise<boolean> {
  try {
    // Import scoring utilities
    const { isScoringEvent, updateMatchScoresFromEvents } = await import('../../game-tracking/lib/score-calculation');

    // Get the event before deleting to check if it's a scoring event
    const existingEvent = await prisma.matchEvent.findUnique({
      where: { id },
      select: { eventType: true, matchId: true },
    });

    if (!existingEvent) {
      return false;
    }

    const wasScoringEvent = isScoringEvent(existingEvent.eventType);

    // For substitution events, revert player active status
    if (existingEvent.eventType === 'SUBSTITUTION_IN' || existingEvent.eventType === 'SUBSTITUTION_OUT') {
      const matchEventWithPlayer = await prisma.matchEvent.findUnique({
        where: { id },
        select: { playerId: true, teamId: true },
      });

      await prisma.$transaction(async (tx) => {
        if (matchEventWithPlayer?.playerId && matchEventWithPlayer.teamId) {
          await tx.matchPlayer.updateMany({
            where: {
              matchId: existingEvent.matchId,
              playerId: matchEventWithPlayer.playerId,
              teamId: matchEventWithPlayer.teamId,
            },
            data: { isActive: existingEvent.eventType === 'SUBSTITUTION_OUT' }, // Reverse: OUT deleted -> active should be true
          });
        }

        // Delete the event
        await tx.matchEvent.delete({
          where: { id },
        });
      });
    } else if (wasScoringEvent) {
      // If it's a scoring event, recalculate scores after deletion
      await prisma.$transaction(async (tx) => {
        // Delete the event
        await tx.matchEvent.delete({
          where: { id },
        });

        // Recalculate scores after deleting scoring event
        await updateMatchScoresFromEvents(existingEvent.matchId, tx);
      });
    } else {
      // Non-scoring events don't need score recalculation
      await prisma.matchEvent.delete({
        where: { id },
      });
    }

    return true;
  } catch (error) {
    console.error('Error deleting match event:', error);
    return false;
  }
}

/**
 * Create a new folder
 */
export async function createFolder(data: CreateFolderInput, createdBy?: string): Promise<Folder> {
  const { name, description, isPrivate = false } = data;

  // Sanitize folder name
  const sanitizedName = name
    .replace(/\.\./g, '')
    .replace(/[^a-zA-Z0-9\-_/]/g, '')
    .replace(/\/+/g, '/')
    .replace(/^\/|\/$/g, '');

  // Generate path
  const path = `${isPrivate ? 'private' : 'public'}/${sanitizedName}`;

  return await prisma.folder.create({
    data: {
      name: sanitizedName,
      path,
      description,
      isPrivate,
      createdBy: createdBy || null,
    },
  });
}

/**
 * Update an existing folder
 */
export async function updateFolder(id: string, data: UpdateFolderInput): Promise<Folder | null> {
  try {
    const existing = await prisma.folder.findUnique({ where: { id } });
    if (!existing) {
      return null;
    }

    const updateData: any = {};

    if (data.name !== undefined) {
      // Sanitize folder name
      const sanitizedName = data.name
        .replace(/\.\./g, '')
        .replace(/[^a-zA-Z0-9\-_/]/g, '')
        .replace(/\/+/g, '/')
        .replace(/^\/|\/$/g, '');
      updateData.name = sanitizedName;
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    if (data.isPrivate !== undefined) {
      updateData.isPrivate = data.isPrivate;
      // Update path to reflect privacy change
      const folderName = updateData.name || existing.name;
      updateData.path = `${data.isPrivate ? 'private' : 'public'}/${folderName}`;
    } else if (updateData.name) {
      // If name changed but privacy didn't, update path with existing privacy
      updateData.path = `${existing.isPrivate ? 'private' : 'public'}/${updateData.name}`;
    }

    return await prisma.folder.update({
      where: { id },
      data: updateData,
    });
  } catch (error) {
    console.error('Error updating folder:', error);
    return null;
  }
}

/**
 * Delete a folder
 * Note: This will set folderId to null on all media in this folder (onDelete: SetNull)
 */
export async function deleteFolder(id: string): Promise<boolean> {
  try {
    await prisma.folder.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    console.error('Error deleting folder:', error);
    return false;
  }
}
