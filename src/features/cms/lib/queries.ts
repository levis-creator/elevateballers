import { prisma } from '../../../lib/prisma';
import type { NewsCategory, NewsArticleWithAuthor, Match, Player, Team, TeamWithPlayers, TeamWithPlayerCount, Staff, StaffWithTeams, TeamStaff, TeamStaffWithStaff, MatchStatus, MatchStage, Media, MediaType, MediaWithFolder, MediaWithFolderAndUploader, PageContent, SiteSetting, CommentWithAuthor, StaffRole, League, LeagueWithMatchCount, Season, SeasonWithCounts, MatchWithTeamsAndLeagueAndSeason, MatchPlayerWithDetails, MatchEventWithDetails, MatchWithFullDetails, Folder, FolderWithMediaCount } from '../types';
import { categoryMap, reverseCategoryMap } from '../types';

/**
 * Get published news articles (public access)
 * IMPORTANT: Only returns articles where published=true
 * This ensures public APIs never expose unpublished content
 */
export async function getNewsArticles(category?: string): Promise<NewsArticleWithAuthor[]> {
  const where: any = { published: true }; // Security: Only published articles

  if (category && category !== 'All') {
    // Map frontend category to Prisma enum
    if (categoryMap[category]) {
      where.category = categoryMap[category];
    }
  }

  try {
    const articles = await prisma.newsArticle.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
    });

    // Filter out articles with invalid dates and validate dates
    const validArticles = articles.filter(article => {
      try {
        // Validate publishedAt if it exists
        if (article.publishedAt) {
          const date = new Date(article.publishedAt);
          if (isNaN(date.getTime())) {
            console.warn(`Invalid publishedAt date for article ${article.id}: ${article.publishedAt}`);
            return false;
          }
        }
        // Validate createdAt and updatedAt
        const createdAt = new Date(article.createdAt);
        const updatedAt = new Date(article.updatedAt);
        if (isNaN(createdAt.getTime()) || isNaN(updatedAt.getTime())) {
          console.warn(`Invalid date for article ${article.id}`);
          return false;
        }
        return true;
      } catch (error) {
        console.warn(`Error validating dates for article ${article.id}:`, error);
        return false;
      }
    });

    return validArticles as NewsArticleWithAuthor[];
  } catch (error) {
    console.error('Error fetching news articles:', error);
    // If it's a date parsing error, try to fix the database and return empty array
    if (error instanceof Error && error.message.includes('Invalid time value')) {
      console.error('⚠️  Invalid dates detected in database. Run: npm run fix:dates');
      return [];
    }
    throw error;
  }
}

/**
 * Get all news articles including unpublished (admin access)
 */
export async function getAllNewsArticles(includeUnpublished = false): Promise<NewsArticleWithAuthor[]> {
  const where = includeUnpublished ? {} : { published: true };

  try {
    const articles = await prisma.newsArticle.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Filter out articles with invalid dates
    const validArticles = articles.filter(article => {
      try {
        if (article.publishedAt) {
          const date = new Date(article.publishedAt);
          if (isNaN(date.getTime())) return false;
        }
        const createdAt = new Date(article.createdAt);
        const updatedAt = new Date(article.updatedAt);
        return !isNaN(createdAt.getTime()) && !isNaN(updatedAt.getTime());
      } catch {
        return false;
      }
    });

    return validArticles as NewsArticleWithAuthor[];
  } catch (error) {
    console.error('Error fetching all news articles:', error);
    if (error instanceof Error && error.message.includes('Invalid time value')) {
      console.error('⚠️  Invalid dates detected. Run: npm run fix:dates');
      return [];
    }
    throw error;
  }
}

/**
 * Get a single news article by ID
 */
