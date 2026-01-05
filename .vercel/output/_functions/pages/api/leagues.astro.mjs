import { e as getLeagues } from '../../chunks/queries_vvMOn9ut.mjs';
import { f as createLeague } from '../../chunks/mutations_CnOGsUyk.mjs';
import { r as requireAdmin } from '../../chunks/auth_DQR-8pbN.mjs';
export { renderers } from '../../renderers.mjs';

const prerender = false;
const GET = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const activeOnly = url.searchParams.get("active") === "true";
    const leagues = await getLeagues(activeOnly);
    return new Response(JSON.stringify(leagues), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching leagues:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch leagues" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const POST = async ({ request }) => {
  try {
    await requireAdmin(request);
    const data = await request.json();
    if (!data.name) {
      return new Response(
        JSON.stringify({ error: "League name is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const league = await createLeague({
      name: data.name,
      slug: data.slug,
      description: data.description,
      logo: data.logo,
      season: data.season,
      startDate: data.startDate ? new Date(data.startDate) : void 0,
      endDate: data.endDate ? new Date(data.endDate) : void 0,
      active: data.active !== void 0 ? data.active : true
    });
    return new Response(JSON.stringify(league), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error creating league:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to create league" }),
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
