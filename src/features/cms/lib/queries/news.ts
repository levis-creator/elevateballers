import { prisma } from '../../../../lib/prisma';
import type { NewsArticleWithAuthor } from '../../types';
import { categoryMap } from '../../types';

function filterValidDates(articles: any[]): any[] {
  return articles.filter((article) => {
    try {
      if (article.publishedAt && isNaN(new Date(article.publishedAt).getTime())) return false;
      return !isNaN(new Date(article.createdAt).getTime()) && !isNaN(new Date(article.updatedAt).getTime());
    } catch {
      return false;
    }
  });
}

/** Get published news articles (public access) */
export async function getNewsArticles(category?: string): Promise<NewsArticleWithAuthor[]> {
  const where: any = { published: true };
  if (category && category !== 'All' && categoryMap[category]) {
    where.category = categoryMap[category];
  }

  try {
    const articles = await prisma.newsArticle.findMany({
      where,
      include: { author: { select: { id: true, name: true, email: true } } },
      orderBy: { publishedAt: 'desc' },
    });
    return filterValidDates(articles) as NewsArticleWithAuthor[];
  } catch (error) {
    console.error('Error fetching news articles:', error);
    if (error instanceof Error && error.message.includes('Invalid time value')) {
      console.error('⚠️  Invalid dates detected in database. Run: npm run fix:dates');
      return [];
    }
    throw error;
  }
}

/** Get all news articles including unpublished (admin access) */
export async function getAllNewsArticles(includeUnpublished = false): Promise<NewsArticleWithAuthor[]> {
  const where = includeUnpublished ? {} : { published: true };

  try {
    const articles = await prisma.newsArticle.findMany({
      where,
      include: { author: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return filterValidDates(articles) as NewsArticleWithAuthor[];
  } catch (error) {
    console.error('Error fetching all news articles:', error);
    if (error instanceof Error && error.message.includes('Invalid time value')) {
      console.error('⚠️  Invalid dates detected. Run: npm run fix:dates');
      return [];
    }
    throw error;
  }
}

/** Bounded admin list query. Keep article content out of list responses. */
export async function getAdminNewsPage(options: {
  page: number;
  limit: number;
  query?: string;
  status?: string;
  category?: string;
  authorId?: string;
  sort?: string;
}) {
  const { page, limit, query, status, category, authorId, sort } = options;
  const where: any = {};
  const trimmedQuery = query?.trim();
  if (trimmedQuery) {
    where.AND = [{ OR: [
      { title: { contains: trimmedQuery } },
      { slug: { contains: trimmedQuery } },
      { author: { name: { contains: trimmedQuery } } },
    ] }];
  }
  if (category && category !== 'all') where.category = category;
  if (authorId && authorId !== 'all') where.authorId = authorId;
  if (status === 'published') where.published = true;
  if (status === 'draft') where.published = false;
  if (status === 'scheduled') {
    where.published = false;
    where.publishedAt = { gt: new Date() };
  }

  const orderBy = sort === 'title' ? { title: 'asc' as const } : { createdAt: sort === 'oldest' ? 'asc' as const : 'desc' as const };
  const [rows, total, categories, authors, counts] = await Promise.all([
    prisma.newsArticle.findMany({
      where,
      select: {
        id: true, title: true, slug: true, excerpt: true, category: true, image: true,
        published: true, publishedAt: true, createdAt: true, updatedAt: true, feature: true,
        author: { select: { id: true, name: true, email: true } },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.newsArticle.count({ where }),
    prisma.newsArticle.findMany({ distinct: ['category'], select: { category: true }, orderBy: { category: 'asc' } }),
    prisma.user.findMany({ where: { newsArticles: { some: {} } }, distinct: ['id'], select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    Promise.all([
      prisma.newsArticle.count({ where: { ...where, published: true } }),
      prisma.newsArticle.count({ where: { ...where, published: false, publishedAt: null } }),
      prisma.newsArticle.count({ where: { ...where, published: false, publishedAt: { gt: new Date() } } }),
    ]),
  ]);

  const ids = rows.map((row) => row.id);
  const commentRows = ids.length ? await prisma.comment.groupBy({ by: ['articleId'], _count: { id: true }, where: { articleId: { in: ids }, approved: true } }) : [];
  const commentCounts = new Map(commentRows.map((row) => [row.articleId, row._count.id]));
  return {
    items: rows.map((row) => ({ ...row, commentsCount: commentCounts.get(row.id) || 0 })),
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    page,
    limit,
    categories: categories.map((row) => row.category),
    authors,
    counts: { published: counts[0], draft: counts[1], scheduled: counts[2] },
  };
}

export async function getNewsArticleById(id: string): Promise<NewsArticleWithAuthor | null> {
  const article = await prisma.newsArticle.findUnique({
    where: { id },
    include: { author: { select: { id: true, name: true, email: true } } },
  });
  return article as NewsArticleWithAuthor | null;
}

export async function getNewsArticleBySlug(slug: string): Promise<NewsArticleWithAuthor | null> {
  const article = await prisma.newsArticle.findUnique({
    where: { slug },
    include: { author: { select: { id: true, name: true, email: true } } },
  });
  return article as NewsArticleWithAuthor | null;
}

/** Get featured published news articles — max 5 */
export async function getFeaturedNewsArticles(): Promise<NewsArticleWithAuthor[]> {
  try {
    const articles = await prisma.newsArticle.findMany({
      where: { published: true, feature: true },
      include: { author: { select: { id: true, name: true, email: true } } },
      orderBy: { publishedAt: 'desc' },
      take: 5,
    });
    return filterValidDates(articles) as NewsArticleWithAuthor[];
  } catch (error) {
    console.error('Error fetching featured news articles:', error);
    if (error instanceof Error && error.message.includes('Invalid time value')) {
      console.error('⚠️  Invalid dates detected. Run: npm run fix:dates');
      return [];
    }
    throw error;
  }
}
