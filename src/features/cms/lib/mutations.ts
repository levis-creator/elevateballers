import { prisma } from '../../../lib/prisma';
import { generateSlug } from './utils';
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
  Match,
  Player,
  Team,
  Staff,
  TeamStaff,
  Media,
  PageContent,
  SiteSetting,
  Comment,
  League,
  Season,
  MatchPlayer,
  MatchEvent,
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

  return await prisma.team.create({
    data: {
      ...data,
      slug,
      approved: data.approved ?? true, // Default to true for admin-created teams
    },
  });
}

/**
 * Update an existing team
 */
export async function updateTeam(id: string, data: UpdateTeamInput): Promise<Team | null> {
  try {
    const updateData: any = { ...data };

    // If name is being updated and slug is not provided, regenerate slug
    if (data.name && !data.slug) {
      updateData.slug = await generateUniqueSlug(data.name, id);
    } else if (data.slug) {
      // If slug is provided, ensure it's unique
      updateData.slug = await generateUniqueSlug(data.slug, id);
    }

    return await prisma.team.update({
      where: { id },
      data: updateData,
    });
  } catch (error) {
    console.error('Error updating team:', error);
    return null;
  }
}
export async function createMatch(data: CreateMatchInput): Promise<Match> {
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
  if (data.leagueId) {
    matchData.leagueId = data.leagueId;
  } else {
    matchData.leagueName = data.league || '';
  }

  // Use season ID if provided
  if (data.seasonId) {
    matchData.seasonId = data.seasonId;
  }

  // Use team IDs if provided, otherwise use fallback fields
  if (data.team1Id) {
    matchData.team1Id = data.team1Id;
  } else {
    matchData.team1Name = data.team1Name || '';
    matchData.team1Logo = data.team1Logo || '';
  }

  if (data.team2Id) {
    matchData.team2Id = data.team2Id;
  } else {
    matchData.team2Name = data.team2Name || '';
    matchData.team2Logo = data.team2Logo || '';
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
    return await prisma.match.update({
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
  return await prisma.player.create({
    data: {
      ...data,
      approved: data.approved ?? true, // Default to true for admin-created players
    },
  });
}

/**
 * Update an existing player
 */
export async function updatePlayer(id: string, data: UpdatePlayerInput): Promise<Player | null> {
  try {
    return await prisma.player.update({
      where: { id },
      data,
    });
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
export async function createMedia(data: CreateMediaInput): Promise<Media> {
  return await prisma.media.create({
    data: {
      ...data,
      tags: data.tags || [],
    },
  });
}

/**
 * Update an existing media item
 */
export async function updateMedia(id: string, data: UpdateMediaInput): Promise<Media | null> {
  try {
    return await prisma.media.update({
      where: { id },
      data,
    });
  } catch (error) {
    console.error('Error updating media:', error);
    return null;
  }
}

/**
 * Delete a media item
 */
export async function deleteMedia(id: string): Promise<boolean> {
  try {
    await prisma.media.delete({
      where: { id },
    });
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
  return await prisma.staff.create({
    data,
  });
}

/**
 * Update an existing staff member
 */
export async function updateStaff(id: string, data: UpdateStaffInput): Promise<Staff | null> {
  try {
    return await prisma.staff.update({
      where: { id },
      data,
    });
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

  return await prisma.league.create({
    data: {
      ...data,
      slug: uniqueSlug,
    },
  });
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

    return await prisma.league.update({
      where: { id },
      data,
    });
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
        position: data.position,
        jerseyNumber: data.jerseyNumber,
        minutesPlayed: data.minutesPlayed,
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
    return await prisma.matchPlayer.update({
      where: { id },
      data,
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

    // If it's a scoring event, recalculate scores after deletion
    // (calculateScoresFromEvents already filters out undone events, so we always recalculate)
    if (wasScoringEvent) {
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
