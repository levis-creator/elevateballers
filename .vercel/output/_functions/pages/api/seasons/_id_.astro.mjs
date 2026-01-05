import { A as getSeasonById } from '../../../chunks/queries_E6Jl_Myi.mjs';
import { G as updateSeason, H as deleteSeason } from '../../../chunks/mutations_BV82jF-A.mjs';
import { r as requireAdmin } from '../../../chunks/auth_CrN9ezVw.mjs';
export { renderers } from '../../../renderers.mjs';

const prerender = false;
const GET = async ({ params }) => {
  try {
    const season = await getSeasonById(params.id);
    if (!season) {
      return new Response(JSON.stringify({ error: "Season not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(season), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching season:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch season" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const PUT = async ({ params, request }) => {
  try {
    await requireAdmin(request);
    const data = await request.json();
    const season = await updateSeason(params.id, data);
    if (!season) {
      return new Response(JSON.stringify({ error: "Season not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(season), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error updating season:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to update season" }),
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
    const success = await deleteSeason(params.id);
    if (!success) {
      return new Response(JSON.stringify({ error: "Failed to delete season" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting season:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to delete season" }),
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