export async function getNewsArticleById(id: string): Promise<NewsArticleWithAuthor | null> {
  const article = await prisma.newsArticle.findUnique({
    where: { id },
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

  return article as NewsArticleWithAuthor | null;
}

/**
 * Get a single news article by slug
 */
export async function getNewsArticleBySlug(slug: string): Promise<NewsArticleWithAuthor | null> {
  const article = await prisma.newsArticle.findUnique({
    where: { slug },
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

  return article as NewsArticleWithAuthor | null;
}

/**
 * Get featured published news articles (public access)
 * IMPORTANT: Only returns articles where published=true AND feature=true
 * This ensures public APIs never expose unpublished content
 * Limited to 5 most recent featured articles
 */
export async function getFeaturedNewsArticles(): Promise<NewsArticleWithAuthor[]> {
  try {
    const articles = await prisma.newsArticle.findMany({
      where: {
        published: true, // Security: Only published articles
        feature: true,   // Only featured articles
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
      orderBy: {
        publishedAt: 'desc',
      },
      take: 5, // Limit to 5 featured articles
    });

    // Filter out articles with invalid dates
    const validArticles = articles.filter(article => {
      try {
        if (article.publishedAt) {
          const date = new Date(article.publishedAt);
          if (isNaN(date.getTime())) return false;
        }
        const createdAt = new Date(article.createdAt);
        const updatedAt = new Date(article.updatedAt);
        return !isNaN(createdAt.getTime()) && !isNaN(updatedAt.getTime());
      } catch {
        return false;
      }
    });

    return validArticles as NewsArticleWithAuthor[];
  } catch (error) {
    console.error('Error fetching featured news articles:', error);
    if (error instanceof Error && error.message.includes('Invalid time value')) {
      console.error('⚠️  Invalid dates detected. Run: npm run fix:dates');
      return [];
    }
    throw error;
  }
}

/**
 * Get matches with optional status filter
 */
export async function getMatches(status?: string): Promise<MatchWithTeamsAndLeagueAndSeason[]> {
  const where: any = {};

  if (status) {
    const statusMap: Record<string, MatchStatus> = {
      'upcoming': 'UPCOMING',
      'live': 'LIVE',
      'completed': 'COMPLETED',
    };

    if (statusMap[status.toLowerCase()]) {
      where.status = statusMap[status.toLowerCase()];
    }
  }

  return await prisma.match.findMany({
    where,
    include: {
      team1: true,
      team2: true,
      league: true,
      season: true,
      winner: true,
    },
    orderBy: {
      date: 'asc',
    },
  }) as MatchWithTeamsAndLeagueAndSeason[];
}

/**
 * Get a single match by ID with team relations
 */
export async function getMatchById(id: string): Promise<MatchWithTeamsAndLeagueAndSeason | null> {
  return await prisma.match.findUnique({
    where: { id },
    // @ts-expect-error - Prisma types will be correct after dev server restart
    include: {
      team1: true,
      team2: true,
      league: true,
      season: true,
      winner: true,
    },
  }) as MatchWithTeamsAndLeagueAndSeason | null;
}

/**
 * Get all teams with player counts
 */
export async function getTeams(includeUnapproved: boolean = false): Promise<TeamWithPlayerCount[]> {
  return await prisma.team.findMany({
    where: includeUnapproved ? {} : { approved: true },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      description: true,
      approved: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          players: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  }) as TeamWithPlayerCount[];
}

const TEAMS_PAGINATION_SELECT = {
  id: true,
  name: true,
  slug: true,
  logo: true,
  description: true,
  approved: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      players: true,
    },
  },
} as const;

export type TeamsPaginatedResult = {
  teams: TeamWithPlayerCount[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
};

/**
 * Get teams with pagination (public: approved only).
 * Optional search filters by team name or slug (case-insensitive partial match).
 */
export async function getTeamsPaginated(
  page: number = 1,
  perPage: number = 12,
  includeUnapproved: boolean = false,
  search?: string | null
): Promise<TeamsPaginatedResult> {
  const baseWhere = includeUnapproved ? {} : { approved: true };
  const searchTerm = typeof search === 'string' ? search.trim() : '';
  const where =
    searchTerm.length > 0
      ? {
        ...baseWhere,
        OR: [
          { name: { contains: searchTerm } },
          { slug: { contains: searchTerm } },
        ],
      }
      : baseWhere;
  const [totalCount, teams] = await Promise.all([
    prisma.team.count({ where }),
    prisma.team.findMany({
      where,
      select: TEAMS_PAGINATION_SELECT,
      orderBy: { name: 'asc' },
      skip: (Math.max(1, page) - 1) * perPage,
      take: perPage,
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const currentPage = Math.max(1, Math.min(page, totalPages));
  return {
    teams: teams as TeamWithPlayerCount[],
    totalCount,
    totalPages,
    currentPage,
    perPage,
  };
}

/**
 * Get a single team by ID
 */
export async function getTeamById(id: string, includeUnapproved: boolean = false): Promise<TeamWithPlayers | null> {
  return await prisma.team.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      description: true,
      approved: true,
      createdAt: true,
      updatedAt: true,
      players: {
        where: includeUnapproved ? {} : { approved: true },
        orderBy: [
          {
            firstName: 'asc',
          },
          {
            lastName: 'asc',
          },
        ],
      },
    },
  }) as TeamWithPlayers | null;
}

/**
 * Get a single team by slug (public access)
 */
export async function getTeamBySlug(slug: string): Promise<TeamWithPlayers | null> {
  return await prisma.team.findUnique({
    where: {
      slug,
      approved: true, // Only return approved teams for public access
    },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      description: true,
      approved: true,
      createdAt: true,
      updatedAt: true,
      players: {
        where: { approved: true }, // Only return approved players
        orderBy: [
          {
            firstName: 'asc',
          },
          {
            lastName: 'asc',
          },
        ],
        select: {
          id: true,
          slug: true,
          firstName: true,
          lastName: true,
          image: true,
          bio: true,
          height: true,
          weight: true,
          position: true,
          jerseyNumber: true,
          stats: true,
          approved: true,
          teamId: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  }) as TeamWithPlayers | null;
}

/**
 * Get players with optional team filter
 */
export async function getPlayers(teamId?: string, isAdmin: boolean = false): Promise<Player[]> {
  const where: any = {
    ...(isAdmin ? {} : { approved: true }),
  };

  if (teamId) {
    where.teamId = teamId;
  }

  const select: any = {
    id: true,
    slug: true,
    firstName: true,
    lastName: true,
    image: true,
    bio: true,
    height: true,
    weight: true,
    position: true,
    jerseyNumber: true,
    stats: true,
    approved: true,
    teamId: true,
    createdAt: true,
    updatedAt: true,
    team: {
      select: {
        id: true,
        name: true,
        slug: true,
        approved: true,
      },
    },
  };

  // Only include contact info for admins
  if (isAdmin) {
    select.email = true;
    select.phone = true;
  }

  return await prisma.player.findMany({
    where,
    select,
    orderBy: [
      {
        firstName: 'asc',
      },
      {
        lastName: 'asc',
      },
    ],
  }) as unknown as Player[];
}

/**
 * Get a single player by ID
 */
export async function getPlayerById(id: string, isAdmin: boolean = false): Promise<Player | null> {
  const select: any = {
    id: true,
    slug: true,
    firstName: true,
    lastName: true,
    image: true,
    bio: true,
    height: true,
    weight: true,
    position: true,
    jerseyNumber: true,
    stats: true,
    approved: true,
    teamId: true,
    createdAt: true,
    updatedAt: true,
    team: true,
  };

  // Only include contact info for admins
  if (isAdmin) {
    select.email = true;
    select.phone = true;
  }

  return await prisma.player.findUnique({
    where: { id },
    select,
  }) as unknown as Player | null;
}

/**
 * Get a single player by slug (public access)
 */
export async function getPlayerBySlug(slug: string): Promise<Player | null> {
  const select: any = {
    id: true,
    slug: true,
    firstName: true,
    lastName: true,
    image: true,
    bio: true,
    height: true,
    weight: true,
    position: true,
    jerseyNumber: true,
    stats: true,
    approved: true,
    teamId: true,
    createdAt: true,
    updatedAt: true,
    team: true,
  };

  return await prisma.player.findFirst({
    where: { slug, approved: true },
    select,
  }) as unknown as Player | null;
}

/**
 * Get media items with optional type filter
 * Uses raw SQL to ensure featured field is included (workaround for Prisma Client sync issues)
 */
export async function getMedia(type?: string): Promise<MediaWithFolderAndUploader[]> {
  const typeCondition = type ? `WHERE m.type = ?` : '';
  const typeMap: Record<string, string> = {
    'image': 'IMAGE',
    'video': 'VIDEO',
    'audio': 'AUDIO',
  };
  const typeParam = type && typeMap[type.toLowerCase()] ? [typeMap[type.toLowerCase()]] : [];

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
    return rawMedia.map((row: any) => ({
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
    })) as MediaWithFolderAndUploader[];
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

      return rawMedia.map((row: any) => ({
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
      })) as MediaWithFolderAndUploader[];
    }
    throw error;
  }
}

/**
 * Get featured media items (public access)
 * IMPORTANT: Only returns media where featured=true
 * Filters out media in private folders for public access
 * Includes media without folders (folderId is null)
 * Uses raw SQL to ensure featured field is included (workaround for Prisma Client sync issues)
 * @param limit - Optional limit on number of results (default: no limit)
 */
export async function getFeaturedMedia(limit?: number): Promise<MediaWithFolderAndUploader[]> {
  // Use raw SQL to ensure featured field is included
  const limitClause = limit ? `LIMIT ${limit}` : '';

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
      WHERE COALESCE(m.featured, 0) = 1
      ORDER BY m.created_at DESC
      ${limitClause}`
    );

    // Transform raw SQL results to match expected format
    const allFeatured = rawMedia.map((row: any) => ({
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
    })) as MediaWithFolderAndUploader[];

    // Filter out media in private folders (keep media without folders)
    const publicFeatured = allFeatured.filter((item) => {
      // Include if no folder OR folder is not private
      return !item.folder || !item.folder.isPrivate;
    });

    return publicFeatured;
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
        WHERE COALESCE(m.featured, 0) = 1
        ORDER BY m.created_at DESC
        ${limitClause}`
      );

      const allFeatured = rawMedia.map((row: any) => ({
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
      })) as MediaWithFolderAndUploader[];

      // No folder filtering needed if folders table doesn't exist
      return allFeatured;
    }
    throw error;
  }
}

/**
 * Get a single media item by ID
 * Uses raw SQL to ensure featured field is included (workaround for Prisma Client sync issues)
 */
export async function getMediaById(id: string): Promise<MediaWithFolderAndUploader | null> {
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
      WHERE m.id = ?
      LIMIT 1`,
      id
    );

    if (rawMedia.length === 0) {
      return null;
    }

    const row = rawMedia[0];
    return {
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
    } as MediaWithFolderAndUploader;
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
        WHERE m.id = ?
        LIMIT 1`,
        id
      );

      if (rawMedia.length === 0) {
        return null;
      }

      const row = rawMedia[0];
      return {
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
      } as MediaWithFolderAndUploader;
    }
    throw error;
  }
}

