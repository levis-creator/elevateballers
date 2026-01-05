import { a as getCommentById } from '../../../chunks/queries_E6Jl_Myi.mjs';
import { a as approveComment, r as rejectComment, u as updateComment, d as deleteComment } from '../../../chunks/mutations_BV82jF-A.mjs';
import { r as requireAdmin } from '../../../chunks/auth_CrN9ezVw.mjs';
export { renderers } from '../../../renderers.mjs';

const prerender = false;
const GET = async ({ params }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: "Comment ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const comment = await getCommentById(id);
    if (!comment) {
      return new Response(JSON.stringify({ error: "Comment not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(comment), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching comment:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch comment" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const PUT = async ({ request, params }) => {
  try {
    await requireAdmin(request);
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: "Comment ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const data = await request.json();
    if (data.action === "approve") {
      const comment2 = await approveComment(id);
      if (!comment2) {
        return new Response(JSON.stringify({ error: "Failed to approve comment" }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
      return new Response(JSON.stringify(comment2), {
        headers: { "Content-Type": "application/json" }
      });
    }
    if (data.action === "reject") {
      const comment2 = await rejectComment(id);
      if (!comment2) {
        return new Response(JSON.stringify({ error: "Failed to reject comment" }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
      return new Response(JSON.stringify(comment2), {
        headers: { "Content-Type": "application/json" }
      });
    }
    const comment = await updateComment(id, {
      content: data.content,
      approved: data.approved
    });
    if (!comment) {
      return new Response(JSON.stringify({ error: "Comment not found or update failed" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(comment), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    console.error("Error updating comment:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to update comment" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
const DELETE = async ({ request, params }) => {
  try {
    await requireAdmin(request);
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: "Comment ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const success = await deleteComment(id);
    if (!success) {
      return new Response(JSON.stringify({ error: "Failed to delete comment" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    console.error("Error deleting comment:", error);
    return new Response(JSON.stringify({ error: "Failed to delete comment" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  DELETE,
  GET,
  PUT,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
