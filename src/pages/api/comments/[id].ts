import type { APIRoute } from 'astro';
import { getCommentById } from '../../../features/cms/lib/queries';
import { updateComment, deleteComment, approveComment, rejectComment } from '../../../features/cms/lib/mutations';
import { requireAdmin } from '../../../features/cms/lib/auth';

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
  } catch (error: any) {
    console.error('Error fetching comment:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch comment' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ request, params }) => {
  try {
    await requireAdmin(request);
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
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message.includes('Forbidden')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.error('Error updating comment:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to update comment' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const DELETE: APIRoute = async ({ request, params }) => {
  try {
    await requireAdmin(request);
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
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message.includes('Forbidden')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.error('Error deleting comment:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete comment' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