/**
 * Get all folders
 * @param includePrivate - If true, includes private folders (admin only)
 */
export async function getFolders(includePrivate = false): Promise<FolderWithMediaCount[]> {
  const where: any = {};

  if (!includePrivate) {
    where.isPrivate = false;
  }

  return await prisma.folder.findMany({
    where,
    include: {
      _count: {
        select: {
          media: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  }) as FolderWithMediaCount[];
}

/**
 * Get a single folder by ID
 */
export async function getFolderById(id: string): Promise<FolderWithMediaCount | null> {
  return await prisma.folder.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          media: true,
        },
      },
    },
  }) as FolderWithMediaCount | null;
}

/**
 * Get a single folder by name
 */
export async function getFolderByName(name: string): Promise<FolderWithMediaCount | null> {
  return await prisma.folder.findUnique({
    where: { name },
    include: {
      _count: {
        select: {
          media: true,
        },
      },
    },
  }) as FolderWithMediaCount | null;
}

/**
 * Get all page contents
 */
export async function getAllPageContents(): Promise<PageContent[]> {
  return await prisma.pageContent.findMany({
    orderBy: {
      title: 'asc',
    },
  });
}

/**
 * Get a single page content by ID
 */
export async function getPageContentById(id: string): Promise<PageContent | null> {
  return await prisma.pageContent.findUnique({
    where: { id },
  });
}

