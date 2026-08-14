import type { APIRoute } from 'astro';
import { getArticleComments, getAllArticleComments } from '../../../features/cms/lib/queries';
import { createComment } from '../../../features/cms/lib/mutations';
import { requirePermission } from '../../../features/rbac/middleware';
import { handleApiError } from '../../../lib/apiError';
import { resolvePublicArticlePageSettings, siteSettingsService } from '../../../features/settings';

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
    const settings = resolvePublicArticlePageSettings(await siteSettingsService.list('article').catch(() => []));

    if (!settings.comments) {
      return new Response(JSON.stringify({ error: 'Comments are currently disabled' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (data.parentId && !settings.replies) {
      return new Response(JSON.stringify({ error: 'Replies are currently disabled' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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
      approved: settings.moderation !== 'Hold every comment',
    });

    return new Response(JSON.stringify(comment), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'create comment', request);
  }
};

