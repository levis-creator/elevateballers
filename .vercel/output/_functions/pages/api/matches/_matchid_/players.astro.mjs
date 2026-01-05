import { l as getMatchPlayersByTeam, m as getMatchPlayers } from '../../../../chunks/queries_E6Jl_Myi.mjs';
import { l as createMatchPlayer } from '../../../../chunks/mutations_BV82jF-A.mjs';
import { a as requireAuth } from '../../../../chunks/auth_CrN9ezVw.mjs';
export { renderers } from '../../../../renderers.mjs';

const GET = async ({ params, url, request }) => {
  const matchId = params.matchId;
  if (!matchId) {
    return new Response(JSON.stringify({ error: "Match ID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const teamId = url.searchParams.get("teamId");
    let players;
    if (teamId) {
      players = await getMatchPlayersByTeam(matchId, teamId);
    } else {
      players = await getMatchPlayers(matchId);
    }
    return new Response(JSON.stringify(players), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching match players:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch match players" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const POST = async ({ params, request }) => {
  try {
    await requireAuth(request);
  } catch (error) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  const matchId = params.matchId;
  if (!matchId) {
    return new Response(JSON.stringify({ error: "Match ID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const body = await request.json();
    const matchPlayer = await createMatchPlayer({
      ...body,
      matchId
    });
    if (!matchPlayer) {
      return new Response(JSON.stringify({ error: "Failed to create match player" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(matchPlayer), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error creating match player:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to create match player" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
