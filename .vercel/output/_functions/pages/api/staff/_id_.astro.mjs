import { E as getStaffById } from '../../../chunks/queries_vvMOn9ut.mjs';
import { M as updateStaff, N as deleteStaff } from '../../../chunks/mutations_CnOGsUyk.mjs';
import { r as requireAdmin } from '../../../chunks/auth_DQR-8pbN.mjs';
import '../../../chunks/prisma_sB1uhqJV.mjs';
export { renderers } from '../../../renderers.mjs';

const prerender = false;
const GET = async ({ params }) => {
  try {
    const staff = await getStaffById(params.id);
    if (!staff) {
      return new Response(JSON.stringify({ error: "Staff not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(staff), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching staff:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch staff" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const PUT = async ({ params, request }) => {
  try {
    await requireAdmin(request);
    const data = await request.json();
    const staff = await updateStaff(params.id, data);
    if (!staff) {
      return new Response(JSON.stringify({ error: "Staff not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(staff), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error updating staff:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to update staff" }),
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
    const success = await deleteStaff(params.id);
    if (!success) {
      return new Response(JSON.stringify({ error: "Failed to delete staff" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting staff:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to delete staff" }),
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
