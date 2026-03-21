import { prisma } from '../../../../../lib/prisma';
import type { NewsArticleWithAuthor } from '../../../types';
import { categoryMap } from '../../../types';

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
