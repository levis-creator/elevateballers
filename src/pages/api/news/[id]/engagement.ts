import type { APIRoute } from 'astro';
import { prisma } from '../../../../lib/prisma';
import { requirePermission } from '../../../../features/rbac/middleware';
import { handleApiError } from '../../../../lib/apiError';

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'news_articles:read');
    const grouped = await prisma.newsArticleEvent.groupBy({ where: { articleId: params.id! }, by: ['type'], _count: { id: true } });
    return new Response(JSON.stringify(Object.fromEntries(grouped.map((row) => [row.type.toLowerCase(), row._count.id]))), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) { return handleApiError(error, 'fetch article engagement', request); }
};

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const data = await request.json();
    const allowed = ['VIEW', 'SHARE', 'COPY_LINK', 'COMMENT'] as const;
    if (!allowed.includes(data.type)) return new Response(JSON.stringify({ error: 'Invalid event type' }), { status: 400 });
    await prisma.newsArticleEvent.create({ data: { articleId: params.id!, type: data.type, sessionId: data.sessionId?.slice(0, 191) } });
    return new Response(JSON.stringify({ ok: true }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (error) { return handleApiError(error, 'record article engagement', request); }
};
