import { I as getTeams } from '../../chunks/queries_vvMOn9ut.mjs';
import { D as createTeam } from '../../chunks/mutations_CnOGsUyk.mjs';
import { r as requireAdmin } from '../../chunks/auth_DQR-8pbN.mjs';
import { p as prisma } from '../../chunks/prisma_sB1uhqJV.mjs';
export { renderers } from '../../renderers.mjs';

const prerender = false;
const GET = async ({ request }) => {
  const startTime = Date.now();
  try {
    console.log("[API /teams] GET request received at", (/* @__PURE__ */ new Date()).toISOString());
    console.log("[API /teams] Fetching teams from database...");
    let includeUnapproved = false;
    try {
      await requireAdmin(request);
      includeUnapproved = true;
    } catch {
      includeUnapproved = false;
    }
    const queryPromise = getTeams(includeUnapproved);
    const timeoutPromise = new Promise(
      (_, reject) => setTimeout(() => reject(new Error("Database query timeout after 5 seconds")), 5e3)
    );
    const teams = await Promise.race([queryPromise, timeoutPromise]);
    const duration = Date.now() - startTime;
    console.log(`[API /teams] Successfully fetched ${teams.length} teams in ${duration}ms`);
    console.log("[API /teams] Teams data:", teams);
    return new Response(JSON.stringify(teams), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache"
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[API /teams] Error after ${duration}ms:`, error);
    const errorMessage = error?.message || "Failed to fetch teams";
    console.error("[API /teams] Error details:", {
      message: errorMessage,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack
    });
    return new Response(JSON.stringify({
      error: errorMessage,
      details: process.env.NODE_ENV === "development" ? error?.stack : void 0
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache"
      }
    });
  }
};
const POST = async ({ request }) => {
  try {
    await requireAdmin(request);
    const data = await request.json();
    if (!data.name) {
      return new Response(JSON.stringify({ error: "Team name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const existing = await prisma.team.findUnique({
      where: { name: data.name },
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
    const team = await createTeam({
      name: data.name,
      logo: data.logo,
      description: data.description
    });
    return new Response(JSON.stringify(team), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error creating team:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to create team" }),
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
