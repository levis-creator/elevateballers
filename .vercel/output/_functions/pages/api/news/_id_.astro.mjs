import { g as getNewsArticleById } from '../../../chunks/queries_E6Jl_Myi.mjs';
import { t as updateNewsArticle, v as deleteNewsArticle } from '../../../chunks/mutations_BV82jF-A.mjs';
import { r as requireAdmin } from '../../../chunks/auth_CrN9ezVw.mjs';
import { c as categoryMap } from '../../../chunks/types_DXfYTmyI.mjs';
import { p as prisma } from '../../../chunks/prisma_Cvn-nyRW.mjs';
import { g as generateSlug } from '../../../chunks/utils_AjT2vheH.mjs';
export { renderers } from '../../../renderers.mjs';

const prerender = false;
const GET = async ({ params }) => {
  try {
    const article = await getNewsArticleById(params.id);
    if (!article) {
      return new Response(JSON.stringify({ error: "Article not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(article), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching news article:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch article" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const PUT = async ({ params, request }) => {
  try {
    await requireAdmin(request);
    const data = await request.json();
    if (data.slug) {
      const existing = await prisma.newsArticle.findFirst({
        where: {
          slug: data.slug,
          id: { not: params.id }
        }
      });
      if (existing) {
        return new Response(JSON.stringify({ error: "An article with this slug already exists" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    if (data.title && !data.slug) {
      data.slug = generateSlug(data.title);
    }
    if (data.category && categoryMap[data.category]) {
      data.category = categoryMap[data.category];
    }
    if (data.publishedAt) {
      data.publishedAt = new Date(data.publishedAt);
    }
    const article = await updateNewsArticle(params.id, data);
    if (!article) {
      return new Response(JSON.stringify({ error: "Article not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(article), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error updating news article:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to update article" }),
      {
        status: error.message === "Unauthorized" || error.message.includes("Forbidden") ? 401 : 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
const DELETE = async ({ params, request }) => {
  try {
    await requireAdmin(request);
    const success = await deleteNewsArticle(params.id);
    if (!success) {
      return new Response(JSON.stringify({ error: "Failed to delete article" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting news article:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to delete article" }),
      {
        status: error.message === "Unauthorized" || error.message.includes("Forbidden") ? 401 : 500,
        headers: { "Content-Type": "application/json" }
      }
    );
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
