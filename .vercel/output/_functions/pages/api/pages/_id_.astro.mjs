import { v as getPageContentById } from '../../../chunks/queries_E6Jl_Myi.mjs';
import { x as updatePageContent, y as deletePageContent } from '../../../chunks/mutations_BV82jF-A.mjs';
import { r as requireAdmin } from '../../../chunks/auth_CrN9ezVw.mjs';
export { renderers } from '../../../renderers.mjs';

const prerender = false;
const GET = async ({ params }) => {
  try {
    const page = await getPageContentById(params.id);
    if (!page) {
      return new Response(JSON.stringify({ error: "Page not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(page), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching page:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch page" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const PUT = async ({ params, request }) => {
  try {
    await requireAdmin(request);
    const data = await request.json();
    const page = await updatePageContent(params.id, data);
    if (!page) {
      return new Response(JSON.stringify({ error: "Page not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(page), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error updating page:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to update page" }),
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
    const success = await deletePageContent(params.id);
    if (!success) {
      return new Response(JSON.stringify({ error: "Failed to delete page" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting page:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to delete page" }),
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
