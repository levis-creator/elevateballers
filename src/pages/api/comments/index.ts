import type { APIRoute } from 'astro';
import { getArticleComments, getAllArticleComments } from '../../../features/cms/lib/queries';
import { createComment } from '../../../features/cms/lib/mutations';
import { requireAdmin } from '../../../features/cms/lib/auth';

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
      await requireAdmin(request);
      comments = await getAllArticleComments(articleId);
    } else {
      // Public access only returns approved comments
      comments = await getArticleComments(articleId);
    }

    return new Response(JSON.stringify(comments), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    // Handle authentication errors
    if (error.message === 'Unauthorized' || error.message.includes('Forbidden')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.error('Error fetching comments:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch comments' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
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
  } catch (error: any) {
    console.error('Error creating comment:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create comment' }),
      {
        status: error.message?.includes('not found') ? 404 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

