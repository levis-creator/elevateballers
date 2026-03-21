import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';
import { requirePermission } from '../../../features/rbac/middleware';
import { sendArticleNotification } from '../../../lib/email';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    await requirePermission(request, 'subscribers:manage');

    const { articleId } = await request.json();

    if (!articleId) {
      return new Response(JSON.stringify({ error: 'articleId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const article = await prisma.newsArticle.findUnique({
      where: { id: articleId },
      select: { title: true, excerpt: true, slug: true, image: true, published: true },
    });

    if (!article) {
      return new Response(JSON.stringify({ error: 'Article not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!article.published) {
      return new Response(JSON.stringify({ error: 'Article must be published before notifying subscribers' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const subscribers = await prisma.subscriber.findMany({
      where: { active: true },
      select: { email: true, name: true, token: true },
    });

    if (subscribers.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0, message: 'No active subscribers' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { sent, failed } = await sendArticleNotification({ subscribers, article });

    return new Response(JSON.stringify({ ok: true, sent, failed, total: subscribers.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Notify subscribers error:', error);
    return handleApiError(error, 'notify subscribers', request);
  }
};
