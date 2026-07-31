import type { APIRoute } from 'astro';
import { getNewsArticleById } from '../../../features/cms/lib/queries';
import { updateNewsArticle, deleteNewsArticle, generateSlug } from '../../../features/cms/lib/mutations';
import { requirePermission } from '../../../features/rbac/middleware';
import { categoryMap } from '../../../features/cms/types';
import { getUserIdFromRequest, writeAuditLog } from '../../../features/cms/lib/auth';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;
import { prisma } from '../../../lib/prisma';

export const GET: APIRoute = async ({ params }) => {
  try {
    const article = await getNewsArticleById(params.id!);

    if (!article) {
      return new Response(JSON.stringify({ error: 'Article not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(article), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'fetch article', request);
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'news_articles:update');
    const data = await request.json();
    const current = await prisma.newsArticle.findUnique({ where: { id: params.id! } });
    if (current) {
      const latest = await prisma.newsArticleRevision.findFirst({ where: { articleId: current.id }, orderBy: { version: 'desc' } });
      const changedById = getUserIdFromRequest(request);
      await prisma.newsArticleRevision.create({ data: { articleId: current.id, version: (latest?.version ?? 0) + 1, title: current.title, slug: current.slug, content: current.content, excerpt: current.excerpt, category: current.category, image: current.image, tags: current.tags ?? undefined, leagueSeasonId: current.leagueSeasonId, published: current.published, feature: current.feature, publishedAt: current.publishedAt, changedById, changeNote: data.changeNote || 'Article updated' } });
    }

    // If slug is being updated, check if it's unique
    if (data.slug) {
      const existing = await prisma.newsArticle.findFirst({
        where: {
          slug: data.slug,
          id: { not: params.id! },
        },
      });

      if (existing) {
        return new Response(JSON.stringify({ error: 'An article with this slug already exists' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Generate slug from title if title changed and slug not provided
    if (data.title && !data.slug) {
      data.slug = generateSlug(data.title);
    }

    // Map category if provided
    if (data.category && categoryMap[data.category]) {
      data.category = categoryMap[data.category];
    }

    // Convert publishedAt to Date if provided
    if (data.publishedAt) {
      data.publishedAt = new Date(data.publishedAt);
    }

    const article = await updateNewsArticle(params.id!, data);

    if (!article) {
      return new Response(JSON.stringify({ error: 'Article not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const adminId = getUserIdFromRequest(request) ?? 'unknown';
    await writeAuditLog(adminId, 'NEWS_ARTICLE_UPDATED', adminId, {
      articleId: article.id,
      title: article.title,
      published: article.published,
    }).catch(() => {});

    return new Response(JSON.stringify(article), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'update article', request);
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'news_articles:update');
    const success = await deleteNewsArticle(params.id!);

    if (!success) {
      return new Response(JSON.stringify({ error: 'Failed to delete article' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const adminId = getUserIdFromRequest(request) ?? 'unknown';
    await writeAuditLog(adminId, 'NEWS_ARTICLE_DELETED', adminId, {
      articleId: params.id,
    }).catch(() => {});

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error, 'delete article', request);
  }
};
