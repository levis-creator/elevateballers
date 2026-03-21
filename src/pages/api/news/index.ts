import type { APIRoute } from 'astro';
import { getNewsArticles, getAllNewsArticles, getFeaturedNewsArticles, getArticleCommentCount } from '../../../features/cms/lib/queries';
import { createNewsArticle, generateSlug } from '../../../features/cms/lib/mutations';
import { requirePermission } from '../../../features/rbac/middleware';
import { categoryMap, type NewsArticleDTO } from '../../../features/cms/types';
import { writeAuditLog } from '../../../features/cms/lib/auth';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;
import { prisma } from '../../../lib/prisma';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category') || 'All';
    const admin = url.searchParams.get('admin') === 'true';
    const featured = url.searchParams.get('featured') === 'true';
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    let articles;

    // Admin access requires authentication and returns all articles (including unpublished)
    if (admin) {
      await requirePermission(request, 'news_articles:create');
      articles = await getAllNewsArticles(true);
    }
    // Featured articles endpoint - public access, only returns published featured articles
    else if (featured) {
      articles = await getFeaturedNewsArticles();
    }
    // Regular public endpoint - only returns published articles
    else {
      articles = await getNewsArticles(category);
    }

    // Apply limit if specified
    if (limit && limit > 0) {
      articles = articles.slice(0, limit);
    }

    // Optimized: Fetch all comment counts in a single query if there are articles
    const articleIds = articles.map(a => a.id);
    let countsMap: Record<string, number> = {};

    if (articleIds.length > 0) {
      const counts = await prisma.comment.groupBy({
        by: ['articleId'],
        _count: {
          id: true,
        },
        where: {
          articleId: {
            in: articleIds,
          },
          approved: true,
        },
      });

      countsMap = Object.fromEntries(
        counts.map(c => [c.articleId, c._count.id])
      );
    }

    const articlesWithComments: NewsArticleDTO[] = articles.map((article) => ({
      ...article,
      commentsCount: countsMap[article.id] || 0,
    } as NewsArticleDTO));

    return new Response(JSON.stringify(articlesWithComments), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // Handle invalid date errors specifically — return empty array instead of crashing
    if (error instanceof Error &&
      (error.message.includes('Invalid time value') ||
        error.message.includes('RangeError'))) {
      console.error('⚠️  Invalid dates detected in database. Run: npm run fix:dates');
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return handleApiError(error, 'fetch articles', request);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const user = await requirePermission(request, 'news_articles:create');
    const data = await request.json();

    // Validate required fields
    if (!data.title || !data.content || !data.category) {
      return new Response(
        JSON.stringify({ error: 'Title, content, and category are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate slug if not provided
    const slug = data.slug || generateSlug(data.title);

    // Check if slug already exists
    const existing = await prisma.newsArticle.findUnique({
      where: { slug },
    });

    if (existing) {
      return new Response(JSON.stringify({ error: 'An article with this slug already exists' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Map category from frontend format to Prisma enum
    const category = categoryMap[data.category] || data.category;

    // Log content for verification
    console.log('Creating article with content:', {
      contentLength: data.content?.length || 0,
      contentPreview: data.content?.substring(0, 200) + '...',
      hasHTML: data.content?.includes('<') || false,
    });

    const article = await createNewsArticle({
      title: data.title,
      slug,
      content: data.content,
      excerpt: data.excerpt,
      category,
      image: data.image,
      published: data.published || false,
      feature: data.feature || false,
      publishedAt: data.publishedAt ? new Date(data.publishedAt) : undefined,
      authorId: user.id,
    });

    await writeAuditLog(user.id, 'NEWS_ARTICLE_CREATED', user.id, {
      articleId: article.id,
      title: article.title,
      published: article.published,
    }).catch(() => {});

    // Verify content was stored
    console.log('Article created successfully:', {
      id: article.id,
      title: article.title,
      storedContentLength: article.content?.length || 0,
    });

    return new Response(JSON.stringify(article), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'create article', request);
  }
};
