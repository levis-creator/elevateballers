import { p as getMediaById } from '../../../chunks/queries_vvMOn9ut.mjs';
import { p as updateMedia, q as deleteMedia } from '../../../chunks/mutations_CnOGsUyk.mjs';
import { r as requireAdmin } from '../../../chunks/auth_DQR-8pbN.mjs';
export { renderers } from '../../../renderers.mjs';

const prerender = false;
const GET = async ({ params }) => {
  try {
    const mediaItem = await getMediaById(params.id);
    if (!mediaItem) {
      return new Response(JSON.stringify({ error: "Media not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(mediaItem), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching media:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch media" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const PUT = async ({ params, request }) => {
  try {
    await requireAdmin(request);
    const data = await request.json();
    const mediaItem = await updateMedia(params.id, data);
    if (!mediaItem) {
      return new Response(JSON.stringify({ error: "Media not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(mediaItem), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error updating media:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to update media" }),
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
    const success = await deleteMedia(params.id);
    if (!success) {
      return new Response(JSON.stringify({ error: "Failed to delete media" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting media:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to delete media" }),
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
