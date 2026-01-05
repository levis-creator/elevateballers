import { H as getTeamById } from '../../../chunks/queries_vvMOn9ut.mjs';
import { Q as updateTeam, R as deleteTeam } from '../../../chunks/mutations_CnOGsUyk.mjs';
import { r as requireAdmin } from '../../../chunks/auth_DQR-8pbN.mjs';
import { p as prisma } from '../../../chunks/prisma_sB1uhqJV.mjs';
export { renderers } from '../../../renderers.mjs';

const prerender = false;
const GET = async ({ params, request }) => {
  try {
    let includeUnapproved = false;
    try {
      await requireAdmin(request);
      includeUnapproved = true;
    } catch {
      includeUnapproved = false;
    }
    const team = await getTeamById(params.id, includeUnapproved);
    if (!team) {
      return new Response(JSON.stringify({ error: "Team not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(team), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching team:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch team" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const PUT = async ({ params, request }) => {
  try {
    await requireAdmin(request);
    const data = await request.json();
    if (data.name) {
      const existing = await prisma.team.findFirst({
        where: {
          name: data.name,
          id: { not: params.id }
        },
        select: {
          id: true,
          name: true
        }
      });
      if (existing) {
        return new Response(JSON.stringify({ error: "A team with this name already exists" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    const team = await updateTeam(params.id, data);
    if (!team) {
      return new Response(JSON.stringify({ error: "Team not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(team), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error updating team:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to update team" }),
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
    const success = await deleteTeam(params.id);
    if (!success) {
      return new Response(JSON.stringify({ error: "Failed to delete team" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting team:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to delete team" }),
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
