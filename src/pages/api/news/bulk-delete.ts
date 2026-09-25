import type { APIRoute } from 'astro';
import { requirePermission } from '../../../features/rbac/middleware';
import { prisma } from '../../../lib/prisma';
import { handleApiError } from '../../../lib/apiError';
import { logAudit } from '../../../features/cms/lib/audit';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    await requirePermission(request, 'news_articles:bulk_delete');
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return new Response(JSON.stringify({ error: 'IDs array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Titles are read first: once the rows are gone the ids alone say nothing.
    const articles = await prisma.newsArticle.findMany({
      where: { id: { in: ids } },
      select: { id: true, title: true },
    });
    const result = await prisma.newsArticle.deleteMany({
      where: { id: { in: ids } },
    });
    if (result.count)
      logAudit(request, 'NEWS_ARTICLES_BULK_DELETED', { count: result.count, articles });

    return new Response(JSON.stringify({ deleted: result.count }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'bulk delete news articles', request);
  }
};
