import { d as getLeagueById } from '../../../chunks/queries_vvMOn9ut.mjs';
import { b as updateLeague, e as deleteLeague } from '../../../chunks/mutations_CnOGsUyk.mjs';
import { r as requireAdmin } from '../../../chunks/auth_DQR-8pbN.mjs';
export { renderers } from '../../../renderers.mjs';

const prerender = false;
const GET = async ({ params }) => {
  try {
    const league = await getLeagueById(params.id);
    if (!league) {
      return new Response(JSON.stringify({ error: "League not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(league), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching league:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch league" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const PUT = async ({ params, request }) => {
  try {
    await requireAdmin(request);
    const data = await request.json();
    if (data.startDate) {
      data.startDate = new Date(data.startDate);
    }
    if (data.endDate) {
      data.endDate = new Date(data.endDate);
    }
    const league = await updateLeague(params.id, data);
    if (!league) {
      return new Response(JSON.stringify({ error: "League not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(league), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error updating league:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to update league" }),
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
    const success = await deleteLeague(params.id);
    if (!success) {
      return new Response(JSON.stringify({ error: "Failed to delete league" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting league:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to delete league" }),
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
