import { D as getAllSiteSettings } from '../../chunks/queries_vvMOn9ut.mjs';
import { L as createSiteSetting } from '../../chunks/mutations_CnOGsUyk.mjs';
import { r as requireAdmin } from '../../chunks/auth_DQR-8pbN.mjs';
export { renderers } from '../../renderers.mjs';

const prerender = false;
const GET = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get("category") || void 0;
    const settings = await getAllSiteSettings(category || void 0);
    return new Response(JSON.stringify(settings), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch settings" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const POST = async ({ request }) => {
  try {
    await requireAdmin(request);
    const data = await request.json();
    if (!data.key || !data.value || !data.label) {
      return new Response(
        JSON.stringify({ error: "Key, value, and label are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const setting = await createSiteSetting({
      key: data.key,
      value: data.value,
      type: data.type || "text",
      label: data.label,
      description: data.description,
      category: data.category
    });
    return new Response(JSON.stringify(setting), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error creating setting:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to create setting" }),
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
