import { B as getSeasons } from '../../chunks/queries_vvMOn9ut.mjs';
import { I as createSeason } from '../../chunks/mutations_CnOGsUyk.mjs';
import { r as requireAdmin } from '../../chunks/auth_DQR-8pbN.mjs';
export { renderers } from '../../renderers.mjs';

const prerender = false;
const GET = async ({ url }) => {
  try {
    const activeOnly = url.searchParams.get("activeOnly") === "true";
    const leagueId = url.searchParams.get("leagueId") || void 0;
    const seasons = await getSeasons(activeOnly, leagueId);
    return new Response(JSON.stringify(seasons), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching seasons:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch seasons" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const POST = async ({ request }) => {
  try {
    await requireAdmin(request);
    const data = await request.json();
    if (!data.name || !data.startDate || !data.endDate || !data.leagueId) {
      return new Response(
        JSON.stringify({ error: "Season name, start date, end date, and league ID are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const season = await createSeason(data);
    return new Response(JSON.stringify(season), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error creating season:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to create season" }),
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
