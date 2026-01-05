import { C as getSiteSettingByKey } from '../../../chunks/queries_E6Jl_Myi.mjs';
import { J as updateSiteSetting, K as deleteSiteSetting } from '../../../chunks/mutations_BV82jF-A.mjs';
import { r as requireAdmin } from '../../../chunks/auth_CrN9ezVw.mjs';
export { renderers } from '../../../renderers.mjs';

const prerender = false;
const GET = async ({ params }) => {
  try {
    const setting = await getSiteSettingByKey(params.id);
    if (!setting) {
      return new Response(JSON.stringify({ error: "Setting not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(setting), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching setting:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch setting" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const PUT = async ({ params, request }) => {
  try {
    await requireAdmin(request);
    const data = await request.json();
    const setting = await updateSiteSetting(params.id, data);
    if (!setting) {
      return new Response(JSON.stringify({ error: "Setting not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(setting), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error updating setting:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to update setting" }),
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
    const success = await deleteSiteSetting(params.id);
    if (!success) {
      return new Response(JSON.stringify({ error: "Failed to delete setting" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting setting:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to delete setting" }),
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
