import type { APIRoute } from 'astro';
import { getNewsArticleById } from '../../../features/cms/lib/queries';
import { updateNewsArticle, deleteNewsArticle, generateSlug } from '../../../features/cms/lib/mutations';
import { requireAdmin } from '../../../features/cms/lib/auth';
import { categoryMap } from '../../../features/cms/types';

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
    console.error('Error fetching news article:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch article' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    await requireAdmin(request);
    const data = await request.json();

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

    return new Response(JSON.stringify(article), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error updating news article:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to update article' }),
      {
        status: error.message === 'Unauthorized' || error.message.includes('Forbidden') ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    await requireAdmin(request);
    const success = await deleteNewsArticle(params.id!);

    if (!success) {
      return new Response(JSON.stringify({ error: 'Failed to delete article' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(null, { status: 204 });
  } catch (error: any) {
    console.error('Error deleting news article:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to delete article' }),
      {
        status: error.message === 'Unauthorized' || error.message.includes('Forbidden') ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

