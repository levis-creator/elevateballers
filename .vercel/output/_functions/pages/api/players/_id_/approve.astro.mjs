import { r as requireAdmin } from '../../../../chunks/auth_DQR-8pbN.mjs';
import { p as prisma } from '../../../../chunks/prisma_sB1uhqJV.mjs';
export { renderers } from '../../../../renderers.mjs';

const prerender = false;
const PATCH = async ({ params, request }) => {
  try {
    await requireAdmin(request);
    const { id } = params;
    const data = await request.json();
    if (!id) {
      return new Response(JSON.stringify({ error: "Player ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const player = await prisma.player.update({
      where: { id },
      data: {
        approved: data.approved ?? true
      }
    });
    return new Response(JSON.stringify(player), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error approving player:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to approve player" }),
      {
        status: error.message === "Unauthorized" || error.message === "Forbidden: Admin access required" ? 401 : 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  PATCH,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
