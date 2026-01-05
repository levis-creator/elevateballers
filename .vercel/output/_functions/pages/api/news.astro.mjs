import { r as getAllNewsArticles, s as getFeaturedNewsArticles, t as getNewsArticles, u as getArticleCommentCount } from '../../chunks/queries_E6Jl_Myi.mjs';
import { w as createNewsArticle } from '../../chunks/mutations_BV82jF-A.mjs';
import { r as requireAdmin } from '../../chunks/auth_CrN9ezVw.mjs';
import { c as categoryMap } from '../../chunks/types_DXfYTmyI.mjs';
import { p as prisma } from '../../chunks/prisma_Cvn-nyRW.mjs';
import { g as generateSlug } from '../../chunks/utils_AjT2vheH.mjs';
export { renderers } from '../../renderers.mjs';

const prerender = false;
const GET = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get("category") || "All";
    const admin = url.searchParams.get("admin") === "true";
    const featured = url.searchParams.get("featured") === "true";
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : void 0;
    let articles;
    if (admin) {
      await requireAdmin(request);
      articles = await getAllNewsArticles(true);
    } else if (featured) {
      articles = await getFeaturedNewsArticles();
    } else {
      articles = await getNewsArticles(category);
    }
    if (limit && limit > 0) {
      articles = articles.slice(0, limit);
    }
    const articlesWithComments = await Promise.all(
      articles.map(async (article) => {
        const commentsCount = await getArticleCommentCount(article.id);
        return {
          ...article,
          commentsCount
        };
      })
    );
    return new Response(JSON.stringify(articlesWithComments), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    console.error("Error fetching news articles:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch articles" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const POST = async ({ request }) => {
  try {
    const user = await requireAdmin(request);
    const data = await request.json();
    if (!data.title || !data.content || !data.category) {
      return new Response(
        JSON.stringify({ error: "Title, content, and category are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const slug = data.slug || generateSlug(data.title);
    const existing = await prisma.newsArticle.findUnique({
      where: { slug }
    });
    if (existing) {
      return new Response(JSON.stringify({ error: "An article with this slug already exists" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const category = categoryMap[data.category] || data.category;
    console.log("Creating article with content:", {
      contentLength: data.content?.length || 0,
      contentPreview: data.content?.substring(0, 200) + "...",
      hasHTML: data.content?.includes("<") || false
    });
    const article = await createNewsArticle({
      title: data.title,
      slug,
      content: data.content,
      excerpt: data.excerpt,
      category,
      image: data.image,
      published: data.published || false,
      feature: data.feature || false,
      publishedAt: data.publishedAt ? new Date(data.publishedAt) : void 0,
      authorId: user.id
    });
    console.log("Article created successfully:", {
      id: article.id,
      title: article.title,
      storedContentLength: article.content?.length || 0
    });
    return new Response(JSON.stringify(article), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error creating news article:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to create article" }),
      {
        status: error.message === "Unauthorized" || error.message.includes("Forbidden") ? 401 : 500,
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
