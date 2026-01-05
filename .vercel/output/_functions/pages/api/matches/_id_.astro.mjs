import { n as getMatchWithFullDetails, o as getMatchById } from '../../../chunks/queries_E6Jl_Myi.mjs';
import { m as updateMatch, n as deleteMatch } from '../../../chunks/mutations_BV82jF-A.mjs';
import { r as requireAdmin } from '../../../chunks/auth_CrN9ezVw.mjs';
export { renderers } from '../../../renderers.mjs';

const prerender = false;
const GET = async ({ params, url }) => {
  try {
    const includeDetails = url.searchParams.get("includeDetails") === "true";
    let match;
    if (includeDetails) {
      console.log(`Fetching match ${params.id} with full details...`);
      match = await getMatchWithFullDetails(params.id);
      console.log(`Match fetched:`, match ? "Found" : "Not found");
    } else {
      match = await getMatchById(params.id);
    }
    if (!match) {
      return new Response(JSON.stringify({ error: "Match not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(match), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching match:", error);
    console.error("Error stack:", error.stack);
    return new Response(JSON.stringify({
      error: "Failed to fetch match",
      details: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const PUT = async ({ params, request }) => {
  try {
    await requireAdmin(request);
    const data = await request.json();
    if (data.date) {
      data.date = new Date(data.date);
    }
    if (data.stage !== void 0) {
      if (data.stage === "__none" || data.stage === "" || typeof data.stage === "string" && data.stage.trim() === "") {
        data.stage = void 0;
      }
    }
    const match = await updateMatch(params.id, data);
    if (!match) {
      return new Response(JSON.stringify({ error: "Match not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(match), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error updating match:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to update match" }),
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
    const success = await deleteMatch(params.id);
    if (!success) {
      return new Response(JSON.stringify({ error: "Failed to delete match" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting match:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to delete match" }),
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
