import { z as getPlayers } from '../../chunks/queries_E6Jl_Myi.mjs';
import { C as createPlayer } from '../../chunks/mutations_BV82jF-A.mjs';
import { r as requireAdmin } from '../../chunks/auth_CrN9ezVw.mjs';
export { renderers } from '../../renderers.mjs';

const prerender = false;
const GET = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const teamId = url.searchParams.get("teamId") || void 0;
    let includeUnapproved = false;
    try {
      await requireAdmin(request);
      includeUnapproved = true;
    } catch {
      includeUnapproved = false;
    }
    const players = await getPlayers(teamId, includeUnapproved);
    return new Response(JSON.stringify(players), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching players:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch players" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const POST = async ({ request }) => {
  try {
    try {
      await requireAdmin(request);
    } catch (authError) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const data = await request.json();
    if (!data.firstName || !data.lastName) {
      return new Response(JSON.stringify({ error: "First name and last name are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const player = await createPlayer({
      firstName: data.firstName,
      lastName: data.lastName,
      height: data.height,
      weight: data.weight,
      image: data.image,
      bio: data.bio,
      teamId: data.teamId || void 0,
      position: data.position,
      jerseyNumber: data.jerseyNumber ? parseInt(data.jerseyNumber) : void 0,
      stats: data.stats
    });
    return new Response(JSON.stringify(player), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error creating player:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to create player" }),
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
