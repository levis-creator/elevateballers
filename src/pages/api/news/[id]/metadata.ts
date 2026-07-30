import type { APIRoute } from 'astro';
import { prisma } from '../../../../lib/prisma';
import { requirePermission } from '../../../../features/rbac/middleware';
import { handleApiError } from '../../../../lib/apiError';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  try {
    const metadata = await prisma.newsArticleMetadata.findUnique({ where: { articleId: params.id! } });
    return new Response(JSON.stringify(metadata ?? {}), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) { return handleApiError(error, 'fetch article metadata', new Request('http://localhost')); }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    await requirePermission(request, 'news_articles:update');
    const data = await request.json();
    const metadata = await prisma.newsArticleMetadata.upsert({
      where: { articleId: params.id! },
      create: { articleId: params.id!, ...data },
      update: data,
    });
    return new Response(JSON.stringify(metadata), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) { return handleApiError(error, 'update article metadata', request); }
};
