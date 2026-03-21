import { prisma } from '../../../../../lib/prisma';
import { generateSlug } from '../../../domain/usecases/utils';
import type {
  CreateNewsArticleInput,
  UpdateNewsArticleInput,
  NewsArticleWithAuthor,
} from '../../../types';

// Re-export generateSlug for backward compatibility (server-side only)
export { generateSlug } from '../../../domain/usecases/utils';

/**
 * Helper: ensures at most 5 featured published articles exist.
 * If over the limit, unfeatures the oldest one.
 */
async function manageFeaturedLimit(excludeArticleId?: string): Promise<void> {
  const MAX_FEATURED = 5;

  const whereClause: any = { published: true, feature: true };
  if (excludeArticleId) {
    whereClause.id = { not: excludeArticleId };
  }

  const featuredCount = await prisma.newsArticle.count({ where: whereClause });

  if (featuredCount >= MAX_FEATURED) {
    const allFeatured = await prisma.newsArticle.findMany({
      where: whereClause,
      select: { id: true, title: true, publishedAt: true, createdAt: true },
    });

    const sortedFeatured = allFeatured.sort((a, b) => {
      if (a.publishedAt && b.publishedAt) return a.publishedAt.getTime() - b.publishedAt.getTime();
      if (a.publishedAt && !b.publishedAt) return -1;
      if (!a.publishedAt && b.publishedAt) return 1;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    const oldest = sortedFeatured[0];
    if (oldest) {
      await prisma.newsArticle.update({ where: { id: oldest.id }, data: { feature: false } });
      console.log(`Automatically unfeatured oldest article: "${oldest.title}" (ID: ${oldest.id})`);
    }
  }
}

export async function createNewsArticle(data: CreateNewsArticleInput): Promise<NewsArticleWithAuthor> {
  if (data.feature === true && data.published === true) {
    await manageFeaturedLimit();
  }

  const article = await prisma.newsArticle.create({
    data: {
      ...data,
      publishedAt: data.published ? (data.publishedAt || new Date()) : null,
    },
    include: {
      author: { select: { id: true, name: true, email: true } },
    },
  });

  if (article.image) {
    try {
      const { trackFileUsageByUrl } = await import('../../../../../lib/file-usage');
      await trackFileUsageByUrl(article.image, 'NEWS_ARTICLE', article.id, 'image');
    } catch (error) {
      console.warn('Failed to track file usage for news article image:', error);
    }
  }

  return article as NewsArticleWithAuthor;
}

export async function updateNewsArticle(
  id: string,
  data: UpdateNewsArticleInput
): Promise<NewsArticleWithAuthor | null> {
  const updateData: any = { ...data };

  if (data.published === true) {
    updateData.publishedAt = data.publishedAt || new Date();
  } else if (data.published === false) {
    updateData.publishedAt = null;
  }

  const willBeFeatured = data.feature === true;
  const willBePublished = data.published === true || data.published === undefined;

  const currentArticle = await prisma.newsArticle.findUnique({
    where: { id },
    select: { published: true, feature: true },
  });

  const isCurrentlyPublished = currentArticle?.published ?? false;
  const isCurrentlyFeatured = currentArticle?.feature ?? false;

  if (willBeFeatured && (willBePublished || isCurrentlyPublished) && !isCurrentlyFeatured) {
    await manageFeaturedLimit(id);
  }

  const existing = await prisma.newsArticle.findUnique({ where: { id }, select: { image: true } });

  const article = await prisma.newsArticle.update({
    where: { id },
    data: updateData,
    include: { author: { select: { id: true, name: true, email: true } } },
  });

  if (data.image !== undefined && data.image !== existing?.image) {
    try {
      const { updateFileUsageOnChange } = await import('../../../../../lib/file-usage');
      await updateFileUsageOnChange(existing?.image || '', data.image || '', 'NEWS_ARTICLE', id, 'image');
    } catch (error) {
      console.warn('Failed to track file usage for news article image update:', error);
    }
  }

  return article as NewsArticleWithAuthor;
}

export async function deleteNewsArticle(id: string): Promise<boolean> {
  try {
    await prisma.newsArticle.delete({ where: { id } });
    return true;
  } catch (error) {
    console.error('Error deleting news article:', error);
    return false;
  }
}
