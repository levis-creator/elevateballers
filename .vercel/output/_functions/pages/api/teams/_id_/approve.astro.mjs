import { r as requireAdmin } from '../../../../chunks/auth_CrN9ezVw.mjs';
import { p as prisma } from '../../../../chunks/prisma_Cvn-nyRW.mjs';
export { renderers } from '../../../../renderers.mjs';

const prerender = false;
const PATCH = async ({ params, request }) => {
  try {
    await requireAdmin(request);
    const { id } = params;
    const data = await request.json();
    if (!id) {
      return new Response(JSON.stringify({ error: "Team ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const team = await prisma.team.update({
      where: { id },
      data: {
        approved: data.approved ?? true
      }
    });
    return new Response(JSON.stringify(team), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error approving team:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to approve team" }),
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
