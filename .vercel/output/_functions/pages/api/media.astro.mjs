import { q as getMedia } from '../../chunks/queries_vvMOn9ut.mjs';
import { s as createMedia } from '../../chunks/mutations_CnOGsUyk.mjs';
import { r as requireAdmin } from '../../chunks/auth_DQR-8pbN.mjs';
export { renderers } from '../../renderers.mjs';

const prerender = false;
const GET = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get("type") || void 0;
    const mediaItems = await getMedia(type);
    return new Response(JSON.stringify(mediaItems), {
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
const POST = async ({ request }) => {
  try {
    await requireAdmin(request);
    const data = await request.json();
    if (!data.title || !data.url || !data.type) {
      return new Response(
        JSON.stringify({ error: "Title, URL, and type are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const mediaItem = await createMedia({
      title: data.title,
      url: data.url,
      type: data.type,
      thumbnail: data.thumbnail,
      tags: data.tags || []
    });
    return new Response(JSON.stringify(mediaItem), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error creating media:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to create media" }),
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