/**
 * Get a single page content by slug (public access)
 */
export async function getPageContentBySlug(slug: string): Promise<PageContent | null> {
  return await prisma.pageContent.findUnique({
    where: { slug },
  });
}

/**
 * Get all site settings
 */
export async function getAllSiteSettings(category?: string): Promise<SiteSetting[]> {
  const where: any = {};
  if (category) {
    where.category = category;
  }
  return await prisma.siteSetting.findMany({
    where,
    orderBy: {
      category: 'asc',
    },
  });
}

/**
 * Get a single site setting by key
 */
export async function getSiteSettingByKey(key: string): Promise<SiteSetting | null> {
  return await prisma.siteSetting.findUnique({
    where: { key },
  });
}

/**
 * Get site settings by category
 */
export async function getSiteSettingsByCategory(category: string): Promise<SiteSetting[]> {
  return await prisma.siteSetting.findMany({
    where: { category },
    orderBy: {
      label: 'asc',
    },
  });
}

/**
 * Get approved comments for an article (public access)
 * Returns comments with nested replies
 */
/**
 * Recursively fetch all nested replies for a comment
 */
async function getRepliesRecursive(parentId: string, approvedOnly: boolean = true): Promise<CommentWithAuthor[]> {
  const whereClause: any = {
    parentId,
  };

  if (approvedOnly) {
    whereClause.approved = true;
  }

  const replies = await prisma.comment.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // Recursively fetch replies for each reply
  const repliesWithNested = await Promise.all(
    replies.map(async (reply) => {
      const nestedReplies = await getRepliesRecursive(reply.id, approvedOnly);
      return {
        ...reply,
        replies: nestedReplies as CommentWithAuthor[],
      } as CommentWithAuthor;
    })
  );

  return repliesWithNested;
}

