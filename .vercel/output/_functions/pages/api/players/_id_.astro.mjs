import { y as getPlayerById } from '../../../chunks/queries_vvMOn9ut.mjs';
import { A as updatePlayer, B as deletePlayer } from '../../../chunks/mutations_CnOGsUyk.mjs';
import { r as requireAdmin } from '../../../chunks/auth_DQR-8pbN.mjs';
export { renderers } from '../../../renderers.mjs';

const prerender = false;
const GET = async ({ params }) => {
  try {
    const player = await getPlayerById(params.id);
    if (!player) {
      return new Response(JSON.stringify({ error: "Player not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(player), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching player:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch player" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const PUT = async ({ params, request }) => {
  try {
    await requireAdmin(request);
    const data = await request.json();
    if (data.jerseyNumber !== void 0) {
      data.jerseyNumber = data.jerseyNumber ? parseInt(data.jerseyNumber) : null;
    }
    if (data.teamId === "") {
      data.teamId = void 0;
    }
    const player = await updatePlayer(params.id, data);
    if (!player) {
      return new Response(JSON.stringify({ error: "Player not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(player), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error updating player:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to update player" }),
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
    const success = await deletePlayer(params.id);
    if (!success) {
      return new Response(JSON.stringify({ error: "Failed to delete player" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting player:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to delete player" }),
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
