import { b as getAllArticleComments, c as getArticleComments } from '../../chunks/queries_vvMOn9ut.mjs';
import { c as createComment } from '../../chunks/mutations_CnOGsUyk.mjs';
import { r as requireAdmin } from '../../chunks/auth_DQR-8pbN.mjs';
export { renderers } from '../../renderers.mjs';

const prerender = false;
const GET = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const articleId = url.searchParams.get("articleId");
    const admin = url.searchParams.get("admin") === "true";
    if (!articleId) {
      return new Response(JSON.stringify({ error: "articleId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    let comments;
    if (admin) {
      await requireAdmin(request);
      comments = await getAllArticleComments(articleId);
    } else {
      comments = await getArticleComments(articleId);
    }
    return new Response(JSON.stringify(comments), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    console.error("Error fetching comments:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch comments" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const POST = async ({ request }) => {
  try {
    const data = await request.json();
    if (!data.content || !data.articleId) {
      return new Response(
        JSON.stringify({ error: "Content and articleId are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    if (data.content.length < 3) {
      return new Response(JSON.stringify({ error: "Comment is too short" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (data.content.length > 5e3) {
      return new Response(JSON.stringify({ error: "Comment is too long" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (data.authorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.authorEmail)) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const comment = await createComment({
      content: data.content.trim(),
      authorName: data.authorName?.trim() || void 0,
      // Optional - allows anonymous
      authorEmail: data.authorEmail?.trim(),
      authorUrl: data.authorUrl?.trim(),
      articleId: data.articleId,
      userId: data.userId,
      // Optional - for logged-in users
      parentId: data.parentId
      // Optional - for replies
    });
    return new Response(JSON.stringify(comment), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to create comment" }),
      {
        status: error.message?.includes("not found") ? 404 : 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
