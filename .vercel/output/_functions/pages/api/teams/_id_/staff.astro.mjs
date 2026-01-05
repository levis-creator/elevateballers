import { G as getStaffByTeam, H as getTeamById } from '../../../../chunks/queries_vvMOn9ut.mjs';
import { F as assignStaffToTeam, O as updateTeamStaff, P as removeStaffFromTeam } from '../../../../chunks/mutations_CnOGsUyk.mjs';
import { r as requireAdmin } from '../../../../chunks/auth_DQR-8pbN.mjs';
export { renderers } from '../../../../renderers.mjs';

const prerender = false;
const GET = async ({ params }) => {
  try {
    const teamStaff = await getStaffByTeam(params.id);
    return new Response(JSON.stringify(teamStaff), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching team staff:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch team staff" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const POST = async ({ params, request }) => {
  try {
    await requireAdmin(request);
    const data = await request.json();
    if (!data.staffId || !data.role) {
      return new Response(JSON.stringify({ error: "Staff ID and role are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const team = await getTeamById(params.id, true);
    if (!team) {
      return new Response(JSON.stringify({ error: "Team not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    const teamStaff = await assignStaffToTeam({
      teamId: params.id,
      staffId: data.staffId,
      role: data.role
    });
    return new Response(JSON.stringify(teamStaff), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error assigning staff to team:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to assign staff to team" }),
      {
        status: error.message === "Unauthorized" || error.message.includes("Forbidden") ? 401 : 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
const PUT = async ({ params, request }) => {
  try {
    await requireAdmin(request);
    const data = await request.json();
    if (!data.teamStaffId) {
      return new Response(JSON.stringify({ error: "Team staff ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const teamStaff = await updateTeamStaff(data.teamStaffId, {
      role: data.role
    });
    if (!teamStaff) {
      return new Response(JSON.stringify({ error: "Team staff assignment not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(teamStaff), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error updating team staff:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to update team staff" }),
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
    const url = new URL(request.url);
    const teamStaffId = url.searchParams.get("teamStaffId");
    if (!teamStaffId) {
      return new Response(JSON.stringify({ error: "Team staff ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const success = await removeStaffFromTeam(teamStaffId);
    if (!success) {
      return new Response(JSON.stringify({ error: "Failed to remove staff from team" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error removing staff from team:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to remove staff from team" }),
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
  POST,
  PUT,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
