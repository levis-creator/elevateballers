import { g as getFilteredMatches } from '../../chunks/queries_WVd1Mo-o.mjs';
import { o as createMatch } from '../../chunks/mutations_CnOGsUyk.mjs';
import { r as requireAdmin } from '../../chunks/auth_DQR-8pbN.mjs';
export { renderers } from '../../renderers.mjs';

const prerender = false;
const OPTIONS = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
};
const GET = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const filter = {};
    const statusParam = url.searchParams.get("status");
    if (statusParam) {
      const statusUpper = statusParam.toUpperCase();
      if (["UPCOMING", "LIVE", "COMPLETED"].includes(statusUpper)) {
        filter.status = statusUpper;
      }
    }
    const stageParam = url.searchParams.get("stage");
    if (stageParam) {
      const stageNormalized = stageParam.toUpperCase().replace(/-/g, "_");
      const validStages = [
        "REGULAR_SEASON",
        "PRESEASON",
        "EXHIBITION",
        "PLAYOFF",
        "QUARTER_FINALS",
        "SEMI_FINALS",
        "CHAMPIONSHIP",
        "QUALIFIER",
        "OTHER"
      ];
      if (validStages.includes(stageNormalized)) {
        filter.stage = stageNormalized;
      }
    }
    const leagueParam = url.searchParams.get("league");
    const leagueIdParam = url.searchParams.get("leagueId");
    if (leagueIdParam) {
      filter.leagueId = leagueIdParam;
    } else if (leagueParam) {
      filter.league = leagueParam;
    }
    const dateFromParam = url.searchParams.get("dateFrom");
    const dateToParam = url.searchParams.get("dateTo");
    if (dateFromParam) {
      filter.dateFrom = new Date(dateFromParam);
    }
    if (dateToParam) {
      filter.dateTo = new Date(dateToParam);
    }
    const searchParam = url.searchParams.get("search");
    if (searchParam) {
      filter.search = searchParam;
    }
    const sortParam = url.searchParams.get("sort") || "date-asc";
    const sort = ["date-asc", "date-desc", "league-asc", "league-desc"].includes(sortParam) ? sortParam : "date-asc";
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : void 0;
    const matches = await getFilteredMatches(filter, sort, limit);
    return new Response(JSON.stringify(matches), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  } catch (error) {
    console.error("Error fetching matches:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch matches" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
};
const POST = async ({ request }) => {
  try {
    await requireAdmin(request);
    const data = await request.json();
    if (!data.team1Id && !data.team1Name || !data.team2Id && !data.team2Name || !data.date || !data.leagueId && !data.league) {
      return new Response(
        JSON.stringify({ error: "Teams, date, and league are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const match = await createMatch({
      team1Id: data.team1Id,
      team1Name: data.team1Name,
      team1Logo: data.team1Logo || "",
      team2Id: data.team2Id,
      team2Name: data.team2Name,
      team2Logo: data.team2Logo || "",
      leagueId: data.leagueId,
      league: data.league,
      date: new Date(data.date),
      team1Score: data.team1Score,
      team2Score: data.team2Score,
      status: data.status || "UPCOMING",
      // Only pass stage if it's a valid value (not empty string or __none placeholder)
      stage: data.stage && data.stage !== "__none" && data.stage.trim() !== "" ? data.stage : void 0
    });
    return new Response(JSON.stringify(match), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error creating match:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to create match" }),
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
  OPTIONS,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
