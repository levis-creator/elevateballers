import type { APIRoute } from 'astro';
import { getCommentById } from '../../../features/contact/lib/queries/comments';
import { updateComment, deleteComment, approveComment, rejectComment } from '../../../features/contact/lib/mutations/comments';
import { requirePermission } from '../../../features/rbac/domain/usecases/middleware';
import { handleApiError } from '../../../lib/apiError';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Comment ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const comment = await getCommentById(id);

    if (!comment) {
      return new Response(JSON.stringify({ error: 'Comment not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(comment), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'fetch comment', request);
  }
};

export const PUT: APIRoute = async ({ request, params }) => {
  try {
    await requirePermission(request, 'comments:update');
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Comment ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await request.json();

    // Check if this is an approve/reject action
    if (data.action === 'approve') {
      const comment = await approveComment(id);
      if (!comment) {
        return new Response(JSON.stringify({ error: 'Failed to approve comment' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify(comment), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (data.action === 'reject') {
      const comment = await rejectComment(id);
      if (!comment) {
        return new Response(JSON.stringify({ error: 'Failed to reject comment' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify(comment), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Regular update
    const comment = await updateComment(id, {
      content: data.content,
      approved: data.approved,
    });

    if (!comment) {
      return new Response(JSON.stringify({ error: 'Comment not found or update failed' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(comment), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'update comment', request);
  }
};

export const DELETE: APIRoute = async ({ request, params }) => {
  try {
    await requirePermission(request, 'comments:update');
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Comment ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const success = await deleteComment(id);

    if (!success) {
      return new Response(JSON.stringify({ error: 'Failed to delete comment' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error, 'delete comment', request);
  }
};

