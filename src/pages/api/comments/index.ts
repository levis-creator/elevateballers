import type { APIRoute } from 'astro';
import { getArticleComments, getAllArticleComments } from '../../../features/contact/lib/queries/comments';
import { createComment } from '../../../features/contact/lib/mutations/comments';
import { requirePermission } from '../../../features/rbac/domain/usecases/middleware';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const articleId = url.searchParams.get('articleId');
    const admin = url.searchParams.get('admin') === 'true';

    if (!articleId) {
      return new Response(JSON.stringify({ error: 'articleId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let comments;

    // Admin access returns all comments (including unapproved)
    if (admin) {
      await requirePermission(request, 'comments:create');
      comments = await getAllArticleComments(articleId);
    } else {
      // Public access only returns approved comments
      comments = await getArticleComments(articleId);
    }

    return new Response(JSON.stringify(comments), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'fetch comments', request);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();

    // Validate required fields (only content and articleId are required)
    if (!data.content || !data.articleId) {
      return new Response(
        JSON.stringify({ error: 'Content and articleId are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Basic spam prevention - check content length
    if (data.content.length < 3) {
      return new Response(JSON.stringify({ error: 'Comment is too short' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (data.content.length > 5000) {
      return new Response(JSON.stringify({ error: 'Comment is too long' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate email format if provided
    if (data.authorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.authorEmail)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const comment = await createComment({
      content: data.content.trim(),
      authorName: data.authorName?.trim() || undefined, // Optional - allows anonymous
      authorEmail: data.authorEmail?.trim(),
      authorUrl: data.authorUrl?.trim(),
      articleId: data.articleId,
      userId: data.userId, // Optional - for logged-in users
      parentId: data.parentId, // Optional - for replies
    });

    return new Response(JSON.stringify(comment), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'create comment', request);
  }
};

