import { h as getMatchEventsByTeam, i as getMatchEventsByType, j as getMatchEvents } from '../../../../chunks/queries_vvMOn9ut.mjs';
import { i as createMatchEvent } from '../../../../chunks/mutations_CnOGsUyk.mjs';
import { a as requireAuth } from '../../../../chunks/auth_DQR-8pbN.mjs';
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
    const eventType = url.searchParams.get("eventType");
    let events;
    if (teamId) {
      events = await getMatchEventsByTeam(matchId, teamId);
    } else if (eventType) {
      events = await getMatchEventsByType(matchId, eventType);
    } else {
      events = await getMatchEvents(matchId);
    }
    return new Response(JSON.stringify(events), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching match events:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch match events" }), {
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
    const matchEvent = await createMatchEvent({
      ...body,
      matchId
    });
    if (!matchEvent) {
      return new Response(JSON.stringify({ error: "Failed to create match event" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(matchEvent), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error creating match event:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to create match event" }), {
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
