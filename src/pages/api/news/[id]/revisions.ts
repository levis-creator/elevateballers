import type { APIRoute } from 'astro';
import { prisma } from '../../../../lib/prisma';
import { requirePermission } from '../../../../features/rbac/middleware';
import { getUserIdFromRequest } from '../../../../features/cms/lib/auth';
import { handleApiError } from '../../../../lib/apiError';

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'news_articles:read');
    const revisions = await prisma.newsArticleRevision.findMany({ where: { articleId: params.id! }, include: { changedBy: { select: { name: true } } }, orderBy: { version: 'desc' } });
    return new Response(JSON.stringify(revisions), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) { return handleApiError(error, 'fetch article revisions', request); }
};

export const POST: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'news_articles:update');
    const revision = await prisma.newsArticleRevision.findUnique({ where: { id: (await request.json()).revisionId } });
    if (!revision || revision.articleId !== params.id) return new Response(JSON.stringify({ error: 'Revision not found' }), { status: 404 });
    const restored = await prisma.newsArticle.update({ where: { id: params.id! }, data: { title: revision.title, slug: revision.slug, content: revision.content, excerpt: revision.excerpt, category: revision.category, image: revision.image, published: revision.published, feature: revision.feature, publishedAt: revision.publishedAt } });
    const userId = getUserIdFromRequest(request);
    const latest = await prisma.newsArticleRevision.findFirst({ where: { articleId: params.id! }, orderBy: { version: 'desc' } });
    await prisma.newsArticleRevision.create({ data: { articleId: restored.id, version: (latest?.version ?? 0) + 1, title: restored.title, slug: restored.slug, content: restored.content, excerpt: restored.excerpt, category: restored.category, image: restored.image, published: restored.published, feature: restored.feature, publishedAt: restored.publishedAt, changedById: userId, changeNote: `Restored revision ${revision.version}` } });
    return new Response(JSON.stringify(restored), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) { return handleApiError(error, 'restore article revision', request); }
};
