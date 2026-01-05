import { w as getPageContentBySlug, x as getAllPageContents } from '../../chunks/queries_vvMOn9ut.mjs';
import { z as createPageContent } from '../../chunks/mutations_CnOGsUyk.mjs';
import { r as requireAdmin } from '../../chunks/auth_DQR-8pbN.mjs';
export { renderers } from '../../renderers.mjs';

const prerender = false;
const GET = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get("slug");
    const admin = url.searchParams.get("admin") === "true";
    if (slug) {
      const page = await getPageContentBySlug(slug);
      if (!page) {
        return new Response(JSON.stringify({ error: "Page not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
      }
      if (!admin && !page.published) {
        return new Response(JSON.stringify({ error: "Page not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
      }
      return new Response(JSON.stringify(page), {
        headers: { "Content-Type": "application/json" }
      });
    }
    if (!admin) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const pages = await getAllPageContents();
    return new Response(JSON.stringify(pages), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching pages:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch pages" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const POST = async ({ request }) => {
  try {
    await requireAdmin(request);
    const data = await request.json();
    if (!data.slug || !data.title || !data.content) {
      return new Response(
        JSON.stringify({ error: "Slug, title, and content are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const page = await createPageContent({
      slug: data.slug,
      title: data.title,
      content: data.content,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      published: data.published !== void 0 ? data.published : true
    });
    return new Response(JSON.stringify(page), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error creating page:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to create page" }),
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
