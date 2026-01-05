import { f as getMatchEventById } from '../../../../../chunks/queries_E6Jl_Myi.mjs';
import { g as updateMatchEvent, h as deleteMatchEvent } from '../../../../../chunks/mutations_BV82jF-A.mjs';
import { a as requireAuth } from '../../../../../chunks/auth_CrN9ezVw.mjs';
export { renderers } from '../../../../../renderers.mjs';

const GET = async ({ params }) => {
  const id = params.id;
  if (!id) {
    return new Response(JSON.stringify({ error: "Event ID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const matchEvent = await getMatchEventById(id);
    if (!matchEvent) {
      return new Response(JSON.stringify({ error: "Match event not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(matchEvent), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching match event:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch match event" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const PUT = async ({ params, request }) => {
  try {
    await requireAuth(request);
  } catch (error) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  const id = params.id;
  if (!id) {
    return new Response(JSON.stringify({ error: "Event ID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const body = await request.json();
    const matchEvent = await updateMatchEvent(id, body);
    if (!matchEvent) {
      return new Response(JSON.stringify({ error: "Failed to update match event" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(matchEvent), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error updating match event:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to update match event" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const DELETE = async ({ params, request }) => {
  try {
    await requireAuth(request);
  } catch (error) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  const id = params.id;
  if (!id) {
    return new Response(JSON.stringify({ error: "Event ID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const success = await deleteMatchEvent(id);
    if (!success) {
      return new Response(JSON.stringify({ error: "Failed to delete match event" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error deleting match event:", error);
    return new Response(JSON.stringify({ error: "Failed to delete match event" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  DELETE,
  GET,
  PUT
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