export async function getArticleComments(articleId: string): Promise<CommentWithAuthor[]> {
  // Safety check: ensure comment model exists
  if (!prisma.comment) {
    console.error('Prisma comment model not available. Please run: npx prisma generate');
    return [];
  }

  const comments = await prisma.comment.findMany({
    where: {
      articleId,
      approved: true,
      parentId: null, // Only top-level comments
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // Get all nested replies recursively for each comment
  const commentsWithReplies = await Promise.all(
    comments.map(async (comment) => {
      const replies = await getRepliesRecursive(comment.id, true);
      return {
        ...comment,
        replies: replies as CommentWithAuthor[],
      } as CommentWithAuthor;
    })
  );

  return commentsWithReplies;
}

/**
 * Get all comments for an article (admin access)
 * Includes unapproved comments
 */
export async function getAllArticleComments(articleId: string): Promise<CommentWithAuthor[]> {
  // Safety check: ensure comment model exists
  if (!prisma.comment) {
    console.error('Prisma comment model not available. Please run: npx prisma generate');
    return [];
  }

  const comments = await prisma.comment.findMany({
    where: {
      articleId,
      parentId: null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // Get all nested replies recursively for each comment (including unapproved)
  const commentsWithReplies = await Promise.all(
    comments.map(async (comment) => {
      const replies = await getRepliesRecursive(comment.id, false);
      return {
        ...comment,
        replies: replies as CommentWithAuthor[],
      } as CommentWithAuthor;
    })
  );

  return commentsWithReplies;
}

/**
 * Get comment count for an article (public - only approved)
 */
export async function getArticleCommentCount(articleId: string): Promise<number> {
  // Safety check: ensure comment model exists
  if (!prisma.comment) {
    console.error('Prisma comment model not available. Please run: npx prisma generate');
    return 0;
  }

  return await prisma.comment.count({
    where: {
      articleId,
      approved: true,
    },
  });
}

/**
 * Get a single comment by ID
 */
export async function getCommentById(id: string): Promise<CommentWithAuthor | null> {
  // Safety check: ensure comment model exists
  if (!prisma.comment) {
    console.error('Prisma comment model not available. Please run: npx prisma generate');
    return null;
  }

  const comment = await prisma.comment.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return comment as CommentWithAuthor | null;
}

/**
 * Get all staff members
 */
export async function getStaff(): Promise<Staff[]> {
  return await prisma.staff.findMany({
    orderBy: [
      {
        firstName: 'asc',
      },
      {
        lastName: 'asc',
      },
    ],
  });
}

/**
 * Get a single staff member by ID
 */
export async function getStaffById(id: string): Promise<StaffWithTeams | null> {
  return await prisma.staff.findUnique({
    where: { id },
    include: {
      teams: {
        include: {
          team: true,
        },
      },
    },
  });
}

/**
 * Get a single staff member by slug (public access)
 */
export async function getStaffBySlug(slug: string): Promise<StaffWithTeams | null> {
  return await prisma.staff.findFirst({
    where: { slug, approved: true },
    include: {
      teams: {
        include: {
          team: true,
        },
      },
    },
  });
}

/**
 * Get public staff members (approved only, with slug)
 */
export async function getPublicStaff(): Promise<Staff[]> {
  return await prisma.staff.findMany({
    where: {
      approved: true,
      slug: { not: null },
    },
    orderBy: [
      { firstName: 'asc' },
      { lastName: 'asc' },
    ],
  });
}

/**
 * Get staff by team ID
 */
export async function getStaffByTeam(teamId: string, includeUnapproved: boolean = false): Promise<TeamStaffWithStaff[]> {
  return await prisma.teamStaff.findMany({
    where: {
      teamId,
      ...(includeUnapproved ? {} : { staff: { approved: true } }),
    },
    include: {
      staff: true,
    },
    orderBy: {
      role: 'asc',
    },
  });
}

/**
 * Get all leagues
 */
export async function getLeagues(activeOnly = false): Promise<LeagueWithMatchCount[]> {
  const where = activeOnly ? { active: true } : {};

  return await prisma.league.findMany({
    where,
    // @ts-expect-error - Prisma types will be correct after full sync
    include: {
      _count: {
        select: {
          matches: true,
          seasons: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  }) as LeagueWithMatchCount[];
}

/**
 * Get a single league by ID
 */
export async function getLeagueById(id: string): Promise<LeagueWithMatchCount | null> {
  return await prisma.league.findUnique({
    where: { id },
    // @ts-expect-error - Prisma types will be correct after full sync
    include: {
      _count: {
        select: {
          matches: true,
          seasons: true,
        },
      },
    },
  }) as LeagueWithMatchCount | null;
}

/**
 * Get a single league by slug
 */
export async function getLeagueBySlug(slug: string): Promise<LeagueWithMatchCount | null> {
  return await prisma.league.findUnique({
    where: { slug },
    // @ts-expect-error - Prisma types will be correct after full sync
    include: {
      _count: {
        select: {
          matches: true,
          seasons: true,
        },
      },
    },
  }) as LeagueWithMatchCount | null;
}

/**
 * Get all seasons
 */
export async function getSeasons(activeOnly = false, leagueId?: string): Promise<SeasonWithCounts[]> {
  const where: any = activeOnly ? { active: true } : {};
  if (leagueId) {
    where.leagueId = leagueId;
  }

  return await prisma.season.findMany({
    where,
    // @ts-expect-error - Prisma types will be correct after full sync
    include: {
      league: true,
      _count: {
        select: {
          matches: true,
        },
      },
    },
    orderBy: {
      startDate: 'desc',
    },
  }) as SeasonWithCounts[];
}

/**
 * Get a single season by ID
 */
export async function getSeasonById(id: string): Promise<SeasonWithCounts | null> {
  return await prisma.season.findUnique({
    where: { id },
    // @ts-expect-error - Prisma types will be correct after full sync
    include: {
      league: true,
      _count: {
        select: {
          matches: true,
        },
      },
    },
  }) as SeasonWithCounts | null;
}

/**
 * Get a single season by slug
 */
export async function getSeasonBySlug(slug: string, leagueId?: string): Promise<SeasonWithCounts | null> {
  const where: any = { slug };
  if (leagueId) {
    where.leagueId = leagueId;
  }

  return await prisma.season.findFirst({
    where,
    // @ts-expect-error - Prisma types will be correct after full sync
    include: {
      league: true,
      _count: {
        select: {
          matches: true,
        },
      },
    },
  }) as SeasonWithCounts | null;
}

/**
 * Get match players for a specific match
 */
export async function getMatchPlayers(matchId: string): Promise<MatchPlayerWithDetails[]> {
  return await prisma.matchPlayer.findMany({
    where: { matchId },
    include: {
      player: true,
      team: true,
    },
    orderBy: [
      { started: 'desc' },
      { jerseyNumber: 'asc' },
    ],
  }) as MatchPlayerWithDetails[];
}

/**
 * Get match players by team for a specific match
 */
export async function getMatchPlayersByTeam(matchId: string, teamId: string): Promise<MatchPlayerWithDetails[]> {
  return await prisma.matchPlayer.findMany({
    where: { matchId, teamId },
    include: {
      player: true,
      team: true,
    },
    orderBy: [
      { started: 'desc' },
      { jerseyNumber: 'asc' },
    ],
  }) as MatchPlayerWithDetails[];
}

/**
 * Get a single match player by ID
 */
export async function getMatchPlayerById(id: string): Promise<MatchPlayerWithDetails | null> {
  return await prisma.matchPlayer.findUnique({
    where: { id },
    include: {
      player: true,
      team: true,
    },
  }) as MatchPlayerWithDetails | null;
}

/**
 * Get all events for a specific match
 */
export async function getMatchEvents(matchId: string): Promise<MatchEventWithDetails[]> {
  return await prisma.matchEvent.findMany({
    where: { matchId },
    include: {
      player: true,
      assistPlayer: true,
      team: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  }) as MatchEventWithDetails[];
}

/**
 * Get match events by team
 */
export async function getMatchEventsByTeam(matchId: string, teamId: string): Promise<MatchEventWithDetails[]> {
  return await prisma.matchEvent.findMany({
    where: { matchId, teamId },
    include: {
      player: true,
      assistPlayer: true,
      team: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  }) as MatchEventWithDetails[];
}

/**
 * Get match events by type
 */
export async function getMatchEventsByType(matchId: string, eventType: string): Promise<MatchEventWithDetails[]> {
  return await prisma.matchEvent.findMany({
    where: { matchId, eventType: eventType as any },
    include: {
      player: true,
      assistPlayer: true,
      team: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  }) as MatchEventWithDetails[];
}

/**
 * Get a single match event by ID
 */
export async function getMatchEventById(id: string): Promise<MatchEventWithDetails | null> {
  return await prisma.matchEvent.findUnique({
    where: { id },
    include: {
      player: true,
      assistPlayer: true,
      team: true,
    },
  }) as MatchEventWithDetails | null;
}

/**
 * Get match with full details (players and events)
 */
export async function getMatchWithFullDetails(matchId: string): Promise<MatchWithFullDetails | null> {
  try {
    // First get the basic match
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        team1: true,
        team2: true,
        league: true,
        season: true,
      },
    });

    if (!match) return null;

    // Fetch players and events separately to avoid complex joins that might hang
    let matchPlayers: MatchPlayerWithDetails[] = [];
    let events: MatchEventWithDetails[] = [];

    try {
      matchPlayers = await getMatchPlayers(matchId);
    } catch (err) {
      console.warn('Failed to fetch match players:', err);
      // Continue without players
    }

    try {
      events = await getMatchEvents(matchId);
    } catch (err) {
      console.warn('Failed to fetch match events:', err);
      // Continue without events
    }

    let substitutions: any[] = [];
    try {
      substitutions = await prisma.substitution.findMany({
        where: { matchId },
        orderBy: { createdAt: 'desc' },
        include: {
          playerIn: true,
          playerOut: true
        }
      });
    } catch (err) {
      console.warn('Failed to fetch substitutions:', err);
    }

    // Combine all data
    return {
      ...match,
      matchPlayers: matchPlayers || [],
      events: events || [],
      substitutions: substitutions || [],
    } as MatchWithFullDetails;
  } catch (error: any) {
    console.error('Error in getMatchWithFullDetails:', error);
    throw error;
  }
}

/**
 * Get matches for a tournament (Playoffs, Finals, etc.)
 */
export async function getTournamentMatches(leagueId?: string, seasonId?: string): Promise<MatchWithTeamsAndLeagueAndSeason[]> {
  const where: any = {
    stage: {
      in: ['PLAYOFF', 'QUARTER_FINALS', 'SEMI_FINALS', 'CHAMPIONSHIP']
    }
  };

  if (leagueId) where.leagueId = leagueId;
  if (seasonId) where.seasonId = seasonId;

  return await prisma.match.findMany({
    where,
    include: {
      team1: true,
      team2: true,
      league: true,
      season: true,
      winner: true,
    },
    orderBy: {
      date: 'asc',
    },
  }) as MatchWithTeamsAndLeagueAndSeason[];
}
